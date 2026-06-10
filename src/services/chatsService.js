import db from "../config/db.js";

export const chatsService = {
  getAll: (userId, callback) => {
    db.all(
      "SELECT c.* FROM chats c JOIN chat_participants p ON p.chat_id = c.id WHERE p.user_id = ? ORDER BY c.id",
      [userId],
      callback,
    );
  },

  findById: (id, callback) => {
    db.get("SELECT * FROM chats WHERE id = ?", [id], callback);
  },

  create: (name, userId, callback) => {
    db.run(
      "INSERT INTO chats (name, user_id) VALUES (?, ?)",
      [name, userId],
      callback,
    );
  },

  delete: (id, userId, callback) => {
    db.run(
      "DELETE FROM chats WHERE id = ? AND user_id = ?",
      [id, userId],
      callback,
    );
  },

  update: (name, chatId, userId, callback) => {
    db.run(
      "UPDATE chats SET name = ? WHERE id = ? AND user_id = ?",
      [name, chatId, userId],
      callback,
    );
  },

  addParticipant: (chatId, userId, callback) => {
    db.run(
      "INSERT OR IGNORE INTO chat_participants (chat_id, user_id) VALUES (?,?)",
      [chatId, userId],
      callback,
    );
  },

  isParticipant: (chatId, userId, callback) => {
    db.get(
      "SELECT 1 FROM chat_participants WHERE chat_id = ? AND user_id = ?",
      [chatId, userId],
      callback,
    );
  },

  getParticipantIds: (chatId, callback) => {
    db.all(
      "SELECT user_id FROM chat_participants WHERE chat_id = ?",
      [chatId],
      callback,
    );
  },
};

export const messageService = {
  create: (text, chatId, userId, callback) => {
    db.run(
      "INSERT INTO messages (text, chat_id, user_id) VALUES (?, ?, ?)",
      [text, chatId, userId],
      callback,
    );
  },
  delete: (id, userId, chatId, callback) => {
    db.run(
      "DELETE FROM messages WHERE id = ? AND user_id = ?  AND chat_id = ?",
      [id, userId, chatId],
      callback,
    );
  },
  update: (text, messageId, userId, callback) => {
    db.run(
      "UPDATE messages SET text = ? WHERE id = ? AND user_id = ?",
      [text, messageId, userId],
      callback,
    );
  },
  getByChat: (chatId, callback) => {
    db.all(
      "SELECT m.id, m.text, m.chat_id, m.user_id, m.created_at, u.name AS author_name FROM messages m JOIN users u ON u.id = m.user_id WHERE m.chat_id = ? ORDER BY m.created_at",
      [chatId],
      callback,
    );
  },
  getById: (id, callback) => {
    db.get(
      "SELECT m.id, m.text, m.chat_id, m.user_id, m.created_at, u.name AS author_name FROM messages m JOIN users u ON u.id = m.user_id WHERE m.id = ?",
      [id],
      callback,
    );
  },
};
