const Database = require("better-sqlite3");
const { DATABASE_PATH } = require("../config/constants");

const db = new Database(DATABASE_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pseudo TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_seen TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        is_online INTEGER NOT NULL DEFAULT 0,
        messages_sent INTEGER NOT NULL DEFAULT 0,
        alerts_received INTEGER NOT NULL DEFAULT 0,
        video_sessions_started INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        pseudo TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        created_by TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS video_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        caller_pseudo TEXT NOT NULL,
        callee_pseudo TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'started',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ended_at TEXT
    );
`);



module.exports = {
    db
};