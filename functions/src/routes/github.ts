import express from "express";
import { addWebhookPayloadToQueue } from "../controllers/github";

const router = express.Router();

router.route("/").post(addWebhookPayloadToQueue);

export default router;
