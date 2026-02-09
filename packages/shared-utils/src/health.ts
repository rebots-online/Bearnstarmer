import { AgentProvider } from './types';

export interface HealthCheckResult {
  provider: AgentProvider;
  isHealthy: boolean;
  error?: string;
  responseTime?: number;
}

/**
 * Check if a local provider service is running and accessible
 */
export const checkLocalProviderHealth = async (
  provider: AgentProvider,
  baseUrl: string | null
): Promise<HealthCheckResult> => {
  if (!baseUrl) {
    return {
      provider,
      isHealthy: false,
      error: 'Base URL not configured',
    };
  }

  const startTime = Date.now();
  
  try {
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        provider,
        isHealthy: true,
        responseTime,
      };
    } else {
      return {
        provider,
        isHealthy: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        responseTime,
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      provider,
      isHealthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime,
    };
  }
};

/**
 * Get health status for all local providers
 */
export const getLocalProvidersHealth = async (
  config: {
    ollamaBaseUrl?: string | null;
    lmstudioBaseUrl?: string | null;
    vllmBaseUrl?: string | null;
  }
): Promise<HealthCheckResult[]> => {
  const checks: Promise<HealthCheckResult>[] = [];

  if (config.ollamaBaseUrl) {
    checks.push(checkLocalProviderHealth('ollama', config.ollamaBaseUrl));
  }
  
  if (config.lmstudioBaseUrl) {
    checks.push(checkLocalProviderHealth('lmstudio', config.lmstudioBaseUrl));
  }
  
  if (config.vllmBaseUrl) {
    checks.push(checkLocalProviderHealth('vllm', config.vllmBaseUrl));
  }

  return Promise.all(checks);
};
