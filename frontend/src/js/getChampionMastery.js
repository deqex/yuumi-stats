
        async function getChampionMasteryData() {
            try {
                const res = await fetch('https://eun1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/sLgAc0Z41uylc6mafQ3lRaNbQAO0k4oawCWCXnHCOHKAAeBC6A4UHdP0TQPl2BGXgttkcpf8T07upA/top?count=10&api_key=')
                if (!res.ok) throw new Error('Failed to fetch champion mastery')
                const data = await res.json()
                return data
            } catch (error) {
                console.error(error)
                return []
            }
        }

        async function renderChampionMastery() {
            const champsUl = document.querySelector("#champs");
            champsUl.innerHTML = "";

            const champs = await getChampionMasteryData();
            for (const champ of champs) {
                champsUl.innerHTML += `<li>${champ.championId}</li>`
            }
        }

        window.addEventListener('DOMContentLoaded', () => {
            renderChampionMastery()
        })