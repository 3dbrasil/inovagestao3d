import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Sparkles, Upload, Send, Loader2, AlertTriangle, CheckCircle2, ImagePlus, Trash2, Wand2, Store,
} from 'lucide-react';
import { aiProductDraft, olistCreateProduct } from '@/lib/olist.functions';
import { inovaCreateProduct } from '@/lib/inovastudio.functions';
import { PriceCalculator } from './PriceCalculator';
import { safeStorage } from '../../utils/storage';
import { debitProductionMaterials } from '../../utils/stockDebit';
import type { CatalogItem } from '../../types';

const CATALOG_KEY = 'bambuzau_local_catalog_production';

type Form = {
  nome: string; sku: string; descricao: string; descricaoComplementar: string;
  preco: string; precoCusto: string; precoPromocional: string; unidade: string;
  ncm: string; origem: string; gtin: string; marca: string; categoria: string;
  pesoLiquido: string; pesoBruto: string; largura: string; altura: string; profundidade: string;
  estoqueInicial: string; estoqueMinimo: string; garantia: string; observacoes: string;
  seoTitle: string; seoDescription: string; seoKeywords: string;
  tempoImpressaoHoras: string; pesoFilamentoGramas: string; materialSugerido: string;
  corFilamento: string;
};

const EMPTY: Form = {
  nome: '', sku: '', descricao: '', descricaoComplementar: '',
  preco: '', precoCusto: '', precoPromocional: '', unidade: 'UN',
  ncm: '39269090', origem: '0', gtin: '', marca: '', categoria: '',
  pesoLiquido: '', pesoBruto: '', largura: '', altura: '', profundidade: '',
  estoqueInicial: '1', estoqueMinimo: '1', garantia: '90 dias', observacoes: '',
  seoTitle: '', seoDescription: '', seoKeywords: '',
  tempoImpressaoHoras: '', pesoFilamentoGramas: '', materialSugerido: 'PLA',
  corFilamento: '',
};

const n = (v: string) => {
  const x = Number(String(v).replace(',', '.'));
  return Number.isFinite(x) ? x : 0;
};

