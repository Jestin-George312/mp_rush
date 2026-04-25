"""
APMS AI Engine — Database Connection Pool
Connects to the same PostgreSQL database as the Node.js backend.
"""
import psycopg2
from psycopg2 import pool as pg_pool
from config.settings import settings

_pool = None


def get_pool():
    global _pool
    if _pool is None:
        _pool = pg_pool.ThreadedConnectionPool(
            minconn=2,
            maxconn=10,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            host=settings.DB_HOST,
            port=settings.DB_PORT,
            database=settings.DB_NAME,
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
