/**
 * @fileoverview Rhyme Analysis Contract
 * @purpose Analyze rhyme patterns, quality, and provide rhyme suggestions
 * @dataFlow TextLines → PhoneticAnalysis → RhymeAnalysis
 * @boundary Raw text → Phonetic/prosodic analysis
 * @requirement Detect and evaluate rhyme quality for songwriting
 * @updated 2025-11-14
 *
 * @example
 * const analyzer = new MockRhymeAnalysisService()
 * const result = await analyzer.analyzeLines([
 *   "The night is dark and cold",
 *   "Your story left untold"
 * ])
 * if (result.success) {
 *   console.log(result.data.rhymeScheme) // "AA"
 *   console.log(result.data.quality) // "perfect"
 * }
 */

import type { ServiceResponse, QualityScore } from './types/common'
import type { RhymeScheme, RhymeSound } from './types/song'

/**
 * Rhyme analysis result
 */
export interface RhymeAnalysis {
  readonly lines: readonly AnalyzedLine[]
  readonly rhymeScheme: RhymeScheme
  readonly rhymePairs: readonly RhymePair[]
  readonly qualityScore: QualityScore
  readonly overallQuality: RhymeQuality
  readonly suggestions: readonly RhymeSuggestion[]
  readonly internalRhymes: readonly InternalRhyme[]
}

/**
 * Analyzed line with phonetic information
 */
export interface AnalyzedLine {
  readonly index: number
  readonly text: string
  readonly endSound: RhymeSound
  readonly phonetic: string
  readonly syllables: number
  readonly rhymesWith: readonly number[] // Indices of lines this rhymes with
  readonly internalRhymes: readonly InternalRhymeMatch[]
}

/**
 * Rhyme pair between two lines
 */
export interface RhymePair {
  readonly line1Index: number
  readonly line2Index: number
  readonly quality: RhymeQuality
  readonly confidence: number
  readonly type: RhymeType
  readonly sharedSound: RhymeSound
}

/**
 * Rhyme quality levels
 */
export enum RhymeQuality {
  PERFECT = 'perfect',       // Identical sounds (cat/hat)
  NEAR = 'near',             // Similar sounds (cat/cap)
  SLANT = 'slant',           // Consonance/assonance (cat/cut)
  FORCED = 'forced',         // Awkward word choice for rhyme
  WEAK = 'weak',             // Barely rhymes
  NONE = 'none'              // No rhyme
}

/**
 * Rhyme types
 */
export enum RhymeType {
  END_RHYME = 'end',         // Rhymes at line endings
  INTERNAL_RHYME = 'internal', // Rhymes within lines
  MULTI_SYLLABLE = 'multi',  // Multi-syllable rhymes
  IDENTICAL = 'identical',   // Same word (not a true rhyme)
  ASSONANCE = 'assonance',   // Vowel sounds match
  CONSONANCE = 'consonance', // Consonant sounds match
  ALLITERATION = 'alliteration' // Beginning sounds match
}

/**
 * Internal rhyme within a line
 */
export interface InternalRhyme {
  readonly lineIndex: number
  readonly words: readonly string[]
  readonly positions: readonly number[]
  readonly quality: RhymeQuality
}

/**
 * Internal rhyme match (word-level)
 */
export interface InternalRhymeMatch {
  readonly word: string
  readonly position: number
  readonly sound: RhymeSound
}

/**
 * Rhyme suggestion for improvement
 */
export interface RhymeSuggestion {
  readonly lineIndex: number
  readonly issue: string
  readonly currentWord: string
  readonly alternatives: readonly RhymeAlternative[]
  readonly improvement: string
}

/**
 * Alternative rhyming word
 */
export interface RhymeAlternative {
  readonly word: string
  readonly quality: RhymeQuality
  readonly syllables: number
  readonly commonality: number // How common/natural the word is (0-1)
  readonly preservesMeaning: boolean
}

/**
 * Rhyme dictionary lookup result
 */
export interface RhymeLookup {
  readonly word: string
  readonly perfectRhymes: readonly string[]
  readonly nearRhymes: readonly string[]
  readonly slantRhymes: readonly string[]
  readonly phonetic: string
  readonly syllableCount: number
}

/**
 * Rhyme pattern detection input
 */
export interface RhymePatternInput {
  readonly lines: readonly string[]
  readonly expectedScheme?: RhymeScheme
}

/**
 * Rhyme quality metrics
 */
