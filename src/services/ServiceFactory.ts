/**
 * @fileoverview Service Factory - Singleton Factory Pattern
 * @purpose Provide global access point to service provider and services
 * @phase Phase 3 - BUILD (Service Infrastructure)
 * @created 2025-11-17
 *
 * This service factory:
 * - Implements singleton pattern for global access
 * - Provides type-safe service access methods
 * - Manages service provider lifecycle
 * - Supports runtime configuration
 * - Easy switching between mock and real services
 *
 * Usage:
 * ```typescript
 * // Initialize with mock services (Phase 3-4)
 * await ServiceFactory.initialize({ mode: ServiceMode.MOCK })
 *
 * // Get services
 * const validator = ServiceFactory.getInputValidationService()
 * const generator = ServiceFactory.getSongGenerationService()
 *
 * // Later, switch to real services (Phase 5)
 * await ServiceFactory.initialize({
 *   mode: ServiceMode.REAL,
 *   modelProvider: myModelProvider
 * })
 * ```
 *
 * SDD Compliance:
 * - Uses contracts as source of truth
 * - Type-safe service access
 * - Immutable configuration
 * - Zero TypeScript errors
 */

import type { IModelProvider } from '../contracts/providers/IModelProvider'
import type {
  IInputValidationService,
  IRhymeAnalysisService,
  ISyllableCountingService,
  ISongGenerationService,
  ICritiqueEngineService,
  IRevisionEngineService,
  ISunoFormatterService,
  IExportService,
  IHistoryService,
  IGeminiAudioService
} from '../contracts'
import {
  ServiceProvider,
  ServiceMode,
  type ServiceConfig,
  type ServiceOptions,
  type ServiceName
} from './ServiceProvider'

/**
 * Service Factory - Global Singleton
 *
 * Provides global access to all services through a singleton pattern.
 * Manages service provider lifecycle and configuration.
 */
export class ServiceFactory {
  private static instance: ServiceFactory | null = null
  private provider: ServiceProvider | null = null

  /**
   * Private constructor - use initialize() instead
   */
  private constructor() {
    // Private to enforce singleton pattern
  }

  /**
   * Get the singleton instance
   *
   * @returns ServiceFactory instance
   * @throws Error if not initialized
   */
  private static getInstance(): ServiceFactory {
    if (!ServiceFactory.instance) {
      ServiceFactory.instance = new ServiceFactory()
    }
    return ServiceFactory.instance
  }

  /**
   * Initialize the service factory with configuration
   *
   * This must be called before accessing any services.
   * Can be called multiple times to reconfigure (will dispose old provider).
   *
   * @param config - Service configuration
   * @throws Error if initialization fails
   */
  static async initialize(config: ServiceConfig): Promise<void> {
    const factory = ServiceFactory.getInstance()

    // Dispose existing provider if any
    if (factory.provider) {
      await factory.provider.dispose()
    }

    // Create and initialize new provider
    factory.provider = new ServiceProvider(config)
    await factory.provider.initialize()
  }

  /**
   * Initialize with mock services (convenience method)
   *
   * @param options - Optional service options
   */
  static async initializeMock(options?: ServiceOptions): Promise<void> {
    await ServiceFactory.initialize({
      mode: ServiceMode.MOCK,
      serviceOptions: options
    })
  }

  /**
   * Initialize with real services (convenience method)
   *
   * @param modelProvider - Model provider for AI services
   * @param options - Optional service options
   */
  static async initializeReal(
    modelProvider: IModelProvider,
    options?: ServiceOptions
  ): Promise<void> {
    await ServiceFactory.initialize({
      mode: ServiceMode.REAL,
      modelProvider,
      serviceOptions: options
    })
  }

  /**
   * Initialize with hybrid services (convenience method)
   *
   * @param modelProvider - Model provider for AI services
   * @param realServices - List of services to use real implementations
   * @param options - Optional service options
   */
  static async initializeHybrid(
    modelProvider: IModelProvider,
    realServices: readonly ServiceName[],
    options?: ServiceOptions
  ): Promise<void> {
    await ServiceFactory.initialize({
      mode: ServiceMode.HYBRID,
      modelProvider,
      realServices,
      serviceOptions: options
    })
  }

  /**
   * Check if factory is initialized
   */
  static isInitialized(): boolean {
    const factory = ServiceFactory.getInstance()
    return factory.provider !== null && factory.provider.isInitialized()
  }

  /**
   * Get current service mode
   */
  static getMode(): ServiceMode {
    const provider = ServiceFactory.getProvider()
    return provider.getMode()
  }

