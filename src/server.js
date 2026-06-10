import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";

import { env } from "./config/env.js";

import authRoutes from "./routes/auth.js";
import chatsRoutes from "./routes/chats.js";
import messageRoutes from "./routes/message.js";

import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { verifyToken } from "./utils/jwt.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use("/api/auth", authRoutes);
app.use("/api/chats", chatsRoutes);
app.use("/api/message", messageRoutes);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  console.log(`Server has been started on http://localhost:${env.PORT}`);
  console.log(`API: http://localhost:${env.PORT}/api`);
});

const wss = new WebSocketServer({
  server,
  handleProtocols: (protocols) =>
    protocols.has("authorization") ? "authorization" : false,
  verifyClient: (info, done) => {
    const protocols = (info.req.headers["sec-websocket-protocol"] || "")
      .split(",")
      .map((s) => s.trim());
    const payload = verifyToken(protocols[1]);
    if (!payload) return done(false, 401, "Unauthorized");
    info.req.userId = payload.id;
    done(true);
  },
});
app.set("wss", wss);

wss.on("connection", (ws, req) => {
  ws.userId = req.userId;
  ws.chatId = null;

  console.log("Client connected, user", ws.userId);

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw);
      if (msg.type === "subscribe") ws.chatId = String(msg.chatId);
    } catch {}
  });

  ws.on("close", () => console.log("Client disconnected"));
});