export interface RhymeMetrics {
  readonly perfectRhymeCount: number
  readonly nearRhymeCount: number
  readonly forcedRhymeCount: number
  readonly noRhymeCount: number
  readonly internalRhymeCount: number
  readonly multiSyllableRhymeCount: number
  readonly averageQuality: QualityScore
}

/**
 * Error codes for rhyme analysis
 */
export enum RhymeAnalysisErrorCode {
  INSUFFICIENT_LINES = 'INSUFFICIENT_LINES',
  INVALID_TEXT = 'INVALID_TEXT',
  PHONETIC_ANALYSIS_FAILED = 'PHONETIC_ANALYSIS_FAILED',
  DICTIONARY_LOOKUP_FAILED = 'DICTIONARY_LOOKUP_FAILED',
  UNSUPPORTED_LANGUAGE = 'UNSUPPORTED_LANGUAGE',
  ANALYSIS_FAILED = 'ANALYSIS_FAILED'
}

/**
 * Rhyme Analysis Service Interface
 *
 * This is the contract that both mock and real implementations must follow.
 * DO NOT modify this interface once implementation starts (create v2 instead).
 */
export interface IRhymeAnalysisService {
  /**
   * Analyze rhyme patterns in a set of lines
   *
   * @param lines - Array of text lines to analyze
   * @param expectedScheme - Optional expected rhyme scheme to validate against
   * @returns Promise with rhyme analysis or error
   * @throws Never throws - always returns ServiceResponse
   */
  analyzeLines(
    lines: readonly string[],
    expectedScheme?: RhymeScheme
  ): Promise<ServiceResponse<RhymeAnalysis>>

  /**
   * Find rhymes for a specific word
   *
   * @param word - Word to find rhymes for
   * @param maxResults - Maximum number of results to return (default: 50)
   * @returns Promise with rhyme lookup results
   * @throws Never throws - always returns ServiceResponse
   */
  findRhymes(
    word: string,
    maxResults?: number
  ): Promise<ServiceResponse<RhymeLookup>>

  /**
   * Check if two words rhyme
   *
   * @param word1 - First word
   * @param word2 - Second word
   * @returns Promise with rhyme quality assessment
   * @throws Never throws - always returns ServiceResponse
   */
  checkRhyme(
    word1: string,
    word2: string
  ): Promise<ServiceResponse<RhymeQuality>>

  /**
   * Detect rhyme scheme pattern
   *
   * @param lines - Lines to analyze for pattern
   * @returns Promise with detected rhyme scheme
   * @throws Never throws - always returns ServiceResponse
   */
  detectScheme(
    lines: readonly string[]
  ): Promise<ServiceResponse<RhymeScheme>>

  /**
   * Get quality metrics for rhyme analysis
   *
   * @param analysis - Rhyme analysis to get metrics for
   * @returns Promise with rhyme quality metrics
   * @throws Never throws - always returns ServiceResponse
   */
  getMetrics(
    analysis: RhymeAnalysis
  ): Promise<ServiceResponse<RhymeMetrics>>

  /**
   * Suggest improvements for weak or forced rhymes
   *
   * @param lines - Lines with rhyme issues
   * @returns Promise with improvement suggestions
   * @throws Never throws - always returns ServiceResponse
   */
  suggestImprovements(
    lines: readonly string[]
  ): Promise<ServiceResponse<readonly RhymeSuggestion[]>>
}

/**
 * Helper to determine if rhyme quality is acceptable
 */
export function isAcceptableRhyme(quality: RhymeQuality): boolean {
  return quality === RhymeQuality.PERFECT ||
         quality === RhymeQuality.NEAR ||
         quality === RhymeQuality.SLANT
}

/**
 * Helper to determine if rhyme is problematic
 */
export function isProblematicRhyme(quality: RhymeQuality): boolean {
  return quality === RhymeQuality.FORCED ||
         quality === RhymeQuality.WEAK ||
         quality === RhymeQuality.NONE
}

/**
 * Helper to score rhyme quality
 */
export function scoreRhymeQuality(quality: RhymeQuality): number {
  switch (quality) {
    case RhymeQuality.PERFECT:
      return 100
    case RhymeQuality.NEAR:
      return 85
    case RhymeQuality.SLANT:
      return 70
    case RhymeQuality.WEAK:
      return 40
    case RhymeQuality.FORCED:
      return 20
    case RhymeQuality.NONE:
      return 0
  }
}
