import Match from "../models/Match.js";

export async function getRecentMatches(_, res) {
    try {
        const matches = await Match.find().limit(20); // sort by gameCreation, -1
        res.status(200).json(matches);
    } catch (error) {
        console.error("Error retrieving recent matches:", error);
        res.status(500).send("Error retrieving recent matches");
    }
}

export async function postMatch(req, res) {
    try {
        const newMatch = new Match(req.body);
        const savedMatch = await newMatch.save();
        res.status(201).json(savedMatch);

    } catch (error) {
        console.error("Error creating match:", error);
        res.status(500).send("Error creating match");
    }
}

// find match by matchId
//export async function getMatchById(req, res) {
//    try {
//        const match = await Match.findOne({ matchId: req.params.matchId });
//        if (!match) {
//            return res.status(404).send("Match not found");
//        }
//        res.status(200).json(match);
//    } catch (error) {
//        console.error("Error retrieving match by ID:", error);
//        res.status(500).send("Error retrieving match by ID");
//    }
//}