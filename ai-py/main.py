"""
APMS AI Engine — FastAPI Entry Point

Standalone AI microservice that connects to the same PostgreSQL database
as the Node.js backend. Runs on port 8000 by default.

Start: uvicorn main:app --reload --port 8000
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.settings import settings, load_config
from routes.ai_routes import router
from scheduler.cron import init_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup & shutdown events."""
    # Startup
    load_config()
    init_scheduler()
    print(f"[AI] APMS AI Engine running on http://localhost:{settings.AI_PORT}")
    yield
    # Shutdown
    stop_scheduler()


app = FastAPI(
    title="APMS AI Engine",
    description="Intelligent academic project monitoring — risk scoring, alerts, allocation, analytics",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow the frontend and backend to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all AI routes
app.include_router(router)


# Health check
@app.get("/health", tags=["System"])
def health_check():
    from config.database import query
    try:
        rows = query("SELECT NOW() AS db_time")
        return {"status": "UP", "service": "APMS AI Engine", "database_time": str(rows[0]["db_time"])}
    except Exception as e:
        return {"status": "DOWN", "error": str(e)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.AI_PORT, reload=True)
