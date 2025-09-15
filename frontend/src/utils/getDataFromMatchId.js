const apikey = import.meta.env.VITE_RIOT_API_KEY;

if (!apikey) {
    throw new Error('Missing VITE_RIOT_API_KEY. Define it in your .env and restart the dev server.');
}

export async function getDataFromMatchId(matchId) {
    try {
        if (!matchId) throw new Error('Missing matchId');

        const matchIdDataRes = await fetch(` 
        https://europe.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${apikey}
            `);
        if (!matchIdDataRes.ok) throw new Error('Failed to fetch match data');
        const matchIdData = await matchIdDataRes.json();

        console.log('Match data:', matchIdData);
        return matchIdData;
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}


