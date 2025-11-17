/**
 * @fileoverview Mock Implementation of Revision Engine Service
 * @purpose Provide realistic mock for UI development and testing
 * @phase Phase 3 - BUILD (TDD)
 * @updated 2025-11-15
 *
 * This mock implementation:
 * - Returns realistic data that matches the contract exactly
 * - Handles all error cases defined in the contract
 * - Never throws exceptions - always returns ServiceResponse
 * - Uses readonly properties correctly (build values BEFORE creating objects)
 * - Passes all tests in RevisionEngine.test.ts
 */

import type {
  IRevisionEngineService,
  RevisionInput,
  RevisionResult,
  LineRevisionInput,
  LineRevisionResult,
  RhymeStrengthenInput,
  RhymeStrengthenResult,
  RhymeOption,
  ImageryEnhancementInput,
  ImageryEnhancementResult,
  VoicePreservationCheck,
  VoiceViolation,
  RevisionOptions,
  ChangeRecord,
  AlternativeVersion,
  ImprovementMetrics,
  CategoryImprovements,
  ScoreChange
} from '../../contracts/RevisionEngine'
import {
  RevisionStrategy,
  ChangeType,
  CreativeDirection,
  VoiceViolationType
} from '../../contracts/RevisionEngine'
import type { Song, Line, SongId } from '../../contracts/types/song'
import { createSongId } from '../../contracts/types/song'
import type { CritiqueReport, QualityIssue } from '../../contracts/CritiqueEngine'
import { IssueType } from '../../contracts/CritiqueEngine'
import type { VoiceProfile } from '../../contracts/SongGeneration'
import type { QualityScore } from '../../contracts/types/common'
import {
  createSuccess,
  createFailure,
  createError,
  createQualityScore,
  type ServiceResponse
} from '../../contracts/types/common'

/**
 * Mock implementation of Revision Engine Service
 *
 * Uses heuristic-based pattern matching to simulate revisions.
 * This is NOT an AI - it's a deterministic mock for testing.
 */
export class MockRevisionEngineService implements IRevisionEngineService {
  // Counter for generating unique IDs
  private idCounter: number = 0

  /**
   * Revise entire song based on critique feedback
   */
  async reviseSong(
    input: RevisionInput,
    options?: RevisionOptions
  ): Promise<ServiceResponse<RevisionResult>> {
    try {
      // Validate input
      if (!input) {
        return createFailure(
          createError(
            'INVALID_SONG',
            'Input is required',
            'Please provide valid revision input'
          )
        )
      }

      if (!input.song) {
        return createFailure(
          createError(
            'INVALID_SONG',
            'Song is required',
            'Please provide a valid song to revise'
          )
        )
      }

      if (!input.critique) {
        return createFailure(
          createError(
            'INVALID_CRITIQUE',
            'Critique is required',
            'Please provide a critique report to guide revision'
          )
        )
      }

      // Check for trigger words
      if (input.song.id === 'TRIGGER_REVISION_FAILURE' as SongId) {
        return createFailure(
          createError(
            'REVISION_FAILED',
            'Revision failed',
            'Unable to revise the song. Please try again.'
          )
        )
      }

      // Check if improvement is possible
      const currentScore = input.critique.overallScore
      const minImprovement = options?.minImprovement || 5

      if (currentScore >= 0.95 && input.critique.issues.length === 0) {
        return createFailure(
          createError(
            'NO_IMPROVEMENT',
            'Song is already at high quality',
            'No significant improvement is possible with the current quality level'
          )
        )
      }

      // Check voice preservation
      if (options?.strictVoicePreservation && input.strategy === RevisionStrategy.AGGRESSIVE) {
        return createFailure(
          createError(
            'VOICE_PRESERVATION_FAILED',
            'Cannot preserve voice with aggressive strategy',
            'Try using a more conservative strategy or disable strict voice preservation'
          )
        )
      }

      // Determine change intensity based on strategy
      const changeIntensity = this.getChangeIntensity(input.strategy)

      // Build changes
      const changes = this.buildChanges(input, changeIntensity)

      // Build revised song
      const revisedSong = this.buildRevisedSong(input.song, changes, input)

      // Build improvement metrics
      const beforeScore = currentScore
      const afterScore = this.calculateNewScore(beforeScore, changes.length, changeIntensity)
      const improvement = ((afterScore - beforeScore) / beforeScore) * 100
      const issuesFixed = Math.min(changes.length, input.critique.issues.length)
      const issuesRemaining = Math.max(0, input.critique.issues.length - issuesFixed)

      const categoryImprovements = this.buildCategoryImprovements(input.critique, changes)

      const qualityLevelChange = this.determineQualityLevelChange(beforeScore, afterScore)

      const improvementMetrics: ImprovementMetrics = Object.freeze({
        beforeScore,
        afterScore,
        improvement,
        issuesFixed,
        issuesRemaining,
        categoryImprovements: Object.freeze(categoryImprovements),
        qualityLevelChange
      })

      // Check if improvement meets minimum threshold
      if (improvement < minImprovement) {
        return createFailure(
          createError(
            'NO_IMPROVEMENT',
            `Insufficient improvement: ${improvement.toFixed(1)}% < ${minImprovement}%`,
            'Try using a different revision strategy or lowering the minimum improvement threshold'
          )
        )
      }

      // Build alternatives (if requested)
      const alternatives = this.shouldGenerateAlternatives(options)
        ? await this.buildAlternatives(input, options?.alternativeCount || 3)
        : []

      // Build preserved elements
      const preservedElements = this.buildPreservedElements(input)

      // Calculate voice consistency
      const voiceConsistency = createQualityScore(input.preserveVoice ? 0.85 : 0.6)

      // Build result
      const result: RevisionResult = Object.freeze({
        revisedSong,
        changes: Object.freeze(changes),
        alternatives: Object.freeze(alternatives),
        improvementMetrics,
        preservedElements: Object.freeze(preservedElements),
        voiceConsistency
      })

      return createSuccess(result)
    } catch (error) {
      return createFailure(
        createError(
          'REVISION_FAILED',
          'An unexpected error occurred during revision',
          'Please check your input and try again'
        )
      )
    }
  }

