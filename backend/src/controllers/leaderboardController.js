import Profile from "../models/Profile.js";
import { riotFetch } from "../utils/riotFetch.js";
import { getBroadRegion } from "../utils/getBroadRegion.js";

const cache = new Map(); 
const CACHE_TTL_MS = 30 * 60 * 1000; 
const backgroundFetching = new Set();
const sleep = ms => new Promise(r => setTimeout(r, ms));

setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache) {
        if (now - entry.fetchedAt > CACHE_TTL_MS) cache.delete(key);
    }
}, CACHE_TTL_MS);

async function fetchMissingDataBackground(workItems, broadRegion, regionLower, region) {
    for (const { puuid, needsName, needsIcon, needsLevel } of workItems) {
        const dbPatch = {};

        if (needsName) {
            await sleep(1300);
            try {
                console.log(`[Leaderboard] [API] account  ${puuid.slice(0, 8)}…`);
                const res = await riotFetch(
                    `https://${broadRegion}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}`
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
                    `https://${regionLower}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`
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
            await Profile.updateOne({ puuid }, { $set: dbPatch }, { upsert: true })
                .catch(e => console.warn(`[Leaderboard] [DB]  upsert   ${puuid.slice(0, 8)}… >> ${e.message}`));

            const cached = cache.get(region);
            if (cached) {
                const player = cached.players.find(p => p.puuid === puuid);
                if (player) {
                    if (dbPatch.gameName)      player.gameName      = dbPatch.gameName;
                    if (dbPatch.tagLine)       player.tagLine       = dbPatch.tagLine;
                    if (dbPatch.icon != null)  player.profileIconId = dbPatch.icon;
                    if (dbPatch.summonerLevel) player.summonerLevel = dbPatch.summonerLevel;
                }
            }
        }
    }

    backgroundFetching.delete(region);
    console.log(`[Leaderboard] background complete — ${workItems.length} items processed for ${region}`);
}

export async function getLeaderboard(req, res) {
    try {
        const region = (req.query.region || 'EUN1').toUpperCase();

        const cached = cache.get(region);
        if (cached && (Date.now() - cached.fetchedAt) < CACHE_TTL_MS) {
            console.log(`[Leaderboard] cache hit — ${region}`);
            return res.json({ tier: cached.tier, region, players: cached.players });
        }

        const broadRegion = getBroadRegion(region);
        const regionLower = region.toLowerCase();

        console.log(`[Leaderboard] [API] challenger list ${region}`);
        const listRes = await riotFetch(
            `https://${regionLower}.api.riotgames.com/lol/league/v4/challengerleagues/by-queue/RANKED_SOLO_5x5`
        );
        if (!listRes.ok) throw new Error(`Riot API error (challenger): ${listRes.status}`);
        const list = await listRes.json();

        const top50 = [...list.entries]
            .sort((a, b) => b.leaguePoints - a.leaguePoints)
            .slice(0, 50);

        const puuids = top50.map(e => e.puuid);
        const profiles = await Profile.find(
            { puuid: { $in: puuids } },
            'puuid gameName tagLine icon summonerLevel'
        ).lean();
        const profileMap = new Map(profiles.map(p => [p.puuid, p]));
        console.log(`[Leaderboard] [DB] found ${profiles.length}/50 profiles`);

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

        cache.set(region, { tier: list.tier, players, fetchedAt: Date.now() });
        res.json({ tier: list.tier, region, players });

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

        if (workItems.length > 0 && !backgroundFetching.has(region)) {
            backgroundFetching.add(region);
            console.log(`[Leaderboard] background starting — ${workItems.length} players for ${region}`);
            fetchMissingDataBackground(workItems, broadRegion, regionLower, region)
                .catch(e => console.error('[Leaderboard] background error:', e.message));
        }

    } catch (error) {
        console.error("[Leaderboard] error:", error);
        const status = error.statusCode || 500;
        const message = status === 404 ? error.message : 'Failed to fetch leaderboard';
        return res.status(status).json({ error: message });
    }
}
