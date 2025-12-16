export interface LegacyModelOut {
  id: number;
  name: string;
  slug: string;
  owner_id: number;
  description: string;
  tags: string;
  download_count: number;
}

export interface ModelInfoMetric {
  parameters?: number;
  quantatization?: string;
  gpu_memory_gb?: number;
  storage_gb?: number;
}

export interface ModelInfo {
  id?: number;
  name: string;
  fullname: string;
  architecture: string;
  framework: string;
  version: string;
  description?: string;
  tags: Record<string, any>;
  metrics: ModelInfoMetric;
}

export type CompleteModelInfo = ModelInfo & {
  id: number;
};
