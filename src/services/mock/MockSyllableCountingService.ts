/**
 * @fileoverview Mock Implementation of Syllable Counting Service
 * @purpose Provide realistic mock for UI development and testing
 * @phase Phase 3 - BUILD (TDD)
 * @updated 2025-11-14
 *
 * This mock implementation:
 * - Returns realistic data that matches the contract exactly
 * - Handles all error cases defined in the contract
 * - Never throws exceptions - always returns ServiceResponse
 * - Uses readonly properties correctly (build values BEFORE creating objects)
 * - Passes all tests in SyllableCounting.test.ts
 */

import type {
  ISyllableCountingService,
  SyllableAnalysis,
  AnalyzedLineMetrics,
  WordMetrics,
  RhythmIssue,
  RhythmSuggestion,
  MeterDetection,
  FlowAnalysis,
  SyllableConstraints,
  RhythmBreak
} from '../../contracts/SyllableCounting'
import {
  Stress,
  RhythmIssueType,
  SyllableCountingErrorCode,
  stressesToPattern
} from '../../contracts/SyllableCounting'
import type { StressPattern, MeterType } from '../../contracts/types/song'
import { MeterType as MeterTypeEnum } from '../../contracts/types/song'
import {
  createSuccess,
  createFailure,
  createError,
  createQualityScore,
  type ServiceResponse,
  type QualityScore,
  type Issue,
  Severity
} from '../../contracts/types/common'

/**
 * Mock implementation of Syllable Counting Service
 *
 * Analyzes syllable counts, stress patterns, and rhythm in lyrics.
 * Uses simple vowel-cluster algorithm for syllable counting.
 */
export class MockSyllableCountingService implements ISyllableCountingService {
  /**
   * Analyze syllable counts and stress patterns in lines
   */
  async analyzeLines(
    lines: readonly string[],
    constraints?: SyllableConstraints
  ): Promise<ServiceResponse<SyllableAnalysis>> {
    // Validate input
    if (!lines || lines.length === 0) {
      return createFailure(
        createError(
          SyllableCountingErrorCode.EMPTY_INPUT,
          'Lines array cannot be empty',
          'Please provide at least one line to analyze'
        )
      )
    }

    // Check if all lines are empty/whitespace
    const hasValidContent = lines.some(line => line && line.trim().length > 0)
    if (!hasValidContent) {
      return createFailure(
        createError(
          SyllableCountingErrorCode.INVALID_TEXT,
          'All lines are empty or whitespace',
          'Please provide lines with actual text content'
        )
      )
    }

    // Check for non-English text
    const hasNonEnglish = lines.some(line => this.containsNonEnglish(line))
    if (hasNonEnglish) {
      return createFailure(
        createError(
          SyllableCountingErrorCode.UNSUPPORTED_LANGUAGE,
          'Non-English text detected',
          'This service currently only supports English text'
        )
      )
    }

    // Check if analysis can be performed
    const canAnalyze = lines.some(line => this.canAnalyzeLine(line))
    if (!canAnalyze) {
      return createFailure(
        createError(
          SyllableCountingErrorCode.ANALYSIS_FAILED,
          'Cannot analyze the provided lines',
          'Please provide lines with valid English words'
        )
      )
    }

    // Analyze each line
    const analyzedLines: AnalyzedLineMetrics[] = []
    let totalSyllables = 0
    const syllablePattern: number[] = []
    const rhythmIssues: RhythmIssue[] = []
    const suggestions: RhythmSuggestion[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (!line || line.trim().length === 0) continue

      // Analyze the line
      const lineResult = await this.analyzeLine(line, i)
      if (lineResult) {
        analyzedLines.push(lineResult)
        totalSyllables += lineResult.syllableCount
        syllablePattern.push(lineResult.syllableCount)

        // Check for rhythm issues
        const lineIssues = this.detectRhythmIssues(lineResult, i, constraints)
        rhythmIssues.push(...lineIssues)
      }
    }

    // Calculate average syllables per line
    const averageSyllablesPerLine = analyzedLines.length > 0
      ? totalSyllables / analyzedLines.length
      : 0

    // Calculate consistency score
    const consistency = this.calculateConsistency(syllablePattern, constraints)

    // Detect meter if possible
    let meter: MeterType | undefined = undefined
    if (analyzedLines.length > 0) {
      const meterResult = await this.detectMeter(lines)
      if (meterResult.success) {
        meter = meterResult.data.meter
      }
    }

    // Generate suggestions from rhythm issues
    for (const issue of rhythmIssues) {
      const suggestion = this.generateSuggestion(issue, analyzedLines[issue.lineIndex])
      if (suggestion) {
        suggestions.push(suggestion)
      }
    }

    // Build result
    const analysis: SyllableAnalysis = Object.freeze({
      lines: Object.freeze(analyzedLines),
      totalSyllables,
      averageSyllablesPerLine,
      syllablePattern: Object.freeze(syllablePattern),
      consistency,
      meter,
      rhythmIssues: Object.freeze(rhythmIssues),
      suggestions: Object.freeze(suggestions)
    })

    return createSuccess(analysis)
  }

