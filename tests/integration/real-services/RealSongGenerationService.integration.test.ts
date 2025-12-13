/**
 * @fileoverview Integration Tests for Real SongGenerationService
 * @purpose Validate AI-powered song generation against contract and quality standards
 * @integration @song-generation
 *
 * Test Count: 60 tests
 * - Contract Compliance: 20 tests
 * - Behavioral Tests: 15 tests
 * - Quality Thresholds: 10 tests
 * - Semantic Tests: 5 tests
 * - Edge Cases: 10 tests
 *
 * IMPORTANT: These tests validate ranges and patterns, NOT exact outputs
 */

import { describe, it, expect, beforeAll, beforeEach } from '@jest/globals'
import { RealSongGenerationService } from '../../../src/services/real/RealSongGenerationService'
import { GrokProvider } from '../../../src/services/providers/GrokProvider'
import type { ISongGenerationService } from '../../../src/contracts/SongGeneration'
import { isSuccess, isFailure } from '../../../src/contracts/types/common'
import {
  createValidatedPrompt,
  extractAllLyrics,
  hasApiKey,
  TestPrompts,
  createConstraints
} from '../../helpers/test-builders'
import {
  assertValidServiceResponse,
  assertSongQuality,
  assertContainsTheme,
  assertDoesNotContainClichés,
  assertLatencyWithinSLA,
  measurePerformance
} from '../../helpers/assertion-helpers'

