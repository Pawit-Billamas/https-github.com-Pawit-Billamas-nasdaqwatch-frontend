import { useState, useEffect } from 'react';
import { useLang } from '../context/LangContext';
import {
  getPortfolio, addPortfolioHolding, updatePortfolioHolding, deletePortfolioHolding,
} from '../services/api';
import type { PortfolioSummary, PortfolioHolding } from '../types';

const tl = {
  en: {
    title: 'Portfolio', totalValue: 'Total Value', dayChange: "Today's Change",
    totalGain: 'Total Gain', holdings: 'Holdings', addHolding: 'Add Holding',
    ticker: 'Ticker', shares: 'Shares', avgCost: 'Avg Cost', price: 'Price',
    value: 'Value', gain: 'Gain / Loss', weight: 'Weight', actions: 'Actions',
    save: 'Save', cancel: 'Cancel', delete: 'Delete',
    empty: 'No holdings yet. Add your first stock.',
    confirm: 'Delete this holding?',
    edit: 'Edit',
  },
  th: {
    title: 'พอร์ตโฟลิโอ', totalValue: 'มูลค่ารวม', dayChange: 'เปลี่ยนวันนี้',
    totalGain: 'กำไรรวม', holdings: 'หุ้นที่ถือ', addHolding: 'เพิ่มหุ้น',
    ticker: 'Ticker', shares: 'จำนวนหุ้น', avgCost: 'ต้นทุนเฉลี่ย', price: 'ราคาปัจจุบัน',
    value: 'มูลค่า', gain: 'กำไร / ขาดทุน', weight: 'สัดส่วน', actions: '',
    save: 'บันทึก', cancel: 'ยกเลิก', delete: 'ลบ',
    empty: 'ยังไม่มีหุ้น เพิ่มหุ้นตัวแรก',
    confirm: 'ยืนยันลบหุ้นนี้?',
    edit: 'แก้ไข',
  },
};

