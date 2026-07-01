import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { searchStocks } from '../services/api';
import type { Stock } from '../types';

export default function Topbar() {
  const { lang, setLang } = useLang();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Stock[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const onChange = (v: string) => {
    setQuery(v);
    clearTimeout(timer.current);
    if (!v.trim()) { setResults([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      try {
        const r = await searchStocks(v);
        setResults(r.slice(0, 8) as unknown as Stock[]);
        setOpen(true);
      } catch { setResults([]); }
    }, 280);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (ticker: string) => {
    setQuery(''); setResults([]); setOpen(false);
    navigate(`/stock/${ticker}`);
  };

  return (
    <header className="topbar">
      {/* Search */}
      <div ref={ref} style={{ position: 'relative', flex: 1, maxWidth: 380 }}>
        <svg style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a7aab2" strokeWidth="1.9" strokeLinecap="round">
          <circle cx="11" cy="11" r="7.5" /><line x1="21" y1="21" x2="16.7" y2="16.7" />
        </svg>
        <input
          className="input"
          value={query}
          onChange={e => onChange(e.target.value)}
          placeholder={lang === 'th' ? 'ค้นหา ticker หรือชื่อบริษัท...' : 'Search ticker or company...'}
          style={{ paddingLeft: 37, borderRadius: 12 }}
        />
        {open && results.length > 0 && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
            background: '#fff', border: '1px solid var(--border)', borderRadius: 12,
            boxShadow: '0 8px 24px rgba(20,22,28,0.12)', zIndex: 100, overflow: 'hidden',
          }}>
            {results.map((r: Stock & { name?: string }) => (
              <div
                key={r.ticker}
                onClick={() => select(r.ticker)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
                  cursor: 'pointer', transition: 'background 140ms',
                  borderBottom: '1px solid var(--border-soft)',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-panel)')}
                onMouseLeave={e => (e.currentTarget.style.background = '')}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13, minWidth: 56 }}>{r.ticker}</span>
                <span style={{ fontSize: 12, color: 'var(--ink-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* Market status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 11px', background: '#e6f5ee', border: '1px solid #c7ead8', borderRadius: 10 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#15a06a', boxShadow: '0 0 0 3px rgba(21,160,106,0.18)' }} />
        <span style={{ fontSize: 11.5, fontWeight: 600, color: '#0f7d54' }}>
          {lang === 'th' ? 'ตลาดเปิด' : 'Market Open'}
        </span>
      </div>

      {/* Language toggle */}
      <div style={{ display: 'flex', background: '#efe4d0', borderRadius: 10, padding: 3, gap: 2 }}>
        {(['en', 'th'] as const).map(l => (
          <button
            key={l}
            onClick={() => setLang(l)}
            style={{
              border: 'none', cursor: 'pointer', fontSize: 11.5, fontWeight: 600,
              padding: '5px 10px', borderRadius: 8, fontFamily: 'var(--font-sans)',
              background: lang === l ? '#fff' : 'transparent',
              color: lang === l ? 'var(--ink)' : 'var(--ink-muted)',
              boxShadow: lang === l ? '0 1px 3px rgba(20,22,28,0.12)' : 'none',
              transition: 'all 160ms',
            }}
          >
            {l === 'en' ? 'EN' : 'ไทย'}
          </button>
        ))}
      </div>
    </header>
  );
}
