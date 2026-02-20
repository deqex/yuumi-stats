export async function genBadges(players, gameInfo) {

    let highestGoldPlayer = null;
    let maxGold = 0;

    console.log(players[2]);

    Object.values(players).forEach(player => {
        const goldEarned = player?.goldEarned ?? 0;
        if (goldEarned > maxGold) {
            maxGold = goldEarned;
            highestGoldPlayer = player;
        }
    });


    Object.values(players).forEach(p => {
        
        if (!p.badges) {
            p.badges = [];
        }

        // pentakills, quadrakills, triplekills, doublekills
        // stomped early / won lane
        // late bloomer
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
        const objectivesStolen = p.objectivesStolen || 0; //why did i do that
        if (objectivesStolen > 0) {
            p.badges.push("Objective Stealer");
        }

        
        if (p.opScore < 30) {
            p.badges.push("Useless");
        }

        if (p.opScore > 100) {
            p.badges.push("Unstoppable");
        }

        if (p.opScore > 70 && p.win === false) {
            p.badges.push("Unlucky")
        }

        //ew 
        if (p.largestMultiKill === 2) {
            p.badges.push("Doublekill")
        } else if (p.largestMultiKill === 3) {
            p.badges.push("Triple kill")
        } else if (p.largestMultiKill === 4) {
            p.badges.push("Quadra kill")
        } else if (p.largestMultiKill === 5) {
            p.badges.push("Pentakill")
        }

        if (p.controlWardsPlaced === 0) {
            p.badges.push("No control wards")
        }

        if (p.hadOpenNexus > 0) {
            p.badges.push("Close game")
        }


        p.badgeBreakdown = {
            objectivesStolen,
            highestGoldPlayer,
            
        };
    });

    return players;
}