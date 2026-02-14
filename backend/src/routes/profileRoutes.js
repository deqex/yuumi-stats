import express from "express";
import {
    getProfile,
    getStoredProfile,
} from "../controllers/profileController.js";

const router = express.Router();

router.get("/", getProfile);
router.get("/:puuid", getStoredProfile);

export default router;
