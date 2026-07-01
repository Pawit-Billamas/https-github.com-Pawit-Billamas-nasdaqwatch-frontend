import { useNavigate } from 'react-router-dom';
import type { WatchlistItem } from '../types';

interface Props {
  stock: WatchlistItem;
  onRemove?: () => void;
  onClick?: () => void;
}

function formatMarketCap(val: number): string {
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
  return `$${val.toFixed(0)}`;
}

function formatVolume(val: number): string {
  if (val >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
  if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
  return `${val}`;
}

export default function StockCard({ stock, onRemove, onClick }: Props) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) onClick();
    else navigate(`/stock/${stock.ticker}`);
  };

  const range = (stock.week_52_high ?? 0) - (stock.week_52_low ?? 0);
  const fillPct = range > 0
    ? Math.min(100, Math.max(0, ((stock.price - (stock.week_52_low ?? 0)) / range) * 100))
    : 50;

  const isUp = (stock.change_pct ?? 0) >= 0;

  return (
    <div
      className="card animate-fade-up"
      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0' }}
      onClick={handleClick}
    >
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '0.3rem' }}>
        <span
          className="font-mono"
          style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--ink)', letterSpacing: '-0.01em' }}
        >
          {stock.ticker}
        </span>
        <span className="badge badge-sector">{stock.sector}</span>
      </div>

      {/* Company name */}
      <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', marginBottom: '1rem', fontWeight: 400 }}>
        {stock.name}
      </p>

      {/* Price row */}
      <div className="flex-between" style={{ marginBottom: '0.9rem' }}>
        <span className="font-mono" style={{ fontWeight: 700, fontSize: '1.3rem', color: 'var(--ink)', letterSpacing: '-0.02em' }}>
          ${stock.price?.toFixed(2)}
        </span>
        <span
          className="font-mono"
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: isUp ? 'var(--up)' : 'var(--down)',
            background: isUp ? 'var(--up-bg)' : 'var(--down-bg)',
            padding: '0.15rem 0.5rem',
            borderRadius: '5px',
          }}
        >
          {isUp ? '+' : ''}{stock.change_pct?.toFixed(2)}%
        </span>
      </div>

      {/* 52W range bar */}
      {stock.week_52_high != null && stock.week_52_low != null && (
        <div style={{ marginBottom: '1rem' }}>
          <div className="flex-between" style={{ marginBottom: '0.4rem' }}>
            <span className="text-muted font-mono" style={{ fontSize: '0.62rem', letterSpacing: '0.06em' }}>
              52W LOW
            </span>
            <span className="text-muted font-mono" style={{ fontSize: '0.62rem', letterSpacing: '0.06em' }}>
              52W HIGH
            </span>
          </div>
          <div style={{
            height: '4px',
            background: 'var(--surface)',
            borderRadius: '2px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              left: 0, top: 0,
              height: '100%',
              width: `${fillPct}%`,
              background: 'var(--accent)',
              borderRadius: '2px',
              transition: 'width 0.5s var(--ease-out)',
            }} />
          </div>
          <div className="flex-between" style={{ marginTop: '0.3rem' }}>
            <span className="font-mono text-muted" style={{ fontSize: '0.68rem' }}>
              ${stock.week_52_low?.toFixed(2)}
            </span>
            <span className="font-mono text-muted" style={{ fontSize: '0.68rem' }}>
              ${stock.week_52_high?.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Volume / MCap row */}
      {(stock.volume != null || stock.market_cap != null) && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          {stock.volume != null && (
            <div>
              <div className="text-muted" style={{ fontSize: '0.65rem', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '1px' }}>Vol</div>
              <div className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--ink-secondary)', fontWeight: 500 }}>{formatVolume(stock.volume)}</div>
            </div>
          )}
          {stock.market_cap != null && (
            <div>
              <div className="text-muted" style={{ fontSize: '0.65rem', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '1px' }}>MCap</div>
              <div className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--ink-secondary)', fontWeight: 500 }}>{formatMarketCap(stock.market_cap)}</div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex-between" style={{ marginTop: 'auto', paddingTop: '0.25rem' }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={e => { e.stopPropagation(); handleClick(); }}
        >
          ดูข่าว →
        </button>
        {onRemove && (
          <button
            className="btn btn-icon btn-secondary"
            title={`ลบ ${stock.ticker}`}
            onClick={e => { e.stopPropagation(); onRemove(); }}
            style={{ color: 'var(--down)', borderColor: 'var(--down-border)' }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
