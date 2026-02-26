import express from "express";
import { createRequire } from "module";
import {
    getMatchIds,
    getMatchData,
    getPuuid,
    getSummoner,
    getRankEntries,
    getLiveGame,
    getParticipantStats,
} from "../controllers/matchesController.js";
import { getAnalysisData } from "../controllers/analysisController.js";

const require = createRequire(import.meta.url);
const queuesData = require("../utils/queues.json");

const router = express.Router();

router.get("/queues", (req, res) => res.json(queuesData));
router.get("/puuid", getPuuid);
router.get("/summoner", getSummoner);
router.get("/ranks", getRankEntries);
router.get("/match-ids", getMatchIds);
router.get("/match/:matchId", getMatchData);
router.get("/live-game", getLiveGame);
router.get("/participant-stats", getParticipantStats);
router.get("/analysis", getAnalysisData);

export default router;
