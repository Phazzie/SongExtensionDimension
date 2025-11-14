/**
 * @fileoverview Syllable Counting Contract
 * @purpose Analyze syllable counts, stress patterns, and rhythm
 * @dataFlow TextLines → ProsdicAnalysis → SyllableAnalysis
 * @boundary Raw text → Prosodic/rhythmic analysis
 * @requirement Ensure consistent meter and flow in lyrics
 * @updated 2025-11-14
 *
 * @example
 * const analyzer = new MockSyllableCountingService()
 * const result = await analyzer.analyzeLines([
 *   "The night descends upon the weary town"
 * ])
 * if (result.success) {
 *   console.log(result.data.lines[0].syllableCount) // 10
 *   console.log(result.data.lines[0].stressPattern) // "x/x/x/x/x/"
 *   console.log(result.data.meter) // MeterType.IAMBIC
 * }
 */

import type { ServiceResponse, QualityScore, Issue } from './types/common'
import type { StressPattern, MeterType } from './types/song'

/**
 * Syllable analysis result
 */
export interface SyllableAnalysis {
  readonly lines: readonly AnalyzedLineMetrics[]
  readonly totalSyllables: number
  readonly averageSyllablesPerLine: number
  readonly syllablePattern: readonly number[]
  readonly consistency: QualityScore
  readonly meter?: MeterType
  readonly rhythmIssues: readonly RhythmIssue[]
  readonly suggestions: readonly RhythmSuggestion[]
}

/**
 * Analyzed line with syllable and stress information
 */
export interface AnalyzedLineMetrics {
  readonly index: number
  readonly text: string
  readonly syllableCount: number
  readonly words: readonly WordMetrics[]
  readonly stressPattern: StressPattern
  readonly meter?: MeterType
  readonly flowScore: QualityScore
  readonly breaks: readonly RhythmBreak[]
}

/**
 * Word-level metrics
 */
export interface WordMetrics {
  readonly word: string
  readonly syllables: number
  readonly stresses: readonly Stress[]
  readonly phonetic: string
  readonly position: number
}

/**
 * Stress type
 */
export enum Stress {
  UNSTRESSED = 'unstressed',     // x
  STRESSED = 'stressed',         // /
  SECONDARY = 'secondary',       // \
  AMBIGUOUS = 'ambiguous'        // ?
}

/**
 * Rhythm issue
 */
export interface RhythmIssue {
  readonly lineIndex: number
  readonly type: RhythmIssueType
  readonly location: number
  readonly description: string
  readonly severity: 'critical' | 'major' | 'minor'
}

/**
 * Rhythm issue types
 */
export enum RhythmIssueType {
  METER_BREAK = 'meter_break',           // Pattern breaks established meter
  SYLLABLE_MISMATCH = 'syllable_mismatch', // Line has wrong syllable count
  STRESS_CLASH = 'stress_clash',         // Two stressed syllables collide
  AWKWARD_EMPHASIS = 'awkward_emphasis', // Unnatural word stress
  FLOW_DISRUPTION = 'flow_disruption',   // Rhythm feels choppy
  INCONSISTENT_PATTERN = 'inconsistent_pattern' // Pattern differs from others
}

/**
 * Rhythm break (where flow is disrupted)
 */
export interface RhythmBreak {
  readonly position: number
  readonly expected: Stress
  readonly actual: Stress
  readonly severity: number // 0-1
}

/**
 * Rhythm suggestion
 */
export interface RhythmSuggestion {
  readonly lineIndex: number
  readonly issue: RhythmIssueType
  readonly currentLine: string
  readonly alternatives: readonly string[]
  readonly explanation: string
}

/**
 * Meter detection result
 */
export interface MeterDetection {
  readonly meter: MeterType
  readonly confidence: number
  readonly feetPerLine: number
  readonly pattern: StressPattern
  readonly consistency: QualityScore
}

/**
 * Syllable pattern constraints
 */
export interface SyllableConstraints {
  readonly targetSyllables?: number
  readonly minSyllables?: number
  readonly maxSyllables?: number
  readonly allowedVariation?: number // ±N syllables
  readonly targetMeter?: MeterType
  readonly requireConsistency?: boolean
}

/**
 * Flow analysis result
 */
export interface FlowAnalysis {
  readonly overallFlow: QualityScore
  readonly lineFlows: readonly QualityScore[]
  readonly smoothness: number // 0-1
  readonly naturalness: number // 0-1
  readonly singability: number // 0-1
  readonly issues: readonly Issue[]
}

/**
 * Error codes for syllable counting
 */
