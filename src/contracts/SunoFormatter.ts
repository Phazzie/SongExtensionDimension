/**
 * @fileoverview Suno Formatter Contract
 * @purpose Transform songs into Suno-compatible format with meta-tags
 * @dataFlow Song → Platform-specific Formatting → SunoFormattedText
 * @boundary Internal song structure → Suno platform format (v4.0, v4.5, v5.0)
 * @requirement Generate valid Suno format with meta-tags and character limits
 * @updated 2025-11-14
 *
 * @example
 * const formatter = new MockSunoFormatterService()
 * const result = await formatter.formatSong(song, {
 *   version: 'v5.0',
 *   includeTags: true,
 *   style: { genre: 'rock', tempo: 'mid' }
 * })
 * if (result.success) {
 *   console.log(result.data.formattedText)
 *   console.log(result.data.characterCount) // Must be ≤ 3000
 * }
 */

import type { ServiceResponse } from './types/common'
import type { Song, TempoType, VocalStyle } from './types/song'

/**
 * Suno version
 */
export enum SunoVersion {
  V4_0 = 'v4.0',
  V4_5 = 'v4.5',
  V5_0 = 'v5.0'
}

/**
 * Suno format result
 */
export interface SunoFormatResult {
  readonly formattedText: string
  readonly characterCount: number
  readonly version: SunoVersion
  readonly appliedTags: readonly string[]
  readonly validation: SunoValidationResult
  readonly suggestions: readonly TagSuggestion[]
}

/**
 * Suno validation result
 */
export interface SunoValidationResult {
  readonly valid: boolean
  readonly errors: readonly string[]
  readonly warnings: readonly string[]
  readonly characterLimit: number
  readonly withinLimit: boolean
}

/**
 * Format options
 */
export interface FormatOptions {
  readonly version: SunoVersion
  readonly includeTags: boolean
  readonly style?: StylePreferences
  readonly customTags?: readonly string[]
  readonly trimToFit?: boolean // Auto-trim if exceeds character limit
  readonly includeMetadata?: boolean
}

/**
 * Style preferences for meta-tags
 */
export interface StylePreferences {
  readonly genre?: string
  readonly tempo?: TempoType
  readonly mood?: string
  readonly vocalStyle?: VocalStyle
  readonly harmony?: HarmonyPreference
  readonly effects?: readonly EffectTag[]
  readonly dynamics?: readonly DynamicTag[]
}

/**
 * Harmony preference
 */
export enum HarmonyPreference {
  NONE = 'none',
  TWO_PART = '2-part',
  THREE_PART = '3-part',
  GOSPEL = 'gospel',
  BACKING = 'backing'
}

/**
 * Effect tag
 */
export enum EffectTag {
  AUTOTUNE = 'autotune',
  VOCODER = 'vocoder',
  REVERB = 'reverb',
  DELAY = 'delay',
  DISTORTION = 'distortion',
  WHISPER = 'whisper'
}

/**
 * Dynamic tag (v5.0 feature)
 */
export enum DynamicTag {
  CRESCENDO = 'crescendo',
  DIMINUENDO = 'diminuendo',
  SFORZANDO = 'sforzando',
  FADE_IN = 'fade-in',
  FADE_OUT = 'fade-out'
}

/**
 * Section meta-tags
 */
export const SECTION_TAGS = {
  INTRO: '[Intro]',
  VERSE: '[Verse]',
  VERSE_NUMBERED: (n: number) => `[Verse ${n}]`,
  CHORUS: '[Chorus]',
  PRE_CHORUS: '[Pre-Chorus]',
  BRIDGE: '[Bridge]',
  OUTRO: '[Outro]',
  DROP: '[Drop]',
  BREAK: '[Break]',
  INSTRUMENTAL: '[Instrumental]'
} as const

/**
 * Style meta-tags
 */
export interface StyleTags {
  readonly genre?: string        // [genre: rock]
  readonly tempo?: string        // [tempo: mid]
  readonly mood?: string         // [mood: dark]
  readonly vocalStyle?: string   // [vocal-style: raspy]
  readonly harmony?: string      // [harmony: 3-part]
}