function fmtMoney(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtPct(n: number) { return (n >= 0 ? '+' : '') + n.toFixed(2) + '%'; }

const DONUT_COLORS = ['#2945A8','#15a06a','#b07d18','#e0594a','#7c5cbf','#1295a4','#e07b2a','#6b8aad'];

function DonutChart({ slices }: { slices: { pct: number; ticker: string }[] }) {
  const r = 46; const cx = 60; const cy = 60; const stroke = 18;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" style={{ display: 'block' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#efe4d0" strokeWidth={stroke} />
      {slices.map((s, i) => {
        const dash = (s.pct / 100) * circumference;
        const gap = circumference - dash;
        const el = (
          <circle
            key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px', transition: 'stroke-dasharray 0.5s ease' }}
          />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}

interface FormState { ticker: string; shares: string; avg_cost: string; }
const emptyForm: FormState = { ticker: '', shares: '', avg_cost: '' };

export default function Portfolio() {
  const { lang } = useLang();
  const t = tl[lang];
  const [data, setData] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try { setData(await getPortfolio()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditId(null); setShowForm(true); };
  const openEdit = (h: PortfolioHolding) => {
    setForm({ ticker: h.ticker, shares: String(h.shares), avg_cost: String(h.avg_cost) });
    setEditId(h.id ?? null); setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setForm(emptyForm); setEditId(null); };

  const handleSave = async () => {
    const ticker = form.ticker.trim().toUpperCase();
    const shares = parseFloat(form.shares);
    const avg_cost = parseFloat(form.avg_cost);
    if (!ticker || isNaN(shares) || isNaN(avg_cost) || shares <= 0 || avg_cost <= 0) return;
    setSaving(true);
    try {
      if (editId !== null) await updatePortfolioHolding(editId, { ticker, shares, avg_cost });
      else await addPortfolioHolding({ ticker, shares, avg_cost });
      closeForm(); await load();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t.confirm)) return;
    setDeletingId(id);
    try { await deletePortfolioHolding(id); await load(); }
    catch { /* ignore */ }
    finally { setDeletingId(null); }
  };

  const holdings = data?.holdings ?? [];
  const slices = holdings.map(h => ({ pct: h.weight_pct, ticker: h.ticker }));

  const summaryCards = [
    { label: t.totalValue, value: data ? fmtMoney(data.total_value) : '—', mono: true },
    {
      label: t.dayChange,
      value: data ? fmtMoney(data.day_change) : '—',
      sub: data ? fmtPct(data.day_change_pct) : undefined,
      color: data ? (data.day_change >= 0 ? '#15a06a' : '#e0594a') : undefined,
    },
    {
      label: t.totalGain,
      value: data ? fmtMoney(data.total_gain) : '—',
      sub: data ? fmtPct(data.total_gain_pct) : undefined,
      color: data ? (data.total_gain >= 0 ? '#15a06a' : '#e0594a') : undefined,
    },
  ];

  return (
    <div className="page-content animate-fade-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{t.title}</h1>
        <button className="btn btn-dark" onClick={openAdd}>{t.addHolding}</button>
      </div>

      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 22 }}>
        {summaryCards.map(c => (
          <div key={c.label} className="card" style={{ borderRadius: 18, padding: '18px 20px' }}>
            <div style={{ fontSize: 12, color: 'var(--ink-tertiary)', marginBottom: 8 }}>{c.label}</div>
            {loading ? (
              <div className="skeleton" style={{ width: 120, height: 26 }} />
            ) : (
              <>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', color: c.color ?? 'var(--ink)' }}>{c.value}</div>
                {c.sub && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: c.color, marginTop: 3 }}>{c.sub}</div>}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Chart + table */}
      {error ? (
        <div style={{ background: '#fbeae3', border: '1px solid #f4c4bb', borderRadius: 12, padding: '1rem 1.25rem', color: '#e0594a' }}>⚠️ {error}</div>
      ) : loading ? (
        <div className="card skeleton" style={{ height: 280 }} />
      ) : holdings.length === 0 ? (
        <div className="empty-state"><h3>{t.empty}</h3></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 18, alignItems: 'start' }}>
          {/* Donut chart */}
          <div className="card" style={{ borderRadius: 18, padding: '16px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <DonutChart slices={slices} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', padding: '0 8px' }}>
              {holdings.slice(0, 6).map((h, i) => (
                <div key={h.ticker} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: DONUT_COLORS[i % DONUT_COLORS.length], flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600 }}>{h.ticker}</span>
                  <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#9399a4' }}>{h.weight_pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="card" style={{ borderRadius: 18, overflow: 'hidden', padding: 0 }}>
            <div className="data-table" style={{ borderRadius: 18 }}>
              <div className="data-table-header" style={{ gridTemplateColumns: '90px 70px 80px 80px 100px 100px 70px 60px' }}>
                <span>{t.ticker}</span><span>{t.shares}</span><span>{t.avgCost}</span><span>{t.price}</span>
                <span>{t.value}</span><span>{t.gain}</span><span>{t.weight}</span><span></span>
              </div>
              {holdings.map(h => {
                const gainColor = h.gain >= 0 ? '#15a06a' : '#e0594a';
                return (
                  <div key={h.ticker} className="data-table-row" style={{ gridTemplateColumns: '90px 70px 80px 80px 100px 100px 70px 60px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{h.ticker}</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{h.shares}</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{fmtMoney(h.avg_cost)}</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{fmtMoney(h.price)}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmtMoney(h.value)}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: gainColor, fontWeight: 600 }}>
                      {fmtMoney(h.gain)} <span style={{ fontSize: 11 }}>({fmtPct(h.gain_pct)})</span>
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{h.weight_pct.toFixed(1)}%</span>
                    <span style={{ display: 'flex', gap: 5 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(h)}>{t.edit}</button>
                      <button
                        className="btn btn-sm" style={{ background: '#fbeae3', color: '#e0594a', border: '1px solid #f4c4bb' }}
                        onClick={() => h.id !== undefined && handleDelete(h.id)}
                        disabled={deletingId === h.id}
                      >
                        {deletingId === h.id ? <span className="spinner" style={{ width: '0.7rem', height: '0.7rem' }} /> : t.delete}
                      </button>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,22,28,0.3)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div className="card" style={{ width: 360, borderRadius: 20, padding: 24, boxShadow: '0 20px 60px rgba(20,22,28,0.25)' }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 18px' }}>{editId ? t.edit : t.addHolding}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: '#8a909e', display: 'block', marginBottom: 5 }}>{t.ticker}</label>
                <input className="input" value={form.ticker} onChange={e => setForm(f => ({ ...f, ticker: e.target.value.toUpperCase() }))} placeholder="AAPL" disabled={!!editId} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#8a909e', display: 'block', marginBottom: 5 }}>{t.shares}</label>
                <input className="input" type="number" min="0" step="any" value={form.shares} onChange={e => setForm(f => ({ ...f, shares: e.target.value }))} placeholder="10" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#8a909e', display: 'block', marginBottom: 5 }}>{t.avgCost}</label>
                <input className="input" type="number" min="0" step="any" value={form.avg_cost} onChange={e => setForm(f => ({ ...f, avg_cost: e.target.value }))} placeholder="150.00" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={closeForm}>{t.cancel}</button>
              <button className="btn btn-dark" style={{ flex: 1 }} onClick={handleSave} disabled={saving}>
                {saving ? <span className="spinner" style={{ width: '0.85rem', height: '0.85rem' }} /> : t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
