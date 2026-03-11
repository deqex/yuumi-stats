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
          Player search
        </Link>
        <Link
          to="/groups"
          className={`navbar-item ${isGroups ? 'active' : ''}`}
          style={{ textDecoration: 'none' }}
          onClick={closeMenu}
        >
          Groups
        </Link>
        <Link
          to="/leaderboard"
          className={`navbar-item ${isLeaderboard ? 'active' : ''}`}
          style={{ textDecoration: 'none' }}
          onClick={closeMenu}
        >
          Leaderboard
        </Link>
        {user ? (
          <Link
            to="/account"
            className="navbar-login-btn"
            style={{ textDecoration: 'none' }}
            onClick={closeMenu}
          >
            {user.username}
          </Link>
        ) : (
          <button
            className="navbar-login-btn"
            onClick={() => { navigate('/login'); closeMenu(); }}
          >
            Log In
          </button>
        )}
      </div>
    </nav>
  );
}
