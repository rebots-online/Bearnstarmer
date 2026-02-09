// Re-export types from web app for shared-utils usage
export type AgentProvider = 'ollama' | 'lmstudio' | 'vllm' | 'openrouter' | 'zai';

export interface AgentProfile {
  id: string;
  name: string;
  provider: AgentProvider;
  model: string;
  description: string;
  status: 'online' | 'offline' | 'beta';
  temperature: number;
}
