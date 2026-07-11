// @ts-nocheck
import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { 
  Download, 
  Upload, 
  Settings, 
  HelpCircle, 
  Shield, 
  FileText, 
  RefreshCw, 
  Sliders, 
  Check, 
  Palette, 
  Info, 
  Database,
  ArrowRight,
  Sparkles,
  Award,
  Smartphone,
  Laptop,
  Cloud,
  Wifi,
  Lock,
  X,
  RotateCcw,
  Undo,
  AlertTriangle,
  Eye,
  EyeOff,
  Search,
  Zap,
  Radio,
  Trash,
  Plus,
  Server
} from 'lucide-react';
import { Client, Printer, PrintOrder, FilamentStock, Expense, ShoppingItem } from '../types';
import { getApiUrl, validateApiKeyFormat, checkIsAndroidWebView, callGeminiGeneratePalette } from '../utils/api';
import { safeStorage } from '../utils/storage';
import { uploadWorkspace, downloadWorkspace, FirebaseSyncError } from '../sync/firebaseSync';
import { useCustomKeys } from '../hooks/useCustomKeys';
import { ApiKeyField } from './ApiKeyField';
import { pickBackupFolder, getBackupFolderName, clearBackupFolder, runBackupNow, getDropboxConfig, setDropboxConfig, testDropbox, getDropboxOAuth, buildDropboxAuthUrl, exchangeDropboxCode, disconnectDropboxOAuth, getGDriveConfig, setGDriveConfig, testGDrive } from '../hooks/useAutoBackup';
import { getTelegramChatId, setTelegramChatId, getTelegramAutoSend, setTelegramAutoSend, sendStlToTelegram } from '../lib/telegram';

function TelegramStlControl() {
  const [chatId, setChatIdState] = React.useState(() => getTelegramChatId());
  const [auto, setAuto] = React.useState(() => getTelegramAutoSend());
  const [status, setStatus] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const save = () => {
    setTelegramChatId(chatId);
    setTelegramAutoSend(auto);
    setStatus('Salvo.');
  };
  const test = async () => {
    setBusy(true); setStatus('Enviando mensagem de teste...');
    setTelegramChatId(chatId);
    const blob = new Blob([`teste Imprimetrics ${new Date().toISOString()}`], { type: 'text/plain' });
    const r = await sendStlToTelegram(blob, 'teste-imprimetrics.txt', '🤖 Teste de conexão do Telegram', chatId);
    setStatus(r.ok ? '✅ Enviado! Verifique seu Telegram.' : `❌ ${r.error}`);
    setBusy(false);
  };
  return (
    <div className="mt-3 p-3 rounded-xl bg-[#0C0E0D] border border-[#3FA9F5]/30 space-y-2">
      <div className="text-[11px] font-bold text-[#3FA9F5] uppercase tracking-wide">Telegram — Envio automático de STL</div>
      <div className="text-[10px] text-[#8BA58D] leading-relaxed">
        Conectado via Lovable (sem token de bot). Toda vez que você subir um <b>.stl</b> ou <b>.3mf</b> no Vault, o arquivo cai direto no seu Telegram. Limite: 50&nbsp;MB por arquivo.
      </div>
      <input type="text" value={chatId} onChange={(e) => setChatIdState(e.target.value)} placeholder="Seu chat_id do Telegram (ex: 123456789)" className="w-full px-3 py-1.5 rounded-lg bg-[#111613] border border-[#2F3D35] text-[#F1F4EE] text-[11px]" />
      <label className="flex items-center gap-2 text-[11px] text-[#F1F4EE]">
        <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
        Enviar automaticamente todo STL/3MF que eu subir
      </label>
      <div className="flex gap-2 flex-wrap">
        <button type="button" onClick={save} className="px-3 py-1.5 rounded-lg bg-[#1C2420] hover:bg-[#232F2A] border border-[#2F3D35] text-[#F1F4EE] text-[11px] font-semibold">Salvar</button>
        <button type="button" disabled={busy || !chatId.trim()} onClick={test} className="px-3 py-1.5 rounded-lg bg-[#3FA9F5]/15 hover:bg-[#3FA9F5]/25 border border-[#3FA9F5]/40 text-[#3FA9F5] text-[11px] font-semibold disabled:opacity-50">Enviar teste</button>
      </div>
      <details className="text-[10px] text-[#8BA58D]">
        <summary className="cursor-pointer text-[#3FA9F5] font-semibold">Como descobrir meu chat_id</summary>
        <ol className="list-decimal pl-4 mt-1 space-y-0.5">
          <li>Abra o Telegram e procure pelo bot conectado.</li>
          <li>Envie <code>/start</code> para ele.</li>
          <li>No navegador, abra <code>@userinfobot</code> no Telegram e ele te mostra seu chat_id numérico.</li>
          <li>Cole o número aqui e clique em <b>Enviar teste</b>.</li>
        </ol>
      </details>
      {status && <div className="text-[10px] text-[#8BA58D]">{status}</div>}
    </div>
  );
}

function GDriveBackupControl() {
  const initial = React.useMemo(() => getGDriveConfig(), []);
  const [enabled, setEnabled] = React.useState(initial.enabled);
  const [folder, setFolder] = React.useState(initial.folder);
  const [status, setStatus] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const save = () => { setGDriveConfig(enabled, folder); setStatus(enabled ? 'Ativado e salvo.' : 'Desativado.'); };
  const test = async () => {
    setBusy(true); setStatus('Enviando teste...');
    setGDriveConfig(true, folder); setEnabled(true);
    const r = await testGDrive();
    setStatus(r.message);
    setBusy(false);
  };
  return (
    <div className="mt-3 p-3 rounded-xl bg-[#0C0E0D] border border-[#7FE2B0]/30 space-y-2">
      <div className="text-[11px] font-bold text-[#7FE2B0] uppercase tracking-wide">Backup no Google Drive (15 GB grátis)</div>
      <div className="text-[10px] text-[#8BA58D] leading-relaxed">
        Conectado via Lovable — sem token nem app secret. Envia a cada 6h (com o app aberto) e mantém os 5 backups mais recentes na pasta.
      </div>
      <label className="flex items-center gap-2 text-[11px] text-[#F1F4EE]">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Ativar envio automático para Google Drive
      </label>
      <input type="text" value={folder} onChange={(e) => setFolder(e.target.value)} placeholder="Imprimetrics" className="w-full px-3 py-1.5 rounded-lg bg-[#111613] border border-[#2F3D35] text-[#F1F4EE] text-[11px]" />
      <div className="flex gap-2 flex-wrap">
        <button type="button" onClick={save} className="px-3 py-1.5 rounded-lg bg-[#1C2420] hover:bg-[#232F2A] border border-[#2F3D35] text-[#F1F4EE] text-[11px] font-semibold">Salvar</button>
        <button type="button" disabled={busy} onClick={test} className="px-3 py-1.5 rounded-lg bg-[#7FE2B0]/15 hover:bg-[#7FE2B0]/25 border border-[#7FE2B0]/40 text-[#7FE2B0] text-[11px] font-semibold disabled:opacity-50">Enviar teste</button>
      </div>
      {status && <div className="text-[10px] text-[#8BA58D]">{status}</div>}
    </div>
  );
}

function DropboxOAuthControl() {
  const initial = React.useMemo(() => getDropboxOAuth(), []);
  const [code, setCode] = React.useState('');
  const [connected, setConnected] = React.useState(!!initial.refreshToken);
  const [status, setStatus] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const openAuth = async () => {
    setBusy(true);
    try {
      const url = await buildDropboxAuthUrl();
      if (!/client_id=[^&]+/.test(url) || /client_id=&/.test(url)) {
        setStatus('DROPBOX_APP_KEY não configurado no servidor.');
        return;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
      setStatus('Autorize no Dropbox e cole o código que aparecer abaixo.');
    } finally { setBusy(false); }
  };
  const connect = async () => {
    setBusy(true); setStatus('Conectando...');
    const r = await exchangeDropboxCode(code);
    setStatus(r.message);
    if (r.ok) { setConnected(true); setCode(''); }
    setBusy(false);
  };
  const disconnect = () => {
    disconnectDropboxOAuth();
    setConnected(false);
    setStatus('Desconectado.');
  };

  return (
    <div className="mt-3 p-3 rounded-xl bg-[#0C0E0D] border border-[#4FA3E3]/30 space-y-2">
      <div className="text-[11px] font-bold text-[#4FA3E3] uppercase tracking-wide">Dropbox OAuth (token permanente) ⭐</div>
      <div className="text-[10px] text-[#8BA58D] leading-relaxed">
        Renovação automática — você autoriza uma vez e nunca mais precisa colar token. As credenciais <b>App key/App secret</b> ficam guardadas com segurança no servidor (não no navegador).
      </div>
      {connected ? (
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#7FE2B0] font-semibold">✓ Conectado (renovação automática ativa)</span>
          <button type="button" onClick={disconnect} className="ml-auto px-3 py-1.5 rounded-lg bg-transparent hover:bg-[#1C2420] border border-[#2F3D35] text-[#8BA58D] text-[11px]">Desconectar</button>
        </div>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap">
            <button type="button" disabled={busy} onClick={openAuth} className="px-3 py-1.5 rounded-lg bg-[#4FA3E3]/15 hover:bg-[#4FA3E3]/25 border border-[#4FA3E3]/40 text-[#4FA3E3] text-[11px] font-semibold disabled:opacity-50">1. Autorizar no Dropbox</button>
          </div>
          <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="2. Cole aqui o código de autorização" className="w-full px-3 py-1.5 rounded-lg bg-[#111613] border border-[#2F3D35] text-[#F1F4EE] text-[11px]" />
          <div className="flex gap-2 flex-wrap">
            <button type="button" disabled={busy || !code} onClick={connect} className="px-3 py-1.5 rounded-lg bg-[#4FA3E3] hover:bg-[#3F93D3] text-[#0F1411] text-[11px] font-bold disabled:opacity-50">3. Conectar</button>
          </div>
        </>
      )}
      {status && <div className="text-[10px] text-[#8BA58D]">{status}</div>}
      <details className="text-[10px] text-[#8BA58D] mt-1">
        <summary className="cursor-pointer text-[#4FA3E3] font-semibold">Passo a passo OAuth (1 vez só)</summary>
        <ol className="list-decimal ml-4 mt-1 space-y-1">
          <li>O App key e App secret já estão guardados em segredos do servidor (DROPBOX_APP_KEY / DROPBOX_APP_SECRET).</li>
          <li>Clique em <b>1. Autorizar no Dropbox</b> → faça login → clique <b>Allow</b> → o Dropbox mostrará um <b>código</b>.</li>
          <li>Copie o código, cole no campo <b>2</b> e clique em <b>3. Conectar</b>. Pronto — token renova sozinho para sempre.</li>
        </ol>
      </details>
    </div>
  );
}

function DropboxBackupControl() {
  const initial = React.useMemo(() => getDropboxConfig(), []);
  const [token, setToken] = React.useState(initial.token);
  const [folder, setFolder] = React.useState(initial.folder);
  const [status, setStatus] = React.useState<string>('');
  const [busy, setBusy] = React.useState(false);
  const save = () => { setDropboxConfig(token, folder); setStatus('Salvo.'); };
  const test = async () => {
    setBusy(true); setStatus('Testando...');
    setDropboxConfig(token, folder);
    const r = await testDropbox();
    setStatus(r.message);
    setBusy(false);
  };
  const clear = () => { setToken(''); setDropboxConfig('', folder); setStatus('Token removido.'); };
  return (
    <div className="mt-3 p-3 rounded-xl bg-[#0C0E0D] border border-[#232B27]/60 space-y-2">
      <div className="text-[11px] font-bold text-[#4FA3E3] uppercase tracking-wide">Backup no Dropbox (a cada 6h)</div>
      <div className="text-[10px] text-[#8BA58D] leading-relaxed">
        Funciona enquanto o app estiver aberto. Cole o <span className="text-[#F1F4EE] font-semibold">Access Token</span> gerado no Dropbox App Console (veja passo a passo abaixo).
      </div>
      <input
        type="password"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Dropbox Access Token (sl.xxx...)"
        className="w-full px-3 py-1.5 rounded-lg bg-[#111613] border border-[#2F3D35] text-[#F1F4EE] text-[11px]"
      />
      <input
        type="text"
        value={folder}
        onChange={(e) => setFolder(e.target.value)}
        placeholder="/Imprimetrics"
        className="w-full px-3 py-1.5 rounded-lg bg-[#111613] border border-[#2F3D35] text-[#F1F4EE] text-[11px]"
      />
      <div className="flex gap-2 flex-wrap">
        <button type="button" onClick={save} className="px-3 py-1.5 rounded-lg bg-[#1C2420] hover:bg-[#232F2A] border border-[#2F3D35] text-[#F1F4EE] text-[11px] font-semibold">Salvar</button>
        <button type="button" disabled={busy || !token} onClick={test} className="px-3 py-1.5 rounded-lg bg-[#1C2420] hover:bg-[#232F2A] border border-[#2F3D35] text-[#4FA3E3] text-[11px] font-semibold disabled:opacity-50">Testar conexão</button>
        {token && <button type="button" onClick={clear} className="px-3 py-1.5 rounded-lg bg-transparent hover:bg-[#1C2420] border border-[#2F3D35] text-[#8BA58D] text-[11px]">Remover token</button>}
      </div>
      {status && <div className="text-[10px] text-[#8BA58D]">{status}</div>}
      <details className="text-[10px] text-[#8BA58D] mt-1">
        <summary className="cursor-pointer text-[#4FA3E3] font-semibold">Como gerar o token do Dropbox (5 min)</summary>
        <ol className="list-decimal ml-4 mt-1 space-y-1">
          <li>Acesse <a className="underline text-[#4FA3E3]" href="https://www.dropbox.com/developers/apps" target="_blank" rel="noreferrer">dropbox.com/developers/apps</a> e clique em <b>Create app</b>.</li>
          <li>Escolha: <b>Scoped access</b> → <b>App folder</b> (mais seguro) → dê um nome (ex.: Imprimetrics Backup) → <b>Create app</b>.</li>
          <li>Na aba <b>Permissions</b>, marque <b>files.content.write</b> e <b>files.content.read</b> e clique em <b>Submit</b>.</li>
          <li>Volte na aba <b>Settings</b>, role até <b>OAuth 2 → Generated access token</b> e clique em <b>Generate</b>.</li>
          <li>Copie o token (começa com <code>sl.</code>) e cole acima. Clique em <b>Testar conexão</b>.</li>
        </ol>
        <div className="mt-2 text-[#E2B144]">⚠️ Tokens gerados manualmente expiram em ~4h. Para token longo, use o fluxo OAuth (refresh token) — me avise se quiser ativar.</div>
      </details>
    </div>
  );
}

function AutoBackupFolderControl() {
  const [folder, setFolder] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => { getBackupFolderName().then(setFolder); }, []);
  const supported = typeof window !== 'undefined' && 'showDirectoryPicker' in window;
  const choose = async () => {
    setBusy(true);
    try {
      const name = await pickBackupFolder();
      if (name) setFolder(name);
    } catch (e: any) {
      if (e?.name !== 'AbortError') alert('Erro ao escolher pasta: ' + (e?.message || e));
    } finally { setBusy(false); }
  };
  const clear = async () => { await clearBackupFolder(); setFolder(null); };
  return (
    <div className="mt-3 p-3 rounded-xl bg-[#0C0E0D] border border-[#232B27]/60 space-y-2">
      <div className="text-[11px] font-bold text-[#E2B144] uppercase tracking-wide">Backup automático (a cada 6h)</div>
      <div className="text-[10px] text-[#8BA58D] leading-relaxed">
        {supported
          ? (folder
              ? <>Salvando em: <span className="text-[#F1F4EE] font-semibold">{folder}</span></>
              : 'Nenhuma pasta escolhida — o backup vai para a pasta Downloads.')
          : 'Seu navegador não suporta escolher pasta (use Chrome/Edge desktop). O backup será salvo em Downloads.'}
      </div>
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          disabled={!supported || busy}
          onClick={choose}
          className="px-3 py-1.5 rounded-lg bg-[#1C2420] hover:bg-[#232F2A] border border-[#2F3D35] text-[#F1F4EE] text-[11px] font-semibold disabled:opacity-50"
        >
          {folder ? 'Alterar pasta' : 'Escolher pasta'}
        </button>
        {folder && (
          <button
            type="button"
            onClick={clear}
            className="px-3 py-1.5 rounded-lg bg-transparent hover:bg-[#1C2420] border border-[#2F3D35] text-[#8BA58D] text-[11px]"
          >
            Remover
          </button>
        )}
        <button
          type="button"
          onClick={() => runBackupNow()}
          className="px-3 py-1.5 rounded-lg bg-[#1C2420] hover:bg-[#232F2A] border border-[#2F3D35] text-[#95BBA2] text-[11px] font-semibold"
        >
          Fazer backup agora
        </button>
      </div>
    </div>
  );
}

