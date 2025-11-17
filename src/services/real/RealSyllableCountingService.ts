/**
 * @fileoverview Real Implementation of Syllable Counting Service using Gemini AI
 * @purpose AI-powered syllable and flow analysis for song lyrics
 * @phase Phase 5 - IMPLEMENT REAL SERVICES
 * @created 2025-11-17
 *
 * This real implementation:
 * - Uses Gemini AI for intelligent syllable counting
 * - Analyzes stress patterns with AI understanding
 * - Detects meter and rhythm issues
 * - Provides natural flow analysis
 * - Never throws exceptions - always returns ServiceResponse
 * - Follows contract exactly (ISyllableCountingService)
 *
 * AI APPROACH:
 * - Temperature: 0.2 (analytical, consistent)
 * - Structured JSON output for reliability
 * - Context-aware syllable counting (handles pronunciation edge cases)
 * - Natural stress pattern detection
 * - Flow analysis based on singability
 */

import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai'
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
  SyllableCountingErrorCode
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
 * AI response format for line analysis
 */
interface AILineAnalysis {
  readonly lineIndex: number
  readonly text: string
  readonly syllableCount: number
  readonly words: readonly {
    readonly word: string
    readonly syllables: number
    readonly stressed: readonly number[]
    readonly phonetic: string
  }[]
  readonly stressPattern: string
}

/**
 * AI response format for flow analysis
 */
interface AIFlowAnalysis {
  readonly consistency: number
  readonly averageSyllables: number
  readonly rhythmPattern: 'consistent' | 'varied' | 'broken'
  readonly breaks: readonly {
    readonly lineIndex: number
    readonly expected: number
    readonly actual: number
    readonly severity: 'major' | 'minor'
  }[]
}

/**
 * AI response format for complete analysis
 */
interface AIAnalysisResponse {
  readonly syllableCounts: readonly AILineAnalysis[]
  readonly flowAnalysis: AIFlowAnalysis
}

/**
 * AI response for meter detection
 */
interface AIMeterDetection {
  readonly meter: string
  readonly confidence: number
  readonly feetPerLine: number
  readonly pattern: string
  readonly consistency: number
}

/**
 * AI response for rhythm suggestions
 */
interface AIRhythmSuggestion {
  readonly lineIndex: number
  readonly issue: string
  readonly currentLine: string
  readonly alternatives: readonly string[]
  readonly explanation: string
}

/**
 * Real implementation of Syllable Counting Service using Gemini AI
 *
 * Uses AI for sophisticated rhythm and syllable analysis.
 */
export class RealSyllableCountingService implements ISyllableCountingService {
  private readonly model: GenerativeModel

  /**
   * System prompt for syllable analysis
   */
  private readonly SYSTEM_PROMPT = `You are a rhythm and syllable analysis expert.

ROLE: Count syllables and analyze flow in lyrics with perfect accuracy.

IMPORTANT RULES:
1. Count syllables based on how words are SUNG, not just written
2. Consider pronunciation variants (e.g., "fire" can be 1 or 2 syllables)
3. Detect natural stress patterns in English
4. Identify meter types (iambic, trochaic, anapestic, dactylic, free)
5. Analyze flow for singability and natural rhythm
6. Always return valid JSON matching the specified schema

OUTPUT FORMAT (JSON):
All responses must be valid JSON. No markdown, no explanations outside JSON.

For line analysis:
{
  "syllableCounts": [
    {
      "lineIndex": 0,
      "text": "original line text",
      "syllableCount": 8,
      "words": [
        {
          "word": "example",
          "syllables": 3,
          "stressed": [0, 2],
          "phonetic": "ex-AM-ple"
        }
      ],
      "stressPattern": "x/x/x/x/"
    }
  ],
  "flowAnalysis": {
    "consistency": 85,
    "averageSyllables": 8.5,
    "rhythmPattern": "consistent",
    "breaks": [
      {
        "lineIndex": 3,
        "expected": 8,
        "actual": 11,
        "severity": "major"
      }
    ]
  }
}

STRESS PATTERN NOTATION:
- x = unstressed syllable
- / = stressed syllable
- \\ = secondary stress
- ? = ambiguous stress

METER TYPES:
- iambic: x/ x/ x/ (unstressed-stressed pairs)
- trochaic: /x /x /x (stressed-unstressed pairs)
- anapestic: xx/ xx/ (two unstressed, one stressed)
- dactylic: /xx /xx (one stressed, two unstressed)
- free: no consistent pattern`

