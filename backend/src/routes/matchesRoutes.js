import express from "express";
import { getRecentMatches } from "../controllers/matchesController.js";
import { postMatch } from "../controllers/matchesController.js";

const router = express.Router();

router.get("/", getRecentMatches);
router.post("/", postMatch);

export default router;