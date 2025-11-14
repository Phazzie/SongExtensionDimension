/**
 * @fileoverview Critique Engine Contract
 * @purpose Analyze song quality against professional songwriting standards
 * @dataFlow Song → Multi-dimensional Analysis → QualityReport
 * @boundary Song structure → Quality analysis engine
 * @requirement Enforce gold standard quality for professional songwriting
 * @updated 2025-11-14
 *
 * @example
 * const critique = new MockCritiqueEngineService()
 * const result = await critique.analyzeSong(song, 'gold-standard')
 * if (result.success) {
 *   console.log(result.data.overallScore)
 *   console.log(result.data.passesGoldStandard)
 *   console.log(result.data.issues)
 * }
 */

import type { ServiceResponse, QualityScore, Issue, Suggestion, Severity } from './types/common'
import type { Song, SongId, Line } from './types/song'
import type { RhymeAnalysis } from './RhymeAnalysis'
import type { FlowAnalysis } from './SyllableCounting'

/**
 * Complete critique report
 */
export interface CritiqueReport {
  readonly songId: SongId
  readonly overallScore: QualityScore
  readonly passesGoldStandard: boolean
  readonly qualityLevel: QualityLevel
  readonly scores: QualityScores
  readonly issues: readonly QualityIssue[]
  readonly suggestions: readonly Suggestion[]
  readonly strengths: readonly string[]
  readonly lineAnalysis: ReadonlyMap<number, LineAnalysis>
  readonly sectionAnalysis: readonly SectionAnalysis[]
  readonly generatedAt: Date
}

/**
 * Quality level assessment
 */
export enum QualityLevel {
  GOLD_STANDARD = 'gold',      // 90-100: Professional, publication-ready
  EXCELLENT = 'excellent',      // 80-89: Very good, minor improvements needed
  GOOD = 'good',                // 70-79: Solid work, some improvements needed
  ACCEPTABLE = 'acceptable',    // 60-69: Meets minimum standards
  NEEDS_WORK = 'needs_work',    // 40-59: Significant improvements needed
  POOR = 'poor'                 // 0-39: Major problems, needs rewrite
}

/**
 * Comprehensive quality scores
 */
export interface QualityScores {
  readonly rhymeQuality: QualityScore
  readonly flowConsistency: QualityScore
  readonly imageryVividness: QualityScore
  readonly emotionalAuthenticity: QualityScore
  readonly originalityScore: QualityScore
  readonly voiceConsistency: QualityScore
  readonly structuralCoherence: QualityScore
  readonly technicalExecution: QualityScore
}

/**
 * Detailed quality issue
 */
export interface QualityIssue extends Issue {
  readonly issueType: IssueType
  readonly affectedLines: readonly number[]
  readonly severity: Severity
  readonly score_impact: number // How much this lowers the score
  readonly examples?: readonly string[]
}

/**
 * Issue type taxonomy
 */
export enum IssueType {
  // Rhyme issues
  CLICHE = 'cliche',
  FORCED_RHYME = 'forced_rhyme',
  WEAK_RHYME = 'weak_rhyme',
  NO_RHYME = 'no_rhyme',
  IDENTICAL_RHYME = 'identical_rhyme',

  // Imagery issues
  VAGUE_IMAGERY = 'vague_imagery',
  ABSTRACT_CONCEPT = 'abstract_concept',
  TELLING_NOT_SHOWING = 'telling_not_showing',
  LACK_OF_SENSORY_DETAIL = 'lack_of_sensory_detail',
  GENERIC_DESCRIPTION = 'generic_description',

  // Rhythm/flow issues
  RHYTHM_BREAK = 'rhythm_break',
  SYLLABLE_MISMATCH = 'syllable_mismatch',
  AWKWARD_PHRASING = 'awkward_phrasing',
  STRESS_CLASH = 'stress_clash',
  FLOW_DISRUPTION = 'flow_disruption',

  // Voice/authenticity issues
  VOICE_INCONSISTENCY = 'voice_inconsistency',
  POV_SHIFT = 'pov_shift',
  TONE_SHIFT = 'tone_shift',
  CHARACTER_BREAK = 'character_break',
  ACADEMIC_LANGUAGE = 'academic_language',
  INAUTHENTIC_VOICE = 'inauthentic_voice',

  // Word choice issues
  WEAK_VERB = 'weak_verb',
  OVERUSED_ADJECTIVE = 'overused_adjective',
  REDUNDANCY = 'redundancy',
  FILLER_WORDS = 'filler_words',
  PASSIVE_VOICE = 'passive_voice',

  // Structural issues
  INCOMPLETE_SECTION = 'incomplete_section',
  MISSING_HOOK = 'missing_hook',
  WEAK_OPENING = 'weak_opening',
  WEAK_ENDING = 'weak_ending',
  REPETITION_OVERUSE = 'repetition_overuse',
  LACK_OF_PROGRESSION = 'lack_of_progression',

