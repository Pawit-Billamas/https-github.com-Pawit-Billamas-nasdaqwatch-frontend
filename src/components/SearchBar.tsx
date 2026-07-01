import { useState, useEffect, useRef, useCallback } from 'react';
import { searchStocks } from '../services/api';
import type { Stock } from '../types';

interface Props {
  onSelect: (ticker: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({ onSelect, placeholder = 'Search ticker or company...', className }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const data = await searchStocks(q);
      setResults(data);
      setOpen(true);
      setActiveIndex(-1);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (ticker: string) => {
    onSelect(ticker);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) {
        handleSelect(results[activeIndex].ticker);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
    >
      <div style={{ position: 'relative', flex: 1 }}>
        <input
          className="input"
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          style={{ paddingRight: loading ? '2.25rem' : undefined }}
        />
        {loading && (
          <div style={{
            position: 'absolute',
            right: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
          }}>
            <div className="spinner" />
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          background: 'var(--surface-raised)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 4px 16px rgba(30,36,51,0.12)',
          zIndex: 200,
          overflow: 'hidden',
        }}>
          {results.map((stock, i) => (
            <div
              key={stock.ticker}
              onMouseDown={() => handleSelect(stock.ticker)}
              onMouseEnter={() => setActiveIndex(i)}
              style={{
                padding: '0.6rem 1rem',
                cursor: 'pointer',
                borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: activeIndex === i ? 'var(--parchment-dim)' : 'transparent',
                transition: 'background 150ms',
              }}
            >
              <div>
                <span className="font-mono" style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--navy)' }}>
                  {stock.ticker}
                </span>
                <span className="text-muted" style={{ marginLeft: '0.5rem', fontSize: '0.78rem' }}>
                  {stock.name}
                </span>
              </div>
              <span className="badge-sector badge">{stock.sector}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
