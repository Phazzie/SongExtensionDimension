/**
 * @fileoverview Revision Engine Contract
 * @purpose Transform songs with feedback into improved versions
 * @dataFlow (Song + CritiqueReport) → AI Revision → ImprovedSong
 * @boundary Current version → Revised version with preserved voice
 * @requirement Improve quality while maintaining original voice and intent
 * @updated 2025-11-14
 *
 * @example
 * const reviser = new MockRevisionEngineService()
 * const result = await reviser.reviseSong({
 *   song: originalSong,
 *   critique: critiqueReport,
 *   strategy: 'moderate'
 * })
 * if (result.success) {
 *   console.log(result.data.revisedSong)
 *   console.log(result.data.changes)
 *   console.log(result.data.improvementMetrics)
 * }
 */

import type { ServiceResponse, QualityScore } from './types/common'
import type { Song, Line, SectionId, VerseId, ChorusId } from './types/song'
import type { CritiqueReport, QualityIssue, IssueType } from './CritiqueEngine'
import type { VoiceProfile } from './SongGeneration'

/**
 * Revision input
 */
export interface RevisionInput {
  readonly song: Song
  readonly critique: CritiqueReport
  readonly strategy: RevisionStrategy
  readonly preserveVoice: boolean
  readonly targetIssues?: readonly IssueType[]
  readonly voiceProfile?: VoiceProfile
  readonly customFeedback?: readonly string[]
}

/**
 * Revision strategy
 */
export enum RevisionStrategy {
  CONSERVATIVE = 'conservative',   // Minimal changes, preserve most original text
  MODERATE = 'moderate',          // Balanced approach, fix issues while preserving voice
  AGGRESSIVE = 'aggressive',      // Major rewrites to achieve quality standards
  SURGICAL = 'surgical',          // Line-by-line targeted fixes only
  CREATIVE = 'creative'           // Explore new creative directions
}

/**
 * Revision result
 */
export interface RevisionResult {
  readonly revisedSong: Song
  readonly changes: readonly ChangeRecord[]
  readonly alternatives: readonly AlternativeVersion[]
  readonly improvementMetrics: ImprovementMetrics
  readonly preservedElements: readonly string[]
  readonly voiceConsistency: QualityScore
}

/**
 * Change record (what was changed and why)
 */
export interface ChangeRecord {
  readonly changeId: string
  readonly type: ChangeType
  readonly location: ChangeLocation
  readonly original: string
  readonly revised: string
  readonly reason: string
  readonly issueFixed: IssueType
  readonly improvementScore: number
}

/**
 * Change type
 */
export enum ChangeType {
  LINE_REWRITE = 'line_rewrite',
  WORD_SUBSTITUTION = 'word_substitution',
  PHRASE_IMPROVEMENT = 'phrase_improvement',
  RHYME_FIX = 'rhyme_fix',
  RHYTHM_ADJUSTMENT = 'rhythm_adjustment',
  IMAGERY_ENHANCEMENT = 'imagery_enhancement',
  SECTION_RESTRUCTURE = 'section_restructure',
  DELETION = 'deletion',
  ADDITION = 'addition'
}

/**
 * Change location
 */
export interface ChangeLocation {
  readonly sectionId?: SectionId | VerseId | ChorusId
  readonly sectionType?: string
  readonly lineNumber?: number
  readonly wordPosition?: number
}

/**
 * Alternative version
 */
export interface AlternativeVersion {
  readonly versionId: string
  readonly direction: CreativeDirection
  readonly revisedSong: Song
  readonly description: string
  readonly changes: readonly ChangeRecord[]
  readonly improvementScore: QualityScore
}

/**
 * Creative direction for alternatives
 */
export enum CreativeDirection {
  DARKER = 'darker',           // More melancholic/serious tone
  LIGHTER = 'lighter',         // More uplifting/positive tone
  MORE_ABSTRACT = 'more_abstract',   // More metaphorical
  MORE_CONCRETE = 'more_concrete',   // More specific/vivid
  MORE_PERSONAL = 'more_personal',   // First person, intimate
  MORE_UNIVERSAL = 'more_universal', // Broader perspective
  MORE_NARRATIVE = 'more_narrative', // Story-focused
  MORE_EMOTIONAL = 'more_emotional'  // Feeling-focused
}

