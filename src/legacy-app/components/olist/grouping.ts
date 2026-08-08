// Agrupa variações da Olist (cor/tamanho) em um único produto-pai.

export type OlistProductLike = {
  id: string; sku: string; nome: string; preco: number;
  precoCusto: number; unidade: string; saldo: number; situacao: string;
};

export type OlistGroup = {
  key: string;
  baseSku: string;
  nome: string;
  variacoes: OlistProductLike[];
  saldo: number;
  preco: number;
  precoCusto: number;
};

const VARIATION_WORDS = [
  'preto','branco','vermelho','azul','verde','amarelo','laranja','roxo','rosa','cinza','marrom','bege',
  'dourado','prata','prateado','transparente','natural','lilas','turquesa','vinho','ciano','magenta',
  'p','m','g','gg','xg','pp','un','kit','pequeno','medio','grande',
];

const norm = (v: string) =>
  String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

function looksLikeVariation(token: string) {
  const t = norm(token);
  if (!t) return false;
  if (VARIATION_WORDS.includes(t)) return true;
  if (/^\d{1,3}(cm|mm|ml|g|kg)?$/.test(t)) return true;
  if (t.length <= 3 && !/^\d{4,}$/.test(t)) return true;
  return false;
}

/** Remove o sufixo de variação do SKU (ex.: CANECA-001-VERM -> CANECA-001). */
export function baseSkuOf(sku: string) {
  const raw = String(sku || '').trim();
  if (!raw) return '';
  const parts = raw.split(/[-_/]/).filter(Boolean);
  if (parts.length > 1 && looksLikeVariation(parts[parts.length - 1])) parts.pop();
  return parts.join('-');
}

/** Remove o trecho de variação do nome (ex.: "Vaso Espiral - Azul" -> "Vaso Espiral"). */
export function baseNameOf(nome: string) {
  let n = String(nome || '').trim();
  n = n.replace(/\s*\((?:cor|tamanho)[^)]*\)\s*$/i, '');
  const parts = n.split(/\s+[-–|/]\s+/);
  while (parts.length > 1 && looksLikeVariation(parts[parts.length - 1].split(/\s+/).pop() || '')) parts.pop();
  return parts.join(' - ').trim() || n;
}

export function groupVariations(products: OlistProductLike[]): OlistGroup[] {
  const map = new Map<string, OlistGroup>();
  for (const p of products) {
    const bSku = baseSkuOf(p.sku);
    const bName = baseNameOf(p.nome);
    const key = bSku ? `s:${norm(bSku)}` : `n:${norm(bName)}`;
    let g = map.get(key);
    if (!g) {
      g = { key, baseSku: bSku || p.sku || p.id, nome: bName || p.nome, variacoes: [], saldo: 0, preco: 0, precoCusto: 0 };
      map.set(key, g);
    }
    g.variacoes.push(p);
    g.saldo += Number(p.saldo) || 0;
    g.preco = Math.max(g.preco, Number(p.preco) || 0);
    g.precoCusto = Math.max(g.precoCusto, Number(p.precoCusto) || 0);
  }
  return [...map.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}
