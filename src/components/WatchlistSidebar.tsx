import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getWatchlist } from '../services/api';
import type { WatchlistItem } from '../types';

export default function WatchlistSidebar() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const navigate = useNavigate();
  const { ticker } = useParams();

  useEffect(() => {
    getWatchlist().then(setItems).catch(() => {});
  }, []);

  if (items.length === 0) {
    return (
      <div style={{ padding: '1rem 1.5rem' }}>
        <p style={{ fontSize: '0.72rem', color: 'rgba(232,226,212,0.3)', fontFamily: 'var(--font-mono)' }}>
          No stocks added yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      {items.map(item => (
        <div
          key={item.ticker}
          className={`ticker-card${ticker === item.ticker ? ' active' : ''}`}
          onClick={() => navigate(`/stock/${item.ticker}`)}
        >
          <span className="symbol">{item.ticker}</span>
          <span className="name">{item.name}</span>
          <div className="price-row">
            <span className="price">${item.price?.toFixed(2)}</span>
            <span className={item.change_pct >= 0 ? 'change-up' : 'change-down'}>
              {item.change_pct >= 0 ? '+' : ''}{item.change_pct?.toFixed(2)}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