  /**
   * Count syllables in a single word
   */
  async countSyllables(word: string): Promise<ServiceResponse<number>> {
    // Handle null/undefined
    if (word === null || word === undefined) {
      return createFailure(
        createError(
          SyllableCountingErrorCode.EMPTY_INPUT,
          'Word cannot be null or undefined',
          'Please provide a valid word string'
        )
      )
    }

    // Handle non-string
    if (typeof word !== 'string') {
      return createFailure(
        createError(
          SyllableCountingErrorCode.EMPTY_INPUT,
          'Word must be a string',
          'Please provide a valid word string'
        )
      )
    }

    // Handle empty/whitespace
    const trimmed = word.trim()
    if (trimmed.length === 0) {
      return createFailure(
        createError(
          SyllableCountingErrorCode.EMPTY_INPUT,
          'Word cannot be empty',
          'Please provide a non-empty word'
        )
      )
    }

    // Check if it's just non-word characters
    const hasLetters = /[a-zA-Z]/.test(trimmed)
    if (!hasLetters) {
      // Check if it's numbers
      if (/^\d+$/.test(trimmed)) {
        return createFailure(
          createError(
            SyllableCountingErrorCode.SYLLABLE_COUNT_FAILED,
            'Cannot count syllables in numbers',
            'Please provide a word with letters'
          )
        )
      }

      return createFailure(
        createError(
          SyllableCountingErrorCode.INVALID_TEXT,
          'Word must contain letters',
          'Please provide a valid English word'
        )
      )
    }

    // Count syllables using vowel-cluster algorithm
    const count = this.countSyllablesInWord(trimmed)

    return createSuccess(count)
  }

  /**
   * Get stress pattern for a line
   */
  async getStressPattern(line: string): Promise<ServiceResponse<StressPattern>> {
    // Handle null/undefined
    if (line === null || line === undefined) {
      return createFailure(
        createError(
          SyllableCountingErrorCode.EMPTY_INPUT,
          'Line cannot be null or undefined',
          'Please provide a valid line string'
        )
      )
    }

    // Handle non-string
    if (typeof line !== 'string') {
      return createFailure(
        createError(
          SyllableCountingErrorCode.EMPTY_INPUT,
          'Line must be a string',
          'Please provide a valid line string'
        )
      )
    }

    // Handle empty/whitespace
    const trimmed = line.trim()
    if (trimmed.length === 0) {
      return createFailure(
        createError(
          SyllableCountingErrorCode.EMPTY_INPUT,
          'Line cannot be empty',
          'Please provide a non-empty line'
        )
      )
    }

    // Check if it can be analyzed
    if (!this.canAnalyzeLine(trimmed)) {
      return createFailure(
        createError(
          SyllableCountingErrorCode.STRESS_ANALYSIS_FAILED,
          'Cannot analyze stress pattern',
          'Please provide a line with valid English words'
        )
      )
    }

    // Generate stress pattern
    const pattern = this.generateStressPattern(trimmed)

    return createSuccess(pattern)
  }

