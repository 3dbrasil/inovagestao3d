import type { ModelRecord } from "@/lib/catalog-db";

export const GESTAO3D_BACKUP_SIGNATURE = "Gestao3D_Backup";
export const GESTAO3D_BACKUP_VERSION = "3.0.0.0.7";

type StorageDump = Record<string, string>;

type CatalogFileBackup = {
  modelId: string;
  fileName: string;
  mimeType: string;
  size: number;
  dataBase64: string;
};

type CatalogVaultBackup = {
  dbName: "imprimetrics-catalog";
  format: "indexeddb-catalog-v1";
  models: ModelRecord[];
  files: CatalogFileBackup[];
  missingFileModelIds: string[];
};

/** Dump genérico de QUALQUER banco IndexedDB do app (backup 100%). */
export type IdbStoreDump = {
  name: string;
  keyPath: string | string[] | null;
  autoIncrement: boolean;
  indexes: Array<{ name: string; keyPath: string | string[]; unique: boolean; multiEntry: boolean }>;
  records: Array<{ key?: unknown; value: unknown }>;
};

export type IdbDatabaseDump = {
  name: string;
  version: number;
  stores: IdbStoreDump[];
};

export type CompleteBackup = Record<string, unknown> & {
  app_signature: string;
  version: string;
  backupFormat: "gestao3d-complete-vault-v1";
  timestamp: number;
  exportedAt: string;
  storage: StorageDump;
  localStorage: StorageDump;
  sessionStorage: StorageDump;
  catalogVault: CatalogVaultBackup;
  indexedDbVault: IdbDatabaseDump[];
  integrity: {
    localStorageKeys: number;
    sessionStorageKeys: number;
    catalogModels: number;
    catalogFiles: number;
    missingCatalogFiles: number;
    indexedDbDatabases: number;
    indexedDbRecords: number;
    checksum?: string;
    checksumAlgo?: "sha-256";
  };
};

export type RestoreSummary = {
  storageKeys: number;
  sessionKeys: number;
  catalogModels: number;
  catalogFiles: number;
  missingCatalogFiles: number;
  hasCatalogBackup: boolean;
  databases: number;
  databaseRecords: number;
};

export class BackupIntegrityError extends Error {
  issues: string[];
  constructor(issues: string[]) {
    super(`Backup inválido: ${issues.join(" | ")}`);
    this.name = "BackupIntegrityError";
    this.issues = issues;
  }
}

const TRANSIENT_STORAGE_KEYS = new Set([
  "bambuzau_open_product_form_pending",
]);

const PRESERVE_ON_RESTORE_KEYS = new Set([
  "bambuzau_rollback_snapshot",
  "bambuzau_open_product_form_pending",
]);

const LEGACY_STORAGE_PAIRS: Array<[string, string]> = [
  ["bambuzau_clients", "clients"],
  ["bambuzau_printers", "printers"],
  ["bambuzau_orders", "orders"],
  ["bambuzau_filament", "filamentStocks"],
  ["bambuzau_expenses", "expenses"],
  ["bambuzau_shopping", "shoppingItems"],
  ["bambuzau_supplies", "suppliesStocks"],
  ["bambuzau_local_catalog_production", "catalogItems"],
  ["bambuzau_tuya_devices", "tuyaDevices"],
  ["bambuzau_brand_config", "brandConfig"],
];

function readAllLocalStorage(): StorageDump {
  const storageDump: StorageDump = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || TRANSIENT_STORAGE_KEYS.has(key)) continue;
      const value = localStorage.getItem(key);
      if (value !== null) storageDump[key] = value;
    }
  } catch (error) {
    console.warn("Falha ao ler localStorage para backup:", error);
  }
  return storageDump;
}

function readAllSessionStorage(): StorageDump {
  const dump: StorageDump = {};
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key) continue;
      const value = sessionStorage.getItem(key);
      if (value !== null) dump[key] = value;
    }
  } catch {
    /* sessão pode não existir (SSR) */
  }
  return dump;
}

/* ------------------------------------------------------------------ *
 * Backup genérico de TODOS os bancos IndexedDB
 * ------------------------------------------------------------------ */

// Bancos que guardam apenas handles nativos (não serializáveis) e caches
const SKIP_IDB_DATABASES = new Set(["lov-backup-handle"]);

