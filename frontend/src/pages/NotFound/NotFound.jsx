import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components';
import './NotFound.css';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="notfound-container">
      <Navbar />
      <div className="notfound-content">
        <h1 className="notfound-code">404</h1>
        <p className="notfound-message">This page doesn't exist.</p>
        <button className="notfound-button" onClick={() => navigate('/')}>
          Go home
        </button>
      </div>
    </div>
  );
}
