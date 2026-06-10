import db from "../config/db.js";
import { chatsService } from "../services/chatsService.js";

export const getChats = (req, res) => {
  const userId = req.user.id;

  chatsService.getAll(userId, (err, chats) => {
    if (err) return res.status(500).json({ error: "DB Error" });
    res.json(chats);
  });
};

export const createChat = (req, res) => {
  const { name } = req.body;
  const userId = req.user.id;

  chatsService.create(name, userId, function (err) {
    if (err) return res.status(500).json({ error: "DB Error" });

    const chatId = this.lastID;
    chatsService.addParticipant(chatId, userId, function (err2) {
      if (err2) return res.status(500).json({ error: "DB Error" });
      res.status(201).json({ id: chatId, name, user_id: userId });
    });
  });
};

export const updateChat = (req, res) => {
  const { name } = req.body;
  const { chatId } = req.params;
  const userId = req.user.id;

  chatsService.update(name, chatId, userId, function (err) {
    if (err) return res.status(500).json({ error: "DB Error" });
    if (this.changes === 0)
      return res.status(404).json({ error: "Not found or not yours" });

    res.status(200).json({ id: chatId, name });
  });
};

export const deleteChat = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  chatsService.delete(id, userId, function (err) {
    if (err) return res.status(500).json({ error: "DB Error" });
    if (this.changes === 0)
      return res.status(404).json({ error: "Not found or not yours" });
    res.json({ messages: "Chat deleted" });
  });
};

export const joinChat = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  chatsService.findById(id, function (err, chat) {
    if (err) return res.status(500).json({ error: "DB Error" });
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    chatsService.addParticipant(id, userId, function (err2) {
      if (err2) return res.status(500).json({ error: "DB Error" });
      res.json({ id: chat.id, name: chat.name });
    });
  });
};

export const inviteToChat = (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  const userId = req.user.id;

  chatsService.isParticipant(id, userId, function (err, member) {
    if (err) return res.status(500).json({ error: "DB Error" });
    if (!member) return res.status(403).json({ error: "Not chat member" });

    db.get("SELECT id FROM users WHERE email = ?", [email], (err2, user) => {
      if (err2) return res.status(500).json({ error: "DB Error" });
      if (!user) return res.status(404).json({ error: "USER not found" });

      chatsService.addParticipant(id, user.id, function (err3) {
        if (err3) return res.status(500).json({ error: "DB Error" });
        res.json({
          message: "User added",
          chat_id: Number(id),
          user_id: user.id,
        });
      });
    });
  });
};
