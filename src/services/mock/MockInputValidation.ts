/**
 * @fileoverview Mock Input Validation Service
 * @purpose Realistic mock implementation of IInputValidationService
 * @dataFlow Returns deterministic but realistic validation data
 * @testing Used for UI development and contract testing
 */

import type { ServiceResponse } from '../../contracts/types/common'
import {
  type IInputValidationService,
  type RawPromptInput,
  type ValidationResult,
  type ValidatedPrompt,
  type PromptContext,
  type ValidationWarning,
  InputValidationErrorCode,
  createPromptId,
  isSupportedGenre,
  isSupportedMood,
  SUPPORTED_GENRES,
  DEFAULT_VALIDATION_CONSTRAINTS
} from '../../contracts/InputValidation'
import { createSuccess, createFailure, createError } from '../../contracts/types/common'
import type { StyleConfig, StructureConstraints } from '../../contracts/types/song'

/**
 * Mock Input Validation Service
 *
 * Provides realistic validation behavior for development and testing.
 * Returns deterministic results based on input characteristics.
 */
export class MockInputValidationService implements IInputValidationService {
  /**
   * Validate and sanitize user input
   */
  async validate(input: RawPromptInput): Promise<ServiceResponse<ValidationResult>> {
    // Validate prompt is not empty
    if (!input.prompt || input.prompt.trim().length === 0) {
      return createFailure(
        createError(
          InputValidationErrorCode.EMPTY_PROMPT,
          'Prompt cannot be empty',
          'Please provide a description for your song (e.g., "Write a song about heartbreak")'
        )
      )
    }

    // Validate prompt length
    const trimmedPrompt = input.prompt.trim()
    if (trimmedPrompt.length < DEFAULT_VALIDATION_CONSTRAINTS.minPromptLength) {
      return createFailure(
        createError(
          InputValidationErrorCode.PROMPT_TOO_SHORT,
          `Prompt must be at least ${DEFAULT_VALIDATION_CONSTRAINTS.minPromptLength} characters`,
          `Your prompt is ${trimmedPrompt.length} characters. Please provide more detail.`
        )
      )
    }

    if (trimmedPrompt.length > DEFAULT_VALIDATION_CONSTRAINTS.maxPromptLength) {
      return createFailure(
        createError(
          InputValidationErrorCode.PROMPT_TOO_LONG,
          `Prompt must be less than ${DEFAULT_VALIDATION_CONSTRAINTS.maxPromptLength} characters`,
          `Your prompt is ${trimmedPrompt.length} characters. Please shorten it.`
        )
      )
    }

    // Build validated context
    const warnings: ValidationWarning[] = []
    const modifications: string[] = []

    const validatedContext: PromptContext = {
      genre: input.context?.genre,
      mood: input.context?.mood,
      theme: input.context?.theme,
      referenceArtist: input.context?.referenceArtist,
      targetAudience: input.context?.targetAudience
    }

    // Validate genre
    if (input.context?.genre && !isSupportedGenre(input.context.genre)) {
      warnings.push({
        field: 'genre',
        message: `Genre "${input.context.genre}" is not in supported list`,
        suggestion: `Try one of: ${SUPPORTED_GENRES.slice(0, 5).join(', ')}, etc.`
      })
      modifications.push(`Genre changed from "${input.context.genre}" to "alternative"`)
      validatedContext.genre = 'alternative'
    }

    // Validate mood
    if (input.context?.mood && !isSupportedMood(input.context.mood)) {
      warnings.push({
        field: 'mood',
        message: `Mood "${input.context.mood}" is not in supported list`,
        suggestion: 'Using default mood based on prompt'
      })
      modifications.push(`Mood "${input.context.mood}" not recognized, using default`)
      validatedContext.mood = 'melancholic' // Default
    }

    // Validate constraints
    const validatedConstraints: StructureConstraints = {
      verseCount: input.constraints?.verseCount ?? 3,
      linesPerVerse: input.constraints?.linesPerVerse ?? 4,
      chorusCount: input.constraints?.chorusCount ?? 1,
      linesPerChorus: input.constraints?.linesPerChorus ?? 4,
      includeBridge: input.constraints?.includeBridge ?? true,
      includeIntro: input.constraints?.includeIntro ?? false,
      includeOutro: input.constraints?.includeOutro ?? false,
      rhymeScheme: input.constraints?.rhymeScheme ?? 'ABAB'
    }

    // Check for conflicting constraints
    if (validatedConstraints.verseCount && validatedConstraints.verseCount > DEFAULT_VALIDATION_CONSTRAINTS.maxVerseCount) {
      warnings.push({
        field: 'verseCount',
        message: `Verse count ${validatedConstraints.verseCount} exceeds maximum ${DEFAULT_VALIDATION_CONSTRAINTS.maxVerseCount}`,
        suggestion: `Reduced to ${DEFAULT_VALIDATION_CONSTRAINTS.maxVerseCount} verses`
      })
      validatedConstraints.verseCount = DEFAULT_VALIDATION_CONSTRAINTS.maxVerseCount
      modifications.push(`Verse count reduced to ${DEFAULT_VALIDATION_CONSTRAINTS.maxVerseCount}`)
    }

    // Validate style
    const validatedStyle: StyleConfig = {
      genre: input.style?.genre ?? validatedContext.genre,
      mood: input.style?.mood ?? validatedContext.mood,
      tempo: input.style?.tempo,
      vocalStyle: input.style?.vocalStyle,
      harmony: input.style?.harmony,
      effects: input.style?.effects
    }

    // Create validated prompt
    const validatedPrompt: ValidatedPrompt = {
      id: createPromptId(),
      prompt: trimmedPrompt,
      context: validatedContext,
      constraints: validatedConstraints,
      style: validatedStyle,
      sanitized: true,
      validatedAt: new Date()
    }

    const result: ValidationResult = {
      validatedPrompt,
      warnings,
      modifications
    }

    return createSuccess(result)
  }

