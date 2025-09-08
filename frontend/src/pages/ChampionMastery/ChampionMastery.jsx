import { useState } from 'react';
import { getChampionMastery } from '../../utils/getChampionMastery';
import SummonerNameInput from '../../components/SummonerNameInput/SummonerNameInput';

export default function ChampionMastery() {
  const [summonerName, setSummonerName] = useState('');
  const [summonerTag, setSummonerTag] = useState('');
  const [region, setRegion] = useState('euw1');
  const [champions, setChampions] = useState([]);

  const handleClick = async () => {
    if (!summonerName || !summonerTag) return;

    try {
      const data = await getChampionMastery(summonerName, summonerTag, region);
      setChampions(data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <h1>Champion Mastery</h1>
      <SummonerNameInput
        summonerName={summonerName}
        setSummonerName={setSummonerName}
        summonerTag={summonerTag}
        setSummonerTag={setSummonerTag}
        region={region}
        setRegion={setRegion}
        handleClick={handleClick}
      />

      <ul>
        {champions.map((champion, index) => (
          <li key={index}>{champion.name}</li>
        ))}
      </ul>
    </>
  )
}
