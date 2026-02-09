import { AgentProfile } from '../types/panels';
import { getLocalProvidersHealth, HealthCheckResult } from '@shared-utils';
import { loadEnvConfig } from '@shared-utils';

// Cache health status to avoid excessive checks
let healthCache: Map<string, { status: 'online' | 'offline'; lastCheck: number }> = new Map();
const HEALTH_CACHE_TTL = 30000; // 30 seconds

export const AGENT_PROFILES: AgentProfile[] = [
  {
    id: 'zai-glm4.6v',
    name: 'z.ai GLM-4.6V',
    provider: 'zai',
    model: 'glm-4.6v',
    description: 'Default cloud model via z.ai. Free tier available for all users.',
    status: 'online',
    temperature: 0.5,
  },
  {
    id: 'ollama-local',
    name: 'Ollama (Local)',
    provider: 'ollama',
    model: 'llama3.1:8b',
    description: 'Local inference via Ollama. Requires local setup.',
    status: 'offline', // Will be updated by health check
    temperature: 0.7,
  },
  {
    id: 'lmstudio-local',
    name: 'LM Studio (Local)',
    provider: 'lmstudio',
    model: 'local-model',
    description: 'Local inference via LM Studio. Configure model in LM Studio app.',
    status: 'offline', // Will be updated by health check
    temperature: 0.7,
  },
  {
    id: 'vllm-local',
    name: 'vLLM (Local)',
    provider: 'vllm',
    model: 'vllm-model',
    description: 'High-performance local inference via vLLM server.',
    status: 'offline', // Will be updated by health check
    temperature: 0.7,
  },
  {
    id: 'openrouter-hosted',
    name: 'OpenRouter (Hosted)',
    provider: 'openrouter',
    model: 'openrouter/auto',
    description: 'Hosted API via OpenRouter. Supports multiple models with automatic routing.',
    status: 'online',
    temperature: 0.5,
  },
];

export const getAgentById = (id: string): AgentProfile | undefined =>
  AGENT_PROFILES.find((agent) => agent.id === id);

/**
 * Update the status of local providers based on health checks
 */
export const updateLocalProvidersStatus = async (): Promise<void> => {
  try {
    const config = await loadEnvConfig();
    const healthResults = await getLocalProvidersHealth(config);
    
    healthResults.forEach((result: HealthCheckResult) => {
      const agent = AGENT_PROFILES.find(a => a.provider === result.provider);
      if (agent && ['ollama', 'lmstudio', 'vllm'].includes(agent.provider)) {
        const now = Date.now();
        const cached = healthCache.get(agent.provider);
        
        // Use cached result if still valid
        if (cached && (now - cached.lastCheck) < HEALTH_CACHE_TTL) {
          agent.status = cached.status;
          return;
        }
        
        // Update status and cache
        agent.status = result.isHealthy ? 'online' : 'offline';
        healthCache.set(agent.provider, {
          status: agent.status,
          lastCheck: now,
        });
      }
    });
  } catch (error) {
    console.error('Failed to update local provider status:', error);
  }
};

/**
 * Get agents with real-time status for local providers
 */
export const getAgentProfilesWithStatus = async (): Promise<AgentProfile[]> => {
  await updateLocalProvidersStatus();
  return [...AGENT_PROFILES];
};
