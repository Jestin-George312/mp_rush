"""
APMS AI Engine — Database Connection Pool
Connects to the same PostgreSQL database as the Node.js backend.
"""
import os
import psycopg2
from psycopg2 import pool as pg_pool
from dotenv import load_dotenv

load_dotenv()

_pool = None

# Read DB config directly from env to avoid circular import with settings
_DB_USER = os.getenv("DB_USER", "postgres")
_DB_PASSWORD = os.getenv("DB_PASSWORD", "root")
_DB_HOST = os.getenv("DB_HOST", "localhost")
_DB_PORT = int(os.getenv("DB_PORT", "5432"))
_DB_NAME = os.getenv("DB_NAME", "mp_rush")


def get_pool():
    global _pool
    if _pool is None:
        _pool = pg_pool.ThreadedConnectionPool(
            minconn=2,
            maxconn=10,
            user=_DB_USER,
            password=_DB_PASSWORD,
            host=_DB_HOST,
            port=_DB_PORT,
            database=_DB_NAME,
        )
    return _pool


def get_conn():
    """Get a connection from the pool."""
    return get_pool().getconn()


def put_conn(conn):
    """Return a connection to the pool."""
    get_pool().putconn(conn)


def query(sql: str, params=None):
    """Execute a query and return all rows."""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            if cur.description:
                columns = [desc[0] for desc in cur.description]
                return [dict(zip(columns, row)) for row in cur.fetchall()]
            return []
    finally:
        conn.rollback()  # read-only safety
        put_conn(conn)


def execute(sql: str, params=None):
    """Execute a write query (INSERT/UPDATE/DELETE) and return affected rows."""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            conn.commit()
            if cur.description:
                columns = [desc[0] for desc in cur.description]
                return [dict(zip(columns, row)) for row in cur.fetchall()]
            return []
    except Exception:
        conn.rollback()
        raise
    finally:
        put_conn(conn)


def execute_count(sql: str, params=None) -> int:
    """Execute a write query and return the number of affected rows."""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            conn.commit()
            return cur.rowcount
    except Exception:
        conn.rollback()
        raise
    finally:
        put_conn(conn)
