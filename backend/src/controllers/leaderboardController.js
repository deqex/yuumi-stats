import Profile from "../models/Profile.js";
import { getApiKey } from "../utils/getApiKey.js";
import { riotFetch } from "../utils/riotFetch.js";
import { getBroadRegion } from "../utils/getBroadRegion.js";

const backgroundFetching = new Set();
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchMissingDataBackground(workItems, broadRegion, apiKey, regionLower, region) {
    for (const { puuid, needsName, needsIcon, needsLevel } of workItems) {
        const dbPatch = {};

        if (needsName) {
            await sleep(1300);
            try {
                console.log(`[Leaderboard] [API] account  ${puuid.slice(0, 8)}…`);
                const res = await riotFetch(
                    `https://${broadRegion}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}?api_key=${apiKey}`
                );
                if (res.ok) {
                    const { gameName = '', tagLine = '' } = await res.json();
                    dbPatch.gameName = gameName;
                    dbPatch.tagLine = tagLine;
                } else {
                    console.warn(`[Leaderboard] [API] account  ${puuid.slice(0, 8)}… >> ${res.status}`);
                }
            } catch (e) {
                console.warn(`[Leaderboard] [API] account  ${puuid.slice(0, 8)}… >> ${e.message}`);
            }
        }

        if (needsIcon || needsLevel) {
            await sleep(1300);
            try {
                console.log(`[Leaderboard] [API] summoner ${puuid.slice(0, 8)}…`);
                const res = await riotFetch(
                    `https://${regionLower}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}?api_key=${apiKey}`
                );
                if (res.ok) {
                    const { profileIconId, summonerLevel } = await res.json();
                    if (profileIconId != null) dbPatch.icon = profileIconId;
                    if (summonerLevel != null) dbPatch.summonerLevel = summonerLevel;
                } else {
                    console.warn(`[Leaderboard] [API] summoner ${puuid.slice(0, 8)}… >> ${res.status}`);
                }
            } catch (e) {
                console.warn(`[Leaderboard] [API] summoner ${puuid.slice(0, 8)}… >> ${e.message}`);
            }
        }

        if (Object.keys(dbPatch).length > 0) {
            console.log(`[Leaderboard] [DB]  upsert   ${puuid.slice(0, 8)}… >>`, Object.keys(dbPatch).join(', '));
            Profile.updateOne({ puuid }, { $set: dbPatch }, { upsert: true })
                .catch(e => console.warn(`[Leaderboard] [DB]  upsert   ${puuid.slice(0, 8)}… >> ${e.message}`));
        }
    }

    backgroundFetching.delete(region);
    console.log(`[Leaderboard] background complete — ${workItems.length} items processed for ${region}`);
}

export async function getLeaderboard(req, res) {
    try {
        const region = (req.query.region || 'EUN1').toUpperCase();
        const broadRegion = getBroadRegion(region);
        const apiKey = getApiKey();
        const regionLower = region.toLowerCase();

        console.log(`[Leaderboard] [API]   challenger list ${region}`);
        const listRes = await riotFetch(
            `https://${regionLower}.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5?api_key=${apiKey}`
        );
        if (!listRes.ok) throw new Error(`Riot API error (challenger): ${listRes.status}`);
        const list = await listRes.json();

        const top50 = [...list.entries]
            .sort((a, b) => b.leaguePoints - a.leaguePoints)
            .slice(0, 50);

        console.log(`[Leaderboard] [DB]    bulk lookup — top 50 puuids`);
        const puuids = top50.map(e => e.puuid);
        const profiles = await Profile.find(
            { puuid: { $in: puuids } },
            'puuid gameName tagLine icon summonerLevel'
        ).lean();
        const profileMap = new Map(profiles.map(p => [p.puuid, p]));
        console.log(`[Leaderboard] [DB]    found ${profiles.length}/50 profiles`);

        const players = top50.map((entry, i) => {
            const p = profileMap.get(entry.puuid);
            return {
                rank: i + 1,
                puuid: entry.puuid,
                gameName: p?.gameName || '',
                tagLine: p?.tagLine || '',
                leaguePoints: entry.leaguePoints,
                wins: entry.wins,
                losses: entry.losses,
                veteran: entry.veteran,
                inactive: entry.inactive,
                freshBlood: entry.freshBlood,
                hotStreak: entry.hotStreak,
                profileIconId: p?.icon ?? null,
                summonerLevel: p?.summonerLevel || null,
            };
        });

        const workItems = top50
            .filter(e => {
                const p = profileMap.get(e.puuid);
                return !p?.gameName || p?.icon == null;
            })
            .map(e => {
                const p = profileMap.get(e.puuid);
                return {
                    puuid: e.puuid,
                    needsName: !p?.gameName,
                    needsIcon: p?.icon == null,
                    needsLevel: !p?.summonerLevel,
                };
            });

        const complete = workItems.length === 0;
        console.log(`[Leaderboard] sending ${players.length} players — ${workItems.length} missing, complete=${complete}`);

        res.json({ tier: list.tier, region, players, complete });

        if (workItems.length > 0 && !backgroundFetching.has(region)) {
            backgroundFetching.add(region);
            console.log(`[Leaderboard] background starting — ${workItems.length} players for ${region}`);
            fetchMissingDataBackground(workItems, broadRegion, apiKey, regionLower, region);
        }

    } catch (error) {
        console.error("[Leaderboard] error:", error);
        const status = error.statusCode || 500;
        return res.status(status).json({ error: error.message });
    }
}
