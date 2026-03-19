import ChampionMastery from "../models/ChampionMastery.js";
import { getCachedPuuid } from "../utils/getPuuid.js";
import { riotFetch } from "../utils/riotFetch.js";
import { isValidRegion } from "../utils/getBroadRegion.js";


async function saveMasteryToDb(puuid, region, champs) {
    const champions = champs.map((c) => ({
        championId:                   c.championId,
        championLevel:                c.championLevel,
        championPoints:               c.championPoints,
        championPointsSinceLastLevel: c.championPointsSinceLastLevel ?? 0,
        championPointsUntilNextLevel: c.championPointsUntilNextLevel ?? 0,
        lastPlayTime:                 c.lastPlayTime ?? 0,
    }));

    await ChampionMastery.findOneAndUpdate(
        { puuid, region: region.toUpperCase() },
        { puuid, region: region.toUpperCase(), champions, lastUpdated: new Date() },
        { upsert: true, new: true }
    );

    console.log(`Saved mastery for ${puuid} (${region}) – ${champions.length} champions`);
}

export async function getChampionMastery(req, res) {
    try {
        const { summonerName, summonerTag, region, forceUpdate } = req.query;
        if (!summonerName || !summonerTag || !region) {
            return res.status(400).json({ error: "summonerName, summonerTag, and region are required" });
        }
        if (!isValidRegion(region)) {
            return res.status(400).json({ error: "Invalid region" });
        }

        const puuid = await getCachedPuuid(summonerName, summonerTag, region);

        if (forceUpdate !== 'true') {
            const cached = await ChampionMastery.findOne({ puuid, region: region.toUpperCase() });
            if (cached && cached.champions?.length > 0) {
                console.log(`[DB] mastery for ${puuid} (${region})`);
                return res.json({ champions: cached.champions, lastUpdated: cached.lastUpdated });
            }
        }

        console.log(`[API] fetching mastery for ${puuid} (${region})`);
        const url = `https://${region.toLowerCase()}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}`;
        const masteryRes = await riotFetch(url);
        if (!masteryRes.ok) throw new Error(`Riot API error (mastery): ${masteryRes.status}`);
        const champs = await masteryRes.json();

        const now = new Date();
        saveMasteryToDb(puuid, region, champs).catch((err) =>
            console.error("Error saving mastery to DB:", err.message)
        );

        return res.json({ champions: champs, lastUpdated: now });
    } catch (error) {
        console.error("getChampionMastery error:", error);
        const status = error.statusCode || 500;
        const message = status === 404 ? error.message : 'Failed to fetch champion mastery';
        return res.status(status).json({ error: message });
    }
}

const PUUID_RE = /^[a-zA-Z0-9_-]{42,128}$/;

export async function getStoredMastery(req, res) {
    try {
        const { puuid } = req.params;
        const { region } = req.query;
        if (!puuid || !region) {
            return res.status(400).json({ error: "puuid param and region query are required" });
        }
        if (!PUUID_RE.test(puuid)) {
            return res.status(400).json({ error: "Invalid puuid format" });
        }
        if (!isValidRegion(region)) {
            return res.status(400).json({ error: "Invalid region" });
        }

        const doc = await ChampionMastery.findOne({ puuid, region: region.toUpperCase() });
        if (!doc) return res.status(404).json({ error: "No stored mastery found" });

        return res.json(doc);
    } catch (error) {
        console.error("getStoredMastery error:", error);
        return res.status(500).json({ error: 'Failed to fetch stored mastery' });
    }
}
