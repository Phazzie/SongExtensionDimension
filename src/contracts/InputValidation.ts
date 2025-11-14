/**
 * @fileoverview Input Validation Contract
 * @purpose Validate and sanitize user input before song generation
 * @dataFlow RawUserInput → ValidatedPrompt
 * @boundary User interaction layer → Application logic layer
 * @requirement Ensure all user input is safe, valid, and well-formed
 * @updated 2025-11-14
 *
 * @example
 * const validator = new MockInputValidationService()
 * const result = await validator.validate({
 *   prompt: "Write a song about heartbreak",
 *   context: { genre: "rock", mood: "melancholic" }
 * })
 * if (result.success) {
 *   console.log(result.data.validatedPrompt)
 * }
 */

import type { ServiceResponse } from './types/common'
import type { StructureConstraints, StyleConfig } from './types/song'

/**
 * Branded type for validated prompt IDs
 */
export type PromptId = string & { readonly __brand: 'PromptId' }

/**
 * Raw user input (unvalidated)
 */
export interface RawPromptInput {
  readonly prompt: string
  readonly context?: PromptContext
  readonly constraints?: StructureConstraints
  readonly style?: StyleConfig
}

/**
 * Context for song generation
 */
export interface PromptContext {
  readonly genre?: string
  readonly mood?: string
  readonly theme?: string
  readonly referenceArtist?: string
  readonly targetAudience?: string
}

/**
 * Validated and sanitized prompt (safe to use)
 */
export interface ValidatedPrompt {
  readonly id: PromptId
  readonly prompt: string
  readonly context: PromptContext
  readonly constraints: StructureConstraints
  readonly style: StyleConfig
  readonly sanitized: boolean
  readonly validatedAt: Date
}

/**
 * Validation result with details
 */
export interface ValidationResult {
  readonly validatedPrompt: ValidatedPrompt
  readonly warnings: readonly ValidationWarning[]
  readonly modifications: readonly string[]
}

/**
 * Validation warning (non-blocking)
 */
export interface ValidationWarning {
  readonly field: string
  readonly message: string
  readonly suggestion?: string
}

/**
 * Error codes for input validation
 */
export enum InputValidationErrorCode {
  EMPTY_PROMPT = 'EMPTY_PROMPT',
  PROMPT_TOO_SHORT = 'PROMPT_TOO_SHORT',
  PROMPT_TOO_LONG = 'PROMPT_TOO_LONG',
  INVALID_GENRE = 'INVALID_GENRE',
  INVALID_CONSTRAINTS = 'INVALID_CONSTRAINTS',
  CONFLICTING_CONSTRAINTS = 'CONFLICTING_CONSTRAINTS',
  UNSAFE_CONTENT = 'UNSAFE_CONTENT',
  VALIDATION_FAILED = 'VALIDATION_FAILED'
}

/**
 * Supported genres
 */
export const SUPPORTED_GENRES = [
  'rock',
  'alternative',
  'pop',
  'hip-hop',
  'rap',
  'country',
  'folk',
  'blues',
  'jazz',
  'electronic',
  'metal',
  'punk',
  'indie',
  'r&b',
  'soul',
  'funk',
  'reggae',
  'latin',
  'classical',
  'experimental'
] as const

export type SupportedGenre = typeof SUPPORTED_GENRES[number]

/**
 * Supported moods
 */
export const SUPPORTED_MOODS = [
  'happy',
  'sad',
  'angry',
  'melancholic',
  'energetic',
  'calm',
  'romantic',
  'dark',
  'uplifting',
  'nostalgic',
  'aggressive',
  'peaceful',
  'anxious',
  'confident',
  'mysterious',
  'playful',
  'serious',
  'introspective'
] as const

export type SupportedMood = typeof SUPPORTED_MOODS[number]

/**
 * Validation constraints
 */
export interface ValidationConstraints {
  readonly minPromptLength: number
  readonly maxPromptLength: number
  readonly minVerseCount: number
  readonly maxVerseCount: number
  readonly minLinesPerVerse: number
  readonly maxLinesPerVerse: number
  readonly minSyllablesPerLine: number
  readonly maxSyllablesPerLine: number
}

/**
 * Default validation constraints
 */
export const DEFAULT_VALIDATION_CONSTRAINTS: ValidationConstraints = {
  minPromptLength: 10,
  maxPromptLength: 1000,
  minVerseCount: 1,
  maxVerseCount: 10,
  minLinesPerVerse: 2,
  maxLinesPerVerse: 16,
  minSyllablesPerLine: 3,
  maxSyllablesPerLine: 20
} as const

/**
 * Input Validation Service Interface
 *
 * This is the contract that both mock and real implementations must follow.
 * DO NOT modify this interface once implementation starts (create v2 instead).
 */
export interface IInputValidationService {
  /**
   * Validate and sanitize user input
   *
   * @param input - Raw user input to validate
   * @returns Promise with validated prompt or error
   * @throws Never throws - always returns ServiceResponse
   */
  validate(input: RawPromptInput): Promise<ServiceResponse<ValidationResult>>

  /**
   * Check if a prompt is valid without full validation
   *
   * @param prompt - Prompt text to check
   * @returns Promise with boolean result
   * @throws Never throws - always returns ServiceResponse
   */
  isValid(prompt: string): Promise<ServiceResponse<boolean>>

  /**
   * Sanitize text content (remove unsafe characters/content)
   *
   * @param text - Text to sanitize
   * @returns Promise with sanitized text
   * @throws Never throws - always returns ServiceResponse
   */
  sanitize(text: string): Promise<ServiceResponse<string>>

  /**
   * Validate genre against supported list
   *
   * @param genre - Genre to validate
   * @returns Promise with validation result
   * @throws Never throws - always returns ServiceResponse
   */
  validateGenre(genre: string): Promise<ServiceResponse<boolean>>

  /**
   * Validate constraints for logical consistency
   *
   * @param constraints - Constraints to validate
   * @returns Promise with validation result and warnings
   * @throws Never throws - always returns ServiceResponse
   */
  validateConstraints(constraints: StructureConstraints): Promise<ServiceResponse<readonly ValidationWarning[]>>
}

/**
 * Helper function to create Prompt ID
 */
export function createPromptId(): PromptId {
  return `prompt_${Date.now()}_${Math.random().toString(36).substring(7)}` as PromptId
}

/**
 * Type guard for SupportedGenre
 */
export function isSupportedGenre(genre: string): genre is SupportedGenre {
  return SUPPORTED_GENRES.includes(genre as SupportedGenre)
}

/**
 * Type guard for SupportedMood
 */
export function isSupportedMood(mood: string): mood is SupportedMood {
  return SUPPORTED_MOODS.includes(mood as SupportedMood)
}
