from fastapi import APIRouter

router = APIRouter(tags=["system"])


@router.get("/health")
def health_check() -> dict[str, str]:
    """Simple health endpoint for uptime checks."""
    return {"status": "ok"}


@router.get("/api/info")
def service_info() -> dict[str, str]:
    """
    Expose basic metadata for the frontend to consume.

    Separated from the health endpoint to keep user-facing info under the same /api namespace.
    """
    return {"service": "eywa-backend", "version": "0.1.0"}

