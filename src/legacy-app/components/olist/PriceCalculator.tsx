import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, ArrowRight } from 'lucide-react';
import { safeStorage } from '../../utils/storage';
import type { FilamentStock, SupplyStock } from '../../types';

const FILAMENT_KEY = 'bambuzau_filament';
const SUPPLY_KEY = 'bambuzau_supplies';

const read = <T,>(key: string): T[] => {
  try {
    const raw = safeStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? (list as T[]) : [];
  } catch {
    return [];
  }
};

const num = (v: string | number) => {
  const x = Number(String(v).replace(',', '.'));
  return Number.isFinite(x) ? x : 0;
};

const money = (v: number) => `R$ ${v.toFixed(2)}`;

const In: React.FC<{ label: string; value: string; onChange: (v: string) => void; suffix?: string }> = ({
  label, value, onChange, suffix,
}) => (
  <div>
    <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">{label}</label>
    <div className="flex items-center gap-1">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white outline-none focus:border-[#b7ff00]/50"
      />
      {suffix && <span className="text-[10px] text-white/35">{suffix}</span>}
    </div>
  </div>
);

export interface CalcInputs {
  weightGrams: number;
  hours: number;
  material: string;
}

/**
 * Mesma calculadora do cadastro de produtos (Custos & Margem):
 * material + energia + mão de obra + insumos + markup + taxas/impostos.
 */
export const PriceCalculator: React.FC<{
  inputs: CalcInputs;
  onUsePrice: (price: number) => void;
}> = ({ inputs, onUsePrice }) => {
  const [filaments, setFilaments] = useState<FilamentStock[]>([]);
  const [supplies, setSupplies] = useState<SupplyStock[]>([]);
  const [supplyIds, setSupplyIds] = useState<number[]>([]);

  const [lossPct, setLossPct] = useState('5');
  const [laborHour, setLaborHour] = useState('15');
  const [printerW, setPrinterW] = useState('150');
  const [energyKwh, setEnergyKwh] = useState('0.95');
  const [packaging, setPackaging] = useState('0');
  const [shipping, setShipping] = useState('0');
  const [hardware, setHardware] = useState('0');
  const [margin, setMargin] = useState('50');
  const [fixedFee, setFixedFee] = useState('5');
  const [percentFee, setPercentFee] = useState('20');
  const [taxPct, setTaxPct] = useState('6');

  useEffect(() => {
    const load = () => {
      setFilaments(read<FilamentStock>(FILAMENT_KEY));
      setSupplies(read<SupplyStock>(SUPPLY_KEY));
    };
    load();
    window.addEventListener('bambuzau_stock_updated', load);
    return () => window.removeEventListener('bambuzau_stock_updated', load);
  }, []);

  const breakdown = useMemo(() => {
    const matching = filaments.filter(
      (f) => String(f.type || '').toUpperCase() === String(inputs.material || '').toUpperCase() && num(f.priceRoll) > 0,
    );
    const priceKg = matching.length
      ? matching.reduce((s, f) => s + num(f.priceRoll), 0) / matching.length
      : 120;
    const grams = inputs.weightGrams * (1 + num(lossPct) / 100);
    const material = (grams / 1000) * priceKg;
    const energy = (num(printerW) / 1000) * inputs.hours * num(energyKwh);
    const labor = inputs.hours * num(laborHour);
    const supplyCost = supplyIds.reduce((s, id) => {
      const item = supplies.find((x) => Number(x.id) === id);
      return s + (item ? num(item.unitCost) : 0);
    }, 0);
    const direct = material + energy + labor + supplyCost + num(packaging) + num(shipping) + num(hardware);
    const deduction = Math.min(0.95, (num(percentFee) + num(taxPct)) / 100);
    const base = direct * (1 + num(margin) / 100) + num(fixedFee);
    const suggested = deduction >= 0.95 ? base : base / (1 - deduction);
    return { priceKg, material, energy, labor, supplyCost, direct, suggested: Number.isFinite(suggested) ? suggested : 0 };
  }, [filaments, supplies, supplyIds, inputs, lossPct, laborHour, printerW, energyKwh, packaging, shipping, hardware, margin, fixedFee, percentFee, taxPct]);

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
      <h3 className="flex items-center gap-2 text-sm font-black text-white">
        <Calculator className="h-4 w-4 text-[#b7ff00]" /> Calculadora de preço
      </h3>
      <p className="text-[10px] text-white/35">
        Usa {inputs.weightGrams || 0}g de {inputs.material || 'PLA'} e {inputs.hours || 0}h de impressão do formulário ao lado.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <In label="Perda (%)" value={lossPct} onChange={setLossPct} />
        <In label="Mão de obra (R$/h)" value={laborHour} onChange={setLaborHour} />
        <In label="Potência (W)" value={printerW} onChange={setPrinterW} />
        <In label="Energia (R$/kWh)" value={energyKwh} onChange={setEnergyKwh} />
        <In label="Embalagem (R$)" value={packaging} onChange={setPackaging} />
        <In label="Frete/envio (R$)" value={shipping} onChange={setShipping} />
        <In label="Peças extras (R$)" value={hardware} onChange={setHardware} />
        <In label="Markup (%)" value={margin} onChange={setMargin} />
        <In label="Taxa fixa (R$)" value={fixedFee} onChange={setFixedFee} />
        <In label="Comissão canal (%)" value={percentFee} onChange={setPercentFee} />
        <In label="Imposto (%)" value={taxPct} onChange={setTaxPct} />
      </div>

      {!!supplies.length && (
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">Insumos usados</label>
          <div className="max-h-24 space-y-1 overflow-auto pr-1">
            {supplies.slice(0, 20).map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-[11px] text-white/60">
                <input
                  type="checkbox"
                  className="accent-[#b7ff00]"
                  checked={supplyIds.includes(Number(s.id))}
                  onChange={(e) =>
                    setSupplyIds((prev) =>
                      e.target.checked ? [...prev, Number(s.id)] : prev.filter((x) => x !== Number(s.id)),
                    )
                  }
                />
                {s.name} · {money(num(s.unitCost))}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1 rounded-xl border border-white/10 bg-black/30 p-3 text-[11px] text-white/55">
        <div className="flex justify-between"><span>Filamento ({money(breakdown.priceKg)}/kg)</span><strong>{money(breakdown.material)}</strong></div>
        <div className="flex justify-between"><span>Energia</span><strong>{money(breakdown.energy)}</strong></div>
        <div className="flex justify-between"><span>Mão de obra</span><strong>{money(breakdown.labor)}</strong></div>
        <div className="flex justify-between"><span>Insumos</span><strong>{money(breakdown.supplyCost)}</strong></div>
        <div className="mt-1 flex justify-between border-t border-white/10 pt-1 text-white/80"><span>Custo direto</span><strong>{money(breakdown.direct)}</strong></div>
        <div className="flex justify-between text-emerald-300"><span>Preço sugerido</span><strong className="text-base">{money(breakdown.suggested)}</strong></div>
      </div>

      <button
        onClick={() => onUsePrice(Number(breakdown.suggested.toFixed(2)))}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#b7ff00]/40 bg-[#b7ff00]/10 py-2 text-[11px] font-black text-[#b7ff00] transition hover:bg-[#b7ff00]/20"
      >
        Usar como preço de venda <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};