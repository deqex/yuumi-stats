import express from "express";
import {
    getChampionMastery,
    getStoredMastery,
} from "../controllers/masteryController.js";

const router = express.Router();

router.get("/champion-mastery", getChampionMastery);
router.get("/:puuid", getStoredMastery);

export default router;
