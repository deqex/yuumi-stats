import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../../components';
import { useAuth } from '../../context/AuthContext';
import './Group.css';

export default function Groups() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName]         = useState('');
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState('');

  const [myGroups, setMyGroups]     = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setGroupsLoading(true);
    fetch('/api/groups/mine', {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then(r => r.json())
      .then(data => setMyGroups(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setGroupsLoading(false));
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setCreateErr('');
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateErr(data.error || 'Failed to create group.'); return; }
      navigate(`/groups/${data._id}`);
    } catch {
      setCreateErr('Could not connect to server.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="groups-page">
      <Navbar />
      <div className="groups-inner">
        <h1 className="groups-title">Groups</h1>
        <p className="groups-subtitle">
          Create a group of League players and compare their stats on a leaderboard.
        </p>

        {user ? (
          <div className="groups-create-card">
            <h2 className="groups-card-title">Create a New Group</h2>
            <form className="groups-create-form" onSubmit={handleCreate}>
              <input
                className="groups-input"
                type="text"
                placeholder="Group name (e.g. Friday Night Crew)"
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={60}
              />
              {createErr && <p className="groups-error">{createErr}</p>}
              <button className="groups-btn-primary" type="submit" disabled={creating || !name.trim()}>
                {creating ? 'Creating…' : 'Create Group'}
              </button>
            </form>
          </div>
        ) : (
          <div className="groups-login-prompt">
            <p>You need to be logged in to create a group.</p>
            <button className="groups-btn-primary" onClick={() => navigate('/login')}>
              Log In
            </button>
          </div>
        )}

        {user && (
          <div className="groups-my-groups">
            <h2 className="groups-card-title">My Groups</h2>
            {groupsLoading ? (
              <div className="groups-loading">
                <div className="analysis-spinner" />
              </div>
            ) : myGroups.length === 0 ? (
              <p className="groups-empty">You haven't created any groups yet.</p>
            ) : (
              <div className="groups-list">
                {myGroups.map(g => (
                  <Link key={g._id} to={`/groups/${g._id}`} className="groups-list-item">
                    <span className="groups-list-name">{g.name}</span>
                    <span className="groups-list-meta">{g.members.length} member{g.members.length !== 1 ? 's' : ''}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
