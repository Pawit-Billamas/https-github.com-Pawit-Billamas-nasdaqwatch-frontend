import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { getCompare } from '../services/api';
import type { CompareData } from '../types';

const tl = {
  en: {
    title: 'Compare', subtitle: 'Side-by-side comparison of 2–4 tickers.',
    add: 'Add ticker', compare: 'Compare', clear: 'Clear',
    placeholder: 'e.g. AAPL', noData: 'Enter 2–4 tickers and click Compare.',
    viewStock: 'View',
  },
  th: {
    title: 'เปรียบเทียบ', subtitle: 'เปรียบเทียบหุ้น 2–4 ตัวแบบเคียงข้างกัน',
    add: 'เพิ่ม ticker', compare: 'เปรียบเทียบ', clear: 'ล้าง',
    placeholder: 'เช่น AAPL', noData: 'ป้อน 2–4 tickers แล้วกดเปรียบเทียบ',
    viewStock: 'ดู',
  },
};

const HEADER_BG = ['#2945A8','#15a06a','#b07d18','#e0594a'];

function ratingStyle(v: string | number | null) {
  if (v === null || v === undefined) return {};
  const s = String(v).toLowerCase();
  if (s === 'good' || s === 'strong' || s === 'bullish') return { color: '#15a06a', background: '#e6f5ee', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 };
  if (s === 'bad' || s === 'weak' || s === 'bearish') return { color: '#e0594a', background: '#fbeae3', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 };
  return {};
}

export default function Compare() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const t = tl[lang];

  const [inputs, setInputs] = useState<string[]>(['', '']);
  const [data, setData] = useState<CompareData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setInput = (i: number, v: string) => {
    const next = [...inputs]; next[i] = v.toUpperCase(); setInputs(next);
  };
  const addInput = () => { if (inputs.length < 4) setInputs([...inputs, '']); };
  const removeInput = (i: number) => { if (inputs.length > 2) setInputs(inputs.filter((_, idx) => idx !== i)); };
  const clearAll = () => { setInputs(['', '']); setData(null); setError(null); };

  const handleCompare = async () => {
    const tickers = inputs.map(s => s.trim().toUpperCase()).filter(Boolean);
    if (tickers.length < 2) return;
    setLoading(true); setError(null);
    try { setData(await getCompare(tickers)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Error fetching data'); }
    finally { setLoading(false); }
  };

  return (
    <div className="page-content animate-fade-up">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 5px' }}>{t.title}</h1>
        <p style={{ fontSize: 13.5, color: 'var(--ink-tertiary)', margin: 0 }}>{t.subtitle}</p>
      </div>

      {/* Ticker input row */}
      <div className="card" style={{ borderRadius: 18, padding: '18px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
          {inputs.map((val, i) => (
            <div key={i} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: HEADER_BG[i % HEADER_BG.length], flexShrink: 0 }} />
              <input
                className="input"
                value={val}
                onChange={e => setInput(i, e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCompare()}
                placeholder={t.placeholder}
                style={{ width: 90, fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13 }}
              />
              {inputs.length > 2 && (
                <button
                  onClick={() => removeInput(i)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c4c8d0', padding: '2px', lineHeight: 1, fontSize: 14, marginLeft: 1 }}
                >×</button>
              )}
            </div>
          ))}
          {inputs.length < 4 && (
            <button className="btn btn-outline btn-sm" onClick={addInput}>{t.add}</button>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="btn btn-outline btn-sm" onClick={clearAll}>{t.clear}</button>
            <button className="btn btn-dark" onClick={handleCompare} disabled={loading || inputs.filter(Boolean).length < 2}>
              {loading ? <span className="spinner" style={{ width: '0.85rem', height: '0.85rem' }} /> : t.compare}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#fbeae3', border: '1px solid #f4c4bb', borderRadius: 12, padding: '0.9rem 1.1rem', color: '#e0594a', marginBottom: 16 }}>⚠️ {error}</div>
      )}

      {/* Loading */}
      {loading && (
        <div className="card skeleton" style={{ height: 320, borderRadius: 18 }} />
      )}

      {/* Empty prompt */}
      {!loading && !data && !error && (
        <div className="empty-state"><h3>{t.noData}</h3></div>
      )}

      {/* Comparison table */}
      {!loading && data && (
        <div className="card" style={{ borderRadius: 18, overflow: 'hidden', padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
              {/* Column headers */}
              <thead>
                <tr>
                  <th style={{ width: 160, padding: '14px 18px', fontSize: 12, fontWeight: 600, textAlign: 'left', color: '#8a909e', background: 'var(--bg-panel)', borderBottom: '1px solid var(--border-soft)' }}>Metric</th>
                  {data.columns.map((col, i) => (
                    <th key={col.ticker} style={{ padding: '14px 18px', textAlign: 'right', background: HEADER_BG[i % HEADER_BG.length] + '14', borderBottom: '1px solid var(--border-soft)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: HEADER_BG[i % HEADER_BG.length] }}>{col.ticker}</span>
                          <button className="btn btn-outline btn-sm" style={{ fontSize: 11, padding: '2px 8px', borderRadius: 7 }} onClick={() => navigate(`/stock/${col.ticker}`)}>{t.viewStock}</button>
                        </div>
                        <div style={{ fontSize: 12, color: '#8a909e', fontWeight: 400, maxWidth: 140, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600 }}>${col.price.toFixed(2)}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 600, color: col.change_pct >= 0 ? '#15a06a' : '#e0594a' }}>
                            {col.change_pct >= 0 ? '+' : ''}{col.change_pct.toFixed(2)}%
                          </span>
                        </div>
                        {col.sector && <span className="badge-sector" style={{ fontSize: 10 }}>{col.sector}</span>}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, ri) => (
                  <tr key={row.key} style={{ background: ri % 2 === 0 ? 'transparent' : 'rgba(239,228,208,0.2)' }}>
                    <td style={{ padding: '12px 18px', fontSize: 12.5, color: '#6b7180', fontWeight: 500, borderBottom: '1px solid var(--border-soft)' }}>{row.metric}</td>
                    {row.values.map((v, vi) => {
                      const isNum = typeof v === 'number';
                      const str = v === null ? '—' : String(v);
                      const rs = isNum ? {} : ratingStyle(v);
                      return (
                        <td key={vi} style={{ padding: '12px 18px', textAlign: 'right', fontFamily: isNum ? 'var(--font-mono)' : 'var(--font-sans)', fontSize: 13, fontWeight: isNum ? 600 : 400, color: 'var(--ink)', borderBottom: '1px solid var(--border-soft)' }}>
                          <span style={rs}>{str}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
