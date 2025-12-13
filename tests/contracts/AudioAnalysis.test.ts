/**
 * @fileoverview Contract Tests for Audio Analysis Service
 * @purpose Ensure any implementation of IGeminiAudioService matches the contract exactly
 *
 * TEST-DRIVEN DEVELOPMENT APPROACH:
 * These tests are written BEFORE the mock implementation.
 * The mock implementation should be written to make these tests pass.
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import type {
  IGeminiAudioService,
  AudioAnalysisInput,
  AudioAnalysis,
  MelodyAnalysis,
  RhythmPattern,
  EmotionAnalysis,
  LyricsFitCheck,
  AudioSuggestion,
  AnalysisData,
  AudioValidation,
  TimeRange
} from '../../src/contracts/GeminiAudio'
import {
  AudioMimeType,
  AnalysisType,
  GeminiAudioErrorCode,
  RhythmType,
  MelodyContour,
  AudioSectionType,
  VocalEffect,
  DeliveryStyle,
  SuggestionType,
  createAudioAnalysisId,
  isValidFileSize,
  isValidDuration,
  formatTimeRange,
  getAudioExtension
} from '../../src/contracts/GeminiAudio'
import { isSuccess, isFailure } from '../../src/contracts/types/common'

/**
 * NOTE: This test suite is designed to work with ANY implementation of IGeminiAudioService.
 * During Phase 3 (BUILD), import MockAudioAnalysisService.
 * During Phase 5 (IMPLEMENT), import RealAudioAnalysisService.
 * The tests should pass for both implementations.
 */
