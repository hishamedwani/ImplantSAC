import os

import numpy as np
import SimpleITK as sitk


def load_cbct(file_path: str) -> tuple[np.ndarray, tuple[float, float, float]]:
    """
    Load a CBCT scan from .nii, .nii.gz, .mha, or DICOM directory.

    Returns:
        volume:  3D numpy array with shape (z, y, x)
        spacing: (sx, sy, sz) voxel spacing in mm
    """
    if os.path.isdir(file_path):
        return _load_dicom(file_path)
    return _load_sitk(file_path)


def _load_sitk(file_path: str) -> tuple[np.ndarray, tuple[float, float, float]]:
    """Load any file format supported by SimpleITK (.nii, .nii.gz, .mha)."""
    img     = sitk.ReadImage(file_path)
    volume  = sitk.GetArrayFromImage(img).astype(np.float32)
    sp      = img.GetSpacing()  # SimpleITK returns (x, y, z)
    spacing = (float(sp[0]), float(sp[1]), float(sp[2]))

    assert all(s > 0 for s in spacing), f"Invalid spacing values in {file_path}"
    assert len(volume.shape) == 3,       f"Expected 3D volume, got shape {volume.shape}"

    return volume, spacing


def _load_dicom(folder_path: str) -> tuple[np.ndarray, tuple[float, float, float]]:
    """Load a DICOM series from a directory."""
    reader      = sitk.ImageSeriesReader()
    dicom_names = reader.GetGDCMSeriesFileNames(folder_path)

    if not dicom_names:
        raise ValueError(f"No DICOM files found in directory: {folder_path}")

    reader.SetFileNames(dicom_names)
    img     = reader.Execute()
    volume  = sitk.GetArrayFromImage(img).astype(np.float32)
    sp      = img.GetSpacing()
    spacing = (float(sp[0]), float(sp[1]), float(sp[2]))

    assert all(s > 0 for s in spacing), "Invalid spacing values in DICOM files"

    return volume, spacing