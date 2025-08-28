const apikey = "";

let region = "";
let summonerName = "";
let summonerTag = "";
let puuid = "";


async function getChampionMasteryData() {
    try {
        const res = await fetch(`https://${region}.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=10&api_key=${apikey}`)
        if (!res.ok) throw new Error('Failed to fetch champion mastery')
        const data = await res.json()
        return data
    } catch (error) {
        console.error(error)
        return []
    }
}

async function getChampionKeyToNameMap() {
    try {
        const res = await fetch('../backend/ddragon/champion.json') // maybe change from local file to api call
        if (!res.ok) throw new Error('Failed to load champion.json from DDragon')
        const json = await res.json()

        const map = {}
        let data = {}

        if (json && json.data) {
            data = json.data
        }

        for (const champId in data) {
            const champ = data[champId]
            map[champ.key] = champ.name
        }
        return map

    } catch (error) {
        console.error(error)
        return {}
    }
}

async function renderChampionMastery() {
    const champsUl = document.querySelector("#champs");
    champsUl.innerHTML = "";

    const [champs, keyToName] = await Promise.all([
        getChampionMasteryData(),
        getChampionKeyToNameMap()
    ])
    for (const champ of champs) {
        const name = keyToName[String(champ.championId)] || String(champ.championId)
        champsUl.innerHTML += `<li>${name}</li>`
    }
}

window.addEventListener('DOMContentLoaded', () => {
    

    const btn = document.getElementById('getChampionMastery')
    if (btn) {
        btn.addEventListener('click', () => {
            const nameInput = document.getElementById('summonerName')
            const regionSelect = document.getElementById('region')
            const summonerTagInput = document.getElementById('summonerTag')

            summonerName = nameInput.value
            region = regionSelect.value
            summonerTag = summonerTagInput.value
            console.log('Summoner Name:', summonerName, summonerTag, 'Region:', region)
            run()
        })

    }
})

async function getPuuid() {
    const res = await fetch(`https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${summonerName}/${summonerTag}?api_key=${apikey}`)
    if (!res.ok) throw new Error('Failed to fetch champion mastery')
    const data = await res.json()
    puuid = data.puuid;

}

async function run() {
    await getPuuid();
    renderChampionMastery()
}


