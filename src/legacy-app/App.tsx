// @ts-nocheck
import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { getApiUrl } from './utils/api';
import { safeStorage } from './utils/storage';
import { dedupeOffers } from './utils/offerDedupe';
import { Client, Printer, PrintOrder, FilamentStock, SupplyStock, Expense, ShoppingItem, ExternalPlatformOrder, CatalogItem } from './types';
import { useAppState } from './state/useAppState';
import { useAutoQuotations } from './hooks/useAutoQuotations';
import { useAutoBackup, runBackupNow } from './hooks/useAutoBackup';
if (typeof window !== 'undefined') (window as any).backupNow = runBackupNow;
import { DashboardTab } from './components/DashboardTab';
import { ProductionTab } from './components/ProductionTab';
import { ClientsTab } from './components/ClientsTab';
import { IntegrationTab } from './components/IntegrationTab';
import { CostsTab } from './components/CostsTab';
import { SettingsTab } from './components/SettingsTab';
import { SoldTab } from './components/SoldTab';
import { OkLojaAssistant } from './components/OkLojaAssistant';
import { ShowcaseView } from './components/ShowcaseView';
import { PrintFlowTab } from './components/PrintFlowTab';
import { PrinterQueueList } from './components/PrinterQueueList';
import { ManutencaoTab } from './components/ManutencaoTab';
import { OrcamentosTab } from './components/OrcamentosTab';
import { WhatsAppTab } from './components/WhatsAppTab';
import {
  PriceResearchTab, PreCheckTab, AgendaTab, ToolsTab, ModelsTab
} from './components/NewTabs';
import Market3DApp from '@/market3d/App';
// Heavy tabs are code-split: only the chunk for the active tab is fetched.
// Saves ~hundreds of KB on initial load (Market3D + 7 imported pages).
// Recover from stale chunk references after a redeploy: when the browser
// holds an old HTML referencing chunks that no longer exist on the server,
// the dynamic import 404s. We reload once to pick up the fresh chunks.
const lazyWithReload = <T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) =>
  lazy(() =>
    factory().catch((err) => {
      if (typeof window !== 'undefined') {
        const flag = 'lov_chunk_reloaded';
        if (!sessionStorage.getItem(flag)) {
          sessionStorage.setItem(flag, '1');
          window.location.reload();
          // Return a never-resolving promise while the reload happens
          return new Promise<{ default: T }>(() => {});
        }
      }
      throw err;
    })
  );

const CatalogoTab     = lazyWithReload(() => import('./imported/CatalogoTab'));
const MarketingTab    = lazyWithReload(() => import('./imported/MarketingTab'));
const KanbanTab       = lazyWithReload(() => import('./imported/KanbanTab'));
const MarketTab       = lazyWithReload(() => import('./imported/MarketTab'));
const AgendaTabNew    = lazyWithReload(() => import('./imported/AgendaTab'));
const SitesTab        = lazyWithReload(() => import('./imported/SitesTab'));
const PreCheckTabNew  = lazyWithReload(() => import('./imported/PreCheckTab'));
const ContabilidadeTab = lazyWithReload(() => import('./components/ContabilidadeTab'));

const TabFallback = () => (
  <div className="flex items-center justify-center py-20 text-[var(--brand-text-muted)] text-sm gap-2">
    <div className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
    Carregando módulo...
  </div>
);
import { 
  Wrench, 
  RefreshCw, 
  Home, 
  Activity, 
  Users, 
  GitPullRequest, 
  DollarSign, 
  Layers, 
  CheckSquare, 
  Plus, 
  Sparkles, 
  Clock,
  Settings,
  Smartphone,
  ShoppingBag,
  AlertTriangle,
  Wifi,
  WifiOff,
  Menu,
  X,
  Search,
  Box,
  Megaphone,
  Columns3,
  FileBox,
  ClipboardCheck,
  Calendar,
  Globe,
  Calculator,
  BookOpen,
  TrendingUp,
  Radar,
  Download,
  Printer as PrinterNavIcon,
  FileBarChart2,
  FileEdit,
  MessageCircle
} from 'lucide-react';

// STUNNING 3D CUBE & PRINTER EXTENSION GEOMETRIC LOGO
export function Atelier3DLogo({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 512 512" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="gFrameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00d2ff" />
          <stop offset="50%" stopColor="#0066ff" />
          <stop offset="100%" stopColor="#0033aa" />
        </linearGradient>

        <filter id="glowEffect" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* The stylized "G" 3D printer frame */}
      <path d="M 160 300 
               L 160 170 
               C 160 100, 240 80, 290 80 
               C 330 80, 360 100, 360 120 
               L 320 145 
               C 300 135, 270 130, 250 130 
               C 210 130, 210 170, 210 170 
               L 210 300 
               C 210 320, 230 340, 250 340 
               L 320 340 
               L 320 250 
               L 270 250 
               L 270 210 
               L 360 210 
               L 360 350 
               C 360 380, 320 380, 290 380 
               C 250 380, 160 380, 160 300 Z" 
            fill="url(#gFrameGrad)" 
            stroke="#475569" 
            strokeWidth="2" />

      {/* 3D Printer Nozzle / Gantry head */}
      <rect x="238" y="165" width="36" height="24" rx="4" fill="#64748b" />
      <rect x="246" y="189" width="20" height="10" fill="#334155" />
      <path d="M 251 199 L 261 199 L 256 208 Z" fill="#e2e8f0" />
      <line x1="248" y1="192" x2="264" y2="192" stroke="#4db8ff" strokeWidth="2.5" filter="url(#glowEffect)" />

      {/* Active printed 3D letters block under nozzle */}
      {/* "3" Letter Solid geometry */}
      <path d="M 215 265 
               C 235 265, 240 250, 240 240 
               C 240 230, 230 225, 220 225 
               L 215 225 L 215 210 
               L 225 210 
               C 235 210, 243 200, 243 190 
               C 243 180, 235 175, 215 175 
               L 190 175 L 190 195 
               L 210 195 
               C 218 195, 218 200, 215 200 
               L 195 200 L 195 220 
               L 215 220 
               C 218 220, 218 225, 212 225 
               L 190 225 L 190 245 
               L 210 245 L 215 265 Z" 
            fill="#00e5ff" 
            filter="url(#glowEffect)" />

      {/* "D" Letter Solid geometry */}
      <path d="M 270 175 
               L 270 245 
               L 295 245 
               C 315 245, 325 230, 325 210 
               C 325 190, 315 175, 295 175 
               H 270 Z 
               M 290 195 
               C 298 195, 298 225, 290 225 
               H 282 L 282 195 
               H 290 Z" 
            fill="#0099ff" 
            filter="url(#glowEffect)" />

      {/* Laser Print Level Indicator line under the nozzle */}
      <line x1="180" y1="205" x2="332" y2="205" stroke="#00ffff" strokeDasharray="4 2" strokeWidth="1.5" opacity="0.8" filter="url(#glowEffect)" />

      {/* Metal printing build plate matching the 3D layout */}
      <polygon points="120,380 392,380 352,420 160,420" fill="#334155" stroke="#475569" strokeWidth="3" />
      <polygon points="124,382 388,382 350,418 162,418" fill="#1e293b" />

      {/* Glowing filament spool silhouette on the side back */}
      <circle cx="150" cy="140" r="35" stroke="#00d2ff" strokeWidth="8" opacity="0.25" filter="url(#glowEffect)" />
      <circle cx="150" cy="140" r="15" stroke="#475569" strokeWidth="3" opacity="0.3" />
    </svg>
  );
}

export function ConnectivityIndicator({ onConfigure }: { onConfigure: () => void }) {
  const [status, setStatus] = useState<'checking' | 'authenticated' | 'auth_error' | 'timeout' | 'invalid'>('checking');
  const [reason, setReason] = useState<string | null>(null);

  const checkConnection = async () => {
    setStatus('checking');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 seconds timeout
    
    try {
      const customSerpKey = safeStorage.getItem('bambuzau_custom_serp_key', '');
      const response = await fetch(getApiUrl(`/api/serpapi/status`), {
        headers: {
          'X-Custom-Serpapi-Key': customSerpKey || ''
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (response.status === 401 || response.status === 403) {
        setStatus('auth_error');
        setReason('Chave não autorizada ou recusada (401/403)');
      } else if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setStatus('authenticated');
          setReason(null);
        } else {
          setStatus('auth_error');
          setReason(data.reason || 'Chave inválida ou expirada');
        }
      } else {
        setStatus('invalid');
        setReason(`HTTP ${response.status}`);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError' || (err.message && err.message.toLowerCase().includes('timeout'))) {
        setStatus('timeout');
        setReason('Tempo limite atingido (Timeout) - Verifique sua conexão');
      } else if (err.message && (err.message.toLowerCase().includes('failed to fetch') || err.message.toLowerCase().includes('network error') || err.message.toLowerCase().includes('networkerror'))) {
        setStatus('timeout');
        setReason('Erro de Rede - Conexão local offline ou servidor indisponível');
      } else {
        setStatus('invalid');
        setReason(err.message || 'Erro de conexão');
      }
    }
  };

  useEffect(() => {
    checkConnection();

    // Re-check whenever keys are updated or storage changes
    const handleKeysUpdated = () => {
      checkConnection();
    };

    window.addEventListener('bambuzau_keys_updated', handleKeysUpdated);
    window.addEventListener('storage', handleKeysUpdated);

    // Dynamic polling check every 90 seconds
    const interval = setInterval(checkConnection, 90000);

    return () => {
      window.removeEventListener('bambuzau_keys_updated', handleKeysUpdated);
      window.removeEventListener('storage', handleKeysUpdated);
      clearInterval(interval);
    };
  }, []);

  return (
    <div 
      onClick={onConfigure}
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md cursor-pointer transition text-[9px] font-sans active:scale-95 select-none ${
        status === 'authenticated'
          ? 'bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/15 hover:border-emerald-400/35 text-emerald-200'
          : status === 'checking'
            ? 'bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 hover:border-amber-400/30 text-amber-200'
            : status === 'auth_error'
              ? 'bg-orange-500/10 border border-orange-500/25 hover:bg-orange-500/15 hover:border-orange-400/30 text-orange-200'
              : status === 'timeout'
                ? 'bg-sky-500/10 border border-sky-500/25 hover:bg-sky-500/15 hover:border-sky-400/30 text-sky-200'
                : 'bg-red-500/10 border border-red-500/25 hover:bg-red-500/15 hover:border-red-400/30 text-red-200'
      }`}
      title={
        status === 'authenticated'
          ? 'SerpApi: Conectado e Autenticado! Clique para ir às configurações.'
          : status === 'checking'
            ? 'SerpApi: Verificando credenciais e conectividade...'
            : status === 'auth_error'
              ? `SerpApi: Erro de Chave / Não Autorizado (${reason || 'Chave inválida'}). Clique para ir às configurações.`
              : status === 'timeout'
                ? `SerpApi: Instabilidade de Conexão ou Limite Esgotado (${reason || 'Sem resposta'}).`
                : `SerpApi: Erro de Verificação (${reason || 'Acesso falhou'}).`
      }
    >
      <span className="relative flex h-1.5 w-1.5">
        {status === 'checking' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        )}
        {status === 'authenticated' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        )}
        {status === 'auth_error' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
        )}
        {status === 'timeout' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
        )}
        {status === 'invalid' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
          status === 'authenticated' 
            ? 'bg-emerald-400' 
            : status === 'checking' 
              ? 'bg-amber-400' 
              : status === 'auth_error'
                ? 'bg-orange-400'
                : status === 'timeout'
                  ? 'bg-sky-400'
                  : 'bg-red-400'
        }`}></span>
      </span>
      {status === 'authenticated' ? (
        <Wifi className="h-3 w-3 text-emerald-400 shrink-0" />
      ) : status === 'timeout' ? (
        <WifiOff className="h-3 w-3 text-sky-400 shrink-0 animate-pulse" />
      ) : status === 'auth_error' ? (
        <WifiOff className="h-3 w-3 text-orange-400 shrink-0 animate-pulse" />
      ) : (
        <WifiOff className="h-3 w-3 text-red-400 shrink-0 animate-pulse" />
      )}
      <span className="font-extrabold text-zinc-400 uppercase text-[7.5px]">SerpApi:</span>
      <span className="font-black">
        {status === 'authenticated' 
          ? 'ONLINE' 
          : status === 'checking' 
            ? 'VERIFICANDO...' 
            : status === 'auth_error' 
              ? 'ERRO DE CHAVE 🔑' 
              : status === 'timeout' 
                ? 'REDE TIMEOUT ☁️' 
                : 'ERRO ❌'}
      </span>
    </div>
  );
}

