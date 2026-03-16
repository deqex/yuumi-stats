import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChampionMastery } from '../../utils/getChampionMastery';
import { Navbar } from '../../components';
import { useDDragon } from '../../context/DDragonContext';
import './ChampionMastery.css';

function formatPoints(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function getLevelClass(level) {
  if (level >= 7) return 'level-high';
  if (level >= 5) return 'level-mid';
  return 'level-low';
}

function formatLastPlayed(timestamp) {
  if (!timestamp) return 'Unknown';
  const now = Date.now();
  const diff = now - timestamp;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return '1 month ago';
  if (months <= 12) return `${months} months ago`;
  const years = Math.floor(days / 365);
  if (years === 1) return '1 year ago';
  return `${years} years ago`;
}

export default function ChampionMastery() {
  const DDRAGON_VERSION = useDDragon();
  const [summonerName, setSummonerName] = useState('');
  const [summonerTag, setSummonerTag] = useState('');
  const [region, setRegion] = useState('euw1');
  const [champions, setChampions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const hasFetched = useRef(false);
  const params = useParams();
  const navigate = useNavigate();

  const fetchMastery = async (name, tag, reg, forceUpdate = false) => {
    if (!name || !tag) return;
    setLoading(true);
    setError('');
    try {
      const data = await getChampionMastery(name, tag, reg, forceUpdate);
      if (!data || data.length === 0) {
        setError('No mastery data found.');
      }
      setChampions(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch mastery data.');
      setChampions([]);
    } finally {
      setLoading(false);
    }
  };

  // Parse URL params and auto-fetch
  useEffect(() => {
    if (!params?.region || !params?.nameTag) return;
    const [nameFromUrl, tagFromUrl] = params.nameTag.split('-');
    setRegion(params.region);
    setSummonerName(nameFromUrl);
    setSummonerTag(tagFromUrl);

    if (!hasFetched.current && nameFromUrl && tagFromUrl) {
      hasFetched.current = true;
      fetchMastery(nameFromUrl, tagFromUrl, params.region);
    }
  }, [params]);

  const handleUpdate = async () => {
    if (isUpdating || !summonerName || !summonerTag) return;
    setIsUpdating(true);
    try {
      await fetchMastery(summonerName, summonerTag, region, true);
    } catch (err) {
      console.error('Update failed:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Summary stats
  const totalPoints = champions.reduce((s, c) => s + (c.championPoints || 0), 0);
  const highestLevel = champions.length > 0 ? Math.max(...champions.map(c => c.championLevel)) : 0;
  const titlesUnlocked = champions.filter(c => c.championLevel >= 10).length;

  return (
    <div className="mastery-container">
      <Navbar />
      <div className="mastery-inner">
        {/* Profile navigation tabs (shared with MatchHistory) */}
        {summonerName && summonerTag && (
          <div className="profile-tabs">
            <button
              className="profile-tab-button"
              onClick={() => navigate(`/profile/${region}/${summonerName}-${summonerTag}/overview`)}
            >
              Overview
            </button>
            <button className="profile-tab-button active">
              Mastery
            </button>
            <button
              className="profile-tab-button"
              onClick={() => navigate(`/profile/${region}/${summonerName}-${summonerTag}/analysis`)}
            >
              Analysis
            </button>
            <button className="profile-tab-button disabled">
              Live game
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mastery-loading">
            <div className="mastery-loading-spinner" />
            Loading mastery data...
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="mastery-empty">{error}</div>
        )}

        {/* Content */}
        {!loading && champions.length > 0 && (
          <>
            {/* Header */}
            <div className="mastery-header">
              <div className="mastery-title">Champion Mastery</div>
              <div className="mastery-summoner">
                {summonerName}#{summonerTag}
                <button
                  className={`update-button${isUpdating ? ' updating' : ''}`}
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  style={{ marginLeft: '12px' }}
                >
                  {isUpdating ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>

            {/* Summary cards */}
            <div className="mastery-summary">
              <div className="mastery-summary-card">
                <div className="summary-label">Total Points</div>
                <div className="summary-value purple">{formatPoints(totalPoints)}</div>
              </div>
              <div className="mastery-summary-card">
                <div className="summary-label">Highest Level</div>
                <div className="summary-value">{highestLevel}</div>
              </div>
              <div className="mastery-summary-card">
                <div className="summary-label">Champion titles unlocked</div>
                <div className="summary-value">{titlesUnlocked}</div>
              </div>
              <div className="mastery-summary-card">
                <div className="summary-label">Champions</div>
                <div className="summary-value">{champions.length}</div>
              </div>
            </div>

            {/* Champion grid */}
            <div className="mastery-grid">
              {champions.map((champ, idx) => {
                const progress = champ.championPointsUntilNextLevel > 0
                  ? (champ.championPointsSinceLastLevel / (champ.championPointsSinceLastLevel + champ.championPointsUntilNextLevel)) * 100
                  : 100;
                const iconUrl = champ.championStringId
                  ? `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${champ.championStringId}.png`
                  : '';

                return (
                  <div className="mastery-card" key={champ.championId}>
                    <div className="mastery-rank">#{idx + 1}</div>
                    {iconUrl && (
                      <img
                        className="mastery-champ-icon"
                        src={iconUrl}
                        alt={champ.name}
                      />
                    )}
                    <div className="mastery-card-info">
                      <div className="mastery-champ-name">{champ.name}</div>
                      <div className="mastery-level-row">
                        <span className={`mastery-level-badge ${getLevelClass(champ.championLevel)}`}>
                          Lvl {champ.championLevel}
                        </span>
                        <span className="mastery-points">{formatPoints(champ.championPoints)} pts</span>
                      </div>
                      {champ.lastPlayTime > 0 && (
                        <div className="mastery-last-played">Last played {formatLastPlayed(champ.lastPlayTime)}</div>
                      )}
                      <div className="mastery-progress-wrapper">
                        <div className="mastery-progress-bar" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="mastery-progress-text">
                        {formatPoints(Math.max(0, champ.championPointsUntilNextLevel))} pts to next level
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Empty state when no URL params */}
        {!loading && !error && champions.length === 0 && !params?.nameTag && (
          <div className="mastery-empty">
            Search for a summoner to view their champion mastery.
          </div>
        )}
      </div>
    </div>
  );
}
