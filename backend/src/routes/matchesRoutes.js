import express from "express";
import {
    getMatchIds,
    getMatchData,
    getPuuid,
    getSummoner,
    getRankEntries,
} from "../controllers/matchesController.js";

const router = express.Router();

router.get("/puuid", getPuuid);
router.get("/summoner", getSummoner);
router.get("/ranks", getRankEntries);
router.get("/match-ids", getMatchIds);
router.get("/match/:matchId", getMatchData);

export default router;
