/**
 * @fileoverview Contract Tests for Revision Engine Service
 * @purpose Ensure any implementation of IRevisionEngineService matches the contract exactly
 *
 * TEST-DRIVEN DEVELOPMENT APPROACH:
 * These tests are written BEFORE the mock implementation.
 * The mock implementation should be written to make these tests pass.
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import type {
  IRevisionEngineService,
  RevisionInput,
  RevisionResult,
  LineRevisionInput,
  LineRevisionResult,
  RhymeStrengthenInput,
  RhymeStrengthenResult,
  ImageryEnhancementInput,
  ImageryEnhancementResult,
  VoicePreservationCheck,
  RevisionOptions,
  ChangeRecord,
  AlternativeVersion,
  ImprovementMetrics
} from '../../src/contracts/RevisionEngine'
import {
  RevisionStrategy,
  ChangeType,
  CreativeDirection,
  VoiceViolationType,
  createDefaultRevisionOptions,
  calculateImprovement,
  isSuccessfulRevision
} from '../../src/contracts/RevisionEngine'
import { isSuccess, isFailure, createQualityScore } from '../../src/contracts/types/common'
import { Severity } from '../../src/contracts/types/common'
import type { Song, SongId, Line } from '../../src/contracts/types/song'
import { createSongId, createVerseId, createChorusId } from '../../src/contracts/types/song'
import type { CritiqueReport, QualityIssue } from '../../src/contracts/CritiqueEngine'
import { QualityLevel, IssueType } from '../../src/contracts/CritiqueEngine'
import type { VoiceProfile } from '../../src/contracts/SongGeneration'
import { PerspectiveType } from '../../src/contracts/SongGeneration'

/**
 * NOTE: This test suite is designed to work with ANY implementation of IRevisionEngineService.
 * During Phase 3 (BUILD), import MockRevisionEngineService.
 * During Phase 5 (IMPLEMENT), import RealRevisionEngineService.
 * The tests should pass for both implementations.
 */