  /**
   * Revise specific line to fix identified issue
   */
  async reviseLine(
    input: LineRevisionInput
  ): Promise<ServiceResponse<LineRevisionResult>> {
    try {
      // Validate input
      if (!input || !input.line) {
        return createFailure(
          createError(
            'INVALID_SONG',
            'Line is required',
            'Please provide a valid line to revise'
          )
        )
      }

      if (!input.issue) {
        return createFailure(
          createError(
            'INVALID_CRITIQUE',
            'Issue is required',
            'Please specify what issue to fix in the line'
          )
        )
      }

      // Build revised line
      const original = input.line
      const revisedText = this.reviseSingleLine(original.text, input.issue.type, input)
      const syllables = input.preserveRhythm ? original.syllables : this.countSyllables(revisedText)
      const stressPattern = this.generateStressPattern(syllables)

      const revised: Line = Object.freeze({
        text: revisedText,
        syllables,
        stressPattern
      })

      // Build alternatives
      const alternatives: Line[] = []
      for (let i = 0; i < 2; i++) {
        const altText = this.generateAlternativeLineText(original.text, input.issue.type, i)
        const altSyllables = input.preserveRhythm ? original.syllables : this.countSyllables(altText)
        const altStressPattern = this.generateStressPattern(altSyllables)

        alternatives.push(Object.freeze({
          text: altText,
          syllables: altSyllables,
          stressPattern: altStressPattern
        }))
      }

      // Calculate improvement
      const improvement = 0.25

      // Build result
      const result: LineRevisionResult = Object.freeze({
        original: Object.freeze(original),
        revised,
        alternatives: Object.freeze(alternatives),
        improvement,
        preservedRhyme: input.preserveRhyme,
        preservedRhythm: input.preserveRhythm
      })

      return createSuccess(result)
    } catch (error) {
      return createFailure(
        createError(
          'REVISION_FAILED',
          'Failed to revise line',
          'Please check the line and issue details'
        )
      )
    }
  }

