/**
 * @fileoverview Song Generation Contract
 * @purpose Generate complete songs from validated prompts using AI
 * @dataFlow ValidatedPrompt → AI Generation → Song
 * @boundary Application logic → AI generation service (Gemini API)
 * @requirement Generate professional-quality song lyrics with structure
 * @updated 2025-11-14
 *
 * @example
 * const generator = new MockSongGenerationService()
 * const result = await generator.generate({
 *   prompt: validatedPrompt,
 *   style: { genre: "rock", mood: "melancholic" }
 * })
 * if (result.success) {
 *   console.log(result.data.song.title)
 *   console.log(result.data.song.verses)
 * }
 */

import type { ServiceResponse } from './types/common'
import type {
  Song,
  SongId,
  VerseId,
  ChorusId,
  BridgeId,
  SectionId,
  SectionType,
  StructureConstraints,
  StyleConfig
} from './types/song'
import type { ValidatedPrompt } from './InputValidation'

/**
 * Song generation input
 */
export interface GenerateSongInput {
  readonly prompt: ValidatedPrompt
  readonly style?: StyleConfig
  readonly constraints?: StructureConstraints
  readonly audioContext?: AudioGenerationContext
  readonly voiceProfile?: VoiceProfile
}

/**
 * Audio generation context (from Gemini audio analysis)
 */
export interface AudioGenerationContext {
  readonly rhythm?: string
  readonly emotion?: string
  readonly melody?: string
  readonly tempo?: string
  readonly mood?: string
  readonly suggestions?: readonly string[]
}

/**
 * Voice profile for maintaining consistency
 */
export interface VoiceProfile {
  readonly vocabulary: readonly string[]
  readonly phraseTendencies: readonly string[]
  readonly perspectivePOV: PerspectiveType
  readonly toneCharacteristics: readonly string[]
  readonly avoidances: readonly string[] // Words/phrases to avoid
}

/**
 * Perspective type
 */
export enum PerspectiveType {
  FIRST_PERSON = 'first_person',       // I, me, my
  SECOND_PERSON = 'second_person',     // you, your
  THIRD_PERSON = 'third_person',       // he, she, they
  OMNISCIENT = 'omniscient',           // mixed perspective
  CHARACTER = 'character'              // specific character voice
}

/**
 * Song generation output
 */
export interface GenerateSongOutput {
  readonly song: Song
  readonly alternatives?: readonly AlternativeSuggestion[]
  readonly confidence: number
  readonly generationMetadata: GenerationMetadata
}

/**
 * Alternative suggestion for sections
 */
export interface AlternativeSuggestion {
  readonly sectionType: SectionType
  readonly sectionId: SectionId | VerseId | ChorusId | BridgeId
  readonly alternatives: readonly string[]
  readonly reason: string
}

/**
 * Generation metadata
 */
export interface GenerationMetadata {
  readonly model: string
  readonly tokensUsed: number
  readonly generationTime: number // milliseconds
  readonly iterations: number
  readonly promptVersion: string
  readonly timestamp: Date
}

/**
 * Section regeneration input
 */
export interface RegenerateSectionInput {
  readonly songId: SongId
  readonly sectionType: SectionType
  readonly sectionId?: SectionId
  readonly constraints?: SectionRegenerationConstraints
  readonly preserveVoice: boolean
}

/**
 * Section regeneration constraints
 */
export interface SectionRegenerationConstraints {
  readonly mustRhymeWith?: readonly string[]
  readonly mustContainThemes?: readonly string[]
  readonly targetSyllableCount?: number
  readonly targetMood?: string
  readonly avoidPhrases?: readonly string[]
}

/**
 * Draft save input
 */
export interface SaveDraftInput {
  readonly song: Song
  readonly draftName?: string
  readonly tags?: readonly string[]
  readonly notes?: string
}

/**
 * Draft save output
 */
export interface SaveDraftOutput {
  readonly draftId: string
  readonly savedAt: Date
  readonly version: number
}

/**
 * Song generation options
 */
