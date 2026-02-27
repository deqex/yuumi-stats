import { genScore } from './genScore.js';

export function genBadges(participants, gameDuration, queueId) {
    const withScores = participants.map(p => ({
        ...p,
        opScore: genScore(p, participants, gameDuration, queueId),
    }));

    const mvp = withScores.reduce(
        (best, p) => (p.opScore > (best?.opScore ?? -Infinity) ? p : best),
        null
    );

    const maxGold = Math.max(...withScores.map(p => p.goldEarned ?? 0));

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

        if (p.opScore < 35) badges.push('Useless');
        if (p.opScore > 90) badges.push('Unstoppable');
        if (p.opScore > 70 && p.win === false) badges.push('Unlucky');

        if (p.largestMultiKill === 2) badges.push('Doublekill');
        else if (p.largestMultiKill === 3) badges.push('Triple kill');
        else if (p.largestMultiKill === 4) badges.push('Quadra kill');
        else if (p.largestMultiKill === 5) badges.push('Pentakill');

        if ((p.controlWardsPlaced ?? 0) === 0) badges.push('No control wards');
        if ((p.hadOpenNexus ?? 0) > 0) badges.push('Close game');

        return { ...p, badges };
    });
}
