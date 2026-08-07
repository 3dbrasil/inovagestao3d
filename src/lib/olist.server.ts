// Server-only helpers for the Olist / Tiny ERP integration.
// Supports both API flavours automatically:
//  - Tiny API v3 (Olist ERP novo): Bearer token, JSON REST
//  - Tiny API v2 (legado): token via form-urlencoded, formato=json

export type OlistFlavor = 'v3' | 'v2';

export interface OlistOrderItem {
  sku: string;
  nome: string;
  quantidade: number;
  valorUnitario: number;
}

export interface OlistOrder {
  id: string;
  numero: string;
  data: string;
  situacao: string;
  cliente: string;
  marketplace: string;
  valor: number;
  itens: OlistOrderItem[];
}

export interface OlistProduct {
  id: string;
  sku: string;
  nome: string;
  preco: number;
  precoCusto: number;
  unidade: string;
  saldo: number;
  situacao: string;
}

export interface OlistSnapshot {
  flavor: OlistFlavor;
  syncedAt: number;
  orders: OlistOrder[];
  products: OlistProduct[];
  warnings: string[];
}

const V3_BASE = 'https://api.tiny.com.br/public-api/v3';
const V2_BASE = 'https://api.tiny.com.br/api2';

function num(v: unknown): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string') {
    const cleaned = v.replace(/\./g, '').replace(',', '.');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function str(v: unknown): string {
  return v == null ? '' : String(v);
}

async function v3Get(token: string, path: string, params: Record<string, string> = {}) {
  const url = new URL(`${V3_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* non-json */
  }
  return { ok: res.ok, status: res.status, json, text };
}

function mapV3Order(o: any): OlistOrder {
  return {
    id: str(o?.id),
    numero: str(o?.numeroPedido ?? o?.numero ?? o?.id),
    data: str(o?.dataPedido ?? o?.data ?? ''),
    situacao: str(o?.situacao?.descricao ?? o?.situacao ?? ''),
    cliente: str(o?.cliente?.nome ?? o?.nomeCliente ?? ''),
    marketplace: str(o?.ecommerce?.nome ?? o?.nomeEcommerce ?? o?.canalVenda ?? ''),
    valor: num(o?.valor ?? o?.valorTotal ?? o?.totalPedido),
    itens: Array.isArray(o?.itens)
      ? o.itens.map((it: any) => ({
          sku: str(it?.produto?.sku ?? it?.codigo ?? ''),
          nome: str(it?.produto?.descricao ?? it?.descricao ?? ''),
          quantidade: num(it?.quantidade),
          valorUnitario: num(it?.valorUnitario ?? it?.valor),
        }))
      : [],
  };
}

function mapV3Product(p: any): OlistProduct {
  return {
    id: str(p?.id),
    sku: str(p?.sku ?? p?.codigo ?? ''),
    nome: str(p?.descricao ?? p?.nome ?? ''),
    preco: num(p?.precos?.preco ?? p?.preco),
    precoCusto: num(p?.precos?.precoCusto ?? p?.precoCusto),
    unidade: str(p?.unidade ?? 'UN'),
    saldo: num(p?.saldo ?? p?.estoque?.saldo ?? p?.estoqueAtual),
    situacao: str(p?.situacao ?? ''),
  };
}

async function v2Post(token: string, endpoint: string, extra: Record<string, string> = {}) {
  const body = new URLSearchParams({ token, formato: 'json', ...extra });
  const res = await fetch(`${V2_BASE}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* non-json */
  }
  const retorno = json?.retorno ?? null;
  const okStatus = retorno?.status === 'OK';
  const erro = retorno?.erros?.[0]?.erro ?? retorno?.codigo_erro ?? null;
  return { ok: res.ok && okStatus, status: res.status, retorno, erro: erro ? String(erro) : null };
}

function mapV2Order(p: any): OlistOrder {
  return {
    id: str(p?.id),
    numero: str(p?.numero ?? p?.id),
    data: str(p?.data_pedido ?? ''),
    situacao: str(p?.situacao ?? ''),
    cliente: str(p?.nome ?? p?.cliente?.nome ?? ''),
    marketplace: str(p?.nome_ecommerce ?? p?.ecommerce ?? ''),
    valor: num(p?.valor ?? p?.total_pedido),
    itens: Array.isArray(p?.itens)
      ? p.itens.map((w: any) => {
          const it = w?.item ?? w;
          return {
            sku: str(it?.codigo ?? ''),
            nome: str(it?.descricao ?? ''),
            quantidade: num(it?.quantidade),
            valorUnitario: num(it?.valor_unitario ?? it?.valor),
          };
        })
      : [],
  };
}

