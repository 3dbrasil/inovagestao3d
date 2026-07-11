import { DollarSign, Clock, Package2, ShoppingBag, Users, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import dashboardHero from "@/assets/dashboard-hero-printer.jpg.asset.json";
import { Kpi as PremiumKpi } from "@/legacy-app/components/DashboardShell";
import { LIME } from "./parts/constants";
import { fmtBRL } from "./parts/utils";
import { Sidebar, TopBar } from "./parts/Chrome";
import { ClientsMap } from "./parts/ClientsMap";
import { ChangelogPanel } from "./parts/Changelog";
import {
  LivePrinters, OrdersList, Hygrometers, StlGallery, StockOverview,
  FilamentQuotes, AiPricing, TopProductsChart, HourlyChart, FinanceSummary,
} from "./parts/cards";
import { usePanelData } from "./parts/usePanelData";

// Re-exports kept for any external importer of the original module.
export { Card, ScrollHint, StatusPill, Kpi } from "./parts/primitives";
export { Sidebar, TopBar } from "./parts/Chrome";
export { ClientsMap } from "./parts/ClientsMap";

export interface Print3DPanelProps {
  orders?: any[];
  printers?: any[];
  filamentStocks?: any[];
  expenses?: any[];
  clients?: any[];
  shoppingItems?: any[];
  tuyaDevices?: any[];
  onSelectTab?: (tab: number) => void;
  topNotification?: any;
}

/* ---------- PANEL (embeddable in legacy app) ---------- */
export function Print3DPanel({
  orders = [],
  printers = [],
  filamentStocks = [],
  expenses = [],
  clients = [],
  tuyaDevices = [],
  onSelectTab,
  topNotification,
}: Print3DPanelProps = {}) {
  const {
    ordersToday, revenueToday, piecesToday, hoursLabel,
    balcaoClientsCount, activePrinters, printersTotal,
    monthRevenue, monthExpenses, monthProfit, monthMargin,
    topProducts, hourly,
  } = usePanelData(orders, printers, expenses, clients);

  const [brandName, setBrandName] = useState<string>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('bambuzau_brand_config') : null;
      return (raw && JSON.parse(raw)?.name) || 'Gestão 3D';
    } catch { return 'Gestão 3D'; }
  });
  useEffect(() => {
    const sync = () => {
      try {
        const raw = localStorage.getItem('bambuzau_brand_config');
        if (raw) setBrandName(JSON.parse(raw)?.name || 'Gestão 3D');
      } catch {}
    };
    window.addEventListener('storage', sync);
    const id = window.setInterval(sync, 1500);
    return () => { window.removeEventListener('storage', sync); window.clearInterval(id); };
  }, []);

  return (
    <div className="space-y-2 text-white">
      {/* Hero + KPI strip — image fades down into dashboard */}
      <div className="relative overflow-hidden rounded-2xl bg-black">
        <div className="relative" style={{ minHeight: "clamp(180px, 22vw, 280px)" }}>
          <img
            src={dashboardHero.url}
            alt="Ateliê 3D em produção"
            className="pointer-events-none absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "center 78%" }}
            loading="lazy"
            decoding="async"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black via-black/55 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-b from-transparent to-black" />

          <div className="relative z-10 flex flex-col justify-between gap-5 p-5 lg:p-7 h-full">
            <div>
              <h1 className="font-bold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] flex flex-wrap items-baseline gap-x-2">
                <span className="text-[22px] lg:text-[26px]">Bem-vindo de volta,</span>
                <span className="text-[30px] lg:text-[38px] font-extrabold text-sky-400 drop-shadow-[0_2px_12px_rgba(56,189,248,0.45)]">{brandName}!</span>
                <span className="inline-block text-[26px]">👋</span>
              </h1>
              <p className="text-[12.5px] lg:text-[13px] text-white/70">Aqui está o resumo da sua produção hoje.</p>
            </div>
          </div>
        </div>

        {topNotification && (
          <div className="relative z-10 bg-black px-0 pb-2">{topNotification}</div>
        )}

        <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 px-0 pt-2 pb-1 bg-black items-stretch">
          <PremiumKpi tone="lime"    icon={ShoppingBag} label="Pedidos Hoje"       value={String(ordersToday.length)} sub={`${activePrinters}/${printersTotal} impressoras`} />
          <PremiumKpi tone="emerald" icon={DollarSign}  label="Faturamento Hoje"   value={fmtBRL(revenueToday)}       sub="receita do dia" />
          <PremiumKpi tone="blue"    icon={Package2}    label="Peças Impressas"    value={String(piecesToday)}        sub="hoje" />
          <PremiumKpi tone="purple"  icon={Clock}       label="Horas de Impressão" value={hoursLabel}                 sub="hoje" />
          <PremiumKpi tone="cyan"    icon={Users}       label="Clientes c/ Estoque" value={String(balcaoClientsCount)} sub="balcão" />
          <PremiumKpi tone="gold"    icon={TrendingUp}  label="Margem do Mês"      value={`${monthMargin.toFixed(1)}%`} sub={fmtBRL(monthProfit)} />
        </div>
      </div>

      {/* Row 2: Mapa | Impressão ao Vivo | Pedidos | Higrômetros */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 [&>*]:h-[260px]">
        <LivePrinters printers={printers} orders={orders} onSelectTab={onSelectTab} />
        <div className="md:col-span-2 xl:col-span-2 h-full [&>*]:h-full">
          <OrdersList orders={orders} clients={clients} onSelectTab={onSelectTab} />
        </div>
        <StockOverview filaments={filamentStocks} onSelectTab={onSelectTab} />
      </div>

      {/* Row 3: STL | Higrômetros | Cotação | IA Precificação */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch [&>*]:min-h-[260px]">
        <div className="md:col-span-2 xl:col-span-1 h-full [&>*]:h-full">
          <StlGallery orders={orders} clients={clients} />
        </div>
        <Hygrometers devices={tuyaDevices} onSelectTab={onSelectTab} />
        <FilamentQuotes onSelectTab={onSelectTab} />
        <AiPricing orders={orders} onSelectTab={onSelectTab} />
      </div>

      {/* Row 4: Top produtos | Receita por dia | Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <TopProductsChart data={topProducts} onSelectTab={onSelectTab} />
        <HourlyChart data={hourly} />
        <FinanceSummary revenue={monthRevenue} expense={monthExpenses} profit={monthProfit} margin={monthMargin} onSelectTab={onSelectTab} />
      </div>

      {/* Row 5: Mapa (mais estreito) + Painel de Atualizações */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-4 items-stretch">
        <section
          id="dashboard-client-map-bottom"
          className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#050908] shadow-[0_28px_80px_-34px_rgba(163,230,53,0.45)]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] bg-[#0a0d0c]/95 px-5 py-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: LIME }}>Aqui embaixo</div>
              <h3 className="text-[18px] font-bold text-white">Mapa de Clientes</h3>
              <p className="text-[11px] text-white/45">{clients.length} clientes cadastrados</p>
            </div>
          </div>
          <div className="relative h-[calc(100vh-120px)] min-h-[720px] w-full bg-[#050908]">
            <div className="absolute inset-0 grid place-items-center text-[12px] text-white/35">Carregando mapa...</div>
            <ClientsMap clients={clients} />
          </div>
        </section>
        <ChangelogPanel />
      </div>
    </div>
  );
}

/* ---------- STANDALONE (with sidebar/topbar) ---------- */
export default function Print3DDashboard() {
  return (
    <div className="min-h-screen bg-[#050908] text-white flex">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar />
        <main className="flex-1 p-6"><Print3DPanel /></main>
      </div>
    </div>
  );
}