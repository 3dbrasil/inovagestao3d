// @ts-nocheck
import { useEffect } from 'react';

const INTERVAL_MS = 6 * 60 * 60 * 1000; // 6h
const LAST_KEY = 'lov_auto_backup_last';
const HANDLE_DB = 'lov-backup-handle';
const HANDLE_STORE = 'handles';
const HANDLE_KEY = 'backupDir';
const DROPBOX_TOKEN_KEY = 'lov_dropbox_token';
const DROPBOX_FOLDER_KEY = 'lov_dropbox_folder';
const DBX_APP_KEY = 'lov_dropbox_app_key';
const DBX_REFRESH = 'lov_dropbox_refresh_token';
const DBX_ACCESS = 'lov_dropbox_access_token';
const DBX_EXPIRES = 'lov_dropbox_access_expires';
const GDRIVE_ENABLED_KEY = 'lov_gdrive_enabled';
const GDRIVE_FOLDER_KEY = 'lov_gdrive_folder';

export function getGDriveConfig() {
  try {
    return {
      enabled: localStorage.getItem(GDRIVE_ENABLED_KEY) === '1',
      folder: localStorage.getItem(GDRIVE_FOLDER_KEY) || 'Imprimetrics',
    };
  } catch { return { enabled: false, folder: 'Imprimetrics' }; }
}
export function setGDriveConfig(enabled: boolean, folder: string) {
  try {
    localStorage.setItem(GDRIVE_ENABLED_KEY, enabled ? '1' : '0');
    localStorage.setItem(GDRIVE_FOLDER_KEY, (folder || 'Imprimetrics').trim());
  } catch {}
}
async function uploadToGDrive(fileName: string, content: string): Promise<boolean> {
  const { enabled, folder } = getGDriveConfig();
  if (!enabled) return false;
  try {
    const { uploadBackupToGDrive } = await import('@/lib/gdrive-backup.functions');
    await uploadBackupToGDrive({ data: { fileName, content, folderName: folder } });
    return true;
  } catch (e) {
    console.warn('GDrive upload erro:', e);
    return false;
  }
}
export async function testGDrive(): Promise<{ ok: boolean; message: string }> {
  try {
    const { uploadBackupToGDrive } = await import('@/lib/gdrive-backup.functions');
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const r = await uploadBackupToGDrive({ data: { fileName: `imprimetrics-test-${ts}.json`, content: JSON.stringify({ ok: true, at: ts }), folderName: getGDriveConfig().folder } });
    return { ok: true, message: `Enviado: ${r.name}` };
  } catch (e: any) {
    return { ok: false, message: e?.message || String(e) };
  }
}

// --- Dropbox ---
export function getDropboxConfig(): { token: string; folder: string } {
  try {
    return {
      token: localStorage.getItem(DROPBOX_TOKEN_KEY) || '',
      folder: localStorage.getItem(DROPBOX_FOLDER_KEY) || '/Imprimetrics',
    };
  } catch { return { token: '', folder: '/Imprimetrics' }; }
}
export function setDropboxConfig(token: string, folder: string) {
  try {
    if (token) localStorage.setItem(DROPBOX_TOKEN_KEY, token.trim());
    else localStorage.removeItem(DROPBOX_TOKEN_KEY);
    localStorage.setItem(DROPBOX_FOLDER_KEY, (folder || '/Imprimetrics').trim());
  } catch {}
}

