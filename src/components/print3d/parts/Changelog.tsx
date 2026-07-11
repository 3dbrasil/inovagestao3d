import { History, RotateCcw, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useState } from "react";
import { LIME } from "./constants";

/**
 * Histórico de versões do app.
 * Esquema: 3.0.0.0.X — quando X chega em 9, sobe o dígito anterior (3.0.0.1.0).
 * Adicione novas entradas NO TOPO a cada atualização de programação.
 */
export interface VersionEntry {
  version: string;
  date: string; // ISO or human string
  changes: string[];
}

export const VERSION_HISTORY: VersionEntry[] = [
  {
    version: "3.0.0.0.4",
    date: "2026-07-11",
    changes: [
      "Painel de versões ao lado do mapa com histórico de mudanças",
      "Mapa de clientes mais estreito para dar espaço ao changelog",
      "Botão para reverter via Histórico do Lovable",
    ],
  },
  {
    version: "3.0.0.0.3",
    date: "2026-07-11",
    changes: [
      "Backup completo: exporta e restaura TODO o localStorage (keys, produtos, estoques, logo, tuya, cotações)",
      "Recarrega o app após restaurar para aplicar tudo automaticamente",
    ],
  },
  {
    version: "3.0.0.0.2",
    date: "2026-07-11",
    changes: [
      "Calculadora principal e do produto agora incluem Regime Tributário (MEI/Simples), Embalagem, Envio e Insumos de Hardware por peça",
      "Preço reverso passa a considerar impostos além da comissão do marketplace",
    ],
  },
  {
    version: "3.0.0.0.1",
    date: "2026-07-11",
    changes: [
      "Nome da marca no hero do dashboard passa a refletir o valor configurado em Ajustes",
      "Fonte da navegação lateral e inferior levemente aumentada",
    ],
  },
];

export const CURRENT_VERSION = VERSION_HISTORY[0]?.version || "3.0.0.0.1";

export function ChangelogPanel() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const openHistory = () => {
    // Abre a aba de Histórico do Lovable (mesma janela usada pelo botão do chat)
    try {
      const target = (window.top || window.parent || window) as Window;
      target.postMessage({ type: "lovable:open-history" }, "*");
    } catch {}
    // Fallback visual: mostra dica se não estiver dentro do Lovable
    try {
      const dev = !((window as any).__LOVABLE_EMBED__);
      if (dev) {
        alert(
          "Para reverter uma atualização de programação, abra o Histórico do Lovable no topo do chat e escolha a versão desejada."
        );
      }
    } catch {}
  };

  return (
    <section
      className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#050908] shadow-[0_28px_80px_-34px_rgba(163,230,53,0.45)] flex flex-col"
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] bg-[#0a0d0c]/95 px-4 py-3">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] flex items-center gap-1.5" style={{ color: LIME }}>
            <Sparkles className="h-3 w-3" /> Novidades
          </div>
          <h3 className="text-[15px] font-bold text-white truncate">Atualizações do sistema</h3>
          <p className="text-[10.5px] text-white/45">Versão atual <span className="font-mono text-white/80">v{CURRENT_VERSION}</span></p>
        </div>
        <button
          type="button"
          onClick={openHistory}
          title="Reverter para uma versão anterior via Histórico do Lovable"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-[10.5px] font-semibold text-white/85 hover:bg-white/[0.08] transition"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reverter
        </button>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[720px] p-3 space-y-2">
        {VERSION_HISTORY.map((v, i) => {
          const open = openIdx === i;
          return (
            <div
              key={v.version}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02]"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(open ? null : i)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                      style={{ color: i === 0 ? "#050908" : LIME, background: i === 0 ? LIME : "transparent", border: i === 0 ? "none" : `1px solid ${LIME}55` }}
                    >
                      v{v.version}
                    </span>
                    {i === 0 && (
                      <span className="text-[9px] uppercase tracking-wider text-emerald-300 font-bold">Atual</span>
                    )}
                  </div>
                  <div className="text-[10px] text-white/45 mt-0.5">{v.date}</div>
                </div>
                {open ? <ChevronUp className="h-3.5 w-3.5 text-white/50" /> : <ChevronDown className="h-3.5 w-3.5 text-white/50" />}
              </button>
              {open && (
                <ul className="px-3 pb-3 space-y-1.5">
                  {v.changes.map((c, j) => (
                    <li key={j} className="text-[11.5px] leading-snug text-white/75 pl-3 relative">
                      <span className="absolute left-0 top-[7px] h-1.5 w-1.5 rounded-full" style={{ background: LIME }} />
                      {c}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-white/[0.06] px-3 py-2 text-[10px] text-white/40 flex items-center gap-1.5">
        <History className="h-3 w-3" />
        Cada modificação incrementa 3.0.0.0.X (após .9, sobe: 3.0.0.1.0).
      </div>
    </section>
  );
}