  /**
   * Check if a prompt is valid without full validation
   */
  async isValid(prompt: string): Promise<ServiceResponse<boolean>> {
    if (!prompt || prompt.trim().length === 0) {
      return createSuccess(false)
    }

    const trimmed = prompt.trim()
    const valid =
      trimmed.length >= DEFAULT_VALIDATION_CONSTRAINTS.minPromptLength &&
      trimmed.length <= DEFAULT_VALIDATION_CONSTRAINTS.maxPromptLength

    return createSuccess(valid)
  }

  /**
   * Sanitize text content
   */
  async sanitize(text: string): Promise<ServiceResponse<string>> {
    if (!text) {
      return createSuccess('')
    }

    // Remove potentially unsafe characters
    let sanitized = text
      .replace(/[<>]/g, '') // Remove HTML brackets
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .trim()

    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ')

    return createSuccess(sanitized)
  }

  /**
   * Validate genre against supported list
   */
  async validateGenre(genre: string): Promise<ServiceResponse<boolean>> {
    return createSuccess(isSupportedGenre(genre))
  }

  /**
   * Validate constraints for logical consistency
   */
  async validateConstraints(
    constraints: StructureConstraints
  ): Promise<ServiceResponse<readonly ValidationWarning[]>> {
    const warnings: ValidationWarning[] = []

    // Check verse count
    if (constraints.verseCount) {
      if (constraints.verseCount < DEFAULT_VALIDATION_CONSTRAINTS.minVerseCount) {
        warnings.push({
          field: 'verseCount',
          message: `Verse count ${constraints.verseCount} is below minimum ${DEFAULT_VALIDATION_CONSTRAINTS.minVerseCount}`,
          suggestion: `Increase to at least ${DEFAULT_VALIDATION_CONSTRAINTS.minVerseCount} verses`
        })
      }
      if (constraints.verseCount > DEFAULT_VALIDATION_CONSTRAINTS.maxVerseCount) {
        warnings.push({
          field: 'verseCount',
          message: `Verse count ${constraints.verseCount} exceeds maximum ${DEFAULT_VALIDATION_CONSTRAINTS.maxVerseCount}`,
          suggestion: `Reduce to ${DEFAULT_VALIDATION_CONSTRAINTS.maxVerseCount} or fewer verses`
        })
      }
    }

    // Check lines per verse
    if (constraints.linesPerVerse) {
      if (constraints.linesPerVerse < DEFAULT_VALIDATION_CONSTRAINTS.minLinesPerVerse) {
        warnings.push({
          field: 'linesPerVerse',
          message: `Lines per verse ${constraints.linesPerVerse} is below minimum ${DEFAULT_VALIDATION_CONSTRAINTS.minLinesPerVerse}`,
          suggestion: `Increase to at least ${DEFAULT_VALIDATION_CONSTRAINTS.minLinesPerVerse} lines`
        })
      }
      if (constraints.linesPerVerse > DEFAULT_VALIDATION_CONSTRAINTS.maxLinesPerVerse) {
        warnings.push({
          field: 'linesPerVerse',
          message: `Lines per verse ${constraints.linesPerVerse} exceeds maximum ${DEFAULT_VALIDATION_CONSTRAINTS.maxLinesPerVerse}`,
          suggestion: `Reduce to ${DEFAULT_VALIDATION_CONSTRAINTS.maxLinesPerVerse} or fewer lines`
        })
      }
    }

    // Check for conflicting constraints
    if (constraints.targetLength && constraints.verseCount && constraints.linesPerVerse) {
      const estimatedLength = constraints.verseCount * constraints.linesPerVerse
      if (Math.abs(estimatedLength - constraints.targetLength) > constraints.targetLength * 0.5) {
        warnings.push({
          field: 'targetLength',
          message: 'Target length conflicts with verse structure',
          suggestion: `Estimated ${estimatedLength} lines vs target ${constraints.targetLength} lines`
        })
      }
    }

    return createSuccess(warnings)
  }
}