describe('IGeminiAudioService Contract Tests', () => {
  let service: IGeminiAudioService

  // Helper to create mock audio data
  const createMockAudioData = (sizeInKB: number = 100): ArrayBuffer => {
    return new ArrayBuffer(sizeInKB * 1024)
  }

  beforeEach(() => {
    // Import the mock service
    const { MockAudioAnalysisService } = require('../../src/services/mock/MockAudioAnalysisService')
    service = new MockAudioAnalysisService()
  })

  // ===========================================
  // METHOD 1: analyzeAudio()
  // ===========================================
  describe('analyzeAudio() method', () => {
    describe('Success Cases', () => {
      it('should return success for valid MP3 audio with comprehensive analysis', async () => {
        const input: AudioAnalysisInput = {
          audioData: createMockAudioData(500),
          fileName: 'test-song.mp3',
          mimeType: AudioMimeType.MP3,
          analysisType: AnalysisType.COMPREHENSIVE
        }

        const result = await service.analyzeAudio(input)

        expect(result).toHaveProperty('success')
        expect(isSuccess(result)).toBe(true)

        if (isSuccess(result)) {
          const data: AudioAnalysis = result.data

          // Verify all required fields exist
          expect(data).toHaveProperty('id')
          expect(data).toHaveProperty('fileName')
          expect(data).toHaveProperty('duration')
          expect(data).toHaveProperty('analysis')
          expect(data).toHaveProperty('suggestions')
          expect(data).toHaveProperty('metadata')
          expect(data).toHaveProperty('analyzedAt')

          // Verify id is branded type
          expect(typeof data.id).toBe('string')
          expect(data.id.length).toBeGreaterThan(0)

          // Verify fileName
          expect(data.fileName).toBe('test-song.mp3')

          // Verify duration
          expect(data.duration).toBeGreaterThan(0)

          // Verify analysis data structure
          expect(data.analysis).toHaveProperty('emotions')
          expect(data.analysis).toHaveProperty('rhythmPattern')
          expect(data.analysis).toHaveProperty('melody')
          expect(data.analysis).toHaveProperty('structure')
          expect(data.analysis).toHaveProperty('vocal')

          // Verify emotions array
          expect(Array.isArray(data.analysis.emotions)).toBe(true)

          // Verify rhythm pattern
          expect(data.analysis.rhythmPattern).toHaveProperty('tempo')
          expect(data.analysis.rhythmPattern).toHaveProperty('timeSignature')
          expect(data.analysis.rhythmPattern).toHaveProperty('rhythmType')
          expect(data.analysis.rhythmPattern).toHaveProperty('consistency')
          expect(data.analysis.rhythmPattern).toHaveProperty('suggestedStressPattern')
          expect(data.analysis.rhythmPattern).toHaveProperty('breakdown')

          // Verify melody
          expect(data.analysis.melody).toHaveProperty('key')
          expect(data.analysis.melody).toHaveProperty('scale')
          expect(data.analysis.melody).toHaveProperty('range')
          expect(data.analysis.melody).toHaveProperty('contour')
          expect(data.analysis.melody).toHaveProperty('motifs')
          expect(data.analysis.melody).toHaveProperty('hooks')

          // Verify structure
          expect(data.analysis.structure).toHaveProperty('sections')
          expect(data.analysis.structure).toHaveProperty('totalSections')
          expect(data.analysis.structure).toHaveProperty('suggestedLyricStructure')
          expect(data.analysis.structure).toHaveProperty('repeatingElements')

          // Verify vocal
          expect(data.analysis.vocal).toHaveProperty('hasVocals')

          // Verify suggestions array
          expect(Array.isArray(data.suggestions)).toBe(true)

          // Verify metadata
          expect(data.metadata).toHaveProperty('duration')
          expect(data.metadata).toHaveProperty('fileSize')
          expect(data.metadata).toHaveProperty('format')
          expect(data.metadata.format).toBe(AudioMimeType.MP3)

          // Verify analyzedAt is a Date
          expect(data.analyzedAt).toBeInstanceOf(Date)
        }
      })

      it('should return success for WAV audio file', async () => {
        const input: AudioAnalysisInput = {
          audioData: createMockAudioData(1000),
          fileName: 'track.wav',
          mimeType: AudioMimeType.WAV,
          analysisType: AnalysisType.RHYTHM
        }

        const result = await service.analyzeAudio(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.fileName).toBe('track.wav')
          expect(result.data.metadata.format).toBe(AudioMimeType.WAV)
        }
      })

      it('should return success for FLAC audio file', async () => {
        const input: AudioAnalysisInput = {
          audioData: createMockAudioData(2000),
          fileName: 'song.flac',
          mimeType: AudioMimeType.FLAC,
          analysisType: AnalysisType.EMOTION
        }

        const result = await service.analyzeAudio(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.metadata.format).toBe(AudioMimeType.FLAC)
        }
      })

      it('should analyze rhythm type correctly', async () => {
        const input: AudioAnalysisInput = {
          audioData: createMockAudioData(500),
          fileName: 'rhythm-test.mp3',
          mimeType: AudioMimeType.MP3,
          analysisType: AnalysisType.RHYTHM
        }

        const result = await service.analyzeAudio(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const rhythm = result.data.analysis.rhythmPattern

          // Verify tempo is reasonable BPM
          expect(rhythm.tempo).toBeGreaterThan(0)
          expect(rhythm.tempo).toBeLessThan(300)

          // Verify time signature format
          expect(rhythm.timeSignature).toMatch(/^\d+\/\d+$/)

          // Verify rhythm type is valid enum
          expect(Object.values(RhythmType)).toContain(rhythm.rhythmType)

          // Verify consistency (0-1)
          expect(rhythm.consistency).toBeGreaterThanOrEqual(0)
          expect(rhythm.consistency).toBeLessThanOrEqual(1)

          // Verify stress pattern
          expect(typeof rhythm.suggestedStressPattern).toBe('string')
          expect(rhythm.suggestedStressPattern.length).toBeGreaterThan(0)

          // Verify breakdown array
          expect(Array.isArray(rhythm.breakdown)).toBe(true)
        }
      })

      it('should analyze emotions with valid data', async () => {
        const input: AudioAnalysisInput = {
          audioData: createMockAudioData(500),
          fileName: 'emotional.mp3',
          mimeType: AudioMimeType.MP3,
          analysisType: AnalysisType.EMOTION
        }

        const result = await service.analyzeAudio(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const emotions = result.data.analysis.emotions

          expect(Array.isArray(emotions)).toBe(true)

          if (emotions.length > 0) {
            const emotion = emotions[0]
            if (!emotion) return

            expect(emotion).toHaveProperty('emotion')
            expect(emotion).toHaveProperty('intensity')
            expect(emotion).toHaveProperty('confidence')
            expect(emotion).toHaveProperty('timeRanges')
            expect(emotion).toHaveProperty('keywords')

            // Verify intensity (0-1)
            expect(emotion.intensity).toBeGreaterThanOrEqual(0)
            expect(emotion.intensity).toBeLessThanOrEqual(1)

            // Verify confidence (0-1)
            expect(emotion.confidence).toBeGreaterThanOrEqual(0)
            expect(emotion.confidence).toBeLessThanOrEqual(1)

            // Verify time ranges
            expect(Array.isArray(emotion.timeRanges)).toBe(true)

            // Verify keywords
            expect(Array.isArray(emotion.keywords)).toBe(true)
          }
        }
      })

      it('should analyze melody with valid contour', async () => {
        const input: AudioAnalysisInput = {
          audioData: createMockAudioData(500),
          fileName: 'melody.mp3',
          mimeType: AudioMimeType.MP3,
          analysisType: AnalysisType.MELODY
        }

        const result = await service.analyzeAudio(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const melody = result.data.analysis.melody

          // Verify key
          expect(typeof melody.key).toBe('string')
          expect(melody.key.length).toBeGreaterThan(0)

          // Verify scale
          expect(typeof melody.scale).toBe('string')

          // Verify range
          expect(melody.range).toHaveProperty('lowest')
          expect(melody.range).toHaveProperty('highest')
          expect(melody.range).toHaveProperty('range')
          expect(melody.range.range).toBeGreaterThanOrEqual(0)

          // Verify contour is valid enum
          expect(Object.values(MelodyContour)).toContain(melody.contour)

          // Verify motifs array
          expect(Array.isArray(melody.motifs)).toBe(true)

          // Verify hooks array
          expect(Array.isArray(melody.hooks)).toBe(true)
        }
      })

      it('should analyze structure with sections', async () => {
        const input: AudioAnalysisInput = {
          audioData: createMockAudioData(500),
          fileName: 'structure.mp3',
          mimeType: AudioMimeType.MP3,
          analysisType: AnalysisType.STRUCTURE
        }

        const result = await service.analyzeAudio(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const structure = result.data.analysis.structure

          // Verify sections array
          expect(Array.isArray(structure.sections)).toBe(true)

          if (structure.sections.length > 0) {
            const section = structure.sections[0]
            if (!section) return

            expect(section).toHaveProperty('type')
            expect(section).toHaveProperty('timeRange')
            expect(section).toHaveProperty('characteristics')
            expect(section).toHaveProperty('energyLevel')

            // Verify section type
            expect(Object.values(AudioSectionType)).toContain(section.type)

            // Verify time range
            expect(section.timeRange).toHaveProperty('start')
            expect(section.timeRange).toHaveProperty('end')
            expect(section.timeRange.start).toBeGreaterThanOrEqual(0)
            expect(section.timeRange.end).toBeGreaterThan(section.timeRange.start)

            // Verify energy level (0-1)
            expect(section.energyLevel).toBeGreaterThanOrEqual(0)
            expect(section.energyLevel).toBeLessThanOrEqual(1)
          }

          // Verify total sections
          expect(structure.totalSections).toBe(structure.sections.length)

          // Verify suggested lyric structure
          expect(typeof structure.suggestedLyricStructure).toBe('string')

          // Verify repeating elements
          expect(Array.isArray(structure.repeatingElements)).toBe(true)
        }
      })

      it('should analyze vocal characteristics', async () => {
        const input: AudioAnalysisInput = {
          audioData: createMockAudioData(500),
          fileName: 'vocals.mp3',
          mimeType: AudioMimeType.MP3,
          analysisType: AnalysisType.VOCAL
        }

        const result = await service.analyzeAudio(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const vocal = result.data.analysis.vocal

          expect(vocal).toHaveProperty('hasVocals')
          expect(typeof vocal.hasVocals).toBe('boolean')

          if (vocal.hasVocals && vocal.vocalStyle) {
            expect(vocal.vocalStyle).toHaveProperty('tone')
            expect(vocal.vocalStyle).toHaveProperty('range')
            expect(vocal.vocalStyle).toHaveProperty('techniques')
            expect(vocal.vocalStyle).toHaveProperty('characterization')

            // Verify techniques array
            expect(Array.isArray(vocal.vocalStyle.techniques)).toBe(true)
          }

          if (vocal.vocalEffects) {
            expect(Array.isArray(vocal.vocalEffects)).toBe(true)
            vocal.vocalEffects.forEach(effect => {
              expect(Object.values(VocalEffect)).toContain(effect)
            })
          }

          if (vocal.delivery) {
            expect(Object.values(DeliveryStyle)).toContain(vocal.delivery)
          }
        }
      })

      it('should handle optional prompt parameter', async () => {
        const input: AudioAnalysisInput = {
          audioData: createMockAudioData(500),
          fileName: 'test.mp3',
          mimeType: AudioMimeType.MP3,
          analysisType: AnalysisType.COMPREHENSIVE,
          prompt: 'Focus on emotional analysis and tempo'
        }

        const result = await service.analyzeAudio(input)

        expect(isSuccess(result)).toBe(true)
      })

      it('should handle optional existing lyrics parameter', async () => {
        const input: AudioAnalysisInput = {
          audioData: createMockAudioData(500),
          fileName: 'test.mp3',
          mimeType: AudioMimeType.MP3,
          analysisType: AnalysisType.LYRICS_FIT,
          existingLyrics: 'Some existing lyrics here'
        }

        const result = await service.analyzeAudio(input)

        expect(isSuccess(result)).toBe(true)
      })

      it('should handle optional analysis options', async () => {
        const input: AudioAnalysisInput = {
          audioData: createMockAudioData(500),
          fileName: 'test.mp3',
          mimeType: AudioMimeType.MP3,
          analysisType: AnalysisType.COMPREHENSIVE,
          options: {
            maxDuration: 300,
            language: 'en',
            includeTiming: true,
            generateVisual: false,
            detailedBreakdown: true
          }
        }

        const result = await service.analyzeAudio(input)

        expect(isSuccess(result)).toBe(true)
      })

      it('should provide audio suggestions', async () => {
        const input: AudioAnalysisInput = {
          audioData: createMockAudioData(500),
          fileName: 'test.mp3',
          mimeType: AudioMimeType.MP3,
          analysisType: AnalysisType.COMPREHENSIVE
        }

        const result = await service.analyzeAudio(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const suggestions = result.data.suggestions

          expect(Array.isArray(suggestions)).toBe(true)

          if (suggestions.length > 0) {
            const suggestion = suggestions[0]
            if (!suggestion) return

            expect(suggestion).toHaveProperty('type')
            expect(suggestion).toHaveProperty('priority')
            expect(suggestion).toHaveProperty('suggestion')
            expect(suggestion).toHaveProperty('rationale')

            // Verify type is valid enum
            expect(Object.values(SuggestionType)).toContain(suggestion.type)

            // Verify priority (0-1)
            expect(suggestion.priority).toBeGreaterThanOrEqual(0)
            expect(suggestion.priority).toBeLessThanOrEqual(1)

            // Verify suggestion text
            expect(typeof suggestion.suggestion).toBe('string')
            expect(suggestion.suggestion.length).toBeGreaterThan(0)

            // Verify rationale
            expect(typeof suggestion.rationale).toBe('string')
            expect(suggestion.rationale.length).toBeGreaterThan(0)
          }
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for empty audio data', async () => {
        const input: AudioAnalysisInput = {
          audioData: new ArrayBuffer(0),
          fileName: 'empty.mp3',
          mimeType: AudioMimeType.MP3,
          analysisType: AnalysisType.COMPREHENSIVE
        }

        const result = await service.analyzeAudio(input)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(GeminiAudioErrorCode.INVALID_AUDIO_FILE)
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
        }
      })

      it('should return error for file too large', async () => {
        const input: AudioAnalysisInput = {
          audioData: createMockAudioData(50000), // 50 MB
          fileName: 'huge.mp3',
          mimeType: AudioMimeType.MP3,
          analysisType: AnalysisType.COMPREHENSIVE
        }

        const result = await service.analyzeAudio(input)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(GeminiAudioErrorCode.FILE_TOO_LARGE)
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
        }
      })

      it('should return error for unsupported format', async () => {
        const input: AudioAnalysisInput = {
          audioData: createMockAudioData(500),
          fileName: 'test.xyz',
          mimeType: 'audio/xyz' as AudioMimeType,
          analysisType: AnalysisType.COMPREHENSIVE
        }

        const result = await service.analyzeAudio(input)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(GeminiAudioErrorCode.UNSUPPORTED_FORMAT)
        }
      })

      it('should return error for invalid prompt', async () => {
        const input: AudioAnalysisInput = {
          audioData: createMockAudioData(500),
          fileName: 'test.mp3',
          mimeType: AudioMimeType.MP3,
          analysisType: AnalysisType.COMPREHENSIVE,
          prompt: '' // Empty prompt
        }

        const result = await service.analyzeAudio(input)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(GeminiAudioErrorCode.INVALID_PROMPT)
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs: AudioAnalysisInput[] = [
          {
            audioData: new ArrayBuffer(0),
            fileName: '',
            mimeType: AudioMimeType.MP3,
            analysisType: AnalysisType.COMPREHENSIVE
          },
          {
            audioData: createMockAudioData(50000),
            fileName: 'huge.mp3',
            mimeType: AudioMimeType.MP3,
            analysisType: AnalysisType.COMPREHENSIVE
          }
        ]

        for (const input of badInputs) {
          await expect(service.analyzeAudio(input)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const input: AudioAnalysisInput = {
          audioData: createMockAudioData(500),
          fileName: 'test.mp3',
          mimeType: AudioMimeType.MP3,
          analysisType: AnalysisType.COMPREHENSIVE
        }

        const result = await service.analyzeAudio(input)

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
        const input: AudioAnalysisInput = {
          audioData: createMockAudioData(500),
          fileName: 'test.mp3',
          mimeType: AudioMimeType.MP3,
          analysisType: AnalysisType.COMPREHENSIVE
        }

        const result = await service.analyzeAudio(input)

        if (isSuccess(result)) {
          const data = result.data

          expect(() => {
            // @ts-expect-error - Testing readonly enforcement
            data.duration = 999
          }).toThrow()

          expect(() => {
            // @ts-expect-error - Testing readonly enforcement
            data.suggestions = []
          }).toThrow()
        }
      })
    })
  })

  // ===========================================
  // METHOD 2: extractMelody()
  // ===========================================
  describe('extractMelody() method', () => {
    describe('Success Cases', () => {
      it('should extract melody from valid audio', async () => {
        const audioData = createMockAudioData(500)
        const result = await service.extractMelody(audioData, 'melody.mp3')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const melody: MelodyAnalysis = result.data

          expect(melody).toHaveProperty('key')
          expect(melody).toHaveProperty('scale')
          expect(melody).toHaveProperty('range')
          expect(melody).toHaveProperty('contour')
          expect(melody).toHaveProperty('motifs')
          expect(melody).toHaveProperty('hooks')

          // Verify pitch range
          expect(melody.range).toHaveProperty('lowest')
          expect(melody.range).toHaveProperty('highest')
          expect(melody.range).toHaveProperty('range')

          // Verify contour
          expect(Object.values(MelodyContour)).toContain(melody.contour)
        }
      })

      it('should extract motifs from melody', async () => {
        const audioData = createMockAudioData(500)
        const result = await service.extractMelody(audioData, 'with-motifs.mp3')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(Array.isArray(result.data.motifs)).toBe(true)

          if (result.data.motifs.length > 0) {
            const motif = result.data.motifs[0]
            if (!motif) return

            expect(motif).toHaveProperty('description')
            expect(motif).toHaveProperty('occurrences')
            expect(motif).toHaveProperty('importance')

            // Verify importance (0-1)
            expect(motif.importance).toBeGreaterThanOrEqual(0)
            expect(motif.importance).toBeLessThanOrEqual(1)
          }
        }
      })

      it('should extract hooks from melody', async () => {
        const audioData = createMockAudioData(500)
        const result = await service.extractMelody(audioData, 'catchy.mp3')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(Array.isArray(result.data.hooks)).toBe(true)

          if (result.data.hooks.length > 0) {
            const hook = result.data.hooks[0]
            if (!hook) return

            expect(hook).toHaveProperty('timeRange')
            expect(hook).toHaveProperty('description')
            expect(hook).toHaveProperty('catchiness')
            expect(hook).toHaveProperty('suggestionForLyrics')

            // Verify catchiness (0-1)
            expect(hook.catchiness).toBeGreaterThanOrEqual(0)
            expect(hook.catchiness).toBeLessThanOrEqual(1)
          }
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for empty audio data', async () => {
        const result = await service.extractMelody(new ArrayBuffer(0), 'empty.mp3')

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(GeminiAudioErrorCode.INVALID_AUDIO_FILE)
        }
      })

      it('should return error for file too large', async () => {
        const result = await service.extractMelody(createMockAudioData(50000), 'huge.mp3')

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(GeminiAudioErrorCode.FILE_TOO_LARGE)
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        await expect(service.extractMelody(new ArrayBuffer(0), '')).resolves.toBeDefined()
        await expect(service.extractMelody(createMockAudioData(50000), 'huge.mp3')).resolves.toBeDefined()
      })

      it('should always return ServiceResponse shape', async () => {
        const result = await service.extractMelody(createMockAudioData(500), 'test.mp3')

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
  // METHOD 3: identifyRhythmPattern()
  // ===========================================
  describe('identifyRhythmPattern() method', () => {
    describe('Success Cases', () => {
      it('should identify rhythm pattern from audio', async () => {
        const audioData = createMockAudioData(500)
        const result = await service.identifyRhythmPattern(audioData, 'rhythm.mp3')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const rhythm: RhythmPattern = result.data

          expect(rhythm).toHaveProperty('tempo')
          expect(rhythm).toHaveProperty('timeSignature')
          expect(rhythm).toHaveProperty('rhythmType')
          expect(rhythm).toHaveProperty('consistency')
          expect(rhythm).toHaveProperty('suggestedStressPattern')
          expect(rhythm).toHaveProperty('breakdown')

          // Verify tempo
          expect(rhythm.tempo).toBeGreaterThan(0)
          expect(rhythm.tempo).toBeLessThan(300)

          // Verify time signature
          expect(rhythm.timeSignature).toMatch(/^\d+\/\d+$/)

          // Verify rhythm type
          expect(Object.values(RhythmType)).toContain(rhythm.rhythmType)

          // Verify consistency
          expect(rhythm.consistency).toBeGreaterThanOrEqual(0)
          expect(rhythm.consistency).toBeLessThanOrEqual(1)
        }
      })

      it('should identify steady rhythm', async () => {
        const audioData = createMockAudioData(500)
        const result = await service.identifyRhythmPattern(audioData, 'steady.mp3')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(Object.values(RhythmType)).toContain(result.data.rhythmType)
        }
      })

      it('should provide rhythm breakdown', async () => {
        const audioData = createMockAudioData(500)
        const result = await service.identifyRhythmPattern(audioData, 'test.mp3')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(Array.isArray(result.data.breakdown)).toBe(true)

          if (result.data.breakdown.length > 0) {
            const segment = result.data.breakdown[0]
            if (!segment) return

            expect(segment).toHaveProperty('timeRange')
            expect(segment).toHaveProperty('tempo')
            expect(segment).toHaveProperty('description')

            expect(segment.tempo).toBeGreaterThan(0)
          }
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for empty audio data', async () => {
        const result = await service.identifyRhythmPattern(new ArrayBuffer(0), 'empty.mp3')

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(GeminiAudioErrorCode.INVALID_AUDIO_FILE)
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        await expect(service.identifyRhythmPattern(new ArrayBuffer(0), '')).resolves.toBeDefined()
      })

      it('should always return ServiceResponse shape', async () => {
        const result = await service.identifyRhythmPattern(createMockAudioData(500), 'test.mp3')

        expect(result).toHaveProperty('success')
      })
    })
  })

  // ===========================================
  // METHOD 4: detectEmotionalTone()
  // ===========================================
  describe('detectEmotionalTone() method', () => {
    describe('Success Cases', () => {
      it('should detect emotional tone from audio', async () => {
        const audioData = createMockAudioData(500)
        const result = await service.detectEmotionalTone(audioData, 'emotional.mp3')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const emotions: readonly EmotionAnalysis[] = result.data

          expect(Array.isArray(emotions)).toBe(true)

          if (emotions.length > 0) {
            const emotion = emotions[0]
            if (!emotion) return

            expect(emotion).toHaveProperty('emotion')
            expect(emotion).toHaveProperty('intensity')
            expect(emotion).toHaveProperty('confidence')
            expect(emotion).toHaveProperty('timeRanges')
            expect(emotion).toHaveProperty('keywords')

            // Verify intensity
            expect(emotion.intensity).toBeGreaterThanOrEqual(0)
            expect(emotion.intensity).toBeLessThanOrEqual(1)

            // Verify confidence
            expect(emotion.confidence).toBeGreaterThanOrEqual(0)
            expect(emotion.confidence).toBeLessThanOrEqual(1)

            // Verify time ranges
            expect(Array.isArray(emotion.timeRanges)).toBe(true)

            // Verify keywords
            expect(Array.isArray(emotion.keywords)).toBe(true)
          }
        }
      })

      it('should detect multiple emotions', async () => {
        const audioData = createMockAudioData(500)
        const result = await service.detectEmotionalTone(audioData, 'complex.mp3')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(Array.isArray(result.data)).toBe(true)
        }
      })

      it('should provide time ranges for emotions', async () => {
        const audioData = createMockAudioData(500)
        const result = await service.detectEmotionalTone(audioData, 'test.mp3')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          if (result.data.length > 0) {
            const emotion = result.data[0]
            if (!emotion) return

            expect(Array.isArray(emotion.timeRanges)).toBe(true)

            if (emotion.timeRanges.length > 0) {
              const timeRange = emotion.timeRanges[0]
              if (!timeRange) return

              expect(timeRange).toHaveProperty('start')
              expect(timeRange).toHaveProperty('end')
              expect(timeRange.start).toBeGreaterThanOrEqual(0)
              expect(timeRange.end).toBeGreaterThan(timeRange.start)
            }
          }
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for empty audio data', async () => {
        const result = await service.detectEmotionalTone(new ArrayBuffer(0), 'empty.mp3')

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(GeminiAudioErrorCode.INVALID_AUDIO_FILE)
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        await expect(service.detectEmotionalTone(new ArrayBuffer(0), '')).resolves.toBeDefined()
      })

      it('should always return ServiceResponse shape', async () => {
        const result = await service.detectEmotionalTone(createMockAudioData(500), 'test.mp3')

        expect(result).toHaveProperty('success')
      })
    })
  })

  // ===========================================
  // METHOD 5: checkLyricsFit()
  // ===========================================
  describe('checkLyricsFit() method', () => {
    describe('Success Cases', () => {
      it('should check lyrics fit against audio', async () => {
        const audioData = createMockAudioData(500)
        const lyrics = 'Verse 1:\nSome lyrics here\nMore lyrics there'
        const result = await service.checkLyricsFit(audioData, lyrics, 'test.mp3')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const fitCheck: LyricsFitCheck = result.data

          expect(fitCheck).toHaveProperty('overallFit')
          expect(fitCheck).toHaveProperty('rhythmMatch')
          expect(fitCheck).toHaveProperty('emotionMatch')
          expect(fitCheck).toHaveProperty('syllableMatch')
          expect(fitCheck).toHaveProperty('stressMatch')
          expect(fitCheck).toHaveProperty('issues')
          expect(fitCheck).toHaveProperty('recommendations')

          // Verify scores (0-1)
          expect(fitCheck.overallFit).toBeGreaterThanOrEqual(0)
          expect(fitCheck.overallFit).toBeLessThanOrEqual(1)

          expect(fitCheck.rhythmMatch).toBeGreaterThanOrEqual(0)
          expect(fitCheck.rhythmMatch).toBeLessThanOrEqual(1)

          expect(fitCheck.emotionMatch).toBeGreaterThanOrEqual(0)
          expect(fitCheck.emotionMatch).toBeLessThanOrEqual(1)

          expect(fitCheck.syllableMatch).toBeGreaterThanOrEqual(0)
          expect(fitCheck.syllableMatch).toBeLessThanOrEqual(1)

          expect(fitCheck.stressMatch).toBeGreaterThanOrEqual(0)
          expect(fitCheck.stressMatch).toBeLessThanOrEqual(1)

          // Verify arrays
          expect(Array.isArray(fitCheck.issues)).toBe(true)
          expect(Array.isArray(fitCheck.recommendations)).toBe(true)
        }
      })

      it('should detect timing issues', async () => {
        const audioData = createMockAudioData(500)
        const lyrics = 'Short'
        const result = await service.checkLyricsFit(audioData, lyrics, 'test.mp3')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          if (result.data.issues.length > 0) {
            const issue = result.data.issues[0]
            if (!issue) return

            expect(issue).toHaveProperty('timeRange')
            expect(issue).toHaveProperty('lyricSection')
            expect(issue).toHaveProperty('issue')
            expect(issue).toHaveProperty('suggestion')
            expect(issue).toHaveProperty('severity')

            expect(['critical', 'major', 'minor']).toContain(issue.severity)
          }
        }
      })

      it('should provide recommendations', async () => {
        const audioData = createMockAudioData(500)
        const lyrics = 'Test lyrics'
        const result = await service.checkLyricsFit(audioData, lyrics, 'test.mp3')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(Array.isArray(result.data.recommendations)).toBe(true)

          if (result.data.recommendations.length > 0) {
            const rec = result.data.recommendations[0]
            if (!rec) return
            expect(typeof rec).toBe('string')
            expect(rec.length).toBeGreaterThan(0)
          }
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for empty audio data', async () => {
        const result = await service.checkLyricsFit(new ArrayBuffer(0), 'lyrics', 'empty.mp3')

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(GeminiAudioErrorCode.INVALID_AUDIO_FILE)
        }
      })

      it('should return error for empty lyrics', async () => {
        const result = await service.checkLyricsFit(createMockAudioData(500), '', 'test.mp3')

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(GeminiAudioErrorCode.INVALID_PROMPT)
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        await expect(service.checkLyricsFit(new ArrayBuffer(0), '', '')).resolves.toBeDefined()
      })

      it('should always return ServiceResponse shape', async () => {
        const result = await service.checkLyricsFit(createMockAudioData(500), 'lyrics', 'test.mp3')

        expect(result).toHaveProperty('success')
      })
    })
  })

  // ===========================================
  // METHOD 6: suggestLyricImprovements()
  // ===========================================
  describe('suggestLyricImprovements() method', () => {
    // Create a valid audio analysis for testing
    const createMockAnalysis = (): AudioAnalysis => {
      return {
        id: createAudioAnalysisId(),
        fileName: 'test.mp3',
        duration: 180,
        analysis: {
          emotions: [],
          rhythmPattern: {
            tempo: 120,
            timeSignature: '4/4',
            rhythmType: RhythmType.STEADY,
            consistency: 0.9,
            suggestedStressPattern: 'x/x/x/x/',
            breakdown: []
          },
          melody: {
            key: 'C major',
            scale: 'Major',
            range: { lowest: 'C3', highest: 'C5', range: 24 },
            contour: MelodyContour.ARCH,
            motifs: [],
            hooks: []
          },
          structure: {
            sections: [],
            totalSections: 0,
            suggestedLyricStructure: 'ABABCB',
            repeatingElements: []
          },
          vocal: {
            hasVocals: false
          }
        },
        suggestions: [],
        metadata: {
          duration: 180,
          fileSize: 5000000,
          format: AudioMimeType.MP3
        },
        analyzedAt: new Date()
      }
    }

    describe('Success Cases', () => {
      it('should suggest lyric improvements from analysis', async () => {
        const analysis = createMockAnalysis()
        const result = await service.suggestLyricImprovements(analysis)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const suggestions: readonly AudioSuggestion[] = result.data

          expect(Array.isArray(suggestions)).toBe(true)

          if (suggestions.length > 0) {
            const suggestion = suggestions[0]
            if (!suggestion) return

            expect(suggestion).toHaveProperty('type')
            expect(suggestion).toHaveProperty('priority')
            expect(suggestion).toHaveProperty('suggestion')
            expect(suggestion).toHaveProperty('rationale')

            // Verify type
            expect(Object.values(SuggestionType)).toContain(suggestion.type)

            // Verify priority
            expect(suggestion.priority).toBeGreaterThanOrEqual(0)
            expect(suggestion.priority).toBeLessThanOrEqual(1)

            // Verify suggestion text
            expect(typeof suggestion.suggestion).toBe('string')
            expect(suggestion.suggestion.length).toBeGreaterThan(0)

            // Verify rationale
            expect(typeof suggestion.rationale).toBe('string')
            expect(suggestion.rationale.length).toBeGreaterThan(0)
          }
        }
      })

      it('should handle analysis with no obvious improvements', async () => {
        const analysis = createMockAnalysis()
        const result = await service.suggestLyricImprovements(analysis)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(Array.isArray(result.data)).toBe(true)
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const analysis = createMockAnalysis()
        await expect(service.suggestLyricImprovements(analysis)).resolves.toBeDefined()
      })

      it('should always return ServiceResponse shape', async () => {
        const analysis = createMockAnalysis()
        const result = await service.suggestLyricImprovements(analysis)

        expect(result).toHaveProperty('success')
      })
    })
  })

  // ===========================================
  // METHOD 7: analyzeTimeRange()
  // ===========================================
  describe('analyzeTimeRange() method', () => {
    describe('Success Cases', () => {
      it('should analyze specific time range in audio', async () => {
        const audioData = createMockAudioData(500)
        const timeRange: TimeRange = { start: 30, end: 60 }
        const result = await service.analyzeTimeRange(
          audioData,
          timeRange,
          AnalysisType.COMPREHENSIVE,
          'test.mp3'
        )

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const data: AnalysisData = result.data

          expect(data).toHaveProperty('emotions')
          expect(data).toHaveProperty('rhythmPattern')
          expect(data).toHaveProperty('melody')
          expect(data).toHaveProperty('structure')
          expect(data).toHaveProperty('vocal')
        }
      })

      it('should analyze emotion in time range', async () => {
        const audioData = createMockAudioData(500)
        const timeRange: TimeRange = { start: 0, end: 30 }
        const result = await service.analyzeTimeRange(
          audioData,
          timeRange,
          AnalysisType.EMOTION,
          'test.mp3'
        )

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.emotions).toBeDefined()
        }
      })

      it('should analyze rhythm in time range', async () => {
        const audioData = createMockAudioData(500)
        const timeRange: TimeRange = { start: 60, end: 90 }
        const result = await service.analyzeTimeRange(
          audioData,
          timeRange,
          AnalysisType.RHYTHM,
          'test.mp3'
        )

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.rhythmPattern).toBeDefined()
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for empty audio data', async () => {
        const timeRange: TimeRange = { start: 0, end: 30 }
        const result = await service.analyzeTimeRange(
          new ArrayBuffer(0),
          timeRange,
          AnalysisType.COMPREHENSIVE,
          'empty.mp3'
        )

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(GeminiAudioErrorCode.INVALID_AUDIO_FILE)
        }
      })

      it('should return error for invalid time range', async () => {
        const audioData = createMockAudioData(500)
        const timeRange: TimeRange = { start: 100, end: 50 } // End before start
        const result = await service.analyzeTimeRange(
          audioData,
          timeRange,
          AnalysisType.COMPREHENSIVE,
          'test.mp3'
        )

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(GeminiAudioErrorCode.ANALYSIS_FAILED)
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const timeRange: TimeRange = { start: 0, end: 30 }
        await expect(
          service.analyzeTimeRange(new ArrayBuffer(0), timeRange, AnalysisType.COMPREHENSIVE, '')
        ).resolves.toBeDefined()
      })

      it('should always return ServiceResponse shape', async () => {
        const audioData = createMockAudioData(500)
        const timeRange: TimeRange = { start: 0, end: 30 }
        const result = await service.analyzeTimeRange(
          audioData,
          timeRange,
          AnalysisType.COMPREHENSIVE,
          'test.mp3'
        )

        expect(result).toHaveProperty('success')
      })
    })
  })

  // ===========================================
  // METHOD 8: validateAudioFile()
  // ===========================================
  describe('validateAudioFile() method', () => {
    describe('Success Cases', () => {
      it('should validate valid audio file', async () => {
        const audioData = createMockAudioData(500)
        const result = await service.validateAudioFile(audioData, 'test.mp3')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const validation: AudioValidation = result.data

          expect(validation).toHaveProperty('valid')
          expect(validation).toHaveProperty('format')
          expect(validation).toHaveProperty('duration')
          expect(validation).toHaveProperty('fileSize')
          expect(validation).toHaveProperty('errors')
          expect(validation).toHaveProperty('warnings')

          expect(typeof validation.valid).toBe('boolean')
          expect(Object.values(AudioMimeType)).toContain(validation.format)
          expect(validation.duration).toBeGreaterThanOrEqual(0)
          expect(validation.fileSize).toBeGreaterThan(0)
          expect(Array.isArray(validation.errors)).toBe(true)
          expect(Array.isArray(validation.warnings)).toBe(true)
        }
      })

      it('should validate and return true for good quality audio', async () => {
        const audioData = createMockAudioData(500)
        const result = await service.validateAudioFile(audioData, 'good.mp3')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.valid).toBe(true)
          expect(result.data.errors.length).toBe(0)
        }
      })

      it('should validate and provide warnings for acceptable audio', async () => {
        const audioData = createMockAudioData(100)
        const result = await service.validateAudioFile(audioData, 'small.mp3')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(Array.isArray(result.data.warnings)).toBe(true)
        }
      })
    })

    describe('Error Cases - Returned as Validation Errors', () => {
      it('should return invalid for empty audio data', async () => {
        const result = await service.validateAudioFile(new ArrayBuffer(0), 'empty.mp3')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.valid).toBe(false)
          expect(result.data.errors.length).toBeGreaterThan(0)
        }
      })

      it('should return invalid for file too large', async () => {
        const result = await service.validateAudioFile(createMockAudioData(50000), 'huge.mp3')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.valid).toBe(false)
          expect(result.data.errors.length).toBeGreaterThan(0)
        }
      })

      it('should return invalid for unsupported format', async () => {
        const result = await service.validateAudioFile(createMockAudioData(500), 'test.xyz')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.valid).toBe(false)
          expect(result.data.errors.length).toBeGreaterThan(0)
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        await expect(service.validateAudioFile(new ArrayBuffer(0), '')).resolves.toBeDefined()
        await expect(service.validateAudioFile(createMockAudioData(50000), 'huge.mp3')).resolves.toBeDefined()
      })

      it('should always return ServiceResponse shape', async () => {
        const result = await service.validateAudioFile(createMockAudioData(500), 'test.mp3')

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
  // HELPER FUNCTIONS TESTS
  // ===========================================
  describe('Helper Functions', () => {
    describe('createAudioAnalysisId()', () => {
      it('should create unique audio analysis IDs', () => {
        const id1 = createAudioAnalysisId()
        const id2 = createAudioAnalysisId()

        expect(typeof id1).toBe('string')
        expect(typeof id2).toBe('string')
        expect(id1).not.toBe(id2)
        expect(id1.length).toBeGreaterThan(0)
      })

      it('should create IDs with audio_ prefix', () => {
        const id = createAudioAnalysisId()
        expect(id.startsWith('audio_')).toBe(true)
      })
    })

    describe('isValidFileSize()', () => {
      it('should return true for valid file sizes', () => {
        expect(isValidFileSize(1000)).toBe(true)
        expect(isValidFileSize(1024 * 1024)).toBe(true) // 1 MB
        expect(isValidFileSize(5 * 1024 * 1024)).toBe(true) // 5 MB
      })

      it('should return false for zero size', () => {
        expect(isValidFileSize(0)).toBe(false)
      })

      it('should return false for negative size', () => {
        expect(isValidFileSize(-100)).toBe(false)
      })

      it('should return false for file too large', () => {
        expect(isValidFileSize(20 * 1024 * 1024)).toBe(false) // 20 MB (default max is 10 MB)
      })

      it('should respect custom max size', () => {
        expect(isValidFileSize(15 * 1024 * 1024, 20 * 1024 * 1024)).toBe(true)
        expect(isValidFileSize(25 * 1024 * 1024, 20 * 1024 * 1024)).toBe(false)
      })
    })

    describe('isValidDuration()', () => {
      it('should return true for valid durations', () => {
        expect(isValidDuration(30)).toBe(true)
        expect(isValidDuration(180)).toBe(true)
        expect(isValidDuration(300)).toBe(true)
      })

      it('should return false for duration too short', () => {
        expect(isValidDuration(5)).toBe(false) // Default min is 10
      })

      it('should return false for duration too long', () => {
        expect(isValidDuration(700)).toBe(false) // Default max is 600
      })

      it('should respect custom min/max duration', () => {
        expect(isValidDuration(5, 1, 600)).toBe(true)
        expect(isValidDuration(700, 10, 1000)).toBe(true)
        expect(isValidDuration(5, 10, 600)).toBe(false)
      })
    })

    describe('formatTimeRange()', () => {
      it('should format time range correctly', () => {
        const range: TimeRange = { start: 0, end: 30 }
        const formatted = formatTimeRange(range)

        expect(typeof formatted).toBe('string')
        expect(formatted).toContain(':')
        expect(formatted).toContain(' - ')
      })

      it('should format minutes and seconds correctly', () => {
        const range: TimeRange = { start: 65, end: 125 }
        const formatted = formatTimeRange(range)

        expect(formatted).toBe('1:05 - 2:05')
      })

      it('should pad seconds with zero', () => {
        const range: TimeRange = { start: 0, end: 5 }
        const formatted = formatTimeRange(range)

        expect(formatted).toBe('0:00 - 0:05')
      })
    })

    describe('getAudioExtension()', () => {
      it('should return .mp3 for MP3 mime type', () => {
        expect(getAudioExtension(AudioMimeType.MP3)).toBe('.mp3')
      })

      it('should return .wav for WAV mime type', () => {
        expect(getAudioExtension(AudioMimeType.WAV)).toBe('.wav')
      })

      it('should return .ogg for OGG mime type', () => {
        expect(getAudioExtension(AudioMimeType.OGG)).toBe('.ogg')
      })

      it('should return .m4a for M4A mime type', () => {
        expect(getAudioExtension(AudioMimeType.M4A)).toBe('.m4a')
      })

      it('should return .flac for FLAC mime type', () => {
        expect(getAudioExtension(AudioMimeType.FLAC)).toBe('.flac')
      })
    })
  })
})
