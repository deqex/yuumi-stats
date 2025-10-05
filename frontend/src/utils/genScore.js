export async function genScore(players, gameInfo) {
    let gameDuration = gameInfo?.gameDuration || 1;

    let totalGoldEarned = Object.values(players).reduce((acc, p) => acc + (p.goldEarned ?? 0), 0);
    let totalDamageAllPlayers = Object.values(players).reduce((acc, p) => acc + (p.totalDamageDealtToChampions ?? 0), 0);

    Object.values(players).forEach(p => {
        let kdaScore = (((p.kills ?? 0) * 1.5 + (p.assists ?? 0) - (p.deaths ?? 0)) / gameDuration)*1200;
        
        let visionScore = (p.visionScore ?? 0) * 400 / gameDuration;
        let csScore = ((p.champExperience ?? 0) / gameDuration);
        let enchanterScore = (((p.totalDamageShieldedOnTeammates ?? 0) + (p.totalHealsOnTeammates ?? 0)) *1.3) / gameDuration;
        let tankScore = (((p.totalDamageTaken ?? 0) + (p.damageSelfMitigated ?? 0)) / gameDuration) * 0.3;
        let ccScore = (p.timeCCingOthers*300 ?? 0) / gameDuration;
        let goldScore = (((p.goldEarned ?? 0) / totalGoldEarned) * 100)*1.5;
        let damageScore = (totalDamageAllPlayers ? ((p.totalDamageDealtToChampions ?? 0) / totalDamageAllPlayers) * 100 : 0)*1.6;



        //stupid code below
        if (p.championName === 'Nocturne') {
            ccScore = ccScore/4;
        }
        //end of stupid code

        let score = kdaScore + damageScore + visionScore + csScore + enchanterScore + tankScore + goldScore + ccScore ;
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
//let goldScore = ((p.goldEarned ?? 0) / gameDuration) * 2;
//let damageScore = (p.totalDamageDealtToChampions ?? 0) / gameDuration;


//issues
//ccScore & nocturne