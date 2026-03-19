import { genScore } from './genScore.js';

function badge(name, description, count) {
    return count !== undefined
        ? { badge: name, description, count }
        : { badge: name, description };
}

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

        if (mvp && p.puuid === mvp.puuid) badges.push('MVP');
        if ((p.goldEarned ?? 0) === maxGold && maxGold > 0) badges.push('Richest');
        if ((p.objectivesStolen ?? 0) > 0) badges.push('Objective Stealer');
        if (p.opScore < 40) badges.push('Struggled');
        if (p.opScore > 90) badges.push('Unstoppable');
        if (p.opScore > 65 && p.win === false) badges.push('Unlucky');

        if (p.largestMultiKill === 2) badges.push('Doublekill');
        else if (p.largestMultiKill === 3) badges.push('Triple kill');
        else if (p.largestMultiKill === 4) badges.push('Quadra kill');
        else if (p.largestMultiKill === 5) badges.push('Pentakill');

        if ((p.damageDealtToTurrets ?? 0) === maxTurretDmg && maxTurretDmg > 2000) badges.push('Turret Destroyer');
        if (p.firstBloodKill === true) badges.push('First Blood');
        if ((p.visionScore ?? 0) === 0) badges.push('Blind');
        if ((p.largestKillingSpree ?? 0) >= 3) badges.push('On Fire');
        if ((p.deaths ?? 0) === 0 && p.opScore > 45) badges.push('Unkillable');
        if ((p.controlWardsPlaced ?? 0) === 0) badges.push('No control wards');
        if ((p.hadOpenNexus ?? 0) > 0) badges.push('Close game');

        return { ...p, badges };
    });
}

export function genAggregateBadges(stats) {
    if (!stats) return [];
    const { avgAiScore, csPerMin, winRate, kda, avgKP, avgDeaths, gamesPlayed: n } = stats;
    const badges = [];

    if (avgAiScore >= 80) badges.push(badge('Dominant', 'Consistently posting elite scores', n));
    else if (avgAiScore >= 65) badges.push(badge('Consistent', 'Reliable above-average performer recently', n));
    else if (avgAiScore <= 40) badges.push(badge('Struggling', 'Has been having a tough time recently', n));

    if (csPerMin != null) {
        if (csPerMin >= 9.0)      badges.push(badge('CS God',      'Farming at an elite level', n));
        else if (csPerMin >= 6.5) badges.push(badge('Good Farmer', 'Strong lasthitting across recent games', n));
        else if (csPerMin <= 5)   badges.push(badge('Poor Farmer', 'Consistently low CS numbers', n));
    }

    if (winRate >= 70) badges.push(badge('Popping off', 'Winning most of their recent games', n));
    else if (winRate <= 40) badges.push(badge('Off form', 'Struggling to find wins lately', n));

    if (kda >= 4.0) badges.push(badge('Calculated', 'Averages high KDA', n));
    if (avgKP >= 65) badges.push(badge('Active', 'Always involved when kills happen', n));

    if (avgDeaths <= 1.5) badges.push(badge('Careful', 'Consistently avoids dying', n));
    else if (avgDeaths >= 8) badges.push(badge('Reckless', 'Tends to die a lot', n));

    return badges;
}

export function genLiveGameBadges(participants, gameDuration, queueId) {
    const withScores = participants.map(p => {
        const { score, breakdown } = genScore(p, participants, gameDuration, queueId);
        return { ...p, opScore: score, opBreakdown: breakdown };
    });

    return withScores.map(p => {
        const badges = [];

        if ((p.deaths ?? 0) === 0 && p.opScore > 45) badges.push(badge('Unkillable', 'Went deathless this game'));
        if (p.firstBloodKill === true) badges.push(badge('Bloodthirsty', 'Drew first blood'));
        if ((p.visionScore ?? 0) < 5) badges.push(badge('Blind', 'Averages low vision score'));

        return { ...p, badges };
    });
}
