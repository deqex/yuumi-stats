import React from 'react';

export default function RegionButtons() {
  const regions = ['EUW', 'EUNE', 'NA', 'LAS', 'BR', 'TR', 'KR', 'OCE'];

  return (
    <div className="regions">
      {regions.map(region => (
        <button
          key={region}
          className="region-button"
          disabled
        >
          {region}
        </button>
      ))}
    </div>
  );
}