  /**
   * Detect meter type in lines
   */
  async detectMeter(lines: readonly string[]): Promise<ServiceResponse<MeterDetection>> {
    // Validate input
    if (!lines || lines.length === 0) {
      return createFailure(
        createError(
          SyllableCountingErrorCode.EMPTY_INPUT,
          'Lines array cannot be empty',
          'Please provide at least one line to analyze'
        )
      )
    }

    // Check if all lines are empty/whitespace
    const validLines = lines.filter(line => line && line.trim().length > 0)
    if (validLines.length === 0) {
      return createFailure(
        createError(
          SyllableCountingErrorCode.INVALID_TEXT,
          'All lines are empty or whitespace',
          'Please provide lines with actual text content'
        )
      )
    }

    // Check if any line can be analyzed
    const canAnalyze = validLines.some(line => this.canAnalyzeLine(line))
    if (!canAnalyze) {
      return createFailure(
        createError(
          SyllableCountingErrorCode.METER_DETECTION_FAILED,
          'Cannot detect meter in the provided lines',
          'Please provide lines with valid English words'
        )
      )
    }

    // Analyze patterns
    const patterns: StressPattern[] = []
    for (const line of validLines) {
      if (this.canAnalyzeLine(line)) {
        const pattern = this.generateStressPattern(line)
        patterns.push(pattern)
      }
    }

    // Detect meter type
    const { meter, confidence } = this.detectMeterType(patterns)

    // Calculate feet per line (average)
    const feetPerLine = this.calculateFeetPerLine(patterns, meter)

    // Get representative pattern
    const pattern = patterns[0] || ('' as StressPattern)

    // Calculate consistency
    const consistencyValue = this.calculatePatternConsistency(patterns)
    const consistency = createQualityScore(consistencyValue)

    // Build result
    const detection: MeterDetection = Object.freeze({
      meter,
      confidence,
      feetPerLine,
      pattern,
      consistency
    })

    return createSuccess(detection)
  }

  /**
   * Analyze flow/rhythm quality
   */
  async analyzeFlow(
    lines: readonly string[],
    targetMeter?: MeterType
  ): Promise<ServiceResponse<FlowAnalysis>> {
    // Validate input
    if (!lines || lines.length === 0) {
      return createFailure(
        createError(
          SyllableCountingErrorCode.EMPTY_INPUT,
          'Lines array cannot be empty',
          'Please provide at least one line to analyze'
        )
      )
    }

    // Check if any line can be analyzed
    const validLines = lines.filter(line => line && line.trim().length > 0 && this.canAnalyzeLine(line))
    if (validLines.length === 0) {
      return createFailure(
        createError(
          SyllableCountingErrorCode.ANALYSIS_FAILED,
          'Cannot analyze flow',
          'Please provide lines with valid English words'
        )
      )
    }

    // Calculate flow for each line
    const lineFlows: QualityScore[] = []
    const issues: Issue[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (!line || line.trim().length === 0 || !this.canAnalyzeLine(line)) {
        lineFlows.push(createQualityScore(0))
        continue
      }

      const flowScore = this.calculateLineFlow(line, targetMeter)
      lineFlows.push(flowScore)

      // Detect issues
      const lineIssues = this.detectFlowIssues(line, i, targetMeter)
      issues.push(...lineIssues)
    }

    // Calculate overall metrics
    const averageFlow = lineFlows.reduce((sum, score) => sum + score, 0) / lineFlows.length
    const overallFlow = createQualityScore(Math.round(averageFlow))

    // Calculate smoothness (how consistent the flow is)
    const smoothness = this.calculateSmoothness(lineFlows)

    // Calculate naturalness (how natural the rhythm feels)
    const naturalness = this.calculateNaturalness(lines, targetMeter)

    // Calculate singability (how easy it is to sing)
    const singability = this.calculateSingability(lines)

    // Build result
    const flow: FlowAnalysis = Object.freeze({
      overallFlow,
      lineFlows: Object.freeze(lineFlows),
      smoothness,
      naturalness,
      singability,
      issues: Object.freeze(issues)
    })

    return createSuccess(flow)
  }

