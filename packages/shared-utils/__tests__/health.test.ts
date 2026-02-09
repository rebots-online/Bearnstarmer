import { describe, expect, it, vi, beforeEach } from 'vitest';
import { checkLocalProviderHealth, getLocalProvidersHealth } from '../src/health';

// Mock fetch with globalThis for Node environment
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkLocalProviderHealth', () => {
    it('returns healthy status when endpoint responds with OK', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
      } as Response);

      const result = await checkLocalProviderHealth('ollama', 'http://localhost:11434');

      expect(result).toEqual({
        provider: 'ollama',
        isHealthy: true,
        responseTime: expect.any(Number),
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/health',
        expect.objectContaining({
          method: 'GET',
          signal: expect.any(AbortSignal),
        })
      );
    });

    it('returns unhealthy status when endpoint returns error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      } as Response);

      const result = await checkLocalProviderHealth('ollama', 'http://localhost:11434');

      expect(result).toEqual({
        provider: 'ollama',
        isHealthy: false,
        error: 'HTTP 503: Service Unavailable',
        responseTime: expect.any(Number),
      });
    });

    it('returns unhealthy status when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const result = await checkLocalProviderHealth('ollama', 'http://localhost:11434');

      expect(result).toEqual({
        provider: 'ollama',
        isHealthy: false,
        error: 'Connection refused',
        responseTime: expect.any(Number),
      });
    });

    it('returns unhealthy status when no base URL provided', async () => {
      const result = await checkLocalProviderHealth('ollama', null);

      expect(result).toEqual({
        provider: 'ollama',
        isHealthy: false,
        error: 'Base URL not configured',
      });
    });

    it('times out after 5 seconds', async () => {
      mockFetch.mockImplementationOnce(() => new Promise(() => {})); // Never resolves

      const startTime = Date.now();
      const result = await checkLocalProviderHealth('ollama', 'http://localhost:11434');
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(5000);
      expect(endTime - startTime).toBeLessThan(6000); // Allow some margin
      expect(result).toEqual({
        provider: 'ollama',
        isHealthy: false,
        error: expect.stringContaining('timeout'),
        responseTime: expect.any(Number),
      });
    });
  });

  describe('getLocalProvidersHealth', () => {
    it('checks all configured providers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
      } as Response);

      const config = {
        ollamaBaseUrl: 'http://localhost:11434',
        lmstudioBaseUrl: 'http://localhost:1234/v1',
        vllmBaseUrl: 'http://localhost:8000/v1',
      };

      const results = await getLocalProvidersHealth(config);

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({
        provider: 'ollama',
        isHealthy: true,
        responseTime: expect.any(Number),
      });
      expect(results[1]).toEqual({
        provider: 'lmstudio',
        isHealthy: true,
        responseTime: expect.any(Number),
      });
      expect(results[2]).toEqual({
        provider: 'vllm',
        isHealthy: true,
        responseTime: expect.any(Number),
      });

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/health',
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:1234/v1/health',
        expect.any(Object)
      );
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/v1/health',
        expect.any(Object)
      );
    });

    it('skips providers with null URLs', async () => {
      const config = {
        ollamaBaseUrl: null,
        lmstudioBaseUrl: undefined,
        vllmBaseUrl: 'http://localhost:8000/v1',
      };

      const results = await getLocalProvidersHealth(config);

      expect(results).toHaveLength(1);
      expect(results[0].provider).toBe('vllm');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('handles empty config', async () => {
      const config = {};

      const results = await getLocalProvidersHealth(config);

      expect(results).toHaveLength(0);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