  /**
   * Get the service provider
   *
   * @returns ServiceProvider instance
   * @throws Error if not initialized
   */
  static getProvider(): ServiceProvider {
    const factory = ServiceFactory.getInstance()
    if (!factory.provider) {
      throw new Error(
        'ServiceFactory not initialized. Call ServiceFactory.initialize() first.'
      )
    }
    return factory.provider
  }

  /**
   * Dispose the service factory and cleanup resources
   */
  static async dispose(): Promise<void> {
    const factory = ServiceFactory.getInstance()
    if (factory.provider) {
      await factory.provider.dispose()
      factory.provider = null
    }
  }

  /**
   * Reset the factory (for testing)
   *
   * This completely removes the singleton instance.
   * Use with caution - mainly for testing scenarios.
   */
  static reset(): void {
    if (ServiceFactory.instance?.provider) {
      // Note: This is synchronous, so it doesn't await dispose
      // For proper cleanup, call dispose() before reset()
      ServiceFactory.instance.provider = null
    }
    ServiceFactory.instance = null
  }

  // ============================================================================
  // SERVICE ACCESSORS
  // ============================================================================

  /**
   * Get Input Validation Service
   *
   * Validates and sanitizes user input before song generation.
   *
   * @returns IInputValidationService instance
   * @throws Error if factory not initialized
   */
  static getInputValidationService(): IInputValidationService {
    const provider = ServiceFactory.getProvider()
    return provider.getInputValidationService()
  }

  /**
   * Get Rhyme Analysis Service
   *
   * Analyzes rhyme patterns and schemes in song lyrics.
   *
   * @returns IRhymeAnalysisService instance
   * @throws Error if factory not initialized
   */
  static getRhymeAnalysisService(): IRhymeAnalysisService {
    const provider = ServiceFactory.getProvider()
    return provider.getRhymeAnalysisService()
  }

  /**
   * Get Syllable Counting Service
   *
   * Counts syllables and analyzes stress patterns in lyrics.
   *
   * @returns ISyllableCountingService instance
   * @throws Error if factory not initialized
   */
  static getSyllableCountingService(): ISyllableCountingService {
    const provider = ServiceFactory.getProvider()
    return provider.getSyllableCountingService()
  }

  /**
   * Get Song Generation Service
   *
   * Generates complete songs from validated prompts using AI.
   *
   * @returns ISongGenerationService instance
   * @throws Error if factory not initialized
   */
  static getSongGenerationService(): ISongGenerationService {
    const provider = ServiceFactory.getProvider()
    return provider.getSongGenerationService()
  }

  /**
   * Get Critique Engine Service
   *
   * Analyzes and critiques song quality with detailed feedback.
   *
   * @returns ICritiqueEngineService instance
   * @throws Error if factory not initialized
   */
  static getCritiqueEngineService(): ICritiqueEngineService {
    const provider = ServiceFactory.getProvider()
    return provider.getCritiqueEngineService()
  }

  /**
   * Get Revision Engine Service
   *
   * Improves songs iteratively based on critique feedback.
   *
   * @returns IRevisionEngineService instance
   * @throws Error if factory not initialized
   */
  static getRevisionEngineService(): IRevisionEngineService {
    const provider = ServiceFactory.getProvider()
    return provider.getRevisionEngineService()
  }

  /**
   * Get Suno Formatter Service
   *
   * Formats songs for the Suno platform with metadata.
   *
   * @returns ISunoFormatterService instance
   * @throws Error if factory not initialized
   */
  static getSunoFormatterService(): ISunoFormatterService {
    const provider = ServiceFactory.getProvider()
    return provider.getSunoFormatterService()
  }

  /**
   * Get Export Service
   *
   * Exports songs to various formats (text, JSON, Markdown, etc.).
   *
   * @returns IExportService instance
   * @throws Error if factory not initialized
   */
  static getExportService(): IExportService {
    const provider = ServiceFactory.getProvider()
    return provider.getExportService()
  }

  /**
   * Get History Service
   *
   * Manages song version history and revision tracking.
   *
   * @returns IHistoryService instance
   * @throws Error if factory not initialized
   */
  static getHistoryService(): IHistoryService {
    const provider = ServiceFactory.getProvider()
    return provider.getHistoryService()
  }

  /**
   * Get Gemini Audio Service
   *
   * Analyzes audio files to extract rhythm, melody, and emotion.
   *
   * @returns IGeminiAudioService instance
   * @throws Error if factory not initialized
   */
  static getGeminiAudioService(): IGeminiAudioService {
    const provider = ServiceFactory.getProvider()
    return provider.getGeminiAudioService()
  }
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

/**
 * Re-export ServiceMode for convenience
 */
export { ServiceMode, ServiceName } from './ServiceProvider'

/**
 * Re-export types for convenience
 */
export type { ServiceConfig, ServiceOptions } from './ServiceProvider'
