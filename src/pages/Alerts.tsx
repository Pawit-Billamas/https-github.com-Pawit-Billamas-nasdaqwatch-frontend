import { useState, useEffect } from 'react';
import { useLang } from '../context/LangContext';
import {
  getAlertRules, createAlertRule, toggleAlertRule, deleteAlertRule,
  getAlertEvents, markAlertRead,
} from '../services/api';
import type { AlertRule, AlertEvent, AlertKind } from '../types';

const tl = {
  en: {
    title: 'Alerts', rules: 'Alert Rules', activity: 'Recent Activity',
    addRule: 'New Alert', ticker: 'Ticker', kind: 'Condition', target: 'Target',
    enabled: 'On', disabled: 'Off', delete: 'Delete', save: 'Save', cancel: 'Cancel',
    empty: 'No alert rules. Create one above.', emptyEvents: 'No triggered alerts yet.',
    confirm: 'Delete this alert rule?',
    kinds: {
      price_above: 'Price above', price_below: 'Price below',
      pct_move: '% move', news: 'News mention', ai_digest: 'AI digest',
    },
  },
  th: {
    title: 'การแจ้งเตือน', rules: 'กฎการแจ้งเตือน', activity: 'กิจกรรมล่าสุด',
    addRule: 'แจ้งเตือนใหม่', ticker: 'Ticker', kind: 'เงื่อนไข', target: 'เป้าหมาย',
    enabled: 'เปิด', disabled: 'ปิด', delete: 'ลบ', save: 'บันทึก', cancel: 'ยกเลิก',
    empty: 'ยังไม่มีการแจ้งเตือน สร้างรายการแรก', emptyEvents: 'ยังไม่มีการแจ้งเตือนที่ทำงาน',
    confirm: 'ยืนยันลบการแจ้งเตือนนี้?',
    kinds: {
      price_above: 'ราคาสูงกว่า', price_below: 'ราคาต่ำกว่า',
      pct_move: 'เปลี่ยน %', news: 'กล่าวถึงในข่าว', ai_digest: 'AI digest',
    },
  },
};

const KIND_OPTIONS: AlertKind[] = ['price_above','price_below','pct_move','news','ai_digest'];

interface FormState { ticker: string; kind: AlertKind; target: string; }
const emptyForm: FormState = { ticker: '', kind: 'price_above', target: '' };

function kindIcon(k: AlertKind) {
  if (k === 'price_above') return '↑';
  if (k === 'price_below') return '↓';
  if (k === 'pct_move') return '±';
  if (k === 'news') return '📰';
  return '✨';
}
function kindColor(k: AlertKind): { color: string; bg: string } {
  if (k === 'price_above') return { color: '#15a06a', bg: '#e6f5ee' };
  if (k === 'price_below') return { color: '#e0594a', bg: '#fbeae3' };
  if (k === 'pct_move') return { color: '#2945A8', bg: '#dde5fc' };
  if (k === 'news') return { color: '#b07d18', bg: '#f7ecd2' };
  return { color: '#7c5cbf', bg: '#ede5fc' };
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: 40, height: 22, borderRadius: 11, cursor: 'pointer',
        background: on ? 'var(--accent)' : '#d3d6dd',
        position: 'relative', transition: 'background 180ms',
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', width: 16, height: 16, borderRadius: '50%',
        background: '#fff', top: 3, left: on ? 21 : 3,
        transition: 'left 180ms', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }} />
    </div>
  );
}

