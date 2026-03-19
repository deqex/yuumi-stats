import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import catLogo from '../../assets/img/cat.png';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isLeaderboard = location.pathname === '/leaderboard';
  const isGroups = location.pathname.startsWith('/groups');
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo" onClick={closeMenu}>
        <img src={catLogo} alt="logo" style={{ height: '52px', borderRadius: '6px' }} />
        <span>Yuumi Stats</span>
      </Link>

      <button
        className={`navbar-hamburger ${menuOpen ? 'open' : ''}`}
        onClick={() => setMenuOpen(o => !o)}
        aria-label="Toggle menu"
      >
        <span />
        <span />
        <span />
      </button>

      <div className={`navbar-nav ${menuOpen ? 'open' : ''}`}>
        <Link
          to="/"
          className={`navbar-item ${!isLeaderboard && !isGroups ? 'active' : ''}`}
          style={{ textDecoration: 'none' }}
          onClick={closeMenu}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          Player search
        </Link>
        <Link
          to="/groups"
          className={`navbar-item ${isGroups ? 'active' : ''}`}
          style={{ textDecoration: 'none' }}
          onClick={closeMenu}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Groups
        </Link>
        <Link
          to="/leaderboard"
          className={`navbar-item ${isLeaderboard ? 'active' : ''}`}
          style={{ textDecoration: 'none' }}
          onClick={closeMenu}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
          </svg>
          Leaderboards
        </Link>
        {user ? (
          <Link
            to="/account"
            className="navbar-login-btn"
            style={{ textDecoration: 'none' }}
            onClick={closeMenu}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {user.username}
          </Link>
        ) : (
          <button
            className="navbar-login-btn"
            onClick={() => { navigate('/login'); closeMenu(); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            Log In
          </button>
        )}
      </div>
    </nav>
  );
}