// --- Dropbox OAuth (refresh token) ---
export function getDropboxOAuth() {
  try {
    return {
      appKey: localStorage.getItem(DBX_APP_KEY) || '',
      refreshToken: localStorage.getItem(DBX_REFRESH) || '',
      accessToken: localStorage.getItem(DBX_ACCESS) || '',
      expiresAt: Number(localStorage.getItem(DBX_EXPIRES) || '0'),
    };
  } catch { return { appKey: '', refreshToken: '', accessToken: '', expiresAt: 0 }; }
}
export function setDropboxOAuthApp(appKey: string) {
  try {
    localStorage.setItem(DBX_APP_KEY, (appKey || '').trim());
  } catch {}
}
export async function buildDropboxAuthUrl(): Promise<string> {
  let { appKey } = getDropboxOAuth();
  if (!appKey) {
    try {
      const { getDropboxAppKey } = await import('@/lib/dropbox-oauth.functions');
      const r = await getDropboxAppKey();
      appKey = r.appKey || '';
      if (appKey) setDropboxOAuthApp(appKey);
    } catch {}
  }
  const params = new URLSearchParams({
    client_id: appKey,
    response_type: 'code',
    token_access_type: 'offline',
  });
  return `https://www.dropbox.com/oauth2/authorize?${params.toString()}`;
}
export async function exchangeDropboxCode(code: string): Promise<{ ok: boolean; message: string }> {
  if (!code) return { ok: false, message: 'Cole o código de autorização.' };
  try {
    const { exchangeDropboxCodeFn } = await import('@/lib/dropbox-oauth.functions');
    const data = await exchangeDropboxCodeFn({ data: { code: code.trim() } });
    const access = data.accessToken;
    const refresh = data.refreshToken;
    const expiresIn = Number(data.expiresIn || 14400);
    if (!access || !refresh) return { ok: false, message: 'Resposta inválida do Dropbox.' };
    localStorage.setItem(DBX_REFRESH, refresh);
    localStorage.setItem(DBX_ACCESS, access);
    localStorage.setItem(DBX_EXPIRES, String(Date.now() + (expiresIn - 60) * 1000));
    localStorage.setItem(DROPBOX_TOKEN_KEY, access);
    return { ok: true, message: 'Conectado! Token de renovação automática salvo.' };
  } catch (e: any) {
    return { ok: false, message: 'Erro: ' + (e?.message || String(e)) };
  }
}
export function disconnectDropboxOAuth() {
  try {
    localStorage.removeItem(DBX_REFRESH);
    localStorage.removeItem(DBX_ACCESS);
    localStorage.removeItem(DBX_EXPIRES);
  } catch {}
}
async function refreshDropboxAccess(): Promise<string | null> {
  const { refreshToken } = getDropboxOAuth();
  if (!refreshToken) return null;
  try {
    const { refreshDropboxAccessFn } = await import('@/lib/dropbox-oauth.functions');
    const data = await refreshDropboxAccessFn({ data: { refreshToken } });
    const access = data.accessToken;
    const expiresIn = Number(data.expiresIn || 14400);
    if (!access) return null;
    localStorage.setItem(DBX_ACCESS, access);
    localStorage.setItem(DBX_EXPIRES, String(Date.now() + (expiresIn - 60) * 1000));
    localStorage.setItem(DROPBOX_TOKEN_KEY, access);
    return access;
  } catch { return null; }
}
async function getActiveDropboxToken(): Promise<string> {
  const { token } = getDropboxConfig();
  const oauth = getDropboxOAuth();
  // Se temos refresh token, prioriza o fluxo OAuth (renovável)
  if (oauth.refreshToken) {
    if (oauth.accessToken && Date.now() < oauth.expiresAt) return oauth.accessToken;
    const refreshed = await refreshDropboxAccess();
    if (refreshed) return refreshed;
  }
  return token;
}

async function uploadToDropbox(fileName: string, content: string): Promise<boolean> {
  const token = await getActiveDropboxToken();
  const { folder } = getDropboxConfig();
  if (!token) return false;
  try {
    const path = `${folder.startsWith('/') ? folder : '/' + folder}/${fileName}`;
    const res = await fetch('https://content.dropboxapi.com/2/files/upload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          path,
          mode: 'overwrite',
          autorename: false,
          mute: true,
        }),
      },
      body: content,
    });
    if (!res.ok) {
      console.warn('Dropbox upload falhou:', res.status, await res.text().catch(() => ''));
      return false;
    }
    return true;
  } catch (e) {
    console.warn('Dropbox upload erro:', e);
    return false;
  }
}
export async function testDropbox(): Promise<{ ok: boolean; message: string }> {
  const token = await getActiveDropboxToken();
  if (!token) return { ok: false, message: 'Sem token configurado.' };
  try {
    const res = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { ok: false, message: `Token inválido (${res.status}).` };
    const data = await res.json().catch(() => ({} as any));
    return { ok: true, message: `Conectado como ${data?.name?.display_name || data?.email || 'Dropbox'}.` };
  } catch (e: any) {
    return { ok: false, message: 'Erro de rede: ' + (e?.message || e) };
  }
}

