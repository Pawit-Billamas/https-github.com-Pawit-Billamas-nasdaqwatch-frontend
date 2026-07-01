import type { FundamentalsData, FundamentalsMetric } from '../types';

interface Props {
  data: FundamentalsData;
  loading?: boolean;
}

// ─── Format value by type ───────────────────────────────────────────────────
function formatValue(v: number | null, fmt: FundamentalsMetric['format']): string {
  if (v === null || v === undefined) return 'N/A';
  switch (fmt) {
    case 'x':      return `${v.toFixed(1)}x`;
    case '%':      return `${v.toFixed(2)}%`;
    case '$':      return `$${v.toFixed(2)}`;
    case '$large': {
      const abs = Math.abs(v);
      const sign = v < 0 ? '-' : '';
      if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
      if (abs >= 1e9)  return `${sign}$${(abs / 1e9).toFixed(2)}B`;
      if (abs >= 1e6)  return `${sign}$${(abs / 1e6).toFixed(2)}M`;
      return `${sign}$${abs.toLocaleString()}`;
    }
    default:       return v.toFixed(2);
  }
}

// ─── Verdict config ──────────────────────────────────────────────────────────
const VERDICT_CONFIG = {
  strong: { label: '💪 แข็งแกร่ง',   color: 'var(--up)',    bg: 'var(--up-bg)',    border: 'var(--up-border)' },
  fair:   { label: '👍 พอใช้ได้',    color: '#d97706',      bg: '#fffbeb',         border: '#fcd34d' },
  mixed:  { label: '⚡ สัญญาณผสม',   color: '#6366f1',      bg: '#eef2ff',         border: '#a5b4fc' },
  weak:   { label: '⚠️ ระวัง',       color: 'var(--down)',  bg: 'var(--down-bg)', border: '#fca5a5' },
};

// ─── Rating chip ──────────────────────────────────────────────────────────────
function RatingBadge({ rating }: { rating: 'good' | 'neutral' | 'bad' }) {
  const map = {
    good:    { label: 'ดี',      color: 'var(--up)',   bg: 'var(--up-bg)',   border: '#86efac' },
    neutral: { label: 'ปานกลาง', color: '#6b7280',    bg: '#f3f4f6',        border: '#d1d5db' },
    bad:     { label: 'ระวัง',   color: 'var(--down)', bg: 'var(--down-bg)', border: '#fca5a5' },
  };
  const { label, color, bg, border } = map[rating];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '0.15rem 0.5rem', borderRadius: '20px',
      fontSize: '0.65rem', fontWeight: 700,
      fontFamily: 'var(--font-mono)', letterSpacing: '0.03em',
      color, background: bg, border: `1px solid ${border}`,
      flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

// ─── Single metric row ───────────────────────────────────────────────────────
function MetricRow({ metric }: { metric: FundamentalsMetric }) {
  const isNull = metric.value === null || metric.value === undefined;
  const borderColor = {
    good: 'var(--up)', bad: 'var(--down)', neutral: 'var(--border-strong)',
  }[metric.rating];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: '0.25rem',
      padding: '0.75rem 1rem',
      background: 'var(--white)',
      border: '1px solid var(--border)',
      borderLeft: `3px solid ${isNull ? 'var(--border-strong)' : borderColor}`,
      borderRadius: '8px',
      boxShadow: '0 1px 2px rgba(15,17,23,0.04)',
    }}>
      {/* Top row: label + badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--ink-tertiary)', fontWeight: 500 }}>
          {metric.label}
        </span>
        {!isNull && <RatingBadge rating={metric.rating} />}
      </div>
      {/* Value */}
      <span style={{
        fontSize: '1.15rem', fontWeight: 700,
        fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em',
        color: isNull ? 'var(--ink-muted)' : 'var(--ink)',
      }}>
        {isNull ? 'N/A' : formatValue(metric.value, metric.format)}
      </span>
      {/* Note */}
      <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', lineHeight: 1.4 }}>
        {metric.note}
      </span>
    </div>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────
function MetricSection({ title, keys, metrics }: {
  title: string;
  keys: string[];
  metrics: Record<string, FundamentalsMetric>;
}) {
  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <h3 style={{
        fontSize: '0.72rem', fontFamily: 'var(--font-mono)',
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'var(--ink-muted)', fontWeight: 500,
        marginBottom: '0.65rem',
        display: 'flex', alignItems: 'center', gap: '0.5rem',
      }}>
        {title}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
        {keys.map(k => metrics[k] ? <MetricRow key={k} metric={metrics[k]} /> : null)}
      </div>
    </div>
  );
}