  /**
   * Strengthen rhyme between two lines
   */
  async strengthenRhyme(
    input: RhymeStrengthenInput
  ): Promise<ServiceResponse<RhymeStrengthenResult>> {
    try {
      // Validate input
      if (!input || !input.line1 || !input.line2) {
        return createFailure(
          createError(
            'INVALID_SONG',
            'Both lines are required',
            'Please provide two valid lines to strengthen rhyme'
          )
        )
      }

      // Build rhyme options
      const option1 = this.buildRhymeOption(input.line1.text, input.line2.text, input.preserveMeaning, 0)
      const option2 = this.buildRhymeOption(input.line1.text, input.line2.text, input.preserveMeaning, 1)
      const option3 = this.buildRhymeOption(input.line1.text, input.line2.text, input.preserveMeaning, 2)

      // Recommend best option (option 1 is usually best)
      const recommended = 1

      const result: RhymeStrengthenResult = Object.freeze({
        option1,
        option2,
        option3,
        recommended
      })

      return createSuccess(result)
    } catch (error) {
      return createFailure(
        createError(
          'REVISION_FAILED',
          'Failed to strengthen rhyme',
          'Please check the input lines'
        )
      )
    }
  }

  /**
   * Enhance imagery in a line (make more concrete/vivid)
   */
  async improveImagery(
    input: ImageryEnhancementInput
  ): Promise<ServiceResponse<ImageryEnhancementResult>> {
    try {
      // Validate input
      if (!input || !input.line) {
        return createFailure(
          createError(
            'INVALID_SONG',
            'Line is required',
            'Please provide a valid line to enhance'
          )
        )
      }

      if (!input.vaguePhrases || input.vaguePhrases.length === 0) {
        return createFailure(
          createError(
            'INVALID_SONG',
            'Vague phrases are required',
            'Please specify which phrases need enhancement'
          )
        )
      }

      const original = input.line.text

      // Build enhanced versions
      const enhanced: string[] = []
      for (let i = 0; i < 3; i++) {
        enhanced.push(this.enhanceImagery(original, input.vaguePhrases, input.context, i))
      }

      // Build concrete replacements
      const concreteReplacements = new Map<string, readonly string[]>()
      for (const phrase of input.vaguePhrases) {
        const replacements = this.generateConcreteReplacements(phrase, input.context)
        concreteReplacements.set(phrase, Object.freeze(replacements))
      }

      // Build sensory details
      const sensoryDetails = this.generateSensoryDetails(input.context || original)

      const result: ImageryEnhancementResult = Object.freeze({
        original,
        enhanced: Object.freeze(enhanced),
        concreteReplacements,
        sensoryDetails: Object.freeze(sensoryDetails)
      })

      return createSuccess(result)
    } catch (error) {
      return createFailure(
        createError(
          'REVISION_FAILED',
          'Failed to improve imagery',
          'Please check the input line and vague phrases'
        )
      )
    }
  }

  /**
   * Generate alternative versions with different creative directions
   */
  async generateAlternatives(
    song: Song,
    directions: readonly CreativeDirection[],
    count?: number
  ): Promise<ServiceResponse<readonly AlternativeVersion[]>> {
    try {
      // Validate input
      if (!song) {
        return createFailure(
          createError(
            'INVALID_SONG',
            'Song is required',
            'Please provide a valid song'
          )
        )
      }

      if (!directions || directions.length === 0) {
        return createFailure(
          createError(
            'INVALID_SONG',
            'Directions are required',
            'Please specify at least one creative direction'
          )
        )
      }

      const maxCount = count || 3
      const alternatives: AlternativeVersion[] = []

      for (let i = 0; i < directions.length && alternatives.length < maxCount * directions.length; i++) {
        const direction = directions[i]!
        const numVersions = Math.min(maxCount, 2)

        for (let j = 0; j < numVersions; j++) {
          const alt = this.buildAlternativeVersion(song, direction, j)
          alternatives.push(alt)
        }
      }

      return createSuccess(Object.freeze(alternatives))
    } catch (error) {
      return createFailure(
        createError(
          'REVISION_FAILED',
          'Failed to generate alternatives',
          'Please check the song and directions'
        )
      )
    }
  }

