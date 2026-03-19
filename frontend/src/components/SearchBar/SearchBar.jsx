import React from 'react';

export default function SearchBar({
  summonerName,
  setSummonerName,
  summonerTag,
  setSummonerTag,
  handleSearch,
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="search-container">
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, paddingLeft: '20px' }}>
        <input
          type="text"
          placeholder="Summoner Name"
          className="search-input"
          value={summonerName}
          onChange={(e) => setSummonerName(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ flex: 1 }}
        />
        <span style={{ fontSize: '1.4rem', fontWeight: 600, color: '#b39ddb', lineHeight: 1, userSelect: 'none', flexShrink: 0 }}>#</span>
        <input
          type="text"
          placeholder="TAG"
          className="search-input"
          value={summonerTag}
          onChange={(e) => setSummonerTag(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ width: '40px', flexShrink: 0 }}
        />
      </div>
      <button
        className="search-button"
        onClick={handleSearch}
        disabled={!summonerName || !summonerTag}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
    </div>
  );
}