// ─── Score bar ───────────────────────────────────────────────────────────────
function ScoreBar({ score, good, bad, neutral }: {
  score: number; good: number; bad: number; neutral: number;
}) {
  const total = good + bad + neutral || 1;
  const goodPct  = (good    / total) * 100;
  const badPct   = (bad     / total) * 100;
  const neutPct  = (neutral / total) * 100;

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.25rem', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' }}>
        <div style={{ width: `${goodPct}%`,  background: 'var(--up)',       transition: 'width 0.6s ease' }} />
        <div style={{ width: `${neutPct}%`,  background: '#d1d5db',         transition: 'width 0.6s ease' }} />
        <div style={{ width: `${badPct}%`,   background: 'var(--down)',     transition: 'width 0.6s ease' }} />
      </div>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <span style={{ fontSize: '0.68rem', color: 'var(--up)',   fontFamily: 'var(--font-mono)', fontWeight: 600 }}>▲ ดี {good}</span>
        <span style={{ fontSize: '0.68rem', color: '#6b7280',     fontFamily: 'var(--font-mono)', fontWeight: 600 }}>— ปานกลาง {neutral}</span>
        <span style={{ fontSize: '0.68rem', color: 'var(--down)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>▼ ระวัง {bad}</span>
      </div>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="skeleton" style={{ height: '90px', borderRadius: '10px' }} />
      {[0,1,2].map(i => (
        <div key={i}>
          <div className="skeleton" style={{ width: '120px', height: '12px', marginBottom: '0.6rem' }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            {[0,1,2,3].map(j => (
              <div key={j} className="skeleton" style={{ height: '90px', borderRadius: '8px' }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FundamentalsPanel({ data, loading }: Props) {
  if (loading) return <Skeleton />;
  if (!data) return null;

  const v = data.verdict;
  const vc = VERDICT_CONFIG[v.verdict] ?? VERDICT_CONFIG.mixed;

  const formatRevenue = (r: number | null) => {
    if (!r) return 'N/A';
    if (r >= 1e12) return `$${(r / 1e12).toFixed(2)}T`;
    if (r >= 1e9)  return `$${(r / 1e9).toFixed(2)}B`;
    if (r >= 1e6)  return `$${(r / 1e6).toFixed(2)}M`;
    return `$${r.toLocaleString()}`;
  };

  return (
    <div className="animate-fade-up">

      {/* ── Overall verdict card ── */}
      <div style={{
        background: vc.bg, border: `1.5px solid ${vc.border}`,
        borderRadius: '12px', padding: '1.1rem 1.25rem',
        marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
          <div>
            <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: vc.color, fontWeight: 500, marginBottom: '0.2rem' }}>
              ผลประเมินปัจจัยพื้นฐาน
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: vc.color, letterSpacing: '-0.01em' }}>
              {vc.label}
            </div>
          </div>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: vc.color, display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
              {v.score}
            </span>
          </div>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--ink-secondary)', marginBottom: '0.8rem', lineHeight: 1.5 }}>
          {v.summary}
        </p>
        <ScoreBar score={v.score} good={v.good_count} bad={v.bad_count} neutral={v.neutral_count} />
      </div>

      {/* ── Quick company info ── */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {data.industry && (
          <span style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', color: 'var(--ink-secondary)', fontWeight: 500 }}>
            🏭 {data.industry}
          </span>
        )}
        {data.total_revenue && (
          <span style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', color: 'var(--ink-secondary)', fontWeight: 500 }}>
            💰 Revenue: {formatRevenue(data.total_revenue)}
          </span>
        )}
        {data.employee_count && (
          <span style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px', color: 'var(--ink-secondary)', fontWeight: 500 }}>
            👥 {data.employee_count.toLocaleString()} พนักงาน
          </span>
        )}
        {data.next_earnings && (
          <span style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '20px', color: '#92400e', fontWeight: 600 }}>
            📅 Earnings: {data.next_earnings.slice(0, 10)}
          </span>
        )}
      </div>

      {/* ── Metric sections ── */}
      <MetricSection
        title="📊 Valuation — ราคาแพงแค่ไหน?"
        keys={['pe_trailing','pe_forward','peg_ratio','price_to_sales','price_to_book']}
        metrics={data.metrics}
      />
      <MetricSection
        title="💹 Profitability — ทำกำไรได้แค่ไหน?"
        keys={['gross_margin','operating_margin','profit_margin','roe','roa']}
        metrics={data.metrics}
      />
      <MetricSection
        title="🚀 Growth — เติบโตแค่ไหน?"
        keys={['revenue_growth','earnings_growth','eps_trailing','eps_forward']}
        metrics={data.metrics}
      />
      <MetricSection
        title="💵 Cash Flow — กระแสเงินสด"
        keys={['free_cash_flow','operating_cash']}
        metrics={data.metrics}
      />
      <MetricSection
        title="🏦 Balance Sheet — ความแข็งแกร่งทางการเงิน"
        keys={['debt_to_equity','current_ratio','total_cash','dividend_yield']}
        metrics={data.metrics}
      />
    </div>
  );
}
