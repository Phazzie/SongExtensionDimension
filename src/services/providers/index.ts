/**
 * @fileoverview AI Provider Barrel Exports
 * @purpose Centralized exports for all AI provider implementations and utilities
 * @phase Phase 5 - INTEGRATE (Real Services)
 * @created 2025-11-17
 *
 * This module exports:
 * - Provider implementations (GrokProvider, MockProvider)
 * - Provider factory (createProvider)
 * - Provider utilities (validation, defaults)
 * - Type re-exports from contracts
 */

// ============================================================================
// PROVIDER IMPLEMENTATIONS
// ============================================================================

export { GrokProvider } from './GrokProvider'
export type { GrokProviderConfig } from './GrokProvider'

export { MockProvider } from './MockProvider'

// ============================================================================
// PROVIDER FACTORY
// ============================================================================

export {
  createProvider,
  validateProviderConfig,
  getDefaultConfig
} from './createProvider'

// ============================================================================
// CONTRACT RE-EXPORTS
// ============================================================================

export type {
  IModelProvider,
  ModelCapabilities,
  GenerationRequest,
  GenerationResponse,
  AnalysisRequest,
  AnalysisResponse,
  ModelProviderConfig,
  CreateModelProvider
} from '../../contracts/providers/IModelProvider'
