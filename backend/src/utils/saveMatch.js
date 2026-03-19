import Match from "../models/Match.js";

export async function saveMatchToDb(matchData, region) {
    try {
        const { metadata, info } = matchData;
        if (!metadata?.matchId || !info?.participants) return;

        const season = new Date(info.gameCreation).getFullYear() - 2010;

        const participantSummaries = info.participants.map((p) => ({
            puuid:                              p.puuid,
            riotIdGameName:                     p.riotIdGameName ?? '',
            riotIdTagline:                      p.riotIdTagline ?? '',
            championId:                         p.championId,
            championName:                       p.championName,
            teamId:                             p.teamId,
            teamPosition:                       p.teamPosition ?? '',
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
            largestKillingSpree:                p.largestKillingSpree ?? 0,
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
            healFromMapSources:                 p.challenges?.healFromMapSources ?? 0,
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

        const regionCode = (region || info.platformId || "").toUpperCase();

        await Match.create({
            matchId: metadata.matchId,
            region: regionCode,
            gameCreation: new Date(info.gameCreation),
            gameDuration: info.gameDuration,
            queueId: info.queueId,
            season,
            participantSummaries,
        });

        console.log(`[DB] saved match ${metadata.matchId}`);
    } catch (err) {
        if (err.code !== 11000) {
            console.error("[saveMatch] error:", err.message);
        }
    }
}
