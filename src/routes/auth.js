import express from "express";
import { register, login, getMe } from "../controllers/authController.js";
import { validate, schema } from "../middleware/validate.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// /api/auth/register
router.post("/register", validate(schema.register), register);

// /api/auth/login
router.post("/login", validate(schema.login), login);

router.get("/me", protect, getMe);

export default router;
