import { getBroadRegion, isValidRegion } from "../utils/getBroadRegion.js";
import Match from "../models/Match.js";
import Profile from "../models/Profile.js";

import { getCachedPuuid } from "../utils/getPuuid.js";
import { riotFetch } from "../utils/riotFetch.js";
import { genBadges, genLiveGameBadges, genAggregateBadges } from "../utils/genBadges.js";
import { genScore } from "../utils/genScore.js";
import { saveMatchToDb } from "../utils/saveMatch.js";


export async function getMatchIds(req, res) {
    try {
        const { summonerName, summonerTag, region, forceUpdate, start = '0', count = '5', queue } = req.query;
        if (!summonerName || !summonerTag || !region) {
            return res.status(400).json({ error: "summonerName, summonerTag, and region are required" });
        }
        if (!isValidRegion(region)) {
            return res.status(400).json({ error: "Invalid region" });
        }

        const startNum = Math.max(0, parseInt(start, 10) || 0);
        const countNum = Math.min(100, Math.max(1, parseInt(count, 10) || 5));

        const puuid = await getCachedPuuid(summonerName, summonerTag, region);
        const broadRegion = getBroadRegion(region);
        const queueNum = queue ? parseInt(queue, 10) : null;

        if (forceUpdate !== 'true') {
            const dbQuery = { 'participantSummaries.puuid': puuid };
            if (queueNum != null && !isNaN(queueNum)) dbQuery.queueId = queueNum;

            const dbMatches = await Match.find(dbQuery, { matchId: 1 })
                .sort({ gameCreation: -1 })
                .skip(startNum)
                .limit(countNum)
                .lean();

            if (dbMatches.length > 0) {
                const matchIds = dbMatches.map(m => m.matchId);
                console.log(`[DB] match IDs for ${summonerName}#${summonerTag}: ${matchIds.length} found`);
                const profile = await Profile.findOne({ puuid }, { lastMatchFetchAt: 1, lastUpdated: 1 }).lean();
                const lastApiCallAt = profile?.lastMatchFetchAt ?? profile?.lastUpdated ?? null;
                return res.json({ matchIds, lastApiCallAt });
            }
        }

        const queueParam = (queueNum != null && !isNaN(queueNum)) ? `&queue=${queueNum}` : '';
        const url = `https://${broadRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${startNum}&count=${countNum}${queueParam}`;
        console.log(`[API] fetching match IDs for ${summonerName}#${summonerTag} (${region}, start=${startNum}, count=${countNum}${queue ? `, queue=${queue}` : ''})`);
        const matchRes = await riotFetch(url);
        if (!matchRes.ok) throw new Error(`Riot API error (matchIds): ${matchRes.status}`);
        const matchIds = await matchRes.json();

        const now = new Date();
        Profile.findOneAndUpdate({ puuid }, { lastMatchFetchAt: now }).catch(e => console.error('[lastMatchFetchAt]', e.message));

        return res.json({ matchIds, lastApiCallAt: now });
    } catch (error) {
        console.error("getMatchIds error:", error);
        const status = error.statusCode || 500;
        const message = status === 404 ? error.message : 'Failed to fetch match IDs';
        return res.status(status).json({ error: message });
    }
}

