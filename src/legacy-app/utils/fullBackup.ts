import type { ModelRecord } from "@/lib/catalog-db";

export const GESTAO3D_BACKUP_SIGNATURE = "Gestao3D_Backup";
export const GESTAO3D_BACKUP_VERSION = "3.0.0.0.6";

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

export type CompleteBackup = Record<string, unknown> & {
  app_signature: string;
  version: string;
  backupFormat: "gestao3d-complete-vault-v1";
  timestamp: number;
  exportedAt: string;
  storage: StorageDump;
  localStorage: StorageDump;
  catalogVault: CatalogVaultBackup;
  integrity: {
    localStorageKeys: number;
    catalogModels: number;
    catalogFiles: number;
    missingCatalogFiles: number;
  };
};

export type RestoreSummary = {
  storageKeys: number;
  catalogModels: number;
  catalogFiles: number;
  missingCatalogFiles: number;
  hasCatalogBackup: boolean;
};

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

  return {
    app_signature: GESTAO3D_BACKUP_SIGNATURE,
    version: GESTAO3D_BACKUP_VERSION,
    backupFormat: "gestao3d-complete-vault-v1",
    timestamp: Date.now(),
    exportedAt: new Date().toISOString(),
    ...extraData,
    storage,
    localStorage: storage,
    catalogVault,
    catalog: {
      models,
      filesIncluded: files.length,
      missingFileModelIds,
    },
    integrity: {
      localStorageKeys: Object.keys(storage).length,
      catalogModels: models.length,
      catalogFiles: files.length,
      missingCatalogFiles: missingFileModelIds.length,
    },
  };
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
  const fullDump = readBackupStorage(json);
  const legacyDump = fullDump ? null : legacyStorageFromBackup(json);
  const storageDump = fullDump || legacyDump || {};
  const storageKeys = restoreLocalStorageFromDump(storageDump, Boolean(fullDump));

  const catalogSource = readCatalogSource(json);
  let catalogModels = 0;
  let catalogFiles = 0;
  let missingCatalogFiles = 0;

  if (catalogSource) {
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
    catalogModels,
    catalogFiles,
    missingCatalogFiles,
    hasCatalogBackup: Boolean(catalogSource),
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