/**
 * @fileoverview Contract Tests for Suno Formatter Service
 * @purpose Ensure any implementation of ISunoFormatterService matches the contract exactly
 *
 * TEST-DRIVEN DEVELOPMENT APPROACH:
 * These tests are written BEFORE the mock implementation.
 * The mock implementation should be written to make these tests pass.
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import type {
  ISunoFormatterService,
  SunoFormatResult,
  SunoValidationResult,
  FormatOptions,
  StylePreferences,
  TagSuggestion,
  EnhancementSuggestion,
  TrimResult
} from '../../src/contracts/SunoFormatter'
import {
  SunoVersion,
  CHARACTER_LIMITS,
  getCharacterLimit,
  supportsAdvancedTags,
  HarmonyPreference,
  EffectTag,
  DynamicTag,
  TrimStrategy,
  SunoFormatterErrorCode
} from '../../src/contracts/SunoFormatter'
import { isSuccess, isFailure } from '../../src/contracts/types/common'
import { MockSunoFormatterService } from '../../src/services/mock/MockSunoFormatterService'
import type { Song } from '../../src/contracts/types/song'
import { createSongId, createVerseId, createChorusId, TempoType, VocalStyle } from '../../src/contracts/types/song'

/**
 * NOTE: This test suite is designed to work with ANY implementation of ISunoFormatterService.
 * During Phase 3 (BUILD), import MockSunoFormatterService.
 * During Phase 5 (IMPLEMENT), import RealSunoFormatterService.
 * The tests should pass for both implementations.
 */