  // Originality issues
  OVERUSED_METAPHOR = 'overused_metaphor',
  PREDICTABLE_IMAGERY = 'predictable_imagery',
  COMMON_PHRASE = 'common_phrase',
  LACK_OF_SPECIFICITY = 'lack_of_specificity'
}

/**
 * Line-by-line analysis
 */
export interface LineAnalysis {
  readonly lineNumber: number
  readonly line: Line
  readonly scores: LineScores
  readonly issues: readonly QualityIssue[]
  readonly suggestions: readonly string[]
  readonly strengths: readonly string[]
}

/**
 * Line-level quality scores
 */
export interface LineScores {
  readonly imagery: QualityScore
  readonly rhythm: QualityScore
  readonly wordChoice: QualityScore
  readonly authenticity: QualityScore
  readonly overall: QualityScore
}

/**
 * Section-level analysis
 */
export interface SectionAnalysis {
  readonly sectionType: string
  readonly sectionId: string
  readonly scores: SectionScores
  readonly issues: readonly QualityIssue[]
  readonly cohesion: QualityScore
  readonly effectiveness: QualityScore
}

/**
 * Section-level quality scores
 */
export interface SectionScores {
  readonly rhymeConsistency: QualityScore
  readonly rhythmConsistency: QualityScore
  readonly thematicCohesion: QualityScore
  readonly narrativeFlow: QualityScore
  readonly overall: QualityScore
}

/**
 * Rhyme quality check result
 */
export interface RhymeQualityCheck {
  readonly rhymeAnalysis: RhymeAnalysis
  readonly qualityScore: QualityScore
  readonly issues: readonly QualityIssue[]
  readonly forcedRhymes: readonly ForcedRhyme[]
}

/**
 * Forced rhyme detection
 */
export interface ForcedRhyme {
  readonly lineIndex: number
  readonly word: string
  readonly alternativeFits: readonly string[]
  readonly awkwardness: number // 0-1
}

/**
 * Flow evaluation result
 */
export interface FlowEvaluation {
  readonly flowAnalysis: FlowAnalysis
  readonly qualityScore: QualityScore
  readonly issues: readonly QualityIssue[]
  readonly rhythmBreaks: readonly number[]
}

/**
 * Cliché detection result
 */
export interface ClicheDetection {
  readonly cliches: readonly DetectedCliche[]
  readonly overallScore: QualityScore
  readonly severity: Severity
}

/**
 * Detected cliché
 */
export interface DetectedCliche {
  readonly phrase: string
  readonly lineNumber: number
  readonly type: ClicheType
  readonly alternatives: readonly string[]
  readonly explanation: string
}

/**
 * Cliché type
 */
export enum ClicheType {
  PHRASE = 'phrase',             // "heart on my sleeve"
  METAPHOR = 'metaphor',         // "love is a battlefield"
  IMAGERY = 'imagery',           // "stars in your eyes"
  RHYME = 'rhyme',               // "fire/desire"
  STRUCTURE = 'structure'        // Verse-chorus-verse exactly
}

/**
 * Emotional resonance score
 */
export interface EmotionalResonance {
  readonly score: QualityScore
  readonly emotions: readonly DetectedEmotion[]
  readonly authenticity: QualityScore
  readonly depth: QualityScore
  readonly consistency: QualityScore
}

/**
 * Detected emotion
 */
export interface DetectedEmotion {
  readonly emotion: string
  readonly intensity: number // 0-1
  readonly lines: readonly number[]
  readonly authenticity: number // 0-1
}

/**
 * Gold standard criteria
 */
export interface GoldStandardCriteria {
  readonly minRhymeQuality: QualityScore
  readonly minFlowConsistency: QualityScore
  readonly minImageryVividness: QualityScore
  readonly minEmotionalAuthenticity: QualityScore
  readonly minOriginalityScore: QualityScore
  readonly minVoiceConsistency: QualityScore
  readonly maxClicheCount: number
  readonly maxForcedRhymes: number
  readonly maxRhythmBreaks: number
}

/**
 * Default gold standard criteria (very strict)
 */
export const DEFAULT_GOLD_STANDARD: GoldStandardCriteria = {
  minRhymeQuality: 80 as QualityScore,
  minFlowConsistency: 85 as QualityScore,
  minImageryVividness: 90 as QualityScore,
  minEmotionalAuthenticity: 95 as QualityScore,
  minOriginalityScore: 85 as QualityScore,
  minVoiceConsistency: 90 as QualityScore,
  maxClicheCount: 0,
  maxForcedRhymes: 0,
  maxRhythmBreaks: 1
} as const

/**
 * Critique level (how strict)
 */
export enum CritiqueLevel {
  CASUAL = 'casual',           // Lenient, for fun/practice
  PROFESSIONAL = 'professional', // Standard professional quality
  GOLD_STANDARD = 'gold-standard' // Elite, publication-ready
}

/**
 * Error codes for critique engine
 */
