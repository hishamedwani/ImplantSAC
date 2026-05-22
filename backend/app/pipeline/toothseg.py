import os
import tempfile
import shutil
import subprocess
import sys
import uuid
from pathlib import Path

import numpy as np
import SimpleITK as sitk
from dotenv import load_dotenv

load_dotenv()


def _get_env(key: str) -> str:
    """Read a required environment variable or raise a clear error."""
    val = os.getenv(key)
    if not val:
        raise EnvironmentError(
            f"Environment variable '{key}' is not set. "
            f"Add it to your .env file."
        )
    return val


def run_toothseg(
    volume:  np.ndarray,
    spacing: tuple[float, float, float],
    z:       int,
    cx:      int,
    cy:      int,
    window:  int = 50,
) -> np.ndarray:
    """
    Run ToothSeg (nnU-Net) on a cropped 3D sub-volume around the YOLO site.

    Args:
        volume:  Full CBCT volume (z, y, x)
        spacing: (sx, sy, sz) voxel spacing in mm
        z:       YOLO best axial slice index
        cx:      YOLO centroid column (x-axis)
        cy:      YOLO centroid row (y-axis)
        window:  Half-window size in voxels (default 50 → 100-voxel crop)

    Returns:
        segmentation: 3D numpy array same shape as volume.
                      Classes: 0=background, 1=teeth, 2=bone, 3=implant.
                      Only the cropped region is filled; rest is 0.
    """
    results_dir      = _get_env("TOOTHSEG_RESULTS")
    raw_dir          = _get_env("TOOTHSEG_RAW")
    preprocessed_dir = _get_env("TOOTHSEG_PREPROCESSED")

    env = os.environ.copy()
    env["nnUNet_results"]       = results_dir
    env["nnUNet_raw"]           = raw_dir
    env["nnUNet_preprocessed"]  = preprocessed_dir
    env["CUDA_VISIBLE_DEVICES"] = ""  # Force CPU inference

    # Resolve nnUNetv2_predict from the active virtual environment
    venv_scripts = str(Path(sys.executable).parent)
    predict_cmd  = str(Path(venv_scripts) / "nnUNetv2_predict.exe")
    if not Path(predict_cmd).exists():
        predict_cmd = "nnUNetv2_predict"

    # Unique temp dirs per run to avoid collisions
    run_id     = str(uuid.uuid4())[:6]
    
    tmp_base   = Path(tempfile.gettempdir())
    input_dir  = tmp_base / f"is_in_{run_id}"
    output_dir = tmp_base / f"is_out_{run_id}"
    input_dir.mkdir(parents=True, exist_ok=True)
    output_dir.mkdir(parents=True, exist_ok=True)

    try:
        # Compute crop bounds
        nz, ny, nx = volume.shape
        z0 = max(0, z  - window);  z1 = min(nz, z  + window)
        y0 = max(0, cy - window);  y1 = min(ny, cy + window)
        x0 = max(0, cx - window);  x1 = min(nx, cx + window)

        crop = volume[z0:z1, y0:y1, x0:x1].astype(np.int16)

        assert crop.size > 0, \
            f"Crop is empty. Check YOLO site coordinates: z={z}, cx={cx}, cy={cy}"

        # Write crop as nnU-Net input
        crop_img = sitk.GetImageFromArray(crop)
        crop_img.SetSpacing((float(spacing[0]), float(spacing[1]), float(spacing[2])))
        sitk.WriteImage(crop_img, str(input_dir / "crop_0000.mha"))

        # Run nnU-Net inference
        result = subprocess.run(
            [
                predict_cmd,
                "-i", str(input_dir),
                "-o", str(output_dir),
                "-d", "112",
                "-c", "3d_fullres",
                "-f", "0",
                "-chk", "checkpoint_best.pth",
                "-device", "cpu",
            ],
            capture_output=True,
            text=True,
            env=env,
        )

        if result.returncode != 0:
            raise RuntimeError(f"ToothSeg inference failed:\n{result.stderr[-500:]}")

        # Load segmentation output
        pred_path = output_dir / "crop.mha"
        if not pred_path.exists():
            raise FileNotFoundError(
                f"ToothSeg output not found at {pred_path}. "
                f"Files in output dir: {list(output_dir.iterdir())}"
            )

        pred_crop = sitk.GetArrayFromImage(sitk.ReadImage(str(pred_path))).astype(np.uint8)

        assert pred_crop.shape == crop.shape, \
            f"Segmentation shape {pred_crop.shape} != crop shape {crop.shape}"

        # Place crop segmentation back into full-volume coordinate space
        segmentation = np.zeros_like(volume, dtype=np.uint8)
        segmentation[z0:z1, y0:y1, x0:x1] = pred_crop

        return segmentation

    finally:
        shutil.rmtree(str(input_dir),  ignore_errors=True)
        shutil.rmtree(str(output_dir), ignore_errors=True)


def determine_is_molar(cx: int, img_width: int) -> bool:
    """
    Determine if the implant site is a molar based on YOLO centroid x position.
    Molars occupy the outer 25% on each side of the arch.
    Anterior teeth are near the center.

    Args:
        cx:        YOLO centroid column in pixel coordinates
        img_width: Width of the axial image in pixels

    Returns:
        True if molar, False if anterior
    """
    relative_x = cx / img_width
    return relative_x < 0.25 or relative_x > 0.75