import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const navItems = ['Player search', 'Groups', 'Leaderboard'];

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <span>Yuumi.gg</span>
      </Link>
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
