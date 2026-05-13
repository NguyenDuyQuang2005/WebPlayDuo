import express from "express";
import { protectedRoute } from "../middlewares/authmiddle.js";
import { getMySupportThread, postMySupportMessage } from "../Controllers/supportMessageController.js";

const router = express.Router();

router.get("/support", protectedRoute, getMySupportThread);
router.post("/support", protectedRoute, postMySupportMessage);

export default router;
