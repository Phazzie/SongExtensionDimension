/**
 * @fileoverview Services Index - Central export point for service infrastructure
 * @purpose Export service factory, provider, and utilities from single location
 * @phase Phase 3 - BUILD (Service Infrastructure)
 * @created 2025-11-17
 */

// ============================================================================
// SERVICE FACTORY (Primary API)
// ============================================================================

export { ServiceFactory } from './ServiceFactory'

// ============================================================================
// SERVICE PROVIDER (DI Container)
// ============================================================================

export {
  ServiceProvider,
  createMockServiceProvider,
  createRealServiceProvider,
  createHybridServiceProvider
} from './ServiceProvider'

// ============================================================================
// TYPES & ENUMS
// ============================================================================

export { ServiceMode, ServiceName } from './ServiceProvider'
export type { ServiceConfig, ServiceOptions } from './ServiceProvider'

// ============================================================================
// MOCK SERVICES (Phase 3)
// ============================================================================

export {
  MockInputValidationService,
  MockRhymeAnalysisService,
  MockSyllableCountingService,
  MockSongGenerationService,
  MockCritiqueEngineService,
  MockRevisionEngineService,
  MockSunoFormatterService,
  MockExportService,
  MockHistoryService,
  MockAudioAnalysisService
} from './mock'

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Initialize with mock services (Phase 3-4)
 *
 * ```typescript
 * import { ServiceFactory, ServiceMode } from './services'
 *
 * // Initialize
 * await ServiceFactory.initialize({ mode: ServiceMode.MOCK })
 *
 * // Use services
 * const validator = ServiceFactory.getInputValidationService()
 * const result = await validator.validate({ prompt: "Write a love song" })
 * ```
 */

/**
 * Example 2: Initialize with real services (Phase 5)
 *
 * ```typescript
 * import { ServiceFactory, ServiceMode } from './services'
 * import { createGeminiProvider } from './providers'
 *
 * // Create model provider
 * const modelProvider = createGeminiProvider({
 *   provider: 'gemini',
 *   apiKey: process.env.GEMINI_API_KEY
 * })
 *
 * // Initialize
 * await ServiceFactory.initialize({
 *   mode: ServiceMode.REAL,
 *   modelProvider
 * })
 *
 * // Use services (same API as mock!)
 * const generator = ServiceFactory.getSongGenerationService()
 * const result = await generator.generate({ prompt: validatedPrompt })
 * ```
 */

/**
 * Example 3: Hybrid mode (some mock, some real)
 *
 * ```typescript
 * import { ServiceFactory, ServiceMode, ServiceName } from './services'
 *
 * // Initialize with hybrid mode
 * await ServiceFactory.initialize({
 *   mode: ServiceMode.HYBRID,
 *   modelProvider: myProvider,
 *   realServices: [
 *     ServiceName.SONG_GENERATION,  // Use real
 *     ServiceName.CRITIQUE_ENGINE    // Use real
 *   ]
 *   // All others will use mock
 * })
 * ```
 */
