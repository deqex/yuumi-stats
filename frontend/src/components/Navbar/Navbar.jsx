import React from 'react';

export default function Navbar() {
  const navItems = ['Player search', 'Groups', 'Leaderboard'];

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <span>Yuumi.gg</span>
      </div>
      <div className="navbar-nav">
        {navItems.map((item, idx) => (
          <span
            key={item}
            className={`navbar-item ${idx === 0 ? 'active' : ''}`}
          >
            {item}
          </span>
        ))}
      </div>
    </nav>
  );
}
