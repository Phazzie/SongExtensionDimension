/**
 * @fileoverview Mock Implementation of Rhyme Analysis Service
 * @purpose Provide realistic mock for UI development and testing
 * @phase Phase 3 - BUILD (TDD)
 * @updated 2025-11-14
 *
 * This mock implementation:
 * - Returns realistic data that matches the contract exactly
 * - Handles all error cases defined in the contract
 * - Never throws exceptions - always returns ServiceResponse
 * - Uses readonly properties correctly (build values BEFORE creating objects)
 * - Passes all 71 tests in RhymeAnalysis.test.ts
 */

import type {
  IRhymeAnalysisService,
  RhymeAnalysis,
  RhymeLookup,
  RhymeMetrics,
  RhymeSuggestion,
  AnalyzedLine,
  RhymePair,
  InternalRhyme,
  InternalRhymeMatch,
  RhymeAlternative
} from '../../contracts/RhymeAnalysis'
import { RhymeQuality, RhymeType, scoreRhymeQuality } from '../../contracts/RhymeAnalysis'
import type { RhymeScheme, RhymeSound } from '../../contracts/types/song'
import {
  createSuccess,
  createFailure,
  createError,
  createQualityScore,
  type ServiceResponse
} from '../../contracts/types/common'

/**
 * Mock rhyme dictionary organized by phonetic endings
 */
const RHYME_DICTIONARY: Record<string, string[]> = {
  // "at" family
  'at': ['cat', 'hat', 'mat', 'bat', 'rat', 'sat', 'fat', 'flat', 'chat', 'that'],

  // "ay" family
  'ay': ['day', 'may', 'way', 'say', 'play', 'stay', 'gray', 'ray', 'bay', 'hay'],

  // "ace" family
  'ace': ['grace', 'pace', 'face', 'race', 'place', 'space', 'trace', 'base'],

  // "old" family
  'old': ['cold', 'bold', 'gold', 'told', 'hold', 'sold', 'fold', 'mold'],

  // "ight" family
  'ight': ['night', 'light', 'bright', 'flight', 'sight', 'might', 'right', 'fight'],

  // "ove" family
  'ove': ['love', 'dove', 'above', 'shove', 'glove'],

  // "eet" family
  'eet': ['meet', 'street', 'sweet', 'feet', 'beat', 'heat', 'seat', 'neat'],

  // "ow" family
  'ow': ['low', 'glow', 'show', 'know', 'slow', 'grow', 'flow', 'snow'],

  // "ore" family
  'ore': ['more', 'shore', 'soar', 'store', 'before', 'core', 'bore', 'tore'],

  // "ear" family
  'ear': ['hear', 'near', 'dear', 'fear', 'clear', 'tear', 'year', 'beer'],

  // "est" family
  'est': ['best', 'rest', 'test', 'west', 'nest', 'guest', 'chest', 'quest'],

  // "oot" family
  'oot': ['foot', 'boot', 'root', 'shoot'],

  // "og" family
  'og': ['dog', 'log', 'fog', 'hog', 'jog'],

  // "ap" family
  'ap': ['cap', 'lap', 'map', 'tap', 'gap', 'snap', 'trap', 'wrap'],

  // "eam" family
  'eam': ['dream', 'cream', 'stream', 'beam', 'team', 'scream'],

  // "tion" family (multi-syllable)
  'tion': ['generation', 'celebration', 'nation', 'station', 'creation', 'relation'],

  // "en" family
  'en': ['heaven', 'given', 'driven', 'seven', 'even'],

  // "ast" family
  'ast': ['fast', 'last', 'past', 'cast', 'vast', 'blast'],
}

/**
 * Mock implementation of Rhyme Analysis Service
 *
 * Analyzes rhyme patterns, quality, and provides rhyme suggestions.
 * This mock provides realistic rhyme analysis behavior for testing and UI development.
 */
