import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshCw, ShoppingBag, Package, TrendingUp, Store, AlertTriangle,
  CheckCircle2, Download, Search,
} from 'lucide-react';
import { olistStatus, olistSync } from '@/lib/olist.functions';
import { safeStorage } from '../utils/storage';
import { groupVariations } from './olist/grouping';
import { OlistImportModal } from './olist/OlistImportModal';

const SNAPSHOT_KEY = 'olist_snapshot_v1';
const CATALOG_KEY = 'bambuzau_local_catalog_production';
const AUTO_SYNC_MS = 30 * 60 * 1000; // 30 min

type OlistOrder = {
  id: string; numero: string; data: string; situacao: string;
  cliente: string; marketplace: string; valor: number;
  itens: { sku: string; nome: string; quantidade: number; valorUnitario: number }[];
};
type OlistProduct = {
  id: string; sku: string; nome: string; preco: number;
  precoCusto: number; unidade: string; saldo: number; situacao: string;
};
type Snapshot = {
  flavor: string; syncedAt: number; orders: OlistOrder[];
  products: OlistProduct[]; warnings: string[];
};

const brl = (n: number) =>
  n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 });

function readSnapshot(): Snapshot | null {
  try {
    const raw = safeStorage.getItem(SNAPSHOT_KEY);
    return raw ? (JSON.parse(raw) as Snapshot) : null;
  } catch {
    return null;
  }
}

const Kpi: React.FC<{ icon: React.ReactNode; label: string; value: string; hint?: string; tone: string }> = ({
  icon, label, value, hint, tone,
}) => (
  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
    <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl opacity-30" style={{ background: tone }} />
    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/45">
      <span style={{ color: tone }}>{icon}</span>
      {label}
    </div>
    <div className="mt-2 text-2xl font-black text-white">{value}</div>
    {hint && <div className="mt-0.5 text-[11px] text-white/40">{hint}</div>}
  </div>
);

