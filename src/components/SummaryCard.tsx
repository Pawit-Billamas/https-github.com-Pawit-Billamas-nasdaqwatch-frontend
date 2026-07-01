import type { NewsSummary } from '../types';
import SentimentBadge from './SentimentBadge';

interface Props {
  summary?: NewsSummary;
  loading?: boolean;
}

export default function SummaryCard({ summary, loading }: Props) {
  if (loading) {
    return (
      <div className="card">
        {/* Eyebrow */}
        <div className="skeleton" style={{ width: '140px', height: '12px', marginBottom: '1rem' }} />
        <div className="divider" />
        {/* Body text */}
        <div className="skeleton" style={{ width: '100%', height: '14px', marginBottom: '0.5rem' }} />
        <div className="skeleton" style={{ width: '92%', height: '14px', marginBottom: '0.5rem' }} />
        <div className="skeleton" style={{ width: '80%', height: '14px', marginBottom: '1.25rem' }} />
        {/* Key points */}
        <div className="skeleton" style={{ width: '90px', height: '11px', marginBottom: '0.6rem' }} />
        <div className="skeleton" style={{ width: '100%', height: '12px', marginBottom: '0.4rem' }} />
        <div className="skeleton" style={{ width: '88%', height: '12px', marginBottom: '1.25rem' }} />
        {/* Themes */}
        <div className="skeleton" style={{ width: '60px', height: '11px', marginBottom: '0.5rem' }} />
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <div className="skeleton" style={{ width: '56px', height: '22px', borderRadius: '4px' }} />
          <div className="skeleton" style={{ width: '72px', height: '22px', borderRadius: '4px' }} />
          <div className="skeleton" style={{ width: '48px', height: '22px', borderRadius: '4px' }} />
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="card">
        <div className="empty-state">
          <h3>No Summary Available</h3>
          <p>Select a stock to view the AI-generated news summary.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card animate-fade-up">
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
        <div className="flex-gap-2">
          <span className="section-eyebrow" style={{ marginBottom: 0 }}>AI Summary</span>
          <span className="section-eyebrow" style={{ marginBottom: 0, color: 'var(--steel)' }}>· Gemini</span>
        </div>
        <SentimentBadge sentiment={summary.overall_sentiment} />
      </div>

      <div className="divider" />

      {/* Thai summary */}
      {summary.thai_summary && (
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.65,
          marginBottom: '1.25rem',
          marginTop: '0.75rem',
        }}>
          {summary.thai_summary}
        </p>
      )}

      {/* Key points */}
      {summary.bullet_points?.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <p className="section-eyebrow">Key Points</p>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {summary.bullet_points.map((pt, i) => (
              <li key={i} style={{
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                display: 'flex',
                gap: '0.5rem',
              }}>
                <span className="text-steel" style={{ flexShrink: 0 }}>&#8226;</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Themes */}
      {summary.key_themes?.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <p className="section-eyebrow">Themes</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {summary.key_themes.map((theme, i) => (
              <span key={i} className="tag">{theme}</span>
            ))}
          </div>
        </div>
      )}

      {/* Long-term outlook */}
      {summary.long_term_impact && (
        <div>
          <p className="section-eyebrow">Long-Term Outlook</p>
          <p style={{
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
          }}>
            {summary.long_term_impact}
          </p>
        </div>
      )}
    </div>
  );
}
