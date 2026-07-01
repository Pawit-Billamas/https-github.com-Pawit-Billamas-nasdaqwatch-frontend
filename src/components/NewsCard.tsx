import type { NewsItem } from '../types';
import SentimentBadge from './SentimentBadge';

interface Props {
  news: NewsItem;
}

function relativeTime(dateStr: string): string {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return '';
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'เพิ่งเกิดขึ้น';
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
  if (diffHr < 24) return `${diffHr} ชั่วโมงที่แล้ว`;
  return `${diffDay} วันที่แล้ว`;
}

export default function NewsCard({ news }: Props) {
  const timeAgo = relativeTime(news.published_at);

  return (
    <article className="news-card animate-fade-up">
      {/* Header row */}
      <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
        <div className="flex-gap-2">
          <span
            className="font-mono"
            style={{
              fontSize: '0.68rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              fontWeight: 500,
            }}
          >
            {news.source}
          </span>
          {timeAgo && (
            <span className="text-muted font-mono" style={{ fontSize: '0.68rem' }}>
              · {timeAgo}
            </span>
          )}
        </div>
        {news.sentiment && <SentimentBadge sentiment={news.sentiment} />}
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: '1rem',
          fontWeight: 700,
          color: 'var(--ink)',
          lineHeight: 1.4,
          marginBottom: '0.5rem',
          letterSpacing: '-0.01em',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {news.title}
      </h3>

      {/* Description */}
      {news.description && (
        <p
          style={{
            fontSize: '0.875rem',
            color: 'var(--ink-tertiary)',
            lineHeight: 1.6,
            marginBottom: '0.9rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {news.description}
        </p>
      )}

      {/* Read link */}
      <a
        href={news.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontSize: '0.78rem',
          color: 'var(--accent)',
          fontWeight: 600,
          letterSpacing: '0.01em',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
        }}
        onClick={e => e.stopPropagation()}
      >
        อ่านต่อ →
      </a>
    </article>
  );
}
