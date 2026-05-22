<div align="center">

<img src="https://img.shields.io/badge/ImplantSAC-Dental%20AI%20Platform-00B4D8?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnoiIGZpbGw9IndoaXRlIi8+PC9zdmc+" alt="ImplantSAC" />

# ImplantSAC

### Automated Dental Implant SAC Classification System

**Upload a CBCT scan → Get an SAC classification in minutes**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)

---

![ImplantSAC Dashboard](docs/screenshots/dashboard.png) 

---

</div>

## What is ImplantSAC?

ImplantSAC is a full-stack AI-powered dental implant planning tool. It analyzes CBCT (Cone Beam CT) scans and automatically computes the **ITI SAC classification** — Straightforward, Advanced, or Complex, to help clinicians assess implant difficulty before surgery.

No manual measurement. No guesswork. Upload a scan, get a clinically grounded result.

---

## Pipeline Overview

```
CBCT Scan (.nii / .nii.gz / .mha)
        │
        ▼
┌───────────────────┐
│   YOLO Detection  │  ← Localizes the missing tooth site
│   (YOLOv8)        │    Returns: z, cx, cy, confidence, scanner type
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  nnU-Net ToothSeg │  ← Segments 100×100×100 crop around site
│  (Dataset112)     │    Classes: Background, Teeth, Bone, Implant
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│   Measurements    │  ← 5 clinical factors computed from 3 orthogonal views
│   (HU + geometry) │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ SAC Classification│  ← ITI guidelines: any Red→Complex, any Yellow→Advanced
│ (ITI rules)       │    All Green → Straightforward
└────────┬──────────┘
         │
         ▼
   Clinician Review
   (Web Interface)
```

---

## Clinical Measurements

Five factors are computed automatically from the segmentation and HU values:

| Factor | View | Clinical Definition | Green | Yellow | Red |
|--------|------|---------------------|-------|--------|-----|
| **Apical Bone** | Sagittal | Vertical bone from socket apex to IAN/sinus | ≥ 4mm | 2–4mm | < 2mm |
| **Buccal Wall** | Coronal | Cortical plate thickness at 1mm apical to crest | ≥ 2mm | 1–2mm | < 1mm |
| **Ridge Width** | Coronal | Total horizontal ridge width at crest | ≥ 7mm | 5–7mm | < 5mm |
| **Septum Width** | Axial | Bone between roots — molars only | ≥ 3mm | 2–3mm | < 2mm |
| **Periapical Lesion** | Sagittal | Largest dimension of radiolucency at apex | Absent | ≤ 3mm | > 3mm |

---

## Screenshots & Demo

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)
> Shows total cases, SAC breakdown (Straightforward / Advanced / Complex), recent cases with delete and view actions.

---

### Upload Page
![Upload](docs/screenshots/upload.png)
> Drag-and-drop interface for `.nii`, `.nii.gz`, `.mha` CBCT scans. Optional patient ID field.

---

### Processing Page
![Processing](docs/screenshots/processing.png)
> Animated 5-stage progress indicator: Loading Scan → Detecting Site → Segmenting → Measuring → Classifying.

---

### Results Page
![Results](docs/screenshots/results.png)
> Full classification result with MPR viewer, factor pills, reasoning chain, detection details, and clinical disclaimer.

---

### MPR Viewer
![MPR Viewer](docs/screenshots/mpr_viewer.png)
> Interactive axial / coronal / sagittal viewer with segmentation overlay (cyan=teeth) and ⊕ Site jump button.

---

### History Page
![History](docs/screenshots/history.png)
> Filterable case list. Color-coded filter buttons. Overridden cases labeled with `✎ Overridden from X`.

---

### Case Detail
![Case Detail](docs/screenshots/case_detail1.png)
![Case Detail](docs/screenshots/case_detail2.png)
> Full case view with classification override (S/A/C), clinician notes, detection details, reasoning chain, and clinical disclaimer card.

---

### GIF Demo

![Demo GIF](docs/screenshots/ImplantSAC_gif1.gif)
![Demo GIF](docs/screenshots/ImplantSAC_gif2.gif)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Axios |
| **Backend** | FastAPI, Python 3.11, SQLAlchemy |
| **Database** | PostgreSQL (Railway) |
| **AI — Detection** | YOLOv8 (Ultralytics) |
| **AI — Segmentation** | nnU-Net v2, ToothFairy2 (Dataset112) |
| **CBCT Loading** | SimpleITK |
| **Slice Rendering** | Pillow (PIL) |
| **Auth** | JWT (python-jose), bcrypt |
| **Font** | Plus Jakarta Sans |

---

## Project Structure

