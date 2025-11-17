/**
 * @fileoverview Service Provider - Dependency Injection Container
 * @purpose Manage service lifecycle and configuration for the application
 * @phase Phase 3 - BUILD (Service Infrastructure)
 * @created 2025-11-17
 *
 * This service provider:
 * - Manages singleton instances of all services
 * - Handles service configuration and initialization
 * - Supports mock/real service switching
 * - Provides type-safe service access
 * - Ensures proper dependency injection
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

/**
 * Service environment mode
 */
export enum ServiceMode {
  /** Use mock services (Phase 3-4) */
  MOCK = 'mock',
  /** Use real services (Phase 5+) */
  REAL = 'real',
  /** Use hybrid (some mock, some real) */
  HYBRID = 'hybrid'
}

/**
 * Service configuration
 */
export interface ServiceConfig {
  /** Service mode (mock/real/hybrid) */
  readonly mode: ServiceMode

  /** Model provider for AI services (optional for mock mode) */
  readonly modelProvider?: IModelProvider

  /** Optional: Override specific services to real mode when in hybrid */
  readonly realServices?: readonly ServiceName[]

  /** Optional: Service-specific configuration */
  readonly serviceOptions?: ServiceOptions
}

/**
 * Service-specific options
 */
export interface ServiceOptions {
  /** Input validation options */
  readonly inputValidation?: {
    readonly strictMode?: boolean
    readonly maxPromptLength?: number
  }

  /** Song generation options */
  readonly songGeneration?: {
    readonly defaultTemperature?: number
    readonly maxRetries?: number
  }

  /** History service options */
  readonly history?: {
    readonly maxVersions?: number
    readonly persistToDisk?: boolean
  }

  /** Export service options */
  readonly export?: {
    readonly defaultFormat?: string
    readonly outputDirectory?: string
  }
}

/**
 * Service names for type-safe access
 */
export enum ServiceName {
  INPUT_VALIDATION = 'inputValidation',
  RHYME_ANALYSIS = 'rhymeAnalysis',
  SYLLABLE_COUNTING = 'syllableCounting',
  SONG_GENERATION = 'songGeneration',
  CRITIQUE_ENGINE = 'critiqueEngine',
  REVISION_ENGINE = 'revisionEngine',
  SUNO_FORMATTER = 'sunoFormatter',
  EXPORT = 'export',
  HISTORY = 'history',
  GEMINI_AUDIO = 'geminiAudio'
}

/**
 * Service instances container
 */
interface ServiceInstances {
  inputValidation?: IInputValidationService
  rhymeAnalysis?: IRhymeAnalysisService
  syllableCounting?: ISyllableCountingService
  songGeneration?: ISongGenerationService
  critiqueEngine?: ICritiqueEngineService
  revisionEngine?: IRevisionEngineService
  sunoFormatter?: ISunoFormatterService
  export?: IExportService
  history?: IHistoryService
  geminiAudio?: IGeminiAudioService
}

/**
 * Service Provider - Dependency Injection Container
 *
 * Manages service lifecycle and provides type-safe access to all services.
 * Supports switching between mock and real implementations.
 */
export class ServiceProvider {
  private readonly config: ServiceConfig
  private readonly instances: ServiceInstances = {}
  private initialized: boolean = false

  /**
   * Create a new service provider
   *
   * @param config - Service configuration
   */
  constructor(config: ServiceConfig) {
    this.config = Object.freeze({ ...config })
  }

  /**
   * Get current service mode
   */
  getMode(): ServiceMode {
    return this.config.mode
  }

  /**
   * Get model provider (if configured)
   */
  getModelProvider(): IModelProvider | undefined {
    return this.config.modelProvider
  }

