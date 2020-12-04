import express from "express";
import { validatePackageSchema } from "../controllers/validate";

const router = express.Router();

router.route("/").post(validatePackageSchema);

export default router;
