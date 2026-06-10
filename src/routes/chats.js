import express from "express";
import { validate, schema } from "../middleware/validate.js";
import { protect } from "../middleware/auth.js";
import {
  getChats,
  createChat,
  deleteChat,
  joinChat,
  inviteToChat,
  updateChat,
} from "../controllers/chatsController.js";

const router = express.Router();
router.use(protect);

router.get("/", getChats);
router.post("/", validate(schema.chat), createChat);
router.patch("/:chatId/update", validate(schema.chat), updateChat);
router.delete("/:id/delete", deleteChat);

router.post("/:id/join", joinChat);
router.post("/:id/invite", validate(schema.invite), inviteToChat);

export default router;
