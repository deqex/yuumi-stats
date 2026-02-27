import { getBroadRegion } from "../utils/getBroadRegion.js";
import Match from "../models/Match.js";
import { getCachedPuuid } from "../utils/getPuuid.js";
import { getApiKey } from "../utils/getApiKey.js";
import { riotFetch } from "../utils/riotFetch.js";
import { genScore } from "../utils/genScore.js";


function apiPosition(p) { return p.individualPosition || ''; }
function dbPosition(p)  { return p.individualPosition || ''; }


async function saveMatchToDb(matchData, region) {
    try {
        const { metadata, info } = matchData;

        if (!metadata?.matchId || !info?.participants) return;

        const exists = await Match.exists({ matchId: metadata.matchId });
        if (exists) return;

        const season = new Date(info.gameCreation).getFullYear() - 2010;
        const regionCode = (region || info.platformId || "").toUpperCase();

        const participantSummaries = info.participants.map((p) => ({
            puuid:                              p.puuid,
            riotIdGameName:                     p.riotIdGameName ?? '',
            riotIdTagline:                      p.riotIdTagline ?? '',
            championId:                         p.championId,
            championName:                       p.championName,
            teamId:                             p.teamId,
            individualPosition:                 p.individualPosition ?? '',
            roleQuestId:                        p.roleBoundItem ?? null,
            win:                                p.win,
            kills:                              p.kills,
            deaths:                             p.deaths,
            assists:                            p.assists,
            totalMinionsKilled:                 p.totalMinionsKilled ?? 0,
            neutralMinionsKilled:               p.neutralMinionsKilled ?? 0,
            champExperience:                    p.champExperience ?? 0,
            champLevel:                         p.champLevel ?? 1,
            goldEarned:                         p.goldEarned ?? 0,
            totalDamageDealtToChampions:        p.totalDamageDealtToChampions ?? 0,
            totalDamageShieldedOnTeammates:     p.totalDamageShieldedOnTeammates ?? 0,
            totalHealsOnTeammates:              p.totalHealsOnTeammates ?? 0,
            totalDamageTaken:                   p.totalDamageTaken ?? 0,
            damageSelfMitigated:                p.damageSelfMitigated ?? 0,
            timeCCingOthers:                    p.timeCCingOthers ?? 0,
            timePlayed:                         p.timePlayed ?? 0,
            visionScore:                        p.visionScore ?? 0,
            enemyMissingPings:                  p.enemyMissingPings ?? 0,
            enemyVisionPings:                   p.enemyVisionPings ?? 0,
            firstTowerKill:                     p.firstTowerKill ?? false,
            firstBloodKill:                     p.firstBloodKill ?? false,
            firstBloodAssist:                   p.firstBloodAssist ?? false,
            largestMultiKill:                   p.largestMultiKill ?? 0,
            objectivesStolen:                   p.objectivesStolen ?? 0,

            controlWardsPlaced:                 p.challenges?.controlWardsPlaced ?? 0,
            damageDealtToTurrets:               p.damageDealtToTurrets ?? 0,
            totalAllyJungleMinionsKilled:       p.totalAllyJungleMinionsKilled ?? 0,
            totalEnemyJungleMinionsKilled:      p.totalEnemyJungleMinionsKilled ?? 0,
            gameEndedInSurrender:               p.gameEndedInSurrender ?? false,
            gameEndedInEarlySurrender:          p.gameEndedInEarlySurrender ?? false,
            epicMonsterSteals:                  p.challenges?.epicMonsterSteals ?? 0,
            flawlessAces:                       p.challenges?.flawlessAces ?? 0,
            hadOpenNexus:                       p.challenges?.hadOpenNexus ?? 0,
            perfectGame:                        p.challenges?.perfectGame ?? 0,
            takedownsInEnemyFountain:           p.challenges?.takedownsInEnemyFountain ?? 0,
            earliestBaron:                      p.challenges?.earliestBaron ?? 0,
            elderDragonKillsWithOpposingSoul:   p.challenges?.elderDragonKillsWithOpposingSoul ?? 0,
            dancedWithRiftHerald:               p.challenges?.dancedWithRiftHerald ?? 0,
            healFromMapSources:                 p.challenges?.HealFromMapSources ?? 0,
            dragonTakedowns:                    p.challenges?.dragonTakedowns ?? 0,
            scuttleCrabKills:                   p.challenges?.scuttleCrabKills ?? 0,
            stealthWardsPlaced:                 p.challenges?.stealthWardsPlaced ?? 0,
            wardTakedowns:                      p.challenges?.wardTakedowns ?? 0,
            killsNearEnemyTurret:               p.challenges?.killsNearEnemyTurret ?? 0,
            maxCsAdvantageOnLaneOpponent:       p.challenges?.maxCsAdvantageOnLaneOpponent ?? 0,
            takedownsAfterGainingLevelAdvantage:p.challenges?.takedownsAfterGainingLevelAdvantage ?? 0,
            takedownsBeforeJungleMinionSpawn:   p.challenges?.takedownsBeforeJungleMinionSpawn ?? 0,
            abilityUses:                        p.challenges?.abilityUses ?? 0,
            killParticipation:                  p.challenges?.killParticipation ?? 0,
            kda:                                p.challenges?.kda ?? 0,

            item0: p.item0 ?? 0, item1: p.item1 ?? 0, item2: p.item2 ?? 0,
            item3: p.item3 ?? 0, item4: p.item4 ?? 0, item5: p.item5 ?? 0,
            item6: p.item6 ?? 0,

            summoner1Id:  p.summoner1Id ?? 0,
            summoner2Id:  p.summoner2Id ?? 0,
            perks:        p.perks ?? null,
        }));

        await Match.create({
            matchId: metadata.matchId,
            region: regionCode,
            gameCreation: new Date(info.gameCreation),
            gameDuration: info.gameDuration,
            queueId: info.queueId,
            season,
            participantSummaries,
        });
        console.log(`[Analysis] cached match ${metadata.matchId}`);
    } catch (err) {
        console.error("[Analysis] saveMatchToDb error:", err.message);
        if (err.code !== 11000) console.error("[Analysis] saveMatchToDb error:", err.message);
    }
}