export interface GenerationOptions {
  readonly temperature?: number // 0-1, creativity level
  readonly maxIterations?: number
  readonly qualityThreshold?: number
  readonly allowExperimental?: boolean
  readonly preserveStructure?: boolean
  readonly enforceRhyme?: boolean
}

/**
 * Error codes for song generation
 */
export enum SongGenerationErrorCode {
  INVALID_PROMPT = 'INVALID_PROMPT',
  GENERATION_FAILED = 'GENERATION_FAILED',
  API_TIMEOUT = 'API_TIMEOUT',
  API_ERROR = 'API_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INAPPROPRIATE_CONTENT = 'INAPPROPRIATE_CONTENT',
  INSUFFICIENT_QUALITY = 'INSUFFICIENT_QUALITY',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  SONG_NOT_FOUND = 'SONG_NOT_FOUND',
  SAVE_FAILED = 'SAVE_FAILED'
}

/**
 * Song Generation Service Interface
 *
 * This is the contract that both mock and real implementations must follow.
 * DO NOT modify this interface once implementation starts (create v2 instead).
 */
export interface ISongGenerationService {
  /**
   * Generate a complete song from a validated prompt
   *
   * @param input - Song generation input with prompt and options
   * @param options - Optional generation options
   * @returns Promise with generated song or error
   * @throws Never throws - always returns ServiceResponse
   */
  generate(
    input: GenerateSongInput,
    options?: GenerationOptions
  ): Promise<ServiceResponse<GenerateSongOutput>>

  /**
   * Regenerate a specific section of a song
   *
   * @param input - Section regeneration input
   * @param options - Optional generation options
   * @returns Promise with updated song or error
   * @throws Never throws - always returns ServiceResponse
   */
  regenerateSection(
    input: RegenerateSectionInput,
    options?: GenerationOptions
  ): Promise<ServiceResponse<Song>>

  /**
   * Generate alternative versions of specific lines
   *
   * @param songId - ID of song to generate alternatives for
   * @param lineNumbers - Line numbers to generate alternatives for
   * @param count - Number of alternatives to generate (default: 3)
   * @returns Promise with alternatives or error
   * @throws Never throws - always returns ServiceResponse
   */
  generateAlternatives(
    songId: SongId,
    lineNumbers: readonly number[],
    count?: number
  ): Promise<ServiceResponse<readonly string[]>>

  /**
   * Save song as draft for later editing
   *
   * @param input - Draft save input
   * @returns Promise with save confirmation or error
   * @throws Never throws - always returns ServiceResponse
   */
  saveDraft(
    input: SaveDraftInput
  ): Promise<ServiceResponse<SaveDraftOutput>>

  /**
   * Load a previously saved draft
   *
   * @param draftId - ID of draft to load
   * @returns Promise with song or error
   * @throws Never throws - always returns ServiceResponse
   */
  loadDraft(
    draftId: string
  ): Promise<ServiceResponse<Song>>

  /**
   * Extract voice profile from existing song
   * Used to maintain consistency in revisions
   *
   * @param song - Song to extract voice profile from
   * @returns Promise with voice profile or error
   * @throws Never throws - always returns ServiceResponse
   */
  extractVoiceProfile(
    song: Song
  ): Promise<ServiceResponse<VoiceProfile>>
}

/**
 * Helper to create default generation options
 */
export function createDefaultGenerationOptions(): GenerationOptions {
  return {
    temperature: 0.7,
    maxIterations: 3,
    qualityThreshold: 0.75,
    allowExperimental: false,
    preserveStructure: true,
    enforceRhyme: true
  }
}

/**
 * Helper to validate generation input
 */
export function isValidGenerationInput(input: GenerateSongInput): boolean {
  return (
    input.prompt !== undefined &&
    input.prompt.prompt.length > 0
  )
}

/**
 * Helper to merge generation options with defaults
 */
export function mergeGenerationOptions(
  options?: GenerationOptions
): GenerationOptions {
  const defaults = createDefaultGenerationOptions()
  return {
    ...defaults,
    ...options
  }
}