  /**
   * Check if revision maintains original voice
   */
  async checkVoicePreservation(
    original: Song,
    revised: Song,
    voiceProfile: VoiceProfile
  ): Promise<ServiceResponse<VoicePreservationCheck>> {
    try {
      // Validate input
      if (!original) {
        return createFailure(
          createError(
            'INVALID_SONG',
            'Original song is required',
            'Please provide the original song'
          )
        )
      }

      if (!revised) {
        return createFailure(
          createError(
            'INVALID_SONG',
            'Revised song is required',
            'Please provide the revised song'
          )
        )
      }

      if (!voiceProfile) {
        return createFailure(
          createError(
            'INVALID_CRITIQUE',
            'Voice profile is required',
            'Please provide a voice profile to check against'
          )
        )
      }

      // Extract text from revised song
      const revisedText = this.extractSongText(revised)

      // Check for voice violations
      const violations: VoiceViolation[] = []

      // Check for trigger word that should create violations
      if (revised.id === 'TRIGGER_VOICE_VIOLATION' as SongId) {
        violations.push(Object.freeze({
          type: VoiceViolationType.VOCABULARY_MISMATCH,
          location: 0,
          phrase: 'incompatible word',
          explanation: 'This word doesn\'t match the established vocabulary',
          suggestion: 'Use words from the voice profile vocabulary'
        }))
      }

      // Calculate consistency score
      const consistencyScore = createQualityScore(violations.length === 0 ? 0.9 : 0.5)

      // Determine if passed
      const passed = consistencyScore >= 0.7

      const result: VoicePreservationCheck = Object.freeze({
        originalVoice: Object.freeze(voiceProfile),
        revisedText,
        consistencyScore,
        violations: Object.freeze(violations),
        passed
      })

      return createSuccess(result)
    } catch (error) {
      return createFailure(
        createError(
          'REVISION_FAILED',
          'Failed to check voice preservation',
          'Please check the input songs and voice profile'
        )
      )
    }
  }

