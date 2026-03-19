import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import { useAuth } from '../../context/AuthContext';
import './Account.css';

export default function Account() {
  const { user, updateLeagueName, logout } = useAuth();
  const navigate = useNavigate();
  const [leagueName, setLeagueName] = useState(user?.leagueName || '');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch('/api/auth/account', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user?.token}` },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) {
        let msg = 'Failed to delete account.';
        try { msg = (await res.json()).message || msg; } catch {}
        setError(msg);
        setDeleting(false);
        setDeleteConfirm(false);
        return;
      }
      logout();
      navigate('/');
    } catch {
      clearTimeout(timeout);
      setError('Could not connect to server.');
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/league-name', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ leagueName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to save.');
        setLoading(false);
        return;
      }

      updateLeagueName(data.leagueName);
      setSaved(true);
      setLoading(false);
    } catch (err) {
      setError('Could not connect to server.');
      setLoading(false);
    }
  };

  return (
    <div className="account-page">
      <Navbar />
      <div className="account-wrapper">
        <div className="account-card">
          <div className="account-header">
            <div className="account-avatar">
              {user?.username?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="account-username">{user?.username || 'Guest'}</h2>
              <p className="account-sub">Your account settings</p>
            </div>
          </div>

          <div className="account-divider" />

          <form className="account-form" onSubmit={handleSave}>
            <div className="account-field">
              <label>League of Legends Name</label>
              <input
                type="text"
                value={leagueName}
                onChange={e => { setLeagueName(e.target.value); setSaved(false); }}
                placeholder="e.g. Doublelift#NA1"
              />
              <span className="account-field-hint">Enter your Riot ID (Name#Tag)</span>
            </div>

            {error && <p className="account-error">{error}</p>}
            {saved && <p className="account-success">Saved!</p>}

            <button className="account-save" type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </form>

          {user && (
            <button className="account-logout" onClick={logout}>
              Log out
            </button>
          )}

          {user && !deleteConfirm && (
            <button className="account-delete" onClick={() => setDeleteConfirm(true)}>
              Delete account
            </button>
          )}

          {deleteConfirm && (
            <div className="account-delete-confirm">
              <p>Are you sure? This cannot be undone.</p>
              <div className="account-delete-confirm-actions">
                <button className="account-delete-confirm-yes" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Yes, delete'}
                </button>
                <button className="account-delete-confirm-cancel" onClick={() => setDeleteConfirm(false)} disabled={deleting}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
