import axios from 'axios';
import type {
  Stock, NewsItem, NewsSummary, WatchlistItem, WeeklyReport, FundamentalsData,
  PortfolioHolding, PortfolioSummary, CompareData, CalendarWeek,
  AlertRule, AlertEvent, AlertKind,
} from '../types';

const BACKEND_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: BACKEND_URL ? `${BACKEND_URL}/api` : '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach HTTP status to errors so callers can check e.status
class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'An unknown error occurred';
    const status = error.response?.status;
    return Promise.reject(new ApiError(message, status));
  }
);

// --- Stocks ---
export const searchStocks = async (query: string): Promise<Stock[]> => {
  const { data } = await api.get<{ results: Stock[]; count: number; query: string }>(
    '/stocks/search',
    { params: { q: query } }
  );
  // Backend wraps results in { query, results: [...], count }
  return Array.isArray(data) ? data : (data.results ?? []);
};

export const getStockInfo = async (ticker: string): Promise<Stock> => {
  const { data } = await api.get<Stock>(`/stocks/${ticker}`);
  return data;
};

export const getStockFundamentals = async (ticker: string): Promise<FundamentalsData> => {
  const { data } = await api.get<FundamentalsData>(`/stocks/${ticker}/fundamentals`);
  return data;
};

// --- Watchlist ---
export const getWatchlist = async (): Promise<WatchlistItem[]> => {
  const { data } = await api.get<WatchlistItem[] | { items: WatchlistItem[] }>('/watchlist');
  // Backend returns a flat list directly
  return Array.isArray(data) ? data : ((data as { items?: WatchlistItem[] }).items ?? []);
};

export const addToWatchlist = async (ticker: string): Promise<void> => {
  await api.post('/watchlist', { ticker });
};

export const removeFromWatchlist = async (ticker: string): Promise<void> => {
  await api.delete(`/watchlist/${ticker}`);
};

// --- News ---
export const getStockNews = async (ticker: string): Promise<NewsItem[]> => {
  const { data } = await api.get<{ articles: NewsItem[] } | NewsItem[]>(`/news/${ticker}`);
  // Backend wraps: { ticker, source, count, articles: [...] }
  if (Array.isArray(data)) return data;
  return (data as { articles?: NewsItem[] }).articles ?? [];
};

export const getStockSummary = async (ticker: string): Promise<NewsSummary> => {
  const { data } = await api.get<{ summary: NewsSummary } | NewsSummary>(`/news/${ticker}/summary`);
  // Backend wraps: { ticker, source, summary: {...} }
  if ((data as { summary?: NewsSummary }).summary) {
    return (data as { summary: NewsSummary }).summary;
  }
  return data as NewsSummary;
};

export interface MarketNewsResponse {
  articles: NewsItem[];
  market_sentiment?: 'bullish' | 'neutral' | 'bearish';
  count?: number;
  source?: string;
}

export const getMarketNews = async (): Promise<NewsItem[]> => {
  const { data } = await api.get<MarketNewsResponse | NewsItem[]>('/news/market');
  if (Array.isArray(data)) return data;
  return (data as MarketNewsResponse).articles ?? [];
};

// --- Weekly Report ---
export const getWeeklyReport = async (): Promise<WeeklyReport> => {
  const { data } = await api.get<{
    week_start: string;
    week_end: string;
    created_at: string;
    report: { top_picks: string[]; watch_list_summary: string; market_outlook: string };
  }>('/reports/weekly');
  // Backend wraps report data inside a 'report' key — flatten it
  return {
    week_start:         data.week_start,
    week_end:           data.week_end,
    created_at:         data.created_at,
    top_picks:          data.report?.top_picks ?? [],
    watch_list_summary: data.report?.watch_list_summary ?? '',
    market_outlook:     data.report?.market_outlook ?? '',
  };
};

export const generateWeeklyReport = async (): Promise<WeeklyReport> => {
  const { data } = await api.post<{
    week_start: string;
    week_end: string;
    report: { top_picks: string[]; watch_list_summary: string; market_outlook: string };
  }>('/reports/weekly/generate');
  return {
    week_start:         data.week_start,
    week_end:           data.week_end,
    created_at:         new Date().toISOString(),
    top_picks:          data.report?.top_picks ?? [],
    watch_list_summary: data.report?.watch_list_summary ?? '',
    market_outlook:     data.report?.market_outlook ?? '',
  };
};

// --- Portfolio ---
export const getPortfolio = async (): Promise<PortfolioSummary> => {
  const { data } = await api.get<PortfolioSummary>('/portfolio');
  return data;
};

export const addPortfolioHolding = async (payload: { ticker: string; shares: number; avg_cost: number }): Promise<void> => {
  await api.post('/portfolio', payload);
};

export const updatePortfolioHolding = async (id: number, payload: { ticker: string; shares: number; avg_cost: number }): Promise<void> => {
  await api.put(`/portfolio/${id}`, payload);
};

export const deletePortfolioHolding = async (id: number): Promise<void> => {
  await api.delete(`/portfolio/${id}`);
};

// --- Compare ---
export const getCompare = async (tickers: string[]): Promise<CompareData> => {
  const { data } = await api.get<CompareData>('/compare', { params: { tickers: tickers.join(',') } });
  return data;
};

// --- Calendar ---
export const getCalendar = async (params?: { weeks?: number }): Promise<CalendarWeek[]> => {
  const { data } = await api.get<CalendarWeek[]>('/calendar', { params });
  return Array.isArray(data) ? data : [];
};

// --- Alerts ---
export const getAlertRules = async (): Promise<AlertRule[]> => {
  const { data } = await api.get<AlertRule[]>('/alerts/rules');
  return data;
};

export const createAlertRule = async (payload: { ticker: string; kind: AlertKind; target?: number | null; enabled?: boolean }): Promise<AlertRule> => {
  const { data } = await api.post<AlertRule>('/alerts/rules', payload);
  return data;
};

export const toggleAlertRule = async (id: number, enabled: boolean): Promise<void> => {
  await api.patch(`/alerts/rules/${id}`, { enabled });
};

export const deleteAlertRule = async (id: number): Promise<void> => {
  await api.delete(`/alerts/rules/${id}`);
};

export const getAlertEvents = async (limit = 20): Promise<AlertEvent[]> => {
  const { data } = await api.get<AlertEvent[]>('/alerts/events', { params: { limit } });
  return data;
};

export const markAlertRead = async (id: number): Promise<void> => {
  await api.patch(`/alerts/events/${id}/read`);
};

export default api;
