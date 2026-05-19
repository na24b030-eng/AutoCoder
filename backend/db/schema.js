const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'autocoder.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS generations (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt        TEXT    NOT NULL,
    status        TEXT    DEFAULT 'pending',
    blueprint     TEXT,
    db_code       TEXT,
    backend_code  TEXT,
    frontend_code TEXT,
    readme        TEXT,
    frontend_url  TEXT,
    backend_url   TEXT,
    github_url    TEXT,
    error         TEXT,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

module.exports = db;