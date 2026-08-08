import React, { useEffect, useMemo, useState } from 'react';
import { X, Package, Layers, Save } from 'lucide-react';
import { safeStorage } from '../../utils/storage';
import type { CatalogItem, FilamentStock, SupplyStock } from '../../types';
import type { OlistGroup } from './grouping';

const CATALOG_KEY = 'bambuzau_local_catalog_production';
const FILAMENT_KEY = 'bambuzau_filament';
const SUPPLY_KEY = 'bambuzau_supplies';

export type ImportDraft = {
  key: string;
  selected: boolean;
  name: string;
  productCode: string;
  weightGrams: number;
  printTimeHours: number;
  filamentType: string;
  filamentColorsUsed: string;
  supplyStockId: number | null;
  supplyQty: number;
  extraCostPerUnit: number;
  minStockCount: number;
  defaultPrice: number;
  stockCount: number;
};

const readJson = <T,>(key: string): T[] => {
  try { return JSON.parse(safeStorage.getItem(key) || '[]') || []; } catch { return []; }
};

const num = (v: string) => {
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

const inputCls =
  'w-full rounded-lg border border-white/10 bg-white/[0.05] px-2 py-1.5 text-[11px] text-white outline-none focus:border-[#b7ff00]/50';

export const OlistImportModal: React.FC<{
  groups: OlistGroup[];
  onClose: () => void;
  onDone: (msg: string) => void;
}> = ({ groups, onClose, onDone }) => {
  const filaments = useMemo(() => readJson<FilamentStock>(FILAMENT_KEY), []);
  const supplies = useMemo(() => readJson<SupplyStock>(SUPPLY_KEY), []);
  const existing = useMemo(() => readJson<CatalogItem>(CATALOG_KEY), []);

  const [drafts, setDrafts] = useState<ImportDraft[]>([]);
  const [openKey, setOpenKey] = useState<string | null>(null);

  useEffect(() => {
    setDrafts(
      groups.map((g) => {
        const prev = existing.find(
          (c) => String(c.productCode || '').toLowerCase() === String(g.baseSku || '').toLowerCase(),
        );
        return {
          key: g.key,
          selected: true,
          name: prev?.name || g.nome,
          productCode: g.baseSku,
          weightGrams: prev?.weightGrams || 0,
          printTimeHours: prev?.printTimeHours || 0,
          filamentType: prev?.filamentType || filaments[0]?.type || 'PLA',
          filamentColorsUsed:
            prev?.filamentColorsUsed ||
            g.variacoes.map((v) => v.nome.split(/\s+[-–|/]\s+/).pop() || '').filter(Boolean).join(', '),
          supplyStockId: prev?.suppliesUsed?.[0]?.supplyStockId ?? null,
          supplyQty: prev?.suppliesUsed?.[0]?.quantity ?? 1,
          extraCostPerUnit: prev?.extraCostPerUnit || 0,
          minStockCount: prev?.minStockCount || 0,
          defaultPrice: g.preco || prev?.defaultPrice || 0,
          stockCount: g.saldo,
        };
      }),
    );
  }, [groups, existing, filaments]);

  const patch = (key: string, p: Partial<ImportDraft>) =>
    setDrafts((d) => d.map((x) => (x.key === key ? { ...x, ...p } : x)));

  const selectedCount = drafts.filter((d) => d.selected).length;

  const save = () => {
    const current = readJson<CatalogItem>(CATALOG_KEY);
    const byCode = new Map(current.map((c) => [String(c.productCode || '').toLowerCase(), c]));
    let nextId = current.reduce((m, c) => Math.max(m, Number(c.id) || 0), 0) + 1;
    let created = 0;
    let updated = 0;

    for (const d of drafts) {
      if (!d.selected) continue;
      const g = groups.find((x) => x.key === d.key);
      const code = String(d.productCode || '').toLowerCase();
      const base: Partial<CatalogItem> = {
        name: d.name,
        productCode: d.productCode,
        description: `Olist · ${g?.variacoes.length || 1} variação(ões) agrupada(s)`,
        weightGrams: d.weightGrams,
        printTimeHours: d.printTimeHours,
        filamentType: d.filamentType,
        filamentColorsUsed: d.filamentColorsUsed,
        defaultPrice: d.defaultPrice,
        stockCount: d.stockCount,
        minStockCount: d.minStockCount,
        extraCostPerUnit: d.extraCostPerUnit,
        suppliesUsed: d.supplyStockId
          ? [{ supplyStockId: d.supplyStockId, quantity: d.supplyQty || 1 }]
          : [],
      };
      const found = byCode.get(code);
      if (found) {
        Object.assign(found, base);
        updated++;
      } else {
        const item = { id: nextId++, ...base } as CatalogItem;
        current.push(item);
        byCode.set(code, item);
        created++;
      }
    }

    safeStorage.setItem(CATALOG_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event('bambuzau_catalog_updated'));
    onDone(`Catálogo atualizado: ${created} novos, ${updated} atualizados (variações agrupadas).`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0A0D0B]">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-black text-white">
              <Package className="h-4 w-4 text-[#b7ff00]" /> Importar da Olist
            </h3>
            <p className="text-[11px] text-white/45">
              Variações agrupadas em um produto só. Complete o que a Olist não tem: filamento, insumos e estoque.
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2 text-[11px] text-white/50">
          <button
            onClick={() => setDrafts((d) => d.map((x) => ({ ...x, selected: true })))}
            className="rounded-lg border border-white/10 px-2 py-1 font-bold text-white/80 hover:bg-white/10"
          >
            Selecionar todos
          </button>
          <button
            onClick={() => setDrafts((d) => d.map((x) => ({ ...x, selected: false })))}
            className="rounded-lg border border-white/10 px-2 py-1 font-bold text-white/80 hover:bg-white/10"
          >
            Limpar
          </button>
          <span className="ml-auto">{selectedCount} de {drafts.length} produtos</span>
        </div>

        <div className="flex-1 overflow-auto p-3">
          <div className="space-y-2">
            {drafts.map((d) => {
              const g = groups.find((x) => x.key === d.key)!;
              const open = openKey === d.key;
              return (
                <div key={d.key} className="rounded-xl border border-white/10 bg-white/[0.03]">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={d.selected}
                      onChange={(e) => patch(d.key, { selected: e.target.checked })}
                      className="h-4 w-4 accent-[#b7ff00]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-bold text-white">{d.name}</div>
                      <div className="flex items-center gap-2 text-[10px] text-white/40">
                        <span className="font-mono">{d.productCode || '—'}</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-1.5 py-0.5">
                          <Layers className="h-3 w-3" /> {g.variacoes.length} variação(ões)
                        </span>
                        <span>estoque {d.stockCount}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setOpenKey(open ? null : d.key)}
                      className="rounded-lg border border-white/10 px-2 py-1 text-[10px] font-bold text-white/80 hover:bg-white/10"
                    >
                      {open ? 'Fechar' : 'Editar custos'}
                    </button>
                  </div>

                  {open && (
                    <div className="border-t border-white/10 p-3">
                      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
                        <label className="text-[10px] uppercase tracking-wide text-white/40">
                          Nome
                          <input className={inputCls} value={d.name} onChange={(e) => patch(d.key, { name: e.target.value })} />
                        </label>
                        <label className="text-[10px] uppercase tracking-wide text-white/40">
                          Código / SKU base
                          <input className={inputCls} value={d.productCode} onChange={(e) => patch(d.key, { productCode: e.target.value })} />
                        </label>
                        <label className="text-[10px] uppercase tracking-wide text-white/40">
                          Filamento
                          <select
                            className={inputCls}
                            value={d.filamentType}
                            onChange={(e) => patch(d.key, { filamentType: e.target.value })}
                          >
                            {[...new Set([d.filamentType, ...filaments.map((f) => f.type), 'PLA', 'PETG', 'ABS', 'TPU', 'ASA'])]
                              .filter(Boolean)
                              .map((t) => (
                                <option key={t} value={t} className="bg-[#0A0D0B]">{t}</option>
                              ))}
                          </select>
                        </label>
                        <label className="text-[10px] uppercase tracking-wide text-white/40">
                          Cores usadas
                          <input className={inputCls} value={d.filamentColorsUsed} onChange={(e) => patch(d.key, { filamentColorsUsed: e.target.value })} />
                        </label>
                        <label className="text-[10px] uppercase tracking-wide text-white/40">
                          Peso (g)
                          <input className={inputCls} inputMode="decimal" value={d.weightGrams} onChange={(e) => patch(d.key, { weightGrams: num(e.target.value) })} />
                        </label>
                        <label className="text-[10px] uppercase tracking-wide text-white/40">
                          Tempo (h)
                          <input className={inputCls} inputMode="decimal" value={d.printTimeHours} onChange={(e) => patch(d.key, { printTimeHours: num(e.target.value) })} />
                        </label>
                        <label className="text-[10px] uppercase tracking-wide text-white/40">
                          Insumo
                          <select
                            className={inputCls}
                            value={d.supplyStockId ?? ''}
                            onChange={(e) => patch(d.key, { supplyStockId: e.target.value ? Number(e.target.value) : null })}
                          >
                            <option value="" className="bg-[#0A0D0B]">Nenhum</option>
                            {supplies.map((s) => (
                              <option key={s.id} value={s.id} className="bg-[#0A0D0B]">{s.name}</option>
                            ))}
                          </select>
                        </label>
                        <label className="text-[10px] uppercase tracking-wide text-white/40">
                          Qtd. insumo
                          <input className={inputCls} inputMode="decimal" value={d.supplyQty} onChange={(e) => patch(d.key, { supplyQty: num(e.target.value) })} />
                        </label>
                        <label className="text-[10px] uppercase tracking-wide text-white/40">
                          Custo extra (R$/un)
                          <input className={inputCls} inputMode="decimal" value={d.extraCostPerUnit} onChange={(e) => patch(d.key, { extraCostPerUnit: num(e.target.value) })} />
                        </label>
                        <label className="text-[10px] uppercase tracking-wide text-white/40">
                          Estoque atual
                          <input className={inputCls} inputMode="numeric" value={d.stockCount} onChange={(e) => patch(d.key, { stockCount: num(e.target.value) })} />
                        </label>
                        <label className="text-[10px] uppercase tracking-wide text-white/40">
                          Estoque mínimo
                          <input className={inputCls} inputMode="numeric" value={d.minStockCount} onChange={(e) => patch(d.key, { minStockCount: num(e.target.value) })} />
                        </label>
                        <label className="text-[10px] uppercase tracking-wide text-white/40">
                          Preço de venda
                          <input className={inputCls} inputMode="decimal" value={d.defaultPrice} onChange={(e) => patch(d.key, { defaultPrice: num(e.target.value) })} />
                        </label>
                      </div>

                      <div className="mt-2 text-[10px] text-white/35">
                        Variações agrupadas: {g.variacoes.map((v) => v.sku || v.nome).join(' · ')}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/10 px-4 py-3">
          <button onClick={onClose} className="rounded-xl border border-white/15 px-4 py-2 text-xs font-bold text-white hover:bg-white/10">
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={!selectedCount}
            className="flex items-center gap-2 rounded-xl bg-[#b7ff00] px-4 py-2 text-xs font-black text-black hover:brightness-110 disabled:opacity-40"
          >
            <Save className="h-4 w-4" /> Importar {selectedCount} produto(s)
          </button>
        </div>
      </div>
    </div>
  );
};
