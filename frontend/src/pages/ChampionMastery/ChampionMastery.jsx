import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getChampionMastery } from '../../utils/getChampionMastery';
import SummonerNameInput from '../../components/SummonerNameInput/SummonerNameInput';

export default function ChampionMastery() {
  const [summonerName, setSummonerName] = useState('');
  const [summonerTag, setSummonerTag] = useState('');
  const [region, setRegion] = useState('euw1');
  const [champions, setChampions] = useState([]);
  const [loading, setLoading] = useState(false);
  const params = useParams();

  const handleClick = async () => {
    if (!summonerName || !summonerTag) return;
    setLoading(true);
    try {
      const data = await getChampionMastery(summonerName, summonerTag, region);
      setChampions(data);
    } catch (error) {
      console.error(error);
      setChampions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!params?.region || !params?.nameTag) return;
    const [nameFromUrl, tagFromUrl] = params.nameTag.split('-');
    setRegion(params.region);
    setSummonerName(nameFromUrl);
    setSummonerTag(tagFromUrl);
  }, [params]);

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

      {loading && <p>Loading...</p>}
      <ul>
        {champions.map((champ) => (
          <li key={champ.championId}>
            <strong>{champ.name}</strong> - Level {champ.championLevel} ({Math.max(0, champ.championPointsUntilNextLevel).toLocaleString()} points to next level)
          </li>
        ))}
      </ul>
    </>
  )
}
