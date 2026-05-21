from typing import Optional


# ------------------------------------------------------------------
# Per-factor threshold classifiers — based on ITI SAC guidelines
# ------------------------------------------------------------------

def classify_apical_bone(apical_mm: float) -> str:
    """
    Green:  >= 4mm
    Yellow: 2–4mm
    Red:    < 2mm
    """
    if apical_mm >= 4.0:   return "Green"
    if apical_mm >= 2.0:   return "Yellow"
    return "Red"


def classify_buccal_wall(buccal_mm: float) -> str:
    """
    Green:  >= 2mm
    Yellow: 1–2mm
    Red:    < 1mm
    """
    if buccal_mm >= 2.0:   return "Green"
    if buccal_mm >= 1.0:   return "Yellow"
    return "Red"


def classify_ridge_width(ridge_mm: float) -> str:
    """
    Green:  >= 7mm
    Yellow: 5–7mm
    Red:    < 5mm
    """
    if ridge_mm >= 7.0:    return "Green"
    if ridge_mm >= 5.0:    return "Yellow"
    return "Red"


def classify_septum(septum_mm: Optional[float]) -> str:
    """
    Molars only.
    Green:  >= 3mm
    Yellow: 2–3mm
    Red:    < 2mm or absent
    N/A:    not a molar
    """
    if septum_mm is None:  return "N/A"
    if septum_mm >= 3.0:   return "Green"
    if septum_mm >= 2.0:   return "Yellow"
    return "Red"


def classify_lesion(lesion_detected: bool, lesion_size_mm3: float) -> str:
    """
    Green:  No lesion
    Yellow: Lesion <= 3mm largest dimension
    Red:    Lesion > 3mm
    """
    if not lesion_detected:        return "Green"
    if lesion_size_mm3 <= 3.0:     return "Yellow"
    return "Red"


# ------------------------------------------------------------------
# Final SAC aggregation — ITI rules:
#   Any Red    → Complex
#   Any Yellow → Advanced
#   All Green  → Straightforward
# ------------------------------------------------------------------

def final_sac(risk_colors: list[str]) -> str:
    """Aggregate per-factor risks into a final SAC classification."""
    valid = [c for c in risk_colors if c != "N/A"]
    if "Red"    in valid: return "Complex"
    if "Yellow" in valid: return "Advanced"
    return "Straightforward"


# ------------------------------------------------------------------
# Main entry point
# ------------------------------------------------------------------

def classify_sac(measurements: dict) -> dict:
    """
    Classify an implant site using ITI SAC criteria.

    Args:
        measurements: Output dict from compute_measurements()

    Returns:
        Full result dict with per-factor risks, classification,
        reasoning chain, and clinical disclaimer.
    """
    apical_mm       = measurements["apical_bone_mm"]
    buccal_mm       = measurements["buccal_wall_mm"]
    ridge_mm        = measurements["ridge_width_mm"]
    septum_mm       = measurements.get("septum_width_mm")
    lesion_detected = measurements["lesion_detected"]
    lesion_size_mm3 = measurements["lesion_size_mm3"]

    apical_risk = classify_apical_bone(apical_mm)
    buccal_risk = classify_buccal_wall(buccal_mm)
    ridge_risk  = classify_ridge_width(ridge_mm)
    septum_risk = classify_septum(septum_mm)
    lesion_risk = classify_lesion(lesion_detected, lesion_size_mm3)

    all_risks = [apical_risk, buccal_risk, ridge_risk, lesion_risk]
    if septum_risk != "N/A":
        all_risks.append(septum_risk)

    classification = final_sac(all_risks)

    reasoning = [
        f"Apical Bone: {apical_mm}mm → {apical_risk} (threshold: ≥4mm Green, 2-4mm Yellow, <2mm Red)",
        f"Buccal Wall: {buccal_mm}mm → {buccal_risk} (threshold: ≥2mm Green, 1-2mm Yellow, <1mm Red)",
        f"Ridge Width: {ridge_mm}mm → {ridge_risk} (threshold: ≥7mm Green, 5-7mm Yellow, <5mm Red)",
    ]
    if septum_risk != "N/A":
        reasoning.append(
            f"Interradicular Septum: {septum_mm}mm → {septum_risk} (threshold: ≥3mm Green, 2-3mm Yellow, <2mm Red)"
        )
    reasoning.append(
        f"Periapical Lesion: {'Present' if lesion_detected else 'Absent'} ({lesion_size_mm3}mm³) → {lesion_risk}"
    )
    reasoning.append(f"Final SAC Classification: {classification}")

    return {
        "factors": {
            "apical_bone": {
                "measurement_mm": apical_mm,
                "risk":           apical_risk,
            },
            "buccal_wall": {
                "measurement_mm": buccal_mm,
                "risk":           buccal_risk,
            },
            "ridge_width": {
                "measurement_mm": ridge_mm,
                "risk":           ridge_risk,
            },
            "septum_width": {
                "measurement_mm": septum_mm,
                "risk":           septum_risk,
            },
            "periapical_lesion": {
                "lesion_detected": lesion_detected,
                "lesion_size_mm3": lesion_size_mm3,
                "risk":            lesion_risk,
            },
        },
        "classification": classification,
        "reasoning":      reasoning,
        "disclaimer": (
            "This classification is a clinical decision support tool. "
            "Final treatment decisions remain the responsibility of the treating clinician."
        ),
    }