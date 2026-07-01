import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { getWatchlist, searchStocks } from '../services/api';
import type { Stock } from '../types';

const tl = {
  en: {
    title: 'Discover', search: 'Search ticker or company...', allSectors: 'All Sectors',
    ticker: 'Ticker', name: 'Company', price: 'Price', change: 'Change', volume: 'Volume',
    mktCap: 'Mkt Cap', sector: 'Sector', noResults: 'No stocks found.',
    watchlist: 'Watchlist', popular: 'Popular',
    view: 'View',
  },
  th: {
    title: 'ค้นหาหุ้น', search: 'ค้นหา ticker หรือชื่อบริษัท...', allSectors: 'ทุกกลุ่ม',
    ticker: 'Ticker', name: 'บริษัท', price: 'ราคา', change: 'เปลี่ยน', volume: 'ปริมาณ',
    mktCap: 'มูลค่าตลาด', sector: 'กลุ่ม', noResults: 'ไม่พบหุ้น',
    watchlist: 'Watchlist', popular: 'ยอดนิยม',
    view: 'ดู',
  },
};

const POPULAR = ['AAPL','MSFT','GOOGL','AMZN','NVDA','META','TSLA','AMD','NFLX','ORCL','INTC','QCOM','AVGO','CRM'];

function fmtPct(n: number) { return (n >= 0 ? '+' : '') + n.toFixed(2) + '%'; }
function fmtPrice(n: number) { return '$' + n.toFixed(2); }
function fmtLarge(n: number) {
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return '$' + (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6)  return '$' + (n / 1e6).toFixed(1) + 'M';
  return '$' + n.toFixed(0);
}

