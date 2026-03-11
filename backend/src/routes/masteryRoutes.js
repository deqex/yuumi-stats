import express from "express";
import {
    getChampionMastery,
    getStoredMastery,
} from "../controllers/masteryController.js";
import { optionalAuth } from "../middleware/optionalAuth.js";

const router = express.Router();

router.get("/champion-mastery", optionalAuth, getChampionMastery);
router.get("/:puuid", getStoredMastery);

export default router;