export function safeGetLocalStorageItem(key: string, defaultValue: string = ''): string {
  try {
    return localStorage.getItem(key) || defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

export default function App() {
  const [currentTab, setCurrentTab] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [printersSubTab, setPrintersSubTab] = useState<'GERAL' | 'MANUT'>('GERAL');
  const [costsSubTab, setCostsSubTab] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('bambuzau_costs_subtab_override');
      return ['CALC', 'CATALOG', 'STOCK', 'SHOP', 'QUOTE', 'AI'].includes(saved || '') ? saved! : 'STOCK';
    } catch {
      return 'STOCK';
    }
  });
  useEffect(() => {
    const h = (e: any) => { if (typeof e?.detail === 'string') setCostsSubTab(e.detail); };
    window.addEventListener('costs_subtab_changed', h as EventListener);
    return () => window.removeEventListener('costs_subtab_changed', h as EventListener);
  }, []);
  const [showAddPrinterFormTab16, setShowAddPrinterFormTab16] = useState(false);

  // Open the Costs tab (id=4) jumping to a specific internal sub-tab.
  // CostsTab listens for the 'costs_set_subtab' event and also reads the
  // localStorage override on mount.
  const openCostsSubtab = (sub: 'CALC' | 'CATALOG' | 'STOCK' | 'SHOP' | 'QUOTE' | 'AI') => {
    try { localStorage.setItem('bambuzau_costs_subtab_override', sub); } catch {}
    setCurrentTab(4);
    setCostsSubTab(sub);
    setSidebarOpen(false);
    try {
      window.dispatchEvent(new CustomEvent('costs_set_subtab', { detail: sub }));
    } catch {}
  };

  const openNewProductForm = () => {
    try {
      (window as any).__pendingOpenNewOrder = false;
      (window as any).__pendingOpenNewProduct = true;
      localStorage.setItem('bambuzau_costs_subtab_override', 'STOCK');
      localStorage.setItem('bambuzau_open_product_form_pending', '1');
    } catch {}
    setCurrentTab(4);
    setCostsSubTab('STOCK');
    setSidebarOpen(false);
    window.setTimeout(() => {
      try {
        window.dispatchEvent(new CustomEvent('costs_set_subtab', { detail: 'STOCK' }));
        window.dispatchEvent(new CustomEvent('open-new-product'));
      } catch {}
    }, 80);
  };

  // Global event listeners for dashboard action buttons (formerly in page header).
  useEffect(() => {
    const onNewOrder = () => {
      (window as any).__pendingOpenNewOrder = true;
      setCurrentTab(1);
      window.setTimeout(() => {
        try { window.dispatchEvent(new CustomEvent('open-new-order')); } catch {}
      }, 250);
    };
    const onNewProduct = () => openNewProductForm();
    window.addEventListener('request-new-order', onNewOrder);
    window.addEventListener('request-new-product', onNewProduct);
    const onNavigateTab = (e: any) => {
      const tab = Number(e?.detail);
      if (!Number.isNaN(tab)) {
        setCurrentTab(tab);
        setSidebarOpen(false);
      }
    };
    const onNavigateCostsSub = (e: any) => {
      const sub = typeof e?.detail === 'string' ? e.detail : null;
      if (!sub) return;
      setCurrentTab(4);
      setCostsSubTab(sub);
      setSidebarOpen(false);
      try { window.dispatchEvent(new CustomEvent('costs_set_subtab', { detail: sub })); } catch {}
    };
    window.addEventListener('navigate-tab', onNavigateTab);
    window.addEventListener('navigate-costs-subtab', onNavigateCostsSub);
    return () => {
      window.removeEventListener('request-new-order', onNewOrder);
      window.removeEventListener('request-new-product', onNewProduct);
      window.removeEventListener('navigate-tab', onNavigateTab);
      window.removeEventListener('navigate-costs-subtab', onNavigateCostsSub);
    };
  }, []);
  const [dismissedStockAlert, setDismissedStockAlert] = useState(false);

  // Cloud database sync states (v3.3.0.4)
  const [isSyncingGlobal, setIsSyncingGlobal] = useState(false);
  const [isSyncingBackground, setIsSyncingBackground] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'newer' | 'older' | 'checking' | 'error' | 'none'>('none');
  const [lastSyncTime, setLastSyncTime] = useState(() => safeGetLocalStorageItem('bambuzau_last_sync_time') || '');
  const [isAutoSync, setIsAutoSync] = useState(() => safeGetLocalStorageItem('bambuzau_auto_sync') === 'true');

  // Check if we are in public showcase view
  const [isShowcase, setIsShowcase] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('showcase') === 'true' || params.get('view') === 'showcase';
    } catch (e) {
      return false;
    }
  });

  const [showcaseWorkspace] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('w') || localStorage.getItem('bambuzau_workspace_code') || 'principal';
    } catch (e) {
      return 'principal';
    }
  });

  const [showcaseFirebase] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const encodedF = params.get('f');
      if (encodedF) {
        try {
          return atob(encodedF);
        } catch (e) {
          console.warn("Could not decode custom firebase URL from base64", e);
        }
      }
      return localStorage.getItem('bambuzau_firebase_url') || 'https://bambuzau1-60868-default-rtdb.firebaseio.com/';
    } catch (e) {
      return 'https://bambuzau1-60868-default-rtdb.firebaseio.com/';
    }
  });

  // States with localStorage persistence safely wrapped in try-catch blocks
  const [brandConfig, setBrandConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('bambuzau_brand_config');
      let parsed = saved ? JSON.parse(saved) : null;
      if (!parsed || !parsed.name || !parsed.theme || !parsed.icon || parsed.name === 'Bambuzau 3D' || parsed.name === 'Ateliê 3D Hub' || parsed.theme === 'dark-organic' || parsed.theme === 'dark-slate') {
        parsed = {
          name: 'Gestao 3d',
          theme: 'lava-orange',
          icon: 'spool'
        };
        localStorage.setItem('bambuzau_brand_config', JSON.stringify(parsed));
      }
      return parsed;
    } catch (e) {
      console.warn("Failed to parse brandConfig state, returning default value", e);
      return {
        name: 'Gestao 3d',
        theme: 'lava-orange',
        icon: 'spool'
      };
    }
  });

  const [globalToast, setGlobalToast] = useState<string | null>(null);

  const [showSetupModal, setShowSetupModal] = useState(() => {
    try {
      return !localStorage.getItem('atelier_setup_completed');
    } catch (e) {
      return true;
    }
  });

  const {
    clients, setClients,
    printers, setPrinters,
    orders, setOrders,
    filamentStocks, setFilamentStocks,
    expenses, setExpenses,
    shoppingItems, setShoppingItems,
    importedExternalIds, setImportedExternalIds,
    suppliesStocks, setSuppliesStocks,
    lastAuditDate, setLastAuditDate,
  } = useAppState();

  // Tuya Wi-Fi Devices for Humidifier Telemetry
  const [tuyaDevices, setTuyaDevices] = useState<{
    id: string;
    name: string;
    deviceId: string;
    clientId: string;
    clientSecret: string;
    region: string;
    currentHumidity: number;
    temperature: number;
    lastUpdated: number;
  }[]>(() => {
    try {
      const saved = localStorage.getItem('bambuzau_tuya_devices');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to parse tuya devices, returning initial default", e);
    }
    return [
      { id: '1', name: 'Estufa PLA', deviceId: '', clientId: '', clientSecret: '', region: 'us', currentHumidity: 32, temperature: 24.2, lastUpdated: Date.now() },
      { id: '2', name: 'Estufa PETG', deviceId: '', clientId: '', clientSecret: '', region: 'us', currentHumidity: 28.3, temperature: 25.1, lastUpdated: Date.now() },
    ];
  });

  const restoreDefaultEstufas = () => {
    const defaults = [
      { id: '1', name: 'Estufa PLA', deviceId: '', clientId: '', clientSecret: '', region: 'us', currentHumidity: 32, temperature: 24.2, lastUpdated: Date.now() },
      { id: '2', name: 'Estufa PETG', deviceId: '', clientId: '', clientSecret: '', region: 'us', currentHumidity: 28.3, temperature: 25.1, lastUpdated: Date.now() },
    ];
    setTuyaDevices(defaults);
    localStorage.setItem('bambuzau_tuya_devices', JSON.stringify(defaults));
    setCurrentTab(5); // Switch to settings tab
    setGlobalToast("✓ Estufas padrão restauradas com sucesso!");
  };

  // Persist Tuya devices to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('bambuzau_tuya_devices', JSON.stringify(tuyaDevices));
    } catch (e) {
      console.error(e);
    }
  }, [tuyaDevices]);

  // Handle active Tuya API data fetching or simulation drifting (+/- 0.2%)
  useEffect(() => {
    let isMounted = true;
    const interval = setInterval(async () => {
      if (!isMounted) return;

      const updated = await Promise.all(tuyaDevices.map(async (dev) => {
        // If developer attributes are populated, pull from our custom secure gateway
        if (dev.clientId && dev.clientSecret && dev.deviceId) {
          try {
            const response = await fetch(getApiUrl('/api/tuya/humidity'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                clientId: dev.clientId,
                clientSecret: dev.clientSecret,
                deviceId: dev.deviceId,
                region: dev.region
              })
            });
            if (response.ok) {
              const resJson = await response.json();
              if (resJson.success && resJson.humidity !== null) {
                return {
                  ...dev,
                  currentHumidity: resJson.humidity,
                  temperature: resJson.temperature || dev.temperature,
                  lastUpdated: Date.now()
                };
              }
            }
          } catch (err) {
            console.warn(`Failed fetching real live telemetry for Tuya: ${dev.name}`, err);
          }
        }

        // Simulative drift organic fluctuation (+/- 0.3%)
        const drift = (Math.random() - 0.5) * 0.6;
        const targetHum = Math.max(10, Math.min(99, dev.currentHumidity + drift));
        return {
          ...dev,
          currentHumidity: parseFloat(targetHum.toFixed(1)),
          lastUpdated: Date.now()
        };
      }));

      if (isMounted) {
        setTuyaDevices(updated);
      }
    }, 18000); // Drifts/Polls every 18 seconds

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [tuyaDevices]);

  // Automatic Quotes Search 3x a day (Morning, Afternoon, Night)
  useAutoQuotations();

  // Backup automático do banco de dados a cada 6 horas (download no PC)
  useAutoBackup();


  // Force scroll-to-top on window whenever the main tab selection changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [currentTab]);

  // One-time automatic cleanup of old legacy/mock orders and clients so the user starts with a clean slate
  useEffect(() => {
    const cleaned = localStorage.getItem('bambuzau_wipe_legacy_orders_v6');
    if (!cleaned) {
      localStorage.setItem('bambuzau_wipe_legacy_orders_v6', 'true');
      localStorage.setItem('bambuzau_orders', '[]');
      localStorage.setItem('bambuzau_clients', '[]');
      localStorage.setItem('bambuzau_expenses', '[]');
      localStorage.setItem('bambuzau_shopping', '[]');
      localStorage.setItem('bambuzau_supplies', '[]');
      localStorage.setItem('bambuzau_printers', '[]');
      localStorage.setItem('bambuzau_filament', '[]');
      localStorage.setItem('bambuzau_local_catalog_production', '[]');
      
      setOrders([]);
      setClients([]);
      setExpenses([]);
      setShoppingItems([]);
      setSuppliesStocks([]);
      setPrinters([]);
      setFilamentStocks([]);
    }
  }, []);

  // Persistence for the slices above is handled by useAppState/usePersistedState.
  // Brand config keeps its own effect because it lives outside useAppState for now.
  useEffect(() => {
    try {
      localStorage.setItem('bambuzau_brand_config', JSON.stringify(brandConfig));
    } catch (e) {
      console.warn('Failed to persist brandConfig', e);
    }
  }, [brandConfig]);

  const [tickerQuotes, setTickerQuotes] = useState<Array<{ label: string; price: string; change: string; up: boolean | null }>>([]);

  const loadTickerQuotes = () => {
    try {
      const cached = localStorage.getItem('bambuzau_cached_quotes');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const list: Array<{ label: string; price: string; change: string; up: boolean | null }> = [];
          parsed.forEach((group: any) => {
            if (group.offers && Array.isArray(group.offers)) {
              dedupeOffers(group.offers).slice(0, 10).forEach((offer: any) => {
                const priceNum = typeof offer.price === 'number' ? offer.price : parseFloat(offer.price) || 0;
                const changePct = ((priceNum % 5) / 10).toFixed(1);
                const isUp = priceNum % 2 === 0;
                list.push({
                  label: `${group.type} (${offer.storeName})`,
                  price: `R$ ${priceNum.toFixed(2)}`,
                  change: `${isUp ? '+' : '-'}${changePct}%`,
                  up: isUp
                });
              });
            }
          });
          if (list.length > 0) {
            setTickerQuotes(list);
            return;
          }
        }
      }
    } catch (e) {
      console.warn("Erro ao carregar cotações do ticker:", e);
    }

    // Default fallback quotes matching initial cotações
    setTickerQuotes([
      { label: "PLA (Voolt3D Store)", price: "R$ 79,90", change: "+1.4%", up: true },
      { label: "PLA (Shopee Brasil)", price: "R$ 75,00", change: "-0.5%", up: false },
      { label: "PETG (Shopee Brasil)", price: "R$ 72,90", change: "+0.8%", up: true },
      { label: "PETG (Voolt3D Store)", price: "R$ 74,90", change: "0.0%", up: null },
      { label: "TPU (Shopee Brasil)", price: "R$ 104,90", change: "+2.1%", up: true },
      { label: "TPU (Voolt3D Store)", price: "R$ 109,90", change: "-1.2%", up: false }
    ]);
  };

  useEffect(() => {
    loadTickerQuotes();
    const handleQuotesUpdated = () => {
      loadTickerQuotes();
    };
    window.addEventListener('bambuzau_quotes_updated', handleQuotesUpdated);
    window.addEventListener('storage', handleQuotesUpdated);
    return () => {
      window.removeEventListener('bambuzau_quotes_updated', handleQuotesUpdated);
      window.removeEventListener('storage', handleQuotesUpdated);
    };
  }, []);

  const getAppVersion = () => {
    // Retorna a versão de produção dos arquivos web compilados (v3.3.0.4), que é a versão em execução real.
    // Isso evita alertas de atualização recorrentes de si mesmo (mismatch) quando o APK nativo está reportando 3.3.0.1.
    return "3.3.0.4";
  };

  const [updateBanner, setUpdateBanner] = useState<{ version: string; apkUrl: string; releaseNotes: string; timestamp: number } | null>(null);

  useEffect(() => {
    const handleSafeAlert = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setGlobalToast(customEvent.detail);
        // Clear after 5 seconds automatically
        setTimeout(() => setGlobalToast(null), 5000);
      }
    };
    
    window.addEventListener('bambuzau_safe_alert', handleSafeAlert);

    return () => {
      window.removeEventListener('bambuzau_safe_alert', handleSafeAlert);
    };
  }, []);

  // Core Cloud Synchronization disabled for offline safety
  const downloadAndApplyFromCloud = async (silent = true) => {
    return;
  };
  const triggerAutoUpload = async () => {
    return;
  };

  const handleImportAllData = (data: {
    clients?: Client[];
    printers?: Printer[];
    orders?: PrintOrder[];
    filamentStocks?: FilamentStock[];
    expenses?: Expense[];
    shoppingItems?: ShoppingItem[];
    tuyaDevices?: any[];
  }) => {
    if (data.clients) setClients(data.clients);
    if (data.printers) setPrinters(data.printers);
    if (data.orders) setOrders(data.orders);
    if (data.filamentStocks) setFilamentStocks(data.filamentStocks);
    if (data.expenses) setExpenses(data.expenses);
    if (data.shoppingItems) setShoppingItems(data.shoppingItems);
    if (data.tuyaDevices && data.tuyaDevices.length > 0) {
      setTuyaDevices(data.tuyaDevices);
    }
  };
  const handleAddClient = (clientData: Omit<Client, 'id'>) => {
    const newClient: Client = {
      id: clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1,
      ...clientData
    };
    setClients(prev => [...prev, newClient]);
  };

  const handleUpdateClient = (id: number, updated: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
  };

  const handleDeleteClient = (id: number) => {
    if (confirm('Tem certeza que deseja remover este cliente permanentemente?')) {
      setClients(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleAddPrinter = (printerData: Omit<Printer, 'id'>) => {
    const newPrinter: Printer = {
      id: printers.length > 0 ? Math.max(...printers.map(p => p.id)) + 1 : 1,
      ...printerData
    };
    setPrinters(prev => [...prev, newPrinter]);
  };

  const handleUpdatePrinter = (id: number, updated: Partial<Printer>) => {
    setPrinters(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
  };

  const handleDeletePrinter = (id: number) => {
    setPrinters(prev => prev.filter(p => p.id !== id));
  };

  const handleAddOrder = (orderData: Partial<PrintOrder>) => {
    const newOrder: PrintOrder = {
      id: orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1,
      clientId: orderData.clientId || null,
      clientName: orderData.clientName || 'Novo Cliente',
      itemName: orderData.itemName || 'Peça Personalizada',
      quantity: orderData.quantity || 1,
      filamentType: orderData.filamentType || 'PLA',
      filamentColor: orderData.filamentColor || 'Qualquer Cor',
      weightGrams: orderData.weightGrams || 50,
      printTimeHours: orderData.printTimeHours || 2.0,
      priceCharged: orderData.priceCharged || 40.0,
      platformSource: orderData.platformSource || 'MANUAL',
      platformOrderId: orderData.platformOrderId || undefined,
      status: orderData.status || 'QUEUE',
      printingProgress: orderData.printingProgress || 0.0,
      assignedPrinterId: orderData.assignedPrinterId || null,
      printerName: orderData.printerName || '',
      createdAt: orderData.createdAt || Date.now(),
      deadline: orderData.deadline || (Date.now() + 24 * 3600 * 1000),
      paymentMethod: orderData.paymentMethod || 'DINHEIRO',
      paymentStatus: orderData.paymentStatus || 'PENDENTE',
      imageUrl: orderData.imageUrl || undefined
    };

    setOrders(prev => [...prev, newOrder]);
    
    // Deduct stock immediately if created in PRINTING state
    if (newOrder.status === 'PRINTING') {
      deductMaterialsForOrder(newOrder);
    }
  };

  const handleUpdateOrder = (id: number, updated: Partial<PrintOrder>) => {
    setOrders(prev => prev.map(o => {
      if (o.id === id) {
        const nextOrder = { ...o, ...updated };

        // Deduct filament if moving to PRINTING for the first time
        if (updated.status === 'PRINTING' && o.status !== 'PRINTING') {
          deductMaterialsForOrder(nextOrder);
          // Set assigned printer status to PRINTING
          if (nextOrder.assignedPrinterId) {
            handleUpdatePrinter(nextOrder.assignedPrinterId, { status: 'PRINTING' });
          }
        }

        return nextOrder;
      }
      return o;
    }));
  };

  const deductMaterialsForOrder = (order: PrintOrder) => {
    // 1. Load latest catalog
    let catalog: CatalogItem[] = [];
    try {
      catalog = JSON.parse(localStorage.getItem('bambuzau_local_catalog_production') || '[]');
    } catch (e) {
      console.warn("Failed to load catalog for stock sync:", e);
    }

    // 2. Try to find a matched item by SKU/code or exact Name in the order info
    const searchTarget = `${order.itemName} ${order.clientName || ''} ${order.platformOrderId || ''}`.toUpperCase();
    
    const matchedItem = catalog.find(ci => {
      const sku = ci.productCode?.trim().toUpperCase();
      if (!sku) return false;
      return searchTarget.includes(sku);
    }) || catalog.find(ci => ci.name.toUpperCase() === order.itemName.toUpperCase());

    const orderQty = order.quantity || 1;

    if (matchedItem) {
      console.log(`[SYS SYNC v3.3.0.4] Catalog item matched for SKU/Name deduction: "${matchedItem.name}"`, matchedItem);
      
      // Multimaterial recipe deduction - Filaments
      if (matchedItem.filamentsUsed && matchedItem.filamentsUsed.length > 0) {
        matchedItem.filamentsUsed.forEach(f => {
          setFilamentStocks(prev => {
            const updated = prev.map(stock => {
              if (stock.id === f.filamentStockId) {
                const totalUsed = f.weightGrams * orderQty;
                return { ...stock, stockGrams: Math.max(0, stock.stockGrams - totalUsed) };
              }
              return stock;
            });

            // Record as expense automatically for monthly dashboards!
            const curFil = updated.find(s => s.id === f.filamentStockId);
            const rollPrice = curFil ? curFil.priceRoll : 110;
            const totalUsed = f.weightGrams * orderQty;
            const materialCost = (totalUsed / 1000) * rollPrice;
            
            const newExpense: Expense = {
              id: Date.now() + Math.floor(Math.random() * 1000),
              description: `Baixa SKU (${matchedItem.productCode}): ${totalUsed}g de ${curFil ? `${curFil.type} ${curFil.color}` : 'Filamento'}`,
              category: 'FILAMENTO',
              amount: parseFloat(materialCost.toFixed(2)),
              qty: 1,
              date: Date.now()
            };
            setExpenses(prevExp => [...prevExp, newExpense]);
            return updated;
          });
        });
      } else {
        // Fallback: standard simple filament deduction
        deductFilament(matchedItem.filamentType, matchedItem.filamentColorsUsed || 'Universal', (matchedItem.weightGrams || 50) * orderQty);
      }

      // Multimaterial recipe deduction - Supplies & Hardware!
      if (matchedItem.suppliesUsed && matchedItem.suppliesUsed.length > 0) {
        matchedItem.suppliesUsed.forEach(s => {
          setSuppliesStocks(prev => {
            const updated = prev.map(sup => {
              if (sup.id === s.supplyStockId) {
                const totalUsed = s.quantity * orderQty;
                return { ...sup, stockCount: Math.max(0, sup.stockCount - totalUsed) };
              }
              return sup;
            });

            // Record expense for supply depletion
            const curSup = updated.find(x => x.id === s.supplyStockId);
            const unitCost = curSup ? curSup.unitCost : 5.0;
            const totalUsed = s.quantity * orderQty;
            const supplyCost = totalUsed * unitCost;

            const newExpense: Expense = {
              id: Date.now() + Math.floor(Math.random() * 1000 + 10000),
              description: `Baixa Hardware SKU (${matchedItem.productCode}): ${totalUsed}x ${curSup ? curSup.name : 'Insumo'}`,
              category: 'OUTROS',
              amount: parseFloat(supplyCost.toFixed(2)),
              qty: 1,
              date: Date.now()
            };
            setExpenses(prevExp => [...prevExp, newExpense]);
            return updated;
          });
        });
      } else if (matchedItem.spentPartId) {
        // Legacy simple hardware deduction
        setSuppliesStocks(prev => prev.map(sup => {
          if (sup.id === matchedItem.spentPartId) {
            const totalUsed = (matchedItem.spentPartQty || 1) * orderQty;
            return { ...sup, stockCount: Math.max(0, sup.stockCount - totalUsed) };
          }
          return sup;
        }));
      }

    } else {
      // Fallback: No catalog matching found. Deduct raw order details.
      deductFilament(order.filamentType, order.filamentColor, order.weightGrams * orderQty);
    }
  };

  const deductFilament = (type: string, color: string, amount: number) => {
    setFilamentStocks(prev => prev.map(f => {
      if (f.type === type && f.color === color) {
        return { ...f, stockGrams: Math.max(0, f.stockGrams - amount) };
      }
      return f;
    }));

    // Record an expense matching raw material depletion
    const matchedFilament = filamentStocks.find(f => f.type === type && f.color === color);
    const unitPriceRoll = matchedFilament ? matchedFilament.priceRoll : 120.0;
    const materialCost = (amount / 1000) * unitPriceRoll;

    const newExpense: Expense = {
      id: Date.now() + Math.random(),
      description: `Consumo Material: ${amount}g de ${type} ${color}`,
      category: 'FILAMENTO',
      amount: parseFloat(materialCost.toFixed(2)),
      qty: 1,
      date: Date.now()
    };
    setExpenses(prev => [...prev, newExpense]);
  };

  const handleAddExpense = (expense: Omit<Expense, 'id'>) => {
    const newExp: Expense = {
      ...expense,
      id: Date.now() + Math.random()
    };
    setExpenses(prev => [...prev, newExp]);
  };

  const handleDeleteExpense = (id: number) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handleUpdateExpense = (id: number, updated: Partial<Expense>) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updated } : e));
  };

  const handleDeleteOrder = (id: number) => {
    if (confirm('Deseja realmente cancelar este trabalho de impressão?')) {
      // Free printer if it was busy
      const order = orders.find(o => o.id === id);
      if (order && order.status === 'PRINTING' && order.assignedPrinterId) {
        handleUpdatePrinter(order.assignedPrinterId, { status: 'IDLE' });
      }
      setOrders(prev => prev.filter(o => o.id !== id));
    }
  };

  const handleSimulateTick = () => {
    setOrders(prevOrders => {
      let isAnyUpdated = false;

      const updated = prevOrders.map(order => {
        if (order.status === 'PRINTING') {
          isAnyUpdated = true;
          const nextProgress = Math.min(1.0, order.printingProgress + 0.15 + Math.random() * 0.05);
          
          if (nextProgress >= 1.0) {
            // Completed! Transition to POS PROCESS and free printer
            if (order.assignedPrinterId) {
              setTimeout(() => {
                handleUpdatePrinter(order.assignedPrinterId!, { status: 'IDLE' });
              }, 10);
            }
            return {
              ...order,
              printingProgress: 1.0,
              status: 'POST_PROCESS'
            };
          }

          return {
            ...order,
            printingProgress: parseFloat(nextProgress.toFixed(2))
          };
        }
        return order;
      });

      if (!isAnyUpdated) {
        alert('Nenhum trabalho de impressão está no estado de processamento "Imprimindo" no momento. Aloca uma peça na aba de Produção!');
      }

      return updated;
    });
  };

  const handleImportExternalOrder = (external: ExternalPlatformOrder) => {
    setImportedExternalIds(prev => {
      if (prev.includes(external.id)) return prev;
      return [...prev, external.id];
    });
    handleAddOrder({
      clientName: external.clientName,
      itemName: external.itemName,
      quantity: 1,
      filamentType: 'PLA',
      filamentColor: 'Ouro Silk',
      weightGrams: external.weightGrams,
      printTimeHours: external.printTimeHours,
      priceCharged: external.priceCharged,
      platformSource: external.platform,
      status: 'QUEUE',
      printingProgress: 0.0
    });
  };

  const handleAddFilamentStock = (fData: Omit<FilamentStock, 'id'>) => {
    const newStock: FilamentStock = {
      id: filamentStocks.length > 0 ? Math.max(...filamentStocks.map(f => f.id)) + 1 : 1,
      ...fData
    };
    setFilamentStocks(prev => [...prev, newStock]);
  };

  const handleUpdateFilamentStock = (id: number, updated: Partial<FilamentStock>) => {
    setFilamentStocks(prev => prev.map(f => f.id === id ? { ...f, ...updated } : f));
  };

  const handleDeleteFilamentStock = (id: number) => {
    if (confirm('Tem certeza de que deseja excluir este filamento de seu estoque permanentemente?')) {
      setFilamentStocks(prev => prev.filter(f => f.id !== id));
    }
  };

  const handleAddShoppingItem = (itemData: Omit<ShoppingItem, 'id'>) => {
    const newItem: ShoppingItem = {
      id: shoppingItems.length > 0 ? Math.max(...shoppingItems.map(s => s.id)) + 1 : 1,
      ...itemData
    };
    setShoppingItems(prev => [...prev, newItem]);
  };

  const handleToggleShoppingItem = (id: number) => {
    setShoppingItems(prev => prev.map(s => s.id === id ? { ...s, isChecked: !s.isChecked } : s));
  };

  const handleDeleteShoppingItem = (id: number) => {
    setShoppingItems(prev => prev.filter(s => s.id !== id));
  };

  // Dynamic color definitions mapped to the themes
  const themeDefinitions = {
    'dark-organic': {
      bgMain: '#0A0D0B',
      bgCard: '#141B18',
      borderColor: '#222A25',
      colorPrimary: '#637E55',
      colorPrimaryLight: '#7BA069',
      colorAccent: '#E2B144',
      colorText: '#F7F5F0',
      colorMuted: '#899E8F',
      textAccent: '#E2B144',
    },
    'light-bambu': {
      bgMain: '#F8F6F0',
      bgCard: '#FFFFFF',
      borderColor: '#E5DFD0',
      colorPrimary: '#4F6744',
      colorPrimaryLight: '#637E55',
      colorAccent: '#C6942C',
      colorText: '#2C3827',
      colorMuted: '#667F60',
      textAccent: '#C6942C',
    },
    'dark-slate': {
      bgMain: '#08090C',
      bgCard: 'rgba(13, 16, 23, 0.45)',
      borderColor: 'rgba(255, 255, 255, 0.05)',
      colorPrimary: '#3083FF',
      colorPrimaryLight: '#5CA0FF',
      colorAccent: '#10B981',
      colorText: '#F8FAFC',
      colorMuted: '#94A3B8',
      textAccent: '#3083FF',
    },
    'gold-royal': {
      bgMain: '#0A0907',
      bgCard: '#151310',
      borderColor: '#25201A',
      colorPrimary: '#D59A30',
      colorPrimaryLight: '#E8B153',
      colorAccent: '#B27C17',
      colorText: '#FFFFFF',
      colorMuted: '#A59784',
      textAccent: '#D59A30',
    },
    'cyber-neon': {
      bgMain: '#090514',
      bgCard: '#130D23',
      borderColor: '#24183E',
      colorPrimary: '#A855F7',
      colorPrimaryLight: '#C084FC',
      colorAccent: '#F43F5E',
      colorText: '#F9F7FD',
      colorMuted: '#8B7FA4',
      textAccent: '#F43F5E',
    },
    'lava-orange': {
      bgMain: '#0A0A0B',
      bgCard: '#121215',
      borderColor: 'rgba(255, 255, 255, 0.05)',
      colorPrimary: '#F46E1F',
      colorPrimaryLight: '#FE8D45',
      colorAccent: '#FFB800',
      colorText: '#F5F5F7',
      colorMuted: '#8E8E93',
      textAccent: '#F46E1F',
    },
    'mint-forest': {
      bgMain: '#060B08',
      bgCard: '#0F1612',
      borderColor: '#1B2720',
      colorPrimary: '#14B8A6',
      colorPrimaryLight: '#2DD4BF',
      colorAccent: '#34D399',
      colorText: '#F0F9F6',
      colorMuted: '#809E91',
      textAccent: '#14B8A6',
    },
    'obsidian-crimson': {
      bgMain: '#0D0D0D',
      bgCard: '#161616',
      borderColor: '#262626',
      colorPrimary: '#EF4444',
      colorPrimaryLight: '#F87171',
      colorAccent: '#B91C1C',
      colorText: '#F9F9F9',
      colorMuted: '#A1A1A1',
      textAccent: '#EF4444',
    },
    'cool-ocean': {
      bgMain: '#090F1C',
      bgCard: '#111824',
      borderColor: '#1D283A',
      colorPrimary: '#06B6D4',
      colorPrimaryLight: '#22D3EE',
      colorAccent: '#3B82F6',
      colorText: '#F1F5F9',
      colorMuted: '#8FABBA',
      textAccent: '#06B6D4',
    },
    'royal-amethyst': {
      bgMain: '#090511',
      bgCard: '#120D1D',
      borderColor: '#211833',
      colorPrimary: '#A855F7',
      colorPrimaryLight: '#C084FC',
      colorAccent: '#EC4899',
      colorText: '#FBFAFD',
      colorMuted: '#89829A',
      textAccent: '#A855F7',
    },
    'desert-sand': {
      bgMain: '#FAF9F5',
      bgCard: '#FFFFFF',
      borderColor: '#EFEBE0',
      colorPrimary: '#C2410C',
      colorPrimaryLight: '#EA580C',
      colorAccent: '#F59E0B',
      colorText: '#2A2016',
      colorMuted: '#7F6A54',
      textAccent: '#C2410C',
    },
    'sakura-cherry': {
      bgMain: '#12090C',
      bgCard: '#1C1116',
      borderColor: '#2C1B22',
      colorPrimary: '#EC4899',
      colorPrimaryLight: '#F472B6',
      colorAccent: '#F472B6',
      colorText: '#FDF2F4',
      colorMuted: '#9E868F',
      textAccent: '#EC4899',
    },
  };

  const activeTheme = (brandConfig && brandConfig.theme === 'custom' && brandConfig.customThemeColors)
    ? brandConfig.customThemeColors
    : (themeDefinitions[(brandConfig?.theme || 'lava-orange') as keyof typeof themeDefinitions] || themeDefinitions['lava-orange']);

  // Dynamic domain accent color overrides
  // ciano: #06b6d4 (produção/impressoras), fúcsia/rosa: #ec4899 (vendas/vitrine), esmeralda: #10b981 (financeiro/lucro), âmbar: #f59e0b (alertas/estoque baixo)
  let domainColorPrimary = activeTheme.colorPrimary;
  let domainColorPrimaryLight = activeTheme.colorPrimaryLight;
  let domainColorAccent = activeTheme.colorAccent;
  let domainTextAccent = activeTheme.textAccent;

  if (brandConfig?.theme !== 'lava-orange') {
    if (currentTab === 1 || currentTab === 2) {
      // produção/impressoras / clientes e impressoras
      domainColorPrimary = '#06B6D4'; // ciano
      domainColorPrimaryLight = '#22D3EE';
      domainColorAccent = '#06B6D4';
      domainTextAccent = '#06B6D4';
    } else if (currentTab === 3 || currentTab === 6) {
      // vendas/vitrine e integrações
      domainColorPrimary = '#EC4899'; // fúcsia/rosa
      domainColorPrimaryLight = '#F472B6';
      domainColorAccent = '#EC4899';
      domainTextAccent = '#EC4899';
    } else if (currentTab === 4) {
      // custos/financeiro
      domainColorPrimary = '#10B981'; // esmeralda
      domainColorPrimaryLight = '#34D399';
      domainColorAccent = '#F59E0B'; // âmbar para alertas etc
      domainTextAccent = '#10B981';
    } else if (currentTab === 0) {
      // dashboard painel: can use a neutral gorgeous cyan + emerald highlights
      domainColorPrimary = '#06B6D4'; 
      domainColorPrimaryLight = '#22D3EE';
      domainColorAccent = '#10B981';
      domainTextAccent = '#06B6D4';
    }
  }

  // Helper helper to dynamic render Tab headers
  const getTabHeader = (tab: number) => {
    switch (tab) {
      case 0:
        return {
          title: "Painel de Controle",
          subtitle: "Visão geral das ordens, impressoras e faturamento consolidado",
        };
      case 1:
        return {
          title: "Produção",
          subtitle: "Filas de trabalho e monitoramento de extrusão",
        };
      case 2:
        return {
          title: "Clientes & Oficina",
          subtitle: "Contatos cadastrados, faturamento individual e frota de equipamentos",
        };
      case 3:
        return {
          title: "Pedidos",
          subtitle: "Gestão de pedidos e sincronização com Mercado Livre, Shopee e Shopify",
        };
      case 4:
        return {
          title: "Estoque",
          subtitle: "Gestão de filamentos, produtos e insumos",
        };
      case 5:
        return {
          title: "Ajustes do Sistema",
          subtitle: "",
        };
      case 6:
        return {
          title: "Histórico de Vendas",
          subtitle: "Ordens de produção entregues e faturadas com sucesso",
        };
      case 7:  return { title: "Pesquisa de Preços", subtitle: "Compare preços entre marketplaces e fornecedores" };
      case 8:  return { title: "Stls",        subtitle: "Biblioteca de produtos com material, tempo e preço" };
      case 9:  return { title: "Marketing",          subtitle: "Campanhas, geração de posts e calendário de publicações" };
      case 10: return { title: "Kanban",             subtitle: "Fluxo visual dos pedidos da fila ao entregue" };
      case 11: return { title: "Modelos",            subtitle: "Biblioteca de arquivos STL e 3MF" };
      case 12: return { title: "Pré-check",          subtitle: "Checklist antes de iniciar a impressão" };
      case 13: return { title: "Agenda",             subtitle: "Eventos, entregas e manutenções programadas" };
      case 14: return { title: "Sites",              subtitle: "Lojas e sites conectados ao seu ateliê" };
      case 15: return { title: "Prospecção",         subtitle: "Radar B2B Google Maps — captação de lojas e leads" };
      case 16: return { title: "Impressoras",        subtitle: "Cadastro, manutenção, monitor ao vivo e fila de impressão" };
      default:
        return {
          title: "Ateliê 3D",
          subtitle: "Plataforma de Gestão Oficina 3D",
        };
    }
  };

  // Global pending orders calculator
  // Conta apenas pedidos realmente pendentes de ação (aguardando aprovação),
  // não tudo que não foi entregue — evita badge fantasma na aba Pedidos.
  const pendingOrdersCount = orders.filter(o => o.status === 'WAITING').length;
  const awaitingAcceptCount = orders.filter(o => o.status === 'WAITING' || o.status === 'QUEUE').length;
  const pendingOrdersBlink = pendingOrdersCount > 0;
  const productionBlink = awaitingAcceptCount > 0;

  if (isShowcase) {
    return (
      <ShowcaseView
        workspaceCode={showcaseWorkspace}
        firebaseUrl={showcaseFirebase}
        onBackToAdmin={() => setIsShowcase(false)}
      />
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col font-sans transition-colors duration-300 tt-shell md:pl-[200px]"
      data-tab-category={
        [1, 2, 3, 6].includes(currentTab) ? 'principal'
        : [12, 14, 16].includes(currentTab) ? 'operacional'
        : [7, 8, 9, 10, 11, 15].includes(currentTab) ? 'marketing'
        : currentTab === 4 ? 'estoque'
        : 'default'
      }
    >
      
      {/* GLOBAL SAFE TOAST NOTIFICATION CARD */}
      {globalToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-6 left-1/2 z-[9999] w-[92%] max-w-md -translate-x-1/2 group"
          style={{ animation: "ttToastIn 480ms cubic-bezier(0.22, 1, 0.36, 1) both" }}
        >
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-3.5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.02)_inset] backdrop-blur-2xl backdrop-saturate-150">
            {/* subtle gradient sheen */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-400/[0.06] via-transparent to-transparent" />
            {/* accent rail */}
            <div className="pointer-events-none absolute inset-y-0 left-0 w-[2px] bg-gradient-to-b from-amber-300/0 via-amber-300/70 to-amber-300/0" />

            <div className="relative flex items-start gap-3">
              <div className="shrink-0 grid place-items-center h-8 w-8 rounded-xl bg-amber-400/10 ring-1 ring-inset ring-amber-300/20 text-amber-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300/90">
                  Notificação
                </h4>
                <p className="mt-1 text-[13px] leading-relaxed text-zinc-100/95 font-medium tracking-[-0.005em]">
                  {globalToast}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setGlobalToast(null)}
                aria-label="Fechar notificação"
                className="shrink-0 -mr-1 -mt-1 grid h-7 w-7 place-items-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-all duration-200 active:scale-95"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                  <path d="M2 2l8 8M10 2l-8 8" />
                </svg>
              </button>
            </div>

            {/* progress bar */}
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[2px] bg-white/5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-300/80 via-amber-200 to-amber-400/40"
                style={{ animation: "ttToastProgress 5s linear forwards" }}
              />
            </div>
          </div>
          <style>{`
            @keyframes ttToastIn {
              0%   { opacity: 0; transform: translate(-50%, -16px) scale(0.96); filter: blur(6px); }
              100% { opacity: 1; transform: translate(-50%, 0)     scale(1);    filter: blur(0); }
            }
            @keyframes ttToastProgress {
              from { transform: translateX(-100%); }
              to   { transform: translateX(0); }
            }
          `}</style>
        </div>
      )}
      
      {/* GLOBAL BRAND STYLING INJECTOR */}
      <style>{`
        :root {
          --brand-bg: #000000;
          --brand-card: ${activeTheme.bgCard};
          --brand-border: ${activeTheme.borderColor};
          --brand-primary: ${domainColorPrimary};
          --brand-primary-light: ${domainColorPrimaryLight};
          --brand-accent: ${domainColorAccent};
          --brand-text: ${activeTheme.colorText};
          --brand-muted: ${activeTheme.colorMuted};
          --brand-text-accent: ${domainTextAccent};
        }
        
        body {
          background-color: var(--brand-bg) !important;
          background-image: none !important;
          color: var(--brand-text) !important;
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        h1, h2, h3, h4, .font-display {
          font-family: var(--font-display), var(--font-sans) !important;
          letter-spacing: -0.02em !important;
        }

        /* Auto GLASSMORPHISM for cards and grids without animated glow borders */
        .bg-\\[\\#151917\\],
        .bg-zinc-900,
        .bg-neutral-900,
        .bg-zinc-950\\/80,
        .bg-zinc-950,
        .bg-\\[var\\(--brand-card\\)\\],
        [style*="var(--brand-card)"] {
          background-color: var(--brand-card) !important;
          border: 1px solid var(--brand-border) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          border-radius: 1.25rem !important; /* rounded-2xl */
          box-shadow: 0 20px 40px -15px rgba(0,0,0,0.7) !important;
        }
        
        .bg-\\[\\#151917\\]:hover {
          border-color: var(--brand-border) !important;
        }

        /* Global custom rounded class and shadows */
        .rounded-xl, .rounded-2xl, .rounded-3xl {
          border-radius: 1rem !important; /* rounded-2xl unified */
        }

        /* Prevent buttons and select structures from losing clarity */
        button, select {
          border-radius: 0.75rem !important;
        }

        /* Folder-style tabs keep flat bottom corners (browser tab look) */
        button.folder-tab {
          border-radius: 0.5rem 0.5rem 0 0 !important;
        }

        /* Universal overrides for hardcoded Tailwind colors to dynamically tint the entire app */
        .text-\\[\\#95BBA2\\] { color: var(--brand-primary) !important; }
        .bg-\\[\\#95BBA2\\] { background-color: var(--brand-primary) !important; }
        .border-\\[\\#95BBA2\\] { border-color: var(--brand-primary) !important; }
        .focus\\:ring-\\[\\#95BBA2\\]\\:focus { --tw-ring-color: var(--brand-primary) !important; }
        .focus\\:border-\\[\\#95BBA2\\]\\:focus { border-color: var(--brand-primary) !important; }
        .hover\\:border-\\[\\#95BBA2\\]\\:hover { border-color: var(--brand-primary) !important; }
        .hover\\:text-\\[\\#95BBA2\\]\\:hover { color: var(--brand-primary) !important; }
        
        /* Render opacity with background-color with dynamic fallback overlays */
        .bg-\\[\\#95BBA2\\]\\/5 { background-color: color-mix(in srgb, var(--brand-primary) 5%, transparent) !important; }
        .bg-\\[\\#95BBA2\\]\\/10 { background-color: color-mix(in srgb, var(--brand-primary) 10%, transparent) !important; }
        .bg-\\[\\#95BBA2\\]\\/15 { background-color: color-mix(in srgb, var(--brand-primary) 15%, transparent) !important; }
        .bg-\\[\\#95BBA2\\]\\/20 { background-color: color-mix(in srgb, var(--brand-primary) 20%, transparent) !important; }
        .bg-\\[\\#95BBA2\\]\\/25 { background-color: color-mix(in srgb, var(--brand-primary) 25%, transparent) !important; }
        .bg-\\[\\#95BBA2\\]\\/30 { background-color: color-mix(in srgb, var(--brand-primary) 30%, transparent) !important; }
        
        .hover\\:bg-\\[\\#95BBA2\\]\\/5\\:hover { background-color: color-mix(in srgb, var(--brand-primary) 5%, transparent) !important; }
        .hover\\:bg-\\[\\#95BBA2\\]\\/10\\:hover { background-color: color-mix(in srgb, var(--brand-primary) 10%, transparent) !important; }
        .hover\\:bg-\\[\\#95BBA2\\]\\/20\\:hover { background-color: color-mix(in srgb, var(--brand-primary) 20%, transparent) !important; }
        .hover\\:bg-\\[\\#95BBA2\\]\\/25\\:hover { background-color: color-mix(in srgb, var(--brand-primary) 25%, transparent) !important; }
        .hover\\:bg-\\[\\#95BBA2\\]\\/30\\:hover { background-color: color-mix(in srgb, var(--brand-primary) 30%, transparent) !important; }
        .hover\\:bg-\\[\\#B6D8B4\\]\\:hover { background-color: var(--brand-primary-light) !important; opacity: 0.9 !important; }

        /* Muted sage greens representing muted colors */
        .text-\\[\\#8BA58D\\] { color: var(--brand-muted) !important; }
        .text-\\[\\#8BA58D\\]\\/50 { color: color-mix(in srgb, var(--brand-muted) 50%, transparent) !important; }
        .text-\\[\\#8BA58D\\]\\/70 { color: color-mix(in srgb, var(--brand-muted) 70%, transparent) !important; }
        .text-\\[\\#8BA58D\\]\\/80 { color: color-mix(in srgb, var(--brand-muted) 80%, transparent) !important; }
        .text-\\[\\#8BA58D\\]\\/60 { color: color-mix(in srgb, var(--brand-muted) 60%, transparent) !important; }
        .hover\\:text-\\[\\#8BA58D\\]\\:hover { color: var(--brand-muted) !important; }
        .border-\\[\\#8BA58D\\] { border-color: var(--brand-muted) !important; }
        .border-\\[\\#8BA58D\\]\\/30 { border-color: color-mix(in srgb, var(--brand-muted) 30%, transparent) !important; }
        .border-\\[\\#8BA58D\\]\\/40 { border-color: color-mix(in srgb, var(--brand-muted) 40%, transparent) !important; }
        .border-\\[\\#8BA58D\\]\\/20 { border-color: color-mix(in srgb, var(--brand-muted) 20%, transparent) !important; }
        .placeholder-\\[\\#8BA58D\\]\\/40\\:\\:placeholder { color: color-mix(in srgb, var(--brand-muted) 40%, transparent) !important; }
        .placeholder-\\[\\#8BA58D\\]\\/60\\:\\:placeholder { color: color-mix(in srgb, var(--brand-muted) 60%, transparent) !important; }
        
        /* Dark backgrounds and borders dynamic mapping */
        .bg-\\[\\#151917\\] { background-color: var(--brand-card) !important; }
        .bg-\\[\\#151917\\]\\/20 { background-color: color-mix(in srgb, var(--brand-card) 20%, transparent) !important; }
        .bg-\\[\\#151917\\]\\/50 { background-color: color-mix(in srgb, var(--brand-card) 50%, transparent) !important; }
        .border-\\[\\#232B27\\] { border-color: var(--brand-border) !important; }
        .border-\\[\\#232B27\\]\\/40 { border-color: color-mix(in srgb, var(--brand-border) 40%, transparent) !important; }
        .border-\\[\\#232B27\\]\\/20 { border-color: color-mix(in srgb, var(--brand-border) 20%, transparent) !important; }
        .bg-\\[\\#0C0E0D\\] { background-color: var(--brand-bg) !important; }
        .bg-\\[\\#0C0E0D\\]\\/40 { background-color: color-mix(in srgb, var(--brand-bg) 40%, transparent) !important; }
        
        /* PrintFlow green styles */
        .text-\\[\\#5E8B61\\] { color: var(--brand-primary) !important; }
        .bg-\\[\\#5E8B61\\]\\/15 { background-color: color-mix(in srgb, var(--brand-primary) 15%, transparent) !important; }
        .hover\\:bg-\\[\\#5E8B61\\]\\/35\\:hover { background-color: color-mix(in srgb, var(--brand-primary) 35%, transparent) !important; }
        .border-\\[\\#5E8B61\\]\\/30 { border-color: color-mix(in srgb, var(--brand-primary) 30%, transparent) !important; }
        .hover\\:border-\\[\\#8BA58D\\]\\/40\\:hover { border-color: color-mix(in srgb, var(--brand-muted) 40%, transparent) !important; }

        /* Sage Green dynamic mapping overrides */
        .bg-\\[\\#637E55\\] { background-color: var(--brand-primary) !important; }
        .hover\\:bg-\\[\\#536B47\\]\\:hover { background-color: var(--brand-primary-light) !important; }
        .bg-\\[\\#637E55\\]\\/15 { background-color: color-mix(in srgb, var(--brand-primary) 15%, transparent) !important; }
        .text-\\[\\#637E55\\] { color: var(--brand-primary) !important; }

        /* Text highlights & accent color mapping */
        .text-\\[\\#F1F4EE\\] { color: var(--brand-text) !important; }
        .text-\\[\\#E5B242\\] { color: var(--brand-accent) !important; }
        .bg-\\[\\#E5B242\\] { background-color: var(--brand-accent) !important; }
        .border-\\[\\#E5B242\\] { border-color: var(--brand-accent) !important; }
        .bg-\\[\\#E5B242\\]\\/10 { background-color: color-mix(in srgb, var(--brand-accent) 10%, transparent) !important; }
        .bg-\\[\\#E5B242\\]\\/15 { background-color: color-mix(in srgb, var(--brand-accent) 15%, transparent) !important; }
        
        /* Layout overrides */
        .theme-border { border-color: var(--brand-border) !important; }
        .border-b { border-bottom-color: var(--brand-border) !important; }
        .border-t { border-top-color: var(--brand-border) !important; }
        
        /* Input styling glass */
        input, select, textarea {
          background-color: rgba(13, 16, 23, 0.6) !important;
          color: var(--brand-text) !important;
          border: 1px solid rgba(255, 255, 255, 0.06) !important;
          border-radius: 0.875rem !important;
          backdrop-filter: blur(8px) !important;
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.2) !important;
          transition: border-color 0.25s ease, box-shadow 0.25s ease !important;
          outline: none !important;
        }
        input:focus, select:focus, textarea:focus {
          border-color: var(--brand-primary) !important;
          box-shadow: 0 0 12px rgba(48, 131, 255, 0.25), inset 0 1px 2px rgba(0,0,0,0.2) !important;
        }

        /* Buttons fallback style */
        .btn-brand-primary {
          background-color: var(--brand-primary) !important;
          color: #000000 !important;
          font-weight: 800 !important;
        }

        @keyframes tab-glow-pulse {
          0%, 100% {
            background-color: var(--brand-accent);
            opacity: 1;
            box-shadow: 0 0 14px var(--brand-accent);
            transform: scale(1.02);
          }
          50% {
            background-color: var(--brand-accent);
            opacity: 0.6;
            box-shadow: 0 0 3px var(--brand-accent);
            transform: scale(0.96);
          }
        }
        .animate-tab-blink {
          animation: tab-glow-pulse 1.3s infinite ease-in-out;
        }
        @keyframes ticker-marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          display: inline-flex;
          white-space: nowrap;
          animation: ticker-marquee 32s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }
        .recharts-wrapper *,
        .recharts-surface *,
        .recharts-layer,
        .recharts-bar-rectangle,
        .recharts-sector,
        .recharts-area-area,
        .recharts-area-curve {
          animation: none !important;
          transition: none !important;
        }
      `}</style>

      <>
      {/* PREMIUM SIDE NAV — vertical, fixed left */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-50 w-[200px] flex-col bg-[#0a0d0c]/95 backdrop-blur-2xl border-r border-white/[0.06] shadow-[8px_0_32px_-12px_rgba(0,0,0,0.8)]">
        {/* BRAND / LOGO — alinhado ao topo, sem moldura */}
        <div className="px-3 pt-5 pb-4 flex flex-col items-center gap-2">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div className="absolute inset-[-14px] rounded-[36px] bg-[radial-gradient(circle_at_center,_rgba(163,230,53,0.34),_rgba(94,234,212,0.14)_40%,_transparent_74%)] blur-2xl" />
            {brandConfig.customLogo ? (
              <img
                src={brandConfig.customLogo}
                alt={brandConfig.name || 'Logo'}
                className="relative w-full h-full object-contain drop-shadow-[0_10px_22px_rgba(0,0,0,0.72)]"
                referrerPolicy="no-referrer"
              />
            ) : (
              <Atelier3DLogo className="relative h-[112px] w-[112px]" />
            )}
          </div>
          <div className="text-center leading-tight w-full px-1">
            <div className="brand-shine text-[13px] font-bold tracking-wide truncate max-w-[184px] mx-auto uppercase">
              {brandConfig.name}
            </div>
            <div className="text-[8px] uppercase tracking-[0.24em] text-white/40 font-semibold mt-1">Ateliê 3D</div>
          </div>
        </div>
        {/* Spacer para descer a navegação até a altura do "Bem-vindo de volta" */}
        <div className="px-4 pt-5 pb-2 border-t border-white/[0.05] mt-1">
          <div className="text-[9px] uppercase tracking-[0.24em] text-white/35 font-bold">Navegação</div>
        </div>
        <nav
          className="flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar px-2 py-3"
          style={{ scrollbarWidth: 'none' }}
        >
          {([
            {
              section: null,
              items: [{ id: 0, label: 'Painel', icon: Home }],
            },
            {
              section: 'Principal',
              items: [
                { id: 2, label: 'Clientes', icon: Users },
                { id: 3, label: 'Pedidos', icon: GitPullRequest, badge: pendingOrdersCount, blink: pendingOrdersBlink },
                { id: 1, label: 'Produção', icon: Activity, badge: awaitingAcceptCount, blink: productionBlink },
                { id: 4, label: 'Estoque', icon: Layers, sub: 'STOCK', onClick: () => openCostsSubtab('STOCK') },
                { id: 6, label: 'Histórico', icon: ShoppingBag },
              ],
            },
            {
              section: 'Operacional',
              items: [
                { id: 16, label: 'Impressoras', icon: PrinterNavIcon, onClick: () => { setCurrentTab(16); setPrintersSubTab('GERAL'); } },
                { id: 16, label: 'Manutenção', icon: Wrench, sub: 'MANUT', onClick: () => { setCurrentTab(16); setPrintersSubTab('MANUT'); } },
                { id: 12, label: 'Pré-check', icon: ClipboardCheck },
                { id: 14, label: 'Sites', icon: Globe },
              ],
            },
            {
              section: 'Marketing',
              items: [
                { id: 7, label: 'Preços', icon: Search },
                { id: 9, label: 'Marketing', icon: Megaphone },
                { id: 15, label: 'Prospecção', icon: Radar },
                { id: 11, label: 'Modelos', icon: FileBox },
                { id: 8, label: 'Stls', icon: Box },
                { id: 4, label: 'Catálogo', icon: BookOpen, sub: 'CATALOG', onClick: () => openCostsSubtab('CATALOG') },
                { id: 10, label: 'Kanban', icon: Columns3 },
              ],
            },
            {
              section: 'Financeiro',
              items: [
                { id: 19, label: 'Orçamentos', icon: FileEdit },
                { id: 4, label: 'Gastos', icon: DollarSign, sub: 'SHOP', onClick: () => openCostsSubtab('SHOP') },
                { id: 4, label: 'Cotação', icon: TrendingUp, sub: 'QUOTE', onClick: () => openCostsSubtab('QUOTE') },
                { id: 4, label: 'Calculadora', icon: Calculator, sub: 'CALC', onClick: () => openCostsSubtab('CALC') },
                { id: 17, label: 'Contabilidade', icon: FileBarChart2 },
              ],
            },
            {
              section: 'Configurações',
              items: [
                { id: 13, label: 'Agenda', icon: Calendar },
                { id: 20, label: 'WhatsApp', icon: MessageCircle },
                { id: 5, label: 'Ajustes', icon: Settings },
              ],
            },
          ] as Array<{ section: string | null; items: Array<{ id: number; label: string; icon: any; badge?: number; blink?: boolean; sub?: string; onClick?: () => void }> }>).map((group, gi) => {
            const sectionColor =
              group.section === 'Principal' ? '#D4A017' :
              group.section === 'Operacional' ? '#3B82F6' :
              group.section === 'Marketing' ? '#8B5CF6' :
              group.section === 'Financeiro' ? '#22C55E' :
              group.section === 'Configurações' ? '#b7ff00' :
              '#D4A017';
            return (
            <div key={gi} className="flex flex-col gap-0.5">
              {group.section && (
                <div
                  className="px-3 mb-1 text-[9px] uppercase tracking-[0.22em] font-semibold"
                  style={{ color: sectionColor }}
                >
                  {group.section}
                </div>
              )}
              {group.items.map((item, ii) => {
                const active = item.sub === 'MANUT'
                  ? currentTab === 16 && printersSubTab === 'MANUT'
                  : item.id === 16 && !item.sub
                    ? currentTab === 16 && printersSubTab === 'GERAL'
                    : item.sub
                      ? currentTab === item.id && costsSubTab === item.sub
                      : currentTab === item.id && !item.onClick;
                const accent = '#b7ff00';
                return (
                  <button
                    key={`${item.id}-${item.label}-${ii}`}
                    onClick={() => (item.onClick ? item.onClick() : setCurrentTab(item.id))}
                    className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium tracking-wide w-full text-left transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${item.blink ? 'nav-alert-blink' : ''} ${
                      active
                        ? 'text-white bg-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_16px_-6px_rgba(0,0,0,0.6)]'
                        : 'hover:bg-white/[0.04]'
                    }`}
                    style={!active ? { color: 'rgba(255,255,255,0.75)' } : undefined}
                  >
                    {active && (
                      <span
                        aria-hidden
                        className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full"
                        style={{ background: accent, boxShadow: `0 0 12px ${accent}80` }}
                      />
                    )}
                    <item.icon
                      data-nav-icon={item.blink ? 'true' : undefined}
                      className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110"
                      style={{ color: sectionColor }}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge ? (
                      <span
                         data-nav-badge={item.blink ? 'true' : undefined}
                         className="ml-auto min-w-[18px] h-[18px] px-1.5 inline-flex items-center justify-center rounded-full text-[9px] font-bold text-white"
                        style={{ background: accent, boxShadow: `0 0 10px ${accent}66` }}
                      >
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            );
          })}
        </nav>
      </aside>

      {/* MOBILE NAV — horizontal scroll (preserved for small screens) */}
      <div className="md:hidden w-full px-2 pt-3 pb-1.5 bg-transparent">
        <nav className="relative flex items-center gap-0.5 overflow-x-auto no-scrollbar rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl px-1.5 py-1.5">
          {[
            { id: 0, label: 'Painel', icon: Home },
            { id: 1, label: 'Produção', icon: Activity, badge: awaitingAcceptCount, blink: productionBlink },
            { id: 6, label: 'Histórico', icon: ShoppingBag },
            { id: 2, label: 'Clientes', icon: Users },
            { id: 15, label: 'Prospecção', icon: Radar },
            { id: 3, label: 'Pedidos', icon: GitPullRequest, badge: pendingOrdersCount, blink: pendingOrdersBlink },
            { id: 4, label: 'Cálculo', icon: Calculator, onClick: () => openCostsSubtab('CALC') },
            { id: 4, label: 'Catálogo Inova', icon: BookOpen, onClick: () => openCostsSubtab('CATALOG') },
            { id: 4, label: 'Estoque', icon: Layers, onClick: () => openCostsSubtab('STOCK') },
            { id: 4, label: 'Gastos', icon: DollarSign, onClick: () => openCostsSubtab('SHOP') },
            { id: 4, label: 'Cotação', icon: TrendingUp, onClick: () => openCostsSubtab('QUOTE') },
            { id: 7, label: 'Preços', icon: Search },
            { id: 5, label: 'Ajustes', icon: Settings },
          ].map((item: any, ii: number) => {
            const active = currentTab === item.id && !item.onClick;
            return (
              <button
                key={`${item.id}-${item.label}-${ii}`}
                onClick={() => (item.onClick ? item.onClick() : setCurrentTab(item.id))}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-medium whitespace-nowrap shrink-0 transition-all ${item.blink ? 'nav-alert-blink' : ''} ${
                  active ? 'text-white bg-white/[0.08]' : 'text-white/55 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <item.icon data-nav-icon={item.blink ? 'true' : undefined} className="h-3.5 w-3.5" />
                <span>{item.label}</span>
                {item.badge ? (
                  <span data-nav-badge={item.blink ? 'true' : undefined} className="ml-0.5 min-w-[16px] h-[16px] px-1 inline-flex items-center justify-center rounded-full text-[9px] font-bold text-white bg-amber-500">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {/* GLOBAL HEADER — hidden on Dashboard (Print3D has its own topbar) */}
      <header className="hidden">

        {/* Soft ambient aura */}
        <div className="absolute -top-24 left-1/4 w-[420px] h-40 bg-[var(--brand-primary)]/[0.06] rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute -top-24 right-1/4 w-[420px] h-40 bg-[var(--brand-accent)]/[0.05] rounded-full blur-[90px] pointer-events-none" />

        {/* Hairline top accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        <div className="flex items-center gap-4 w-full md:w-auto relative z-10">
          {/* Logo container — refined glass */}
          <div className={`p-3 bg-white/[0.03] border rounded-2xl flex items-center justify-center transition-all duration-500 shrink-0 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_24px_-12px_rgba(0,0,0,0.8)] ${
            printers.some(p => p.status === 'PRINTING')
              ? 'border-[var(--brand-primary)]/40 shadow-[0_0_28px_-4px_rgba(244,110,31,0.45)]'
              : 'border-white/[0.08]'
          }`}>
            {brandConfig.customLogo ? (
              <img src={brandConfig.customLogo} alt="Logo" className="h-10 w-10 object-contain rounded-xl" referrerPolicy="no-referrer" />
            ) : brandConfig.icon === 'bambu' ? (
              <Atelier3DLogo className="h-10 w-10" />
            ) : brandConfig.icon === 'spool' ? (
              <Layers className="h-8.5 w-8.5 text-[var(--brand-primary)] animate-spin-slow" />
            ) : (
              <Wrench className="h-8.5 w-8.5 text-[#95BBA2]" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-[22px] md:text-[26px] font-semibold tracking-[-0.02em] text-white flex items-center gap-2.5 font-sans select-none leading-none">
                <span className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent">
                  <span className="brand-shine text-[28px] md:text-[32px] font-black tracking-normal uppercase">
                    {brandConfig.name}
                  </span>
                </span>
              </h1>
              <span className="text-[9.5px] tracking-[0.08em] bg-emerald-400/10 border border-emerald-400/25 text-emerald-300 font-semibold px-2 py-0.5 rounded-full shrink-0 transition-all duration-300 select-none backdrop-blur-sm">
                v3.3.0.4
              </span>
            </div>
            
            {/* Live Sensor and Machine Indicators formatted in clean capsules */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mt-2.5 font-sans">
              <p className="text-[9.5px] text-emerald-300/90 font-semibold tracking-[0.18em] uppercase flex items-center gap-1.5 shrink-0 select-none">
                GESTÃO OFICINA
              </p>
              
              <span className="hidden sm:inline-block w-px h-3 bg-white/10 mx-1 select-none" />

              {/* Greenhouse Sensors Monitor (Túnel das Estufas) */}
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-semibold uppercase text-white/50 tracking-[0.14em] select-none">Estufas</span>
                {tuyaDevices.length === 0 ? (
                  <button 
                    onClick={restoreDefaultEstufas}
                    className="inline-flex items-center gap-1 bg-amber-500/[0.06] hover:bg-amber-500/15 border border-amber-500/20 px-2 py-0.5 rounded-full cursor-pointer transition-all duration-300 text-[8px] font-sans font-semibold text-amber-200 select-none active:scale-95"
                    title="Nenhuma estufa ativa encontrada. Clique para restaurar as padrão."
                  >
                    <span>Restaurar Estufas ↺</span>
                  </button>
                ) : (
                  tuyaDevices.map(dev => (
                    <div 
                      key={dev.id} 
                      onClick={() => setCurrentTab(5)} 
                      className="inline-flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.08] hover:border-white/20 hover:bg-white/[0.06] px-2 py-0.5 rounded-full cursor-pointer transition-all duration-300 text-[9px] font-mono text-white/85 select-none active:scale-95 backdrop-blur-sm"
                      title={`${dev.name} • Umidade Atual: ${dev.currentHumidity}% • Clique para configurar`}
                    >
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/40 opacity-60"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white/80"></span>
                      </span>
                      <span className="font-sans font-semibold text-white/45 uppercase text-[8px] tracking-wider">{dev.name.replace('Estufa ', '')}</span>
                      <span className="font-semibold text-white tabular-nums">{dev.currentHumidity}%</span>
                    </div>
                  ))
                )}
              </div>

              <span className="hidden sm:inline-block w-px h-3 bg-white/10 mx-1 select-none" />

              {/* SerpApi Connectivity Indicator */}
              <ConnectivityIndicator onConfigure={() => setCurrentTab(5)} />

              <span className="hidden sm:inline-block w-px h-3 bg-white/10 mx-1 select-none" />

              {/* Machinery Status Badge with modern capsule look */}
              <div
                onClick={() => setCurrentTab(0)}
                className="inline-flex items-center gap-1.5 bg-emerald-500/[0.06] border border-emerald-500/15 hover:border-emerald-500/35 px-2 py-0.5 rounded-full cursor-pointer transition-all duration-300 text-[9px] font-sans active:scale-95 select-none hover:bg-emerald-500/[0.12] backdrop-blur-sm"
                title="Lista de Impressoras Online • Clique para visualizar"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className={`${printers.some(p => p.status === 'PRINTING') ? 'animate-ping' : ''} absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60`}></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                </span>
                <span className="font-sans font-semibold text-white/50 uppercase text-[8px] tracking-wider">Máquinas</span>
                <span className="text-emerald-300 font-semibold tabular-nums">{printers.filter(p => p.status === 'PRINTING').length}/{printers.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hairline bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </header>

      {/* Filament ticker removido a pedido */}

      </>

      {/* TWO-PANEL CONTENT OR CENTRAL CONTAINER */}
      <main className="flex-1 w-full px-3 sm:px-4 md:px-6 py-4 md:py-6 pb-28 space-y-4">
        {/* EXQUISITE NEW HEADER DE CADA PÁGINA (Título grande + Subtítulo curto + Relógio/Data ao vivo mounted) */}
        {null /* Page titles removed — actions moved into each dashboard. */}
        {/* GLOBAL STOCK WARNING BANNER - PLACED ABOVE EVERYTHING ONLY IN PAINEL */}
        {currentTab === 0 && (() => {
          if (dismissedStockAlert) return null;
          const lowFilaments = filamentStocks.filter(f => f.stockGrams < f.minStockGrams);
          if (lowFilaments.length > 0) {
            return (
              <div
                id="global-stock-warning-banner"
                className="relative mb-2 overflow-visible rounded-2xl border border-red-400/30 animate-fade-in"
                style={{
                  background: 'linear-gradient(135deg, rgba(239,68,68,0.14), rgba(239,68,68,0.04))',
                  backdropFilter: 'blur(14px) saturate(140%)',
                  boxShadow: '0 0 32px -12px rgba(239,68,68,0.55), inset 0 1px 0 rgba(239,68,68,0.18)',
                }}
              >
                <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-1.5 sm:px-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-red-500/10 ring-1 ring-inset ring-red-400/25 text-red-300">
                      <AlertTriangle className="h-3.5 w-3.5 animate-pulse" />
                    </div>
                    <div className="min-w-0 flex items-baseline gap-2.5 truncate">
                      <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-red-300/90 shrink-0">
                        Estoque Baixo
                      </span>
                      <span className="truncate text-[12px] font-semibold tracking-[-0.005em] text-zinc-50">
                        {lowFilaments.length} {lowFilaments.length === 1 ? 'bobina' : 'bobinas'} abaixo do mínimo
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        localStorage.setItem('bambuzau_costs_subtab_override', 'STOCK');
                        setCurrentTab(4);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/30 bg-red-500/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-red-100 transition-all duration-300 hover:border-red-300/50 hover:bg-red-500/25 hover:shadow-[0_8px_24px_-8px_rgba(239,68,68,0.6)] active:scale-[0.97]"
                    >
                      Estoque
                      <span aria-hidden>🧵</span>
                    </button>
                    <button
                      onClick={() => setDismissedStockAlert(true)}
                      title="Fechar alerta"
                      aria-label="Fechar"
                      className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-all duration-200 active:scale-95"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                        <path d="M2 2l8 8M10 2l-8 8" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {currentTab === 0 && (
          <DashboardTab
            orders={orders}
            printers={printers}
            filamentStocks={filamentStocks}
            expenses={expenses}
            shoppingItems={shoppingItems}
            clients={clients}
            tuyaDevices={tuyaDevices}
            onSelectTab={setCurrentTab}
            onUpdatePrinter={handleUpdatePrinter}
            onUpdateOrder={handleUpdateOrder}
          />
        )}

        {currentTab === 2 && (
          <ClientsTab
            clients={clients}
            printers={printers}
            orders={orders}
            onAddClient={handleAddClient}
            onUpdateClient={handleUpdateClient}
            onDeleteClient={handleDeleteClient}
            onAddPrinter={handleAddPrinter}
            onUpdatePrinter={handleUpdatePrinter}
            onDeletePrinter={handleDeletePrinter}
            onAddOrder={handleAddOrder}
            viewMode="clients"
          />
        )}

        {currentTab !== 0 && currentTab !== 2 && (
          <div className="p-0">
        {currentTab === 1 && (
          <>
            <ProductionTab
              orders={orders}
              printers={printers}
              filamentStocks={filamentStocks}
              clients={clients}
              onAddOrder={handleAddOrder}
              onAddClient={handleAddClient}
              onUpdateOrder={handleUpdateOrder}
              onDeleteOrder={handleDeleteOrder}
              onSimulateTick={handleSimulateTick}
              onUpdateFilament={handleUpdateFilamentStock}
              onUpdatePrinter={handleUpdatePrinter}
              viewMode="orders"
            />
          </>
        )}

        {currentTab === 3 && (
          <>
            <IntegrationTab
              onImportOrder={handleImportExternalOrder}
              importedExternalIds={importedExternalIds}
              orders={orders}
              onUpdateOrder={handleUpdateOrder}
            />
          </>
        )}

        {currentTab === 4 && (
          <>
            <CostsTab
            filamentStocks={filamentStocks}
            shoppingItems={shoppingItems}
            expenses={expenses}
            onAddFilament={handleAddFilamentStock}
            onUpdateFilament={handleUpdateFilamentStock}
            onAddShoppingItem={handleAddShoppingItem}
            onToggleShoppingItem={handleToggleShoppingItem}
            onDeleteShoppingItem={handleDeleteShoppingItem}
            onDeleteFilament={handleDeleteFilamentStock}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
            onUpdateExpense={handleUpdateExpense}
            suppliesStocks={suppliesStocks}
            setSuppliesStocks={setSuppliesStocks}
            lastAuditDate={lastAuditDate}
            setLastAuditDate={setLastAuditDate}
            />
          </>
        )}

        {currentTab === 5 && (
          <SettingsTab
            clients={clients}
            printers={printers}
            orders={orders}
            filamentStocks={filamentStocks}
            expenses={expenses}
            shoppingItems={shoppingItems}
            onImportAllData={handleImportAllData}
            brandConfig={brandConfig}
            onUpdateBrandConfig={setBrandConfig}
            tuyaDevices={tuyaDevices}
            onUpdateTuyaDevices={setTuyaDevices}
          />
        )}

        {currentTab === 6 && (
          <SoldTab
            orders={orders}
            clients={clients}
            onDeleteOrder={handleDeleteOrder}
          />
        )}

        {currentTab >= 7 && (
          <Suspense fallback={<TabFallback />}>
            {currentTab === 7  && <Market3DApp />}
            {currentTab === 8  && <CatalogoTab />}
            {currentTab === 9  && <MarketingTab />}
            {currentTab === 10 && <KanbanTab />}
            {currentTab === 11 && <MarketTab />}
            {currentTab === 12 && <PreCheckTabNew />}
            {currentTab === 13 && <AgendaTabNew />}
            {currentTab === 14 && <SitesTab />}
            {currentTab === 15 && (
              <ClientsTab
                clients={clients}
                printers={printers}
                orders={orders}
                onAddClient={handleAddClient}
                onUpdateClient={handleUpdateClient}
                onDeleteClient={handleDeleteClient}
                onAddPrinter={handleAddPrinter}
                onUpdatePrinter={handleUpdatePrinter}
                onDeletePrinter={handleDeletePrinter}
                onAddOrder={handleAddOrder}
                viewMode="prospect"
              />
            )}
            {currentTab === 16 && (
              <div className="space-y-4">
                {/* Sub-abas Impressoras */}
                <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                  {[
                    { id: 'GERAL', label: 'Visão Geral' },
                    { id: 'MANUT', label: 'Manutenção' },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setPrintersSubTab(t.id as 'GERAL' | 'MANUT')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        printersSubTab === t.id
                          ? 'bg-[#b7ff00] text-black'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                {printersSubTab === 'MANUT' ? (
                  <ManutencaoTab printers={printers} onUpdatePrinter={handleUpdatePrinter} />
                ) : (<>
                <ProductionTab
                  orders={orders}
                  printers={printers}
                  filamentStocks={filamentStocks}
                  clients={clients}
                  onAddOrder={handleAddOrder}
                  onAddClient={handleAddClient}
                  onUpdateOrder={handleUpdateOrder}
                  onDeleteOrder={handleDeleteOrder}
                  onSimulateTick={handleSimulateTick}
                  onUpdateFilament={handleUpdateFilamentStock}
                  onUpdatePrinter={handleUpdatePrinter}
                  viewMode="monitor"
                />
                <PrinterQueueList printers={printers} orders={orders} />
                <ClientsTab
                  clients={clients}
                  printers={printers}
                  orders={orders}
                  onAddClient={handleAddClient}
                  onUpdateClient={handleUpdateClient}
                  onDeleteClient={handleDeleteClient}
                  onAddPrinter={handleAddPrinter}
                  onUpdatePrinter={handleUpdatePrinter}
                  onDeletePrinter={handleDeletePrinter}
                  onAddOrder={handleAddOrder}
                  viewMode="printers"
                  showAddPrinterForm={showAddPrinterFormTab16}
                  onToggleAddPrinterForm={() => setShowAddPrinterFormTab16(v => !v)}
                />
                </>)}
              </div>
            )}
            {currentTab === 17 && <ContabilidadeTab />}
            {currentTab === 19 && (
              <OrcamentosTab clients={clients} orders={orders} setOrders={setOrders} />
            )}
            {currentTab === 20 && <WhatsAppTab />}
          </Suspense>
        )}
          </div>
        )}
      </main>


      {/* OK LOJA VOICE & SMART AI ASSISTANT (v3.2.3.6 Update) */}
      <OkLojaAssistant 
        orders={orders}
        printers={printers}
        clients={clients}
        filamentStocks={filamentStocks}
        brandName={brandConfig.name}
      />

      {/* ONBOARDING DIALOG / WELCOME WIZARD */}
      {showSetupModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto" id="onboarding_modal_overlay">
          <div className="modal-panel p-6 sm:p-8 max-w-2xl w-full text-[var(--brand-text)] flex flex-col gap-6 relative">
            
            <div className="absolute top-4 right-4">
              <span className="chip chip-lime"><span className="dot-live" />Personalização</span>
            </div>

            <div className="space-y-2">
              <div className="eyebrow">Bem-vindo</div>
              <h2 className="text-glow-amber" style={{ fontSize: 'clamp(1.5rem, 1.1rem + 1.6vw, 2.25rem)', lineHeight: 1.05, fontWeight: 800 }}>
                Configure o seu ateliê 3D
              </h2>
              <p className="text-xs text-[var(--brand-text-muted)] leading-relaxed">
                Este aplicativo completo gerencia a sua produção de peças, fila de impressão, estoque de filamentos e cálculo de despesas. 
                Configure o nome da sua marca abaixo. <strong className="text-[var(--cat-lime)]">Você poderá mudar tudo depois em Ajustes.</strong>
              </p>
            </div>

            {/* FORM CONTAINER */}
            <div className="space-y-4">
              
              {/* STORE NAME FIELD */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--brand-muted)]">
                  Nome do seu Ateliê / Loja de Impressão 3D
                </label>
                <input
                  type="text"
                  required
                  value={brandConfig.name}
                  onChange={(e) => setBrandConfig(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-[#0C0E0D] border theme-border px-4 py-3 rounded-2xl text-sm font-bold text-[var(--brand-text)] outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)] transition"
                  placeholder="Ex: Impressões Incríveis, 3D Lab, Ateliê do João..."
                  id="onboarding_input_name"
                />
                <p className="text-[10px] text-[var(--brand-muted)] italic">
                  O nome digitado atualizará instantaneamente o título do aplicativo no cabeçalho em tempo real!
                </p>
              </div>

              {/* APP SYMBOL / LOGOTIPO CHOICES */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--brand-muted)]">
                  Logotipo / Arte do Cabeçalho
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'spool', label: 'Carretel de Fio', desc: 'Visual 3D Puro' },
                    { key: 'extruder', label: 'Bico de Extrusão', desc: 'Estilo Industrial' },
                    { key: 'bambu', label: 'Cubo Geometric', desc: 'Ateliê Oficial' }
                  ].map((ic) => (
                    <button
                      key={ic.key}
                      onClick={() => setBrandConfig(prev => ({ ...prev, icon: ic.key as any }))}
                      className={`p-3 rounded-xl border text-center cursor-pointer transition-all flex flex-col items-center gap-1 justify-center ${
                        brandConfig.icon === ic.key
                          ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 ring-1 ring-[var(--brand-primary)]'
                          : 'border-white/10 bg-black/30 hover:border-white/20'
                      }`}
                    >
                      <span className="text-xs font-bold text-[var(--brand-text)]">{ic.label}</span>
                      <span className="text-[9px] text-[var(--brand-muted)]">{ic.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* FOOTER W/ FINALIZE ACTION */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 pt-4 border-t border-white/10">
              <span className="text-[10.5px] text-[var(--brand-muted)] text-center sm:text-left">
                📦 Todas as simulações, fila e finanças serão mantidas de forma segura no seu navegador.
              </span>
              
              <button
                onClick={() => {
                  if (!brandConfig.name.trim()) {
                    alert('Por favor digite um nome para seu ateliê.');
                    return;
                  }
                  localStorage.setItem('atelier_setup_completed', 'true');
                  localStorage.setItem('bambuzau_brand_config', JSON.stringify(brandConfig));
                  setShowSetupModal(false);
                }}
                className="btn-lime w-full sm:w-auto text-sm flex items-center justify-center gap-1.5"
                id="btn_complete_atelier_setup"
              >
                Concluir & Entrar no Painel 🚀
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}