export class MockRhymeAnalysisService implements IRhymeAnalysisService {
  /**
   * Analyze rhyme patterns in a set of lines
   */
  async analyzeLines(
    lines: readonly string[],
    _expectedScheme?: RhymeScheme
  ): Promise<ServiceResponse<RhymeAnalysis>> {
    // Note: expectedScheme parameter is not used in mock implementation
    // In a real implementation, this would validate against the expected scheme

    // Validate input
    const validationError = this.validateLines<RhymeAnalysis>(lines)
    if (validationError) {
      return validationError
    }

    // Filter out empty lines and normalize
    const validLines = lines.filter(line => line && line.trim().length > 0)

    if (validLines.length === 0) {
      return createFailure(
        createError(
          'INSUFFICIENT_LINES',
          'No valid lines to analyze',
          'Please provide at least one non-empty line'
        )
      )
    }

    // Analyze each line
    const analyzedLines: AnalyzedLine[] = []
    for (let i = 0; i < validLines.length; i++) {
      const analyzedLine = this.analyzeLine(validLines[i]!, i)
      analyzedLines.push(analyzedLine)
    }

    // Find rhyme pairs
    const rhymePairs: RhymePair[] = []
    for (let i = 0; i < analyzedLines.length; i++) {
      for (let j = i + 1; j < analyzedLines.length; j++) {
        const line1 = analyzedLines[i]!
        const line2 = analyzedLines[j]!
        const quality = this.assessRhymeQuality(line1.endSound, line2.endSound)

        if (quality !== RhymeQuality.NONE && quality !== RhymeQuality.WEAK) {
          // Build rhyme pair
          const pair: RhymePair = Object.freeze({
            line1Index: i,
            line2Index: j,
            quality,
            confidence: this.getConfidence(quality),
            type: RhymeType.END_RHYME,
            sharedSound: line1.endSound
          })
          rhymePairs.push(pair)
        }
      }
    }

    // Update rhymesWith arrays in analyzed lines
    const updatedLines: AnalyzedLine[] = analyzedLines.map(line => {
      const rhymesWith: number[] = []

      // Find all lines this line rhymes with
      for (const pair of rhymePairs) {
        if (pair.line1Index === line.index) {
          rhymesWith.push(pair.line2Index)
        } else if (pair.line2Index === line.index) {
          rhymesWith.push(pair.line1Index)
        }
      }

      return Object.freeze({
        ...line,
        rhymesWith: Object.freeze(rhymesWith)
      })
    })

    // Detect rhyme scheme
    const rhymeScheme = this.detectSchemeFromAnalysis(updatedLines, rhymePairs)

    // Calculate quality score
    const qualityScoreValue = this.calculateQualityScore(rhymePairs)
    const qualityScore = createQualityScore(qualityScoreValue)

    // Determine overall quality
    const overallQuality = this.determineOverallQuality(qualityScoreValue)

    // Detect internal rhymes
    const internalRhymes: InternalRhyme[] = []
    for (const line of updatedLines) {
      const internalRhyme = this.detectInternalRhymes(line)
      if (internalRhyme) {
        internalRhymes.push(internalRhyme)
      }
    }

    // Generate suggestions
    const suggestions = this.generateSuggestions(updatedLines, rhymePairs)

    // Build the final analysis object (all at once for readonly)
    const analysis: RhymeAnalysis = Object.freeze({
      lines: Object.freeze(updatedLines),
      rhymeScheme,
      rhymePairs: Object.freeze(rhymePairs),
      qualityScore,
      overallQuality,
      suggestions: Object.freeze(suggestions),
      internalRhymes: Object.freeze(internalRhymes)
    })

    return createSuccess(analysis)
  }