  /**
   * Suggest rhythm improvements
   */
  async suggestRhythmImprovements(
    lines: readonly string[],
    targetMeter?: MeterType
  ): Promise<ServiceResponse<readonly RhythmSuggestion[]>> {
    // Validate input
    if (!lines || lines.length === 0) {
      return createFailure(
        createError(
          SyllableCountingErrorCode.EMPTY_INPUT,
          'Lines array cannot be empty',
          'Please provide at least one line to analyze'
        )
      )
    }

    // Check if any line can be analyzed
    const canAnalyze = lines.some(line => line && line.trim().length > 0 && this.canAnalyzeLine(line))
    if (!canAnalyze) {
      return createFailure(
        createError(
          SyllableCountingErrorCode.ANALYSIS_FAILED,
          'Cannot analyze rhythm',
          'Please provide lines with valid English words'
        )
      )
    }

    // Analyze each line and generate suggestions
    const suggestions: RhythmSuggestion[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (!line || line.trim().length === 0 || !this.canAnalyzeLine(line)) continue

      // Detect issues in this line
      const lineIssues = this.detectFlowIssues(line, i, targetMeter)

      // Generate suggestions for each issue
      for (const issue of lineIssues) {
        const suggestion = this.createRhythmSuggestion(line, i, issue, targetMeter)
        if (suggestion) {
          suggestions.push(suggestion)
        }
      }
    }

    const response = createSuccess(Object.freeze(suggestions))
    return Object.freeze(response) as ServiceResponse<readonly RhythmSuggestion[]>
  }

  /**
   * Check if line matches target syllable count
   */
  async matchesSyllableCount(
    line: string,
    targetCount: number
  ): Promise<ServiceResponse<boolean>> {
    // Handle negative target count
    if (targetCount < 0) {
      return createFailure(
        createError(
          SyllableCountingErrorCode.INVALID_TEXT,
          'Target count cannot be negative',
          'Please provide a valid positive target count'
        )
      )
    }

    // Handle empty string with zero target count (special case)
    if ((!line || line.trim().length === 0) && targetCount === 0) {
      return createSuccess(true)
    }

    // Handle empty string with non-zero target count
    if (!line || line.trim().length === 0) {
      return createFailure(
        createError(
          SyllableCountingErrorCode.EMPTY_INPUT,
          'Line cannot be empty',
          'Please provide a non-empty line'
        )
      )
    }

    // Check if line can be analyzed
    if (!this.canAnalyzeLine(line)) {
      return createFailure(
        createError(
          SyllableCountingErrorCode.SYLLABLE_COUNT_FAILED,
          'Cannot count syllables in this line',
          'Please provide a line with valid English words'
        )
      )
    }

    // Count syllables in line
    const count = this.countSyllablesInLine(line)

    // Check if matches
    const matches = count === targetCount

    return createSuccess(matches)
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Count syllables in a word using vowel-cluster algorithm
   */
  private countSyllablesInWord(word: string): number {
    // Remove non-letters and convert to lowercase
    const cleaned = word.toLowerCase().replace(/[^a-z]/g, '')

    if (cleaned.length === 0) return 0

    // Count vowel groups
    let count = 0
    let previousWasVowel = false

    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i]
      if (!char) continue
      const isVowel = /[aeiouy]/.test(char)

      if (isVowel && !previousWasVowel) {
        count++
      }

      previousWasVowel = isVowel
    }

    // Handle silent 'e' at end (but not for certain patterns)
    if (cleaned.endsWith('e') && count > 1) {
      // Don't subtract if it ends with common syllabic patterns
      const syllabicEndings = ['le', 'ive', 'ure', 'ice', 'ine', 'ile', 'ate']
      const hasSyllabicEnding = syllabicEndings.some(ending => cleaned.endsWith(ending))

      if (!hasSyllabicEnding) {
        count--
      }
    }

    // Handle -ary suffix (often pronounced as one syllable in longer words)
    if (cleaned.endsWith('ary') && count > 4) {
      count--
    }

