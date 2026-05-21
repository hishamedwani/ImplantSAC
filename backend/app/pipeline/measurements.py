import numpy as np
import scipy.ndimage as ndi


def extract_views(
    volume:       np.ndarray,
    segmentation: np.ndarray,
    z:            int,
    cx:           int,
    cy:           int,
) -> dict:
    """
    Extract three orthogonal 2D views at the YOLO-detected implant site.
    Volume and segmentation are in (z, y, x) axis ordering.
    """
    assert volume.shape == segmentation.shape, "Volume and segmentation shape mismatch"

    return {
        "axial":    {"img": volume[z, :, :],    "seg": segmentation[z, :, :]   },
        "coronal":  {"img": volume[:, cy, :],   "seg": segmentation[:, cy, :]  },
        "sagittal": {"img": volume[:, :, cx],   "seg": segmentation[:, :, cx]  },
    }


def measure_cortical_thickness(bone_row: np.ndarray, spacing_mm: float) -> float:
    """
    Measure the thickness of the outermost continuous bone layer from the edge.
    Capped at 5mm — maximum clinical cortical plate thickness.
    """
    indices = np.where(bone_row)[0]
    if len(indices) == 0:
        return 0.0

    count = 1
    for i in range(1, len(indices)):
        if indices[i] == indices[i - 1] + 1:
            count += 1
        else:
            break

    return float(round(min(count * spacing_mm, 5.0), 2))