function mapV2Product(p: any): OlistProduct {
  return {
    id: str(p?.id),
    sku: str(p?.codigo ?? ''),
    nome: str(p?.nome ?? ''),
    preco: num(p?.preco),
    precoCusto: num(p?.preco_custo ?? p?.preco_custo_medio),
    unidade: str(p?.unidade ?? 'UN'),
    saldo: num(p?.saldo ?? p?.estoque_atual),
    situacao: str(p?.situacao ?? ''),
  };
}

export async function detectFlavor(token: string): Promise<{ flavor: OlistFlavor | null; detail: string }> {
  const v3 = await v3Get(token, '/produtos', { limit: '1' });
  if (v3.ok) return { flavor: 'v3', detail: 'Tiny/Olist API v3 (Bearer)' };

  const v2 = await v2Post(token, 'info.php');
  if (v2.ok) return { flavor: 'v2', detail: 'Tiny API v2 (token)' };

  const v2p = await v2Post(token, 'produtos.pesquisa.php', { pagina: '1' });
  if (v2p.ok) return { flavor: 'v2', detail: 'Tiny API v2 (token)' };

  return {
    flavor: null,
    detail: `v3 respondeu HTTP ${v3.status}; v2 respondeu ${v2.erro || `HTTP ${v2.status}`}`,
  };
}

const MAX_PAGES = 5;

async function fetchOrders(token: string, flavor: OlistFlavor, warnings: string[]): Promise<OlistOrder[]> {
  const out: OlistOrder[] = [];
  if (flavor === 'v3') {
    for (let offset = 0; offset < MAX_PAGES * 100; offset += 100) {
      const r = await v3Get(token, '/pedidos', { limit: '100', offset: String(offset) });
      if (!r.ok) {
        if (offset === 0) warnings.push(`Pedidos: HTTP ${r.status}`);
        break;
      }
      const items = r.json?.itens ?? r.json?.data ?? r.json?.pedidos ?? [];
      if (!Array.isArray(items) || items.length === 0) break;
      out.push(...items.map(mapV3Order));
      if (items.length < 100) break;
    }
  } else {
    for (let pagina = 1; pagina <= MAX_PAGES; pagina++) {
      const r = await v2Post(token, 'pedidos.pesquisa.php', { pagina: String(pagina) });
      if (!r.ok) {
        if (pagina === 1) warnings.push(`Pedidos: ${r.erro || `HTTP ${r.status}`}`);
        break;
      }
      const items = (r.retorno?.pedidos ?? []).map((w: any) => mapV2Order(w?.pedido ?? w));
      out.push(...items);
      const total = Number(r.retorno?.numero_paginas ?? 1);
      if (pagina >= total) break;
    }
  }
  return out;
}

async function fetchProducts(token: string, flavor: OlistFlavor, warnings: string[]): Promise<OlistProduct[]> {
  const out: OlistProduct[] = [];
  if (flavor === 'v3') {
    for (let offset = 0; offset < MAX_PAGES * 100; offset += 100) {
      const r = await v3Get(token, '/produtos', { limit: '100', offset: String(offset) });
      if (!r.ok) {
        if (offset === 0) warnings.push(`Produtos: HTTP ${r.status}`);
        break;
      }
      const items = r.json?.itens ?? r.json?.data ?? r.json?.produtos ?? [];
      if (!Array.isArray(items) || items.length === 0) break;
      out.push(...items.map(mapV3Product));
      if (items.length < 100) break;
    }
  } else {
    for (let pagina = 1; pagina <= MAX_PAGES; pagina++) {
      const r = await v2Post(token, 'produtos.pesquisa.php', { pagina: String(pagina) });
      if (!r.ok) {
        if (pagina === 1) warnings.push(`Produtos: ${r.erro || `HTTP ${r.status}`}`);
        break;
      }
      const items = (r.retorno?.produtos ?? []).map((w: any) => mapV2Product(w?.produto ?? w));
      out.push(...items);
      const total = Number(r.retorno?.numero_paginas ?? 1);
      if (pagina >= total) break;
    }
  }
  return out;
}

async function fillStockV2(token: string, products: OlistProduct[]) {
  const missing = products.filter((p) => !p.saldo && p.id).slice(0, 40);
  for (const p of missing) {
    const r = await v2Post(token, 'produto.obter.estoque.php', { id: p.id });
    if (r.ok) p.saldo = num(r.retorno?.produto?.saldo);
  }
}

export async function buildSnapshot(token: string): Promise<OlistSnapshot> {
  const warnings: string[] = [];
  const { flavor, detail } = await detectFlavor(token);
  if (!flavor) {
    throw new Error(`Não foi possível autenticar na Olist com esse token. ${detail}`);
  }

  const [orders, products] = await Promise.all([
    fetchOrders(token, flavor, warnings),
    fetchProducts(token, flavor, warnings),
  ]);

  if (flavor === 'v2') {
    try {
      await fillStockV2(token, products);
    } catch {
      warnings.push('Não foi possível carregar todos os saldos de estoque.');
    }
  }

  return { flavor, syncedAt: Date.now(), orders, products, warnings };
}