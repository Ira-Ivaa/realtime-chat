import bcrypt from "bcryptjs";
import db from "../config/db.js";
import { signToken } from "../utils/jwt.js";

export const register = (req, res) => {
  const { email, password, name } = req.body;

  const hashed = bcrypt.hashSync(password, 10);

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err) return res.status(500).json({ error: "DB ERROR" });
    if (user) return res.status(400).json({ error: "Email is already exists" });

    db.run(
      "INSERT INTO users (email, password, name) VALUES (?, ?, ?)",
      [email, hashed, name],
      function (error) {
        if (error) return res.status(500).json({ error: "DB ERROR" });

        const token = signToken({ id: this.lastID });
        res.status(201).json({
          token,
          user: { id: this.lastID, email, name },
        });
      },
    );
  });
};

export const login = (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err) return res.status(500).json({ error: "DB ERROR" });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Invalid data" });
    }

    const token = signToken({ id: user.id });

    res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  });
};

export const getMe = (req, res) => {
  db.get(
    "SELECT id, email, name FROM users WHERE id = ?",
    [req.user.id],
    (err, user) => {
      if (err) return res.status(500).json({ error: "DB Error" });
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json({ user });
    },
  );
};
