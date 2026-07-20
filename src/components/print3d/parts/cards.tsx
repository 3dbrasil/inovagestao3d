import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight, Printer as PrinterIcon, Droplets, Box,
  Package2, TrendingUp, TrendingDown, Receipt,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, LabelList,
} from "recharts";
import { FilamentSpool, materialColor } from "@/legacy-app/components/FilamentSpool";
import { Card, ScrollHint, StatusPill } from "./primitives";
import { LIME, LIME_DIM, STATUS_LABEL, ORDER_STATUS_LABEL } from "./constants";
import { colorHex, fmtBRL, getPrinterLogo, readLocalCatalog } from "./utils";

/* ---------- Live printers ---------- */
export function LivePrinters({
  printers = [], orders = [], onSelectTab,
}: { printers?: any[]; orders?: any[]; onSelectTab?: (t: number) => void }) {
  const rows = (printers.length ? printers : []).slice(0, 6).map((p: any) => {
    const activeOrder = orders.find(
      (o: any) => o.assignedPrinterId === p.id && (o.status === "PRINTING" || o.status === "QUEUE"),
    );
    const pct = Math.round(((p.printProgress ?? (activeOrder?.printingProgress ?? 0)) || 0) * (p.printProgress > 1 ? 1 : 100));
    const material = activeOrder
      ? `${activeOrder.filamentType} — ${activeOrder.filamentColor}`
      : STATUS_LABEL[p.status] || "—";
    const remainingH = activeOrder ? activeOrder.printTimeHours * (1 - (activeOrder.printingProgress || 0)) : 0;
    const remaining = activeOrder
      ? `${Math.floor(remainingH)}h ${Math.round((remainingH % 1) * 60)}m restantes`
      : (p.status === "PRINTING" ? "em andamento" : "—");
    return {
      name: p.name || p.model, model: p.model || "", customUrl: p.customUrl,
      material, remaining, pct: Math.max(0, Math.min(100, pct)),
      isPrinting: p.status === "PRINTING",
    };
  });
  return (
    <Card glow="#38bdf8" className="flex flex-col overflow-hidden">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-[14px] font-semibold text-white">Impressão ao Vivo</h3>
        <span className="text-[10px] text-white/45 tabular-nums">
          {printers.filter((p: any) => p.status === "PRINTING").length}/{printers.length} ativas
        </span>
      </div>
      <p className="text-[11px] text-white/45 mb-4">Acompanhe suas impressões em tempo real</p>
      {rows.length === 0 && (
        <div className="text-[12px] text-white/40 py-6 text-center">Nenhuma impressora cadastrada.</div>
      )}
      <ScrollHint>
        <ul className="space-y-3">
          {rows.map((p, i) => (
            <li
              key={i}
              role="button"
              tabIndex={0}
              onClick={() => onSelectTab?.(16)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectTab?.(16); } }}
              className="flex items-center gap-3 group cursor-pointer rounded-lg -mx-1 px-1 py-1 hover:bg-white/[0.03] transition"
            >
              <div
                className={`size-10 rounded-lg overflow-hidden bg-white/[0.03] shrink-0 relative border-2 ${p.isPrinting ? 'border-emerald-400' : 'border-red-500'}`}
                style={{ boxShadow: p.isPrinting ? '0 0 10px rgba(16,185,129,0.55)' : '0 0 10px rgba(239,68,68,0.5)' }}
              >
                <img
                  src={getPrinterLogo(p.model, p.customUrl)}
                  alt={p.name}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
                <PrinterIcon className="size-5 text-white/70 absolute inset-0 m-auto" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-[12.5px] font-semibold text-white truncate">{p.name}</div>
                  <div className="text-[11px] text-white/55 tabular-nums shrink-0">{p.remaining}</div>
                </div>
                <div className="text-[10.5px] text-white/40 mb-1">{p.material}</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full bg-white/[0.05] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${p.pct}%`, background: `linear-gradient(90deg,${LIME_DIM},${LIME})`, boxShadow: `0 0 8px ${LIME}66` }}
                    />
                  </div>
                  <div className="text-[10.5px] font-semibold tabular-nums w-9 text-right" style={{ color: LIME }}>{p.pct}%</div>
                </div>
              </div>
              <ChevronRight className="size-4 text-white/25 group-hover:text-white/60 transition" />
            </li>
          ))}
        </ul>
      </ScrollHint>
    </Card>
  );
}

/* ---------- Orders list ---------- */
export function OrdersList({
  orders = [], clients = [], onSelectTab,
}: { orders?: any[]; clients?: any[]; onSelectTab?: (t: number) => void }) {
  const rows = orders
    .filter((o: any) => o.status !== "DELIVERED")
    .slice()
    .sort((a: any, b: any) => (a.deadline || 0) - (b.deadline || 0))
    .slice(0, 14);
  const cityById: Record<number, string> = {};
  clients.forEach((c: any) => (cityById[c.id] = (c.address || "").split(",").pop()?.trim() || ""));
  return (
    <Card glow="#f0c674" className="flex flex-col overflow-hidden cursor-pointer transition" onClick={() => onSelectTab?.(1)}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[14px] font-semibold text-white">Pedidos a Serem Entregues</h3>
        <button className="text-[11px] text-white/50 hover:text-white" onClick={(e) => { e.stopPropagation(); onSelectTab?.(1); }}>Ver todos</button>
      </div>
      {rows.length === 0 && (
        <div className="text-[12px] text-white/40 py-6 text-center">Sem pedidos pendentes.</div>
      )}
      <ScrollHint>
        <ul className="divide-y divide-white/[0.04]">
          {rows.map((o: any) => {
            const isPrinting = o.status === "PRINTING";
            const pct = isPrinting ? Math.max(2, Math.round((o.printingProgress || 0) * 100)) : 0;
            return (
              <li key={o.id} className="flex items-center gap-2 py-1.5 text-[11.5px]">
                <span className="font-mono text-white/40 text-[10px] w-7 shrink-0">#{o.id}</span>
                <div className="min-w-0 flex-1 flex items-center gap-1.5">
                  <span className="text-white font-medium truncate">{o.itemName || "—"}</span>
                  {o.clientName && (
                    <span className="text-white/40 truncate hidden sm:inline">· {o.clientName}</span>
                  )}
                </div>
                {isPrinting && (
                  <div className="flex items-center gap-1.5 shrink-0 w-[90px]">
                    <div className="flex-1 h-1 rounded-full bg-white/[0.05] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#b7ff00] transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono font-bold tabular-nums text-emerald-300 w-7 text-right">{pct}%</span>
                  </div>
                )}
                <span className="text-white/40 tabular-nums hidden md:inline text-[10px] shrink-0">
                  {o.deadline ? new Date(o.deadline).toLocaleDateString("pt-BR") : "—"}
                </span>
                <StatusPill s={ORDER_STATUS_LABEL[o.status] || o.status} />
              </li>
            );
          })}
        </ul>
      </ScrollHint>
    </Card>
  );
}

/* ---------- Hygrometers ---------- */
export function Hygrometers({
  devices = [], onSelectTab,
}: { devices?: any[]; onSelectTab?: (t: number) => void }) {
  const tone = (h: number) => {
    if (h < 30) return { color: "#38bdf8", label: "Ideal", bg: "rgba(56,189,248,0.12)", border: "rgba(56,189,248,0.32)" };
    if (h <= 45) return { color: "#fbbf24", label: "Atenção", bg: "rgba(251,191,36,0.12)", border: "rgba(251,191,36,0.32)" };
    return { color: "#fb7185", label: "Crítico", bg: "rgba(251,113,133,0.12)", border: "rgba(251,113,133,0.32)" };
  };
  return (
    <Card glow="#38bdf8" className="cursor-pointer transition" onClick={() => onSelectTab?.(5)}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[14px] font-semibold text-white">Higrômetros</h3>
        <span className="text-[10px] text-white/40 tabular-nums">{devices.length}</span>
      </div>
      <p className="text-[11px] text-white/45 mb-4">Umidade das estufas</p>
      {devices.length === 0 && (
        <div className="text-[12px] text-white/40 py-6 text-center">Nenhum higrômetro configurado.</div>
      )}
      <ul className="space-y-3">
        {devices.map((dev: any) => {
          const h = Number(dev.currentHumidity ?? 0);
          const t = tone(h);
          const pct = Math.max(2, Math.min(100, h));
          return (
            <li key={dev.id} className="p-2.5 rounded-lg border" style={{ background: t.bg, borderColor: t.border }}>
              <div className="flex items-center gap-2.5 mb-1.5">
                <div
                  className="size-8 rounded-lg grid place-items-center shrink-0"
                  style={{ background: `${t.color}22`, border: `1px solid ${t.color}55` }}
                >
                  <Droplets className="size-4" style={{ color: t.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-semibold text-white truncate">{dev.name}</div>
                  {dev.temperature != null && (
                    <div className="text-[10px] text-white/45 tabular-nums">{Number(dev.temperature).toFixed(1)}°C</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-[16px] font-bold tabular-nums leading-none" style={{ color: t.color }}>{h.toFixed(1)}%</div>
                  <div className="text-[9px] uppercase tracking-wider mt-0.5" style={{ color: t.color }}>{t.label}</div>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: t.color, boxShadow: `0 0 10px ${t.color}88` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/* ---------- STL gallery ---------- */
export function StlGallery({ orders = [], clients = [] }: { orders?: any[]; clients?: any[] }) {
  const stockImageByName: Record<string, string | undefined> = {};
  const stockQtyByName: Record<string, number> = {};
  const registeredNames = new Set<string>();
  const catalog = readLocalCatalog();
  catalog.forEach((c: any) => {
    const key = String(c?.name || "").toLowerCase().trim();
    if (key) registeredNames.add(key);
  });
  clients.forEach((c: any) => {
    (c?.productsStock || []).forEach((p: any) => {
      const key = String(p?.name || "").toLowerCase().trim();
      if (key && p?.imageUrl && !stockImageByName[key]) stockImageByName[key] = p.imageUrl;
      if (key) stockQtyByName[key] = (stockQtyByName[key] || 0) + Number(p?.qty || 0);
    });
  });
  catalog.forEach((c: any) => {
    const key = String(c?.name || "").toLowerCase().trim();
    if (key && c?.imageUrl && !stockImageByName[key]) stockImageByName[key] = c.imageUrl;
    if (key && c?.stockCount != null && stockQtyByName[key] == null)
      stockQtyByName[key] = Number(c.stockCount) || 0;
  });
  const orderItems = orders
    .filter((o: any) => registeredNames.has(String(o?.itemName || "").toLowerCase().trim()))
    .map((o: any) => {
      const key = String(o?.itemName || "").toLowerCase().trim();
      const qty = stockQtyByName[key];
      return {
        name: o.itemName,
        ts: o.createdAt || 0,
        date: o.createdAt ? new Date(o.createdAt).toLocaleDateString("pt-BR") : "",
        mat: `${o.filamentType ?? ""}${o.filamentColor ? ` — ${o.filamentColor}` : ""}`,
        stockQty: qty,
        imageUrl: o.imageUrl || stockImageByName[key],
        source: "Pedido",
      };
    });
  const stockItems: any[] = [];
  clients.forEach((c: any) => {
    (c?.productsStock || []).forEach((p: any) => {
      const key = String(p?.name || "").toLowerCase().trim();
      if (!registeredNames.has(key)) return;
      stockItems.push({
        name: p.name,
        ts: p.addedAt || p.createdAt || 0,
        date: "",
        mat: `Estoque · ${p.qty ?? 0}un`,
        imageUrl: p.imageUrl,
        source: "Estoque",
      });
    });
  });
  catalog.forEach((c: any) => {
    if (!c?.name) return;
    const qty = Number(c.stockCount ?? 0);
    stockItems.push({
      name: c.name,
      ts: c.updatedAt || c.createdAt || 0,
      date: "",
      mat: `Estoque · ${qty}un`,
      imageUrl: c.imageUrl,
      source: "Estoque",
    });
  });
  const items = [...orderItems, ...stockItems].sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 10);
  return (
    <Card glow="#f0c674">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-semibold text-white">Últimas Peças Impressas</h3>
        <button className="text-[11px] text-white/50 hover:text-white">Ver todos</button>
      </div>
      {items.length === 0 && (
        <div className="text-[12px] text-white/40 py-6 text-center">Sem peças recentes.</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((s, i) => (
          <div key={i} className="group cursor-pointer">
            <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/[0.05] grid place-items-center mb-2 group-hover:border-white/15 transition relative overflow-hidden">
              {s.imageUrl ? (
                <img src={s.imageUrl} alt={s.name} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <Box className="size-16 text-white/30 group-hover:scale-110 transition" />
              )}
              {s.source !== "Estoque" && (
                <div
                  className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9.5px] font-semibold uppercase tracking-wider"
                  style={{ background: "rgba(0,0,0,0.55)", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  {s.source}
                </div>
              )}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition"
                style={{ background: `radial-gradient(circle at center, ${LIME}15, transparent 70%)` }}
              />
            </div>
            <div className="text-[11.5px] font-medium text-white truncate">{s.name}</div>
            <div className="text-[10px] text-white/40 tabular-nums">{s.date}</div>
            <div className="text-[10px] text-white/40">{s.mat}</div>
            {s.source === "Pedido" && s.stockQty != null && (
              <div className="text-[10px] font-semibold" style={{ color: LIME }}>
                Estoque · {s.stockQty}un
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------- Stock overview ---------- */
export function StockOverview({
  filaments = [], onSelectTab,
}: { filaments?: any[]; onSelectTab?: (t: number) => void }) {
  const items = filaments
    .filter((f: any) => f.stockGrams < f.minStockGrams * 1.5)
    .slice()
    .sort((a: any, b: any) => a.stockGrams / Math.max(1, a.minStockGrams) - b.stockGrams / Math.max(1, b.minStockGrams))
    .slice(0, 5)
    .map((f: any) => ({
      name: `${f.type} ${f.color}`,
      type: f.type,
      color: f.color,
      qty: `${(f.stockGrams / 1000).toFixed(2)}kg`,
      level: f.stockGrams < f.minStockGrams ? "Crítico" : "Atenção",
    }));
  return (
    <Card glow="#fb7185" className="relative overflow-hidden flex flex-col cursor-pointer transition" onClick={() => onSelectTab?.(4)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[14px] font-semibold text-white">Estoque Crítico</h3>
        <button className="text-[11px] text-white/50 hover:text-white" onClick={(e) => { e.stopPropagation(); onSelectTab?.(4); }}>Ver todos</button>
      </div>
      {items.length === 0 ? (
        <div className="text-[12px] text-white/40 py-3 text-center">Tudo em ordem.</div>
      ) : (
        <ScrollHint>
          <ul className="space-y-2">
            {items.map((c, i) => (
              <li key={i} className={`flex items-center gap-3 p-2 rounded-lg border hover:bg-white/[0.03] transition ${c.level === "Crítico" ? "border-rose-500/60 bg-rose-500/[0.04]" : "border-white/10"}`}>
                <FilamentSpool type={c.type} color={colorHex(c.color)} size={28} className="shrink-0" label={c.name} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-white truncate flex items-center gap-1.5">
                    <span
                      className="inline-block size-2 rounded-full shrink-0 ring-1 ring-white/15"
                      style={{ background: colorHex(c.color) }}
                      aria-hidden
                    />
                    <span className="text-white/70 truncate">{c.color}</span>
                  </div>
                  <div className="text-[10px] text-white/40 tabular-nums">{c.qty}</div>
                </div>
                <span className={`text-[10px] font-semibold ${c.level === "Crítico" ? "text-rose-400" : "text-amber-300"}`}>{c.level}</span>
              </li>
            ))}
          </ul>
        </ScrollHint>
      )}
    </Card>
  );
}

/* ---------- SerpAPI quotes hook ---------- */
function useSerpQuotes() {
  const [groups, setGroups] = useState<any[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>("");
  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem("bambuzau_cached_quotes");
        setGroups(raw ? JSON.parse(raw) : []);
        setUpdatedAt(localStorage.getItem("bambuzau_last_quotes_update") || "");
      } catch { setGroups([]); }
    };
    load();
    const onUpd = () => load();
    window.addEventListener("bambuzau_quotes_updated", onUpd);
    return () => window.removeEventListener("bambuzau_quotes_updated", onUpd);
  }, []);
  return { groups, updatedAt };
}

/* ---------- Filament quotes ---------- */
export function FilamentQuotes({ onSelectTab }: { onSelectTab?: (t: number) => void } = {}) {
  const { groups, updatedAt } = useSerpQuotes();
  const rows = (groups || []).slice(0, 6).map((g: any) => {
    const offers = Array.isArray(g.offers) ? g.offers : [];
    const prices = offers.map((o: any) => Number(o.price) || 0).filter((n: number) => n > 0);
    const avg = prices.length ? prices.reduce((a: number, b: number) => a + b, 0) / prices.length : 0;
    const min = prices.length ? Math.min(...prices) : 0;
    const cheapest = prices.length
      ? offers.reduce((best: any, o: any) => (Number(o.price) > 0 && (!best || Number(o.price) < Number(best.price)) ? o : best), null as any)
      : null;
    return { name: g.type || "—", price: avg, min, count: offers.length, cheapest };
  });
  const openQuotation = () => {
    try { localStorage.setItem("bambuzau_costs_subtab_override", "QUOTE"); } catch {}
    try { window.dispatchEvent(new CustomEvent("navigate-costs-subtab", { detail: "QUOTE" })); } catch {}
    try { window.dispatchEvent(new CustomEvent("costs_set_subtab", { detail: "QUOTE" })); } catch {}
    onSelectTab?.(4);
  };
  return (
    <Card glow="#047857" className="cursor-pointer transition" onClick={openQuotation}>
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="text-[14px] font-semibold text-white">Cotação de Filamentos</h3>
        <span className="text-[10px] text-emerald-300/80">Menor preço</span>
      </div>
      <p className="text-[11px] text-white/45 mb-4">{updatedAt ? `Atualizado em ${updatedAt}` : "Aguardando primeira sincronização…"}</p>
      {rows.length === 0 && (
        <div className="text-[12px] text-white/40 py-6 text-center">Sem cotações ainda.</div>
      )}
      <ul className="space-y-2.5">
        {rows.map((q, i) => (
          <li
            key={i}
            className="flex items-center gap-3 text-[12.5px] rounded-md px-1 -mx-1 hover:bg-white/[0.04] transition"
            onClick={(e) => { e.stopPropagation(); if (q.cheapest?.buyUrl) window.open(q.cheapest.buyUrl, "_blank", "noopener"); else openQuotation(); }}
            title={q.cheapest?.productName || "Ver cotação"}
          >
            <FilamentSpool type={q.name} color={materialColor(q.name)} size={28} className="shrink-0" label={q.name} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white truncate">{q.name}</div>
              {q.cheapest?.storeName && (
                <div className="text-[10px] text-white/45 truncate">{q.cheapest.storeName}</div>
              )}
            </div>
            <div className="text-right">
              <div className="text-emerald-300 font-bold tabular-nums text-[13px]">
                {q.min ? `R$ ${q.min.toFixed(2)}` : "—"}
              </div>
              <div className="text-[9px] text-white/40 uppercase tracking-wider">
                {q.count ? `${q.count} of.` : "sem oferta"}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ---------- AI pricing ---------- */
export function AiPricing({ orders = [], onSelectTab }: { orders?: any[]; onSelectTab?: (t: number) => void }) {
  const sample = orders.filter((o: any) => (o?.priceCharged || 0) > 0);
  const getCost = (o: any) =>
    Number(o?.cost ?? o?.totalCost ?? o?.productionCost ?? o?.filamentCost ?? 0);
  const totalPrice = sample.reduce((s, o) => s + Number(o.priceCharged || 0), 0);
  const totalCost = sample.reduce((s, o) => s + getCost(o), 0);
  const n = sample.length;
  const avgCost = n ? totalCost / n : 0;
  const avgPrice = n ? totalPrice / n : 0;
  const margin = avgPrice > 0 ? Math.max(0, Math.min(100, ((avgPrice - avgCost) / avgPrice) * 100)) : 0;
  const marginRounded = Math.round(margin);
  const suggested = avgCost > 0 ? avgCost / 0.35 : avgPrice;
  const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const data = [{ name: "m", value: marginRounded }, { name: "r", value: 100 - marginRounded }];
  const openCalc = () => {
    try { localStorage.setItem("bambuzau_costs_subtab_override", "CALC"); } catch {}
    window.dispatchEvent(new CustomEvent("navigate-costs-subtab", { detail: "CALC" }));
    window.dispatchEvent(new CustomEvent("costs_set_subtab", { detail: "CALC" }));
  };
  const indicators = (() => {
    const demanda = n >= 20 ? "Alta" : n >= 5 ? "Média" : "Baixa";
    const dc = demanda === "Alta" ? LIME : demanda === "Média" ? "#fbbf24" : "#fb7185";
    const margemLabel = margin >= 55 ? "Saudável" : margin >= 35 ? "Ok" : "Baixa";
    const mc = margin >= 55 ? LIME : margin >= 35 ? "#fbbf24" : "#fb7185";
    const ticket = avgPrice;
    const tLabel = ticket >= 50 ? "Alto" : ticket >= 20 ? "Médio" : "Baixo";
    const tc = ticket >= 50 ? LIME : ticket >= 20 ? "#fbbf24" : "#fb7185";
    return [
      { l: "Demanda", v: demanda, c: dc },
      { l: "Margem", v: margemLabel, c: mc },
      { l: "Ticket médio", v: tLabel, c: tc },
    ];
  })();
  return (
    <Card glow="#a78bfa" className="cursor-pointer transition hover:border-white/[0.12]" onClick={openCalc}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[14px] font-semibold text-white">IA de Precificação</h3>
        <button
          className="text-[11px] text-white/50 hover:text-white"
          onClick={(e) => { e.stopPropagation(); openCalc(); }}
        >
          Abrir
        </button>
      </div>
      <p className="text-[11px] text-white/45 mb-4">
        {n > 0 ? `Média de ${n} ${n === 1 ? "pedido" : "pedidos"} com preço` : "Sem pedidos com preço ainda"}
      </p>
      <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-4">
        <div>
          <div className="text-[10px] text-white/45">Custo atual</div>
          <div className="text-[18px] font-bold text-white tabular-nums">R$ {fmt(avgCost)}</div>
        </div>
        <div>
          <div className="text-[10px] text-white/45">Preço sugerido</div>
          <div className="text-[18px] font-bold tabular-nums" style={{ color: LIME }}>R$ {fmt(suggested)}</div>
        </div>
        <div className="relative size-[78px]">
          <ResponsiveContainer width="100%" height="100%" debounce={80}>
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={26} outerRadius={36} startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}>
                <Cell fill={LIME} />
                <Cell fill="rgba(255,255,255,0.06)" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-[13px] font-bold tabular-nums" style={{ color: LIME }}>{marginRounded}%</div>
              <div className="text-[8px] text-white/40">margem</div>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/[0.04]">
        {indicators.map((x, i) => (
          <div key={i}>
            <div className="text-[10px] text-white/40">{x.l}</div>
            <div className="text-[12px] font-semibold flex items-center gap-1.5" style={{ color: x.c }}>
              <span className="size-1.5 rounded-full" style={{ background: x.c }} />{x.v}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------- Top selling products ---------- */
export function TopProductsChart({
  data = [], onSelectTab,
}: {
  data?: Array<{ name: string; sales: number; trend: number; image?: string }>;
  onSelectTab?: (t: number) => void;
}) {
  return (
    <Card glow="#a78bfa" className="cursor-pointer transition" onClick={() => onSelectTab?.(6)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-semibold text-white">Produtos Mais Vendidos</h3>
        <button className="text-[11px] text-white/50 hover:text-white" onClick={(e) => { e.stopPropagation(); onSelectTab?.(6); }}>Ver todos</button>
      </div>
      {data.length === 0 && <div className="text-[12px] text-white/40 py-6 text-center">Sem vendas neste mês.</div>}
      <ul className="divide-y divide-white/[0.04]">
        {data.map((d, i) => {
          const up = d.trend >= 0;
          const trendColor = up ? LIME : "#fb7185";
          return (
            <li key={i} className="flex items-center gap-3 py-2.5">
              <div className="size-12 rounded-xl overflow-hidden bg-white/[0.04] border border-white/[0.06] shrink-0 grid place-items-center">
                {d.image ? (
                  <img src={d.image} alt={d.name} className="w-full h-full object-cover" />
                ) : (
                  <Package2 className="size-5 text-white/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-white truncate">{d.name}</div>
                <div className="text-[11px] text-white/45 tabular-nums">{d.sales} {d.sales === 1 ? "venda" : "vendas"}</div>
              </div>
              <div className="flex items-center gap-1 text-[12px] font-semibold tabular-nums shrink-0" style={{ color: trendColor }}>
                {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                {up ? "+" : ""}{d.trend}%
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/* ---------- Hourly chart ---------- */
export function HourlyChart({ data }: { data?: Array<{ h: string; v: number }> }) {
  const fallback = useMemo(
    () => ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((h) => ({ h, v: 0 })),
    [],
  );
  const chartData = data && data.length ? data : fallback;
  return (
    <Card glow="#047857">
      <h3 className="text-[14px] font-semibold text-white">Faturamento por Dia da Semana</h3>
      <p className="text-[11px] text-white/45 mb-3">Receita acumulada por dia da semana no mês</p>
      <div className="h-[180px] -mx-2 min-w-0">
        <ResponsiveContainer width="100%" height="100%" debounce={80}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={LIME} stopOpacity={0.45} />
                <stop offset="100%" stopColor={LIME} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="h" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ background: "#0f1311", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: "#fff" }}
              formatter={(v: any) => [fmtBRL(Number(v) || 0), "Faturamento"]}
            />
            <Area
              type="monotone" dataKey="v" stroke={LIME} strokeWidth={2} fill="url(#g1)"
              dot={{ r: 3, fill: LIME, stroke: "#0a0d0c", strokeWidth: 1 }} isAnimationActive={false}
            >
              <LabelList
                dataKey="v"
                position="top"
                formatter={(v: any) => {
                  const n = Number(v) || 0;
                  if (n === 0) return "";
                  if (n >= 1000) return `R$ ${(n / 1000).toFixed(1)}k`;
                  return `R$ ${n.toFixed(0)}`;
                }}
                fill="#fff"
                fontSize={10}
              />
            </Area>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

/* ---------- Finance summary ---------- */
export function FinanceSummary({
  revenue = 0, expense = 0, profit = 0, margin = 0, onSelectTab,
}: { revenue?: number; expense?: number; profit?: number; margin?: number; onSelectTab?: (t: number) => void }) {
  const m = Math.max(0, Math.min(100, Math.round(margin)));
  const data = [{ v: m }, { v: 100 - m }];
  const rows = [
    { ic: Receipt, l: "Faturamento (mês)", v: fmtBRL(revenue), c: "text-emerald-400" },
    { ic: TrendingDown, l: "Gastos (mês)", v: fmtBRL(expense), c: "text-rose-400" },
    { ic: TrendingUp, l: "Lucro líquido (mês)", v: fmtBRL(profit), c: profit >= 0 ? "text-emerald-400" : "text-rose-400" },
  ];
  return (
    <Card glow="#047857">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-semibold text-white">Resumo Financeiro</h3>
        <button className="text-[11px] text-white/50 hover:text-white" onClick={() => onSelectTab?.(5)}>Ver todos</button>
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
        <ul className="space-y-3">
          {rows.map((r, i) => {
            const Ic = r.ic;
            return (
              <li key={i} className="flex items-center gap-3 text-[12.5px]">
                <div className="size-8 rounded bg-white/[0.04] grid place-items-center"><Ic className="size-4 text-white/60" /></div>
                <div className="flex-1 text-white/70">{r.l}</div>
                <div className={`text-white font-semibold tabular-nums ${r.c}`}>{r.v}</div>
              </li>
            );
          })}
        </ul>
        <div className="relative size-[110px]">
          <ResponsiveContainer width="100%" height="100%" debounce={80}>
            <PieChart>
              <Pie data={data} dataKey="v" innerRadius={38} outerRadius={52} startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}>
                <Cell fill={LIME} />
                <Cell fill="rgba(255,255,255,0.06)" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-[20px] font-bold tabular-nums" style={{ color: LIME }}>{m}%</div>
              <div className="text-[9px] text-white/45">Margem de<br/>lucro</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}