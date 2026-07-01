import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { getMarketNews } from '../services/api';
import type { NewsItem } from '../types';

const tl = {
  en: {
    title: 'AI Insights', subtitle: 'Curated market news with AI sentiment analysis.',
    all: 'All', bullish: 'Bullish', bearish: 'Bearish', neutral: 'Neutral',
    noNews: 'No news available right now.', source: 'Source', viewStock: 'View stock',
  },
  th: {
    title: 'AI สรุปข่าว', subtitle: 'ข่าวตลาดที่คัดสรรพร้อมการวิเคราะห์ความรู้สึกด้วย AI',
    all: 'ทั้งหมด', bullish: 'บวก', bearish: 'ลบ', neutral: 'กลาง',
    noNews: 'ยังไม่มีข่าว', source: 'แหล่ง', viewStock: 'ดูหุ้น',
  },
};

function sentStyle(s?: string) {
  if (s === 'bullish') return { color: '#15a06a', bg: '#e6f5ee', label: 'Bullish' };
  if (s === 'bearish') return { color: '#e0594a', bg: '#fbeae3', label: 'Bearish' };
  return { color: '#6b7180', bg: '#efe4d0', label: 'Neutral' };
}

export default function Insights() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const t = tl[lang];

  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bullish' | 'bearish' | 'neutral'>('all');

  useEffect(() => {
    setLoading(true);
    getMarketNews()
      .then(setNews)
      .catch(() => setNews([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? news : news.filter(n => n.sentiment === filter || (!n.sentiment && filter === 'neutral'));

  const filters: Array<{ id: 'all' | 'bullish' | 'bearish' | 'neutral'; label: string }> = [
    { id: 'all', label: t.all },
    { id: 'bullish', label: t.bullish },
    { id: 'bearish', label: t.bearish },
    { id: 'neutral', label: t.neutral },
  ];

  const sentLabel = (s?: string) => {
    if (lang === 'en') return s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Neutral';
    if (s === 'bullish') return t.bullish;
    if (s === 'bearish') return t.bearish;
    return t.neutral;
  };

  return (
    <div className="page-content animate-fade-up">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 6 }}>
          <span style={{ width: 34, height: 34, borderRadius: 11, background: '#f7ecd2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b07d18" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9z" /></svg>
          </span>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{t.title}</h1>
        </div>
        <p style={{ fontSize: 13.5, color: 'var(--ink-tertiary)', margin: 0, paddingLeft: 45 }}>{t.subtitle}</p>
      </div>

      {/* Filter row */}
      <div className="tabs" style={{ marginBottom: 18 }}>
        {filters.map(f => {
          const ss = f.id === 'all' ? null : sentStyle(f.id);
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                padding: '6px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontWeight: filter === f.id ? 600 : 500, fontSize: 13,
                fontFamily: 'var(--font-sans)',
                background: filter === f.id
                  ? (ss ? ss.bg : 'var(--accent-soft)')
                  : 'transparent',
                color: filter === f.id
                  ? (ss ? ss.color : 'var(--accent)')
                  : 'var(--ink-muted)',
                transition: 'all 150ms',
              }}
            >
              {f.label}
            </button>
          );
        })}
        <span style={{ marginLeft: 'auto', fontSize: 11.5, color: '#a7aab2', alignSelf: 'center' }}>
          {!loading && `${filtered.length} articles`}
        </span>
      </div>

      {/* News feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11, maxWidth: 820 }}>
        {loading ? (
          [0,1,2,3,4,5].map(i => (
            <div key={i} className="card" style={{ borderRadius: 16 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                <div className="skeleton" style={{ width: 80, height: 11 }} />
                <div className="skeleton" style={{ width: 50, height: 11 }} />
              </div>
              <div className="skeleton" style={{ width: '90%', height: 16, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: '70%', height: 13 }} />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="empty-state"><h3>{t.noNews}</h3></div>
        ) : filtered.map((n, i) => {
          const ss = sentStyle(n.sentiment);
          const sl = sentLabel(n.sentiment);
          const date = new Date(n.published_at).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          return (
            <a key={i} href={n.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div className="card card-hover" style={{ borderRadius: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: '#8a909e' }}>{n.source}</span>
                  <span style={{ fontSize: 11, color: '#c4c8d0' }}>·</span>
                  <span style={{ fontSize: 11.5, color: '#a7aab2' }}>{date}</span>
                  <span style={{
                    marginLeft: 'auto', fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase',
                    letterSpacing: '0.06em', color: ss.color, background: ss.bg,
                    padding: '3px 9px', borderRadius: 6,
                  }}>{sl}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.45, letterSpacing: '-0.01em', color: 'var(--ink)' }}>{n.title}</div>
                {n.description && (
                  <div style={{ fontSize: 13, color: 'var(--ink-tertiary)', lineHeight: 1.6, marginTop: 8 }}>
                    {n.description.slice(0, 180)}{n.description.length > 180 ? '...' : ''}
                  </div>
                )}
                {n.tickers && n.tickers.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 11 }}>
                    {n.tickers.slice(0, 5).map(tk => (
                      <span
                        key={tk}
                        onClick={e => { e.preventDefault(); navigate(`/stock/${tk}`); }}
                        style={{
                          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                          background: 'var(--bg-panel)', border: '1px solid var(--border-soft)',
                          color: 'var(--accent)', padding: '2px 8px', borderRadius: 6,
                          cursor: 'pointer',
                        }}
                      >{tk}</span>
                    ))}
                  </div>
                )}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