describe('IRevisionEngineService Contract Tests', () => {
  let service: IRevisionEngineService

  // Helper to create a mock song for testing
  const createMockSong = (title: string = 'Test Song'): Song => {
    return {
      id: createSongId(`song_${Date.now()}`),
      title,
      verses: [{
        id: createVerseId('verse_1'),
        number: 1,
        lines: [
          { text: 'Walking down the street so bright', syllables: 8, stressPattern: 'x/x/x/x/' },
          { text: 'Feeling good with all my might', syllables: 8, stressPattern: 'x/x/x/x/' },
          { text: 'The sun is shining in the sky', syllables: 8, stressPattern: 'x/x/x/x/' },
          { text: 'I spread my wings and start to fly', syllables: 8, stressPattern: 'x/x/x/x/' }
        ],
        rhymeScheme: 'AABB',
        syllablePattern: [8, 8, 8, 8]
      }],
      choruses: [{
        id: createChorusId('chorus_1'),
        lines: [
          { text: 'This is my moment', syllables: 5, stressPattern: 'x/x/x' },
          { text: 'I will not waste it', syllables: 5, stressPattern: 'x/x/x' }
        ],
        rhymeScheme: 'AA',
        syllablePattern: [5, 5],
        isMainChorus: true
      }],
      metadata: {
        genre: 'pop',
        mood: 'uplifting'
      },
      generatedAt: new Date()
    }
  }

  // Helper to create a mock critique report
  const createMockCritique = (issueCount: number = 2): CritiqueReport => {
    const issues: QualityIssue[] = []

    for (let i = 0; i < issueCount; i++) {
      issues.push({
        issueType: IssueType.WEAK_RHYME,
        severity: Severity.MAJOR,
        type: 'weak_rhyme',
        message: `Weak rhyme detected in line ${i + 1}`,
        location: {
          line: i + 1
        },
        suggestion: 'Consider using a stronger rhyme',
        affectedLines: [i + 1],
        score_impact: 0.05,
        examples: ['alternative 1', 'alternative 2']
      })
    }

    return {
      songId: createSongId('song_123'),
      overallScore: createQualityScore(0.65),
      passesGoldStandard: false,
      qualityLevel: QualityLevel.ACCEPTABLE,
      scores: {
        rhymeQuality: createQualityScore(0.6),
        flowConsistency: createQualityScore(0.7),
        imageryVividness: createQualityScore(0.5),
        emotionalAuthenticity: createQualityScore(0.75),
        originalityScore: createQualityScore(0.8),
        voiceConsistency: createQualityScore(0.9),
        structuralCoherence: createQualityScore(0.7),
        technicalExecution: createQualityScore(0.65)
      },
      issues,
      suggestions: [
        { type: 'rhyme', description: 'Strengthen rhymes', alternatives: [] },
        { type: 'imagery', description: 'Add more vivid imagery', alternatives: [] }
      ],
      strengths: ['Good rhythm', 'Strong emotional core'],
      lineAnalysis: new Map(),
      sectionAnalysis: [],
      generatedAt: new Date()
    }
  }

  // Helper to create voice profile
  const createMockVoiceProfile = (): VoiceProfile => {
    return {
      vocabulary: ['heart', 'soul', 'light', 'dark'],
      phraseTendencies: ['uses metaphors', 'rhetorical questions'],
      perspectivePOV: PerspectiveType.FIRST_PERSON,
      toneCharacteristics: ['introspective', 'hopeful'],
      avoidances: ['clichés', 'forced rhymes']
    }
  }

  // Helper to create a quality issue
  const createQualityIssue = (
    issueType: IssueType,
    lineNumber: number,
    severity: Severity = Severity.MAJOR
  ): QualityIssue => {
    return {
      issueType,
      severity,
      type: String(issueType),
      message: `Issue: ${issueType} detected`,
      location: { line: lineNumber },
      suggestion: 'Fix this issue',
      affectedLines: [lineNumber],
      score_impact: 0.05,
      examples: []
    }
  }

  beforeEach(() => {
    const { MockRevisionEngineService } = require('../../src/services/mock/MockRevisionEngineService')
    service = new MockRevisionEngineService()
  })

  // ===========================================
  // METHOD 1: reviseSong()
  // ===========================================
  describe('reviseSong() method', () => {
    describe('Success Cases', () => {
      it('should revise song with conservative strategy', async () => {
        const song = createMockSong()
        const critique = createMockCritique()
        const input: RevisionInput = {
          song,
          critique,
          strategy: RevisionStrategy.CONSERVATIVE,
          preserveVoice: true
        }

        const result = await service.reviseSong(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const data: RevisionResult = result.data

          expect(data).toHaveProperty('revisedSong')
          expect(data).toHaveProperty('changes')
          expect(data).toHaveProperty('alternatives')
          expect(data).toHaveProperty('improvementMetrics')
          expect(data).toHaveProperty('preservedElements')
          expect(data).toHaveProperty('voiceConsistency')

          expect(data.revisedSong).toBeDefined()
          expect(Array.isArray(data.changes)).toBe(true)
          expect(Array.isArray(data.alternatives)).toBe(true)
          expect(Array.isArray(data.preservedElements)).toBe(true)
          expect(typeof data.voiceConsistency).toBe('number')
        }
      })

      it('should revise song with moderate strategy', async () => {
        const song = createMockSong()
        const critique = createMockCritique()
        const input: RevisionInput = {
          song,
          critique,
          strategy: RevisionStrategy.MODERATE,
          preserveVoice: true
        }

        const result = await service.reviseSong(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.changes.length).toBeGreaterThan(0)
        }
      })

      it('should revise song with aggressive strategy', async () => {
        const song = createMockSong()
        const critique = createMockCritique(5)
        const input: RevisionInput = {
          song,
          critique,
          strategy: RevisionStrategy.AGGRESSIVE,
          preserveVoice: false
        }

        const result = await service.reviseSong(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.changes.length).toBeGreaterThan(0)
        }
      })

      it('should revise song with surgical strategy', async () => {
        const song = createMockSong()
        const critique = createMockCritique()
        const input: RevisionInput = {
          song,
          critique,
          strategy: RevisionStrategy.SURGICAL,
          preserveVoice: true
        }

        const result = await service.reviseSong(input)

        expect(isSuccess(result)).toBe(true)
      })

      it('should revise song with creative strategy', async () => {
        const song = createMockSong()
        const critique = createMockCritique()
        const input: RevisionInput = {
          song,
          critique,
          strategy: RevisionStrategy.CREATIVE,
          preserveVoice: false
        }

        const result = await service.reviseSong(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.alternatives.length).toBeGreaterThan(0)
        }
      })

      it('should preserve voice when requested', async () => {
        const song = createMockSong()
        const critique = createMockCritique()
        const voiceProfile = createMockVoiceProfile()
        const input: RevisionInput = {
          song,
          critique,
          strategy: RevisionStrategy.MODERATE,
          preserveVoice: true,
          voiceProfile
        }

        const result = await service.reviseSong(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.voiceConsistency).toBeGreaterThanOrEqual(0.7)
        }
      })

      it('should target specific issue types', async () => {
        const song = createMockSong()
        const critique = createMockCritique()
        const input: RevisionInput = {
          song,
          critique,
          strategy: RevisionStrategy.SURGICAL,
          preserveVoice: true,
          targetIssues: ['WEAK_RHYME' as IssueType]
        }

        const result = await service.reviseSong(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const rhymeChanges = result.data.changes.filter(
            change => change.issueFixed === IssueType.WEAK_RHYME
          )
          expect(rhymeChanges.length).toBeGreaterThan(0)
        }
      })

      it('should apply custom feedback', async () => {
        const song = createMockSong()
        const critique = createMockCritique()
        const input: RevisionInput = {
          song,
          critique,
          strategy: RevisionStrategy.MODERATE,
          preserveVoice: true,
          customFeedback: ['Make the imagery more vivid', 'Strengthen the emotional impact']
        }

        const result = await service.reviseSong(input)

        expect(isSuccess(result)).toBe(true)
      })

      it('should generate change records with all required fields', async () => {
        const song = createMockSong()
        const critique = createMockCritique()
        const input: RevisionInput = {
          song,
          critique,
          strategy: RevisionStrategy.MODERATE,
          preserveVoice: true
        }

        const result = await service.reviseSong(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result) && result.data.changes.length > 0) {
          const change: ChangeRecord = result.data.changes[0]!

          expect(change).toHaveProperty('changeId')
          expect(change).toHaveProperty('type')
          expect(change).toHaveProperty('location')
          expect(change).toHaveProperty('original')
          expect(change).toHaveProperty('revised')
          expect(change).toHaveProperty('reason')
          expect(change).toHaveProperty('issueFixed')
          expect(change).toHaveProperty('improvementScore')

          expect(typeof change.changeId).toBe('string')
          expect(Object.values(ChangeType)).toContain(change.type)
          expect(typeof change.original).toBe('string')
          expect(typeof change.revised).toBe('string')
          expect(typeof change.reason).toBe('string')
          expect(typeof change.improvementScore).toBe('number')
        }
      })

      it('should show improvement in metrics', async () => {
        const song = createMockSong()
        const critique = createMockCritique()
        const input: RevisionInput = {
          song,
          critique,
          strategy: RevisionStrategy.MODERATE,
          preserveVoice: true
        }

        const result = await service.reviseSong(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const metrics: ImprovementMetrics = result.data.improvementMetrics

          expect(metrics).toHaveProperty('beforeScore')
          expect(metrics).toHaveProperty('afterScore')
          expect(metrics).toHaveProperty('improvement')
          expect(metrics).toHaveProperty('issuesFixed')
          expect(metrics).toHaveProperty('issuesRemaining')
          expect(metrics).toHaveProperty('categoryImprovements')
          expect(metrics).toHaveProperty('qualityLevelChange')

          expect(typeof metrics.beforeScore).toBe('number')
          expect(typeof metrics.afterScore).toBe('number')
          expect(typeof metrics.improvement).toBe('number')
          expect(typeof metrics.issuesFixed).toBe('number')
          expect(typeof metrics.issuesRemaining).toBe('number')
          expect(typeof metrics.qualityLevelChange).toBe('string')

          expect(metrics.afterScore).toBeGreaterThanOrEqual(metrics.beforeScore)
        }
      })

      it('should respect revision options', async () => {
        const song = createMockSong()
        const critique = createMockCritique()
        const input: RevisionInput = {
          song,
          critique,
          strategy: RevisionStrategy.MODERATE,
          preserveVoice: true
        }
        const options: RevisionOptions = {
          maxIterations: 3,
          minImprovement: 10,
          generateAlternatives: true,
          alternativeCount: 2,
          strictVoicePreservation: true
        }

        const result = await service.reviseSong(input, options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.alternatives.length).toBeLessThanOrEqual(2)
        }
      })

      it('should generate alternative versions', async () => {
        const song = createMockSong()
        const critique = createMockCritique()
        const input: RevisionInput = {
          song,
          critique,
          strategy: RevisionStrategy.CREATIVE,
          preserveVoice: false
        }
        const options: RevisionOptions = {
          generateAlternatives: true,
          alternativeCount: 3
        }

        const result = await service.reviseSong(input, options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(Array.isArray(result.data.alternatives)).toBe(true)

          if (result.data.alternatives.length > 0) {
            const alt: AlternativeVersion = result.data.alternatives[0]!

            expect(alt).toHaveProperty('versionId')
            expect(alt).toHaveProperty('direction')
            expect(alt).toHaveProperty('revisedSong')
            expect(alt).toHaveProperty('description')
            expect(alt).toHaveProperty('changes')
            expect(alt).toHaveProperty('improvementScore')

            expect(Object.values(CreativeDirection)).toContain(alt.direction)
          }
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for invalid song', async () => {
        const critique = createMockCritique()
        const input: RevisionInput = {
          // @ts-expect-error - Testing runtime behavior
          song: null,
          critique,
          strategy: RevisionStrategy.MODERATE,
          preserveVoice: true
        }

        const result = await service.reviseSong(input)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('INVALID_SONG')
        }
      })

      it('should return error for invalid critique', async () => {
        const song = createMockSong()
        const input: RevisionInput = {
          song,
          // @ts-expect-error - Testing runtime behavior
          critique: null,
          strategy: RevisionStrategy.MODERATE,
          preserveVoice: true
        }

        const result = await service.reviseSong(input)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('INVALID_CRITIQUE')
        }
      })

      it('should return error when revision fails', async () => {
        const baseSong = createMockSong()
        const song: Song = {
          ...baseSong,
          id: 'TRIGGER_REVISION_FAILURE' as SongId
        }
        const critique = createMockCritique()
        const input: RevisionInput = {
          song,
          critique,
          strategy: RevisionStrategy.MODERATE,
          preserveVoice: true
        }

        const result = await service.reviseSong(input)

        if (isFailure(result)) {
          expect(result.error.code).toBe('REVISION_FAILED')
        }
      })

      it('should return error when no improvement possible', async () => {
        const song = createMockSong()
        const critique: CritiqueReport = {
          ...createMockCritique(),
          overallScore: createQualityScore(0.95),
          issues: []
        }
        const input: RevisionInput = {
          song,
          critique,
          strategy: RevisionStrategy.CONSERVATIVE,
          preserveVoice: true
        }
        const options: RevisionOptions = {
          minImprovement: 20
        }

        const result = await service.reviseSong(input, options)

        if (isFailure(result)) {
          expect(result.error.code).toBe('NO_IMPROVEMENT')
        }
      })

      it('should return error when voice preservation fails', async () => {
        const song = createMockSong()
        const critique = createMockCritique()
        const voiceProfile = createMockVoiceProfile()
        const input: RevisionInput = {
          song,
          critique,
          strategy: RevisionStrategy.AGGRESSIVE,
          preserveVoice: true,
          voiceProfile
        }
        const options: RevisionOptions = {
          strictVoicePreservation: true
        }

        const result = await service.reviseSong(input, options)

        if (isFailure(result)) {
          expect(['VOICE_PRESERVATION_FAILED', 'REVISION_FAILED']).toContain(result.error.code)
        }
      })

      it('should return error when max iterations exceeded', async () => {
        const song = createMockSong()
        const critique = createMockCritique(10)
        const input: RevisionInput = {
          song,
          critique,
          strategy: RevisionStrategy.SURGICAL,
          preserveVoice: true
        }
        const options: RevisionOptions = {
          maxIterations: 1,
          minImprovement: 50
        }

        const result = await service.reviseSong(input, options)

        if (isFailure(result)) {
          expect(['MAX_ITERATIONS_EXCEEDED', 'NO_IMPROVEMENT']).toContain(result.error.code)
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs: any[] = [
          // @ts-expect-error
          null,
          // @ts-expect-error
          undefined,
          // @ts-expect-error
          {},
          { song: null, critique: null, strategy: 'invalid', preserveVoice: true }
        ]

        for (const input of badInputs) {
          await expect(service.reviseSong(input)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const song = createMockSong()
        const critique = createMockCritique()
        const input: RevisionInput = {
          song,
          critique,
          strategy: RevisionStrategy.MODERATE,
          preserveVoice: true
        }

        const result = await service.reviseSong(input)

        expect(result).toHaveProperty('success')
        expect(typeof result.success).toBe('boolean')

        if (result.success) {
          expect(result).toHaveProperty('data')
          expect(result).not.toHaveProperty('error')
        } else {
          expect(result).toHaveProperty('error')
          expect(result).not.toHaveProperty('data')
        }
      })

      it('should preserve readonly semantics on output', async () => {
        const song = createMockSong()
        const critique = createMockCritique()
        const input: RevisionInput = {
          song,
          critique,
          strategy: RevisionStrategy.MODERATE,
          preserveVoice: true
        }

        const result = await service.reviseSong(input)

        if (isSuccess(result)) {
          expect(() => {
            // @ts-expect-error
            result.data.revisedSong.title = 'changed'
          }).toThrow()

          expect(() => {
            // @ts-expect-error
            result.data.changes.push({} as any)
          }).toThrow()
        }
      })
    })
  })

  // ===========================================
  // METHOD 2: reviseLine()
  // ===========================================
  describe('reviseLine() method', () => {
    describe('Success Cases', () => {
      it('should revise line to fix issue', async () => {
        const line: Line = {
          text: 'I walk down the street',
          syllables: 5,
          stressPattern: 'x/x/x'
        }
        const issue = createQualityIssue(IssueType.VAGUE_IMAGERY, 1, Severity.MAJOR)
        const input: LineRevisionInput = {
          line,
          issue,
          preserveRhyme: true,
          preserveRhythm: true
        }

        const result = await service.reviseLine(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const data: LineRevisionResult = result.data

          expect(data).toHaveProperty('original')
          expect(data).toHaveProperty('revised')
          expect(data).toHaveProperty('alternatives')
          expect(data).toHaveProperty('improvement')
          expect(data).toHaveProperty('preservedRhyme')
          expect(data).toHaveProperty('preservedRhythm')

          expect(data.original.text).toBe(line.text)
          expect(data.revised.text).toBeDefined()
          expect(data.revised.text).not.toBe(line.text)
          expect(Array.isArray(data.alternatives)).toBe(true)
          expect(typeof data.improvement).toBe('number')
          expect(typeof data.preservedRhyme).toBe('boolean')
          expect(typeof data.preservedRhythm).toBe('boolean')
        }
      })

      it('should preserve rhyme when requested', async () => {
        const line: Line = {
          text: 'The sun is bright',
          syllables: 4,
          stressPattern: 'x/x/'
        }
        const issue = createQualityIssue(IssueType.WEAK_RHYME, 1, Severity.MINOR)
        const input: LineRevisionInput = {
          line,
          issue,
          preserveRhyme: true,
          preserveRhythm: false
        }

        const result = await service.reviseLine(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.preservedRhyme).toBe(true)
        }
      })

      it('should preserve rhythm when requested', async () => {
        const line: Line = {
          text: 'Walking down the road',
          syllables: 5,
          stressPattern: 'x/x/x'
        }
        const issue = createQualityIssue(IssueType.VAGUE_IMAGERY, 1, Severity.MAJOR)
        const input: LineRevisionInput = {
          line,
          issue,
          preserveRhyme: false,
          preserveRhythm: true
        }

        const result = await service.reviseLine(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.preservedRhythm).toBe(true)
          expect(result.data.revised.syllables).toBe(line.syllables)
        }
      })

      it('should use context for better revisions', async () => {
        const line: Line = {
          text: 'I feel so good',
          syllables: 4,
          stressPattern: 'x/x/'
        }
        const issue = createQualityIssue(IssueType.VAGUE_IMAGERY, 1, Severity.MAJOR)
        const context: Line[] = [
          { text: 'The morning sun breaks through', syllables: 7, stressPattern: 'x/x/x/x' },
          { text: 'Lighting up my world anew', syllables: 7, stressPattern: 'x/x/x/x' }
        ]
        const input: LineRevisionInput = {
          line,
          issue,
          context,
          preserveRhyme: true,
          preserveRhythm: true
        }

        const result = await service.reviseLine(input)

        expect(isSuccess(result)).toBe(true)
      })

      it('should apply voice profile', async () => {
        const line: Line = {
          text: 'Everything is great',
          syllables: 5,
          stressPattern: 'x/x/x'
        }
        const issue = createQualityIssue(IssueType.VAGUE_IMAGERY, 1, Severity.CRITICAL)
        const voiceProfile = createMockVoiceProfile()
        const input: LineRevisionInput = {
          line,
          issue,
          preserveRhyme: false,
          preserveRhythm: false,
          voiceProfile
        }

        const result = await service.reviseLine(input)

        expect(isSuccess(result)).toBe(true)
      })

      it('should generate multiple alternatives', async () => {
        const line: Line = {
          text: 'The night is dark',
          syllables: 4,
          stressPattern: 'x/x/'
        }
        const issue = createQualityIssue(IssueType.CLICHE, 1, Severity.MAJOR)
        const input: LineRevisionInput = {
          line,
          issue,
          preserveRhyme: false,
          preserveRhythm: true
        }

        const result = await service.reviseLine(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.alternatives.length).toBeGreaterThan(0)
          result.data.alternatives.forEach(alt => {
            expect(alt).toHaveProperty('text')
            expect(alt).toHaveProperty('syllables')
            expect(alt).toHaveProperty('stressPattern')
          })
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for invalid line', async () => {
        const issue = createQualityIssue(IssueType.WEAK_RHYME, 1, Severity.MAJOR)
        const input: LineRevisionInput = {
          // @ts-expect-error
          line: null,
          issue,
          preserveRhyme: true,
          preserveRhythm: true
        }

        const result = await service.reviseLine(input)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(['INVALID_SONG', 'REVISION_FAILED']).toContain(result.error.code)
        }
      })

      it('should return error for invalid issue', async () => {
        const line: Line = {
          text: 'Some text',
          syllables: 2,
          stressPattern: 'x/'
        }
        const input: LineRevisionInput = {
          line,
          // @ts-expect-error
          issue: null,
          preserveRhyme: true,
          preserveRhythm: true
        }

        const result = await service.reviseLine(input)

        expect(isFailure(result)).toBe(true)
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs: any[] = [
          // @ts-expect-error
          null,
          // @ts-expect-error
          undefined,
          // @ts-expect-error
          {},
          { line: null, issue: null, preserveRhyme: true, preserveRhythm: true }
        ]

        for (const input of badInputs) {
          await expect(service.reviseLine(input)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const line: Line = { text: 'Test', syllables: 1, stressPattern: '/' }
        const issue = createQualityIssue(IssueType.WEAK_RHYME, 1, Severity.MAJOR)
        const input: LineRevisionInput = {
          line,
          issue,
          preserveRhyme: true,
          preserveRhythm: true
        }

        const result = await service.reviseLine(input)

        expect(result).toHaveProperty('success')
        expect(typeof result.success).toBe('boolean')
      })

      it('should preserve readonly semantics on output', async () => {
        const line: Line = { text: 'Test', syllables: 1, stressPattern: '/' }
        const issue = createQualityIssue(IssueType.WEAK_RHYME, 1, Severity.MAJOR)
        const input: LineRevisionInput = {
          line,
          issue,
          preserveRhyme: true,
          preserveRhythm: true
        }

        const result = await service.reviseLine(input)

        if (isSuccess(result)) {
          expect(() => {
            // @ts-expect-error
            result.data.revised.text = 'changed'
          }).toThrow()
        }
      })
    })
  })

  // ===========================================
  // METHOD 3: strengthenRhyme()
  // ===========================================
  describe('strengthenRhyme() method', () => {
    describe('Success Cases', () => {
      it('should strengthen rhyme between two lines', async () => {
        const line1: Line = {
          text: 'I walk along the way',
          syllables: 6,
          stressPattern: 'x/x/x/'
        }
        const line2: Line = {
          text: 'Hoping for a better day',
          syllables: 7,
          stressPattern: 'x/x/x/x'
        }
        const input: RhymeStrengthenInput = {
          line1,
          line2,
          currentQuality: 'perfect',
          targetQuality: 'perfect',
          preserveMeaning: true
        }

        const result = await service.strengthenRhyme(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const data: RhymeStrengthenResult = result.data

          expect(data).toHaveProperty('option1')
          expect(data).toHaveProperty('option2')
          expect(data).toHaveProperty('option3')
          expect(data).toHaveProperty('recommended')

          expect(typeof data.recommended).toBe('number')
          expect(data.recommended).toBeGreaterThanOrEqual(1)
          expect(data.recommended).toBeLessThanOrEqual(3)

          const option1 = data.option1
          expect(option1).toHaveProperty('line1')
          expect(option1).toHaveProperty('line2')
          expect(option1).toHaveProperty('rhymeQuality')
          expect(option1).toHaveProperty('meaningPreserved')
          expect(option1).toHaveProperty('naturalness')
          expect(option1).toHaveProperty('explanation')

          expect(typeof option1.line1).toBe('string')
          expect(typeof option1.line2).toBe('string')
          expect(typeof option1.rhymeQuality).toBe('string')
          expect(typeof option1.meaningPreserved).toBe('boolean')
          expect(typeof option1.naturalness).toBe('number')
          expect(option1.naturalness).toBeGreaterThanOrEqual(0)
          expect(option1.naturalness).toBeLessThanOrEqual(1)
        }
      })

      it('should preserve meaning when requested', async () => {
        const line1: Line = { text: 'The stars shine bright', syllables: 5, stressPattern: 'x/x/' }
        const line2: Line = { text: 'Throughout the night', syllables: 4, stressPattern: 'x/x/' }
        const input: RhymeStrengthenInput = {
          line1,
          line2,
          currentQuality: 'perfect',
          targetQuality: 'perfect',
          preserveMeaning: true
        }

        const result = await service.strengthenRhyme(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.option1.meaningPreserved).toBe(true)
        }
      })

      it('should allow meaning changes when not preserving', async () => {
        const line1: Line = { text: 'I feel so alone', syllables: 5, stressPattern: 'x/x/x' }
        const line2: Line = { text: 'Walking all alone', syllables: 5, stressPattern: 'x/x/x' }
        const input: RhymeStrengthenInput = {
          line1,
          line2,
          currentQuality: 'weak',
          targetQuality: 'perfect',
          preserveMeaning: false
        }

        const result = await service.strengthenRhyme(input)

        expect(isSuccess(result)).toBe(true)
      })

      it('should recommend the best option', async () => {
        const line1: Line = { text: 'The sun sets low', syllables: 4, stressPattern: 'x/x/' }
        const line2: Line = { text: 'With a gentle glow', syllables: 5, stressPattern: 'x/x/x' }
        const input: RhymeStrengthenInput = {
          line1,
          line2,
          currentQuality: 'near',
          targetQuality: 'perfect',
          preserveMeaning: true
        }

        const result = await service.strengthenRhyme(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const recommended = result.data.recommended
          expect([1, 2, 3]).toContain(recommended)

          const recommendedOption = recommended === 1 ? result.data.option1 :
                                   recommended === 2 ? result.data.option2 :
                                   result.data.option3

          expect(recommendedOption.naturalness).toBeGreaterThan(0)
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for invalid lines', async () => {
        const input: RhymeStrengthenInput = {
          // @ts-expect-error
          line1: null,
          line2: { text: 'test', syllables: 1, stressPattern: '/' },
          currentQuality: 'weak',
          targetQuality: 'perfect',
          preserveMeaning: true
        }

        const result = await service.strengthenRhyme(input)

        expect(isFailure(result)).toBe(true)
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs: any[] = [
          // @ts-expect-error
          null,
          // @ts-expect-error
          undefined,
          // @ts-expect-error
          {},
          { line1: null, line2: null, currentQuality: 'weak', targetQuality: 'perfect', preserveMeaning: true }
        ]

        for (const input of badInputs) {
          await expect(service.strengthenRhyme(input)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const line1: Line = { text: 'test', syllables: 1, stressPattern: '/' }
        const line2: Line = { text: 'best', syllables: 1, stressPattern: '/' }
        const input: RhymeStrengthenInput = {
          line1,
          line2,
          currentQuality: 'weak',
          targetQuality: 'perfect',
          preserveMeaning: true
        }

        const result = await service.strengthenRhyme(input)

        expect(result).toHaveProperty('success')
        expect(typeof result.success).toBe('boolean')
      })

      it('should preserve readonly semantics on output', async () => {
        const line1: Line = { text: 'test', syllables: 1, stressPattern: '/' }
        const line2: Line = { text: 'best', syllables: 1, stressPattern: '/' }
        const input: RhymeStrengthenInput = {
          line1,
          line2,
          currentQuality: 'weak',
          targetQuality: 'perfect',
          preserveMeaning: true
        }

        const result = await service.strengthenRhyme(input)

        if (isSuccess(result)) {
          expect(() => {
            // @ts-expect-error
            result.data.option1.line1 = 'changed'
          }).toThrow()
        }
      })
    })
  })

  // ===========================================
  // METHOD 4: improveImagery()
  // ===========================================
  describe('improveImagery() method', () => {
    describe('Success Cases', () => {
      it('should improve imagery in line', async () => {
        const line: Line = {
          text: 'I feel sad today',
          syllables: 5,
          stressPattern: 'x/x/x'
        }
        const input: ImageryEnhancementInput = {
          line,
          vaguePhrases: ['feel sad'],
          targetVividness: createQualityScore(0.9)
        }

        const result = await service.improveImagery(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const data: ImageryEnhancementResult = result.data

          expect(data).toHaveProperty('original')
          expect(data).toHaveProperty('enhanced')
          expect(data).toHaveProperty('concreteReplacements')
          expect(data).toHaveProperty('sensoryDetails')

          expect(data.original).toBe(line.text)
          expect(Array.isArray(data.enhanced)).toBe(true)
          expect(data.enhanced.length).toBeGreaterThan(0)
          expect(data.concreteReplacements).toBeInstanceOf(Map)
          expect(Array.isArray(data.sensoryDetails)).toBe(true)
        }
      })

      it('should provide concrete replacements for vague phrases', async () => {
        const line: Line = {
          text: 'The thing was nice',
          syllables: 4,
          stressPattern: 'x/x/'
        }
        const input: ImageryEnhancementInput = {
          line,
          vaguePhrases: ['thing', 'nice'],
          targetVividness: createQualityScore(0.85)
        }

        const result = await service.improveImagery(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.concreteReplacements.size).toBeGreaterThan(0)
        }
      })

      it('should add sensory details', async () => {
        const line: Line = {
          text: 'The day was good',
          syllables: 4,
          stressPattern: 'x/x/'
        }
        const input: ImageryEnhancementInput = {
          line,
          vaguePhrases: ['good'],
          targetVividness: createQualityScore(0.9),
          context: 'summer morning'
        }

        const result = await service.improveImagery(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.sensoryDetails.length).toBeGreaterThan(0)
        }
      })

      it('should use context for better suggestions', async () => {
        const line: Line = {
          text: 'The place was beautiful',
          syllables: 6,
          stressPattern: 'x/x/x/'
        }
        const input: ImageryEnhancementInput = {
          line,
          vaguePhrases: ['place', 'beautiful'],
          targetVividness: createQualityScore(0.95),
          context: 'abandoned cathedral at sunset'
        }

        const result = await service.improveImagery(input)

        expect(isSuccess(result)).toBe(true)
      })
    })

    describe('Error Cases', () => {
      it('should return error for invalid line', async () => {
        const input: ImageryEnhancementInput = {
          // @ts-expect-error
          line: null,
          vaguePhrases: ['test'],
          targetVividness: createQualityScore(0.8)
        }

        const result = await service.improveImagery(input)

        expect(isFailure(result)).toBe(true)
      })

      it('should return error for empty vague phrases', async () => {
        const line: Line = { text: 'test', syllables: 1, stressPattern: '/' }
        const input: ImageryEnhancementInput = {
          line,
          vaguePhrases: [],
          targetVividness: createQualityScore(0.8)
        }

        const result = await service.improveImagery(input)

        if (isFailure(result)) {
          expect(['INVALID_SONG', 'REVISION_FAILED']).toContain(result.error.code)
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs: any[] = [
          // @ts-expect-error
          null,
          // @ts-expect-error
          undefined,
          // @ts-expect-error
          {},
          { line: null, vaguePhrases: [], targetVividness: createQualityScore(0.8) }
        ]

        for (const input of badInputs) {
          await expect(service.improveImagery(input)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const line: Line = { text: 'The thing was nice', syllables: 4, stressPattern: 'x/x/' }
        const input: ImageryEnhancementInput = {
          line,
          vaguePhrases: ['thing'],
          targetVividness: createQualityScore(0.8)
        }

        const result = await service.improveImagery(input)

        expect(result).toHaveProperty('success')
        expect(typeof result.success).toBe('boolean')
      })

      it('should preserve readonly semantics on output', async () => {
        const line: Line = { text: 'test', syllables: 1, stressPattern: '/' }
        const input: ImageryEnhancementInput = {
          line,
          vaguePhrases: ['test'],
          targetVividness: createQualityScore(0.8)
        }

        const result = await service.improveImagery(input)

        if (isSuccess(result)) {
          expect(() => {
            // @ts-expect-error
            result.data.enhanced.push('new')
          }).toThrow()

          expect(() => {
            // @ts-expect-error
            result.data.sensoryDetails.push('new')
          }).toThrow()
        }
      })
    })
  })

  // ===========================================
  // METHOD 5: generateAlternatives()
  // ===========================================
  describe('generateAlternatives() method', () => {
    describe('Success Cases', () => {
      it('should generate alternatives with different directions', async () => {
        const song = createMockSong()
        const directions: readonly CreativeDirection[] = [
          CreativeDirection.DARKER,
          CreativeDirection.LIGHTER
        ]
        const count = 2

        const result = await service.generateAlternatives(song, directions, count)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(Array.isArray(result.data)).toBe(true)
          expect(result.data.length).toBeGreaterThan(0)
          expect(result.data.length).toBeLessThanOrEqual(directions.length * count)

          if (result.data.length > 0) {
            const alt = result.data[0]!
            expect(Object.values(CreativeDirection)).toContain(alt.direction)
          }
        }
      })

      it('should use default count when not specified', async () => {
        const song = createMockSong()
        const directions: readonly CreativeDirection[] = [CreativeDirection.MORE_PERSONAL]

        const result = await service.generateAlternatives(song, directions)

        expect(isSuccess(result)).toBe(true)
      })

      it('should handle multiple creative directions', async () => {
        const song = createMockSong()
        const directions: readonly CreativeDirection[] = [
          CreativeDirection.DARKER,
          CreativeDirection.MORE_ABSTRACT,
          CreativeDirection.MORE_EMOTIONAL
        ]

        const result = await service.generateAlternatives(song, directions, 1)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.length).toBeGreaterThan(0)
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for invalid song', async () => {
        const directions: readonly CreativeDirection[] = [CreativeDirection.LIGHTER]

        // @ts-expect-error
        const result = await service.generateAlternatives(null, directions)

        expect(isFailure(result)).toBe(true)
      })

      it('should return error for empty directions', async () => {
        const song = createMockSong()
        const directions: readonly CreativeDirection[] = []

        const result = await service.generateAlternatives(song, directions)

        if (isFailure(result)) {
          expect(['INVALID_SONG', 'REVISION_FAILED']).toContain(result.error.code)
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs: Array<[any, any, any?]> = [
          // @ts-expect-error
          [null, [CreativeDirection.DARKER], 1],
          // @ts-expect-error
          [createMockSong(), null, 1],
          // @ts-expect-error
          [createMockSong(), [], undefined]
        ]

        for (const [song, directions, count] of badInputs) {
          await expect(service.generateAlternatives(song, directions, count)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const song = createMockSong()
        const directions: readonly CreativeDirection[] = [CreativeDirection.LIGHTER]

        const result = await service.generateAlternatives(song, directions)

        expect(result).toHaveProperty('success')
        expect(typeof result.success).toBe('boolean')
      })

      it('should preserve readonly semantics on output', async () => {
        const song = createMockSong()
        const directions: readonly CreativeDirection[] = [CreativeDirection.DARKER]

        const result = await service.generateAlternatives(song, directions)

        if (isSuccess(result)) {
          expect(() => {
            // @ts-expect-error
            result.data.push({} as any)
          }).toThrow()
        }
      })
    })
  })

  // ===========================================
  // METHOD 6: checkVoicePreservation()
  // ===========================================
  describe('checkVoicePreservation() method', () => {
    describe('Success Cases', () => {
      it('should check voice preservation between songs', async () => {
        const original = createMockSong('Original')
        const revised = createMockSong('Revised')
        const voiceProfile = createMockVoiceProfile()

        const result = await service.checkVoicePreservation(original, revised, voiceProfile)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const data: VoicePreservationCheck = result.data

          expect(data).toHaveProperty('originalVoice')
          expect(data).toHaveProperty('revisedText')
          expect(data).toHaveProperty('consistencyScore')
          expect(data).toHaveProperty('violations')
          expect(data).toHaveProperty('passed')

          expect(typeof data.revisedText).toBe('string')
          expect(typeof data.consistencyScore).toBe('number')
          expect(Array.isArray(data.violations)).toBe(true)
          expect(typeof data.passed).toBe('boolean')
        }
      })

      it('should detect voice violations', async () => {
        const original = createMockSong('Original')
        const baseSong = createMockSong('Revised')
        const revised: Song = {
          ...baseSong,
          id: 'TRIGGER_VOICE_VIOLATION' as SongId
        }
        const voiceProfile = createMockVoiceProfile()

        const result = await service.checkVoicePreservation(original, revised, voiceProfile)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result) && result.data.violations.length > 0) {
          const violation = result.data.violations[0]!

          expect(violation).toHaveProperty('type')
          expect(violation).toHaveProperty('location')
          expect(violation).toHaveProperty('phrase')
          expect(violation).toHaveProperty('explanation')
          expect(violation).toHaveProperty('suggestion')

          expect(Object.values(VoiceViolationType)).toContain(violation.type)
        }
      })

      it('should pass when voice is preserved', async () => {
        const original = createMockSong('Original')
        const revised = { ...original, title: 'Slightly Revised' }
        const voiceProfile = createMockVoiceProfile()

        const result = await service.checkVoicePreservation(original, revised, voiceProfile)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.consistencyScore).toBeGreaterThan(0.7)
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for invalid original song', async () => {
        const revised = createMockSong()
        const voiceProfile = createMockVoiceProfile()

        // @ts-expect-error
        const result = await service.checkVoicePreservation(null, revised, voiceProfile)

        expect(isFailure(result)).toBe(true)
      })

      it('should return error for invalid revised song', async () => {
        const original = createMockSong()
        const voiceProfile = createMockVoiceProfile()

        // @ts-expect-error
        const result = await service.checkVoicePreservation(original, null, voiceProfile)

        expect(isFailure(result)).toBe(true)
      })

      it('should return error for invalid voice profile', async () => {
        const original = createMockSong()
        const revised = createMockSong()

        // @ts-expect-error
        const result = await service.checkVoicePreservation(original, revised, null)

        expect(isFailure(result)).toBe(true)
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs: Array<[any, any, any]> = [
          // @ts-expect-error
          [null, createMockSong(), createMockVoiceProfile()],
          // @ts-expect-error
          [createMockSong(), null, createMockVoiceProfile()],
          // @ts-expect-error
          [createMockSong(), createMockSong(), null]
        ]

        for (const [original, revised, voiceProfile] of badInputs) {
          await expect(service.checkVoicePreservation(original, revised, voiceProfile)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const original = createMockSong()
        const revised = createMockSong()
        const voiceProfile = createMockVoiceProfile()

        const result = await service.checkVoicePreservation(original, revised, voiceProfile)

        expect(result).toHaveProperty('success')
        expect(typeof result.success).toBe('boolean')
      })

      it('should preserve readonly semantics on output', async () => {
        const original = createMockSong()
        const revised = createMockSong()
        const voiceProfile = createMockVoiceProfile()

        const result = await service.checkVoicePreservation(original, revised, voiceProfile)

        if (isSuccess(result)) {
          expect(() => {
            // @ts-expect-error
            result.data.violations.push({} as any)
          }).toThrow()
        }
      })
    })
  })

  // ===========================================
  // METHOD 7: applyTargetedFixes()
  // ===========================================
  describe('applyTargetedFixes() method', () => {
    describe('Success Cases', () => {
      it('should apply targeted fixes to song', async () => {
        const song = createMockSong()
        const issues: readonly QualityIssue[] = [
          createQualityIssue(IssueType.WEAK_RHYME, 1, Severity.MAJOR)
        ]

        const result = await service.applyTargetedFixes(song, issues)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data).toHaveProperty('id')
          expect(result.data).toHaveProperty('title')
          expect(result.data).toHaveProperty('verses')
          expect(result.data).toHaveProperty('choruses')
        }
      })

      it('should handle multiple issues', async () => {
        const song = createMockSong()
        const issues: readonly QualityIssue[] = [
          createQualityIssue(IssueType.WEAK_RHYME, 1, Severity.MAJOR),
          createQualityIssue(IssueType.VAGUE_IMAGERY, 2, Severity.CRITICAL)
        ]

        const result = await service.applyTargetedFixes(song, issues)

        expect(isSuccess(result)).toBe(true)
      })

      it('should handle empty issues array', async () => {
        const song = createMockSong()
        const issues: readonly QualityIssue[] = []

        const result = await service.applyTargetedFixes(song, issues)

        if (isSuccess(result)) {
          expect(result.data.id).toBe(song.id)
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for invalid song', async () => {
        const issues: readonly QualityIssue[] = []

        // @ts-expect-error
        const result = await service.applyTargetedFixes(null, issues)

        expect(isFailure(result)).toBe(true)
      })

      it('should return error for invalid issues', async () => {
        const song = createMockSong()

        // @ts-expect-error
        const result = await service.applyTargetedFixes(song, null)

        expect(isFailure(result)).toBe(true)
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs: Array<[any, any]> = [
          // @ts-expect-error
          [null, []],
          // @ts-expect-error
          [createMockSong(), null],
          // @ts-expect-error
          [undefined, undefined]
        ]

        for (const [song, issues] of badInputs) {
          await expect(service.applyTargetedFixes(song, issues)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const song = createMockSong()
        const issues: readonly QualityIssue[] = []

        const result = await service.applyTargetedFixes(song, issues)

        expect(result).toHaveProperty('success')
        expect(typeof result.success).toBe('boolean')
      })

      it('should preserve readonly semantics on output', async () => {
        const song = createMockSong()
        const issues: readonly QualityIssue[] = []

        const result = await service.applyTargetedFixes(song, issues)

        if (isSuccess(result)) {
          expect(() => {
            // @ts-expect-error
            result.data.title = 'changed'
          }).toThrow()
        }
      })
    })
  })

  // ===========================================
  // HELPER FUNCTIONS TESTS
  // ===========================================
  describe('Helper Functions', () => {
    describe('createDefaultRevisionOptions()', () => {
      it('should create options with default values', () => {
        const options = createDefaultRevisionOptions()

        expect(options).toHaveProperty('maxIterations')
        expect(options).toHaveProperty('minImprovement')
        expect(options).toHaveProperty('generateAlternatives')
        expect(options).toHaveProperty('alternativeCount')
        expect(options).toHaveProperty('strictVoicePreservation')

        expect(typeof options.maxIterations).toBe('number')
        expect(typeof options.minImprovement).toBe('number')
        expect(typeof options.generateAlternatives).toBe('boolean')
        expect(typeof options.alternativeCount).toBe('number')
        expect(typeof options.strictVoicePreservation).toBe('boolean')

        expect(options.maxIterations).toBeGreaterThan(0)
        expect(options.minImprovement).toBeGreaterThanOrEqual(0)
        expect(options.alternativeCount).toBeGreaterThan(0)
      })
    })

    describe('calculateImprovement()', () => {
      it('should calculate improvement percentage correctly', () => {
        const before = createQualityScore(0.5)
        const after = createQualityScore(0.75)

        const improvement = calculateImprovement(before, after)

        expect(typeof improvement).toBe('number')
        expect(improvement).toBe(50) // (0.75 - 0.5) / 0.5 * 100 = 50%
      })

      it('should handle zero improvement', () => {
        const before = createQualityScore(0.8)
        const after = createQualityScore(0.8)

        const improvement = calculateImprovement(before, after)

        expect(improvement).toBe(0)
      })

      it('should handle negative improvement', () => {
        const before = createQualityScore(0.8)
        const after = createQualityScore(0.6)

        const improvement = calculateImprovement(before, after)

        expect(improvement).toBeLessThan(0)
      })
    })

    describe('isSuccessfulRevision()', () => {
      it('should return true for successful revision', () => {
        const metrics: ImprovementMetrics = {
          beforeScore: createQualityScore(0.6),
          afterScore: createQualityScore(0.75),
          improvement: 25,
          issuesFixed: 3,
          issuesRemaining: 1,
          categoryImprovements: {
            rhymeQuality: { before: createQualityScore(0.6), after: createQualityScore(0.8), delta: 0.2, percentChange: 33.33 },
            flowConsistency: { before: createQualityScore(0.7), after: createQualityScore(0.75), delta: 0.05, percentChange: 7.14 },
            imageryVividness: { before: createQualityScore(0.5), after: createQualityScore(0.7), delta: 0.2, percentChange: 40 },
            emotionalAuthenticity: { before: createQualityScore(0.8), after: createQualityScore(0.85), delta: 0.05, percentChange: 6.25 },
            originalityScore: { before: createQualityScore(0.7), after: createQualityScore(0.75), delta: 0.05, percentChange: 7.14 },
            voiceConsistency: { before: createQualityScore(0.9), after: createQualityScore(0.9), delta: 0, percentChange: 0 }
          },
          qualityLevelChange: 'needs_improvement → good'
        }

        const result = isSuccessfulRevision(metrics)

        expect(result).toBe(true)
      })

      it('should return false for insufficient improvement', () => {
        const metrics: ImprovementMetrics = {
          beforeScore: createQualityScore(0.6),
          afterScore: createQualityScore(0.62),
          improvement: 3.33,
          issuesFixed: 1,
          issuesRemaining: 3,
          categoryImprovements: {
            rhymeQuality: { before: createQualityScore(0.6), after: createQualityScore(0.62), delta: 0.02, percentChange: 3.33 },
            flowConsistency: { before: createQualityScore(0.7), after: createQualityScore(0.7), delta: 0, percentChange: 0 },
            imageryVividness: { before: createQualityScore(0.5), after: createQualityScore(0.5), delta: 0, percentChange: 0 },
            emotionalAuthenticity: { before: createQualityScore(0.8), after: createQualityScore(0.8), delta: 0, percentChange: 0 },
            originalityScore: { before: createQualityScore(0.7), after: createQualityScore(0.7), delta: 0, percentChange: 0 },
            voiceConsistency: { before: createQualityScore(0.9), after: createQualityScore(0.9), delta: 0, percentChange: 0 }
          },
          qualityLevelChange: 'needs_improvement → needs_improvement'
        }

        const result = isSuccessfulRevision(metrics)

        expect(result).toBe(false)
      })

      it('should use custom minimum improvement threshold', () => {
        const metrics: ImprovementMetrics = {
          beforeScore: createQualityScore(0.6),
          afterScore: createQualityScore(0.68),
          improvement: 13.33,
          issuesFixed: 2,
          issuesRemaining: 1,
          categoryImprovements: {
            rhymeQuality: { before: createQualityScore(0.6), after: createQualityScore(0.7), delta: 0.1, percentChange: 16.67 },
            flowConsistency: { before: createQualityScore(0.7), after: createQualityScore(0.7), delta: 0, percentChange: 0 },
            imageryVividness: { before: createQualityScore(0.5), after: createQualityScore(0.6), delta: 0.1, percentChange: 20 },
            emotionalAuthenticity: { before: createQualityScore(0.8), after: createQualityScore(0.8), delta: 0, percentChange: 0 },
            originalityScore: { before: createQualityScore(0.7), after: createQualityScore(0.7), delta: 0, percentChange: 0 },
            voiceConsistency: { before: createQualityScore(0.9), after: createQualityScore(0.9), delta: 0, percentChange: 0 }
          },
          qualityLevelChange: 'needs_improvement → good'
        }

        const result1 = isSuccessfulRevision(metrics, 10)
        const result2 = isSuccessfulRevision(metrics, 20)

        expect(result1).toBe(true)
        expect(result2).toBe(false)
      })
    })
  })
})
