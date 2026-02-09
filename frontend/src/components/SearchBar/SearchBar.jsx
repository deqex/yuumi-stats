import React from 'react';

export default function SearchBar({
  summonerName,
  setSummonerName,
  summonerTag,
  setSummonerTag,
  handleSearch,
}) {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="search-container">
      <div style={{ display: 'flex', gap: '10px', flex: 1, paddingLeft: '20px' }}>
        <input
          type="text"
          placeholder="Summoner Name"
          className="search-input"
          value={summonerName}
          onChange={(e) => setSummonerName(e.target.value)}
          onKeyPress={handleKeyPress}
          style={{ maxWidth: '200px' }}
        />
        <input
          type="text"
          placeholder="Tagline"
          className="search-input"
          value={summonerTag}
          onChange={(e) => setSummonerTag(e.target.value)}
          onKeyPress={handleKeyPress}
          style={{ maxWidth: '100px' }}
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
