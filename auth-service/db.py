"""SQLite storage for monitoring users, login audit and service settings."""
import os
import secrets
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from typing import Iterator

import bcrypt

DB_PATH = os.environ.get("AUTH_DB_PATH", "/data/auth.db")
ROLES = ("admin", "viewer")

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('admin', 'viewer')),
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS login_attempts (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    success  INTEGER NOT NULL,
    ip       TEXT,
    at       TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_login_attempts_user_at ON login_attempts (username, at);

CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
"""

# Compared against when the user does not exist, so timing does not reveal valid usernames.
_DUMMY_HASH = bcrypt.hashpw(b"dummy-password", bcrypt.gensalt(12))


@contextmanager
def connect() -> Iterator[sqlite3.Connection]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init() -> None:
    os.makedirs(os.path.dirname(DB_PATH) or ".", exist_ok=True)
    with connect() as conn:
        conn.executescript(SCHEMA)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(12)).decode()


def get_user(username: str) -> sqlite3.Row | None:
    with connect() as conn:
        return conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()


def list_users() -> list[sqlite3.Row]:
    with connect() as conn:
        return conn.execute("SELECT id, username, role, created_at, last_login_at FROM users ORDER BY id").fetchall()


def count_users_by_role() -> dict[str, int]:
    with connect() as conn:
        rows = conn.execute("SELECT role, count(*) AS n FROM users GROUP BY role").fetchall()
    return {role: 0 for role in ROLES} | {r["role"]: r["n"] for r in rows}


def create_user(username: str, password: str, role: str) -> None:
    if role not in ROLES:
        raise ValueError(f"role must be one of {ROLES}")
    with connect() as conn:
        conn.execute(
            "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
            (username, hash_password(password), role),
        )


def set_password(username: str, password: str) -> bool:
    with connect() as conn:
        cur = conn.execute("UPDATE users SET password_hash = ? WHERE username = ?", (hash_password(password), username))
        return cur.rowcount > 0


def delete_user(username: str) -> bool:
    with connect() as conn:
        return conn.execute("DELETE FROM users WHERE username = ?", (username,)).rowcount > 0


def check_credentials(username: str, password: str) -> sqlite3.Row | None:
    user = get_user(username)
    stored = user["password_hash"].encode() if user else _DUMMY_HASH
    ok = bcrypt.checkpw(password.encode(), stored)
    return user if user and ok else None


def recent_failures(username: str, window: timedelta) -> int:
    since = (datetime.now(timezone.utc) - window).strftime("%Y-%m-%d %H:%M:%S")
    with connect() as conn:
        return conn.execute(
            "SELECT count(*) FROM login_attempts WHERE username = ? AND success = 0 AND at >= ?",
            (username, since),
        ).fetchone()[0]


def record_login(username: str, success: bool, ip: str | None) -> None:
    with connect() as conn:
        conn.execute("INSERT INTO login_attempts (username, success, ip) VALUES (?, ?, ?)", (username, int(success), ip))
        if success:
            conn.execute("UPDATE users SET last_login_at = datetime('now') WHERE username = ?", (username,))


def get_or_create_secret() -> str:
    """JWT signing key: AUTH_SECRET if given, otherwise generated once and kept in SQLite."""
    if env_secret := os.environ.get("AUTH_SECRET"):
        return env_secret
    with connect() as conn:
        row = conn.execute("SELECT value FROM settings WHERE key = 'jwt_secret'").fetchone()
        if row:
            return row["value"]
        secret = secrets.token_urlsafe(48)
        conn.execute("INSERT INTO settings (key, value) VALUES ('jwt_secret', ?)", (secret,))
        return secret
