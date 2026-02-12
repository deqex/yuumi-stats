import express from "express";
import {
    getMatchIds,
    getMatchData,
    getChampionMastery,
    getPuuid,
    getSummoner,
    getRankEntries,
} from "../controllers/riotController.js";

const router = express.Router();

router.get("/puuid", getPuuid);
router.get("/summoner", getSummoner);
router.get("/ranks", getRankEntries);
router.get("/match-ids", getMatchIds);
router.get("/match/:matchId", getMatchData);
router.get("/champion-mastery", getChampionMastery);

export default router;