/**
 * Advanced meta-tags (v5.0 specific)
 */
export interface AdvancedTags {
  readonly beatDrop?: boolean         // [beat-drop]
  readonly keyChange?: KeyChange      // [key-change: up-step]
  readonly tempoChange?: TempoChange  // [tempo-change: half-time]
  readonly vocalEffects?: EffectTag   // [vocal-effects: autotune]
  readonly dynamic?: DynamicTag       // [dynamic: crescendo]
}

/**
 * Key change options
 */
export enum KeyChange {
  UP_STEP = 'up-step',
  DOWN_STEP = 'down-step',
  UP_HALF = 'up-half',
  DOWN_HALF = 'down-half',
  MODULATION = 'modulation'
}

/**
 * Tempo change options
 */
export enum TempoChange {
  DOUBLE_TIME = 'double-time',
  HALF_TIME = 'half-time',
  ACCELERANDO = 'accelerando',
  RITARDANDO = 'ritardando'
}

/**
 * Tag suggestion
 */
export interface TagSuggestion {
  readonly section: string
  readonly tagType: TagType
  readonly tag: string
  readonly reason: string
  readonly confidence: number
}

/**
 * Tag type
 */
export enum TagType {
  SECTION = 'section',
  STYLE = 'style',
  EFFECT = 'effect',
  DYNAMIC = 'dynamic',
  STRUCTURAL = 'structural'
}

/**
 * Character limit configuration
 */
export interface CharacterLimits {
  readonly v4_0: number
  readonly v4_5: number
  readonly v5_0: number
  readonly maxSections: number
  readonly maxLineLength: number
}

/**
 * Default character limits
 */
export const CHARACTER_LIMITS: CharacterLimits = {
  v4_0: 3000,
  v4_5: 3000,
  v5_0: 3000,
  maxSections: 20,
  maxLineLength: 120
} as const

/**
 * Format enhancement suggestion
 */
export interface EnhancementSuggestion {
  readonly type: EnhancementType
  readonly section: string
  readonly suggestion: string
  readonly example: string
  readonly impact: string
}

/**
 * Enhancement type
 */
export enum EnhancementType {
  ADD_INTRO = 'add_intro',
  ADD_OUTRO = 'add_outro',
  ADD_BRIDGE = 'add_bridge',
  ADD_DROP = 'add_drop',
  ADD_INSTRUMENTAL = 'add_instrumental',
  IMPROVE_DYNAMICS = 'improve_dynamics',
  ADD_VOCAL_VARIETY = 'add_vocal_variety',
  ENHANCE_STRUCTURE = 'enhance_structure'
}

/**
 * Trim strategy (when exceeding character limit)
 */
export enum TrimStrategy {
  REMOVE_METADATA = 'remove_metadata',
  SHORTEN_LINES = 'shorten_lines',
  REMOVE_SECTION = 'remove_section',
  SIMPLIFY_TAGS = 'simplify_tags'
}

/**
 * Trim result
 */
export interface TrimResult {
  readonly originalLength: number
  readonly trimmedLength: number
  readonly removedContent: readonly string[]
  readonly strategy: TrimStrategy
}

/**
 * Error codes for Suno formatter
 */
export enum SunoFormatterErrorCode {
  INVALID_SONG = 'INVALID_SONG',
  EXCEEDS_CHARACTER_LIMIT = 'EXCEEDS_CHARACTER_LIMIT',
  TOO_MANY_SECTIONS = 'TOO_MANY_SECTIONS',
  INVALID_TAG_SYNTAX = 'INVALID_TAG_SYNTAX',
  INCOMPATIBLE_VERSION = 'INCOMPATIBLE_VERSION',
  LINE_TOO_LONG = 'LINE_TOO_LONG',
  FORMAT_FAILED = 'FORMAT_FAILED'
}

/**
 * Suno Formatter Service Interface
 *
 * This is the contract that both mock and real implementations must follow.
 * DO NOT modify this interface once implementation starts (create v2 instead).
 */