  /**
   * Create a new RealSyllableCountingService
   *
   * @param apiKey - Gemini API key
   */
  constructor(apiKey: string) {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('Gemini API key is required for RealSyllableCountingService')
    }

    const genAI = new GoogleGenerativeAI(apiKey)

    // Use Gemini 2.0 Flash for fast, analytical tasks
    this.model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.2, // Low temperature for analytical consistency
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json'
      }
    })
  }

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

    try {
      // Build prompt for AI
      const constraintsText = constraints
        ? `\nCONSTRAINTS:
- Target syllables per line: ${constraints.targetSyllables || 'any'}
- Min syllables: ${constraints.minSyllables || 'none'}
- Max syllables: ${constraints.maxSyllables || 'none'}
- Allowed variation: ±${constraints.allowedVariation || 0}
- Target meter: ${constraints.targetMeter || 'any'}
- Require consistency: ${constraints.requireConsistency ? 'yes' : 'no'}`
        : ''

      const userPrompt = `Analyze these song lyrics for syllable count, stress patterns, and flow:

LINES:
${lines.map((line, i) => `${i + 1}. ${line}`).join('\n')}
${constraintsText}

Provide detailed syllable analysis for each line including:
1. Exact syllable count (how it would be SUNG)
2. Word-by-word breakdown with stress positions
3. Complete stress pattern using notation (x = unstressed, / = stressed)
4. Phonetic representation

Also analyze overall flow:
1. Consistency score (0-100)
2. Average syllables per line
3. Rhythm pattern classification (consistent/varied/broken)
4. Any rhythm breaks or issues

Return valid JSON matching the schema.`

      // Call AI
      const result = await this.model.generateContent([
        { text: this.SYSTEM_PROMPT },
        { text: userPrompt }
      ])

      const response = result.response
      const text = response.text()

      // Parse AI response
      const aiResponse: AIAnalysisResponse = JSON.parse(text)

      // Convert AI response to contract types
      const analyzedLines: AnalyzedLineMetrics[] = aiResponse.syllableCounts.map(aiLine => {
        // Convert AI words to WordMetrics
        const words: WordMetrics[] = aiLine.words.map((aiWord, idx) => {
          // Convert stressed indices to Stress array
          const stresses: Stress[] = []
          for (let i = 0; i < aiWord.syllables; i++) {
            stresses.push(
              aiWord.stressed.includes(i) ? Stress.STRESSED : Stress.UNSTRESSED
            )
          }

          const wordMetrics: WordMetrics = {
            word: aiWord.word,
            syllables: aiWord.syllables,
            stresses: Object.freeze(stresses),
            phonetic: aiWord.phonetic,
            position: idx
          }
          return Object.freeze(wordMetrics)
        })

        // Parse stress pattern
        const stressPattern = aiLine.stressPattern as StressPattern

        // Calculate flow score for this line
        const flowScore = this.calculateLineFlowScore(
          aiLine.syllableCount,
          stressPattern,
          constraints
        )

        // Detect rhythm breaks in this line
        const breaks: RhythmBreak[] = []
        // AI doesn't provide per-line breaks, we'll use flow analysis data

        const lineMetrics: AnalyzedLineMetrics = {
          index: aiLine.lineIndex,
          text: aiLine.text,
          syllableCount: aiLine.syllableCount,
          words: Object.freeze(words),
          stressPattern,
          meter: undefined, // Will be set if meter is consistent
          flowScore,
          breaks: Object.freeze(breaks)
        }
        return Object.freeze(lineMetrics)
      })

      // Calculate totals
      const totalSyllables = analyzedLines.reduce(
        (sum, line) => sum + line.syllableCount,
        0
      )
      const averageSyllablesPerLine =
        analyzedLines.length > 0 ? totalSyllables / analyzedLines.length : 0
      const syllablePattern = analyzedLines.map(line => line.syllableCount)

      // Calculate consistency score
      const consistency = createQualityScore(
        Math.round(aiResponse.flowAnalysis.consistency)
      )

      // Convert rhythm breaks to RhythmIssue
      const rhythmIssues: RhythmIssue[] = aiResponse.flowAnalysis.breaks.map(
        aiBreak => {
          const issue: RhythmIssue = {
            lineIndex: aiBreak.lineIndex,
            type: RhythmIssueType.SYLLABLE_MISMATCH,
            location: 0,
            description: `Line has ${aiBreak.actual} syllables but expected ${aiBreak.expected}`,
            severity: aiBreak.severity === 'major' ? 'major' : 'minor'
          }
          return issue
        }
      )

      // Generate suggestions
      const suggestions: RhythmSuggestion[] = []
      for (const issue of rhythmIssues) {
        if (issue.lineIndex < analyzedLines.length) {
          const line = analyzedLines[issue.lineIndex]
          if (line) {
            const suggestion: RhythmSuggestion = {
              lineIndex: issue.lineIndex,
              issue: issue.type,
              currentLine: line.text,
              alternatives: Object.freeze([
                'Try rephrasing with different word choices',
                'Adjust syllable count to match other lines'
              ]),
              explanation: issue.description
            }
            suggestions.push(suggestion)
          }
        }
      }

      // Detect meter if possible
      let meter: MeterType | undefined = undefined
      if (analyzedLines.length > 1) {
        const meterResult = await this.detectMeter(lines)
        if (meterResult.success) {
          meter = meterResult.data.meter
          // Set meter on lines if consistent
          if (meterResult.data.confidence > 0.7) {
            analyzedLines.forEach(line => {
              Object.defineProperty(line, 'meter', {
                value: meter,
                writable: false,
                enumerable: true
              })
            })
          }
        }
      }

      // Build result
      const analysis: SyllableAnalysis = {
        lines: Object.freeze(analyzedLines),
        totalSyllables,
        averageSyllablesPerLine,
        syllablePattern: Object.freeze(syllablePattern),
        consistency,
        meter,
        rhythmIssues: Object.freeze(rhythmIssues),
        suggestions: Object.freeze(suggestions)
      }

      return createSuccess(Object.freeze(analysis))
    } catch (error) {
      // Handle AI errors
      return createFailure(
        createError(
          SyllableCountingErrorCode.ANALYSIS_FAILED,
          'Failed to analyze syllables with AI',
          'The AI service encountered an error. Please try again.',
          error instanceof Error ? error.message : String(error)
        )
      )
    }
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

    try {
      const userPrompt = `Count syllables in this word as it would be SUNG in a song: "${trimmed}"

Return JSON with this exact format:
{
  "word": "${trimmed}",
  "syllables": <number>,
  "phonetic": "<pronunciation>"
}`

      const result = await this.model.generateContent([
        { text: this.SYSTEM_PROMPT },
        { text: userPrompt }
      ])

      const response = result.response
      const text = response.text()
      const parsed = JSON.parse(text) as {
        word: string
        syllables: number
        phonetic: string
      }

      return createSuccess(parsed.syllables)
    } catch (error) {
      return createFailure(
        createError(
          SyllableCountingErrorCode.SYLLABLE_COUNT_FAILED,
          'Failed to count syllables with AI',
          'The AI service encountered an error. Please try again.',
          error instanceof Error ? error.message : String(error)
        )
      )
    }
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

    try {
      const userPrompt = `Analyze the stress pattern for this line: "${trimmed}"

Return JSON with this exact format:
{
  "line": "${trimmed}",
  "stressPattern": "<pattern using x=unstressed, /=stressed>"
}`

      const result = await this.model.generateContent([
        { text: this.SYSTEM_PROMPT },
        { text: userPrompt }
      ])

      const response = result.response
      const text = response.text()
      const parsed = JSON.parse(text) as {
        line: string
        stressPattern: string
      }

      return createSuccess(parsed.stressPattern as StressPattern)
    } catch (error) {
      return createFailure(
        createError(
          SyllableCountingErrorCode.STRESS_ANALYSIS_FAILED,
          'Failed to analyze stress pattern with AI',
          'The AI service encountered an error. Please try again.',
          error instanceof Error ? error.message : String(error)
        )
      )
    }
  }

  /**
   * Detect meter type in lines
   */
  async detectMeter(
    lines: readonly string[]
  ): Promise<ServiceResponse<MeterDetection>> {
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

    try {
      const userPrompt = `Detect the meter type in these lyrics:

LINES:
${validLines.map((line, i) => `${i + 1}. ${line}`).join('\n')}

Analyze the stress patterns and identify the predominant meter.

Return JSON with this exact format:
{
  "meter": "<iambic|trochaic|anapestic|dactylic|free>",
  "confidence": <0-1>,
  "feetPerLine": <number>,
  "pattern": "<representative stress pattern>",
  "consistency": <0-100>
}`

      const result = await this.model.generateContent([
        { text: this.SYSTEM_PROMPT },
        { text: userPrompt }
      ])

      const response = result.response
      const text = response.text()
      const aiMeter: AIMeterDetection = JSON.parse(text)

      // Map AI meter string to MeterType enum
      let meter: MeterType
      switch (aiMeter.meter.toLowerCase()) {
        case 'iambic':
          meter = MeterTypeEnum.IAMBIC
          break
        case 'trochaic':
          meter = MeterTypeEnum.TROCHAIC
          break
        case 'anapestic':
          meter = MeterTypeEnum.ANAPESTIC
          break
        case 'dactylic':
          meter = MeterTypeEnum.DACTYLIC
          break
        case 'free':
        default:
          meter = MeterTypeEnum.FREE
          break
      }

      const detection: MeterDetection = {
        meter,
        confidence: aiMeter.confidence,
        feetPerLine: aiMeter.feetPerLine,
        pattern: aiMeter.pattern as StressPattern,
        consistency: createQualityScore(Math.round(aiMeter.consistency))
      }

      return createSuccess(Object.freeze(detection))
    } catch (error) {
      return createFailure(
        createError(
          SyllableCountingErrorCode.METER_DETECTION_FAILED,
          'Failed to detect meter with AI',
          'The AI service encountered an error. Please try again.',
          error instanceof Error ? error.message : String(error)
        )
      )
    }
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
    const validLines = lines.filter(line => line && line.trim().length > 0)
    if (validLines.length === 0) {
      return createFailure(
        createError(
          SyllableCountingErrorCode.ANALYSIS_FAILED,
          'Cannot analyze flow',
          'Please provide lines with valid English words'
        )
      )
    }

    try {
      const targetMeterText = targetMeter ? `\nTARGET METER: ${targetMeter}` : ''

      const userPrompt = `Analyze the flow and rhythm quality of these lyrics:

LINES:
${validLines.map((line, i) => `${i + 1}. ${line}`).join('\n')}${targetMeterText}

Evaluate:
1. Overall flow quality (0-100)
2. Flow score for each line (0-100)
3. Smoothness (0-1) - how consistent the flow is
4. Naturalness (0-1) - how natural the rhythm feels
5. Singability (0-1) - how easy it is to sing
6. Any flow issues

Return JSON with this exact format:
{
  "overallFlow": <0-100>,
  "lineFlows": [<0-100>, ...],
  "smoothness": <0-1>,
  "naturalness": <0-1>,
  "singability": <0-1>,
  "issues": [
    {
      "severity": "<critical|major|minor>",
      "type": "<issue_type>",
      "message": "<description>",
      "line": <line_index>
    }
  ]
}`

      const result = await this.model.generateContent([
        { text: this.SYSTEM_PROMPT },
        { text: userPrompt }
      ])

      const response = result.response
      const text = response.text()
      const aiFlow = JSON.parse(text) as {
        overallFlow: number
        lineFlows: number[]
        smoothness: number
        naturalness: number
        singability: number
        issues: Array<{
          severity: string
          type: string
          message: string
          line: number
        }>
      }

      // Convert to contract types
      const lineFlows = aiFlow.lineFlows.map(score => createQualityScore(Math.round(score)))
      const overallFlow = createQualityScore(Math.round(aiFlow.overallFlow))

      const issues: Issue[] = aiFlow.issues.map(aiIssue => {
        let severity: Severity
        switch (aiIssue.severity.toLowerCase()) {
          case 'critical':
            severity = Severity.CRITICAL
            break
          case 'major':
            severity = Severity.MAJOR
            break
          case 'minor':
          default:
            severity = Severity.MINOR
            break
        }

        const issue: Issue = {
          severity,
          type: aiIssue.type,
          message: aiIssue.message,
          location: { line: aiIssue.line }
        }
        return issue
      })

      const flow: FlowAnalysis = {
        overallFlow,
        lineFlows: Object.freeze(lineFlows),
        smoothness: aiFlow.smoothness,
        naturalness: aiFlow.naturalness,
        singability: aiFlow.singability,
        issues: Object.freeze(issues)
      }

      return createSuccess(Object.freeze(flow))
    } catch (error) {
      return createFailure(
        createError(
          SyllableCountingErrorCode.ANALYSIS_FAILED,
          'Failed to analyze flow with AI',
          'The AI service encountered an error. Please try again.',
          error instanceof Error ? error.message : String(error)
        )
      )
    }
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
    const validLines = lines.filter(line => line && line.trim().length > 0)
    if (validLines.length === 0) {
      return createFailure(
        createError(
          SyllableCountingErrorCode.ANALYSIS_FAILED,
          'Cannot analyze rhythm',
          'Please provide lines with valid English words'
        )
      )
    }

    try {
      const targetMeterText = targetMeter ? `\nTARGET METER: ${targetMeter}` : ''

      const userPrompt = `Analyze these lyrics and suggest rhythm improvements:

LINES:
${validLines.map((line, i) => `${i + 1}. ${line}`).join('\n')}${targetMeterText}

For each line with rhythm issues, provide:
1. The specific issue type
2. Alternative phrasings that fix the issue
3. Clear explanation of why the change improves rhythm

Return JSON array with this exact format:
[
  {
    "lineIndex": <0-based index>,
    "issue": "<issue_type>",
    "currentLine": "<original line>",
    "alternatives": ["<alternative 1>", "<alternative 2>", ...],
    "explanation": "<why this improves rhythm>"
  }
]`

      const result = await this.model.generateContent([
        { text: this.SYSTEM_PROMPT },
        { text: userPrompt }
      ])

      const response = result.response
      const text = response.text()
      const aiSuggestions: readonly AIRhythmSuggestion[] = JSON.parse(text)

      // Convert to contract types
      const suggestions: RhythmSuggestion[] = aiSuggestions.map(aiSugg => {
        // Map issue string to RhythmIssueType
        let issueType: RhythmIssueType
        switch (aiSugg.issue.toLowerCase()) {
          case 'meter_break':
            issueType = RhythmIssueType.METER_BREAK
            break
          case 'syllable_mismatch':
            issueType = RhythmIssueType.SYLLABLE_MISMATCH
            break
          case 'stress_clash':
            issueType = RhythmIssueType.STRESS_CLASH
            break
          case 'awkward_emphasis':
            issueType = RhythmIssueType.AWKWARD_EMPHASIS
            break
          case 'flow_disruption':
            issueType = RhythmIssueType.FLOW_DISRUPTION
            break
          case 'inconsistent_pattern':
            issueType = RhythmIssueType.INCONSISTENT_PATTERN
            break
          default:
            issueType = RhythmIssueType.FLOW_DISRUPTION
            break
        }

        const suggestion: RhythmSuggestion = {
          lineIndex: aiSugg.lineIndex,
          issue: issueType,
          currentLine: aiSugg.currentLine,
          alternatives: Object.freeze([...aiSugg.alternatives]),
          explanation: aiSugg.explanation
        }
        return suggestion
      })

      return createSuccess(Object.freeze(suggestions))
    } catch (error) {
      return createFailure(
        createError(
          SyllableCountingErrorCode.ANALYSIS_FAILED,
          'Failed to generate rhythm suggestions with AI',
          'The AI service encountered an error. Please try again.',
          error instanceof Error ? error.message : String(error)
        )
      )
    }
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

    try {
      // Use the analyzeLines method to get accurate syllable count
      const analysisResult = await this.analyzeLines([line])

      if (!analysisResult.success) {
        const errorDetails = 'error' in analysisResult ? analysisResult.error.details : undefined
        return createFailure(
          createError(
            SyllableCountingErrorCode.SYLLABLE_COUNT_FAILED,
            'Failed to count syllables in line',
            'Could not analyze the line for syllable count',
            errorDetails
          )
        )
      }

      const analysis = analysisResult.data
      if (analysis.lines.length === 0) {
        return createFailure(
          createError(
            SyllableCountingErrorCode.SYLLABLE_COUNT_FAILED,
            'No lines analyzed',
            'The line could not be analyzed'
          )
        )
      }

      const actualCount = analysis.lines[0]?.syllableCount ?? 0
      const matches = actualCount === targetCount

      return createSuccess(matches)
    } catch (error) {
      return createFailure(
        createError(
          SyllableCountingErrorCode.SYLLABLE_COUNT_FAILED,
          'Failed to check syllable count',
          'The AI service encountered an error. Please try again.',
          error instanceof Error ? error.message : String(error)
        )
      )
    }
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Calculate flow score for a line
   */
  private calculateLineFlowScore(
    syllableCount: number,
    stressPattern: StressPattern,
    constraints?: SyllableConstraints
  ): QualityScore {
    let score = 70 // Base score

    // Check syllable count against constraints
    if (constraints?.targetSyllables) {
      const diff = Math.abs(syllableCount - constraints.targetSyllables)
      if (diff === 0) {
        score += 20
      } else if (diff <= (constraints.allowedVariation || 0)) {
        score += 10
      } else {
        score -= diff * 5
      }
    } else {
      // Bonus for good syllable count (8-12 is ideal for singing)
      if (syllableCount >= 8 && syllableCount <= 12) {
        score += 15
      } else if (syllableCount >= 6 && syllableCount <= 14) {
        score += 5
      }
    }

    // Bonus for regular pattern
    if (stressPattern.includes('x/') || stressPattern.includes('/x')) {
      score += 15
    }

    return createQualityScore(Math.min(Math.max(score, 0), 100))
  }
}
