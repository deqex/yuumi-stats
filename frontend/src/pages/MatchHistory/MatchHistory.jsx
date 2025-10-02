import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SummonerNameInput from '../../components/SummonerNameInput/SummonerNameInput';
import { getMatchIds } from '../../utils/getMatchIds';
import { getDataFromMatchId } from '../../utils/getDataFromMatchId';
import dissectMatchData from '../../utils/dissectMatchData';
import dissectGeneralMatchData from '../../utils/dissectGeneralMatchData';
import MatchCard from '../../components/MatchCard/MatchCard';
import { genScore } from '../../utils/genScore';

export default function MatchHistory() {
  const [summonerName, setSummonerName] = useState('');
  const [summonerTag, setSummonerTag] = useState('');
  const [region, setRegion] = useState('euw1');
  const [matches, setMatches] = useState([]);
  const params = useParams();
  const navigate = useNavigate();

  const fetchMatches = async (name, tag, regionCode) => {
    if (!name || !tag) return;
    try {
      const matchIds = await getMatchIds(name, tag, regionCode);
      const matchData = await Promise.all(
        matchIds.slice(0, 8).map(async (matchId) => {
          const data = await getDataFromMatchId(matchId);
          const players = dissectMatchData(data);
          const gameInfo = dissectGeneralMatchData(data);
          const scoredPlayers = await genScore(players, gameInfo);
          return { matchId, players: scoredPlayers };
        })
      );
      setMatches(matchData);

    } catch (error) {
      console.error('Failed to fetch matches:', error);
    }
  };

  useEffect(() => {
    if (params.region && params.nameTag) {
      const [name, tag] = params.nameTag.split('-');
      setRegion(params.region);
      setSummonerName(name || '');
      setSummonerTag(tag || '');
      fetchMatches(name, tag, params.region);
    }
  }, [params]);

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
        handleClick={() => {
          if (!summonerName || !summonerTag) return;
          navigate(`/profile/${region}/${summonerName}-${summonerTag}/overview`);
        }}
      />
      <div>
        {matches.map((match) => (
          <MatchCard
            key={match.matchId}
            data={match.players}
            focusName={summonerName}
          />
        ))}
      </div>
    </>
  );
}
