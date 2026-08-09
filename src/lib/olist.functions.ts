import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

export const olistStatus = createServerFn({ method: 'GET' }).handler(async () => {
  const token = process.env['OLIST_API_TOKEN'];
  if (!token) return { configured: false, ok: false, detail: 'Token da Olist ainda não foi salvo.' };
  const { detectFlavor } = await import('./olist.server');
  const { flavor, detail } = await detectFlavor(token);
  return { configured: true, ok: !!flavor, flavor, detail };
});

export const olistSync = createServerFn({ method: 'POST' }).handler(async () => {
  const token = process.env['OLIST_API_TOKEN'];
  if (!token) throw new Error('Token da Olist ainda não foi salvo nas configurações seguras.');
  const { buildSnapshot } = await import('./olist.server');
  return await buildSnapshot(token);
});

const NewProductInput = z.object({
  nome: z.string().min(1).max(200),
  sku: z.string().min(1).max(60),
  descricao: z.string().max(6000).optional(),
  descricaoComplementar: z.string().max(20000).optional(),
  preco: z.number().nonnegative(),
  precoCusto: z.number().nonnegative().optional(),
  precoPromocional: z.number().nonnegative().optional(),
  unidade: z.string().max(10).optional(),
  ncm: z.string().max(20).optional(),
  origem: z.string().max(2).optional(),
  gtin: z.string().max(20).optional(),
  marca: z.string().max(80).optional(),
  categoria: z.string().max(120).optional(),
  pesoLiquido: z.number().nonnegative().optional(),
  pesoBruto: z.number().nonnegative().optional(),
  largura: z.number().nonnegative().optional(),
  altura: z.number().nonnegative().optional(),
  profundidade: z.number().nonnegative().optional(),
  estoqueInicial: z.number().optional(),
  estoqueMinimo: z.number().optional(),
  garantia: z.string().max(80).optional(),
  observacoes: z.string().max(2000).optional(),
  seoTitle: z.string().max(200).optional(),
  seoDescription: z.string().max(500).optional(),
  seoKeywords: z.string().max(500).optional(),
  imagens: z.array(z.string().max(2000)).max(8).optional(),
});

export const olistCreateProduct = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => NewProductInput.parse(input))
  .handler(async ({ data }) => {
    const token = process.env['OLIST_API_TOKEN'];
    if (!token) throw new Error('Token da Olist ainda não foi salvo nas configurações seguras.');
    const { createOlistProduct } = await import('./olist-create.server');
    return await createOlistProduct(token, data);
  });

const DraftInput = z.object({
  titulo: z.string().max(300).optional(),
  imagem: z.string().max(6_000_000).optional(),
  contexto: z.string().max(2000).optional(),
});

const FIELD_SPEC = `{
  "nome": "título comercial curto e vendedor (até 80 caracteres)",
  "sku": "código único MAIÚSCULO com letras/números/hífen",
  "descricao": "descrição curta de 1 linha",
  "descricaoComplementar": "descrição completa em HTML simples com bullets, benefícios e especificações",
  "preco": number (BRL sugerido de venda),
  "precoCusto": number (custo estimado de produção em impressão 3D),
  "unidade": "UN",
  "ncm": "NCM de 8 dígitos mais provável (peças plásticas impressas normalmente 39269090)",
  "origem": "0",
  "marca": "marca sugerida",
  "categoria": "categoria de marketplace",
  "pesoLiquido": number em kg,
  "pesoBruto": number em kg,
  "largura": number em cm,
  "altura": number em cm,
  "profundidade": number em cm,
  "estoqueMinimo": number,
  "garantia": "ex: 90 dias",
  "seoTitle": "título SEO até 60 caracteres",
  "seoDescription": "meta descrição até 155 caracteres",
  "seoKeywords": "palavras-chave separadas por vírgula",
  "tempoImpressaoHoras": number,
  "pesoFilamentoGramas": number,
  "materialSugerido": "PLA | PETG | ABS | TPU | ASA"
}`;

export const aiProductDraft = createServerFn({ method: 'POST' })
  .inputValidator((input: unknown) => DraftInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env['LOVABLE_API_KEY'];
    if (!apiKey) return { draft: null as any, error: 'IA indisponível (LOVABLE_API_KEY ausente).' };
    if (!data.titulo && !data.imagem) return { draft: null as any, error: 'Envie um título ou uma imagem.' };

    const content: any[] = [
      {
        type: 'text',
        text: `Você é especialista em cadastro de produtos de impressão 3D em marketplaces brasileiros (Olist/Tiny, Mercado Livre, Shopee).
A partir da imagem e/ou título abaixo, preencha TODOS os campos de cadastro.
Responda SOMENTE com um JSON válido (sem markdown) neste formato:
${FIELD_SPEC}

Título/ideia: ${data.titulo || '(use a imagem)'}
Contexto extra: ${data.contexto || 'nenhum'}`,
      },
    ];
    if (data.imagem) content.push({ type: 'image_url', image_url: { url: data.imagem } });

    try {
      const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': apiKey },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [{ role: 'user', content }],
          response_format: { type: 'json_object' },
        }),
      });
      if (res.status === 429) return { draft: null as any, error: 'Limite de uso da IA atingido. Tente em instantes.' };
      if (res.status === 402) return { draft: null as any, error: 'Créditos de IA esgotados.' };
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        return { draft: null as any, error: `Erro da IA (${res.status}): ${body.slice(0, 200)}` };
      }
      const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const raw = json.choices?.[0]?.message?.content ?? '';
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start < 0 || end < 0) return { draft: null as any, error: 'A IA não retornou um JSON válido.' };
      const draft = JSON.parse(cleaned.slice(start, end + 1));
      return { draft, error: null as string | null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { draft: null as any, error: `Falha ao gerar cadastro: ${msg}` };
    }
  });