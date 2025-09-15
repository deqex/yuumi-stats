import { useState } from 'react';
import SummonerNameInput from '../../components/SummonerNameInput/SummonerNameInput';
import { getMatchIds } from '../../utils/getMatchIds';

export default function ChampionMastery() {
  const [summonerName, setSummonerName] = useState('');
  const [summonerTag, setSummonerTag] = useState('');
  const [region, setRegion] = useState('euw1');

  const handleClick = async () => {
    if (!summonerName || !summonerTag) return;

        try {
          const data = await getMatchIds(summonerName, summonerTag, region);
          console.log(data);
        } catch (error) {
          console.error(error);
        }
  };

  return (
    <>
      <h1>Match History</h1>
      <SummonerNameInput
        summonerName={summonerName}
        setSummonerName={setSummonerName}
        summonerTag={summonerTag}
        setSummonerTag={setSummonerTag}
        region={region}
        setRegion={setRegion}
        handleClick={handleClick}
      />

    </>
  )
}
