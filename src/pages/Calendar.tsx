import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LangContext';
import { getCalendar } from '../services/api';
import type { CalendarWeek, CalendarEvent } from '../types';

const tl = {
  en: {
    title: 'Calendar', subtitle: 'Upcoming earnings, dividends, and economic events.',
    earnings: 'Earnings', dividend: 'Dividend', economic: 'Economic',
    noEvents: 'No events', prev: 'Prev week', next: 'Next week',
    today: 'Today',
  },
  th: {
    title: 'ปฏิทิน', subtitle: 'รายงานกำไร เงินปันผล และเหตุการณ์เศรษฐกิจที่กำลังจะมาถึง',
    earnings: 'รายงานกำไร', dividend: 'เงินปันผล', economic: 'เศรษฐกิจ',
    noEvents: 'ไม่มีเหตุการณ์', prev: 'สัปดาห์ก่อน', next: 'สัปดาห์ถัดไป',
    today: 'วันนี้',
  },
};

const DAYS_EN = ['Mon','Tue','Wed','Thu','Fri'];
const DAYS_TH = ['จ','อ','พ','พฤ','ศ'];

const EVENT_COLORS: Record<CalendarEvent['kind'], { color: string; bg: string }> = {
  earnings: { color: '#2945A8', bg: '#dde5fc' },
  dividend: { color: '#15a06a', bg: '#e6f5ee' },
  economic: { color: '#b07d18', bg: '#f7ecd2' },
};

export default function Calendar() {
  const navigate = useNavigate();
  const { lang } = useLang();
  const t = tl[lang];

  const [weeks, setWeeks] = useState<CalendarWeek[]>([]);
  const [weekIdx, setWeekIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true); setError(null);
    getCalendar()
      .then(w => { setWeeks(w); })
      .catch(e => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, []);

  const week = weeks[weekIdx] ?? null;
  const days = DAYS_EN;
  const dayLabels = lang === 'th' ? DAYS_TH : DAYS_EN;

  const eventPill = (ev: CalendarEvent, i: number) => {
    const ec = EVENT_COLORS[ev.kind];
    return (
      <div
        key={i}
        title={ev.detail}
        onClick={() => ev.ticker && ev.ticker !== 'MACRO' && navigate(`/stock/${ev.ticker}`)}
        style={{
          fontSize: 10.5, fontWeight: 600, padding: '3px 7px', borderRadius: 6,
          color: ec.color, background: ec.bg, lineHeight: 1.3,
          cursor: ev.ticker && ev.ticker !== 'MACRO' ? 'pointer' : 'default',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          maxWidth: '100%',
        }}
      >
        {ev.ticker && ev.ticker !== 'MACRO' ? (
          <span style={{ fontFamily: 'var(--font-mono)' }}>{ev.ticker}</span>
        ) : (
          <span>{ev.detail.slice(0, 22)}{ev.detail.length > 22 ? '...' : ''}</span>
        )}
      </div>
    );
  };

  return (
    <div className="page-content animate-fade-up">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 5px' }}>{t.title}</h1>
        <p style={{ fontSize: 13.5, color: 'var(--ink-tertiary)', margin: 0 }}>{t.subtitle}</p>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
        {(['earnings','dividend','economic'] as const).map(k => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: EVENT_COLORS[k].bg, border: `1.5px solid ${EVENT_COLORS[k].color}`, display: 'inline-block' }} />
            <span style={{ fontSize: 12, color: '#6b7180', fontWeight: 500 }}>{t[k]}</span>
          </div>
        ))}
      </div>

      {/* Nav row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button className="btn btn-outline btn-sm" onClick={() => setWeekIdx(i => Math.max(0, i - 1))} disabled={weekIdx === 0}>{t.prev}</button>
        {week && (
          <span style={{ fontSize: 13, color: '#6b7180', fontFamily: 'var(--font-mono)' }}>
            {week.week_start} – {week.week_end}
          </span>
        )}
        <button className="btn btn-outline btn-sm" onClick={() => setWeekIdx(i => Math.min(weeks.length - 1, i + 1))} disabled={weekIdx >= weeks.length - 1}>{t.next}</button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#fbeae3', border: '1px solid #f4c4bb', borderRadius: 12, padding: '0.9rem 1.1rem', color: '#e0594a', marginBottom: 16 }}>⚠️ {error}</div>
      )}

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {[0,1,2,3,4].map(i => <div key={i} className="card skeleton" style={{ height: 220, borderRadius: 16 }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {days.map((day, di) => {
            const dayData = week?.days?.[di];
            const dateLabel = dayData?.date ?? '';
            const dateShort = dateLabel ? dateLabel.slice(5) : '';
            const isToday = dateLabel === new Date().toISOString().split('T')[0];
            const events = dayData?.events ?? [];
            return (
              <div
                key={day}
                className="card"
                style={{
                  borderRadius: 16, padding: '12px 11px', minHeight: 180,
                  border: isToday ? '1.5px solid var(--accent)' : '1.5px solid transparent',
                }}
              >
                {/* Day header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: isToday ? 'var(--accent)' : '#8a909e' }}>
                    {dayLabels[di]}
                  </span>
                  {dateShort && (
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 11, color: isToday ? '#fff' : '#a7aab2',
                      background: isToday ? 'var(--accent)' : 'transparent',
                      padding: isToday ? '2px 6px' : '0', borderRadius: 6,
                    }}>{dateShort}</span>
                  )}
                </div>

                {/* Events */}
                {events.length === 0 ? (
                  <div style={{ fontSize: 11, color: '#c4c8d0', textAlign: 'center', paddingTop: 24 }}>{t.noEvents}</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {events.slice(0, 6).map((ev, i) => eventPill(ev, i))}
                    {events.length > 6 && (
                      <div style={{ fontSize: 10.5, color: '#a7aab2', paddingLeft: 2 }}>+{events.length - 6} more</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
