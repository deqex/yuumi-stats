export async function genBadges(players, gameInfo) {

    let highestGoldPlayer = null;
    let maxGold = 0;

    Object.values(players).forEach(player => {
        const goldEarned = player?.goldEarned ?? 0;
        if (goldEarned > maxGold) {
            maxGold = goldEarned;
            highestGoldPlayer = player;
        }
    });


    Object.values(players).forEach(p => {
        // Initialize badges array if it doesn't exist
        if (!p.badges) {
            p.badges = [];
        }

        // pentakills, quadrakills, triplekills, doublekills
        // carry badge for highest opScore on winning team
        // unlucky badge for highest opScore on losing team
        // stomped early / won lane
        // late bloomer
        // stopmped - enemy less than 30 opScore
        // if jungle - controlled objectives
        // comeback
        // splitpusher
        // toxic
        // ints the jungler



        // highest gold
        if (highestGoldPlayer && p.name === highestGoldPlayer.name) {
            p.badges.push("Richest");
        }

        //objectives stolen
        const objectivesStolen = p.objectivesStolen || 0;
        if (objectivesStolen > 0) {
            p.badges.push("Thief");
        }

        if (p.opScore < 30) {
            p.badges.push("Feeding");
        }




        p.badgeBreakdown = {
            objectivesStolen,
            highestGoldPlayer,
            
        };
    });

    return players;
}