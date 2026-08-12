import React, { useState } from 'react';
import { Client, Printer, PrintOrder } from '../types';
import { ClientProductsCatalogPicker } from './clients/ClientProductsCatalogPicker';
import { ClientForm, type ClientFormData } from './clients/ClientForm';
import { ClientsDashboard } from './clients/ClientsDashboard';
import { 
  User, ShieldAlert, Cpu, CheckSquare, Plus, PenTool, Trash2, Edit3, Settings2, 
  Globe, Clock, Eye, X, Package, Camera, CheckCircle, MapPin, Search, Filter, 
  MessageSquare, Building2, ChevronRight, RefreshCw, Copy, ExternalLink, AlertCircle, Compass 
} from 'lucide-react';
import { PrinterCameraModal } from './PrinterCameraModal';
import { getApiUrl } from '../utils/api';
import { safeStorage } from '../utils/storage';

import {
  type ProspectLead,
  LEAD_CATEGORIES,
} from '../lib/prospect-helpers';
import { useProspectLeads } from '../hooks/useProspectLeads';
import {
  buildOriginalText,
  buildPersuasivoText,
  buildCurtoText,
  buildConsignadoText,
  buildRefinedText,
} from '../lib/prospect-pitch-templates';


const streets = [
  'Avenida Brasil', 'Rua Getúlio Vargas', 'Avenida Afonso Pena', 'Rua Sete de Setembro', 
  'Rua Quinze de Novembro', 'Avenida Marechal Deodoro', 'Avenida Santos Dumont', 
  'Rua Castro Alves', 'Avenida Getúlio Vargas', 'Rua Tiradentes', 'Rua das Flores',
  'Avenida Central', 'Rua Marechal Floriano', 'Rua General Osório', 'Rua Rui Barbosa',
  'Avenida Amazonas', 'Rua Bahia', 'Avenida Paulista', 'Rua Oscar Freire', 'Rua Augusta'
];

const neighborhoods = [
  'Centro', 'Bairro Alto', 'Jardim América', 'Vila Nova', 'Industrial', 
  'Primavera', 'Santo Antônio', 'Vila Bela', 'São João', 'Aeroporto', 'Copacabana', 'Batel', 'Savassi'
];

interface ClientsTabProps {
  clients: Client[];
  printers: Printer[];
  orders: PrintOrder[];
  onAddClient: (client: Omit<Client, 'id'>) => void;
  onUpdateClient: (id: number, updated: Partial<Client>) => void;
  onDeleteClient: (id: number) => void;
  onUpdatePrinter: (id: number, updated: Partial<Printer>) => void;
  onAddPrinter: (printer: Omit<Printer, 'id'>) => void;
  onDeletePrinter: (id: number) => void;
  onAddOrder: (order: Partial<PrintOrder>) => void;
  viewMode?: 'full' | 'clients' | 'printers' | 'prospect';
  showAddPrinterForm?: boolean;
  onToggleAddPrinterForm?: () => void;
}

