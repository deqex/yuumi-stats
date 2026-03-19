import { useEffect, useState } from 'react';
import { timeSince } from '../../utils/timeSince';
import { useParams, useNavigate } from 'react-router-dom';
import { useDDragon } from '../../context/DDragonContext';
import './MatchHistory.css';
import { Navbar } from '../../components';
import {
  SUMMONER_SPELLS, RUNE_ICONS, RUNE_TREE_ICONS, RANK_ICON_MAP,
  DD_RUNE_ICON_BASE,
} from '../../utils/gameConstants';
import { getMatchIds } from '../../utils/getMatchIds';
import { getDataFromMatchId } from '../../utils/getDataFromMatchId';
import dissectMatchData from '../../utils/dissectMatchData';
import dissectGeneralMatchData from '../../utils/dissectGeneralMatchData';
import { getProfile } from '../../utils/getProfile';
import MatchDetail from '../../components/MatchDetail/MatchDetail';

const titleCaseTier = (tier) => {
  if (!tier) return '';
  return tier
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const formatRankLabel = (entry) => {
  if (!entry) return 'Unranked';
  return `${titleCaseTier(entry.tier)} ${entry.rank} ${entry.leaguePoints} LP`;
};

export default function MatchHistory() {
  const ddVersion = useDDragon();
  const [summonerName, setSummonerName] = useState('');
  const [summonerTag, setSummonerTag] = useState('');
  const [region, setRegion] = useState('euw1');
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [summonerData, setSummonerData] = useState(null);
  const [rankEntries, setRankEntries] = useState([]);
  const [expandedMatchId, setExpandedMatchId] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [matchOffset, setMatchOffset] = useState(5);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [queuesMap, setQueuesMap] = useState({});
  const params = useParams();
  const navigate = useNavigate();

  const fetchMatches = async (name, tag, regionCode, forceUpdate = false) => {
    if (!name || !tag) return;
    try {
      const { matchIds, lastApiCallAt } = await getMatchIds(name, tag, regionCode, forceUpdate, 0, 5);
      const existingIds = forceUpdate ? new Set(matches.map(m => m.matchId)) : new Set();
      const newIds = matchIds.filter(id => !existingIds.has(id));
      // Process sequentially to avoid hitting Riot API rate limits
      const newMatchData = [];
      for (const matchId of newIds) {
        try {
          const data = await getDataFromMatchId(matchId, regionCode, false);
          if (!data || !data.info) continue; // skip failed fetches
          const players = dissectMatchData(data);
          const gameInfo = dissectGeneralMatchData(data);
          newMatchData.push({ matchId, players, gameInfo });
        } catch (e) {
          console.warn(`Skipping match ${matchId}:`, e);
        }
      }
      if (forceUpdate) {
        setMatches(prev => [...newMatchData, ...prev]);
      } else {
        setMatches(newMatchData);
      }
      if (lastApiCallAt) setLastUpdated(lastApiCallAt);
      setMatchOffset(5);
      setHasMore(true);
    } catch (error) {
      console.error('Failed to fetch matches:', error);
    }
  };

  const TAB_QUEUE_MAP = { ranked: 420, flex: 440, aram: 450 };

  const loadMoreMatches = async () => {
    if (isLoadingMore || !hasMore || !summonerName || !summonerTag) return;
    setIsLoadingMore(true);
    try {
      const currentOffset = matchOffset;
      const queueFilter = TAB_QUEUE_MAP[activeTab] ?? null;
      const { matchIds: newMatchIds } = await getMatchIds(summonerName, summonerTag, region, false, currentOffset, 20, queueFilter);
      if (newMatchIds.length === 0) {
        setHasMore(false);
        return;
      }
      const existingIds = new Set(matches.map(m => m.matchId));
      const newMatchData = [];
      for (const matchId of newMatchIds) {
        if (existingIds.has(matchId)) continue;
        try {
          const data = await getDataFromMatchId(matchId, region, false);
          if (!data || !data.info) continue;
          const players = dissectMatchData(data);
          const gameInfo = dissectGeneralMatchData(data);
          newMatchData.push({ matchId, players, gameInfo });
        } catch (e) {
          console.warn(`Skipping match ${matchId}:`, e);
        }
      }
      setMatches(prev => [...prev, ...newMatchData]);
      const newOffset = currentOffset + newMatchIds.length;
      setMatchOffset(newOffset);
      if (newMatchIds.length < 20) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to load more matches:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetch('/api/matches/queues')
      .then(r => r.json())
      .then(data => {
        const map = {};
        for (const q of data) {
          let name = q.description || q.map || 'Unknown';
          name = name.replace(/^\d+v\d+\s+/, '').replace(/\s+games$/i, '');
          map[q.queueId] = name;
        }
        setQueuesMap(map);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (params.region && params.nameTag) {
      const lastDash = params.nameTag.lastIndexOf('-');
      const name = lastDash > 0 ? params.nameTag.slice(0, lastDash) : params.nameTag;
      const tag = lastDash > 0 ? params.nameTag.slice(lastDash + 1) : '';
      setRegion(params.region);
      setSummonerName(name || '');
      setSummonerTag(tag || '');
      fetchMatches(name, tag, params.region);
      getProfile(name, tag, params.region).then(profile => {
        if (profile) {
          setSummonerData({ profileIconId: profile.icon, summonerLevel: profile.summonerLevel });
          setRankEntries(profile.ranks || []);
        }
      });
    }
  }, [params]);

  const handleUpdate = async () => {
    if (isUpdating || !summonerName || !summonerTag) return;
    setIsUpdating(true);
    try {
      const profilePromise = getProfile(summonerName, summonerTag, region, true).then(profile => {
        if (profile) {
          setSummonerData({ profileIconId: profile.icon, summonerLevel: profile.summonerLevel });
          setRankEntries(profile.ranks || []);
        }
      });
      const matchesPromise = fetchMatches(summonerName, summonerTag, region, true);
      await Promise.all([profilePromise, matchesPromise]);
    } catch (err) {
      console.error('Update failed:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const wins = matches.filter(m => {
    const players = Object.values(m.players);
    const focusPlayer = players.find(p => (p?.name || '').toLowerCase() === summonerName.toLowerCase());
    return focusPlayer?.win;
  }).length;

  const winRate = matches.length > 0 ? Math.round((wins / matches.length) * 100) : 0;

  const profileStats = (() => {
    let totalKills = 0, totalDeaths = 0, totalAssists = 0;
    let totalOpScore = 0, opScoreCount = 0;
    let totalCS = 0, totalDurationMinutes = 0, csGameCount = 0;

    for (const m of matches) {
      const players = Object.values(m.players);
      const fp = players.find(p => (p?.name || '').toLowerCase() === summonerName.toLowerCase());
      if (!fp) continue;

      totalKills   += fp.kills   || 0;
      totalDeaths  += fp.deaths  || 0;
      totalAssists += fp.assists || 0;

      if (typeof fp.opScore === 'number') {
        totalOpScore += fp.opScore;
        opScoreCount++;
      }

      const isSupport = (fp.individualPosition || '').toUpperCase() === 'UTILITY';
      if (!isSupport) {
        const cs = (fp.totalMinionsKilled || 0) + (fp.neutralMinionsKilled || 0);
        const durationSecs = fp.timePlayed || m.gameInfo?.gameDuration || 0;
        if (durationSecs > 0) {
          totalCS += cs;
          totalDurationMinutes += durationSecs / 60;
          csGameCount++;
        }
      }
    }

    const n = matches.length;
    const avgKdaRatio = n > 0
      ? (totalDeaths > 0 ? ((totalKills + totalAssists) / totalDeaths).toFixed(2) : 'Perfect')
      : '—';
    return {
      avgKills:    n > 0 ? (totalKills   / n).toFixed(1) : '—',
      avgDeaths:   n > 0 ? (totalDeaths  / n).toFixed(1) : '—',
      avgAssists:  n > 0 ? (totalAssists / n).toFixed(1) : '—',
      avgKdaRatio,
      avgOpScore:  opScoreCount > 0 ? Math.round(totalOpScore / opScoreCount) : null,
      avgCsPerMin: csGameCount  > 0 ? (totalCS / totalDurationMinutes).toFixed(1) : null,
    };
  })();

  const mostPlayedChampions = (() => {
    const champMap = {};
    const filtered = matches.filter(m => {
      const qid = m.gameInfo?.queueId;
      if (activeTab === 'ranked') return qid === 420;
      if (activeTab === 'flex')   return qid === 440;
      if (activeTab === 'aram')   return qid === 450;
      return true;
    });
    for (const m of filtered) {
      const players = Object.values(m.players);
      const fp = players.find(p => (p?.name || '').toLowerCase() === summonerName.toLowerCase());
      if (!fp?.championName) continue;
      const key = fp.championName;
      if (!champMap[key]) champMap[key] = { championName: key, games: 0, wins: 0, kills: 0, deaths: 0, assists: 0 };
      champMap[key].games++;
      if (fp.win) champMap[key].wins++;
      champMap[key].kills   += fp.kills   || 0;
      champMap[key].deaths  += fp.deaths  || 0;
      champMap[key].assists += fp.assists || 0;
    }
    return Object.values(champMap)
      .sort((a, b) => b.games - a.games)
      .slice(0, 5);
  })();

  const DD_CHAMPION_ICON_BASE = `https://ddragon.leagueoflegends.com/cdn/${ddVersion}/img/champion`;
  const DD_ITEM_ICON_BASE = `https://ddragon.leagueoflegends.com/cdn/${ddVersion}/img/item`;
  const DD_SUMMONER_ICON_BASE = `https://ddragon.leagueoflegends.com/cdn/${ddVersion}/img/spell`;
  const DD_PROFILE_ICON_BASE = `https://ddragon.leagueoflegends.com/cdn/${ddVersion}/img/profileicon`;

  const profileIconId = summonerData?.profileIconId ?? 588;
  const soloRank = rankEntries.find(entry => entry.queueType === 'RANKED_SOLO_5x5');
  const rankSections = [
    { label: 'Ranked Solo/Duo', entry: soloRank },
  ];

  const getRankIcon = (entry) => {
    if (!entry?.tier) return null;
    return RANK_ICON_MAP[entry.tier.toUpperCase()] || null;
  };

  const BADGE_DESCRIPTIONS = {
    'MVP':               'Best player in the lobby',
    'Richest':           'Earned the most gold in the game',
    'Objective Stealer': 'Stole one or more objectives',
    'Struggled':         'Had a tough game',
    'Unstoppable':       'Showed an outstanding performance',
    'Unlucky':           'Displayed an amazing performance but still lost',
    'Doublekill':        'Got a doublekill',
    'Triple kill':       'Got a triple kill',
    'Quadra kill':       'Got a quadra kill',
    'Pentakill':         'Got a pentakill',
    'Turret Destroyer':  'Dealt the most turret damage in the game',
    'First Blood':       'Got the first kill of the game',
    'Blind':             'Had 0 vision score, shame on you',
    'On Fire':           'Had 3 or more killing sprees',
    'Unkillable':        'Had 0 deaths, Rekkles would be proud',
    'No control wards':  'Did not buy a single control ward',
    'Close game':        'Won with an open nexus',
  };

  const CHAMPION_NAME_FIXES = { FiddleSticks: 'Fiddlesticks' };
  const getChampionIconUrl = (name) => {
    if (!name) return null;
    const id = String(name).replace(/[^A-Za-z]/g, '');
    if (!id) return null;
    return `${DD_CHAMPION_ICON_BASE}/${CHAMPION_NAME_FIXES[id] || id}.png`;
  };

  const getItemIconUrl = (id) => {
    if (!id) return null;
    return `${DD_ITEM_ICON_BASE}/${id}.png`;
  };

  const getRuneIconUrl = (id) => {
    const rel = id != null ? RUNE_ICONS[id] : null;
    if (!rel) return null;
    return `${DD_RUNE_ICON_BASE}/${rel}`;
  };

  const getSummonerIconUrl = (id) => {
    const key = id != null ? SUMMONER_SPELLS[id] : null;
    if (!key) return null;
    return `${DD_SUMMONER_ICON_BASE}/${key}.png`;
  };

  const SimplifiedMatchCard = ({ match }) => {
    const players = Object.values(match.players);
    const focusPlayer = players.find(p => (p?.name || '').toLowerCase() === summonerName.toLowerCase());
    const normalize = (s) => {
      if (!s) return '';
      try {
        return String(s).normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
      } catch (e) {
        return String(s).toLowerCase().replace(/[^a-z0-9]/gi, '');
      }
    };

    if (!focusPlayer) return null;

    const blueTeam = players.filter(p => p.teamId === 100);
    const redTeam = players.filter(p => p.teamId === 200);

    const getChampionInitial = (name) => {
      if (!name) return '?';
      return name.substring(0, 1).toUpperCase();
    };

    const kdaRatio = focusPlayer.deaths > 0
      ? (focusPlayer.kills + focusPlayer.assists) / focusPlayer.deaths
      : focusPlayer.kills + focusPlayer.assists;

    // CS, CS per minute, and Kill Participation
    const totalCs = (focusPlayer.totalMinionsKilled || 0) + (focusPlayer.neutralMinionsKilled || 0);

    let durationSeconds = 0;
    if (typeof focusPlayer.timePlayed === 'number') {
      durationSeconds = focusPlayer.timePlayed;
    } else if (match.gameInfo && typeof match.gameInfo.gameDuration === 'number') {
      durationSeconds = match.gameInfo.gameDuration;
    }

    const minutesPlayed = durationSeconds > 0 ? durationSeconds / 60 : 0;
    const csPerMin = minutesPlayed > 0 ? totalCs / minutesPlayed : 0;

    // Use AI score computed in genScore.js (opScore) and rank among all players
    const focusAiScore = typeof focusPlayer.opScore === 'number' ? focusPlayer.opScore : null;
    const roundedAiScore = focusAiScore !== null ? Math.round(focusAiScore) : null;

    const scoredPlayers = players.filter(p => typeof p.opScore === 'number');
    const sortedByScore = [...scoredPlayers].sort((a, b) => b.opScore - a.opScore);
    const placementIndex = focusAiScore !== null
      ? sortedByScore.findIndex(p => p.puuid === focusPlayer.puuid)
      : -1;

    const formatPlacement = (pos) => {
      if (pos <= 0) return '-';
      if (pos === 1) return '1st';
      if (pos === 2) return '2nd';
      if (pos === 3) return '3rd';
      return `${pos}th`;
    };

    const placementLabel = placementIndex >= 0 ? formatPlacement(placementIndex + 1) : '-';

    const focusChampionIcon = getChampionIconUrl(focusPlayer?.championName);

    const primaryStyle = focusPlayer?.perks?.styles?.find(s => s.description === 'primaryStyle')
      || focusPlayer?.perks?.styles?.[0];
    const primaryKeystoneId = primaryStyle?.selections?.[0]?.perk;
    const primaryRuneIcon = getRuneIconUrl(primaryKeystoneId);

    const secondaryStyle = focusPlayer?.perks?.styles?.find(s => s.description === 'subStyle')
      || focusPlayer?.perks?.styles?.[1];
    const secondaryRuneTreeIcon = secondaryStyle?.style ? RUNE_TREE_ICONS[secondaryStyle.style] : null;

    const summonerIcons = [
      getSummonerIconUrl(focusPlayer.summoner1Id),
      getSummonerIconUrl(focusPlayer.summoner2Id),
    ];

    const itemSlots = [
      focusPlayer.item0,
      focusPlayer.item1,
      focusPlayer.item2,
      focusPlayer.item3,
      focusPlayer.item4,
      focusPlayer.item5,
    ];

    const trinketItem = focusPlayer.item6; // vision / trinket slot

    const actualQuestItemId = focusPlayer.roleBoundItem || focusPlayer.roleQuestId || 0;

    const displayItems = actualQuestItemId
      ? itemSlots.filter(id => id !== actualQuestItemId)
      : itemSlots;

    // Format game duration from seconds
    const durationMin = Math.floor(durationSeconds / 60);
    const durationSec = durationSeconds % 60;
    const durationStr = `${durationMin}:${String(durationSec).padStart(2, '0')}`;

    // Calculate how long ago the match was
    const gameCreation = match.gameInfo?.gameCreation;
    const timeAgoStr = (() => {
      if (!gameCreation) return '';
      const diffMs = Date.now() - gameCreation;
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDay = Math.floor(diffHr / 24);
      if (diffDay < 30) return `${diffDay}d ago`;
      const diffMonth = Math.floor(diffDay / 30);
      return `${diffMonth}mo ago`;
    })();

    const queueName = queuesMap[match.gameInfo?.queueId] || 'Normal';

    const isExpanded = expandedMatchId === match.matchId;

    return (
      <div key={match.matchId} className="match-card-wrapper">
      <div
        className={`match-card ${focusPlayer.win ? 'win' : 'loss'} ${isExpanded ? 'expanded' : ''}`}
        onClick={() => setExpandedMatchId(isExpanded ? null : match.matchId)}
      >
        {/* Left Section: Game Info */}
        <div className="match-left-section">
          <div className="match-info-text">
            <div className="game-mode">{queueName}</div>
            <div className="game-time">{timeAgoStr}</div>
            <div className="game-result">
              <span className={`result-status ${focusPlayer.win ? 'win' : 'loss'}`}>
                {focusPlayer.win ? 'Win' : 'Loss'}
              </span>
              <span className="result-duration">{durationStr}</span>
            </div>
          </div>
        </div>

        {/* Runes (primary + secondary stacked) */}
        <div className="match-runes-stack">
          {[primaryRuneIcon, secondaryRuneTreeIcon].map((src, idx) => (
            <div
              key={idx}
              className={idx === 0 ? 'rune-slot' : 'rune-slot rune-slot-secondary'}
            >
              {src && (
                <img
                  src={src}
                  alt={idx === 0 ? 'Keystone rune' : 'Secondary rune path'}
                  className="rune-icon-img"
                />
              )}
            </div>
          ))}
        </div>

        {/* Summoner Spells */}
        <div className="match-summoners-section">
          {summonerIcons.map((src, idx) => (
            <div key={idx} className="summoner-icon">
              {src && (
                <img
                  src={src}
                  alt="Summoner spell"
                  className="summoner-icon-img"
                />
              )}
            </div>
          ))}
        </div>

        {/* Champion Portrait */}
        <div className="champion-portrait">
          {focusChampionIcon && (
            <img
              src={focusChampionIcon}
              alt={focusPlayer?.championName || 'champion'}
              className="champion-portrait-img"
            />
          )}
        </div>

        {/* Champion stats and items: items on left, stats on right */}
        <div className="match-champion-column">
          <div className="match-items-stats-row">
            {/* Items Section */}
            <div className="match-items-section">
              {displayItems.map((itemId, idx) => {
                const src = getItemIconUrl(itemId);
                return (
                  <div key={idx} className="item-icon">
                    {src && (
                      <img
                        src={src}
                        alt={itemId ? `Item ${itemId}` : 'Empty slot'}
                        className="item-icon-img"
                      />
                    )}
                  </div>
                );
              })}

              {/* Quest item slot */}
              <div className="item-icon item-icon-quest" title="Role quest">
                {(() => {
                  const questSrc = actualQuestItemId ? getItemIconUrl(actualQuestItemId) : null;

                  return questSrc ? (
                    <img
                      src={questSrc}
                      alt={`Quest ${actualQuestItemId}`}
                      className="item-icon-img"
                    />
                  ) : null;
                })()}
              </div>

              {/* Vision / trinket slot */}
              <div className="item-icon item-icon-vision" title="Trinket">
                {getItemIconUrl(trinketItem) && (
                  <img
                    src={getItemIconUrl(trinketItem)}
                    alt={trinketItem ? `Trinket ${trinketItem}` : 'No trinket'}
                    className="item-icon-img"
                  />
                )}
              </div>
            </div>

            {/* Stats Section centered between items and player list */}
            <div className="match-stats-row">
              {/* KDA Section */}
              <div className="match-kda-section">
                <div className="kda-value">{focusPlayer.kills} / {focusPlayer.deaths} / {focusPlayer.assists}</div>
                <div className="kda-ratio">{kdaRatio.toFixed(2)} KDA</div>
              </div>

              {/* CS Section */}
              <div className="match-cs-section">
                <div className="cs-value">{totalCs} CS</div>
                <div className="cs-per-min">{csPerMin.toFixed(1)} cs/min</div>
              </div>

              {/* AI Score & Position */}
              <div className="match-score-section">
                <div className="score-container">
                  <div
                    className="ai-score-badge"
                    style={roundedAiScore === null ? {} : roundedAiScore < 45 ? { background: '#F87171', color: '#fff' } : roundedAiScore > 85 ? { background: '#D4AF37', color: '#fff' } : { background: '#34D399', color: '#fff' }}
                  >
                    <span className="score-value">{roundedAiScore !== null ? roundedAiScore : '-'}</span>
                  </div>
                  <div className="position-badge">
                    <span className="position-value">{placementLabel}</span>
                  </div>
                    {/* Breakdown tooltip (shows on hover/focus) */}
                    {focusPlayer.opBreakdown && (
                      <div className="score-breakdown" role="tooltip" aria-hidden={false}>
                        <div className="breakdown-row"><span className="breakdown-label">KDA</span><span className="breakdown-value">{focusPlayer.opBreakdown.kdaScore.toFixed(1)}</span></div>
                        <div className="breakdown-row"><span className="breakdown-label">Damage</span><span className="breakdown-value">{focusPlayer.opBreakdown.damageScore.toFixed(1)}</span></div>
                        <div className="breakdown-row"><span className="breakdown-label">Vision</span><span className="breakdown-value">{focusPlayer.opBreakdown.visionScore.toFixed(1)}</span></div>
                        <div className="breakdown-row"><span className="breakdown-label">CS</span><span className="breakdown-value">{focusPlayer.opBreakdown.csScore.toFixed(1)}</span></div>
                        <div className="breakdown-row"><span className="breakdown-label">Enchanter</span><span className="breakdown-value">{focusPlayer.opBreakdown.enchanterScore.toFixed(1)}</span></div>
                        <div className="breakdown-row"><span className="breakdown-label">Tank</span><span className="breakdown-value">{focusPlayer.opBreakdown.tankScore.toFixed(1)}</span></div>
                        <div className="breakdown-row"><span className="breakdown-label">Gold</span><span className="breakdown-value">{focusPlayer.opBreakdown.goldScore.toFixed(1)}</span></div>
                        <div className="breakdown-row"><span className="breakdown-label">CC</span><span className="breakdown-value">{focusPlayer.opBreakdown.ccScore.toFixed(1)}</span></div>
                        <div className="breakdown-row"><span className="breakdown-label">Turret</span><span className="breakdown-value">{focusPlayer.opBreakdown.turretScore.toFixed(1)}</span></div>
                        <div className="breakdown-row"><span className="breakdown-label">KP</span><span className="breakdown-value">{focusPlayer.opBreakdown.kpScore.toFixed(1)}</span></div>
                        <div className="breakdown-total"><span className="breakdown-label">Total</span><span className="breakdown-value">{Math.round(focusPlayer.opBreakdown.total)}</span></div>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Players */}
        <div className="match-players-section">
          <div className="team-column">
            {blueTeam.map((p) => (
              <div
                key={p?.puuid}
                className={`player-item ${normalize(p?.name) === normalize(summonerName) ? 'focus' : ''}`}
                data-focused={normalize(p?.name) === normalize(summonerName) ? 'true' : 'false'}
              >
                {getChampionIconUrl(p?.championName) ? (
                  <img
                    src={getChampionIconUrl(p?.championName)}
                    alt={p?.championName || 'champion'}
                    className="player-icon"
                  />
                ) : (
                  <span className="player-initial">{getChampionInitial(p?.championName)}</span>
                )}
                <button
                  className="player-name player-name-clickable"
                  onClick={(e) => {
                    e.stopPropagation();
                    const tag = p?.riotIdTagline || '';
                    const url = `${window.location.origin}/profile/${region}/${encodeURIComponent(p?.name || '')}-${encodeURIComponent(tag)}/overview`;
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }}
                  aria-label={`Open profile for ${p?.name}`}
                >
                  {p?.name}
                </button>
              </div>
            ))}
          </div>
          <div className="team-column">
            {redTeam.map((p) => (
              <div
                key={p?.puuid}
                className={`player-item ${normalize(p?.name) === normalize(summonerName) ? 'focus' : ''}`}
                data-focused={normalize(p?.name) === normalize(summonerName) ? 'true' : 'false'}
              >
                {getChampionIconUrl(p?.championName) ? (
                  <img
                    src={getChampionIconUrl(p?.championName)}
                    alt={p?.championName || 'champion'}
                    className="player-icon"
                  />
                ) : (
                  <span className="player-initial">{getChampionInitial(p?.championName)}</span>
                )}
                <button
                  className="player-name player-name-clickable"
                  onClick={(e) => {
                    e.stopPropagation();
                    const tag = p?.riotIdTagline || '';
                    const url = `${window.location.origin}/profile/${region}/${encodeURIComponent(p?.name || '')}-${encodeURIComponent(tag)}/overview`;
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }}
                  aria-label={`Open profile for ${p?.name}`}
                >
                  {p?.name}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Expand Arrow */}
        <div className={`match-expand-icon ${isExpanded ? 'rotated' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>

        {/* Badges — full-width bottom row */}
        {focusPlayer.badges && focusPlayer.badges.length > 0 && (
          <div className="match-badges">
            {focusPlayer.badges.map((badge, i) => (
              <span key={i} className={`match-badge${badge === 'MVP' ? ' match-badge-mvp' : ''}`} data-tooltip={BADGE_DESCRIPTIONS[badge]}>{badge}</span>
            ))}
          </div>
        )}
      </div>
      {isExpanded && (
        <MatchDetail match={match} focusName={summonerName} region={region} />
      )}
      </div>
    );
  };

  return (
    <div className="match-history-container">
      <Navbar />
      <div className="match-history-inner">

        {/* Profile navigation tabs */}
        {summonerName && summonerTag && (
          <div className="profile-tabs">
            <button
              className={`profile-tab-button active`}
              onClick={() => navigate(`/profile/${region}/${summonerName}-${summonerTag}/overview`)}
            >
              Overview
            </button>
            <button
              className="profile-tab-button"
              onClick={() => navigate(`/profile/${region}/${summonerName}-${summonerTag}/mastery`)}
            >
              Mastery
            </button>
            <button
              className="profile-tab-button"
              onClick={() => navigate(`/profile/${region}/${summonerName}-${summonerTag}/analysis`)}
            >
              Analysis
            </button>
            <button
              className="profile-tab-button"
              onClick={() => navigate(`/profile/${region}/${summonerName}-${summonerTag}/livegame`)}
            >
              Live Game
            </button>
          </div>
        )}

        {/* Player Profile Card */}
        {summonerName && matches.length > 0 && (
          <div className="player-profile-card">
            <div className="player-icon-section">
              <div className="player-main-icon">
                <img
                  src={`${DD_PROFILE_ICON_BASE}/${profileIconId}.png`}
                  alt="Profile Icon"
                  style={{ width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover' }}
                />
                {summonerData?.summonerLevel != null && (
                  <div className="player-level-badge">{summonerData.summonerLevel}</div>
                )}
              </div>
            </div>
            <div className="player-info">
              <div className="player-title">{summonerName}#{summonerTag}</div>
              <button
                className={`update-button${isUpdating ? ' updating' : ''}`}
                onClick={handleUpdate}
                disabled={isUpdating}
              >
                <svg className={isUpdating ? 'spin' : ''} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10" />
                  <polyline points="1 20 1 14 7 14" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                {isUpdating ? 'Updating...' : 'Update'}
              </button>
              {lastUpdated && <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>Updated {timeSince(lastUpdated)}</div>}
              <div className="player-ranks">
                {rankSections.map(({ label, entry }) => {
                  const iconSrc = getRankIcon(entry);
                  return (
                    <div className="rank-entry" key={label}>
                      {iconSrc ? (
                        <img src={iconSrc} alt={`${label} icon`} className="rank-icon" />
                      ) : (
                        <div className="rank-icon rank-icon-placeholder">-</div>
                      )}
                      <div className="rank-text">
                        <div className="rank-queue">{label}</div>
                        <div className="rank-value">{formatRankLabel(entry)}</div>
                      </div>
                    </div>
                  );
                })}
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
                  <div className="performance-label">{matches.length} Games</div>
                  <div className="performance-value">{wins}W {matches.length - wins}L</div>
                </div>
                <div className="performance-row">
                  <div className="performance-label">Avg KDA</div>
                  <div className="performance-value">{profileStats.avgKdaRatio} KDA</div>
                </div>
                <div className="performance-row">
                  <div className="performance-label">Avg AI Score</div>
                  <div className="performance-value" style={profileStats.avgOpScore === null ? {} : profileStats.avgOpScore < 45 ? { color: '#F87171' } : profileStats.avgOpScore > 85 ? { color: '#FFD700' } : { color: '#34D399' }}>{profileStats.avgOpScore ?? '—'}</div>
                </div>
                {profileStats.avgCsPerMin !== null && (
                  <div className="performance-row">
                    <div className="performance-label">Avg CS/min</div>
                    <div className="performance-value">{profileStats.avgCsPerMin}</div>
                  </div>
                )}
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
                {mostPlayedChampions.map(({ championName, games, wins, kills, deaths, assists }) => {
                  const winPct = Math.round((wins / games) * 100);
                  const iconUrl = getChampionIconUrl(championName);
                  const avgK = (kills   / games).toFixed(1);
                  const avgD = (deaths  / games).toFixed(1);
                  const avgA = (assists / games).toFixed(1);
                  return (
                    <div className="champion-item" key={championName}>
                      <div className="champion-icon">
                        {iconUrl
                          ? <img src={iconUrl} alt={championName} className="champion-icon-img" />
                          : <span>{championName[0]}</span>
                        }
                      </div>
                      <div className="champion-info">
                        <div className="champion-name">{championName}</div>
                        <div className="champion-stats">{winPct}% · {games} game{games !== 1 ? 's' : ''}</div>
                        <div className="champion-kda">{avgK} / {avgD} / {avgA}</div>
                      </div>
                    </div>
                  );
                })}
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
                {matches
                  .filter(match => {
                    const qid = match.gameInfo?.queueId;
                    if (activeTab === 'ranked') return qid === 420;
                    if (activeTab === 'flex')   return qid === 440;
                    if (activeTab === 'aram')   return qid === 450;
                    return true;
                  })
                  .map(match => (
                    <SimplifiedMatchCard key={match.matchId} match={match} />
                  ))}
              </div>

              {hasMore && (
                <button
                  className={`load-more-button${isLoadingMore ? ' loading' : ''}`}
                  onClick={loadMoreMatches}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? 'Loading...' : 'Load More Matches'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
