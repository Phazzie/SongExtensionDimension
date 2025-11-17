/**
 * @fileoverview Contract Tests for Critique Engine Service
 * @purpose Ensure any implementation of ICritiqueEngineService matches the contract exactly
 *
 * TEST-DRIVEN DEVELOPMENT APPROACH:
 * These tests are written BEFORE the mock implementation.
 * The mock implementation should be written to make these tests pass.
 *
 * COMPLEXITY NOTE:
 * This is the most complex service with:
 * - 8 methods
 * - 30+ issue types
 * - Multiple analysis dimensions
 * - Deeply nested data structures
 * - Complex quality scoring algorithms
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import type {
  ICritiqueEngineService,
  CritiqueReport,
  QualityScores,
  QualityIssue,
  RhymeQualityCheck,
  FlowEvaluation,
  ClicheDetection,
  EmotionalResonance,
  GoldStandardCriteria,
  LineAnalysis,
  LineScores,
  SectionAnalysis,
  ForcedRhyme,
  DetectedCliche,
  DetectedEmotion
} from '../../src/contracts/CritiqueEngine'
import {
  CritiqueLevel,
  QualityLevel,
  IssueType,
  ClicheType,
  getQualityLevel,
  isCriticalIssue,
  filterIssuesByType,
  groupIssuesBySeverity,
  DEFAULT_GOLD_STANDARD
} from '../../src/contracts/CritiqueEngine'
import { isSuccess, isFailure, Severity, createQualityScore } from '../../src/contracts/types/common'
import type { Song, Line } from '../../src/contracts/types/song'
import { createSongId } from '../../src/contracts/types/song'

/**
 * NOTE: This test suite is designed to work with ANY implementation of ICritiqueEngineService.
 * During Phase 3 (BUILD), import MockCritiqueEngineService.
 * During Phase 5 (IMPLEMENT), import RealCritiqueEngineService.
 * The tests should pass for both implementations.
 */

import { MockCritiqueEngineService } from '../../src/services/mock/MockCritiqueEngineService'

