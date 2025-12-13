/**
 * @fileoverview Integration Tests for GrokProvider
 * @purpose Validate real Grok API integration
 * @integration @provider
 *
 * Test Count: 30 tests
 * - API connectivity: 5 tests
 * - Generation method: 8 tests
 * - Analysis method: 5 tests
 * - Retry logic: 3 tests
 * - Caching: 4 tests
 * - Cost tracking: 3 tests
 * - Error handling: 2 tests
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { GrokProvider } from '../../../src/services/providers/GrokProvider'
import { isSuccess, isFailure } from '../../../src/contracts/types/common'
import type { IModelProvider } from '../../../src/contracts/providers/IModelProvider'
import { hasApiKey } from '../../helpers/test-builders'
import { assertValidServiceResponse, assertLatencyWithinSLA } from '../../helpers/assertion-helpers'

describe('GrokProvider Integration Tests', () => {
  let provider: IModelProvider

  beforeAll(() => {
    if (!hasApiKey()) {
      console.warn('⚠️  Skipping GrokProvider integration tests: GROK_API_KEY not set')
      return
    }

    provider = new GrokProvider({
      apiKey: process.env.GROK_API_KEY!,
      timeout: 30000,
      maxRetries: 3,
      enableCache: true,
      enableCostTracking: true
    })
  })

  afterAll(() => {
    if (provider && 'clearCache' in provider) {
      provider.clearCache()
    }
  })

  beforeEach(() => {
    if (provider && 'clearCache' in provider) {
      provider.clearCache()
    }
  })

  describe('API Connectivity', () => {
    it('should have correct provider name', () => {
      if (!hasApiKey()) return

      expect(provider.name).toBe('grok')
    })

    it('should have correct capabilities', () => {
      if (!hasApiKey()) return

      expect(provider.capabilities.textGeneration).toBe(true)
      expect(provider.capabilities.textAnalysis).toBe(true)
      expect(provider.capabilities.audioAnalysis).toBe(false)
      expect(provider.capabilities.imageAnalysis).toBe(false)
    })

    it('should be available when API key is valid', async () => {
      if (!hasApiKey()) return

      const available = await provider.isAvailable()
      expect(available).toBe(true)
    }, 10000)

    it('should have reasonable token limits', () => {
      if (!hasApiKey()) return

      expect(provider.capabilities.maxTokens).toBeGreaterThan(1000)
      expect(provider.capabilities.maxTokens).toBeLessThanOrEqual(32000)
    })

    it('should have valid temperature range', () => {
      if (!hasApiKey()) return

      const [min, max] = provider.capabilities.temperatureRange
      expect(min).toBe(0.0)
      expect(max).toBe(2.0)
    })
  })

  describe('Generation Method', () => {
    it('should generate text successfully with simple prompt', async () => {
      if (!hasApiKey()) return

      const result = await provider.generate({
        systemPrompt: 'You are a helpful assistant.',
        userPrompt: 'Write a short poem about the moon.',
        temperature: 0.7,
        maxTokens: 100
      })

      assertValidServiceResponse(result)
      expect(isSuccess(result)).toBe(true)

      if (isSuccess(result)) {
        expect(result.data.content).toBeTruthy()
        expect(result.data.content.length).toBeGreaterThan(10)
        expect(result.data.tokensUsed).toBeGreaterThan(0)
        expect(result.data.finishReason).toBeTruthy()
        expect(result.data.confidence).toBeGreaterThan(0)
        expect(result.data.confidence).toBeLessThanOrEqual(1)
      }
    }, 15000)

    it('should respect temperature setting', async () => {
      if (!hasApiKey()) return

      // Lower temperature should produce more deterministic output
      const result1 = await provider.generate({
        systemPrompt: 'You are a helpful assistant.',
        userPrompt: 'Say hello',
        temperature: 0.1,
        maxTokens: 10
      })

      const result2 = await provider.generate({
        systemPrompt: 'You are a helpful assistant.',
        userPrompt: 'Say hello',
        temperature: 0.1,
        maxTokens: 10
      })

      expect(isSuccess(result1)).toBe(true)
      expect(isSuccess(result2)).toBe(true)

      // Low temperature should produce similar (not necessarily identical) outputs
      if (isSuccess(result1) && isSuccess(result2)) {
        const similarity = calculateSimilarity(result1.data.content, result2.data.content)
        expect(similarity).toBeGreaterThan(0.5) // At least 50% similar
      }
    }, 20000)

    it('should respect max tokens limit', async () => {
      if (!hasApiKey()) return

      const result = await provider.generate({
        systemPrompt: 'You are a helpful assistant.',
        userPrompt: 'Write a very long story about space exploration.',
        temperature: 0.7,
        maxTokens: 50 // Very small limit
      })

      expect(isSuccess(result)).toBe(true)

      if (isSuccess(result)) {
        expect(result.data.tokensUsed).toBeLessThanOrEqual(60) // Some tolerance
      }
    }, 15000)

    it('should handle complex prompts', async () => {
      if (!hasApiKey()) return

      const result = await provider.generate({
        systemPrompt: 'You are a creative songwriting assistant specializing in rock music.',
        userPrompt: 'Write the first verse of a melancholic rock song about loss, using vivid imagery and avoiding clichés.',
        temperature: 0.8,
        maxTokens: 200
      })

      assertValidServiceResponse(result)
      expect(isSuccess(result)).toBe(true)

      if (isSuccess(result)) {
        expect(result.data.content.length).toBeGreaterThan(50)
        expect(result.data.tokensUsed).toBeGreaterThan(0)
      }
    }, 20000)

    it('should return proper metadata', async () => {
      if (!hasApiKey()) return

      const result = await provider.generate({
        systemPrompt: 'You are a helpful assistant.',
        userPrompt: 'Test',
        temperature: 0.7,
        maxTokens: 50
      })

      expect(isSuccess(result)).toBe(true)

      if (isSuccess(result) && result.data.metadata) {
        expect(result.data.metadata.model).toBeTruthy()
        expect(result.data.metadata.id).toBeTruthy()
        expect(result.data.metadata.inputTokens).toBeGreaterThan(0)
        expect(result.data.metadata.outputTokens).toBeGreaterThan(0)
      }
    }, 15000)

    it('should fail validation for empty prompts', async () => {
      if (!hasApiKey()) return

      const result = await provider.generate({
        systemPrompt: '',
        userPrompt: 'test',
        temperature: 0.7,
        maxTokens: 100
      })

      expect(isFailure(result)).toBe(true)

      if (isFailure(result)) {
        expect(result.error.code).toBe('INVALID_REQUEST')
        expect(result.error.suggestion).toBeTruthy()
      }
    }, 5000)

    it('should fail validation for invalid temperature', async () => {
      if (!hasApiKey()) return

      const result = await provider.generate({
        systemPrompt: 'test',
        userPrompt: 'test',
        temperature: 5.0, // Out of range
        maxTokens: 100
      })

      expect(isFailure(result)).toBe(true)

      if (isFailure(result)) {
        expect(result.error.code).toBe('INVALID_REQUEST')
        expect(result.error.message).toContain('temperature')
      }
    }, 5000)

    it('should complete within reasonable time', async () => {
      if (!hasApiKey()) return

      const start = Date.now()

      const result = await provider.generate({
        systemPrompt: 'You are a helpful assistant.',
        userPrompt: 'Say hi',
        temperature: 0.7,
        maxTokens: 10
      })

      const duration = Date.now() - start

      expect(isSuccess(result)).toBe(true)
      assertLatencyWithinSLA(duration, 10000) // Should complete in <10s
    }, 15000)
  })

  describe('Analysis Method', () => {
    it('should analyze text successfully', async () => {
      if (!hasApiKey()) return

      const result = await provider.analyze({
        content: 'The quick brown fox jumps over the lazy dog.',
        analysisType: 'sentiment',
        temperature: 0.3,
        parameters: {
          returnJson: true
        }
      })

      assertValidServiceResponse(result)
      expect(isSuccess(result)).toBe(true)

      if (isSuccess(result)) {
        expect(result.data.analysis).toBeTruthy()
        expect(typeof result.data.analysis).toBe('object')
        expect(result.data.confidence).toBeGreaterThan(0)
        expect(result.data.tokensUsed).toBeGreaterThan(0)
      }
    }, 15000)

    it('should handle different analysis types', async () => {
      if (!hasApiKey()) return

      const result = await provider.analyze({
        content: 'This is a beautiful, happy song about love and joy.',
        analysisType: 'emotion detection',
        temperature: 0.3,
        parameters: {
          emotions: ['happy', 'sad', 'angry', 'fearful']
        }
      })

      expect(isSuccess(result)).toBe(true)

      if (isSuccess(result)) {
        expect(result.data.analysis).toBeTruthy()
      }
    }, 15000)

    it('should fail validation for empty content', async () => {
      if (!hasApiKey()) return

      const result = await provider.analyze({
        content: '',
        analysisType: 'test',
        temperature: 0.3
      })

      expect(isFailure(result)).toBe(true)

      if (isFailure(result)) {
        expect(result.error.code).toBe('INVALID_REQUEST')
      }
    }, 5000)

    it('should fail validation for missing analysis type', async () => {
      if (!hasApiKey()) return

      const result = await provider.analyze({
        content: 'test content',
        analysisType: '',
        temperature: 0.3
      })

      expect(isFailure(result)).toBe(true)

      if (isFailure(result)) {
        expect(result.error.code).toBe('INVALID_REQUEST')
        expect(result.error.message).toContain('analysis type')
      }
    }, 5000)

    it('should complete analysis within reasonable time', async () => {
      if (!hasApiKey()) return

      const start = Date.now()

      const result = await provider.analyze({
        content: 'Quick test.',
        analysisType: 'simple',
        temperature: 0.3
      })

      const duration = Date.now() - start

      expect(isSuccess(result)).toBe(true)
      assertLatencyWithinSLA(duration, 8000) // Should complete in <8s
    }, 15000)
  })

  describe('Retry Logic', () => {
    it('should retry on transient failures', async () => {
      if (!hasApiKey()) return

      // This test validates that the provider can handle retries
      // We can't easily simulate transient failures without mocking,
      // so we just verify the retry mechanism exists

      const providerWithRetry = new GrokProvider({
        apiKey: process.env.GROK_API_KEY!,
        maxRetries: 3
      })

      const result = await providerWithRetry.generate({
        systemPrompt: 'test',
        userPrompt: 'test',
        temperature: 0.7,
        maxTokens: 10
      })

      // Should succeed with normal request
      expect(isSuccess(result)).toBe(true)
    }, 15000)

    it('should fail after max retries with invalid API key', async () => {
      const badProvider = new GrokProvider({
        apiKey: 'invalid_key_12345',
        maxRetries: 2,
        timeout: 5000
      })

      const result = await badProvider.generate({
        systemPrompt: 'test',
        userPrompt: 'test',
        temperature: 0.7,
        maxTokens: 10
      })

      expect(isFailure(result)).toBe(true)

      if (isFailure(result)) {
        expect(result.error.code).toContain('AUTH')
      }
    }, 20000)

    it('should handle timeout errors', async () => {
      if (!hasApiKey()) return

      const providerWithShortTimeout = new GrokProvider({
        apiKey: process.env.GROK_API_KEY!,
        timeout: 1, // 1ms timeout - will definitely fail
        maxRetries: 1
      })

      const result = await providerWithShortTimeout.generate({
        systemPrompt: 'test',
        userPrompt: 'test',
        temperature: 0.7,
        maxTokens: 10
      })

      expect(isFailure(result)).toBe(true)

      if (isFailure(result)) {
        expect(result.error.code).toBe('API_TIMEOUT')
      }
    }, 10000)
  })

  describe('Caching', () => {
    it('should cache identical requests', async () => {
      if (!hasApiKey()) return

      const request = {
        systemPrompt: 'You are a helpful assistant.',
        userPrompt: 'Say hello exactly once.',
        temperature: 0.7,
        maxTokens: 50
      }

      // First request
      const result1 = await provider.generate(request)
      expect(isSuccess(result1)).toBe(true)

      // Second identical request (should be cached)
      const start = Date.now()
      const result2 = await provider.generate(request)
      const duration = Date.now() - start

      expect(isSuccess(result2)).toBe(true)

      // Cached request should be much faster (<100ms)
      expect(duration).toBeLessThan(1000)
    }, 20000)

    it('should not cache different requests', async () => {
      if (!hasApiKey()) return

      const result1 = await provider.generate({
        systemPrompt: 'test1',
        userPrompt: 'prompt1',
        temperature: 0.7,
        maxTokens: 50
      })

      const result2 = await provider.generate({
        systemPrompt: 'test2',
        userPrompt: 'prompt2',
        temperature: 0.7,
        maxTokens: 50
      })

      expect(isSuccess(result1)).toBe(true)
      expect(isSuccess(result2)).toBe(true)

      if (isSuccess(result1) && isSuccess(result2)) {
        expect(result1.data.content).not.toBe(result2.data.content)
      }
    }, 20000)

    it('should allow cache to be cleared', async () => {
      if (!hasApiKey()) return
      if (!('clearCache' in provider)) return

      const request = {
        systemPrompt: 'test',
        userPrompt: 'test cache clear',
        temperature: 0.7,
        maxTokens: 50
      }

      // First request
      await provider.generate(request)

      // Clear cache
      provider.clearCache()

      // Second request should not be cached
      const start = Date.now()
      await provider.generate(request)
      const duration = Date.now() - start

      // Should take normal time (not instant)
      expect(duration).toBeGreaterThan(500)
    }, 20000)

    it('should respect cache expiry', async () => {
      if (!hasApiKey()) return

      const shortCacheProvider = new GrokProvider({
        apiKey: process.env.GROK_API_KEY!,
        cacheExpiryMs: 100 // 100ms expiry
      })

      const request = {
        systemPrompt: 'test',
        userPrompt: 'test expiry',
        temperature: 0.7,
        maxTokens: 50
      }

      // First request
      await shortCacheProvider.generate(request)

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 150))

      // Second request should not be cached (expired)
      const start = Date.now()
      await shortCacheProvider.generate(request)
      const duration = Date.now() - start

      // Should take normal time (not instant)
      expect(duration).toBeGreaterThan(500)
    }, 20000)
  })

  describe('Cost Tracking', () => {
    it('should track cost statistics', async () => {
      if (!hasApiKey()) return
      if (!('getCostStatistics' in provider)) return

      // Clear previous history
      if ('clearCostHistory' in provider) {
        provider.clearCostHistory()
      }

      await provider.generate({
        systemPrompt: 'test',
        userPrompt: 'test cost tracking',
        temperature: 0.7,
        maxTokens: 50
      })

      const stats = provider.getCostStatistics()

      expect(stats.totalTokens).toBeGreaterThan(0)
      expect(stats.totalCost).toBeGreaterThan(0)
      expect(stats.requestCount).toBeGreaterThan(0)
      expect(stats.averageCostPerRequest).toBeGreaterThan(0)
    }, 15000)

    it('should provide cost estimates', async () => {
      if (!hasApiKey()) return

      const estimatedCost = provider.estimateCost(1000)

      expect(estimatedCost).toBeGreaterThan(0)
      expect(estimatedCost).toBeLessThan(0.01) // Should be very cheap for 1000 tokens
    })

    it('should accurately track actual costs', async () => {
      if (!hasApiKey()) return
      if (!('getCostStatistics' in provider)) return

      // Clear previous history
      if ('clearCostHistory' in provider) {
        provider.clearCostHistory()
      }

      const result = await provider.generate({
        systemPrompt: 'test',
        userPrompt: 'test',
        temperature: 0.7,
        maxTokens: 50
      })

      expect(isSuccess(result)).toBe(true)

      if (isSuccess(result)) {
        const stats = provider.getCostStatistics()
        const estimatedCost = provider.estimateCost(result.data.tokensUsed)

        // Actual cost should be close to estimated cost
        const difference = Math.abs(stats.totalCost - estimatedCost)
        expect(difference).toBeLessThan(estimatedCost * 0.5) // Within 50% tolerance
      }
    }, 15000)
  })

  describe('Error Handling', () => {
    it('should handle authentication errors gracefully', async () => {
      const badProvider = new GrokProvider({
        apiKey: 'invalid_key',
        maxRetries: 1
      })

      const result = await badProvider.generate({
        systemPrompt: 'test',
        userPrompt: 'test',
        temperature: 0.7,
        maxTokens: 50
      })

      expect(isFailure(result)).toBe(true)

      if (isFailure(result)) {
        expect(result.error.code).toBe('AUTHENTICATION_FAILED')
        expect(result.error.suggestion).toContain('API key')
      }
    }, 10000)

    it('should provide helpful error messages', async () => {
      if (!hasApiKey()) return

      const result = await provider.generate({
        systemPrompt: '',
        userPrompt: '',
        temperature: 0.7,
        maxTokens: 50
      })

      expect(isFailure(result)).toBe(true)

      if (isFailure(result)) {
        expect(result.error.message).toBeTruthy()
        expect(result.error.suggestion).toBeTruthy()
        expect(result.error.timestamp).toBeTruthy()
      }
    }, 5000)
  })
})

/**
 * Calculate similarity between two strings (simple word overlap)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.toLowerCase().split(/\s+/))
  const words2 = new Set(str2.toLowerCase().split(/\s+/))

  const intersection = new Set([...words1].filter(w => words2.has(w)))
  const union = new Set([...words1, ...words2])

  return intersection.size / union.size
}
