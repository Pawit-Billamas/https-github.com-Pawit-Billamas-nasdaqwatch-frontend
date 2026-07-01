import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import {
  getStockInfo, getStockNews, getStockSummary,
  addToWatchlist, removeFromWatchlist, getWatchlist, getStockFundamentals,
} from '../services/api';
import type { Stock, NewsItem, NewsSummary, FundamentalsData } from '../types';

type Tab = 'news' | 'fundamentals' | 'ai';

const tl = {
  en: {
    back: 'Back', addWatch: 'Add to Watchlist', removeWatch: 'Remove',
    news: 'News', fundamentals: 'Fundamentals', aiSummary: 'AI Summary',
    latestNews: 'Latest News', keyMetrics: 'Key Metrics', aiVerdict: 'AI Verdict',
    healthScore: 'Health Score', strongF: 'strong', weakF: 'weak', neutralF: 'neutral',
    nextEarnings: 'Next earnings', noNews: 'No news for this ticker.',
    noFundamentals: 'No fundamentals data available.', noAI: 'No AI summary yet.',
    mktcap: 'MKT CAP', eps: 'EPS',
    strong: 'Strong', fair: 'Fair', mixed: 'Mixed', weak: 'Weak',
    bullish: 'Bullish', neutral: 'Neutral', bearish: 'Bearish',
    source: 'Source',
  },
  th: {
    back: 'กลับ', addWatch: 'เพิ่มใน Watchlist', removeWatch: 'นำออก',
    news: 'ข่าว', fundamentals: 'ปัจจัยพื้นฐาน', aiSummary: 'AI สรุป',
    latestNews: 'ข่าวล่าสุด', keyMetrics: 'ตัวชี้วัดสำคัญ', aiVerdict: 'บทสรุป AI',
    healthScore: 'คะแนนสุขภาพ', strongF: 'ดี', weakF: 'อ่อน', neutralF: 'กลาง',
    nextEarnings: 'รายงานหน้า', noNews: 'ไม่มีข่าวสำหรับหุ้นนี้',
    noFundamentals: 'ไม่มีข้อมูลปัจจัยพื้นฐาน', noAI: 'ยังไม่มี AI สรุป',
    mktcap: 'มูลค่าตลาด', eps: 'กำไรต่อหุ้น',
    strong: 'แข็งแกร่ง', fair: 'พอใช้', mixed: 'ผสม', weak: 'อ่อน',
    bullish: 'บวก', neutral: 'กลาง', bearish: 'ลบ',
    source: 'แหล่ง',
  },
};

function fmtPct(p: number) { return (p >= 0 ? '+' : '') + p.toFixed(2) + '%'; }
function fmtPrice(p: number) { return '$' + p.toFixed(2); }
function fmtLarge(n: number) {
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9)  return '$' + (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6)  return '$' + (n / 1e6).toFixed(1) + 'M';
  return '$' + n.toFixed(0);
}

function sentStyle(s: 'bullish' | 'neutral' | 'bearish' | undefined) {
  if (s === 'bullish') return { color: '#15a06a', bg: '#e6f5ee' };
  if (s === 'bearish') return { color: '#e0594a', bg: '#fbeae3' };
  return { color: '#6b7180', bg: '#efe4d0' };
}

