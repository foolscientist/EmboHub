interface ModelTag {
  capabilities: string;
  action?: string;
  target_object?: string;
  language?: string;
  host_device?: string;
  scenario?: string;
}

interface ModelMetric {
  parameters?: number;
  quantatization?: string; // Assuming this is a type of quantization. Adjust accordingly.
  gpu_mempry_gb?: number; // Assuming gpu_mempry_gb is of type 'number'. Adjust as needed.
}

interface ModelInfo {
  architecture: string;
  framework: string;
  version: string;
  tags: { [key: string]: ModelTag }; // This will be a dictionary/map with string keys and values of type `ModelTag`.
  metrics: ModelMetric;
}

interface LegacyModelOut {
  id: number;
  name: string;
  slug: string;
  owner_id: number;
  description: string;
  tags: string;
  download_count: number;
}

export { ModelMetric, ModelInfo, ModelTag, LegacyModelOut };