  /**
   * Check if provider is initialized
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * Initialize the service provider
   *
   * This should be called before accessing any services.
   * In mock mode, services are lazy-loaded.
   * In real mode, this might perform async initialization.
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    // In mock mode, services are lazy-loaded, so no initialization needed
    // In real mode (Phase 5), this would initialize connections, load config, etc.
    if (this.config.mode === ServiceMode.REAL || this.config.mode === ServiceMode.HYBRID) {
      // Validate that model provider is configured
      if (!this.config.modelProvider) {
        throw new Error('Model provider is required for real or hybrid service mode')
      }

      // Check if model provider is available
      const isAvailable = await this.config.modelProvider.isAvailable()
      if (!isAvailable) {
        throw new Error(`Model provider "${this.config.modelProvider.name}" is not available`)
      }
    }

    this.initialized = true
  }

  /**
   * Dispose all services and cleanup resources
   */
  async dispose(): Promise<void> {
    // Clear all service instances
    Object.keys(this.instances).forEach(key => {
      delete this.instances[key as keyof ServiceInstances]
    })

    this.initialized = false
  }

  /**
   * Get Input Validation Service
   */
  getInputValidationService(): IInputValidationService {
    if (!this.instances.inputValidation) {
      this.instances.inputValidation = this.createService(ServiceName.INPUT_VALIDATION)
    }
    return this.instances.inputValidation
  }

  /**
   * Get Rhyme Analysis Service
   */
  getRhymeAnalysisService(): IRhymeAnalysisService {
    if (!this.instances.rhymeAnalysis) {
      this.instances.rhymeAnalysis = this.createService(ServiceName.RHYME_ANALYSIS)
    }
    return this.instances.rhymeAnalysis
  }

  /**
   * Get Syllable Counting Service
   */
  getSyllableCountingService(): ISyllableCountingService {
    if (!this.instances.syllableCounting) {
      this.instances.syllableCounting = this.createService(ServiceName.SYLLABLE_COUNTING)
    }
    return this.instances.syllableCounting
  }

  /**
   * Get Song Generation Service
   */
  getSongGenerationService(): ISongGenerationService {
    if (!this.instances.songGeneration) {
      this.instances.songGeneration = this.createService(ServiceName.SONG_GENERATION)
    }
    return this.instances.songGeneration
  }

  /**
   * Get Critique Engine Service
   */
  getCritiqueEngineService(): ICritiqueEngineService {
    if (!this.instances.critiqueEngine) {
      this.instances.critiqueEngine = this.createService(ServiceName.CRITIQUE_ENGINE)
    }
    return this.instances.critiqueEngine
  }

  /**
   * Get Revision Engine Service
   */
  getRevisionEngineService(): IRevisionEngineService {
    if (!this.instances.revisionEngine) {
      this.instances.revisionEngine = this.createService(ServiceName.REVISION_ENGINE)
    }
    return this.instances.revisionEngine
  }

  /**
   * Get Suno Formatter Service
   */
  getSunoFormatterService(): ISunoFormatterService {
    if (!this.instances.sunoFormatter) {
      this.instances.sunoFormatter = this.createService(ServiceName.SUNO_FORMATTER)
    }
    return this.instances.sunoFormatter
  }

  /**
   * Get Export Service
   */
  getExportService(): IExportService {
    if (!this.instances.export) {
      this.instances.export = this.createService(ServiceName.EXPORT)
    }
    return this.instances.export
  }

  /**
   * Get History Service
   */
  getHistoryService(): IHistoryService {
    if (!this.instances.history) {
      this.instances.history = this.createService(ServiceName.HISTORY)
    }
    return this.instances.history
  }

  /**
   * Get Gemini Audio Service
   */
  getGeminiAudioService(): IGeminiAudioService {
    if (!this.instances.geminiAudio) {
      this.instances.geminiAudio = this.createService(ServiceName.GEMINI_AUDIO)
    }
    return this.instances.geminiAudio
  }

  /**
   * Create a service instance based on configuration
   *
   * @param serviceName - Name of the service to create
   * @returns Service instance
   */
  private createService<T>(serviceName: ServiceName): T {
    const useMock = this.shouldUseMock(serviceName)

    if (useMock) {
      return this.createMockService(serviceName) as T
    } else {
      return this.createRealService(serviceName) as T
    }
  }

  /**
   * Determine if a service should use mock implementation
   *
   * @param serviceName - Name of the service
   * @returns True if mock should be used
   */
  private shouldUseMock(serviceName: ServiceName): boolean {
    if (this.config.mode === ServiceMode.MOCK) {
      return true
    }

    if (this.config.mode === ServiceMode.REAL) {
      return false
    }

    // Hybrid mode - check if service is in realServices list
    if (this.config.realServices) {
      return !this.config.realServices.includes(serviceName)
    }

    // Default to mock in hybrid mode
    return true
  }

