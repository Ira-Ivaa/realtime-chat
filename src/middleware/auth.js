import { verifyToken } from "../utils/jwt.js";

export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Доступ запрещен: токен не предоставлен",
    });
  }

  const token = authHeader.split(" ")[1];

  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({
      error: "Неверный или просроченный токен",
    });
  }
  req.user = payload;

  next();
};