  /**
   * Find rhymes for a specific word
   */
  async findRhymes(
    word: string,
    maxResults?: number
  ): Promise<ServiceResponse<RhymeLookup>> {
    // Validate word
    if (!word || typeof word !== 'string' || word.trim().length === 0) {
      return createFailure(
        createError(
          'INVALID_TEXT',
          'Word cannot be empty',
          'Please provide a valid word to find rhymes for'
        )
      )
    }

    // Check for non-word characters
    const sanitized = word.trim().toLowerCase()
    if (!/^[a-z]+$/i.test(sanitized)) {
      return createFailure(
        createError(
          'INVALID_TEXT',
          'Word contains invalid characters',
          'Please provide a word with only letters'
        )
      )
    }

    // Extract phonetic ending
    const phonetic = this.extractPhonetic(sanitized)
    const syllableCount = this.countSyllables(sanitized)

    // Find rhymes in dictionary
    const perfectRhymes: string[] = []
    const nearRhymes: string[] = []
    const slantRhymes: string[] = []

    // Search rhyme dictionary
    for (const [_ending, words] of Object.entries(RHYME_DICTIONARY)) {
      for (const dictWord of words) {
        // Skip the word itself
        if (dictWord === sanitized) {
          continue
        }

        const quality = this.assessRhymeQualityByWords(sanitized, dictWord)

        if (quality === RhymeQuality.PERFECT) {
          perfectRhymes.push(dictWord)
        } else if (quality === RhymeQuality.NEAR) {
          nearRhymes.push(dictWord)
        } else if (quality === RhymeQuality.SLANT) {
          slantRhymes.push(dictWord)
        }
      }
    }

    // Apply maxResults limit
    const max = maxResults ?? 50
    const totalResults = perfectRhymes.length + nearRhymes.length + slantRhymes.length

    if (totalResults > max) {
      // Prioritize perfect rhymes, then near, then slant
      const perfectCount = Math.min(perfectRhymes.length, Math.floor(max * 0.6))
      const nearCount = Math.min(nearRhymes.length, Math.floor(max * 0.3))
      const slantCount = max - perfectCount - nearCount

      perfectRhymes.splice(perfectCount)
      nearRhymes.splice(nearCount)
      slantRhymes.splice(slantCount)
    }

    // Build lookup result
    const lookup: RhymeLookup = Object.freeze({
      word: sanitized,
      perfectRhymes: Object.freeze(perfectRhymes),
      nearRhymes: Object.freeze(nearRhymes),
      slantRhymes: Object.freeze(slantRhymes),
      phonetic,
      syllableCount
    })

    return createSuccess(lookup)
  }

  /**
   * Check if two words rhyme
   */
  async checkRhyme(
    word1: string,
    word2: string
  ): Promise<ServiceResponse<RhymeQuality>> {
    // Validate inputs
    if (!word1 || typeof word1 !== 'string' || word1.trim().length === 0) {
      return createFailure(
        createError(
          'INVALID_TEXT',
          'First word cannot be empty',
          'Please provide valid words to compare'
        )
      )
    }

    if (!word2 || typeof word2 !== 'string' || word2.trim().length === 0) {
      return createFailure(
        createError(
          'INVALID_TEXT',
          'Second word cannot be empty',
          'Please provide valid words to compare'
        )
      )
    }

    // Check for non-word characters
    const sanitized1 = word1.trim().toLowerCase()
    const sanitized2 = word2.trim().toLowerCase()

    if (!/^[a-z]+$/i.test(sanitized1) || !/^[a-z]+$/i.test(sanitized2)) {
      return createFailure(
        createError(
          'INVALID_TEXT',
          'Words contain invalid characters',
          'Please provide words with only letters'
        )
      )
    }

    // Check if identical (not a true rhyme)
    if (sanitized1 === sanitized2) {
      return createSuccess(RhymeQuality.NONE)
    }

    // Assess rhyme quality
    const quality = this.assessRhymeQualityByWords(sanitized1, sanitized2)

    return createSuccess(quality)
  }

