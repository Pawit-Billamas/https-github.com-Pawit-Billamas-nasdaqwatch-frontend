import React, { useState, useEffect, useCallback } from 'react';
import { getWeeklyReport, generateWeeklyReport } from '../services/api';
import type { WeeklyReport as WeeklyReportType } from '../types';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { RefreshCw, TrendingUp, FileText, Globe, AlertCircle, Calendar } from 'lucide-react';

const formatDate = (dateStr: string): string => {
  try {
    return format(parseISO(dateStr), 'd MMMM yyyy', { locale: th });
  } catch {
    return dateStr;
  }
};

const WeeklyReport: React.FC = () => {
  const [report, setReport] = useState<WeeklyReportType | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const data = await getWeeklyReport();
      setReport(data);
    } catch (e: unknown) {
      // Check HTTP status (404 = no report yet, not an error)
      const status = (e as { status?: number }).status;
      const msg = e instanceof Error ? e.message : '';
      if (status === 404 || msg.includes('404') || msg.toLowerCase().includes('no weekly report') || msg.toLowerCase().includes('not found')) {
        setNotFound(true);
      } else {
        setError('ไม่สามารถโหลดรายงานได้ — ' + msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const data = await generateWeeklyReport();
      setReport(data);
      setNotFound(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'ไม่สามารถสร้างรายงานได้');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
      {/* Topbar */}
      <div className="topbar">
        <span className="topbar-title">Weekly Report</span>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchReport} disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <RefreshCw size={13} />
            รีเฟรช
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleGenerate} disabled={generating}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {generating ? (
              <><div className="spinner" style={{ width: '0.85rem', height: '0.85rem', borderTopColor: 'var(--parchment)' }} />กำลังสร้าง...</>
            ) : (
              <><FileText size={13} />สร้างรายงานใหม่</>
            )}
          </button>
        </div>
      </div>

      <div style={{ padding: '2rem' }}>
        {/* Page header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '0.25rem' }}>
            รายงานประจำสัปดาห์
          </h1>
          {report && (
            <div className="flex-gap-2" style={{ marginTop: '0.4rem' }}>
              <Calendar size={13} color="var(--text-muted)" />
              <span className="font-mono text-muted" style={{ fontSize: '0.75rem' }}>
                {formatDate(report.week_start)} — {formatDate(report.week_end)}
              </span>
            </div>
          )}
          <div className="divider" style={{ marginTop: '0.75rem' }} />
        </div>

        {/* Error */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '1rem 1.25rem',
            background: 'var(--down-bg)',
            border: '1px solid #ffcdd2',
            borderRadius: 'var(--radius)',
            color: 'var(--down)',
            marginBottom: '1.5rem',
          }}>
            <AlertCircle size={16} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>เกิดข้อผิดพลาด</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{error}</div>
            </div>
          </div>
        )}

        {/* Generating state */}
        {generating && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 2rem', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', border: '2px solid var(--border)', borderTopColor: 'var(--steel)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <p className="text-muted font-mono" style={{ fontSize: '0.8rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              AI กำลังวิเคราะห์ข้อมูล...
            </p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !generating && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {[180, 140, 260].map((h, i) => (
              <div key={i} className="skeleton" style={{ width: '100%', height: `${h}px`, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        )}

        {/* Not found */}
        {!loading && !generating && notFound && (
          <div className="empty-state" style={{ padding: '5rem 2rem' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'var(--parchment-dim)', border: '1px solid var(--border-strong)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FileText size={24} color="var(--text-muted)" />
            </div>
            <h3>ยังไม่มีรายงานประจำสัปดาห์</h3>
            <p>สร้างรายงานครั้งแรกด้วย AI เพื่อดูภาพรวมตลาดและคำแนะนำการลงทุน</p>
            <button className="btn btn-primary" onClick={handleGenerate}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <RefreshCw size={14} />
              สร้างรายงานแรก
            </button>
          </div>
        )}

        {/* Report content */}
        {!loading && !generating && report && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="animate-fade-up">

            {/* Market Outlook */}
            <div className="card" style={{ borderTop: '2px solid var(--navy)' }}>
              <div className="flex-gap-2" style={{ marginBottom: '0.75rem' }}>
                <Globe size={15} color="var(--steel)" />
                <span className="section-eyebrow" style={{ marginBottom: 0 }}>ภาพรวมตลาด</span>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                {report.market_outlook}
              </p>
            </div>

            {/* Two-column: Top Picks + Watchlist Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '1.25rem', alignItems: 'start' }}>

              {/* Top Picks */}
              {report.top_picks && report.top_picks.length > 0 && (
                <div className="card">
                  <div className="flex-gap-2" style={{ marginBottom: '1rem' }}>
                    <TrendingUp size={15} color="var(--steel)" />
                    <span className="section-eyebrow" style={{ marginBottom: 0 }}>Top Picks สัปดาห์นี้</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {report.top_picks.map((ticker, idx) => (
                      <div key={ticker} style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.6rem 0.85rem',
                        background: idx < 3 ? 'rgba(30,36,51,0.04)' : 'transparent',
                        borderRadius: 'var(--radius)',
                        border: idx < 3 ? '1px solid var(--border-strong)' : '1px solid transparent',
                      }}>
                        <span style={{
                          width: '22px', height: '22px', borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.65rem', fontWeight: 700,
                          background: idx === 0 ? 'var(--navy)' : idx === 1 ? 'var(--navy-light)' : idx === 2 ? 'var(--steel)' : 'var(--mist)',
                          color: idx < 3 ? 'var(--parchment)' : 'var(--navy)',
                          flexShrink: 0,
                          fontFamily: 'var(--font-mono)',
                        }}>
                          {idx + 1}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.92rem', color: 'var(--navy)', letterSpacing: '0.03em' }}>
                          {ticker}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Watchlist Summary */}
              {report.watch_list_summary && (
                <div className="card">
                  <div className="flex-gap-2" style={{ marginBottom: '0.75rem' }}>
                    <FileText size={15} color="var(--steel)" />
                    <span className="section-eyebrow" style={{ marginBottom: 0 }}>สรุป Watchlist</span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                    {report.watch_list_summary}
                  </p>
                </div>
              )}
            </div>

            {/* Meta footer */}
            <div className="font-mono text-muted" style={{ fontSize: '0.7rem', letterSpacing: '0.06em', textAlign: 'center', paddingTop: '0.5rem' }}>
              สร้างเมื่อ {format(parseISO(report.created_at), "d MMMM yyyy 'เวลา' HH:mm 'น.'", { locale: th })}
            </div>
          </div>
        )}
      </div>

      {/* Mobile grid fallback */}
      <style>{`@media(max-width:768px){.weekly-2col{grid-template-columns:1fr !important}}`}</style>
    </div>
  );
};

export default WeeklyReport;
