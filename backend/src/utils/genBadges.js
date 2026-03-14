import { genScore } from './genScore.js';

export function genBadges(participants, gameDuration, queueId) {
    const withScores = participants.map(p => {
        const { score, breakdown } = genScore(p, participants, gameDuration, queueId);
        return { ...p, opScore: score, opBreakdown: breakdown };
    });

    const mvp = withScores.reduce(
        (best, p) => (p.opScore > (best?.opScore ?? -Infinity) ? p : best),
        null
    );

    const maxGold = Math.max(...withScores.map(p => p.goldEarned ?? 0));
    const maxTurretDmg = Math.max(...withScores.map(p => p.damageDealtToTurrets ?? 0));

    return withScores.map(p => {
        const badges = [];

        if (mvp && p.puuid === mvp.puuid) {
            badges.push('MVP');
        }

        if ((p.goldEarned ?? 0) === maxGold && maxGold > 0) {
            badges.push('Richest');
        }

        if ((p.objectivesStolen ?? 0) > 0) {
            badges.push('Objective Stealer');
        }

        if (p.opScore < 40) badges.push('Struggled');
        if (p.opScore > 90) badges.push('Unstoppable');
        if (p.opScore > 70 && p.win === false) badges.push('Unlucky');

        //w code
        if (p.largestMultiKill === 2) badges.push('Doublekill');
        else if (p.largestMultiKill === 3) badges.push('Triple kill');
        else if (p.largestMultiKill === 4) badges.push('Quadra kill');
        else if (p.largestMultiKill === 5) badges.push('Pentakill');

        if ((p.damageDealtToTurrets ?? 0) === maxTurretDmg && maxTurretDmg > 2000) badges.push('Turret Destroyer');
        if (p.firstBloodKill === true) badges.push('First Blood');
        if ((p.visionScore ?? 0) === 0) badges.push('Blind');
        if ((p.largestKillingSpree ?? 0) >= 3) badges.push('On Fire');
        if ((p.deaths ?? 0) === 0 && p.opScore > 50) badges.push('Unkillable');

        if ((p.controlWardsPlaced ?? 0) === 0) badges.push('No control wards');
        if ((p.hadOpenNexus ?? 0) > 0) badges.push('Close game');

        return { ...p, badges };
    });
}