export default function Discover() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const t = tl[lang];

  const [activeTab, setActiveTab] = useState<'watchlist' | 'popular'>('watchlist');
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Stock[]>([]);
  const [searching, setSearching] = useState(false);
  const [sortKey, setSortKey] = useState<keyof Stock>('change_pct');
  const [sortAsc, setSortAsc] = useState(false);
  const [sectorFilter, setSectorFilter] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadTab = async () => {
      setLoading(true); setStocks([]);
      try {
        if (activeTab === 'watchlist') {
          const wl = await getWatchlist();
          if (!cancelled) setStocks(wl);
        } else {
          const results = await Promise.all(POPULAR.map(tk =>
            searchStocks(tk).then(r => (r as unknown as Stock[])[0]).catch(() => null)
          ));
          if (!cancelled) setStocks(results.filter((s): s is Stock => s !== null));
        }
      } catch { /* ignore */ }
      finally { if (!cancelled) setLoading(false); }
    };
    loadTab();
    return () => { cancelled = true; };
  }, [activeTab]);

  useEffect(() => {
    if (!query.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try { setSearchResults(await searchStocks(query) as unknown as Stock[]); }
      catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 280);
    return () => clearTimeout(timer);
  }, [query]);

  const display = query.trim() ? searchResults : stocks;
  const sectors = Array.from(new Set(display.map(s => s.sector).filter(Boolean))).sort();
  const filtered = sectorFilter ? display.filter(s => s.sector === sectorFilter) : display;

  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey] ?? 0;
    const bv = b[sortKey] ?? 0;
    if (typeof av === 'string' && typeof bv === 'string') return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  const toggleSort = (key: keyof Stock) => {
    if (sortKey === key) setSortAsc(v => !v);
    else { setSortKey(key); setSortAsc(false); }
  };

  const SortIcon = ({ k }: { k: keyof Stock }) => {
    if (sortKey !== k) return <span style={{ color: '#c4c8d0', marginLeft: 3, fontSize: 9 }}>↕</span>;
    return <span style={{ color: 'var(--accent)', marginLeft: 3, fontSize: 9 }}>{sortAsc ? '↑' : '↓'}</span>;
  };

  const headerCell = (label: string, k: keyof Stock, textAlign: 'left' | 'right' = 'right') => (
    <span
      onClick={() => toggleSort(k)}
      style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', justifyContent: textAlign === 'right' ? 'flex-end' : 'flex-start', gap: 2 }}
    >
      {label}<SortIcon k={k} />
    </span>
  );

  return (
    <div className="page-content animate-fade-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{t.title}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {['watchlist','popular'].map(tab => (
            <button key={tab} className={`tab-btn${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab as 'watchlist' | 'popular')}>
              {t[tab as 'watchlist' | 'popular']}
            </button>
          ))}
        </div>
      </div>

      {/* Filters row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a7aab2" strokeWidth="1.9" strokeLinecap="round">
            <circle cx="11" cy="11" r="7.5" /><line x1="21" y1="21" x2="16.7" y2="16.7" />
          </svg>
          <input className="input" value={query} onChange={e => setQuery(e.target.value)} placeholder={t.search} style={{ paddingLeft: 35 }} />
        </div>
        {sectors.length > 0 && (
          <select
            className="input"
            value={sectorFilter}
            onChange={e => setSectorFilter(e.target.value)}
            style={{ width: 'auto', minWidth: 140, fontFamily: 'var(--font-sans)' }}
          >
            <option value="">{t.allSectors}</option>
            {sectors.map(s => <option key={s} value={s!}>{s}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ borderRadius: 18, overflow: 'hidden', padding: 0 }}>
        <div className="data-table" style={{ borderRadius: 18 }}>
          <div className="data-table-header" style={{ gridTemplateColumns: '80px 1fr 90px 90px 90px 100px 120px 70px' }}>
            {headerCell(t.ticker, 'ticker', 'left')}
            {headerCell(t.name, 'name', 'left')}
            {headerCell(t.price, 'price')}
            {headerCell(t.change, 'change_pct')}
            {headerCell(t.volume, 'volume')}
            {headerCell(t.mktCap, 'market_cap')}
            <span>{t.sector}</span>
            <span></span>
          </div>

          {loading || searching ? (
            [0,1,2,3,4,5].map(i => (
              <div key={i} className="data-table-row" style={{ gridTemplateColumns: '80px 1fr 90px 90px 90px 100px 120px 70px' }}>
                <div className="skeleton" style={{ width: '60%', height: 14 }} />
                <div className="skeleton" style={{ width: '80%', height: 14 }} />
                <div className="skeleton" style={{ width: '70%', height: 14, marginLeft: 'auto' }} />
                <div className="skeleton" style={{ width: '60%', height: 14, marginLeft: 'auto' }} />
                <div className="skeleton" style={{ width: '60%', height: 14, marginLeft: 'auto' }} />
                <div className="skeleton" style={{ width: '70%', height: 14, marginLeft: 'auto' }} />
                <div className="skeleton" style={{ width: '80%', height: 14 }} />
                <div className="skeleton" style={{ width: '60%', height: 26, borderRadius: 7 }} />
              </div>
            ))
          ) : sorted.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--ink-tertiary)' }}>{t.noResults}</div>
          ) : sorted.map(s => {
            const up = s.change_pct >= 0;
            const c = up ? '#15a06a' : '#e0594a';
            return (
              <div key={s.ticker} className="data-table-row" style={{ gridTemplateColumns: '80px 1fr 90px 90px 90px 100px 120px 70px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{s.ticker}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>{s.name ?? '—'}</span>
                <span style={{ fontFamily: 'var(--font-mono)', textAlign: 'right' }}>{fmtPrice(s.price)}</span>
                <span style={{ fontFamily: 'var(--font-mono)', color: c, fontWeight: 600, textAlign: 'right' }}>{fmtPct(s.change_pct)}</span>
                <span style={{ fontFamily: 'var(--font-mono)', textAlign: 'right', color: '#8a909e' }}>
                  {s.volume ? (s.volume >= 1e6 ? (s.volume / 1e6).toFixed(1) + 'M' : (s.volume / 1e3).toFixed(0) + 'K') : '—'}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', textAlign: 'right', color: '#8a909e' }}>{s.market_cap ? fmtLarge(s.market_cap) : '—'}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>
                  {s.sector ? <span className="badge-sector">{s.sector}</span> : <span style={{ color: '#c4c8d0' }}>—</span>}
                </span>
                <button className="btn btn-outline btn-sm" onClick={() => navigate(`/stock/${s.ticker}`)}>{t.view}</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