async function encodeIdbValue(value: any): Promise<any> {
  if (value == null) return value;
  if (typeof Blob !== "undefined" && value instanceof Blob) {
    return { __type: "blob", mimeType: value.type || "application/octet-stream", size: value.size, dataBase64: arrayBufferToBase64(await value.arrayBuffer()) };
  }
  if (value instanceof ArrayBuffer) {
    return { __type: "arraybuffer", dataBase64: arrayBufferToBase64(value) };
  }
  if (ArrayBuffer.isView(value)) {
    const view = value as ArrayBufferView;
    const buffer = view.buffer as ArrayBuffer;
    return { __type: "arraybuffer", dataBase64: arrayBufferToBase64(buffer.slice(view.byteOffset, view.byteOffset + view.byteLength)) };
  }
  if (value instanceof Date) return { __type: "date", iso: value.toISOString() };
  if (Array.isArray(value)) return Promise.all(value.map(encodeIdbValue));
  if (typeof value === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) out[k] = await encodeIdbValue(v);
    return out;
  }
  return value;
}

function decodeIdbValue(value: any): any {
  if (value == null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(decodeIdbValue);
  if (value.__type === "blob") return base64ToBlob(value.dataBase64 || "", value.mimeType);
  if (value.__type === "arraybuffer") return base64ToBlob(value.dataBase64 || "", "application/octet-stream");
  if (value.__type === "date") return new Date(value.iso);
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(value)) out[k] = decodeIdbValue(v);
  return out;
}

function openRawDb(
  name: string,
  version?: number,
  upgrade?: (db: IDBDatabase, tx: IDBTransaction | null) => void,
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = version ? indexedDB.open(name, version) : indexedDB.open(name);
    if (upgrade) req.onupgradeneeded = () => upgrade(req.result, req.transaction);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error(`IndexedDB bloqueado: ${name}`));
  });
}

function reqToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function dumpAllIndexedDb(): Promise<IdbDatabaseDump[]> {
  const out: IdbDatabaseDump[] = [];
  try {
    if (typeof indexedDB === "undefined" || typeof (indexedDB as any).databases !== "function") return out;
    const list = (await (indexedDB as any).databases()) as Array<{ name?: string; version?: number }>;
    for (const info of list) {
      const name = info?.name;
      if (!name || SKIP_IDB_DATABASES.has(name)) continue;
      try {
        const db = await openRawDb(name);
        const storeNames = Array.from(db.objectStoreNames);
        const stores: IdbStoreDump[] = [];
        if (storeNames.length) {
          const tx = db.transaction(storeNames, "readonly");
          for (const storeName of storeNames) {
            const store = tx.objectStore(storeName);
            const keys = await reqToPromise(store.getAllKeys());
            const values = await reqToPromise(store.getAll());
            const records: IdbStoreDump["records"] = [];
            for (let i = 0; i < values.length; i++) {
              records.push({
                key: store.keyPath ? undefined : (keys[i] as unknown),
                value: await encodeIdbValue(values[i]),
              });
            }
            stores.push({
              name: storeName,
              keyPath: (store.keyPath as string | string[] | null) ?? null,
              autoIncrement: store.autoIncrement,
              indexes: Array.from(store.indexNames).map((idxName) => {
                const idx = store.index(idxName);
                return { name: idxName, keyPath: idx.keyPath as string | string[], unique: idx.unique, multiEntry: idx.multiEntry };
              }),
              records,
            });
          }
        }
        out.push({ name, version: db.version, stores });
        db.close();
      } catch (error) {
        console.warn("Falha ao incluir banco IndexedDB no backup:", name, error);
      }
    }
  } catch (error) {
    console.warn("Falha ao listar bancos IndexedDB:", error);
  }
  return out;
}

async function restoreIndexedDbDump(dumps: IdbDatabaseDump[]): Promise<{ databases: number; records: number }> {
  let databases = 0;
  let records = 0;
  for (const dump of dumps) {
    if (!dump?.name || SKIP_IDB_DATABASES.has(dump.name)) continue;
    try {
      await new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase(dump.name);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
        req.onblocked = () => resolve();
      });
      const db = await openRawDb(dump.name, Math.max(1, dump.version || 1), (raw, tx) => {
        for (const store of dump.stores) {
          const objectStore = raw.objectStoreNames.contains(store.name) && tx
            ? tx.objectStore(store.name)
            : raw.createObjectStore(store.name, {
                keyPath: (store.keyPath as any) ?? undefined,
                autoIncrement: Boolean(store.autoIncrement),
              });
          for (const idx of store.indexes || []) {
            if (!objectStore.indexNames.contains(idx.name)) {
              objectStore.createIndex(idx.name, idx.keyPath as any, { unique: idx.unique, multiEntry: idx.multiEntry });
            }
          }
        }
      });
      const storeNames = dump.stores.map((s) => s.name).filter((n) => db.objectStoreNames.contains(n));
      if (storeNames.length) {
        const tx = db.transaction(storeNames, "readwrite");
        for (const store of dump.stores) {
          if (!db.objectStoreNames.contains(store.name)) continue;
          const objectStore = tx.objectStore(store.name);
          for (const record of store.records || []) {
            try {
              const value = decodeIdbValue(record.value);
              if (store.keyPath) objectStore.put(value);
              else objectStore.put(value, record.key as IDBValidKey);
              records += 1;
            } catch (error) {
              console.warn("Falha ao restaurar registro IndexedDB:", dump.name, store.name, error);
            }
          }
        }
        await new Promise<void>((resolve) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
          tx.onabort = () => resolve();
        });
      }
      db.close();
      databases += 1;
    } catch (error) {
      console.warn("Falha ao restaurar banco IndexedDB:", dump.name, error);
    }
  }
  return { databases, records };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

