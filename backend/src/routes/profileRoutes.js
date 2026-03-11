import express from "express";
import {
    getProfile,
    getStoredProfile,
} from "../controllers/profileController.js";
import { optionalAuth } from "../middleware/optionalAuth.js";

const router = express.Router();

router.get("/", optionalAuth, getProfile);
router.get("/:puuid", getStoredProfile);

export default router;
