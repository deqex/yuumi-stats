import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  const isLeaderboard = location.pathname === '/leaderboard';

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <span>Yuumi.gg</span>
      </Link>
      <div className="navbar-nav">
        <span className={`navbar-item ${!isLeaderboard ? 'active' : ''}`}>
          Player search
        </span>
        <span className="navbar-item">Groups</span>
        <Link
          to="/leaderboard"
          className={`navbar-item ${isLeaderboard ? 'active' : ''}`}
          style={{ textDecoration: 'none' }}
        >
          Leaderboard
        </Link>
      </div>
    </nav>
  );
}
