import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getChampionMastery } from '../../utils/getChampionMastery';
import SummonerNameInput from '../../components/SummonerNameInput/SummonerNameInput';

export default function ChampionMastery() {
  const [summonerName, setSummonerName] = useState('');
  const [summonerTag, setSummonerTag] = useState('');
  const [region, setRegion] = useState('euw1');
  const [champions, setChampions] = useState([]);
  const params = useParams();

  const handleClick = async () => {
    if (!summonerName || !summonerTag) return;

    try {
      const data = await getChampionMastery(summonerName, summonerTag, region);
      setChampions(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!params || !params.region || !params.nameTag) return;
    const regionFromUrl = params.region;
    const [nameFromUrl, tagFromUrl] = (params.nameTag || '').split('-');
    setRegion(regionFromUrl);
    setSummonerName(nameFromUrl || '');
    setSummonerTag(tagFromUrl || '');
  }, [params]);

  useEffect(() => {
    if (summonerName && summonerTag && region) {
      handleClick();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summonerName, summonerTag, region]);

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
