import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { getWatchlist, getMarketNews, removeFromWatchlist } from '../services/api';
import type { WatchlistItem, NewsItem } from '../types';

const t = {
  en: {
    greeting: 'Good morning',
    addStock: 'Add stock',
    watchlist: 'Watchlist',
    viewAll: 'View all',
    aiDigest: 'AI Digest',
    movers: 'Top Movers',
    heatmap: 'Sector Heatmap',
    emptyWatchlist: 'Your watchlist is empty',
    emptyWatchlistSub: 'Search for a ticker in the bar above and press Enter to add it.',
    stocks: 'stocks',
    updated: 'Updated',
    today: 'Today',
    fear: 'Fear',
    greed: 'Greed',
    greedy: 'Greedy',
    fearGreed: 'Fear & Greed Index',
    marketOverview: 'Market Overview',
    noNews: 'No news available',
    source: 'Source',
    bullish: 'Bullish',
    bearish: 'Bearish',
    neutral: 'Neutral',
    up: 'Up',
    down: 'Down',
  },
  th: {
    greeting: 'สวัสดีตอนเช้า',
    addStock: 'เพิ่มหุ้น',
    watchlist: 'รายการติดตาม',
    viewAll: 'ดูทั้งหมด',
    aiDigest: 'สรุปข่าวด้วย AI',
    movers: 'หุ้นเคลื่อนไหวสูง',
    heatmap: 'ฮีตแมปกลุ่มธุรกิจ',
    emptyWatchlist: 'รายการติดตามยังว่างอยู่',
    emptyWatchlistSub: 'พิมพ์ ticker ในช่องค้นหาด้านบน แล้วกด Enter เพื่อเพิ่ม',
    stocks: 'หุ้น',
    updated: 'อัปเดต',
    today: 'วันนี้',
    fear: 'กลัว',
    greed: 'โลภ',
    greedy: 'โลภ',
    fearGreed: 'ดัชนีความกลัว–โลภ',
    marketOverview: 'ภาพรวมตลาด',
    noNews: 'ไม่มีข่าวในขณะนี้',
    source: 'แหล่ง',
    bullish: 'บวก',
    bearish: 'ลบ',
    neutral: 'กลาง',
    up: 'ขึ้น',
    down: 'ลง',
  },
};

