from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routers.auth import router as auth_router
from app.api.routers.cases import router as cases_router
from app.api.routers.viewer import router as viewer_router
from app.db.init_db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="ImplantSAC API",
    description="Automated dental implant SAC classification pipeline",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router,   prefix="/api/auth")
app.include_router(cases_router,  prefix="/api/cases")
app.include_router(viewer_router, prefix="/api/viewer")


@app.get("/")
def root():
    return {"status": "ImplantSAC API is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}