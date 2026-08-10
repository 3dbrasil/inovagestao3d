// Débito automático de matéria-prima ao produzir/cadastrar unidades de um produto.
import { safeStorage } from './storage';
import type { FilamentStock, SupplyStock } from '../types';

const FILAMENT_KEY = 'bambuzau_filament';
const SUPPLY_KEY = 'bambuzau_supplies';

export interface DebitRequest {
  /** Quantidade de peças produzidas. */
  units: number;
  /** Gramas de filamento por peça. */
  gramsPerUnit: number;
  /** Tipo do filamento (PLA, PETG…). */
  filamentType?: string;
  /** Cor desejada (opcional). */
  filamentColor?: string;
  /** Insumos consumidos por peça. */
  supplies?: Array<{ supplyStockId: number; quantity: number }>;
}

export interface DebitResult {
  ok: boolean;
  gramsDebited: number;
  suppliesDebited: number;
  messages: string[];
}

function read<T>(key: string): T[] {
  try {
    const raw = safeStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? (list as T[]) : [];
  } catch {
    return [];
  }
}

function write(key: string, value: unknown) {
  try {
    safeStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

/**
 * Debita filamento (em gramas) e insumos do estoque real.
 * Consome primeiro o carretel da cor pedida, depois os demais do mesmo tipo.
 */
export function debitProductionMaterials(req: DebitRequest): DebitResult {
  const messages: string[] = [];
  const units = Math.max(0, Math.floor(req.units || 0));
  const gramsNeededTotal = Math.max(0, (req.gramsPerUnit || 0) * units);
  let gramsDebited = 0;
  let suppliesDebited = 0;

  if (gramsNeededTotal > 0) {
    const filaments = read<FilamentStock>(FILAMENT_KEY);
    const type = (req.filamentType || '').trim().toUpperCase();
    const color = (req.filamentColor || '').trim().toLowerCase();

    const matches = filaments
      .map((f, index) => ({ f, index }))
      .filter(({ f }) => !type || String(f.type || '').trim().toUpperCase() === type)
      .sort((a, b) => {
        const aColor = String(a.f.color || '').toLowerCase() === color ? 0 : 1;
        const bColor = String(b.f.color || '').toLowerCase() === color ? 0 : 1;
        if (aColor !== bColor) return aColor - bColor;
        return (b.f.stockGrams || 0) - (a.f.stockGrams || 0);
      });

    let remaining = gramsNeededTotal;
    for (const { index } of matches) {
      if (remaining <= 0) break;
      const available = Math.max(0, Number(filaments[index].stockGrams) || 0);
      if (available <= 0) continue;
      const take = Math.min(available, remaining);
      filaments[index] = { ...filaments[index], stockGrams: Number((available - take).toFixed(2)) };
      remaining -= take;
      gramsDebited += take;
    }

    if (gramsDebited > 0) write(FILAMENT_KEY, filaments);

    if (remaining > 0) {
      messages.push(
        `Faltaram ${remaining.toFixed(0)}g de ${type || 'filamento'} no estoque — debitado apenas ${gramsDebited.toFixed(0)}g.`,
      );
    } else if (gramsDebited > 0) {
      messages.push(`Debitado ${gramsDebited.toFixed(0)}g de ${type || 'filamento'} do estoque.`);
    }
  }

  if (units > 0 && req.supplies?.length) {
    const supplies = read<SupplyStock>(SUPPLY_KEY);
    let changed = false;
    for (const use of req.supplies) {
      const index = supplies.findIndex((s) => Number(s.id) === Number(use.supplyStockId));
      if (index < 0) continue;
      const need = Math.max(0, (use.quantity || 0) * units);
      if (!need) continue;
      const available = Math.max(0, Number(supplies[index].stockCount) || 0);
      const take = Math.min(available, need);
      supplies[index] = { ...supplies[index], stockCount: available - take };
      suppliesDebited += take;
      changed = true;
      if (take < need) messages.push(`Insumo "${supplies[index].name}" ficou sem saldo suficiente.`);
    }
    if (changed) write(SUPPLY_KEY, supplies);
  }

  try {
    window.dispatchEvent(new Event('bambuzau_stock_updated'));
  } catch {
    /* SSR */
  }

  return { ok: true, gramsDebited, suppliesDebited, messages };
}
