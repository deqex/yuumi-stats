import { useState } from 'react';
import { getChampionMastery } from '../../utils/getChampionMastery';

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
    <input 
      type="text" 
      value={summonerName}
      onChange={(e) => setSummonerName(e.target.value)}
      placeholder="Summoner Name"
    />
    <input 
      type="text" 
      value={summonerTag}
      onChange={(e) => setSummonerTag(e.target.value)}
      placeholder="Tagline"
    />
    <select 
      value={region} 
      onChange={(e) => setRegion(e.target.value)}
    >
        <option value="eun1">EUNE</option>
        <option value="euw1">EUW</option>
        <option value="na1">NA</option>
        <option value="kr">KR</option>
      </select>
    <button onClick={handleClick}>Get Champion Mastery</button>
    
    <ul>
      {champions.map((champion, index) => (
        <li key={index}>{champion.name}</li>
      ))}
    </ul>
    </>
  )
}
