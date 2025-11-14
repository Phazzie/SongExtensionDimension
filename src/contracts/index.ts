/**
 * @fileoverview Contracts Index - Central export point for all contracts
 * @purpose Export all seam contracts and types from single location
 * @updated 2025-11-14
 */

// ============================================================================
// COMMON TYPES (Foundation)
// ============================================================================
export * from './types/common'
export * from './types/song'

// ============================================================================
// SEAM CONTRACTS (Wave 1: Foundation - No Dependencies)
// ============================================================================

// Seam #1: Input Validation
export * from './InputValidation'

// Seam #6: Rhyme Analysis
export * from './RhymeAnalysis'

// Seam #7: Syllable Counting
export * from './SyllableCounting'

// ============================================================================
// SEAM CONTRACTS (Wave 2: Core Generation)
// ============================================================================

// Seam #2: Song Generation
export * from './SongGeneration'

// Seam #3: Critique Engine
export * from './CritiqueEngine'

// ============================================================================
// SEAM CONTRACTS (Wave 3: Improvement Loop)
// ============================================================================

// Seam #4: Revision Engine
export * from './RevisionEngine'

// ============================================================================
// SEAM CONTRACTS (Wave 4: Output & Persistence)
// ============================================================================

// Seam #5: Suno Formatter
export * from './SunoFormatter'

// Seam #9: Export
export * from './Export'

// Seam #10: History
export * from './History'

// ============================================================================
// SEAM CONTRACTS (Wave 5: Advanced Features)
// ============================================================================

// Seam #8: Gemini Audio
export * from './GeminiAudio'

// ============================================================================
// CONTRACT VERSION
// ============================================================================

export const CONTRACTS_VERSION = '1.0.0'
export const CONTRACTS_UPDATED = '2025-11-14'

/**
 * Contract metadata for validation and versioning
 */
export interface ContractMetadata {
  readonly version: string
  readonly updated: string
  readonly seams: readonly string[]
  readonly immutable: boolean
}

/**
 * All contract metadata
 */
export const CONTRACT_METADATA: ContractMetadata = {
  version: CONTRACTS_VERSION,
  updated: CONTRACTS_UPDATED,
  seams: [
    'InputValidation',
    'RhymeAnalysis',
    'SyllableCounting',
    'SongGeneration',
    'CritiqueEngine',
    'RevisionEngine',
    'SunoFormatter',
    'Export',
    'History',
    'GeminiAudio'
  ],
  immutable: true
} as const
