interface Props { sentiment: 'bullish' | 'neutral' | 'bearish'; }

export default function SentimentBadge({ sentiment }: Props) {
  const map = {
    bullish: { label: 'Bullish', cls: 'badge-bullish' },
    neutral: { label: 'Neutral', cls: 'badge-neutral' },
    bearish: { label: 'Bearish', cls: 'badge-bearish' },
  };
  const { label, cls } = map[sentiment] ?? map.neutral;
  return <span className={`badge ${cls}`}>{label}</span>;
}
