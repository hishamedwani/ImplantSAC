import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, JSON, String

from app.db.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class Case(Base):
    __tablename__ = "cases"

    # Identity
    id         = Column(String,   primary_key=True, default=generate_uuid)
    patient_id = Column(String,   nullable=False, default="anonymous")
    filename   = Column(String,   nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # CBCT spacing (mm)
    spacing_x = Column(Float, nullable=False)
    spacing_y = Column(Float, nullable=False)
    spacing_z = Column(Float, nullable=False)

    # Clinical measurements (mm)
    apical_bone_mm  = Column(Float,   nullable=False)
    buccal_wall_mm  = Column(Float,   nullable=False)
    ridge_width_mm  = Column(Float,   nullable=False)
    septum_width_mm = Column(Float,   nullable=True)
    lesion_detected = Column(Boolean, nullable=False)
    lesion_size_mm3 = Column(Float,   nullable=False)

    # Risk levels per factor
    apical_risk = Column(String, nullable=False)
    buccal_risk = Column(String, nullable=False)
    ridge_risk  = Column(String, nullable=False)
    septum_risk = Column(String, nullable=False)
    lesion_risk = Column(String, nullable=False)

    # SAC classification
    classification = Column(String, nullable=False)
    reasoning      = Column(JSON,   nullable=False)
    full_result    = Column(JSON,   nullable=False)

    # Clinician overrides
    clinician_notes         = Column(String, nullable=True)
    override_classification = Column(String, nullable=True)

    # File paths for MPR viewer
    cbct_path         = Column(String, nullable=True)
    segmentation_path = Column(String, nullable=True)

    # YOLO detection data
    yolo_z        = Column(Integer, nullable=True)
    yolo_cx       = Column(Integer, nullable=True)
    yolo_cy       = Column(Integer, nullable=True)
    yolo_conf     = Column(Float,   nullable=True)
    yolo_scanner  = Column(String,  nullable=True)
    yolo_is_molar = Column(Boolean, nullable=True)
    yolo_z_min    = Column(Integer, nullable=True)
    yolo_z_max    = Column(Integer, nullable=True)