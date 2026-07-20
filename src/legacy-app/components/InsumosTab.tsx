// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import {
  Package, Plus, Trash2, Edit3, History, AlertTriangle, Minus,
  ArrowDownCircle, ArrowUpCircle, Search, X, FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { SectionTitle, Kpi } from './DashboardShell';

/* ---------- types & storage ---------- */
const KEY = 'insumos_v1';
type Tipo = 'filamento' | 'resina' | 'outros';
type MovTipo = 'entrada' | 'consumo' | 'ajuste';

type Insumo = {
  id: string;
  codigo?: string;
  nome: string;
  tipo: Tipo;
  material: string;
  cor: string;
  diametro?: string;
  peso_liquido_g: number;
  quantidade_estoque: number;
  custo_unitario: number;
  data_compra?: string;
  fornecedor?: string;
  observacoes?: string;
  minimo?: number;
  created_at: string;
};
type Mov = {
  id: string; insumo_id: string; tipo: MovTipo;
  quantidade: number; data: string; motivo: string; pedido_id?: string;
};
type State = { insumos: Insumo[]; movs: Mov[] };

const defaultState = (): State => ({ insumos: [], movs: [] });
const load = (): State => {
  if (typeof window === 'undefined') return defaultState();
  try { const raw = localStorage.getItem(KEY); return raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState(); }
  catch { return defaultState(); }
};
const save = (s: State) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} };
const uid = () => Math.random().toString(36).slice(2, 10);
const brl = (n: number) =>
  Number(n || 0).toLocaleString('pt-BR', {
    style: 'currency', currency: 'BRL',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
const kg2 = (g: number) => (Number(g || 0) / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num = (n: number) => Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });

/* ---------- ordenação por família de cor (branco perto de branco, etc.) ---------- */
const COLOR_ORDER = [
  'branco','off','creme','bege','pele','marfim','amarelo','ouro','dourado','laranja','coral',
  'vermelho','bordo','rosa','magenta','roxo','violeta','lilas','azul','ciano','turquesa',
  'verde','oliva','marrom','cafe','cinza','prata','preto','fumaca','transparente','natural','silk',
];
const norm = (s: string) => String(s || '')
  .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const colorRank = (c: string) => {
  const n = norm(c);
  for (let i = 0; i < COLOR_ORDER.length; i++) if (n.includes(COLOR_ORDER[i])) return i;
  return 999;
};

/* ---------- código automático ---------- */
const tipoPrefix = (t: Tipo) => (t === 'filamento' ? 'FIL' : t === 'resina' ? 'RES' : 'INS');
const nextCodigo = (insumos: Insumo[], tipo: Tipo) => {
  const prefix = tipoPrefix(tipo);
  const nums = insumos
    .map(i => i.codigo || '')
    .filter(c => new RegExp(`^${prefix}-?\\d+$`).test(c))
    .map(c => parseInt(c.replace(prefix, '').replace(/^-/, ''), 10))
    .filter(n => !isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}${String(next).padStart(4, '0')}`;
};

/* nomes pré-definidos + já cadastrados = sugestões */
const PRESET_NOMES = [
  'PLA Preto 1kg','PLA Branco 1kg','PLA Cinza 1kg','PLA Vermelho 1kg','PLA Azul 1kg','PLA Verde 1kg','PLA Amarelo 1kg','PLA Silk Ouro 1kg','PLA Silk Prata 1kg',
  'PETG Preto 1kg','PETG Branco 1kg','PETG Transparente 1kg',
  'ABS Preto 1kg','ABS Branco 1kg',
  'ASA Preto 1kg','ASA Branco 1kg',
  'TPU Preto 1kg','TPU Transparente 1kg',
  'Resina Cinza 1L','Resina Transparente 1L','Resina Water Washable 1L',
  'Embalagem Plástica','Caixa de Papelão P','Caixa de Papelão M','Fita Adesiva','Etiqueta Térmica','Parafuso M3','Ímã Neodímio',
];

/* ---------- UI primitives ---------- */
const Card: React.FC<any> = ({ children, className = '' }) => (
  <div className={`relative bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl p-5 ${className}`}>{children}</div>
);
const Btn: React.FC<any> = ({ children, className = '', tone = 'lime', ...p }) => {
  const tones: any = {
    lime: 'bg-[#b7ff00] text-black hover:scale-[1.03]',
    ghost: 'bg-white/5 text-white hover:bg-white/10 border border-white/10',
    danger: 'bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/30',
    success: 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30',
    warn: 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30',
  };
  return <button {...p} className={`text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all ${tones[tone]} ${className}`}>{children}</button>;
};
const Input: React.FC<any> = ({ className = '', ...p }) => (
  <input {...p} className={`w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#b7ff00]/40 ${className}`} />
);
const Select: React.FC<any> = ({ className = '', children, ...p }) => (
  <select {...p} className={`w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#b7ff00]/40 ${className}`}>{children}</select>
);
const TextArea: React.FC<any> = ({ className = '', ...p }) => (
  <textarea {...p} className={`w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#b7ff00]/40 ${className}`} />
);
const Modal: React.FC<{ open: boolean; onClose: () => void; title: string; children: any; maxW?: string }> = ({ open, onClose, title, children, maxW = 'max-w-lg' }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className={`bg-zinc-950 border border-white/10 rounded-2xl w-full ${maxW} max-h-[90vh] overflow-auto p-6`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
};
const Field: React.FC<{ label: string; children: any; className?: string }> = ({ label, children, className = '' }) => (
  <div className={className}>
    <label className="text-[10px] uppercase tracking-widest text-zinc-400 mb-1 block">{label}</label>
    {children}
  </div>
);
const Badge: React.FC<{ tone: 'lime' | 'amber' | 'red' | 'zinc'; children: any }> = ({ tone, children }) => {
  const tones: any = {
    lime: 'bg-[#b7ff00]/15 text-[#b7ff00] border-[#b7ff00]/30',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    red: 'bg-red-500/15 text-red-300 border-red-500/30',
    zinc: 'bg-white/5 text-zinc-300 border-white/10',
  };
  return <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full border ${tones[tone]}`}>{children}</span>;
};

/* ---------- main ---------- */
const emptyForm = (): Insumo => ({
  id: '', codigo: '', nome: '', tipo: 'filamento', material: 'PLA', cor: '',
  diametro: '1.75mm', peso_liquido_g: 1000, quantidade_estoque: 0,
  custo_unitario: 0, data_compra: new Date().toISOString().slice(0, 10),
  fornecedor: '', observacoes: '', minimo: 0.3, created_at: '',
});

export const InsumosTab: React.FC = () => {
  const [state, setState] = useState<State>(() => load());
  const [form, setForm] = useState<Insumo>(emptyForm());
  const [openForm, setOpenForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adjust, setAdjust] = useState<{ id: string; tipo: 'entrada' | 'consumo' } | null>(null);
  const [adjustForm, setAdjustForm] = useState({ quantidade: 1, motivo: '', pedido_id: '' });
  const [historyOf, setHistoryOf] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'todos' | Tipo>('todos');

  useEffect(() => { save(state); }, [state]);

  // Garante código para insumos legados sem código
  useEffect(() => {
    const semCodigo = state.insumos.filter(i => !i.codigo);
    if (semCodigo.length === 0) return;
    setState(s => {
      const cop = structuredClone(s);
      cop.insumos.forEach(i => { if (!i.codigo) i.codigo = nextCodigo(cop.insumos.filter(x => x.codigo), i.tipo); });
      return cop;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nameSuggestions = useMemo(() => {
    const set = new Set<string>([...PRESET_NOMES, ...state.insumos.map(i => i.nome).filter(Boolean)]);
    return Array.from(set).sort();
  }, [state.insumos]);

  const update = (fn: (s: State) => State) => setState(s => fn(structuredClone(s)));

  const openCreate = () => { setForm(emptyForm()); setEditingId(null); setOpenForm(true); };
  const openEdit = (i: Insumo) => { setForm({ ...i }); setEditingId(i.id); setOpenForm(true); };

  const saveInsumo = () => {
    if (!form.nome.trim()) { toast.error('Informe o nome'); return; }
    update(s => {
      if (editingId) {
        const idx = s.insumos.findIndex(x => x.id === editingId);
        if (idx >= 0) s.insumos[idx] = { ...form, id: editingId };
      } else {
        const codigo = form.codigo?.trim() || nextCodigo(s.insumos, form.tipo);
        s.insumos.push({ ...form, codigo, id: uid(), created_at: new Date().toISOString() });
      }
      return s;
    });
    toast.success(editingId ? 'Insumo atualizado' : 'Insumo cadastrado');
    setOpenForm(false);
  };

  const removeInsumo = (id: string) => {
    if (!confirm('Excluir este insumo e todo o histórico?')) return;
    update(s => ({ ...s, insumos: s.insumos.filter(x => x.id !== id), movs: s.movs.filter(m => m.insumo_id !== id) }));
    toast.success('Insumo removido');
  };

  const submitAdjust = () => {
    if (!adjust) return;
    const q = Number(adjustForm.quantidade);
    if (!q || q <= 0) { toast.error('Quantidade inválida'); return; }
    update(s => {
      const i = s.insumos.findIndex(x => x.id === adjust.id);
      if (i < 0) return s;
      const delta = adjust.tipo === 'entrada' ? q : -q;
      s.insumos[i].quantidade_estoque = Number(s.insumos[i].quantidade_estoque) + delta;
      s.movs.push({
        id: uid(), insumo_id: adjust.id, tipo: adjust.tipo,
        quantidade: delta, data: new Date().toISOString(),
        motivo: adjustForm.motivo || (adjust.tipo === 'entrada' ? 'Compra' : 'Consumo'),
        pedido_id: adjustForm.pedido_id || undefined,
      });
      return s;
    });
    toast.success(adjust.tipo === 'entrada' ? 'Entrada registrada' : 'Consumo registrado');
    setAdjust(null); setAdjustForm({ quantidade: 1, motivo: '', pedido_id: '' });
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return state.insumos.filter(i =>
      (filter === 'todos' || i.tipo === filter) &&
      (!q || [i.nome, i.material, i.cor, i.fornecedor].filter(Boolean).some(v => String(v).toLowerCase().includes(q)))
    );
  }, [state.insumos, search, filter]);

  const kpis = useMemo(() => {
    const total = state.insumos.length;
    const baixo = state.insumos.filter(i => Number(i.quantidade_estoque) < Number(i.minimo || 0.3)).length;
    const valor = state.insumos.reduce((s, i) => s + Number(i.quantidade_estoque || 0) * Number(i.custo_unitario || 0), 0);
    return { total, baixo, valor };
  }, [state.insumos]);

  const movsOf = (id: string) => state.movs.filter(m => m.insumo_id === id).sort((a, b) => b.data.localeCompare(a.data));
  const insumoOf = (id: string | null) => state.insumos.find(i => i.id === id);

  return (
    <div className="w-full space-y-6">
      <SectionTitle icon={Package} title="Estoque de Insumos" status="Local" />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Kpi icon={Package} label="Insumos Cadastrados" value={String(kpis.total)} tone="lime" />
        <Kpi icon={AlertTriangle} label="Abaixo do Mínimo" value={String(kpis.baixo)} tone={kpis.baixo > 0 ? 'orange' : 'emerald'} />
        <Kpi icon={ArrowUpCircle} label="Valor em Estoque" value={brl(kpis.valor)} tone="emerald" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <Input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Buscar por nome, material, cor..." className="pl-9" />
        </div>
        <Select value={filter} onChange={(e: any) => setFilter(e.target.value)} className="w-40">
          <option value="todos">Todos os tipos</option>
          <option value="filamento">Filamento</option>
          <option value="resina">Resina</option>
          <option value="outros">Outros</option>
        </Select>
        <Btn onClick={openCreate}><Plus className="inline w-3 h-3 mr-1" /> Novo Insumo</Btn>
      </div>

      {/* Table / empty */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <Package className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-300 font-bold">Nenhum insumo cadastrado</p>
          <p className="text-xs text-zinc-500 mt-1">Comece adicionando seu primeiro filamento.</p>
          <div className="mt-4"><Btn onClick={openCreate}><Plus className="inline w-3 h-3 mr-1" /> Cadastrar Insumo</Btn></div>
        </Card>
      ) : (
        <Card className="p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-white/[0.03] text-[10px] uppercase tracking-widest text-zinc-400">
              <tr>
                <th className="text-left p-3">Código</th>
                <th className="text-left p-3">Nome</th>
                <th className="text-left p-3">Tipo</th>
                <th className="text-left p-3">Material</th>
                <th className="text-left p-3">Cor</th>
                <th className="text-right p-3">Peso (g)</th>
                <th className="text-right p-3">Estoque</th>
                <th className="text-right p-3">Custo Unit.</th>
                <th className="text-right p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(i => {
                const min = Number(i.minimo || 0.3);
                const baixo = Number(i.quantidade_estoque) < min;
                return (
                  <tr key={i.id} className={`border-t border-white/5 ${baixo ? 'bg-red-500/5' : ''}`}>
                    <td className="p-3"><span className="font-mono text-[11px] text-[#b7ff00]/90">{i.codigo || '—'}</span></td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {baixo && <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                        <span className="font-bold text-white">{i.nome}</span>
                      </div>
                      {i.fornecedor && <div className="text-[10px] text-zinc-500 mt-0.5">{i.fornecedor}</div>}
                    </td>
                    <td className="p-3"><Badge tone="zinc">{i.tipo}</Badge></td>
                    <td className="p-3 text-zinc-300">{i.material}</td>
                    <td className="p-3 text-zinc-300">{i.cor || '—'}</td>
                    <td className="p-3 text-right text-zinc-400 tabular-nums">{i.peso_liquido_g || '—'}</td>
                    <td className="p-3 text-right">
                      {baixo
                        ? <Badge tone="red">{num(i.quantidade_estoque)} un.</Badge>
                        : <span className="text-[#b7ff00] font-bold tabular-nums">{num(i.quantidade_estoque)} un.</span>}
                    </td>
                    <td className="p-3 text-right text-zinc-300 tabular-nums">{brl(i.custo_unitario)}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button title="Entrada" onClick={() => { setAdjust({ id: i.id, tipo: 'entrada' }); setAdjustForm({ quantidade: 1, motivo: 'Compra', pedido_id: '' }); }}
                          className="p-1.5 rounded bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30">
                          <ArrowUpCircle className="w-3.5 h-3.5" />
                        </button>
                        <button title="Consumo" onClick={() => { setAdjust({ id: i.id, tipo: 'consumo' }); setAdjustForm({ quantidade: 1, motivo: '', pedido_id: '' }); }}
                          className="p-1.5 rounded bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30">
                          <ArrowDownCircle className="w-3.5 h-3.5" />
                        </button>
                        <button title="Histórico" onClick={() => setHistoryOf(i.id)}
                          className="p-1.5 rounded bg-white/5 text-zinc-300 hover:bg-white/10 border border-white/10">
                          <History className="w-3.5 h-3.5" />
                        </button>
                        <button title="Editar" onClick={() => openEdit(i)}
                          className="p-1.5 rounded bg-white/5 text-zinc-300 hover:bg-white/10 border border-white/10">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button title="Excluir" onClick={() => removeInsumo(i.id)}
                          className="p-1.5 rounded bg-red-500/15 text-red-300 hover:bg-red-500/25 border border-red-500/30">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Form Modal */}
      <Modal open={openForm} onClose={() => setOpenForm(false)} title={editingId ? 'Editar Insumo' : 'Novo Insumo'} maxW="max-w-2xl">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Código (automático)">
            <Input value={form.codigo || ''} onChange={(e: any) => setForm({ ...form, codigo: e.target.value })} placeholder={editingId ? '' : 'Gerado ao salvar'} />
          </Field>
          <Field label="Tipo"><Select value={form.tipo} onChange={(e: any) => setForm({ ...form, tipo: e.target.value })}>
            <option value="filamento">Filamento</option>
            <option value="resina">Resina</option>
            <option value="outros">Outros</option>
          </Select></Field>
          <Field label="Nome" className="col-span-2">
            <Input
              list="insumo-nome-suggest"
              value={form.nome}
              onChange={(e: any) => setForm({ ...form, nome: e.target.value })}
              placeholder="Digite para buscar ou cadastrar (ex: PLA Preto 1kg)"
              autoComplete="off"
            />
            <datalist id="insumo-nome-suggest">
              {nameSuggestions.map(n => <option key={n} value={n} />)}
            </datalist>
          </Field>
          <Field label="Material"><Input value={form.material} onChange={(e: any) => setForm({ ...form, material: e.target.value })} placeholder="PLA, ABS, PETG, Resina padrão..." /></Field>
          <Field label="Cor"><Input value={form.cor} onChange={(e: any) => setForm({ ...form, cor: e.target.value })} placeholder="Preto" /></Field>
          <Field label="Diâmetro"><Input value={form.diametro || ''} onChange={(e: any) => setForm({ ...form, diametro: e.target.value })} placeholder="1.75mm" /></Field>
          <Field label="Peso Líquido (g)"><Input type="number" value={form.peso_liquido_g} onChange={(e: any) => setForm({ ...form, peso_liquido_g: Number(e.target.value) })} /></Field>
          <Field label="Quantidade em Estoque (un.)"><Input type="number" step="0.01" value={form.quantidade_estoque} onChange={(e: any) => setForm({ ...form, quantidade_estoque: Number(e.target.value) })} /></Field>
          <Field label="Custo Unitário (R$)"><Input type="number" step="0.01" value={form.custo_unitario} onChange={(e: any) => setForm({ ...form, custo_unitario: Number(e.target.value) })} /></Field>
          <Field label="Estoque Mínimo (un.)"><Input type="number" step="0.01" value={form.minimo || 0.3} onChange={(e: any) => setForm({ ...form, minimo: Number(e.target.value) })} /></Field>
          <Field label="Data da Compra"><Input type="date" value={form.data_compra || ''} onChange={(e: any) => setForm({ ...form, data_compra: e.target.value })} /></Field>
          <Field label="Fornecedor"><Input value={form.fornecedor || ''} onChange={(e: any) => setForm({ ...form, fornecedor: e.target.value })} /></Field>
          <Field label="Observações" className="col-span-2"><TextArea rows={2} value={form.observacoes || ''} onChange={(e: any) => setForm({ ...form, observacoes: e.target.value })} /></Field>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <Btn tone="ghost" onClick={() => setOpenForm(false)}>Cancelar</Btn>
          <Btn onClick={saveInsumo}>Salvar</Btn>
        </div>
      </Modal>

      {/* Adjust Modal */}
      <Modal open={!!adjust} onClose={() => setAdjust(null)} title={adjust?.tipo === 'entrada' ? 'Registrar Entrada' : 'Registrar Consumo'}>
        {adjust && (
          <>
            <p className="text-xs text-zinc-400 mb-3">{insumoOf(adjust.id)?.nome}</p>
            <div className="space-y-3">
              <Field label="Quantidade (un.)"><Input type="number" step="0.01" autoFocus value={adjustForm.quantidade} onChange={(e: any) => setAdjustForm({ ...adjustForm, quantidade: Number(e.target.value) })} /></Field>
              <Field label="Motivo"><Input value={adjustForm.motivo} onChange={(e: any) => setAdjustForm({ ...adjustForm, motivo: e.target.value })} placeholder={adjust.tipo === 'entrada' ? 'Compra' : 'Produção Pedido #45 / Perda'} /></Field>
              {adjust.tipo === 'consumo' && (
                <Field label="ID do Pedido (opcional)"><Input value={adjustForm.pedido_id} onChange={(e: any) => setAdjustForm({ ...adjustForm, pedido_id: e.target.value })} placeholder="#45" /></Field>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Btn tone="ghost" onClick={() => setAdjust(null)}>Cancelar</Btn>
              <Btn tone={adjust.tipo === 'entrada' ? 'success' : 'warn'} onClick={submitAdjust}>
                {adjust.tipo === 'entrada' ? <Plus className="inline w-3 h-3 mr-1" /> : <Minus className="inline w-3 h-3 mr-1" />}
                Confirmar
              </Btn>
            </div>
          </>
        )}
      </Modal>

      {/* History Modal */}
      <Modal open={!!historyOf} onClose={() => setHistoryOf(null)} title={`Histórico · ${insumoOf(historyOf)?.nome || ''}`} maxW="max-w-xl">
        {historyOf && (() => {
          const list = movsOf(historyOf);
          if (list.length === 0) return <p className="text-sm text-zinc-400 text-center py-6">Nenhuma movimentação registrada.</p>;
          return (
            <div className="space-y-2 max-h-[60vh] overflow-auto">
              {list.map(m => (
                <div key={m.id} className="flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge tone={m.tipo === 'entrada' ? 'lime' : m.tipo === 'consumo' ? 'amber' : 'zinc'}>{m.tipo}</Badge>
                      <span className="text-xs text-zinc-300">{m.motivo}</span>
                      {m.pedido_id && <span className="text-[10px] text-zinc-500">· {m.pedido_id}</span>}
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">{new Date(m.data).toLocaleString('pt-BR')}</div>
                  </div>
                  <span className={`text-sm font-bold tabular-nums ${m.quantidade > 0 ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {m.quantidade > 0 ? '+' : ''}{num(m.quantidade)}
                  </span>
                </div>
              ))}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};

export default InsumosTab;