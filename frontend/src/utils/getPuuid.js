const apikey = import.meta.env.VITE_RIOT_API_KEY;

if (!apikey) {
    throw new Error('Missing VITE_RIOT_API_KEY. Define it in your .env and restart the dev server.');
}

export async function getPuuid(summonerName, summonerTag, region) {
    let broadRegion;
    const upperRegion = region.toUpperCase();

    try { 
        if (upperRegion === "BR1" || upperRegion === "LA1" || upperRegion === "LA2" || upperRegion === "NA1") {
            broadRegion = "americas";
        }
        
        if (upperRegion === "EUN1" || upperRegion === "EUW1" || upperRegion === "RU" || upperRegion === "TR") {
            broadRegion = "europe";
        }

        if (upperRegion === "JP1" || upperRegion === "KR" || upperRegion === "ME1" || upperRegion === "OC1" || upperRegion === "SG2" || upperRegion === "TW2" || upperRegion === "VN2") {
            broadRegion = "asia";
        }

        const puuidRes = await fetch(`https://${broadRegion}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${summonerName}/${summonerTag}?api_key=${apikey}`);
        if (!puuidRes.ok) throw new Error('Failed to fetch summoner');
        const { puuid } = await puuidRes.json();

        return puuid;

    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}


