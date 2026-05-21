import numpy as np
import scipy.ndimage as ndi


def extract_local_region(
    volume:       np.ndarray,
    segmentation: np.ndarray,
    site_xyz:     tuple[int, int, int],
    spacing:      tuple[float, float, float],
    window_mm:    float = 20.0,
) -> tuple[np.ndarray, np.ndarray, tuple]:
    """
    Extract a 3D window around the implant site using mm-based spacing.

    Args:
        volume:       Raw CBCT volume (HU values), shape (z, y, x)
        segmentation: ToothSeg output, same shape as volume
        site_xyz:     (z, x, y) voxel coordinate of implant site
        spacing:      (sx, sy, sz) voxel spacing in mm
        window_mm:    Half-window size in mm (default 20mm → 40mm total)

    Returns:
        local_volume: Cropped HU volume
        local_seg:    Cropped segmentation
        bounds:       ((z0,z1), (x0,x1), (y0,y1)) crop indices
    """
    assert volume.shape == segmentation.shape, \
        "Volume and segmentation must have the same shape"
    assert all(s > 0 for s in spacing), \
        "Spacing values must be positive"

    z, x, y    = site_xyz
    sx, sy, sz = spacing

    wz = int(round(window_mm / sz))
    wx = int(round(window_mm / sx))
    wy = int(round(window_mm / sy))

    z0, z1 = max(0, z - wz), min(volume.shape[0], z + wz)
    x0, x1 = max(0, x - wx), min(volume.shape[1], x + wx)
    y0, y1 = max(0, y - wy), min(volume.shape[2], y + wy)

    local_volume = volume[z0:z1, x0:x1, y0:y1]
    local_seg    = segmentation[z0:z1, x0:x1, y0:y1]

    assert local_volume.size > 0, \
        "Extracted region is empty — site_xyz may be out of bounds"

    return local_volume, local_seg, ((z0, z1), (x0, x1), (y0, y1))


def get_best_slice(segmentation: np.ndarray) -> int:
    """
    Find the axial slice with the most tooth voxels.

    Args:
        segmentation: Full 3D segmentation volume

    Returns:
        z index of the axial slice with most teeth
    """
    teeth_per_slice = (segmentation == 1).sum(axis=(1, 2))
    z = int(np.argmax(teeth_per_slice))
    assert teeth_per_slice[z] > 0, \
        "No teeth found in segmentation — check model output"
    return z


def get_missing_tooth_location(segmentation: np.ndarray) -> tuple[int, int, int]:
    """
    Estimate missing tooth location from the largest gap between tooth centroids.

    NOTE: Placeholder only — replaced by YOLO in the production pipeline.

    Args:
        segmentation: Full 3D segmentation volume

    Returns:
        (z, x, y) voxel coordinate of estimated implant site
    """
    z            = get_best_slice(segmentation)
    labeled, num = ndi.label(segmentation[z] == 1)

    assert num >= 2, "Need at least 2 tooth regions to detect a gap"

    centroids = np.array([
        np.argwhere(labeled == i).mean(axis=0)
        for i in range(1, num + 1)
    ])
    centroids = centroids[np.argsort(centroids[:, 1])]
    gap_idx   = int(np.argmax(np.linalg.norm(np.diff(centroids, axis=0), axis=1)))
    missing   = (centroids[gap_idx] + centroids[gap_idx + 1]) / 2

    return z, int(missing[0]), int(missing[1])