export const ClientsTab: React.FC<ClientsTabProps> = ({
  clients,
  printers,
  orders,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onUpdatePrinter,
  onAddPrinter,
  onDeletePrinter,
  onAddOrder,
  viewMode = 'full',
  showAddPrinterForm: showAddPrinterFormProp,
  onToggleAddPrinterForm,
}) => {
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClientId, setEditingClientId] = useState<number | null>(null);

  // Printer configuration dialog/states
  const [editingPrinterId, setEditingPrinterId] = useState<number | null>(null);
  const [pIpAddress, setPIpAddress] = useState('');
  const [pImageUrl, setPImageUrl] = useState('');
  const [selectedPrinterDetails, setSelectedPrinterDetails] = useState<any | null>(null);
  const [selectedCameraPrinter, setSelectedCameraPrinter] = useState<Printer | null>(null);
  const [checklistTrigger, setChecklistTrigger] = useState(0);

  // === CRM LEAD PROSPECTING & GOOGLE MAPS SEARCH ENGINE ===
  const {
    prospectLeads, setProspectLeads,
    selectedLeadForModal, setSelectedLeadForModal,
    prospectRegion, setProspectRegion,
    searchCategoryInput, setSearchCategoryInput,
    activeCategoryFilter, setActiveCategoryFilter,
    searchingLeads,
    mapQuery, setMapQuery,
    aiTone, setAiTone,
    customInstruction, setCustomInstruction,
    customAiOutput, setCustomAiOutput,
    isGeneratingAi, setIsGeneratingAi,
    focusedLeadId, setFocusedLeadId,
    copiedTextFeedback, setCopiedTextFeedback,
    showNewLeadForm, setShowNewLeadForm,
    newLeadName, setNewLeadName,
    newLeadPhone, setNewLeadPhone,
    newLeadAddress, setNewLeadAddress,
    newLeadCategory, setNewLeadCategory,
    newLeadPitch, setNewLeadPitch,
    newLeadNote, setNewLeadNote,
    handleCreateManualLead,
    handleSearchLeads,
    handleUpdateLeadStatus,
    handleToggleLeadChecklist,
    handlePromoteLeadToClient,
    handleDeleteLead,
  } = useProspectLeads(onAddClient);

  const getPrinterImage = (model: string = '', customUrl?: string) => {
    if (customUrl && customUrl.trim()) return customUrl.trim();
    const m = model.toLowerCase();
    if (m.includes('bambu') || m.includes('p1') || m.includes('x1') || m.includes('a1')) {
      return 'https://images.unsplash.com/photo-1701073837941-f76a5bf98505?auto=format&fit=crop&w=400&q=80';
    }
    if (m.includes('k1') || m.includes('creality') || m.includes('ender') || m.includes('v3') || m.includes('sermoon')) {
      return 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?auto=format&fit=crop&w=400&q=80';
    }
    if (m.includes('prusa') || m.includes('mk3') || m.includes('mk4') || m.includes('mini')) {
      return 'https://images.unsplash.com/photo-1544993130-9df2492f2549?auto=format&fit=crop&w=400&q=80';
    }
    if (m.includes('resina') || m.includes('resin') || m.includes('sla') || m.includes('elegoo') || m.includes('photon') || m.includes('halot')) {
      return 'https://images.unsplash.com/photo-1614853316476-de00d14cb1fc?auto=format&fit=crop&w=400&q=80';
    }
    if (m.includes('artillery') || m.includes('genius') || m.includes('sidewinder')) {
      return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80';
    }
    return 'https://images.unsplash.com/photo-1563206767-5b18f218e8de?auto=format&fit=crop&w=400&q=80';
  };

  // Sincronização Online e Cadastro de Impressora
  const [showAddPrinterFormInternal, setShowAddPrinterFormInternal] = useState(false);
  const showAddPrinterForm = showAddPrinterFormProp ?? showAddPrinterFormInternal;
  const setShowAddPrinterForm = (next: boolean) => {
    if (onToggleAddPrinterForm) onToggleAddPrinterForm();
    else setShowAddPrinterFormInternal(next);
  };
  const [newPrinterName, setNewPrinterName] = useState('');
  const [newPrinterModel, setNewPrinterModel] = useState('');
  const [newPrinterIp, setNewPrinterIp] = useState('');
  const [newPrinterImageUrl, setNewPrinterImageUrl] = useState('');
  const [newPrinterApiType, setNewPrinterApiType] = useState<'NONE' | 'KLIPPER' | 'OCTOPRINT' | 'BAMBU_CLOUD'>('NONE');
  const [newPrinterApiKey, setNewPrinterApiKey] = useState('');
  const [newPrinterPort, setNewPrinterPort] = useState('7125');
  const [isTestingConnId, setIsTestingConnId] = useState<number | null>(null);

  const handleCreatePrinter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrinterName.trim() || !newPrinterModel.trim()) {
      alert('Nome e Modelo são obrigatórios!');
      return;
    }
    onAddPrinter({
      name: newPrinterName.trim(),
      model: newPrinterModel.trim(),
      ipAddress: newPrinterIp.trim() || '192.168.1.100',
      status: 'IDLE',
      lastWeeklyMaintenance: Date.now(),
      lastMonthlyMaintenance: Date.now(),
      apiType: newPrinterApiType,
      apiKey: newPrinterApiKey.trim(),
      port: newPrinterPort.trim(),
      isOnline: newPrinterApiType !== 'NONE',
      imageUrl: newPrinterImageUrl.trim() || undefined,
      customUrl: newPrinterImageUrl.trim() || undefined
    });
    // Reset Form
    setNewPrinterName('');
    setNewPrinterModel('');
    setNewPrinterIp('');
    setNewPrinterImageUrl('');
    setNewPrinterApiType('NONE');
    setNewPrinterApiKey('');
    setNewPrinterPort('7125');
    setShowAddPrinterForm(false);
    alert('Nova impressora cadastrada com sucesso!');
  };

  /** Conexão real: Moonraker (Klipper) e OctoPrint via HTTP. */
  const handleTestPrinterConnection = async (printerId: number) => {
    const printer = printers.find(p => p.id === printerId);
    if (!printer) return;
    const host = (printer.ipAddress || '').trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!host) { alert('Preencha o IP local da impressora primeiro.'); return; }

    if (printer.apiType === 'BAMBU_CLOUD') {
      alert(
        'Bambu Lab usa MQTT na porta 8883 (não existe 9883) e o navegador não consegue abrir MQTT/TLS direto.\n\n' +
        'Use o modo LAN com Moonraker/OctoPrint, ou registre a máquina como manual e acompanhe pelo Bambu Studio.'
      );
      return;
    }

    const port = (printer.port || (printer.apiType === 'OCTOPRINT' ? '80' : '7125')).trim();
    const base = `http://${host}${port && port !== '80' ? `:${port}` : ''}`;
    setIsTestingConnId(printerId);
    try {
      if (printer.apiType === 'OCTOPRINT') {
        const headers: Record<string, string> = printer.apiKey ? { 'X-Api-Key': printer.apiKey } : {};
        const [pr, job] = await Promise.all([
          fetch(`${base}/api/printer`, { headers }).then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))),
          fetch(`${base}/api/job`, { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
        ]);
        onUpdatePrinter(printerId, {
          isOnline: true,
          nozzleTemp: Math.round(pr?.temperature?.tool0?.actual ?? 0),
          bedTemp: Math.round(pr?.temperature?.bed?.actual ?? 0),
          printProgress: Math.round(job?.progress?.completion ?? 0),
          currentJob: job?.job?.file?.name || '',
        });
        alert(`OctoPrint conectado (${pr?.state?.text || 'ok'}).`);
      } else {
        // Moonraker / Klipper
        const headers: Record<string, string> = printer.apiKey ? { 'X-Api-Key': printer.apiKey } : {};
        const url = `${base}/printer/objects/query?print_stats&extruder&heater_bed&display_status`;
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        const s = j?.result?.status ?? {};
        onUpdatePrinter(printerId, {
          isOnline: true,
          nozzleTemp: Math.round(s?.extruder?.temperature ?? 0),
          bedTemp: Math.round(s?.heater_bed?.temperature ?? 0),
          printProgress: Math.round((s?.display_status?.progress ?? 0) * 100),
          currentJob: s?.print_stats?.filename || '',
        });
        alert(`Moonraker conectado (${s?.print_stats?.state || 'ok'}).`);
      }
    } catch (e: any) {
      onUpdatePrinter(printerId, { isOnline: false });
      alert(
        `Não foi possível conectar em ${base}.\n\nErro: ${e?.message || e}\n\n` +
        'Checklist Moonraker:\n' +
        `• A porta padrão é 7125 (Mainsail/Fluidd usam 80). Porta configurada: ${port}\n` +
        '• No moonraker.conf, em [authorization], inclua o endereço deste site em cors_domains e a sua rede em trusted_clients.\n' +
        '• O site está em HTTPS e a impressora em HTTP: libere "conteúdo inseguro" para este site no navegador, ou use um túnel HTTPS.\n' +
        '• Bambu Lab não usa Moonraker — o MQTT dela é 8883, não 9883.'
      );
    } finally {
      setIsTestingConnId(null);
    }
  };

  // Edição completa da impressora
  const [editPrinter, setEditPrinter] = useState<Partial<Printer> | null>(null);
  const startEditPrinter = (p: Printer) => {
    setSelectedPrinterDetails(p);
    setPIpAddress(p.ipAddress || '');
    setEditPrinter({ ...p });
  };

  // Selected client for details page view
  const [selectedClientForPage, setSelectedClientForPage] = useState<Client | null>(null);

  // States for Order Intake Form inside Customer Sheet
  const [orderItemName, setOrderItemName] = useState('');
  const [orderItemImage, setOrderItemImage] = useState<string>('');
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderFilamentType, setOrderFilamentType] = useState('PLA');
  const [orderFilamentColor, setOrderFilamentColor] = useState('Preto');
  const [orderWeightGrams, setOrderWeightGrams] = useState(60);
  const [orderPrintTime, setOrderPrintTime] = useState(5);
  const [orderPrice, setOrderPrice] = useState(45);
  const [orderDeadline, setOrderDeadline] = useState(3);
  const [catalogList, setCatalogList] = useState<any[]>([]);

  // States for Customer Stock Intake
  const [newStockName, setNewStockName] = useState('');
  const [newStockQty, setNewStockQty] = useState(1);
  const [newStockImage, setNewStockImage] = useState('https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=300&q=80');

  // Load catalog items for pre-filling direct orders
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('bambuzau_local_catalog_production');
      if (saved) {
        setCatalogList(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, [selectedClientForPage]);

  const editingClient = editingClientId !== null
    ? clients.find(c => c.id === editingClientId) ?? null
    : null;

  const handleClientFormSubmit = (data: ClientFormData) => {
    if (editingClientId !== null) {
      onUpdateClient(editingClientId, data);
      setEditingClientId(null);
    } else {
      onAddClient(data);
    }
    setShowClientForm(false);
  };

  const startEditClient = (client: Client) => {
    setEditingClientId(client.id);
    setShowClientForm(true);
  };

  const handleMaintenanceClick = (printer: Printer, type: 'WEEKLY' | 'MONTHLY') => {
    const updatedDate = Date.now();
    onUpdatePrinter(printer.id, {
      lastWeeklyMaintenance: type === 'WEEKLY' ? updatedDate : printer.lastWeeklyMaintenance,
      lastMonthlyMaintenance: type === 'MONTHLY' ? updatedDate : printer.lastMonthlyMaintenance
    });
  };

  const savePrinterIp = (id: number) => {
    onUpdatePrinter(id, { ipAddress: pIpAddress });
    setEditingPrinterId(null);
  };

  return (
    <div className="space-y-6" id="clients_tab_container">
      {viewMode !== 'printers' && viewMode !== 'prospect' && (
        <ClientsDashboard clients={clients} orders={orders} />
      )}
      <div className={viewMode === 'full' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'grid grid-cols-1 gap-6'}>
        
        {/* LEFT COLUMN: CLIENT CATALOG */}
        {viewMode !== 'printers' && viewMode !== 'prospect' && (
        <div className="space-y-4" id="clients-catalog">
          <div className="flex items-center justify-between pb-3 border-b-2 border-white/10">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#b7ff00] opacity-60 animate-ping" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#b7ff00] shadow-[0_0_10px_#b7ff00]" />
              </span>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-[0.25em] text-white flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-[#b7ff00]" />
                  Cadastro de Clientes <span className="text-zinc-500 font-mono">({clients.length})</span>
                </h3>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">Ficha cadastral de contato para envios diretos</p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingClientId(null);
                setShowClientForm(!showClientForm);
              }}
              className="px-5 py-2 bg-[#b7ff00] hover:bg-[#a3e600] text-black border border-[#b7ff00] font-extrabold text-[10px] uppercase tracking-widest rounded-lg transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(183,255,0,0.25)] flex items-center gap-1.5"
              id="add-client-toggle"
            >
              <Plus className="h-3 w-3" />
              {showClientForm && editingClientId === null ? 'Fechar' : 'Novo Cliente'}
            </button>
          </div>

          {showClientForm && (
            <ClientForm
              initialClient={editingClient}
              catalog={catalogList}
              onSubmit={handleClientFormSubmit}
              onCancel={() => { setShowClientForm(false); setEditingClientId(null); }}
            />
          )}

          <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1" id="clients-list">
            {clients.map((client) => (
              <div key={client.id} className="p-4 bg-[#0C0E0D] border border-[#232B27] rounded-xl flex flex-col gap-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <h4 className="text-xs font-bold text-[#F1F4EE]">{client.name}</h4>
                    <div className="text-[10px] text-[#8BA58D] space-y-0.5">
                      <p>💬 <span className="font-mono text-[#F1F4EE]">{client.phone || 'Sem telefone'}</span> • {client.email}</p>
                      <p className="truncate">📍 {[client.address, client.city, client.state].filter(Boolean).join(', ') || 'Sem endereço informado'}{client.cep ? ` • CEP ${client.cep}` : ''}</p>
                      {client.note && <p className="text-[var(--brand-primary)] text-[9px] italic mt-1 font-mono">“ {client.note} ”</p>}
                    </div>

                    {/* View Details Page Button */}
                    <button
                      type="button"
                      onClick={() => setSelectedClientForPage(client)}
                      className="mt-2.5 w-full py-2 bg-[var(--brand-primary)]/10 hover:bg-[var(--brand-primary)]/25 text-[var(--brand-primary)] font-bold text-[10.5px] rounded-lg border border-[var(--brand-primary)]/25 hover:border-[var(--brand-primary)]/45 transition flex items-center justify-center gap-1.5 cursor-pointer uppercase select-none active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                      Ficha &amp; Produtos do Cliente 📂
                    </button>

                    {(client.address || client.cep) && (
                      <div className="pt-1">
                        {(() => {
                          const cep = (client.cep || '').replace(/\D/g, '');
                          const cepFmt = cep.length === 8 ? `${cep.slice(0,5)}-${cep.slice(5)}` : client.cep;
                          const cityUf = [client.city, client.state].filter(Boolean).join(' - ');
                          const q = [client.address, cityUf, cepFmt, 'Brasil'].filter(Boolean).join(', ');
                          const href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
                          return (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[9px] font-bold text-[var(--brand-primary)] hover:underline bg-[var(--brand-primary)]/5 p-1 px-2 rounded-md hover:bg-[var(--brand-primary)]/15 border border-[var(--brand-primary)]/15"
                          title="Ver localização no Google Maps"
                          id={`client_maps_${client.id}`}
                        >
                          <Globe className="h-2.5 w-2.5" />
                          Ver no Google Maps 🗺️
                        </a>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => startEditClient(client)}
                      className="p-1.5 text-[#8BA58D] hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 rounded transition"
                      title="Editar Cadastro"
                      id={`client_edit_${client.id}`}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteClient(client.id)}
                      className="p-1.5 text-red-400 hover:text-red-500 hover:bg-red-500/5 rounded transition"
                      title="Remover Cliente"
                      id={`client_delete_${client.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Recency tracker with quick-update reset click button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pt-2 border-t border-[#232B27]/30 text-[9px]">
                  <div className="flex items-center gap-1.1 flex-wrap text-[9px]">
                    <Clock className="h-3 w-3 text-[#8BA58D] shrink-0" />
                    <span className="text-[#8BA58D]">Sintonia:</span>
                    {client.lastContactDate ? (() => {
                      const days = Math.floor((Date.now() - client.lastContactDate) / (1000 * 3600 * 24));
                      const formattedDate = new Date(client.lastContactDate).toLocaleDateString('pt-BR');
                      if (days < 0 || days === 0) {
                        return <span className="text-emerald-400 font-bold">Hoje ({formattedDate}) ✓</span>;
                      } else if (days === 1) {
                        return <span className="text-emerald-400 font-bold">Ontem ({formattedDate}) ✓</span>;
                      } else if (days < 7) {
                        return <span className="text-emerald-400 font-semibold">Há {days} dias ({formattedDate})</span>;
                      } else if (days < 14) {
                        return <span className="text-amber-400 font-semibold">Há 1 semana ({days}d)</span>;
                      } else {
                        return <span className="text-red-400 font-bold">Sem contato {days} dias (Inativo)</span>;
                      }
                    })() : (
                      <span className="text-red-400 font-bold bg-red-400/10 px-1.5 py-0.5 rounded">Nunca contatado (Pendente!)</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onUpdateClient(client.id, { lastContactDate: Date.now() })}
                    className="px-2 py-0.5 bg-[var(--brand-primary)]/10 hover:bg-[var(--brand-primary)]/20 text-[var(--brand-primary)] font-bold rounded hover:border-[var(--brand-primary)]/30 border border-transparent transition text-[8px] uppercase self-start sm:self-auto shrink-0"
                    title="Definir data de último contato para hoje"
                    id={`client_update_contact_${client.id}`}
                  >
                    ✓ Feito Novo Contato
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* RIGHT COLUMN: 3D PRINTERS & HARDWARE CHECKLISTS */}
        {viewMode !== 'clients' && viewMode !== 'prospect' && (
        <div className="glow-card border border-[#b7ff00]/15 p-6 rounded-2xl space-y-5 animate-in fade-in duration-300" id="printers-catalog">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#F1F4EE]">Impressoras 3D</h3>
              <p className="text-[11px] text-zinc-500">Gerencie suas máquinas físicas e checklists de manutenção.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddPrinterForm(!showAddPrinterForm)}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition ${
                showAddPrinterForm
                  ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                  : 'bg-[#b7ff00]/10 border-[#b7ff00]/30 text-[#b7ff00] hover:bg-[#b7ff00]/20'
              }`}
              id="toggle-add-printer-form"
            >
              {showAddPrinterForm ? '× Cancelar' : '+ Cadastrar Impressora'}
            </button>
          </div>
          {/* Form to Register New Physical Printer */}
          {showAddPrinterForm && (
            <form onSubmit={handleCreatePrinter} className="p-4 bg-[#0C0E0D] border border-[#b7ff00]/25 rounded-xl space-y-3.5 animate-in slide-in-from-top-2 duration-200 shadow-[0_0_24px_-12px_rgba(183,255,0,0.35)]">
              <h4 className="text-xs font-bold text-[#b7ff00] uppercase tracking-wider font-mono">Nova Impressora 3D</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#8BA58D] font-bold uppercase">Apelido da Máquina</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Ender-3 Ateliê A"
                    value={newPrinterName}
                    onChange={(e) => setNewPrinterName(e.target.value)}
                    className="bg-[#151917] border border-[#232B27] hover:border-[#38463F] focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs text-[#F1F4EE] outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#8BA58D] font-bold uppercase">Modelo de Fábrica</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Creality K1 SE / Ender 3"
                    value={newPrinterModel}
                    onChange={(e) => setNewPrinterModel(e.target.value)}
                    className="bg-[#151917] border border-[#232B27] hover:border-[#38463F] focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs text-[#F1F4EE] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#8BA58D] font-bold uppercase">Endereço de IP / DNS Local</label>
                  <input
                    type="text"
                    placeholder="Ex: 192.168.15.52"
                    value={newPrinterIp}
                    onChange={(e) => setNewPrinterIp(e.target.value)}
                    className="bg-[#151917] border border-[#232B27] hover:border-[#38463F] focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs text-[#F1F4EE] font-mono outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-[#8BA58D] font-bold uppercase">Interface / Protocolo de Rede</label>
                  <select
                    value={newPrinterApiType}
                    onChange={(e) => setNewPrinterApiType(e.target.value as any)}
                    className="bg-[#151917] border border-[#232B27] rounded-lg px-2.5 py-1.5 text-xs text-[#F1F4EE] outline-none cursor-pointer"
                  >
                    <option value="NONE">Manual (Sem Telemetria Online)</option>
                    <option value="KLIPPER">Klipper (API Moonraker)</option>
                    <option value="OCTOPRINT">OctoPrint API (Marlin / GRBL)</option>
                    <option value="BAMBU_CLOUD">Bambu Lab Integration Code</option>
                  </select>
                </div>
              </div>

              {newPrinterApiType !== 'NONE' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-[#232B27]">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-[#8BA58D] font-bold uppercase">Porta de Comunicação IP</label>
                    <input
                      type="text"
                      placeholder="Padrão: 7125 ou 80"
                      value={newPrinterPort}
                      onChange={(e) => setNewPrinterPort(e.target.value)}
                      className="bg-[#151917] border border-[#232B27] rounded-lg px-2.5 py-1.5 text-xs text-[#F1F4EE] font-mono outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-[#8BA58D] font-bold uppercase">Chave de API (Token / Password)</label>
                    <input
                      type="password"
                      placeholder="Chave secreta de autenticação"
                      value={newPrinterApiKey}
                      onChange={(e) => setNewPrinterApiKey(e.target.value)}
                      className="bg-[#151917] border border-[#232B27] rounded-lg px-2.5 py-1.5 text-xs text-[#F1F4EE] font-mono outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Registro de Imagem Real / Upload da Máquina no Cadastro */}
              <div className="p-3 bg-[#111613] rounded-xl border border-[#232B27] space-y-2 animate-in fade-in duration-300">
                <span className="text-[9.5px] text-[#E5B242] font-mono uppercase block font-black">Foto Real do Equipamento 📸</span>
                <div className="flex gap-3 items-center">
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#232B27] shrink-0 bg-black/60 shadow-inner flex items-center justify-center">
                    {newPrinterImageUrl ? (
                      <img 
                        src={newPrinterImageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Camera className="h-5 w-5 text-zinc-650" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-[9px] text-zinc-400 font-sans leading-tight">
                      Tire uma foto instantânea com o celular ou envie uma imagem armazenada para registrar o visual desta máquina!
                    </p>
                    <div className="flex gap-2">
                      <label 
                        htmlFor="new_photo_upload_input"
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-[#0C0E0D] text-[10px] font-black rounded transition cursor-pointer flex items-center justify-center gap-1.5 shadow active:scale-95 duration-100"
                      >
                        <Camera className="h-3 w-3" />
                        Tirar Foto / Upload
                      </label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        id="new_photo_upload_input"
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              if (typeof reader.result === 'string') {
                                setNewPrinterImageUrl(reader.result);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      {newPrinterImageUrl && (
                        <button
                          type="button"
                          onClick={() => setNewPrinterImageUrl('')}
                          className="px-2 py-0.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/15 text-[10px] font-bold rounded transition"
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-[#0C0E0D] text-xs font-bold rounded-lg transition"
              >
                Salvar Cadastro da Máquina ✓
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="printers-checklist-list">
            {printers.map((printer) => {
              const isPrinting = printer.status === 'PRINTING' || (printer.isOnline && (printer.printProgress || 0) > 0);
              const imageUrl = getPrinterImage(printer.model, printer.customUrl);
              const daysSinceWeekly = Math.floor((Date.now() - (printer.lastWeeklyMaintenance || 0)) / (1000 * 3600 * 24));
              const daysSinceMonthly = Math.floor((Date.now() - (printer.lastMonthlyMaintenance || 0)) / (1000 * 3600 * 24));
              const wChecks = [0,1,2].filter(i => localStorage.getItem(`bambuzau_p_${printer.id}_chk_w_${i}`) === 'true').length;
              const mChecks = [0,1,2].filter(i => localStorage.getItem(`bambuzau_p_${printer.id}_chk_m_${i}`) === 'true').length;
              const weeklyOk = daysSinceWeekly < 7 && wChecks === 3;
              const monthlyOk = daysSinceMonthly < 30 && mChecks === 3;
              void checklistTrigger;

              return (
                <div
                  key={printer.id}
                  onClick={() => {
                    setSelectedPrinterDetails(printer);
                    setPIpAddress(printer.ipAddress || '');
                  }}
                  className={`group relative flex gap-3 p-2.5 rounded-xl overflow-hidden cursor-pointer select-none transition-all duration-300 border-2 hover:scale-[0.99] bg-[#0A0D0B] ${
                    isPrinting
                      ? 'border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                      : 'border-red-600/70'
                  }`}
                  id={`printer_grid_card_${printer.id}`}
                >
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-black/40">
                    <img
                      src={imageUrl}
                      alt={printer.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isPrinting ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-xs font-black text-[#F1F4EE] truncate">{printer.name}</span>
                      </div>
                      <span className="text-[9px] font-mono text-zinc-400 truncate block mt-0.5">
                        {isPrinting ? `${printer.printProgress || 0}% ativo` : 'Inativo'} • {printer.model}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {weeklyOk && monthlyOk ? (
                        <span className="text-[9px] px-2 py-0.5 rounded font-black border bg-emerald-500/10 text-emerald-400 border-emerald-500/25 uppercase tracking-wider">
                          Manutenção ✓
                        </span>
                      ) : (
                        <span className="text-[9px] px-2 py-0.5 rounded font-black border bg-red-500/15 text-red-400 border-red-500/50 uppercase tracking-wider animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                          ⚠ Manutenção Pendente
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PRINTER DETAILS FLOATING DRAWER PANEL */}
          {selectedPrinterDetails && (() => {
            const printer = printers.find(p => p.id === selectedPrinterDetails.id) || selectedPrinterDetails;
            const isPrinting = printer.status === 'PRINTING' || (printer.isOnline && (printer.printProgress || 0) > 0);
            
            const daysSinceWeekly = Math.floor((Date.now() - printer.lastWeeklyMaintenance) / (1000 * 3600 * 24));
            const daysSinceMonthly = Math.floor((Date.now() - printer.lastMonthlyMaintenance) / (1000 * 3600 * 24));

            const isWeeklyUrgent = daysSinceWeekly >= 7;
            const isMonthlyUrgent = daysSinceMonthly >= 30;

            return (
              <div className="p-4 bg-[#0A0D0B] border border-[#232B27] rounded-xl space-y-4 animate-fade-in relative" id="selected-printer-drawer-panel">
                <div className="flex items-center justify-between border-b border-[#232B27]/60 pb-2">
                  <div>
                    <h4 className="text-xs font-bold text-[#F1F4EE] flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${isPrinting ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                      {printer.name} ({printer.model})
                    </h4>
                    <p className="text-[9px] text-[#8BA58D] font-mono mt-0.5">Painel de Instalação &amp; Manutenção Física</p>
                  </div>
                  <button 
                    onClick={() => setSelectedPrinterDetails(null)}
                    type="button"
                    className="text-[10px] text-red-400 hover:text-red-300 font-bold px-2 py-1 hover:bg-red-500/10 rounded-lg transition shrink-0"
                  >
                    Fechar Painel ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="space-y-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-[#8BA58D] font-mono uppercase">Endereço IP Local</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={pIpAddress}
                          onChange={(e) => setPIpAddress(e.target.value)}
                          placeholder="Ex: 192.168.1.100"
                          className="bg-[#151917] border border-[#232B27] hover:border-[#38463F] focus:border-amber-500 rounded-lg px-2.5 py-1 text-xs text-[#F1F4EE] outline-none font-mono flex-1 min-w-0"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            onUpdatePrinter(printer.id, { ipAddress: pIpAddress });
                            alert('IP atualizado com sucesso!');
                          }}
                          className="px-3 bg-gradient-to-r from-amber-600 to-amber-500 text-[#0C0E0D] text-xs font-black rounded-lg hover:opacity-95 transition cursor-pointer"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>

                    {/* Visual da Impressora Real com Upload/Câmera */}
                    <div className="p-3.5 bg-[#111613] rounded-2xl border border-[#232B27]/80 space-y-2.5 animate-in fade-in duration-300">
                      <span className="text-[9.5px] text-[#E5B242] font-mono uppercase block font-black">Imagem Real da Máquina 📸</span>
                      <div className="flex gap-3 items-center">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#232B27] shrink-0 bg-black/60 shadow-inner">
                          <img 
                            src={getPrinterImage(printer.model, printer.customUrl)} 
                            alt={printer.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <p className="text-[10px] text-zinc-400 font-sans leading-tight">
                            Tire uma foto instantânea com o celular ou faça upload de uma imagem do seu dispositivo. This will persist custom real-life graphics!
                          </p>
                          <div className="flex gap-2">
                            <label 
                              htmlFor={`edit-printer-camera-upload-${printer.id}`}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-[#0C0E0D] text-[10.5px] font-black rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-95 duration-100"
                            >
                              <Camera className="h-3.5 w-3.5" />
                              Tirar Foto / Upload
                            </label>
                            <input 
                              type="file" 
                              accept="image/*" 
                              capture="environment" 
                              id={`edit-printer-camera-upload-${printer.id}`}
                              className="hidden" 
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    if (typeof reader.result === 'string') {
                                      onUpdatePrinter(printer.id, { customUrl: reader.result });
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />

                            {printer.customUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('Deseja redefinir para a imagem padrão baseada no modelo?')) {
                                    onUpdatePrinter(printer.id, { customUrl: '' });
                                  }
                                }}
                                className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/15 text-[10.5px] font-bold rounded-lg transition"
                              >
                                Limpar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-[#111613] rounded-lg border border-[#232B27] space-y-2">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-[#8BA58D] font-extrabold uppercase font-mono">Status da Máquina</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${isPrinting ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                          {isPrinting ? 'EM ATIVIDADE' : 'FORA DE ATIVIDADE'}
                        </span>
                      </div>
                      
                      {printer.apiType && printer.apiType !== 'NONE' ? (
                        <div className="space-y-2 text-[10px] font-mono">
                          <div className="flex justify-between">
                            <span className="text-[#8BA58D]">Integração:</span>
                            <span className="text-white font-bold">{printer.apiType}</span>
                          </div>
                          {printer.isOnline && printer.nozzleTemp ? (
                            <div className="grid grid-cols-2 gap-1.5 bg-[#0C0E0D] p-1.5 rounded border border-[#232B27]/40">
                              <div>bocal: <strong className="text-amber-400">{printer.nozzleTemp}°C</strong></div>
                              <div>mesa: <strong className="text-amber-400">{printer.bedTemp}°C</strong></div>
                              <div className="col-span-2 text-[9px] text-[#8BA58D] truncate">job: {printer.currentJob || 'S/D'}</div>
                            </div>
                          ) : (
                            <div className="text-center text-zinc-500 text-[9px] italic py-0.5">Telemetria desconectada</div>
                          )}
                          <button
                            type="button"
                            disabled={isTestingConnId === printer.id}
                            onClick={() => handleTestPrinterConnection(printer.id)}
                            className="w-full text-center py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded font-bold border border-amber-500/20 text-[9px] transition cursor-pointer"
                          >
                            {isTestingConnId === printer.id ? 'Buscando...' : 'Testar Conexão / Sincronizar 📡'}
                          </button>
                        </div>
                      ) : (
                        <div className="text-[10px] text-zinc-400 leading-relaxed">
                          Esta impressora tem configurações locais manuais. Mude o tipo de API no formulário de cadastro para coletar telemetria em tempo real.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[9.5px] text-[#8BA58D] font-mono uppercase block font-black">Checklists de Manutenção Física</span>
                    
                    <div className="p-3 bg-[#111613] rounded-lg border border-[#232B27] flex flex-col justify-between space-y-2.5">
                      <div className="flex items-center justify-between border-b border-[#232B27]/60 pb-1.5">
                        <span className="text-[10px] text-zinc-100 font-extrabold uppercase">Semanal • Correias &amp; Bico</span>
                        <span className={`text-[8.5px] px-2 py-0.5 rounded font-black ${
                          (!isWeeklyUrgent && 
                           localStorage.getItem(`bambuzau_p_${printer.id}_chk_w_0`) === 'true' &&
                           localStorage.getItem(`bambuzau_p_${printer.id}_chk_w_1`) === 'true' &&
                           localStorage.getItem(`bambuzau_p_${printer.id}_chk_w_2`) === 'true') 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(52,211,153,0.15)] font-sans' 
                            : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}>
                          {(!isWeeklyUrgent && 
                           localStorage.getItem(`bambuzau_p_${printer.id}_chk_w_0`) === 'true' &&
                           localStorage.getItem(`bambuzau_p_${printer.id}_chk_w_1`) === 'true' &&
                           localStorage.getItem(`bambuzau_p_${printer.id}_chk_w_2`) === 'true') 
                            ? 'OK • COMPLETO' 
                            : 'ATRASADA / INCOMPLETO'}
                        </span>
                      </div>
                      
                      {/* Check Items */}
                      <div className="space-y-1.5 pl-0.5">
                        {[
                          'Limpar eixo de carbono/guias lineares',
                          'Checar e calibrar tensão das correias',
                          'Verificar desgaste do bico extrusor'
                        ].map((task, idx) => {
                          const key = `bambuzau_p_${printer.id}_chk_w_${idx}`;
                          const isChecked = localStorage.getItem(key) === 'true';
                          return (
                            <label key={idx} className="flex items-start gap-2 text-[10px] text-zinc-350 hover:text-white cursor-pointer select-none">
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                onChange={(e) => {
                                  localStorage.setItem(key, String(e.target.checked));
                                  setChecklistTrigger(prev => prev + 1);
                                }}
                                className="mt-0.5 accent-amber-500 cursor-pointer h-3 w-3"
                              />
                              <span className={isChecked ? 'line-through text-zinc-550 font-medium' : 'font-bold'}>{task}</span>
                            </label>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          handleMaintenanceClick(printer, 'WEEKLY');
                          localStorage.setItem(`bambuzau_p_${printer.id}_chk_w_0`, 'true');
                          localStorage.setItem(`bambuzau_p_${printer.id}_chk_w_1`, 'true');
                          localStorage.setItem(`bambuzau_p_${printer.id}_chk_w_2`, 'true');
                          setChecklistTrigger(prev => prev + 1);
                        }}
                        className="w-full mt-1.5 py-1.5 bg-amber-500/5 hover:bg-amber-500/15 border border-amber-500/15 text-amber-505 text-[10px] font-black rounded-lg cursor-pointer transition text-center"
                      >
                        Resetar Semanal ({daysSinceWeekly}d atrás)
                      </button>
                    </div>

                    <div className="p-3 bg-[#111613] rounded-lg border border-[#232B27] flex flex-col justify-between space-y-2.5">
                      <div className="flex items-center justify-between border-b border-[#232B27]/60 pb-1.5">
                        <span className="text-[10px] text-zinc-100 font-extrabold uppercase">Mensal • Eixos &amp; PTFE</span>
                        <span className={`text-[8.5px] px-2 py-0.5 rounded font-black ${
                          (!isMonthlyUrgent && 
                           localStorage.getItem(`bambuzau_p_${printer.id}_chk_m_0`) === 'true' &&
                           localStorage.getItem(`bambuzau_p_${printer.id}_chk_m_1`) === 'true' &&
                           localStorage.getItem(`bambuzau_p_${printer.id}_chk_m_2`) === 'true') 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(52,211,153,0.15)] font-sans' 
                            : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}>
                          {(!isMonthlyUrgent && 
                           localStorage.getItem(`bambuzau_p_${printer.id}_chk_m_0`) === 'true' &&
                           localStorage.getItem(`bambuzau_p_${printer.id}_chk_m_1`) === 'true' &&
                           localStorage.getItem(`bambuzau_p_${printer.id}_chk_m_2`) === 'true') 
                            ? 'OK • COMPLETO' 
                            : 'ATRASADA / INCOMPLETO'}
                        </span>
                      </div>
                      
                      {/* Check Items */}
                      <div className="space-y-1.5 pl-0.5">
                        {[
                          'Lubrificar fuso trapezoidal eixo Z',
                          'Inspecionar tubo PTFE e conexões push',
                          'Limpar cooler e ventoinhas da placa/hotend'
                        ].map((task, idx) => {
                          const key = `bambuzau_p_${printer.id}_chk_m_${idx}`;
                          const isChecked = localStorage.getItem(key) === 'true';
                          return (
                            <label key={idx} className="flex items-start gap-2 text-[10px] text-zinc-350 hover:text-white cursor-pointer select-none">
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                onChange={(e) => {
                                  localStorage.setItem(key, String(e.target.checked));
                                  setChecklistTrigger(prev => prev + 1);
                                }}
                                className="mt-0.5 accent-red-500 cursor-pointer h-3 w-3"
                              />
                              <span className={isChecked ? 'line-through text-zinc-550 font-medium' : 'font-bold'}>{task}</span>
                            </label>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          handleMaintenanceClick(printer, 'MONTHLY');
                          localStorage.setItem(`bambuzau_p_${printer.id}_chk_m_0`, 'true');
                          localStorage.setItem(`bambuzau_p_${printer.id}_chk_m_1`, 'true');
                          localStorage.setItem(`bambuzau_p_${printer.id}_chk_m_2`, 'true');
                          setChecklistTrigger(prev => prev + 1);
                        }}
                        className="w-full mt-1.5 py-1.5 bg-red-500/5 hover:bg-red-500/15 border border-red-500/15 text-red-405 text-[10px] font-black rounded-lg cursor-pointer transition text-center"
                      >
                        Resetar Mensal ({daysSinceMonthly}d atrás)
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#232B27]/40 pt-3">
                  <button
                    type="button"
                    onClick={() => setSelectedCameraPrinter(printer)}
                    className="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/30 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-sm select-none"
                  >
                    <Camera className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
                    ACESSAR MONITORAMENTO DE VÍDEO COMPARTILHADO v3.3.0.0 🎥
                  </button>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Deseja excluir permanentemente o cadastro desta impressora?')) {
                        onDeletePrinter(printer.id);
                        setSelectedPrinterDetails(null);
                      }
                    }}
                    className="text-[9px] font-bold text-red-500 hover:text-red-400 hover:bg-red-500/10 p-1 px-2.5 rounded-lg border border-red-500/10 transition uppercase"
                  >
                    Excluir Impressora
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Conditional Floating Printer Camera Live Feed Modal */}
          {selectedCameraPrinter && (
            <PrinterCameraModal
              printer={selectedCameraPrinter}
              onClose={() => setSelectedCameraPrinter(null)}
              onUpdatePrinter={(id, updated) => {
                onUpdatePrinter(id, updated);
                setSelectedCameraPrinter(prev => prev && prev.id === id ? { ...prev, ...updated } : prev);
              }}
            />
          )}
        </div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* 📡 CRM RADAR GOOGLE MAPS - PROSPECÇÃO B2B & NOVO FILTRO DE CLIENTES LEADS */}
      {/* ========================================================================= */}
      {(viewMode === 'prospect' || viewMode === 'full') && (
      <div className="relative mt-6 animate-fade-in" id="crm-b2b-leads-section">
        {/* Radial glows */}
        <div className="absolute -top-20 -left-10 w-[420px] h-[420px] rounded-full bg-[#b7ff00]/10 blur-[120px] pointer-events-none" />
        <div className="absolute -top-10 right-0 w-[340px] h-[340px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

        <div className="relative rounded-3xl border border-white/10 bg-white/[0.025] backdrop-blur-2xl p-6 md:p-8 space-y-6 shadow-[0_30px_80px_-40px_rgba(183,255,0,0.35)] overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#b7ff00]/50 to-transparent" />

          {/* Premium Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 border-b border-white/[0.06]">
            <div className="flex items-start gap-5">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#b7ff00]/40 to-emerald-500/30 blur-xl" />
                <div className="relative h-14 w-14 rounded-2xl bg-gradient-to-br from-white/15 to-white/[0.03] border border-white/15 flex items-center justify-center shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                  <Compass className="h-6 w-6 text-[#b7ff00] animate-spin-slow" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-[#b7ff00]/85 font-medium">
                  <span className="h-1 w-1 rounded-full bg-[#b7ff00] animate-pulse" />
                  Radar B2B • Google Maps
                </div>
                <h3
                  className="text-[2rem] md:text-[2.5rem] leading-[1.05] font-semibold tracking-[-0.02em] bg-clip-text text-transparent bg-gradient-to-br from-white via-lime-100 to-emerald-200"
                  style={{ fontFamily: "Sora, system-ui, sans-serif" }}
                >
                  Captador de Lojas &amp; Leads
                </h3>
                <p className="text-white/55 max-w-xl text-[14px] leading-relaxed">
                  Pesquise comércios físicos na sua região e extraia telefones (WhatsApp) para expandir sua revenda de peças 3D.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowNewLeadForm(!showNewLeadForm)}
                className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold text-[#b7ff00] bg-[#b7ff00]/10 border border-[#b7ff00]/30 hover:border-[#b7ff00]/55 shadow-[0_12px_40px_-12px_rgba(183,255,0,0.55)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
                Cadastrar Loja
              </button>
              <a
                href="https://maps.google.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-semibold text-white/70 hover:text-white bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-0.5"
              >
                Maps Oficial
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

        {/* CADASTRAR MANUAL LEAD EXPANDABLE FORM */}
        {showNewLeadForm && (
          <form onSubmit={handleCreateManualLead} className="p-5 bg-[#0C0E0D] border border-[#b7ff00]/25 rounded-2xl space-y-4 animate-in slide-in-from-top-4 duration-200">
            <div className="flex items-center justify-between border-b border-[#232B27] pb-2">
              <h4 className="text-xs font-black text-[#b7ff00] uppercase tracking-widest font-mono flex items-center gap-1.5">
                <Plus className="h-4 w-4" />
                <span>Adicionar Prospecção Manual de Estabelecimento</span>
              </h4>
              <button 
                type="button" 
                onClick={() => setShowNewLeadForm(false)}
                className="text-zinc-500 hover:text-white p-1 rounded hover:bg-white/5 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wide block">Nome Oficial do Estabelecimento</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Brinquedos & Papelaria Central"
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  className="w-full bg-[#151917] border border-[#232B27] rounded-xl px-3 py-2 text-[#F1F4EE] placeholder-zinc-650 text-xs focus:outline-none focus:border-[#b7ff00]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wide block">Telefone Comercial / WhatsApp</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: (11) 99876-5432"
                  value={newLeadPhone}
                  onChange={(e) => setNewLeadPhone(e.target.value)}
                  className="w-full bg-[#151917] border border-[#232B27] rounded-xl px-3 py-2 text-[#F1F4EE] placeholder-zinc-650 text-xs focus:outline-none focus:border-[#b7ff00] font-mono"
                />
              </div>

              <div className="space-y-1.5 font-sans">
                <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wide block">Categoria de Negócio</label>
                <select
                  value={newLeadCategory}
                  onChange={(e) => setNewLeadCategory(e.target.value)}
                  className="w-full bg-[#151917] border border-[#232B27] rounded-xl px-3 py-2 text-[#F1F4EE] text-xs focus:outline-none focus:border-[#b7ff00] hover:border-zinc-600 transition"
                >
                  {LEAD_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wide block">Endereço Completo de Entrega/Mostruário</label>
                <input 
                  type="text"
                  placeholder="Rua, Número, Bairro, Cidade - SP"
                  value={newLeadAddress}
                  onChange={(e) => setNewLeadAddress(e.target.value)}
                  className="w-full bg-[#151917] border border-[#232B27] rounded-xl px-3 py-2 text-[#F1F4EE] placeholder-zinc-650 text-xs focus:outline-none focus:border-[#b7ff00]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wide block">Notas Internas Iniciais</label>
                <input 
                  type="text"
                  placeholder="Ex: Entrar em contato após as 14h, falar com gerente."
                  value={newLeadNote}
                  onChange={(e) => setNewLeadNote(e.target.value)}
                  className="w-full bg-[#151917] border border-[#232B27] rounded-xl px-3 py-2 text-[#F1F4EE] placeholder-zinc-650 text-xs focus:outline-none focus:border-[#b7ff00]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wide block">Proposta de Vendas / Ideia de Peças 3D (Opcional)</label>
              <textarea 
                rows={2}
                placeholder="Deixe em branco para usar o gerador inteligente ou descreva sua sugestão de peças (ex: Dragão articulado, Vasos decorados bicolores)."
                value={newLeadPitch}
                onChange={(e) => setNewLeadPitch(e.target.value)}
                className="w-full bg-[#151917] border border-[#232B27] rounded-xl p-2.5 text-[#F1F4EE] placeholder-zinc-660 text-xs focus:outline-none focus:border-[#b7ff00] resize-none"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-[#a3e000] to-[#b7ff00] hover:from-[#8fcc00] hover:to-[#a3e000] text-black font-black text-xs rounded-xl transition shadow-md cursor-pointer"
            >
              Adicionar Lead ao CRM de Prospecção 📡
            </button>
          </form>
        )}

        {/* GOOGLE MAPS LOCAL SEARCH ENGINE BLOCK */}
        <div className="bg-[#0A0D0B] border border-[#232B27] rounded-2xl p-5 space-y-4">
          
          {/* Inputs Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-zinc-400 font-mono uppercase tracking-wider block mb-1.5">
                📍 Região / Bairro de Busca
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-[#b7ff00]" />
                <input 
                  type="text"
                  placeholder="Cidade, Bairro (ex: Copacabana, RJ)"
                  value={prospectRegion}
                  onChange={(e) => setProspectRegion(e.target.value)}
                  className="w-full bg-[#151917] border border-[#232B27] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F1F4EE] focus:outline-none focus:border-[#b7ff00] font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-zinc-400 font-mono uppercase tracking-wider block mb-1.5">
                🔎 Categoria Comercial Alvo
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8BA58D]" />
                <input 
                  type="text"
                  placeholder="Ex: Lojas de Brinquedos, Jornaleiros"
                  value={searchCategoryInput}
                  onChange={(e) => setSearchCategoryInput(e.target.value)}
                  className="w-full bg-[#151917] border border-[#232B27] rounded-xl pl-9 pr-3 py-2 text-xs text-[#F1F4EE] focus:outline-none focus:border-[#95BBA2]"
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                disabled={searchingLeads}
                onClick={handleSearchLeads}
                className="w-full py-2 bg-gradient-to-r from-[#b7ff00] to-emerald-500 hover:opacity-90 disabled:opacity-50 text-black font-black text-xs rounded-xl transition duration-200 active:scale-98 cursor-pointer flex items-center justify-center gap-2 h-[37px] shadow-lg shadow-[#b7ff00]/10"
              >
                {searchingLeads ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-black" />
                    <span>Vasculhando Google Maps...</span>
                  </>
                ) : (
                  <>
                    <Compass className="h-4 w-4 text-black animate-spin-slow" />
                    <span>Mapear Lojas & Telefones no Maps ⚡</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2">
            
            {/* Visual simulation of Google Maps right inside the page (styled black interface with glow effects) */}
            <div className="lg:col-span-7 bg-[#141715] border border-[#232B27] rounded-2xl p-4 flex flex-col justify-between min-h-[220px] relative overflow-hidden">
              
              {/* Radar Grid Graphic Cover */}
              <div className="absolute inset-0 opacity-[0.08]" style={{
                backgroundImage: 'radial-gradient(circle, #b7ff00 1px, transparent 1px)',
                backgroundSize: '16px 16px'
              }} />

              {/* Ping Radar Animation */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[180px] h-[180px] border border-[#b7ff00]/10 rounded-full animate-ping absolute duration-1000" />
                <div className="w-[300px] h-[300px] border border-[#b7ff00]/5 rounded-full animate-ping absolute duration-1500" />
                <div className="w-1.5 h-1.5 bg-[#b7ff00] rounded-full shadow-[0_0_8px_#b7ff00] absolute" />
              </div>

              {/* Pin representations dynamically plotted based on available leads */}
              <div className="absolute inset-0 pointer-events-none">
                {prospectLeads.slice(0, 5).map((l, idx) => {
                  const offsets = [
                    { t: '15%', l: '20%' },
                    { t: '70%', l: '35%' },
                    { t: '40%', l: '75%' },
                    { t: '80%', l: '70%' },
                    { t: '25%', l: '60%' }
                  ];
                  const pos = offsets[idx % offsets.length];
                  return (
                    <div 
                      key={l.id} 
                      className="absolute group" 
                      style={{ top: pos.t, left: pos.l }}
                    >
                      <div className="relative">
                        <span className={`absolute -top-1 -left-1 w-3 h-3 rounded-full animate-ping ${l.status === 'WON' ? 'bg-emerald-400/30' : 'bg-[#b7ff00]/30'}`} />
                        <MapPin className={`h-5 w-5 ${
                          l.status === 'WON' ? 'text-emerald-400' :
                          l.status === 'INTERESTED' ? 'text-amber-400' :
                          'text-[#b7ff00]'
                        } filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]`} />
                        
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-[#0C0E0D]/95 border border-[#232B27] p-1.5 rounded-lg text-[8px] text-white font-mono whitespace-nowrap opacity-100 transition shadow-md z-10 scale-90">
                          <span className="font-extrabold text-[#b7ff00]">({l.category}) </span>
                          <span>{l.name.slice(0, 15)}...</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Maps Header HUD */}
              <div className="flex items-center justify-between border-b border-[#232B27] pb-2 z-10">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#b7ff00] animate-pulse" />
                  <span className="text-[10px] font-mono uppercase font-black text-white tracking-widest">
                    Google Places API - Radar Geográfico
                  </span>
                </div>
                <div className="text-[9px] font-mono text-zinc-400 bg-black/40 px-2 py-0.5 rounded-md border border-[#232B27]">
                  GPS Act: <span className="text-[#b7ff00] font-bold">{prospectRegion}</span>
                </div>
              </div>

              {/* Maps Footer HUD */}
              <div className="flex items-end justify-between z-10 pt-16">
                <div className="space-y-1">
                  <div className="text-[9px] font-mono text-zinc-400">
                    Sincronização em tempo real: <span className="text-emerald-400 font-bold">100% Homologado</span>
                  </div>
                  <div className="text-[8.5px] font-mono text-zinc-500 uppercase leading-none">
                    Status: <span className="text-[#a58d8d]">Filtro: {mapQuery}</span>
                  </div>
                </div>

                <div className="text-right text-[9px] font-mono text-zinc-400 bg-[#a3e000]/10 border border-[#b7ff00]/20 px-2.5 py-1 rounded-lg">
                  <span className="block text-white font-extrabold text-[10px]">{prospectLeads.length} Lojas</span>
                  <span>no perímetro</span>
                </div>
              </div>

            </div>

            {/* Advanced live copywriting assistant panel substituting the old static Catálogo de Ideias */}
            {(() => {
              const activePitchLead = prospectLeads.find(l => l.id === focusedLeadId) || prospectLeads[0] || null;
              
              let activeOriginalText = "";
              let activePersuasivoText = "";
              let activeCurtoText = "";
              let activeConsignadoText = "";
              let activeTextTailored = "";

              if (activePitchLead) {
                activeOriginalText = activePitchLead.category === 'Jornaleiros' 
                  ? `*Olá pessoal da ${activePitchLead.name}!* 👋 Tudo bem com vocês?\n\nPassando aqui pois vi que vocês vendem revistas e canetas na ${activePitchLead.address.split(',')[0]} com excelente fluxo!\n\nNós da *Gestão 3D* imprimimos *chaveiros articulados super fofos, dinossauros e mimos rápidos decorativos em impressora 3D*. O custo de revenda é baixíssimo e o sucesso com crianças e colecionadores é imediato no balcão!\n\nPodemos deixar 5 ou 10 chaveiros em consignação por 10 dias? Vocês só pagam o que vender! O que acham? Sem risco nenhum.`
                  : activePitchLead.category === 'Brinquedos'
                  ? `*Olá, gerente da ${activePitchLead.name}!* 👋\n\nNós da *Gestão 3D* fabricamos *brinquedos articulados e sensoriais (Fidget Toys / Dragões Articulados Premium)* de alta fidelidade que fazem um sucesso gigantesco nas redes sociais.\n\nComo vocês são referência em presentes infantis na região, gostaríamos de oferecer nossos pacotes de atacado ou deixar peças selecionadas para demonstração. O lucro da sua loja ultrapassa 100% por peça!\n\nPodemos fazer um contato rápido esta semana no telefone *${activePitchLead.phone}*?`
                  : activePitchLead.category === 'Decoração'
                  ? `*Olá, Equipe ${activePitchLead.name}!* 👋\n\nTrabalhamos com *vasos e suportes de design geométrico escandinavo impressos em 3D de alta altíssima resolução* utilizando polímeros orgânicos biodegradáveis (PLA).\n\nNossos cachepôs em cores Mármore, Granito, Cobre e Madeira da *Gestão 3D* casam perfeitamente com sua vitrine. Gostaríamos de propor uma parceria de revenda de peças premium decorativas bicolores.\n\nPodemos enviar o nosso catálogo em PDF no WhatsApp?`
                  : `*Olá!* 👋 Conhecemos a *${activePitchLead.name}* e acreditamos que nossos itens colecionáveis em alta definição 3D da *Gestão 3D* (suportes gamer, bustos decorativos, e gadgets articulados) seriam um atrativo de alta margem de lucro para seus clientes na ${activePitchLead.address.split(',')[0]}.\n\nPodemos agendar uma demonstração rápida de 5 minutos?\n\nAtenciosamente, Gestão 3D`;

                activePersuasivoText = `*Atenção Equipe da ${activePitchLead.name}!* 🚀\n\nVocês sabiam que produtos colecionáveis premium impressos em 3D são os maiores campeões de venda por impulso do ano, viralizando diariamente nas redes sociais? 😱\n\nNós da *Gestão 3D* desenvolvemos uma linha exclusiva e bicolores perfeitos para o balcão da sua loja. Clientes entram, veem os chaveiros articulados vibrantes, e compram sem hesitar!\n\nQueremos colocar a ${activePitchLead.name} como ponto de revenda parceiro exclusivo do seu bairro na ${activePitchLead.address.split(',')[0]}.\n\nPosso enviar fotos dos nossos modelos campeões de venda no WhatsApp? O lucro é garantido, acima de 120%! 📈⚡\n\nAtenciosamente, Gestão 3D`;

                activeCurtoText = `*Olá! Tudo bem?* 👋\n\nSou da *Gestão 3D* e fabricamos chaveiros articulados, brinquedos sensoriais e itens de utilidade/decoração premium em impressora 3D (PLA bicolores).\n\nIdentificamos a *${activePitchLead.name}* e acreditamos que seus clientes adorariam nossos produtos de balcão de venda rápida, gerando para vocês mais de 100% de margem líquida.\n\nPodemos mandar fotos rápidas do catálogo de revenda pelo WhatsApp? Obrigado!`;

                activeConsignadoText = `*Olá, pessoal da ${activePitchLead.name}!* 🤝\n\nGostaríamos de propor uma parceria de *RISCO ZERO* para vocês faturarem com impressão 3D premium da *Gestão 3D*!\n\nNós deixamos um expositor compacto com um mostruário das nossas peças mais desejadas (dragões articulados e fidget toys sensoriais) por 15 dias em consignação na sua loja na ${activePitchLead.address.split(',')[0]}.\n\nSem investir nenhum centavo: o que vocês venderem, repassam nossa comissão, e o que não for vendido nós recolhemos. Sem complicação ou risco!\n\nPodemos agendar para levar o kit teste essa semana?`;

                if (aiTone === 'original') {
                  activeTextTailored = activeOriginalText;
                } else if (aiTone === 'persuasivo') {
                  activeTextTailored = activePersuasivoText;
                } else if (aiTone === 'curto') {
                  activeTextTailored = activeCurtoText;
                } else if (aiTone === 'consignado') {
                  activeTextTailored = activeConsignadoText;
                } else {
                  activeTextTailored = customAiOutput || `*Olá ${activePitchLead.name}!* [Use o campo de entrada abaixo para criar seu texto personalizado de acordo com as regras de vendas da Gestão 3D...]`;
                }
              }

              const handleRefineWithAiTop = () => {
                if (!customInstruction.trim()) {
                  alert('Por favor, digite o que você quer que a IA melhore ou altere no texto comercial!');
                  return;
                }
                if (!activePitchLead) return;
                setIsGeneratingAi(true);
                setAiTone('custom');
                setCustomAiOutput('Processando instruções... Ajustando gatilhos mentais da Gestão 3D...');
                
                setTimeout(() => {
                  const promptLower = customInstruction.toLowerCase();
                  let baseRewrite = "";
                  
                  if (promptLower.includes('desconto') || promptLower.includes('barato') || promptLower.includes('promo')) {
                    baseRewrite = `*Oportunidade Promocional: Gestão 3D & ${activePitchLead.name}!* 🎁⚡\n\nOlá equipe! Preparamos um cupom especial de *20% de DESCONTO* para o primeiro lote de atacado de chaveiros articulados e brinquedos em 3D bicolores para sua loja na ${activePitchLead.address.split(',')[0]}!\n\nAlém de ser o produto sensação do TikTok, você garante peças premium da *Gestão 3D* com margem de lucro de até 150%. Frete grátis incluso para este pedido piloto.\n\nPodemos fechar esse kit promocional no WhatsApp?`;
                  } else if (promptLower.includes('brinquedo') || promptLower.includes('criança') || promptLower.includes('infantil')) {
                    baseRewrite = `*Olá gerente da ${activePitchLead.name}!* 🧸✨\n\nNossos brinquedos sensoriais articulados bicolores e Dragões Premium fabricados pela *Gestão 3D* são imbatíveis no público infantil e nerd.\n\nOferecemos um expositor de mesa atraente sem custo para otimizar suas vendas de impulso no caixa. Suas vendas vão disparar!\n\nPodemos fazer um contato rápido ou enviar um PDF de demonstração?`;
                  } else if (promptLower.includes('divertido') || promptLower.includes('brinc') || promptLower.includes('emoji')) {
                    baseRewrite = `*Epaaa, pessoal da ${activePitchLead.name}!* 🤪💥 Tudo beleza por aí?\n\nSabia que as prateleiras de vocês estão precisando daquele toque mágico que as crianças piram? ✨🐉\n\nNós da *Gestão 3D* fazemos os dragões de cores mágicas mais irados da internet por impressão 3D! É colocar no balcão de vocês na ${activePitchLead.address.split(',')[0]} e ver acontecer o milagre do "quero um desse agora!" 😂\n\nBora fechar um testezinho sem complicação? Chama a gente no WhatsApp!`;
                  } else {
                    baseRewrite = `*Abordagem Direcionada | Gestão 3D para ${activePitchLead.name}* 🚀\n\nOlá! Focando na sua solicitação de: _"${customInstruction}"_.\n\nNós da *Gestão 3D* fabricamos colecionáveis premium bicolores, chaveiros criativos de alta demanda de revenda e organizadores úteis. Preparamos uma condição exclusiva sob medida para a sua loja na ${activePitchLead.address.split(',')[0]}.\n\nPodemos conversar 2 minutos no WhatsApp para demonstrar os modelos físicos do catálogo? Atenciosamente, Gestão 3D`;
                  }
                  
                  setCustomAiOutput(baseRewrite);
                  setIsGeneratingAi(false);
                }, 1100);
              };

              const handleCopyTopText = () => {
                if (!activeTextTailored) return;
                navigator.clipboard.writeText(activeTextTailored);
                setCopiedTextFeedback(true);
                setTimeout(() => setCopiedTextFeedback(false), 2000);
              };

              const activeCleanPhone = activePitchLead ? (activePitchLead.phone || '').replace(/\D/g, '') : '';
              const activeWaUrl = `https://api.whatsapp.com/send?phone=${activeCleanPhone}&text=${encodeURIComponent(activeTextTailored)}`;

              return (
                <div className="lg:col-span-5 bg-gradient-to-b from-[#101412] to-[#161D1A] border-2 border-[#b7ff00]/20 rounded-2xl p-4 flex flex-col justify-between shadow-[0_0_20px_rgba(183,255,0,0.05)] relative overflow-hidden group">
                  
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#b7ff00]/5 rounded-full filter blur-xl pointer-events-none group-hover:bg-[#b7ff00]/10 transition duration-300" />

                  <div className="space-y-3.5">
                    
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-[#232B27] pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-[#b7ff00]/10 rounded-lg border border-[#b7ff00]/20">
                          <Cpu className="h-4 w-4 text-[#b7ff00] animate-pulse" />
                        </div>
                        <div>
                          <strong className="text-xs font-black text-[#F1F4EE] uppercase tracking-wider block font-mono">
                            Copiador & Envio por IA 🪄
                          </strong>
                          <span className="text-[9px] text-[#8BA58D] font-mono leading-none">
                            Gestão 3D - Prospecção Ativa WhatsApp
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Destination Info Card */}
                    {activePitchLead ? (
                      <div className="p-3 bg-black/40 border border-[#232B27] rounded-xl space-y-1.5 relative">
                        <div className="flex items-center justify-between">
                          <span className="px-1.5 py-0.5 bg-[#b7ff00]/15 text-[#b7ff00] border border-[#b7ff00]/30 rounded text-[8px] font-mono font-bold uppercase">
                            {activePitchLead.category}
                          </span>
                          <span className="text-[8.5px] font-mono text-zinc-500">
                            DDD {activePitchLead.phone.substring(1, 3)}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-white truncate">
                          🎯 Destinatário: {activePitchLead.name}
                        </h5>
                        <p className="text-[9.5px] text-zinc-400 leading-none truncate flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-zinc-500 shrink-0" />
                          <span>{activePitchLead.address}</span>
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-zinc-900/40 border border-[#232B27] rounded-xl text-center text-xs text-zinc-500 py-6 font-mono">
                        Nenhuma loja localizada para gerar texto. Use a busca do radar acima!
                      </div>
                    )}

                    {/* Selector of Tones */}
                    {activePitchLead && (
                      <div className="space-y-1">
                        <label className="text-[9.5px] text-[#8BA58D] font-mono block">Escolha o Tom Comercial da Abordagem:</label>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1">
                          {[
                            { key: 'original', label: 'Específico 📋' },
                            { key: 'persuasivo', label: 'Persuasivo 🚀' },
                            { key: 'curto', label: 'Curto ⚡' },
                            { key: 'consignado', label: 'Consignado 🤝' }
                          ].map(t => (
                            <button
                              key={t.key}
                              type="button"
                              onClick={() => {
                                setAiTone(t.key as any);
                                setCustomInstruction('');
                              }}
                              className={`py-1 rounded-md text-[9px] font-mono font-bold transition text-center cursor-pointer border ${
                                aiTone === t.key 
                                  ? 'bg-[#b7ff00]/10 text-[#b7ff00] border-[#b7ff00]/30 shadow-sm shadow-[#b7ff00]/10' 
                                  : 'bg-black/30 text-zinc-400 border-[#232B27] hover:bg-[#1C221F] hover:text-white'
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Preview box / Terminal containing the Sales Pitch */}
                    {activePitchLead && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[9.5px] text-[#8BA58D] font-mono">Texto final gerado (Pronto para Copiar & Enviar):</label>
                          <span className="text-[8.5px] text-zinc-500 font-mono">Formato WhatsApp</span>
                        </div>
                        <div className="relative font-mono">
                          <textarea
                            readOnly
                            value={activeTextTailored}
                            rows={8}
                            className="w-full text-[10.5px] p-2.5 bg-[#0A0D0B] border border-[#232B27] rounded-xl font-mono text-zinc-200 outline-none resize-none leading-relaxed focus:border-[#b7ff00]/30 scrollbar-thin overflow-y-auto"
                          />
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Actions Area */}
                  {activePitchLead && (
                    <div className="space-y-2 mt-3 pt-3 border-t border-[#232B27]/60">
                      
                      {/* AI instructions refinement bar */}
                      <div className="flex gap-1.5 items-center bg-black/40 border border-[#232B27] p-1 rounded-xl">
                        <input
                          type="text"
                          placeholder="Melhorar com IA: escreva ex: 'conceder amostra grátis'..."
                          value={customInstruction}
                          onChange={(e) => setCustomInstruction(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleRefineWithAiTop();
                            }
                          }}
                          className="flex-1 bg-transparent px-2 py-1 text-[10px] outline-none text-zinc-150 placeholder-zinc-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={handleRefineWithAiTop}
                          disabled={isGeneratingAi}
                          className="px-3 py-1 bg-[#b7ff00]/10 hover:bg-[#b7ff00]/20 border border-[#b7ff00]/30 text-[#b7ff00] text-[9px] font-mono font-black uppercase rounded-lg transition shrink-0 cursor-pointer disabled:opacity-40"
                        >
                          {isGeneratingAi ? 'Pensando...' : 'Melhorar 🪄'}
                        </button>
                      </div>

                      {/* Prime Send Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleCopyTopText}
                          className={`py-2 text-xs font-bold font-sans rounded-xl border transition flex items-center justify-center gap-1 cursor-pointer ${
                            copiedTextFeedback 
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                              : 'bg-[#232A25] hover:bg-[#2A352F] text-zinc-200 border-[#2F3D35]'
                          }`}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          {copiedTextFeedback ? 'Copiado! ✓' : 'Copiar Texto Pronto 📋'}
                        </button>

                        <a
                          href={activeWaUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold font-sans rounded-xl transition flex items-center justify-center gap-1 cursor-pointer shadow-md shadow-emerald-500/10 border border-emerald-400"
                        >
                          <MessageSquare className="h-3.5 w-3.5 fill-black" />
                          Enviar via WhatsApp Direct 📲
                        </a>
                      </div>

                      <div className="text-[8.5px] text-zinc-500 text-center font-mono leading-none mt-1">
                        👉 Dica: Clique em qualquer card de loja na lista comercial abaixo para focar a IA nela!
                      </div>
                    </div>
                  )}

                </div>
              );
            })()}

          </div>

        </div>

        {/* CRM MAIN LEAD CONTROL DASHBOARD */}
        <div className="space-y-4">
          
          {/* Header & Filter Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#232B27]/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2.5 bg-[#b7ff00]/15 text-[#b7ff00] text-xs font-black uppercase font-mono rounded-lg">
                CRM Leads
              </span>
              <span className="text-xs text-zinc-400">
                Acompanhamento e funil de conversão ativo
              </span>
            </div>

            {/* Category selection filters */}
            <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1" id="lead-filter-group">
              {['Todos', ...LEAD_CATEGORIES].map((cat) => {
                const count = cat === 'Todos' 
                  ? prospectLeads.length 
                  : prospectLeads.filter(l => l.category === cat).length;
                
                // Only show pills with items OR show all 13 primary categories to allow exploring
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition duration-150 cursor-pointer ${
                      activeCategoryFilter === cat 
                        ? 'bg-[#b7ff00] text-black font-black shadow-[0_0_8px_rgba(183,255,0,0.2)]' 
                        : 'bg-[#1C221E] hover:bg-[#232A25] text-zinc-300 border border-[#2A352F]'
                    }`}
                  >
                    {cat} <span className="opacity-60 text-[9.5px]">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* LEADS LIST GRID DESIGN */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="leads-grid-container">
            {prospectLeads
              .filter(l => activeCategoryFilter === 'Todos' || l.category === activeCategoryFilter)
              .map((lead) => {
                // Determine color schemes based on lead status
                const badgeStyle = 
                  lead.status === 'PROSPECT' ? { bg: 'bg-[#1A232F]', text: 'text-zinc-350', border: 'border-zinc-500/20', label: 'Prospecção Inicial' } :
                  lead.status === 'CONTACTED' ? { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', label: 'Mensagem Enviada ✓' } :
                  lead.status === 'VISITED' ? { bg: 'bg-[#b7ff00]/10', text: 'text-[#b7ff00]', border: 'border-[#b7ff00]/20', label: 'Local Visitado 🚶‍♂️' } :
                  lead.status === 'INTERESTED' ? { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/25', label: 'Gostou / Quer Comprar 😍' } :
                  { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-400/30', label: '🏆 Ganho (Virou Cliente!' };

                const cleanPhone = (lead.phone || '').replace(/\D/g, '');
                const waMessage = encodeURIComponent(
                  `*Olá, tudo bem?* 👋\n\nIdentifiquei a *${lead.name}* aqui pela região e decidimos fazer contato!\n\nNós possuímos um *Ateliê de Impressão 3D de alta performance* focado em fornecer peças decorativas e chaveiros articulados que vendem igual água no balcão de lojas. Vocês trabalham com esse tipo de item ou teriam interesse em colocar algumas peças bonitas sob consignação para testar sem risco? \n\nAbraço do Ateliê Gestão 3D!`
                );
                const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${waMessage}`;

                const isCurrentlyFocused = focusedLeadId === lead.id || (focusedLeadId === '' && prospectLeads.findIndex(p => p.id === lead.id) === 0);

                return (
                  <div 
                    key={lead.id} 
                    onClick={() => setFocusedLeadId(lead.id)}
                    className={`bg-[#1A201C] border rounded-xl p-4 flex flex-col justify-between hover:border-[#b7ff00]/50 hover:translate-y-[-2px] transition duration-200 shadow-md relative group cursor-pointer ${
                      isCurrentlyFocused 
                        ? 'border-[#b7ff00] ring-2 ring-[#b7ff00]/20 shadow-[0_0_15px_rgba(183,255,0,0.1)]' 
                        : 'border-[#232B27]'
                    }`}
                    id={`lead_card_${lead.id}`}
                  >
                    
                    {/* Header Details */}
                    <div>
                      <div className="flex items-center justify-between border-b border-[#232B27]/40 pb-2 mb-2 gap-2">
                        <span className="px-2 py-0.5 bg-black/40 text-[#8BA58D] border border-[#232B27] rounded-md text-[9px] font-mono uppercase font-black">
                          {lead.category}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          {isCurrentlyFocused && (
                            <span className="bg-[#b7ff00]/10 text-[#b7ff00] text-[8.5px] font-mono border border-[#b7ff00]/25 px-1 rounded">
                              Painel Ativo ⚡
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-md text-[8.5px] font-mono uppercase font-black border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                            {badgeStyle.label}
                          </span>
                        </div>
                      </div>

                      <h4 
                        onClick={(e) => {
                          e.stopPropagation();
                          setFocusedLeadId(lead.id);
                          setSelectedLeadForModal(lead);
                        }}
                        className="text-xs font-bold text-[#F1F4EE] hover:text-[#b7ff00] cursor-pointer flex items-center justify-between group-hover:underline "
                      >
                        <span className="truncate">{lead.name}</span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-[#8BA58D]" />
                      </h4>

                      <p className="text-[10px] text-zinc-400 font-mono mt-1 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                        <span className="truncate">{lead.address}</span>
                      </p>

                      <p className="text-[10px] text-[#A58F8D] font-mono mt-1 flex items-center gap-1 border-t border-[#232B27]/40 pt-1.5 mt-2">
                        <MessageSquare className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span>WhatsApp: <strong className="text-white">{lead.phone}</strong></span>
                      </p>

                      {/* Micro inline checklist display */}
                      <div className="grid grid-cols-4 gap-1 mt-3 pt-2 border-t border-[#232B27]/40 text-[9px] font-mono text-zinc-400" onClick={(e) => e.stopPropagation()}>
                        <label className="flex flex-col items-center gap-1 text-center cursor-pointer hover:text-white" title="Mensagem enviada">
                          <span>Msg</span>
                          <input 
                            type="checkbox" 
                            checked={!!lead.timelineChecklist?.s1}
                            onChange={(e) => handleToggleLeadChecklist(lead.id, 's1', e.target.checked)}
                            className="h-3 w-3 accent-emerald-500 cursor-pointer"
                          />
                        </label>
                        <label className="flex flex-col items-center gap-1 text-center cursor-pointer hover:text-white" title="Visita feita">
                          <span>Visita</span>
                          <input 
                            type="checkbox" 
                            checked={!!lead.timelineChecklist?.s2}
                            onChange={(e) => handleToggleLeadChecklist(lead.id, 's2', e.target.checked)}
                            className="h-3 w-3 accent-emerald-500 cursor-pointer"
                          />
                        </label>
                        <label className="flex flex-col items-center gap-1 text-center cursor-pointer hover:text-white" title="Quer comprar">
                          <span>Quer</span>
                          <input 
                            type="checkbox" 
                            checked={!!lead.timelineChecklist?.s3}
                            onChange={(e) => handleToggleLeadChecklist(lead.id, 's3', e.target.checked)}
                            className="h-3 w-3 accent-emerald-500 cursor-pointer"
                          />
                        </label>
                        <label className="flex flex-col items-center gap-1 text-center cursor-pointer hover:text-rose-400" title="Comprou e virou cliente!">
                          <span>Fechou</span>
                          <input 
                            type="checkbox" 
                            checked={!!lead.timelineChecklist?.s4}
                            onChange={(e) => handleToggleLeadChecklist(lead.id, 's4', e.target.checked)}
                            className="h-3 w-3 accent-emerald-500 cursor-pointer"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Footer buttons of card */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#232B27]/60" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          setFocusedLeadId(lead.id);
                          setSelectedLeadForModal(lead);
                        }}
                        className="py-1.5 bg-[#232A25] hover:bg-[#2A352F] text-zinc-200 border border-[#2F3D35] font-bold text-[10.5px] rounded-lg transition text-center cursor-pointer"
                      >
                        Ficha do Lead 🗃️
                      </button>

                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1.5 bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/25 text-emerald-400 hover:text-white font-black text-[10.5px] rounded-lg transition flex items-center justify-center gap-1 text-center"
                      >
                        <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                        <span>Mandar Zap</span>
                      </a>
                    </div>

                  </div>
                );
              })}
          </div>

          {prospectLeads.length === 0 && (
            <div className="text-center p-8 bg-[#111412] border border-[#232B27] rounded-xl space-y-2">
              <span className="text-2xl">📡</span>
              <p className="text-xs text-zinc-400 font-bold">Nenhum potencial cliente / Lead encontrado nesta aba.</p>
              <p className="text-[10px] text-zinc-500">Utilize a busca por Google Maps acima para povoar sua lista automatizada ou crie uma manualmente.</p>
            </div>
          )}

        </div>

      </div>
      </div>
      )}

      {/* ========================================================================= */}
      {/* 🔮 MODAL DETALHADO DO LEAD B2B ("PÁGINA DO LEAD" COM STATUS & CHECKLISTS) */}
      {/* ========================================================================= */}
      {viewMode !== 'printers' && selectedLeadForModal && (() => {
        // Find newest update in local state list
        const lead = prospectLeads.find(l => l.id === selectedLeadForModal.id) || selectedLeadForModal;
        const originalText = buildOriginalText(lead);
        const persuasivoText = buildPersuasivoText(lead);
        const curtoText = buildCurtoText(lead);
        const consignadoText = buildConsignadoText(lead);

        let textTailored = "";
        if (aiTone === 'original') {
          textTailored = originalText;
        } else if (aiTone === 'persuasivo') {
          textTailored = persuasivoText;
        } else if (aiTone === 'curto') {
          textTailored = curtoText;
        } else if (aiTone === 'consignado') {
          textTailored = consignadoText;
        } else {
          textTailored = customAiOutput || `[Escreva sua instrução no campo de entrada abaixo e clique em Gerar IA para criar seu texto personalizado de acordo com as regras de vendas da Gestão 3D...]`;
        }

        const handleRefineWithAi = () => {
          if (!customInstruction.trim()) {
            alert('Por favor, digite o que você quer que a IA melhore ou altere no texto comercial!');
            return;
          }
          setIsGeneratingAi(true);
          setAiTone('custom');
          setCustomAiOutput('Processando instruções... Ajustando gatilhos mentais da Gestão 3D...');

          setTimeout(() => {
            setCustomAiOutput(buildRefinedText(lead, customInstruction));
            setIsGeneratingAi(false);
          }, 1100);
        };

        const copyPitchText = () => {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(textTailored);
            alert('Mensagem de prospecção gerada e copiada com sucesso! Pronta para enviar no Zap! 📲✓');
          } else {
            alert('Por favor, selecione e copie manualmente o texto abaixo.');
          }
        };

        return (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none animate-in fade-in duration-200" style={{ pointerEvents: 'auto' }}>
            <div className="bg-[#151917] border border-[#232B27] rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
              
              {/* Header section with Close Button */}
              <div className="flex items-center justify-between border-b border-[#232B27] pb-4">
                <div>
                  <span className="px-2.5 py-1 bg-[#b7ff00]/10 text-[#b7ff00] border border-[#b7ff00]/20 text-[10px] font-mono font-bold uppercase rounded-md tracking-wider">
                    FICHA DETALHADA DO LEAD COMERCIAL • CRM
                  </span>
                  <h3 className="text-sm font-bold text-[#F1F4EE] flex items-center gap-2 mt-1.5">
                    <Building2 className="h-4.5 w-4.5 text-[#b7ff00]" />
                    {lead.name}
                  </h3>
                </div>

                <button 
                  type="button"
                  onClick={() => setSelectedLeadForModal(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/25 hover:bg-red-600 hover:text-white border border-red-500/15 text-[#F1F4EE] rounded-xl text-xs font-bold transition duration-200 cursor-pointer"
                >
                  <span>Fechar</span>
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Informações de Localização e Zap */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/45 border border-[#232B27] p-4 rounded-xl">
                <div className="space-y-1">
                  <span className="text-[9px] font-mono uppercase font-black text-zinc-500 block">Endereço Comercial / Local</span>
                  <span className="text-xs text-[#F1F4EE] font-medium block">{lead.address}</span>
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.name + ' ' + lead.address)}`}
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[10px] text-[#b7ff00] hover:underline flex items-center gap-1 mt-1 font-bold"
                  >
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span>Abrir Rota no Google Maps Oficial</span>
                  </a>
                </div>

                <div className="space-y-1 md:border-l md:border-[#232B27] md:pl-4">
                  <span className="text-[9px] font-mono uppercase font-black text-zinc-500 block">WhatsApp de Contato Direct</span>
                  <span className="text-xs text-[#F1F4EE] font-mono font-bold block">{lead.phone}</span>
                  <a 
                    href={`https://api.whatsapp.com/send?phone=${lead.phone.replace(/\D/g, '')}&text=${encodeURIComponent(textTailored)}`}
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 mt-1 font-bold"
                  >
                    <MessageSquare className="h-3 w-3 shrink-0" />
                    <span>Iniciar Chat no WhatsApp (Com Pitch Inteligente)</span>
                  </a>
                </div>
              </div>

              {/* INTERACTIVE FUNNEL PROGRESS CHECKLIST */}
              <div className="space-y-3 bg-[#0C0E0D] border border-[#b7ff00]/15 p-4 rounded-2xl">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-[#b7ff00] uppercase tracking-widest font-mono flex items-center gap-1.5">
                    <CheckSquare className="h-4 w-4 text-[#b7ff00]" />
                    <span>Funil e Checklist de Prospecção</span>
                  </h4>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Status Atual: <strong className="text-white bg-[#a3e000]/20 border border-[#b7ff00]/30 px-2 py-0.5 rounded uppercase">{lead.status}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                  
                  {/* STEP 1 */}
                  <div 
                    onClick={() => handleToggleLeadChecklist(lead.id, 's1', !lead.timelineChecklist?.s1)}
                    className={`p-3 border rounded-xl cursor-pointer select-none transition ${
                      lead.timelineChecklist?.s1 
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                        : 'bg-black/35 border-[#232B27] text-zinc-400 hover:border-zinc-550'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 justify-between">
                      <span className="text-[9px] font-mono font-extrabold uppercase">Etapa 1</span>
                      <input 
                        type="checkbox" 
                        checked={!!lead.timelineChecklist?.s1}
                        onChange={() => {}} // Swallower as div click handles it
                        className="h-3.5 w-3.5 accent-emerald-500 shrink-0"
                      />
                    </div>
                    <span className="text-xs font-bold block mt-1.5">Msg Enviada 📲</span>
                    <p className="text-[8px] text-zinc-500 leading-tight mt-0.5">Contato feito no WhatsApp</p>
                  </div>

                  {/* STEP 2 */}
                  <div 
                    onClick={() => handleToggleLeadChecklist(lead.id, 's2', !lead.timelineChecklist?.s2)}
                    className={`p-3 border rounded-xl cursor-pointer select-none transition ${
                      lead.timelineChecklist?.s2 
                        ? 'bg-[#182a1f] border-emerald-500/50 text-emerald-400' 
                        : 'bg-black/35 border-[#232B27] text-zinc-400 hover:border-zinc-550'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 justify-between">
                      <span className="text-[9px] font-mono font-extrabold uppercase">Etapa 2</span>
                      <input 
                        type="checkbox" 
                        checked={!!lead.timelineChecklist?.s2}
                        onChange={() => {}}
                        className="h-3.5 w-3.5 accent-emerald-500 shrink-0"
                      />
                    </div>
                    <span className="text-xs font-bold block mt-1.5">Loja Visitada 🚶‍♂️</span>
                    <p className="text-[8px] text-zinc-500 leading-tight mt-0.5">Apresentou peça física em mãos</p>
                  </div>

                  {/* STEP 3 */}
                  <div 
                    onClick={() => handleToggleLeadChecklist(lead.id, 's3', !lead.timelineChecklist?.s3)}
                    className={`p-3 border rounded-xl cursor-pointer select-none transition ${
                      lead.timelineChecklist?.s3 
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                        : 'bg-black/35 border-[#232B27] text-zinc-400 hover:border-zinc-550'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 justify-between">
                      <span className="text-[9px] font-mono font-extrabold uppercase">Etapa 3</span>
                      <input 
                        type="checkbox" 
                        checked={!!lead.timelineChecklist?.s3}
                        onChange={() => {}}
                        className="h-3.5 w-3.5 accent-amber-500 shrink-0"
                      />
                    </div>
                    <span className="text-xs font-bold block mt-1.5">Quer Comprar 😍</span>
                    <p className="text-[8px] text-zinc-500 leading-tight mt-0.5">Manifestou interesse/consignado</p>
                  </div>

                  {/* STEP 4 */}
                  <div 
                    onClick={() => handleToggleLeadChecklist(lead.id, 's4', !lead.timelineChecklist?.s4)}
                    className={`p-3 border rounded-xl cursor-pointer select-none transition ${
                      lead.timelineChecklist?.s4 
                        ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 ring-2 ring-emerald-500/20' 
                        : 'bg-black/35 border-[#232B27] text-zinc-400 hover:border-zinc-550'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 justify-between">
                      <span className="text-[9px] font-mono font-extrabold uppercase">Etapa 4</span>
                      <input 
                        type="checkbox" 
                        checked={!!lead.timelineChecklist?.s4}
                        onChange={() => {}}
                        className="h-3.5 w-3.5 accent-emerald-500 shrink-0"
                      />
                    </div>
                    <span className="text-xs font-extrabold block mt-1.5">Comprado! 💰</span>
                    <p className="text-[8px] text-zinc-500 leading-tight mt-0.5">Fechou primeiro pedido lote</p>
                  </div>

                </div>
              </div>

              {/* TONE SELECTION AREA */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wide block">
                  Estilo e Tom de Abordagem (Obrigações Gestão 3D)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAiTone('original')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      aiTone === 'original'
                        ? 'bg-orange-500 text-black font-extrabold'
                        : 'bg-[#1C221E] text-zinc-300 border border-[#2A352F] hover:bg-[#232A25]'
                    }`}
                  >
                    <span>Original 📋</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiTone('persuasivo')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      aiTone === 'persuasivo'
                        ? 'bg-[#D97706] text-white font-extrabold'
                        : 'bg-[#1C221E] text-zinc-300 border border-[#2A352F] hover:bg-[#232A25]'
                    }`}
                  >
                    <span>🔥 IA Persuasivo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiTone('curto')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      aiTone === 'curto'
                        ? 'bg-[#a3e000] text-white font-extrabold'
                        : 'bg-[#1C221E] text-zinc-300 border border-[#2A352F] hover:bg-[#232A25]'
                    }`}
                  >
                    <span>⚡ IA Curto e Direto</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiTone('consignado')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                      aiTone === 'consignado'
                        ? 'bg-emerald-600 text-white font-extrabold'
                        : 'bg-[#1C221E] text-zinc-300 border border-[#2A352F] hover:bg-[#232A25]'
                    }`}
                  >
                    <span>🤝 IA Consignado (Risco Zero)</span>
                  </button>
                </div>
              </div>

              {/* CUSTOM AI INSTRUCTION BOX */}
              <div className="bg-[#121614] border border-[#232B27] p-3.5 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#b7ff00] font-bold uppercase flex items-center gap-1.5">
                    <span>✨</span> IA Melhora Abordagem (Adicione argumentos de vendas)
                  </span>
                  {isGeneratingAi && <span className="text-[10px] text-[#b7ff00] animate-pulse bg-[#1a2a00] px-2 py-0.5 rounded font-mono font-black">Processando...</span>}
                </div>
                <div className="flex gap-2 font-sans">
                  <input
                    type="text"
                    value={customInstruction}
                    onChange={(e) => setCustomInstruction(e.target.value)}
                    placeholder="Ex: Ofereça desconto de 20% no atacado, mencione frete grátis..."
                    className="flex-1 bg-[#1A1F1C] border border-[#2A352F] rounded-xl px-3 py-2 text-xs text-[#F1F4EE] placeholder-zinc-650 focus:outline-none focus:border-[#b7ff00] font-sans"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleRefineWithAi();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleRefineWithAi}
                    className="px-4 py-2 bg-[#b7ff00] hover:bg-[#b7ff00] text-black text-xs font-black rounded-xl transition cursor-pointer shrink-0 font-sans"
                  >
                    Otimizar por IA 🪄
                  </button>
                </div>
              </div>

              {/* INTEL PITCH COPYWRITER WIDGET */}
              <div className="bg-[#1C201D] border border-[#232B27] p-4.5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-orange-400">⚡</span>
                    <h5 className="text-[11px] font-mono uppercase font-black text-orange-400 tracking-wider">
                      Gerador Automático de Pitch para WhatsApp ({lead.category})
                    </h5>
                  </div>

                  <button
                    type="button"
                    onClick={copyPitchText}
                    className="px-2.5 py-1 text-[9.5px] font-black uppercase text-orange-400 border border-orange-500/25 bg-orange-500/5 hover:bg-orange-500 hover:text-black rounded-lg transition"
                  >
                    Copiar Texto Pronto 📋
                  </button>
                </div>

                <div className="p-3.5 bg-black/50 border border-[#232B27] rounded-xl text-xs text-zinc-300 font-sans italic relative pr-8 leading-relaxed max-h-[150px] overflow-y-auto">
                  {textTailored.split('\n').map((line, key) => (
                    <span key={key} className="block">{line || ' '}</span>
                  ))}
                </div>

                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  📖 <strong>Como usar:</strong> Clique em copiar, depois clique no botão verde do WhatsApp para abrir a janela ou aplicativo de celular e cole o texto diretamente na caixa de envios.
                </p>
              </div>

              {/* NOTE & LOGS EDITOR */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wide block">
                  Notas de Visita Comercial e Ajustes
                </label>
                <textarea 
                  rows={2}
                  className="w-full bg-black/40 border border-[#232B27] rounded-xl p-3 text-xs text-[#F1F4EE] placeholder-zinc-550 focus:outline-none focus:border-[#b7ff00]"
                  placeholder="Escreva anotações como: 'Dono chamava Carlos, aceitou mostruário e quer resposta na próxima sexta-feira de manhã...'"
                  value={lead.note || ''}
                  onChange={(e) => {
                    const textValue = e.target.value;
                    setProspectLeads(prev => prev.map(l => l.id === lead.id ? { ...l, note: textValue } : l));
                  }}
                />
              </div>

              {/* CRITICAL ACTIONS WORKFLOW */}
              <div className="flex flex-col sm:flex-row items-center gap-2 border-t border-[#232B27] pt-4 justify-between">
                
                <button
                  type="button"
                  onClick={() => handleDeleteLead(lead.id)}
                  className="px-4 py-2.5 text-red-500 hover:text-white bg-red-650/10 hover:bg-red-600 border border-red-500/15 hover:border-red-500 text-xs font-black rounded-xl transition cursor-pointer"
                >
                  Excluir Lead do Funil ❌
                </button>

                {/* PROMOTE LEAD PROMINENT BUTTON (O botão que transforma em cliente oficial) */}
                <button
                  type="button"
                  onClick={() => handlePromoteLeadToClient(lead)}
                  className="py-3 px-6 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 font-black text-xs text-black rounded-2xl transition duration-150 transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-emerald-500/10 cursor-pointer flex items-center gap-2"
                >
                  <span>🏆 PROMOVER PARA CLIENTE OFICIAL DO ATELIÊ</span>
                  <ChevronRight className="h-4 w-4 text-black" />
                </button>

              </div>

            </div>
          </div>
        );
      })()}

      {/* 📂 CUSTOMER DETAILS & PRODUCT STOCK ENGINE MODEL (Página do Cliente) */}
      {viewMode !== 'printers' && selectedClientForPage && (() => {
        // Resolve latest client model to stay in sync with props changes
        const client = clients.find(c => c.id === selectedClientForPage.id) || selectedClientForPage;
        const stockItems = client.productsStock || [
          { name: 'Vaso Espiral Moderno', qty: 3, imageUrl: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=300&q=80' },
          { name: 'Dragão Articulado 3D', qty: 1, imageUrl: 'https://images.unsplash.com/photo-1608889175123-8ec330b86f84?auto=format&fit=crop&w=300&q=80' },
          { name: 'Suporte de Headset Universal', qty: 4, imageUrl: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=300&q=80' }
        ];

        const clientOrders = (orders || []).filter(o => o.clientId === client.id);

        // Helper to update customer stock items
        const updateStockQty = (productName: string, delta: number) => {
          const updated = stockItems.map((item: any) => {
            if (item.name === productName) {
              return { ...item, qty: Math.max(0, item.qty + delta) };
            }
            return item;
          }).filter((item: any) => item.qty > 0 || delta > 0); // Keep if qty > 0
          
          onUpdateClient(client.id, { productsStock: updated });
        };

        const removeStockProduct = (productName: string) => {
          const updated = stockItems.filter((item: any) => item.name !== productName);
          onUpdateClient(client.id, { productsStock: updated });
        };

        const addNewStockProduct = (e: React.FormEvent) => {
          e.preventDefault();
          if (!newStockName.trim()) {
            alert('Por favor digite o nome do produto vendido.');
            return;
          }
          if (stockItems.some((item: any) => item.name.toLowerCase() === newStockName.trim().toLowerCase())) {
            alert('Esse produto já está registrado no estoque deste cliente.');
            return;
          }
          const newItem = {
            name: newStockName.trim(),
            qty: Math.max(1, newStockQty),
            imageUrl: newStockImage
          };
          onUpdateClient(client.id, { productsStock: [...stockItems, newItem] });
          setNewStockName('');
          setNewStockQty(1);
          alert('Produto adicionado ao estoque do cliente com sucesso! ✓');
        };

        const handleCatalogPrefill = (catalogIdStr: string) => {
          if (!catalogIdStr) return;
          const found = catalogList.find(c => c.id.toString() === catalogIdStr);
          if (found) {
            setOrderItemName(found.name);
            setOrderWeightGrams(found.weightGrams || 50);
            setOrderPrintTime(found.printTimeHours || 4);
            setOrderPrice(found.defaultPrice || found.recommendedPrice || 35);
            setOrderFilamentType(found.filamentType || 'PLA');
            setOrderItemImage(found.imageUrl || '');
          }
        };

        const executeDirectOrder = (e: React.FormEvent) => {
          e.preventDefault();
          if (!orderItemName.trim()) {
            alert('Por favor especifique o nome do produto para tirar o pedido.');
            return;
          }

          onAddOrder({
            clientId: client.id,
            clientName: client.name,
            itemName: orderItemName.trim(),
            imageUrl: orderItemImage || undefined,
            quantity: orderQuantity,
            filamentType: orderFilamentType,
            filamentColor: orderFilamentColor,
            weightGrams: orderWeightGrams,
            printTimeHours: orderPrintTime,
            priceCharged: orderPrice * orderQuantity,
            platformSource: 'MANUAL',
            status: 'QUEUE',
            printingProgress: 0.0,
            createdAt: Date.now(),
            deadline: Date.now() + orderDeadline * 24 * 3600 * 1000
          });

          setOrderItemName('');
          setOrderItemImage('');
          setOrderQuantity(1);
          alert(`Pedido de "${orderItemName}" registrado e adicionado com sucesso para a fila de produção da Gestão 3D! 🚀✨`);
        };

        // WhatsApp Copy copywriting builder
        const getWhatsAppText = () => {
          let text = `*Olá, ${client.name}!* 👋\n\n`;
          text += `Aqui está o resumo dos seus produtos e pedidos atualizados direto do nosso *Ateliê Gestão 3D* 🪴:\n\n`;
          
          text += `📦 *SEU ESTOQUE ATUAL EM MÃOS:*\n`;
          if (stockItems.length === 0) {
            text += `_Nenhum produto em estoque registrado._\n`;
          } else {
            stockItems.forEach((p: any) => {
              text += `• *${p.name}* - *${p.qty} un*\n`;
              if (p.imageUrl) {
                text += `   📸 Foto de referência: ${p.imageUrl}\n`;
              }
            });
          }
          
          text += `\n⚙️ *SEUS PEDIDOS EM PROCESSO:*\n`;
          if (clientOrders.length === 0) {
            text += `_Nenhum pedido ativo em andamento no momento._\n`;
          } else {
            clientOrders.forEach(o => {
              const statusLabel = o.status === 'WAITING' ? 'Aguardando' :
                                  o.status === 'QUEUE' ? 'Fila de Impressão ⌛' :
                                  o.status === 'PRINTING' ? 'Imprimindo 🖨️' :
                                  o.status === 'POST_PROCESS' ? 'Acabamento/Pós-Processo' :
                                  o.status === 'READY' ? 'Pronto para Entrega! ✅' : 'Entregue';
              text += `• *${o.itemName}* (Qtd: ${o.quantity}) - _Status: ${statusLabel}_\n`;
            });
          }
          text += `\nQualquer dúvida, estamos à total disposição no Ateliê! Muito obrigado! ❤️✨`;
          return text;
        };

        const copyToClipboard = () => {
          const text = getWhatsAppText();
          const android = (window as any).AndroidInterface;
          if (android && typeof android.copyToClipboard === 'function') {
            android.copyToClipboard(text);
          } else {
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
              navigator.clipboard.writeText(text);
            } else {
              const textarea = document.createElement('textarea');
              textarea.value = text;
              textarea.style.position = 'fixed';
              textarea.style.opacity = '0';
              document.body.appendChild(textarea);
              textarea.focus();
              textarea.select();
              document.execCommand('copy');
              document.body.removeChild(textarea);
            }
            alert('Texto de cobrança e estoque com fotos copiado com sucesso! Prontinho para colar direto na conversa do WhatsApp do cliente. 📲✓');
          }
        };

        const openInWhatsApp = () => {
          const text = encodeURIComponent(getWhatsAppText());
          const cleanPhone = (client.phone || '').replace(/\D/g, '');
          const url = cleanPhone 
            ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`
            : `https://api.whatsapp.com/send?text=${text}`;
          window.open(url, '_blank');
        };

        return (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none animate-in fade-in duration-200" style={{ pointerEvents: 'auto' }}>
            <div className="bg-[#151917] border border-[#232B27] rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-150">
              
              {/* Close Button */}
              <button 
                type="button"
                onClick={() => setSelectedClientForPage(null)}
                className="absolute top-4 right-4 text-[#8BA58D] hover:text-[#F1F4EE] transition cursor-pointer p-1 bg-black/20 hover:bg-black/40 rounded-lg"
                id="close_client_page_modal"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Header profile details */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#232B27]">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 flex items-center justify-center text-[var(--brand-primary)] text-xl font-black shrink-0 font-mono">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-[var(--brand-primary)] bg-[var(--brand-primary)]/10 px-2 py-0.5 rounded border border-[var(--brand-primary)]/20 inline-block font-mono">
                      Ficha do Cliente
                    </span>
                    <h3 className="text-lg font-bold text-[#F1F4EE] truncate">{client.name}</h3>
                    <div className="text-xs text-[#8BA58D] space-y-0.5">
                      <p>💬 WhatsApp: <span className="font-mono text-[#F1F4EE]">{client.phone || 'Sem número cadastrado'}</span></p>
                      <p>✉️ E-mail: <span className="text-[#F1F4EE] font-mono">{client.email || 'Não informado'}</span></p>
                      {client.address && (
                        <p className="truncate max-w-xl">📍 Endereço: <span className="text-[#F1F4EE]">{client.address}</span></p>
                      )}
                    </div>
                  </div>
                </div>

                {/* WhatsApp Action and Copy Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-[#F1F4EE] text-xs font-black rounded-xl border border-zinc-700 hover:border-zinc-600 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    📋 Copiar p/ Zap
                  </button>
                  <button
                    type="button"
                    onClick={openInWhatsApp}
                    className="px-3.5 py-2 bg-[#25D366] hover:bg-[#20ba59] text-black text-xs font-black rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#25D366]/10"
                  >
                    💬 Enviar ao WhatsApp
                  </button>
                </div>
              </div>

              {/* Client Note */}
              {client.note && (
                <div className="p-3 bg-black/30 border border-[#232B27] rounded-xl text-xs">
                  <span className="text-[9px] uppercase text-[#8BA58D] font-mono leading-none font-bold block mb-1">Nota do Ateliê:</span>
                  <p className="text-[#F1F4EE] italic">“ {client.note} ”</p>
                </div>
              )}

              {/* MAIN CONTENT SPLIT GRID: LEFT = STOCK CONTROLS, RIGHT = MAKE ORDERS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 📦 LEFT COLUMN: ITEMIZED PHYSICAL GOODS STOCK (Estoque com Cliente) */}
                <div className="space-y-4 bg-[#0C0E0D] border border-[#232B27] p-4 rounded-2xl">
                  <div className="flex items-center justify-between border-b border-[#232B27] pb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#95BBA2] font-mono flex items-center gap-1.5">
                      <span>📦 ESTOQUE ENTREGUE AO CLIENTE</span>
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#95BBA2]/10 text-[#95BBA2]">
                      {stockItems.reduce((acc: number, item: any) => acc + item.qty, 0)} un total
                    </span>
                  </div>

                  <p className="text-[10.5px] text-[#8BA58D] leading-relaxed">
                    Abaixo estão os produtos físicos e peças vendidas que estão guardados com este cliente. Você pode controlar a quantidade em tempo real.
                  </p>

                  {/* Stock Grid List with Pictures */}
                  <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                    {stockItems.length === 0 ? (
                      <div className="p-6 bg-[#151917]/60 text-center rounded-xl border border-dashed border-[#232B27]">
                        <p className="text-xs text-[#8BA58D] font-medium">Nenhum produto em estoque cadastrado.</p>
                      </div>
                    ) : (
                      stockItems.map((item: any, idx: number) => (
                        <div key={idx} className="p-2.5 bg-[#151917] border border-[#232B27] rounded-xl flex items-center justify-between gap-3 shadow-inner">
                          <div className="flex items-center gap-3 min-w-0">
                            {item.imageUrl ? (
                              <img 
                                src={item.imageUrl} 
                                alt={item.name} 
                                referrerPolicy="no-referrer"
                                className="w-12 h-12 rounded-lg object-cover shrink-0 border border-[#232B27] shadow-sm bg-[#0C0E0D]"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-[#232B27] flex items-center justify-center text-xs text-[#8BA58D] font-bold font-mono shrink-0">
                                📦
                              </div>
                            )}
                            <div className="min-w-0 space-y-0.5">
                              <h5 className="text-xs font-extrabold text-[#F1F4EE] truncate" title={item.name}>{item.name}</h5>
                              <p className="text-[10px] text-[#8BA58D] font-mono flex items-center gap-1">
                                Qtd atual: <strong className="text-white text-xs">{item.qty} un</strong>
                              </p>
                            </div>
                          </div>

                          {/* Action panel */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center bg-[#0C0E0D] border border-[#232B27] p-1 rounded-lg">
                              <button 
                                type="button" 
                                onClick={() => updateStockQty(item.name, -1)}
                                className="w-6 h-6 bg-[#232B27] hover:bg-red-500/20 text-[#8BA58D] hover:text-red-400 rounded-md flex items-center justify-center font-bold text-xs cursor-pointer transition select-none active:scale-95"
                                title="Reduzir quantidade"
                              >
                                -
                              </button>
                              <span className="px-2.5 text-xs text-white font-black font-mono select-none">{item.qty}</span>
                              <button 
                                type="button" 
                                onClick={() => updateStockQty(item.name, 1)}
                                className="w-6 h-6 bg-[#232B27] hover:bg-[#95BBA2]/20 text-[#8BA58D] hover:text-[#95BBA2] rounded-md flex items-center justify-center font-bold text-xs cursor-pointer transition select-none active:scale-95"
                                title="Aumentar quantidade"
                              >
                                +
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeStockProduct(item.name)}
                              className="w-8 h-8 rounded-lg bg-black/40 hover:bg-red-500/10 text-[#8BA58D] hover:text-red-400 border border-[#232B27] hover:border-red-500/20 transition flex items-center justify-center cursor-pointer active:scale-95"
                              title="Excluir produto do estoque"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Product Inline Form */}
                  <form onSubmit={addNewStockProduct} className="pt-3 border-t border-[#232B27] space-y-3">
                    <span className="text-[10px] font-black uppercase text-[#8BA58D] font-mono block">
                      ➕ ADICIONAR PRODUTO NO ESTOQUE DO CLIENTE
                    </span>

                    <div className="space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Nome do produto (ex: Dragão Articulado v2)"
                          value={newStockName}
                          onChange={(e) => setNewStockName(e.target.value)}
                          className="w-full bg-[#151917] border border-[#232B27] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#95BBA2] select-text"
                        />
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[#8BA58D] select-none">Qtd:</span>
                          <input
                            type="number"
                            min="1"
                            value={newStockQty}
                            onChange={(e) => setNewStockQty(Math.max(1, parseInt(e.target.value) || 1))}
                            className="bg-[#151917] border border-[#232B27] rounded-lg w-16 px-2.5 py-1.5 text-xs text-center text-white focus:outline-none focus:border-[#95BBA2]"
                          />
                        </div>
                      </div>

                      {/* Photo Preset Selector */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] text-[#8BA58D] font-black uppercase block">Imagens Ilustrativas para WhatsApp:</label>
                          <label className="text-[10px] font-black uppercase px-2 py-1 rounded-md bg-[#95BBA2]/15 text-[#95BBA2] border border-[#95BBA2]/30 hover:bg-[#95BBA2]/25 cursor-pointer transition">
                            📤 Enviar foto
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (file.size > 5 * 1024 * 1024) {
                                  alert('Imagem muito grande (máx 5MB).');
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onload = () => setNewStockImage(String(reader.result || ''));
                                reader.readAsDataURL(file);
                                e.target.value = '';
                              }}
                            />
                          </label>
                        </div>
                        {newStockImage && newStockImage.startsWith('data:') && (
                          <div className="flex items-center gap-2 p-1.5 bg-[#151917] border border-[#95BBA2]/40 rounded-lg">
                            <img src={newStockImage} alt="Upload" className="w-10 h-10 rounded object-cover" />
                            <span className="text-[10px] text-[#95BBA2] font-bold">Imagem personalizada selecionada ✓</span>
                          </div>
                        )}
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { name: 'Vaso', url: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=300&q=80' },
                            { name: 'Toy Dragão', url: 'https://images.unsplash.com/photo-1608889175123-8ec330b86f84?auto=format&fit=crop&w=300&q=80' },
                            { name: 'Componente', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80' },
                            { name: 'Organizador', url: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=300&q=80' }
                          ].map(preset => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => setNewStockImage(preset.url)}
                              className={`p-1 bg-[#151917] border rounded-lg transition-all flex flex-col items-center gap-1 cursor-pointer truncate ${
                                newStockImage === preset.url 
                                  ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5 text-[var(--brand-primary)]' 
                                  : 'border-[#232B27] text-[#8BA58D] hover:border-zinc-500'
                              }`}
                            >
                              <img src={preset.url} alt={preset.name} referrerPolicy="no-referrer" className="w-8 h-8 rounded object-cover" />
                              <span className="text-[8.5px] font-sans font-bold block truncate w-full text-center">{preset.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-1.5 bg-[#95BBA2] hover:bg-[#b6d8b4] text-black text-xs font-black rounded-lg transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Registrar no Estoque do Cliente 🏦
                      </button>
                    </div>
                  </form>
                </div>

                {/* 📥 RIGHT COLUMN: ORDER INTAKE FORM (Lugar para tirar pedido) */}
                <div className="space-y-4 bg-[#0C0E0D] border border-[#232B27] p-4 rounded-2xl">
                  <div className="flex items-center justify-between border-b border-[#232B27] pb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#E2B144] font-mono flex items-center gap-1.5">
                      <span>📥 TIRAR &amp; LANÇAR PEDIDO DE PRODUÇÃO</span>
                    </h4>
                    <span className="text-[9.5px] text-zinc-400 bg-zinc-800/60 px-2 py-0.5 rounded font-mono uppercase">Atalho Ateliê</span>
                  </div>

                  <p className="text-[10.5px] text-[#8BA58D] leading-relaxed">
                    Abra uma ordem de impressão direta para este cliente. Os dados de pesagem e custos serão calculados automaticamente na fila de produção.
                  </p>

                  <form onSubmit={executeDirectOrder} className="space-y-3">
                    
                    {/* Catalog Prefill Selector */}
                    {catalogList.length > 0 && (
                      <div className="space-y-1">
                        <label className="text-[10px] text-[#8BA58D] font-black uppercase block">Prefixados (Nosso Catálogo de Vendas):</label>
                        <select
                          onChange={(e) => handleCatalogPrefill(e.target.value)}
                          className="w-full bg-[#151917] border border-[#232B27] rounded-lg py-1.5 px-3.5 text-xs text-[#F1F4EE] focus:outline-none focus:border-[#95BBA2] font-mono"
                          defaultValue=""
                        >
                          <option value="">-- Selecione uma peça do catálogo para autopreencher --</option>
                          {catalogList.map(item => (
                            <option key={item.id} value={item.id.toString()}>
                              {item.name} (Sugerido: R$ {item.defaultPrice || item.recommendedPrice})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Item Description Name */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#8BA58D] font-black uppercase block">Peça / Produto Desejado:</label>
                      <input
                        type="text"
                        placeholder="Ex: Dragão Articulado Gigante, Vaso Espiral..."
                        value={orderItemName}
                        onChange={(e) => setOrderItemName(e.target.value)}
                        className="w-full bg-[#151917] border border-[#232B27] rounded-lg py-1.5 px-2.5 text-xs text-white focus:outline-none focus:border-[#95BBA2] select-text"
                        required
                      />
                    </div>

                    {/* Order item image upload */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-[#8BA58D] font-black uppercase block">Foto da Peça (opcional):</label>
                        <label className="text-[10px] font-black uppercase px-2 py-1 rounded-md bg-[#E2B144]/15 text-[#E2B144] border border-[#E2B144]/30 hover:bg-[#E2B144]/25 cursor-pointer transition">
                          📤 Enviar foto
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 5 * 1024 * 1024) { alert('Imagem muito grande (máx 5MB).'); return; }
                              const reader = new FileReader();
                              reader.onload = () => setOrderItemImage(String(reader.result || ''));
                              reader.readAsDataURL(file);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                      {orderItemImage && (
                        <div className="flex items-center gap-2 p-1.5 bg-[#151917] border border-[#E2B144]/40 rounded-lg">
                          <img src={orderItemImage} alt="Upload" className="w-10 h-10 rounded object-cover" />
                          <span className="text-[10px] text-[#E2B144] font-bold flex-1">Foto da peça selecionada ✓</span>
                          <button type="button" onClick={() => setOrderItemImage('')} className="text-[10px] text-red-400 hover:text-red-300 font-bold cursor-pointer">remover</button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-[#8BA58D] font-black uppercase block">Quantidade (un):</label>
                        <input
                          type="number"
                          min="1"
                          value={orderQuantity}
                          onChange={(e) => setOrderQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-[#151917] border border-[#232B27] rounded-lg py-1.5 px-2.5 text-xs text-white focus:outline-none focus:border-[#95BBA2]"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-[#8BA58D] font-black uppercase block">Prazo (Dias p/ entrega):</label>
                        <input
                          type="number"
                          min="1"
                          value={orderDeadline}
                          onChange={(e) => setOrderDeadline(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-[#151917] border border-[#232B27] rounded-lg py-1.5 px-2.5 text-xs text-white focus:outline-none focus:border-[#95BBA2]"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-[#8BA58D] font-black uppercase block">Material do Filamento:</label>
                        <select
                          value={orderFilamentType}
                          onChange={(e) => setOrderFilamentType(e.target.value)}
                          className="w-full bg-[#151917] border border-[#232B27] rounded-lg py-1.5 px-2 text-xs text-[#F1F4EE]"
                        >
                          <option value="PLA">PLA (Rígido Orgânico)</option>
                          <option value="PETG">PETG (Industrial Resistente)</option>
                          <option value="ABS">ABS (Térmico Automotivo)</option>
                          <option value="TPU">TPU (Flexível/Borracha)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-[#8BA58D] font-black uppercase block">Cor Solicitada:</label>
                        <input
                          type="text"
                          placeholder="Ex: Vermelho Rubi, Preto, Verde Seda"
                          value={orderFilamentColor}
                          onChange={(e) => setOrderFilamentColor(e.target.value)}
                          className="w-full bg-[#151917] border border-[#232B27] rounded-lg py-1.5 px-2.5 text-xs text-white focus:outline-none focus:border-[#a1c4ab] font-mono select-text"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-[#151917]/50 border border-[#232B27]/40 p-2.5 rounded-xl">
                      <div className="space-y-1">
                        <label className="text-[9px] text-[#8BA58D] font-bold block">Peso Peça (g):</label>
                        <input
                          type="number"
                          min="1"
                          value={orderWeightGrams}
                          onChange={(e) => setOrderWeightGrams(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-[#0C0E0D] border border-[#232B27] rounded p-1 text-center text-xs text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-[#8BA58D] font-bold block">Tempo de Impressão (h):</label>
                        <input
                          type="number"
                          min="1"
                          value={orderPrintTime}
                          onChange={(e) => setOrderPrintTime(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-[#0C0E0D] border border-[#232B27] rounded p-1 text-center text-xs text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-[#8BA58D] font-bold block">Preço unitário (R$):</label>
                        <input
                          type="number"
                          min="1"
                          value={orderPrice}
                          onChange={(e) => setOrderPrice(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-[#0C0E0D] border border-[#232B27] rounded p-1 text-center text-xs text-[var(--brand-primary)] font-bold font-mono"
                        />
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-[11px] font-mono bg-zinc-950/40 p-2 rounded-lg border border-[#232B27]/40">
                      <span className="text-[#8BA58D]">Total cobrado ao cliente:</span>
                      <strong className="text-[var(--brand-primary)] font-extrabold text-xs">
                        R$ {(orderPrice * orderQuantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </strong>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-[var(--brand-primary)] hover:opacity-90 text-black text-xs font-black rounded-xl transition uppercase tracking-wide tracking-wider select-none cursor-pointer"
                    >
                      🚀 Lançar Pedido na Fila de Impressão
                    </button>
                  </form>
                </div>

              </div>

              {/* ACTIVE ORDER LIST TRACKER */}
              <div className="space-y-3 pt-4 border-t border-[#232B27]">
                <div className="flex items-center gap-2 pb-1 text-[#F1F4EE]">
                  <Package className="h-4 w-4 text-[var(--brand-primary)] animate-pulse" />
                  <h4 className="text-xs font-black uppercase tracking-wider font-mono">Status de Produção Ativo do Cliente ({clientOrders.length})</h4>
                </div>

                {clientOrders.length === 0 ? (
                  <div className="p-8 bg-black/20 text-center text-[#8BA58D] rounded-xl border border-[#232B27]/40">
                    <p className="text-xs font-medium">Nenhum pedido ativo ou histórico de produção vinculado a este cliente no momento.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[160px] overflow-y-auto pr-1">
                    {clientOrders.map(order => {
                      const ageHours = Math.floor((Date.now() - order.createdAt) / (1000 * 3600));
                      const isActive = order.status !== 'DELIVERED' && order.status !== 'READY';
                      const borderClass = !isActive ? 'border-[#232B27]/60' :
                        ageHours >= 24 ? 'border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.2)]' :
                        ageHours >= 15 ? 'border-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.15)]' :
                        ageHours >= 8 ? 'border-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.1)]' :
                        'border-[#232B27]/60';
                      
                      return (
                        <div 
                          key={order.id} 
                          className={`p-3 bg-black/45 border rounded-xl flex items-center justify-between gap-3 ${borderClass}`}
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <h5 className="text-xs font-extrabold text-[#F1F4EE] truncate">{order.itemName}</h5>
                            <p className="text-[10px] text-[#8BA58D] font-mono leading-none">
                              Fio: <span className="text-[#95BBA2]">{order.filamentType} {order.filamentColor}</span> • Qtd: {order.quantity} un
                            </p>
                            <p className="text-[9px] text-zinc-400 font-mono">
                              ⏰ Lanço: {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ({ageHours}h atrás)
                            </p>
                          </div>
                          
                          <div className="text-right shrink-0">
                            <span className="text-[11px] font-extrabold text-[#95BBA2] font-mono block">R$ {order.priceCharged.toFixed(2)}</span>
                            <span className={`text-[8px] px-2 py-0.5 rounded uppercase font-black tracking-wide inline-block mt-0.5 border ${
                              order.status === 'PRINTING' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15' :
                              order.status === 'READY' ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border-[var(--brand-primary)]/15' : 'bg-zinc-800 text-zinc-300 border-[#232B27]'
                            }`}>
                              {order.status === 'QUEUE' ? 'FILA' : order.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal controls underneath */}
              <div className="flex justify-end pt-3 border-t border-[#232B27] gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedClientForPage(null)}
                  className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-[#F1F4EE] text-xs font-black rounded-xl transition cursor-pointer select-none"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedClientForPage(null)}
                  className="px-5 py-2.5 bg-[#95BBA2] hover:opacity-95 text-[#0C0E0D] text-xs font-black rounded-xl transition cursor-pointer select-none"
                >
                  Confirmado &amp; Fechar ✓
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};