export default function StockDetail() {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();
  const { lang } = useLang();
  const t = tl[lang];

  const [tab, setTab] = useState<Tab>('news');
  const [stock, setStock] = useState<Stock | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [summary, setSummary] = useState<NewsSummary | null>(null);
  const [fundamentals, setFundamentals] = useState<FundamentalsData | null>(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loadingStock, setLoadingStock] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingFund, setLoadingFund] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (t: string) => {
    setLoadingStock(true); setError(null);
    try {
      const s = await getStockInfo(t);
      setStock(s);
    } catch (e) { setError(e instanceof Error ? e.message : 'Not found'); }
    finally { setLoadingStock(false); }

    setLoadingNews(true);
    try { setNews(await getStockNews(t)); }
    catch { setNews([]); }
    finally { setLoadingNews(false); }

    try {
      const wl = await getWatchlist();
      setInWatchlist(wl.some(w => w.ticker === t));
    } catch { setInWatchlist(false); }
  }, []);

  const fetchSummary = useCallback(async (tk: string) => {
    if (summary) return;
    setLoadingAI(true);
    try { setSummary(await getStockSummary(tk)); }
    catch { setSummary(null); }
    finally { setLoadingAI(false); }
  }, [summary]);

  const fetchFund = useCallback(async (tk: string) => {
    if (fundamentals) return;
    setLoadingFund(true);
    try { setFundamentals(await getStockFundamentals(tk)); }
    catch { setFundamentals(null); }
    finally { setLoadingFund(false); }
  }, [fundamentals]);

  useEffect(() => {
    if (!ticker) return;
    setStock(null); setNews([]); setSummary(null); setFundamentals(null); setTab('news');
    fetchData(ticker);
    window.scrollTo({ top: 0 });
  }, [ticker, fetchData]);

  useEffect(() => {
    if (!ticker) return;
    if (tab === 'ai') fetchSummary(ticker);
    if (tab === 'fundamentals') fetchFund(ticker);
  }, [tab, ticker, fetchSummary, fetchFund]);

  const handleWatchlistToggle = async () => {
    if (!ticker) return;
    setWatchlistLoading(true);
    try {
      if (inWatchlist) { await removeFromWatchlist(ticker); setInWatchlist(false); }
      else { await addToWatchlist(ticker); setInWatchlist(true); }
    } catch { /* ignore */ }
    finally { setWatchlistLoading(false); }
  };

  if (!ticker) return (
    <div className="page-content" style={{ textAlign: 'center', paddingTop: 80 }}>
      <h2 style={{ color: 'var(--ink-tertiary)' }}>Select a stock to view details</h2>
    </div>
  );

  const up = stock ? stock.change_pct >= 0 : true;
  const color = up ? '#15a06a' : '#e0594a';
  const softBg = up ? '#e6f5ee' : '#fbeae3';

  const verdictLabel = (v: string) => {
    const map = { strong: t.strong, fair: t.fair, mixed: t.mixed, weak: t.weak } as Record<string, string>;
    return map[v] || v;
  };
  const verdictColor = (v: string) => {
    if (v === 'strong') return '#15a06a';
    if (v === 'fair') return '#a07c1e';
    if (v === 'weak') return '#e0594a';
    return '#6b7180';
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: 'news', label: t.news },
    { id: 'fundamentals', label: t.fundamentals },
    { id: 'ai', label: t.aiSummary },
  ];

  return (
    <div className="page-content animate-fade-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)} style={{ borderRadius: 11, padding: '8px 10px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6" /></svg>
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {loadingStock ? (
                <div className="skeleton" style={{ width: 100, height: 32 }} />
              ) : (
                <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 600, margin: 0, letterSpacing: '0.01em' }}>{stock?.ticker || ticker}</h1>
              )}
              {stock?.sector && <span className="badge-sector">{stock.sector}</span>}
            </div>
            {stock && <div style={{ fontSize: 13, color: 'var(--ink-tertiary)', marginTop: 3 }}>{stock.name}</div>}
          </div>
        </div>
        <button
          className={`btn ${inWatchlist ? 'btn-outline' : 'btn-dark'}`}
          onClick={handleWatchlistToggle}
          disabled={watchlistLoading || loadingStock}
        >
          {watchlistLoading ? <div className="spinner" style={{ width: '0.85rem', height: '0.85rem' }} /> : null}
          {inWatchlist ? t.removeWatch : t.addWatch}
        </button>
      </div>

      {/* Price card */}
      {!error && (
        <div className="card" style={{ borderRadius: 20, padding: '22px 24px', marginBottom: 18 }}>
          {loadingStock ? (
            <div>
              <div className="skeleton" style={{ width: 200, height: 44, marginBottom: 12 }} />
              <div className="skeleton" style={{ width: 300, height: 14 }} />
            </div>
          ) : stock ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 34, fontWeight: 600, letterSpacing: '-0.01em' }}>{fmtPrice(stock.price)}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 600, color, background: softBg, padding: '4px 10px', borderRadius: 9 }}>{fmtPct(stock.change_pct)}</span>
                </div>
                <div style={{ fontSize: 12, color: '#a7aab2', marginTop: 6, fontFamily: 'var(--font-mono)' }}>
                  {t.mktcap} {stock.market_cap ? fmtLarge(stock.market_cap) : '—'}
                  {stock.pe_ratio ? ` · P/E ${stock.pe_ratio.toFixed(1)}x` : ''}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: '#fbeae3', border: '1px solid #f4c4bb', borderRadius: 12, padding: '1rem 1.25rem', color: '#e0594a', marginBottom: 18 }}>
          ⚠️ {error}
        </div>
      )}

      {/* Tab bar */}
      <div className="tabs" style={{ marginBottom: 18 }}>
        {TABS.map(tb => (
          <button key={tb.id} className={`tab-btn${tab === tb.id ? ' active' : ''}`} onClick={() => setTab(tb.id)}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* NEWS TAB */}
      {tab === 'news' && (
        <div style={{ maxWidth: 780 }}>
          {loadingNews ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {[0,1,2,3].map(i => (
                <div key={i} className="card">
                  <div className="skeleton" style={{ width: 200, height: 12, marginBottom: 10 }} />
                  <div className="skeleton" style={{ width: '100%', height: 16, marginBottom: 6 }} />
                  <div className="skeleton" style={{ width: '80%', height: 12 }} />
                </div>
              ))}
            </div>
          ) : news.length === 0 ? (
            <div className="empty-state"><h3>{t.noNews}</h3></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {news.map((n, i) => {
                const ss = sentStyle(n.sentiment);
                const sentLabel = n.sentiment
                  ? (lang === 'th'
                    ? (n.sentiment === 'bullish' ? t.bullish : n.sentiment === 'bearish' ? t.bearish : t.neutral)
                    : (n.sentiment.charAt(0).toUpperCase() + n.sentiment.slice(1)))
                  : '';
                return (
                  <a key={i} href={n.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <div className="card card-hover">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 11, color: '#a7aab2' }}>{n.source}</span>
                        <span style={{ fontSize: 11, color: '#c4c8d0' }}>·</span>
                        <span style={{ fontSize: 11, color: '#a7aab2' }}>{new Date(n.published_at).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')}</span>
                        {n.sentiment && (
                          <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: ss.color, background: ss.bg, padding: '3px 8px', borderRadius: 6 }}>{sentLabel}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.45, letterSpacing: '-0.01em', color: 'var(--ink)' }}>{n.title}</div>
                      {n.description && (
                        <div style={{ fontSize: 12.5, color: 'var(--ink-tertiary)', lineHeight: 1.55, marginTop: 8 }}>{n.description}</div>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* FUNDAMENTALS TAB */}
      {tab === 'fundamentals' && (
        <div style={{ maxWidth: 720 }}>
          {loadingFund ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[0,1,2,3,4,5,6,7].map(i => <div key={i} className="card skeleton" style={{ height: 72 }} />)}
              </div>
              <div className="card skeleton" style={{ height: 260 }} />
            </div>
          ) : !fundamentals ? (
            <div className="empty-state"><h3>{t.noFundamentals}</h3></div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18 }}>
              {/* Metrics grid */}
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px' }}>{t.keyMetrics}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {Object.entries(fundamentals.metrics).slice(0, 8).map(([key, m]) => {
                    const tc = m.rating === 'good' ? '#15a06a' : m.rating === 'bad' ? '#e0594a' : '#a07c1e';
                    const tb = m.rating === 'good' ? '#e6f5ee' : m.rating === 'bad' ? '#fbeae3' : '#f7f0dc';
                    const tagLabel = m.rating === 'good' ? (lang === 'th' ? 'ดี' : 'Good') : m.rating === 'bad' ? (lang === 'th' ? 'อ่อน' : 'Weak') : (lang === 'th' ? 'กลาง' : 'Fair');
                    let val = '—';
                    if (m.value !== null) {
                      if (m.format === 'x') val = m.value.toFixed(1) + 'x';
                      else if (m.format === '%') val = m.value.toFixed(1) + '%';
                      else if (m.format === '$') val = '$' + m.value.toFixed(2);
                      else if (m.format === '$large') val = fmtLarge(m.value);
                      else val = m.value.toFixed(2);
                    }
                    return (
                      <div key={key} className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11.5, color: '#8a909e' }}>{m.label}</span>
                          <span style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', color: tc, background: tb, padding: '2px 6px', borderRadius: 5 }}>{tagLabel}</span>
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600, marginTop: 9 }}>{val}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* AI Verdict */}
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 12px' }}>{t.aiVerdict}</h3>
                <div style={{ background: 'linear-gradient(155deg,#1f2b50,#2c3c6e)', borderRadius: 18, padding: 20, color: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 24, fontWeight: 700, color: verdictColor(fundamentals.verdict.verdict), letterSpacing: '-0.02em' }}>
                      {verdictLabel(fundamentals.verdict.verdict)}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#9fa3ad', marginTop: 18 }}>{t.healthScore}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 5 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 30, fontWeight: 600 }}>{fundamentals.verdict.score}</span>
                    <span style={{ fontSize: 13, color: '#7d818b' }}>/100</span>
                  </div>
                  <div style={{ height: 7, borderRadius: 5, background: 'rgba(255,255,255,0.12)', marginTop: 11, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', borderRadius: 5, width: `${fundamentals.verdict.score}%`, background: 'linear-gradient(90deg,#e0a23a,#15a06a)' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 14, marginTop: 18 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600, color: '#5fd6a0' }}>{fundamentals.verdict.good_count}</div>
                      <div style={{ fontSize: 10.5, color: '#7d818b', marginTop: 2 }}>{t.strongF}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600, color: '#cdd0d6' }}>{fundamentals.verdict.neutral_count}</div>
                      <div style={{ fontSize: 10.5, color: '#7d818b', marginTop: 2 }}>{t.neutralF}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 600, color: '#f0897c' }}>{fundamentals.verdict.bad_count}</div>
                      <div style={{ fontSize: 10.5, color: '#7d818b', marginTop: 2 }}>{t.weakF}</div>
                    </div>
                  </div>
                  {fundamentals.next_earnings && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 18, paddingTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11.5, color: '#9fa3ad' }}>{t.nextEarnings}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 600 }}>{fundamentals.next_earnings}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI SUMMARY TAB */}
      {tab === 'ai' && (
        <div style={{ maxWidth: 680 }}>
          {loadingAI ? (
            <div className="card" style={{ borderRadius: 20, padding: 24 }}>
              <div className="skeleton" style={{ width: 200, height: 20, marginBottom: 18 }} />
              {[0,1,2].map(i => <div key={i} className="skeleton" style={{ width: '100%', height: 14, marginBottom: 12 }} />)}
            </div>
          ) : !summary ? (
            <div className="empty-state"><h3>{t.noAI}</h3></div>
          ) : (
            <div className="card" style={{ borderRadius: 20, padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 30, height: 30, borderRadius: 9, background: '#f7ecd2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#b07d18" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9z" /></svg>
                  </span>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{t.aiSummary}</h3>
                </div>
                {(() => {
                  const ss = sentStyle(summary.overall_sentiment);
                  const sl = lang === 'th'
                    ? (summary.overall_sentiment === 'bullish' ? t.bullish : summary.overall_sentiment === 'bearish' ? t.bearish : t.neutral)
                    : (summary.overall_sentiment.charAt(0).toUpperCase() + summary.overall_sentiment.slice(1));
                  return <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: ss.color, background: ss.bg, padding: '4px 10px', borderRadius: 7 }}>{sl}</span>;
                })()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {(lang === 'th' ? [summary.thai_summary, summary.long_term_impact] : summary.bullet_points).map((b, i) => (
                  <div key={i} style={{ display: 'flex', gap: 13, alignItems: 'flex-start' }}>
                    <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 8, background: '#f7ecd2', color: '#b07d18', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                    <div style={{ fontSize: 14, color: '#3b4150', lineHeight: 1.6, paddingTop: 2 }}>{b}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 20, padding: '13px 15px', background: '#f9f1e2', border: '1px solid #e9ddc4', borderRadius: 13, fontSize: 11.5, color: '#a7aab2', lineHeight: 1.5 }}>
                AI Summary · WitWatch AI · {ticker}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
