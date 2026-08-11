// Server-only: publica produtos no site Inovastudio (Supabase do outro projeto).

export interface InovaProduct {
  name: string;
  description?: string;
  longDescription?: string;
  price: number;
  promoPrice?: number;
  stock?: number;
  weightGrams?: number;
  categorySlug?: string;
  featured?: boolean;
  /** Primeira imagem (data URL ou http). */
  image?: string;
  /** Demais imagens (data URL ou http). */
  extraImages?: string[];
}

interface Env {
  url: string;
  anon: string;
  email: string;
  password: string;
}

export function readEnv(): Env {
  const url = process.env['INOVASTUDIO_SUPABASE_URL'] || '';
  const anon = process.env['INOVASTUDIO_SUPABASE_ANON_KEY'] || '';
  const email = process.env['INOVASTUDIO_ADMIN_EMAIL'] || '';
  const password = process.env['INOVASTUDIO_ADMIN_PASSWORD'] || '';
  return { url, anon, email, password };
}

export async function signIn(env: Env): Promise<string> {
  if (!env.url || !env.anon || !env.email || !env.password) {
    throw new Error('Credenciais do site Inovastudio não configuradas.');
  }
  const res = await fetch(`${env.url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: env.anon, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: env.email, password: env.password }),
  });
  const json = (await res.json().catch(() => null)) as any;
  if (!res.ok || !json?.access_token) {
    throw new Error(`Login no site falhou (${res.status}): ${json?.error_description || json?.msg || 'verifique a senha do admin'}`);
  }
  return String(json.access_token);
}

function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; mime: string; ext: string } | null {
  const match = /^data:([^;,]+);base64,(.*)$/i.exec(dataUrl);
  if (!match) return null;
  const mime = match[1] || 'image/jpeg';
  const binary = atob(match[2] || '');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const ext = mime.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
  return { bytes, mime, ext };
}

/** Sobe uma imagem (data URL) para o bucket product-images e devolve URL assinada de 1 ano. */
export async function uploadImage(env: Env, token: string, image: string): Promise<string> {
  if (/^https?:\/\//i.test(image)) return image;
  const decoded = dataUrlToBytes(image);
  if (!decoded) return '';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${decoded.ext}`;
  const up = await fetch(`${env.url}/storage/v1/object/product-images/${path}`, {
    method: 'POST',
    headers: {
      apikey: env.anon,
      Authorization: `Bearer ${token}`,
      'Content-Type': decoded.mime,
      'cache-control': '31536000',
    },
    body: new Blob([decoded.bytes], { type: decoded.mime }),
  });
  if (!up.ok) {
    const detail = await up.text().catch(() => '');
    throw new Error(`Falha ao enviar a imagem para o site (${up.status}): ${detail.slice(0, 160)}`);
  }
  const sign = await fetch(`${env.url}/storage/v1/object/sign/product-images/${path}`, {
    method: 'POST',
    headers: { apikey: env.anon, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresIn: 60 * 60 * 24 * 365 }),
  });
  const signed = (await sign.json().catch(() => null)) as any;
  if (!sign.ok || !signed?.signedURL) throw new Error('Não foi possível gerar o link público da imagem.');
  return `${env.url}/storage/v1${signed.signedURL}`;
}

const money = (v: number) =>
  `R$ ${Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export async function createInovaProduct(p: InovaProduct) {
  const env = readEnv();
  const token = await signIn(env);

  const mainImage = p.image ? await uploadImage(env, token, p.image) : '';
  const gallery: string[] = [];
  for (const img of (p.extraImages || []).slice(0, 7)) {
    try {
      const url = await uploadImage(env, token, img);
      if (url) gallery.push(url);
    } catch {
      /* segue com as demais */
    }
  }

  const parts: string[] = [];
  if (p.longDescription) parts.push(p.longDescription);
  if (p.weightGrams) parts.push(`<p><strong>Peso aproximado:</strong> ${p.weightGrams} g</p>`);
  if (gallery.length) {
    parts.push(
      `<div class="galeria">${gallery
        .map((u) => `<img src="${u}" alt="${(p.name || 'Produto').replace(/"/g, '')}" />`)
        .join('')}</div>`,
    );
  }

  const payload = {
    name: p.name,
    description: p.description || '',
    long_description: parts.join('\n'),
    price: money(p.price),
    promo_price: p.promoPrice ? money(p.promoPrice) : '',
    promo_active: false,
    image: mainImage,
    category_slug: p.categorySlug || null,
    featured: !!p.featured,
    stock: p.stock ?? 1,
    sort_order: 0,
  };

  const res = await fetch(`${env.url}/rest/v1/products`, {
    method: 'POST',
    headers: {
      apikey: env.anon,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`O site recusou o produto (${res.status}): ${text.slice(0, 200)}`);
  let id = '';
  try {
    id = String(JSON.parse(text)?.[0]?.id ?? '');
  } catch {
    /* noop */
  }
  return { id, images: (mainImage ? 1 : 0) + gallery.length };
}

export async function inovaHealth() {
  const env = readEnv();
  if (!env.url || !env.anon) return { configured: false, ok: false, detail: 'Site não configurado.' };
  try {
    const token = await signIn(env);
    const res = await fetch(`${env.url}/rest/v1/products?select=id&limit=1`, {
      headers: { apikey: env.anon, Authorization: `Bearer ${token}` },
    });
    return { configured: true, ok: res.ok, detail: res.ok ? 'Conectado ao site Inovastudio.' : `HTTP ${res.status}` };
  } catch (err) {
    return { configured: true, ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}