export const OlistTab: React.FC = () => {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [status, setStatus] = useState<{ configured: boolean; ok: boolean; detail?: string; flavor?: string | null } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [view, setView] = useState<'PEDIDOS' | 'PRODUTOS' | 'CANAIS'>('PEDIDOS');
  const [query, setQuery] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setSnapshot(readSnapshot());
    olistStatus().then(setStatus).catch(() => setStatus(null));
  }, []);

  const runSync = useCallback(async (silent = false) => {
    setLoading(true);
    if (!silent) { setError(null); setMsg(null); }
    try {
      const snap = (await olistSync()) as Snapshot;
      setSnapshot(snap);
      safeStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snap));
      setStatus((s) => ({ ...(s || { configured: true }), configured: true, ok: true, flavor: snap.flavor }));
      if (!silent) setMsg(`Sincronizado: ${snap.orders.length} pedidos e ${snap.products.length} produtos.`);
    } catch (e: any) {
      if (!silent) setError(e?.message || 'Falha ao sincronizar com a Olist.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Sincronização automática: ao abrir (se dados velhos) e a cada 30 min.
  useEffect(() => {
    const snap = readSnapshot();
    const stale = !snap || Date.now() - snap.syncedAt > AUTO_SYNC_MS;
    if (stale) void runSync(true);
    const t = setInterval(() => void runSync(true), AUTO_SYNC_MS);
    return () => clearInterval(t);
  }, [runSync]);

  const orders = snapshot?.orders || [];
  const products = snapshot?.products || [];

  const stats = useMemo(() => {
    const faturamento = orders.reduce((a, o) => a + (o.valor || 0), 0);
    const canais = new Map<string, { total: number; count: number }>();
    for (const o of orders) {
      const key = o.marketplace?.trim() || 'Venda direta';
      const cur = canais.get(key) || { total: 0, count: 0 };
      cur.total += o.valor || 0;
      cur.count += 1;
      canais.set(key, cur);
    }
    const semEstoque = products.filter((p) => (p.saldo || 0) <= 0).length;
    const valorEstoque = products.reduce((a, p) => a + (p.saldo || 0) * (p.precoCusto || p.preco || 0), 0);
    return {
      faturamento,
      ticket: orders.length ? faturamento / orders.length : 0,
      canais: [...canais.entries()].sort((a, b) => b[1].total - a[1].total),
      semEstoque,
      valorEstoque,
    };
  }, [orders, products]);

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders.slice(0, 300);
    return orders
      .filter((o) => [o.numero, o.cliente, o.marketplace, o.situacao].join(' ').toLowerCase().includes(q))
      .slice(0, 300);
  }, [orders, query]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 300);
    return products.filter((p) => `${p.sku} ${p.nome}`.toLowerCase().includes(q)).slice(0, 300);
  }, [products, query]);

  const groups = useMemo(() => groupVariations(products), [products]);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups.slice(0, 300);
    return groups
      .filter((g) => `${g.baseSku} ${g.nome}`.toLowerCase().includes(q))
      .slice(0, 300);
  }, [groups, query]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black text-white">
            <Store className="h-5 w-5 text-[#b7ff00]" /> Olist / Tiny ERP
          </h2>
          <p className="text-[11px] text-white/45">
            {status
              ? status.configured
                ? status.ok
                  ? `Conectado — ${status.flavor === 'v3' ? 'API v3' : 'API v2'} · sincroniza sozinho a cada 30 min`
                  : `Token salvo, mas a Olist recusou: ${status.detail}`
                : 'Token da Olist ainda não foi salvo.'
              : 'Verificando conexão…'}
            {snapshot ? ` · última sync ${new Date(snapshot.syncedAt).toLocaleString('pt-BR')}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void runSync()}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-[#b7ff00] px-4 py-2 text-xs font-black text-black transition hover:brightness-110 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Sincronizando…' : 'Sincronizar agora'}
          </button>
          <button
            onClick={importToCatalog}
            disabled={!products.length}
            className="flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/10 disabled:opacity-40"
          >
            <Download className="h-4 w-4" /> Importar p/ catálogo
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {msg && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {msg}
        </div>
      )}
      {!!snapshot?.warnings?.length && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
          {snapshot.warnings.join(' · ')}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi icon={<ShoppingBag className="h-3.5 w-3.5" />} label="Pedidos" value={String(orders.length)} tone="#b7ff00" />
        <Kpi icon={<TrendingUp className="h-3.5 w-3.5" />} label="Faturamento" value={brl(stats.faturamento)} tone="#22C55E" />
        <Kpi icon={<TrendingUp className="h-3.5 w-3.5" />} label="Ticket médio" value={brl(stats.ticket)} tone="#3B82F6" />
        <Kpi icon={<Package className="h-3.5 w-3.5" />} label="Produtos" value={String(products.length)} hint={`${stats.semEstoque} sem estoque`} tone="#8B5CF6" />
        <Kpi icon={<Package className="h-3.5 w-3.5" />} label="Valor em estoque" value={brl(stats.valorEstoque)} tone="#D4A017" />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1.5">
          {(['PEDIDOS', 'PRODUTOS', 'CANAIS'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition ${
                view === v ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white'
              }`}
            >
              {v === 'PEDIDOS' ? 'Pedidos & Vendas' : v === 'PRODUTOS' ? 'Produtos & Estoque' : 'Marketplaces'}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-white/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-8 pr-3 text-xs text-white outline-none placeholder:text-white/25 focus:border-[#b7ff00]/50 sm:w-64"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
        {view === 'PEDIDOS' && (
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#0A0D0B] text-[10px] uppercase tracking-wider text-white/40">
                <tr>
                  <th className="px-3 py-2.5">Pedido</th>
                  <th className="px-3 py-2.5">Data</th>
                  <th className="px-3 py-2.5">Cliente</th>
                  <th className="px-3 py-2.5">Canal</th>
                  <th className="px-3 py-2.5">Situação</th>
                  <th className="px-3 py-2.5 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => (
                  <tr key={o.id || o.numero} className="border-t border-white/5 hover:bg-white/[0.03]">
                    <td className="px-3 py-2 font-bold text-white">#{o.numero}</td>
                    <td className="px-3 py-2 text-white/60">{o.data || '—'}</td>
                    <td className="px-3 py-2 text-white/80">{o.cliente || '—'}</td>
                    <td className="px-3 py-2 text-white/60">{o.marketplace || 'Venda direta'}</td>
                    <td className="px-3 py-2 text-white/60">{o.situacao || '—'}</td>
                    <td className="px-3 py-2 text-right font-bold text-[#b7ff00]">{brl(o.valor)}</td>
                  </tr>
                ))}
                {!filteredOrders.length && (
                  <tr><td colSpan={6} className="px-3 py-8 text-center text-white/35">Nenhum pedido carregado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {view === 'PRODUTOS' && (
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-[#0A0D0B] text-[10px] uppercase tracking-wider text-white/40">
                <tr>
                  <th className="px-3 py-2.5">SKU</th>
                  <th className="px-3 py-2.5">Produto</th>
                  <th className="px-3 py-2.5 text-right">Custo</th>
                  <th className="px-3 py-2.5 text-right">Preço</th>
                  <th className="px-3 py-2.5 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p.id || p.sku} className="border-t border-white/5 hover:bg-white/[0.03]">
                    <td className="px-3 py-2 font-mono text-white/60">{p.sku || '—'}</td>
                    <td className="px-3 py-2 text-white/85">{p.nome}</td>
                    <td className="px-3 py-2 text-right text-white/55">{brl(p.precoCusto)}</td>
                    <td className="px-3 py-2 text-right font-bold text-white">{brl(p.preco)}</td>
                    <td className={`px-3 py-2 text-right font-bold ${p.saldo > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {p.saldo}
                    </td>
                  </tr>
                ))}
                {!filteredProducts.length && (
                  <tr><td colSpan={5} className="px-3 py-8 text-center text-white/35">Nenhum produto carregado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {view === 'CANAIS' && (
          <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.canais.map(([nome, v]) => (
              <div key={nome} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <div className="text-xs font-bold text-white">{nome}</div>
                <div className="mt-1 text-lg font-black text-[#b7ff00]">{brl(v.total)}</div>
                <div className="text-[11px] text-white/40">
                  {v.count} pedidos · ticket {brl(v.total / Math.max(1, v.count))}
                </div>
              </div>
            ))}
            {!stats.canais.length && (
              <div className="col-span-full py-8 text-center text-xs text-white/35">Sem vendas por canal ainda.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};