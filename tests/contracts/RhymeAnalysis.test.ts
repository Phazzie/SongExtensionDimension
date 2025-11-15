/**
 * @fileoverview Contract Tests for Rhyme Analysis Service
 * @purpose Ensure any implementation of IRhymeAnalysisService matches the contract exactly
 *
 * TEST-DRIVEN DEVELOPMENT APPROACH:
 * These tests are written BEFORE the mock implementation.
 * The mock implementation should be written to make these tests pass.
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import type {
  IRhymeAnalysisService,
  RhymeAnalysis,
  RhymeLookup,
  RhymeQuality,
  RhymeMetrics,
  RhymeSuggestion
} from '../../src/contracts/RhymeAnalysis'
import { isSuccess, isFailure } from '../../src/contracts/types/common'
import type { RhymeScheme } from '../../src/contracts/types/song'

/**
 * NOTE: This test suite is designed to work with ANY implementation of IRhymeAnalysisService.
 * During Phase 3 (BUILD), import MockRhymeAnalysisService.
 * During Phase 5 (IMPLEMENT), import RealRhymeAnalysisService.
 * The tests should pass for both implementations.
 */
describe('IRhymeAnalysisService Contract Tests', () => {
  let service: IRhymeAnalysisService

  beforeEach(() => {
    // Import the mock service
    const { MockRhymeAnalysisService } = require('../../src/services/mock/MockRhymeAnalysisService')
    service = new MockRhymeAnalysisService()
  })

  // ===========================================
  // METHOD 1: analyzeLines()
  // ===========================================
  describe('analyzeLines() method', () => {
    describe('Success Cases', () => {
      it('should return success for valid lines with perfect rhymes', async () => {
        const lines = [
          'The cat sat on the mat',
          'She wore a fancy hat'
        ]

        const result = await service.analyzeLines(lines)

        // Verify ServiceResponse shape
        expect(result).toHaveProperty('success')
        expect(isSuccess(result)).toBe(true)

        if (isSuccess(result)) {
          const data: RhymeAnalysis = result.data

          // Verify all required fields exist
          expect(data).toHaveProperty('lines')
          expect(data).toHaveProperty('rhymeScheme')
          expect(data).toHaveProperty('rhymePairs')
          expect(data).toHaveProperty('qualityScore')
          expect(data).toHaveProperty('overallQuality')
          expect(data).toHaveProperty('suggestions')
          expect(data).toHaveProperty('internalRhymes')

          // Verify lines array
          expect(Array.isArray(data.lines)).toBe(true)
          expect(data.lines.length).toBe(2)

          // Verify each analyzed line structure
          const line1 = data.lines[0]!
          expect(line1).toHaveProperty('index')
          expect(line1).toHaveProperty('text')
          expect(line1).toHaveProperty('endSound')
          expect(line1).toHaveProperty('phonetic')
          expect(line1).toHaveProperty('syllables')
          expect(line1).toHaveProperty('rhymesWith')
          expect(line1).toHaveProperty('internalRhymes')

          expect(line1.index).toBe(0)
          expect(line1.text).toBe('The cat sat on the mat')
          expect(typeof line1.endSound).toBe('string')
          expect(typeof line1.phonetic).toBe('string')
          expect(typeof line1.syllables).toBe('number')
          expect(line1.syllables).toBeGreaterThan(0)
          expect(Array.isArray(line1.rhymesWith)).toBe(true)
          expect(Array.isArray(line1.internalRhymes)).toBe(true)

          // Should detect rhyme between mat/hat
          expect(line1.rhymesWith.length).toBeGreaterThan(0)
          expect(line1.rhymesWith).toContain(1)

          // Verify rhyme scheme
          expect(typeof data.rhymeScheme).toBe('string')
          expect(data.rhymeScheme).toBe('AA')

          // Verify rhyme pairs
          expect(Array.isArray(data.rhymePairs)).toBe(true)
          expect(data.rhymePairs.length).toBeGreaterThan(0)

          const pair = data.rhymePairs[0]!
          expect(pair).toHaveProperty('line1Index')
          expect(pair).toHaveProperty('line2Index')
          expect(pair).toHaveProperty('quality')
          expect(pair).toHaveProperty('confidence')
          expect(pair).toHaveProperty('type')
          expect(pair).toHaveProperty('sharedSound')

          // Verify quality score
          expect(typeof data.qualityScore).toBe('number')
          expect(data.qualityScore).toBeGreaterThanOrEqual(0)
          expect(data.qualityScore).toBeLessThanOrEqual(100)

          // Verify overall quality
          expect(typeof data.overallQuality).toBe('string')

          // Verify suggestions array
          expect(Array.isArray(data.suggestions)).toBe(true)

          // Verify internal rhymes array
          expect(Array.isArray(data.internalRhymes)).toBe(true)
        }
      })

      it('should detect ABAB rhyme scheme', async () => {
        const lines = [
          'I woke up feeling bright today',
          'The world was full of grace',
          'I knew I had to find my way',
          'And run with life\'s fast pace'
        ]

        const result = await service.analyzeLines(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.rhymeScheme).toBe('ABAB')
          expect(result.data.lines.length).toBe(4)

          // Line 0 should rhyme with line 2
          expect(result.data.lines[0]!.rhymesWith).toContain(2)
          // Line 1 should rhyme with line 3
          expect(result.data.lines[1]!.rhymesWith).toContain(3)
        }
      })

      it('should detect AABB rhyme scheme', async () => {
        const lines = [
          'The night is dark and cold',
          'Your story left untold',
          'The stars shine bright above',
          'My heart is full of love'
        ]

        const result = await service.analyzeLines(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.rhymeScheme).toBe('AABB')
          expect(result.data.rhymePairs.length).toBeGreaterThanOrEqual(2)
        }
      })

      it('should accept optional expectedScheme parameter', async () => {
        const lines = [
          'Line ending with day',
          'Line ending with night',
          'Line ending with way',
          'Line ending with light'
        ]

        const expectedScheme: RhymeScheme = 'ABAB'
        const result = await service.analyzeLines(lines, expectedScheme)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.rhymeScheme).toBe('ABAB')
        }
      })

      it('should detect internal rhymes within lines', async () => {
        const lines = [
          'I scream, you scream, we all dream of cream',
          'The beat and heat meet on the street'
        ]

        const result = await service.analyzeLines(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // Should detect internal rhymes
          expect(result.data.internalRhymes.length).toBeGreaterThan(0)

          const internalRhyme = result.data.internalRhymes[0]!
          expect(internalRhyme).toHaveProperty('lineIndex')
          expect(internalRhyme).toHaveProperty('words')
          expect(internalRhyme).toHaveProperty('positions')
          expect(internalRhyme).toHaveProperty('quality')

          expect(Array.isArray(internalRhyme.words)).toBe(true)
          expect(Array.isArray(internalRhyme.positions)).toBe(true)
          expect(internalRhyme.words.length).toBeGreaterThan(1)
        }
      })

      it('should handle lines with no rhymes', async () => {
        const lines = [
          'This line has no match',
          'Neither does this one',
          'Or this particular phrase'
        ]

        const result = await service.analyzeLines(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.lines.length).toBe(3)
          expect(result.data.rhymeScheme).toBeDefined()
          expect(result.data.rhymePairs.length).toBe(0)
        }
      })

      it('should detect near rhymes (assonance)', async () => {
        const lines = [
          'The cat ran fast',
          'Down the path at last'
        ]

        const result = await service.analyzeLines(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.rhymePairs.length).toBeGreaterThan(0)
          // Quality could be PERFECT or NEAR depending on phonetic analysis
          expect(result.data.rhymePairs[0]!.quality).toBeDefined()
        }
      })

      it('should handle single line input', async () => {
        const lines = ['Just one line here']

        const result = await service.analyzeLines(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.lines.length).toBe(1)
          expect(result.data.rhymePairs.length).toBe(0)
          expect(result.data.rhymeScheme).toBeDefined()
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for empty lines array', async () => {
        const result = await service.analyzeLines([])

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('INSUFFICIENT_LINES')
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
          expect(result.error.message.length).toBeGreaterThan(0)
          expect(result.error.suggestion.length).toBeGreaterThan(0)
        }
      })

      it('should return error for lines containing only whitespace', async () => {
        const result = await service.analyzeLines(['   ', '\t\n', '  '])

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('INVALID_TEXT')
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
        }
      })

      it('should return error for lines with special characters only', async () => {
        const result = await service.analyzeLines(['!!!', '@@@', '$$$'])

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('INVALID_TEXT')
        }
      })

      it('should return error for non-English text when unsupported', async () => {
        const result = await service.analyzeLines([
          '这是中文',
          '日本語です'
        ])

        // May return UNSUPPORTED_LANGUAGE or PHONETIC_ANALYSIS_FAILED
        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(['UNSUPPORTED_LANGUAGE', 'PHONETIC_ANALYSIS_FAILED']).toContain(result.error.code)
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs: any[] = [
          [],
          [''],
          ['   '],
          null,
          undefined,
          ['line1', null, 'line3'],
        ]

        for (const input of badInputs) {
          await expect(service.analyzeLines(input)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const result = await service.analyzeLines(['Valid line'])

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
        const result = await service.analyzeLines(['Line one', 'Line two'])

        if (isSuccess(result)) {
          const data = result.data

          // TypeScript should prevent these at compile time
          // Runtime enforcement depends on Object.freeze in implementation
          expect(() => {
            (data as any).rhymeScheme = 'CHANGED'
          }).toThrow()

          expect(() => {
            (data.lines as any).push({})
          }).toThrow()

          expect(() => {
            (data.lines[0] as any).text = 'changed'
          }).toThrow()
        }
      })
    })
  })

  // ===========================================
  // METHOD 2: findRhymes()
  // ===========================================
  describe('findRhymes() method', () => {
    describe('Success Cases', () => {
      it('should return rhymes for a common word', async () => {
        const result = await service.findRhymes('cat')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const data: RhymeLookup = result.data

          // Verify all required fields
          expect(data).toHaveProperty('word')
          expect(data).toHaveProperty('perfectRhymes')
          expect(data).toHaveProperty('nearRhymes')
          expect(data).toHaveProperty('slantRhymes')
          expect(data).toHaveProperty('phonetic')
          expect(data).toHaveProperty('syllableCount')

          expect(data.word).toBe('cat')
          expect(Array.isArray(data.perfectRhymes)).toBe(true)
          expect(Array.isArray(data.nearRhymes)).toBe(true)
          expect(Array.isArray(data.slantRhymes)).toBe(true)
          expect(typeof data.phonetic).toBe('string')
          expect(typeof data.syllableCount).toBe('number')
          expect(data.syllableCount).toBeGreaterThan(0)

          // Should find common rhymes for 'cat'
          expect(data.perfectRhymes.length).toBeGreaterThan(0)
          // Common rhymes: hat, mat, bat, sat, etc.
          expect(data.perfectRhymes.some(w => ['hat', 'mat', 'bat', 'sat', 'rat'].includes(w))).toBe(true)
        }
      })

      it('should respect maxResults parameter', async () => {
        const maxResults = 5
        const result = await service.findRhymes('love', maxResults)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const totalRhymes = result.data.perfectRhymes.length +
                             result.data.nearRhymes.length +
                             result.data.slantRhymes.length
          expect(totalRhymes).toBeLessThanOrEqual(maxResults)
        }
      })

      it('should handle multi-syllable words', async () => {
        const result = await service.findRhymes('beautiful')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.syllableCount).toBeGreaterThan(2)
          expect(result.data.perfectRhymes.length).toBeGreaterThanOrEqual(0)
        }
      })

      it('should return empty arrays for words with no rhymes', async () => {
        const result = await service.findRhymes('orange')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // 'orange' famously has very few rhymes
          expect(result.data.perfectRhymes.length).toBe(0)
        }
      })

      it('should handle uppercase and lowercase consistently', async () => {
        const result1 = await service.findRhymes('CAT')
        const result2 = await service.findRhymes('cat')

        expect(isSuccess(result1)).toBe(true)
        expect(isSuccess(result2)).toBe(true)

        if (isSuccess(result1) && isSuccess(result2)) {
          // Should normalize to same word
          expect(result1.data.word.toLowerCase()).toBe(result2.data.word.toLowerCase())
          expect(result1.data.syllableCount).toBe(result2.data.syllableCount)
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for empty word', async () => {
        const result = await service.findRhymes('')

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('INVALID_TEXT')
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
        }
      })

      it('should return error for whitespace-only word', async () => {
        const result = await service.findRhymes('   ')

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('INVALID_TEXT')
        }
      })

      it('should return error for non-word characters', async () => {
        const result = await service.findRhymes('!!!@@@')

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('INVALID_TEXT')
        }
      })

      it('should handle dictionary lookup failures gracefully', async () => {
        // This is implementation-dependent, but should return error not throw
        const result = await service.findRhymes('xyzqwerty123notarealword')

        // Should either succeed with empty arrays or fail with DICTIONARY_LOOKUP_FAILED
        expect(result).toHaveProperty('success')
        if (isFailure(result)) {
          expect(['DICTIONARY_LOOKUP_FAILED', 'INVALID_TEXT']).toContain(result.error.code)
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs: any[] = [
          '',
          '   ',
          '!!!',
          null,
          undefined,
        ]

        for (const input of badInputs) {
          await expect(service.findRhymes(input)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const result = await service.findRhymes('test')

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
        const result = await service.findRhymes('test')

        if (isSuccess(result)) {
          const data = result.data

          expect(() => {
            (data as any).word = 'changed'
          }).toThrow()

          expect(() => {
            (data.perfectRhymes as any).push('newrhyme')
          }).toThrow()
        }
      })
    })
  })

  // ===========================================
  // METHOD 3: checkRhyme()
  // ===========================================
  describe('checkRhyme() method', () => {
    describe('Success Cases', () => {
      it('should detect perfect rhyme', async () => {
        const result = await service.checkRhyme('cat', 'hat')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const quality: RhymeQuality = result.data
          expect(typeof quality).toBe('string')
          expect(quality).toBe('perfect')
        }
      })

      it('should detect near rhyme', async () => {
        const result = await service.checkRhyme('cat', 'cap')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // Should be near or slant rhyme
          expect(['near', 'slant'].includes(result.data)).toBe(true)
        }
      })

      it('should detect no rhyme', async () => {
        const result = await service.checkRhyme('cat', 'dog')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(['none', 'weak'].includes(result.data)).toBe(true)
        }
      })

      it('should detect identical words (not true rhyme)', async () => {
        const result = await service.checkRhyme('love', 'love')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // Same word is not a true rhyme, could be 'none' or 'weak'
          expect(result.data).toBeDefined()
        }
      })

      it('should be case-insensitive', async () => {
        const result1 = await service.checkRhyme('CAT', 'HAT')
        const result2 = await service.checkRhyme('cat', 'hat')

        expect(isSuccess(result1)).toBe(true)
        expect(isSuccess(result2)).toBe(true)

        if (isSuccess(result1) && isSuccess(result2)) {
          expect(result1.data).toBe(result2.data)
        }
      })

      it('should handle multi-syllable rhymes', async () => {
        const result = await service.checkRhyme('generation', 'celebration')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(['perfect', 'near'].includes(result.data)).toBe(true)
        }
      })

      it('should detect slant rhymes', async () => {
        const result = await service.checkRhyme('heaven', 'given')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // heaven/given is a classic slant rhyme
          expect(result.data).toBeDefined()
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for empty first word', async () => {
        const result = await service.checkRhyme('', 'hat')

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('INVALID_TEXT')
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
        }
      })

      it('should return error for empty second word', async () => {
        const result = await service.checkRhyme('cat', '')

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('INVALID_TEXT')
        }
      })

      it('should return error for both words empty', async () => {
        const result = await service.checkRhyme('', '')

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('INVALID_TEXT')
        }
      })

      it('should return error for whitespace words', async () => {
        const result = await service.checkRhyme('   ', 'test')

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('INVALID_TEXT')
        }
      })

      it('should return error for non-word characters', async () => {
        const result = await service.checkRhyme('!!!', '@@@')

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('INVALID_TEXT')
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs: Array<[any, any]> = [
          ['', ''],
          ['', 'test'],
          ['test', ''],
          [null, 'test'],
          ['test', null],
          [undefined, undefined],
        ]

        for (const [word1, word2] of badInputs) {
          await expect(service.checkRhyme(word1, word2)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const result = await service.checkRhyme('cat', 'hat')

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

      it('should return immutable RhymeQuality enum value', async () => {
        const result = await service.checkRhyme('test', 'best')

        if (isSuccess(result)) {
          const quality = result.data
          expect(typeof quality).toBe('string')
          // Should be one of the valid enum values
          expect(['perfect', 'near', 'slant', 'forced', 'weak', 'none'].includes(quality)).toBe(true)
        }
      })
    })
  })

  // ===========================================
  // METHOD 4: detectScheme()
  // ===========================================
  describe('detectScheme() method', () => {
    describe('Success Cases', () => {
      it('should detect ABAB scheme', async () => {
        const lines = [
          'I woke up feeling bright today',
          'The world was full of grace',
          'I knew I had to find my way',
          'And run with life\'s fast pace'
        ]

        const result = await service.detectScheme(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const scheme: RhymeScheme = result.data
          expect(typeof scheme).toBe('string')
          expect(scheme).toBe('ABAB')
        }
      })

      it('should detect AABB scheme', async () => {
        const lines = [
          'The night is dark and cold',
          'Your story left untold',
          'The stars shine bright above',
          'My heart is full of love'
        ]

        const result = await service.detectScheme(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data).toBe('AABB')
        }
      })

      it('should detect AAAA scheme (monorhyme)', async () => {
        const lines = [
          'Line ending with day',
          'Another about May',
          'Something about way',
          'Finally about ray'
        ]

        const result = await service.detectScheme(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data).toBe('AAAA')
        }
      })

      it('should detect ABCB scheme', async () => {
        const lines = [
          'I walked along the shore',
          'The sun was setting low',
          'I felt my heart could soar',
          'In evening\'s gentle glow'
        ]

        const result = await service.detectScheme(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(['ABCB', 'ABAB'].includes(result.data)).toBe(true)
        }
      })

      it('should handle lines with no rhyme scheme', async () => {
        const lines = [
          'First line here',
          'Different ending',
          'Another phrase',
          'Nothing matches'
        ]

        const result = await service.detectScheme(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(typeof result.data).toBe('string')
          // Could be 'ABCD', 'FREE', or similar
          expect(result.data).toBeDefined()
        }
      })

      it('should handle single line', async () => {
        const lines = ['Just one line']

        const result = await service.detectScheme(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(typeof result.data).toBe('string')
          expect(result.data).toBe('A')
        }
      })

      it('should handle two lines', async () => {
        const lines = ['Line with cat', 'Line with hat']

        const result = await service.detectScheme(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data).toBe('AA')
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for empty array', async () => {
        const result = await service.detectScheme([])

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('INSUFFICIENT_LINES')
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
        }
      })

      it('should return error for all whitespace lines', async () => {
        const result = await service.detectScheme(['   ', '\t', '\n'])

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('INVALID_TEXT')
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs: any[] = [
          [],
          [''],
          ['   '],
          null,
          undefined,
        ]

        for (const input of badInputs) {
          await expect(service.detectScheme(input)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const result = await service.detectScheme(['test line'])

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

      it('should return immutable RhymeScheme string', async () => {
        const result = await service.detectScheme(['line one', 'line two'])

        if (isSuccess(result)) {
          const scheme = result.data
          expect(typeof scheme).toBe('string')
          expect(scheme.length).toBeGreaterThan(0)
        }
      })
    })
  })

  // ===========================================
  // METHOD 5: getMetrics()
  // ===========================================
  describe('getMetrics() method', () => {
    describe('Success Cases', () => {
      it('should return metrics for valid analysis', async () => {
        // First create an analysis
        const analysisResult = await service.analyzeLines([
          'The cat sat on the mat',
          'She wore a fancy hat'
        ])

        if (isSuccess(analysisResult)) {
          const result = await service.getMetrics(analysisResult.data)

          expect(isSuccess(result)).toBe(true)
          if (isSuccess(result)) {
            const metrics: RhymeMetrics = result.data

            // Verify all required fields
            expect(metrics).toHaveProperty('perfectRhymeCount')
            expect(metrics).toHaveProperty('nearRhymeCount')
            expect(metrics).toHaveProperty('forcedRhymeCount')
            expect(metrics).toHaveProperty('noRhymeCount')
            expect(metrics).toHaveProperty('internalRhymeCount')
            expect(metrics).toHaveProperty('multiSyllableRhymeCount')
            expect(metrics).toHaveProperty('averageQuality')

            // Verify types
            expect(typeof metrics.perfectRhymeCount).toBe('number')
            expect(typeof metrics.nearRhymeCount).toBe('number')
            expect(typeof metrics.forcedRhymeCount).toBe('number')
            expect(typeof metrics.noRhymeCount).toBe('number')
            expect(typeof metrics.internalRhymeCount).toBe('number')
            expect(typeof metrics.multiSyllableRhymeCount).toBe('number')
            expect(typeof metrics.averageQuality).toBe('number')

            // Verify ranges
            expect(metrics.perfectRhymeCount).toBeGreaterThanOrEqual(0)
            expect(metrics.nearRhymeCount).toBeGreaterThanOrEqual(0)
            expect(metrics.forcedRhymeCount).toBeGreaterThanOrEqual(0)
            expect(metrics.noRhymeCount).toBeGreaterThanOrEqual(0)
            expect(metrics.internalRhymeCount).toBeGreaterThanOrEqual(0)
            expect(metrics.multiSyllableRhymeCount).toBeGreaterThanOrEqual(0)
            expect(metrics.averageQuality).toBeGreaterThanOrEqual(0)
            expect(metrics.averageQuality).toBeLessThanOrEqual(100)
          }
        }
      })

      it('should calculate correct counts from analysis', async () => {
        const analysisResult = await service.analyzeLines([
          'Perfect rhyme here day',
          'Another perfect May',
          'Near rhyme with say',
          'And nothing for bear'
        ])

        if (isSuccess(analysisResult)) {
          const result = await service.getMetrics(analysisResult.data)

          expect(isSuccess(result)).toBe(true)
          if (isSuccess(result)) {
            const totalCounts = result.data.perfectRhymeCount +
                               result.data.nearRhymeCount +
                               result.data.forcedRhymeCount +
                               result.data.noRhymeCount

            // Total should make sense given the input
            expect(totalCounts).toBeGreaterThanOrEqual(0)
          }
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for analysis with empty lines array', async () => {
        const invalidAnalysis = {
          lines: [],
          rhymeScheme: 'A' as RhymeScheme,
          rhymePairs: [],
          qualityScore: 0 as any,
          overallQuality: 'none' as any,
          suggestions: [],
          internalRhymes: []
        }

        const result = await service.getMetrics(invalidAnalysis)

        // Should handle gracefully - either succeed with zero counts or fail
        expect(result).toHaveProperty('success')
        if (isFailure(result)) {
          expect(result.error.code).toBeDefined()
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs: any[] = [
          null,
          undefined,
          {},
          {
            lines: [],
            rhymeScheme: 'A',
            rhymePairs: [],
            qualityScore: 0,
            overallQuality: 'none',
            suggestions: [],
            internalRhymes: []
          }
        ]

        for (const input of badInputs) {
          await expect(service.getMetrics(input)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const analysisResult = await service.analyzeLines(['test'])

        if (isSuccess(analysisResult)) {
          const result = await service.getMetrics(analysisResult.data)

          expect(result).toHaveProperty('success')
          expect(typeof result.success).toBe('boolean')

          if (result.success) {
            expect(result).toHaveProperty('data')
            expect(result).not.toHaveProperty('error')
          } else {
            expect(result).toHaveProperty('error')
            expect(result).not.toHaveProperty('data')
          }
        }
      })

      it('should preserve readonly semantics on output', async () => {
        const analysisResult = await service.analyzeLines(['line one', 'line two'])

        if (isSuccess(analysisResult)) {
          const result = await service.getMetrics(analysisResult.data)

          if (isSuccess(result)) {
            expect(() => {
              (result.data as any).perfectRhymeCount = 999
            }).toThrow()

            expect(() => {
              (result.data as any).averageQuality = 999
            }).toThrow()
          }
        }
      })
    })
  })

  // ===========================================
  // METHOD 6: suggestImprovements()
  // ===========================================
  describe('suggestImprovements() method', () => {
    describe('Success Cases', () => {
      it('should return suggestions for weak rhymes', async () => {
        const lines = [
          'I walked along the street',
          'With shoes upon my foot'
        ]

        const result = await service.suggestImprovements(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const suggestions: readonly RhymeSuggestion[] = result.data

          expect(Array.isArray(suggestions)).toBe(true)

          if (suggestions.length > 0) {
            const suggestion = suggestions[0]!

            // Verify all required fields
            expect(suggestion).toHaveProperty('lineIndex')
            expect(suggestion).toHaveProperty('issue')
            expect(suggestion).toHaveProperty('currentWord')
            expect(suggestion).toHaveProperty('alternatives')
            expect(suggestion).toHaveProperty('improvement')

            expect(typeof suggestion.lineIndex).toBe('number')
            expect(typeof suggestion.issue).toBe('string')
            expect(typeof suggestion.currentWord).toBe('string')
            expect(Array.isArray(suggestion.alternatives)).toBe(true)
            expect(typeof suggestion.improvement).toBe('string')

            // Verify alternatives structure
            if (suggestion.alternatives.length > 0) {
              const alt = suggestion.alternatives[0]!
              expect(alt).toHaveProperty('word')
              expect(alt).toHaveProperty('quality')
              expect(alt).toHaveProperty('syllables')
              expect(alt).toHaveProperty('commonality')
              expect(alt).toHaveProperty('preservesMeaning')

              expect(typeof alt.word).toBe('string')
              expect(typeof alt.syllables).toBe('number')
              expect(typeof alt.commonality).toBe('number')
              expect(typeof alt.preservesMeaning).toBe('boolean')
              expect(alt.commonality).toBeGreaterThanOrEqual(0)
              expect(alt.commonality).toBeLessThanOrEqual(1)
            }
          }
        }
      })

      it('should return empty array for perfect rhymes', async () => {
        const lines = [
          'The cat sat on the mat',
          'She wore a fancy hat'
        ]

        const result = await service.suggestImprovements(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // Perfect rhymes may have no suggestions
          expect(Array.isArray(result.data)).toBe(true)
        }
      })

      it('should suggest improvements for forced rhymes', async () => {
        const lines = [
          'I love you very much today',
          'My feelings are so strong in way'
        ]

        const result = await service.suggestImprovements(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(Array.isArray(result.data)).toBe(true)
          // Should likely suggest improvements for "in way"
        }
      })

      it('should handle lines with no rhymes', async () => {
        const lines = [
          'This is line one',
          'Something completely different',
          'Another random phrase'
        ]

        const result = await service.suggestImprovements(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(Array.isArray(result.data)).toBe(true)
          // May or may not have suggestions depending on implementation
        }
      })

      it('should handle single line', async () => {
        const lines = ['Just one line here']

        const result = await service.suggestImprovements(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(Array.isArray(result.data)).toBe(true)
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for empty lines array', async () => {
        const result = await service.suggestImprovements([])

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('INSUFFICIENT_LINES')
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
        }
      })

      it('should return error for whitespace-only lines', async () => {
        const result = await service.suggestImprovements(['   ', '\t', '\n'])

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('INVALID_TEXT')
        }
      })

      it('should return error for invalid text', async () => {
        const result = await service.suggestImprovements(['!!!', '@@@'])

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('INVALID_TEXT')
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs: any[] = [
          [],
          [''],
          ['   '],
          null,
          undefined,
          ['line', null, 'line'],
        ]

        for (const input of badInputs) {
          await expect(service.suggestImprovements(input)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const result = await service.suggestImprovements(['test line'])

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
        const result = await service.suggestImprovements(['line one', 'line two'])

        if (isSuccess(result)) {
          const suggestions = result.data

          expect(() => {
            (suggestions as any).push({})
          }).toThrow()

          if (suggestions.length > 0) {
            expect(() => {
              (suggestions[0] as any).issue = 'changed'
            }).toThrow()
          }
        }
      })
    })
  })
})
