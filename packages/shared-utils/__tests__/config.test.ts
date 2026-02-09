import { describe, expect, it, vi } from 'vitest';

import { ConfigValidationError, loadEnvConfig } from '../src/config';

describe('loadEnvConfig', () => {
  it('returns defaults when no overrides are provided', async () => {
    const config = await loadEnvConfig({ envSource: {} });

    expect(config.environment).toBe('development');
    expect(config.backendUrl).toBe('http://localhost:8787');
    expect(config.realtimeSyncUrl).toBe('ws://localhost:8787/sync');
    expect(config.defaultAgentRole).toBe('facilitator');
    expect(config.telemetryEnabled).toBe(true);
    expect(config.featureFlags).toEqual({});
  });

  it('prefers overrides over environment and secure stores', async () => {
    const config = await loadEnvConfig({
      envSource: {
        TLJ_BACKEND_URL: 'https://api.example.com',
        TLJ_TELEMETRY_ENABLED: 'false',
      },
      overrides: {
        backendUrl: 'https://override.example.com',
        telemetryEnabled: true,
      },
    });

    expect(config.backendUrl).toBe('https://override.example.com');
    expect(config.telemetryEnabled).toBe(true);
  });

  it('falls back to secure store when env is missing', async () => {
    const secureStore = {
      getItem: async (key: string) => {
        if (key === 'OPENROUTER_API_KEY') {
          return 'secure-openrouter-key';
        }
        if (key === 'ZAI_API_KEY') {
          return 'secure-zai-key';
        }
        return null;
      },
    };

    const config = await loadEnvConfig({ envSource: {}, secureStore });

    expect(config.openRouterApiKey).toBe('secure-openrouter-key');
    expect(config.zaiApiKey).toBe('secure-zai-key');
  });

  it('parses feature flags JSON from IndexedDB store', async () => {
    const indexedStore = {
      getItem: async (key: string) => {
        if (key === 'TLJ_FEATURE_FLAGS') {
          return JSON.stringify({ agentV2: true, newImporter: false });
        }
        return null;
      },
    };

    const config = await loadEnvConfig({ envSource: {}, indexedStore });

    expect(config.featureFlags).toEqual({ agentV2: true, newImporter: false });
  });

  it('throws ConfigValidationError when env values are invalid', async () => {
    await expect(
      loadEnvConfig({
        envSource: {
          TLJ_BACKEND_URL: 'not-a-valid-url',
        },
      })
    ).rejects.toBeInstanceOf(ConfigValidationError);
  });

  it('loads ZAI_API_KEY from environment', async () => {
    const config = await loadEnvConfig({
      envSource: {
        ZAI_API_KEY: 'test-zai-key',
      },
    });

    expect(config.zaiApiKey).toBe('test-zai-key');
  });

  it('handles deprecated API keys with migration warning', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const config = await loadEnvConfig({
      envSource: {
        GEMINI_API_KEY: 'deprecated-gemini-key',
        OPENAI_API_KEY: 'deprecated-openai-key',
      },
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Deprecated API key detected: GEMINI_API_KEY. Please use ZAI_API_KEY instead.'
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      'Deprecated API key detected: OPENAI_API_KEY. Please use ZAI_API_KEY instead.'
    );
    
    consoleSpy.mockRestore();
  });
});
