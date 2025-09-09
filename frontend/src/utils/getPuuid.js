const apikey = import.meta.env.VITE_RIOT_API_KEY;

if (!apikey) {
    throw new Error('Missing VITE_RIOT_API_KEY. Define it in your .env and restart the dev server.');
}

export async function getChampionMastery(summonerName, summonerTag, region) {
    let broadRegion;

    try { 
        const puuidRes = await fetch(`https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${summonerName}/${summonerTag}?api_key=${apikey}`);
        if (!puuidRes.ok) throw new Error('Failed to fetch summoner');
        const { puuid } = await puuidRes.json();

        if (region === "BR1", "LA1", "LA2", "NA1") {
            broadRegion = "americas";
        }
        
        if (region === "EUN1", "EUW1", "RU", "TR") {
            broadRegion = "europe";
        }

        if (region === "JP1", "KR", "ME1", "OC1", "SG2", "TW2", "VN2") {
            broadRegion = "asia";
        }

        return puuid;

    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}


