import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import SummonerNameInput from '../../components/SummonerNameInput/SummonerNameInput';
import { getMatchIds } from '../../utils/getMatchIds';
import { getDataFromMatchId } from '../../utils/getDataFromMatchId';
import dissectMatchData from '../../utils/dissectMatchData';
import MatchCard from '../../components/MatchCard/MatchCard';
export default function MatchHistory() {
  const [summonerName, setSummonerName] = useState('');
  const [summonerTag, setSummonerTag] = useState('');
  const [region, setRegion] = useState('euw1');
  const [matches, setMatches] = useState([]);
  const params = useParams();

  const fetchMatches = async (name, tag, regionCode) => {
    if (!name || !tag) return;

        try {
          const data = await getMatchIds(name, tag, regionCode);
          console.log(data);

          const collected = [];
          let limit = 0;
          for (const matchId of data) {
            if (limit > 2) break;
            limit++;
            
            const matchData = await getDataFromMatchId(matchId);
            const players = dissectMatchData(matchData);
            collected.push({ matchId, players });
            console.log('dissected players', players);
          }
          setMatches(collected);
        } catch (error) {
          console.error(error);
        }
  };

  const handleClick = async () => {
    fetchMatches(summonerName, summonerTag, region);
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
    // Auto-trigger when URL params populate state
    if (summonerName && summonerTag && region) {
      fetchMatches(summonerName, summonerTag, region);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summonerName, summonerTag, region]);

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
      <div>
        {matches.map((m) => (
          <MatchCard key={m.matchId} data={m.players} focusName={summonerName} />
        ))}
      </div>
    </>
  )
}
