/**
 * @fileoverview Contract Tests for Syllable Counting Service
 * @purpose Ensure any implementation of ISyllableCountingService matches the contract exactly
 *
 * TEST-DRIVEN DEVELOPMENT APPROACH:
 * These tests are written BEFORE the mock implementation.
 * The mock implementation should be written to make these tests pass.
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import type {
  ISyllableCountingService,
  SyllableAnalysis,
  SyllableConstraints,
  MeterDetection,
  FlowAnalysis,
  RhythmSuggestion
} from '../../src/contracts/SyllableCounting'
import { stressesToPattern, patternToStresses, Stress } from '../../src/contracts/SyllableCounting'
import type { StressPattern, MeterType } from '../../src/contracts/types/song'
import { isSuccess, isFailure } from '../../src/contracts/types/common'

/**
 * NOTE: This test suite is designed to work with ANY implementation of ISyllableCountingService.
 * During Phase 3 (BUILD), import MockSyllableCountingService.
 * During Phase 5 (IMPLEMENT), import RealSyllableCountingService.
 * The tests should pass for both implementations.
 */
describe('ISyllableCountingService Contract Tests', () => {
  let service: ISyllableCountingService

  beforeEach(() => {
    // Import the mock service
    const { MockSyllableCountingService } = require('../../src/services/mock/MockSyllableCountingService')
    service = new MockSyllableCountingService()
  })

  // ===========================================
  // METHOD 1: analyzeLines()
  // ===========================================
  describe('analyzeLines() method', () => {
    describe('Success Cases', () => {
      it('should return success for valid lines with complete analysis', async () => {
        const lines = [
          'The night descends upon the weary town',
          'As shadows dance and darkness settles down'
        ]

        const result = await service.analyzeLines(lines)

        // Verify ServiceResponse shape
        expect(result).toHaveProperty('success')
        expect(isSuccess(result)).toBe(true)

        if (isSuccess(result)) {
          const data: SyllableAnalysis = result.data

          // Verify all required fields exist
          expect(data).toHaveProperty('lines')
          expect(data).toHaveProperty('totalSyllables')
          expect(data).toHaveProperty('averageSyllablesPerLine')
          expect(data).toHaveProperty('syllablePattern')
          expect(data).toHaveProperty('consistency')
          expect(data).toHaveProperty('rhythmIssues')
          expect(data).toHaveProperty('suggestions')

          // Verify lines array structure
          expect(Array.isArray(data.lines)).toBe(true)
          expect(data.lines.length).toBe(2)

          // Verify line structure
          const firstLine = data.lines[0]
          expect(firstLine).toBeDefined()
          if (!firstLine) return
          expect(firstLine).toHaveProperty('index')
          expect(firstLine).toHaveProperty('text')
          expect(firstLine).toHaveProperty('syllableCount')
          expect(firstLine).toHaveProperty('words')
          expect(firstLine).toHaveProperty('stressPattern')
          expect(firstLine).toHaveProperty('flowScore')
          expect(firstLine).toHaveProperty('breaks')

          // Verify index
          expect(firstLine.index).toBe(0)
          expect(firstLine.text).toBe(lines[0])

          // Verify syllable count is positive
          expect(firstLine.syllableCount).toBeGreaterThan(0)

          // Verify words array
          expect(Array.isArray(firstLine.words)).toBe(true)
          expect(firstLine.words.length).toBeGreaterThan(0)

          // Verify word structure
          const firstWord = firstLine.words[0]
          expect(firstWord).toBeDefined()
          if (!firstWord) return
          expect(firstWord).toHaveProperty('word')
          expect(firstWord).toHaveProperty('syllables')
          expect(firstWord).toHaveProperty('stresses')
          expect(firstWord).toHaveProperty('phonetic')
          expect(firstWord).toHaveProperty('position')

          // Verify stress pattern format (should be x/ notation)
          expect(typeof firstLine.stressPattern).toBe('string')
          expect(firstLine.stressPattern).toMatch(/^[x/\\?]+$/)

          // Verify flow score
          expect(firstLine.flowScore).toBeGreaterThanOrEqual(0)
          expect(firstLine.flowScore).toBeLessThanOrEqual(100)

          // Verify breaks array
          expect(Array.isArray(firstLine.breaks)).toBe(true)

          // Verify total syllables
          expect(data.totalSyllables).toBeGreaterThan(0)

          // Verify average
          expect(data.averageSyllablesPerLine).toBeGreaterThan(0)

          // Verify syllable pattern
          expect(Array.isArray(data.syllablePattern)).toBe(true)
          expect(data.syllablePattern.length).toBe(2)

          // Verify consistency score
          expect(data.consistency).toBeGreaterThanOrEqual(0)
          expect(data.consistency).toBeLessThanOrEqual(100)

          // Verify arrays are defined
          expect(Array.isArray(data.rhythmIssues)).toBe(true)
          expect(Array.isArray(data.suggestions)).toBe(true)
        }
      })

      it('should return success for single line', async () => {
        const lines = ['The cat sat on the mat']

        const result = await service.analyzeLines(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.lines.length).toBe(1)
          expect(result.data.averageSyllablesPerLine).toBe(result.data.totalSyllables)
          expect(result.data.syllablePattern.length).toBe(1)
        }
      })

      it('should detect iambic meter in regular pattern', async () => {
        const lines = [
          'The CAT sat ON the MAT today',
          'She WALKED aLONG the STREET at NIGHT'
        ]

        const result = await service.analyzeLines(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // Meter might be detected
          if (result.data.meter) {
            expect(typeof result.data.meter).toBe('string')
          }

          // Lines should have stress patterns
          const firstLine = result.data.lines[0]
          if (firstLine) {
            expect(firstLine.stressPattern).toBeDefined()
            expect(firstLine.stressPattern.length).toBeGreaterThan(0)
          }
        }
      })

      it('should handle lines with varying syllable counts', async () => {
        const lines = [
          'Short line here',  // ~4 syllables
          'This is a much longer line with many syllables'  // ~12 syllables
        ]

        const result = await service.analyzeLines(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // Should have different syllable counts
          expect(result.data.syllablePattern[0]).not.toBe(result.data.syllablePattern[1])

          // Consistency score might be lower
          expect(result.data.consistency).toBeGreaterThanOrEqual(0)
          expect(result.data.consistency).toBeLessThanOrEqual(100)
        }
      })

      it('should apply syllable constraints when provided', async () => {
        const lines = [
          'This line has ten syllables in total count',
          'Another line with ten syllables as well'
        ]

        const constraints: SyllableConstraints = {
          targetSyllables: 10,
          allowedVariation: 1,
          requireConsistency: true
        }

        const result = await service.analyzeLines(lines, constraints)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // Should analyze against constraints
          expect(result.data.consistency).toBeDefined()

          // If lines match target, consistency should be high
          // If lines don't match, should have rhythm issues
          if (result.data.consistency < 80) {
            expect(result.data.rhythmIssues.length).toBeGreaterThan(0)
          }
        }
      })

      it('should detect rhythm issues in inconsistent patterns', async () => {
        const lines = [
          'STRONG STRONG weak weak strong',  // Stress clash
          'weak weak weak weak weak'  // No stresses
        ]

        const result = await service.analyzeLines(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // Verify rhythm issues structure if present
          if (result.data.rhythmIssues.length > 0) {
            const issue = result.data.rhythmIssues[0]
            if (!issue) return
            expect(issue).toHaveProperty('lineIndex')
            expect(issue).toHaveProperty('type')
            expect(issue).toHaveProperty('location')
            expect(issue).toHaveProperty('description')
            expect(issue).toHaveProperty('severity')

            // Verify severity is valid
            expect(['critical', 'major', 'minor']).toContain(issue.severity)
          }
        }
      })

      it('should handle lines with punctuation and special characters', async () => {
        const lines = [
          "Don't you know? It's true!",
          "We'll see... what happens, won't we?"
        ]

        const result = await service.analyzeLines(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.lines.length).toBe(2)
          expect(result.data.totalSyllables).toBeGreaterThan(0)
        }
      })

      it('should provide meter detection when pattern is clear', async () => {
        const lines = [
          'x/x/x/x/',
          'x/x/x/x/'
        ]

        const result = await service.analyzeLines(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // Meter may or may not be detected depending on input
          if (result.data.meter) {
            expect(typeof result.data.meter).toBe('string')
          }
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for empty array', async () => {
        const result = await service.analyzeLines([])

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('EMPTY_INPUT')
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
          expect(result.error.message.length).toBeGreaterThan(0)
          expect(result.error.suggestion.length).toBeGreaterThan(0)
        }
      })

      it('should return error for array with empty strings', async () => {
        const result = await service.analyzeLines(['', '   ', '\n\t'])

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('INVALID_TEXT')
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
        }
      })

      it('should return error for non-English text', async () => {
        const result = await service.analyzeLines(['这是中文文本'])

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('UNSUPPORTED_LANGUAGE')
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
        }
      })

      it('should return error when analysis fails completely', async () => {
        const result = await service.analyzeLines(['!!!!!@@@@@#####'])

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('ANALYSIS_FAILED')
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs = [
          [],
          [''],
          [null as any],
          [undefined as any],
          ['!!!!!']
        ]

        for (const input of badInputs) {
          await expect(service.analyzeLines(input)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const input = ['The cat sat on the mat']

        const result = await service.analyzeLines(input)

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
        const input = ['The cat sat on the mat']

        const result = await service.analyzeLines(input)

        if (isSuccess(result)) {
          const data = result.data

          expect(() => {
            // @ts-expect-error - Testing readonly enforcement
            data.totalSyllables = 999
          }).toThrow()

          expect(() => {
            // @ts-expect-error - Testing readonly enforcement
            data.lines = []
          }).toThrow()
        }
      })
    })
  })

  // ===========================================
  // METHOD 2: countSyllables()
  // ===========================================
  describe('countSyllables() method', () => {
    describe('Success Cases', () => {
      it('should count syllables correctly for single-syllable words', async () => {
        const testCases = ['cat', 'dog', 'run', 'jump', 'think']

        for (const word of testCases) {
          const result = await service.countSyllables(word)

          expect(isSuccess(result)).toBe(true)
          if (isSuccess(result)) {
            expect(typeof result.data).toBe('number')
            expect(result.data).toBe(1)
          }
        }
      })

      it('should count syllables correctly for two-syllable words', async () => {
        const testCases = ['happy', 'running', 'table', 'water', 'music']

        for (const word of testCases) {
          const result = await service.countSyllables(word)

          expect(isSuccess(result)).toBe(true)
          if (isSuccess(result)) {
            expect(result.data).toBe(2)
          }
        }
      })

      it('should count syllables correctly for three-syllable words', async () => {
        const testCases = ['beautiful', 'memory', 'wonderful', 'creative']

        for (const word of testCases) {
          const result = await service.countSyllables(word)

          expect(isSuccess(result)).toBe(true)
          if (isSuccess(result)) {
            expect(result.data).toBe(3)
          }
        }
      })

      it('should count syllables correctly for multi-syllable words', async () => {
        const testCases = [
          { word: 'temporarily', expected: 5 },
          { word: 'incredible', expected: 4 },
          { word: 'understanding', expected: 4 },
          { word: 'revolutionary', expected: 5 }
        ]

        for (const test of testCases) {
          const result = await service.countSyllables(test.word)

          expect(isSuccess(result)).toBe(true)
          if (isSuccess(result)) {
            expect(result.data).toBe(test.expected)
          }
        }
      })

      it('should handle words with silent e', async () => {
        // Words like "make" (1 syllable), "love" (1 syllable)
        const result = await service.countSyllables('make')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data).toBe(1)
        }
      })

      it('should handle compound words', async () => {
        const result = await service.countSyllables('rainbow')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data).toBe(2)
        }
      })

      it('should be case-insensitive', async () => {
        const word = 'BEAUTIFUL'

        const result = await service.countSyllables(word)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data).toBe(3)
        }
      })

      it('should handle words with apostrophes', async () => {
        const result = await service.countSyllables("don't")

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data).toBeGreaterThan(0)
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for empty string', async () => {
        const result = await service.countSyllables('')

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('EMPTY_INPUT')
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
        }
      })

      it('should return error for whitespace-only input', async () => {
        const result = await service.countSyllables('   \n\t   ')

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('EMPTY_INPUT')
        }
      })

      it('should return error for non-word characters only', async () => {
        const result = await service.countSyllables('!!!!!@@@@@')

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('INVALID_TEXT')
          expect(result.error.message).toBeDefined()
        }
      })

      it('should return error when syllable counting fails', async () => {
        const result = await service.countSyllables('12345')

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('SYLLABLE_COUNT_FAILED')
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs = [
          '',
          '   ',
          '!!!!!',
          '12345',
          null as any,
          undefined as any
        ]

        for (const input of badInputs) {
          await expect(service.countSyllables(input)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const input = 'beautiful'

        const result = await service.countSyllables(input)

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

  // ===========================================
  // METHOD 3: getStressPattern()
  // ===========================================
  describe('getStressPattern() method', () => {
    describe('Success Cases', () => {
      it('should return stress pattern for simple line', async () => {
        const line = 'The cat sat on the mat'

        const result = await service.getStressPattern(line)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const pattern: StressPattern = result.data

          // Verify it's a string
          expect(typeof pattern).toBe('string')

          // Verify it uses x/ notation
          expect(pattern).toMatch(/^[x/\\?]+$/)

          // Should have at least some characters
          expect(pattern.length).toBeGreaterThan(0)
        }
      })

      it('should detect iambic pattern (x/)', async () => {
        const line = 'The CAT sat ON the MAT'

        const result = await service.getStressPattern(line)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const pattern = result.data
          expect(pattern).toMatch(/x\//)
        }
      })

      it('should detect trochaic pattern (/x)', async () => {
        const line = 'TYger TYger BURning BRIGHT'

        const result = await service.getStressPattern(line)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const pattern = result.data
          // Should have some stressed syllables
          expect(pattern).toContain('/')
        }
      })

      it('should handle longer lines', async () => {
        const line = 'The night descends upon the weary town as darkness falls'

        const result = await service.getStressPattern(line)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const pattern = result.data
          expect(pattern.length).toBeGreaterThan(10)
        }
      })

      it('should handle single word', async () => {
        const line = 'beautiful'

        const result = await service.getStressPattern(line)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.length).toBeGreaterThan(0)
        }
      })

      it('should handle lines with punctuation', async () => {
        const line = "Don't you know, it's true!"

        const result = await service.getStressPattern(line)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.length).toBeGreaterThan(0)
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for empty string', async () => {
        const result = await service.getStressPattern('')

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('EMPTY_INPUT')
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
        }
      })

      it('should return error for whitespace only', async () => {
        const result = await service.getStressPattern('   \n\t   ')

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('EMPTY_INPUT')
        }
      })

      it('should return error when stress analysis fails', async () => {
        const result = await service.getStressPattern('!!!!!@@@@@')

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('STRESS_ANALYSIS_FAILED')
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs = [
          '',
          '   ',
          '!!!!!',
          null as any,
          undefined as any
        ]

        for (const input of badInputs) {
          await expect(service.getStressPattern(input)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const input = 'The cat sat on the mat'

        const result = await service.getStressPattern(input)

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

  // ===========================================
  // METHOD 4: detectMeter()
  // ===========================================
  describe('detectMeter() method', () => {
    describe('Success Cases', () => {
      it('should detect meter in consistent lines', async () => {
        const lines = [
          'The CAT sat ON the MAT today',
          'She WALKED aLONG the STREET at NIGHT',
          'We TALKED aBOUT our DREAMS last WEEK'
        ]

        const result = await service.detectMeter(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const detection: MeterDetection = result.data

          // Verify all required fields
          expect(detection).toHaveProperty('meter')
          expect(detection).toHaveProperty('confidence')
          expect(detection).toHaveProperty('feetPerLine')
          expect(detection).toHaveProperty('pattern')
          expect(detection).toHaveProperty('consistency')

          // Verify meter type
          expect(typeof detection.meter).toBe('string')

          // Verify confidence (0-1 or 0-100 depending on contract)
          expect(detection.confidence).toBeGreaterThanOrEqual(0)

          // Verify feet per line
          expect(detection.feetPerLine).toBeGreaterThan(0)

          // Verify pattern
          expect(typeof detection.pattern).toBe('string')
          expect(detection.pattern).toMatch(/^[x/\\?]+$/)

          // Verify consistency score
          expect(detection.consistency).toBeGreaterThanOrEqual(0)
          expect(detection.consistency).toBeLessThanOrEqual(100)
        }
      })

      it('should detect iambic meter', async () => {
        const lines = [
          'x/x/x/x/',
          'x/x/x/x/'
        ]

        const result = await service.detectMeter(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // Meter type should be defined
          expect(result.data.meter).toBeDefined()
        }
      })

      it('should have low confidence for inconsistent meter', async () => {
        const lines = [
          'SHORT',
          'This is a much longer line with different rhythm',
          'CLASH CLASH CLASH'
        ]

        const result = await service.detectMeter(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // Confidence should be lower
          expect(result.data.confidence).toBeDefined()
        }
      })

      it('should handle single line', async () => {
        const lines = ['The cat sat on the mat today']

        const result = await service.detectMeter(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.meter).toBeDefined()
          expect(result.data.feetPerLine).toBeGreaterThan(0)
        }
      })

      it('should detect trochaic meter', async () => {
        const lines = [
          'TYger TYger BURning BRIGHT',
          'IN the FOrests OF the NIGHT'
        ]

        const result = await service.detectMeter(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.meter).toBeDefined()
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for empty array', async () => {
        const result = await service.detectMeter([])

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('EMPTY_INPUT')
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
        }
      })

      it('should return error for array with empty strings', async () => {
        const result = await service.detectMeter(['', '   '])

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('INVALID_TEXT')
        }
      })

      it('should return error when meter detection fails', async () => {
        const result = await service.detectMeter(['!!!!!@@@@@'])

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('METER_DETECTION_FAILED')
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs = [
          [],
          [''],
          ['!!!!!'],
          [null as any],
          [undefined as any]
        ]

        for (const input of badInputs) {
          await expect(service.detectMeter(input)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const input = ['The cat sat on the mat']

        const result = await service.detectMeter(input)

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
        const input = ['The cat sat on the mat']

        const result = await service.detectMeter(input)

        if (isSuccess(result)) {
          const data = result.data

          expect(() => {
            // @ts-expect-error - Testing readonly enforcement
            data.meter = 'changed'
          }).toThrow()
        }
      })
    })
  })

  // ===========================================
  // METHOD 5: analyzeFlow()
  // ===========================================
  describe('analyzeFlow() method', () => {
    describe('Success Cases', () => {
      it('should analyze flow for valid lines', async () => {
        const lines = [
          'The night descends upon the weary town',
          'As shadows dance and darkness settles down'
        ]

        const result = await service.analyzeFlow(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const flow: FlowAnalysis = result.data

          // Verify all required fields
          expect(flow).toHaveProperty('overallFlow')
          expect(flow).toHaveProperty('lineFlows')
          expect(flow).toHaveProperty('smoothness')
          expect(flow).toHaveProperty('naturalness')
          expect(flow).toHaveProperty('singability')
          expect(flow).toHaveProperty('issues')

          // Verify overall flow score
          expect(flow.overallFlow).toBeGreaterThanOrEqual(0)
          expect(flow.overallFlow).toBeLessThanOrEqual(100)

          // Verify line flows array
          expect(Array.isArray(flow.lineFlows)).toBe(true)
          expect(flow.lineFlows.length).toBe(2)
          flow.lineFlows.forEach(score => {
            expect(score).toBeGreaterThanOrEqual(0)
            expect(score).toBeLessThanOrEqual(100)
          })

          // Verify smoothness (0-1)
          expect(flow.smoothness).toBeGreaterThanOrEqual(0)
          expect(flow.smoothness).toBeLessThanOrEqual(1)

          // Verify naturalness (0-1)
          expect(flow.naturalness).toBeGreaterThanOrEqual(0)
          expect(flow.naturalness).toBeLessThanOrEqual(1)

          // Verify singability (0-1)
          expect(flow.singability).toBeGreaterThanOrEqual(0)
          expect(flow.singability).toBeLessThanOrEqual(1)

          // Verify issues array
          expect(Array.isArray(flow.issues)).toBe(true)
        }
      })

      it('should analyze flow against target meter', async () => {
        const lines = [
          'The CAT sat ON the MAT',
          'She WALKED aLONG the STREET'
        ]

        const result = await service.analyzeFlow(lines, 'iambic' as MeterType)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.overallFlow).toBeDefined()
          expect(result.data.issues).toBeDefined()
        }
      })

      it('should detect flow issues in choppy lines', async () => {
        const lines = [
          'CLASH CLASH STRESS STRESS',
          'weak weak weak weak weak'
        ]

        const result = await service.analyzeFlow(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // Might have lower flow scores
          expect(result.data.overallFlow).toBeDefined()

          // Might have issues
          if (result.data.issues.length > 0) {
            const issue = result.data.issues[0]
            expect(issue).toHaveProperty('severity')
            expect(issue).toHaveProperty('type')
            expect(issue).toHaveProperty('message')
          }
        }
      })

      it('should handle single line', async () => {
        const lines = ['The cat sat on the mat']

        const result = await service.analyzeFlow(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.lineFlows.length).toBe(1)
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for empty array', async () => {
        const result = await service.analyzeFlow([])

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('EMPTY_INPUT')
        }
      })

      it('should return error for invalid text', async () => {
        const result = await service.analyzeFlow(['!!!!!@@@@@'])

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('ANALYSIS_FAILED')
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs = [
          [],
          [''],
          ['!!!!!'],
          [null as any]
        ]

        for (const input of badInputs) {
          await expect(service.analyzeFlow(input)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const input = ['The cat sat on the mat']

        const result = await service.analyzeFlow(input)

        expect(result).toHaveProperty('success')

        if (result.success) {
          expect(result).toHaveProperty('data')
        } else {
          expect(result).toHaveProperty('error')
        }
      })

      it('should preserve readonly semantics', async () => {
        const input = ['The cat sat on the mat']

        const result = await service.analyzeFlow(input)

        if (isSuccess(result)) {
          expect(() => {
            // @ts-expect-error - Testing readonly enforcement
            result.data.smoothness = 0.5
          }).toThrow()
        }
      })
    })
  })

  // ===========================================
  // METHOD 6: suggestRhythmImprovements()
  // ===========================================
  describe('suggestRhythmImprovements() method', () => {
    describe('Success Cases', () => {
      it('should suggest improvements for lines with issues', async () => {
        const lines = [
          'CLASH CLASH STRESS',
          'weak weak weak weak'
        ]

        const result = await service.suggestRhythmImprovements(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const suggestions: readonly RhythmSuggestion[] = result.data

          // Verify it's an array
          expect(Array.isArray(suggestions)).toBe(true)

          // If there are suggestions, verify structure
          if (suggestions.length > 0) {
            const suggestion = suggestions[0]
            if (!suggestion) return

            expect(suggestion).toHaveProperty('lineIndex')
            expect(suggestion).toHaveProperty('issue')
            expect(suggestion).toHaveProperty('currentLine')
            expect(suggestion).toHaveProperty('alternatives')
            expect(suggestion).toHaveProperty('explanation')

            // Verify line index
            expect(suggestion.lineIndex).toBeGreaterThanOrEqual(0)

            // Verify issue type
            expect(typeof suggestion.issue).toBe('string')

            // Verify current line
            expect(typeof suggestion.currentLine).toBe('string')

            // Verify alternatives
            expect(Array.isArray(suggestion.alternatives)).toBe(true)

            // Verify explanation
            expect(typeof suggestion.explanation).toBe('string')
            expect(suggestion.explanation.length).toBeGreaterThan(0)
          }
        }
      })

      it('should suggest improvements matching target meter', async () => {
        const lines = [
          'This line does not match',
          'the pattern we want here'
        ]

        const result = await service.suggestRhythmImprovements(lines, 'iambic' as MeterType)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(Array.isArray(result.data)).toBe(true)
        }
      })

      it('should return empty array for perfect rhythm', async () => {
        const lines = [
          'The CAT sat ON the MAT',
          'She WALKED aLONG the STREET'
        ]

        const result = await service.suggestRhythmImprovements(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // Might return empty array if rhythm is good
          expect(Array.isArray(result.data)).toBe(true)
        }
      })

      it('should handle single line', async () => {
        const lines = ['STRESS STRESS CLASH CLASH']

        const result = await service.suggestRhythmImprovements(lines)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(Array.isArray(result.data)).toBe(true)
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for empty array', async () => {
        const result = await service.suggestRhythmImprovements([])

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('EMPTY_INPUT')
        }
      })

      it('should return error for invalid text', async () => {
        const result = await service.suggestRhythmImprovements(['!!!!!'])

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('ANALYSIS_FAILED')
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs = [
          [],
          [''],
          [null as any]
        ]

        for (const input of badInputs) {
          await expect(service.suggestRhythmImprovements(input)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const input = ['The cat sat on the mat']

        const result = await service.suggestRhythmImprovements(input)

        expect(result).toHaveProperty('success')

        if (result.success) {
          expect(result).toHaveProperty('data')
        } else {
          expect(result).toHaveProperty('error')
        }
      })

      it('should preserve readonly semantics', async () => {
        const input = ['STRESS CLASH']

        const result = await service.suggestRhythmImprovements(input)

        if (isSuccess(result)) {
          expect(() => {
            // @ts-expect-error - Testing readonly enforcement
            result.data = []
          }).toThrow()
        }
      })
    })
  })

  // ===========================================
  // METHOD 7: matchesSyllableCount()
  // ===========================================
  describe('matchesSyllableCount() method', () => {
    describe('Success Cases', () => {
      it('should return true when syllable count matches', async () => {
        const line = 'The cat sat on the mat'  // 6 syllables
        const targetCount = 6

        const result = await service.matchesSyllableCount(line, targetCount)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(typeof result.data).toBe('boolean')
          expect(result.data).toBe(true)
        }
      })

      it('should return false when syllable count does not match', async () => {
        const line = 'The cat'  // 2 syllables
        const targetCount = 10

        const result = await service.matchesSyllableCount(line, targetCount)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data).toBe(false)
        }
      })

      it('should handle zero target count', async () => {
        const line = ''
        const targetCount = 0

        const result = await service.matchesSyllableCount(line, targetCount)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(typeof result.data).toBe('boolean')
        }
      })

      it('should handle long lines', async () => {
        const line = 'The night descends upon the weary town as darkness falls upon the land'
        const targetCount = 18

        const result = await service.matchesSyllableCount(line, targetCount)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(typeof result.data).toBe('boolean')
        }
      })

      it('should handle lines with punctuation', async () => {
        const line = "Don't you know, it's true!"
        const targetCount = 5

        const result = await service.matchesSyllableCount(line, targetCount)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(typeof result.data).toBe('boolean')
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for empty string', async () => {
        const result = await service.matchesSyllableCount('', 5)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('EMPTY_INPUT')
        }
      })

      it('should return error for negative target count', async () => {
        const result = await service.matchesSyllableCount('The cat', -5)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('INVALID_TEXT')
        }
      })

      it('should return error when syllable counting fails', async () => {
        const result = await service.matchesSyllableCount('!!!!!', 5)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('SYLLABLE_COUNT_FAILED')
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs = [
          { line: '', count: 5 },
          { line: '!!!!!', count: 5 },
          { line: 'test', count: -5 },
          { line: null as any, count: 5 },
          { line: 'test', count: null as any }
        ]

        for (const input of badInputs) {
          await expect(service.matchesSyllableCount(input.line, input.count)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const line = 'The cat sat on the mat'
        const targetCount = 6

        const result = await service.matchesSyllableCount(line, targetCount)

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
    describe('stressesToPattern()', () => {
      it('should convert stress array to pattern string', () => {
        const stresses: Stress[] = [
          Stress.UNSTRESSED,
          Stress.STRESSED,
          Stress.UNSTRESSED,
          Stress.STRESSED
        ]

        const pattern = stressesToPattern(stresses)

        expect(pattern).toBe('x/x/')
      })

      it('should handle secondary stress', () => {
        const stresses: Stress[] = [
          Stress.STRESSED,
          Stress.SECONDARY,
          Stress.UNSTRESSED
        ]

        const pattern = stressesToPattern(stresses)

        expect(pattern).toBe('/\\x')
      })

      it('should handle ambiguous stress', () => {
        const stresses: Stress[] = [
          Stress.UNSTRESSED,
          Stress.AMBIGUOUS,
          Stress.STRESSED
        ]

        const pattern = stressesToPattern(stresses)

        expect(pattern).toBe('x?/')
      })

      it('should handle empty array', () => {
        const pattern = stressesToPattern([])

        expect(pattern).toBe('')
      })
    })

    describe('patternToStresses()', () => {
      it('should convert pattern string to stress array', () => {
        const pattern = 'x/x/' as StressPattern

        const stresses = patternToStresses(pattern)

        expect(stresses).toEqual([
          Stress.UNSTRESSED,
          Stress.STRESSED,
          Stress.UNSTRESSED,
          Stress.STRESSED
        ])
      })

      it('should handle secondary stress', () => {
        const pattern = '/\\x' as StressPattern

        const stresses = patternToStresses(pattern)

        expect(stresses).toEqual([
          Stress.STRESSED,
          Stress.SECONDARY,
          Stress.UNSTRESSED
        ])
      })

      it('should handle ambiguous stress', () => {
        const pattern = 'x?/' as StressPattern

        const stresses = patternToStresses(pattern)

        expect(stresses).toEqual([
          Stress.UNSTRESSED,
          Stress.AMBIGUOUS,
          Stress.STRESSED
        ])
      })

      it('should handle invalid characters as ambiguous', () => {
        const pattern = 'xZx' as StressPattern

        const stresses = patternToStresses(pattern)

        expect(stresses[1]).toBe(Stress.AMBIGUOUS)
      })

      it('should handle empty string', () => {
        const stresses = patternToStresses('' as StressPattern)

        expect(stresses).toEqual([])
      })
    })

    describe('Round-trip conversion', () => {
      it('should maintain pattern through round-trip conversion', () => {
        const originalPattern = 'x/x/x/' as StressPattern

        const stresses = patternToStresses(originalPattern)
        const convertedPattern = stressesToPattern(stresses)

        expect(convertedPattern).toBe(originalPattern)
      })

      it('should maintain stresses through round-trip conversion', () => {
        const originalStresses: Stress[] = [
          Stress.UNSTRESSED,
          Stress.STRESSED,
          Stress.SECONDARY,
          Stress.AMBIGUOUS
        ]

        const pattern = stressesToPattern(originalStresses)
        const convertedStresses = patternToStresses(pattern as StressPattern)

        expect(convertedStresses).toEqual(originalStresses)
      })
    })
  })
})
