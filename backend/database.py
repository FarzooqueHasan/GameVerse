import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "gameverse.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS characters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            role TEXT NOT NULL,        -- Management / Participant / Judge
            traits TEXT NOT NULL,      -- JSON list of keyword tags (legacy, kept for flavor text)
            catchphrase TEXT,
            description TEXT,
            superpower TEXT,
            stress_response TEXT,
            sidekick TEXT,
            hangout TEXT,
            energy_style TEXT,
            competition_style TEXT,
            drive TEXT,
            emoji TEXT,
            needs_review INTEGER DEFAULT 0  -- 1 = placeholder data, needs your confirmation
        )
    """)
    conn.commit()
    conn.close()
