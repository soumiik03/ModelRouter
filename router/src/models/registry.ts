export type QualityTier = 1 | 2 | 3 | 4 | 5;
export type LatencyBucket = 'fast' | 'medium' | 'slow';

export interface ModelConfig {
  id: string;              
  label: string;           
  costPerMInput: number;   
  costPerMOutput: number;  
  qualityTier: QualityTier;
  latencyBucket: LatencyBucket;
}

export const modelRegistry: ModelConfig[] = [
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    label: 'nemotron-3-ultra',
    costPerMInput: 0,
    costPerMOutput: 0,
    qualityTier: 5,
    latencyBucket: 'slow',
  },
  {
    id: 'nvidia/nemotron-3-super-120b-a12b:free',
    label: 'nemotron-3-super',
    costPerMInput: 0,
    costPerMOutput: 0,
    qualityTier: 3,
    latencyBucket: 'medium',
  },
  {
    id: 'openai/gpt-oss-20b:free',
    label: 'gpt-oss-20b',
    costPerMInput: 0,
    costPerMOutput: 0,
    qualityTier: 2,
    latencyBucket: 'fast',
  },
  {
    id: 'cohere/north-mini-code:free',
    label: 'north-mini-code',
    costPerMInput: 0,
    costPerMOutput: 0,
    qualityTier: 4,
    latencyBucket: 'medium',
  },
];

export function getModelById(id: string): ModelConfig | undefined {
  return modelRegistry.find((m) => m.id === id);
}