import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import catLogo from '../../assets/img/cat.png';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isLeaderboard = location.pathname === '/leaderboard';
  const isGroups = location.pathname.startsWith('/groups');

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <img src={catLogo} alt="logo" style={{ height: '52px', borderRadius: '6px' }} />
        <span>Yuumi.gg</span>
      </Link>
      <div className="navbar-nav">
        <Link
          to="/"
          className={`navbar-item ${!isLeaderboard && !isGroups ? 'active' : ''}`}
          style={{ textDecoration: 'none' }}
        >
          Player search
        </Link>
        <Link
          to="/groups"
          className={`navbar-item ${isGroups ? 'active' : ''}`}
          style={{ textDecoration: 'none' }}
        >
          Groups
        </Link>
        <Link
          to="/leaderboard"
          className={`navbar-item ${isLeaderboard ? 'active' : ''}`}
          style={{ textDecoration: 'none' }}
        >
          Leaderboard
        </Link>
        {user ? (
          <Link
            to="/account"
            className="navbar-login-btn"
            style={{ textDecoration: 'none' }}
          >
            {user.username}
          </Link>
        ) : (
          <button
            className="navbar-login-btn"
            onClick={() => navigate('/login')}
          >
            Log In
          </button>
        )}
      </div>
    </nav>
  );
}
