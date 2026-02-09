import React from 'react';

export default function RegionButtons({ region, setRegion }) {
  const regionMap = {
    'EUW': 'euw1',
    'EUNE': 'eun1',
    'NA': 'na1',
    'LAS': 'la2',
    'BR': 'br1',
    'TR': 'tr1',
    'KR': 'kr',
    'OCE': 'oc1',
  };

  const regionLabels = ['EUW', 'EUNE', 'NA', 'LAS', 'BR', 'TR', 'KR', 'OCE'];

  return (
    <div className="regions">
      {regionLabels.map(label => (
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
      ))}
    </div>
  );
}
