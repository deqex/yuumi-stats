export function genScore(player, allParticipants, gameDuration, queueId) {
    const totalGold = allParticipants.reduce((s, pl) => s + (pl.goldEarned || 0), 0);
    const totalDmg  = allParticipants.reduce((s, pl) => s + (pl.totalDamageDealtToChampions || 0), 0);
    const dur = gameDuration || 1;
    const p = player;

    const kdaScore      = (((p.kills || 0) * 1.2 + (p.assists || 0) - (p.deaths || 0)) / dur) * 1200;
    const visionScore   = (p.visionScore || 0) * 400 / dur;
    const csScore       = Math.round((((p.totalMinionsKilled || 0) + (p.totalEnemyJungleMinionsKilled || 0) + (p.totalAllyJungleMinionsKilled || 0)) / dur) * 600) / 10;
    const enchanterScore = (((p.totalDamageShieldedOnTeammates || 0) + (p.totalHealsOnTeammates || 0)) * 1.3) / dur;
    const tankScore     = (((p.totalDamageTaken || 0) + (p.damageSelfMitigated || 0)) / dur) * 0.3;
    const ccScore       = (p.timeCCingOthers || 0) * 300 / dur;
    const goldScore     = totalGold > 0 ? ((((p.goldEarned || 0) / totalGold) * 100) - 5) * 2 : 0;
    const damageScore   = totalDmg  > 0 ? ((p.totalDamageDealtToChampions || 0) / totalDmg) * 100 * 1.6 : 0;
    const turretScore   = ((p.damageDealtToTurrets || 0) / dur);
    const kpScore       = (p.killParticipation ?? p.challenges?.killParticipation ?? 0) * 20;

    let total = kdaScore + visionScore + csScore + enchanterScore + tankScore + ccScore + goldScore + damageScore + turretScore + kpScore;
    if (queueId === 450) total *= 0.65;

    return {
        score: Math.round(total),
        breakdown: { kdaScore, visionScore, csScore, enchanterScore, tankScore, ccScore, goldScore, damageScore, turretScore, kpScore, total },
    };
}
