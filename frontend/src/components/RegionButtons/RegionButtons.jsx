import React from 'react';

export default function RegionButtons({ region, setRegion }) {
  const regionMap = {
    'EUW': 'euw1',
    'EUNE': 'eun1',
    'NA': 'na1',
    'LAN': 'la1',
    'LAS': 'la2',
    'BR': 'br1',
    'TR': 'tr1',
    'ME': 'me1',
    'RU': 'ru',
    'KR': 'kr',
    'JP': 'jp1',
    'OCE': 'oc1',
    'SG': 'sg2',
    'TW': 'tw2',
    'VN': 'vn2',
  };

  const row1 = ['EUW', 'EUNE', 'NA', 'LAS', 'BR', 'TR', 'KR', 'OCE'];
  const row2 = ['LAN', 'ME', 'RU', 'JP', 'SG', 'TW', 'VN'];

  const renderButton = (label) => (
    <button
      key={label}
      className="region-button"
      style={{
        opacity: region === regionMap[label] ? 1 : 0.6,
        transform: region === regionMap[label] ? 'scale(1.05)' : 'scale(1)',
      }}
      onClick={() => setRegion(regionMap[label])}
    >
      {label}
    </button>
  );

  return (
    <div className="regions">
      <div className="regions-row">{row1.map(renderButton)}</div>
      <div className="regions-row">{row2.map(renderButton)}</div>
    </div>
  );
}
