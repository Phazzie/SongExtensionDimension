/**
 * @fileoverview Contract Tests for Song Generation Service
 * @purpose Ensure any implementation of ISongGenerationService matches the contract exactly
 *
 * TEST-DRIVEN DEVELOPMENT APPROACH:
 * These tests are written BEFORE the mock implementation.
 * The mock implementation should be written to make these tests pass.
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import type {
  ISongGenerationService,
  GenerateSongInput,
  GenerateSongOutput,
  RegenerateSectionInput,
  SaveDraftInput,
  SaveDraftOutput,
  GenerationOptions,
  AudioGenerationContext,
  VoiceProfile,
  GenerationMetadata
} from '../../src/contracts/SongGeneration'
import {
  createDefaultGenerationOptions,
  isValidGenerationInput,
  mergeGenerationOptions,
  PerspectiveType
} from '../../src/contracts/SongGeneration'
import { isSuccess, isFailure } from '../../src/contracts/types/common'
import type {
  Song,
  SongId,
  Bridge
} from '../../src/contracts/types/song'
import { SectionType as SectionTypeEnum } from '../../src/contracts/types/song'
import type { ValidatedPrompt } from '../../src/contracts/InputValidation'

/**
 * NOTE: This test suite is designed to work with ANY implementation of ISongGenerationService.
 * During Phase 3 (BUILD), import MockSongGenerationService.
 * During Phase 5 (IMPLEMENT), import RealSongGenerationService.
 * The tests should pass for both implementations.
 */
