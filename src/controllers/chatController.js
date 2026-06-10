import { messageService, chatsService } from "../services/chatsService.js";

export const sendMessage = (req, res) => {
  const { chatId } = req.params;
  const { text } = req.body;
  const userId = req.user.id;

  chatsService.isParticipant(chatId, userId, (err, member) => {
    if (err) return res.status(500).json({ error: "DB Error" });
    if (!member) return res.status(403).json({ error: "Not a chat member" });
    messageService.create(text, chatId, userId, function (err2) {
      if (err2) return res.status(500).json({ error: "DB Error" });
      messageService.getById(this.lastID, (err3, message) => {
        if (err3 || !message)
          return res.status(500).json({ error: "DB Error" });
        res.json(message);

        chatsService.getParticipantIds(chatId, (err4, rows) => {
          if (err4) return;
          const membersIds = rows.map((r) => r.user_id);

          const wss = req.app.get("wss");

          wss.clients.forEach((client) => {
            if (
              client.readyState === client.OPEN &&
              String(client.chatId) === String(chatId) &&
              membersIds.includes(client.userId)
            ) {
              client.send(
                JSON.stringify({ type: "new_message", chatId, message }),
              );
            }
          });
        });
      });
    });
  });
};

export const receiveMessages = (req, res) => {
  const { chatId } = req.params;
  const userId = req.user.id;

  chatsService.isParticipant(chatId, userId, (err, member) => {
    if (err) return res.status(500).json({ error: "DB Error" });
    if (!member) return res.status(403).json({ error: "Not a chat member" });

    messageService.getByChat(chatId, (err2, messages) => {
      if (err2) return res.status(500).json({ error: "DB Error" });
      res.json(messages);
    });
  });
};

export const deleteMessage = (req, res) => {
  const { chatId, messageId } = req.params;
  const userId = req.user.id;

  chatsService.isParticipant(chatId, userId, (err, member) => {
    if (err) return res.status(500).json({ error: "DB Error" });
    if (!member) return res.status(403).json({ error: "Not a chat member" });

    messageService.delete(messageId, userId, chatId, function (err2) {
      if (err2) return res.status(500).json({ error: "DB Error" });
      if (this.changes === 0)
        return res.status(404).json({ error: "Not found or not yours" });

      res.json({ ok: true, messageId });

      chatsService.getParticipantIds(chatId, (err3, rows) => {
        if (err3) return;
        const membersIds = rows.map((r) => r.user_id);

        const wss = req.app.get("wss");

        wss.clients.forEach((client) => {
          if (
            client.readyState === client.OPEN &&
            String(client.chatId) === String(chatId) &&
            membersIds.includes(client.userId)
          ) {
            client.send(
              JSON.stringify({
                type: "delete_message",
                chatId,
                messageId,
              }),
            );
          }
        });
      });
    });
  });
};

export const updateMessage = (req, res) => {
  const { messageId, chatId } = req.params;
  const { text } = req.body;
  const userId = req.user.id;

  chatsService.isParticipant(chatId, userId, (err, member) => {
    if (err) return res.status(500).json({ error: "DB Error" });
    if (!member) return res.status(403).json({ error: "Not a chat member" });
    messageService.update(text, messageId, userId, function (err2) {
      if (err2) return res.status(500).json({ error: "DB Error" });
      if (this.changes === 0)
        return res.status(404).json({ error: "Not found or not yours" });
      messageService.getById(messageId, (err3, message) => {
        if (err3 || !message)
          return res.status(500).json({ error: "DB Error" });
        res.json(message);

        chatsService.getParticipantIds(chatId, (err4, rows) => {
          if (err4) return;
          const membersIds = rows.map((r) => r.user_id);

          const wss = req.app.get("wss");

          wss.clients.forEach((client) => {
            if (
              client.readyState === client.OPEN &&
              String(client.chatId) === String(chatId) &&
              membersIds.includes(client.userId)
            ) {
              client.send(
                JSON.stringify({ type: "update_message", chatId, message }),
              );
            }
          });
        });
      });
    });
  });
};
