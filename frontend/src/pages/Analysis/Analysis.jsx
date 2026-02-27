
import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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


export default function Analysis() {
  const params = useParams();
  const navigate = useNavigate();

  const summonerName = params?.nameTag?.split('-')[0] || '';
  const summonerTag  = params?.nameTag?.split('-').slice(1).join('-') || '';
  const region = params?.region || 'euw1';

  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);
  const [viewMode, setViewMode]   = useState('avg');

  const [selectedRoles,  setSelectedRoles]  = useState(ALL_ROLES);
  const [selectedQueues, setSelectedQueues] = useState(ALL_QUEUES.filter(q => q !== 450));
  const [selectedDays,   setSelectedDays]   = useState(14);

  const [dirty, setDirty] = useState(false);

  const toggleRole = (role) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
    if (hasLoaded) setDirty(true);
  };

  const toggleQueue = (queue) => {
    setSelectedQueues(prev =>
      prev.includes(queue) ? prev.filter(q => q !== queue) : [...prev, queue]
    );
    if (hasLoaded) setDirty(true);
  };

  const fetchData = useCallback(async (roles, queues, days) => {
    if (!summonerName || !summonerTag) return;

    if (roles.length === 0 || queues.length === 0) {
      setData({ totalGames: 0, wins: 0, losses: 0, winRate: 0 });
      setHasLoaded(true);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams({ summonerName, summonerTag, region, days });

      if (roles.length < ALL_ROLES.length) {
        qs.append('roles', roles.join(','));
      }
      if (queues.length < ALL_QUEUES.length) {
        qs.append('queues', queues.join(','));
      }

      const res = await fetch(`/api/matches/analysis?${qs}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }
      setData(await res.json());
      setHasLoaded(true);
      setDirty(false);
    } catch (err) {
      setError(err.message || 'Failed to load analysis data.');
    } finally {
      setLoading(false);
    }
  }, [summonerName, summonerTag, region]);

  const handleLoad = () => {
    if (loading) return;
    fetchData(selectedRoles, selectedQueues, selectedDays);
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

        {!hasLoaded && !loading && (
          <div className="analysis-load-area">
            <div className="analysis-load-icon">📊</div>
            <p className="analysis-load-title">Player Analysis</p>
            <p className="analysis-load-subtitle">
              Load stats from the last 14 days across all game modes. This may take a moment.
            </p>
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
                    if (hasLoaded) setDirty(true);
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

            {dirty && !loading && (
              <div className="analysis-refetch-bar">
                <button className="analysis-update-btn" onClick={handleLoad}>
                  Update
                </button>
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
                                src={`https://ddragon.leagueoflegends.com/cdn/16.3.1/img/champion/${c.championName}.png`}
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
