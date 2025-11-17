/**
 * @fileoverview Model Provider Factory
 * @purpose Create AI provider instances based on configuration
 * @phase Phase 5 - INTEGRATE (Real Services)
 * @created 2025-11-17
 *
 * This factory:
 * - Creates provider instances from configuration
 * - Validates configuration before instantiation
 * - Supports multiple provider types (Grok, Mock, future: Claude, GPT-4, Gemini)
 * - Provides type-safe provider creation
 * - Handles errors gracefully
 */

import type {
  IModelProvider,
  ModelProviderConfig
} from '../../contracts/providers/IModelProvider'
import { GrokProvider } from './GrokProvider'
import { MockProvider } from './MockProvider'

/**
 * Create a model provider instance based on configuration
 *
 * @param config - Provider configuration
 * @returns IModelProvider instance
 * @throws Error if provider type is unknown or configuration is invalid
 *
 * @example
 * ```typescript
 * // Create Grok provider
 * const grokProvider = createProvider({
 *   provider: 'grok',
 *   apiKey: process.env.GROK_API_KEY
 * })
 *
 * // Create Mock provider
 * const mockProvider = createProvider({
 *   provider: 'mock'
 * })
 * ```
 */
export function createProvider(config: ModelProviderConfig): IModelProvider {
  // Validate config
  if (!config || typeof config !== 'object') {
    throw new Error('Provider configuration is required')
  }

  if (!config.provider || typeof config.provider !== 'string') {
    throw new Error('Provider type must be specified')
  }

  // Create provider based on type
  switch (config.provider) {
    case 'grok':
      return createGrokProvider(config)

    case 'mock':
      return createMockProvider()

    case 'claude':
    case 'gpt4':
    case 'gemini':
      throw new Error(
        `Provider "${config.provider}" is not yet implemented. ` +
        `Available providers: grok, mock. ` +
        `Support for ${config.provider} will be added in a future release.`
      )

    default:
      throw new Error(
        `Unknown provider type: "${config.provider}". ` +
        `Available providers: grok, mock`
      )
  }
}

/**
 * Create a Grok provider instance
 *
 * @param config - Provider configuration
 * @returns GrokProvider instance
 * @throws Error if API key is missing
 */
function createGrokProvider(config: ModelProviderConfig): GrokProvider {
  // Validate API key
  if (!config.apiKey || config.apiKey.trim().length === 0) {
    throw new Error(
      'Grok API key is required. ' +
      'Please set the "songwriting.grokApiKey" setting or provide an API key in configuration.'
    )
  }

  // Create provider with configuration
  return new GrokProvider({
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    timeout: config.timeout,
    maxRetries: config.maxRetries
  })
}

/**
 * Create a Mock provider instance
 *
 * @returns MockProvider instance
 */
function createMockProvider(): MockProvider {
  return new MockProvider()
}

/**
 * Validate provider configuration
 *
 * @param config - Provider configuration to validate
 * @returns Validation result with error message if invalid
 */
export function validateProviderConfig(config: ModelProviderConfig): {
  readonly valid: boolean
  readonly error?: string
} {
  // Check if config exists
  if (!config || typeof config !== 'object') {
    return {
      valid: false,
      error: 'Provider configuration is required'
    }
  }

  // Check provider type
  if (!config.provider || typeof config.provider !== 'string') {
    return {
      valid: false,
      error: 'Provider type must be specified'
    }
  }

  // Validate provider-specific requirements
  switch (config.provider) {
    case 'grok':
      if (!config.apiKey || config.apiKey.trim().length === 0) {
        return {
          valid: false,
          error: 'Grok provider requires an API key'
        }
      }
      break

    case 'mock':
      // Mock provider has no special requirements
      break

    case 'claude':
    case 'gpt4':
    case 'gemini':
      return {
        valid: false,
        error: `Provider "${config.provider}" is not yet implemented`
      }

    default:
      return {
        valid: false,
        error: `Unknown provider type: "${config.provider}"`
      }
  }

  // Validate optional fields
  if (config.timeout !== undefined && (config.timeout <= 0 || config.timeout > 300000)) {
    return {
      valid: false,
      error: 'Timeout must be between 1 and 300000 milliseconds (5 minutes)'
    }
  }

  if (config.maxRetries !== undefined && (config.maxRetries < 0 || config.maxRetries > 10)) {
    return {
      valid: false,
      error: 'Max retries must be between 0 and 10'
    }
  }

  // All validations passed
  return { valid: true }
}

/**
 * Get default configuration for a provider type
 *
 * @param provider - Provider type
 * @returns Default configuration (partial)
 */
export function getDefaultConfig(
  provider: 'grok' | 'claude' | 'gpt4' | 'gemini' | 'mock'
): Partial<ModelProviderConfig> {
  const baseConfig = {
    timeout: 30000,
    maxRetries: 3
  }

  switch (provider) {
    case 'grok':
      return {
        ...baseConfig,
        baseUrl: 'https://api.x.ai/v1'
      }

    case 'mock':
      return {}

    case 'claude':
    case 'gpt4':
    case 'gemini':
      return baseConfig

    default:
      return baseConfig
  }
}
