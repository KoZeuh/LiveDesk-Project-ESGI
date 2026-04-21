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

const statements = {
    upsertUser: db.prepare(`
        INSERT INTO users (pseudo, is_online, last_seen)
        VALUES (@pseudo, 1, CURRENT_TIMESTAMP)
        ON CONFLICT(pseudo) DO UPDATE SET
        is_online = 1,
        last_seen = CURRENT_TIMESTAMP
    `),
    setOffline: db.prepare(`
        UPDATE users
        SET is_online = 0, last_seen = CURRENT_TIMESTAMP
        WHERE pseudo = ?
    `),
    getUser: db.prepare(`SELECT * FROM users WHERE pseudo = ?`),
    insertMessage: db.prepare(`
        INSERT INTO messages (user_id, pseudo, content)
        VALUES (?, ?, ?)
    `),
    incrementMessages: db.prepare(`
        UPDATE users
        SET messages_sent = messages_sent + 1, last_seen = CURRENT_TIMESTAMP
        WHERE pseudo = ?
    `),
    insertNotification: db.prepare(`
        INSERT INTO notifications (type, title, message, created_by)
        VALUES (?, ?, ?, ?)
    `),
    incrementAlertReceived: db.prepare(`
        UPDATE users
        SET alerts_received = alerts_received + 1, last_seen = CURRENT_TIMESTAMP
        WHERE pseudo = ?
    `),
    incrementVideoSessions: db.prepare(`
        UPDATE users
        SET video_sessions_started = video_sessions_started + 1, last_seen = CURRENT_TIMESTAMP
        WHERE pseudo = ?
    `),
    insertVideoSession: db.prepare(`
        INSERT INTO video_sessions (caller_pseudo, callee_pseudo, status)
        VALUES (?, ?, 'started')
    `),
    endVideoSession: db.prepare(`
        UPDATE video_sessions
        SET status = 'ended', ended_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `),
    recentMessages: db.prepare(`
        SELECT id, pseudo, content, created_at
        FROM messages
        ORDER BY id DESC
        LIMIT 50
    `),
    recentNotifications: db.prepare(`
        SELECT id, type, title, message, created_by, created_at
        FROM notifications
        ORDER BY id DESC
        LIMIT 20
    `),
    leaderboard: db.prepare(`
        SELECT pseudo, messages_sent, alerts_received, video_sessions_started,
        (messages_sent * 2 + alerts_received + video_sessions_started * 5) AS score,
        is_online
        FROM users
        ORDER BY score DESC, messages_sent DESC, pseudo ASC
        LIMIT 10
    `),
    totals: db.prepare(`
        SELECT
        (SELECT COUNT(*) FROM messages) AS totalMessages,
        (SELECT COUNT(*) FROM notifications) AS totalNotifications,
        (SELECT COUNT(*) FROM video_sessions) AS totalVideoSessions
    `),
    selectLastMessage: db.prepare(`
        SELECT id, pseudo, content, created_at
        FROM messages
        WHERE id = last_insert_rowid()
    `),
    selectNotificationById: db.prepare(`
        SELECT id, type, title, message, created_by, created_at
        FROM notifications
        WHERE id = ?
    `),
};

module.exports = {
    db,
    statements
};