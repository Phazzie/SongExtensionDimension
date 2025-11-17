/**
 * @fileoverview Real Implementation of Rhyme Analysis Service (AI-Powered)
 * @purpose Use AI to analyze rhyme patterns, quality, and provide suggestions
 * @phase Phase 5 - IMPLEMENT (Real Services)
 * @created 2025-11-17
 *
 * This real implementation:
 * - Uses AI (Gemini/Grok/Claude) instead of phonetic dictionaries
 * - Analyzes rhyme quality contextually
 * - Provides intelligent rhyme suggestions
 * - Detects subtle rhyme patterns (slant, near, internal)
 * - Returns data that matches the contract exactly
 * - Never throws exceptions - always returns ServiceResponse
 * - Uses readonly properties correctly
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
  type ServiceResponse,
  isSuccess
} from '../../contracts/types/common'
import type { IModelProvider, GenerationRequest } from '../../contracts/providers/IModelProvider'

/**
 * AI response format for rhyme analysis
 */
interface AIRhymeAnalysisResponse {
  rhymeScheme: string
  overallScheme: 'consistent' | 'mixed' | 'free'
  quality: 'perfect' | 'good' | 'acceptable' | 'poor'
  patterns: Array<{
    lineIndex: number
    rhymeGroup: string
    rhymesWith: number[]
    rhymeQuality: string
    endWord: string
    endSound: string
    phonetic: string
    syllables: number
    internalRhymeMatches?: Array<{
      word: string
      position: number
      sound: string
    }>
  }>
  issues: Array<{
    type: string
    lines: number[]
    description: string
    suggestion: string
  }>
  alternativeRhymes: Record<string, string[]>
  internalRhymes?: Array<{
    lineIndex: number
    words: string[]
    positions: number[]
    quality: string
  }>
}

/**
 * AI response format for rhyme lookup
 */
interface AIRhymeLookupResponse {
  word: string
  phonetic: string
  syllableCount: number
  perfectRhymes: string[]
  nearRhymes: string[]
  slantRhymes: string[]
}

/**
 * AI response format for rhyme quality check
 */
interface AIRhymeQualityResponse {
  quality: 'perfect' | 'near' | 'slant' | 'weak' | 'forced' | 'none'
  confidence: number
  reason: string
}

/**
 * Real Rhyme Analysis Service - AI-Powered
 *
 * Uses AI models to analyze rhyme patterns, detect quality issues,
 * and provide intelligent suggestions for improvement.
 */
export class RealRhymeAnalysisService implements IRhymeAnalysisService {
  private readonly modelProvider: IModelProvider
  private readonly systemPrompt: string

  /**
   * Create a new real rhyme analysis service
   *
   * @param modelProvider - AI model provider for analysis
   */
  constructor(modelProvider: IModelProvider) {
    this.modelProvider = modelProvider

    // System prompt for rhyme analysis
    this.systemPrompt = `You are a rhyme analysis expert specializing in songwriting and poetry.

ROLE: Analyze rhyme patterns in lyrics with high accuracy.

CAPABILITIES:
1. Detect rhyme schemes (ABAB, AABB, etc.)
2. Identify rhyme quality (perfect, near, slant, weak, forced, none)
3. Find internal rhymes within lines
4. Suggest alternative rhymes
5. Provide phonetic analysis
6. Count syllables accurately

QUALITY LEVELS:
- perfect: Identical ending sounds (cat/hat, day/way)
- near: Very similar sounds (cat/cap, day/bay)
- slant: Consonance or assonance (cat/cut, day/die)
- weak: Barely rhymes (cat/kit, day/doe)
- forced: Awkward word choice just for rhyme
- none: No rhyme detected

OUTPUT FORMAT: Always respond with valid JSON only. No markdown, no explanations.

IMPORTANT:
- Be strict about rhyme quality
- Detect subtle slant rhymes
- Consider stress patterns
- Flag forced rhymes (unnatural word choices)
- Provide practical alternatives
- Count syllables accurately (handle silent 'e', vowel groups)
`
  }