/**
 * Canoniza o backup (ordena chaves) para gerar um checksum estável,
 * ignorando o próprio campo `integrity.checksum`.
 */
function canonicalStringify(value: any): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalStringify).join(",") + "]";
  const keys = Object.keys(value).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalStringify(value[k])).join(",") + "}";
}

async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const subtle = (globalThis.crypto as Crypto | undefined)?.subtle;
  if (subtle) {
    const digest = await subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Fallback (jsdom sem subtle): hash simples, ainda detecta corrupção
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < bytes.length; i++) {
    h1 = Math.imul(h1 ^ bytes[i], 2654435761);
    h2 = Math.imul(h2 ^ bytes[i], 1597334677);
  }
  return (h1 >>> 0).toString(16).padStart(8, "0") + (h2 >>> 0).toString(16).padStart(8, "0");
}

export async function computeBackupChecksum(backup: any): Promise<string> {
  const { integrity, ...rest } = backup || {};
  const integrityWithoutChecksum = integrity ? { ...integrity } : undefined;
  if (integrityWithoutChecksum) {
    delete (integrityWithoutChecksum as any).checksum;
    delete (integrityWithoutChecksum as any).checksumAlgo;
  }
  const payload = integrityWithoutChecksum ? { ...rest, integrity: integrityWithoutChecksum } : rest;
  return sha256Hex(canonicalStringify(payload));
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const chunkSize = 0x8000;
  const chunks: ArrayBuffer[] = [];
  for (let i = 0; i < binary.length; i += chunkSize) {
    const chunk = binary.slice(i, i + chunkSize);
    const bytes = new Uint8Array(chunk.length);
    for (let j = 0; j < chunk.length; j++) bytes[j] = chunk.charCodeAt(j);
    chunks.push(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  }
  return new Blob(chunks, { type: mimeType || "application/octet-stream" });
}

function readDataUrlPayload(dataUrl: string): { base64: string; mimeType: string } | null {
  const match = dataUrl.match(/^data:([^;,]+)?;base64,(.*)$/);
  if (!match) return null;
  return { mimeType: match[1] || "application/octet-stream", base64: match[2] || "" };
}

async function blobToCatalogFile(model: ModelRecord, blob: Blob): Promise<CatalogFileBackup> {
  return {
    modelId: model.id,
    fileName: model.fileName,
    mimeType: blob.type || (model.fileType === "stl" ? "model/stl" : "model/3mf"),
    size: blob.size,
    dataBase64: arrayBufferToBase64(await blob.arrayBuffer()),
  };
}

export async function createCompleteBackup(extraData: Record<string, unknown> = {}): Promise<CompleteBackup> {
  const storage = readAllLocalStorage();
  const session = readAllSessionStorage();
  const { listModels, getFile } = await import("@/lib/catalog-db");
  const models = await listModels();
  const files: CatalogFileBackup[] = [];
  const missingFileModelIds: string[] = [];

  for (const model of models) {
    try {
      const file = await getFile(model.id);
      if (file) {
        files.push(await blobToCatalogFile(model, file));
      } else {
        missingFileModelIds.push(model.id);
      }
    } catch (error) {
      console.warn("Falha ao incluir STL/3MF no backup:", model.fileName, error);
      missingFileModelIds.push(model.id);
    }
  }

  const catalogVault: CatalogVaultBackup = {
    dbName: "imprimetrics-catalog",
    format: "indexeddb-catalog-v1",
    models,
    files,
    missingFileModelIds,
  };

  const indexedDbVault = await dumpAllIndexedDb();
  const indexedDbRecords = indexedDbVault.reduce(
    (total, db) => total + db.stores.reduce((sum, store) => sum + (store.records?.length || 0), 0),
    0,
  );

  const backup: CompleteBackup = {
    app_signature: GESTAO3D_BACKUP_SIGNATURE,
    version: GESTAO3D_BACKUP_VERSION,
    backupFormat: "gestao3d-complete-vault-v1",
    timestamp: Date.now(),
    exportedAt: new Date().toISOString(),
    ...extraData,
    storage,
    localStorage: storage,
    sessionStorage: session,
    catalogVault,
    indexedDbVault,
    catalog: {
      models,
      filesIncluded: files.length,
      missingFileModelIds,
    },
    integrity: {
      localStorageKeys: Object.keys(storage).length,
      sessionStorageKeys: Object.keys(session).length,
      catalogModels: models.length,
      catalogFiles: files.length,
      missingCatalogFiles: missingFileModelIds.length,
      indexedDbDatabases: indexedDbVault.length,
      indexedDbRecords,
    },
  } as CompleteBackup;
  const checksum = await computeBackupChecksum(backup);
  backup.integrity.checksum = checksum;
  backup.integrity.checksumAlgo = "sha-256";
  return backup;
}

function readBackupStorage(json: any): StorageDump | null {
  if (json?.storage && typeof json.storage === "object") return json.storage as StorageDump;
  if (json?.localStorage && typeof json.localStorage === "object") return json.localStorage as StorageDump;
  return null;
}

function legacyStorageFromBackup(json: any): StorageDump {
  const dump: StorageDump = {};
  for (const [storageKey, jsonKey] of LEGACY_STORAGE_PAIRS) {
    const value = json?.[jsonKey];
    if (value !== undefined && value !== null) {
      dump[storageKey] = typeof value === "string" ? value : JSON.stringify(value);
    }
  }
  return dump;
}

function restoreLocalStorageFromDump(dump: StorageDump, fullReplace: boolean): number {
  const preserved: StorageDump = {};
  for (const key of PRESERVE_ON_RESTORE_KEYS) {
    try {
      const value = localStorage.getItem(key);
      if (value !== null) preserved[key] = value;
    } catch {}
  }

  if (fullReplace) {
    try { localStorage.clear(); } catch {}
  }

  let written = 0;
  for (const [key, value] of Object.entries(dump)) {
    try {
      localStorage.setItem(key, String(value));
      written += 1;
    } catch (error) {
      console.warn("Falha ao restaurar chave do backup:", key, error);
    }
  }

  for (const [key, value] of Object.entries(preserved)) {
    if (!(key in dump)) {
      try { localStorage.setItem(key, value); } catch {}
    }
  }

  return written;
}

function readCatalogSource(json: any): { models: ModelRecord[]; files: any[] } | null {
  const source = json?.catalogVault || json?.indexedDB?.["imprimetrics-catalog"] || json?.catalog;
  if (!source || !Array.isArray(source.models)) return null;
  return { models: source.models as ModelRecord[], files: Array.isArray(source.files) ? source.files : [] };
}

function fileBackupToBlob(file: any): Blob | undefined {
  if (!file) return undefined;
  if (typeof file.dataBase64 === "string") {
    return base64ToBlob(file.dataBase64, file.mimeType || file.type || "application/octet-stream");
  }
  if (typeof file.dataUrl === "string") {
    const parsed = readDataUrlPayload(file.dataUrl);
    if (parsed) return base64ToBlob(parsed.base64, file.mimeType || parsed.mimeType);
  }
  return undefined;
}

function findFileForModel(files: any[], model: ModelRecord): any | undefined {
  return files.find((file) =>
    file?.modelId === model.id ||
    file?.id === model.id ||
    file?.fileName === model.fileName ||
    file?.name === model.fileName
  );
}

export async function restoreCompleteBackup(json: any): Promise<RestoreSummary> {
  await validateBackupIntegrity(json);
  const fullDump = readBackupStorage(json);
  const legacyDump = fullDump ? null : legacyStorageFromBackup(json);
  const storageDump = fullDump || legacyDump || {};
  const storageKeys = restoreLocalStorageFromDump(storageDump, Boolean(fullDump));

  let sessionKeys = 0;
  if (json?.sessionStorage && typeof json.sessionStorage === "object") {
    for (const [key, value] of Object.entries(json.sessionStorage as StorageDump)) {
      try { sessionStorage.setItem(key, String(value)); sessionKeys += 1; } catch {}
    }
  }

  // Restaura TODOS os bancos IndexedDB do backup (catálogo, STLs, calibrações, etc.)
  let databases = 0;
  let databaseRecords = 0;
  const idbDumps: IdbDatabaseDump[] = Array.isArray(json?.indexedDbVault) ? json.indexedDbVault : [];
  if (idbDumps.length) {
    const r = await restoreIndexedDbDump(idbDumps);
    databases = r.databases;
    databaseRecords = r.records;
  }

  const catalogSource = readCatalogSource(json);
  let catalogModels = 0;
  let catalogFiles = 0;
  let missingCatalogFiles = 0;

  const catalogAlreadyRestored = idbDumps.some((d) => d?.name === "imprimetrics-catalog");
  if (catalogSource && catalogAlreadyRestored) {
    catalogModels = catalogSource.models.length;
    catalogFiles = catalogSource.files.length;
  }
  if (catalogSource && !catalogAlreadyRestored) {
    const { listModels, deleteModel, saveModel } = await import("@/lib/catalog-db");
    const existing = await listModels().catch(() => [] as ModelRecord[]);
    for (const model of existing) {
      try { await deleteModel(model.id); } catch (error) { console.warn("Falha ao limpar modelo antigo:", model.id, error); }
    }

    for (const model of catalogSource.models) {
      const fileBackup = findFileForModel(catalogSource.files, model);
      const blob = fileBackupToBlob(fileBackup);
      try {
        await saveModel(model, blob);
        catalogModels += 1;
        if (blob) catalogFiles += 1;
        else missingCatalogFiles += 1;
      } catch (error) {
        console.warn("Falha ao restaurar modelo do Vault:", model.fileName, error);
        missingCatalogFiles += 1;
      }
    }
  }

  return {
    storageKeys,
    sessionKeys,
    catalogModels,
    catalogFiles,
    missingCatalogFiles,
    hasCatalogBackup: Boolean(catalogSource),
    databases,
    databaseRecords,
  };
}

export function isGestao3DBackup(json: any): boolean {
  if (!json || typeof json !== "object") return false;
  return Boolean(
    json.app_signature === GESTAO3D_BACKUP_SIGNATURE ||
    json.app_signature === "Bambuzau3D_Backup" ||
    Array.isArray(json.clients) ||
    Array.isArray(json.orders) ||
    Array.isArray(json.printers) ||
    Array.isArray(json.filamentStocks) ||
    readBackupStorage(json) ||
    readCatalogSource(json)
  );
}

/**
 * Valida o backup ANTES de tocar em localStorage ou IndexedDB.
 * - Assinatura correta
 * - Estrutura mínima presente
 * - Cada arquivo do Vault com base64 decodável e tamanho coerente
 * - Checksum SHA-256 confere (quando presente)
 * Lança BackupIntegrityError com a lista de problemas.
 */
export async function validateBackupIntegrity(json: any): Promise<void> {
  const issues: string[] = [];
  if (!json || typeof json !== "object") {
    throw new BackupIntegrityError(["Arquivo não é um JSON de backup válido."]);
  }
  if (!isGestao3DBackup(json)) {
    issues.push("Assinatura do backup não reconhecida.");
  }

  const catalogSource = readCatalogSource(json);
  if (catalogSource) {
    if (!Array.isArray(catalogSource.models)) {
      issues.push("catalogVault.models ausente ou inválido.");
    }
    const seenIds = new Set<string>();
    for (const model of catalogSource.models || []) {
      if (!model?.id || !model?.fileName) {
        issues.push("Modelo do Vault sem id/fileName.");
        continue;
      }
      if (seenIds.has(model.id)) issues.push(`Modelo duplicado: ${model.id}`);
      seenIds.add(model.id);
    }
    for (const file of catalogSource.files || []) {
      if (!file) continue;
      const b64 = typeof file.dataBase64 === "string"
        ? file.dataBase64
        : (typeof file.dataUrl === "string" ? readDataUrlPayload(file.dataUrl)?.base64 : "");
      if (!b64) {
        issues.push(`Arquivo ${file.fileName || file.modelId || "?"} sem payload base64.`);
        continue;
      }
      try {
        const decoded = atob(b64);
        if (typeof file.size === "number" && file.size > 0 && Math.abs(decoded.length - file.size) > 4) {
          issues.push(`Arquivo ${file.fileName} com tamanho divergente (esperado ${file.size}, decodificado ${decoded.length}).`);
        }
      } catch {
        issues.push(`Arquivo ${file.fileName || file.modelId} com base64 corrompido.`);
      }
    }
  }

  const integrity = (json as any).integrity;
  if (integrity && typeof integrity.checksum === "string" && integrity.checksum.length > 0) {
    const expected = integrity.checksum as string;
    const actual = await computeBackupChecksum(json);
    if (expected !== actual) {
      issues.push("Checksum não confere — o arquivo foi editado ou corrompido após o backup.");
    }
  }

  if (issues.length > 0) throw new BackupIntegrityError(issues);
}