// --- Persisted directory handle (File System Access API) ---
function idb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(HANDLE_DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(HANDLE_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function saveHandle(h: any) {
  const db = await idb();
  await new Promise((res, rej) => {
    const tx = db.transaction(HANDLE_STORE, 'readwrite');
    tx.objectStore(HANDLE_STORE).put(h, HANDLE_KEY);
    tx.oncomplete = () => res(null); tx.onerror = () => rej(tx.error);
  });
}
async function loadHandle(): Promise<any | null> {
  try {
    const db = await idb();
    return await new Promise((res, rej) => {
      const tx = db.transaction(HANDLE_STORE, 'readonly');
      const r = tx.objectStore(HANDLE_STORE).get(HANDLE_KEY);
      r.onsuccess = () => res(r.result || null); r.onerror = () => rej(r.error);
    });
  } catch { return null; }
}
async function clearHandle() {
  try {
    const db = await idb();
    await new Promise((res) => {
      const tx = db.transaction(HANDLE_STORE, 'readwrite');
      tx.objectStore(HANDLE_STORE).delete(HANDLE_KEY);
      tx.oncomplete = () => res(null);
    });
  } catch {}
}
async function ensurePermission(handle: any): Promise<boolean> {
  try {
    const opts = { mode: 'readwrite' as const };
    if ((await handle.queryPermission?.(opts)) === 'granted') return true;
    return (await handle.requestPermission?.(opts)) === 'granted';
  } catch { return false; }
}

export async function pickBackupFolder(): Promise<string | null> {
  // @ts-ignore
  if (typeof window === 'undefined' || !window.showDirectoryPicker) {
    alert('Seu navegador não suporta escolher pasta. Use Chrome ou Edge no desktop. O backup continuará indo para a pasta Downloads.');
    return null;
  }
  // @ts-ignore
  const handle = await window.showDirectoryPicker({ mode: 'readwrite', id: 'imprimetrics-backup' });
  await saveHandle(handle);
  return handle.name || 'pasta selecionada';
}

export async function getBackupFolderName(): Promise<string | null> {
  const h = await loadHandle();
  return h?.name || null;
}

export async function clearBackupFolder() {
  await clearHandle();
}

async function collectBackup() {
  const { createCompleteBackup } = await import('../utils/fullBackup');
  return createCompleteBackup({ autoBackup: true });
}

function downloadJson(obj: any, fileName: string) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function writeToFolder(handle: any, fileName: string, content: string): Promise<boolean> {
  try {
    if (!(await ensurePermission(handle))) return false;
    const fh = await handle.getFileHandle(fileName, { create: true });
    const w = await fh.createWritable();
    await w.write(content);
    await w.close();
    return true;
  } catch (e) {
    console.warn('Falha ao gravar backup na pasta escolhida, usando download:', e);
    return false;
  }
}

export async function runBackupNow() {
  const data = await collectBackup();
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `imprimetrics-backup-${ts}.json`;
  const json = JSON.stringify(data, null, 2);
  const handle = await loadHandle();
  let saved = false;
  if (handle) saved = await writeToFolder(handle, fileName, json);
  const dbxOk = await uploadToDropbox(fileName, json);
  const gdOk = await uploadToGDrive(fileName, json);
  if (!saved && !dbxOk && !gdOk) downloadJson(data, fileName);
  try { localStorage.setItem(LAST_KEY, String(Date.now())); } catch {}
}

export function useAutoBackup() {
  useEffect(() => {
    let timer: any;
    const tick = async () => {
      try {
        const last = Number(localStorage.getItem(LAST_KEY) || '0');
        if (!last || Date.now() - last >= INTERVAL_MS) {
          await runBackupNow();
        }
      } catch {}
    };
    // first check shortly after mount (avoids blocking initial render)
    const initial = setTimeout(tick, 30_000);
    timer = setInterval(tick, 15 * 60 * 1000); // re-check every 15min
    return () => { clearTimeout(initial); clearInterval(timer); };
  }, []);
}