import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ModelRecord } from "@/lib/catalog-db";
import { createCompleteBackup, isGestao3DBackup, restoreCompleteBackup } from "../fullBackup";

const modelsStore = new Map<string, ModelRecord>();
const filesStore = new Map<string, Blob>();

vi.mock("@/lib/catalog-db", () => ({
  listModels: vi.fn(async () => Array.from(modelsStore.values()).sort((a, b) => b.createdAt - a.createdAt)),
  getFile: vi.fn(async (id: string) => filesStore.get(id)),
  saveModel: vi.fn(async (record: ModelRecord, file?: Blob) => {
    modelsStore.set(record.id, record);
    if (file) filesStore.set(record.id, file);
  }),
  deleteModel: vi.fn(async (id: string) => {
    modelsStore.delete(id);
    filesStore.delete(id);
  }),
}));

const model = (id: string, fileName: string): ModelRecord => ({
  id,
  name: fileName.replace(/\.(stl|3mf)$/i, ""),
  fileName,
  fileType: fileName.toLowerCase().endsWith(".3mf") ? "3mf" : "stl",
  size: 13,
  hash: `hash-${id}`,
  category: "Decoração",
  tags: ["teste"],
  notes: "modelo de teste",
  unit: "mm",
  scale: 1,
  thumbnail: "data:image/png;base64,AA==",
  createdAt: 10,
  updatedAt: 20,
});

async function blobText(blob: Blob | undefined) {
  return blob ? await blob.text() : "";
}

describe("fullBackup", () => {
  beforeEach(() => {
    modelsStore.clear();
    filesStore.clear();
  });

  it("exports localStorage and STL/3MF blobs from IndexedDB catalog", async () => {
    localStorage.setItem("bambuzau_custom_serp_key", "serp-ok");
    localStorage.setItem("bambuzau_brand_config", JSON.stringify({ name: "Inova Mundo" }));
    localStorage.setItem("bambuzau_open_product_form_pending", "1");
    const stl = model("m1", "peca.stl");
    const threemf = model("m2", "kit.3mf");
    modelsStore.set(stl.id, stl);
    modelsStore.set(threemf.id, threemf);
    filesStore.set(stl.id, new Blob(["solid test-stl"], { type: "model/stl" }));
    filesStore.set(threemf.id, new Blob(["3mf-test"], { type: "model/3mf" }));

    const backup = await createCompleteBackup({ clients: [{ id: "c1" }] });

    expect(backup.app_signature).toBe("Gestao3D_Backup");
    expect(backup.storage.bambuzau_custom_serp_key).toBe("serp-ok");
    expect(backup.storage.bambuzau_brand_config).toContain("Inova Mundo");
    expect(backup.storage.bambuzau_open_product_form_pending).toBeUndefined();
    expect(backup.catalogVault.models).toHaveLength(2);
    expect(backup.catalogVault.files).toHaveLength(2);
    expect(backup.integrity.catalogFiles).toBe(2);
    expect(backup.catalogVault.files[0].dataBase64.length).toBeGreaterThan(0);
  });

  it("restores a complete backup: keys, logo/brand and STL/3MF files", async () => {
    localStorage.setItem("bambuzau_custom_serp_key", "serp-original");
    const stl = model("m1", "restaurada.stl");
    modelsStore.set("old", model("old", "old.stl"));
    filesStore.set("old", new Blob(["old-file"]));

    const backup = {
      app_signature: "Gestao3D_Backup",
      storage: {
        bambuzau_custom_serp_key: "serp-restored",
        bambuzau_brand_config: JSON.stringify({ name: "Inova Mundo", customLogo: "data:image/png;base64,abc" }),
      },
      catalogVault: {
        dbName: "imprimetrics-catalog",
        format: "indexeddb-catalog-v1",
        models: [stl],
        files: [
          {
            modelId: stl.id,
            fileName: stl.fileName,
            mimeType: "model/stl",
            dataBase64: btoa("solid restored"),
          },
        ],
      },
    };

    const summary = await restoreCompleteBackup(backup);

    expect(summary).toMatchObject({ storageKeys: 2, catalogModels: 1, catalogFiles: 1, hasCatalogBackup: true });
    expect(localStorage.getItem("bambuzau_custom_serp_key")).toBe("serp-restored");
    expect(localStorage.getItem("bambuzau_brand_config")).toContain("Inova Mundo");
    expect(modelsStore.has("old")).toBe(false);
    expect(modelsStore.get(stl.id)?.fileName).toBe("restaurada.stl");
    expect(await blobText(filesStore.get(stl.id))).toBe("solid restored");
  });

  it("still accepts older gestao3d backups, but identifies they have no STL files", async () => {
    const oldBackup = {
      app_signature: "Gestao3D_Backup",
      clients: [{ id: "1" }],
      catalogItems: [{ id: "p1", name: "Produto" }],
    };

    expect(isGestao3DBackup(oldBackup)).toBe(true);
    const summary = await restoreCompleteBackup(oldBackup);

    expect(summary.hasCatalogBackup).toBe(false);
    expect(localStorage.getItem("bambuzau_clients")).toContain("1");
    expect(localStorage.getItem("bambuzau_local_catalog_production")).toContain("Produto");
  });
});