export async function getMatchData(req, res) {
    try {
        const { matchId } = req.params;
        const { region, forceUpdate } = req.query;
        if (!matchId || !/^[A-Z0-9]+_\d+$/i.test(matchId)) {
            return res.status(400).json({ error: "Invalid or missing matchId" });
        }

        if (forceUpdate !== 'true') {
            const cached = await Match.findOne({ matchId }).lean();
            if (cached) {
                console.log(`[DB] match ${matchId}`);
                const { participantSummaries, matchId: id, region: _r, _id, __v, ...gameFields } = cached;
                // Convert gameCreation to timestamp if it's a Date
                let gameCreation = gameFields.gameCreation;
                if (gameCreation instanceof Date) {
                    gameCreation = gameCreation.getTime();
                } else if (typeof gameCreation === 'string' || typeof gameCreation === 'object') {
                    // Try to convert string/object to timestamp
                    const dateObj = new Date(gameCreation);
                    if (!isNaN(dateObj)) gameCreation = dateObj.getTime();
                }
                const participantsWithBadges = genBadges(participantSummaries, cached.gameDuration, cached.queueId);
                return res.json({
                    metadata: { matchId: id },
                    info: {
                        ...gameFields,
                        gameCreation,
                        participants: participantsWithBadges
                    }
                });
            }
        }

        if (region && !isValidRegion(region)) {
            return res.status(400).json({ error: "Invalid region" });
        }

        console.log(`[API] fetching match ${matchId}`);
        const broadRegion = region ? getBroadRegion(region) : "europe";

        const url = `https://${broadRegion}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
        const matchRes = await riotFetch(url);
        if (!matchRes.ok) throw new Error(`Riot API error (matchData): ${matchRes.status}`);
        const matchData = await matchRes.json();

        saveMatchToDb(matchData, region).catch(e => console.error('[saveMatch]', e.message));

        const participants = matchData.info?.participants ?? [];
        const participantsWithBadges = genBadges(participants, matchData.info?.gameDuration, matchData.info?.queueId);
        return res.json({
            ...matchData,
            info: { ...matchData.info, participants: participantsWithBadges },
        });
    } catch (error) {
        console.error("getMatchData error:", error);
        return res.status(500).json({ error: 'Failed to fetch match data' });
    }
}

export async function getPuuid(req, res) {
    try {
        const { summonerName, summonerTag, region } = req.query;
        if (!summonerName || !summonerTag || !region) {
            return res.status(400).json({ error: "summonerName, summonerTag, and region are required" });
        }
        if (!isValidRegion(region)) {
            return res.status(400).json({ error: "Invalid region" });
        }

        const puuid = await getCachedPuuid(summonerName, summonerTag, region);
        return res.json({ puuid });
    } catch (error) {
        console.error("getPuuid error:", error);
        const status = error.statusCode || 500;
        const message = status === 404 ? error.message : 'Failed to resolve player';
        return res.status(status).json({ error: message });
    }
}

const PUUID_RE = /^[a-zA-Z0-9_-]{42,128}$/;

export async function getParticipantStats(req, res) {
    try {
        const { puuid, region } = req.query;
        if (!puuid || !region) {
            return res.status(400).json({ error: "puuid and region are required" });
        }
        if (!PUUID_RE.test(puuid)) {
            return res.status(400).json({ error: "Invalid puuid format" });
        }
        if (!isValidRegion(region)) {
            return res.status(400).json({ error: "Invalid region" });
        }

        const broadRegion = getBroadRegion(region);
        const regionLower = region.toLowerCase();

        // Fetch rank, summoner level, and match IDs parallel
        const [rankRes, summonerRes, matchIdsRes] = await Promise.all([
            riotFetch(`https://${regionLower}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`),
            riotFetch(`https://${regionLower}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`),
            riotFetch(`https://${broadRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=10`),
        ]);

        const ranks     = rankRes.ok     ? await rankRes.json()     : [];
        const summoner  = summonerRes.ok ? await summonerRes.json() : {};
        const matchIds  = matchIdsRes.ok ? await matchIdsRes.json() : [];
        let totalKills = 0, totalDeaths = 0, totalAssists = 0;
        let totalCS = 0, totalDurationSecs = 0, totalKP = 0, totalAiScore = 0;
        let totalCSNonSupport = 0, totalDurationSecsNonSupport = 0;
        let wins = 0, validGames = 0;
        const recentGames = [];
        const badgeCounts = {};
        const positionCounts = {};

        for (const matchId of matchIds) {
            let participants = null;
            let gameDuration = 0;
            let queueId = 0;

            // Check DB cache first
            const cached = await Match.findOne({ matchId }).lean();
            if (cached) {
                participants = cached.participantSummaries;
                gameDuration = cached.gameDuration;
                queueId      = cached.queueId;
            } else {
                const matchRes = await riotFetch(
                    `https://${broadRegion}.api.riotgames.com/lol/match/v5/matches/${matchId}`
                );
                if (!matchRes.ok) continue;
                const matchData = await matchRes.json();
                saveMatchToDb(matchData, region).catch(e => console.error('[saveMatch]', e.message));
                participants = matchData.info?.participants || [];
                gameDuration = matchData.info?.gameDuration || 0;
                queueId      = matchData.info?.queueId || 0;
            }

            const p = participants.find(pl => pl.puuid === puuid);
            if (!p) continue;

            const teamKills = participants
                .filter(pl => pl.teamId === p.teamId)
                .reduce((sum, pl) => sum + (pl.kills || 0), 0);

            validGames++;
            totalKills        += p.kills   || 0;
            totalDeaths       += p.deaths  || 0;
            totalAssists      += p.assists || 0;
            const cs = (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0);
            totalCS           += cs;
            totalDurationSecs += gameDuration;
            const position = p.teamPosition || p.individualPosition || '';
            if (position !== 'UTILITY') {
                totalCSNonSupport           += cs;
                totalDurationSecsNonSupport += gameDuration;
            }
            totalKP           += teamKills > 0 ? (p.kills + p.assists) / teamKills : 0;
            if (position) positionCounts[position] = (positionCounts[position] || 0) + 1;
            totalAiScore      += genScore(p, participants, gameDuration, queueId).score;
            if (p.win) wins++;

            const playersWithBadges = genLiveGameBadges(participants, gameDuration, queueId);
            const pWithBadges = playersWithBadges.find(pl => pl.puuid === puuid);
            for (const { badge, description } of (pWithBadges?.badges ?? [])) {
                if (!badgeCounts[badge]) badgeCounts[badge] = { count: 0, description };
                badgeCounts[badge].count++;
            }

            if (recentGames.length < 7) recentGames.push({ championId: p.championId, win: p.win });
        }

        const stats = validGames > 0 ? {
            avgKills:    +(totalKills   / validGames).toFixed(1),
            avgDeaths:   +(totalDeaths  / validGames).toFixed(1),
            avgAssists:  +(totalAssists / validGames).toFixed(1),
            kda:         totalDeaths > 0
                ? +((totalKills + totalAssists) / totalDeaths).toFixed(2)
                : +(totalKills + totalAssists).toFixed(2),
            winRate:     Math.round((wins / validGames) * 100),
            csPerMin:    totalDurationSecsNonSupport > 0
                ? +(totalCSNonSupport / (totalDurationSecsNonSupport / 60)).toFixed(1)
                : null,
            avgKP:       Math.round((totalKP / validGames) * 100),
            avgAiScore:  Math.round(totalAiScore / validGames),
            gamesPlayed: validGames,
        } : null;

        const primaryPosition = Object.keys(positionCounts).length
            ? Object.entries(positionCounts).sort((a, b) => b[1] - a[1])[0][0]
            : null;

        const perGameBadges = Object.entries(badgeCounts)
            .filter(([, { count }]) => count >= 2)
            .sort((a, b) => b[1].count - a[1].count)
            .map(([badge, { count, description }]) => ({ badge, description, count }));

        const aggregateBadges = genAggregateBadges(stats);
        const badges = [...aggregateBadges, ...perGameBadges];

        return res.json({
            summonerLevel: summoner.summonerLevel ?? null,
            ranks,
            stats,
            recentGames,
            badges,
            primaryPosition,
        });
    } catch (error) {
        console.error("getParticipantStats error:", error);
        const status = error.statusCode || 500;
        const message = status === 404 ? error.message : 'Failed to fetch participant stats';
        return res.status(status).json({ error: message });
    }
}

