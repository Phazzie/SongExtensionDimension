/**
 * @fileoverview Service Factory
 * @purpose Create and wire up service instances (mock or real)
 * @updated 2025-11-17
 */

import type {
  IInputValidationService,
  ISongGenerationService,
  ICritiqueEngineService,
  IRevisionEngineService,
  IExportService,
  IHistoryService,
  IRhymeAnalysisService,
  ISyllableCountingService,
  IGeminiAudioService,
  ISunoFormatterService
} from '../contracts'

import {
  MockInputValidationService,
  MockSongGenerationService,
  MockCritiqueEngineService,
  MockRevisionEngineService,
  MockExportService,
  MockHistoryService,
  MockRhymeAnalysisService,
  MockSyllableCountingService,
  MockAudioAnalysisService,
  MockSunoFormatterService
} from './mock'

/**
 * All services available in the extension
 */
export interface Services {
  readonly inputValidation: IInputValidationService
  readonly songGeneration: ISongGenerationService
  readonly critiqueEngine: ICritiqueEngineService
  readonly revisionEngine: IRevisionEngineService
  readonly export: IExportService
  readonly history: IHistoryService
  readonly rhymeAnalysis: IRhymeAnalysisService
  readonly syllableCounting: ISyllableCountingService
  readonly geminiAudio: IGeminiAudioService
  readonly sunoFormatter: ISunoFormatterService
}

/**
 * Initialize all services
 * In Phase 5 (real implementation), this will switch between mock and real services
 * based on configuration
 */
export async function initializeServices(): Promise<Services> {
  // Currently using mock services (Phase 3-4)
  // In Phase 5, this will conditionally load real services based on config

  const services: Services = {
    inputValidation: new MockInputValidationService(),
    songGeneration: new MockSongGenerationService(),
    critiqueEngine: new MockCritiqueEngineService(),
    revisionEngine: new MockRevisionEngineService(),
    export: new MockExportService(),
    history: new MockHistoryService(),
    rhymeAnalysis: new MockRhymeAnalysisService(),
    syllableCounting: new MockSyllableCountingService(),
    geminiAudio: new MockAudioAnalysisService(),
    sunoFormatter: new MockSunoFormatterService()
  }

  // Log initialization
  console.log('All services initialized')

  return services
}

/**
 * Get a specific service by name (for testing/debugging)
 */
export function getService(services: Services, serviceName: string): unknown {
  const key = serviceName as keyof Services
  return services[key]
}