  /**
   * Analyze rhyme patterns in a set of lines
   */
  async analyzeLines(
    lines: readonly string[],
    expectedScheme?: RhymeScheme
  ): Promise<ServiceResponse<RhymeAnalysis>> {
    // Validate input
    const validationError = this.validateLines<RhymeAnalysis>(lines)
    if (validationError) {
      return validationError
    }

    // Filter out empty lines
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

    // Build user prompt
    const userPrompt = this.buildAnalysisPrompt(validLines, expectedScheme)

    // Call AI model
    const request: GenerationRequest = {
      systemPrompt: this.systemPrompt,
      userPrompt,
      temperature: 0.3, // Low temperature for analytical tasks
      maxTokens: 2000
    }

    const aiResponse = await this.modelProvider.generate(request)

    if (!isSuccess(aiResponse)) {
      return createFailure(
        createError(
          'ANALYSIS_FAILED',
          'AI analysis failed',
          'Please try again or check your API key',
          aiResponse.error.message
        )
      )
    }

    // Parse AI response
    let aiData: AIRhymeAnalysisResponse
    try {
      aiData = this.parseAnalysisResponse(aiResponse.data.content)
    } catch (error) {
      return createFailure(
        createError(
          'ANALYSIS_FAILED',
          'Failed to parse AI response',
          'Please try again',
          error instanceof Error ? error.message : 'Unknown parsing error'
        )
      )
    }

    // Transform AI data to contract format
    const analysis = this.transformToRhymeAnalysis(aiData, validLines)

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

    // Build user prompt
    const max = maxResults ?? 50
    const userPrompt = `Find rhymes for the word "${sanitized}".

Provide:
1. Phonetic representation
2. Syllable count
3. Perfect rhymes (up to ${Math.floor(max * 0.6)} words)
4. Near rhymes (up to ${Math.floor(max * 0.3)} words)
5. Slant rhymes (up to ${max - Math.floor(max * 0.6) - Math.floor(max * 0.3)} words)

Output as JSON:
{
  "word": "${sanitized}",
  "phonetic": "...",
  "syllableCount": N,
  "perfectRhymes": ["word1", "word2", ...],
  "nearRhymes": ["word1", "word2", ...],
  "slantRhymes": ["word1", "word2", ...]
}`

    // Call AI model
    const request: GenerationRequest = {
      systemPrompt: this.systemPrompt,
      userPrompt,
      temperature: 0.3,
      maxTokens: 1500
    }

    const aiResponse = await this.modelProvider.generate(request)

    if (!isSuccess(aiResponse)) {
      return createFailure(
        createError(
          'DICTIONARY_LOOKUP_FAILED',
          'Failed to find rhymes',
          'Please try again',
          aiResponse.error.message
        )
      )
    }

    // Parse AI response
    let aiData: AIRhymeLookupResponse
    try {
      aiData = this.parseJSON<AIRhymeLookupResponse>(aiResponse.data.content)
    } catch (error) {
      return createFailure(
        createError(
          'DICTIONARY_LOOKUP_FAILED',
          'Failed to parse rhyme results',
          'Please try again',
          error instanceof Error ? error.message : 'Unknown parsing error'
        )
      )
    }

    // Transform to contract format
    const lookup: RhymeLookup = Object.freeze({
      word: sanitized,
      perfectRhymes: Object.freeze(aiData.perfectRhymes || []),
      nearRhymes: Object.freeze(aiData.nearRhymes || []),
      slantRhymes: Object.freeze(aiData.slantRhymes || []),
      phonetic: aiData.phonetic,
      syllableCount: aiData.syllableCount
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

    // Check if identical
    if (sanitized1 === sanitized2) {
      return createSuccess(RhymeQuality.NONE)
    }

    // Build user prompt
    const userPrompt = `Check if "${sanitized1}" and "${sanitized2}" rhyme.

Analyze:
1. Phonetic similarity
2. Stress patterns
3. Rhyme quality (perfect/near/slant/weak/forced/none)

Output as JSON:
{
  "quality": "perfect|near|slant|weak|forced|none",
  "confidence": 0.0-1.0,
  "reason": "explanation"
}`

    // Call AI model
    const request: GenerationRequest = {
      systemPrompt: this.systemPrompt,
      userPrompt,
      temperature: 0.3,
      maxTokens: 300
    }

    const aiResponse = await this.modelProvider.generate(request)

    if (!isSuccess(aiResponse)) {
      return createFailure(
        createError(
          'PHONETIC_ANALYSIS_FAILED',
          'Failed to check rhyme',
          'Please try again',
          aiResponse.error.message
        )
      )
    }

    // Parse AI response
    let aiData: AIRhymeQualityResponse
    try {
      aiData = this.parseJSON<AIRhymeQualityResponse>(aiResponse.data.content)
    } catch (error) {
      return createFailure(
        createError(
          'PHONETIC_ANALYSIS_FAILED',
          'Failed to parse rhyme quality',
          'Please try again',
          error instanceof Error ? error.message : 'Unknown parsing error'
        )
      )
    }

    // Map AI quality to RhymeQuality enum
    const quality = this.mapToRhymeQuality(aiData.quality)

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

    // Build user prompt
    const userPrompt = `Detect the rhyme scheme for these lines:

${validLines.map((line, i) => `${i + 1}. ${line}`).join('\n')}

Analyze the rhyme pattern and return ONLY the scheme (e.g., "ABAB", "AABB", "ABCABC").

Output as JSON:
{
  "rhymeScheme": "..."
}`

    // Call AI model
    const request: GenerationRequest = {
      systemPrompt: this.systemPrompt,
      userPrompt,
      temperature: 0.3,
      maxTokens: 200
    }

    const aiResponse = await this.modelProvider.generate(request)

    if (!isSuccess(aiResponse)) {
      return createFailure(
        createError(
          'ANALYSIS_FAILED',
          'Failed to detect rhyme scheme',
          'Please try again',
          aiResponse.error.message
        )
      )
    }

    // Parse AI response
    let aiData: { rhymeScheme: string }
    try {
      aiData = this.parseJSON<{ rhymeScheme: string }>(aiResponse.data.content)
    } catch (error) {
      return createFailure(
        createError(
          'ANALYSIS_FAILED',
          'Failed to parse rhyme scheme',
          'Please try again',
          error instanceof Error ? error.message : 'Unknown parsing error'
        )
      )
    }

    return createSuccess(aiData.rhymeScheme as RhymeScheme)
  }

  /**
   * Get quality metrics for rhyme analysis
   */
  async getMetrics(
    analysis: RhymeAnalysis
  ): Promise<ServiceResponse<RhymeMetrics>> {
    // Validate input
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
        case RhymeQuality.PERFECT:
          perfectCount++
          break
        case RhymeQuality.NEAR:
        case RhymeQuality.SLANT:
          nearCount++
          break
        case RhymeQuality.FORCED:
          forcedCount++
          break
        case RhymeQuality.NONE:
        case RhymeQuality.WEAK:
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

    // First analyze the lines
    const analysisResult = await this.analyzeLines(validLines)
    if (!isSuccess(analysisResult)) {
      return createFailure(analysisResult.error)
    }

    const analysis = analysisResult.data
    const suggestions: RhymeSuggestion[] = []

    // Find weak or forced rhyme pairs
    for (const pair of analysis.rhymePairs) {
      if (pair.quality === RhymeQuality.WEAK || pair.quality === RhymeQuality.FORCED) {
        const line = analysis.lines[pair.line2Index]
        if (!line) continue

        const currentWord = this.extractLastWord(line.text)

        // Get alternatives from AI
        const alternativesResult = await this.findAlternatives(
          currentWord,
          line.endSound,
          validLines[pair.line1Index] || ''
        )

        if (isSuccess(alternativesResult)) {
          const alternatives = alternativesResult.data

          if (alternatives.length > 0) {
            const suggestion: RhymeSuggestion = Object.freeze({
              lineIndex: pair.line2Index,
              issue: `${pair.quality === RhymeQuality.WEAK ? 'Weak' : 'Forced'} rhyme: "${currentWord}"`,
              currentWord,
              alternatives: Object.freeze(alternatives),
              improvement: `Consider replacing "${currentWord}" with a stronger rhyme`
            })
            suggestions.push(suggestion)
          }
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
    if (!lines || !Array.isArray(lines)) {
      return createFailure(
        createError(
          'INSUFFICIENT_LINES',
          'Lines array is required',
          'Please provide an array of text lines'
        )
      )
    }

    if (lines.length === 0) {
      return createFailure(
        createError(
          'INSUFFICIENT_LINES',
          'At least one line is required',
          'Please provide at least one line of text to analyze'
        )
      )
    }

    // Check for non-English text
    const hasNonEnglish = lines.some(line => {
      if (!line || typeof line !== 'string') return false
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

    // Check if all lines are invalid
    const hasValidLine = lines.some(line => {
      if (!line || typeof line !== 'string') return false
      const trimmed = line.trim()
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
   * Build analysis prompt for AI
   */
  private buildAnalysisPrompt(lines: readonly string[], expectedScheme?: RhymeScheme): string {
    const linesText = lines.map((line, i) => `${i + 1}. ${line}`).join('\n')

    let prompt = `Analyze rhyme patterns in these lyrics:

${linesText}

Provide detailed analysis:
1. Rhyme scheme (ABAB, AABB, etc.)
2. End sound and phonetic for each line
3. Syllable count for each line
4. Rhyme quality for each pair
5. Internal rhymes within lines
6. Issues and suggestions

Output as JSON:
{
  "rhymeScheme": "...",
  "overallScheme": "consistent|mixed|free",
  "quality": "perfect|good|acceptable|poor",
  "patterns": [
    {
      "lineIndex": 0,
      "rhymeGroup": "A",
      "rhymesWith": [1, 2],
      "rhymeQuality": "perfect|near|slant|weak|forced|none",
      "endWord": "...",
      "endSound": "...",
      "phonetic": "...",
      "syllables": N,
      "internalRhymeMatches": [
        {"word": "...", "position": N, "sound": "..."}
      ]
    }
  ],
  "issues": [
    {
      "type": "forced_rhyme|weak_rhyme|broken_pattern",
      "lines": [1, 2],
      "description": "...",
      "suggestion": "..."
    }
  ],
  "alternativeRhymes": {
    "word": ["rhyme1", "rhyme2", "rhyme3"]
  },
  "internalRhymes": [
    {
      "lineIndex": 0,
      "words": ["word1", "word2"],
      "positions": [0, 2],
      "quality": "perfect|near|slant"
    }
  ]
}`

    if (expectedScheme) {
      prompt += `\n\nExpected rhyme scheme: ${expectedScheme}`
    }

    return prompt
  }

  /**
   * Parse AI response JSON (handles markdown code blocks)
   */
  private parseJSON<T>(content: string): T {
    // Remove markdown code blocks if present
    let cleaned = content.trim()

    // Remove ```json ... ```
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '')
    cleaned = cleaned.replace(/\s*```$/, '')

    // Parse JSON
    return JSON.parse(cleaned) as T
  }

  /**
   * Parse analysis response from AI
   */
  private parseAnalysisResponse(content: string): AIRhymeAnalysisResponse {
    return this.parseJSON<AIRhymeAnalysisResponse>(content)
  }

  /**
   * Transform AI data to contract format
   */
  private transformToRhymeAnalysis(
    aiData: AIRhymeAnalysisResponse,
    lines: readonly string[]
  ): RhymeAnalysis {
    // Build analyzed lines
    const analyzedLines: AnalyzedLine[] = aiData.patterns.map(pattern => {
      const internalRhymeMatches: InternalRhymeMatch[] = (pattern.internalRhymeMatches || []).map(match =>
        Object.freeze({
          word: match.word,
          position: match.position,
          sound: match.sound as RhymeSound
        })
      )

      return Object.freeze({
        index: pattern.lineIndex,
        text: lines[pattern.lineIndex] || '',
        endSound: pattern.endSound as RhymeSound,
        phonetic: pattern.phonetic,
        syllables: pattern.syllables,
        rhymesWith: Object.freeze(pattern.rhymesWith),
        internalRhymes: Object.freeze(internalRhymeMatches)
      })
    })

    // Build rhyme pairs
    const rhymePairs: RhymePair[] = []
    for (let i = 0; i < aiData.patterns.length; i++) {
      const pattern = aiData.patterns[i]!
      for (const rhymeWithIndex of pattern.rhymesWith) {
        if (rhymeWithIndex > i) {
          const quality = this.mapToRhymeQuality(pattern.rhymeQuality)
          const pair: RhymePair = Object.freeze({
            line1Index: i,
            line2Index: rhymeWithIndex,
            quality,
            confidence: this.getConfidence(quality),
            type: RhymeType.END_RHYME,
            sharedSound: pattern.endSound as RhymeSound
          })
          rhymePairs.push(pair)
        }
      }
    }

    // Calculate quality score
    const qualityScoreValue = this.calculateQualityScore(rhymePairs)
    const qualityScore = createQualityScore(qualityScoreValue)

    // Map overall quality
    const overallQuality = this.mapToRhymeQuality(aiData.quality)

    // Build internal rhymes
    const internalRhymes: InternalRhyme[] = (aiData.internalRhymes || []).map(ir =>
      Object.freeze({
        lineIndex: ir.lineIndex,
        words: Object.freeze(ir.words),
        positions: Object.freeze(ir.positions),
        quality: this.mapToRhymeQuality(ir.quality)
      })
    )

    // Build suggestions
    const suggestions: RhymeSuggestion[] = aiData.issues.map(issue => {
      const lineIndex = issue.lines[0] || 0
      const line = lines[lineIndex] || ''
      const currentWord = this.extractLastWord(line)
      const alternatives = (aiData.alternativeRhymes[currentWord] || []).slice(0, 3).map(word =>
        Object.freeze({
          word,
          quality: RhymeQuality.PERFECT,
          syllables: 1,
          commonality: 0.8,
          preservesMeaning: false
        })
      )

      return Object.freeze({
        lineIndex,
        issue: issue.description,
        currentWord,
        alternatives: Object.freeze(alternatives),
        improvement: issue.suggestion
      })
    })

    // Build final analysis
    return Object.freeze({
      lines: Object.freeze(analyzedLines),
      rhymeScheme: aiData.rhymeScheme as RhymeScheme,
      rhymePairs: Object.freeze(rhymePairs),
      qualityScore,
      overallQuality,
      suggestions: Object.freeze(suggestions),
      internalRhymes: Object.freeze(internalRhymes)
    })
  }

  /**
   * Map AI quality string to RhymeQuality enum
   */
  private mapToRhymeQuality(quality: string): RhymeQuality {
    const lowerQuality = quality.toLowerCase()
    switch (lowerQuality) {
      case 'perfect':
      case 'good':
        return RhymeQuality.PERFECT
      case 'near':
      case 'acceptable':
        return RhymeQuality.NEAR
      case 'slant':
        return RhymeQuality.SLANT
      case 'weak':
        return RhymeQuality.WEAK
      case 'forced':
        return RhymeQuality.FORCED
      case 'none':
      case 'poor':
        return RhymeQuality.NONE
      default:
        return RhymeQuality.NONE
    }
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
    }
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
   * Extract last word from line
   */
  private extractLastWord(line: string): string {
    const words = line.trim().split(/\s+/)
    const lastWord = words[words.length - 1] || ''
    return lastWord.replace(/[^a-zA-Z]/g, '').toLowerCase()
  }

  /**
   * Find alternative rhyming words using AI
   */
  private async findAlternatives(
    currentWord: string,
    targetSound: RhymeSound,
    contextLine: string
  ): Promise<ServiceResponse<readonly RhymeAlternative[]>> {
    const userPrompt = `Find 5 better rhyming alternatives for "${currentWord}" (sound: ${targetSound}).

Context line: "${contextLine}"

Consider:
1. Rhyme quality
2. Syllable count
3. Naturalness (commonality)
4. Meaning preservation

Output as JSON:
{
  "alternatives": [
    {
      "word": "...",
      "quality": "perfect|near|slant",
      "syllables": N,
      "commonality": 0.0-1.0,
      "preservesMeaning": true|false
    }
  ]
}`

    const request: GenerationRequest = {
      systemPrompt: this.systemPrompt,
      userPrompt,
      temperature: 0.4,
      maxTokens: 500
    }

    const aiResponse = await this.modelProvider.generate(request)

    if (!isSuccess(aiResponse)) {
      return createSuccess(Object.freeze([]))
    }

    try {
      const aiData = this.parseJSON<{ alternatives: Array<{
        word: string
        quality: string
        syllables: number
        commonality: number
        preservesMeaning: boolean
      }> }>(aiResponse.data.content)

      const alternatives: RhymeAlternative[] = aiData.alternatives.map(alt =>
        Object.freeze({
          word: alt.word,
          quality: this.mapToRhymeQuality(alt.quality),
          syllables: alt.syllables,
          commonality: alt.commonality,
          preservesMeaning: alt.preservesMeaning
        })
      )

      return createSuccess(Object.freeze(alternatives))
    } catch {
      return createSuccess(Object.freeze([]))
    }
  }
}
