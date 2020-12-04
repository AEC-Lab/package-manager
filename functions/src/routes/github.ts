import express from "express";
import { processGithubAppAction } from "../controllers/github";

const router = express.Router();

router.route("/").post(processGithubAppAction);

export default router;