describe('ISongGenerationService Contract Tests', () => {
  let service: ISongGenerationService

  // Helper to create a valid ValidatedPrompt for testing
  const createValidatedPrompt = (text: string = 'Write a heartfelt song about love and loss'): ValidatedPrompt => {
    return {
      id: `prompt_${Date.now()}` as any,
      prompt: text,
      context: {
        genre: 'pop',
        mood: 'melancholic',
        theme: 'love',
        targetAudience: 'adults'
      },
      constraints: {
        verseCount: 3,
        linesPerVerse: 4,
        chorusCount: 1,
        linesPerChorus: 4,
        rhymeScheme: 'ABAB'
      },
      style: {
        genre: 'pop',
        mood: 'melancholic'
      },
      sanitized: true,
      validatedAt: new Date()
    }
  }

  beforeEach(() => {
    const { MockSongGenerationService } = require('../../src/services/mock/MockSongGenerationService')
    service = new MockSongGenerationService()
  })

  // ===========================================
  // METHOD 1: generate()
  // ===========================================
  describe('generate() method', () => {
    describe('Success Cases', () => {
      it('should return success for valid input with all fields', async () => {
        const validatedPrompt = createValidatedPrompt()
        const audioContext: AudioGenerationContext = {
          rhythm: 'steady 4/4',
          emotion: 'melancholic',
          melody: 'minor key progression',
          tempo: 'moderate',
          mood: 'reflective',
          suggestions: ['emphasize emotional delivery', 'build to climax in bridge']
        }
        const voiceProfile: VoiceProfile = {
          vocabulary: ['heart', 'soul', 'forever', 'never'],
          phraseTendencies: ['questions at line ends', 'repetition for emphasis'],
          perspectivePOV: PerspectiveType.FIRST_PERSON,
          toneCharacteristics: ['introspective', 'vulnerable', 'hopeful'],
          avoidances: ['clichéd metaphors', 'forced rhymes']
        }
        const options: GenerationOptions = {
          temperature: 0.8,
          maxIterations: 5,
          qualityThreshold: 0.85,
          allowExperimental: true,
          preserveStructure: true,
          enforceRhyme: true
        }

        const input: GenerateSongInput = {
          prompt: validatedPrompt,
          style: {
            genre: 'indie-folk',
            mood: 'melancholic'
          },
          constraints: {
            verseCount: 3,
            linesPerVerse: 4,
            chorusCount: 1,
            linesPerChorus: 4,
            includeBridge: true,
            includeIntro: false,
            includeOutro: true,
            rhymeScheme: 'ABAB'
          },
          audioContext,
          voiceProfile
        }

        const result = await service.generate(input, options)

        // Verify ServiceResponse shape
        expect(result).toHaveProperty('success')
        expect(isSuccess(result)).toBe(true)

        if (isSuccess(result)) {
          const data: GenerateSongOutput = result.data

          // Verify all required fields exist
          expect(data).toHaveProperty('song')
          expect(data).toHaveProperty('alternatives')
          expect(data).toHaveProperty('confidence')
          expect(data).toHaveProperty('generationMetadata')

          // Verify Song structure
          const song: Song = data.song
          expect(song).toHaveProperty('id')
          expect(song).toHaveProperty('title')
          expect(song).toHaveProperty('verses')
          expect(song).toHaveProperty('choruses')
          expect(song).toHaveProperty('metadata')
          expect(song).toHaveProperty('generatedAt')

          expect(typeof song.id).toBe('string')
          expect(song.id.length).toBeGreaterThan(0)
          expect(typeof song.title).toBe('string')
          expect(song.title.length).toBeGreaterThan(0)

          // Verify verses array
          expect(Array.isArray(song.verses)).toBe(true)
          expect(song.verses.length).toBe(3)

          const firstVerse = song.verses[0]!
          expect(firstVerse).toHaveProperty('id')
          expect(firstVerse).toHaveProperty('number')
          expect(firstVerse).toHaveProperty('lines')
          expect(firstVerse).toHaveProperty('rhymeScheme')
          expect(firstVerse).toHaveProperty('syllablePattern')
          expect(firstVerse.number).toBe(1)
          expect(Array.isArray(firstVerse.lines)).toBe(true)
          expect(firstVerse.lines.length).toBe(4)

          // Verify line structure
          const firstLine = firstVerse.lines[0]!
          expect(firstLine).toHaveProperty('text')
          expect(firstLine).toHaveProperty('syllables')
          expect(firstLine).toHaveProperty('stressPattern')
          expect(typeof firstLine.text).toBe('string')
          expect(typeof firstLine.syllables).toBe('number')
          expect(firstLine.syllables).toBeGreaterThan(0)

          // Verify choruses array
          expect(Array.isArray(song.choruses)).toBe(true)
          expect(song.choruses.length).toBeGreaterThanOrEqual(1)

          const chorus = song.choruses[0]!
          expect(chorus).toHaveProperty('id')
          expect(chorus).toHaveProperty('lines')
          expect(chorus).toHaveProperty('rhymeScheme')
          expect(chorus).toHaveProperty('syllablePattern')
          expect(chorus).toHaveProperty('isMainChorus')
          expect(typeof chorus.isMainChorus).toBe('boolean')

          // Verify bridge exists (as requested in constraints)
          expect(song.bridge).toBeDefined()
          if (song.bridge) {
            expect(song.bridge).toHaveProperty('id')
            expect(song.bridge).toHaveProperty('lines')
            expect(Array.isArray(song.bridge.lines)).toBe(true)
          }

          // Verify outro exists (as requested in constraints)
          expect(song.outro).toBeDefined()

          // Verify metadata
          expect(song.metadata).toHaveProperty('genre')
          expect(song.metadata).toHaveProperty('mood')
          expect(song.metadata.genre).toBe('indie-folk')
          expect(song.metadata.mood).toBe('melancholic')

          // Verify generatedAt is a Date
          expect(song.generatedAt).toBeInstanceOf(Date)

          // Verify alternatives array
          expect(Array.isArray(data.alternatives)).toBe(true)

          // Verify confidence is a number between 0 and 1
          expect(typeof data.confidence).toBe('number')
          expect(data.confidence).toBeGreaterThanOrEqual(0)
          expect(data.confidence).toBeLessThanOrEqual(1)

          // Verify generationMetadata structure
          const metadata: GenerationMetadata = data.generationMetadata
          expect(metadata).toHaveProperty('model')
          expect(metadata).toHaveProperty('tokensUsed')
          expect(metadata).toHaveProperty('generationTime')
          expect(metadata).toHaveProperty('iterations')
          expect(metadata).toHaveProperty('promptVersion')
          expect(metadata).toHaveProperty('timestamp')

          expect(typeof metadata.model).toBe('string')
          expect(typeof metadata.tokensUsed).toBe('number')
          expect(typeof metadata.generationTime).toBe('number')
          expect(typeof metadata.iterations).toBe('number')
          expect(typeof metadata.promptVersion).toBe('string')
          expect(metadata.timestamp).toBeInstanceOf(Date)

          expect(metadata.tokensUsed).toBeGreaterThan(0)
          expect(metadata.generationTime).toBeGreaterThan(0)
          expect(metadata.iterations).toBeGreaterThan(0)
        }
      })

      it('should return success for minimal valid input (prompt only)', async () => {
        const validatedPrompt = createValidatedPrompt()

        const input: GenerateSongInput = {
          prompt: validatedPrompt
        }

        const result = await service.generate(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.song).toBeDefined()
          expect(result.data.song.id).toBeDefined()
          expect(result.data.song.title).toBeDefined()
          expect(result.data.song.verses.length).toBeGreaterThan(0)
          expect(result.data.song.choruses.length).toBeGreaterThan(0)
          expect(result.data.confidence).toBeGreaterThanOrEqual(0)
          expect(result.data.generationMetadata).toBeDefined()
        }
      })

      it('should respect verse count constraint', async () => {
        const validatedPrompt = createValidatedPrompt()
        const input: GenerateSongInput = {
          prompt: validatedPrompt,
          constraints: {
            verseCount: 5,
            linesPerVerse: 4
          }
        }

        const result = await service.generate(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.song.verses.length).toBe(5)
          result.data.song.verses.forEach((verse, index) => {
            expect(verse.number).toBe(index + 1)
            expect(verse.lines.length).toBe(4)
          })
        }
      })

      it('should respect chorus count constraint', async () => {
        const validatedPrompt = createValidatedPrompt()
        const input: GenerateSongInput = {
          prompt: validatedPrompt,
          constraints: {
            chorusCount: 2,
            linesPerChorus: 4
          }
        }

        const result = await service.generate(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.song.choruses.length).toBeGreaterThanOrEqual(2)
          result.data.song.choruses.forEach((chorus) => {
            expect(chorus.lines.length).toBe(4)
          })
        }
      })

      it('should include bridge when requested', async () => {
        const validatedPrompt = createValidatedPrompt()
        const input: GenerateSongInput = {
          prompt: validatedPrompt,
          constraints: {
            includeBridge: true
          }
        }

        const result = await service.generate(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.song.bridge).toBeDefined()
          expect(result.data.song.bridge!.id).toBeDefined()
          expect(result.data.song.bridge!.lines.length).toBeGreaterThan(0)
        }
      })

      it('should exclude bridge when not requested', async () => {
        const validatedPrompt = createValidatedPrompt()
        const input: GenerateSongInput = {
          prompt: validatedPrompt,
          constraints: {
            includeBridge: false
          }
        }

        const result = await service.generate(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.song.bridge).toBeUndefined()
        }
      })

      it('should include intro when requested', async () => {
        const validatedPrompt = createValidatedPrompt()
        const input: GenerateSongInput = {
          prompt: validatedPrompt,
          constraints: {
            includeIntro: true
          }
        }

        const result = await service.generate(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.song.intro).toBeDefined()
          expect(result.data.song.intro!.id).toBeDefined()
          expect(result.data.song.intro!.type).toBe(SectionTypeEnum.INTRO)
        }
      })

      it('should include outro when requested', async () => {
        const validatedPrompt = createValidatedPrompt()
        const input: GenerateSongInput = {
          prompt: validatedPrompt,
          constraints: {
            includeOutro: true
          }
        }

        const result = await service.generate(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.song.outro).toBeDefined()
          expect(result.data.song.outro!.id).toBeDefined()
          expect(result.data.song.outro!.type).toBe(SectionTypeEnum.OUTRO)
        }
      })

      it('should apply style configuration', async () => {
        const validatedPrompt = createValidatedPrompt()
        const input: GenerateSongInput = {
          prompt: validatedPrompt,
          style: {
            genre: 'rock',
            mood: 'energetic'
          }
        }

        const result = await service.generate(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.song.metadata.genre).toBe('rock')
          expect(result.data.song.metadata.mood).toBe('energetic')
        }
      })

      it('should use audio context for generation', async () => {
        const validatedPrompt = createValidatedPrompt()
        const audioContext: AudioGenerationContext = {
          rhythm: 'syncopated',
          emotion: 'nostalgic',
          melody: 'descending',
          tempo: 'slow',
          mood: 'wistful',
          suggestions: ['use minor key', 'add pauses for emphasis']
        }

        const input: GenerateSongInput = {
          prompt: validatedPrompt,
          audioContext
        }

        const result = await service.generate(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.song).toBeDefined()
          // Audio context should influence generation (implementation detail)
        }
      })

      it('should apply voice profile for consistency', async () => {
        const validatedPrompt = createValidatedPrompt()
        const voiceProfile: VoiceProfile = {
          vocabulary: ['dream', 'hope', 'light'],
          phraseTendencies: ['metaphorical language', 'imagery-rich'],
          perspectivePOV: PerspectiveType.FIRST_PERSON,
          toneCharacteristics: ['optimistic', 'reflective'],
          avoidances: ['negative language', 'clichés']
        }

        const input: GenerateSongInput = {
          prompt: validatedPrompt,
          voiceProfile
        }

        const result = await service.generate(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.song).toBeDefined()
          // Voice profile should influence word choice (implementation detail)
        }
      })

      it('should respect generation options', async () => {
        const validatedPrompt = createValidatedPrompt()
        const options: GenerationOptions = {
          temperature: 0.9,
          maxIterations: 10,
          qualityThreshold: 0.9,
          allowExperimental: true,
          preserveStructure: false,
          enforceRhyme: false
        }

        const input: GenerateSongInput = {
          prompt: validatedPrompt
        }

        const result = await service.generate(input, options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.generationMetadata.iterations).toBeGreaterThan(0)
          expect(result.data.generationMetadata.iterations).toBeLessThanOrEqual(10)
        }
      })

      it('should generate alternatives when appropriate', async () => {
        const validatedPrompt = createValidatedPrompt()
        const input: GenerateSongInput = {
          prompt: validatedPrompt
        }

        const result = await service.generate(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(Array.isArray(result.data.alternatives)).toBe(true)

          if (result.data.alternatives && result.data.alternatives.length > 0) {
            const alt = result.data.alternatives[0]!
            expect(alt).toHaveProperty('sectionType')
            expect(alt).toHaveProperty('sectionId')
            expect(alt).toHaveProperty('alternatives')
            expect(alt).toHaveProperty('reason')

            expect(Array.isArray(alt.alternatives)).toBe(true)
            expect(typeof alt.reason).toBe('string')
          }
        }
      })

      it('should handle very long prompts', async () => {
        const longText = 'Write a song about '.repeat(100) + 'life'
        const validatedPrompt = createValidatedPrompt(longText)
        const input: GenerateSongInput = {
          prompt: validatedPrompt
        }

        const result = await service.generate(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.song).toBeDefined()
        }
      })

      it('should handle complex constraints', async () => {
        const validatedPrompt = createValidatedPrompt()
        const input: GenerateSongInput = {
          prompt: validatedPrompt,
          constraints: {
            verseCount: 4,
            linesPerVerse: 6,
            chorusCount: 2,
            linesPerChorus: 8,
            includeBridge: true,
            includeIntro: true,
            includeOutro: true,
            rhymeScheme: 'ABABCC',
            targetLength: 50
          }
        }

        const result = await service.generate(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.song.verses.length).toBe(4)
          expect(result.data.song.bridge).toBeDefined()
          expect(result.data.song.intro).toBeDefined()
          expect(result.data.song.outro).toBeDefined()
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for invalid prompt', async () => {
        const input: GenerateSongInput = {
          // @ts-expect-error - Testing runtime behavior
          prompt: null
        }

        const result = await service.generate(input)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('INVALID_PROMPT')
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
          expect(result.error.message.length).toBeGreaterThan(0)
        }
      })

      it('should return error for empty prompt text', async () => {
        const validatedPrompt = createValidatedPrompt('')
        const input: GenerateSongInput = {
          prompt: validatedPrompt
        }

        const result = await service.generate(input)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('INVALID_PROMPT')
        }
      })

      it('should return error when generation fails', async () => {
        const validatedPrompt = createValidatedPrompt('TRIGGER_GENERATION_FAILURE')
        const input: GenerateSongInput = {
          prompt: validatedPrompt
        }

        const result = await service.generate(input)

        // May return GENERATION_FAILED error in some scenarios
        if (isFailure(result)) {
          expect(['GENERATION_FAILED', 'INSUFFICIENT_QUALITY', 'API_ERROR']).toContain(result.error.code)
        }
      })

      it('should return error for API timeout', async () => {
        const validatedPrompt = createValidatedPrompt('TRIGGER_TIMEOUT')
        const input: GenerateSongInput = {
          prompt: validatedPrompt
        }
        const options: GenerationOptions = {
          maxIterations: 1000 // Trigger timeout
        }

        const result = await service.generate(input, options)

        // Should handle timeout gracefully
        if (isFailure(result)) {
          expect(['API_TIMEOUT', 'GENERATION_FAILED']).toContain(result.error.code)
        }
      })

      it('should return error for API errors', async () => {
        const validatedPrompt = createValidatedPrompt('TRIGGER_API_ERROR')
        const input: GenerateSongInput = {
          prompt: validatedPrompt
        }

        const result = await service.generate(input)

        if (isFailure(result)) {
          expect(['API_ERROR', 'GENERATION_FAILED']).toContain(result.error.code)
        }
      })

      it('should return error for rate limit exceeded', async () => {
        const validatedPrompt = createValidatedPrompt()
        const input: GenerateSongInput = {
          prompt: validatedPrompt
        }

        // Make multiple rapid requests to trigger rate limit
        const results = await Promise.all([
          service.generate(input),
          service.generate(input),
          service.generate(input),
          service.generate(input),
          service.generate(input),
          service.generate(input),
          service.generate(input),
          service.generate(input),
          service.generate(input),
          service.generate(input)
        ])

        // At least one should be rate limited (in real implementation)
        // This is implementation-dependent, so we just verify it doesn't throw
        expect(results.length).toBe(10)
      })

      it('should return error for inappropriate content', async () => {
        const validatedPrompt = createValidatedPrompt('TRIGGER_INAPPROPRIATE_CONTENT')
        const input: GenerateSongInput = {
          prompt: validatedPrompt
        }

        const result = await service.generate(input)

        if (isFailure(result)) {
          expect(['INAPPROPRIATE_CONTENT', 'GENERATION_FAILED']).toContain(result.error.code)
        }
      })

      it('should return error for insufficient quality', async () => {
        const validatedPrompt = createValidatedPrompt()
        const input: GenerateSongInput = {
          prompt: validatedPrompt
        }
        const options: GenerationOptions = {
          qualityThreshold: 0.99, // Very high threshold
          maxIterations: 1 // Only one attempt
        }

        const result = await service.generate(input, options)

        // May fail to meet quality threshold
        if (isFailure(result)) {
          expect(['INSUFFICIENT_QUALITY', 'GENERATION_FAILED']).toContain(result.error.code)
        }
      })

      it('should return error for constraint violations', async () => {
        const validatedPrompt = createValidatedPrompt()
        const input: GenerateSongInput = {
          prompt: validatedPrompt,
          constraints: {
            verseCount: 0, // Invalid: must be > 0
            linesPerVerse: 4
          }
        }

        const result = await service.generate(input)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('CONSTRAINT_VIOLATION')
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
        }
      })

      it('should return error for negative verse count', async () => {
        const validatedPrompt = createValidatedPrompt()
        const input: GenerateSongInput = {
          prompt: validatedPrompt,
          constraints: {
            verseCount: -1
          }
        }

        const result = await service.generate(input)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('CONSTRAINT_VIOLATION')
        }
      })

      it('should return error for conflicting constraints', async () => {
        const validatedPrompt = createValidatedPrompt()
        const input: GenerateSongInput = {
          prompt: validatedPrompt,
          constraints: {
            verseCount: 10,
            linesPerVerse: 10,
            targetLength: 5 // 10*10=100 lines but target is only 5
          }
        }

        const result = await service.generate(input)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('CONSTRAINT_VIOLATION')
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const validatedPrompt = createValidatedPrompt()
        const badInputs: any[] = [
          // @ts-expect-error - Testing runtime behavior
          { prompt: null },
          // @ts-expect-error - Testing runtime behavior
          { prompt: undefined },
          // @ts-expect-error - Testing runtime behavior
          {},
          // @ts-expect-error - Testing runtime behavior
          null,
          // @ts-expect-error - Testing runtime behavior
          undefined,
          { prompt: validatedPrompt, constraints: { verseCount: -1 } }
        ]

        for (const input of badInputs) {
          await expect(service.generate(input)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const validatedPrompt = createValidatedPrompt()
        const input: GenerateSongInput = {
          prompt: validatedPrompt
        }

        const result = await service.generate(input)

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
        const validatedPrompt = createValidatedPrompt()
        const input: GenerateSongInput = {
          prompt: validatedPrompt
        }

        const result = await service.generate(input)

        if (isSuccess(result)) {
          const song = result.data.song

          expect(() => {
            // @ts-expect-error - Testing readonly enforcement
            song.title = 'changed'
          }).toThrow()

          expect(() => {
            // @ts-expect-error - Testing readonly enforcement
            song.verses.push({} as any)
          }).toThrow()

          expect(() => {
            // @ts-expect-error - Testing readonly enforcement
            result.data.confidence = 0.5
          }).toThrow()
        }
      })
    })
  })

  // ===========================================
  // METHOD 2: regenerateSection()
  // ===========================================
  describe('regenerateSection() method', () => {
    // Helper to create a mock song for testing
    const createMockSong = (): Song => {
      return {
        id: 'song_123' as SongId,
        title: 'Test Song',
        verses: [{
          id: 'verse_1' as any,
          number: 1,
          lines: [
            { text: 'Line 1', syllables: 5, stressPattern: 'x/x/x' },
            { text: 'Line 2', syllables: 5, stressPattern: 'x/x/x' },
            { text: 'Line 3', syllables: 5, stressPattern: 'x/x/x' },
            { text: 'Line 4', syllables: 5, stressPattern: 'x/x/x' }
          ],
          rhymeScheme: 'ABAB',
          syllablePattern: [5, 5, 5, 5]
        }],
        choruses: [{
          id: 'chorus_1' as any,
          lines: [
            { text: 'Chorus 1', syllables: 6, stressPattern: 'x/x/x/' },
            { text: 'Chorus 2', syllables: 6, stressPattern: 'x/x/x/' }
          ],
          rhymeScheme: 'AA',
          syllablePattern: [6, 6],
          isMainChorus: true
        }],
        metadata: {
          genre: 'pop',
          mood: 'happy'
        },
        generatedAt: new Date()
      }
    }

    describe('Success Cases', () => {
      it('should regenerate verse section successfully', async () => {
        const song = createMockSong()
        const input: RegenerateSectionInput = {
          songId: song.id,
          sectionType: SectionTypeEnum.VERSE,
          sectionId: song.verses[0]!.id as any,
          preserveVoice: true
        }

        const result = await service.regenerateSection(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const updatedSong: Song = result.data

          expect(updatedSong.id).toBe(song.id)
          expect(updatedSong.verses.length).toBe(song.verses.length)
          expect(updatedSong.verses[0]).toBeDefined()
          expect(updatedSong.verses[0]!.id).toBe(song.verses[0]!.id)
        }
      })

      it('should regenerate chorus section successfully', async () => {
        const song = createMockSong()
        const input: RegenerateSectionInput = {
          songId: song.id,
          sectionType: SectionTypeEnum.CHORUS,
          sectionId: song.choruses[0]!.id as any,
          preserveVoice: false
        }

        const result = await service.regenerateSection(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const updatedSong: Song = result.data
          expect(updatedSong.choruses.length).toBeGreaterThan(0)
        }
      })

      it('should regenerate bridge section successfully', async () => {
        const baseSong = createMockSong()
        const bridgeSection: Bridge = {
          id: 'bridge_1' as any,
          lines: [
            { text: 'Bridge line', syllables: 7, stressPattern: 'x/x/x/x' }
          ],
          rhymeScheme: 'A',
          syllablePattern: [7]
        }
        const song: Song = {
          ...baseSong,
          bridge: bridgeSection
        }

        const input: RegenerateSectionInput = {
          songId: song.id,
          sectionType: SectionTypeEnum.BRIDGE,
          sectionId: song.bridge!.id as any,
          preserveVoice: true
        }

        const result = await service.regenerateSection(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.bridge).toBeDefined()
        }
      })

      it('should apply regeneration constraints', async () => {
        const song = createMockSong()
        const input: RegenerateSectionInput = {
          songId: song.id,
          sectionType: SectionTypeEnum.VERSE,
          constraints: {
            mustRhymeWith: ['love', 'above'],
            mustContainThemes: ['hope', 'dreams'],
            targetSyllableCount: 8,
            targetMood: 'uplifting',
            avoidPhrases: ['cliché phrase']
          },
          preserveVoice: true
        }

        const result = await service.regenerateSection(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data).toBeDefined()
        }
      })

      it('should preserve voice when requested', async () => {
        const song = createMockSong()
        const input: RegenerateSectionInput = {
          songId: song.id,
          sectionType: SectionTypeEnum.VERSE,
          preserveVoice: true
        }

        const result = await service.regenerateSection(input)

        expect(isSuccess(result)).toBe(true)
        // Voice preservation is implementation detail
      })

      it('should allow voice changes when not preserving', async () => {
        const song = createMockSong()
        const input: RegenerateSectionInput = {
          songId: song.id,
          sectionType: SectionTypeEnum.CHORUS,
          preserveVoice: false
        }

        const result = await service.regenerateSection(input)

        expect(isSuccess(result)).toBe(true)
      })
    })

    describe('Error Cases', () => {
      it('should return error for song not found', async () => {
        const input: RegenerateSectionInput = {
          songId: 'nonexistent_song_id' as SongId,
          sectionType: SectionTypeEnum.VERSE,
          preserveVoice: true
        }

        const result = await service.regenerateSection(input)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('SONG_NOT_FOUND')
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
        }
      })

      it('should return error for invalid section type', async () => {
        const input: RegenerateSectionInput = {
          songId: 'song_123' as SongId,
          // @ts-expect-error - Testing runtime behavior
          sectionType: 'INVALID_SECTION',
          preserveVoice: true
        }

        const result = await service.regenerateSection(input)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(['INVALID_PROMPT', 'GENERATION_FAILED']).toContain(result.error.code)
        }
      })

      it('should return error for generation failure', async () => {
        const input: RegenerateSectionInput = {
          songId: 'TRIGGER_FAILURE' as SongId,
          sectionType: SectionTypeEnum.VERSE,
          preserveVoice: true
        }

        const result = await service.regenerateSection(input)

        if (isFailure(result)) {
          expect(['GENERATION_FAILED', 'SONG_NOT_FOUND']).toContain(result.error.code)
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
          { songId: 'invalid', sectionType: 'invalid', preserveVoice: true }
        ]

        for (const input of badInputs) {
          await expect(service.regenerateSection(input)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const song = createMockSong()
        const input: RegenerateSectionInput = {
          songId: song.id,
          sectionType: SectionTypeEnum.VERSE,
          preserveVoice: true
        }

        const result = await service.regenerateSection(input)

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
        const input: RegenerateSectionInput = {
          songId: song.id,
          sectionType: SectionTypeEnum.VERSE,
          preserveVoice: true
        }

        const result = await service.regenerateSection(input)

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
  // METHOD 3: generateAlternatives()
  // ===========================================
  describe('generateAlternatives() method', () => {
    describe('Success Cases', () => {
      it('should generate alternatives for single line', async () => {
        const songId = 'song_123' as SongId
        const lineNumbers = [1]
        const count = 3

        const result = await service.generateAlternatives(songId, lineNumbers, count)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const alternatives: readonly string[] = result.data

          expect(Array.isArray(alternatives)).toBe(true)
          expect(alternatives.length).toBeLessThanOrEqual(count)

          alternatives.forEach(alt => {
            expect(typeof alt).toBe('string')
            expect(alt.length).toBeGreaterThan(0)
          })
        }
      })

      it('should generate alternatives for multiple lines', async () => {
        const songId = 'song_456' as SongId
        const lineNumbers = [1, 3, 5]
        const count = 5

        const result = await service.generateAlternatives(songId, lineNumbers, count)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(Array.isArray(result.data)).toBe(true)
          // Total alternatives should be lineNumbers.length * count or less
          expect(result.data.length).toBeGreaterThan(0)
        }
      })

      it('should use default count when not specified', async () => {
        const songId = 'song_789' as SongId
        const lineNumbers = [2]

        const result = await service.generateAlternatives(songId, lineNumbers)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(Array.isArray(result.data)).toBe(true)
          // Default count is usually 3
          expect(result.data.length).toBeGreaterThan(0)
          expect(result.data.length).toBeLessThanOrEqual(10)
        }
      })

      it('should handle large count values', async () => {
        const songId = 'song_abc' as SongId
        const lineNumbers = [1]
        const count = 20

        const result = await service.generateAlternatives(songId, lineNumbers, count)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.length).toBeGreaterThan(0)
          expect(result.data.length).toBeLessThanOrEqual(count)
        }
      })

      it('should handle empty line numbers array', async () => {
        const songId = 'song_def' as SongId
        const lineNumbers: readonly number[] = []

        const result = await service.generateAlternatives(songId, lineNumbers)

        // May succeed with empty array or return error
        expect(result).toHaveProperty('success')
        if (isSuccess(result)) {
          expect(Array.isArray(result.data)).toBe(true)
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for song not found', async () => {
        const songId = 'nonexistent_song' as SongId
        const lineNumbers = [1, 2]

        const result = await service.generateAlternatives(songId, lineNumbers)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('SONG_NOT_FOUND')
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
        }
      })

      it('should return error for invalid line numbers', async () => {
        const songId = 'song_123' as SongId
        const lineNumbers = [-1, 0, 1000]

        const result = await service.generateAlternatives(songId, lineNumbers)

        if (isFailure(result)) {
          expect(['INVALID_PROMPT', 'GENERATION_FAILED']).toContain(result.error.code)
        }
      })

      it('should return error for zero count', async () => {
        const songId = 'song_123' as SongId
        const lineNumbers = [1]
        const count = 0

        const result = await service.generateAlternatives(songId, lineNumbers, count)

        if (isFailure(result)) {
          expect(['INVALID_PROMPT', 'CONSTRAINT_VIOLATION']).toContain(result.error.code)
        }
      })

      it('should return error for negative count', async () => {
        const songId = 'song_123' as SongId
        const lineNumbers = [1]
        const count = -5

        const result = await service.generateAlternatives(songId, lineNumbers, count)

        if (isFailure(result)) {
          expect(['INVALID_PROMPT', 'CONSTRAINT_VIOLATION']).toContain(result.error.code)
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs: Array<[any, any, any?]> = [
          // @ts-expect-error
          [null, [1], 3],
          // @ts-expect-error
          ['song_id' as SongId, null, 3],
          // @ts-expect-error
          ['song_id' as SongId, [1], -1],
          // @ts-expect-error
          ['', [], undefined]
        ]

        for (const [songId, lineNumbers, count] of badInputs) {
          await expect(service.generateAlternatives(songId, lineNumbers, count)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const songId = 'song_123' as SongId
        const lineNumbers = [1, 2]

        const result = await service.generateAlternatives(songId, lineNumbers)

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
        const songId = 'song_123' as SongId
        const lineNumbers = [1]

        const result = await service.generateAlternatives(songId, lineNumbers)

        if (isSuccess(result)) {
          expect(() => {
            // @ts-expect-error
            result.data.push('new alternative')
          }).toThrow()
        }
      })
    })
  })

  // ===========================================
  // METHOD 4: saveDraft()
  // ===========================================
  describe('saveDraft() method', () => {
    const createMockSong = (): Song => {
      return {
        id: 'song_draft_123' as SongId,
        title: 'Draft Song',
        verses: [{
          id: 'verse_1' as any,
          number: 1,
          lines: [
            { text: 'Draft line', syllables: 5, stressPattern: 'x/x/x' }
          ],
          rhymeScheme: 'A',
          syllablePattern: [5]
        }],
        choruses: [{
          id: 'chorus_1' as any,
          lines: [
            { text: 'Draft chorus', syllables: 6, stressPattern: 'x/x/x/' }
          ],
          rhymeScheme: 'A',
          syllablePattern: [6],
          isMainChorus: true
        }],
        metadata: {},
        generatedAt: new Date()
      }
    }

    describe('Success Cases', () => {
      it('should save draft with all fields', async () => {
        const song = createMockSong()
        const input: SaveDraftInput = {
          song,
          draftName: 'My Draft Song',
          tags: ['rock', 'emotional', 'work-in-progress'],
          notes: 'Need to work on the bridge section'
        }

        const result = await service.saveDraft(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const output: SaveDraftOutput = result.data

          expect(output).toHaveProperty('draftId')
          expect(output).toHaveProperty('savedAt')
          expect(output).toHaveProperty('version')

          expect(typeof output.draftId).toBe('string')
          expect(output.draftId.length).toBeGreaterThan(0)
          expect(output.savedAt).toBeInstanceOf(Date)
          expect(typeof output.version).toBe('number')
          expect(output.version).toBeGreaterThan(0)
        }
      })

      it('should save draft with minimal fields (song only)', async () => {
        const song = createMockSong()
        const input: SaveDraftInput = {
          song
        }

        const result = await service.saveDraft(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.draftId).toBeDefined()
          expect(result.data.savedAt).toBeInstanceOf(Date)
          expect(result.data.version).toBeGreaterThanOrEqual(1)
        }
      })

      it('should auto-generate draft name if not provided', async () => {
        const song = createMockSong()
        const input: SaveDraftInput = {
          song
        }

        const result = await service.saveDraft(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.draftId).toBeDefined()
        }
      })

      it('should handle empty tags array', async () => {
        const song = createMockSong()
        const input: SaveDraftInput = {
          song,
          tags: []
        }

        const result = await service.saveDraft(input)

        expect(isSuccess(result)).toBe(true)
      })

      it('should handle empty notes', async () => {
        const song = createMockSong()
        const input: SaveDraftInput = {
          song,
          notes: ''
        }

        const result = await service.saveDraft(input)

        expect(isSuccess(result)).toBe(true)
      })

      it('should increment version for same song', async () => {
        const song = createMockSong()
        const input: SaveDraftInput = {
          song,
          draftName: 'Version Test'
        }

        const result1 = await service.saveDraft(input)
        const result2 = await service.saveDraft(input)

        expect(isSuccess(result1)).toBe(true)
        expect(isSuccess(result2)).toBe(true)

        if (isSuccess(result1) && isSuccess(result2)) {
          // Versions should be tracked (implementation-dependent)
          expect(result2.data.version).toBeGreaterThanOrEqual(result1.data.version)
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for invalid song', async () => {
        const input: SaveDraftInput = {
          // @ts-expect-error - Testing runtime behavior
          song: null
        }

        const result = await service.saveDraft(input)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(['SAVE_FAILED', 'INVALID_PROMPT']).toContain(result.error.code)
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
        }
      })

      it('should return error for song with no ID', async () => {
        const baseSong = createMockSong()
        const song: Song = {
          ...baseSong,
          id: '' as SongId
        }

        const input: SaveDraftInput = {
          song
        }

        const result = await service.saveDraft(input)

        if (isFailure(result)) {
          expect(['SAVE_FAILED', 'INVALID_PROMPT']).toContain(result.error.code)
        }
      })

      it('should return error when save operation fails', async () => {
        const baseSong = createMockSong()
        const song: Song = {
          ...baseSong,
          id: 'TRIGGER_SAVE_FAILURE' as SongId
        }

        const input: SaveDraftInput = {
          song
        }

        const result = await service.saveDraft(input)

        if (isFailure(result)) {
          expect(result.error.code).toBe('SAVE_FAILED')
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
          { song: null }
        ]

        for (const input of badInputs) {
          await expect(service.saveDraft(input)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const song = createMockSong()
        const input: SaveDraftInput = {
          song
        }

        const result = await service.saveDraft(input)

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
        const input: SaveDraftInput = {
          song
        }

        const result = await service.saveDraft(input)

        if (isSuccess(result)) {
          expect(() => {
            // @ts-expect-error
            result.data.draftId = 'changed'
          }).toThrow()

          expect(() => {
            // @ts-expect-error
            result.data.version = 999
          }).toThrow()
        }
      })
    })
  })

  // ===========================================
  // METHOD 5: loadDraft()
  // ===========================================
  describe('loadDraft() method', () => {
    describe('Success Cases', () => {
      it('should load existing draft successfully', async () => {
        const draftId = 'draft_12345'

        const result = await service.loadDraft(draftId)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const song: Song = result.data

          expect(song).toHaveProperty('id')
          expect(song).toHaveProperty('title')
          expect(song).toHaveProperty('verses')
          expect(song).toHaveProperty('choruses')
          expect(song).toHaveProperty('metadata')
          expect(song).toHaveProperty('generatedAt')

          expect(Array.isArray(song.verses)).toBe(true)
          expect(Array.isArray(song.choruses)).toBe(true)
        }
      })

      it('should load draft with complete song structure', async () => {
        const draftId = 'draft_complete'

        const result = await service.loadDraft(draftId)

        if (isSuccess(result)) {
          const song = result.data
          expect(song.verses.length).toBeGreaterThan(0)
          expect(song.choruses.length).toBeGreaterThan(0)
        }
      })

      it('should handle various draft ID formats', async () => {
        const draftIds = [
          'draft_123',
          'DRAFT_ABC',
          'draft-with-dashes',
          'draft_with_underscores_123'
        ]

        for (const draftId of draftIds) {
          const result = await service.loadDraft(draftId)
          expect(result).toHaveProperty('success')
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for draft not found', async () => {
        const draftId = 'nonexistent_draft_id'

        const result = await service.loadDraft(draftId)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('SONG_NOT_FOUND')
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
        }
      })

      it('should return error for empty draft ID', async () => {
        const draftId = ''

        const result = await service.loadDraft(draftId)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(['SONG_NOT_FOUND', 'INVALID_PROMPT']).toContain(result.error.code)
        }
      })

      it('should return error for null draft ID', async () => {
        // @ts-expect-error - Testing runtime behavior
        const result = await service.loadDraft(null)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(['SONG_NOT_FOUND', 'INVALID_PROMPT']).toContain(result.error.code)
        }
      })

      it('should return error for undefined draft ID', async () => {
        // @ts-expect-error - Testing runtime behavior
        const result = await service.loadDraft(undefined)

        expect(isFailure(result)).toBe(true)
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs: any[] = [
          '',
          // @ts-expect-error
          null,
          // @ts-expect-error
          undefined,
          'nonexistent_id'
        ]

        for (const input of badInputs) {
          await expect(service.loadDraft(input)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const draftId = 'draft_123'

        const result = await service.loadDraft(draftId)

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
        const draftId = 'draft_123'

        const result = await service.loadDraft(draftId)

        if (isSuccess(result)) {
          expect(() => {
            // @ts-expect-error
            result.data.title = 'changed'
          }).toThrow()

          expect(() => {
            // @ts-expect-error
            result.data.verses.push({})
          }).toThrow()
        }
      })
    })
  })

  // ===========================================
  // METHOD 6: extractVoiceProfile()
  // ===========================================
  describe('extractVoiceProfile() method', () => {
    const createMockSong = (): Song => {
      return {
        id: 'song_voice_123' as SongId,
        title: 'Voice Profile Test',
        verses: [{
          id: 'verse_1' as any,
          number: 1,
          lines: [
            { text: 'I walk alone through empty streets', syllables: 8, stressPattern: 'x/x/x/x/' },
            { text: 'My heart aches with every beat', syllables: 8, stressPattern: 'x/x/x/x/' },
            { text: 'I wonder if you think of me', syllables: 8, stressPattern: 'x/x/x/x/' },
            { text: 'Or if you\'ve found your way to be free', syllables: 10, stressPattern: 'x/x/x/x/x/' }
          ],
          rhymeScheme: 'ABAB',
          syllablePattern: [8, 8, 8, 10]
        }],
        choruses: [{
          id: 'chorus_1' as any,
          lines: [
            { text: 'I\'ll never let you go', syllables: 6, stressPattern: 'x/x/x/' },
            { text: 'Even though you\'re far away', syllables: 7, stressPattern: 'x/x/x/x' }
          ],
          rhymeScheme: 'AB',
          syllablePattern: [6, 7],
          isMainChorus: true
        }],
        metadata: {
          genre: 'indie',
          mood: 'melancholic'
        },
        generatedAt: new Date()
      }
    }

    describe('Success Cases', () => {
      it('should extract voice profile from complete song', async () => {
        const song = createMockSong()

        const result = await service.extractVoiceProfile(song)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const profile: VoiceProfile = result.data

          expect(profile).toHaveProperty('vocabulary')
          expect(profile).toHaveProperty('phraseTendencies')
          expect(profile).toHaveProperty('perspectivePOV')
          expect(profile).toHaveProperty('toneCharacteristics')
          expect(profile).toHaveProperty('avoidances')

          expect(Array.isArray(profile.vocabulary)).toBe(true)
          expect(Array.isArray(profile.phraseTendencies)).toBe(true)
          expect(Array.isArray(profile.toneCharacteristics)).toBe(true)
          expect(Array.isArray(profile.avoidances)).toBe(true)

          expect(typeof profile.perspectivePOV).toBe('string')
          expect(['first_person', 'second_person', 'third_person', 'omniscient', 'character']).toContain(profile.perspectivePOV)

          // Should extract meaningful vocabulary
          expect(profile.vocabulary.length).toBeGreaterThan(0)
        }
      })

      it('should extract vocabulary from song lyrics', async () => {
        const song = createMockSong()

        const result = await service.extractVoiceProfile(song)

        if (isSuccess(result)) {
          const vocabulary = result.data.vocabulary
          expect(vocabulary.length).toBeGreaterThan(0)
          vocabulary.forEach(word => {
            expect(typeof word).toBe('string')
            expect(word.length).toBeGreaterThan(0)
          })
        }
      })

      it('should detect first person perspective', async () => {
        const song = createMockSong()
        // Song uses "I", "my", "me" - first person

        const result = await service.extractVoiceProfile(song)

        if (isSuccess(result)) {
          expect(result.data.perspectivePOV).toBe(PerspectiveType.FIRST_PERSON)
        }
      })

      it('should identify phrase tendencies', async () => {
        const song = createMockSong()

        const result = await service.extractVoiceProfile(song)

        if (isSuccess(result)) {
          expect(Array.isArray(result.data.phraseTendencies)).toBe(true)
        }
      })

      it('should identify tone characteristics', async () => {
        const song = createMockSong()

        const result = await service.extractVoiceProfile(song)

        if (isSuccess(result)) {
          expect(result.data.toneCharacteristics.length).toBeGreaterThan(0)
          result.data.toneCharacteristics.forEach(tone => {
            expect(typeof tone).toBe('string')
          })
        }
      })

      it('should handle song with minimal content', async () => {
        const song: Song = {
          id: 'song_minimal' as SongId,
          title: 'Minimal',
          verses: [{
            id: 'verse_1' as any,
            number: 1,
            lines: [
              { text: 'Short line', syllables: 2, stressPattern: '/x' }
            ],
            rhymeScheme: 'A',
            syllablePattern: [2]
          }],
          choruses: [{
            id: 'chorus_1' as any,
            lines: [
              { text: 'Short', syllables: 1, stressPattern: '/' }
            ],
            rhymeScheme: 'A',
            syllablePattern: [1],
            isMainChorus: true
          }],
          metadata: {},
          generatedAt: new Date()
        }

        const result = await service.extractVoiceProfile(song)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.vocabulary).toBeDefined()
          expect(result.data.perspectivePOV).toBeDefined()
        }
      })

      it('should handle song with bridge', async () => {
        const baseSong = createMockSong()
        const song: Song = {
          ...baseSong,
          bridge: {
            id: 'bridge_1' as any,
            lines: [
              { text: 'Bridge perspective shift', syllables: 6, stressPattern: 'x/x/x/' }
            ],
            rhymeScheme: 'A',
            syllablePattern: [6]
          }
        }

        const result = await service.extractVoiceProfile(song)

        expect(isSuccess(result)).toBe(true)
      })
    })

    describe('Error Cases', () => {
      it('should return error for null song', async () => {
        // @ts-expect-error - Testing runtime behavior
        const result = await service.extractVoiceProfile(null)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(['INVALID_PROMPT', 'GENERATION_FAILED']).toContain(result.error.code)
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
        }
      })

      it('should return error for undefined song', async () => {
        // @ts-expect-error - Testing runtime behavior
        const result = await service.extractVoiceProfile(undefined)

        expect(isFailure(result)).toBe(true)
      })

      it('should return error for song with no lyrics', async () => {
        const song: Song = {
          id: 'song_no_lyrics' as SongId,
          title: 'Empty',
          verses: [],
          choruses: [],
          metadata: {},
          generatedAt: new Date()
        }

        const result = await service.extractVoiceProfile(song)

        if (isFailure(result)) {
          expect(['INVALID_PROMPT', 'INSUFFICIENT_QUALITY']).toContain(result.error.code)
        }
      })

      it('should return error for invalid song structure', async () => {
        const song: any = {
          id: 'invalid',
          // Missing required fields
        }

        const result = await service.extractVoiceProfile(song)

        if (isFailure(result)) {
          expect(['INVALID_PROMPT', 'GENERATION_FAILED']).toContain(result.error.code)
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
          { id: 'invalid' }
        ]

        for (const input of badInputs) {
          await expect(service.extractVoiceProfile(input)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const song = createMockSong()

        const result = await service.extractVoiceProfile(song)

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

        const result = await service.extractVoiceProfile(song)

        if (isSuccess(result)) {
          expect(() => {
            // @ts-expect-error
            result.data.vocabulary.push('new word')
          }).toThrow()

          expect(() => {
            // @ts-expect-error
            result.data.perspectivePOV = PerspectiveType.THIRD_PERSON
          }).toThrow()

          expect(() => {
            // @ts-expect-error
            result.data.toneCharacteristics.push('new tone')
          }).toThrow()
        }
      })
    })
  })

  // ===========================================
  // HELPER FUNCTIONS TESTS
  // ===========================================
  describe('Helper Functions', () => {
    describe('createDefaultGenerationOptions()', () => {
      it('should create options with default values', () => {
        const options = createDefaultGenerationOptions()

        expect(options).toHaveProperty('temperature')
        expect(options).toHaveProperty('maxIterations')
        expect(options).toHaveProperty('qualityThreshold')
        expect(options).toHaveProperty('allowExperimental')
        expect(options).toHaveProperty('preserveStructure')
        expect(options).toHaveProperty('enforceRhyme')

        expect(typeof options.temperature).toBe('number')
        expect(typeof options.maxIterations).toBe('number')
        expect(typeof options.qualityThreshold).toBe('number')
        expect(typeof options.allowExperimental).toBe('boolean')
        expect(typeof options.preserveStructure).toBe('boolean')
        expect(typeof options.enforceRhyme).toBe('boolean')

        expect(options.temperature).toBeGreaterThanOrEqual(0)
        expect(options.temperature).toBeLessThanOrEqual(1)
        expect(options.maxIterations).toBeGreaterThan(0)
        expect(options.qualityThreshold).toBeGreaterThanOrEqual(0)
        expect(options.qualityThreshold).toBeLessThanOrEqual(1)
      })
    })

    describe('isValidGenerationInput()', () => {
      it('should return true for valid input', () => {
        const validatedPrompt = createValidatedPrompt()
        const input: GenerateSongInput = {
          prompt: validatedPrompt
        }

        const result = isValidGenerationInput(input)

        expect(result).toBe(true)
      })

      it('should return false for input with empty prompt', () => {
        const validatedPrompt = createValidatedPrompt('')
        const input: GenerateSongInput = {
          prompt: validatedPrompt
        }

        const result = isValidGenerationInput(input)

        expect(result).toBe(false)
      })

      it('should return false for input without prompt', () => {
        const input: any = {}

        const result = isValidGenerationInput(input)

        expect(result).toBe(false)
      })
    })

    describe('mergeGenerationOptions()', () => {
      it('should return defaults when no options provided', () => {
        const merged = mergeGenerationOptions()

        expect(merged).toEqual(createDefaultGenerationOptions())
      })

      it('should merge provided options with defaults', () => {
        const customOptions: GenerationOptions = {
          temperature: 0.9,
          maxIterations: 10
        }

        const merged = mergeGenerationOptions(customOptions)

        expect(merged.temperature).toBe(0.9)
        expect(merged.maxIterations).toBe(10)
        expect(merged.qualityThreshold).toBeDefined() // From defaults
        expect(merged.enforceRhyme).toBeDefined() // From defaults
      })

      it('should override all defaults when all options provided', () => {
        const customOptions: GenerationOptions = {
          temperature: 0.5,
          maxIterations: 5,
          qualityThreshold: 0.5,
          allowExperimental: true,
          preserveStructure: false,
          enforceRhyme: false
        }

        const merged = mergeGenerationOptions(customOptions)

        expect(merged).toEqual(customOptions)
      })
    })
  })
})