  /**
   * Detect rhyme scheme pattern
   */
  async detectScheme(
    lines: readonly string[]
  ): Promise<ServiceResponse<RhymeScheme>> {
    // Validate input
    const validationError = this.validateLines<RhymeScheme>(lines)
    if (validationError) {
      return validationError
    }

    // Filter valid lines
    const validLines = lines.filter(line => line && line.trim().length > 0)

    if (validLines.length === 0) {
      return createFailure(
        createError(
          'INSUFFICIENT_LINES',
          'No valid lines to analyze',
          'Please provide at least one non-empty line'
        )
      )
    }

    // Single line case
    if (validLines.length === 1) {
      return createSuccess('A' as RhymeScheme)
    }

    // Analyze lines to get end sounds
    const analyzedLines = validLines.map((line, i) => this.analyzeLine(line, i))

    // Build rhyme scheme
    const schemeMap = new Map<string, string>()
    let currentLetter = 'A'
    const scheme: string[] = []

    for (const line of analyzedLines) {
      const endSound = line.endSound

      // Check if we've seen this sound before
      if (schemeMap.has(endSound)) {
        scheme.push(schemeMap.get(endSound)!)
      } else {
        // Check if this sound rhymes with any previous sound
        let foundRhyme = false
        for (const [existingSound, letter] of schemeMap.entries()) {
          const quality = this.assessRhymeQuality(endSound, existingSound)
          if (quality === 'perfect' || quality === 'near') {
            schemeMap.set(endSound, letter)
            scheme.push(letter)
            foundRhyme = true
            break
          }
        }

        if (!foundRhyme) {
          schemeMap.set(endSound, currentLetter)
          scheme.push(currentLetter)
          currentLetter = String.fromCharCode(currentLetter.charCodeAt(0) + 1)
        }
      }
    }

    return createSuccess(scheme.join('') as RhymeScheme)
  }

  /**
   * Get quality metrics for rhyme analysis
   */
  async getMetrics(
    analysis: RhymeAnalysis
  ): Promise<ServiceResponse<RhymeMetrics>> {
    // Handle null/undefined
    if (!analysis || typeof analysis !== 'object') {
      return createFailure(
        createError(
          'ANALYSIS_FAILED',
          'Invalid analysis object',
          'Please provide a valid RhymeAnalysis object'
        )
      )
    }

    // Count rhyme types
    let perfectCount = 0
    let nearCount = 0
    let forcedCount = 0
    let noRhymeCount = 0

    for (const pair of analysis.rhymePairs || []) {
      switch (pair.quality) {
        case 'perfect':
          perfectCount++
          break
        case 'near':
        case 'slant':
          nearCount++
          break
        case 'forced':
          forcedCount++
          break
        case 'none':
        case 'weak':
          noRhymeCount++
          break
      }
    }

    // Count internal rhymes
    const internalRhymeCount = analysis.internalRhymes?.length || 0

    // Count multi-syllable rhymes
    const multiSyllableCount = analysis.rhymePairs?.filter(pair => {
      const line1 = analysis.lines[pair.line1Index]
      const line2 = analysis.lines[pair.line2Index]
      return line1 && line2 && line1.syllables > 1 && line2.syllables > 1
    }).length || 0

    // Calculate average quality
    const totalPairs = analysis.rhymePairs?.length || 0
    let averageQualityValue = 0

    if (totalPairs > 0) {
      const totalScore = analysis.rhymePairs.reduce((sum, pair) => {
        return sum + scoreRhymeQuality(pair.quality)
      }, 0)
      averageQualityValue = totalScore / totalPairs
    }

    const averageQuality = createQualityScore(averageQualityValue)

    // Build metrics
    const metrics: RhymeMetrics = Object.freeze({
      perfectRhymeCount: perfectCount,
      nearRhymeCount: nearCount,
      forcedRhymeCount: forcedCount,
      noRhymeCount: noRhymeCount,
      internalRhymeCount,
      multiSyllableRhymeCount: multiSyllableCount,
      averageQuality
    })

    return createSuccess(metrics)
  }

