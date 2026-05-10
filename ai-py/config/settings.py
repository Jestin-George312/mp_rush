"""
APMS AI Engine — Settings & Configurable Thresholds
Loaded from .env and ai_config DB table.
"""
from pydantic_settings import BaseSettings
from config.database import query
import json

class Settings(BaseSettings):
    DB_USER: str = "postgres"
    DB_HOST: str = "localhost"
    DB_NAME: str = "mp_rush"
    DB_PASSWORD: str = "root"
    DB_PORT: int = 5432
    AI_PORT: int = 8000

    class Config:
        env_file = ".env"


settings = Settings()

# ── Default thresholds ─────────────────────────────────────
DEFAULTS = {
    "risk_thresholds": {"healthy": 25, "warning": 50, "at_risk": 75},
    "max_guide_load": {"default": 8, "hard_cap": 10},
    "auto_approve_rules": {"min_progress": 100, "min_docs_approved": 3, "all_tasks_done": True},
    "cron_intervals": {"risk_scoring": 360, "alerts": 480, "predictions": 1440},  # minutes
}

_config_cache: dict = {**DEFAULTS}


def load_config():
    """Load config from ai_config table into memory cache."""
    global _config_cache
    try:
        rows = query("SELECT key, value FROM ai_config")
        for row in rows:
            _config_cache[row["key"]] = row["value"] if isinstance(row["value"], dict) else json.loads(row["value"])
        print("[AI] Config loaded from database")
    except Exception:
        print("[AI] ai_config table not found, using defaults")


def get_risk_thresholds() -> dict:
    return _config_cache["risk_thresholds"]


def get_max_guide_load() -> dict:
    return _config_cache["max_guide_load"]


def get_auto_approve_rules() -> dict:
    return _config_cache["auto_approve_rules"]


def get_cron_intervals() -> dict:
    return _config_cache["cron_intervals"]


def get_all_config() -> dict:
    return {**_config_cache}


def update_config(key: str, value: dict):
    from config.database import execute
    execute(
        """INSERT INTO ai_config (key, value, updated_at) VALUES (%s, %s, NOW())
           ON CONFLICT (key) DO UPDATE SET value = %s, updated_at = NOW()""",
        (key, json.dumps(value), json.dumps(value)),
    )
    _config_cache[key] = value
