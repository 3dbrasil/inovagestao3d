// @ts-nocheck
export interface Client {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  cep?: string;
  city?: string;
  state?: string;
  note?: string;
  lastContactDate?: number;
  stockCount?: number;
  stockValue?: number;
  code?: string;
  productsStock?: ClientProductStock[];
  source?: 'PROSPECCAO' | 'INSTAGRAM' | 'FACEBOOK' | 'VISITANDO' | 'INDICACAO' | 'OUTROS';
  dealType?: 'CONSIGNADO' | 'COMPROU';
}

export interface ClientProductStock {
  name: string;
  qty: number;
  imageUrl?: string;
}

export interface Printer {
  id: number;
  name: string;
  model: string;
  status: 'IDLE' | 'PRINTING' | 'MAINTENANCE';
  ipAddress: string;
  lastWeeklyMaintenance: number;
  lastMonthlyMaintenance: number;
  imageUrl?: string;
  customUrl?: string;
  cameraUrl?: string;
  lightOn?: boolean;
  
  // Online Configuration properties
  apiType?: 'KLIPPER' | 'OCTOPRINT' | 'BAMBU_CLOUD' | 'NONE';
  apiKey?: string;
  port?: string;
  useWebSocket?: boolean;
  nozzleTemp?: number;
  bedTemp?: number;
  printProgress?: number;
  currentJob?: string;
  isOnline?: boolean;
}

export interface PrintOrder {
  id: number;
  clientId?: number | null;
  clientName: string;
  itemName: string;
  quantity: number;
  filamentType: string;
  filamentColor: string;
  weightGrams: number;
  printTimeHours: number;
  priceCharged: number;
  platformSource: 'MANUAL' | 'SHOPEE' | 'MERCADO_LIVRE' | 'NUVEMSHOP' | 'AMAZON' | 'TIKTOK_SHOP';
  platformOrderId?: string;
  status: 'WAITING' | 'QUEUE' | 'PRINTING' | 'POST_PROCESS' | 'READY' | 'DELIVERED';
  printingProgress: number; // 0.0 to 1.0
  assignedPrinterId?: number | null;
  printerName?: string;
  createdAt: number;
  deadline: number;
  paymentMethod?: 'CONSIGNADO' | 'CARTÃO' | 'DINHEIRO' | 'OUTROS';
  paymentStatus?: 'PAGO' | 'PENDENTE';
  imageUrl?: string;
}

export interface CatalogItem {
  id: number;
  name: string;
  description: string;
  weightGrams: number;
  printTimeHours: number;
  filamentType: string;
  defaultPrice: number;
  stockCount: number;
  minStockCount: number;
  productCode: string;
  filamentColorsUsed?: string;
  spentPartId?: number | null;
  spentPartQty?: number;
  hasSecondaryMaterial?: boolean;
  secondaryWeightGrams?: number;
  secondaryFilamentType?: string;
  secondaryFilamentColorsUsed?: string;
  imageUrl?: string;
  filamentsUsed?: { filamentStockId: number; weightGrams: number }[];
  suppliesUsed?: { supplyStockId: number; quantity: number }[];
  stlFileName?: string;
  stlFileData?: string;
  extraCostPerUnit?: number;
}

export interface FilamentStock {
  id: number;
  type: string; // PLA, PETG, ABS, TPU
  color: string;
  stockGrams: number;
  minStockGrams: number;
  priceRoll: number;
}

export interface SupplyStock {
  id: number;
  code?: string;
  name: string;
  stockCount: number;
  minStockCount: number;
  unitCost: number;
  imageUrl?: string;
}

export interface Expense {
  id: number;
  description: string;
  category: 'FILAMENTO' | 'EQUIPAMENTO' | 'ENERGIA' | 'EMBALAGEM' | 'FERRAMENTAS' | 'HARDWARE' | 'SERVICOS' | 'MARKETING' | 'IMPOSTOS' | 'OUTROS' | 'ACESSORIO_INSUMO';
  amount: number;
  qty: number;
  date: number;
  supplier?: string;
  month?: string;
}

export interface ShoppingItem {
  id: number;
  name: string;
  price: number;
  isChecked: boolean;
}

export interface FilamentOffer {
  storeName: string;
  filamentName: string;
  price: number;
  link: string;
  materialType: string;
  rating: number;
}

export interface PlatformConnection {
  platformName: string;
  storeName: string;
  token: string;
  isConnected: boolean;
}

export interface ExternalPlatformOrder {
  id: string;
  platform: 'MERCADO_LIVRE' | 'SHOPEE' | 'NUVEMSHOP' | 'AMAZON' | 'TIKTOK_SHOP' | 'BALCAO';
  itemName: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  weightGrams: number;
  printTimeHours: number;
  priceCharged: number;
  statusText: string;
  isImported?: boolean;
  createdAt?: number;
}

export interface AppAlert {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'OPPORTUNITY' | 'SHORTAGE';
  timestamp: number;
}

export interface MaterialProfile {
  type: string;
  filamentPriceRoll: number;
  printerPowerW: number;
  electricityCostKwh: number;
  laborCostHour: number;
  miscCostPercent: number;
  defaultProfitMarginPercent: number;
}