import dotenv from "dotenv";
dotenv.config();

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is required");

export const env = {
  PORT: process.env.PORT || 3000,
  DB_PATH: process.env.DB_PATH || "./database/chats.db",
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
};
