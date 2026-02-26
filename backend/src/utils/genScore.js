export function genScore(player, allParticipants, gameDuration, queueId) {
    const totalGold = allParticipants.reduce((s, pl) => s + (pl.goldEarned || 0), 0);
    const totalDmg  = allParticipants.reduce((s, pl) => s + (pl.totalDamageDealtToChampions || 0), 0);
    const dur = gameDuration || 1;
    const p = player;

    let score = (((p.kills || 0) * 1.5 + (p.assists || 0) - (p.deaths || 0)) / dur) * 1200
        + ((p.visionScore || 0) * 400 / dur)
        + ((p.champExperience || 0) / dur)
        + (((p.totalDamageShieldedOnTeammates || 0) + (p.totalHealsOnTeammates || 0)) * 1.3 / dur)
        + (((p.totalDamageTaken || 0) + (p.damageSelfMitigated || 0)) / dur * 0.3)
        + ((p.timeCCingOthers || 0) * 300 / dur)
        + (totalGold > 0 ? ((p.goldEarned || 0) / totalGold) * 100 * 1.5 : 0)
        + (totalDmg  > 0 ? ((p.totalDamageDealtToChampions || 0) / totalDmg) * 100 * 1.6 : 0);

    if (queueId === 450) score *= 0.65;

    return Math.round(score);
}
