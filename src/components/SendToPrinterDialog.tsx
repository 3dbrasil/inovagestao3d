import { useEffect, useState } from "react";
import { listPrinters, pushHistory, type Printer } from "@/lib/printers-db";
import { sendToPrinter } from "@/lib/octoprint";
import { getFile, type ModelRecord } from "@/lib/catalog-db";
import { X, Send, Printer as PrinterIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function SendToPrinterDialog({
  model,
  open,
  onClose,
}: {
  model: ModelRecord | null;
  open: boolean;
  onClose: () => void;
}) {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [startPrint, setStartPrint] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      const p = listPrinters();
      setPrinters(p);
      setSelectedId(p[0]?.id ?? "");
      setStatus(null);
    }
  }, [open]);

  if (!open || !model) return null;

  const send = async () => {
    const printer = printers.find((p) => p.id === selectedId);
    if (!printer) return;
    setBusy(true);
    setStatus("Enviando…");
    const file = await getFile(model.id);
    if (!file) {
      setStatus("Arquivo não encontrado");
      setBusy(false);
      return;
    }
    const r = await sendToPrinter(printer, file, model.fileName, { startPrint });
    setStatus(r.message);
    pushHistory({
      id: crypto.randomUUID(),
      modelId: model.id,
      modelName: model.name,
      printerId: printer.id,
      printerName: printer.name,
      status: r.ok ? "success" : "error",
      message: r.message,
      startedPrint: startPrint,
      at: Date.now(),
    });
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0b14] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Enviar para impressora</h3>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mb-4 text-sm text-white/60">
          <span className="text-white/80">{model.name}</span>
        </p>

        {printers.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
            Nenhuma impressora cadastrada.{" "}
            <Link to="/" className="text-cyan-300 underline">
              Cadastrar agora
            </Link>
          </div>
        ) : (
          <>
            <label className="block text-xs uppercase tracking-wide text-white/50">Impressora</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
            >
              {printers.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#0b0b14]">
                  {p.name} ({p.type})
                </option>
              ))}
            </select>

            <label className="mt-4 flex items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={startPrint}
                onChange={(e) => setStartPrint(e.target.checked)}
                className="h-4 w-4"
              />
              Imprimir agora após o envio
            </label>

            <button
              onClick={send}
              disabled={busy}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-cyan-500/20 hover:opacity-95 disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> {busy ? "Enviando…" : "Enviar"}
            </button>
          </>
        )}

        {status && (
          <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-white/80">
            <PrinterIcon className="mr-2 inline h-4 w-4" />
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
