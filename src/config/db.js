import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";
import { env } from "./env.js";

const dbDir = path.dirname(env.DB_PATH);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(env.DB_PATH, (err) => {
  if (err) console.error("DB Error:", err);
  else console.log("DB Connected:", env.DB_PATH);
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      user_id INTEGER,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT,
      chat_id INTEGER,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    `);

  db.run(`
    CREATE TABLE IF NOT EXISTS chat_participants (
      chat_id INTEGER, 
      user_id INTEGER,
      FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

  db.run(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_participants
      ON chat_participants (chat_id, user_id)
    `);

  db.run(`
    INSERT OR IGNORE INTO chat_participants (chat_id, user_id)
    SELECT id, user_id FROM chats WHERE user_id IS NOT NULL
    `);
});

export default db;
