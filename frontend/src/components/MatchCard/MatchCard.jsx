import React from 'react'

// data: result of dissectMatchData(matchData)
// focusName: summoner name to highlight (riotIdGameName)

export default function MatchCard({ data, focusName }) {
  if (!data) return null;

  const players = Object.values(data);
  const focusLower = (focusName || '').toLowerCase();
  const focusPlayer = players.find(p => (p?.name || '')?.toLowerCase() === focusLower);

  return (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '180px 1fr 360px',
        gap: '12px',
        alignItems: 'center',
        padding: '12px',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        background: '#ffffff',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        width: '100%'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{
            display: 'inline-block',
            padding: '4px 8px',
            borderRadius: '999px',
            fontWeight: 700,
            color: focusPlayer?.win ? '#065f46' : '#991b1b',
            background: focusPlayer?.win ? '#d1fae5' : '#fee2e2'
          }}>{focusPlayer?.win ? 'Victory' : 'Defeat'}</span>
          <div style={{ color: '#111827', fontWeight: 700 }}>{focusPlayer?.kills}/{focusPlayer?.deaths}/{focusPlayer?.assists} <span style={{ color: '#6b7280', fontWeight: 500 }}>K/D/A</span></div>
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ color: '#111827', fontWeight: 600 }}>Damage {focusPlayer?.damageToChampions}</div>
          <div style={{ color: '#6b7280' }}>Vision {focusPlayer?.visionScore}</div>
          <div style={{ color: '#6b7280' }}>CS {focusPlayer?.cs}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: '16px', rowGap: '0px', alignSelf: 'start', justifyItems: 'start', alignItems: 'start' }}>
          <div style={{ width: '100%' }}>
            {players.slice(0,5).map((p, idx) => {
              const isFocus = (p?.name||'').toLowerCase() === focusLower;
              return (
                <div key={`t1-${idx}`} style={{ display: 'flex', alignItems: 'center', height: '20px' }}>
                  <span style={{
                    display: 'inline-block',
                    maxWidth: '160px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: isFocus ? '#000000' : '#000000',
                    fontWeight: isFocus ? 700 : 400,
                    lineHeight: '20px'
                  }}>{p?.name}</span>
                </div>
              )
            })}
          </div>
          <div style={{ width: '100%' }}>
            {players.slice(5,10).map((p, idx) => {
              const isFocus = (p?.name||'').toLowerCase() === focusLower;
              return (
                <div key={`t2-${idx}`} style={{ display: 'flex', alignItems: 'center', height: '20px' }}>
                  <span style={{
                    display: 'inline-block',
                    maxWidth: '160px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: isFocus ? '#000000' : '#000000',
                    fontWeight: isFocus ? 700 : 400,
                    lineHeight: '20px'
                  }}>{p?.name}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
