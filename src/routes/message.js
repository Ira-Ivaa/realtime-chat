import express from "express";
import { validate, schema } from "../middleware/validate.js";
import { protect } from "../middleware/auth.js";
import {
  sendMessage,
  receiveMessages,
  deleteMessage,
  updateMessage,
} from "../controllers/chatController.js";

const router = express.Router();

router.use(protect);

router.post("/:chatId/send", validate(schema.message), sendMessage);
router.get("/:chatId/receive", receiveMessages);

router.patch(
  "/:chatId/:messageId/update",
  validate(schema.message),
  updateMessage,
);
router.delete("/:chatId/:messageId/delete", deleteMessage);

export default router;