export interface ISunoFormatterService {
  /**
   * Format song into Suno-compatible text with meta-tags
   *
   * @param song - Song to format
   * @param options - Format options including version and style
   * @returns Promise with formatted result or error
   * @throws Never throws - always returns ServiceResponse
   */
  formatSong(
    song: Song,
    options: FormatOptions
  ): Promise<ServiceResponse<SunoFormatResult>>

  /**
   * Validate formatted text against Suno requirements
   *
   * @param formattedText - Text to validate
   * @param version - Suno version to validate against
   * @returns Promise with validation result
   * @throws Never throws - always returns ServiceResponse
   */
  validateFormat(
    formattedText: string,
    version: SunoVersion
  ): Promise<ServiceResponse<SunoValidationResult>>

  /**
   * Suggest meta-tags based on song content and style
   *
   * @param song - Song to analyze for tag suggestions
   * @param style - Optional style preferences
   * @returns Promise with tag suggestions or error
   * @throws Never throws - always returns ServiceResponse
   */
  suggestTags(
    song: Song,
    style?: StylePreferences
  ): Promise<ServiceResponse<readonly TagSuggestion[]>>

  /**
   * Suggest enhancements to improve Suno output
   *
   * @param song - Song to analyze
   * @returns Promise with enhancement suggestions
   * @throws Never throws - always returns ServiceResponse
   */
  suggestEnhancements(
    song: Song
  ): Promise<ServiceResponse<readonly EnhancementSuggestion[]>>

  /**
   * Convert song from one Suno version format to another
   *
   * @param formattedText - Text in original version format
   * @param fromVersion - Source version
   * @param toVersion - Target version
   * @returns Promise with converted text or error
   * @throws Never throws - always returns ServiceResponse
   */
  convertVersion(
    formattedText: string,
    fromVersion: SunoVersion,
    toVersion: SunoVersion
  ): Promise<ServiceResponse<string>>

  /**
   * Trim song to fit within character limit
   *
   * @param song - Song to trim
   * @param targetLimit - Target character limit
   * @param strategy - Trim strategy to use
   * @returns Promise with trimmed song and trim result
   * @throws Never throws - always returns ServiceResponse
   */
  trimToFit(
    song: Song,
    targetLimit: number,
    strategy: TrimStrategy
  ): Promise<ServiceResponse<{ song: Song; trimResult: TrimResult }>>

  /**
   * Apply meta-tags to specific section
   *
   * @param text - Section text
   * @param sectionType - Type of section
   * @param tags - Tags to apply
   * @returns Promise with tagged text
   * @throws Never throws - always returns ServiceResponse
   */
  applyMetaTags(
    text: string,
    sectionType: string,
    tags: readonly string[]
  ): Promise<ServiceResponse<string>>
}

/**
 * Helper to get character limit for version
 */
export function getCharacterLimit(version: SunoVersion): number {
  switch (version) {
    case SunoVersion.V4_0:
      return CHARACTER_LIMITS.v4_0
    case SunoVersion.V4_5:
      return CHARACTER_LIMITS.v4_5
    case SunoVersion.V5_0:
      return CHARACTER_LIMITS.v5_0
  }
}

/**
 * Helper to check if version supports advanced tags
 */
export function supportsAdvancedTags(version: SunoVersion): boolean {
  return version === SunoVersion.V5_0
}

/**
 * Helper to format style tag
 */
export function formatStyleTag(key: string, value: string): string {
  return `[${key}: ${value}]`
}

/**
 * Helper to format section tag
 */
export function formatSectionTag(type: string, number?: number): string {
  return number ? `[${type} ${number}]` : `[${type}]`
}

/**
 * Helper to count characters in formatted text
 */
export function countCharacters(text: string): number {
  return text.length
}

/**
 * Helper to validate character count
 */
export function isWithinLimit(text: string, version: SunoVersion): boolean {
  return countCharacters(text) <= getCharacterLimit(version)
}
