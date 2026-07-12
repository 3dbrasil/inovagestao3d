import { useEffect } from 'react';
import { getApiUrl } from '../utils/api';
import { safeStorage } from '../utils/storage';
import { dedupeQuotationGroups } from '../utils/offerDedupe';

const getCurrentQuotationsPeriod = (): string => {
  const now = new Date();
  // Uma cotação por dia — economiza créditos SerpApi.
  // Se o usuário quiser forçar nova cotação, usa o botão manual.
  const dateStr = now.toISOString().split('T')[0];
  return dateStr;
};

const buildQuotationsUrl = (key: string, key2: string, query?: string): string => {
  const params: string[] = [];
  if (key) params.push(`api_key=${encodeURIComponent(key.trim())}`);
  if (key2) params.push(`api_key_2=${encodeURIComponent(key2.trim())}`);
  if (query) params.push(`q=${encodeURIComponent(query)}`);
  const qs = params.length ? `?${params.join('&')}` : '';
  return getApiUrl(`/api/quotations${qs}`);
};

const fetchQuotations = async (url: string, key: string, key2: string, signal?: AbortSignal): Promise<any> => {
  const headers: Record<string, string> = {};
  if (key) headers['X-Custom-Serpapi-Key'] = key.trim();
  if (key2) headers['X-Custom-Serpapi-Key-2'] = key2.trim();
  const res = await fetch(url, { headers, signal });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} (${res.statusText})`);
  }
  return res.json();
};

const fetchWithRetries = async (key: string, key2: string, signal: AbortSignal, attempts = 2): Promise<any[] | null> => {
  for (let i = 0; i < attempts; i++) {
    if (signal.aborted) return null;
    try {
      const data = await fetchQuotations(buildQuotationsUrl(key, key2), key, key2, signal);
      if (Array.isArray(data) && data.length > 0) return data;
    } catch (err) {
      if ((err as any)?.name === 'AbortError') return null;
      console.warn(`[Auto-Quotes] Attempt ${i + 1} failed:`, err);
    }
    if (i < attempts - 1) {
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  return null;
};

// Cota economizada: usamos apenas a busca inicial (1 chamada por material por
// período). Limitado a 3 execuções por dia via getCurrentQuotationsPeriod.

const persistQuotations = (data: any[], period: string): void => {
  const cleanData = dedupeQuotationGroups(data);
  safeStorage.setItem('bambuzau_cached_quotes', JSON.stringify(cleanData));
  safeStorage.setItem('bambuzau_last_quotes_period', period);
  const now = new Date();
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const fullTimeStr = `${now.toLocaleDateString('pt-BR')} às ${timeStr}`;
  safeStorage.setItem('bambuzau_last_quotes_update', fullTimeStr);
  window.dispatchEvent(new CustomEvent('bambuzau_quotes_updated', { detail: cleanData }));
};

const runAutoQuoteFetch = async (signal: AbortSignal): Promise<void> => {
  const currentPeriod = getCurrentQuotationsPeriod();
  const lastPeriod = safeStorage.getItem('bambuzau_last_quotes_period', '');
  if (currentPeriod === lastPeriod) return;

  const key = safeStorage.getItem('bambuzau_custom_serp_key', '');
  const key2 = safeStorage.getItem('bambuzau_custom_serp_key_2', '');
  const data = await fetchWithRetries(key, key2, signal);
  if (!data || signal.aborted) {
    console.warn('[Auto-Quotes] No valid data fetched.');
    return;
  }

  if (signal.aborted) return;
  persistQuotations(data, currentPeriod);
};

export const useAutoQuotations = (): void => {
  useEffect(() => {
    const controller = new AbortController();
    const initialTimer = setTimeout(() => {
      runAutoQuoteFetch(controller.signal);
    }, 4500);
    const periodicTimer = setInterval(() => {
      runAutoQuoteFetch(controller.signal);
    }, 15 * 60 * 1000);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(periodicTimer);
      controller.abort();
    };
  }, []);
};