const Field: React.FC<{
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; area?: boolean; hint?: string; className?: string;
}> = ({ label, value, onChange, placeholder, area, hint, className }) => (
  <div className={className}>
    <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">{label}</label>
    {area ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white outline-none placeholder:text-white/25 focus:border-[#b7ff00]/50"
      />
    ) : (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white outline-none placeholder:text-white/25 focus:border-[#b7ff00]/50"
      />
    )}
    {hint && <div className="mt-1 text-[10px] text-white/30">{hint}</div>}
  </div>
);

export const CriarProdutoTab: React.FC = () => {
  const [form, setForm] = useState<Form>(EMPTY);
  const [images, setImages] = useState<string[]>([]);
  const [ideia, setIdeia] = useState('');
  const [contexto, setContexto] = useState('');
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [alsoLocal, setAlsoLocal] = useState(true);
  const [alsoOlist, setAlsoOlist] = useState(true);
  const [alsoSite, setAlsoSite] = useState(true);
  const [debitStock, setDebitStock] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = useCallback(<K extends keyof Form>(k: K, v: string) => setForm((f) => ({ ...f, [k]: v })), []);

  const margem = useMemo(() => {
    const p = n(form.preco);
    const c = n(form.precoCusto);
    if (!p) return 0;
    return ((p - c) / p) * 100;
  }, [form.preco, form.precoCusto]);

  const onFiles = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;
    const reads = await Promise.all(
      Array.from(files).slice(0, 6).map(
        (f) =>
          new Promise<string>((resolve) => {
            const r = new FileReader();
            r.onload = () => resolve(String(r.result || ''));
            r.onerror = () => resolve('');
            r.readAsDataURL(f);
          }),
      ),
    );
    setImages((prev) => [...prev, ...reads.filter(Boolean)].slice(0, 8));
  }, []);

  const gerarComIA = useCallback(async () => {
    setError(null);
    setMsg(null);
    if (!ideia.trim() && !images.length) {
      setError('Escreva um título/ideia ou envie uma imagem do produto.');
      return;
    }
    setGenerating(true);
    try {
      const res = (await aiProductDraft({
        data: {
          titulo: ideia.trim() || undefined,
          imagem: images[0] || undefined,
          contexto: contexto.trim() || undefined,
        },
      })) as { draft: any; error: string | null };
      if (res.error || !res.draft) {
        setError(res.error || 'A IA não conseguiu gerar o cadastro.');
        return;
      }
      const d = res.draft;
      const s = (v: any, fb = '') => (v == null ? fb : String(v));
      setForm((f) => ({
        ...f,
        nome: s(d.nome, f.nome),
        sku: s(d.sku, f.sku).toUpperCase(),
        descricao: s(d.descricao, f.descricao),
        descricaoComplementar: s(d.descricaoComplementar, f.descricaoComplementar),
        preco: s(d.preco, f.preco),
        precoCusto: s(d.precoCusto, f.precoCusto),
        unidade: s(d.unidade, f.unidade || 'UN'),
        ncm: s(d.ncm, f.ncm),
        origem: s(d.origem, f.origem || '0'),
        marca: s(d.marca, f.marca),
        categoria: s(d.categoria, f.categoria),
        pesoLiquido: s(d.pesoLiquido, f.pesoLiquido),
        pesoBruto: s(d.pesoBruto, f.pesoBruto),
        largura: s(d.largura, f.largura),
        altura: s(d.altura, f.altura),
        profundidade: s(d.profundidade, f.profundidade),
        estoqueMinimo: s(d.estoqueMinimo, f.estoqueMinimo),
        garantia: s(d.garantia, f.garantia),
        seoTitle: s(d.seoTitle, f.seoTitle),
        seoDescription: s(d.seoDescription, f.seoDescription),
        seoKeywords: Array.isArray(d.seoKeywords) ? d.seoKeywords.join(', ') : s(d.seoKeywords, f.seoKeywords),
        tempoImpressaoHoras: s(d.tempoImpressaoHoras, f.tempoImpressaoHoras),
        pesoFilamentoGramas: s(d.pesoFilamentoGramas, f.pesoFilamentoGramas),
        materialSugerido: s(d.materialSugerido, f.materialSugerido),
      }));
      setMsg('Cadastro preenchido pela IA. Revise os campos e envie para a Olist.');
    } catch (e: any) {
      setError(e?.message || 'Falha ao gerar com IA.');
    } finally {
      setGenerating(false);
    }
  }, [ideia, contexto, images]);

  const saveLocalCatalog = useCallback(() => {
    try {
      const raw = safeStorage.getItem(CATALOG_KEY);
      const list: CatalogItem[] = raw ? JSON.parse(raw) : [];
      const item: CatalogItem = {
        id: Date.now(),
        name: form.nome,
        description: form.descricao,
        weightGrams: n(form.pesoFilamentoGramas),
        printTimeHours: n(form.tempoImpressaoHoras),
        filamentType: form.materialSugerido || 'PLA',
        defaultPrice: n(form.preco),
        stockCount: n(form.estoqueInicial),
        minStockCount: n(form.estoqueMinimo),
        productCode: form.sku,
        virtualStockCount: n(form.estoqueInicial),
        filamentColorsUsed: form.corFilamento || undefined,
        imageUrl: images[0] || undefined,
      };
      list.push(item);
      safeStorage.setItem(CATALOG_KEY, JSON.stringify(list));
      window.dispatchEvent(new Event('bambuzau_catalog_updated'));
    } catch {
      /* ignore */
    }
  }, [form, images]);

  const enviar = useCallback(async () => {
    setError(null);
    setMsg(null);
    if (!form.nome.trim() || !form.sku.trim() || !n(form.preco)) {
      setError('Nome, SKU e preço de venda são obrigatórios.');
      return;
    }
    setSending(true);
    try {
      const httpImages = images.filter((i) => /^https?:\/\//i.test(i));
      let olistMsg = '';
      if (alsoOlist) {
        const res = (await olistCreateProduct({
          data: {
          nome: form.nome.trim(),
          sku: form.sku.trim().toUpperCase(),
          descricao: form.descricao,
          descricaoComplementar: form.descricaoComplementar,
          preco: n(form.preco),
          precoCusto: n(form.precoCusto),
          precoPromocional: n(form.precoPromocional),
          unidade: form.unidade || 'UN',
          ncm: form.ncm,
          origem: form.origem || '0',
          gtin: form.gtin,
          marca: form.marca,
          categoria: form.categoria,
          pesoLiquido: n(form.pesoLiquido),
          pesoBruto: n(form.pesoBruto) || n(form.pesoLiquido),
          largura: n(form.largura),
          altura: n(form.altura),
          profundidade: n(form.profundidade),
          estoqueInicial: n(form.estoqueInicial),
          estoqueMinimo: n(form.estoqueMinimo),
          garantia: form.garantia,
          observacoes: form.observacoes,
          seoTitle: form.seoTitle,
          seoDescription: form.seoDescription,
          seoKeywords: form.seoKeywords,
          imagens: httpImages,
          },
        })) as { id: string; flavor: string };
        olistMsg = `Produto criado na Olist (${res.flavor === 'v3' ? 'API v3' : 'API v2'})${res.id ? ` · ID ${res.id}` : ''}.`;
      }

      let siteMsg = '';
      if (alsoSite) {
        try {
          const site = (await inovaCreateProduct({
            data: {
              name: form.nome.trim(),
              description: form.descricao,
              longDescription: form.descricaoComplementar,
              price: n(form.preco),
              promoPrice: n(form.precoPromocional) || undefined,
              stock: Math.max(1, n(form.estoqueInicial) || 1),
              weightGrams: n(form.pesoFilamentoGramas) || n(form.pesoLiquido) * 1000 || undefined,
              image: images[0] || undefined,
              extraImages: images.slice(1, 8),
            },
          })) as { id: string; images: number };
          siteMsg = ` Publicado no site Inovastudio com ${site.images} foto(s).`;
        } catch (e: any) {
          siteMsg = ` Falha ao publicar no site: ${e?.message || e}`;
        }
      }
      if (alsoLocal) saveLocalCatalog();
      // Estoque inicial => produção real => debita matéria-prima do estoque.
      let debitMsg = '';
      if (debitStock && n(form.estoqueInicial) > 0 && n(form.pesoFilamentoGramas) > 0) {
        const r = debitProductionMaterials({
          units: n(form.estoqueInicial),
          gramsPerUnit: n(form.pesoFilamentoGramas),
          filamentType: form.materialSugerido,
          filamentColor: form.corFilamento,
        });
        debitMsg = r.messages.length ? ` ${r.messages.join(' ')}` : '';
      }
      setMsg(
        olistMsg +
          siteMsg +
          (alsoLocal ? ' Também salvo no catálogo do Gestão 3D.' : '') +
          debitMsg +
          (alsoOlist && images.length && !httpImages.length
            ? ' As fotos enviadas do computador ficaram só no sistema — para aparecerem na Olist, cole a URL pública da imagem.'
            : ''),
      );
      setForm(EMPTY);
      setImages([]);
      setIdeia('');
      setContexto('');
    } catch (e: any) {
      setError(e?.message || 'Falha ao criar o produto.');
    } finally {
      setSending(false);
    }
  }, [form, images, alsoLocal, alsoOlist, alsoSite, debitStock, saveLocalCatalog]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
        <h2 className="flex items-center gap-2 text-lg font-black text-white">
          <Sparkles className="h-5 w-5 text-[#b7ff00]" /> Criar produto com IA → Olist
        </h2>
        <p className="text-[11px] text-white/45">
          Envie a foto ou escreva o título: a IA preenche todos os campos do cadastro da Olist e você envia com um clique.
        </p>
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

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        {/* Coluna IA + imagens */}
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <Field label="Título / ideia do produto" value={ideia} onChange={setIdeia} placeholder="Ex: Suporte de headset gamer articulado" />
          <Field label="Contexto extra (opcional)" value={contexto} onChange={setContexto} area placeholder="Tamanho real, público-alvo, diferenciais…" />

          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">Imagens do produto</label>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => void onFiles(e.target.files)} />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 py-6 text-xs font-bold text-white/60 transition hover:border-[#b7ff00]/50 hover:text-white"
            >
              <Upload className="h-4 w-4" /> Fazer upload das fotos
            </button>
            {!!images.length && (
              <div className="mt-2 grid grid-cols-4 gap-2">
                {images.map((img, i) => (
                  <div key={i} className="group relative overflow-hidden rounded-lg border border-white/10">
                    <img src={img} alt={`Foto ${i + 1}`} className="h-16 w-full object-cover" />
                    <button
                      onClick={() => setImages((p) => p.filter((_, k) => k !== i))}
                      className="absolute right-1 top-1 rounded bg-black/70 p-1 text-red-300 opacity-0 transition group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-2 flex gap-2">
              <input
                placeholder="Colar URL pública da imagem…"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const v = (e.target as HTMLInputElement).value.trim();
                    if (v) setImages((p) => [...p, v].slice(0, 8));
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] text-white outline-none placeholder:text-white/25 focus:border-[#b7ff00]/50"
              />
              <span className="flex items-center rounded-xl border border-white/10 px-2 text-white/35">
                <ImagePlus className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="mt-1 text-[10px] text-white/30">
              A Olist só aceita imagens por URL pública. Fotos do computador ficam salvas no catálogo local.
            </div>
          </div>

          <button
            onClick={() => void gerarComIA()}
            disabled={generating}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#b7ff00] py-2.5 text-xs font-black text-black transition hover:brightness-110 disabled:opacity-50"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {generating ? 'Gerando cadastro…' : 'Gerar cadastro com IA'}
          </button>

          <PriceCalculator
            inputs={{
              weightGrams: n(form.pesoFilamentoGramas),
              hours: n(form.tempoImpressaoHoras),
              material: form.materialSugerido || 'PLA',
            }}
            onUsePrice={(p) => set('preco', String(p))}
          />
        </div>

        {/* Formulário completo */}
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field className="sm:col-span-2" label="Nome do produto *" value={form.nome} onChange={(v) => set('nome', v)} />
            <Field label="SKU / Código *" value={form.sku} onChange={(v) => set('sku', v.toUpperCase())} />
            <Field label="Unidade" value={form.unidade} onChange={(v) => set('unidade', v)} />
            <Field className="sm:col-span-2" label="Descrição curta" value={form.descricao} onChange={(v) => set('descricao', v)} />
            <Field className="sm:col-span-2" label="Descrição completa (anúncio)" value={form.descricaoComplementar} onChange={(v) => set('descricaoComplementar', v)} area />
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Preço de venda *" value={form.preco} onChange={(v) => set('preco', v)} />
            <Field label="Preço de custo" value={form.precoCusto} onChange={(v) => set('precoCusto', v)} hint={`Margem: ${margem.toFixed(1)}%`} />
            <Field label="Preço promocional" value={form.precoPromocional} onChange={(v) => set('precoPromocional', v)} />
            <Field label="Garantia" value={form.garantia} onChange={(v) => set('garantia', v)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="NCM" value={form.ncm} onChange={(v) => set('ncm', v)} />
            <Field label="Origem" value={form.origem} onChange={(v) => set('origem', v)} hint="0 = nacional" />
            <Field label="GTIN / EAN" value={form.gtin} onChange={(v) => set('gtin', v)} />
            <Field label="Marca" value={form.marca} onChange={(v) => set('marca', v)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Peso líquido (kg)" value={form.pesoLiquido} onChange={(v) => set('pesoLiquido', v)} />
            <Field label="Peso bruto (kg)" value={form.pesoBruto} onChange={(v) => set('pesoBruto', v)} />
            <Field label="Largura (cm)" value={form.largura} onChange={(v) => set('largura', v)} />
            <Field label="Altura (cm)" value={form.altura} onChange={(v) => set('altura', v)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Comprimento (cm)" value={form.profundidade} onChange={(v) => set('profundidade', v)} />
            <Field label="Estoque inicial" value={form.estoqueInicial} onChange={(v) => set('estoqueInicial', v)} />
            <Field label="Estoque mínimo" value={form.estoqueMinimo} onChange={(v) => set('estoqueMinimo', v)} />
            <Field label="Categoria" value={form.categoria} onChange={(v) => set('categoria', v)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Material" value={form.materialSugerido} onChange={(v) => set('materialSugerido', v)} />
            <Field label="Filamento (g)" value={form.pesoFilamentoGramas} onChange={(v) => set('pesoFilamentoGramas', v)} />
            <Field label="Tempo de impressão (h)" value={form.tempoImpressaoHoras} onChange={(v) => set('tempoImpressaoHoras', v)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Cor do filamento"
              value={form.corFilamento}
              onChange={(v) => set('corFilamento', v)}
              placeholder="Ex: Preto"
              hint="Usada para debitar o carretel certo do estoque"
            />
            <label className="flex items-end gap-2 pb-1 text-[11px] font-bold text-white/70">
              <input type="checkbox" checked={debitStock} onChange={(e) => setDebitStock(e.target.checked)} className="h-4 w-4 accent-[#b7ff00]" />
              Debitar material do estoque conforme o estoque inicial
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="SEO título" value={form.seoTitle} onChange={(v) => set('seoTitle', v)} />
            <Field label="SEO keywords" value={form.seoKeywords} onChange={(v) => set('seoKeywords', v)} />
            <Field className="sm:col-span-2" label="SEO descrição" value={form.seoDescription} onChange={(v) => set('seoDescription', v)} />
            <Field className="sm:col-span-2" label="Observações internas" value={form.observacoes} onChange={(v) => set('observacoes', v)} area />
          </div>

          <div className="flex flex-col gap-3 border-t border-white/10 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <label className="flex items-center gap-2 text-[11px] text-white/60">
                <input type="checkbox" checked={alsoLocal} onChange={(e) => setAlsoLocal(e.target.checked)} className="accent-[#b7ff00]" />
                Salvar no catálogo do Gestão 3D
              </label>
              <label className="flex items-center gap-2 text-[11px] text-white/60">
                <input type="checkbox" checked={alsoOlist} onChange={(e) => setAlsoOlist(e.target.checked)} className="accent-[#b7ff00]" />
                Enviar para a Olist
              </label>
              <label className="flex items-center gap-2 text-[11px] text-white/60">
                <input type="checkbox" checked={alsoSite} onChange={(e) => setAlsoSite(e.target.checked)} className="accent-[#b7ff00]" />
                Publicar no site Inovastudio
              </label>
            </div>
            <button
              onClick={() => void enviar()}
              disabled={sending}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#b7ff00] px-5 py-2.5 text-xs font-black text-black transition hover:brightness-110 disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? 'Enviando…' : 'Criar produto'}
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-white/30">
            <Store className="h-3 w-3" /> As fotos do upload vão para o site Inovastudio automaticamente (a Olist só aceita URL pública).
          </div>
        </div>
      </div>
    </div>
  );
};