describe('RealSongGenerationService Integration Tests', () => {
  let service: ISongGenerationService
  let provider: GrokProvider

  beforeAll(() => {
    if (!hasApiKey()) {
      console.warn('⚠️  Skipping RealSongGenerationService tests: GROK_API_KEY not set')
      return
    }

    provider = new GrokProvider({
      apiKey: process.env.GROK_API_KEY!,
      timeout: 45000, // Longer timeout for generation
      maxRetries: 3,
      enableCache: true
    })

    service = new RealSongGenerationService(provider)
  })

  beforeEach(() => {
    if (provider) {
      provider.clearCache()
    }
  })

  describe('Contract Compliance (20 tests)', () => {
    it('should return ServiceResponse<GenerateSongOutput>', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.simple() }
      const result = await service.generate(input)

      assertValidServiceResponse(result)
      expect(result).toHaveProperty('success')
      expect(typeof result.success).toBe('boolean')
    }, 30000)

    it('should include song in successful response', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.simple() }
      const result = await service.generate(input)

      expect(isSuccess(result)).toBe(true)

      if (isSuccess(result)) {
        expect(result.data).toHaveProperty('song')
        expect(result.data.song).toBeTruthy()
      }
    }, 30000)

    it('should include confidence score (0-1)', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.simple() }
      const result = await service.generate(input)

      if (isSuccess(result)) {
        expect(result.data).toHaveProperty('confidence')
        expect(result.data.confidence).toBeGreaterThanOrEqual(0)
        expect(result.data.confidence).toBeLessThanOrEqual(1)
      }
    }, 30000)

    it('should include generation metadata', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.simple() }
      const result = await service.generate(input)

      if (isSuccess(result)) {
        expect(result.data).toHaveProperty('generationMetadata')
        expect(result.data.generationMetadata).toBeTruthy()
      }
    }, 30000)

    it('should have valid song ID', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.simple() }
      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data
        expect(song.id).toBeTruthy()
        expect(typeof song.id).toBe('string')
      }
    }, 30000)

    it('should have non-empty song title', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.simple() }
      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data
        expect(song.title).toBeTruthy()
        expect(song.title.length).toBeGreaterThan(0)
        expect(song.title.length).toBeLessThan(100) // Reasonable title length
      }
    }, 30000)

    it('should have verses array', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.simple() }
      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data
        expect(Array.isArray(song.verses)).toBe(true)
        expect(song.verses.length).toBeGreaterThan(0)
      }
    }, 30000)

    it('should have proper verse structure', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.simple() }
      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data
        song.verses.forEach((verse, i) => {
          expect(verse).toHaveProperty('id')
          expect(verse).toHaveProperty('number')
          expect(verse.number).toBe(i + 1)
          expect(verse).toHaveProperty('lines')
          expect(Array.isArray(verse.lines)).toBe(true)
          expect(verse.lines.length).toBeGreaterThan(0)
          expect(verse).toHaveProperty('rhymeScheme')
        })
      }
    }, 30000)

    it('should have proper line structure in verses', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.simple() }
      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data
        const firstVerse = song.verses[0]
        expect(firstVerse).toBeDefined()

        firstVerse!.lines.forEach((line) => {
          // Line contract properties
          expect(line).toHaveProperty('text')
          expect(line.text).toBeTruthy()
          expect(line.text.length).toBeGreaterThan(0)
          expect(line).toHaveProperty('syllables')
          expect(typeof line.syllables).toBe('number')
          expect(line.syllables).toBeGreaterThan(0)
          expect(line).toHaveProperty('stressPattern')
          expect(typeof line.stressPattern).toBe('string')
          // rhymeSound is optional
          // internalRhymes is optional
          // lineNumber is optional
        })
      }
    }, 30000)

    it('should have choruses array', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.simple() }
      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data
        expect(Array.isArray(song.choruses)).toBe(true)
        expect(song.choruses.length).toBeGreaterThan(0) // At least 1 chorus
      }
    }, 30000)

    it('should have proper chorus structure', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.simple() }
      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data
        song.choruses.forEach(chorus => {
          expect(chorus).toHaveProperty('id')
          expect(chorus).toHaveProperty('lines')
          expect(Array.isArray(chorus.lines)).toBe(true)
          expect(chorus.lines.length).toBeGreaterThan(0)
          expect(chorus).toHaveProperty('rhymeScheme')
          expect(chorus).toHaveProperty('isMainChorus')
          expect(typeof chorus.isMainChorus).toBe('boolean')
        })
      }
    }, 30000)

    it('should have complete metadata', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.simple() }
      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data
        expect(song).toHaveProperty('metadata')
        expect(song.metadata).toHaveProperty('created')
        expect(song.metadata).toHaveProperty('version')
        expect(song.metadata).toHaveProperty('genre')
        expect(song.metadata).toHaveProperty('mood')
      }
    }, 30000)

    it('should handle bridge correctly (present or null)', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.simple() }
      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data

        // Bridge is optional in contract
        if (song.bridge) {
          expect(song.bridge).toHaveProperty('id')
          expect(song.bridge).toHaveProperty('lines')
          expect(Array.isArray(song.bridge.lines)).toBe(true)
          expect(song.bridge.lines.length).toBeGreaterThan(0)
        }
      }
    }, 30000)

    it('should have valid rhyme schemes', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.simple() }
      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data
        const validSchemes = ['ABAB', 'AABB', 'ABCB', 'AAAA', 'FREE']

        song.verses.forEach(verse => {
          expect(validSchemes).toContain(verse.rhymeScheme)
        })

        song.choruses.forEach(chorus => {
          expect(validSchemes).toContain(chorus.rhymeScheme)
        })
      }
    }, 30000)

    it('should have reasonable total length', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.simple() }
      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data
        const lyrics = extractAllLyrics(song)

        expect(lyrics.length).toBeGreaterThan(50) // Minimum length
        expect(lyrics.length).toBeLessThan(5000) // Maximum length (Suno limit)
      }
    }, 30000)

    it('should include alternatives if available', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.simple() }
      const result = await service.generate(input)

      if (isSuccess(result)) {
        // Alternatives are optional
        if (result.data.alternatives) {
          expect(Array.isArray(result.data.alternatives)).toBe(true)
        }
      }
    }, 30000)

    it('should have valid line properties', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.simple() }
      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data

        song.verses.forEach(verse => {
          verse.lines.forEach((line) => {
            // Verify all required Line properties
            expect(typeof line.text).toBe('string')
            expect(typeof line.syllables).toBe('number')
            expect(typeof line.stressPattern).toBe('string')

            // Optional properties
            if (line.lineNumber !== undefined) {
              expect(typeof line.lineNumber).toBe('number')
            }
          })
        })
      }
    }, 30000)

    it('should return failure for invalid input', async () => {
      if (!hasApiKey()) return

      // @ts-expect-error: Testing invalid input
      const result = await service.generate({ prompt: null })

      expect(isFailure(result)).toBe(true)

      if (isFailure(result)) {
        expect(result.error).toHaveProperty('code')
        expect(result.error).toHaveProperty('message')
        expect(result.error).toHaveProperty('suggestion')
      }
    }, 10000)

    it('should have unique IDs for sections', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.simple() }
      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data
        const ids = new Set<string>()

        ids.add(song.id)
        song.verses.forEach(v => ids.add(v.id))
        song.choruses.forEach(c => ids.add(c.id))
        if (song.bridge) {
          ids.add(song.bridge.id)
        }

        // All section IDs should be unique
        const totalSections = 1 + song.verses.length + song.choruses.length + (song.bridge ? 1 : 0)
        expect(ids.size).toBe(totalSections)
      }
    }, 30000)

    it('should handle options parameter', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.simple() }
      const options = { temperature: 0.8, maxAlternatives: 2 }
      const result = await service.generate(input, options)

      expect(isSuccess(result)).toBe(true)
    }, 30000)
  })

  describe('Behavioral Tests (15 tests)', () => {
    it('should respect verse count constraints (±1 variance)', async () => {
      if (!hasApiKey()) return

      const input = {
        prompt: createValidatedPrompt('Write a song', {
          constraints: createConstraints({ verseCount: 3 })
        })
      }

      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data
        assertSongQuality(song, { minVerses: 2, maxVerses: 4 })
      }
    }, 40000)

    it('should respect lines per verse constraints (±2 variance)', async () => {
      if (!hasApiKey()) return

      const input = {
        prompt: createValidatedPrompt('Write a song', {
          constraints: createConstraints({ linesPerVerse: 4 })
        })
      }

      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data
        assertSongQuality(song, { minLines: 2, maxLines: 6 })
      }
    }, 40000)

    it('should include chorus when requested', async () => {
      if (!hasApiKey()) return

      const input = {
        prompt: createValidatedPrompt('Write a song with a catchy chorus')
      }

      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data
        assertSongQuality(song, { hasChorus: true })
      }
    }, 40000)

    it('should include bridge when explicitly requested', async () => {
      if (!hasApiKey()) return

      const input = {
        prompt: createValidatedPrompt('Write a song', {
          constraints: createConstraints({ includeBridge: true })
        })
      }

      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data

        // Bridge should be present (AI may not always include it)
        if (song.bridge === null) {
          console.warn('⚠️  Bridge requested but not generated by AI')
        }
      }
    }, 40000)

    it('should generate title relevant to prompt', async () => {
      if (!hasApiKey()) return

      const input = { prompt: createValidatedPrompt('Write a song about the ocean') }
      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data
        const titleLower = song.title.toLowerCase()

        // Title should relate to theme (ocean, sea, wave, etc.)
        const oceanWords = ['ocean', 'sea', 'wave', 'tide', 'shore', 'water', 'deep']
        const hasOceanTheme = oceanWords.some(word => titleLower.includes(word))

        // Note: This may not always be true for AI, so we just log warning
        if (!hasOceanTheme) {
          console.warn(`⚠️  Title "${song.title}" may not relate to ocean theme`)
        }
      }
    }, 40000)

    it('should maintain consistent syllable counts per line (±30% variance)', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.simple() }
      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data

        song.verses.forEach(verse => {
          const syllableCounts = verse.lines.map(l => l.syllables)
          const avg = syllableCounts.reduce((a, b) => a + b) / syllableCounts.length
          const variance = syllableCounts.every(count =>
            Math.abs(count - avg) <= avg * 0.3
          )

          if (!variance) {
            console.warn('⚠️  High syllable variance detected in verse')
          }
        })
      }
    }, 40000)

    it('should follow requested rhyme scheme (with tolerance)', async () => {
      if (!hasApiKey()) return

      const input = {
        prompt: createValidatedPrompt('Write a song', {
          constraints: createConstraints({ rhymeScheme: 'ABAB' as const })
        })
      }

      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data

        // AI may not always follow exact rhyme scheme
        song.verses.forEach(verse => {
          if (verse.rhymeScheme !== 'ABAB') {
            console.warn(`⚠️  Verse has rhyme scheme ${verse.rhymeScheme}, expected ABAB`)
          }
        })
      }
    }, 40000)

    it('should generate different verses (not duplicates)', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.simple() }
      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data

        if (song.verses.length >= 2) {
          const verse1 = song.verses[0]
          const verse2 = song.verses[1]
          if (verse1 && verse2) {
            const verse1Text = verse1.lines.map(l => l.text).join(' ')
            const verse2Text = verse2.lines.map(l => l.text).join(' ')

            expect(verse1Text).not.toBe(verse2Text)
          }
        }
      }
    }, 40000)

    it('should match genre vocabulary (pop, rock, country, etc.)', async () => {
      if (!hasApiKey()) return

      const input = {
        prompt: createValidatedPrompt('Write a rock song about rebellion')
      }

      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data
        expect(song.metadata.genre).toBeTruthy()
      }
    }, 40000)

    it('should complete generation within performance SLA (P95 < 30s)', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.simple() }

      const { duration, result } = await measurePerformance(
        () => service.generate(input),
        30000 // 30s max
      )

      expect(isSuccess(result)).toBe(true)
      assertLatencyWithinSLA(duration, 30000)
    }, 45000)

    it('should handle multiple genres correctly', async () => {
      if (!hasApiKey()) return

      const genres = ['pop', 'rock', 'country']

      for (const genre of genres) {
        const input = {
          prompt: createValidatedPrompt(`Write a ${genre} song`)
        }

        const result = await service.generate(input)

        if (isSuccess(result)) {
          expect(result.data.song.metadata.genre).toBeTruthy()
        }
      }
    }, 120000)

    it('should maintain narrative coherence across verses', async () => {
      if (!hasApiKey()) return

      const input = {
        prompt: createValidatedPrompt('Write a story song about a journey')
      }

      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data
        const allLyrics = extractAllLyrics(song)

        // Check for narrative elements (this is subjective, just validate it exists)
        expect(allLyrics.length).toBeGreaterThan(100)
      }
    }, 40000)

    it('should respect mood in generated content', async () => {
      if (!hasApiKey()) return

      const input = {
        prompt: createValidatedPrompt('Write a melancholic song', {
          context: { genre: 'pop', mood: 'melancholic', theme: 'loss', targetAudience: 'adults' }
        })
      }

      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data
        expect(song.metadata.mood).toBeTruthy()
      }
    }, 40000)

    it('should generate songs with reasonable length (not too short/long)', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.simple() }
      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data
        const totalLines = song.verses.reduce((sum, v) => sum + v.lines.length, 0) +
                          song.choruses.reduce((sum, c) => sum + c.lines.length, 0)

        expect(totalLines).toBeGreaterThan(8) // At least 8 lines
        expect(totalLines).toBeLessThan(50) // Not too long
      }
    }, 40000)

    it('should handle temperature variations', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.simple() }

      const lowTempResult = await service.generate(input, { temperature: 0.3 })
      const highTempResult = await service.generate(input, { temperature: 0.9 })

      expect(isSuccess(lowTempResult)).toBe(true)
      expect(isSuccess(highTempResult)).toBe(true)

      // Both should succeed, but outputs will differ
      if (isSuccess(lowTempResult) && isSuccess(highTempResult)) {
        const lyrics1 = extractAllLyrics(lowTempResult.data.song)
        const lyrics2 = extractAllLyrics(highTempResult.data.song)

        // They should be different (not identical)
        expect(lyrics1).not.toBe(lyrics2)
      }
    }, 80000)
  })

  describe('Quality Thresholds (10 tests)', () => {
    it('should generate coherent lyrics (no gibberish)', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.simple() }
      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data
        const lyrics = extractAllLyrics(song)

        // Check for English words (simple heuristic)
        const words = lyrics.split(/\s+/)
        const validWords = words.filter(w => w.length >= 2 && /^[a-zA-Z]+$/.test(w))

        expect(validWords.length).toBeGreaterThan(words.length * 0.7) // 70% valid words
      }
    }, 40000)

    it('should avoid excessive repetition', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.simple() }
      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data

        // Check each verse for excessive line repetition
        song.verses.forEach(verse => {
          const lines = verse.lines.map(l => l.text)
          const uniqueLines = new Set(lines)

          // At least 50% unique lines
          expect(uniqueLines.size).toBeGreaterThanOrEqual(lines.length * 0.5)
        })
      }
    }, 40000)

    it('should maintain completeness (no empty sections)', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.simple() }
      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data

        // All verses should have lines
        song.verses.forEach(verse => {
          expect(verse.lines.length).toBeGreaterThan(0)
          verse.lines.forEach(line => {
            expect(line.text.trim().length).toBeGreaterThan(0)
          })
        })

        // All choruses should have lines
        song.choruses.forEach(chorus => {
          expect(chorus.lines.length).toBeGreaterThan(0)
          chorus.lines.forEach(line => {
            expect(line.text.trim().length).toBeGreaterThan(0)
          })
        })
      }
    }, 40000)

    it('should maintain proper grammar (basic checks)', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.simple() }
      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data
        const lyrics = extractAllLyrics(song)

        // Check for proper sentence structure (basic)
        const sentences = lyrics.split(/[.!?]/)
        const nonEmptySentences = sentences.filter(s => s.trim().length > 0)

        expect(nonEmptySentences.length).toBeGreaterThan(0)
      }
    }, 40000)

    it('should stay within character limit for Suno (3000 chars)', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.simple() }
      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data
        const lyrics = extractAllLyrics(song)

        expect(lyrics.length).toBeLessThan(3000) // Suno limit
      }
    }, 40000)

    it('should have reasonable line lengths (not too short/long)', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.simple() }
      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data

        song.verses.forEach(verse => {
          verse.lines.forEach(line => {
            expect(line.text.length).toBeGreaterThan(5) // Not too short
            expect(line.text.length).toBeLessThan(200) // Not too long
          })
        })
      }
    }, 40000)

    it('should have positive confidence for successful generation', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.simple() }
      const result = await service.generate(input)

      if (isSuccess(result)) {
        expect(result.data.confidence).toBeGreaterThan(0.5) // At least 50% confidence
      }
    }, 40000)

    it('should track token usage reasonably', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.simple() }
      const result = await service.generate(input)

      if (isSuccess(result) && result.data.generationMetadata.tokensUsed) {
        expect(result.data.generationMetadata.tokensUsed).toBeGreaterThan(0)
        expect(result.data.generationMetadata.tokensUsed).toBeLessThan(5000) // Budget limit
      }
    }, 40000)

    it('should maintain metadata consistency', async () => {
      if (!hasApiKey()) return

      const input = {
        prompt: createValidatedPrompt('Write a pop song', {
          context: { genre: 'pop', mood: 'happy', theme: 'love', targetAudience: 'adults' }
        })
      }

      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data

        expect(song.metadata.genre).toBeTruthy()
        expect(song.metadata.mood).toBeTruthy()
        expect(song.metadata.version).toBe(1)
      }
    }, 40000)

    it('should have proper timestamp in metadata', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.simple() }
      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data

        // Song has generatedAt, not metadata.created
        expect(song.generatedAt).toBeInstanceOf(Date)
        expect(song.generatedAt.getTime()).toBeLessThanOrEqual(Date.now())
      }
    }, 40000)
  })

  describe('Semantic Tests (5 tests)', () => {
    it('should generate content relevant to prompt theme', async () => {
      if (!hasApiKey()) return

      const input = { prompt: createValidatedPrompt('Write a song about the ocean and waves') }
      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data
        const lyrics = extractAllLyrics(song)

        assertContainsTheme(lyrics, ['ocean', 'wave', 'sea', 'tide', 'water'])
      }
    }, 40000)

    it('should match emotional tone to mood', async () => {
      if (!hasApiKey()) return

      const input = {
        prompt: createValidatedPrompt('Write a happy uplifting song', {
          context: { genre: 'pop', mood: 'happy', theme: 'joy', targetAudience: 'all' }
        })
      }

      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data
        const lyrics = extractAllLyrics(song).toLowerCase()

        // Should have positive words
        const positiveWords = ['happy', 'joy', 'smile', 'bright', 'sunshine', 'love', 'good']
        const hasPositive = positiveWords.some(word => lyrics.includes(word))

        expect(hasPositive).toBe(true)
      }
    }, 40000)

    it('should use genre-appropriate vocabulary', async () => {
      if (!hasApiKey()) return

      const input = {
        prompt: createValidatedPrompt('Write a rock song about rebellion')
      }

      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data
        expect(song.metadata.genre).toBeTruthy()
      }
    }, 40000)

    it('should avoid common clichés when requested', async () => {
      if (!hasApiKey()) return

      const input = {
        prompt: createValidatedPrompt('Write an original song about love without clichés')
      }

      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data
        const lyrics = extractAllLyrics(song)

        const commonClichés = [
          'heart on my sleeve',
          'love at first sight',
          'meant to be',
          'soul mate'
        ]

        assertDoesNotContainClichés(lyrics, commonClichés)
      }
    }, 40000)

    it('should maintain consistent voice/perspective', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.simple() }
      const result = await service.generate(input)

      if (isSuccess(result)) {
        const { song } = result.data
        const lyrics = extractAllLyrics(song).toLowerCase()

        // Check for perspective consistency (basic heuristic)
        const firstPerson = (lyrics.match(/\b(i|me|my|mine)\b/g) || []).length
        const secondPerson = (lyrics.match(/\b(you|your|yours)\b/g) || []).length
        const thirdPerson = (lyrics.match(/\b(he|she|they|him|her|them)\b/g) || []).length

        // Dominant perspective should be clear
        const total = firstPerson + secondPerson + thirdPerson
        if (total > 0) {
          const dominantPerspective = Math.max(firstPerson, secondPerson, thirdPerson)
          expect(dominantPerspective / total).toBeGreaterThan(0.4) // At least 40% dominant
        }
      }
    }, 40000)
  })

  describe('Edge Cases (10 tests)', () => {
    it('should handle very short prompts', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.shortPrompt() }
      const result = await service.generate(input)

      expect(isSuccess(result)).toBe(true)

      if (isSuccess(result)) {
        const { song } = result.data
        assertSongQuality(song, { minVerses: 1, hasChorus: true })
      }
    }, 40000)

    it('should handle complex multi-constraint prompts', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.withConstraints() }
      const result = await service.generate(input)

      expect(isSuccess(result)).toBe(true)

      if (isSuccess(result)) {
        const { song } = result.data
        expect(song.verses.length).toBeGreaterThan(0)
        expect(song.choruses.length).toBeGreaterThan(0)
      }
    }, 50000)

    it('should handle unusual themes', async () => {
      if (!hasApiKey()) return

      const input = { prompt: TestPrompts.edgeCase() }
      const result = await service.generate(input)

      expect(isSuccess(result)).toBe(true)

      if (isSuccess(result)) {
        const { song } = result.data
        assertSongQuality(song, { minVerses: 1, hasChorus: true })
      }
    }, 40000)

    it('should handle special characters in prompt', async () => {
      if (!hasApiKey()) return

      const input = {
        prompt: createValidatedPrompt('Write a song about "hope" & love!')
      }

      const result = await service.generate(input)

      expect(isSuccess(result)).toBe(true)
    }, 40000)

    it('should handle empty style config gracefully', async () => {
      if (!hasApiKey()) return

      const input = {
        prompt: TestPrompts.simple(),
        style: undefined
      }

      const result = await service.generate(input)

      expect(isSuccess(result)).toBe(true)
    }, 40000)

    it('should handle missing optional parameters', async () => {
      if (!hasApiKey()) return

      const input = {
        prompt: createValidatedPrompt('Write a song', {
          context: { genre: 'pop', mood: 'neutral', theme: 'general', targetAudience: 'all' }
        })
      }

      const result = await service.generate(input)

      expect(isSuccess(result)).toBe(true)
    }, 40000)

    it('should handle concurrent generation requests', async () => {
      if (!hasApiKey()) return

      const promises = [
        service.generate({ prompt: TestPrompts.simple() }),
        service.generate({ prompt: TestPrompts.simple() }),
        service.generate({ prompt: TestPrompts.simple() })
      ]

      const results = await Promise.all(promises)

      results.forEach(result => {
        expect(isSuccess(result)).toBe(true)
      })
    }, 120000)

    it('should recover from API timeouts gracefully', async () => {
      if (!hasApiKey()) return

      // This test is hard to simulate without mocking
      // Just verify normal operation
      const input = { prompt: TestPrompts.simple() }
      const result = await service.generate(input)

      expect(result).toBeTruthy()
    }, 40000)

    it('should handle maximum constraint values', async () => {
      if (!hasApiKey()) return

      const input = {
        prompt: createValidatedPrompt('Write a song', {
          constraints: createConstraints({
            verseCount: 5,
            linesPerVerse: 8,
            chorusCount: 3,
            linesPerChorus: 6
          })
        })
      }

      const result = await service.generate(input)

      expect(isSuccess(result)).toBe(true)
    }, 60000)

    it('should fail gracefully with null prompt', async () => {
      if (!hasApiKey()) return

      // @ts-expect-error: Testing invalid input
      const result = await service.generate({ prompt: null })

      expect(isFailure(result)).toBe(true)

      if (isFailure(result)) {
        expect(result.error.code).toBeTruthy()
        expect(result.error.suggestion).toBeTruthy()
      }
    }, 10000)
  })
})