    // Ensure at least 1 syllable
    return Math.max(count, 1)
  }

  /**
   * Count syllables in entire line
   */
  private countSyllablesInLine(line: string): number {
    const words = line.trim().split(/\s+/)
    let total = 0

    for (const word of words) {
      const cleaned = word.replace(/[^a-zA-Z'-]/g, '')
      if (cleaned.length > 0) {
        total += this.countSyllablesInWord(cleaned)
      }
    }

    return total
  }

  /**
   * Generate stress pattern for a line
   */
  private generateStressPattern(line: string): StressPattern {
    const words = line.trim().split(/\s+/)
    const stresses: Stress[] = []
    let syllableIndex = 0 // Track syllable position across entire line

    for (const word of words) {
      const cleaned = word.replace(/[^a-zA-Z'-]/g, '')
      if (cleaned.length === 0) continue

      const syllables = this.countSyllablesInWord(cleaned)

      // Simple alternating stress pattern (x/ x/ x/) across the entire line
      for (let i = 0; i < syllables; i++) {
        // Alternate unstressed/stressed based on position in line
        stresses.push(syllableIndex % 2 === 0 ? Stress.UNSTRESSED : Stress.STRESSED)
        syllableIndex++
      }
    }

    return stressesToPattern(stresses)
  }

  /**
   * Analyze a single line
   */
  private async analyzeLine(line: string, index: number): Promise<AnalyzedLineMetrics | null> {
    const trimmed = line.trim()
    if (trimmed.length === 0 || !this.canAnalyzeLine(trimmed)) {
      return null
    }

    // Split into words
    const rawWords = trimmed.split(/\s+/)
    const words: WordMetrics[] = []
    let totalSyllables = 0
    let position = 0

    for (const rawWord of rawWords) {
      const cleaned = rawWord.replace(/[^a-zA-Z'-]/g, '')
      if (cleaned.length === 0) continue

      const syllables = this.countSyllablesInWord(cleaned)
      totalSyllables += syllables

      // Generate simple stress pattern for word
      const stresses: Stress[] = []
      for (let i = 0; i < syllables; i++) {
        stresses.push(i % 2 === 0 ? Stress.UNSTRESSED : Stress.STRESSED)
      }

      const wordMetrics: WordMetrics = Object.freeze({
        word: cleaned,
        syllables,
        stresses: Object.freeze(stresses),
        phonetic: cleaned.toLowerCase(), // Simple mock phonetic
        position: position++
      })

      words.push(wordMetrics)
    }

    // Generate stress pattern
    const stressPattern = this.generateStressPattern(trimmed)

    // Calculate flow score for this line
    const flowScore = this.calculateLineFlow(trimmed, undefined)

    // Detect rhythm breaks
    const breaks: RhythmBreak[] = []

    // Build result
    const metrics: AnalyzedLineMetrics = Object.freeze({
      index,
      text: trimmed,
      syllableCount: totalSyllables,
      words: Object.freeze(words),
      stressPattern,
      meter: undefined, // Could detect per-line meter
      flowScore,
      breaks: Object.freeze(breaks)
    })

    return metrics
  }

  /**
   * Calculate consistency score
   */
  private calculateConsistency(
    syllablePattern: number[],
    constraints?: SyllableConstraints
  ): QualityScore {
    if (syllablePattern.length === 0) return createQualityScore(0)

    // Check if all counts are similar
    const min = Math.min(...syllablePattern)
    const max = Math.max(...syllablePattern)
    const range = max - min

    // Check against constraints if provided
    if (constraints?.targetSyllables) {
      const targetMatches = syllablePattern.filter(
        count => Math.abs(count - constraints.targetSyllables!) <= (constraints.allowedVariation || 0)
      ).length
      const matchRate = targetMatches / syllablePattern.length
      return createQualityScore(Math.round(matchRate * 100))
    }

    // Otherwise, check variance
    const allowedVariation = constraints?.allowedVariation || 2
    if (range <= allowedVariation) {
      return createQualityScore(100)
    } else if (range <= allowedVariation * 2) {
      return createQualityScore(70)
    } else {
      return createQualityScore(40)
    }
  }

  /**
   * Detect rhythm issues in a line
   */
  private detectRhythmIssues(
    line: AnalyzedLineMetrics,
    lineIndex: number,
    constraints?: SyllableConstraints
  ): RhythmIssue[] {
    const issues: RhythmIssue[] = []

    // Check syllable count against constraints
    if (constraints?.targetSyllables) {
      const diff = Math.abs(line.syllableCount - constraints.targetSyllables)
      const allowedVariation = constraints.allowedVariation || 0

      if (diff > allowedVariation) {
        issues.push({
          lineIndex,
          type: RhythmIssueType.SYLLABLE_MISMATCH,
          location: 0,
          description: `Line has ${line.syllableCount} syllables but target is ${constraints.targetSyllables}`,
          severity: diff > allowedVariation * 2 ? 'critical' : 'major'
        })
      }
    }

    return issues
  }

  /**
   * Generate suggestion from rhythm issue
   */
  private generateSuggestion(
    issue: RhythmIssue,
    line?: AnalyzedLineMetrics
  ): RhythmSuggestion | null {
    if (!line) return null

    return {
      lineIndex: issue.lineIndex,
      issue: issue.type,
      currentLine: line.text,
      alternatives: Object.freeze([
        'Try rephrasing with different word choices',
        'Consider adding or removing syllables'
      ]),
      explanation: issue.description
    }
  }

  /**
   * Detect meter type from patterns
   */
  private detectMeterType(patterns: StressPattern[]): { meter: MeterType; confidence: number } {
    if (patterns.length === 0) {
      return { meter: MeterTypeEnum.FREE, confidence: 0 }
    }

    // Count iambic (x/) vs trochaic (/x) patterns
    let iambicCount = 0
    let trochaicCount = 0

    for (const pattern of patterns) {
      const iambicMatches = (pattern.match(/x\//g) || []).length
      const trochaicMatches = (pattern.match(/\/x/g) || []).length

      iambicCount += iambicMatches
      trochaicCount += trochaicMatches
    }

    const total = iambicCount + trochaicCount

    if (total === 0) {
      return { meter: MeterTypeEnum.FREE, confidence: 0.5 }
    }

    if (iambicCount > trochaicCount) {
      const confidence = iambicCount / total
      return { meter: MeterTypeEnum.IAMBIC, confidence }
    } else {
      const confidence = trochaicCount / total
      return { meter: MeterTypeEnum.TROCHAIC, confidence }
    }
  }

  /**
   * Calculate feet per line
   */
  private calculateFeetPerLine(patterns: StressPattern[], meter: MeterType): number {
    if (patterns.length === 0) return 0

    let totalFeet = 0

    for (const pattern of patterns) {
      if (meter === MeterTypeEnum.IAMBIC) {
        totalFeet += (pattern.match(/x\//g) || []).length
      } else if (meter === MeterTypeEnum.TROCHAIC) {
        totalFeet += (pattern.match(/\/x/g) || []).length
      } else {
        // For other meters, count stress pairs
        totalFeet += Math.floor(pattern.length / 2)
      }
    }

    return patterns.length > 0 ? totalFeet / patterns.length : 0
  }

  /**
   * Calculate pattern consistency
   */
  private calculatePatternConsistency(patterns: StressPattern[]): number {
    if (patterns.length === 0) return 0
    if (patterns.length === 1) return 100

    // Check how similar patterns are
    const lengths = patterns.map(p => p.length)
    const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length

    // Low variance = high consistency
    if (variance < 2) return 100
    if (variance < 5) return 80
    if (variance < 10) return 60
    return 40
  }

  /**
   * Calculate line flow score
   */
  private calculateLineFlow(line: string, _targetMeter?: MeterType): QualityScore {
    const syllables = this.countSyllablesInLine(line)
    const pattern = this.generateStressPattern(line)

    // Base score on syllable count and pattern regularity
    let score = 70 // Base score

    // Bonus for good syllable count (8-12 is ideal)
    if (syllables >= 8 && syllables <= 12) {
      score += 15
    } else if (syllables >= 6 && syllables <= 14) {
      score += 5
    }

    // Bonus for regular pattern
    if (pattern.includes('x/') || pattern.includes('/x')) {
      score += 15
    }

    return createQualityScore(Math.min(score, 100))
  }

  /**
   * Detect flow issues in a line
   */
  private detectFlowIssues(line: string, lineIndex: number, _targetMeter?: MeterType): Issue[] {
    const issues: Issue[] = []

    // Check for very short or very long lines
    const syllables = this.countSyllablesInLine(line)

    if (syllables < 4) {
      issues.push({
        severity: Severity.MINOR,
        type: RhythmIssueType.FLOW_DISRUPTION,
        message: 'Line is very short and may disrupt flow',
        location: { line: lineIndex }
      })
    } else if (syllables > 20) {
      issues.push({
        severity: Severity.MAJOR,
        type: RhythmIssueType.FLOW_DISRUPTION,
        message: 'Line is very long and may be difficult to sing',
        location: { line: lineIndex }
      })
    }

    return issues
  }

  /**
   * Calculate smoothness metric
   */
  private calculateSmoothness(lineFlows: readonly QualityScore[]): number {
    if (lineFlows.length === 0) return 0
    if (lineFlows.length === 1) return 1

    // Check variance in flow scores
    const avg = lineFlows.reduce((a, b) => a + b, 0) / lineFlows.length
    const variance = lineFlows.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / lineFlows.length

    // Low variance = high smoothness
    if (variance < 100) return 0.9
    if (variance < 400) return 0.7
    if (variance < 900) return 0.5
    return 0.3
  }

  /**
   * Calculate naturalness metric
   */
  private calculateNaturalness(lines: readonly string[], _targetMeter?: MeterType): number {
    // Simple heuristic: longer lines with regular patterns are more natural
    const validLines = lines.filter(line => line && line.trim().length > 0 && this.canAnalyzeLine(line))

    if (validLines.length === 0) return 0

    let naturalScore = 0

    for (const line of validLines) {
      const syllables = this.countSyllablesInLine(line)
      const pattern = this.generateStressPattern(line)

      // Natural syllable range
      if (syllables >= 6 && syllables <= 12) {
        naturalScore += 0.5
      }

      // Natural pattern
      if (pattern.includes('x/')) {
        naturalScore += 0.5
      }
    }

    return Math.min(naturalScore / validLines.length, 1)
  }

  /**
   * Calculate singability metric
   */
  private calculateSingability(lines: readonly string[]): number {
    const validLines = lines.filter(line => line && line.trim().length > 0 && this.canAnalyzeLine(line))

    if (validLines.length === 0) return 0

    let singabilityScore = 0

    for (const line of validLines) {
      const syllables = this.countSyllablesInLine(line)
      const words = line.trim().split(/\s+/).length

      // Good syllable/word ratio
      const ratio = syllables / words
      if (ratio >= 1.5 && ratio <= 2.5) {
        singabilityScore += 1
      } else {
        singabilityScore += 0.5
      }
    }

    return Math.min(singabilityScore / validLines.length, 1)
  }

  /**
   * Create rhythm suggestion
   */
  private createRhythmSuggestion(
    line: string,
    lineIndex: number,
    issue: Issue,
    targetMeter?: MeterType
  ): RhythmSuggestion | null {
    const alternatives: string[] = []

    // Generate simple alternatives
    alternatives.push('Try rephrasing with different words')
    alternatives.push('Adjust syllable count to match other lines')

    if (targetMeter) {
      alternatives.push(`Rewrite to match ${targetMeter} meter`)
    }

    return {
      lineIndex,
      issue: issue.type as RhythmIssueType,
      currentLine: line,
      alternatives: Object.freeze(alternatives),
      explanation: issue.message
    }
  }

  /**
   * Check if line can be analyzed
   */
  private canAnalyzeLine(line: string): boolean {
    const trimmed = line.trim()
    if (trimmed.length === 0) return false

    // Must have some letters
    const hasLetters = /[a-zA-Z]/.test(trimmed)
    if (!hasLetters) return false

    // Cannot be all symbols
    const onlySymbols = /^[^a-zA-Z]+$/.test(trimmed)
    if (onlySymbols) return false

    return true
  }

  /**
   * Check if text contains non-English characters
   */
  private containsNonEnglish(text: string): boolean {
    // Check for Chinese, Japanese, Korean, Arabic, etc.
    return /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF\u0600-\u06FF]/.test(text)
  }
}
