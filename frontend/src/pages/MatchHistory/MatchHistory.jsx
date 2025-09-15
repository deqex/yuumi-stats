import { useState } from 'react';
import SummonerNameInput from '../../components/SummonerNameInput/SummonerNameInput';
import { getMatchIds } from '../../utils/getMatchIds';
import { getDataFromMatchId } from '../../utils/getDataFromMatchId';
let matchData;
let limit = 0;

export default function ChampionMastery() {
  const [summonerName, setSummonerName] = useState('');
  const [summonerTag, setSummonerTag] = useState('');
  const [region, setRegion] = useState('euw1');

  const handleClick = async () => {
    if (!summonerName || !summonerTag) return;

        try {
          const data = await getMatchIds(summonerName, summonerTag, region);
          console.log(data);

          for (const matchId of data) {
            if (limit>1) break;
            limit++;
            console.log(matchId);
            matchData = await getDataFromMatchId(matchId);
          }
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
