import { useEffect, useState } from 'react';
import { toast } from '../../utils/toast';
import './Toast.css';

const DURATION = 4000;

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsub = toast._subscribe(t => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => {
        setToasts(prev => prev.filter(x => x.id !== t.id));
      }, DURATION);
    });
    return unsub;
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast--${t.type}`}>
          <span className="toast-icon">
            {t.type === 'error' ? '✕' : t.type === 'warn' ? '⚠' : 'ℹ'}
          </span>
          <span className="toast-message">{t.message}</span>
          <button
            className="toast-close"
            onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
