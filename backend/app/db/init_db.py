from app.db.database import Base, engine
from app.db import models  # noqa: F401 — imported to register models with SQLAlchemy


def init_db() -> None:
    """Create all tables in the database. Fails gracefully if DB is unreachable."""
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully.")
    except Exception as e:
        print(f"Warning: Could not connect to database on startup: {e}")
        print("The app will start but database operations will fail until connection is restored.")


if __name__ == "__main__":
    init_db()