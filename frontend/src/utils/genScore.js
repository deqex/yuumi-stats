export async function genScore(players, gameInfo) {
    const gameDuration = gameInfo?.gameDuration || 1;

    const totalGoldEarned = Object.values(players).reduce((acc, p) => acc + (p.goldEarned ?? 0), 0);
    const totalDamageAllPlayers = Object.values(players).reduce((acc, p) => acc + (p.totalDamageDealtToChampions ?? 0), 0);

    Object.values(players).forEach(p => {
        const kdaScore = (p.kills ?? 0) * 1.5 + (p.assists ?? 0) - (p.deaths ?? 0);
        
        const visionScore = (p.visionScore ?? 0) * 400 / gameDuration;
        const csScore = ((p.champExperience ?? 0) / gameDuration);
        const enchanterScore = (((p.totalDamageShieldedOnTeammates ?? 0) + (p.totalHealsOnTeammates ?? 0)) *1.3) / gameDuration;
        const tankScore = (((p.totalDamageTaken ?? 0) + (p.damageSelfMitigated ?? 0)) / gameDuration) * 0.2;
        const ccScore = (p.timeCCingOthers*300 ?? 0) / gameDuration;
        const goldScore = ((p.goldEarned ?? 0) / totalGoldEarned) * 100;
        const damageScore = (totalDamageAllPlayers ? ((p.totalDamageDealtToChampions ?? 0) / totalDamageAllPlayers) * 100 : 0)*1.5;

        const score = kdaScore + damageScore + visionScore + csScore + enchanterScore + tankScore + goldScore + ccScore ;
        p.opScore = score;
        p.opBreakdown = {
            kdaScore,
            damageScore,
            visionScore,
            csScore,
            enchanterScore,
            tankScore,
            goldScore,
            ccScore,
            total: score,
        };  
    });

    return players;
}
// pocet score za goldy = % goldu ze hry
//const goldScore = ((p.goldEarned ?? 0) / gameDuration) * 2;
//const damageScore = (p.totalDamageDealtToChampions ?? 0) / gameDuration;


//issues
//ccScore & nocturne