/**
 * Improvement metrics (before/after comparison)
 */
export interface ImprovementMetrics {
  readonly beforeScore: QualityScore
  readonly afterScore: QualityScore
  readonly improvement: number
  readonly issuesFixed: number
  readonly issuesRemaining: number
  readonly categoryImprovements: CategoryImprovements
  readonly qualityLevelChange: string
}

/**
 * Category-specific improvements
 */
export interface CategoryImprovements {
  readonly rhymeQuality: ScoreChange
  readonly flowConsistency: ScoreChange
  readonly imageryVividness: ScoreChange
  readonly emotionalAuthenticity: ScoreChange
  readonly originalityScore: ScoreChange
  readonly voiceConsistency: ScoreChange
}

/**
 * Score change (before → after)
 */
export interface ScoreChange {
  readonly before: QualityScore
  readonly after: QualityScore
  readonly delta: number
  readonly percentChange: number
}

/**
 * Line revision input
 */
export interface LineRevisionInput {
  readonly line: Line
  readonly issue: QualityIssue
  readonly context?: readonly Line[]
  readonly preserveRhyme: boolean
  readonly preserveRhythm: boolean
  readonly voiceProfile?: VoiceProfile
}

/**
 * Line revision result
 */
export interface LineRevisionResult {
  readonly original: Line
  readonly revised: Line
  readonly alternatives: readonly Line[]
  readonly improvement: number
  readonly preservedRhyme: boolean
  readonly preservedRhythm: boolean
}

/**
 * Rhyme strengthening input
 */
export interface RhymeStrengthenInput {
  readonly line1: Line
  readonly line2: Line
  readonly currentQuality: string
  readonly targetQuality: string
  readonly preserveMeaning: boolean
}

/**
 * Rhyme strengthening result
 */
export interface RhymeStrengthenResult {
  readonly option1: RhymeOption
  readonly option2: RhymeOption
  readonly option3: RhymeOption
  readonly recommended: number // Which option is recommended (1-3)
}

/**
 * Rhyme option
 */
export interface RhymeOption {
  readonly line1: string
  readonly line2: string
  readonly rhymeQuality: string
  readonly meaningPreserved: boolean
  readonly naturalness: number // 0-1
  readonly explanation: string
}

/**
 * Imagery enhancement input
 */
export interface ImageryEnhancementInput {
  readonly line: Line
  readonly vaguePhrases: readonly string[]
  readonly targetVividness: QualityScore
  readonly context?: string
}

/**
 * Imagery enhancement result
 */
export interface ImageryEnhancementResult {
  readonly original: string
  readonly enhanced: readonly string[]
  readonly concreteReplacements: ReadonlyMap<string, readonly string[]>
  readonly sensoryDetails: readonly string[]
}

/**
 * Voice preservation check
 */
export interface VoicePreservationCheck {
  readonly originalVoice: VoiceProfile
  readonly revisedText: string
  readonly consistencyScore: QualityScore
  readonly violations: readonly VoiceViolation[]
  readonly passed: boolean
}

/**
 * Voice violation
 */
export interface VoiceViolation {
  readonly type: VoiceViolationType
  readonly location: number
  readonly phrase: string
  readonly explanation: string
  readonly suggestion: string
}

/**
 * Voice violation type
 */
export enum VoiceViolationType {
  VOCABULARY_MISMATCH = 'vocabulary_mismatch',
  PERSPECTIVE_SHIFT = 'perspective_shift',
  TONE_SHIFT = 'tone_shift',
  STYLE_INCONSISTENCY = 'style_inconsistency',
  CHARACTER_BREAK = 'character_break'
}

/**
 * Revision options
 */
export interface RevisionOptions {
  readonly maxIterations?: number
  readonly minImprovement?: number
  readonly generateAlternatives?: boolean
  readonly alternativeCount?: number
  readonly targetScore?: QualityScore
  readonly strictVoicePreservation?: boolean
}

/**
 * Error codes for revision engine
 */