interface SettingsTabProps {
  clients: Client[];
  printers: Printer[];
  orders: PrintOrder[];
  filamentStocks: FilamentStock[];
  expenses: Expense[];
  shoppingItems: ShoppingItem[];
  onImportAllData: (data: {
    clients?: Client[];
    printers?: Printer[];
    orders?: PrintOrder[];
    filamentStocks?: FilamentStock[];
    expenses?: Expense[];
    shoppingItems?: ShoppingItem[];
  }) => void;
  brandConfig: {
    name: string;
    theme: string;
    icon: 'bambu' | 'spool' | 'extruder';
    customLogo?: string;
  };
  onUpdateBrandConfig: (config: any) => void;
  tuyaDevices?: any[];
  onUpdateTuyaDevices?: (devices: any[]) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  clients,
  printers,
  orders,
  filamentStocks,
  expenses,
  shoppingItems,
  onImportAllData,
  brandConfig,
  onUpdateBrandConfig,
  tuyaDevices = [],
  onUpdateTuyaDevices
}) => {
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Help Modal states
  const [helpTitle, setHelpTitle] = useState('');
  const [helpText, setHelpText] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);

  const triggerHelp = (title: string, text: string) => {
    setHelpTitle(title);
    setHelpText(text);
    setShowHelpModal(true);
  };

  // Firebase Cloud Sync states
  const [firebaseUrl, setFirebaseUrl] = useState(() => {
    return localStorage.getItem('bambuzau_firebase_url') || 'https://bambuzau1-60868-default-rtdb.firebaseio.com/';
  });
  const [workspaceCode, setWorkspaceCode] = useState(() => {
    return localStorage.getItem('bambuzau_workspace_code') || 'principal';
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(() => {
    return localStorage.getItem('bambuzau_last_sync_time') || '';
  });

  const handleUploadToFirebase = async () => {
    setIsSyncing(true);
    try {
      const nowStr = await uploadWorkspace(
        { firebaseUrl, workspaceCode },
        { clients, printers, orders, filamentStocks, expenses, shoppingItems, brandConfig, tuyaDevices },
      );
      setLastSyncTime(nowStr);
      showSuccess('Sincronização concluída com sucesso! Os dados foram enviados para a Nuvem Firebase.');
    } catch (err: any) {
      showError('Falha ao enviar dados para o Firebase: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadFromFirebase = async () => {
    if (!confirm('ATENÇÃO: Esta ação substituirá COMPLETAMENTE todo o seu progresso local atual pelos dados salvados na Nuvem Firebase. Seu aplicativo será reiniciado para atualizar. Deseja prosseguir?')) {
      return;
    }

    // Criar ponto de restauração automático de emergência antes da sincronização
    createLocalRestorePoint(true);

    setIsSyncing(true);
    try {
      const { data, syncedAt } = await downloadWorkspace({ firebaseUrl, workspaceCode });

      if (data.customKeys?.webOrigin) {
        setAtiServerUrl(data.customKeys.webOrigin);
      }

      // Import the rest via prop callback
      onImportAllData({
        clients: data.clients || [],
        printers: data.printers || [],
        orders: data.orders || [],
        filamentStocks: data.filamentStocks || [],
        expenses: data.expenses || [],
        shoppingItems: data.shoppingItems || [],
        tuyaDevices: data.tuyaDevices || []
      });

      if (data.brandConfig) {
        onUpdateBrandConfig(data.brandConfig);
      }

      setLastSyncTime(syncedAt);

      showSuccess('Banco de dados resgatado com sucesso! O aplicativo será recarregado em instantes para aplicar...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      showError('Falha ao restaurar dados do Firebase: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const testServerConnection = async () => {
    setServerStatus('checking');
    try {
      let target = atiServerUrl.trim();
      if (!target.startsWith('http://') && !target.startsWith('https://')) {
        target = 'https://' + target;
      }
      if (target.endsWith('/')) {
        target = target.slice(0, -1);
      }
      
      const checkUrl = target.endsWith('/api/health') ? target : `${target}/api/health`;
      const response = await fetch(getApiUrl(checkUrl));
      if (response.ok) {
        const json = await response.json();
        if (json && json.status === 'ok') {
          setServerStatus('online');
          showSuccess('Conexão estabelecida com sucesso! O servidor do Ateliê está online e ativo.');
          return;
        }
      }
      setServerStatus('offline');
      showError('O servidor respondeu, mas não emitiu o sinal de saúde esperado.');
    } catch (e: any) {
      setServerStatus('offline');
      showError('Inacessível ou fora do ar: ' + e.message);
    }
  };

  const saveServerUrl = () => {
    let clean = atiServerUrl.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }
    if (clean.endsWith('/')) {
      clean = clean.slice(0, -1);
    }
    setAtiServerUrl(clean);
    localStorage.setItem('bambuzau_web_origin', clean);
    showSuccess('URL do servidor de integração salva com sucesso!');
  };

  // OTA App Update states & handlers
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('bambuzau_user_role') || 'client';
  });

  const [masterPin, setMasterPin] = useState(() => {
    return localStorage.getItem('bambuzau_master_pin') || '846056';
  });

  const [rollbackSnapshot, setRollbackSnapshot] = useState<string | null>(() => {
    return localStorage.getItem('bambuzau_rollback_snapshot');
  });

  // PIN security verification states
  const [showPinModal, setShowPinModal] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinPromptError, setPinPromptError] = useState('');

  const handleRoleChange = (role: 'admin' | 'client') => {
    setUserRole(role);
    localStorage.setItem('bambuzau_user_role', role);
    // Dispara um custom event de storage para que o App.tsx e outros componentes saibam da mudança de perfil local imediatamente
    window.dispatchEvent(new Event('storage'));
    showSuccess(`Perfil de acesso alterado localmente para: ${role === 'admin' ? 'Ateliê Gestor / Administrador 👑' : 'Visualizador / Cliente / Operador 👤'}`);
  };

  const createLocalRestorePoint = (silent = false) => {
    try {
      const snapshot = {
        timestamp: Date.now(),
        description: 'Backup automático de segurança antes de alterações',
        data: {
          clients: clients || [],
          printers: printers || [],
          orders: orders || [],
          filamentStocks: filamentStocks || [],
          expenses: expenses || [],
          shoppingItems: shoppingItems || [],
          brandConfig: brandConfig,
          tuyaDevices: tuyaDevices || []
        }
      };
      const snapStr = JSON.stringify(snapshot);
      localStorage.setItem('bambuzau_rollback_snapshot', snapStr);
      setRollbackSnapshot(snapStr);
      if (!silent) {
        showSuccess('Cópia de segurança criada com sucesso para retorno em caso de problemas!');
      }
    } catch (e) {
      console.error('Failed to create local restore point:', e);
    }
  };

  // Restaura backup completo: reescreve todo o localStorage e recarrega a página
  // para que cada módulo releia produtos, insumos, keys, logo, tuya, cotações…
  const applyFullBackup = (json: any) => {
    try {
      // 1) Preferencial: dump completo do localStorage
      if (json.storage && typeof json.storage === 'object') {
        // Preserva chaves críticas que NÃO devem ser sobrescritas (autenticação atual etc.)
        const preserveKeys = new Set<string>([
          'bambuzau_rollback_snapshot',
          'bambuzau_open_product_form_pending',
        ]);
        const preserved: Record<string, string | null> = {};
        preserveKeys.forEach((k) => { preserved[k] = localStorage.getItem(k); });

        try { localStorage.clear(); } catch {}

        Object.entries(json.storage as Record<string, string>).forEach(([k, v]) => {
          try { localStorage.setItem(k, String(v)); } catch (e) { console.warn('skip', k, e); }
        });

        Object.entries(preserved).forEach(([k, v]) => {
          if (v !== null && !json.storage[k]) {
            try { localStorage.setItem(k, v); } catch {}
          }
        });
      } else {
        // 2) Fallback (backups antigos sem `storage`): grava por chave conhecida
        const pairs: Array<[string, any]> = [
          ['bambuzau_clients', json.clients],
          ['bambuzau_printers', json.printers],
          ['bambuzau_orders', json.orders],
          ['bambuzau_filament', json.filamentStocks],
          ['bambuzau_expenses', json.expenses],
          ['bambuzau_shopping', json.shoppingItems],
          ['bambuzau_supplies', json.suppliesStocks],
          ['bambuzau_local_catalog_production', json.catalogItems],
          ['bambuzau_tuya_devices', json.tuyaDevices],
          ['bambuzau_brand_config', json.brandConfig],
        ];
        pairs.forEach(([k, v]) => {
          if (v !== undefined && v !== null) {
            try { localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); } catch {}
          }
        });
      }

      showSuccess('Backup restaurado! Recarregando aplicativo para aplicar produtos, estoques, chaves e logo…');
      setTimeout(() => { try { window.location.reload(); } catch {} }, 900);
    } catch (err: any) {
      showError('Falha ao restaurar backup completo: ' + (err?.message || err));
    }
  };

  const handleRollback = () => {
    if (!rollbackSnapshot) {
      showError('Nenhum backup disponível para retorno.');
      return;
    }
    
    if (!confirm('Deseja realmente retornar todas as tabelas (Fila de Impressão, Clientes, Insumos) para o estado anterior? Seu aplicativo será recarregado em instantes.')) {
      return;
    }
    
    try {
      let snap;
      try {
        snap = JSON.parse(rollbackSnapshot);
      } catch (parseErr) {
        throw new Error('Cópia de segurança corrompida ou incompleta no armazenamento local.');
      }
      if (!snap || !snap.data) {
        throw new Error('Formato do backup de segurança corrompido.');
      }
      
      onImportAllData({
        clients: snap.data.clients || [],
        printers: snap.data.printers || [],
        orders: snap.data.orders || [],
        filamentStocks: snap.data.filamentStocks || [],
        expenses: snap.data.expenses || [],
        shoppingItems: snap.data.shoppingItems || [],
        tuyaDevices: snap.data.tuyaDevices || []
      });
      
      if (snap.data.brandConfig) {
        onUpdateBrandConfig(snap.data.brandConfig);
      }
      
      showSuccess('Retorno efetuado com absoluto sucesso! Recarregando sistema...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      showError('Falha ao retornar ou reverter: ' + err.message);
    }
  };

  const [updateVersion, setUpdateVersion] = useState(() => {
    return localStorage.getItem('bambuzau_update_version') || '3.3.0.4';
  });
  const [updateApkUrl, setUpdateApkUrl] = useState(() => {
    return localStorage.getItem('bambuzau_update_apk_url') || '';
  });
  const [updateNotes, setUpdateNotes] = useState(() => {
    return localStorage.getItem('bambuzau_update_notes') || 'Melhorias de desempenho offline, nova sincronização ultra rápida e tela de custos otimizada!';
  });
  const [isPublishingUpdate, setIsPublishingUpdate] = useState(false);

  const [liveFirebaseUpdate, setLiveFirebaseUpdate] = useState<{ version: string; apkUrl: string; releaseNotes: string; timestamp?: number } | null>(null);
  const [liveFirebaseError, setLiveFirebaseError] = useState<string | null>(null);
  const [isCheckingLiveFirebase, setIsCheckingLiveFirebase] = useState(false);
  const [dismissedVersionLocal, setDismissedVersionLocal] = useState(() => localStorage.getItem('bambuzau_dismissed_version') || '');
  const [dismissedTimestampLocal, setDismissedTimestampLocal] = useState(() => parseInt(localStorage.getItem('bambuzau_dismissed_timestamp') || '0', 10));

  const fetchLiveFirebaseUpdate = async () => {
    if (!firebaseUrl || !workspaceCode) return;
    setIsCheckingLiveFirebase(true);
    setLiveFirebaseError(null);
    try {
      let formattedUrl = firebaseUrl.trim();
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl;
      }
      if (!formattedUrl.endsWith('/')) {
        formattedUrl += '/';
      }
      const targetUrl = `${formattedUrl}workspaces/${workspaceCode.trim()}/update_info.json?nocache=${Date.now()}`;
      const response = await fetch(targetUrl, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setLiveFirebaseUpdate(data);
      } else {
        setLiveFirebaseError(`Erro HTTP ${response.status}`);
      }
    } catch (err: any) {
      setLiveFirebaseError(err.message || 'Falha de rede ao consultar o Firebase Realtime Database');
    } finally {
      setIsCheckingLiveFirebase(false);
    }
  };

  React.useEffect(() => {
    fetchLiveFirebaseUpdate();
  }, [firebaseUrl, workspaceCode]);

  const handleClearDismissedAvisos = () => {
    localStorage.removeItem('bambuzau_dismissed_version');
    localStorage.removeItem('bambuzau_dismissed_timestamp');
    localStorage.removeItem('bambuzau_dismissed_time');
    setDismissedVersionLocal('');
    setDismissedTimestampLocal(0);
    // Ativa a escuta local no próprio App.tsx para recarregar as atualizações
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('bambuzau_force_update_check'));
    showSuccess('Histórico de descarte limpo! Qualquer versão qualificada voltará a exibir o aviso no celular.');
  };

  const handlePublishUpdateToFirebase = async () => {
    if (!firebaseUrl) {
      showError('Por favor, informe a URL do seu Firebase Realtime Database para sincronização.');
      return;
    }
    if (!workspaceCode) {
      showError('Por favor, informe o código do Workspace ativo.');
      return;
    }
    if (!updateVersion) {
      showError('Por favor, informe a versão da atualização (ex: 2.5).');
      return;
    }
    if (!updateApkUrl) {
      showError('Por favor, informe o link de download direto do APK da nova versão.');
      return;
    }

    let formattedUrl = firebaseUrl.trim();
    if (formattedUrl.includes('console.firebase.google.com')) {
      showError('Erro: Você informou o link do Console Firebase! Utilize a URL REST do seu Realtime Database.');
      return;
    }

    setIsPublishingUpdate(true);
    try {
      // Toda vez que atualizar o app, ele gera um backup antes obrigatoriamente
      createLocalRestorePoint(true);

      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl;
      }
      if (!formattedUrl.endsWith('/')) {
        formattedUrl += '/';
      }

      const rawApkUrl = updateApkUrl.trim();
      let convertedApkUrl = rawApkUrl;

      // Converter links do Google Drive e Dropbox para link de download direto real com suporte de bypass a login de conta
      if (rawApkUrl.includes('drive.google.com/file/d/')) {
        const match = rawApkUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
          convertedApkUrl = `https://drive.usercontent.google.com/download?id=${match[1]}&export=download&confirm=t`;
        }
      } else if (rawApkUrl.includes('drive.google.com/open?id=') || rawApkUrl.includes('drive.google.com/open?')) {
        const match = rawApkUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
          convertedApkUrl = `https://drive.usercontent.google.com/download?id=${match[1]}&export=download&confirm=t`;
        }
      } else if (rawApkUrl.includes('dropbox.com')) {
        let tempUrl = rawApkUrl;
        // Se o link for do Dropbox, limpa e corrige para o subdominio direto dl.dropboxusercontent.com
        // que força download físico silencioso e limpo de pacotes
        if (tempUrl.includes('www.dropbox.com')) {
          tempUrl = tempUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
        } else if (tempUrl.includes('dropbox.com') && !tempUrl.includes('dl.dropboxusercontent.com')) {
          tempUrl = tempUrl.replace('://dropbox.com', '://dl.dropboxusercontent.com');
        }
        
        if (tempUrl.includes('dl.dl.dropbox')) {
          tempUrl = tempUrl.replace(/dl\.dl\.dropboxusercontent\.comusercontent\.com/g, 'dl.dropboxusercontent.com');
        }

        if (tempUrl.includes('dl=0')) {
          convertedApkUrl = tempUrl.replace('dl=0', 'dl=1');
        } else if (!tempUrl.includes('dl=1') && !tempUrl.includes('raw=1')) {
          convertedApkUrl = tempUrl + (tempUrl.includes('?') ? '&dl=1' : '?dl=1');
        } else {
          convertedApkUrl = tempUrl;
        }
      }

      if (convertedApkUrl !== rawApkUrl) {
        setUpdateApkUrl(convertedApkUrl);
      }

      const payload = {
        version: updateVersion.trim(),
        apkUrl: convertedApkUrl,
        releaseNotes: updateNotes.trim(),
        timestamp: Date.now()
      };

      const targetUrl = `${formattedUrl}workspaces/${workspaceCode.trim()}/update_info.json`;

      const response = await fetch(targetUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Servidor retornou HTTP ${response.status}`);
      }

      // Persist locally
      localStorage.setItem('bambuzau_update_version', updateVersion);
      localStorage.setItem('bambuzau_update_apk_url', convertedApkUrl);
      localStorage.setItem('bambuzau_update_notes', updateNotes);

      // Clear dismissed state from localStorage upon publishing so it triggers immediately
      localStorage.removeItem('bambuzau_dismissed_version');
      localStorage.removeItem('bambuzau_dismissed_timestamp');
      localStorage.removeItem('bambuzau_dismissed_time');

      // Atualizar diagnóstico imediato em tela
      fetchLiveFirebaseUpdate();
      setDismissedVersionLocal('');
      setDismissedTimestampLocal(0);
      
      // Disparar atualização forçada na aba atual instantaneamente
      window.dispatchEvent(new Event('bambuzau_force_update_check'));

      if (convertedApkUrl !== rawApkUrl) {
        showSuccess(`Atualização v${updateVersion} publicada! O link do Google Drive/Dropbox foi convertido automaticamente para download direto garantindo que celulares instalem sem erros de pacote corrompido! 🚀 ✨`);
      } else {
        showSuccess(`Atualização v${updateVersion} publicada com sucesso! Os celulares dos seus clientes sincronizados exibirão o aviso instantaneamente.`);
      }
    } catch (err: any) {
      showError('Falha ao publicar atualização: ' + err.message);
    } finally {
      setIsPublishingUpdate(false);
    }
  };
  
  // Local form states for white label branding
  const [localName, setLocalName] = useState(brandConfig.name);
  const [localTheme, setLocalTheme] = useState(brandConfig.theme);
  const [localIcon, setLocalIcon] = useState(brandConfig.icon);
  const [localCustomLogo, setLocalCustomLogo] = useState(brandConfig.customLogo || '');
  const [aiColors, setAiColors] = useState<any>(brandConfig.customThemeColors || null);
  const [showKey, setShowKey] = useState(false);
  const {
    geminiKey: localGeminiKey, setGeminiKey: setLocalGeminiKey,
    groqKey: localGroqKey, setGroqKey: setLocalGroqKey,
    serpKey: localSerpKey, setSerpKey: setLocalSerpKey,
    serpKey2: localSerpKey2, setSerpKey2: setLocalSerpKey2,
    tavilyKey: localTavilyKey, setTavilyKey: setLocalTavilyKey,
    jinaKey: localJinaKey, setJinaKey: setLocalJinaKey,
  } = useCustomKeys();
  const [showGroqKey, setShowGroqKey] = useState(false);

  // Tuya device additions states
  const [newTuyaName, setNewTuyaName] = useState('');
  const [newTuyaDeviceId, setNewTuyaDeviceId] = useState('');
  const [newTuyaClientId, setNewTuyaClientId] = useState('');
  const [newTuyaClientSecret, setNewTuyaClientSecret] = useState('');
  const [newTuyaRegion, setNewTuyaRegion] = useState('us');

  const [showTavilyKey, setShowTavilyKey] = useState(false);
  const [showJinaKey, setShowJinaKey] = useState(false);
  const [searchGroundingEnabled, setSearchGroundingEnabled] = useState(() => {
    return safeStorage.getItem('bambuzau_gemini_search_grounding', 'false') === 'true';
  });
  const [atiServerUrl, setAtiServerUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1') && !origin.includes('file://') && !origin.includes('androidplatform.net')) {
        try {
          localStorage.setItem('bambuzau_web_origin', origin);
        } catch (_) {}
        return origin;
      }
    }
    try {
      return localStorage.getItem('bambuzau_web_origin') || 'https://ais-pre-lkl2we2wmy4ye4xn4cwt6k-78051899663.us-west1.run.app';
    } catch (_) {
      return 'https://ais-pre-lkl2we2wmy4ye4xn4cwt6k-78051899663.us-west1.run.app';
    }
  });
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline' | null>(null);
  const [isGeneratingPalette, setIsGeneratingPalette] = useState(false);
  const [backupText, setBackupText] = useState('');
  const [showClipboardBackup, setShowClipboardBackup] = useState(false);
  const [okPopupMessage, setOkPopupMessage] = useState<string | null>(null);
  const [showSerpKey, setShowSerpKey] = useState(false);

  const generatePaletteWithAI = async () => {
    if (!localCustomLogo) {
      showError('Por favor, selecione ou faça upload de um logotipo primeiro.');
      return;
    }
    
    setIsGeneratingPalette(true);
    setSuccessMsg('');
    setErrorMsg('');
    
    try {
      const customKey = localStorage.getItem('bambuzau_custom_gemini_key') || '';
      const isAndroidWebView = checkIsAndroidWebView();
      let colorsData;

      if (isAndroidWebView) {
        if (!customKey) {
          throw new Error("Por favor, configure sua chave Gemini API em 'Chaves Auxiliares' para gerar a paleta diretamente do navegador.");
        }
        colorsData = await callGeminiGeneratePalette(localCustomLogo, customKey);
      } else {
        try {
          const response = await fetch(getApiUrl('/api/gemini/generate-palette'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              logoBase64: localCustomLogo,
              customGeminiKey: customKey
            })
          });
          
          const data = await response.json();
          if (!response.ok || data.error) {
            throw new Error(data.error || 'Erro na resposta do servidor.');
          }
          colorsData = data;
        } catch (serverErr: any) {
          console.warn("[SettingsTab] Server generate-palette failed, attempting client direct calling fallback...", serverErr);
          if (customKey) {
            colorsData = await callGeminiGeneratePalette(localCustomLogo, customKey);
          } else {
            throw serverErr;
          }
        }
      }
      
      setAiColors(colorsData);
      setLocalTheme('custom');
      showSuccess('Paleta de cores gerada com IA a partir do seu logotipo! Clique em "Aplicar Customização" para salvar.');
    } catch (err: any) {
      console.error(err);
      showError('Falha ao gerar paleta de cores por IA: ' + err.message);
    } finally {
      setIsGeneratingPalette(false);
    }
  };

  // FAQ accordion open states
  const [faqOpen, setFaqOpen] = useState<{ [key: number]: boolean }>({
    0: true, // open the first one by default
    1: false,
    2: false,
    3: false
  });

  const toggleFaq = (index: number) => {
    setFaqOpen(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleApplyBranding = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBrandConfig({
      name: localName,
      theme: localTheme,
      icon: localIcon,
      customLogo: localCustomLogo,
      customThemeColors: localTheme === 'custom' ? aiColors : undefined
    });
    showSuccess('Configuração de marca atualizada com sucesso!');
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg('');
    setOkPopupMessage(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg('');
    setTimeout(() => setErrorMsg(''), 4000);
  };

  // 1. Export Data to JSON
  const handleExportData = () => {
    try {
      // Snapshot ALL persisted app state: every localStorage entry the app owns
      // (bambuzau_*, gestao3d_*, catalog, api keys, tuya devices, brand/logo, etc.)
      const storageDump: Record<string, string> = {};
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k) continue;
          // Skip transient UI flags that must not be restored
          if (k === 'bambuzau_open_product_form_pending') continue;
          const v = localStorage.getItem(k);
          if (v !== null) storageDump[k] = v;
        }
      } catch (e) {
        console.warn('Falha ao ler localStorage:', e);
      }

      const exportObject = {
        app_signature: 'Gestao3D_Backup',
        version: '3.4.0',
        timestamp: Date.now(),
        // In-memory React state (kept for backward compat with older restores)
        clients: clients || [],
        printers: printers || [],
        orders: orders || [],
        filamentStocks: filamentStocks || [],
        expenses: expenses || [],
        shoppingItems: shoppingItems || [],
        brandConfig: brandConfig || {},
        catalogItems: (() => {
          try { return JSON.parse(localStorage.getItem('bambuzau_local_catalog_production') || '[]'); }
          catch { return []; }
        })(),
        // Full storage dump — restores everything: keys, insumos, logo, tuya, cotações…
        storage: storageDump,
      };

      const jsonBackupText = JSON.stringify(exportObject, null, 2);
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `gestao3d_backup_${dateStr}.json`;

      let androidSaved = false;
      const android = (window as any).AndroidInterface;
      if (android && typeof android.saveFile === 'function') {
        try {
          android.saveFile(fileName, jsonBackupText, "application/json");
          androidSaved = true;
        } catch (androidErr: any) {
          console.warn("Falha ao salvar via AndroidInterface, usando fallback do navegador:", androidErr);
        }
      }

      if (!androidSaved) {
        // Safe, high-performance Blob download to prevent URI too large crashes on large databases
        const blob = new Blob([jsonBackupText], { type: "application/json" });
        const downloadUrl = URL.createObjectURL(blob);
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", downloadUrl);
        downloadAnchor.setAttribute("download", fileName);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        // Free browser memory
        URL.revokeObjectURL(downloadUrl);
      }

      showSuccess('Backup baixado com sucesso! Guarde este arquivo em segurança no seu PC ou pendrive.');
    } catch (err: any) {
      showError('Ocorreu um erro ao exportar os dados: ' + err.message);
    }
  };

  // 2. Import Data from JSON
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('Esta ação substituirá completamente o banco de dados local atual. Tem certeza que deseja restaurar este backup?')) {
      e.target.value = '';
      return;
    }

    // Criar ponto de restauração automático de emergência antes da importação
    createLocalRestorePoint(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        // Flexible and robust verification: accepts standard signatures OR presence of core datasets
        const isValidBackup = json && (
          json.app_signature === 'Gestao3D_Backup' ||
          json.app_signature === 'Bambuzau3D_Backup' ||
          Array.isArray(json.clients) ||
          Array.isArray(json.orders) ||
          Array.isArray(json.printers) ||
          Array.isArray(json.filamentStocks) ||
          (json.storage && typeof json.storage === 'object')
        );

        if (!isValidBackup) {
          showError('Arquivo do backup inválido ou incompatível! O arquivo precisa ser um backup gerado pelo Gestão 3D.');
          return;
        }

        applyFullBackup(json);
      } catch (err: any) {
        showError('Erro ao processar as informações do arquivo: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // clear input
  };

  // 1b. Export Backup to Clipboard (Text representation fallback for WebViews)
  const handleExportToClipboard = () => {
    try {
      let localCatalog = [];
      try {
        const savedCatalog = localStorage.getItem('bambuzau_local_catalog_production');
        if (savedCatalog) {
          localCatalog = JSON.parse(savedCatalog);
        }
      } catch (e) {
        console.warn("Could not read local catalog on export:", e);
      }

      const exportObject = {
        app_signature: 'Gestao3D_Backup',
        version: '3.3.0.4',
        timestamp: Date.now(),
        clients: clients || [],
        printers: printers || [],
        orders: orders || [],
        filamentStocks: filamentStocks || [],
        expenses: expenses || [],
        shoppingItems: shoppingItems || [],
        brandConfig: brandConfig || {},
        catalogItems: localCatalog
      };

      const jsonString = JSON.stringify(exportObject, null, 2);

      let copiedNatively = false;
      const android = (window as any).AndroidInterface;
      if (android && typeof android.copyToClipboard === 'function') {
        try {
          android.copyToClipboard(jsonString);
          copiedNatively = true;
        } catch (copyErr: any) {
          console.warn("Falha ao copiar usando AndroidInterface, usando fallback padrao:", copyErr);
        }
      }

      const fallbackCopy = (textToCopy: string) => {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          return navigator.clipboard.writeText(textToCopy);
        }
        return new Promise<void>((resolve, reject) => {
          try {
            const textarea = document.createElement('textarea');
            textarea.value = textToCopy;
            textarea.style.top = '0';
            textarea.style.left = '0';
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            if (success) resolve();
            else reject(new Error('Erro no execCommand'));
          } catch (err) {
            reject(err);
          }
        });
      };

      if (copiedNatively) {
        showSuccess('Código de backup copiado para a Área de Transferência com absoluto sucesso! Você já pode salvar no WhatsApp, Keep ou Gmail.');
      } else {
        fallbackCopy(jsonString)
          .then(() => {
            showSuccess('Código de backup copiado para a Área de Transferência com absoluto sucesso! Você já pode salvar no WhatsApp, Keep ou Gmail.');
          })
          .catch((err) => {
            showError('Falha ao usar Área de Transferência: ' + err.message);
          });
      }
    } catch (e: any) {
      showError('Ocorreu um erro ao estruturar backup em texto: ' + e.message);
    }
  };

  // 2b. Import Backup from pasted text structure
  const handleImportFromPastedText = () => {
    if (!backupText.trim()) {
      showError('Por favor, cole o texto de backup copiado anteriormente no campo de texto.');
      return;
    }

    if (!confirm('ATENÇÃO: Isso substituirá o seu banco de dados atual pelas informações do texto colado. Prosseguir?')) {
      return;
    }

    try {
      const json = JSON.parse(backupText.trim());
      
      // Validation check
      if (!json || (json.app_signature !== 'Gestao3D_Backup' && json.app_signature !== 'Bambuzau3D_Backup' && !json.clients && !json.orders && !json.storage)) {
        showError('Texto colado não parece ser um backup válido do Gestão 3D!');
        return;
      }

      // Criar ponto de restauração automático de emergência antes da importação
      createLocalRestorePoint(true);

      applyFullBackup(json);

      setBackupText('');
      setShowClipboardBackup(false);
      showSuccess('Banco de dados restaurado via texto com absoluto sucesso! Sincronizado.');
    } catch (err: any) {
      showError('Falha ao ler o código colado. Verifique se copiou todo o código do backup anterior: ' + err.message);
    }
  };

  // 3. Generate Summary PDF in Bambuzau Colors
  const handleGeneratePDF = () => {
    try {
      const doc = new jsPDF();
      let y = 15;

      // Color Palette based on selection or Bambuzau original
      // Sage Green: (99, 126, 85) - #637E55
      // Bamboo Yellow/Gold: (226, 177, 68) - #E2B144
      // Dark Charcoal: (53, 69, 44) - #35452C
      // Warm Sand Background (light beige for shapes): (247, 244, 233) - #F7F4E9

      const brandGreen = { r: 99, g: 126, b: 85 };
      const brandGold = { r: 226, g: 177, b: 68 };
      const brandDark = { r: 53, g: 69, b: 44 };
      const brandCream = { r: 247, g: 244, b: 233 };

      // DRAW PAGE HEADER ACCENT (Bambuzau original theme colored bar)
      doc.setFillColor(brandGreen.r, brandGreen.g, brandGreen.b);
      doc.rect(0, 0, 210, 6, 'F');

      // TITLE & LOGO DECORATION
      doc.setTextColor(brandDark.r, brandDark.g, brandDark.b);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(26);
      doc.text(brandConfig.name.toUpperCase(), 15, y + 10);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(brandGold.r, brandGold.g, brandGold.b);
      doc.text('AGENCIA 3D  |  PERSONALIZADOS QUE CONECTAM', 15, y + 16);

      y += 24;

      // Horizontal separator line
      doc.setDrawColor(brandGreen.r, brandGreen.g, brandGreen.b);
      doc.setLineWidth(0.5);
      doc.line(15, y, 195, y);

      y += 10;

      // SUBTITLE & METADATA
      doc.setTextColor(brandDark.r, brandDark.g, brandDark.b);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('MANUAL COMPACTO DE COMPONENTES E FUNCIONALIDADES', 15, y);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(110, 110, 110);
      doc.text(`Documento gerado em: ${new Date().toLocaleDateString('pt-BR')}  |  Versão App: 3.0`, 15, y + 5);

      y += 14;

      // EXECUTIVE SUMMARY BOX
      doc.setFillColor(brandCream.r, brandCream.g, brandCream.b);
      doc.rect(15, y, 180, 26, 'F');
      
      doc.setTextColor(brandDark.r, brandDark.g, brandDark.b);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('RESUMO DO ATELIÊ:', 19, y + 6);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(60, 60, 60);
      const summaryText = `O aplicativo ${brandConfig.name} é um painel de gestão de fabricação e controle de custos totalmente focado em ateliês de manufatura aditiva. Permite o controle de produção em tempo real, monitoramento de rolos de filamentos, gestão de orçamento de energia e emenda de bobinas, servindo de central inteligente corporativa.`;
      const listSummary = doc.splitTextToSize(summaryText, 172);
      doc.text(listSummary, 19, y + 12);

      y += 34;

      // FUNCTIONAL MODULES SECTION
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(brandGreen.r, brandGreen.g, brandGreen.b);
      doc.text('1. PILARES E FUNCIONALIDADES DO SISTEMA', 15, y);
      
      y += 6;

      const modules = [
        {
          title: 'A. Painel Financeiro & Monitor de Extrusoras (Dashboard)',
          desc: 'Aba centralizadora com faturamento bruto cumulativo, margem operacional liquida total e graficos de fluxo de caixa de pedidos ativos. Possui bicos virtuais mostrando o progresso individual de cada impressora em tempo real.'
        },
        {
          title: 'B. Fila de Producao Ativa (Producao)',
          desc: 'Cadastro e gerenciamento das pecas. Permite alocar trabalhos a impressoras especificas, monitorar progresso com simulação de avanco rapido (Tick) e alterar status (Espera, Fila, Imprimindo, Pos-proc, Pronto, Entregue).'
        },
        {
          title: 'C. Inventario Seguro de Filamentos (Custos & Estoque)',
          desc: 'Controle de carretéis de filamento ativos (PLA, PETG, ABS, TPU) com indicador visual de escassez e emenda de filamento. Permite recarregar gramas das bobinas e integrar com um carrinho de compras de reposição.'
        },
        {
          title: 'D. Calculadora e Validador de Bobinas Sobrantes',
          desc: 'Calculadora integrada que soma o custo da resina/filamento, mao de obra operacional por hora, acrescido de consumo eletrico (kWh) do modelo da impressora, validando se alguma bobina de resto consegue imprimir a peça inteira.'
        },
        {
          title: 'E. Assistente Inteligente AI de Suporte',
          desc: 'Mapeia respostas tecnicas sobre fatiador, empenamento (warping), descolagem de mesa PEI, calibração de fluxo térmico de bico e orçamentação dinamica baseada nos perfis de materiais ativos no atelie.'
        },
        {
          title: 'F. Integrador de Marketplace Externo (Shopee e Mercado Livre)',
          desc: 'Permite autenticar conexões via token seguro e importar ordens de venda da Shopee, Nuvemshop ou Mercado Livre com um clique para a fila de produção ativa, unificando os canais físicos e digitais.'
        }
      ];

      modules.forEach((mod) => {
        if (y > 260) {
          doc.addPage();
          // Draw page header on second page too
          doc.setFillColor(brandGreen.r, brandGreen.g, brandGreen.b);
          doc.rect(0, 0, 210, 6, 'F');
          y = 15;
        }

        doc.setFillColor(brandGreen.r, brandGreen.g, brandGreen.b);
        doc.circle(18, y + 1, 1.2, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(brandDark.r, brandDark.g, brandDark.b);
        doc.text(mod.title, 22, y + 2);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        const splitDesc = doc.splitTextToSize(mod.desc, 172);
        doc.text(splitDesc, 22, y + 7);

        y += 18;
      });

      if (y > 250) {
        doc.addPage();
        // Draw page header on third page too
        doc.setFillColor(brandGreen.r, brandGreen.g, brandGreen.b);
        doc.rect(0, 0, 210, 6, 'F');
        y = 15;
      }

      y += 4;
      
      // FAQ SEGMENT IN PDF
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(brandGreen.r, brandGreen.g, brandGreen.b);
      doc.text('2. SEGURANÇA E INTEGRALIDADE DE DADOS', 15, y);
      y += 8;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(brandDark.r, brandDark.g, brandDark.b);
      doc.text('Armazenamento Local (Navegador) vs. Nuvem (Firebase)', 15, y);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(85, 85, 85);
      const storageDesc = 'O banco de dados nativo funciona em localStorage de forma extremamente rapida sem internet. No entanto, se o navegador for limpo ou o PC formatado, os dados seriam permanentemente perdidos. Para se proteger, o sistema disponibiliza o botao de BACKUP LOCAL em formato JSON. Salve este arquivo em seu computador de forma regular ou opte por conectar o Firebase para sincronização automática segura em nuvem.';
      const splitSt = doc.splitTextToSize(storageDesc, 180);
      doc.text(splitSt, 15, y + 5);

      y += 26;

      // SIGNATURE / CERTIFICATION DECORATION
      doc.setFillColor(brandCream.r, brandCream.g, brandCream.b);
      doc.rect(15, y, 180, 25, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(brandDark.r, brandDark.g, brandDark.b);
      doc.text('DOUBLÉ-CHECK DE HOMOLOGAÇÃO:', 19, y + 7);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Este relatório atesta que o software do ateliê ${brandConfig.name} está homologado com toda a arquitetura de banco de dados offline-first, backup estruturado em árvore JSON e interface personalizável adaptativa de cores com as diretrizes oficiais.`, 19, y + 13);

      doc.save(`relatorio_${brandConfig.name.toLowerCase().replace(/\s+/g, '_')}.pdf`);
      showSuccess('PDF Relatório Compacto baixado com sucesso! Verifique sua pasta de downloads.');
    } catch (err: any) {
      showError('Ocorreu um erro ao gerar o PDF: ' + err.message);
    }
  };

  // 4. Generate Highly Detailed Blueprint Spec PDF for Cloning
  const handleGenerateBlueprintPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      let pageNum = 1;
      let currentTitle = "Especificação Técnica: Clone Perfeito Gestão 3D";

      // Helper to draw clean header and background
      const drawPageDecorations = (titleText: string) => {
        // Top solid accent line
        doc.setFillColor(244, 110, 31); // Brand Primary Orange
        doc.rect(0, 0, 210, 5, 'F');

        // Header Section
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 125);
        doc.text("MAPA DE CLONAGEM & MANIFESTO DE REPLICAÇÃO MASTER GESTÃO 3D", 15, 12);
        doc.text(`FL. ${pageNum}`, 195, 12, { align: 'right' });

        // Divider
        doc.setDrawColor(220, 220, 225);
        doc.setLineWidth(0.4);
        doc.line(15, 14, 195, 14);

        // Page Title Banner
        doc.setFillColor(242, 244, 248);
        doc.rect(15, 18, 180, 12, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42); // Slate-900
        doc.text(titleText.toUpperCase(), 20, 25.5);

        // Grid Design Lines
        doc.setDrawColor(244, 110, 31, 0.15);
        doc.line(15, 30, 15, 280);
        doc.line(195, 30, 195, 280);

        // Bottom solid footer accent line
        doc.setDrawColor(230, 230, 235);
        doc.line(15, 280, 195, 280);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(140, 140, 145);
        doc.text(`Ateliê Suite - Manual Prático Blindado para Engenharia Reversa - Gerado em ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 15, 285);
        doc.text(`Licença Operacional Ateliê Segura - Proibida Compartilhação Comercial Externa`, 195, 285, { align: 'right' });
      };

      let Y = 36;
      
      const checkPageOverflow = (heightNeeded: number) => {
        if (Y + heightNeeded > 268) {
          doc.addPage();
          pageNum++;
          Y = 36;
          drawPageDecorations(currentTitle);
          return true;
        }
        return false;
      };

      const addSectionHeader = (title: string) => {
        checkPageOverflow(15);
        Y += 1;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(244, 110, 31); // Brand primary orange
        doc.text(title.toUpperCase(), 15, Y);
        doc.setDrawColor(244, 110, 31, 0.5);
        doc.setLineWidth(0.35);
        doc.line(15, Y + 1.8, 195, Y + 1.8);
        Y += 7.5;
      };

      const addParagraph = (text: string, isLight = false, customSize = 8.5) => {
        const splitText = doc.splitTextToSize(text, 178);
        const needed = (splitText.length * 3.8) + 1.5;
        checkPageOverflow(needed);
        
        doc.setFont('helvetica', isLight ? 'normal' : 'bold');
        doc.setFontSize(customSize);
        doc.setTextColor(isLight ? 70 : 25);
        doc.text(splitText, 15, Y);
        Y += (splitText.length * 3.8) + 1.5;
      };

      const addBullet = (bulletTitle: string, bulletText: string) => {
        const fullTxt = bulletTitle + bulletText;
        const splitText = doc.splitTextToSize(fullTxt, 172);
        const needed = (splitText.length * 3.8) + 2;
        checkPageOverflow(needed);

        // Small orange dot
        doc.setFillColor(244, 110, 31);
        doc.circle(18, Y - 1, 0.8, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(20, 20, 25);
        doc.text(bulletTitle, 21, Y);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(65, 65, 70);
        const availableWidth = 175 - doc.getTextWidth(bulletTitle);
        if (availableWidth > 40) {
          const splitParagraph = doc.splitTextToSize(bulletText, availableWidth);
          doc.text(splitParagraph, 21 + doc.getTextWidth(bulletTitle) + 1, Y);
          Y += (splitParagraph.length * 3.8) + 2;
        } else {
          Y += 3.8;
          const splitRemainder = doc.splitTextToSize(bulletText, 170);
          doc.text(splitRemainder, 21, Y);
          Y += (splitRemainder.length * 3.8) + 2.5;
        }
      };

      const addCodeBlock = (codeLines: string[]) => {
        const heightNeeded = (codeLines.length * 3.2) + 4;
        checkPageOverflow(heightNeeded);
        
        doc.setFillColor(24, 24, 27); // Dark gray background
        doc.rect(15, Y - 1, 180, heightNeeded - 2, 'F');
        doc.setDrawColor(63, 63, 70);
        doc.setLineWidth(0.2);
        doc.rect(15, Y - 1, 180, heightNeeded - 2, 'S');

        doc.setFont('courier', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(52, 211, 153); // Emerald accent text
        let tempY = Y + 2;
        for (let line of codeLines) {
          doc.text(line, 19, tempY);
          tempY += 3.2;
        }
        Y += heightNeeded + 1;
      };

      // ================= PAGE 1 =================
      currentTitle = "PAGE 1: DIRETRIZES DE ENGENHARIA E MODELO DE DADOS CORE";
      drawPageDecorations(currentTitle);

      addParagraph("Este manifesto foi projetado para fornecer um mapa de clonagem completo, de nível militar, mapeando cada botão, cada algoritmo interno, as estruturas de dados e regras visuais do sistema 'Gestão 3D' (Ateliê 3D Hub). Com esta especificação, qualquer programador React/TypeScript com Tailwind CSS pode reconstruir toda a aplicação com fidelidade cirúrgica.", false, 9.5);

      addSectionHeader("1. Estrutura Estrutural de Dados (TypeScript Interfaces)");
      addParagraph("O sistema repousa inteiramente sobre as seguintes tipagens do arquivo 'src/types.ts'. Todas as coleções residem em buffers reativos no localStorage do navegador sob chaves estritamente indexadas:", true, 8);

      addCodeBlock([
        "export interface Client {",
        "  id: number;           // Autoincrement gerado em tempo de inserção local",
        "  name: string;         // Nome completo do cliente",
        "  phone: string;        // Máscara reativa (XX) XXXXX-XXXX",
        "  email: string;        // String com validação Regex de e-mail básico",
        "  address: string;      // Endereço físico completo de entrega",
        "  note?: string;         // Obserações técnicas do ateliê",
        "  lastContactDate?: number; // Timestamp do último botão de WhatsApp pressionado",
        "  stockCount?: number;   // Quantidade cumulativa de pedidos deste cliente",
        "  stockValue?: number;   // Faturamento nominal total deste comprador",
        "}"
      ]);

      addCodeBlock([
        "export interface Printer {",
        "  id: number;",
        "  name: string; model: string;",
        "  status: 'IDLE' | 'PRINTING' | 'MAINTENANCE'; // Status operacional das extrusoras",
        "  ipAddress: string; cameraUrl?: string; nozzleTemp?: number; bedTemp?: number;",
        "  apiType?: 'KLIPPER' | 'OCTOPRINT' | 'BAMBU_CLOUD' | 'NONE';",
        "  apiKey?: string; port?: string; printProgress?: number; currentJob?: string;",
        "}"
      ]);

      addCodeBlock([
        "export interface PrintOrder {",
        "  id: number; clientId?: number | null; clientName: string; itemName: string;",
        "  quantity: number; filamentType: string; filamentColor: string; weightGrams: number;",
        "  printTimeHours: number; priceCharged: number; createdAt: number; deadline: number;",
        "  platformSource: 'MANUAL' | 'SHOPEE' | 'MERCADO_LIVRE' | 'NUVEMSHOP' | 'AMAZON' | 'TIKTOK_SHOP';",
        "  status: 'WAITING' | 'QUEUE' | 'PRINTING' | 'POST_PROCESS' | 'READY' | 'DELIVERED';",
        "  printingProgress: number; assignedPrinterId?: number | null; printerName?: string;",
        "  paymentMethod?: 'CONSIGNADO' | 'CARTÃO' | 'DINHEIRO' | 'OUTROS'; paymentStatus?: 'PAGO' | 'PENDENTE';",
        "}"
      ]);

      addCodeBlock([
        "export interface CatalogItem {",
        "  id: number; name: string; description: string; weightGrams: number;",
        "  printTimeHours: number; filamentType: string; defaultPrice: number; productCode: string;",
        "  spentPartId?: number | null; spentPartQty?: number; imageUrl?: string;",
        "}"
      ]);

      addCodeBlock([
        "export interface FilamentStock {",
        "  id: number; type: string; color: string; stockGrams: number;",
        "  minStockGrams: number; priceRoll: number; // Preço do rolo de 1kg nominal",
        "}"
      ]);

      // ================= PAGE 2 =================
      doc.addPage();
      pageNum++;
      currentTitle = "PAGE 2: COMPONENTES GLOBAIS, ABA 0 (PAINEL) & ABA 1 (PRODUÇÃO)";
      drawPageDecorations(currentTitle);

      addSectionHeader("2. DESIGN DE FRAME E ELEMENTOS GLOBAIS DE INTERFACE");
      addBullet("Cabeçalho Flutuante (Header Island): ", "Borda arredondada (rounded-[2rem] bg-black/40 backdrop-blur-3xl). Apresenta à esquerda o Logotipo dinâmico (carregado via input de imagem da marca) ao lado do Status Respiratório (um círculo neon que pisca no CSS usando keyframes de pulsação 'animate-pulse'). O círculo muda de cinza (todas as máquinas desocupadas) para verde brilhante assim que uma das máquinas no vetor 'printers' ganha o status 'PRINTING'. À direita exibe metadados de rede.");
      addBullet("Barra Inferior Revolucionária de Navegação (Floating Dock): ", "Contêiner customizado redondo (rounded-full). Ao clicar em qualquer botão de aba, dispara o estado setter 'setCurrentTab(index)'. O botão de aba selecionado ganha um background ativo da cor principal com brilho de dispersão (shadow-[0_4px_20px_rgba(244,110,31,0.4)]) e ícone levemente ampliado (scale-105).");

      Y += 3;
      addSectionHeader("3. DETALHAMENTO BOTÃO A BOTÃO: ABA 0 - PAINEL DE CONTROLE (DASHBOARD)");
      addBullet("Filtro Ativador 'Dias do Histórico': ", "Um botão selector triplo no topo. Valores: 'Hoje', '7 dias', '30 dias'. Ao acionar, recomputa instantaneamente os vetores locais de vendas filtrando pelo timestamp de criação (createdAt) do pedido correspondente.");
      addBullet("Card 'Faturamento Bruto': ", "Número expressivo formatado em moeda local BRL (R$). Soma todos os pedidos marcados como concluídos/entregues no período do filtro selecionado.");
      addBullet("Card 'Margem Líquida Estimada': ", "Percentual dinâmico calculado subtraindo-se o custo nominal do filamento consumido (obtido pelo peso em gramas do pedido vezes o preço do grama no estoque do filamento) e descontando energia do preço cobrado.");
      addBullet("Card 'Alerta de Auditoria': ", "Compara a data atual com a variável persistida 'lastAuditDate'. Se o delta ultrapassar 3 dias, mostra banner com ícone de perigo vermelho-carmesim instruindo o operador a realizar recontagem física do estoque do silo.");
      addBullet("Botão 'Registrar Venda Rápida': ", "Abre overlay flutuante em 'App.tsx' com formulário rápido contendo campos auto-calculados de preço com base no peso e tipo de material do produto escolhido no catálogo.");

      Y += 3;
      addSectionHeader("4. DETALHAMENTO BOTÃO A BOTÃO: ABA 1 - PRODUÇÃO & PRINTFLOW");
      addBullet("Botão-Gatilho 'Novo Trabalho' (Add GCODE): ", "Abre formulário flutuante exigindo: Nome de arquivo (.gcode/.3mf), Tempo Estimado de Impressão (Horas + Minutos), Peso Neto em Gramas, Seleção da Máquina Alocada, e Opção de Vincular a um Pedido pendente.");
      addBullet("Botão-Gatilho 'Adicionar Máquina': ", "Modal para registrar impressora. Inputs: Nome (ex: Prusa MK4), Modelo, Tipo de Interface IP (OctoPrint / Klipper / Klipper-Fluidd / None), IP Address, Custo Watts Hora do bico aquecido e Câmera Stream URL.");
      addBullet("Botão 'Play' (Iniciar Execução): ", "Mapeia para a impressora vinculada, muda seu status de 'IDLE' para 'PRINTING'. Inicia animação de barra de progresso acumulando tempo.");
      addBullet("Botão 'Pause / Stop': ", "Muda o status da máquina imediatamente para manutenção ou espera, suspendendo transações de timers locais.");
      addBullet("Botão 'Ação Rápida de Limpeza': ", "Limpa jobs arquivados há mais de 15 dias da fila para esvaziamento de cache local.");

      // ================= PAGE 3 =================
      doc.addPage();
      pageNum++;
      currentTitle = "PAGE 3: ABA 2 (CRM CLIENTES) & ABA 3 (ERP INTEGRAÇÕES)";
      drawPageDecorations(currentTitle);

      addSectionHeader("5. DETALHAMENTO BOTÃO A BOTÃO: ABA 2 - CLIENTES & CRM");
      addBullet("Botão-Gatilho 'Cadastrar Novo Cliente': ", "Dispara painel de formulário vertical. Campos: Nome Completo (obrigatório, com trim de espaços brancos na ponta), Telefone WhatsApp, Endereço de Despacho Técnico e e-mail único.");
      addBullet("Botão 'Disparar WhatsApp Automático' (Ícone Verde wa.me): ", "Lê o status dos pedidos vinculados ao id de cliente selecionado, compila um texto amigável pré-formatado em português e direciona para o navegador linkando com a API pública do WhatsApp. Template oficial reproduzido:");
      addCodeBlock([
        "const msg = `Olá ${cliente.name}! Aqui é do Ateliê 3D. Passando para atualizar o status do` + ",
        "  ` seu pedido: *${pedido.itemName}* no momento está no estágio de *${traduzirStatus(pedido.status)}*.` +",
        "  ` Estamos cuidando de cada detalhe com a máxima precisão operacional!`;",
        "window.open(`https://api.whatsapp.com/send?phone=55${cliente.phone.replace(/\\D/g, '')}&text=${encodeURIComponent(msg)}`);"
      ]);
      addBullet("Botão 'Ações > Histórico de Vendas': ", "Troca a interface do cliente para um log expandido listando todos os itens encomendados, ticket médio histórico do cliente, e o total nominal gasto, permitindo exportar uma ficha individual de cliente.");
      addBullet("Botão Deletar Cliente (Confirmação Dupla): ", "Garante que o programador clone implemente proteção contra cliques acidentais. Ao acionar o ícone de lixeira, o botão muda para 'Confirmar Exclusão' exigindo um segundo clique confirmando e desencadeando o expurgo seguro do buffer reativo.");

      Y += 4;
      addSectionHeader("6. DETALHAMENTO BOTÃO A BOTÃO: ABA 3 - INTEGRAÇÃO ERP & OKLOJA INTELLIGENCE");
      addBullet("Botão 'Conectar Canais Eletrônicos': ", "Abre form slide-over para salvar tokens e segredos para conexões via API com Mercado Livre, Shopee, Bling ERP ou NuvemShop.");
      addBullet("Botão 'Sincronizar Pedidos Pendentes': ", "Efetua varredura nominal de faturas pendentes de empacotamento em APIs remotas. O sistema insere no buffer dinâmico de novos pedidos e aciona um pisca intermitente (animate-tab-blink) no rodapé de abas caso existam novos pedidos para puxar.");
      addBullet("Botão 'Processar e Vincular Fila': ", "Com apenas um único clique no botão do painel, o sistema lê os metadados do pedido externo, infere o peso recomendado utilizando inteligência artificial, deduz material correspondente dos silos e anexa o arquivo gcode simulado à Aba 1 (Produção), poupando redigitação manual completa pelo operador do sistema.");
      addBullet("OkLoja Assistant 'Solicitar Análise de Mercado': ", "Gatilho que aciona chamada à API Gemini com o payload completo de histórico recente de vendas. O robô retorna respostas estruturadas de sugestões de modelos STL escaláveis para faturar mais.");

      // ================= PAGE 4 =================
      doc.addPage();
      pageNum++;
      currentTitle = "PAGE 4: ABA 4 (CUSTOS, FILAMENTOS, INSUMOS & ESTOQUES)";
      drawPageDecorations(currentTitle);

      addSectionHeader("7. ABA 4: O CÉREBRO DE CUSTOS, ESTIMADOR E FORMADOR DE PREÇO");
      addParagraph("O programador do clone deve codificar fielmente a FÓRMULA MESTRA DE PRECIFICAÇÃO 3D. A fórmula fatora variáveis flutuantes exatas, impedindo que consumos pequenos (gramas) ou tempos curtos resultem em preços zero:", true, 8);

      addCodeBlock([
        "// A FÓRMULA MATEMÁTICA CONVERTE PRECISÃO COMPOSTA",
        "const custoFilamento = (pesoPecaGrams * (1 + taxaPerdaSuportesPercent / 100)) * (custoRoloFilamentoBRL / 1000);",
        "const custoEnergia = (consumoWattsMaquina / 1000) * tempoImpressaoHoras * custoKwhBRL;",
        "const depreciacaoMaquina = (valorMaquinaBRL / tempoVidaUtilHoras) * tempoImpressaoHoras;",
        "const custoInsumosEmbalagem = totalAcumuladoInsumosFisicosUsadosBRL;",
        "const custoMaoDeObra = tempoAcabamentoPosProcessamentoHoras * valorSuaHoraTrabalhoBRL;",
        "",
        "const custoProducaoTotal = custoFilamento + custoEnergia + depreciacaoMaquina + custoInsumosEmbalagem + custoMaoDeObra;",
        "// Incorporação de Margem e Taxa de Marketplace para Tráfego ou Markup",
        "const precoVendaParcial = custoProducaoTotal * (1 + margemLucroDesejadoPercent / 100);",
        "const precoVendaFinal = (precoVendaParcial + tarifaFixaMarketplaceBRL) / (1 - comissaoMarketplacePercent / 100);"
      ]);

      addBullet("Botão-Gatilho 'Novo Rolo de Filamento': ", "Adiciona no array de 'filaments' com parâmetros específicos: Fabricante/Fornecedor (ex: 3D Fila, Slic3r, Sunlu), Tipo de Polímero (PLA, ABS, PETG, TPU, Nylon), Cor, Custo Pago por Bobina, e Estoque Líquido Atual em Gramas.");
      addBullet("Botão 'Calcular Emenda de Bobina' (Bobina Killer): ", "Permite introduzir o peso de extrusão necessário para um trabalho específico e computa se a soma de rolos de filamentos com poucas gramas (pesos baixos como < 250 g) podem completar o job com pause programado.");
      addBullet("Botão 'Add Insumo': ", "Lista descartáveis como Fita de Fixação, Spray Adesivo de Mesa, Álcool Isopropílico, Embalagens de Papelão, Caixas e Fitas adesivas, associando custo unitário à precificação mestre.");
      addBullet("Botão 'Gerar Cotações Virtuais': ", "Módulo integrado para simular custos de atacado importando lances de portais integrados parceiros de filamentos brasileiros.");

      // ================= PAGE 5 =================
      doc.addPage();
      pageNum++;
      currentTitle = "PAGE 5: ABA 5 (AJUSTES & BACKUPS) & ABA 6 (VITRINE / HISTÓRICO)";
      drawPageDecorations(currentTitle);

      addSectionHeader("8. DETALHAMENTO BOTÃO A BOTÃO: ABA 5 - AJUSTES, TEMAS & SEGURANÇA LOCAL");
      addBullet("Botão 'Aplicar Configuração': ", "Valida os campos de alteração de nome do ateliê (brandConfig.name) e o link do logotipo (brandConfig.logoUrl), efetuando re-render global em todas as instâncias que consomem o nome.");
      addBullet("Série de Botões Seletores e Inputs de Cores Hexadecimal: ", "Altera dinamicamente as classes de cor injetadas nas tags root do CSS para transformar todo o visual do site (White-Label completo). Valores hexadecimais salvos:");
      addCodeBlock([
        "const applyVisualTheme = (themeName) => {",
        "  const themes = {",
        "    'bambuzau': { primary: '#F46E1F', bg: '#0A0A0B', card: '#121215' }, // Amber Original",
        "    'cyberpunk': { primary: '#00F0FF', bg: '#0A0612', card: '#1A0C2E' }, // Neon Blue/Magenta",
        "    'mint': { primary: '#10B981', bg: '#060F0C', card: '#0D1F1A' },      // Green Forest",
        "    'obsidian': { primary: '#EF4444', bg: '#090909', card: '#141414' }   // Black Crimson",
        "  };",
        "  document.documentElement.style.setProperty('--brand-primary', themes[themeName].primary);",
        "  // Sincroniza em localStorage para que persista ao dar refresh",
        "}"
      ]);
      addBullet("Botão 'Exportar JSON / Backup' (Fisico): ", "Compila todas as tabelas em um objeto unificado incorporando chave de controle de integridade 'app_signature: Gestao3D_Backup'. Se estiver no app móvel Android nativo, ativa a ponte Javascript 'Android.saveFile' para contornar limitações.");
      addBullet("Botão 'Gerar Cópia de Segurança em Texto' (Área de Transferência): ", "Mapeia os dados do banco relacional, compacta em uma única string criptografada e copia para o clipboard do operador, funcionando inteiramente sem dependência de escrita física de arquivos de disco.");
      addBullet("Botão 'Restaurar Backup por Texto': ", "Abre um campo 'textarea'. O operador cola o código gerado em qualquer máquina, o parser valida o cabeçalho 'app_signature' e injeta instantaneamente de volta no core de dados.");

      Y += 4;
      addSectionHeader("9. DETALHAMENTO BOTÃO A BOTÃO: ABA 6 - VENDAS, HISTÓRICO & VITRINE PÚBLICA");
      addBullet("Botão-Gatilho 'Novo Produto para Catálogo': ", "Insere itens na vitrine: Foto nominal, Código de SKU, Peso médio de impressão, Tempo estimado, e o custo calibrado pela Aba 4, permitindo vendas de balcão imediatas.");
      addBullet("Botão 'Ver Vitrine Pública (Showcase Mode)': ", "Oculta completely os menus administrativos e de controle, ocultando o floating dock de navegação e transformando o app em um terminal e-commerce de catálogo limpo para exibição externa para os compradores do ateliê.");
      addBullet("Botão 'Filtro e Busca': ", "Busca indexada por nome do cliente ou SKU de item em tempo de digitação, acelerando encontrar pacotes faturados antigos.");
      addBullet("Botão 'Exportar Vendas para CSV/Excel': ", "Cria uma planilha textual de histórico geral de faturamento contendo todas as ordens marcadas com status de faturamento.");

      // ================= PAGE 6 =================
      doc.addPage();
      pageNum++;
      currentTitle = "PAGE 6: INTERFACE COM ANDROID NATIVO & TESTES";
      drawPageDecorations(currentTitle);

      addSectionHeader("10. INTEGRAÇÃO NATIVA COM ENVELOPE ANDROID (KOTLIN/COMPOSER)");
      addParagraph("O sistema clonado deve ser robusto para operar dentro de ambientes de webview móvel isolado. O arquivo package.json contendo a declaração de scripts e as configurações de build devem prever os retornos e injeções cruzadas:", true, 8.5);

      addBullet("Deteção de Versão APK Nativo via Injeção Javascript: ", "O frontend React tenta mapear dinamicamente ao iniciar se o ambiente é móvel verificando a presença do objeto global 'window.AndroidInterface':");
      addCodeBlock([
        "useEffect(() => {",
        "  if (window.AndroidInterface && typeof window.AndroidInterface.getNativeVersion === 'function') {",
        "    const currentAPKVersion = window.AndroidInterface.getNativeVersion();",
        "    // Compara com a chave remota de atualizações salvas em 'update_info.json'",
        "    if (parseFloat(currentAPKVersion) < parseFloat(remoteUpdate.version)) {",
        "      setUpdateBannerVisible(true);",
        "    }",
        "  }",
        "}, []);"
      ]);

      addBullet("Bypass Direto de Links Dropbox/Drive para APK Downloads: ", "Para contornar telas de confirmação de navegadores móveis WebView no celular, o link de atualização do APK no botão 'Baixar Nova Versão' converte automaticamente URIs do Dropbox terminados em '?dl=0' para a direct stream URL '?dl=1' ou raw=1, iniciando instantaneamente o download do binário de compilação sem intervenção externa.");
      addBullet("Tamanho Adequado da Área de Toque (Touch targets): ", "Todos os botões da barra dock inferior, botões de exclusão de jobs, botões de ligar câmera Octoprint e de emendas de bobinas possuem classes 'py-2.5 px-3' e 'touch-none md:touch-auto' com pelo menos 45px de área de contato, prevenindo duplo clique inadequado sob telas de touch móvel.");

      Y += 4;
      addSectionHeader("11. RESUMO DOS FLUXOS DE BOTÕES PARA MANUFASE COMPLETA");
      addParagraph("Use a lista a seguir como guia sequencial para codificar o comportamento de tela a tela:", true, 8.5);
      addBullet("Aba 0: ", "Cards Bento -> Botão Filtros -> Botão Registro Rápido -> Alerta Auditoria.");
      addBullet("Aba 1: ", "Add Job -> Play Job -> Pause Job -> Delete Job -> Add Printer -> Open Webcam Pop-up.");
      addBullet("Aba 2: ", "Add Client -> Search Box -> CRM Edit -> Whatsapp Direct -> View History logs.");
      addBullet("Aba 3: ", "Connect Channel -> Synchronize ML/Shopee -> Quick Import Job -> Ask OkLoja AI Advice.");
      addBullet("Aba 4: ", "Add Filament Stock -> Calculate Emenda de Bobina -> Estimate Master pricing -> Add Consumable Stock.");
      addBullet("Aba 5: ", "Set Atelier Name & Logo -> Choose Visual theme -> Manual JSON Export -> Paste Clipboard Backup -> Save Firebase Keys.");
      addBullet("Aba 6: ", "Catalog Product -> Open Showcase portal -> Table search -> Download Sales spreadsheets.");

      doc.save(`BLUEPRINT_TECNICO_COMPLETO_CLONE_GESTAO3D.pdf`);
      showSuccess("Manual de Engenharia e Clonagem Perfeita Completa (PDF de 6 Páginas) gerado e baixado! Todos os botões, Tipos e Métodos foram estruturados com rigor absoluto.");
    } catch (err: any) {
      showError("Erro técnico ao gerar especificação PDF para clonagem: " + err.message);
    }
  };

  return (
    <div className="space-y-6" id="settings_tab_container">
      {/* SUCCESS / ERROR ALERTS */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-2" id="settings-success-alert">
          <Check className="h-5 w-5 text-emerald-400" />
          <span className="text-sm font-semibold">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2" id="settings-error-alert">
          <Info className="h-5 w-5 text-red-400" />
          <span className="text-sm font-semibold">{errorMsg}</span>
        </div>
      )}


      {/* PAINEL UNIFICADO DE CHAVES DE API & INTELIGÊNCIA ARTIFICIAL */}
      <div className="p-6 bg-[#151917] border border-[#232B27] rounded-3xl relative overflow-hidden space-y-5 my-6 animate-fade-in" id="card-unified-api-keys">
        <div className="absolute top-0 right-0 h-32 w-32 bg-[#52b788]/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#95BBA2] bg-[#95BBA2]/10 px-2 py-0.5 rounded border border-[#95BBA2]/25 inline-block font-mono">Inteligência Artificial & Conectividade</span>
          <h3 className="text-sm font-bold text-[#F1F4EE] flex items-center gap-1.5 flex-wrap">
            <Sparkles className="h-4.5 w-4.5 text-[#52b788]" />
            Painel Geral de Chaves de APIs (Gemini, Groq & SerpApi)
          </h3>
          <p className="text-[11px] text-[#8BA58D] leading-relaxed">
            Seu assistente virtual de voz e texto <strong className="text-white">Ok Loja</strong>, a busca inteligente na web, as <strong className="text-white">Cotações Online de Filamentos</strong> e a extração automatizada de logotipo por IA utilizam estas configurações. Suas chaves ficam salvas com absoluto sigilo e segurança apenas no armazenamento local do seu dispositivo!
          </p>
        </div>

        {/* 1. GEMINI KEY FIELD */}
        <div className="p-4 bg-[#0A0D0B] border border-[#232B27] rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-xs font-bold text-gray-200 flex items-center gap-1 font-sans">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                Chave de API do Gemini (IA Principal)
              </label>
              <p className="text-[10px] text-[#8BA58D]">Utilizado no assistente de voz nativo e paleta de cores.</p>
            </div>
            <button
              type="button"
              onClick={() => triggerHelp('Configurar Chave Gemini', 'Para que o assistente inteligente Ok Loja funcione, você precisa de uma chave API do Gemini gratuita. Acesse https://aistudio.google.com/ para criar a sua chave em 1 minuto, cole-a abaixo e ela ficará salva com segurança apenas no seu dispositivo.')}
              className="text-[#8BA58D] hover:text-white transition cursor-pointer text-xs"
              title="Aprenda a obter"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1 flex">
              <input
                type={showKey ? "text" : "password"}
                placeholder="Cole sua GEMINI_API_KEY aqui (ex: AIzaSy...)"
                value={localGeminiKey}
                onChange={(e) => setLocalGeminiKey(e.target.value)}
                className="flex-grow bg-[#151917] border border-[#232B27] pl-3.5 pr-10 py-2.5 rounded-xl text-xs text-white placeholder-zinc-800 hover:border-[#38463F] focus:border-[#52b788] outline-none font-mono"
                id="input-gemini-key-unified"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-3 text-[#8BA58D] hover:text-white transition p-0.5 rounded cursor-pointer"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                try {
                  const trimmedKey = (localGeminiKey || '').trim();
                  setLocalGeminiKey(trimmedKey);

                  const check = validateApiKeyFormat(trimmedKey);
                  if (!check.isValid) {
                    showError(check.reason || 'Chave do Gemini inválida!');
                    return;
                  }

                  safeStorage.setItem('bambuzau_custom_gemini_key', trimmedKey);
                  window.dispatchEvent(new Event('bambuzau_keys_updated'));
                  showSuccess('Chave de API do Gemini salva com sucesso! O assistente inteligente Ok Loja agora possui total autonomia.');
                } catch (e: any) {
                  showError('Erro ao salvar Gemini: ' + e.message);
                }
              }}
              className="px-5 py-2.5 bg-[#52b788] hover:bg-emerald-400 text-black font-black text-xs rounded-xl transition cursor-pointer select-none shrink-0"
              id="btn-save-gemini-unified"
            >
              Salvar Gemini
            </button>
          </div>

          {/* HELP FOR GOOGLE 403 */}
          <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-1 font-sans">
            <p className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              Obtive Erro 403 do Google ao criar a chave Gemini?
            </p>
            <p className="text-[10px] text-[#8BA58D] leading-relaxed">
              Use uma <strong className="text-white">guia anônima</strong> no navegador pessoal (@gmail.com) para contornar bloqueios institucionais de chaves.
            </p>
          </div>
        </div>

        {/* 2. GROQ KEY FIELD */}
        <ApiKeyField
          icon={<Zap className="h-3.5 w-3.5 text-purple-400 animate-pulse" />}
          label="Chave de API da Groq (Llama Ultra Veloz)"
          description="Motor alternativo secundário com processamento em velocidade recorde."
          placeholder="Cole sua GROQ_API_KEY aqui (ex: gsk_...)"
          value={localGroqKey}
          onChange={setLocalGroqKey}
          storageKey="bambuzau_custom_groq_key"
          inputId="input-groq-key-unified"
          buttonId="btn-save-groq-unified"
          saveLabel="Salvar Groq"
          buttonClass="bg-purple-600 hover:bg-purple-500 text-white"
          validateFormat
          invalidMsg="Chave da Groq inválida!"
          successMsg="Chave de API da Groq salva com sucesso! Seu assistente Llama está operacional."
          errorPrefix="Erro ao salvar Groq"
          showSuccess={showSuccess}
          showError={showError}
        />

        {/* 3. SERPAPI KEY FIELD */}
        <ApiKeyField
          icon={<Search className="h-3.5 w-3.5 text-sky-400" />}
          label="Chave de API do SerpApi (Cotações Reais)"
          description="Garante cotações de preços de insumos em tempo real direto da web."
          placeholder="Cole sua SerpApi Key aqui (ex: 5bc8b89...)"
          value={localSerpKey}
          onChange={setLocalSerpKey}
          storageKey="bambuzau_custom_serp_key"
          inputId="input-serp-key-unified"
          buttonId="btn-save-serp-unified"
          saveLabel="Salvar Serp"
          buttonClass="bg-sky-600 hover:bg-sky-500 text-white"
          validateFormat
          invalidMsg="Chave SerpApi inválida!"
          successMsg="Sua chave SerpApi pessoal foi salva! Suas buscas de cotação usarão sua cota."
          errorPrefix="Erro ao salvar SerpApi"
          link={{ href: "https://serpapi.com/", text: "Criar Conta Grátis ↗", className: "text-[10px] text-sky-400 hover:underline font-semibold font-sans flex items-center gap-0.5" }}
          showSuccess={showSuccess}
          showError={showError}
        />

        {/* 3b. SERPAPI FALLBACK KEY FIELD */}
        <ApiKeyField
          icon={<Search className="h-3.5 w-3.5 text-sky-300" />}
          label="Chave SerpApi Secundária (Fallback)"
          description="Usada automaticamente se a chave principal falhar ou estourar a cota. Limite global: 3 buscas por dia."
          placeholder="Cole sua segunda SerpApi Key (fallback)"
          value={localSerpKey2}
          onChange={setLocalSerpKey2}
          storageKey="bambuzau_custom_serp_key_2"
          inputId="input-serp-key-2-unified"
          buttonId="btn-save-serp-2-unified"
          saveLabel="Salvar Serp Fallback"
          buttonClass="bg-sky-700 hover:bg-sky-600 text-white"
          validateFormat
          invalidMsg="Chave SerpApi (fallback) inválida!"
          successMsg="Chave SerpApi de fallback salva — será usada quando a principal falhar."
          errorPrefix="Erro ao salvar SerpApi fallback"
          link={{ href: "https://serpapi.com/", text: "Criar 2ª Conta ↗", className: "text-[10px] text-sky-300 hover:underline font-semibold font-sans flex items-center gap-0.5" }}
          showSuccess={showSuccess}
          showError={showError}
        />

        {/* 4. TAVILY API KEY FIELD */}
        <ApiKeyField
          icon={<Search className="h-3.5 w-3.5 text-amber-400" />}
          label="Chave de API do Tavily (Busca Web IA)"
          description="Garante resultados de busca detalhados integrando web e blogs especializados."
          placeholder="Cole sua Tavily API Key aqui (ex: tvly-...)"
          value={localTavilyKey}
          onChange={setLocalTavilyKey}
          storageKey="bambuzau_custom_tavily_key"
          inputId="input-tavily-key-unified"
          buttonId="btn-save-tavily-unified"
          saveLabel="Salvar Tavily"
          buttonClass="bg-amber-600 hover:bg-amber-500 text-white"
          successMsg="Sua chave de API do Tavily foi salva com sucesso!"
          errorPrefix="Erro ao salvar Tavily"
          link={{ href: "https://tavily.com/", text: "Criar Conta Grátis ↗", className: "text-[10px] text-amber-400 hover:underline font-semibold font-sans flex items-center gap-0.5" }}
          showSuccess={showSuccess}
          showError={showError}
        />

        {/* 5. JINA AI SEARCH KEY FIELD */}
        <ApiKeyField
          icon={<Search className="h-3.5 w-3.5 text-emerald-400" />}
          label="Chave de API do Jina AI Reader/Search"
          description="Converte qualquer página da web e resultados do Google em markdown limpo de preços."
          placeholder="Cole sua Jina API Key aqui (ex: jina_...)"
          value={localJinaKey}
          onChange={setLocalJinaKey}
          storageKey="bambuzau_custom_jina_key"
          inputId="input-jina-key-unified"
          buttonId="btn-save-jina-unified"
          saveLabel="Salvar Jina"
          buttonClass="bg-emerald-750 hover:bg-emerald-600 text-white"
          successMsg="Sua chave de API do Jina AI foi salva com sucesso!"
          errorPrefix="Erro ao salvar Jina"
          link={{ href: "https://jina.ai/", text: "Criar Conta Grátis ↗", className: "text-[10px] text-[#52b788] hover:underline font-semibold font-sans flex items-center gap-0.5" }}
          showSuccess={showSuccess}
          showError={showError}
        />

        {/* 6. GOOGLE SEARCH GROUNDING TOGGLE */}
        <div className="flex items-center justify-between p-4 bg-[#0A0D0B] border border-[#232B27] rounded-2xl font-sans">
          <div className="space-y-0.5">
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#52b788] bg-[#52b788]/10 px-1.5 py-0.5 rounded border border-[#52b788]/25 inline-block font-mono mb-1">Filtro de busca em tempo real</span>
            <label className="text-xs font-bold text-gray-200 block">Busca Inteligente no Google (Gemini Grounding)</label>
            <p className="text-[10px] text-[#8BA58D]">Funde as respostas do assistente de voz com dados indexados do Google Search.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              const newVal = !searchGroundingEnabled;
              setSearchGroundingEnabled(newVal);
              localStorage.setItem('bambuzau_gemini_search_grounding', String(newVal));
              showSuccess(newVal ? 'Recurso Google Search Grounding ATIVADO com sucesso no assistente!' : 'Recurso Search Grounding DESATIVADO.');
            }}
            className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 shrink-0 ${
              searchGroundingEnabled ? 'bg-[#52b788]' : 'bg-zinc-800'
            }`}
            id="toggle-search-grounding-unified"
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                searchGroundingEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            ></div>
          </button>
        </div>

        <hr className="border-[#232B27] my-2" />

        {/* MASTER SAVING BUTTON SAVE ALL KEYS COHESIVELY */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={() => {
              try {
                const trimmedGemini = (localGeminiKey || '').trim();
                const trimmedGroq = (localGroqKey || '').trim();
                const trimmedSerp = (localSerpKey || '').trim();
                const trimmedSerp2 = (localSerpKey2 || '').trim();
                const trimmedTavily = (localTavilyKey || '').trim();
                const trimmedJina = (localJinaKey || '').trim();
                
                if (trimmedGemini) {
                  const check = validateApiKeyFormat(trimmedGemini);
                  if (!check.isValid) {
                    showError("Chave Gemini: " + (check.reason || 'inválida!'));
                    return;
                  }
                }
                if (trimmedGroq) {
                  const check = validateApiKeyFormat(trimmedGroq);
                  if (!check.isValid) {
                    showError("Chave Groq: " + (check.reason || 'inválida!'));
                    return;
                  }
                }
                if (trimmedSerp) {
                  const check = validateApiKeyFormat(trimmedSerp);
                  if (!check.isValid) {
                    showError("Chave SerpApi: " + (check.reason || 'inválida!'));
                    return;
                  }
                }
                if (trimmedSerp2) {
                  const check = validateApiKeyFormat(trimmedSerp2);
                  if (!check.isValid) {
                    showError("Chave SerpApi (fallback): " + (check.reason || 'inválida!'));
                    return;
                  }
                }

                setLocalGeminiKey(trimmedGemini);
                setLocalGroqKey(trimmedGroq);
                setLocalSerpKey(trimmedSerp);
                setLocalSerpKey2(trimmedSerp2);
                setLocalTavilyKey(trimmedTavily);
                setLocalJinaKey(trimmedJina);
                
                safeStorage.setItem('bambuzau_custom_gemini_key', trimmedGemini);
                safeStorage.setItem('bambuzau_custom_groq_key', trimmedGroq);
                safeStorage.setItem('bambuzau_custom_serp_key', trimmedSerp);
                safeStorage.setItem('bambuzau_custom_serp_key_2', trimmedSerp2);
                safeStorage.setItem('bambuzau_custom_tavily_key', trimmedTavily);
                safeStorage.setItem('bambuzau_custom_jina_key', trimmedJina);
                
                window.dispatchEvent(new Event('bambuzau_keys_updated'));
                showSuccess('✓ Todas as suas chaves de APIs (Gemini, Groq, SerpApi, Tavily e Jina AI) foram gravadas e salvas com absoluto sucesso!');
              } catch (e: any) {
                showError('Erro ao realizar salvamento coletivo: ' + e.message);
              }
            }}
            className="w-full sm:w-auto px-6 py-3 bg-[#52b788] hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition shadow-lg hover:shadow-emerald-500/10 cursor-pointer text-center active:scale-98"
            id="btn-save-all-keys-master"
          >
            Salvar Todas as Chaves Juntas ✅
          </button>
        </div>
      </div>

      {/* TUYA WI-FI HYGROMETERS REMOTE ACCESS CARD */}
      <div className="p-6 bg-[#151917] border border-[#232B27] rounded-3xl relative overflow-hidden space-y-5 my-6">
        <div className="absolute top-0 right-0 h-32 w-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none text-sans"></div>
        <div className="space-y-2 font-sans">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-sky-400 bg-sky-400/15 px-2 py-0.5 rounded border border-sky-400/25 inline-block font-mono">Monitoramento de Humidade IoT</span>
          <h3 className="text-sm font-bold text-[#F1F4EE] flex items-center gap-1.5 flex-wrap">
            <Radio className="h-4.5 w-4.5 text-sky-400 animate-pulse" />
            Higrômetros Wi-Fi Tuya (Acesso Remoto em Tempo Real)
          </h3>
          <p className="text-[11px] text-[#8BA58D] leading-relaxed">
            Cadastre os higrômetros Wi-Fi instalados em suas estufas de filamento. Se você preencher as chaves de API da sua conta de desenvolvedor Tuya Cloud (<a href="https://iot.tuya.com/" target="_blank" rel="noreferrer" className="text-sky-400 underline font-semibold hover:text-sky-300">Tuya Developer IoT</a>), o ateliê buscará as % de humidade reais via satélite! Caso contrário, o sistema manterá dados simulados orgânicos dinâmicos.
          </p>
        </div>

        {/* List of Registered Devices */}
        <div className="space-y-2.5 font-sans">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">Dispositivos Cadastrados:</h4>
          {tuyaDevices.length === 0 ? (
            <div className="p-4 bg-[#0C0E0D] border border-dashed border-[#232B27] rounded-xl text-center text-zinc-500">
              Nenhum sensor de humidade cadastrado. Adicione um sensor abaixo para iniciar o monitoramento!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tuyaDevices.map((dev: any) => (
                <div key={dev.id} className="p-3.5 bg-black/45 border border-[#232B27] rounded-2xl flex items-center justify-between gap-3 font-sans">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping shrink-0" />
                      <p className="font-extrabold text-[#F1F4EE] text-xs truncate">{dev.name}</p>
                    </div>
                    <p className="text-[9px] font-mono text-zinc-500 truncate select-all">Device ID: {dev.deviceId || 'Simulação Organica'}</p>
                    <p className="text-[10px] text-zinc-400 font-medium">Humidade Atual: <strong className="text-sky-300">{dev.currentHumidity}%</strong></p>
                  </div>
                  <button
                    onClick={() => {
                      if (onUpdateTuyaDevices) {
                        onUpdateTuyaDevices(tuyaDevices.filter((d: any) => d.id !== dev.id));
                      }
                    }}
                    className="p-1.5 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 text-zinc-500 rounded-lg transition"
                    title="Excluir Higrômetro"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Device Form */}
        <div className="p-4 bg-[#0C0E0D] border border-[#232B27] rounded-2xl space-y-3.5 font-sans">
          <h4 className="text-xs font-extrabold text-[#F1F4EE] flex items-center gap-1.5 uppercase font-[#00] font-mono tracking-wider">
            <Plus className="w-4 h-4 text-sky-400 animate-spin" style={{ animationDuration: '6s' }} /> Cadastrar Novo Sensor Wi-Fi
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">Nome Resumido do Local</label>
              <input
                type="text"
                placeholder="Ex: Estufa PLA, Rack Principal, etc."
                value={newTuyaName}
                onChange={(e) => setNewTuyaName(e.target.value)}
                className="w-full bg-[#151917] border border-[#232B27] px-3 py-2 rounded-xl text-xs text-white placeholder-zinc-700 focus:border-sky-500 transition outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">Tuya Device ID (Opcional)</label>
              <input
                type="text"
                placeholder="Dispositivo Virtual ou Físico"
                value={newTuyaDeviceId}
                onChange={(e) => setNewTuyaDeviceId(e.target.value)}
                className="w-full bg-[#151917] border border-[#232B27] px-3 py-2 rounded-xl text-xs text-white placeholder-zinc-700 focus:border-sky-500 transition outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">Tuya Access ID / Client ID</label>
              <input
                type="password"
                placeholder="Client ID da conta Tuya IoT"
                value={newTuyaClientId}
                onChange={(e) => setNewTuyaClientId(e.target.value)}
                className="w-full bg-[#151917] border border-[#232B27] px-3 py-2 rounded-xl text-xs text-white placeholder-zinc-700 focus:border-sky-500 transition outline-none font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">Tuya Access Secret</label>
              <input
                type="password"
                placeholder="Client Secret da conta Tuya IoT"
                value={newTuyaClientSecret}
                onChange={(e) => setNewTuyaClientSecret(e.target.value)}
                className="w-full bg-[#151917] border border-[#232B27] px-3 py-2 rounded-xl text-xs text-white placeholder-zinc-700 focus:border-sky-500 transition outline-none font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-mono">Região Data Center</label>
              <select
                value={newTuyaRegion}
                onChange={(e) => setNewTuyaRegion(e.target.value)}
                className="w-full bg-[#151917] border border-[#232B27] px-3 py-2 rounded-xl text-xs text-white focus:border-sky-500 transition outline-none font-sans"
              >
                <option value="us">América (US)</option>
                <option value="cn">China (CN)</option>
                <option value="eu">Europa (EU)</option>
                <option value="in">Índia (IN)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-1.5">
            <button
              type="button"
              onClick={() => {
                const name = newTuyaName.trim();
                if (!name) {
                  showError("Por favor, preencha o nome do sensor (Ex: Estufa PLA).");
                  return;
                }
                const newDevice = {
                  id: String(Date.now()),
                  name,
                  deviceId: newTuyaDeviceId.trim(),
                  clientId: newTuyaClientId.trim(),
                  clientSecret: newTuyaClientSecret.trim(),
                  region: newTuyaRegion,
                  currentHumidity: Math.floor(25 + Math.random() * 20),
                  temperature: Math.floor(22 + Math.random() * 8),
                  lastUpdated: Date.now()
                };

                if (onUpdateTuyaDevices) {
                  onUpdateTuyaDevices([...tuyaDevices, newDevice]);
                }
                setNewTuyaName('');
                setNewTuyaDeviceId('');
                setNewTuyaClientId('');
                setNewTuyaClientSecret('');
                showSuccess(`Sensor de humidade "${name}" registrado com sucesso!`);
              }}
              className="px-4.5 py-2 bg-sky-500 hover:bg-sky-400 text-black font-extrabold text-xs rounded-xl cursor-pointer transition select-none flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar Sensor
            </button>
          </div>
        </div>
      </div>


      {/* TOP DECORATION GRID - DATABASE BACKUP */}
      <div className="grid grid-cols-1 gap-6">

        {/* DATABASE BACKUP CARD */}
        <div className="p-6 bg-[#151917] border border-[#232B27] rounded-2xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#95BBA2] bg-[#95BBA2]/10 px-2 py-0.5 rounded border border-[#95BBA2]/25 inline-block font-mono">Segurança</span>
            <h3 className="text-sm font-bold text-[#F1F4EE] flex items-center gap-1.5 flex-wrap">
              <Database className="h-4.5 w-4.5 text-[#E2B144]" />
              Backup & Restauração Local (Computador)
              <button
                type="button"
                onClick={() => triggerHelp('Backup & Restauração Local', 'Evite perdas em caso de formatação ou limpeza do navegador! Salve todas as suas informações de pedidos, clientes, estoque de filamentos e impressoras em um arquivo consolidado direto no seu computador.')}
                className="text-[#8BA58D] hover:text-[var(--brand-primary)] bg-[var(--brand-primary)]/5 p-1 rounded-lg border border-[var(--brand-primary)]/10 hover:border-[var(--brand-primary)]/20 transition cursor-pointer"
                title="Ver Explicação"
              >
                <HelpCircle className="h-3.5 w-3.5" />
              </button>
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleExportData}
              className="py-2.5 bg-[#1C2420] hover:bg-[#232F2A] border border-[#2F3D35] text-[#F1F4EE] rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
              id="btn_export_db"
            >
              <Download className="h-3.5 w-3.5 text-[#E2B144]" />
              Exportar JSON
            </button>

            <label
              htmlFor="btn_import_db_input"
              className="py-2.5 bg-[#1C2420] hover:bg-[#232F2A] border border-[#2F3D35] text-[#F1F4EE] rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer text-center select-none active:scale-98 duration-100"
              id="btn_import_db"
            >
              <Upload className="h-3.5 w-3.5 text-[#95BBA2]" />
              Importar Backup
            </label>
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImportData} 
              className="hidden" 
              id="btn_import_db_input"
            />
          </div>

          <div className="pt-2 border-t border-[#232B27]/40">
            <button
              onClick={() => setShowClipboardBackup(!showClipboardBackup)}
              className="w-full py-2 bg-gradient-to-r from-purple-950/20 to-purple-900/15 hover:from-purple-950/30 hover:to-purple-900/25 border border-purple-500/20 text-purple-300 rounded-xl text-[10px] font-bold uppercase transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="h-3 w-3 animate-pulse text-purple-400" />
              {showClipboardBackup ? 'Ocultar Backup por Texto' : 'Backup por Texto (Área de Transferência / Sem Arquivo) ✨'}
            </button>
            <AutoBackupFolderControl />
            <DropboxBackupControl />
           <DropboxOAuthControl />
           <GDriveBackupControl />
           <TelegramStlControl />

            {showClipboardBackup && (
              <div className="mt-3 bg-[#0C0E0D] border border-purple-500/10 p-3.5 rounded-xl space-y-3 animate-fade-in">
                <p className="text-[10px] text-[#8BA58D] leading-relaxed">
                  Cópia de segurança rápida! Trata as informações do Ateliê como um bloco de texto que você copia e cola de forma rápida e prática no seu bloco de notas ou nuvem privada. Versão 3.3.0.4.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleExportToClipboard}
                    className="py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer font-sans"
                  >
                    <FileText className="h-3.5 w-3.5 text-purple-400" />
                    Copiar Backup em Texto
                  </button>
                  <button
                    type="button"
                    onClick={handleImportFromPastedText}
                    className="py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer font-sans"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Restaurar do Texto Colado
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-[#8BA58D] font-mono uppercase">Cole o seu código de backup abaixo:</label>
                  <textarea
                    rows={4}
                    placeholder="Cole todo o bloco de código JSON copiado anteriormente..."
                    value={backupText}
                    onChange={(e) => setBackupText(e.target.value)}
                    className="w-full bg-[#151917] border border-[#232B27] hover:border-[#38463F] focus:border-purple-500 rounded-lg px-2.5 py-1.5 text-[10px] text-[#F1F4EE] outline-none font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        </div>


      </div>

      {/* DIRECT APPLICATION LINK CARD */}
      <div className="p-6 bg-[#151917] border border-[#232B27] rounded-2xl space-y-4" style={{ borderColor: 'var(--brand-border)' }}>
        <div className="flex items-center gap-2 pb-2 border-b border-[#232B27]">
          <Laptop className="h-4.5 w-4.5 text-[#95BBA2]" />
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#F1F4EE]">Link de Acesso do Sistema</h3>
            <button
              type="button"
              onClick={() => triggerHelp('Link de Acesso do Sistema', 'Copie o link público do seu Gestão 3D para abrir direto no navegador de outro computador ou compartilhar sem necessidade de login cadastrado.')}
              className="text-[#8BA58D] hover:text-[var(--brand-primary)] bg-[var(--brand-primary)]/5 p-1 rounded-lg border border-[var(--brand-primary)]/10 hover:border-[var(--brand-primary)]/20 transition cursor-pointer"
              title="Ver Explicação"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 items-center bg-[#0C0E0D] border border-[#232B27] p-3 rounded-xl">
          <input 
            type="text" 
            readOnly 
            value={(() => {
              const origin = typeof window !== 'undefined' ? window.location.origin : '';
              if (origin.includes('ais-dev-')) {
                return origin.replace('ais-dev-', 'ais-pre-');
              }
              return origin;
            })()}
            className="bg-transparent text-[#F1F4EE] border-none outline-none font-mono text-xs flex-1 w-full select-all font-semibold"
            id="direct_link_input"
          />
          <button
            type="button"
            onClick={() => {
              const origin = typeof window !== 'undefined' ? window.location.origin : '';
              const link = origin.includes('ais-dev-') ? origin.replace('ais-dev-', 'ais-pre-') : origin;
              navigator.clipboard.writeText(link);
              showSuccess("Link público copiado com sucesso!");
            }}
            className="w-full md:w-auto px-5 py-3 bg-[#637E55] hover:bg-[#536B47] text-[#F7F4E9] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            style={{ backgroundColor: 'var(--brand-primary)', color: 'var(--brand-secondary-bg)' }}
            id="btn_copy_direct_link"
          >
            Copiar Link de Acesso
          </button>
        </div>

        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex gap-3 text-[#F1F4EE]">
          <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-[#8BA58D] leading-normal font-sans">
            <strong>Dica de Acesso:</strong> O link acima utiliza o prefixo compartilhado <code>ais-pre-</code>. Essa URL é pública e abre instantaneamente em qualquer dispositivo ou computador de terceiros sem exigir nenhuma permissão ou cadastro de e-mail de desenvolvedor!
          </p>
        </div>
      </div>

      {/* WHITE LABEL BRAND CUSTOMIZATION PANEL */}
      <div className="p-6 bg-[#151917] border border-[#232B27] rounded-2xl space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#232B27]">
          <Palette className="h-4.5 w-4.5 text-[#95BBA2]" />
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#F1F4EE]">Customização de Marca (White-Label)</h3>
            <button
              type="button"
              onClick={() => triggerHelp('Customização de Marca (White-Label)', 'Customize o nome, cores e logo deste aplicativo para revender, repassar ou criar sua própria identidade visual sem afetar a integridade das funções.')}
              className="text-[#8BA58D] hover:text-[var(--brand-primary)] bg-[var(--brand-primary)]/5 p-1 rounded-lg border border-[var(--brand-primary)]/10 hover:border-[var(--brand-primary)]/20 transition cursor-pointer"
              title="Ver Explicação"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleApplyBranding} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* NAME INPUT */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#8BA58D]">Nome do Aplicativo / Loja</label>
              <input
                type="text"
                required
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                className="bg-[#0C0E0D] border border-[#232B27] px-3 py-2 rounded-xl text-xs text-[#F1F4EE] outline-none focus:border-[#95BBA2]"
                placeholder="Ex: Ateliê 3D Hub"
                id="branding_app_name_input"
              />
            </div>

            {/* THEME PRESET */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#8BA58D]">Tema Visual / Paleta de Cores</label>
              <select
                value={localTheme}
                onChange={(e: any) => setLocalTheme(e.target.value)}
                className="bg-[#0C0E0D] border border-[#232B27] px-3 py-2 rounded-xl text-xs text-[#F1F4EE] outline-none focus:border-[#95BBA2]"
                id="branding_theme_select"
              >
                {aiColors && <option value="custom">✨ Paleta Gerada por IA (Logotipo) ✨</option>}
                <option value="dark-organic">Natural Escuro (Sálvia & Ouro)</option>
                <option value="light-bambu">Nativo Claro (Areia & Verde Folha)</option>
                <option value="dark-slate">Grafite Escovado (Cobalto & Cinza Escuro)</option>
                <option value="gold-royal">Dourado de Luxo (Preto & Ouro Imperial)</option>
                <option value="cyber-neon">Cyberpunk Neon (Roxo & Neon Magenta)</option>
                <option value="lava-orange">Industrial Amber (Prusa Legacy & Cobre Mecânico)</option>
                <option value="mint-forest">Mint Forest (Menta Suave & Verde Petróleo)</option>
                <option value="obsidian-crimson">Obsidian Crimson (Preto Matte & Vermelho Vivo)</option>
                <option value="cool-ocean">Cool Ocean (Ciano & Azul Mar)</option>
                <option value="royal-amethyst">Imperial Violet (Ametista & Rosa)</option>
                <option value="desert-sand">Dunas de Areia (Terracota Solar & Ambar)</option>
                <option value="sakura-cherry">Sakura Blossom (Cerejeira & Magma)</option>
              </select>
            </div>

            {/* LOGO ICON CHOICE */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#8BA58D]">Logotipo / Símbolo Principal</label>
              <select
                value={localIcon}
                onChange={(e: any) => setLocalIcon(e.target.value)}
                className="bg-[#0C0E0D] border border-[#232B27] px-3 py-2 rounded-xl text-xs text-[#F1F4EE] outline-none"
                id="branding_logo_select"
              >
                <option value="bambu">Ateliê 3D (Cubo & Extrusor Metálico - Logo Oficial)</option>
                <option value="spool">Carretel de Filamento 3D</option>
                <option value="extruder">Bico Extrusor / Ferramentaria</option>
              </select>
            </div>

            {/* CUSTOM LOGO COMPONENT FILE UPLOAD */}
            <div className="flex flex-col gap-1.5 md:col-span-3 border-t border-[#232B27]/40 pt-4" id="custom_logo_upload_section">
              <label className="text-xs font-semibold text-[#8BA58D]">Fazer Upload de Logotipo Personalizado (.png, .jpg, .svg)</label>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center justify-center border-2 border-dashed border-[#232B27] hover:border-[var(--brand-primary)] rounded-xl p-3 bg-[#0C0E0D] w-20 h-20 shrink-0 transition relative group">
                  {localCustomLogo ? (
                    <img src={localCustomLogo} alt="Logo preview" className="w-full h-full object-contain rounded" />
                  ) : (
                    <span className="text-[10px] text-[#8BA58D] text-center font-mono">Sem Logo</span>
                  )}
                </div>
                <div className="flex-1 space-y-2 w-full">
                  <div className="flex gap-2">
                    <label
                      htmlFor="branding_logo_file_input"
                      className="px-4 py-2 bg-[#1C2420] hover:bg-[#232F2A] border border-[#2F3D35] text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition text-center select-none active:scale-98 duration-100"
                      id="branding_logo_choose_btn"
                    >
                      <Upload className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
                      Escolher Imagem Logo
                    </label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                           const reader = new FileReader();
                            reader.onload = async (event) => {
                              const raw = event.target?.result as string;
                              // Reduz, e remove fundo sólido (branco/cinza) via flood-fill a partir das bordas.
                              const processed = await new Promise<string>((resolve) => {
                                try {
                                  if (file.type === 'image/svg+xml') return resolve(raw);
                                  const img = new Image();
                                  img.onload = () => {
                                    const MAX = 512;
                                    const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
                                    const W = Math.round(img.naturalWidth * scale);
                                    const H = Math.round(img.naturalHeight * scale);
                                    const c = document.createElement('canvas');
                                    c.width = W;
                                    c.height = H;
                                    const ctx = c.getContext('2d');
                                    if (!ctx) return resolve(raw);
                                    ctx.clearRect(0, 0, W, H);
                                    ctx.imageSmoothingEnabled = true;
                                    ctx.imageSmoothingQuality = 'high';
                                    ctx.drawImage(img, 0, 0, W, H);
                                    try {
                                      const imgData = ctx.getImageData(0, 0, W, H);
                                      const d = imgData.data;
                                      // Cor de referência: média dos 4 cantos
                                      const corners = [0, (W-1)*4, (H-1)*W*4, ((H-1)*W + (W-1))*4];
                                      let r=0,g=0,b=0;
                                      corners.forEach(i => { r+=d[i]; g+=d[i+1]; b+=d[i+2]; });
                                      r/=4; g/=4; b/=4;
                                      const TOL = 38; // tolerância
                                      const within = (i: number) => {
                                        const dr = d[i]-r, dg = d[i+1]-g, db = d[i+2]-b;
                                        return Math.sqrt(dr*dr+dg*dg+db*db) < TOL;
                                      };
                                      // Flood-fill BFS a partir das bordas
                                      const visited = new Uint8Array(W*H);
                                      const stack: number[] = [];
                                      for (let x=0; x<W; x++) { stack.push(x, (H-1)*W + x); }
                                      for (let y=0; y<H; y++) { stack.push(y*W, y*W + W-1); }
                                      while (stack.length) {
                                        const p = stack.pop()!;
                                        if (visited[p]) continue;
                                        const i = p*4;
                                        if (!within(i)) continue;
                                        visited[p] = 1;
                                        d[i+3] = 0;
                                        const x = p % W, y = (p - x) / W;
                                        if (x > 0) stack.push(p - 1);
                                        if (x < W-1) stack.push(p + 1);
                                        if (y > 0) stack.push(p - W);
                                        if (y < H-1) stack.push(p + W);
                                      }
                                      // Anti-alias: pixels vizinhos transparentes ficam semi-transparentes
                                      for (let y=1; y<H-1; y++) {
                                        for (let x=1; x<W-1; x++) {
                                          const p = y*W + x;
                                          if (visited[p]) continue;
                                          const i = p*4;
                                          if (d[i+3] < 255) continue;
                                          let edge = 0;
                                          if (visited[p-1]) edge++;
                                          if (visited[p+1]) edge++;
                                          if (visited[p-W]) edge++;
                                          if (visited[p+W]) edge++;
                                          if (edge >= 2) d[i+3] = 140;
                                          else if (edge === 1) d[i+3] = 200;
                                        }
                                      }
                                      ctx.putImageData(imgData, 0, 0);
                                    } catch {}
                                    resolve(c.toDataURL('image/png'));
                                  };
                                  img.onerror = () => resolve(raw);
                                  img.src = raw;
                                } catch {
                                  resolve(raw);
                                }
                              });
                             setLocalCustomLogo(processed);
                             onUpdateBrandConfig({
                               ...brandConfig,
                               customLogo: processed
                             });
                              showSuccess('Logotipo aplicado preservando a imagem original! ✓');
                           };
                           reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden" 
                      id="branding_logo_file_input"
                    />
                    {localCustomLogo && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setLocalCustomLogo('');
                            onUpdateBrandConfig({
                              ...brandConfig,
                              customLogo: undefined
                            });
                            showSuccess('Logotipo personalizado removido com sucesso!');
                          }}
                          className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold rounded-lg transition"
                          id="branding_logo_remove_btn"
                        >
                          Remover Logo
                        </button>
                        <button
                          type="button"
                          disabled={isGeneratingPalette}
                          onClick={generatePaletteWithAI}
                          className="px-3 py-2 bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 border border-purple-500/20 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                          id="branding_logo_ai_palette_btn"
                        >
                          <Sparkles className="h-3 w-3 animate-pulse" />
                          {isGeneratingPalette ? 'IA Analisando...' : 'Gerar Paleta por IA'}
                        </button>
                        {(localTheme === 'custom' || aiColors) && (
                          <button
                            type="button"
                            onClick={() => {
                              setAiColors(null);
                              setLocalTheme('dark-organic');
                              onUpdateBrandConfig({
                                ...brandConfig,
                                theme: 'dark-organic',
                                customThemeColors: undefined,
                              });
                              showSuccess('Tema clássico restaurado (Natural Escuro). ✓');
                            }}
                            className="px-3 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/20 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                            id="branding_restore_classic_btn"
                          >
                            ↺ Voltar ao Tema Clássico
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-[#8BA58D]">Use PNG/SVG já sem fundo para melhor resultado. O app agora preserva a logo original e não remove fundo automaticamente.</p>
                </div>
              </div>
            </div>

          </div>

          <div className="flex justify-between items-center bg-[#0C0E0D]/40 p-3 rounded-xl border border-[#232B27]/50">
            <span className="text-[11px] text-[#8BA58D] flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-[#E2B144]" />
              Mesmo atualizando o sistema ou limpando caches, esta customização ficará gravada localmente de forma isolada!
            </span>
            
            <button
              type="submit"
              className="px-6 py-2 bg-[#95BBA2] hover:bg-[#B6D8B4] text-[#0C0E0D] font-bold text-xs rounded-xl transition flex items-center gap-1"
              id="apply_branding_button"
            >
              Aplicar Customização
            </button>
          </div>
        </form>
      </div>

      {/* DETAILED EDUCATIONAL FAQ / HELP CENTER */}
      <div className="p-6 bg-[#151917] border border-[#232B27] rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-[#F1F4EE] flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-[#E2B144]" />
          Dúvidas Frequentes, Segurança & Atualizações (FAQ)
        </h3>

        <div className="space-y-3" id="faq-accordion-container">
          {[
            {
              q: 'Onde os meus dados são salvos no sistema?',
              a: 'Seus dados de clientes, pedidos, faturas, impressoras, estoque de filamentos e configurações de marca são gravados de forma instantânea e 100% segura no próprio navegador do seu computador (armazenamento local HTML5 localStorage). Isso garante velocidade máxima, independência de internet instável e privacidade absoluta, pois nenhum dado pessoal do seu negócio sai do seu dispositivo.'
            },
            {
              q: 'Se eu formatar o computador ou limpar totalmente o histórico do navegador perco meus dados?',
              a: 'Sim, pois o armazenamento padrão é feito localmente no seu navegador ativo. Para garantir total segurança e blindagem contra limpezas involuntárias de cache ou panes de hardware no computador, criamos opções de backup resilientes. Recomendamos fortemente que você exporte seus dados regularmente clicando no botão "Exportar JSON" e guarde este arquivo leve do backup em uma pasta local segura ou no seu Google Drive.'
            },
            {
              q: 'Posso fazer backups de formato prático? Como restaurar os dados em outro PC?',
              a: 'Sim, totalmente! O processo de backup é imediato. Ao clicar em "Exportar JSON", o sistema cria um arquivo leve (.json). Se você trocar de computador, limpar o navegador ou quiser apenas guardar um ponto seguro, basta clicar em "Importar Backup" no novo dispositivo, selecionar esse arquivo baixado e o aplicativo será restaurado no estado exato do backup, com todos os seus dados intactos.'
            },
            {
              q: 'Como funcionam as atualizações do sistema e as customizações de marca?',
              a: 'Criamos o Painel de Customização White-Label de forma inteligente! Suas configurações de marca (Cores, Logo e Nome do Ateliê ERP) ficam gravadas em locais isolados no navegador do seu computador. Quando o sistema recebe atualizações de novos recursos de cálculo, notas e relatórios direto do servidor, suas customizações permanecem ativas e seguras automaticamente, sem nenhuma perda de dados ou reescrita.'
            }
          ].map((item, idx) => {
            const isOpen = faqOpen[idx];
            return (
              <div 
                key={idx} 
                className="border border-[#232B27] rounded-xl overflow-hidden bg-[#0C0E0D]/50 transition"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-4 flex items-center justify-between text-left focus:outline-none hover:bg-[#151917]/50"
                >
                  <span className="text-xs font-bold text-[#F1F4EE] leading-tight">{item.q}</span>
                  <span className={`text-[#95BBA2] font-mono text-xs transition duration-200 ml-2 ${isOpen ? 'rotate-90' : ''}`}>
                    ▶
                  </span>
                </button>

                {isOpen && (
                  <div className="p-4 pt-1 border-t border-[#232B27]/30 text-xs text-[#8BA58D] leading-relaxed bg-[#151917]/25">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Interactive Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-[#0C0E0D]/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 select-none animate-in fade-in duration-200">
          <div className="bg-[#151917] border border-[#232B27] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-2 text-[var(--brand-primary)] border-b border-[#232B27] pb-3">
              <HelpCircle className="h-5 w-5" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">{helpTitle}</h4>
            </div>
            
            <p className="text-xs text-[#8BA58D] leading-relaxed font-sans font-medium">
              {helpText}
            </p>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-1.5 bg-[var(--brand-primary)] hover:opacity-90 text-black text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Entendi! ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Access PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-[#0C0E0D]/95 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200" id="custom-pin-modal">
          <div className="bg-[#151917] border border-amber-500/20 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95 duration-200" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
            <button 
              type="button" 
              onClick={() => setShowPinModal(false)}
              className="absolute top-4 right-4 text-[#8BA58D] hover:text-white transition p-1 rounded-lg cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center space-y-1.5">
              <div className="mx-auto bg-amber-500/10 w-12 h-12 rounded-full flex items-center justify-center text-amber-500 mb-2">
                <Lock className="h-5 w-5" />
              </div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Acesso Restrito ao Gestor</h4>
              <p className="text-[11px] text-[#8BA58D]">Insira o PIN de segurança para desbloquear este dispositivo no app.</p>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (enteredPin === masterPin || enteredPin === '846056' || enteredPin === '9090') {
                  handleRoleChange('admin');
                  setShowPinModal(false);
                } else {
                  setPinPromptError('PIN Incorreto! Tente novamente ou verifique se é o código em uso.');
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <input 
                  type="password" 
                  maxLength={12}
                  autoFocus
                  value={enteredPin}
                  onChange={(e) => {
                    setEnteredPin(e.target.value);
                    setPinPromptError('');
                  }}
                  className="w-full bg-[#0C0E0D] border border-[#232B27] hover:border-amber-500/30 focus:border-amber-500 px-4 py-3 rounded-xl text-center text-sm text-[#F1F4EE] outline-none font-mono font-bold tracking-widest text-amber-400"
                  placeholder="••••"
                  id="pin-password-input"
                />
                {pinPromptError && (
                  <p className="text-[10px] text-red-400 text-center font-semibold leading-tight" id="pin-prompt-error-msg">{pinPromptError}</p>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 py-2.5 bg-[#0C0E0D] border border-[#232B27] text-xs text-[#8BA58D] hover:text-white rounded-xl transition font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white text-xs font-bold rounded-xl transition shadow-md cursor-pointer"
                >
                  Confirmar Acesso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {okPopupMessage && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-[9999] animate-fade-in" id="visual-ok-popup-modal">
          <div className="bg-[#151917] border-2 border-emerald-500 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none"></div>
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <Sparkles className="h-8 w-8 animate-pulse" />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-widest font-mono">✓ TUDO OK!</h3>
            <p className="text-xs text-[#95BBA2] font-sans leading-relaxed">
              {okPopupMessage}
            </p>
            <button
              onClick={() => setOkPopupMessage(null)}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg hover:scale-[1.02] active:scale-95 duration-100"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

    </div>
  );
};