import Profile from "../models/Profile.js";
import { getCachedPuuid } from "../utils/getPuuid.js";
import { getApiKey } from "../utils/getApiKey.js";
import { riotFetch } from "../utils/riotFetch.js";


async function fetchSummoner(puuid, region) {
    const url = `https://${region.toLowerCase()}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}?api_key=${getApiKey()}`;
    const res = await riotFetch(url);
    if (!res.ok) throw new Error(`Riot API error (summoner): ${res.status}`);
    return await res.json();
}

async function fetchRanks(puuid, region) {
    const url = `https://${region.toLowerCase()}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}?api_key=${getApiKey()}`;
    const res = await riotFetch(url);
    if (!res.ok) throw new Error(`Riot API error (ranks): ${res.status}`);
    return await res.json();
}

async function saveProfileToDb(summonerName, puuid, icon, rankEntries, summonerLevel) {
    const ranks = rankEntries.map((e) => ({
        queueType: e.queueType,
        tier: e.tier,
        rank: e.rank,
        leaguePoints: e.leaguePoints ?? 0,
        wins: e.wins ?? 0,
        losses: e.losses ?? 0,
    }));

    const [gameName, tagLine] = summonerName.includes('#')
        ? summonerName.split('#')
        : [summonerName, ''];

    const profile = await Profile.findOneAndUpdate(
        { puuid },
        {
            summonerName,
            puuid,
            gameName,
            tagLine,
            icon,
            ranks,
            summonerLevel,
            lastUpdated: new Date(),
        },
        { upsert: true, new: true }
    );

    console.log(`Saved profile for ${summonerName} (${puuid}) to DB`);
    return profile;
}

export async function getProfile(req, res) {
    try {
        const { summonerName, summonerTag, region, forceUpdate } = req.query;
        if (!summonerName || !summonerTag || !region) {
            return res.status(400).json({ error: "summonerName, summonerTag, and region are required" });
        }

        const fullName = `${summonerName}#${summonerTag}`;

        if (forceUpdate !== 'true') {
            const cached = await Profile.findOne({ summonerName: fullName });
            if (cached) {
                console.log(`[DB] profile for ${fullName}`);
                return res.json({
                    summonerName: cached.summonerName,
                    puuid: cached.puuid,
                    icon: cached.icon,
                    ranks: cached.ranks,
                    summonerLevel: cached.summonerLevel,
                });
            }
        }

        console.log(`[API] fetching profile for ${fullName} (${region})`);
        const puuid = await getCachedPuuid(summonerName, summonerTag, region);
        const [summoner, rankEntries] = await Promise.all([
            fetchSummoner(puuid, region),
            fetchRanks(puuid, region),
        ]);

        const profile = await saveProfileToDb(
            fullName,
            puuid,
            summoner.profileIconId,
            rankEntries,
            summoner.summonerLevel
        );

        return res.json({
            summonerName: profile.summonerName,
            puuid: profile.puuid,
            icon: profile.icon,
            ranks: profile.ranks,
            summonerLevel: profile.summonerLevel,
        });
    } catch (error) {
        console.error("getProfile error:", error);
        const status = error.statusCode || 500;
        return res.status(status).json({ error: error.message });
    }
}

export async function getStoredProfile(req, res) {
    try {
        const { puuid } = req.params;
        if (!puuid) {
            return res.status(400).json({ error: "puuid is required" });
        }

        const profile = await Profile.findOne({ puuid });
        if (!profile) {
            return res.status(404).json({ error: "Profile not found" });
        }

        return res.json(profile);
    } catch (error) {
        console.error("getStoredProfile error:", error);
        return res.status(500).json({ error: error.message });
    }
}
