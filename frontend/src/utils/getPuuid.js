const apikey = "RGAPI-3b615d8f-b95a-4b8f-a967-4a112d82c215";

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