def compute_measurements(
    volume:       np.ndarray,
    segmentation: np.ndarray,
    z:            int,
    cx:           int,
    cy:           int,
    spacing:      tuple,
    is_molar:     bool = False,
    local_window: int  = 60,
) -> dict:
    """
    Compute all 5 clinical measurements using three orthogonal views.

    Args:
        volume:       Full CBCT volume (z, y, x)
        segmentation: ToothSeg output same shape as volume
        z, cx, cy:    YOLO site coordinates
        spacing:      (sp_x, sp_y, sp_z) voxel spacing in mm
        is_molar:     True if molar site — enables septum measurement
        local_window: Half-window for local region extraction

    Returns:
        dict with measurement values for all 5 clinical factors
    """
    assert volume.shape == segmentation.shape, "Volume and segmentation shape mismatch"

    sp_x, sp_y, sp_z = spacing
    views   = extract_views(volume, segmentation, z, cx, cy)
    results = {}

    # ------------------------------------------------------------------
    # 1. APICAL BONE AVAILABILITY — Sagittal view
    # Clinical: vertical bone from socket apex to vital structure
    # (IAN canal, sinus floor, nasal floor)
    # Sample 5 columns around cy and take the maximum measurement
    # ------------------------------------------------------------------
    sag_img = views["sagittal"]["img"]
    y_total = sag_img.shape[1]
    y0      = max(0, cy - local_window // 2)
    y1      = min(y_total, cy + local_window // 2)

    max_scan    = min(150, volume.shape[0] - z - 1)
    best_apical = 0.0

    if max_scan > 0:
        sample_cols = [
            max(0, min(cy - 4, y_total - 1)),
            max(0, min(cy - 2, y_total - 1)),
            min(cy,     y_total - 1),
            max(0, min(cy + 2, y_total - 1)),
            max(0, min(cy + 4, y_total - 1)),
        ]

        for col_idx in sample_cols:
            col_hu  = sag_img[z:z + max_scan, col_idx].astype(np.float32)
            col_bone = col_hu > 200

            # Find socket end — first point where bone resumes after socket
            socket_end  = 0
            consecutive = 0
            for i, is_bone in enumerate(col_bone):
                if is_bone:
                    consecutive += 1
                    if consecutive >= 2:
                        socket_end = i - consecutive + 1
                        break
                else:
                    consecutive = 0

            # Measure continuous bone downward, stopping at vital structures
            bone_count  = 0
            prev_bone   = False
            gap_allowed = 2

            for i in range(socket_end, len(col_hu)):
                hu = col_hu[i]

                # Stop at sinus/nasal floor (very dense cortical barrier)
                if hu > 900 and i > socket_end + 2:
                    break

                # Stop at IAN canal (sudden low-density channel)
                if hu < 50 and prev_bone and i > socket_end + 5:
                    if i + 1 < len(col_hu) and col_hu[i + 1] < 100:
                        break

                if hu > 200:
                    bone_count += 1
                    prev_bone   = True
                    gap_allowed = 2
                else:
                    prev_bone = False
                    if gap_allowed > 0:
                        bone_count  += 1
                        gap_allowed -= 1
                    else:
                        break

            apical_mm = min(bone_count * sp_z, 20.0)
            if apical_mm > best_apical:
                best_apical = apical_mm

    results["apical_bone_mm"] = round(best_apical, 2)

    # ------------------------------------------------------------------
    # 2. BUCCAL WALL THICKNESS — Coronal view
    # Clinical: measured 1mm apical to crest at mid-facial
    # Try both sides of cx and take the thinner (buccal < lingual)
    # ------------------------------------------------------------------
    cor_img  = views["coronal"]["img"]
    cor_bone = cor_img > 200

    apical_offset = max(1, int(1.0 / sp_z))
    z_buccal      = min(z + apical_offset, cor_bone.shape[0] - 1)
    window_buccal = int(30.0 / sp_x)

    row_left  = cor_bone[z_buccal, max(0, cx - window_buccal):cx]
    row_right = cor_bone[z_buccal, cx:min(cor_bone.shape[1], cx + window_buccal)]

    thickness_left  = measure_cortical_thickness(row_left,        sp_x)
    thickness_right = measure_cortical_thickness(row_right[::-1], sp_x)

    if thickness_left > 0 and thickness_right > 0:
        buccal_mm = min(thickness_left, thickness_right)
    elif thickness_left > 0:
        buccal_mm = thickness_left
    elif thickness_right > 0:
        buccal_mm = thickness_right
    else:
        buccal_mm = 0.0

    results["buccal_wall_mm"] = float(round(buccal_mm, 2))

    # ------------------------------------------------------------------
    # 3. BUCCOLINGUAL RIDGE WIDTH — Coronal view
    # Clinical: total horizontal ridge width at crest level
    # Scan outward from cx to find outer bone edges on both sides
    # ------------------------------------------------------------------
    crest_z  = max(0, z - 3)
    row_full = (cor_img[crest_z, :] > 200).astype(np.uint8)

    left_outer = cx
    in_bone    = False
    for i in range(cx, max(0, cx - 80), -1):
        if row_full[i] == 1:
            in_bone    = True
            left_outer = i
        elif in_bone:
            break

    right_outer = cx
    in_bone     = False
    for i in range(cx, min(cor_img.shape[1], cx + 80)):
        if row_full[i] == 1:
            in_bone     = True
            right_outer = i
        elif in_bone:
            break

    results["ridge_width_mm"] = float(round(min((right_outer - left_outer) * sp_x, 12.0), 2))

    # ------------------------------------------------------------------
    # 4. INTERRADICULAR SEPTUM WIDTH — Axial view (molars only)
    # Clinical: minimum bone gap between roots at mid-height
    # ------------------------------------------------------------------
    if is_molar:
        ax_teeth         = (views["axial"]["seg"] == 1)
        labeled_ax, num_ax = ndi.label(ax_teeth)

        if num_ax >= 2:
            min_gap_mm = float("inf")
            for i in range(1, num_ax + 1):
                for j in range(i + 1, num_ax + 1):
                    coords_i = np.argwhere(labeled_ax == i)
                    coords_j = np.argwhere(labeled_ax == j)
                    i_x_max  = coords_i[:, 1].max()
                    j_x_min  = coords_j[:, 1].min()
                    i_y_max  = coords_i[:, 0].max()
                    j_y_min  = coords_j[:, 0].min()
                    gap_x    = max(0, j_x_min - i_x_max) * sp_x
                    gap_y    = max(0, j_y_min - i_y_max) * sp_y
                    gap      = min(gap_x, gap_y) if gap_x > 0 and gap_y > 0 else max(gap_x, gap_y)
                    if 0 < gap < min_gap_mm:
                        min_gap_mm = gap

            if min_gap_mm in (float("inf"), 0):
                # Roots touching — estimate from centroid distance
                centers = [np.argwhere(labeled_ax == i).mean(axis=0) for i in range(1, num_ax + 1)]
                centers = np.array(centers)
                dists   = [
                    np.linalg.norm((centers[i] - centers[j]) * np.array([sp_y, sp_x]))
                    for i in range(len(centers))
                    for j in range(i + 1, len(centers))
                ]
                min_gap_mm = float(min(dists)) * 0.3  # ~30% of centroid distance = bone septum

            results["septum_width_mm"] = float(round(min(min_gap_mm, 10.0), 2))

        else:
            # Single component — scan for internal gap
            teeth_cols = np.where(ax_teeth.any(axis=0))[0]
            if len(teeth_cols) >= 2:
                gaps = np.diff(teeth_cols)
                results["septum_width_mm"] = float(round(int(gaps.max()) * sp_x, 2)) if gaps.max() > 2 else 0.0
            else:
                results["septum_width_mm"] = 0.0
    else:
        results["septum_width_mm"] = None

    # ------------------------------------------------------------------
    # 5. PERIAPICAL LESION — Sagittal view
    # Clinical: largest linear dimension of radiolucency around apex
    # ------------------------------------------------------------------
    sag_bone_mask  = sag_img > 150
    local_z0       = max(0, z - local_window // 2)
    local_z1       = min(sag_img.shape[0], z + local_window // 2)

    sag_bone_local = np.zeros_like(sag_bone_mask)
    sag_bone_local[local_z0:local_z1, y0:y1] = sag_bone_mask[local_z0:local_z1, y0:y1]

    candidate    = (sag_img < 80) & ndi.binary_erosion(sag_bone_local, iterations=2)
    labeled, num = ndi.label(candidate)

    lesion_detected = False
    lesion_size_mm3 = 0.0

    if num > 0:
        largest_dim_mm = 0.0
        for i in range(1, num + 1):
            region = np.argwhere(labeled == i)
            if len(region) < 3:
                continue
            z_extent    = (region[:, 0].max() - region[:, 0].min() + 1) * sp_z
            y_extent    = (region[:, 1].max() - region[:, 1].min() + 1) * sp_y
            largest_dim = max(z_extent, y_extent)
            if largest_dim > largest_dim_mm:
                largest_dim_mm = largest_dim

        if largest_dim_mm >= 3.0:
            lesion_detected = True
            lesion_size_mm3 = float(round(largest_dim_mm, 2))

    results["lesion_detected"] = lesion_detected
    results["lesion_size_mm3"] = lesion_size_mm3

    return results