import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components';
import { useDDragon } from '../../context/DDragonContext';
import './Leaderboard.css';

const REGIONS = ['EUN1', 'EUW1', 'NA1', 'KR', 'BR1', 'TR1', 'JP1', 'OC1'];

function PlayerRow({ player, region }) {
  const DDRAGON = `https://ddragon.leagueoflegends.com/cdn/${useDDragon()}/img`;
  const navigate = useNavigate();
  const { rank, gameName, tagLine, leaguePoints, wins, losses, profileIconId,
          hotStreak, freshBlood, veteran, inactive, summonerLevel } = player;

  const totalGames = wins + losses;
  const seasonWr = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
  const isTop10 = rank <= 10;

  const rankCls =
    rank === 1 ? 'lb-rank rank-1' :
    rank === 2 ? 'lb-rank rank-2' :
    rank === 3 ? 'lb-rank rank-3' : 'lb-rank';

  const handleClick = () => {
    if (gameName && tagLine) navigate(`/profile/${region}/${gameName}-${tagLine}/overview`);
  };

  return (
    <tr className={`lb-tr ${isTop10 ? 'lb-tr-top10' : ''}`}>
      <td className="lb-td td-rank">
        <span className={rankCls}>#{rank}</span>
      </td>

      <td className="lb-td td-player">
        {profileIconId != null ? (
          <img
            className="lb-row-icon"
            src={`${DDRAGON}/profileicon/${profileIconId}.png`}
            alt=""
          />
        ) : (
          <div className="lb-row-icon lb-row-icon-placeholder" />
        )}
        <div className="lb-player-info">
          {gameName ? (
            <button className="lb-name-btn" onClick={handleClick} disabled={!tagLine}>
              <span className="lb-game-name">{gameName}</span>
              {tagLine && <span className="lb-tag-line">#{tagLine}</span>}
            </button>
          ) : (
            <span className="lb-game-name lb-name-loading">Loading…</span>
          )}
          <div className="lb-flags">
            {hotStreak  && <span className="lb-flag flag-hot">Hotstreak</span>}
            {freshBlood && <span className="lb-flag flag-new">New</span>}
          </div>
        </div>
      </td>

      <td className="lb-td td-lp">{leaguePoints.toLocaleString()}</td>

      <td className="lb-td td-season">
        <span className="lb-stat-wins">{wins}W</span>
        <span className="lb-stat-sep"> / </span>
        <span className="lb-stat-losses">{losses}L</span>
      </td>

      <td className={`lb-td td-wr ${seasonWr >= 50 ? 'wr-hi' : 'wr-lo'}`}>
        {seasonWr}%
      </td>

      <td className="lb-td td-level">
        {summonerLevel != null ? summonerLevel : '—'}
      </td>
    </tr>
  );
}

export default function Leaderboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [region, setRegion]   = useState('EUN1');

  const fetchLeaderboard = async (r) => {
    setLoading(true);
    setError('');
    setData(null);
    try {
      const res = await fetch(`/api/leaderboard?region=${r}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }
      setData(await res.json());
    } catch (err) {
      setError(err.message || 'Failed to load leaderboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(region);
  }, [region]);

  return (
    <div className="lb-container">
      <Navbar />
      <div className="lb-inner">

        <div className="lb-header">
          <div className="lb-title-group">
            <h1 className="lb-title">Challenger Leaderboard</h1>
            {data && <span className="lb-tier-badge">{data.tier}</span>}
          </div>
          <select
            className="lb-region-select"
            value={region}
            onChange={e => setRegion(e.target.value)}
          >
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {loading && (
          <div className="lb-loading">
            <div className="lb-spinner" />
            <span>Loading challenger data…</span>
          </div>
        )}

        {error && !loading && (
          <div className="lb-error">
            {error}
            <button className="lb-retry-btn" onClick={() => fetchLeaderboard(region)}>Retry</button>
          </div>
        )}

        {data && !loading && (
          <div className="lb-table-card">
            <div className="lb-table-scroll">
              <table className="lb-table">
                <thead>
                  <tr>
                    <th className="lb-th th-rank">#</th>
                    <th className="lb-th th-player">Player</th>
                    <th className="lb-th th-lp">LP</th>
                    <th className="lb-th th-season">W / L</th>
                    <th className="lb-th th-wr">WR</th>
                    <th className="lb-th th-level">Level</th>
                  </tr>
                </thead>
                <tbody>
                  {data.players.map(player => (
                    <PlayerRow key={player.rank} player={player} region={region} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
