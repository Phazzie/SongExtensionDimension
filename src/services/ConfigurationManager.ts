/**
 * @fileoverview Configuration Manager
 * @purpose Manage VSCode settings and configuration for the extension
 * @phase Phase 5 - INTEGRATE (Real Services)
 * @created 2025-11-17
 *
 * This manager:
 * - Reads VSCode workspace settings
 * - Validates configuration values
 * - Provides typed access to settings
 * - Watches for configuration changes
 * - Falls back to environment variables
 * - Provides sensible defaults
 *
 * Settings structure (in package.json):
 * - songwriting.provider: AI provider to use (grok, mock, etc.)
 * - songwriting.grokApiKey: API key for Grok
 * - songwriting.cacheEnabled: Enable response caching
 * - songwriting.cacheExpiryMinutes: Cache expiry time
 * - songwriting.maxMonthlyCost: Monthly budget limit
 * - songwriting.showCostWarnings: Show cost warnings
 */

import type { ModelProviderConfig } from '../contracts/providers/IModelProvider'

/**
 * Cache configuration
 */
export interface CacheConfig {
  readonly enabled: boolean
  readonly expiryMs: number
}

/**
 * Cost configuration
 */
export interface CostConfig {
  readonly maxMonthly: number
  readonly showWarnings: boolean
  readonly warningThreshold: number // Percentage (0-100)
}

/**
 * Configuration change callback
 */
export type ConfigChangeCallback = (config: ModelProviderConfig) => void

/**
 * Configuration Manager
 *
 * Manages VSCode settings and provides typed access to configuration.
 * Supports configuration watching and validation.
 */
export class ConfigurationManager {
  private readonly configNamespace = 'songwriting'
  private changeCallbacks: ConfigChangeCallback[] = []

  /**
   * Get model provider configuration
   *
   * @returns Provider configuration
   */
  getProviderConfig(): ModelProviderConfig {
    // Get provider type
    const provider = this.getSetting<string>('provider', 'mock') as ModelProviderConfig['provider']

    // Get API key (from settings or environment)
    const apiKey = this.getApiKey(provider)

    // Get optional settings
    const timeout = this.getSetting<number>('requestTimeout', 30000)
    const maxRetries = this.getSetting<number>('maxRetries', 3)

    return {
      provider,
      apiKey,
      timeout,
      maxRetries
    }
  }

  /**
   * Get cache configuration
   *
   * @returns Cache configuration
   */
  getCacheConfig(): CacheConfig {
    const enabled = this.getSetting<boolean>('cacheEnabled', true)
    const expiryMinutes = this.getSetting<number>('cacheExpiryMinutes', 30)

    return {
      enabled,
      expiryMs: expiryMinutes * 60 * 1000
    }
  }

  /**
   * Get cost configuration
   *
   * @returns Cost configuration
   */
  getCostConfig(): CostConfig {
    const maxMonthly = this.getSetting<number>('maxMonthlyCost', 100)
    const showWarnings = this.getSetting<boolean>('showCostWarnings', true)
    const warningThreshold = this.getSetting<number>('costWarningThreshold', 80)

    return {
      maxMonthly,
      showWarnings,
      warningThreshold
    }
  }

  /**
   * Validate API key for a provider
   *
   * @param provider - Provider type
   * @returns Validation result
   */
  validateApiKey(provider: 'grok' | 'claude' | 'gpt4' | 'gemini' | 'mock'): {
    readonly valid: boolean
    readonly message?: string
  } {
    // Mock provider doesn't need API key
    if (provider === 'mock') {
      return { valid: true }
    }

    // Get API key
    const apiKey = this.getApiKey(provider)

    // Check if key exists
    if (!apiKey || apiKey.trim().length === 0) {
      return {
        valid: false,
        message: `API key for ${provider} is not configured. ` +
          `Please set the "songwriting.${provider}ApiKey" setting or ` +
          `the ${provider.toUpperCase()}_API_KEY environment variable.`
      }
    }

    // Basic format validation (at least 20 characters)
    if (apiKey.length < 20) {
      return {
        valid: false,
        message: `API key for ${provider} appears to be invalid (too short). ` +
          `Please check your configuration.`
      }
    }

    return { valid: true }
  }