describe('ISunoFormatterService Contract Tests', () => {
  let service: ISunoFormatterService

  // Test data: minimal valid song
  const createTestSong = (): Song => ({
    id: createSongId('test-song-1'),
    title: 'Test Song',
    verses: [
      {
        id: createVerseId('v1'),
        number: 1,
        lines: [
          { text: 'Walking down the street', syllables: 5, stressPattern: 'x/x/x/', rhymeSound: 'EET' },
          { text: 'Feeling the summer heat', syllables: 6, stressPattern: 'x/x/x/x/', rhymeSound: 'EET' },
          { text: 'My heart skips a beat', syllables: 5, stressPattern: 'x/x/x/', rhymeSound: 'EET' },
          { text: 'Life feels so complete', syllables: 5, stressPattern: 'x/x/x/', rhymeSound: 'EET' }
        ],
        rhymeScheme: 'AAAA',
        syllablePattern: [5, 6, 5, 5]
      }
    ],
    choruses: [
      {
        id: createChorusId('c1'),
        lines: [
          { text: 'This is our song', syllables: 4, stressPattern: 'x/x/', rhymeSound: 'ONG' },
          { text: 'All summer long', syllables: 4, stressPattern: 'x/x/', rhymeSound: 'ONG' },
          { text: 'We dance and sing', syllables: 4, stressPattern: 'x/x/', rhymeSound: 'ING' },
          { text: 'To everything', syllables: 4, stressPattern: 'x/x/', rhymeSound: 'ING' }
        ],
        rhymeScheme: 'AABB',
        syllablePattern: [4, 4, 4, 4],
        isMainChorus: true
      }
    ],
    metadata: {
      genre: 'pop',
      mood: 'upbeat',
      theme: 'summer',
      version: 1
    },
    generatedAt: new Date()
  })

  // Test data: song with all sections
  const createFullSong = (): Song => ({
    id: createSongId('test-song-2'),
    title: 'Complete Song',
    intro: {
      id: createSongId('intro-1') as any,
      type: 'intro' as any,
      lines: [
        { text: 'In the beginning', syllables: 5, stressPattern: 'x/x/x/' }
      ]
    },
    verses: [
      {
        id: createVerseId('v1'),
        number: 1,
        lines: [
          { text: 'First verse line one', syllables: 5, stressPattern: 'x/x/x/', rhymeSound: 'ONE' },
          { text: 'First verse line two', syllables: 5, stressPattern: 'x/x/x/', rhymeSound: 'TWO' }
        ],
        rhymeScheme: 'AB',
        syllablePattern: [5, 5]
      },
      {
        id: createVerseId('v2'),
        number: 2,
        lines: [
          { text: 'Second verse line one', syllables: 5, stressPattern: 'x/x/x/', rhymeSound: 'ONE' },
          { text: 'Second verse line two', syllables: 5, stressPattern: 'x/x/x/', rhymeSound: 'TWO' }
        ],
        rhymeScheme: 'AB',
        syllablePattern: [5, 5]
      }
    ],
    choruses: [
      {
        id: createChorusId('c1'),
        lines: [
          { text: 'Chorus line one', syllables: 4, stressPattern: 'x/x/', rhymeSound: 'ONE' },
          { text: 'Chorus line two', syllables: 4, stressPattern: 'x/x/', rhymeSound: 'TWO' }
        ],
        rhymeScheme: 'AB',
        syllablePattern: [4, 4],
        isMainChorus: true
      }
    ],
    bridge: {
      id: createSongId('bridge-1') as any,
      lines: [
        { text: 'Bridge brings change', syllables: 4, stressPattern: 'x/x/', rhymeSound: 'ANGE' },
        { text: 'Nothing stays the same', syllables: 5, stressPattern: 'x/x/x/', rhymeSound: 'AME' }
      ],
      rhymeScheme: 'AB',
      syllablePattern: [4, 5]
    },
    outro: {
      id: createSongId('outro-1') as any,
      type: 'outro' as any,
      lines: [
        { text: 'And it fades away', syllables: 5, stressPattern: 'x/x/x/' }
      ]
    },
    metadata: {
      genre: 'rock',
      mood: 'energetic',
      theme: 'change'
    },
    generatedAt: new Date()
  })

  beforeEach(() => {
    service = new MockSunoFormatterService()
  })

  describe('formatSong() method', () => {
    describe('Success Cases - Basic Formatting', () => {
      it('should format a minimal song for v5.0 with tags', async () => {
        const song = createTestSong()
        const options: FormatOptions = {
          version: SunoVersion.V5_0,
          includeTags: true
        }

        const result = await service.formatSong(song, options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const data: SunoFormatResult = result.data

          // Verify all required fields exist
          expect(data).toHaveProperty('formattedText')
          expect(data).toHaveProperty('characterCount')
          expect(data).toHaveProperty('version')
          expect(data).toHaveProperty('appliedTags')
          expect(data).toHaveProperty('validation')
          expect(data).toHaveProperty('suggestions')

          // Verify formatted text contains expected content
          expect(data.formattedText).toContain('[Verse 1]')
          expect(data.formattedText).toContain('[Chorus]')
          expect(data.formattedText).toContain('Walking down the street')
          expect(data.formattedText).toContain('This is our song')

          // Verify character count
          expect(data.characterCount).toBe(data.formattedText.length)
          expect(data.characterCount).toBeGreaterThan(0)

          // Verify version
          expect(data.version).toBe(SunoVersion.V5_0)

          // Verify applied tags
          expect(Array.isArray(data.appliedTags)).toBe(true)
          expect(data.appliedTags.length).toBeGreaterThan(0)

          // Verify validation result
          expect(data.validation.valid).toBe(true)
          expect(data.validation.withinLimit).toBe(true)
          expect(data.validation.characterLimit).toBe(CHARACTER_LIMITS.v5_0)
          expect(Array.isArray(data.validation.errors)).toBe(true)
          expect(Array.isArray(data.validation.warnings)).toBe(true)

          // Verify suggestions array
          expect(Array.isArray(data.suggestions)).toBe(true)
        }
      })

      it('should format a minimal song for v4.0 with tags', async () => {
        const song = createTestSong()
        const options: FormatOptions = {
          version: SunoVersion.V4_0,
          includeTags: true
        }

        const result = await service.formatSong(song, options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.version).toBe(SunoVersion.V4_0)
          expect(result.data.formattedText).toContain('[Verse 1]')
          expect(result.data.validation.characterLimit).toBe(CHARACTER_LIMITS.v4_0)
        }
      })

      it('should format a minimal song for v4.5 with tags', async () => {
        const song = createTestSong()
        const options: FormatOptions = {
          version: SunoVersion.V4_5,
          includeTags: true
        }

        const result = await service.formatSong(song, options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.version).toBe(SunoVersion.V4_5)
          expect(result.data.formattedText).toContain('[Verse 1]')
          expect(result.data.validation.characterLimit).toBe(CHARACTER_LIMITS.v4_5)
        }
      })

      it('should format song without tags when includeTags is false', async () => {
        const song = createTestSong()
        const options: FormatOptions = {
          version: SunoVersion.V5_0,
          includeTags: false
        }

        const result = await service.formatSong(song, options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // Should still have section tags but not style tags
          expect(result.data.formattedText).toContain('[Verse 1]')
          expect(result.data.appliedTags.length).toBeLessThan(5) // Minimal tags
        }
      })

      it('should format full song with all sections', async () => {
        const song = createFullSong()
        const options: FormatOptions = {
          version: SunoVersion.V5_0,
          includeTags: true
        }

        const result = await service.formatSong(song, options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.formattedText).toContain('[Intro]')
          expect(result.data.formattedText).toContain('[Verse 1]')
          expect(result.data.formattedText).toContain('[Verse 2]')
          expect(result.data.formattedText).toContain('[Chorus]')
          expect(result.data.formattedText).toContain('[Bridge]')
          expect(result.data.formattedText).toContain('[Outro]')
        }
      })

      it('should apply style preferences as meta-tags', async () => {
        const song = createTestSong()
        const style: StylePreferences = {
          genre: 'rock',
          tempo: TempoType.FAST,
          mood: 'energetic',
          vocalStyle: VocalStyle.POWERFUL
        }
        const options: FormatOptions = {
          version: SunoVersion.V5_0,
          includeTags: true,
          style
        }

        const result = await service.formatSong(song, options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // Should contain style tags
          expect(result.data.appliedTags.some(tag => tag.includes('genre'))).toBe(true)
          expect(result.data.appliedTags.some(tag => tag.includes('tempo'))).toBe(true)
        }
      })

      it('should apply harmony preferences', async () => {
        const song = createTestSong()
        const style: StylePreferences = {
          harmony: HarmonyPreference.THREE_PART
        }
        const options: FormatOptions = {
          version: SunoVersion.V5_0,
          includeTags: true,
          style
        }

        const result = await service.formatSong(song, options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.appliedTags.some(tag => tag.includes('harmony') || tag.includes('3-part'))).toBe(true)
        }
      })

      it('should apply effects tags', async () => {
        const song = createTestSong()
        const style: StylePreferences = {
          effects: [EffectTag.AUTOTUNE, EffectTag.REVERB]
        }
        const options: FormatOptions = {
          version: SunoVersion.V5_0,
          includeTags: true,
          style
        }

        const result = await service.formatSong(song, options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.appliedTags.length).toBeGreaterThan(0)
        }
      })

      it('should apply dynamic tags for v5.0', async () => {
        const song = createTestSong()
        const style: StylePreferences = {
          dynamics: [DynamicTag.CRESCENDO, DynamicTag.FADE_OUT]
        }
        const options: FormatOptions = {
          version: SunoVersion.V5_0,
          includeTags: true,
          style
        }

        const result = await service.formatSong(song, options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // v5.0 should support dynamics
          expect(result.data.appliedTags.length).toBeGreaterThan(0)
        }
      })

      it('should include custom tags when provided', async () => {
        const song = createTestSong()
        const options: FormatOptions = {
          version: SunoVersion.V5_0,
          includeTags: true,
          customTags: ['[custom-tag]', '[another-tag]']
        }

        const result = await service.formatSong(song, options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.formattedText).toContain('[custom-tag]')
          expect(result.data.formattedText).toContain('[another-tag]')
        }
      })

      it('should include metadata when includeMetadata is true', async () => {
        const song = createTestSong()
        const options: FormatOptions = {
          version: SunoVersion.V5_0,
          includeTags: true,
          includeMetadata: true
        }

        const result = await service.formatSong(song, options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // Metadata might include title, genre, etc.
          expect(result.data.formattedText.length).toBeGreaterThan(0)
        }
      })
    })

    describe('Success Cases - Character Limits', () => {
      it('should validate character count is within 3000 limit for v5.0', async () => {
        const song = createTestSong()
        const options: FormatOptions = {
          version: SunoVersion.V5_0,
          includeTags: true
        }

        const result = await service.formatSong(song, options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.characterCount).toBeLessThanOrEqual(3000)
          expect(result.data.validation.withinLimit).toBe(true)
        }
      })

      it('should auto-trim when trimToFit is true and exceeds limit', async () => {
        // Create a song with lots of verses to exceed limit
        const largeSong: Song = {
          ...createTestSong(),
          verses: Array(15).fill(null).map((_, i) => ({
            id: createVerseId(`v${i + 1}`),
            number: i + 1,
            lines: [
              { text: 'This is a line that has many words to increase character count', syllables: 12, stressPattern: 'x/x/x/x/x/x/', rhymeSound: 'COUNT' },
              { text: 'Another line with lots of words to make it longer and exceed', syllables: 12, stressPattern: 'x/x/x/x/x/x/', rhymeSound: 'CEED' },
              { text: 'Yet another line with even more words to push the limit further', syllables: 12, stressPattern: 'x/x/x/x/x/x/', rhymeSound: 'THER' },
              { text: 'And one more line to really make this verse quite long indeed', syllables: 12, stressPattern: 'x/x/x/x/x/x/', rhymeSound: 'EED' }
            ],
            rhymeScheme: 'ABCD',
            syllablePattern: [12, 12, 12, 12]
          }))
        }

        const options: FormatOptions = {
          version: SunoVersion.V5_0,
          includeTags: true,
          trimToFit: true
        }

        const result = await service.formatSong(largeSong, options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.characterCount).toBeLessThanOrEqual(3000)
          expect(result.data.validation.withinLimit).toBe(true)
        }
      })

      it('should warn when character limit is exceeded without trimToFit', async () => {
        const largeSong: Song = {
          ...createTestSong(),
          verses: Array(20).fill(null).map((_, i) => ({
            id: createVerseId(`v${i + 1}`),
            number: i + 1,
            lines: Array(8).fill(null).map((_, j) => ({
              text: 'This is a very long line with many words to increase character count significantly',
              syllables: 15,
              stressPattern: 'x/x/x/x/x/x/x/x/',
              rhymeSound: 'LY'
            })),
            rhymeScheme: 'AAAAAAAA',
            syllablePattern: [15, 15, 15, 15, 15, 15, 15, 15]
          }))
        }

        const options: FormatOptions = {
          version: SunoVersion.V5_0,
          includeTags: true,
          trimToFit: false
        }

        const result = await service.formatSong(largeSong, options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.validation.withinLimit).toBe(false)
          expect(result.data.validation.warnings.length).toBeGreaterThan(0)
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for null song', async () => {
        const options: FormatOptions = {
          version: SunoVersion.V5_0,
          includeTags: true
        }

        const result = await service.formatSong(null as any, options)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(SunoFormatterErrorCode.INVALID_SONG)
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
        }
      })

      it('should return error for song with no verses or choruses', async () => {
        const emptySong: Song = {
          id: createSongId('empty'),
          title: 'Empty',
          verses: [],
          choruses: [],
          metadata: {},
          generatedAt: new Date()
        }

        const options: FormatOptions = {
          version: SunoVersion.V5_0,
          includeTags: true
        }

        const result = await service.formatSong(emptySong, options)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(SunoFormatterErrorCode.INVALID_SONG)
        }
      })

      it('should return error when exceeds max sections', async () => {
        const tooManySections: Song = {
          ...createTestSong(),
          verses: Array(25).fill(null).map((_, i) => ({
            id: createVerseId(`v${i + 1}`),
            number: i + 1,
            lines: [{ text: 'Line', syllables: 1, stressPattern: 'x/' }],
            rhymeScheme: 'A',
            syllablePattern: [1]
          }))
        }

        const options: FormatOptions = {
          version: SunoVersion.V5_0,
          includeTags: true
        }

        const result = await service.formatSong(tooManySections, options)

        // Might succeed with warning or fail with error
        if (isSuccess(result)) {
          expect(result.data.validation.warnings.length).toBeGreaterThan(0)
        } else {
          expect(result.error.code).toBe(SunoFormatterErrorCode.TOO_MANY_SECTIONS)
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs = [
          [null, { version: SunoVersion.V5_0, includeTags: true }],
          [undefined, { version: SunoVersion.V5_0, includeTags: true }],
          [createTestSong(), null],
          [createTestSong(), undefined]
        ]

        for (const [song, options] of badInputs) {
          await expect(service.formatSong(song as any, options as any)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const song = createTestSong()
        const options: FormatOptions = {
          version: SunoVersion.V5_0,
          includeTags: true
        }

        const result = await service.formatSong(song, options)

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
    })
  })

  describe('validateFormat() method', () => {
    it('should validate properly formatted text for v5.0', async () => {
      const formattedText = `[Verse 1]
Walking down the street
Feeling the summer heat

[Chorus]
This is our song
All summer long`

      const result = await service.validateFormat(formattedText, SunoVersion.V5_0)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        const data: SunoValidationResult = result.data
        expect(data.valid).toBe(true)
        expect(data.withinLimit).toBe(true)
        expect(data.characterLimit).toBe(3000)
        expect(data.errors.length).toBe(0)
      }
    })

    it('should validate properly formatted text for v4.0', async () => {
      const formattedText = `[Verse 1]
Test line`

      const result = await service.validateFormat(formattedText, SunoVersion.V4_0)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data.valid).toBe(true)
        expect(result.data.characterLimit).toBe(3000)
      }
    })

    it('should invalidate text exceeding character limit', async () => {
      const longText = 'a'.repeat(3001)

      const result = await service.validateFormat(longText, SunoVersion.V5_0)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data.valid).toBe(false)
        expect(result.data.withinLimit).toBe(false)
        expect(result.data.errors.length).toBeGreaterThan(0)
      }
    })

    it('should warn about missing section tags', async () => {
      const noTags = 'Just plain text without any section tags'

      const result = await service.validateFormat(noTags, SunoVersion.V5_0)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data.warnings.length).toBeGreaterThan(0)
      }
    })

    it('should validate empty string', async () => {
      const result = await service.validateFormat('', SunoVersion.V5_0)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data.valid).toBe(false)
        expect(result.data.errors.length).toBeGreaterThan(0)
      }
    })

    it('should handle null/undefined gracefully', async () => {
      await expect(service.validateFormat(null as any, SunoVersion.V5_0)).resolves.toBeDefined()
      await expect(service.validateFormat(undefined as any, SunoVersion.V5_0)).resolves.toBeDefined()
    })
  })

  describe('suggestTags() method', () => {
    it('should suggest tags for a complete song', async () => {
      const song = createFullSong()

      const result = await service.suggestTags(song)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true)
        expect(result.data.length).toBeGreaterThan(0)

        if (result.data.length > 0) {
          const firstSuggestion = result.data[0]
          expect(firstSuggestion).toBeDefined()
          expect(firstSuggestion).toHaveProperty('section')
          expect(firstSuggestion).toHaveProperty('tagType')
          expect(firstSuggestion).toHaveProperty('tag')
          expect(firstSuggestion).toHaveProperty('reason')
          expect(firstSuggestion).toHaveProperty('confidence')
          expect(firstSuggestion!.confidence).toBeGreaterThanOrEqual(0)
          expect(firstSuggestion!.confidence).toBeLessThanOrEqual(1)
        }
      }
    })

    it('should suggest tags with style preferences', async () => {
      const song = createTestSong()
      const style: StylePreferences = {
        genre: 'rock',
        tempo: TempoType.FAST,
        mood: 'energetic'
      }

      const result = await service.suggestTags(song, style)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data.length).toBeGreaterThan(0)
        // Should suggest genre, tempo, mood tags
        const hasStyleSuggestion = result.data.some(s =>
          s.tag.includes('rock') || s.tag.includes('fast') || s.tag.includes('energetic')
        )
        expect(hasStyleSuggestion).toBe(true)
      }
    })

    it('should suggest harmony tags when appropriate', async () => {
      const song = createTestSong()
      const style: StylePreferences = {
        harmony: HarmonyPreference.GOSPEL
      }

      const result = await service.suggestTags(song, style)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data.length).toBeGreaterThan(0)
      }
    })

    it('should return empty array for minimal song without style', async () => {
      const minimalSong = createTestSong()

      const result = await service.suggestTags(minimalSong)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true)
        // May or may not have suggestions based on song structure
      }
    })

    it('should handle null song gracefully', async () => {
      const result = await service.suggestTags(null as any)

      expect(isFailure(result)).toBe(true)
      if (isFailure(result)) {
        expect(result.error.code).toBe(SunoFormatterErrorCode.INVALID_SONG)
      }
    })
  })

  describe('suggestEnhancements() method', () => {
    it('should suggest intro for song without intro', async () => {
      const song = createTestSong() // No intro

      const result = await service.suggestEnhancements(song)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true)
        const hasIntroSuggestion = result.data.some(s => s.type === 'add_intro')
        expect(hasIntroSuggestion).toBe(true)
      }
    })

    it('should suggest outro for song without outro', async () => {
      const song = createTestSong() // No outro

      const result = await service.suggestEnhancements(song)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        const hasOutroSuggestion = result.data.some(s => s.type === 'add_outro')
        expect(hasOutroSuggestion).toBe(true)
      }
    })

    it('should suggest bridge for song without bridge', async () => {
      const song = createTestSong() // No bridge

      const result = await service.suggestEnhancements(song)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        const hasBridgeSuggestion = result.data.some(s => s.type === 'add_bridge')
        expect(hasBridgeSuggestion).toBe(true)
      }
    })

    it('should return minimal suggestions for complete song', async () => {
      const song = createFullSong() // Has all sections

      const result = await service.suggestEnhancements(song)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true)
        // Should have fewer suggestions since song is complete
        expect(result.data.length).toBeLessThan(3)
      }
    })

    it('should include example in each suggestion', async () => {
      const song = createTestSong()

      const result = await service.suggestEnhancements(song)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        result.data.forEach((suggestion: EnhancementSuggestion) => {
          expect(suggestion).toHaveProperty('type')
          expect(suggestion).toHaveProperty('section')
          expect(suggestion).toHaveProperty('suggestion')
          expect(suggestion).toHaveProperty('example')
          expect(suggestion).toHaveProperty('impact')
          expect(suggestion.example.length).toBeGreaterThan(0)
        })
      }
    })

    it('should handle null song gracefully', async () => {
      const result = await service.suggestEnhancements(null as any)

      expect(isFailure(result)).toBe(true)
    })
  })

  describe('convertVersion() method', () => {
    it('should convert from v4.0 to v5.0', async () => {
      const v4Text = `[Verse 1]
Test line
[Chorus]
Test chorus`

      const result = await service.convertVersion(v4Text, SunoVersion.V4_0, SunoVersion.V5_0)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data).toContain('[Verse 1]')
        expect(result.data).toContain('[Chorus]')
      }
    })

    it('should convert from v5.0 to v4.0 (remove advanced tags)', async () => {
      const v5Text = `[Verse 1]
Test line
[dynamic: crescendo]
[Chorus]
Test chorus`

      const result = await service.convertVersion(v5Text, SunoVersion.V5_0, SunoVersion.V4_0)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        // Should remove v5.0-only tags
        expect(result.data).toContain('[Verse 1]')
        expect(result.data).not.toContain('[dynamic: crescendo]')
      }
    })

    it('should convert from v4.0 to v4.5', async () => {
      const v4Text = `[Verse 1]
Test`

      const result = await service.convertVersion(v4Text, SunoVersion.V4_0, SunoVersion.V4_5)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data).toContain('Test')
      }
    })

    it('should handle same version conversion (no-op)', async () => {
      const text = `[Verse 1]
Test`

      const result = await service.convertVersion(text, SunoVersion.V5_0, SunoVersion.V5_0)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data).toBe(text)
      }
    })

    it('should handle empty text', async () => {
      const result = await service.convertVersion('', SunoVersion.V4_0, SunoVersion.V5_0)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data).toBe('')
      }
    })

    it('should handle null/undefined gracefully', async () => {
      await expect(
        service.convertVersion(null as any, SunoVersion.V4_0, SunoVersion.V5_0)
      ).resolves.toBeDefined()
    })
  })

  describe('trimToFit() method', () => {
    it('should trim by removing metadata', async () => {
      const song = createTestSong()
      const targetLimit = 100

      const result = await service.trimToFit(song, targetLimit, TrimStrategy.REMOVE_METADATA)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data).toHaveProperty('song')
        expect(result.data).toHaveProperty('trimResult')

        const trimResult: TrimResult = result.data.trimResult
        expect(trimResult.originalLength).toBeGreaterThan(trimResult.trimmedLength)
        expect(trimResult.strategy).toBe(TrimStrategy.REMOVE_METADATA)
        expect(Array.isArray(trimResult.removedContent)).toBe(true)
      }
    })

    it('should trim by shortening lines', async () => {
      const song = createTestSong()
      const targetLimit = 100

      const result = await service.trimToFit(song, targetLimit, TrimStrategy.SHORTEN_LINES)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data.trimResult.strategy).toBe(TrimStrategy.SHORTEN_LINES)
        expect(result.data.trimResult.trimmedLength).toBeLessThanOrEqual(targetLimit)
      }
    })

    it('should trim by removing sections', async () => {
      const song = createFullSong()
      const targetLimit = 100

      const result = await service.trimToFit(song, targetLimit, TrimStrategy.REMOVE_SECTION)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data.trimResult.strategy).toBe(TrimStrategy.REMOVE_SECTION)
        expect(result.data.trimResult.removedContent.length).toBeGreaterThan(0)
      }
    })

    it('should trim by simplifying tags', async () => {
      const song = createTestSong()
      const targetLimit = 150

      const result = await service.trimToFit(song, targetLimit, TrimStrategy.SIMPLIFY_TAGS)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data.trimResult.strategy).toBe(TrimStrategy.SIMPLIFY_TAGS)
      }
    })

    it('should return original if already within limit', async () => {
      const song = createTestSong()
      const targetLimit = 10000 // Very high

      const result = await service.trimToFit(song, targetLimit, TrimStrategy.REMOVE_METADATA)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data.trimResult.originalLength).toBe(result.data.trimResult.trimmedLength)
        expect(result.data.trimResult.removedContent.length).toBe(0)
      }
    })

    it('should handle null song gracefully', async () => {
      const result = await service.trimToFit(null as any, 100, TrimStrategy.REMOVE_METADATA)

      expect(isFailure(result)).toBe(true)
    })
  })

  describe('applyMetaTags() method', () => {
    it('should apply section tag to verse', async () => {
      const text = 'This is a verse line'
      const tags = ['[Verse 1]']

      const result = await service.applyMetaTags(text, 'verse', tags)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data).toContain('[Verse 1]')
        expect(result.data).toContain('This is a verse line')
      }
    })

    it('should apply multiple tags to chorus', async () => {
      const text = 'This is the chorus'
      const tags = ['[Chorus]', '[tempo: fast]']

      const result = await service.applyMetaTags(text, 'chorus', tags)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data).toContain('[Chorus]')
        expect(result.data).toContain('[tempo: fast]')
        expect(result.data).toContain('This is the chorus')
      }
    })

    it('should apply tags to bridge', async () => {
      const text = 'Bridge section'
      const tags = ['[Bridge]', '[key-change: up-step]']

      const result = await service.applyMetaTags(text, 'bridge', tags)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data).toContain('[Bridge]')
        expect(result.data).toContain('Bridge section')
      }
    })

    it('should handle empty tags array', async () => {
      const text = 'Some text'
      const tags: string[] = []

      const result = await service.applyMetaTags(text, 'verse', tags)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data).toContain('Some text')
      }
    })

    it('should handle empty text', async () => {
      const result = await service.applyMetaTags('', 'verse', ['[Verse 1]'])

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data).toContain('[Verse 1]')
      }
    })

    it('should handle null/undefined gracefully', async () => {
      await expect(
        service.applyMetaTags(null as any, 'verse', ['[Verse 1]'])
      ).resolves.toBeDefined()
    })
  })

  describe('Helper Functions', () => {
    it('getCharacterLimit should return correct limits', () => {
      expect(getCharacterLimit(SunoVersion.V4_0)).toBe(3000)
      expect(getCharacterLimit(SunoVersion.V4_5)).toBe(3000)
      expect(getCharacterLimit(SunoVersion.V5_0)).toBe(3000)
    })

    it('supportsAdvancedTags should only return true for v5.0', () => {
      expect(supportsAdvancedTags(SunoVersion.V4_0)).toBe(false)
      expect(supportsAdvancedTags(SunoVersion.V4_5)).toBe(false)
      expect(supportsAdvancedTags(SunoVersion.V5_0)).toBe(true)
    })
  })
})
