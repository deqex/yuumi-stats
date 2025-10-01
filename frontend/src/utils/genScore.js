import dissectMatchData from './dissectMatchData';


export async function genScore(players, gameInfo) {
    let gameDuration = gameInfo.gameDuration;
    console.log(" gameDuration", gameDuration);

    Object.values(players).forEach(p => {

        let kdaScore = (p.kills ?? 0) * 1.5 + (p.assists ?? 0) - (p.deaths ?? 0);
        let damageScore = (p.totalDamageDealtToChampions ?? 0) / gameDuration;
        let visionScore = (p.visionScore ?? 0)*500 / gameDuration;
        let csScore = ((p.champExperience ?? 0) / gameDuration)*0.7; 
        let enchanterScore = ((p.totalDamageShieldedOnTeammates ?? 0) + (p.totalHealsOnTeammates ?? 0)) * 4 / gameDuration;
        let tankScore = (((p.totalDamageTaken ?? 0) + (p.damageSelfMitigated ?? 0)) / gameDuration)*0.3;
        let goldScore = ((p.goldEarned ?? 0) / gameDuration)*2;

        let score = kdaScore + damageScore + visionScore + csScore + enchanterScore + tankScore + goldScore;
        console.log("gen", p.riotIdGameName, Math.round(score)); 
        console.log("gen", p.riotIdGameName, Math.round(kdaScore), Math.round(damageScore), Math.round(visionScore), Math.round(csScore), Math.round(enchanterScore), Math.round(tankScore), Math.round(goldScore)); 
    });
    return players;
}
//pocet score za goldy = % goldu ze hry