export enum RevisionEngineErrorCode {
  INVALID_SONG = 'INVALID_SONG',
  INVALID_CRITIQUE = 'INVALID_CRITIQUE',
  REVISION_FAILED = 'REVISION_FAILED',
  NO_IMPROVEMENT = 'NO_IMPROVEMENT',
  VOICE_PRESERVATION_FAILED = 'VOICE_PRESERVATION_FAILED',
  MAX_ITERATIONS_EXCEEDED = 'MAX_ITERATIONS_EXCEEDED',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  TIMEOUT = 'TIMEOUT'
}

/**
 * Revision Engine Service Interface
 *
 * This is the contract that both mock and real implementations must follow.
 * DO NOT modify this interface once implementation starts (create v2 instead).
 */
export interface IRevisionEngineService {
  /**
   * Revise entire song based on critique feedback
   *
   * @param input - Revision input with song, critique, and strategy
   * @param options - Optional revision options
   * @returns Promise with revision result or error
   * @throws Never throws - always returns ServiceResponse
   */
  reviseSong(
    input: RevisionInput,
    options?: RevisionOptions
  ): Promise<ServiceResponse<RevisionResult>>

  /**
   * Revise specific line to fix identified issue
   *
   * @param input - Line revision input
   * @returns Promise with line revision result or error
   * @throws Never throws - always returns ServiceResponse
   */
  reviseLine(
    input: LineRevisionInput
  ): Promise<ServiceResponse<LineRevisionResult>>

  /**
   * Strengthen rhyme between two lines
   *
   * @param input - Rhyme strengthening input
   * @returns Promise with rhyme options or error
   * @throws Never throws - always returns ServiceResponse
   */
  strengthenRhyme(
    input: RhymeStrengthenInput
  ): Promise<ServiceResponse<RhymeStrengthenResult>>

  /**
   * Enhance imagery in a line (make more concrete/vivid)
   *
   * @param input - Imagery enhancement input
   * @returns Promise with enhanced versions or error
   * @throws Never throws - always returns ServiceResponse
   */
  improveImagery(
    input: ImageryEnhancementInput
  ): Promise<ServiceResponse<ImageryEnhancementResult>>

  /**
   * Generate alternative versions with different creative directions
   *
   * @param song - Original song
   * @param directions - Creative directions to explore
   * @param count - Number of alternatives per direction
   * @returns Promise with alternative versions or error
   * @throws Never throws - always returns ServiceResponse
   */
  generateAlternatives(
    song: Song,
    directions: readonly CreativeDirection[],
    count?: number
  ): Promise<ServiceResponse<readonly AlternativeVersion[]>>

  /**
   * Check if revision maintains original voice
   *
   * @param original - Original song
   * @param revised - Revised song
   * @param voiceProfile - Voice profile to check against
   * @returns Promise with voice preservation check result
   * @throws Never throws - always returns ServiceResponse
   */
  checkVoicePreservation(
    original: Song,
    revised: Song,
    voiceProfile: VoiceProfile
  ): Promise<ServiceResponse<VoicePreservationCheck>>

  /**
   * Apply specific fixes to targeted issues
   *
   * @param song - Song to fix
   * @param issues - Specific issues to address
   * @returns Promise with fixed song or error
   * @throws Never throws - always returns ServiceResponse
   */
  applyTargetedFixes(
    song: Song,
    issues: readonly QualityIssue[]
  ): Promise<ServiceResponse<Song>>
}

/**
 * Helper to create default revision options
 */
export function createDefaultRevisionOptions(): RevisionOptions {
  return {
    maxIterations: 5,
    minImprovement: 5,
    generateAlternatives: true,
    alternativeCount: 3,
    strictVoicePreservation: true
  }
}

/**
 * Helper to calculate improvement percentage
 */
export function calculateImprovement(before: QualityScore, after: QualityScore): number {
  return ((after - before) / before) * 100
}

/**
 * Helper to determine if revision was successful
 */
export function isSuccessfulRevision(metrics: ImprovementMetrics, minImprovement: number = 5): boolean {
  return metrics.improvement >= minImprovement && metrics.afterScore > metrics.beforeScore
}
