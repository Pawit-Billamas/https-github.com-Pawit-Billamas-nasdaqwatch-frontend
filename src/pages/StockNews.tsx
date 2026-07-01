import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getStockInfo, getStockNews, getStockSummary,
  addToWatchlist, removeFromWatchlist, getWatchlist,
  getStockFundamentals,
} from '../services/api';
import type { Stock, NewsItem, NewsSummary, FundamentalsData } from '../types';
import StockCard from '../components/StockCard';
import NewsCard from '../components/NewsCard';
import SummaryCard from '../components/SummaryCard';
import FundamentalsPanel from '../components/FundamentalsPanel';
import SearchBar from '../components/SearchBar';

type Tab = 'news' | 'fundamentals' | 'ai';

const StockNews: React.FC = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('news');

  const [stock, setStock] = useState<Stock | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [summary, setSummary] = useState<NewsSummary | undefined>(undefined);
  const [fundamentals, setFundamentals] = useState<FundamentalsData | null>(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  const [loadingStock, setLoadingStock] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingFundamentals, setLoadingFundamentals] = useState(false);
  const [errorStock, setErrorStock] = useState<string | null>(null);

  const fetchData = useCallback(async (t: string) => {
    // Stock info
    setLoadingStock(true);
    setErrorStock(null);
    try {
      const stockData = await getStockInfo(t);
      setStock(stockData);
    } catch (e: unknown) {
      setErrorStock(e instanceof Error ? e.message : 'ไม่พบข้อมูลหุ้น');
    } finally {
      setLoadingStock(false);
    }

    // News
    setLoadingNews(true);
    try {
      const newsData = await getStockNews(t);
      setNews(newsData);
    } catch {
      setNews([]);
    } finally {
      setLoadingNews(false);
    }

    // Watchlist check
    try {
      const wl = await getWatchlist();
      setInWatchlist(wl.some((item) => item.ticker === t));
    } catch {
      setInWatchlist(false);
    }
  }, []);

  // Lazy-load summary only when tab selected
  const fetchSummary = useCallback(async (t: string) => {
    if (summary) return;
    setLoadingSummary(true);
    try {
      const s = await getStockSummary(t);
      setSummary(s);
    } catch {
      setSummary(undefined);
    } finally {
      setLoadingSummary(false);
    }
  }, [summary]);

  // Lazy-load fundamentals only when tab selected
  const fetchFundamentals = useCallback(async (t: string) => {
    if (fundamentals) return;
    setLoadingFundamentals(true);
    try {
      const f = await getStockFundamentals(t);
      setFundamentals(f);
    } catch {
      setFundamentals(null);
    } finally {
      setLoadingFundamentals(false);
    }
  }, [fundamentals]);

  useEffect(() => {
    if (ticker) {
      // Reset state on ticker change
      setStock(null); setNews([]); setSummary(undefined);
      setFundamentals(null); setActiveTab('news');
      fetchData(ticker);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [ticker, fetchData]);

  // Trigger lazy loads when tab switches
  useEffect(() => {
    if (!ticker) return;
    if (activeTab === 'ai')           fetchSummary(ticker);
    if (activeTab === 'fundamentals') fetchFundamentals(ticker);
  }, [activeTab, ticker, fetchSummary, fetchFundamentals]);

  const handleWatchlistToggle = async () => {
    if (!ticker) return;
    setWatchlistLoading(true);
    try {
      if (inWatchlist) {
        await removeFromWatchlist(ticker);
        setInWatchlist(false);
      } else {
        await addToWatchlist(ticker);
        setInWatchlist(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setWatchlistLoading(false);
    }
  };

  if (!ticker) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
        <h2 style={{ color: 'var(--ink-secondary)', marginBottom: '1.5rem', fontWeight: 700 }}>
          ค้นหาหุ้นที่ต้องการดู
        </h2>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <SearchBar onSelect={(t) => navigate(`/stock/${t}`)} />
        </div>
      </div>
    );
  }

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'news',         label: 'ข่าว',          icon: '📰' },
    { id: 'fundamentals', label: 'ปัจจัยพื้นฐาน', icon: '📊' },
    { id: 'ai',           label: 'AI สรุป',        icon: '🤖' },
  ];

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '4rem' }}>

      {/* ─── Topbar ─── */}
      <div className="topbar">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}
        >
          ← กลับ
        </button>

        <div style={{ flex: 1, maxWidth: '380px', margin: '0 1rem' }}>
          <SearchBar onSelect={(t) => navigate(`/stock/${t}`)} placeholder="ค้นหาหุ้นอื่น..." />
        </div>

        <button
          className={`btn btn-sm ${inWatchlist ? 'btn-secondary' : 'btn-primary'}`}
          onClick={handleWatchlistToggle}
          disabled={watchlistLoading || loadingStock}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}
        >
          {watchlistLoading
            ? <div className="spinner" style={{ width: '0.85rem', height: '0.85rem' }} />
            : inWatchlist ? '✕ นำออก' : '+ เพิ่ม Watchlist'}
        </button>
      </div>

      <div style={{ padding: '2rem' }}>

        {/* ─── Error ─── */}
        {errorStock && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '1rem 1.25rem', background: 'var(--down-bg)',
            border: '1px solid #fca5a5', borderRadius: 'var(--radius)',
            color: 'var(--down)', marginBottom: '1.5rem',
          }}>
            ⚠️
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>ไม่พบข้อมูลหุ้น "{ticker}"</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{errorStock}</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => fetchData(ticker)} style={{ marginLeft: 'auto' }}>
              🔄 ลองใหม่
            </button>
          </div>
        )}

        {/* ─── Stock header card ─── */}
        {!errorStock && (
          <div style={{ marginBottom: '1.75rem', maxWidth: '400px' }}>
            {loadingStock ? <SkeletonStockHeader /> : stock
              ? <StockCard stock={{ ...stock, added_at: '' }} onClick={() => {}} />
              : null}
          </div>
        )}

        {/* ─── Tab bar ─── */}
        <div style={{
          display: 'flex', gap: '0.4rem',
          background: 'var(--surface)', borderRadius: '10px',
          padding: '0.3rem', marginBottom: '1.5rem',
          width: 'fit-content',
        }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.45rem 1.1rem',
                borderRadius: '7px',
                fontSize: '0.85rem',
                fontWeight: 600,
                fontFamily: 'var(--font-sans)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                transition: 'all 180ms cubic-bezier(0.32,0.72,0,1)',
                background: activeTab === tab.id ? 'var(--white)' : 'transparent',
                color:      activeTab === tab.id ? 'var(--ink)'   : 'var(--ink-muted)',
                boxShadow:  activeTab === tab.id ? '0 1px 4px rgba(15,17,23,0.10)' : 'none',
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── Tab content ─── */}

        {/* NEWS TAB */}
        {activeTab === 'news' && (
          <div style={{ maxWidth: '680px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 className="section-title" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
                ข่าวล่าสุด
              </h2>
              {!loadingNews && (
                <span className="font-mono text-muted" style={{ fontSize: '0.7rem' }}>
                  {news.length} ข่าว
                </span>
              )}
            </div>
            {loadingNews ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[1,2,3,4].map(i => <SkeletonNewsItem key={i} />)}
              </div>
            ) : news.length === 0 ? (
              <div className="empty-state">
                <h3>ไม่มีข่าวสำหรับ {ticker}</h3>
                <p>ลองค้นหาหุ้นอื่น หรือกลับมาใหม่ในภายหลัง</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {news.map((item, idx) => (
                  <div key={item.id ?? idx} style={{ animation: `fadeIn 0.3s ease-out ${idx * 0.05}s both` }}>
                    <NewsCard news={item} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FUNDAMENTALS TAB */}
        {activeTab === 'fundamentals' && (
          <div style={{ maxWidth: '720px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 className="section-title" style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
                ปัจจัยพื้นฐาน
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
                ข้อมูลจาก Yahoo Finance
              </span>
            </div>
            {loadingFundamentals ? (
              <FundamentalsPanel data={null as unknown as FundamentalsData} loading={true} />
            ) : fundamentals ? (
              <FundamentalsPanel data={fundamentals} />
            ) : (
              <div className="empty-state">
                <h3>ไม่มีข้อมูลปัจจัยพื้นฐาน</h3>
                <p>Yahoo Finance อาจไม่มีข้อมูลครบถ้วนสำหรับหุ้นนี้</p>
              </div>
            )}
          </div>
        )}

        {/* AI SUMMARY TAB */}
        {activeTab === 'ai' && (
          <div style={{ maxWidth: '600px' }}>
            <h2 className="section-title" style={{ marginBottom: '1rem' }}>AI สรุปข่าว</h2>
            {loadingSummary ? (
              <SummaryCard summary={undefined} loading={true} />
            ) : summary ? (
              <SummaryCard summary={summary} />
            ) : (
              <div style={{
                background: 'var(--white)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: '2rem',
                textAlign: 'center', color: 'var(--ink-muted)', fontSize: '0.875rem',
              }}>
                ยังไม่มี AI สรุปสำหรับหุ้นนี้ในขณะนี้
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

// ─── Skeletons ──────────────────────────────────────────────────────────────
const SkeletonStockHeader: React.FC = () => (
  <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
    <div className="skeleton" style={{ width: '100px', height: '1.5rem', marginBottom: '0.5rem' }} />
    <div className="skeleton" style={{ width: '160px', height: '0.85rem', marginBottom: '1rem' }} />
    <div className="skeleton" style={{ width: '130px', height: '2rem', marginBottom: '0.5rem' }} />
    <div className="skeleton" style={{ width: '100%', height: '4px', marginBottom: '1rem' }} />
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
      {[1,2].map(i => <div key={i} className="skeleton" style={{ height: '2.5rem' }} />)}
    </div>
  </div>
);

const SkeletonNewsItem: React.FC = () => (
  <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '1.1rem 1.25rem' }}>
    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
      <div className="skeleton" style={{ width: '70px', height: '1rem' }} />
      <div className="skeleton" style={{ width: '100px', height: '1rem' }} />
    </div>
    <div className="skeleton" style={{ width: '90%', height: '1.1rem', marginBottom: '0.4rem' }} />
    <div className="skeleton" style={{ width: '70%', height: '1.1rem', marginBottom: '0.75rem' }} />
    <div className="skeleton" style={{ width: '100%', height: '0.85rem', marginBottom: '0.3rem' }} />
    <div className="skeleton" style={{ width: '80%', height: '0.85rem' }} />
  </div>
);

export default StockNews;
