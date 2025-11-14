/**
 * @fileoverview Contract Tests for Input Validation Service
 * @purpose Ensure any implementation of IInputValidationService matches the contract exactly
 *
 * TEST-DRIVEN DEVELOPMENT APPROACH:
 * These tests are written BEFORE the mock implementation.
 * The mock implementation should be written to make these tests pass.
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import type {
  IInputValidationService,
  RawPromptInput,
  ValidationResult
} from '../../src/contracts/InputValidation'
import { isSuccess, isFailure } from '../../src/contracts/types/common'
import { MockInputValidationService } from '../../src/services/mock/MockInputValidationService'

/**
 * NOTE: This test suite is designed to work with ANY implementation of IInputValidationService.
 * During Phase 3 (BUILD), import MockInputValidationService.
 * During Phase 5 (IMPLEMENT), import RealInputValidationService.
 * The tests should pass for both implementations.
 */
describe('IInputValidationService Contract Tests', () => {
  let service: IInputValidationService

  beforeEach(() => {
    service = new MockInputValidationService()
  })

  describe('validate() method', () => {
    describe('Success Cases', () => {
      it('should return success for valid input with all fields', async () => {
        const input: RawPromptInput = {
          prompt: 'Write a heartfelt song about overcoming loss and finding hope',
          context: {
            genre: 'rock',
            mood: 'melancholic',
            theme: 'healing',
            referenceArtist: 'Coldplay',
            targetAudience: 'adults'
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
          }
        }

        const result = await service.validate(input)

        // Verify ServiceResponse shape
        expect(result).toHaveProperty('success')
        expect(isSuccess(result)).toBe(true)

        if (isSuccess(result)) {
          const data: ValidationResult = result.data

          // Verify all required fields exist
          expect(data).toHaveProperty('validatedPrompt')
          expect(data).toHaveProperty('warnings')
          expect(data).toHaveProperty('modifications')

          // Verify validatedPrompt structure
          expect(data.validatedPrompt.prompt).toBeDefined()
          expect(typeof data.validatedPrompt.prompt).toBe('string')
          expect(data.validatedPrompt.prompt.length).toBeGreaterThan(0)
          expect(data.validatedPrompt.sanitized).toBe(true)

          // Verify context was preserved
          expect(data.validatedPrompt.context?.genre).toBe('rock')
          expect(data.validatedPrompt.context?.mood).toBe('melancholic')

          // Verify constraints were preserved
          expect(data.validatedPrompt.constraints?.verseCount).toBe(3)
          expect(data.validatedPrompt.constraints?.rhymeScheme).toBe('ABAB')

          // Verify arrays are defined (even if empty)
          expect(Array.isArray(data.warnings)).toBe(true)
          expect(Array.isArray(data.modifications)).toBe(true)

          // For valid input, should have minimal warnings
          expect(data.warnings.length).toBeLessThanOrEqual(2)
        }
      })

      it('should return success for minimal valid input (prompt only)', async () => {
        const input: RawPromptInput = {
          prompt: 'Write a song about summer dreams'
        }

        const result = await service.validate(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.validatedPrompt.prompt).toBe('Write a song about summer dreams')
          expect(result.data.validatedPrompt.sanitized).toBe(true)
          expect(result.data.warnings).toBeInstanceOf(Array)
          expect(result.data.modifications).toBeInstanceOf(Array)
        }
      })

      it('should sanitize HTML and script tags in prompt', async () => {
        const input: RawPromptInput = {
          prompt: 'Write a song about <script>alert("xss")</script>love and <b>hope</b>'
        }

        const result = await service.validate(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // Should remove HTML/script tags
          expect(result.data.validatedPrompt.prompt).not.toContain('<script>')
          expect(result.data.validatedPrompt.prompt).not.toContain('<b>')
          expect(result.data.validatedPrompt.prompt).toContain('love')
          expect(result.data.validatedPrompt.prompt).toContain('hope')
          expect(result.data.modifications.length).toBeGreaterThan(0)
        }
      })

      it('should warn about unsupported genre and provide fallback', async () => {
        const input: RawPromptInput = {
          prompt: 'Write a song about the ocean',
          context: {
            genre: 'dubstep-metal-fusion-experimental' // Not in supported list
          }
        }

        const result = await service.validate(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // Should have a warning about unsupported genre
          expect(result.data.warnings.length).toBeGreaterThan(0)
          const genreWarning = result.data.warnings.find(w => w.field === 'genre')
          expect(genreWarning).toBeDefined()
          expect(genreWarning?.suggestion).toBeDefined()

          // Should provide a fallback genre
          expect(result.data.validatedPrompt.context?.genre).toBeDefined()
          expect(result.data.modifications.length).toBeGreaterThan(0)
        }
      })

      it('should warn about verse count exceeding maximum', async () => {
        const input: RawPromptInput = {
          prompt: 'Write an epic song',
          constraints: {
            verseCount: 20 // Exceeds typical max
          }
        }

        const result = await service.validate(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // Should have warning about verse count
          const verseWarning = result.data.warnings.find(w => w.field === 'verseCount')
          expect(verseWarning).toBeDefined()

          // Should have capped the verse count
          expect(result.data.validatedPrompt.constraints?.verseCount).toBeLessThanOrEqual(10)
          expect(result.data.modifications.length).toBeGreaterThan(0)
        }
      })

      it('should handle prompt with extra whitespace', async () => {
        const input: RawPromptInput = {
          prompt: '   Write   a   song   about    nature   '
        }

        const result = await service.validate(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // Should normalize whitespace
          expect(result.data.validatedPrompt.prompt).not.toMatch(/\s{2,}/)
          expect(result.data.validatedPrompt.prompt).toBe('Write a song about nature')
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for empty prompt', async () => {
        const input: RawPromptInput = {
          prompt: ''
        }

        const result = await service.validate(input)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('EMPTY_PROMPT')
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
          expect(result.error.message.length).toBeGreaterThan(0)
          expect(result.error.suggestion.length).toBeGreaterThan(0)
        }
      })

      it('should return error for whitespace-only prompt', async () => {
        const input: RawPromptInput = {
          prompt: '     \n\t   '
        }

        const result = await service.validate(input)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('EMPTY_PROMPT')
        }
      })

      it('should return error for prompt that is too short', async () => {
        const input: RawPromptInput = {
          prompt: 'song' // Only 4 characters
        }

        const result = await service.validate(input)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('PROMPT_TOO_SHORT')
          expect(result.error.message).toContain('10')
          expect(result.error.suggestion).toBeDefined()
        }
      })

      it('should return error for prompt that is too long', async () => {
        const input: RawPromptInput = {
          prompt: 'a'.repeat(10001) // Exceeds max length
        }

        const result = await service.validate(input)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('PROMPT_TOO_LONG')
          expect(result.error.message).toContain('10000')
        }
      })

      it('should return error for conflicting constraints', async () => {
        const input: RawPromptInput = {
          prompt: 'Write a song',
          constraints: {
            verseCount: 5,
            linesPerVerse: 8,
            targetLength: 10 // 5 * 8 = 40 lines, but target is only 10
          }
        }

        const result = await service.validate(input)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('CONFLICTING_CONSTRAINTS')
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs: RawPromptInput[] = [
          { prompt: '' },
          { prompt: 'a'.repeat(20000) },
          // @ts-expect-error - Testing runtime behavior
          { prompt: null },
          // @ts-expect-error - Testing runtime behavior
          { prompt: undefined },
          // @ts-expect-error - Testing runtime behavior
          {},
        ]

        for (const input of badInputs) {
          await expect(service.validate(input as any)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const input: RawPromptInput = {
          prompt: 'Write a song about stars'
        }

        const result = await service.validate(input)

        // Must have success property
        expect(result).toHaveProperty('success')
        expect(typeof result.success).toBe('boolean')

        // If success, must have data; if failure, must have error
        if (result.success) {
          expect(result).toHaveProperty('data')
          expect(result).not.toHaveProperty('error')
        } else {
          expect(result).toHaveProperty('error')
          expect(result).not.toHaveProperty('data')
        }
      })

      it('should preserve readonly semantics on output', async () => {
        const input: RawPromptInput = {
          prompt: 'Write a song about mountains'
        }

        const result = await service.validate(input)

        if (isSuccess(result)) {
          const validated = result.data.validatedPrompt

          // TypeScript should prevent these at compile time
          // These will fail at runtime if readonly is properly enforced
          expect(() => {
            // @ts-expect-error - Testing readonly enforcement
            validated.prompt = 'changed'
          }).toThrow()

          expect(() => {
            // @ts-expect-error - Testing readonly enforcement
            validated.context = { genre: 'rock' }
          }).toThrow()
        }
      })
    })
  })

  describe('isValid() method', () => {
    it('should return true for valid prompt string', async () => {
      const result = await service.isValid('This is a valid prompt for songwriting')

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data).toBe(true)
      }
    })

    it('should return false for empty prompt', async () => {
      const result = await service.isValid('')

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data).toBe(false)
      }
    })

    it('should return false for too-short prompt', async () => {
      const result = await service.isValid('short')

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data).toBe(false)
      }
    })

    it('should never throw', async () => {
      await expect(service.isValid('')).resolves.toBeDefined()
      // @ts-expect-error - Testing runtime behavior
      await expect(service.isValid(null)).resolves.toBeDefined()
      // @ts-expect-error - Testing runtime behavior
      await expect(service.isValid(undefined)).resolves.toBeDefined()
    })
  })

  describe('sanitize() method', () => {
    it('should remove HTML tags', async () => {
      const result = await service.sanitize('<p>Hello <b>world</b></p>')

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data).not.toContain('<')
        expect(result.data).not.toContain('>')
        expect(result.data).toContain('Hello')
        expect(result.data).toContain('world')
      }
    })

    it('should remove script tags and content', async () => {
      const result = await service.sanitize('<script>alert("xss")</script>Safe text')

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data).not.toContain('<script>')
        expect(result.data).not.toContain('alert')
        expect(result.data).toContain('Safe text')
      }
    })

    it('should remove control characters', async () => {
      const result = await service.sanitize('test\x00\x01\x1F\x7Fstring')

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data).toBe('teststring')
      }
    })

    it('should normalize whitespace', async () => {
      const result = await service.sanitize('test    multiple   spaces')

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data).toBe('test multiple spaces')
      }
    })

    it('should trim leading and trailing whitespace', async () => {
      const result = await service.sanitize('   text with spaces   ')

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data).toBe('text with spaces')
      }
    })

    it('should return empty string for empty input', async () => {
      const result = await service.sanitize('')

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data).toBe('')
      }
    })

    it('should handle null/undefined gracefully', async () => {
      // @ts-expect-error - Testing runtime behavior
      await expect(service.sanitize(null)).resolves.toBeDefined()
      // @ts-expect-error - Testing runtime behavior
      await expect(service.sanitize(undefined)).resolves.toBeDefined()
    })
  })

  describe('validateGenre() method', () => {
    it('should return true for supported genres', async () => {
      const supportedGenres = ['rock', 'pop', 'country', 'hip-hop', 'r&b', 'electronic', 'folk']

      for (const genre of supportedGenres) {
        const result = await service.validateGenre(genre)
        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data).toBe(true)
        }
      }
    })

    it('should return false for unsupported genres', async () => {
      const unsupportedGenres = ['dubstep-metal', 'invalid', 'unknown-genre']

      for (const genre of unsupportedGenres) {
        const result = await service.validateGenre(genre)
        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data).toBe(false)
        }
      }
    })

    it('should be case-insensitive', async () => {
      const result1 = await service.validateGenre('ROCK')
      const result2 = await service.validateGenre('Rock')
      const result3 = await service.validateGenre('rock')

      expect(isSuccess(result1)).toBe(true)
      expect(isSuccess(result2)).toBe(true)
      expect(isSuccess(result3)).toBe(true)

      if (isSuccess(result1) && isSuccess(result2) && isSuccess(result3)) {
        expect(result1.data).toBe(true)
        expect(result2.data).toBe(true)
        expect(result3.data).toBe(true)
      }
    })
  })

  describe('validateConstraints() method', () => {
    it('should return empty array for valid constraints', async () => {
      const result = await service.validateConstraints({
        verseCount: 3,
        linesPerVerse: 4,
        chorusCount: 1,
        linesPerChorus: 4
      })

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true)
        expect(result.data.length).toBe(0)
      }
    })

    it('should warn about verse count too high', async () => {
      const result = await service.validateConstraints({
        verseCount: 15
      })

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data.length).toBeGreaterThan(0)
        const warning = result.data.find(w => w.field === 'verseCount')
        expect(warning).toBeDefined()
        expect(warning?.message).toBeDefined()
        expect(warning?.suggestion).toBeDefined()
      }
    })

    it('should warn about conflicting targetLength', async () => {
      const result = await service.validateConstraints({
        verseCount: 5,
        linesPerVerse: 8,
        targetLength: 10 // 5*8=40 but target is 10
      })

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data.length).toBeGreaterThan(0)
        const warning = result.data.find(w => w.field === 'targetLength')
        expect(warning).toBeDefined()
      }
    })

    it('should handle empty constraints', async () => {
      const result = await service.validateConstraints({})

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(Array.isArray(result.data)).toBe(true)
      }
    })
  })
})