  /**
   * Update a configuration value
   *
   * @param key - Setting key (without namespace)
   * @param value - New value
   */
  async updateConfig(key: string, value: unknown): Promise<void> {
    // In a real VSCode extension, this would use:
    // await vscode.workspace.getConfiguration(this.configNamespace).update(key, value, true)

    // For now, just store in memory/environment
    // This is a placeholder for the actual VSCode API integration
    console.log(`[ConfigurationManager] Update ${this.configNamespace}.${key} = ${value}`)
  }

  /**
   * Register callback for configuration changes
   *
   * @param callback - Callback function
   * @returns Disposable to unregister
   */
  onConfigChange(callback: ConfigChangeCallback): { dispose: () => void } {
    this.changeCallbacks.push(callback)

    return {
      dispose: () => {
        const index = this.changeCallbacks.indexOf(callback)
        if (index >= 0) {
          this.changeCallbacks.splice(index, 1)
        }
      }
    }
  }

  /**
   * Notify all callbacks of configuration change
   * (Currently unused - will be called when VSCode config watching is implemented)
   */
  private notifyConfigChange(): void {
    const config = this.getProviderConfig()
    for (const callback of this.changeCallbacks) {
      try {
        callback(config)
      } catch (error) {
        console.error('[ConfigurationManager] Error in config change callback:', error)
      }
    }
  }

  /**
   * Trigger config change notification manually (for testing)
   */
  triggerConfigChange(): void {
    this.notifyConfigChange()
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Get a setting value with default
   *
   * @param key - Setting key (without namespace)
   * @param defaultValue - Default value if not set
   * @returns Setting value
   */
  private getSetting<T>(key: string, defaultValue: T): T {
    // In a real VSCode extension, this would use:
    // return vscode.workspace.getConfiguration(this.configNamespace).get<T>(key, defaultValue)

    // For now, check environment variables as fallback
    const envKey = `${this.configNamespace.toUpperCase()}_${key.toUpperCase()}`
    const envValue = process.env[envKey]

    if (envValue !== undefined) {
      return this.parseEnvValue(envValue, defaultValue)
    }

    return defaultValue
  }

  /**
   * Get API key for a provider
   *
   * @param provider - Provider type
   * @returns API key or undefined
   */
  private getApiKey(provider: string): string | undefined {
    // Check settings first
    const settingKey = `${provider}ApiKey`
    const apiKey = this.getSetting<string>(settingKey, '')

    if (apiKey && apiKey.trim().length > 0) {
      return apiKey
    }

    // Fall back to environment variable
    const envKey = `${provider.toUpperCase()}_API_KEY`
    const envValue = process.env[envKey]

    if (envValue && envValue.trim().length > 0) {
      return envValue
    }

    // Also check generic GROK_API_KEY for backwards compatibility
    if (provider === 'grok') {
      const grokKey = process.env.GROK_API_KEY
      if (grokKey && grokKey.trim().length > 0) {
        return grokKey
      }
    }

    return undefined
  }

  /**
   * Parse environment variable value to correct type
   *
   * @param value - String value from environment
   * @param defaultValue - Default value (used to infer type)
   * @returns Parsed value
   */
  private parseEnvValue<T>(value: string, defaultValue: T): T {
    // Infer type from default value
    if (typeof defaultValue === 'boolean') {
      return (value.toLowerCase() === 'true' || value === '1') as unknown as T
    }

    if (typeof defaultValue === 'number') {
      const parsed = Number(value)
      return (isNaN(parsed) ? defaultValue : parsed) as unknown as T
    }

    // Default to string
    return value as unknown as T
  }
}

/**
 * Singleton instance of ConfigurationManager
 */
let configManagerInstance: ConfigurationManager | null = null

/**
 * Get the singleton ConfigurationManager instance
 *
 * @returns ConfigurationManager instance
 */
export function getConfigurationManager(): ConfigurationManager {
  if (!configManagerInstance) {
    configManagerInstance = new ConfigurationManager()
  }
  return configManagerInstance
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetConfigurationManager(): void {
  configManagerInstance = null
}
