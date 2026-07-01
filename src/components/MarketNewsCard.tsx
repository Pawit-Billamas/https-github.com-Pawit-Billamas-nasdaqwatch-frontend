import type { NewsItem } from '../types';
import SentimentBadge from './SentimentBadge';

interface Props {
  news: NewsItem;
}

/**
 * Condenses a news description to one concise sentence.
 * Shows first sentence if short enough, otherwise first 120 chars.
 */
function simplify(description: string | undefined): string {
  if (!description) return '';
  const trimmed = description.trim();
  // Get first sentence
  const sentenceEnd = trimmed.search(/[.!?]/);
  if (sentenceEnd > 20 && sentenceEnd < 160) {
    return trimmed.slice(0, sentenceEnd + 1);
  }
  // Fallback: truncate to 130 chars at a word boundary
  if (trimmed.length <= 130) return trimmed;
  const cut = trimmed.slice(0, 130).trimEnd();
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 60 ? cut.slice(0, lastSpace) : cut) + '…';
}

function relativeTime(dateStr: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  if (isNaN(diff)) return '';
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 1) return 'เพิ่งเกิดขึ้น';
  if (min < 60) return `${min} นาทีที่แล้ว`;
  if (hr < 24) return `${hr} ชม.ที่แล้ว`;
  return `${day} วันที่แล้ว`;
}

const sentimentAccent: Record<string, string> = {
  bullish: 'var(--up)',
  bearish: 'var(--down)',
  neutral: 'var(--ink-muted)',
};

export default function MarketNewsCard({ news }: Props) {
  const timeAgo = relativeTime(news.published_at);
  const summary = simplify(news.description);
  const accent = sentimentAccent[news.sentiment ?? 'neutral'];

  return (
    <article
      style={{
        background: 'var(--white)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${accent}`,
        borderRadius: 'var(--radius-lg)',
        padding: '1rem 1.1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.45rem',
        boxShadow: '0 1px 2px rgba(15,17,23,0.04)',
        transition: 'box-shadow 200ms cubic-bezier(0.32,0.72,0,1), border-color 200ms cubic-bezier(0.32,0.72,0,1)',
      }}
      className="animate-fade-up"
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(15,17,23,0.09)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 2px rgba(15,17,23,0.04)';
      }}
    >
      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
          <span
            className="font-mono"
            style={{
              fontSize: '0.65rem',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'var(--accent)',
              flexShrink: 0,
            }}
          >
            {news.source}
          </span>
          {timeAgo && (
            <span
              className="font-mono text-muted"
              style={{ fontSize: '0.65rem', flexShrink: 0 }}
            >
              · {timeAgo}
            </span>
          )}
        </div>
        {news.sentiment && <SentimentBadge sentiment={news.sentiment} />}
      </div>

      {/* Title */}
      <p
        style={{
          fontSize: '0.9rem',
          fontWeight: 700,
          color: 'var(--ink)',
          lineHeight: 1.35,
          letterSpacing: '-0.01em',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {news.title}
      </p>

      {/* Simplified summary */}
      {summary && (
        <p
          style={{
            fontSize: '0.82rem',
            color: 'var(--ink-tertiary)',
            lineHeight: 1.5,
          }}
        >
          {summary}
        </p>
      )}

      {/* Link */}
      <a
        href={news.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontSize: '0.75rem',
          color: 'var(--accent)',
          fontWeight: 600,
          letterSpacing: '0.01em',
          marginTop: '0.1rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.2rem',
        }}
        onClick={e => e.stopPropagation()}
      >
        อ่านข่าวเต็ม →
      </a>
    </article>
  );
}