  /**
   * Apply specific fixes to targeted issues
   */
  async applyTargetedFixes(
    song: Song,
    issues: readonly QualityIssue[]
  ): Promise<ServiceResponse<Song>> {
    try {
      // Validate input
      if (!song) {
        return createFailure(
          createError(
            'INVALID_SONG',
            'Song is required',
            'Please provide a valid song'
          )
        )
      }

      if (!issues) {
        return createFailure(
          createError(
            'INVALID_CRITIQUE',
            'Issues are required',
            'Please provide issues to fix'
          )
        )
      }

      // If no issues, return original song (ensure it's frozen)
      if (issues.length === 0) {
        return createSuccess(Object.freeze({ ...song }))
      }

      // Apply fixes to each issue
      let fixedSong = song

      for (const issue of issues) {
        fixedSong = this.applyFixForIssue(fixedSong, issue)
      }

      // Ensure the final song is deeply frozen
      return createSuccess(Object.freeze({ ...fixedSong }))
    } catch (error) {
      return createFailure(
        createError(
          'REVISION_FAILED',
          'Failed to apply targeted fixes',
          'Please check the song and issues'
        )
      )
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Get change intensity based on strategy
   */
  private getChangeIntensity(strategy: RevisionStrategy): number {
    switch (strategy) {
      case RevisionStrategy.CONSERVATIVE:
        return 0.2
      case RevisionStrategy.MODERATE:
        return 0.5
      case RevisionStrategy.AGGRESSIVE:
        return 0.8
      case RevisionStrategy.SURGICAL:
        return 0.3
      case RevisionStrategy.CREATIVE:
        return 0.7
      default:
        return 0.5
    }
  }

  /**
   * Build changes for revision
   */
  private buildChanges(input: RevisionInput, intensity: number): ChangeRecord[] {
    const changes: ChangeRecord[] = []
    const issueCount = input.critique.issues.length
    const numChanges = Math.max(1, Math.ceil(issueCount * intensity))

    for (let i = 0; i < numChanges && i < issueCount; i++) {
      const issue = input.critique.issues[i]!

      const change: ChangeRecord = Object.freeze({
        changeId: `change_${this.idCounter++}`,
        type: this.determineChangeType(issue.issueType),
        location: {
          sectionId: undefined,
          sectionType: 'verse',
          lineNumber: issue.affectedLines[0]
        },
        original: 'original text',
        revised: 'improved text',
        reason: issue.message,
        issueFixed: issue.issueType,
        improvementScore: 0.25
      })

      changes.push(change)
    }

    return changes
  }

  /**
   * Determine change type from issue type
   */
  private determineChangeType(issueType: IssueType): ChangeType {
    const typeStr = String(issueType)
    if (typeStr.includes('rhyme')) return ChangeType.RHYME_FIX
    if (typeStr.includes('rhythm')) return ChangeType.RHYTHM_ADJUSTMENT
    if (typeStr.includes('imagery') || typeStr.includes('vague')) return ChangeType.IMAGERY_ENHANCEMENT
    if (typeStr.includes('word')) return ChangeType.WORD_SUBSTITUTION
    return ChangeType.LINE_REWRITE
  }

  /**
   * Build revised song
   */
  private buildRevisedSong(song: Song, _changes: readonly ChangeRecord[], _input: RevisionInput): Song {
    // For mock purposes, create a slightly modified version of the song
    const newTitle = `${song.title} (Revised)`

    const revisedSong: Song = Object.freeze({
      ...song,
      id: createSongId(`${song.id}_revised_${Date.now()}`),
      title: newTitle,
      verses: Object.freeze(song.verses.map(verse => Object.freeze({ ...verse }))),
      choruses: Object.freeze(song.choruses.map(chorus => Object.freeze({ ...chorus }))),
      bridge: song.bridge ? Object.freeze({ ...song.bridge }) : undefined,
      metadata: Object.freeze({ ...song.metadata }),
      generatedAt: new Date()
    })

    return revisedSong
  }

  /**
   * Calculate new quality score
   */
  private calculateNewScore(beforeScore: number, numChanges: number, intensity: number): QualityScore {
    // Ensure at least 10% improvement to meet minimum thresholds
    const baseImprovement = numChanges * intensity * 0.1
    const improvement = Math.max(baseImprovement, 0.1)
    return createQualityScore(Math.min(0.98, beforeScore + improvement))
  }

  /**
   * Build category improvements
   */
  private buildCategoryImprovements(critique: CritiqueReport, changes: readonly ChangeRecord[]): CategoryImprovements {
    const hasRhymeChanges = changes.some(c => c.type === ChangeType.RHYME_FIX)
    const hasImageryChanges = changes.some(c => c.type === ChangeType.IMAGERY_ENHANCEMENT)

    const rhymeQuality = this.buildScoreChange(
      critique.scores.rhymeQuality,
      hasRhymeChanges ? 0.15 : 0
    )

    const flowConsistency = this.buildScoreChange(
      critique.scores.flowConsistency,
      0.05
    )

    const imageryVividness = this.buildScoreChange(
      critique.scores.imageryVividness,
      hasImageryChanges ? 0.2 : 0.05
    )

    const emotionalAuthenticity = this.buildScoreChange(
      critique.scores.emotionalAuthenticity,
      0.05
    )

    const originalityScore = this.buildScoreChange(
      critique.scores.originalityScore,
      0.05
    )

    const voiceConsistency = this.buildScoreChange(
      critique.scores.voiceConsistency,
      0
    )

    return {
      rhymeQuality,
      flowConsistency,
      imageryVividness,
      emotionalAuthenticity,
      originalityScore,
      voiceConsistency
    }
  }

  /**
   * Build score change
   */
  private buildScoreChange(before: QualityScore, delta: number): ScoreChange {
    const after = createQualityScore(Math.min(0.98, before + delta))
    const percentChange = before > 0 ? ((after - before) / before) * 100 : 0

    return Object.freeze({
      before,
      after,
      delta,
      percentChange
    })
  }

  /**
   * Determine quality level change
   */
  private determineQualityLevelChange(before: QualityScore, after: QualityScore): string {
    const beforeLevel = this.scoreToLevel(before)
    const afterLevel = this.scoreToLevel(after)
    return `${beforeLevel} → ${afterLevel}`
  }

  /**
   * Convert score to quality level
   */
  private scoreToLevel(score: QualityScore): string {
    if (score >= 0.85) return 'excellent'
    if (score >= 0.7) return 'good'
    if (score >= 0.5) return 'needs_improvement'
    return 'poor'
  }

  /**
   * Should generate alternatives
   */
  private shouldGenerateAlternatives(options?: RevisionOptions): boolean {
    return options?.generateAlternatives !== false
  }

  /**
   * Build alternatives
   */
  private async buildAlternatives(input: RevisionInput, count: number): Promise<AlternativeVersion[]> {
    const alternatives: AlternativeVersion[] = []
    const directions: CreativeDirection[] = [
      CreativeDirection.DARKER,
      CreativeDirection.LIGHTER,
      CreativeDirection.MORE_EMOTIONAL
    ]

    for (let i = 0; i < Math.min(count, directions.length); i++) {
      const alt = this.buildAlternativeVersion(input.song, directions[i]!, i)
      alternatives.push(alt)
    }

    return alternatives
  }

  /**
   * Build alternative version
   */
  private buildAlternativeVersion(song: Song, direction: CreativeDirection, _index: number): AlternativeVersion {
    const versionId = `alt_${this.idCounter++}`
    const description = this.getDirectionDescription(direction)

    const revisedSong: Song = Object.freeze({
      ...song,
      id: createSongId(`${song.id}_alt_${versionId}`),
      title: `${song.title} (${direction})`,
      metadata: Object.freeze({ ...song.metadata })
    })

    const changes: ChangeRecord[] = []
    const improvementScore = createQualityScore(0.75)

    return Object.freeze({
      versionId,
      direction,
      revisedSong,
      description,
      changes: Object.freeze(changes),
      improvementScore
    })
  }

  /**
   * Get direction description
   */
  private getDirectionDescription(direction: CreativeDirection): string {
    const descriptions: Record<CreativeDirection, string> = {
      [CreativeDirection.DARKER]: 'More melancholic and introspective tone',
      [CreativeDirection.LIGHTER]: 'More uplifting and optimistic tone',
      [CreativeDirection.MORE_ABSTRACT]: 'More metaphorical and symbolic',
      [CreativeDirection.MORE_CONCRETE]: 'More specific and vivid imagery',
      [CreativeDirection.MORE_PERSONAL]: 'More intimate first-person perspective',
      [CreativeDirection.MORE_UNIVERSAL]: 'Broader, more relatable themes',
      [CreativeDirection.MORE_NARRATIVE]: 'Stronger story-telling elements',
      [CreativeDirection.MORE_EMOTIONAL]: 'More emotionally expressive'
    }
    return descriptions[direction] || 'Alternative creative direction'
  }

  /**
   * Build preserved elements
   */
  private buildPreservedElements(input: RevisionInput): string[] {
    const elements: string[] = []

    if (input.preserveVoice) {
      elements.push('Original voice and tone')
      elements.push('Perspective (POV)')
    }

    elements.push('Song structure')
    elements.push('Core themes')
    elements.push('Rhyme scheme')

    return elements
  }

  /**
   * Revise single line
   */
  private reviseSingleLine(text: string, issueType: string, _input: LineRevisionInput): string {
    // Simple pattern-based revision
    if (issueType.includes('IMAGERY')) {
      return text.replace(/the street/i, 'the cobblestone path')
        .replace(/walk/i, 'stroll')
        .replace(/good/i, 'radiant')
    }

    if (issueType.includes('WEAK_WORD')) {
      return text.replace(/bright/i, 'brilliant')
        .replace(/nice/i, 'magnificent')
    }

    if (issueType.includes('CLICHE')) {
      return text.replace(/night is dark/i, 'shadows gather thick')
    }

    if (issueType.includes('EMOTION')) {
      return text.replace(/feel so good/i, 'heart swells with joy')
    }

    if (issueType.includes('VOICE')) {
      return text.replace(/Everything is great/i, 'My world shines bright')
    }

    return `${text} (improved)`
  }

  /**
   * Generate alternative line text
   */
  private generateAlternativeLineText(original: string, _issueType: string, index: number): string {
    const alternatives = [
      `${original} (alt 1)`,
      `${original} (alt 2)`,
      `${original} (alt 3)`
    ]
    return alternatives[index] || original
  }

  /**
   * Build rhyme option
   */
  private buildRhymeOption(line1: string, line2: string, preserveMeaning: boolean, index: number): RhymeOption {
    const options = [
      { l1: line1, l2: line2, quality: 'perfect', naturalness: 0.9 },
      { l1: line1, l2: `${line2} (alt 1)`, quality: 'perfect', naturalness: 0.85 },
      { l1: `${line1} (alt)`, l2: line2, quality: 'perfect', naturalness: 0.8 }
    ]

    const option = options[index] || options[0]!

    return Object.freeze({
      line1: option.l1,
      line2: option.l2,
      rhymeQuality: option.quality,
      meaningPreserved: preserveMeaning,
      naturalness: option.naturalness,
      explanation: `Option ${index + 1}: Strengthened rhyme while maintaining flow`
    })
  }

  /**
   * Enhance imagery
   */
  private enhanceImagery(original: string, vaguePhrases: readonly string[], context: string | undefined, index: number): string {
    let enhanced = original

    for (const phrase of vaguePhrases) {
      const replacement = this.getConcreteReplacement(phrase, context, index)
      enhanced = enhanced.replace(new RegExp(phrase, 'i'), replacement)
    }

    return enhanced
  }

  /**
   * Get concrete replacement
   */
  private getConcreteReplacement(phrase: string, _context: string | undefined, index: number): string {
    const replacements: Record<string, string[]> = {
      'thing': ['weathered oak door', 'vintage photograph', 'crystal vase'],
      'nice': ['magnificent', 'breathtaking', 'stunning'],
      'good': ['radiant', 'glorious', 'brilliant'],
      'place': ['sun-drenched meadow', 'abandoned cathedral', 'windswept hilltop'],
      'beautiful': ['breathtaking', 'mesmerizing', 'enchanting'],
      'feel sad': ['heart aches', 'tears well up', 'sorrow weighs heavy'],
      'day': ['golden afternoon', 'crisp morning', 'twilight hour']
    }

    const options = replacements[phrase.toLowerCase()] || ['improved ' + phrase]
    return options[index % options.length]!
  }

  /**
   * Generate concrete replacements
   */
  private generateConcreteReplacements(phrase: string, _context: string | undefined): string[] {
    const replacements: Record<string, string[]> = {
      'thing': ['weathered oak door', 'vintage photograph', 'crystal vase', 'leather-bound journal'],
      'nice': ['magnificent', 'breathtaking', 'stunning', 'sublime'],
      'good': ['radiant', 'glorious', 'brilliant', 'splendid'],
      'place': ['sun-drenched meadow', 'abandoned cathedral', 'windswept hilltop', 'moonlit garden'],
      'beautiful': ['breathtaking', 'mesmerizing', 'enchanting', 'captivating']
    }

    return replacements[phrase.toLowerCase()] || ['improved ' + phrase, 'enhanced ' + phrase]
  }

  /**
   * Generate sensory details
   */
  private generateSensoryDetails(contextOrText: string): string[] {
    const details = [
      'Visual: golden sunlight filtering through leaves',
      'Auditory: whisper of wind through branches',
      'Tactile: rough bark beneath fingertips',
      'Olfactory: scent of rain on dry earth'
    ]

    if (contextOrText.includes('summer')) {
      details.push('Visual: heat shimmer rising from pavement')
    }

    if (contextOrText.includes('cathedral')) {
      details.push('Visual: stained glass casting rainbow patterns')
    }

    return details.slice(0, 3)
  }

  /**
   * Extract song text
   */
  private extractSongText(song: Song): string {
    const lines: string[] = []

    for (const verse of song.verses) {
      for (const line of verse.lines) {
        lines.push(line.text)
      }
    }

    for (const chorus of song.choruses) {
      for (const line of chorus.lines) {
        lines.push(line.text)
      }
    }

    if (song.bridge) {
      for (const line of song.bridge.lines) {
        lines.push(line.text)
      }
    }

    return lines.join('\n')
  }

  /**
   * Apply fix for single issue
   */
  private applyFixForIssue(song: Song, _issue: QualityIssue): Song {
    // For mock purposes, return the song unchanged
    // In a real implementation, this would apply the specific fix
    return song
  }

  /**
   * Count syllables in text (simple heuristic)
   */
  private countSyllables(text: string): number {
    const cleaned = text.toLowerCase().replace(/[^a-z\s]/g, '')
    const words = cleaned.split(/\s+/).filter(w => w.length > 0)

    let total = 0
    for (const word of words) {
      let count = 0
      let inVowelGroup = false

      for (const char of word) {
        const isVowel = 'aeiou'.includes(char)
        if (isVowel && !inVowelGroup) {
          count++
          inVowelGroup = true
        } else if (!isVowel) {
          inVowelGroup = false
        }
      }

      if (word.endsWith('e') && count > 1) {
        count--
      }

      total += Math.max(1, count)
    }

    return Math.max(1, total)
  }

  /**
   * Generate stress pattern
   */
  private generateStressPattern(syllables: number): string {
    let pattern = ''
    for (let i = 0; i < syllables; i++) {
      pattern += i % 2 === 0 ? 'x' : '/'
    }
    return pattern
  }
}
