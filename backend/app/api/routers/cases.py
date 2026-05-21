import os
import shutil
import uuid

import numpy as np
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.classification.sac_classifier import classify_sac
from app.core.cbct_loader import load_cbct
from app.db.database import get_db
from app.db.models import Case
from app.pipeline.measurements import compute_measurements
from app.pipeline.toothseg import determine_is_molar, run_toothseg
from app.pipeline.yolo_locator import locate_missing_tooth

router = APIRouter(tags=["cases"])

UPLOAD_DIR = "uploads"
SEG_DIR    = "segmentations"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(SEG_DIR,    exist_ok=True)

ALLOWED_EXTENSIONS = [".nii", ".nii.gz", ".mha"]


class CaseUpdate(BaseModel):
    clinician_notes:         str | None = None
    override_classification: str | None = None


@router.post("/upload")
async def upload_case(
    file:       UploadFile = File(...),
    patient_id: str        = Form(default="anonymous"),
    db:         Session    = Depends(get_db),
):
    """
    Run the full automated pipeline on an uploaded CBCT scan:
    CBCT → YOLO → ToothSeg → Measurements → SAC Classification
    Saves result to PostgreSQL and segmentation to disk for the MPR viewer.
    """
    fname = file.filename or ""
    if not any(fname.endswith(ext) for ext in ALLOWED_EXTENSIONS):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {fname}. Allowed: {ALLOWED_EXTENSIONS}",
        )

    case_id   = str(uuid.uuid4())
    cbct_path = os.path.join(UPLOAD_DIR, f"{case_id}_cbct_{file.filename}")

    with open(cbct_path, "wb") as f_out:
        shutil.copyfileobj(file.file, f_out)

    try:
        # Step 1: Load CBCT
        volume, spacing = load_cbct(cbct_path)

        # Step 2: YOLO — locate missing tooth
        yolo_result = locate_missing_tooth(volume=volume, spacing=spacing, device="cpu")
        z  = yolo_result["z"]
        cx = yolo_result["cx"]
        cy = yolo_result["cy"]

        # Step 3: Determine if molar from YOLO centroid x-position
        is_molar = determine_is_molar(cx, volume.shape[2])

        # Step 4: ToothSeg — segment crop around YOLO site
        segmentation = run_toothseg(volume=volume, spacing=spacing, z=z, cx=cx, cy=cy, window=50)

        # Step 5: Save segmentation to disk for MPR viewer
        seg_path = os.path.join(SEG_DIR, f"{case_id}_seg.npy")
        np.save(seg_path, segmentation)

        # Step 6: Compute clinical measurements
        measurements = compute_measurements(
            volume=volume,
            segmentation=segmentation,
            z=z,
            cx=cx,
            cy=cy,
            spacing=spacing,
            is_molar=is_molar,
        )

        # Step 7: SAC classification
        result  = classify_sac(measurements)
        factors = result["factors"]

        # Step 8: Persist to PostgreSQL
        case = Case(
            id                = case_id,
            patient_id        = patient_id,
            filename          = file.filename,
            spacing_x         = spacing[0],
            spacing_y         = spacing[1],
            spacing_z         = spacing[2],
            cbct_path         = cbct_path,
            segmentation_path = seg_path,
            yolo_z            = z,
            yolo_cx           = cx,
            yolo_cy           = cy,
            yolo_conf         = yolo_result["conf"],
            yolo_scanner      = yolo_result["scanner"],
            yolo_is_molar     = is_molar,
            yolo_z_min        = int(yolo_result["z_range"][0]),
            yolo_z_max        = int(yolo_result["z_range"][1]),
            apical_bone_mm    = factors["apical_bone"]["measurement_mm"],
            buccal_wall_mm    = factors["buccal_wall"]["measurement_mm"],
            ridge_width_mm    = factors["ridge_width"]["measurement_mm"],
            septum_width_mm   = factors["septum_width"]["measurement_mm"],
            lesion_detected   = factors["periapical_lesion"]["lesion_detected"],
            lesion_size_mm3   = factors["periapical_lesion"]["lesion_size_mm3"],
            apical_risk       = factors["apical_bone"]["risk"],
            buccal_risk       = factors["buccal_wall"]["risk"],
            ridge_risk        = factors["ridge_width"]["risk"],
            septum_risk       = factors["septum_width"]["risk"],
            lesion_risk       = factors["periapical_lesion"]["risk"],
            classification    = result["classification"],
            reasoning         = result["reasoning"],
            full_result       = result,
        )
        db.add(case)
        db.commit()
        db.refresh(case)

        return JSONResponse(content={
            "case_id":    case_id,
            "patient_id": patient_id,
            "yolo": {
                "z":        z,
                "cx":       cx,
                "cy":       cy,
                "conf":     yolo_result["conf"],
                "score":    yolo_result["score"],
                "z_range":  yolo_result["z_range"],
                "scanner":  yolo_result["scanner"],
                "is_molar": is_molar,
            },
            "result": result,
        })

    except AssertionError as e:
        raise HTTPException(status_code=422, detail=f"Pipeline assertion failed: {e}")
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {e}")


@router.get("/")
def get_all_cases(db: Session = Depends(get_db)):
    """Return a summary list of all cases ordered by most recent first."""
    cases = db.query(Case).order_by(Case.created_at.desc()).all()
    return [
        {
            "case_id":           c.id,
            "patient_id":        c.patient_id,
            "filename":          c.filename,
            "classification":    c.override_classification or c.classification,
            "ai_classification": c.classification,
            "is_overridden":     c.override_classification is not None and c.override_classification != c.classification,
            "created_at":        c.created_at.isoformat(),
        }
        for c in cases
    ]


@router.get("/{case_id}")
def get_case(case_id: str, db: Session = Depends(get_db)):
    """Retrieve full results for a specific case including YOLO and clinician data."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return {
        "case_id":                case.id,
        "patient_id":             case.patient_id,
        "clinician_notes":        case.clinician_notes,
        "override_classification": case.override_classification,
        "yolo": {
            "z":        case.yolo_z,
            "cx":       case.yolo_cx,
            "cy":       case.yolo_cy,
            "conf":     case.yolo_conf or 0,
            "score":    0,
            "z_range":  [case.yolo_z_min or 0, case.yolo_z_max or 0],
            "scanner":  case.yolo_scanner or "Unknown",
            "is_molar": case.yolo_is_molar or False,
        },
        "result": case.full_result,
    }


@router.patch("/{case_id}")
def update_case(case_id: str, update: CaseUpdate, db: Session = Depends(get_db)):
    """Update clinician notes and/or override classification for a case."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    if update.clinician_notes is not None:
        case.clinician_notes = update.clinician_notes
    if update.override_classification is not None:
        case.override_classification = update.override_classification
    db.commit()
    db.refresh(case)
    return {
        "case_id":                case.id,
        "clinician_notes":        case.clinician_notes,
        "override_classification": case.override_classification,
    }


@router.delete("/{case_id}")
def delete_case(case_id: str, db: Session = Depends(get_db)):
    """Delete a case and its associated files from disk and database."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    if case.cbct_path and os.path.exists(case.cbct_path):
        os.remove(case.cbct_path)
    if case.segmentation_path and os.path.exists(case.segmentation_path):
        os.remove(case.segmentation_path)

    db.delete(case)
    db.commit()
    return {"deleted": case_id}