  /**
   * Create a mock service instance
   *
   * @param serviceName - Name of the service to create
   * @returns Mock service instance
   */
  private createMockService(serviceName: ServiceName): unknown {
    // Dynamic import of mock services to avoid circular dependencies
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mockServices = require('./mock')

    switch (serviceName) {
      case ServiceName.INPUT_VALIDATION:
        return new mockServices.MockInputValidationService()
      case ServiceName.RHYME_ANALYSIS:
        return new mockServices.MockRhymeAnalysisService()
      case ServiceName.SYLLABLE_COUNTING:
        return new mockServices.MockSyllableCountingService()
      case ServiceName.SONG_GENERATION:
        return new mockServices.MockSongGenerationService()
      case ServiceName.CRITIQUE_ENGINE:
        return new mockServices.MockCritiqueEngineService()
      case ServiceName.REVISION_ENGINE:
        return new mockServices.MockRevisionEngineService()
      case ServiceName.SUNO_FORMATTER:
        return new mockServices.MockSunoFormatterService()
      case ServiceName.EXPORT:
        return new mockServices.MockExportService()
      case ServiceName.HISTORY:
        return new mockServices.MockHistoryService()
      case ServiceName.GEMINI_AUDIO:
        return new mockServices.MockAudioAnalysisService()
      default:
        throw new Error(`Unknown service: ${serviceName}`)
    }
  }

  /**
   * Create a real service instance
   *
   * @param serviceName - Name of the service to create
   * @returns Real service instance
   */
  private createRealService(serviceName: ServiceName): unknown {
    // Validate that model provider is configured
    if (!this.config.modelProvider) {
      throw new Error(`Model provider is required for real service: ${serviceName}`)
    }

    // Dynamic import of real services
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const realServices = require('./real')

    switch (serviceName) {
      case ServiceName.RHYME_ANALYSIS:
        return new realServices.RealRhymeAnalysisService(this.config.modelProvider)

      // TODO: Add more real services as they are implemented
      case ServiceName.INPUT_VALIDATION:
      case ServiceName.SYLLABLE_COUNTING:
      case ServiceName.SONG_GENERATION:
      case ServiceName.CRITIQUE_ENGINE:
      case ServiceName.REVISION_ENGINE:
      case ServiceName.SUNO_FORMATTER:
      case ServiceName.EXPORT:
      case ServiceName.HISTORY:
      case ServiceName.GEMINI_AUDIO:
        throw new Error(
          `Real service implementation not yet available for ${serviceName}. ` +
          `This will be implemented in Phase 5. ` +
          `Use ServiceMode.MOCK or ServiceMode.HYBRID for now.`
        )

      default:
        throw new Error(`Unknown service: ${serviceName}`)
    }
  }
}

/**
 * Helper function to create a service provider with mock services
 *
 * @returns ServiceProvider configured for mock mode
 */
export function createMockServiceProvider(): ServiceProvider {
  return new ServiceProvider({
    mode: ServiceMode.MOCK
  })
}

/**
 * Helper function to create a service provider with real services
 *
 * @param modelProvider - Model provider for AI services
 * @param options - Optional service options
 * @returns ServiceProvider configured for real mode
 */
export function createRealServiceProvider(
  modelProvider: IModelProvider,
  options?: ServiceOptions
): ServiceProvider {
  return new ServiceProvider({
    mode: ServiceMode.REAL,
    modelProvider,
    serviceOptions: options
  })
}

/**
 * Helper function to create a hybrid service provider
 *
 * @param modelProvider - Model provider for AI services
 * @param realServices - List of services to use real implementations
 * @param options - Optional service options
 * @returns ServiceProvider configured for hybrid mode
 */
export function createHybridServiceProvider(
  modelProvider: IModelProvider,
  realServices: readonly ServiceName[],
  options?: ServiceOptions
): ServiceProvider {
  return new ServiceProvider({
    mode: ServiceMode.HYBRID,
    modelProvider,
    realServices,
    serviceOptions: options
  })
}