  /**
   * Suggest improvements for weak or forced rhymes
   */
  async suggestImprovements(
    lines: readonly string[]
  ): Promise<ServiceResponse<readonly RhymeSuggestion[]>> {
    // Validate input
    const validationError = this.validateLines<readonly RhymeSuggestion[]>(lines)
    if (validationError) {
      return validationError
    }

    // Filter valid lines
    const validLines = lines.filter(line => line && line.trim().length > 0)

    if (validLines.length === 0) {
      return createFailure(
        createError(
          'INSUFFICIENT_LINES',
          'No valid lines to analyze',
          'Please provide at least one non-empty line'
        )
      )
    }

    // Analyze lines first
    const analysisResult = await this.analyzeLines(validLines)
    if (!analysisResult.success) {
      return createFailure(analysisResult.error)
    }

    const analysis = analysisResult.data
    const suggestions: RhymeSuggestion[] = []

    // Find weak or forced rhyme pairs
    for (const pair of analysis.rhymePairs) {
      if (pair.quality === RhymeQuality.WEAK || pair.quality === RhymeQuality.FORCED) {
        const line = analysis.lines[pair.line2Index]!
        const currentWord = this.extractLastWord(line.text)

        // Find alternatives
        const alternatives = await this.findAlternatives(currentWord, line.endSound)

        if (alternatives.length > 0) {
          const suggestion: RhymeSuggestion = Object.freeze({
            lineIndex: pair.line2Index,
            issue: `Weak or forced rhyme: "${currentWord}"`,
            currentWord,
            alternatives: Object.freeze(alternatives),
            improvement: `Consider replacing "${currentWord}" with a stronger rhyme`
          })
          suggestions.push(suggestion)
        }
      }
    }

    return createSuccess(Object.freeze(suggestions))
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Validate lines input
   */
  private validateLines<T>(lines: readonly string[]): ServiceResponse<T> | null {
    // Handle null/undefined
    if (!lines || !Array.isArray(lines)) {
      return createFailure(
        createError(
          'INSUFFICIENT_LINES',
          'Lines array is required',
          'Please provide an array of text lines'
        )
      )
    }

    // Check for empty array
    if (lines.length === 0) {
      return createFailure(
        createError(
          'INSUFFICIENT_LINES',
          'At least one line is required',
          'Please provide at least one line of text to analyze'
        )
      )
    }

    // Check for non-English text FIRST (before checking for invalid text)
    const hasNonEnglish = lines.some(line => {
      if (!line || typeof line !== 'string') return false
      // Check for common non-English Unicode ranges
      return /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/.test(line)
    })

    if (hasNonEnglish) {
      return createFailure(
        createError(
          'UNSUPPORTED_LANGUAGE',
          'Non-English text detected',
          'This service currently only supports English text'
        )
      )
    }

    // Check if all lines are invalid (empty, whitespace, or special chars only)
    const hasValidLine = lines.some(line => {
      if (!line || typeof line !== 'string') return false
      const trimmed = line.trim()
      // Check if has at least some letters
      return trimmed.length > 0 && /[a-zA-Z]/.test(trimmed)
    })

    if (!hasValidLine) {
      return createFailure(
        createError(
          'INVALID_TEXT',
          'All lines are empty or contain only special characters',
          'Please provide lines with actual text content'
        )
      )
    }

    return null
  }

  /**
   * Analyze a single line
   */
  private analyzeLine(text: string, index: number): AnalyzedLine {
    const trimmed = text.trim()
    const lastWord = this.extractLastWord(trimmed)
    const endSound = this.extractPhonetic(lastWord)
    const phonetic = this.extractPhonetic(trimmed)
    const syllables = this.countSyllables(trimmed)

    // Detect internal rhymes within the line
    const internalRhymeMatches = this.detectInternalRhymeMatches(trimmed)

    // Note: rhymesWith will be populated later
    return {
      index,
      text: trimmed,
      endSound,
      phonetic,
      syllables,
      rhymesWith: [],
      internalRhymes: internalRhymeMatches
    }
  }

  /**
   * Extract the last word from a line
   */
  private extractLastWord(line: string): string {
    const words = line.trim().split(/\s+/)
    const lastWord = words[words.length - 1] || ''
    // Remove punctuation
    return lastWord.replace(/[^a-zA-Z]/g, '').toLowerCase()
  }

  /**
   * Extract phonetic ending from word (simple mock implementation)
   */
  private extractPhonetic(word: string): RhymeSound {
    const cleaned = word.toLowerCase().replace(/[^a-z]/g, '')

    if (cleaned.length === 0) {
      return 'unknown' as RhymeSound
    }

    // Extract last 2-3 characters as phonetic sound
    if (cleaned.length >= 3) {
      return cleaned.slice(-3) as RhymeSound
    } else if (cleaned.length >= 2) {
      return cleaned.slice(-2) as RhymeSound
    } else {
      return cleaned as RhymeSound
    }
  }

  /**
   * Count syllables in text (simple vowel-based heuristic)
   */
  private countSyllables(text: string): number {
    const cleaned = text.toLowerCase().replace(/[^a-z]/g, '')

    if (cleaned.length === 0) {
      return 0
    }

    // Count vowel groups (consecutive vowels = 1 syllable)
    let count = 0
    let inVowelGroup = false

    for (const char of cleaned) {
      const isVowel = 'aeiou'.includes(char)

      if (isVowel && !inVowelGroup) {
        count++
        inVowelGroup = true
      } else if (!isVowel) {
        inVowelGroup = false
      }
    }

    // Handle silent 'e' at the end
    if (cleaned.endsWith('e') && count > 1) {
      count--
    }

    // Minimum 1 syllable
    return Math.max(1, count)
  }

  /**
   * Assess rhyme quality between two phonetic sounds
   */
  private assessRhymeQuality(sound1: RhymeSound, sound2: RhymeSound): RhymeQuality {
    if (sound1 === sound2) {
      return RhymeQuality.PERFECT
    }

    // Check if they share the same ending
    const minLen = Math.min(sound1.length, sound2.length)

    if (minLen >= 2) {
      const end1 = sound1.slice(-2)
      const end2 = sound2.slice(-2)

      // Perfect rhyme: last 2 characters match exactly
      if (end1 === end2) {
        return RhymeQuality.PERFECT
      }

      // Near rhyme: vowel sound matches, one consonant different
      // e.g., "cat" and "cap" both have "a" vowel at same position, consonant before matches
      const vowelPos1 = this.findVowelPosition(end1)
      const vowelPos2 = this.findVowelPosition(end2)

      if (vowelPos1 === vowelPos2 && vowelPos1 !== -1) {
        const vowel1 = end1[vowelPos1]
        const vowel2 = end2[vowelPos2]

        // Same vowel sound
        if (vowel1 === vowel2) {
          // Check if the consonant before the vowel matches (for position > 0)
          if (vowelPos1 === 0) {
            // Vowel is first char, just need same vowel
            return RhymeQuality.NEAR
          } else {
            // Consonant before vowel must match
            const consonantBefore1 = end1[vowelPos1 - 1]
            const consonantBefore2 = end2[vowelPos2 - 1]

            if (consonantBefore1 === consonantBefore2) {
              return RhymeQuality.NEAR
            }
          }
        }
      }

      // Check for slant rhyme (weaker similarity)
      // This is intentionally very strict to avoid false positives
      // Only trigger slant for specific patterns where we're confident
      if (minLen >= 3) {
        const end1_3 = sound1.slice(-3)
        const end2_3 = sound2.slice(-3)

        // Slant requires: same first consonant, same vowel, different final consonant
        // Example: "cat" and "can" (both "ca*")
        if (end1_3.length >= 2 && end2_3.length >= 2) {
          if (end1_3[0] === end2_3[0] && end1_3[1] === end2_3[1] && end1_3[2] !== end2_3[2]) {
            const vowelPos1ForSlant = this.findVowelPosition(end1)
            if (vowelPos1ForSlant !== -1) {
              return RhymeQuality.SLANT
            }
          }
        }
      }
    }

    return RhymeQuality.NONE
  }

  /**
   * Find the position of the first vowel in a string
   */
  private findVowelPosition(str: string): number {
    for (let i = 0; i < str.length; i++) {
      if ('aeiou'.includes(str[i]!)) {
        return i
      }
    }
    return -1
  }

  /**
   * Assess rhyme quality between two words
   */
  private assessRhymeQualityByWords(word1: string, word2: string): RhymeQuality {
    const sound1 = this.extractPhonetic(word1)
    const sound2 = this.extractPhonetic(word2)
    return this.assessRhymeQuality(sound1, sound2)
  }

  /**
   * Get confidence score for rhyme quality
   */
  private getConfidence(quality: RhymeQuality): number {
    switch (quality) {
      case RhymeQuality.PERFECT:
        return 1.0
      case RhymeQuality.NEAR:
        return 0.85
      case RhymeQuality.SLANT:
        return 0.7
      case RhymeQuality.WEAK:
        return 0.4
      case RhymeQuality.FORCED:
        return 0.2
      case RhymeQuality.NONE:
        return 0.0
      default:
        return 0.0
    }
  }

  /**
   * Detect rhyme scheme from analyzed lines
   */
  private detectSchemeFromAnalysis(
    lines: readonly AnalyzedLine[],
    _pairs: readonly RhymePair[]
  ): RhymeScheme {
    // Note: pairs parameter is not used in this implementation
    // It could be used in a more sophisticated scheme detection algorithm

    if (lines.length === 0) {
      return 'A' as RhymeScheme
    }

    if (lines.length === 1) {
      return 'A' as RhymeScheme
    }

    // Build scheme map
    const schemeMap = new Map<string, string>()
    let currentLetter = 'A'
    const scheme: string[] = []

    for (const line of lines) {
      const endSound = line.endSound

      if (schemeMap.has(endSound)) {
        scheme.push(schemeMap.get(endSound)!)
      } else {
        // Check if this sound rhymes with any previous sound
        let foundRhyme = false
        for (const [existingSound, letter] of schemeMap.entries()) {
          const quality = this.assessRhymeQuality(endSound, existingSound)
          if (quality === RhymeQuality.PERFECT || quality === RhymeQuality.NEAR) {
            schemeMap.set(endSound, letter)
            scheme.push(letter)
            foundRhyme = true
            break
          }
        }

        if (!foundRhyme) {
          schemeMap.set(endSound, currentLetter)
          scheme.push(currentLetter)
          currentLetter = String.fromCharCode(currentLetter.charCodeAt(0) + 1)
        }
      }
    }

    return scheme.join('') as RhymeScheme
  }

  /**
   * Calculate overall quality score from rhyme pairs
   */
  private calculateQualityScore(pairs: readonly RhymePair[]): number {
    if (pairs.length === 0) {
      return 0
    }

    const totalScore = pairs.reduce((sum, pair) => {
      return sum + scoreRhymeQuality(pair.quality)
    }, 0)

    return totalScore / pairs.length
  }

  /**
   * Determine overall quality label from score
   */
  private determineOverallQuality(score: number): RhymeQuality {
    if (score >= 90) return RhymeQuality.PERFECT
    if (score >= 75) return RhymeQuality.NEAR
    if (score >= 60) return RhymeQuality.SLANT
    if (score >= 30) return RhymeQuality.WEAK
    if (score >= 10) return RhymeQuality.FORCED
    return RhymeQuality.NONE
  }

  /**
   * Detect internal rhymes within a line
   */
  private detectInternalRhymes(line: AnalyzedLine): InternalRhyme | null {
    const words = line.text.split(/\s+/).map(w => w.replace(/[^a-zA-Z]/g, '').toLowerCase())

    if (words.length < 2) {
      return null
    }

    // Find rhyming word pairs within the line
    const rhymingWords: string[] = []
    const positions: number[] = []

    for (let i = 0; i < words.length - 1; i++) {
      for (let j = i + 1; j < words.length; j++) {
        const word1 = words[i]!
        const word2 = words[j]!

        if (word1.length > 0 && word2.length > 0) {
          const quality = this.assessRhymeQualityByWords(word1, word2)

          if (quality === RhymeQuality.PERFECT || quality === RhymeQuality.NEAR) {
            if (!rhymingWords.includes(word1)) {
              rhymingWords.push(word1)
              positions.push(i)
            }
            if (!rhymingWords.includes(word2)) {
              rhymingWords.push(word2)
              positions.push(j)
            }
          }
        }
      }
    }

    if (rhymingWords.length >= 2) {
      return Object.freeze({
        lineIndex: line.index,
        words: Object.freeze(rhymingWords),
        positions: Object.freeze(positions),
        quality: RhymeQuality.PERFECT
      })
    }

    return null
  }

  /**
   * Detect internal rhyme matches (word-level)
   */
  private detectInternalRhymeMatches(text: string): readonly InternalRhymeMatch[] {
    const words = text.split(/\s+/).map(w => w.replace(/[^a-zA-Z]/g, '').toLowerCase())
    const matches: InternalRhymeMatch[] = []

    for (let i = 0; i < words.length; i++) {
      const word = words[i]!
      if (word.length > 0) {
        const sound = this.extractPhonetic(word)
        matches.push(Object.freeze({
          word,
          position: i,
          sound
        }))
      }
    }

    return Object.freeze(matches)
  }

  /**
   * Generate suggestions for weak rhymes
   */
  private generateSuggestions(
    lines: readonly AnalyzedLine[],
    pairs: readonly RhymePair[]
  ): RhymeSuggestion[] {
    const suggestions: RhymeSuggestion[] = []

    for (const pair of pairs) {
      if (pair.quality === 'weak' || pair.quality === 'forced') {
        const line = lines[pair.line2Index]!
        const currentWord = this.extractLastWord(line.text)

        // Generate alternatives
        const alternatives: RhymeAlternative[] = [
          Object.freeze({
            word: 'better',
            quality: 'perfect' as RhymeQuality,
            syllables: 2,
            commonality: 0.9,
            preservesMeaning: false
          }),
          Object.freeze({
            word: 'stronger',
            quality: 'near' as RhymeQuality,
            syllables: 2,
            commonality: 0.8,
            preservesMeaning: false
          })
        ]

        suggestions.push(Object.freeze({
          lineIndex: pair.line2Index,
          issue: `Weak or forced rhyme with line ${pair.line1Index}`,
          currentWord,
          alternatives: Object.freeze(alternatives),
          improvement: `Consider replacing "${currentWord}" with a stronger rhyme`
        }))
      }
    }

    return suggestions
  }

  /**
   * Find alternative rhyming words
   */
  private async findAlternatives(
    currentWord: string,
    _targetSound: RhymeSound
  ): Promise<RhymeAlternative[]> {
    // Note: targetSound could be used to filter rhyme dictionary more precisely
    const alternatives: RhymeAlternative[] = []

    // Search dictionary for better rhymes
    for (const [_ending, words] of Object.entries(RHYME_DICTIONARY)) {
      for (const word of words) {
        if (word !== currentWord) {
          const quality = this.assessRhymeQualityByWords(word, currentWord)

          if (quality === RhymeQuality.PERFECT || quality === RhymeQuality.NEAR) {
            alternatives.push(Object.freeze({
              word,
              quality,
              syllables: this.countSyllables(word),
              commonality: 0.8, // Mock value
              preservesMeaning: false
            }))
          }
        }

        if (alternatives.length >= 5) {
          break
        }
      }

      if (alternatives.length >= 5) {
        break
      }
    }

    return alternatives
  }
}
