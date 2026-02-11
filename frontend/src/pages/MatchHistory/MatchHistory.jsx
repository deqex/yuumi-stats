import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './MatchHistory.css';
import { Navbar } from '../../components';
import { getMatchIds } from '../../utils/getMatchIds';
import { getDataFromMatchId } from '../../utils/getDataFromMatchId';
import dissectMatchData from '../../utils/dissectMatchData';
import dissectGeneralMatchData from '../../utils/dissectGeneralMatchData';
import { genScore } from '../../utils/genScore';
import { genBadges } from '../../utils/genBadges';

export default function MatchHistory() {
  const [summonerName, setSummonerName] = useState('');
  const [summonerTag, setSummonerTag] = useState('');
  const [region, setRegion] = useState('euw1');
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const params = useParams();
  const navigate = useNavigate();

  const fetchMatches = async (name, tag, regionCode) => {
    if (!name || !tag) return;
    try {
      const matchIds = await getMatchIds(name, tag, regionCode);
      const matchData = await Promise.all(
        matchIds.slice(0, 20).map(async (matchId) => {
          const data = await getDataFromMatchId(matchId);
          const players = dissectMatchData(data);
          const gameInfo = dissectGeneralMatchData(data);
          const scoredPlayers = await genScore(players, gameInfo);
          const playersWithBadges = await genBadges(scoredPlayers, gameInfo);
          return { matchId, players: playersWithBadges, gameInfo };
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

  const handleSearch = () => {
    if (!summonerName || !summonerTag) return;
    navigate(`/profile/${region}/${summonerName}-${summonerTag}/overview`);
  };

  const wins = matches.filter(m => {
    const players = Object.values(m.players);
    const focusPlayer = players.find(p => (p?.name || '').toLowerCase() === summonerName.toLowerCase());
    return focusPlayer?.win;
  }).length;

  const winRate = matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0;

  const SimplifiedMatchCard = ({ match }) => {
    const players = Object.values(match.players);
    const focusPlayer = players.find(p => (p?.name || '').toLowerCase() === summonerName.toLowerCase());
    
    if (!focusPlayer) return null;

    const blueTeam = players.filter(p => p.teamId === 100);
    const redTeam = players.filter(p => p.teamId === 200);

    const getChampionInitial = (name) => {
      if (!name) return '?';
      return name.substring(0, 1).toUpperCase();
    };

    const getChampionStatus = (level) => {
      if (level >= 18) return 'Legendary';
      if (level >= 15) return 'Godlike';
      if (level >= 12) return 'Favorable';
      return 'Normal';
    };

    const kda = focusPlayer.kills + focusPlayer.deaths + focusPlayer.assists;
    const kdaRatio = focusPlayer.deaths > 0 ? (focusPlayer.kills + focusPlayer.assists) / focusPlayer.deaths : focusPlayer.kills + focusPlayer.assists;

    return (
      <div key={match.matchId} className={`match-card ${focusPlayer.win ? 'win' : 'loss'}`}>
        {/* Left Section: Game Info */}
        <div className="match-left-section">
          <div className="match-info-text">
            <div className="game-mode">Ranked Solo</div>
            <div className="game-time">7 days ago</div>
            <div className="game-result">
              <span className={`result-status ${focusPlayer.win ? 'win' : 'loss'}`}>
                {focusPlayer.win ? 'Win' : 'Loss'}
              </span>
              <span className="result-duration">24:25</span>
            </div>
          </div>
        </div>

        {/* Runes Section */}
        <div className="match-runes-section">
          <div className="rune-slot"></div>
          <div className="rune-slot"></div>
          <div className="rune-slot"></div>
          <div className="rune-slot"></div>
        </div>

        {/* Champion Portrait */}
        <div className="champion-portrait"></div>

        <div className="game-champion-status">
        </div>

        {/* Items Section */}
        <div className="match-items-section">
          {[0, 1, 2, 3, 4, 5].map((idx) => (
            <div key={idx} className="item-icon"></div>
          ))}
        </div>

        {/* KDA Section */}
        <div className="match-kda-section">
          <div className="kda-value">{focusPlayer.kills} / {focusPlayer.deaths} / {focusPlayer.assists}</div>
          <div className="kda-ratio">{kdaRatio.toFixed(2)} KDA</div>
        </div>

        {/* AI Score & Position */}
        <div className="match-score-section">
          <div className="score-container">
            <div className="ai-score-badge">
              <span className="score-value">58</span>
              <span className="score-label">AI-Score</span>
            </div>
            <div className="position-badge">
              <span className="position-value">4th</span>
            </div>
          </div>
        </div>

        {/* Team Players */}
        <div className="match-players-section">
          <div className="team-column">
            {blueTeam.map((p) => (
              <div
                key={p?.puuid}
                className={`player-item ${(p?.name || '').toLowerCase() === summonerName.toLowerCase() ? 'focus' : ''}`}
              >
                <span className="player-initial">{getChampionInitial(p?.championName)}</span>
                <span className="player-name">{p?.name}</span>
              </div>
            ))}
          </div>
          <div className="team-column">
            {redTeam.map((p) => (
              <div
                key={p?.puuid}
                className={`player-item ${(p?.name || '').toLowerCase() === summonerName.toLowerCase() ? 'focus' : ''}`}
              >
                <span className="player-initial">{getChampionInitial(p?.championName)}</span>
                <span className="player-name">{p?.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Expand Arrow */}
        <div className="match-expand-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="match-history-container">
      <Navbar />
      <div className="match-history-content">
        {/* Search Section */}
        <div className="match-history-search">
          <div className="search-container-profile">
            <input
              type="text"
              placeholder="Summoner Name"
              value={summonerName}
              onChange={(e) => setSummonerName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="search-button-profile" onClick={handleSearch}>
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2.5"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>
        </div>

        {/* Player Profile Card */}
        {summonerName && matches.length > 0 && (
          <div className="player-profile-card">
            <div className="player-icon-section">
              <div className="player-main-icon">👤</div>
            </div>
            <div className="player-info">
              <div className="player-name">{summonerName}#{summonerTag}</div>
              <div className="player-rank">Grandmaster 852LP</div>
              <div className="player-stats">
                <div className="stat-item">
                  <div className="stat-value">{matches.length}</div>
                  <div className="stat-label">20 Games</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value" style={{ color: '#059669' }}>
                    {(matches.reduce((acc, m) => {
                      const players = Object.values(m.players);
                      const focusPlayer = players.find(p => (p?.name || '').toLowerCase() === summonerName.toLowerCase());
                      return acc + (focusPlayer?.kills ?? 0);
                    }, 0) / matches.length).toFixed(1)}
                  </div>
                  <div className="stat-label">KDA</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{winRate}%</div>
                  <div className="stat-label">WR</div>
                </div>
              </div>
            </div>
            <div className="performance-stats">
              <div className="stat-circle">
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <circle
                    cx="70"
                    cy="70"
                    r="60"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="12"
                  />
                  <circle
                    cx="70"
                    cy="70"
                    r="60"
                    fill="none"
                    stroke="#A78BFA"
                    strokeWidth="12"
                    strokeDasharray={`${(winRate / 100) * 2 * 3.14159 * 60} ${2 * 3.14159 * 60}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="stat-circle-text">
                  <div className="stat-circle-percent">{winRate}%</div>
                  <div className="stat-circle-label">Win Rate</div>
                </div>
              </div>
              <div className="performance-details">
                <div className="performance-row">
                  <div className="performance-label">20 Games</div>
                  <div className="performance-value">{wins}W {matches.length - wins}L</div>
                </div>
                <div className="performance-row">
                  <div className="performance-label">Avg KDA</div>
                  <div className="performance-value">6.8 / 3.1 / 8.1</div>
                </div>
                <div className="performance-row">
                  <div className="performance-label">Al-Score</div>
                  <div className="performance-value" style={{ color: '#A78BFA' }}>68%</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs and Matches Section */}
        {summonerName && matches.length > 0 && (
          <div className="matches-section">
            {/* Champions List - Left Sidebar */}
            <div className="champions-sidebar">
              <div className="champions-title">Most Played</div>
              <div className="champions-list">
                <div className="champion-item">
                  <div className="champion-icon">🎮</div>
                  <div className="champion-info">
                    <div className="champion-name">Champion 1</div>
                    <div className="champion-stats">53% · 12 games</div>
                  </div>
                </div>
                <div className="champion-item">
                  <div className="champion-icon">🎮</div>
                  <div className="champion-info">
                    <div className="champion-name">Champion 2</div>
                    <div className="champion-stats">67% · 8 games</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Matches - Right Content */}
            <div className="matches-content">
              <div className="match-tabs">
                <button
                  className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  All
                </button>
                <button
                  className={`tab-button ${activeTab === 'ranked' ? 'active' : ''}`}
                  onClick={() => setActiveTab('ranked')}
                >
                  Ranked Solo/Duo
                </button>
                <button
                  className={`tab-button ${activeTab === 'flex' ? 'active' : ''}`}
                  onClick={() => setActiveTab('flex')}
                >
                  Ranked Flex
                </button>
                <button
                  className={`tab-button ${activeTab === 'aram' ? 'active' : ''}`}
                  onClick={() => setActiveTab('aram')}
                >
                  ARAM
                </button>
              </div>

              {/* Match Cards */}
              <div className="matches-list">
                {matches.map(match => (
                  <SimplifiedMatchCard key={match.matchId} match={match} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
