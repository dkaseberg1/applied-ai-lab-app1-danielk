export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export interface SalesRecord {
  id: string;
  quarter: Quarter;
  region: string;
  originalRegion?: string;
  channel: string;
  product: string;
  units: number;
  discount_pct: number; // e.g. 15 for 15%
  revenue: number;
}

export interface ProductDrilldown {
  product: string;
  q2Revenue: number;
  q3Revenue: number;
  revenueChange: number;
  percentChange: number;
  q2Units: number;
  q3Units: number;
  unitsChange: number;
  q2AvgDiscount: number;
  q3AvgDiscount: number;
}

export interface ChannelDrilldown {
  channel: string;
  q2Revenue: number;
  q3Revenue: number;
  revenueChange: number;
  percentChange: number;
  q2Units: number;
  q3Units: number;
  unitsChange: number;
}

export interface RegionPivotRow {
  region: string;
  rawVariations?: string[];
  quarters: Record<Quarter, number>;
  quarterUnits: Record<Quarter, number>;
  totalRevenue: number;
  totalUnits: number;
  q2Revenue: number;
  q3Revenue: number;
  q2Units: number;
  q3Units: number;
  q2AvgDiscount: number;
  q3AvgDiscount: number;
  dollarChangeQ2toQ3: number;
  pctChangeQ2toQ3: number;
  absDollarChangeQ2toQ3: number;
  absPctChangeQ2toQ3: number;
  productBreakdown: ProductDrilldown[];
  channelBreakdown: ChannelDrilldown[];
  topProductDriver: ProductDrilldown | null;
  topChannelDriver: ChannelDrilldown | null;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  totalUnits: number;
  averageOrderValue: number;
  quarterTotals: Record<Quarter, number>;
  quarterUnits: Record<Quarter, number>;
  regionRows: RegionPivotRow[];
  allRegions: string[];
  allQuarters: Quarter[];
  mostChangedRegionDollar: RegionPivotRow | null;
  mostChangedRegionPct: RegionPivotRow | null;
  totalQ2Revenue: number;
  totalQ3Revenue: number;
  totalQ2Q3Delta: number;
  totalQ2Q3Pct: number;
  integratedRegionAliases?: Record<string, string[]>;
}

export interface AISummaryState {
  summary: string;
  sentenceCount: number;
  model: string;
  calculatedRegion: string;
  loading: boolean;
  error: string | null;
  lastCalculatedAt: number | null;
}

export type TargetColumn =
  | 'quarter'
  | 'region'
  | 'channel'
  | 'product'
  | 'units'
  | 'discount_pct'
  | 'revenue';

export interface ColumnMapping {
  quarter: string;
  region: string;
  channel: string;
  product: string;
  units: string;
  discount_pct: string;
  revenue: string;
}

export interface CSVDiagnosticInfo {
  fileName: string;
  fileSizeBytes: number;
  delimiter: string;
  rawHeaders: string[];
  sampleRows: Record<string, any>[];
  detectedMapping: Record<TargetColumn, string>;
  unmappedTargets: TargetColumn[];
  totalRawRows: number;
  validParsedRows: number;
  invalidRowReasons: Array<{ rowNumber: number; reason: string; sampleData: any }>;
  integratedRegionAliases?: Record<string, string[]>;
}

export interface CSVParseResult {
  records: SalesRecord[];
  errors: string[];
  warnings: string[];
  fileName: string;
  totalRows: number;
  validRows: number;
  diagnostics?: CSVDiagnosticInfo;
}