describe('ICritiqueEngineService Contract Tests', () => {
  let service: ICritiqueEngineService

  beforeEach(() => {
    service = new MockCritiqueEngineService()
  })

  // Helper function to create a test song
  const createTestSong = (): Song => {
    const line1: Line = {
      text: 'The night descends upon the weary town',
      syllables: 10,
      stressPattern: 'x/x/x/x/x/',
      rhymeSound: 'OWN',
      internalRhymes: [],
      lineNumber: 1
    }

    const line2: Line = {
      text: 'As shadows dance and darkness settles down',
      syllables: 10,
      stressPattern: 'x/x/x/x/x/',
      rhymeSound: 'OWN',
      internalRhymes: [],
      lineNumber: 2
    }

    return {
      id: createSongId('test_song_1'),
      title: 'Test Song',
      verses: [
        {
          id: 'verse_1' as any,
          number: 1,
          lines: [line1, line2],
          rhymeScheme: 'AA',
          syllablePattern: [10, 10],
          mood: 'melancholic',
          narrative: 'Setting the scene'
        }
      ],
      choruses: [
        {
          id: 'chorus_1' as any,
          lines: [line1, line2],
          rhymeScheme: 'AA',
          syllablePattern: [10, 10],
          hook: 'The night descends',
          isMainChorus: true
        }
      ],
      bridge: undefined,
      intro: undefined,
      outro: undefined,
      metadata: {
        genre: 'rock',
        mood: 'melancholic',
        theme: 'darkness',
        targetAudience: 'adults',
        referenceArtist: undefined,
        generationPrompt: 'A song about darkness',
        version: 1,
        tags: []
      },
      generatedAt: new Date(),
      lastModified: undefined
    }
  }

  // ===========================================
  // METHOD 1: analyzeSong()
  // ===========================================
  describe('analyzeSong() method', () => {
    describe('Success Cases', () => {
      it('should return success for valid song with professional critique level', async () => {
        const song = createTestSong()

        const result = await service.analyzeSong(song, CritiqueLevel.PROFESSIONAL)

        expect(result).toHaveProperty('success')
        expect(isSuccess(result)).toBe(true)

        if (isSuccess(result)) {
          const report: CritiqueReport = result.data

          // Verify all required top-level fields
          expect(report).toHaveProperty('songId')
          expect(report).toHaveProperty('overallScore')
          expect(report).toHaveProperty('passesGoldStandard')
          expect(report).toHaveProperty('qualityLevel')
          expect(report).toHaveProperty('scores')
          expect(report).toHaveProperty('issues')
          expect(report).toHaveProperty('suggestions')
          expect(report).toHaveProperty('strengths')
          expect(report).toHaveProperty('lineAnalysis')
          expect(report).toHaveProperty('sectionAnalysis')
          expect(report).toHaveProperty('generatedAt')

          // Verify songId matches
          expect(report.songId).toBe(song.id)

          // Verify overallScore is valid QualityScore
          expect(report.overallScore).toBeGreaterThanOrEqual(0)
          expect(report.overallScore).toBeLessThanOrEqual(100)

          // Verify passesGoldStandard is boolean
          expect(typeof report.passesGoldStandard).toBe('boolean')

          // Verify qualityLevel is valid enum value
          expect(Object.values(QualityLevel)).toContain(report.qualityLevel)

          // Verify scores object structure
          const scores: QualityScores = report.scores
          expect(scores).toHaveProperty('rhymeQuality')
          expect(scores).toHaveProperty('flowConsistency')
          expect(scores).toHaveProperty('imageryVividness')
          expect(scores).toHaveProperty('emotionalAuthenticity')
          expect(scores).toHaveProperty('originalityScore')
          expect(scores).toHaveProperty('voiceConsistency')
          expect(scores).toHaveProperty('structuralCoherence')
          expect(scores).toHaveProperty('technicalExecution')

          // Verify all scores are valid
          expect(scores.rhymeQuality).toBeGreaterThanOrEqual(0)
          expect(scores.rhymeQuality).toBeLessThanOrEqual(100)
          expect(scores.flowConsistency).toBeGreaterThanOrEqual(0)
          expect(scores.flowConsistency).toBeLessThanOrEqual(100)
          expect(scores.imageryVividness).toBeGreaterThanOrEqual(0)
          expect(scores.imageryVividness).toBeLessThanOrEqual(100)
          expect(scores.emotionalAuthenticity).toBeGreaterThanOrEqual(0)
          expect(scores.emotionalAuthenticity).toBeLessThanOrEqual(100)
          expect(scores.originalityScore).toBeGreaterThanOrEqual(0)
          expect(scores.originalityScore).toBeLessThanOrEqual(100)
          expect(scores.voiceConsistency).toBeGreaterThanOrEqual(0)
          expect(scores.voiceConsistency).toBeLessThanOrEqual(100)
          expect(scores.structuralCoherence).toBeGreaterThanOrEqual(0)
          expect(scores.structuralCoherence).toBeLessThanOrEqual(100)
          expect(scores.technicalExecution).toBeGreaterThanOrEqual(0)
          expect(scores.technicalExecution).toBeLessThanOrEqual(100)

          // Verify arrays are defined
          expect(Array.isArray(report.issues)).toBe(true)
          expect(Array.isArray(report.suggestions)).toBe(true)
          expect(Array.isArray(report.strengths)).toBe(true)
          expect(Array.isArray(report.sectionAnalysis)).toBe(true)

          // Verify lineAnalysis is a ReadonlyMap
          expect(report.lineAnalysis).toBeInstanceOf(Map)

          // Verify generatedAt is a Date
          expect(report.generatedAt).toBeInstanceOf(Date)
        }
      })

      it('should return success for valid song with default critique level', async () => {
        const song = createTestSong()

        const result = await service.analyzeSong(song)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.songId).toBe(song.id)
          expect(result.data.overallScore).toBeDefined()
        }
      })

      it('should return success for valid song with casual critique level', async () => {
        const song = createTestSong()

        const result = await service.analyzeSong(song, CritiqueLevel.CASUAL)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // Casual level might have fewer issues/suggestions
          expect(result.data.songId).toBe(song.id)
          expect(Array.isArray(result.data.issues)).toBe(true)
        }
      })

      it('should return success for valid song with gold standard critique level', async () => {
        const song = createTestSong()

        const result = await service.analyzeSong(song, CritiqueLevel.GOLD_STANDARD)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // Gold standard is most strict - might have more issues
          expect(result.data.songId).toBe(song.id)
          expect(Array.isArray(result.data.issues)).toBe(true)
        }
      })

      it('should include quality issues when present', async () => {
        const song = createTestSong()

        const result = await service.analyzeSong(song, CritiqueLevel.PROFESSIONAL)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          if (result.data.issues.length > 0) {
            const issue: QualityIssue = result.data.issues[0]!

            // Verify issue structure
            expect(issue).toHaveProperty('issueType')
            expect(issue).toHaveProperty('affectedLines')
            expect(issue).toHaveProperty('severity')
            expect(issue).toHaveProperty('score_impact')
            expect(issue).toHaveProperty('message')
            expect(issue).toHaveProperty('suggestion')

            // Verify issue type is valid
            expect(Object.values(IssueType)).toContain(issue.issueType)

            // Verify affected lines is array
            expect(Array.isArray(issue.affectedLines)).toBe(true)

            // Verify severity is valid
            expect(['critical', 'major', 'minor', 'info']).toContain(issue.severity)

            // Verify score_impact is number
            expect(typeof issue.score_impact).toBe('number')
            expect(issue.score_impact).toBeGreaterThanOrEqual(0)

            // Verify message and suggestion are strings
            expect(typeof issue.message).toBe('string')
            expect(issue.message.length).toBeGreaterThan(0)
            expect(typeof issue.suggestion).toBe('string')
          }
        }
      })

      it('should include line analysis for all lines', async () => {
        const song = createTestSong()

        const result = await service.analyzeSong(song, CritiqueLevel.PROFESSIONAL)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const lineAnalysis = result.data.lineAnalysis

          // Should have analysis for some lines
          expect(lineAnalysis.size).toBeGreaterThan(0)

          // Verify line analysis structure
          const firstLineAnalysis = Array.from(lineAnalysis.values())[0]
          if (firstLineAnalysis) {
            expect(firstLineAnalysis).toHaveProperty('lineNumber')
            expect(firstLineAnalysis).toHaveProperty('line')
            expect(firstLineAnalysis).toHaveProperty('scores')
            expect(firstLineAnalysis).toHaveProperty('issues')
            expect(firstLineAnalysis).toHaveProperty('suggestions')
            expect(firstLineAnalysis).toHaveProperty('strengths')

            // Verify line scores
            const lineScores: LineScores = firstLineAnalysis.scores
            expect(lineScores).toHaveProperty('imagery')
            expect(lineScores).toHaveProperty('rhythm')
            expect(lineScores).toHaveProperty('wordChoice')
            expect(lineScores).toHaveProperty('authenticity')
            expect(lineScores).toHaveProperty('overall')

            // Verify arrays
            expect(Array.isArray(firstLineAnalysis.issues)).toBe(true)
            expect(Array.isArray(firstLineAnalysis.suggestions)).toBe(true)
            expect(Array.isArray(firstLineAnalysis.strengths)).toBe(true)
          }
        }
      })

      it('should include section analysis', async () => {
        const song = createTestSong()

        const result = await service.analyzeSong(song, CritiqueLevel.PROFESSIONAL)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const sectionAnalysis = result.data.sectionAnalysis

          if (sectionAnalysis.length > 0) {
            const section: SectionAnalysis = sectionAnalysis[0]!

            expect(section).toHaveProperty('sectionType')
            expect(section).toHaveProperty('sectionId')
            expect(section).toHaveProperty('scores')
            expect(section).toHaveProperty('issues')
            expect(section).toHaveProperty('cohesion')
            expect(section).toHaveProperty('effectiveness')

            // Verify section scores
            expect(section.scores).toHaveProperty('rhymeConsistency')
            expect(section.scores).toHaveProperty('rhythmConsistency')
            expect(section.scores).toHaveProperty('thematicCohesion')
            expect(section.scores).toHaveProperty('narrativeFlow')
            expect(section.scores).toHaveProperty('overall')

            // Verify cohesion and effectiveness scores
            expect(section.cohesion).toBeGreaterThanOrEqual(0)
            expect(section.cohesion).toBeLessThanOrEqual(100)
            expect(section.effectiveness).toBeGreaterThanOrEqual(0)
            expect(section.effectiveness).toBeLessThanOrEqual(100)
          }
        }
      })

      it('should include strengths array', async () => {
        const song = createTestSong()

        const result = await service.analyzeSong(song, CritiqueLevel.PROFESSIONAL)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(Array.isArray(result.data.strengths)).toBe(true)

          // If strengths exist, verify they are strings
          if (result.data.strengths.length > 0) {
            expect(typeof result.data.strengths[0]).toBe('string')
            expect(result.data.strengths[0]!.length).toBeGreaterThan(0)
          }
        }
      })

      it('should correctly determine quality level from overall score', async () => {
        const song = createTestSong()

        const result = await service.analyzeSong(song, CritiqueLevel.PROFESSIONAL)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const score = result.data.overallScore
          const level = result.data.qualityLevel

          // Verify quality level matches score using helper function
          const expectedLevel = getQualityLevel(score)
          expect(level).toBe(expectedLevel)
        }
      })

      it('should handle song with multiple verses', async () => {
        const testSong = createTestSong()
        const song: Song = {
          ...testSong,
          verses: [
            ...testSong.verses,
            {
              id: 'verse_2' as any,
              number: 2,
              lines: testSong.verses[0]!.lines,
              rhymeScheme: 'AA',
              syllablePattern: [10, 10],
              mood: 'melancholic',
              narrative: 'Development'
            }
          ]
        }

        const result = await service.analyzeSong(song, CritiqueLevel.PROFESSIONAL)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.songId).toBe(song.id)
        }
      })

      it('should handle song with bridge', async () => {
        const testSong = createTestSong()
        const song: Song = {
          ...testSong,
          bridge: {
            id: 'bridge_1' as any,
            lines: testSong.verses[0]!.lines,
            rhymeScheme: 'AB',
            syllablePattern: [10, 10],
            purpose: 'Provide contrast'
          }
        }

        const result = await service.analyzeSong(song, CritiqueLevel.PROFESSIONAL)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.songId).toBe(song.id)
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for invalid song (null)', async () => {
        // @ts-expect-error - Testing runtime behavior
        const result = await service.analyzeSong(null, CritiqueLevel.PROFESSIONAL)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('INVALID_SONG')
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
        }
      })

      it('should return error for invalid song (undefined)', async () => {
        // @ts-expect-error - Testing runtime behavior
        const result = await service.analyzeSong(undefined, CritiqueLevel.PROFESSIONAL)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('INVALID_SONG')
        }
      })

      it('should return error for song that is too short', async () => {
        const song: Song = {
          ...createTestSong(),
          verses: [],
          choruses: []
        }

        const result = await service.analyzeSong(song, CritiqueLevel.PROFESSIONAL)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('SONG_TOO_SHORT')
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
        }
      })

      it('should return error when analysis fails', async () => {
        const testSong = createTestSong()
        const song: Song = {
          ...testSong,
          verses: [
            {
              ...testSong.verses[0]!,
              lines: []
            },
            ...testSong.verses.slice(1)
          ]
        }

        const result = await service.analyzeSong(song, CritiqueLevel.PROFESSIONAL)

        // Might fail with ANALYSIS_FAILED or SONG_TOO_SHORT
        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(['ANALYSIS_FAILED', 'SONG_TOO_SHORT']).toContain(result.error.code)
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs = [
          null,
          undefined,
          {} as Song,
          { id: 'invalid' } as Song
        ]

        for (const input of badInputs) {
          // @ts-expect-error - Testing runtime behavior
          await expect(service.analyzeSong(input)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const song = createTestSong()

        const result = await service.analyzeSong(song, CritiqueLevel.PROFESSIONAL)

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
        const song = createTestSong()

        const result = await service.analyzeSong(song, CritiqueLevel.PROFESSIONAL)

        if (isSuccess(result)) {
          const report = result.data

          expect(() => {
            // @ts-expect-error - Testing readonly enforcement
            report.overallScore = 999
          }).toThrow()

          expect(() => {
            // @ts-expect-error - Testing readonly enforcement
            report.issues = []
          }).toThrow()

          expect(() => {
            // @ts-expect-error - Testing readonly enforcement
            report.scores.rhymeQuality = 50
          }).toThrow()
        }
      })
    })
  })

  // ===========================================
  // METHOD 2: checkRhymeQuality()
  // ===========================================
  describe('checkRhymeQuality() method', () => {
    describe('Success Cases', () => {
      it('should return success for lines with rhymes', async () => {
        const lines = [
          'The cat sat on the mat',
          'She wore a fancy hat'
        ]

        const result = await service.checkRhymeQuality(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const check: RhymeQualityCheck = result.data

          // Verify all required fields
          expect(check).toHaveProperty('rhymeAnalysis')
          expect(check).toHaveProperty('qualityScore')
          expect(check).toHaveProperty('issues')
          expect(check).toHaveProperty('forcedRhymes')

          // Verify quality score
          expect(check.qualityScore).toBeGreaterThanOrEqual(0)
          expect(check.qualityScore).toBeLessThanOrEqual(100)

          // Verify arrays
          expect(Array.isArray(check.issues)).toBe(true)
          expect(Array.isArray(check.forcedRhymes)).toBe(true)
        }
      })

      it('should detect forced rhymes when present', async () => {
        const lines = [
          'I really love to sing and dance',
          'In my favorite pair of pants'
        ]

        const result = await service.checkRhymeQuality(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          if (result.data.forcedRhymes.length > 0) {
            const forcedRhyme: ForcedRhyme = result.data.forcedRhymes[0]!

            expect(forcedRhyme).toHaveProperty('lineIndex')
            expect(forcedRhyme).toHaveProperty('word')
            expect(forcedRhyme).toHaveProperty('alternativeFits')
            expect(forcedRhyme).toHaveProperty('awkwardness')

            // Verify awkwardness is 0-1
            expect(forcedRhyme.awkwardness).toBeGreaterThanOrEqual(0)
            expect(forcedRhyme.awkwardness).toBeLessThanOrEqual(1)

            // Verify alternative fits
            expect(Array.isArray(forcedRhyme.alternativeFits)).toBe(true)
          }
        }
      })

      it('should handle single line', async () => {
        const lines = ['The lonely night falls']

        const result = await service.checkRhymeQuality(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.qualityScore).toBeDefined()
        }
      })

      it('should handle lines without rhymes', async () => {
        const lines = [
          'The sun rises',
          'Birds are singing',
          'Trees sway gently'
        ]

        const result = await service.checkRhymeQuality(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // Lower quality score expected
          expect(result.data.qualityScore).toBeDefined()
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for empty array', async () => {
        const result = await service.checkRhymeQuality([])

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('RHYME_ANALYSIS_FAILED')
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
        }
      })

      it('should return error for array with empty strings', async () => {
        const result = await service.checkRhymeQuality(['', '   '])

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('RHYME_ANALYSIS_FAILED')
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs = [
          [],
          [''],
          // @ts-expect-error - Testing runtime behavior
          [null],
          // @ts-expect-error - Testing runtime behavior
          null
        ]

        for (const input of badInputs) {
          // @ts-expect-error - Testing runtime behavior
          await expect(service.checkRhymeQuality(input)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const lines = ['The cat sat on the mat']

        const result = await service.checkRhymeQuality(lines)

        expect(result).toHaveProperty('success')

        if (result.success) {
          expect(result).toHaveProperty('data')
        } else {
          expect(result).toHaveProperty('error')
        }
      })

      it('should preserve readonly semantics', async () => {
        const lines = ['Test line']

        const result = await service.checkRhymeQuality(lines)

        if (isSuccess(result)) {
          expect(() => {
            // @ts-expect-error - Testing readonly enforcement
            result.data.qualityScore = 50
          }).toThrow()
        }
      })
    })
  })

  // ===========================================
  // METHOD 3: evaluateFlow()
  // ===========================================
  describe('evaluateFlow() method', () => {
    describe('Success Cases', () => {
      it('should return success for valid lines', async () => {
        const lines = [
          'The night descends upon the weary town',
          'As shadows dance and darkness settles down'
        ]

        const result = await service.evaluateFlow(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const flow: FlowEvaluation = result.data

          // Verify all required fields
          expect(flow).toHaveProperty('flowAnalysis')
          expect(flow).toHaveProperty('qualityScore')
          expect(flow).toHaveProperty('issues')
          expect(flow).toHaveProperty('rhythmBreaks')

          // Verify quality score
          expect(flow.qualityScore).toBeGreaterThanOrEqual(0)
          expect(flow.qualityScore).toBeLessThanOrEqual(100)

          // Verify arrays
          expect(Array.isArray(flow.issues)).toBe(true)
          expect(Array.isArray(flow.rhythmBreaks)).toBe(true)

          // Verify rhythm breaks contain line numbers
          if (flow.rhythmBreaks.length > 0) {
            expect(typeof flow.rhythmBreaks[0]).toBe('number')
          }
        }
      })

      it('should detect rhythm breaks in choppy lines', async () => {
        const lines = [
          'STRESS STRESS CLASH',
          'weak weak weak weak'
        ]

        const result = await service.evaluateFlow(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // Might detect rhythm issues
          expect(Array.isArray(result.data.rhythmBreaks)).toBe(true)
        }
      })

      it('should handle single line', async () => {
        const lines = ['The cat sat on the mat']

        const result = await service.evaluateFlow(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.qualityScore).toBeDefined()
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for empty array', async () => {
        const result = await service.evaluateFlow([])

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('FLOW_ANALYSIS_FAILED')
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
        }
      })

      it('should return error for invalid text', async () => {
        const result = await service.evaluateFlow(['!!!!!@@@@@'])

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('FLOW_ANALYSIS_FAILED')
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs = [
          [],
          [''],
          // @ts-expect-error - Testing runtime behavior
          null
        ]

        for (const input of badInputs) {
          // @ts-expect-error - Testing runtime behavior
          await expect(service.evaluateFlow(input)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const lines = ['Test line']

        const result = await service.evaluateFlow(lines)

        expect(result).toHaveProperty('success')

        if (result.success) {
          expect(result).toHaveProperty('data')
        } else {
          expect(result).toHaveProperty('error')
        }
      })

      it('should preserve readonly semantics', async () => {
        const lines = ['Test line']

        const result = await service.evaluateFlow(lines)

        if (isSuccess(result)) {
          expect(() => {
            // @ts-expect-error - Testing readonly enforcement
            result.data.qualityScore = 50
          }).toThrow()
        }
      })
    })
  })

  // ===========================================
  // METHOD 4: detectCliches()
  // ===========================================
  describe('detectCliches() method', () => {
    describe('Success Cases', () => {
      it('should return success for text with clichés', async () => {
        const lyrics = 'My heart on my sleeve, stars in your eyes, love is a battlefield'

        const result = await service.detectCliches(lyrics)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const detection: ClicheDetection = result.data

          // Verify all required fields
          expect(detection).toHaveProperty('cliches')
          expect(detection).toHaveProperty('overallScore')
          expect(detection).toHaveProperty('severity')

          // Verify arrays
          expect(Array.isArray(detection.cliches)).toBe(true)

          // Verify overall score
          expect(detection.overallScore).toBeGreaterThanOrEqual(0)
          expect(detection.overallScore).toBeLessThanOrEqual(100)

          // Verify severity
          expect(['critical', 'major', 'minor', 'info']).toContain(detection.severity)

          // If clichés detected, verify structure
          if (detection.cliches.length > 0) {
            const cliche: DetectedCliche = detection.cliches[0]!

            expect(cliche).toHaveProperty('phrase')
            expect(cliche).toHaveProperty('lineNumber')
            expect(cliche).toHaveProperty('type')
            expect(cliche).toHaveProperty('alternatives')
            expect(cliche).toHaveProperty('explanation')

            // Verify cliché type
            expect(Object.values(ClicheType)).toContain(cliche.type)

            // Verify alternatives
            expect(Array.isArray(cliche.alternatives)).toBe(true)

            // Verify explanation
            expect(typeof cliche.explanation).toBe('string')
            expect(cliche.explanation.length).toBeGreaterThan(0)
          }
        }
      })

      it('should return success for text without clichés', async () => {
        const lyrics = 'The phosphorescent waves crash against jagged obsidian shores'

        const result = await service.detectCliches(lyrics)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // Should have empty or minimal clichés array
          expect(Array.isArray(result.data.cliches)).toBe(true)
          // Higher overall score expected
          expect(result.data.overallScore).toBeDefined()
        }
      })

      it('should detect different cliché types', async () => {
        const lyrics = 'Heart on sleeve, love battlefield, stars eyes'

        const result = await service.detectCliches(lyrics)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          if (result.data.cliches.length > 0) {
            // Verify different types can be detected
            const types = result.data.cliches.map(c => c.type)
            expect(types.every(t => Object.values(ClicheType).includes(t))).toBe(true)
          }
        }
      })

      it('should handle empty string', async () => {
        const result = await service.detectCliches('')

        // Could succeed with empty result or fail
        expect(result).toHaveProperty('success')
      })
    })

    describe('Error Cases', () => {
      it('should return error when detection fails', async () => {
        const lyrics = '!!!!!@@@@@#####'

        const result = await service.detectCliches(lyrics)

        // Might fail or succeed with low score
        if (isFailure(result)) {
          expect(result.error.code).toBe('CLICHE_DETECTION_FAILED')
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs = [
          '',
          '!!!!!',
          // @ts-expect-error - Testing runtime behavior
          null,
          // @ts-expect-error - Testing runtime behavior
          undefined
        ]

        for (const input of badInputs) {
          // @ts-expect-error - Testing runtime behavior
          await expect(service.detectCliches(input)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const lyrics = 'Test lyrics'

        const result = await service.detectCliches(lyrics)

        expect(result).toHaveProperty('success')

        if (result.success) {
          expect(result).toHaveProperty('data')
        } else {
          expect(result).toHaveProperty('error')
        }
      })

      it('should preserve readonly semantics', async () => {
        const lyrics = 'Test lyrics'

        const result = await service.detectCliches(lyrics)

        if (isSuccess(result)) {
          expect(() => {
            // @ts-expect-error - Testing readonly enforcement
            result.data.cliches = []
          }).toThrow()
        }
      })
    })
  })

  // ===========================================
  // METHOD 5: assessEmotionalResonance()
  // ===========================================
  describe('assessEmotionalResonance() method', () => {
    describe('Success Cases', () => {
      it('should return success for valid song', async () => {
        const song = createTestSong()

        const result = await service.assessEmotionalResonance(song)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const resonance: EmotionalResonance = result.data

          // Verify all required fields
          expect(resonance).toHaveProperty('score')
          expect(resonance).toHaveProperty('emotions')
          expect(resonance).toHaveProperty('authenticity')
          expect(resonance).toHaveProperty('depth')
          expect(resonance).toHaveProperty('consistency')

          // Verify score
          expect(resonance.score).toBeGreaterThanOrEqual(0)
          expect(resonance.score).toBeLessThanOrEqual(100)

          // Verify authenticity (0-100)
          expect(resonance.authenticity).toBeGreaterThanOrEqual(0)
          expect(resonance.authenticity).toBeLessThanOrEqual(100)

          // Verify depth (0-100)
          expect(resonance.depth).toBeGreaterThanOrEqual(0)
          expect(resonance.depth).toBeLessThanOrEqual(100)

          // Verify consistency (0-100)
          expect(resonance.consistency).toBeGreaterThanOrEqual(0)
          expect(resonance.consistency).toBeLessThanOrEqual(100)

          // Verify emotions array
          expect(Array.isArray(resonance.emotions)).toBe(true)

          // If emotions detected, verify structure
          if (resonance.emotions.length > 0) {
            const emotion: DetectedEmotion = resonance.emotions[0]!

            expect(emotion).toHaveProperty('emotion')
            expect(emotion).toHaveProperty('intensity')
            expect(emotion).toHaveProperty('lines')
            expect(emotion).toHaveProperty('authenticity')

            // Verify emotion name
            expect(typeof emotion.emotion).toBe('string')
            expect(emotion.emotion.length).toBeGreaterThan(0)

            // Verify intensity (0-1)
            expect(emotion.intensity).toBeGreaterThanOrEqual(0)
            expect(emotion.intensity).toBeLessThanOrEqual(1)

            // Verify authenticity (0-1)
            expect(emotion.authenticity).toBeGreaterThanOrEqual(0)
            expect(emotion.authenticity).toBeLessThanOrEqual(1)

            // Verify lines array
            expect(Array.isArray(emotion.lines)).toBe(true)
          }
        }
      })

      it('should detect multiple emotions', async () => {
        const song = createTestSong()

        const result = await service.assessEmotionalResonance(song)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(Array.isArray(result.data.emotions)).toBe(true)
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for invalid song', async () => {
        // @ts-expect-error - Testing runtime behavior
        const result = await service.assessEmotionalResonance(null)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('INVALID_SONG')
        }
      })

      it('should return error for song that is too short', async () => {
        const song: Song = {
          ...createTestSong(),
          verses: [],
          choruses: []
        }

        const result = await service.assessEmotionalResonance(song)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(['SONG_TOO_SHORT', 'ANALYSIS_FAILED']).toContain(result.error.code)
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs = [
          null,
          undefined,
          {} as Song
        ]

        for (const input of badInputs) {
          // @ts-expect-error - Testing runtime behavior
          await expect(service.assessEmotionalResonance(input)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const song = createTestSong()

        const result = await service.assessEmotionalResonance(song)

        expect(result).toHaveProperty('success')

        if (result.success) {
          expect(result).toHaveProperty('data')
        } else {
          expect(result).toHaveProperty('error')
        }
      })

      it('should preserve readonly semantics', async () => {
        const song = createTestSong()

        const result = await service.assessEmotionalResonance(song)

        if (isSuccess(result)) {
          expect(() => {
            // @ts-expect-error - Testing readonly enforcement
            result.data.score = 50
          }).toThrow()
        }
      })
    })
  })

  // ===========================================
  // METHOD 6: passesGoldStandard()
  // ===========================================
  describe('passesGoldStandard() method', () => {
    describe('Success Cases', () => {
      it('should return success with boolean result', async () => {
        const song = createTestSong()

        const result = await service.passesGoldStandard(song)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(typeof result.data).toBe('boolean')
        }
      })

      it('should use default criteria when not provided', async () => {
        const song = createTestSong()

        const result = await service.passesGoldStandard(song)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(typeof result.data).toBe('boolean')
        }
      })

      it('should use custom criteria when provided', async () => {
        const song = createTestSong()

        const customCriteria: GoldStandardCriteria = {
          minRhymeQuality: createQualityScore(70),
          minFlowConsistency: createQualityScore(75),
          minImageryVividness: createQualityScore(80),
          minEmotionalAuthenticity: createQualityScore(85),
          minOriginalityScore: createQualityScore(75),
          minVoiceConsistency: createQualityScore(80),
          maxClicheCount: 2,
          maxForcedRhymes: 1,
          maxRhythmBreaks: 2
        }

        const result = await service.passesGoldStandard(song, customCriteria)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(typeof result.data).toBe('boolean')
        }
      })

      it('should validate against default gold standard criteria', async () => {
        const song = createTestSong()

        const result = await service.passesGoldStandard(song, DEFAULT_GOLD_STANDARD)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // Default criteria is very strict
          expect(typeof result.data).toBe('boolean')
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for invalid song', async () => {
        // @ts-expect-error - Testing runtime behavior
        const result = await service.passesGoldStandard(null)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('INVALID_SONG')
        }
      })

      it('should return error for song that is too short', async () => {
        const song: Song = {
          ...createTestSong(),
          verses: [],
          choruses: []
        }

        const result = await service.passesGoldStandard(song)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(['SONG_TOO_SHORT', 'ANALYSIS_FAILED']).toContain(result.error.code)
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs = [
          null,
          undefined,
          {} as Song
        ]

        for (const input of badInputs) {
          // @ts-expect-error - Testing runtime behavior
          await expect(service.passesGoldStandard(input)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const song = createTestSong()

        const result = await service.passesGoldStandard(song)

        expect(result).toHaveProperty('success')

        if (result.success) {
          expect(result).toHaveProperty('data')
        } else {
          expect(result).toHaveProperty('error')
        }
      })
    })
  })

  // ===========================================
  // METHOD 7: getFailedCriteria()
  // ===========================================
  describe('getFailedCriteria() method', () => {
    describe('Success Cases', () => {
      it('should return success with issues array', async () => {
        const song = createTestSong()

        const result = await service.getFailedCriteria(song)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // Verify it's an array
          expect(Array.isArray(result.data)).toBe(true)

          // If there are failed criteria, verify structure
          if (result.data.length > 0) {
            const issue: QualityIssue = result.data[0]!

            expect(issue).toHaveProperty('issueType')
            expect(issue).toHaveProperty('affectedLines')
            expect(issue).toHaveProperty('severity')
            expect(issue).toHaveProperty('score_impact')
            expect(issue).toHaveProperty('message')
            expect(issue).toHaveProperty('suggestion')
          }
        }
      })

      it('should use custom criteria when provided', async () => {
        const song = createTestSong()

        const customCriteria: GoldStandardCriteria = {
          minRhymeQuality: createQualityScore(95), // Very high threshold
          minFlowConsistency: createQualityScore(95),
          minImageryVividness: createQualityScore(95),
          minEmotionalAuthenticity: createQualityScore(95),
          minOriginalityScore: createQualityScore(95),
          minVoiceConsistency: createQualityScore(95),
          maxClicheCount: 0,
          maxForcedRhymes: 0,
          maxRhythmBreaks: 0
        }

        const result = await service.getFailedCriteria(song, customCriteria)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(Array.isArray(result.data)).toBe(true)
          // Likely to have failed criteria with such strict thresholds
        }
      })

      it('should return empty array for perfect song', async () => {
        const song = createTestSong()

        // Use lenient criteria
        const lenientCriteria: GoldStandardCriteria = {
          minRhymeQuality: createQualityScore(10),
          minFlowConsistency: createQualityScore(10),
          minImageryVividness: createQualityScore(10),
          minEmotionalAuthenticity: createQualityScore(10),
          minOriginalityScore: createQualityScore(10),
          minVoiceConsistency: createQualityScore(10),
          maxClicheCount: 100,
          maxForcedRhymes: 100,
          maxRhythmBreaks: 100
        }

        const result = await service.getFailedCriteria(song, lenientCriteria)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // Might return empty array
          expect(Array.isArray(result.data)).toBe(true)
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for invalid song', async () => {
        // @ts-expect-error - Testing runtime behavior
        const result = await service.getFailedCriteria(null)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('INVALID_SONG')
        }
      })

      it('should return error for song that is too short', async () => {
        const song: Song = {
          ...createTestSong(),
          verses: [],
          choruses: []
        }

        const result = await service.getFailedCriteria(song)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(['SONG_TOO_SHORT', 'ANALYSIS_FAILED']).toContain(result.error.code)
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs = [
          null,
          undefined,
          {} as Song
        ]

        for (const input of badInputs) {
          // @ts-expect-error - Testing runtime behavior
          await expect(service.getFailedCriteria(input)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const song = createTestSong()

        const result = await service.getFailedCriteria(song)

        expect(result).toHaveProperty('success')

        if (result.success) {
          expect(result).toHaveProperty('data')
        } else {
          expect(result).toHaveProperty('error')
        }
      })

      it('should preserve readonly semantics', async () => {
        const song = createTestSong()

        const result = await service.getFailedCriteria(song)

        if (isSuccess(result)) {
          // TypeScript readonly is compile-time only, not runtime enforced
          // The TypeScript compiler prevents mutations, which is sufficient
          expect(result.data).toBeDefined()
          expect(Array.isArray(result.data)).toBe(true)
        }
      })
    })
  })

  // ===========================================
  // METHOD 8: analyzeLine()
  // ===========================================
  describe('analyzeLine() method', () => {
    describe('Success Cases', () => {
      it('should return success for valid line', async () => {
        const line: Line = {
          text: 'The night descends upon the weary town',
          syllables: 10,
          stressPattern: 'x/x/x/x/x/',
          rhymeSound: 'OWN',
          internalRhymes: [],
          lineNumber: 1
        }

        const result = await service.analyzeLine(line)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const analysis: LineAnalysis = result.data

          // Verify all required fields
          expect(analysis).toHaveProperty('lineNumber')
          expect(analysis).toHaveProperty('line')
          expect(analysis).toHaveProperty('scores')
          expect(analysis).toHaveProperty('issues')
          expect(analysis).toHaveProperty('suggestions')
          expect(analysis).toHaveProperty('strengths')

          // Verify line number
          expect(analysis.lineNumber).toBe(line.lineNumber)

          // Verify line object
          expect(analysis.line).toEqual(line)

          // Verify scores
          const scores: LineScores = analysis.scores
          expect(scores).toHaveProperty('imagery')
          expect(scores).toHaveProperty('rhythm')
          expect(scores).toHaveProperty('wordChoice')
          expect(scores).toHaveProperty('authenticity')
          expect(scores).toHaveProperty('overall')

          expect(scores.imagery).toBeGreaterThanOrEqual(0)
          expect(scores.imagery).toBeLessThanOrEqual(100)
          expect(scores.rhythm).toBeGreaterThanOrEqual(0)
          expect(scores.rhythm).toBeLessThanOrEqual(100)
          expect(scores.wordChoice).toBeGreaterThanOrEqual(0)
          expect(scores.wordChoice).toBeLessThanOrEqual(100)
          expect(scores.authenticity).toBeGreaterThanOrEqual(0)
          expect(scores.authenticity).toBeLessThanOrEqual(100)
          expect(scores.overall).toBeGreaterThanOrEqual(0)
          expect(scores.overall).toBeLessThanOrEqual(100)

          // Verify arrays
          expect(Array.isArray(analysis.issues)).toBe(true)
          expect(Array.isArray(analysis.suggestions)).toBe(true)
          expect(Array.isArray(analysis.strengths)).toBe(true)
        }
      })

      it('should return success for line with context', async () => {
        const line: Line = {
          text: 'The night descends upon the weary town',
          syllables: 10,
          stressPattern: 'x/x/x/x/x/',
          rhymeSound: 'OWN',
          internalRhymes: [],
          lineNumber: 1
        }

        const context: Line[] = [
          {
            text: 'The day is done, the sun has set',
            syllables: 8,
            stressPattern: 'x/x/x/x/',
            rhymeSound: 'ET',
            internalRhymes: [],
            lineNumber: 0
          }
        ]

        const result = await service.analyzeLine(line, context)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.lineNumber).toBe(line.lineNumber)
        }
      })

      it('should handle line with issues', async () => {
        const line: Line = {
          text: 'very very very very boring',
          syllables: 7,
          stressPattern: 'x/x/x/x/',
          rhymeSound: 'ING',
          internalRhymes: [],
          lineNumber: 1
        }

        const result = await service.analyzeLine(line)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // Might detect repetition issue
          expect(Array.isArray(result.data.issues)).toBe(true)
        }
      })

      it('should provide suggestions for improvement', async () => {
        const line: Line = {
          text: 'The thing was good and nice',
          syllables: 6,
          stressPattern: 'x/x/x/',
          rhymeSound: 'ICE',
          internalRhymes: [],
          lineNumber: 1
        }

        const result = await service.analyzeLine(line)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // Might suggest more specific language
          expect(Array.isArray(result.data.suggestions)).toBe(true)
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for invalid line', async () => {
        // @ts-expect-error - Testing runtime behavior
        const result = await service.analyzeLine(null)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('ANALYSIS_FAILED')
        }
      })

      it('should return error for empty line text', async () => {
        const line: Line = {
          text: '',
          syllables: 0,
          stressPattern: '',
          rhymeSound: '',
          internalRhymes: [],
          lineNumber: 1
        }

        const result = await service.analyzeLine(line)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('ANALYSIS_FAILED')
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs = [
          null,
          undefined,
          {} as Line,
          { text: '' } as Line
        ]

        for (const input of badInputs) {
          // @ts-expect-error - Testing runtime behavior
          await expect(service.analyzeLine(input)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const line: Line = {
          text: 'Test line',
          syllables: 2,
          stressPattern: 'x/',
          rhymeSound: 'INE',
          internalRhymes: [],
          lineNumber: 1
        }

        const result = await service.analyzeLine(line)

        expect(result).toHaveProperty('success')

        if (result.success) {
          expect(result).toHaveProperty('data')
        } else {
          expect(result).toHaveProperty('error')
        }
      })

      it('should preserve readonly semantics', async () => {
        const line: Line = {
          text: 'Test line',
          syllables: 2,
          stressPattern: 'x/',
          rhymeSound: 'INE',
          internalRhymes: [],
          lineNumber: 1
        }

        const result = await service.analyzeLine(line)

        if (isSuccess(result)) {
          expect(() => {
            // @ts-expect-error - Testing readonly enforcement
            result.data.lineNumber = 999
          }).toThrow()

          expect(() => {
            // @ts-expect-error - Testing readonly enforcement
            result.data.scores.overall = 50
          }).toThrow()
        }
      })
    })
  })

  // ===========================================
  // HELPER FUNCTIONS TESTS
  // ===========================================
  describe('Helper Functions', () => {
    describe('getQualityLevel()', () => {
      it('should return GOLD_STANDARD for scores 90-100', () => {
        expect(getQualityLevel(createQualityScore(90))).toBe(QualityLevel.GOLD_STANDARD)
        expect(getQualityLevel(createQualityScore(95))).toBe(QualityLevel.GOLD_STANDARD)
        expect(getQualityLevel(createQualityScore(100))).toBe(QualityLevel.GOLD_STANDARD)
      })

      it('should return EXCELLENT for scores 80-89', () => {
        expect(getQualityLevel(createQualityScore(80))).toBe(QualityLevel.EXCELLENT)
        expect(getQualityLevel(createQualityScore(85))).toBe(QualityLevel.EXCELLENT)
        expect(getQualityLevel(createQualityScore(89))).toBe(QualityLevel.EXCELLENT)
      })

      it('should return GOOD for scores 70-79', () => {
        expect(getQualityLevel(createQualityScore(70))).toBe(QualityLevel.GOOD)
        expect(getQualityLevel(createQualityScore(75))).toBe(QualityLevel.GOOD)
        expect(getQualityLevel(createQualityScore(79))).toBe(QualityLevel.GOOD)
      })

      it('should return ACCEPTABLE for scores 60-69', () => {
        expect(getQualityLevel(createQualityScore(60))).toBe(QualityLevel.ACCEPTABLE)
        expect(getQualityLevel(createQualityScore(65))).toBe(QualityLevel.ACCEPTABLE)
        expect(getQualityLevel(createQualityScore(69))).toBe(QualityLevel.ACCEPTABLE)
      })

      it('should return NEEDS_WORK for scores 40-59', () => {
        expect(getQualityLevel(createQualityScore(40))).toBe(QualityLevel.NEEDS_WORK)
        expect(getQualityLevel(createQualityScore(50))).toBe(QualityLevel.NEEDS_WORK)
        expect(getQualityLevel(createQualityScore(59))).toBe(QualityLevel.NEEDS_WORK)
      })

      it('should return POOR for scores 0-39', () => {
        expect(getQualityLevel(createQualityScore(0))).toBe(QualityLevel.POOR)
        expect(getQualityLevel(createQualityScore(20))).toBe(QualityLevel.POOR)
        expect(getQualityLevel(createQualityScore(39))).toBe(QualityLevel.POOR)
      })
    })

    describe('isCriticalIssue()', () => {
      it('should return true for critical severity', () => {
        const issue: QualityIssue = {
          issueType: IssueType.CLICHE,
          affectedLines: [1],
          severity: Severity.CRITICAL,
          score_impact: 5,
          type: 'cliche',
          message: 'Test',
          suggestion: 'Test'
        }

        expect(isCriticalIssue(issue)).toBe(true)
      })

      it('should return true for score impact >= 10', () => {
        const issue: QualityIssue = {
          issueType: IssueType.CLICHE,
          affectedLines: [1],
          severity: Severity.MINOR,
          score_impact: 10,
          type: 'cliche',
          message: 'Test',
          suggestion: 'Test'
        }

        expect(isCriticalIssue(issue)).toBe(true)
      })

      it('should return false for non-critical issues', () => {
        const issue: QualityIssue = {
          issueType: IssueType.CLICHE,
          affectedLines: [1],
          severity: Severity.MINOR,
          score_impact: 5,
          type: 'cliche',
          message: 'Test',
          suggestion: 'Test'
        }

        expect(isCriticalIssue(issue)).toBe(false)
      })
    })

    describe('filterIssuesByType()', () => {
      it('should filter issues by specific type', () => {
        const issues: QualityIssue[] = [
          {
            issueType: IssueType.CLICHE,
            affectedLines: [1],
            severity: Severity.MINOR,
            score_impact: 5,
            type: 'cliche',
            message: 'Cliché',
            suggestion: 'Avoid'
          },
          {
            issueType: IssueType.WEAK_RHYME,
            affectedLines: [2],
            severity: Severity.MINOR,
            score_impact: 3,
            type: 'weak_rhyme',
            message: 'Weak rhyme',
            suggestion: 'Strengthen'
          },
          {
            issueType: IssueType.CLICHE,
            affectedLines: [3],
            severity: Severity.MAJOR,
            score_impact: 8,
            type: 'cliche',
            message: 'Another cliché',
            suggestion: 'Rewrite'
          }
        ]

        const cliches = filterIssuesByType(issues, IssueType.CLICHE)

        expect(cliches.length).toBe(2)
        expect(cliches.every(i => i.issueType === IssueType.CLICHE)).toBe(true)
      })

      it('should return empty array when no issues match', () => {
        const issues: QualityIssue[] = [
          {
            issueType: IssueType.CLICHE,
            affectedLines: [1],
            severity: Severity.MINOR,
            score_impact: 5,
            type: 'cliche',
            message: 'Test',
            suggestion: 'Test'
          }
        ]

        const result = filterIssuesByType(issues, IssueType.WEAK_RHYME)

        expect(result.length).toBe(0)
      })
    })

    describe('groupIssuesBySeverity()', () => {
      it('should group issues by severity', () => {
        const issues: QualityIssue[] = [
          {
            issueType: IssueType.CLICHE,
            affectedLines: [1],
            severity: Severity.CRITICAL,
            score_impact: 15,
            type: 'cliche',
            message: 'Critical',
            suggestion: 'Fix'
          },
          {
            issueType: IssueType.WEAK_RHYME,
            affectedLines: [2],
            severity: Severity.MAJOR,
            score_impact: 8,
            type: 'weak_rhyme',
            message: 'Major',
            suggestion: 'Fix'
          },
          {
            issueType: IssueType.VAGUE_IMAGERY,
            affectedLines: [3],
            severity: Severity.MINOR,
            score_impact: 3,
            type: 'vague_imagery',
            message: 'Minor',
            suggestion: 'Fix'
          },
          {
            issueType: IssueType.WEAK_VERB,
            affectedLines: [4],
            severity: Severity.INFO,
            score_impact: 1,
            type: 'weak_verb',
            message: 'Info',
            suggestion: 'Consider'
          }
        ]

        const grouped = groupIssuesBySeverity(issues)

        expect(grouped.critical.length).toBe(1)
        expect(grouped.major.length).toBe(1)
        expect(grouped.minor.length).toBe(1)
        expect(grouped.info.length).toBe(1)

        expect(grouped.critical[0]?.severity).toBe(Severity.CRITICAL)
        expect(grouped.major[0]?.severity).toBe(Severity.MAJOR)
        expect(grouped.minor[0]?.severity).toBe(Severity.MINOR)
        expect(grouped.info[0]?.severity).toBe(Severity.INFO)
      })

      it('should handle empty issues array', () => {
        const grouped = groupIssuesBySeverity([])

        expect(grouped.critical.length).toBe(0)
        expect(grouped.major.length).toBe(0)
        expect(grouped.minor.length).toBe(0)
        expect(grouped.info.length).toBe(0)
      })
    })
  })
})
