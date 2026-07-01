export interface Stock {
  ticker: string;
  name: string;
  price: number;
  change: number;
  change_pct: number;
  market_cap: number;
  sector: string;
  pe_ratio: number | null;
  week_52_high: number;
  week_52_low: number;
  volume: number;
}

export interface NewsItem {
  id?: string;
  title: string;
  description: string;
  url: string;
  source: string;
  published_at: string;
  image_url?: string;
  sentiment?: 'bullish' | 'neutral' | 'bearish';
  tickers?: string[];
}

export interface NewsSummary {
  bullet_points: string[];
  overall_sentiment: 'bullish' | 'neutral' | 'bearish';
  key_themes: string[];
  long_term_impact: string;
  thai_summary: string;
}

export interface WatchlistItem extends Stock {
  added_at: string;
}

export interface WeeklyReport {
  week_start: string;
  week_end: string;
  top_picks: string[];
  watch_list_summary: string;
  market_outlook: string;
  created_at: string;
}

export interface MarketNewsResponse {
  articles: NewsItem[];
  market_sentiment?: 'bullish' | 'neutral' | 'bearish';
  count?: number;
  source?: string;
}

export interface FundamentalsMetric {
  value: number | null;
  rating: 'good' | 'neutral' | 'bad';
  label: string;
  note: string;
  format: 'x' | '%' | '$' | '$large' | 'raw';
}

export interface FundamentalsData {
  ticker: string;
  name: string;
  sector: string | null;
  industry: string | null;
  next_earnings: string | null;
  total_revenue: number | null;
  employee_count: number | null;
  metrics: Record<string, FundamentalsMetric>;
  verdict: {
    verdict: 'strong' | 'fair' | 'mixed' | 'weak';
    score: number;
    good_count: number;
    bad_count: number;
    neutral_count: number;
    summary: string;
  };
}

/* ── Portfolio ── */
export interface PortfolioHolding {
  id?: number;
  ticker: string;
  shares: number;
  avg_cost: number;
  added_at?: string;
}

export interface PortfolioHoldingEnriched extends PortfolioHolding {
  name: string;
  price: number;
  change_pct: number;
  value: number;
  gain: number;
  gain_pct: number;
  weight_pct: number;
}

export interface PortfolioSummary {
  total_value: number;
  day_change: number;
  day_change_pct: number;
  total_gain: number;
  total_gain_pct: number;
  holdings: PortfolioHoldingEnriched[];
}

/* ── Compare ── */
export interface CompareColumn {
  ticker: string;
  name: string;
  price: number;
  change_pct: number;
  sector: string;
}

export interface CompareRow {
  metric: string;
  key: string;
  values: (string | number | null)[];
}

export interface CompareData {
  tickers: string[];
  columns: CompareColumn[];
  rows: CompareRow[];
}

/* ── Calendar ── */
export interface CalendarEvent {
  ticker: string;
  kind: 'earnings' | 'dividend' | 'economic';
  detail: string;
  time?: string;
}

export interface CalendarDay {
  date: string;
  events: CalendarEvent[];
}

export interface CalendarWeek {
  week_start: string;
  week_end: string;
  days: CalendarDay[];
}

/* ── Alerts ── */
export type AlertKind = 'price_above' | 'price_below' | 'pct_move' | 'news' | 'ai_digest';

export interface AlertRule {
  id: number;
  ticker: string;
  kind: AlertKind;
  target: number | null;
  enabled: boolean;
  created_at: string;
}

export interface AlertEvent {
  id: number;
  rule_id: number;
  ticker: string;
  message: string;
  triggered_at: string;
  is_read: boolean;
}