function spark(vals: number[], w = 116, h = 26, pad = 3) {
  if (!vals.length) return '';
  const min = Math.min(...vals), max = Math.max(...vals), r = (max - min) || 1;
  return vals.map((v, i) => {
    const x = pad + (i / (vals.length - 1)) * (w - 2 * pad);
    const y = pad + (1 - (v - min) / r) * (h - 2 * pad);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

const INDICES = [
  { label: 'NASDAQ', value: '18,342', pct: 1.24, vals: [60,62,61,64,63,66,65,68] },
  { label: 'S&P 500', value: '5,738', pct: 0.42, vals: [40,41,40,42,41,43,42,43] },
  { label: 'DOW', value: '42,233', pct: -0.18, vals: [50,49,50,48,49,47,48,48] },
  { label: 'VIX', value: '13.42', pct: -3.10, vals: [20,19,18,17,18,16,15,14] },
];

const HEATMAP = [
  { label: 'Semiconductors', labelTh: 'เซมิคอนดักเตอร์', pct: 2.1, size: 'xl' },
  { label: 'Software', labelTh: 'ซอฟต์แวร์', pct: -0.4, size: 'l' },
  { label: 'Internet', labelTh: 'อินเทอร์เน็ต', pct: 1.3, size: 'l' },
  { label: 'Consumer', labelTh: 'สินค้าอุปโภค', pct: 0.5, size: 'm' },
  { label: 'EV / Auto', labelTh: 'ยานยนต์', pct: -2.4, size: 'm' },
  { label: 'E-Commerce', labelTh: 'อีคอมเมิร์ซ', pct: 0.4, size: 's' },
  { label: 'Cloud', labelTh: 'คลาวด์', pct: 1.7, size: 's' },
  { label: 'Fintech', labelTh: 'ฟินเทค', pct: -0.9, size: 's' },
];

function heatColor(p: number) {
  if (p >= 1.5) return { bg: '#15884f', fg: '#eafaf1' };
  if (p >= 0.4) return { bg: '#8fc9a6', fg: '#123a25' };
  if (p > -0.4) return { bg: '#e7dcc4', fg: '#5b5138' };
  if (p > -1.5) return { bg: '#e6a196', fg: '#4a1a12' };
  return { bg: '#cc4a3a', fg: '#fbeae3' };
}

const DIGEST_MOCK = [
  { ticker: 'NVDA', source: 'Reuters', time: '2h', sent: 'bullish' as const,
    title: 'Nvidia unveils next-gen Rubin AI chips', titleTh: 'Nvidia เปิดตัว Rubin รุ่นใหม่',
    en: 'New Rubin GPUs push performance higher; analysts see durable demand into 2026.',
    th: 'Nvidia เปิดตัวชิป Rubin รุ่นใหม่ มองบวกระยะยาว' },
  { ticker: 'ASML', source: 'Bloomberg', time: '4h', sent: 'bullish' as const,
    title: 'ASML bookings rebound on AI chip orders', titleTh: 'ยอดสั่งซื้อ ASML กลับมาจากความต้องการ AI',
    en: 'Order backlog recovers as foundries expand capacity for AI accelerators.',
    th: 'ยอดสั่งซื้อ ASML ฟื้นตัวจากความต้องการเครื่องผลิตชิป AI' },
  { ticker: 'TSLA', source: 'CNBC', time: '6h', sent: 'bearish' as const,
    title: 'Tesla deliveries miss estimates in Europe', titleTh: 'ยอดส่งมอบ Tesla ต่ำกว่าคาด',
    en: 'Q2 deliveries below consensus; pricing pressure weighs on margins.',
    th: 'ยอดส่งมอบ Tesla ต่ำกว่าคาด ตลาด EV ยุโรปชะลอ' },
  { ticker: 'AAPL', source: 'WSJ', time: '9h', sent: 'neutral' as const,
    title: 'Apple expands AI features, holds hardware roadmap', titleTh: 'Apple ขยายฟีเจอร์ AI คงแผนฮาร์ดแวร์',
    en: 'Incremental AI rollout; limited near-term catalyst but stable fundamentals.',
    th: 'Apple ขยายฟีเจอร์ AI แต่ไม่เปลี่ยนแผนฮาร์ดแวร์' },
];

function sentStyle(s: 'bullish' | 'neutral' | 'bearish') {
  if (s === 'bullish') return { color: '#15a06a', bg: '#e6f5ee' };
  if (s === 'bearish') return { color: '#e0594a', bg: '#fbeae3' };
  return { color: '#6b7180', bg: '#efe4d0' };
}

function fmtPrice(p: number) {
  return '$' + p.toFixed(2);
}
function fmtPct(p: number) {
  return (p >= 0 ? '+' : '') + p.toFixed(2) + '%';
}

export default function Dashboard() {
  const { lang } = useLang();
  const lbl = t[lang];
  const navigate = useNavigate();

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [marketNews, setMarketNews] = useState<NewsItem[]>([]);
  const [loadingWatchlist, setLoadingWatchlist] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchWatchlist = useCallback(async () => {
    setLoadingWatchlist(true);
    try {
      const data = await getWatchlist();
      setWatchlist(data);
      setLastUpdated(new Date());
    } catch { setWatchlist([]); }
    finally { setLoadingWatchlist(false); }
  }, []);

  const fetchNews = useCallback(async () => {
    setLoadingNews(true);
    try {
      const articles = await getMarketNews();
      setMarketNews(articles ?? []);
    } catch { setMarketNews([]); }
    finally { setLoadingNews(false); }
  }, []);

  useEffect(() => { fetchWatchlist(); fetchNews(); }, [fetchWatchlist, fetchNews]);

  const handleRemove = async (ticker: string) => {
    setWatchlist(prev => prev.filter(s => s.ticker !== ticker));
    try { await removeFromWatchlist(ticker); } catch { fetchWatchlist(); }
  };

  const timeStr = lastUpdated
    ? lastUpdated.toLocaleTimeString(lang === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    : null;

  const today = new Date().toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).toUpperCase();

  // movers = top 5 from watchlist by abs change_pct
  const movers = [...watchlist]
    .sort((a, b) => Math.abs(b.change_pct) - Math.abs(a.change_pct))
    .slice(0, 5);

  return (
    <div className="page-content animate-fade-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#a7aab2', marginBottom: 6 }}>{today}</div>
          <h1 className="page-title">{lbl.greeting}, WitWatch 👋</h1>
        </div>
        <button className="btn btn-dark" onClick={() => navigate('/discover')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          {lbl.addStock}
        </button>
      </div>

      {/* Index strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 30 }}>
        {INDICES.map(ix => {
          const up = ix.pct >= 0;
          const color = up ? '#15a06a' : '#e0594a';
          const bg = up ? '#e6f5ee' : '#fbeae3';
          return (
            <div key={ix.label} className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: '#8a909e', letterSpacing: '0.03em' }}>{ix.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color, background: bg, padding: '2px 7px', borderRadius: 7 }}>{fmtPct(ix.pct)}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 600, marginTop: 9, letterSpacing: '-0.01em' }}>{ix.value}</div>
              <svg viewBox="0 0 116 26" preserveAspectRatio="none" style={{ width: '100%', height: 26, marginTop: 8, display: 'block' }}>
                <polyline points={spark(ix.vals)} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          );
        })}
      </div>

      {/* Watchlist */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>{lbl.watchlist}</h2>
          {timeStr && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#a7aab2' }}>{lbl.updated} {timeStr}</span>}
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#a7aab2' }}>{watchlist.length} {lbl.stocks}</span>
      </div>

      {loadingWatchlist ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 32 }}>
          {[0,1,2].map(i => (
            <div key={i} className="card">
              <div className="skeleton" style={{ width: 80, height: 20, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: 130, height: 12, marginBottom: 14 }} />
              <div className="skeleton" style={{ width: '100%', height: 4, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: 100, height: 30 }} />
            </div>
          ))}
        </div>
      ) : watchlist.length === 0 ? (
        <div style={{ border: '1.5px dashed var(--border)', borderRadius: 18, padding: '2.5rem', textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📈</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-secondary)', marginBottom: 6 }}>{lbl.emptyWatchlist}</p>
          <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.6 }}>{lbl.emptyWatchlistSub}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 32 }}>
          {watchlist.map(s => {
            const up = s.change_pct >= 0;
            const color = up ? '#15a06a' : '#e0594a';
            const softBg = up ? '#e6f5ee' : '#fbeae3';
            const vals = [100, 100 * (1 + s.change_pct / 200), 100 * (1 + s.change_pct / 100)];
            return (
              <div
                key={s.ticker}
                className="card card-hover"
                style={{ cursor: 'pointer', position: 'relative' }}
                onClick={() => navigate(`/stock/${s.ticker}`)}
              >
                {/* Remove btn */}
                <button
                  onClick={e => { e.stopPropagation(); handleRemove(s.ticker); }}
                  style={{
                    position: 'absolute', top: 10, right: 10, width: 22, height: 22,
                    border: 'none', borderRadius: '50%', background: 'transparent',
                    cursor: 'pointer', color: 'var(--ink-faint)', fontSize: 13, lineHeight: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  title="Remove"
                >×</button>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15.5, fontWeight: 600 }}>{s.ticker}</div>
                    <div style={{ fontSize: 11.5, color: '#8a909e', marginTop: 2, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color, background: softBg, padding: '3px 7px', borderRadius: 6 }}>
                    {up ? lbl.up : lbl.down}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 14 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600 }}>{fmtPrice(s.price)}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 600, color }}>{fmtPct(s.change_pct)}</div>
                </div>
                <svg viewBox="0 0 130 34" preserveAspectRatio="none" style={{ width: '100%', height: 34, marginTop: 10, display: 'block' }}>
                  <polyline points={spark(vals, 130, 34, 3)} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div style={{ marginTop: 11, display: 'inline-flex', fontSize: 10.5, color: '#8a909e', background: '#f5ecdb', border: '1px solid #e9ddc4', padding: '3px 9px', borderRadius: 7 }}>{s.sector || 'Technology'}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Heatmap */}
      <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 14px' }}>{lbl.heatmap}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gridAutoRows: 78, gap: 10, marginBottom: 32 }}>
        {HEATMAP.map(h => {
          const { bg, fg } = heatColor(h.pct);
          const colSpan = h.size === 'xl' ? 'span 2' : 'span 1';
          const rowSpan = (h.size === 'xl' || h.size === 'l') ? 'span 2' : 'span 1';
          return (
            <div key={h.label} style={{
              gridColumn: colSpan, gridRow: rowSpan,
              background: bg, color: fg, borderRadius: 14,
              padding: '13px 15px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.25, letterSpacing: '-0.01em' }}>
                {lang === 'th' ? h.labelTh : h.label}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 600 }}>
                {(h.pct >= 0 ? '+' : '') + h.pct.toFixed(1) + '%'}
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Digest + Movers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 18 }}>
        {/* AI Digest */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ width: 26, height: 26, borderRadius: 8, background: '#f7ecd2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b07d18" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9z" /></svg>
              </span>
              <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>{lbl.aiDigest}</h2>
            </div>
            <a onClick={() => navigate('/insights')} style={{ fontSize: 12.5, fontWeight: 600, color: '#b07d18', cursor: 'pointer' }}>{lbl.viewAll} →</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
            {loadingNews ? [0,1,2,3].map(i => (
              <div key={i} className="card">
                <div className="skeleton" style={{ width: 200, height: 12, marginBottom: 10 }} />
                <div className="skeleton" style={{ width: '100%', height: 16, marginBottom: 6 }} />
                <div className="skeleton" style={{ width: '80%', height: 12 }} />
              </div>
            )) : (marketNews.length > 0 ? marketNews.slice(0, 4) : DIGEST_MOCK).map((item, i) => {
              const news = item as NewsItem & { ticker?: string };
              const ticker = news.ticker || DIGEST_MOCK[i % DIGEST_MOCK.length]?.ticker || '';
              const mock = DIGEST_MOCK[i % DIGEST_MOCK.length];
              const sent = news.sentiment || mock?.sent || 'neutral';
              const ss = sentStyle(sent);
              const sentLabel = lang === 'th'
                ? (sent === 'bullish' ? lbl.bullish : sent === 'bearish' ? lbl.bearish : lbl.neutral)
                : (sent.charAt(0).toUpperCase() + sent.slice(1));
              return (
                <div key={i} className="card card-hover" style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    {ticker && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: ss.color, background: ss.bg, padding: '2px 7px', borderRadius: 6 }}>{ticker}</span>}
                    <span style={{ fontSize: 10.5, color: '#a7aab2' }}>{news.source || mock?.source}</span>
                    <span style={{ fontSize: 10.5, color: '#c4c8d0' }}>·</span>
                    <span style={{ fontSize: 10.5, color: '#a7aab2' }}>{mock?.time || '—'}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: ss.color, background: ss.bg, padding: '3px 7px', borderRadius: 6 }}>{sentLabel}</span>
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.45, letterSpacing: '-0.01em' }}>
                    {lang === 'th' ? (mock?.titleTh || news.title) : news.title}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 9 }}>
                    <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 600, color: '#b07d18', background: '#f7ecd2', padding: '2px 7px', borderRadius: 6, height: 'fit-content', marginTop: 1 }}>AI</span>
                    <div style={{ fontSize: 12, color: '#6b7180', lineHeight: 1.55 }}>
                      {lang === 'th' ? (mock?.th || news.description) : (mock?.en || news.description)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Movers + Fear & Greed */}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 14px' }}>{lbl.movers}</h2>
          <div className="data-table" style={{ marginBottom: 16 }}>
            {loadingWatchlist ? [0,1,2,3,4].map(i => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 11px', borderBottom: '1px solid var(--border-soft)' }}>
                <div className="skeleton" style={{ width: 54, height: 28 }} />
                <div className="skeleton" style={{ flex: 1, height: 20 }} />
                <div className="skeleton" style={{ width: 54, height: 16 }} />
              </div>
            )) : movers.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--ink-muted)', fontSize: 12.5 }}>
                {lbl.emptyWatchlist}
              </div>
            ) : movers.map(m => {
              const up = m.change_pct >= 0;
              const color = up ? '#15a06a' : '#e0594a';
              const vals = [100, 100 * (1 + m.change_pct / 200), 100 * (1 + m.change_pct / 100)];
              return (
                <div
                  key={m.ticker}
                  onClick={() => navigate(`/stock/${m.ticker}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 11px', cursor: 'pointer', transition: 'background 150ms', borderBottom: '1px solid var(--border-soft)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <div style={{ minWidth: 54 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 }}>{m.ticker}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: '#a7aab2', marginTop: 1 }}>{fmtPrice(m.price)}</div>
                  </div>
                  <svg viewBox="0 0 70 26" preserveAspectRatio="none" style={{ flex: 1, height: 26, display: 'block' }}>
                    <polyline points={spark(vals, 70, 26, 3)} fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color, minWidth: 54, textAlign: 'right' }}>{fmtPct(m.change_pct)}</div>
                </div>
              );
            })}
          </div>

          {/* Fear & Greed */}
          <div style={{ background: 'linear-gradient(150deg,#1f2b50,#2c3c6e)', borderRadius: 18, padding: 18, color: '#fff' }}>
            <div style={{ fontSize: 12, color: '#9fa3ad', fontWeight: 500 }}>{lbl.fearGreed}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 7 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 30, fontWeight: 600 }}>68</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#5fd6a0' }}>{lbl.greedy}</span>
            </div>
            <div style={{ height: 6, borderRadius: 4, background: 'rgba(255,255,255,0.12)', marginTop: 12, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '68%', borderRadius: 4, background: 'linear-gradient(90deg,#e0594a,#e0a23a,#15a06a)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7, fontSize: 10, color: '#7d818b', fontFamily: 'var(--font-mono)' }}>
              <span>{lbl.fear}</span><span>{lbl.greed}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