export enum CritiqueEngineErrorCode {
  INVALID_SONG = 'INVALID_SONG',
  SONG_TOO_SHORT = 'SONG_TOO_SHORT',
  ANALYSIS_FAILED = 'ANALYSIS_FAILED',
  RHYME_ANALYSIS_FAILED = 'RHYME_ANALYSIS_FAILED',
  FLOW_ANALYSIS_FAILED = 'FLOW_ANALYSIS_FAILED',
  CLICHE_DETECTION_FAILED = 'CLICHE_DETECTION_FAILED',
  TIMEOUT = 'TIMEOUT'
}

/**
 * Critique Engine Service Interface
 *
 * This is the contract that both mock and real implementations must follow.
 * DO NOT modify this interface once implementation starts (create v2 instead).
 */
export interface ICritiqueEngineService {
  /**
   * Perform comprehensive song quality analysis
   *
   * @param song - Song to analyze
   * @param level - Critique level (casual, professional, gold-standard)
   * @returns Promise with complete critique report or error
   * @throws Never throws - always returns ServiceResponse
   */
  analyzeSong(
    song: Song,
    level?: CritiqueLevel
  ): Promise<ServiceResponse<CritiqueReport>>

  /**
   * Check rhyme quality in specific lines
   *
   * @param lines - Lines to check
   * @returns Promise with rhyme quality analysis or error
   * @throws Never throws - always returns ServiceResponse
   */
  checkRhymeQuality(
    lines: readonly string[]
  ): Promise<ServiceResponse<RhymeQualityCheck>>

  /**
   * Evaluate flow and rhythm consistency
   *
   * @param lines - Lines to evaluate
   * @returns Promise with flow evaluation or error
   * @throws Never throws - always returns ServiceResponse
   */
  evaluateFlow(
    lines: readonly string[]
  ): Promise<ServiceResponse<FlowEvaluation>>

  /**
   * Detect clichés and overused phrases
   *
   * @param lyrics - Lyrics text to analyze
   * @returns Promise with cliché detection results or error
   * @throws Never throws - always returns ServiceResponse
   */
  detectCliches(
    lyrics: string
  ): Promise<ServiceResponse<ClicheDetection>>

  /**
   * Assess emotional resonance and authenticity
   *
   * @param song - Song to assess
   * @returns Promise with emotional resonance analysis or error
   * @throws Never throws - always returns ServiceResponse
   */
  assessEmotionalResonance(
    song: Song
  ): Promise<ServiceResponse<EmotionalResonance>>

  /**
   * Check if song passes gold standard criteria
   *
   * @param song - Song to check
   * @param criteria - Optional custom criteria (defaults to strict)
   * @returns Promise with boolean result
   * @throws Never throws - always returns ServiceResponse
   */
  passesGoldStandard(
    song: Song,
    criteria?: GoldStandardCriteria
  ): Promise<ServiceResponse<boolean>>

  /**
   * Get list of failed criteria for a song
   *
   * @param song - Song to analyze
   * @param criteria - Optional custom criteria
   * @returns Promise with list of failed criteria issues
   * @throws Never throws - always returns ServiceResponse
   */
  getFailedCriteria(
    song: Song,
    criteria?: GoldStandardCriteria
  ): Promise<ServiceResponse<readonly QualityIssue[]>>

  /**
   * Analyze specific line for issues
   *
   * @param line - Line to analyze
   * @param context - Optional context (surrounding lines)
   * @returns Promise with line analysis or error
   * @throws Never throws - always returns ServiceResponse
   */
  analyzeLine(
    line: Line,
    context?: readonly Line[]
  ): Promise<ServiceResponse<LineAnalysis>>
}

/**
 * Helper to determine quality level from score
 */
export function getQualityLevel(score: QualityScore): QualityLevel {
  if (score >= 90) return QualityLevel.GOLD_STANDARD
  if (score >= 80) return QualityLevel.EXCELLENT
  if (score >= 70) return QualityLevel.GOOD
  if (score >= 60) return QualityLevel.ACCEPTABLE
  if (score >= 40) return QualityLevel.NEEDS_WORK
  return QualityLevel.POOR
}

/**
 * Helper to check if issue is critical
 */
export function isCriticalIssue(issue: QualityIssue): boolean {
  return issue.severity === 'critical' || issue.score_impact >= 10
}

/**
 * Helper to filter issues by type
 */
export function filterIssuesByType(
  issues: readonly QualityIssue[],
  type: IssueType
): readonly QualityIssue[] {
  return issues.filter(issue => issue.issueType === type)
}

/**
 * Helper to group issues by severity
 */
export function groupIssuesBySeverity(
  issues: readonly QualityIssue[]
): Record<Severity, readonly QualityIssue[]> {
  return {
    critical: issues.filter(i => i.severity === 'critical'),
    major: issues.filter(i => i.severity === 'major'),
    minor: issues.filter(i => i.severity === 'minor'),
    info: issues.filter(i => i.severity === 'info')
  }
}
