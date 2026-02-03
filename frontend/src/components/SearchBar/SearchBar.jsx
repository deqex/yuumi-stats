import React from 'react';

export default function SearchBar() {
  return (
    <div className="search-container">
      <input
        type="text"
        placeholder="Search a player"
        className="search-input"
        disabled
      />
      <div className="search-button">
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
      </div>
    </div>
  );
}