export async function getLiveGame(req, res) {
    try {
        const { summonerName, summonerTag, region } = req.query;
        if (!summonerName || !summonerTag || !region) {
            return res.status(400).json({ error: "summonerName, summonerTag, and region are required" });
        }
        if (!isValidRegion(region)) {
            return res.status(400).json({ error: "Invalid region" });
        }

        const puuid = await getCachedPuuid(summonerName, summonerTag, region);
        const url = `https://${region.toLowerCase()}.api.riotgames.com/lol/spectator/v5/active-games/by-summoner/${puuid}`;
        const liveRes = await riotFetch(url);
        if (liveRes.status === 404) {
            return res.status(404).json({ error: "Player is not in a live game" });
        }
        if (!liveRes.ok) throw new Error(`Riot API error (livegame): ${liveRes.status}`);
        const liveData = await liveRes.json();

        return res.json(liveData);
    } catch (error) {
        console.error("getLiveGame error:", error);
        const status = error.statusCode || 500;
        const message = status === 404 ? error.message : 'Failed to fetch live game';
        return res.status(status).json({ error: message });
    }
}

export async function getSummoner(req, res) {
    try {
        const { summonerName, summonerTag, region } = req.query;
        if (!summonerName || !summonerTag || !region) {
            return res.status(400).json({ error: "summonerName, summonerTag, and region are required" });
        }
        if (!isValidRegion(region)) {
            return res.status(400).json({ error: "Invalid region" });
        }

        const puuid = await getCachedPuuid(summonerName, summonerTag, region);
        const url = `https://${region.toLowerCase()}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
        const summonerRes = await riotFetch(url);
        if (!summonerRes.ok) throw new Error(`Riot API error (summoner): ${summonerRes.status}`);
        const summoner = await summonerRes.json();

        return res.json(summoner);
    } catch (error) {
        console.error("getSummoner error:", error);
        const status = error.statusCode || 500;
        const message = status === 404 ? error.message : 'Failed to fetch summoner';
        return res.status(status).json({ error: message });
    }
}

export async function getRankEntries(req, res) {
    try {
        const { summonerName, summonerTag, region } = req.query;
        if (!summonerName || !summonerTag || !region) {
            return res.status(400).json({ error: "summonerName, summonerTag, and region are required" });
        }
        if (!isValidRegion(region)) {
            return res.status(400).json({ error: "Invalid region" });
        }

        const puuid = await getCachedPuuid(summonerName, summonerTag, region);
        const url = `https://${region.toLowerCase()}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`;
        const rankRes = await riotFetch(url);
        if (!rankRes.ok) throw new Error(`Riot API error (ranks): ${rankRes.status}`);
        const ranks = await rankRes.json();

        return res.json(ranks);
    } catch (error) {
        console.error("getRankEntries error:", error);
        const status = error.statusCode || 500;
        const message = status === 404 ? error.message : 'Failed to fetch rank entries';
        return res.status(status).json({ error: message });
    }
}

export async function getRankByPuuid(req, res) {
    const { puuid, region } = req.query;
    if (!puuid || !region) {
        return res.status(400).json({ error: "puuid and region are required" });
    }
    if (!PUUID_RE.test(puuid)) {
        return res.status(400).json({ error: "Invalid puuid format" });
    }
    if (!isValidRegion(region)) {
        return res.status(400).json({ error: "Invalid region" });
    }

    try {
        // Check DB cache first
        const profile = await Profile.findOne({ puuid }, { ranks: 1 }).lean();
        if (profile?.ranks?.length) {
            return res.json(JSON.parse(JSON.stringify(profile.ranks)));
        }

        // fallabck to Riot API
        const rankRes = await riotFetch(`https://${region.toLowerCase()}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`);
        const ranks = rankRes?.ok ? await rankRes.json() : [];
        return res.json(ranks);
    } catch (error) {
        console.error("getRankByPuuid error:", error);
        const status = error.statusCode || 500;
        const message = status === 404 ? error.message : 'Failed to fetch rank data';
        return res.status(status).json({ error: message });
    }
}