```
ImplantSAC-/
├── backend/
│   ├── main.py                          # FastAPI entry point
│   ├── requirements.txt
│   └── app/
│       ├── api/routers/
│       │   ├── auth.py                  # Login endpoint
│       │   ├── cases.py                 # Pipeline + CRUD
│       │   └── viewer.py                # MPR slice rendering
│       ├── classification/
│       │   └── sac_classifier.py        # ITI SAC rules
│       ├── core/
│       │   ├── auth.py                  # JWT + bcrypt
│       │   └── cbct_loader.py           # SimpleITK loader
│       ├── db/
│       │   ├── database.py              # SQLAlchemy engine
│       │   ├── init_db.py               # Auto table creation
│       │   └── models.py                # Case ORM model
│       └── pipeline/
│           ├── measurements.py          # 5 clinical factors
│           ├── toothseg.py              # nnU-Net inference
│           └── yolo_locator.py          # YOLOv8 inference
├── evaluation/
│   └── toothseg_validation.ipynb        # Segmentation validation
└── frontend/
    └── src/
        ├── pages/                       # 9 pages
        ├── components/                  # Background, Sidebar, MPRViewer
        ├── api/client.ts                # Axios + typed API calls
        └── context/AuthContext.tsx      # JWT auth state
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL database (local or [Railway](https://railway.app))
- YOLO weights: `YOLO_best.pt`
- nnU-Net weights: Dataset112 (ToothFairy2)

---

### 1. Clone the repo

```bash
git clone https://github.com/hishamedwani/ImplantSAC-.git
cd ImplantSAC-
```

---

### 2. Backend setup

```bash
cd backend
pip install -r requirements.txt
```

Create `backend/.env`:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/dbname

# Auth
ADMIN_USERNAME=admin
ADMIN_PASSWORD=yourpassword
SECRET_KEY=your-secret-key

# YOLO weights
YOLO_WEIGHTS_PATH=/path/to/YOLO_best.pt

# nnU-Net / ToothSeg
TOOTHSEG_RESULTS=/path/to/nnunet_results
TOOTHSEG_RAW=/path/to/nnunet_raw
TOOTHSEG_PREPROCESSED=/path/to/nnunet_preprocessed
```

Start the backend:

```bash
uvicorn main:app --reload
```

API will be available at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

---

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

App will be available at `http://localhost:5173`.

---

### 4. Initialize the database

```bash
cd backend
python -c "
from app.db.database import engine
from app.db.models import Base
Base.metadata.create_all(bind=engine)
print('Tables created.')
"
```

---

## Supported File Formats

| Format | Extension |
|--------|-----------|
| NIfTI | `.nii`, `.nii.gz` |
| MetaImage | `.mha` |
| DICOM | directory |

---

## Supported Scanners

Automatically detected from volume dimensions and spacing:

| Scanner | Slices | Spacing |
|---------|--------|---------|
| Kavo | 430–460 | any |
| Newtom | 490–520 | any |
| Meyer | 300–340 | any |
| ToothFairy2 | 250–310 | ≤ 0.32mm |
| FullSkullNII | 220–300 | ≥ 0.38mm |
| Unknown | any | any |

---

## SAC Classification Logic

```
Per-factor risk:
  Apical Bone:    ≥4mm → Green  |  2-4mm → Yellow  |  <2mm → Red
  Buccal Wall:    ≥2mm → Green  |  1-2mm → Yellow  |  <1mm → Red
  Ridge Width:    ≥7mm → Green  |  5-7mm → Yellow  |  <5mm → Red
  Septum Width:   ≥3mm → Green  |  2-3mm → Yellow  |  <2mm → Red  (molars only)
  Lesion:         Absent → Green | ≤3mm → Yellow   |  >3mm → Red

Final SAC:
  Any Red    → Complex
  Any Yellow → Advanced
  All Green  → Straightforward
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Get JWT token |
| `POST` | `/api/cases/upload` | Upload CBCT + run pipeline |
| `GET` | `/api/cases/` | List all cases |
| `GET` | `/api/cases/{id}` | Get full case result |
| `PATCH` | `/api/cases/{id}` | Update notes / override classification |
| `DELETE` | `/api/cases/{id}` | Delete case + files |
| `GET` | `/api/viewer/{id}/volume-info` | Volume shape + YOLO coords |
| `GET` | `/api/viewer/{id}/slice` | PNG slice with segmentation overlay |


---

## Disclaimer

> ImplantSAC is a **clinical decision support tool**. All classifications are AI-generated suggestions. Final treatment decisions remain the sole responsibility of the treating clinician. This system does not replace professional clinical judgment.

---

<div align="center">

Built with ❤️ for dental AI research · 2026

</div>
