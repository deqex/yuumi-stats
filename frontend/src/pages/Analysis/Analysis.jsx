
import { useState, useCallback, useMemo, useEffect } from 'react';
import { timeSince } from '../../utils/timeSince';
import { useParams, useNavigate } from 'react-router-dom';
import { useDDragon } from '../../context/DDragonContext';
import { Navbar } from '../../components';

import topIcon    from '../../utils/position-top.svg';
import jungleIcon from '../../utils/position-jungle.svg';
import middleIcon from '../../utils/position-middle.svg';
import bottomIcon from '../../utils/position-bottom.svg';
import supportIcon from '../../utils/position-utility.svg';

import './Analysis.css';


const VIEW_MODES = [
  { value: 'avg',   label: 'Average' },
  { value: 'total', label: 'Total'   },
  { value: 'max',   label: 'Highest' },
  { value: 'min',   label: 'Lowest'  },
];

const ALL_ROLES  = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'];

const ALL_QUEUES = [480, 400, 420, 440, 450];

const TIME_PERIODS = [
  { value: 7,   label: '7 Days'   },
  { value: 14,  label: '14 Days'  },
  { value: 30,  label: '1 Month'  },
  { value: 90,  label: '3 Months' },
  { value: 180, label: '6 Months' },
  { value: 365, label: '1 Year'   },
];

const ROLES = [
  { value: 'TOP',     label: 'Top',     icon: topIcon     },
  { value: 'JUNGLE',  label: 'Jungle',  icon: jungleIcon  },
  { value: 'MIDDLE',  label: 'Mid',     icon: middleIcon  },
  { value: 'BOTTOM',  label: 'Bot',     icon: bottomIcon  },
  { value: 'UTILITY', label: 'Support', icon: supportIcon },
];

const QUEUES = [
  { value: 480, label: 'Swiftplay'   },
  { value: 400, label: 'Draft Pick'  },
  { value: 420, label: 'Ranked Solo' },
  { value: 440, label: 'Ranked Flex' },
  { value: 450, label: 'ARAM'        },
];