export enum SyllableCountingErrorCode {
  EMPTY_INPUT = 'EMPTY_INPUT',
  INVALID_TEXT = 'INVALID_TEXT',
  SYLLABLE_COUNT_FAILED = 'SYLLABLE_COUNT_FAILED',
  STRESS_ANALYSIS_FAILED = 'STRESS_ANALYSIS_FAILED',
  METER_DETECTION_FAILED = 'METER_DETECTION_FAILED',
  UNSUPPORTED_LANGUAGE = 'UNSUPPORTED_LANGUAGE',
  ANALYSIS_FAILED = 'ANALYSIS_FAILED'
}

/**
 * Syllable Counting Service Interface
 *
 * This is the contract that both mock and real implementations must follow.
 * DO NOT modify this interface once implementation starts (create v2 instead).
 */
export interface ISyllableCountingService {
  /**
   * Analyze syllable counts and stress patterns in lines
   *
   * @param lines - Array of text lines to analyze
   * @param constraints - Optional syllable constraints
   * @returns Promise with syllable analysis or error
   * @throws Never throws - always returns ServiceResponse
   */
  analyzeLines(
    lines: readonly string[],
    constraints?: SyllableConstraints
  ): Promise<ServiceResponse<SyllableAnalysis>>

  /**
   * Count syllables in a single word
   *
   * @param word - Word to count syllables in
   * @returns Promise with syllable count
   * @throws Never throws - always returns ServiceResponse
   */
  countSyllables(
    word: string
  ): Promise<ServiceResponse<number>>

  /**
   * Get stress pattern for a line
   *
   * @param line - Line to analyze stress pattern
   * @returns Promise with stress pattern
   * @throws Never throws - always returns ServiceResponse
   */
  getStressPattern(
    line: string
  ): Promise<ServiceResponse<StressPattern>>

  /**
   * Detect meter type in lines
   *
   * @param lines - Lines to detect meter from
   * @returns Promise with meter detection result
   * @throws Never throws - always returns ServiceResponse
   */
  detectMeter(
    lines: readonly string[]
  ): Promise<ServiceResponse<MeterDetection>>

  /**
   * Analyze flow/rhythm quality
   *
   * @param lines - Lines to analyze flow
   * @param targetMeter - Optional target meter to check against
   * @returns Promise with flow analysis
   * @throws Never throws - always returns ServiceResponse
   */
  analyzeFlow(
    lines: readonly string[],
    targetMeter?: MeterType
  ): Promise<ServiceResponse<FlowAnalysis>>

  /**
   * Suggest rhythm improvements
   *
   * @param lines - Lines with rhythm issues
   * @param targetMeter - Optional target meter to match
   * @returns Promise with rhythm suggestions
   * @throws Never throws - always returns ServiceResponse
   */
  suggestRhythmImprovements(
    lines: readonly string[],
    targetMeter?: MeterType
  ): Promise<ServiceResponse<readonly RhythmSuggestion[]>>

  /**
   * Check if line matches target syllable count
   *
   * @param line - Line to check
   * @param targetCount - Target syllable count
   * @returns Promise with boolean result
   * @throws Never throws - always returns ServiceResponse
   */
  matchesSyllableCount(
    line: string,
    targetCount: number
  ): Promise<ServiceResponse<boolean>>
}

/**
 * Helper to convert stress array to pattern string
 */
export function stressesToPattern(stresses: readonly Stress[]): StressPattern {
  return stresses.map(s => {
    switch (s) {
      case Stress.STRESSED:
        return '/'
      case Stress.UNSTRESSED:
        return 'x'
      case Stress.SECONDARY:
        return '\\'
      case Stress.AMBIGUOUS:
        return '?'
    }
  }).join('')
}

/**
 * Helper to parse pattern string to stress array
 */
export function patternToStresses(pattern: StressPattern): readonly Stress[] {
  return pattern.split('').map(char => {
    switch (char) {
      case '/':
        return Stress.STRESSED
      case 'x':
        return Stress.UNSTRESSED
      case '\\':
        return Stress.SECONDARY
      case '?':
        return Stress.AMBIGUOUS
      default:
        return Stress.AMBIGUOUS
    }
  })
}

/**
 * Helper to check if meter is consistent
 */
export function isMeterConsistent(
  lines: readonly AnalyzedLineMetrics[],
  threshold: number = 0.8
): boolean {
  if (lines.length === 0) {
    return false
  }

  const meters = lines.map(l => l.meter).filter(m => m !== undefined)
  if (meters.length === 0) {
    return false
  }

  const meterCounts = new Map<MeterType, number>()
  for (const meter of meters) {
    meterCounts.set(meter, (meterCounts.get(meter) ?? 0) + 1)
  }

  const maxCount = Math.max(...meterCounts.values())
  return (maxCount / lines.length) >= threshold
}

/**
 * Helper to check if syllable counts are consistent
 */
export function areSyllablesConsistent(
  counts: readonly number[],
  allowedVariation: number = 1
): boolean {
  if (counts.length === 0) {
    return false
  }

  const min = Math.min(...counts)
  const max = Math.max(...counts)

  return (max - min) <= allowedVariation
}
