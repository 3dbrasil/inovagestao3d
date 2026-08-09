// Server-only: cria produtos na Olist / Tiny (API v3 e v2).
import { detectFlavor } from './olist.server';

export interface NewOlistProduct {
  nome: string;
  sku: string;
  descricao?: string;
  descricaoComplementar?: string;
  preco: number;
  precoCusto?: number;
  precoPromocional?: number;
  unidade?: string;
  ncm?: string;
  origem?: string;
  gtin?: string;
  marca?: string;
  categoria?: string;
  pesoLiquido?: number; // kg
  pesoBruto?: number; // kg
  largura?: number; // cm
  altura?: number; // cm
  profundidade?: number; // cm
  estoqueInicial?: number;
  estoqueMinimo?: number;
  garantia?: string;
  observacoes?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  imagens?: string[];
}

const V3_BASE = 'https://api.tiny.com.br/public-api/v3';
const V2_BASE = 'https://api.tiny.com.br/api2';

async function createV3(token: string, p: NewOlistProduct) {
  const body: Record<string, unknown> = {
    sku: p.sku,
    descricao: p.nome,
    descricaoComplementar: p.descricaoComplementar || p.descricao || '',
    tipo: 'S',
    situacao: 'A',
    unidade: p.unidade || 'UN',
    origem: Number(p.origem ?? 0),
    ncm: p.ncm || '',
    gtin: p.gtin || '',
    marca: p.marca || '',
    precos: {
      preco: p.preco,
      precoPromocional: p.precoPromocional ?? 0,
      precoCusto: p.precoCusto ?? 0,
    },
    estoque: {
      controlar: true,
      minimo: p.estoqueMinimo ?? 0,
      inicial: p.estoqueInicial ?? 0,
    },
    dimensoes: {
      embalagem: { tipo: 0 },
      largura: p.largura ?? 0,
      altura: p.altura ?? 0,
      comprimento: p.profundidade ?? 0,
      pesoLiquido: p.pesoLiquido ?? 0,
      pesoBruto: p.pesoBruto ?? p.pesoLiquido ?? 0,
    },
    garantia: p.garantia || '',
    observacoes: p.observacoes || '',
    seo: {
      titulo: p.seoTitle || p.nome,
      descricao: p.seoDescription || p.descricao || '',
      keywords: (p.seoKeywords || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    },
    anexos: (p.imagens || []).filter(Boolean).map((url) => ({ url })),
  };

  const res = await fetch(`${V3_BASE}/produtos`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* noop */
  }
  if (!res.ok) {
    const detail =
      json?.mensagem ||
      json?.message ||
      (Array.isArray(json?.erros) ? json.erros.map((e: any) => e?.mensagem || e).join(' · ') : '') ||
      text.slice(0, 300);
    throw new Error(`Olist recusou o produto (HTTP ${res.status}): ${detail || 'sem detalhe'}`);
  }
  return { id: String(json?.id ?? ''), flavor: 'v3' as const };
}

async function createV2(token: string, p: NewOlistProduct) {
  const produto: Record<string, unknown> = {
    sequencia: 1,
    codigo: p.sku,
    nome: p.nome,
    unidade: p.unidade || 'UN',
    preco: p.preco,
    preco_promocional: p.precoPromocional ?? 0,
    preco_custo: p.precoCusto ?? 0,
    ncm: p.ncm || '',
    origem: p.origem ?? '0',
    gtin: p.gtin || '',
    marca: p.marca || '',
    situacao: 'A',
    tipo: 'P',
    class_ipi: '',
    peso_liquido: p.pesoLiquido ?? 0,
    peso_bruto: p.pesoBruto ?? p.pesoLiquido ?? 0,
    estoque_minimo: p.estoqueMinimo ?? 0,
    descricao_complementar: p.descricaoComplementar || p.descricao || '',
    garantia: p.garantia || '',
    obs: p.observacoes || '',
    largura_embalagem: p.largura ?? 0,
    altura_embalagem: p.altura ?? 0,
    comprimento_embalagem: p.profundidade ?? 0,
    seo_title: p.seoTitle || p.nome,
    seo_description: p.seoDescription || p.descricao || '',
    seo_keywords: p.seoKeywords || '',
    anexos: (p.imagens || []).filter(Boolean).map((url) => ({ anexo: url })),
  };

  const payload = { produtos: [{ produto }] };
  const body = new URLSearchParams({
    token,
    formato: 'json',
    produto: JSON.stringify(payload),
  });

  const res = await fetch(`${V2_BASE}/produto.incluir.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* noop */
  }
  const retorno = json?.retorno;
  if (retorno?.status !== 'OK') {
    const erro =
      retorno?.registros?.[0]?.registro?.erros?.[0]?.erro ||
      retorno?.erros?.[0]?.erro ||
      retorno?.codigo_erro ||
      text.slice(0, 300);
    throw new Error(`Olist recusou o produto: ${erro || 'sem detalhe'}`);
  }
  const id = retorno?.registros?.[0]?.registro?.id;
  return { id: String(id ?? ''), flavor: 'v2' as const };
}

export async function createOlistProduct(token: string, p: NewOlistProduct) {
  const { flavor, detail } = await detectFlavor(token);
  if (!flavor) throw new Error(`Não foi possível autenticar na Olist. ${detail}`);
  return flavor === 'v3' ? createV3(token, p) : createV2(token, p);
}