export async function getAnalysisData(req, res) {
    try {
        const { summonerName, summonerTag, region, roles: rolesParam, queues: queuesParam, days: daysParam } = req.query;
        if (!summonerName || !summonerTag || !region) {
            return res.status(400).json({ error: "summonerName, summonerTag, and region are required" });
        }

        const allowedRoles  = rolesParam  ? new Set(rolesParam.split(',').map(r => r.trim().toUpperCase())) : null;
        const allowedQueues = queuesParam ? new Set(queuesParam.split(',').map(Number)) : null;

        const puuid = await getCachedPuuid(summonerName, summonerTag, region);
        const broadRegion = getBroadRegion(region);
        const apiKey = getApiKey();

        const allowedDays = [7, 14, 30, 90, 180, 365];
        let days = parseInt(daysParam, 10) || 14;
        if (!allowedDays.includes(days)) days = 14;

        const now = Math.floor(Date.now() / 1000);
        const startTime = now - days * 24 * 60 * 60;

        const tracker = () => ({ total: 0, min: Infinity, max: -Infinity });
        const update  = (t, val) => {
            t.total += val;
            if (val < t.min) t.min = val;
            if (val > t.max) t.max = val;
        };

        let totalGames = 0, wins = 0;

        const kills = tracker(), deaths = tracker(), assists = tracker();
        const cs = tracker(), visionScore = tracker(), aiScore = tracker();
        const kp = tracker(), gameLength = tracker();

        let firstBloods = 0, forfeits = 0;
        const uniqueChampions = new Set();
        const championStats = new Map();
        let epicMonsterSteals = 0, flawlessAces = 0, hadOpenNexus = 0;
        let perfectGames = 0, takedownsInEnemyFountain = 0;
        let elderDragonKillsWithOpposingSoul = 0, dancedWithRiftHerald = 0;
        let minEarliestBaron = Infinity;

        const healFromMap = tracker(), controlWards = tracker();
        const dragonTakedowns = tracker(), scuttleKills = tracker();
        const stealthWards = tracker(), wardKills = tracker();
        const dmgToTurrets = tracker(), selfMitigated = tracker();
        const allyJungle = tracker(), dmgToChamps = tracker();
        const enemyJungle = tracker(), healsOnTeam = tracker();
        const killsNearTurret = tracker(), maxCsAdv = tracker();
        const takedownsAfterLevel = tracker(), takedownsBeforeJungle = tracker();
        const abilityUses = tracker();

        let idStart = 0;
        let totalIdsFetched = 0;
        let keepFetching  = true;

        while (keepFetching) {
            const matchIdsRes = await riotFetch(
                `https://${broadRegion}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${idStart}&count=100&api_key=${apiKey}`
            );
            if (!matchIdsRes.ok) throw new Error(`Riot API error (matchIds): ${matchIdsRes.status}`);
            const batch = await matchIdsRes.json();

            if (batch.length === 0) break;
            totalIdsFetched += batch.length;

            for (const matchId of batch) {
                let p = null;
                let allParticipants = null;
                let gameDuration = 0;
                let queueId = null;
                let gamePosition = '';
                let gameCreationSec = 0;

                const cached = await Match.findOne({ matchId }).lean();
                if (cached) {
                    console.log(`[Analysis][DB] ${matchId}`);
                    gameCreationSec = new Date(cached.gameCreation).getTime() / 1000;
                    queueId = cached.queueId;

                    if (allowedQueues && !allowedQueues.has(queueId)) continue;

                    p = cached.participantSummaries.find(ps => ps.puuid === puuid);
                    allParticipants = cached.participantSummaries;
                    gameDuration = cached.gameDuration;
                    if (p) gamePosition = dbPosition(p);

                } else {
                    console.log(`[Analysis][API] ${matchId}`);
                    const matchRes = await riotFetch(
                        `https://${broadRegion}.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${apiKey}`
                    );
                    if (!matchRes.ok) continue;
                    const matchData = await matchRes.json();

                    saveMatchToDb(matchData, region);

                    gameCreationSec = (matchData.info?.gameCreation || 0) / 1000;
                    queueId = matchData.info?.queueId;

                    if (allowedQueues && !allowedQueues.has(queueId)) continue;

                    allParticipants = matchData.info?.participants || [];
                    const rawP = allParticipants.find(pl => pl.puuid === puuid);
                    gameDuration = matchData.info?.gameDuration || 0;

                    if (rawP) {
                        gamePosition = apiPosition(rawP);
                        p = {
                            ...rawP,
                            controlWardsPlaced:                 rawP.challenges?.controlWardsPlaced ?? 0,
                            epicMonsterSteals:                  rawP.challenges?.epicMonsterSteals ?? 0,
                            flawlessAces:                       rawP.challenges?.flawlessAces ?? 0,
                            hadOpenNexus:                       rawP.challenges?.hadOpenNexus ?? 0,
                            perfectGame:                        rawP.challenges?.perfectGame ?? 0,
                            takedownsInEnemyFountain:           rawP.challenges?.takedownsInEnemyFountain ?? 0,
                            earliestBaron:                      rawP.challenges?.earliestBaron ?? 0,
                            elderDragonKillsWithOpposingSoul:   rawP.challenges?.elderDragonKillsWithOpposingSoul ?? 0,
                            dancedWithRiftHerald:               rawP.challenges?.dancedWithRiftHerald ?? 0,
                            healFromMapSources:                 rawP.challenges?.HealFromMapSources ?? 0,
                            dragonTakedowns:                    rawP.challenges?.dragonTakedowns ?? 0,
                            scuttleCrabKills:                   rawP.challenges?.scuttleCrabKills ?? 0,
                            stealthWardsPlaced:                 rawP.challenges?.stealthWardsPlaced ?? 0,
                            wardTakedowns:                      rawP.challenges?.wardTakedowns ?? 0,
                            killsNearEnemyTurret:               rawP.challenges?.killsNearEnemyTurret ?? 0,
                            maxCsAdvantageOnLaneOpponent:       rawP.challenges?.maxCsAdvantageOnLaneOpponent ?? 0,
                            takedownsAfterGainingLevelAdvantage:rawP.challenges?.takedownsAfterGainingLevelAdvantage ?? 0,
                            takedownsBeforeJungleMinionSpawn:   rawP.challenges?.takedownsBeforeJungleMinionSpawn ?? 0,
                            abilityUses:                        rawP.challenges?.abilityUses ?? 0,
                        };
                    }
                }

                if (gameCreationSec < startTime) {
                    console.log(`[Analysis] reached time limit at ${matchId} - stopping`);
                    keepFetching = false;
                    break;
                }

                if (!p) continue;

                if (allowedRoles && queueId !== 450) {
                    if (!gamePosition || !allowedRoles.has(gamePosition)) {
                        console.log(`[Analysis] skip ${matchId} - position "${gamePosition}" not in filter`);
                        continue;
                    }
                }

                if (gameDuration < 14 * 60) {
                    console.log(`[Analysis] skip ${matchId} - too short (${Math.round(gameDuration / 60)}m)`);
                    continue;
                }

                const teamKills = allParticipants
                    .filter(pl => pl.teamId === p.teamId)
                    .reduce((sum, pl) => sum + (pl.kills || 0), 0);

                totalGames++;
                if (p.win) wins++;

                const roundedScore = genScore(p, allParticipants, gameDuration, queueId).score;

                const kpVal  = teamKills > 0 ? Math.round(((p.kills + p.assists) / teamKills) * 100) : 0;
                const csVal  = (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0);

                update(kills,       p.kills   || 0);
                update(deaths,      p.deaths  || 0);
                update(assists,     p.assists  || 0);
                update(cs,          csVal);
                update(visionScore, p.visionScore || 0);
                update(aiScore,     roundedScore);
                update(kp,          kpVal);
                update(gameLength,  gameDuration || 0);

                if (p.firstBloodKill || p.firstBloodAssist) firstBloods++;
                if (p.gameEndedInSurrender && !p.win) forfeits++;
                if (p.championName) {
                    uniqueChampions.add(p.championName);
                    if (!championStats.has(p.championName)) {
                        championStats.set(p.championName, { games: 0, wins: 0, totalKills: 0, totalDeaths: 0, totalAssists: 0, totalCs: 0, totalGameDuration: 0, totalAiScore: 0 });
                    }
                    const cs_ = championStats.get(p.championName);
                    cs_.games++;
                    if (p.win) cs_.wins++;
                    cs_.totalKills        += p.kills  || 0;
                    cs_.totalDeaths       += p.deaths || 0;
                    cs_.totalAssists      += p.assists || 0;
                    cs_.totalCs           += csVal;
                    cs_.totalGameDuration += gameDuration;
                    cs_.totalAiScore      += roundedScore;
                }

                epicMonsterSteals                += p.epicMonsterSteals || 0;
                flawlessAces                     += p.flawlessAces || 0;
                hadOpenNexus                     += p.hadOpenNexus || 0;
                perfectGames                     += p.perfectGame || 0;
                takedownsInEnemyFountain         += p.takedownsInEnemyFountain || 0;
                elderDragonKillsWithOpposingSoul += p.elderDragonKillsWithOpposingSoul || 0;
                dancedWithRiftHerald             += p.dancedWithRiftHerald || 0;

                if (p.earliestBaron > 0 && p.earliestBaron < minEarliestBaron) {
                    minEarliestBaron = p.earliestBaron;
                }

                update(healFromMap,           p.healFromMapSources || 0);
                update(controlWards,          p.controlWardsPlaced || 0);
                update(dragonTakedowns,       p.dragonTakedowns || 0);
                update(scuttleKills,          p.scuttleCrabKills || 0);
                update(stealthWards,          p.stealthWardsPlaced || 0);
                update(wardKills,             p.wardTakedowns || 0);
                update(dmgToTurrets,          p.damageDealtToTurrets || 0);
                update(selfMitigated,         p.damageSelfMitigated || 0);
                update(allyJungle,            p.totalAllyJungleMinionsKilled || 0);
                update(dmgToChamps,           p.totalDamageDealtToChampions || 0);
                update(enemyJungle,           p.totalEnemyJungleMinionsKilled || 0);
                update(healsOnTeam,           p.totalHealsOnTeammates || 0);
                update(killsNearTurret,       p.killsNearEnemyTurret || 0);
                update(maxCsAdv,              p.maxCsAdvantageOnLaneOpponent || 0);
                update(takedownsAfterLevel,   p.takedownsAfterGainingLevelAdvantage || 0);
                update(takedownsBeforeJungle, p.takedownsBeforeJungleMinionSpawn || 0);
                update(abilityUses,           p.abilityUses || 0);
            }

            if (batch.length < 100) break;
            idStart += 100;
        }

        const n = totalGames;
        console.log(`[Analysis] complete — ${n} games counted (${totalIdsFetched} IDs fecthed) for ${summonerName}#${summonerTag}`);

        const stat = (t, round = false) => {
            const avg = n > 0 ? (round ? Math.round(t.total / n) : +(t.total / n).toFixed(2)) : 0;
            return {
                avg,
                total: round ? Math.round(t.total)              : +t.total.toFixed(2),
                max:   t.max === -Infinity ? 0 : (round ? Math.round(t.max) : +t.max.toFixed(2)),
                min:   t.min === Infinity  ? 0 : (round ? Math.round(t.min) : +t.min.toFixed(2)),
            };
        };

        const mostPlayed = [...championStats.entries()]
            .sort((a, b) => b[1].games - a[1].games)
            .slice(0, 5)
            .map(([championName, s]) => {
                const minsPlayed = s.totalGameDuration / 60;
                return {
                    championName,
                    games:       s.games,
                    wins:        s.wins,
                    winRate:     Math.round((s.wins / s.games) * 100),
                    avgKills:    +(s.totalKills   / s.games).toFixed(1),
                    avgDeaths:   +(s.totalDeaths  / s.games).toFixed(1),
                    avgAssists:  +(s.totalAssists / s.games).toFixed(1),
                    avgCsPerMin: minsPlayed > 0 ? +(s.totalCs / minsPlayed).toFixed(1) : 0,
                    avgAiScore:  Math.round(s.totalAiScore / s.games),
                    timePlayed:  Math.round(s.totalGameDuration),
                };
            });

        return res.json({
            totalGames: n,
            wins,
            losses:  n - wins,
            winRate: n > 0 ? Math.round((wins / n) * 100) : 0,

            performance: {
                kills:       stat(kills),
                deaths:      stat(deaths),
                assists:     stat(assists),
                cs:          stat(cs),
                visionScore: stat(visionScore),
                aiScore:     stat(aiScore, true),
                kp:          stat(kp, true),
                gameLength:  stat(gameLength, true),
            },

            highlights: {
                firstBloods,
                forfeits,
                uniqueChampions:              uniqueChampions.size,
                epicMonsterSteals,
                flawlessAces,
                hadOpenNexus,
                perfectGames,
                takedownsInEnemyFountain,
                elderDragonKillsWithOpposingSoul,
                dancedWithRiftHerald,
                earliestBaron: minEarliestBaron === Infinity ? null : Math.round(minEarliestBaron),
            },

            mostPlayed,

            deepStats: {
                healFromMapSources:              stat(healFromMap, true),
                controlWardsPlaced:              stat(controlWards),
                dragonTakedowns:                 stat(dragonTakedowns),
                scuttleCrabKills:                stat(scuttleKills),
                stealthWardsPlaced:              stat(stealthWards),
                wardTakedowns:                   stat(wardKills),
                damageDealtToTurrets:            stat(dmgToTurrets, true),
                damageSelfMitigated:             stat(selfMitigated, true),
                allyJungleMinions:               stat(allyJungle),
                damageDealtToChampions:          stat(dmgToChamps, true),
                enemyJungleMinions:              stat(enemyJungle),
                healsOnTeammates:                stat(healsOnTeam, true),
                killsNearEnemyTurret:            stat(killsNearTurret),
                maxCsAdvantage:                  stat(maxCsAdv),
                takedownsAfterLevelAdvantage:    stat(takedownsAfterLevel),
                takedownsBeforeJungleMinionSpawn:stat(takedownsBeforeJungle),
                abilityUses:                     stat(abilityUses, true),
            },
        });
    } catch (error) {
        console.error("[Analysis] getAnalysisData error:", error);
        const status = error.statusCode || 500;
        return res.status(status).json({ error: error.message });
    }
}