export default function Alerts() {
  const { lang } = useLang();
  const t = tl[lang];

  const [rules, setRules] = useState<AlertRule[]>([]);
  const [events, setEvents] = useState<AlertEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [r, e] = await Promise.all([getAlertRules(), getAlertEvents()]);
      setRules(r); setEvents(e);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    const ticker = form.ticker.trim().toUpperCase();
    if (!ticker || !form.kind) return;
    const needsTarget = ['price_above','price_below','pct_move'].includes(form.kind);
    const target = needsTarget ? parseFloat(form.target) : null;
    if (needsTarget && (isNaN(target!) || target! <= 0)) return;
    setSaving(true);
    try { await createAlertRule({ ticker, kind: form.kind, target, enabled: true }); setShowForm(false); setForm(emptyForm); await load(); }
    catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const handleToggle = async (id: number, enabled: boolean) => {
    setTogglingId(id);
    try { await toggleAlertRule(id, !enabled); setRules(rs => rs.map(r => r.id === id ? { ...r, enabled: !enabled } : r)); }
    catch { /* ignore */ }
    finally { setTogglingId(null); }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t.confirm)) return;
    setDeletingId(id);
    try { await deleteAlertRule(id); await load(); }
    catch { /* ignore */ }
    finally { setDeletingId(null); }
  };

  const handleMarkRead = async (id: number) => {
    try { await markAlertRead(id); setEvents(es => es.map(e => e.id === id ? { ...e, is_read: true } : e)); }
    catch { /* ignore */ }
  };

  const needsTarget = ['price_above','price_below','pct_move'].includes(form.kind);
  const unreadCount = events.filter(e => !e.is_read).length;

  return (
    <div className="page-content animate-fade-up">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{t.title}</h1>
        <button className="btn btn-dark" onClick={() => setShowForm(v => !v)}>{t.addRule}</button>
      </div>

      {/* Add form (inline) */}
      {showForm && (
        <div className="card" style={{ borderRadius: 18, padding: 20, marginBottom: 18, border: '1.5px solid var(--accent)' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <label style={{ fontSize: 11.5, color: '#8a909e', display: 'block', marginBottom: 5 }}>{t.ticker}</label>
              <input className="input" value={form.ticker} onChange={e => setForm(f => ({ ...f, ticker: e.target.value.toUpperCase() }))} placeholder="AAPL" style={{ width: 80, fontFamily: 'var(--font-mono)', fontWeight: 600 }} />
            </div>
            <div>
              <label style={{ fontSize: 11.5, color: '#8a909e', display: 'block', marginBottom: 5 }}>{t.kind}</label>
              <select
                className="input"
                value={form.kind}
                onChange={e => setForm(f => ({ ...f, kind: e.target.value as AlertKind }))}
                style={{ width: 160, fontFamily: 'var(--font-sans)' }}
              >
                {KIND_OPTIONS.map(k => <option key={k} value={k}>{t.kinds[k]}</option>)}
              </select>
            </div>
            {needsTarget && (
              <div>
                <label style={{ fontSize: 11.5, color: '#8a909e', display: 'block', marginBottom: 5 }}>{t.target}</label>
                <input className="input" type="number" min="0" step="any" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} placeholder={form.kind === 'pct_move' ? '5.0' : '200.00'} style={{ width: 100 }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}>{t.cancel}</button>
              <button className="btn btn-dark btn-sm" onClick={handleSave} disabled={saving}>
                {saving ? <span className="spinner" style={{ width: '0.75rem', height: '0.75rem' }} /> : t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 18, alignItems: 'start' }}>
        {/* Rules list */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7180', marginBottom: 12 }}>{t.rules}</div>
          {loading ? (
            [0,1,2].map(i => <div key={i} className="card skeleton" style={{ height: 64, borderRadius: 14, marginBottom: 10 }} />)
          ) : rules.length === 0 ? (
            <div className="empty-state"><h3>{t.empty}</h3></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {rules.map(r => {
                const kc = kindColor(r.kind);
                const kindLabel = t.kinds[r.kind];
                return (
                  <div
                    key={r.id}
                    className="card"
                    style={{ borderRadius: 14, padding: '12px 15px', display: 'flex', alignItems: 'center', gap: 13, opacity: r.enabled ? 1 : 0.55 }}
                  >
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: kc.bg, color: kc.color, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{kindIcon(r.kind)}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700 }}>{r.ticker}</span>
                        <span style={{ fontSize: 11.5, color: kc.color, background: kc.bg, padding: '2px 7px', borderRadius: 5, fontWeight: 600 }}>{kindLabel}</span>
                        {r.target !== null && (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#8a909e' }}>
                            {r.kind === 'pct_move' ? `±${r.target}%` : `$${r.target}`}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: '#a7aab2', marginTop: 3 }}>
                        {new Date(r.created_at).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')}
                      </div>
                    </div>
                    <Toggle on={r.enabled} onChange={() => togglingId !== r.id && handleToggle(r.id, r.enabled)} />
                    <button
                      className="btn btn-sm"
                      style={{ background: '#fbeae3', color: '#e0594a', border: '1px solid #f4c4bb', flexShrink: 0 }}
                      onClick={() => handleDelete(r.id)}
                      disabled={deletingId === r.id}
                    >
                      {deletingId === r.id ? <span className="spinner" style={{ width: '0.7rem', height: '0.7rem' }} /> : t.delete}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Events feed */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7180', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            {t.activity}
            {unreadCount > 0 && <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: 10, fontSize: 10, fontWeight: 700, padding: '1px 7px' }}>{unreadCount}</span>}
          </div>
          {loading ? (
            [0,1,2].map(i => <div key={i} className="card skeleton" style={{ height: 56, borderRadius: 13, marginBottom: 8 }} />)
          ) : events.length === 0 ? (
            <div style={{ fontSize: 13, color: '#a7aab2', padding: '1.5rem 0' }}>{t.emptyEvents}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {events.slice(0, 20).map(ev => (
                <div
                  key={ev.id}
                  className="card card-hover"
                  onClick={() => !ev.is_read && handleMarkRead(ev.id)}
                  style={{ borderRadius: 13, padding: '11px 13px', borderLeft: ev.is_read ? undefined : '3px solid var(--accent)', opacity: ev.is_read ? 0.7 : 1, cursor: ev.is_read ? 'default' : 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700 }}>{ev.ticker}</span>
                    <span style={{ fontSize: 11, color: '#a7aab2', marginLeft: 'auto' }}>
                      {new Date(ev.triggered_at).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')}
                    </span>
                    {!ev.is_read && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#3b4150', marginTop: 4, lineHeight: 1.4 }}>{ev.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