function formatSeconds(s) {
  if (!s && s !== 0) return '—';
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function formatGameLength(secs) {
  if (!secs && secs !== 0) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

function formatTimePlayed(secs) {
  if (!secs) return '—';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function pick(statObj, mode) {
  if (!statObj) return '—';
  return statObj[mode] ?? '—';
}


function StatCard({ label, statObj, mode, format }) {
  const raw = pick(statObj, mode);
  const value = typeof format === 'function' ? format(raw) : raw;
  return (
    <div className="stat-card">
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
    </div>
  );
}

function AiScoreCard({ statObj, mode }) {
  const value = pick(statObj, mode);
  return (
    <div className="stat-card ai-score-card">
      <div className="stat-card-label">AI Score</div>
      <div className="stat-card-value">{value}</div>
    </div>
  );
}

function HighlightCard({ label, value }) {
  const isNonzero = typeof value === 'number' && value > 0;
  return (
    <div className="highlight-card">
      <div className={`highlight-card-value${isNonzero ? ' nonzero' : ''}`}>{value ?? '—'}</div>
      <div className="highlight-card-label">{label}</div>
    </div>
  );
}

function DeepStatCard({ label, statObj, mode, format }) {
  const raw = pick(statObj, mode);
  const value = typeof format === 'function' ? format(raw) : raw;
  return (
    <div className="deep-stat-card">
      <div className="deep-stat-label">{label}</div>
      <div className="deep-stat-value">{value}</div>
    </div>
  );
}


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

const SHAME_BADGES = new Set(['Struggled', 'Blind', 'No control wards']);

const PROFILE_BADGE_DEFS = [
  { key: 'Pentakill',         check: m => m.largestMultiKill >= 5,                       min: 1 },
  { key: 'Unstoppable',       check: m => m.aiScore > 90,                                min: 2 },
  { key: 'Unkillable',        check: m => m.deaths === 0 && m.aiScore > 45,             min: 2 },
  { key: 'Unlucky',           check: m => m.aiScore > 65 && !m.win,                     min: 3 },
  { key: 'On Fire',           check: m => m.largestKillingSpree >= 3,                   min: 3 },
  { key: 'Objective Stealer', check: m => m.objectivesStolen > 0,                       min: 2 },
  { key: 'First Blood',       check: m => m.firstBlood === 1,                           min: 3 },
  { key: 'Close game',        check: m => m.hadOpenNexus > 0,                           min: 2 },
  { key: 'Quadra kill',       check: m => m.largestMultiKill === 4,                     min: 2 },
  { key: 'Triple kill',       check: m => m.largestMultiKill === 3,                     min: 3 },
  { key: 'Doublekill',        check: m => m.largestMultiKill === 2,                     min: 5, minRate: 0.25 },
  { key: 'Struggled',         check: m => m.aiScore < 40,                               min: 3, minRate: 0.20, shame: true },
  { key: 'Blind',             check: m => m.visionScore === 0,                          min: 3, minRate: 0.15, shame: true },
  { key: 'No control wards',  check: m => m.controlWardsPlaced === 0,                   min: 3, minRate: 0.20, shame: true },
];

function aggregateMatches(rawMatches, selectedRoles, selectedQueues) {
  if (!rawMatches) return null;

  const allowedRoles  = selectedRoles.length < ALL_ROLES.length  ? new Set(selectedRoles)  : null;
  const allowedQueues = new Set(selectedQueues);

  const filtered = rawMatches.filter(m => {
    if (!allowedQueues.has(m.queueId)) return false;
    if (allowedRoles && m.queueId !== 450) {
      if (!m.position || !allowedRoles.has(m.position)) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    return { totalGames: 0, wins: 0, losses: 0, winRate: 0 };
  }

  const tracker = () => ({ total: 0, min: Infinity, max: -Infinity });
  const update  = (t, val) => {
    t.total += val;
    if (val < t.min) t.min = val;
    if (val > t.max) t.max = val;
  };

  let wins = 0;
  const kills = tracker(), deaths = tracker(), assists = tracker();
  const cs = tracker(), visionScore = tracker(), aiScore = tracker();
  const kp = tracker(), gameLength = tracker();

  let firstBloods = 0, forfeits = 0;
  const uniqueChampions = new Set();
  const championStats = new Map();
  let epicMonsterSteals = 0, flawlessAces = 0, hadOpenNexus = 0;
  let perfectGames = 0, takedownsInEnemyFountain = 0;
  let elderDragonKillsWithOpposingSoul = 0, dancedWithRiftHerald = 0;
  let minEarliestBaron = Infinity;

  const healFromMap = tracker(), controlWards = tracker();
  const dragonTakedowns = tracker(), scuttleKills = tracker();
  const stealthWards = tracker(), wardKills = tracker();
  const dmgToTurrets = tracker(), selfMitigated = tracker();
  const allyJungle = tracker(), dmgToChamps = tracker();
  const enemyJungle = tracker(), healsOnTeam = tracker();
  const killsNearTurret = tracker(), maxCsAdv = tracker();
  const takedownsAfterLevel = tracker(), takedownsBeforeJungle = tracker();
  const abilityUses = tracker();

  for (const m of filtered) {
    if (m.win) wins++;

    update(kills,       m.kills);
    update(deaths,      m.deaths);
    update(assists,     m.assists);
    update(cs,          m.cs);
    update(visionScore, m.visionScore);
    update(aiScore,     m.aiScore);
    update(kp,          m.kp);
    update(gameLength,  m.gameDuration);

    firstBloods += m.firstBlood;
    forfeits    += m.forfeit;

    if (m.championName) {
      uniqueChampions.add(m.championName);
      if (!championStats.has(m.championName)) {
        championStats.set(m.championName, { games: 0, wins: 0, totalKills: 0, totalDeaths: 0, totalAssists: 0, totalCs: 0, totalGameDuration: 0, totalAiScore: 0 });
      }
      const cs_ = championStats.get(m.championName);
      cs_.games++;
      if (m.win) cs_.wins++;
      cs_.totalKills        += m.kills;
      cs_.totalDeaths       += m.deaths;
      cs_.totalAssists      += m.assists;
      cs_.totalCs           += m.cs;
      cs_.totalGameDuration += m.gameDuration;
      cs_.totalAiScore      += m.aiScore;
    }

    epicMonsterSteals                += m.epicMonsterSteals;
    flawlessAces                     += m.flawlessAces;
    hadOpenNexus                     += m.hadOpenNexus;
    perfectGames                     += m.perfectGame;
    takedownsInEnemyFountain         += m.takedownsInEnemyFountain;
    elderDragonKillsWithOpposingSoul += m.elderDragonKillsWithOpposingSoul;
    dancedWithRiftHerald             += m.dancedWithRiftHerald;

    if (m.earliestBaron > 0 && m.earliestBaron < minEarliestBaron) {
      minEarliestBaron = m.earliestBaron;
    }

    update(healFromMap,           m.healFromMapSources);
    update(controlWards,          m.controlWardsPlaced);
    update(dragonTakedowns,       m.dragonTakedowns);
    update(scuttleKills,          m.scuttleCrabKills);
    update(stealthWards,          m.stealthWardsPlaced);
    update(wardKills,             m.wardTakedowns);
    update(dmgToTurrets,          m.damageDealtToTurrets);
    update(selfMitigated,         m.damageSelfMitigated);
    update(allyJungle,            m.totalAllyJungleMinionsKilled);
    update(dmgToChamps,           m.totalDamageDealtToChampions);
    update(enemyJungle,           m.totalEnemyJungleMinionsKilled);
    update(healsOnTeam,           m.totalHealsOnTeammates);
    update(killsNearTurret,       m.killsNearEnemyTurret);
    update(maxCsAdv,              m.maxCsAdvantageOnLaneOpponent);
    update(takedownsAfterLevel,   m.takedownsAfterGainingLevelAdvantage);
    update(takedownsBeforeJungle, m.takedownsBeforeJungleMinionSpawn);
    update(abilityUses,           m.abilityUses);
  }

  const n = filtered.length;
  const stat = (t, round = false) => {
    const avg = n > 0 ? (round ? Math.round(t.total / n) : +(t.total / n).toFixed(2)) : 0;
    return {
      avg,
      total: round ? Math.round(t.total)             : +t.total.toFixed(2),
      max:   t.max === -Infinity ? 0 : (round ? Math.round(t.max) : +t.max.toFixed(2)),
      min:   t.min === Infinity  ? 0 : (round ? Math.round(t.min) : +t.min.toFixed(2)),
    };
  };

  const profileBadges = [];
  for (const def of PROFILE_BADGE_DEFS) {
    const count = filtered.filter(def.check).length;
    const rate = n > 0 ? count / n : 0;
    if (count >= def.min && (def.minRate == null || rate >= def.minRate)) {
      profileBadges.push({ badge: def.key, count, shame: !!def.shame });
    }
  }

  const mostPlayed = [...championStats.entries()]
    .sort((a, b) => b[1].games - a[1].games)
    .slice(0, 5)
    .map(([championName, s]) => {
      const minsPlayed = s.totalGameDuration / 60;
      return {
        championName,
        games:       s.games,
        wins:        s.wins,
        winRate:     Math.round((s.wins / s.games) * 100),
        avgKills:    +(s.totalKills   / s.games).toFixed(1),
        avgDeaths:   +(s.totalDeaths  / s.games).toFixed(1),
        avgAssists:  +(s.totalAssists / s.games).toFixed(1),
        avgCsPerMin: minsPlayed > 0 ? +(s.totalCs / minsPlayed).toFixed(1) : 0,
        avgAiScore:  Math.round(s.totalAiScore / s.games),
        timePlayed:  Math.round(s.totalGameDuration),
      };
    });

  return {
    totalGames: n,
    wins,
    losses:  n - wins,
    winRate: Math.round((wins / n) * 100),

    performance: {
      kills:       stat(kills),
      deaths:      stat(deaths),
      assists:     stat(assists),
      cs:          stat(cs),
      visionScore: stat(visionScore),
      aiScore:     stat(aiScore, true),
      kp:          stat(kp, true),
      gameLength:  stat(gameLength, true),
    },

    highlights: {
      firstBloods,
      forfeits,
      uniqueChampions:              uniqueChampions.size,
      epicMonsterSteals,
      flawlessAces,
      hadOpenNexus,
      perfectGames,
      takedownsInEnemyFountain,
      elderDragonKillsWithOpposingSoul,
      dancedWithRiftHerald,
      earliestBaron: minEarliestBaron === Infinity ? null : Math.round(minEarliestBaron),
    },

    mostPlayed,
    profileBadges,

    deepStats: {
      healFromMapSources:              stat(healFromMap, true),
      controlWardsPlaced:              stat(controlWards),
      dragonTakedowns:                 stat(dragonTakedowns),
      scuttleCrabKills:                stat(scuttleKills),
      stealthWardsPlaced:              stat(stealthWards),
      wardTakedowns:                   stat(wardKills),
      damageDealtToTurrets:            stat(dmgToTurrets, true),
      damageSelfMitigated:             stat(selfMitigated, true),
      allyJungleMinions:               stat(allyJungle),
      damageDealtToChampions:          stat(dmgToChamps, true),
      enemyJungleMinions:              stat(enemyJungle),
      healsOnTeammates:                stat(healsOnTeam, true),
      killsNearEnemyTurret:            stat(killsNearTurret),
      maxCsAdvantage:                  stat(maxCsAdv),
      takedownsAfterLevelAdvantage:    stat(takedownsAfterLevel),
      takedownsBeforeJungleMinionSpawn:stat(takedownsBeforeJungle),
      abilityUses:                     stat(abilityUses, true),
    },
  };
}


const CLIENT_CACHE_TTL = 45 * 60 * 1000;

function clientCacheKey(region, summonerName, summonerTag) {
  return `analysis_loaded:${region}:${summonerName}-${summonerTag}`;
}

function isClientCacheValid(region, summonerName, summonerTag) {
  try {
    const ts = localStorage.getItem(clientCacheKey(region, summonerName, summonerTag));
    return !!ts && (Date.now() - Number(ts)) < CLIENT_CACHE_TTL;
  } catch { return false; }
}

function markClientCache(region, summonerName, summonerTag) {
  try { localStorage.setItem(clientCacheKey(region, summonerName, summonerTag), Date.now()); } catch {}
}


export default function Analysis() {
  const ddVersion = useDDragon();
  const params = useParams();
  const navigate = useNavigate();

  const lastDash = params?.nameTag?.lastIndexOf('-') ?? -1;
  const summonerName = lastDash > 0 ? params.nameTag.slice(0, lastDash) : (params?.nameTag || '');
  const summonerTag  = lastDash > 0 ? params.nameTag.slice(lastDash + 1) : '';
  const region = params?.region || 'euw1';

  const [autoLoad] = useState(() => isClientCacheValid(region, summonerName, summonerTag));

  const [rawMatches, setRawMatches] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [hasLoaded, setHasLoaded]   = useState(false);
  const [viewMode, setViewMode]     = useState('avg');

  const [selectedRoles,  setSelectedRoles]  = useState(ALL_ROLES);
  const [selectedQueues, setSelectedQueues] = useState(ALL_QUEUES.filter(q => q !== 450));
  const [selectedDays,   setSelectedDays]   = useState(14);

  const [daysDirty, setDaysDirty] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const data = useMemo(
    () => aggregateMatches(rawMatches, selectedRoles, selectedQueues),
    [rawMatches, selectedRoles, selectedQueues],
  );

  const toggleRole = (role) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const toggleQueue = (queue) => {
    setSelectedQueues(prev =>
      prev.includes(queue) ? prev.filter(q => q !== queue) : [...prev, queue]
    );
  };

  const fetchData = useCallback(async (days) => {
    if (!summonerName || !summonerTag) return;

    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams({ summonerName, summonerTag, region, days });
      const res = await fetch(`/api/matches/analysis?${qs}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }
      const json = await res.json();
      setRawMatches(json.matches);
      setHasLoaded(true);
      setDaysDirty(false);
      setLastUpdated(new Date());
      markClientCache(region, summonerName, summonerTag);
    } catch (err) {
      setError(err.message || 'Failed to load analysis data.');
    } finally {
      setLoading(false);
    }
  }, [summonerName, summonerTag, region]);

  useEffect(() => {
    if (autoLoad) fetchData(selectedDays);
  }, []);

  const handleLoad = () => {
    if (loading) return;
    fetchData(selectedDays);
  };

  const p = data?.performance;
  const h = data?.highlights;
  const d = data?.deepStats;

  const fmtLarge   = (v) => (typeof v === 'number' ? v.toLocaleString() : v);
  const fmtGameLen = (v) => formatGameLength(v);
  const fmtKP      = (v) => (typeof v === 'number' ? `${v}%` : v);


  return (
    <div className="analysis-container">
      <Navbar />
      <div className="analysis-inner">

        {summonerName && summonerTag && (
          <div className="profile-tabs">
            <button
              className="profile-tab-button"
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
            <button className="profile-tab-button active">Analysis</button>
            <button
              className="profile-tab-button"
              onClick={() => navigate(`/profile/${region}/${summonerName}-${summonerTag}/livegame`)}
            >
              Live Game
            </button>
          </div>
        )}

        {!hasLoaded && !loading && !autoLoad && (
          <div className="analysis-load-area">
            <div className="analysis-load-icon">📊</div>
            <p className="analysis-load-title">Player Analysis</p>
            <p className="analysis-load-subtitle">This may take a moment if the data isn't cached yet.</p>
            <button className="analysis-load-btn" onClick={handleLoad}>
              Load Analysis
            </button>
          </div>
        )}

        {!hasLoaded && loading && (
          <div className="analysis-loading">
            <div className="analysis-spinner" />
            Fetching matches from the last {TIME_PERIODS.find(t => t.value === selectedDays)?.label ?? `${selectedDays} Days`}…
          </div>
        )}

        {error && !loading && (
          <div className="analysis-error">
            {error}
            <button
              className="analysis-load-btn"
              style={{ marginTop: 12, display: 'block', marginLeft: 'auto', marginRight: 'auto' }}
              onClick={handleLoad}
            >
              Try again
            </button>
          </div>
        )}

        {hasLoaded && data && (
          <>
            <div className="analysis-summary-card">
              <div className="summary-card-stats">
                <div className="summary-card-stat">
                  <span className="summary-card-value">{data.totalGames}</span>
                  <span className="summary-card-label">Games</span>
                </div>
                <div className="summary-card-divider" />
                <div className="summary-card-stat">
                  <span className="summary-card-value win">{data.wins}</span>
                  <span className="summary-card-label">Wins</span>
                </div>
                <div className="summary-card-divider" />
                <div className="summary-card-stat">
                  <span className="summary-card-value loss">{data.losses}</span>
                  <span className="summary-card-label">Losses</span>
                </div>
                <div className="summary-card-divider" />
                <div className="summary-card-stat">
                  <span className="summary-card-value">
                    {data.winRate}<span className="summary-pct">%</span>
                  </span>
                  <span className="summary-card-label">Win Rate</span>
                </div>
                <div className="summary-card-period">
                  <span className="period-badge">{TIME_PERIODS.find(t => t.value === selectedDays)?.label ?? `${selectedDays} Days`}</span>
                </div>
              </div>
              <div className="summary-progress-track">
                <div className="summary-progress-fill" style={{ width: `${data.winRate}%` }} />
              </div>
            </div>

            <div className="analysis-filters-card">
              <div className="filter-row">
                <span className="filter-row-label">Role</span>
                <div className="filter-chips">
                  {ROLES.map(r => (
                    <button
                      key={r.value}
                      className={`filter-chip role-chip${selectedRoles.includes(r.value) ? ' active' : ''}`}
                      onClick={() => toggleRole(r.value)}
                      title={r.label}
                    >
                      <img src={r.icon} alt={r.label} className="role-chip-icon" />
                      <span>{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-row">
                <span className="filter-row-label">Period</span>
                <select
                  className="period-select"
                  value={selectedDays}
                  onChange={e => {
                    setSelectedDays(Number(e.target.value));
                    if (hasLoaded) setDaysDirty(true);
                  }}
                >
                  {TIME_PERIODS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="filter-row">
                <span className="filter-row-label">Mode</span>
                <div className="filter-chips">
                  {QUEUES.map(q => (
                    <button
                      key={q.value}
                      className={`filter-chip${selectedQueues.includes(q.value) ? ' active' : ''}`}
                      onClick={() => toggleQueue(q.value)}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {daysDirty && !loading && (
              <div className="analysis-refetch-bar">
                <button className="analysis-update-btn" onClick={handleLoad}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10" />
                    <polyline points="1 20 1 14 7 14" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  Update
                </button>
                {lastUpdated && <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>Updated {timeSince(lastUpdated)}</div>}
              </div>
            )}
            {loading && (
              <div className="analysis-refetch-bar">
                <div className="analysis-spinner small" />
                Updating…
              </div>
            )}

            <div style={{ opacity: loading ? 0.45 : 1, transition: 'opacity 0.2s', pointerEvents: loading ? 'none' : 'auto' }}>
              {data.totalGames === 0 ? (
                <div className="analysis-empty">No games found matching the selected filters.</div>
              ) : (
                <>
                  <div className="view-mode-bar">
                    <span className="view-mode-label">Showing:</span>
                    <div className="view-mode-tabs">
                      {VIEW_MODES.map(m => (
                        <button
                          key={m.value}
                          className={`view-mode-btn${viewMode === m.value ? ' active' : ''}`}
                          onClick={() => setViewMode(m.value)}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {data.profileBadges?.length > 0 && (
                    <div className="analysis-section">
                      <div className="analysis-section-header">
                        <span className="section-title">Profile Badges</span>
                        <div className="section-divider" />
                        <span className="section-subtitle">earned in {data.totalGames} games</span>
                      </div>
                      <div className="profile-badges-row">
                        {data.profileBadges.map(({ badge, count, shame }) => (
                          <div
                            key={badge}
                            className={`profile-badge-chip${shame ? ' shame' : ''}`}
                            data-tooltip={BADGE_DESCRIPTIONS[badge]}
                          >
                            <span className="profile-badge-label">{badge}</span>
                            <span className="profile-badge-count">{count}×</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="analysis-section">
                    <div className="analysis-section-header">
                      <span className="section-title">Performance Stats</span>
                      <div className="section-divider" />
                      <span className="section-subtitle">per game</span>
                    </div>
                    <div className="stat-cards-grid">
                      <StatCard label="Kills"        statObj={p?.kills}       mode={viewMode} />
                      <StatCard label="Deaths"       statObj={p?.deaths}      mode={viewMode} />
                      <StatCard label="Assists"      statObj={p?.assists}     mode={viewMode} />
                      <StatCard label="CS"           statObj={p?.cs}          mode={viewMode} />
                      <StatCard label="Vision Score" statObj={p?.visionScore} mode={viewMode} />
                      <AiScoreCard                   statObj={p?.aiScore}     mode={viewMode} />
                      <StatCard label="Kill Part."   statObj={p?.kp}          mode={viewMode} format={fmtKP} />
                      <StatCard label="Game Length"  statObj={p?.gameLength}  mode={viewMode} format={fmtGameLen} />
                    </div>
                  </div>

                  <div className="analysis-section">
                    <div className="analysis-section-header">
                      <span className="section-title">Highlights</span>
                      <div className="section-divider" />
                      <span className="section-subtitle">totals over 14 days</span>
                    </div>
                    <div className="highlights-grid">
                      <HighlightCard label="First Bloods"            value={h?.firstBloods} />
                      <HighlightCard label="Forfeits"                value={h?.forfeits} />
                      <HighlightCard label="Unique Champions"        value={h?.uniqueChampions} />
                      <HighlightCard label="Epic Monster Steals"     value={h?.epicMonsterSteals} />
                      <HighlightCard label="Flawless Aces"           value={h?.flawlessAces} />
                      <HighlightCard label="Perfect Games"           value={h?.perfectGames} />
                      <HighlightCard label="Wins with Open Nexus"    value={h?.hadOpenNexus} />
                      <HighlightCard label="Kills in Enemy Fountain" value={h?.takedownsInEnemyFountain} />
                      <HighlightCard label="Elder w/ Opposing Soul"  value={h?.elderDragonKillsWithOpposingSoul} />
                      <HighlightCard label="Danced with Rift Herald" value={h?.dancedWithRiftHerald} />

                      <div className="highlight-card">
                        <div className={`highlight-card-value baron-time${h?.earliestBaron ? ' nonzero' : ''}`}>
                          {h?.earliestBaron ? formatSeconds(h.earliestBaron) : '—'}
                        </div>
                        <div className="highlight-card-label">Earliest Baron</div>
                      </div>
                    </div>
                  </div>

                  <div className="analysis-section">
                    <div className="analysis-section-header">
                      <span className="section-title">Deep Stats</span>
                      <div className="section-divider" />
                      <span className="section-subtitle">per game</span>
                    </div>
                    <div className="deep-stats-grid">
                      <DeepStatCard label="Abilities Casted"              statObj={d?.abilityUses}                      mode={viewMode} format={fmtLarge} />
                      <DeepStatCard label="Control Wards"                 statObj={d?.controlWardsPlaced}               mode={viewMode} />
                      <DeepStatCard label="Stealth Wards"                 statObj={d?.stealthWardsPlaced}               mode={viewMode} />
                      <DeepStatCard label="Ward Takedowns"                statObj={d?.wardTakedowns}                    mode={viewMode} />
                      <DeepStatCard label="Dragon Takedowns"              statObj={d?.dragonTakedowns}                  mode={viewMode} />
                      <DeepStatCard label="Scuttle Crab Kills"            statObj={d?.scuttleCrabKills}                 mode={viewMode} />
                      <DeepStatCard label="Damage to Turrets"             statObj={d?.damageDealtToTurrets}             mode={viewMode} format={fmtLarge} />
                      <DeepStatCard label="Damage Mitigated"              statObj={d?.damageSelfMitigated}              mode={viewMode} format={fmtLarge} />
                      <DeepStatCard label="Ally Jungle CS"                statObj={d?.allyJungleMinions}                mode={viewMode} />
                      <DeepStatCard label="Enemy Jungle CS"               statObj={d?.enemyJungleMinions}               mode={viewMode} />
                      <DeepStatCard label="Damage to Champions"           statObj={d?.damageDealtToChampions}           mode={viewMode} format={fmtLarge} />
                      <DeepStatCard label="Heals on Teammates"            statObj={d?.healsOnTeammates}                 mode={viewMode} format={fmtLarge} />
                      <DeepStatCard label="Heal from Map"                 statObj={d?.healFromMapSources}               mode={viewMode} format={fmtLarge} />
                      <DeepStatCard label="Kills near Turret"             statObj={d?.killsNearEnemyTurret}             mode={viewMode} />
                      <DeepStatCard label="Max CS Advantage"              statObj={d?.maxCsAdvantage}                   mode={viewMode} />
                      <DeepStatCard label="Takedowns after lvl up"        statObj={d?.takedownsAfterLevelAdvantage}     mode={viewMode} />
                      <DeepStatCard label="Takedowns before jungle spawn" statObj={d?.takedownsBeforeJungleMinionSpawn} mode={viewMode} />
                    </div>
                  </div>

                  {data.mostPlayed?.length > 0 && (
                    <div className="analysis-section">
                      <div className="analysis-section-header">
                        <span className="section-title">Most Played Champions</span>
                        <div className="section-divider" />
                        <span className="section-subtitle">top {data.mostPlayed.length} by games</span>
                      </div>
                      <div className="champ-cards-grid">
                        {data.mostPlayed.map(c => (
                          <div key={c.championName} className="champ-card">
                            <div className="champ-card-top">
                              <img
                                className="champ-card-icon"
                                src={`https://ddragon.leagueoflegends.com/cdn/${ddVersion}/img/champion/${{ FiddleSticks: 'Fiddlesticks' }[c.championName] || c.championName}.png`}
                                alt={c.championName}
                              />
                              <div className="champ-card-identity">
                                <span className="champ-card-name">{c.championName}</span>
                                <span className="champ-card-record">
                                  <span className="champ-rec-w">{c.wins}W</span>
                                  {' '}
                                  <span className="champ-rec-l">{c.games - c.wins}L</span>
                                  {' · '}
                                  <span className={c.winRate >= 50 ? 'champ-wr-hi' : 'champ-wr-lo'}>{c.winRate}%</span>
                                </span>
                              </div>
                            </div>
                            <div className="champ-card-kda-row">
                              <span className="kda-k">{c.avgKills}</span>
                              <span className="kda-sep"> / </span>
                              <span className="kda-d">{c.avgDeaths}</span>
                              <span className="kda-sep"> / </span>
                              <span className="kda-a">{c.avgAssists}</span>
                            </div>
                            <div className="champ-card-kda-label">avg K / D / A</div>
                            <div className="champ-card-bottom">
                              <div className="champ-mini-stat">
                                <span className="champ-mini-val champ-ai-val">{c.avgAiScore}</span>
                                <span className="champ-mini-label">AI Score</span>
                              </div>
                              <div className="champ-mini-stat">
                                <span className="champ-mini-val">{c.avgCsPerMin}</span>
                                <span className="champ-mini-label">CS / min</span>
                              </div>
                              <div className="champ-mini-stat">
                                <span className="champ-mini-val">{formatTimePlayed(c.timePlayed)}</span>
                                <span className="champ-mini-label">Time Played</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
