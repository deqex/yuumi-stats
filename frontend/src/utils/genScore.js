export async function genScore(players, gameInfo) {
    const gameDuration = gameInfo?.gameDuration || 1;

    // Optional total gold (not used in formula but may be useful later)
    // const totalGoldEarned = Object.values(players).reduce((acc, p) => acc + (p.goldEarned ?? 0), 0);

    Object.values(players).forEach(p => {
        const kdaScore = (p.kills ?? 0) * 1.5 + (p.assists ?? 0) - (p.deaths ?? 0);
        const damageScore = (p.totalDamageDealtToChampions ?? 0) / gameDuration;
        const visionScore = (p.visionScore ?? 0) * 500 / gameDuration;
        const csScore = ((p.champExperience ?? 0) / gameDuration) * 0.7;
        const enchanterScore = (((p.totalDamageShieldedOnTeammates ?? 0) + (p.totalHealsOnTeammates ?? 0)) * 4) / gameDuration;
        const tankScore = (((p.totalDamageTaken ?? 0) + (p.damageSelfMitigated ?? 0)) / gameDuration) * 0.3;
        const goldScore = ((p.goldEarned ?? 0) / gameDuration) * 2;

        const score = kdaScore + damageScore + visionScore + csScore + enchanterScore + tankScore + goldScore;
        p.opScore = score; // attach score to the player
        p.opBreakdown = {
            kdaScore,
            damageScore,
            visionScore,
            csScore,
            enchanterScore,
            tankScore,
            goldScore,
            total: score,
        };
    });

    return players; // return enriched players object
}
// pocet score za goldy = % goldu ze hry
