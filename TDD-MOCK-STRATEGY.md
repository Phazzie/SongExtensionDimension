# TDD Mock Implementation Strategy
**VSCode Songwriting Assistant - Phase 3 (BUILD)**

**Date**: 2025-11-14
**Status**: Phase 3 - Building mocks with Test-Driven Development
**Purpose**: Comprehensive guide for implementing all 10 mock services using TDD

---

## Table of Contents
1. [Mock Implementation Pattern](#1-mock-implementation-pattern)
2. [Mock Data Strategies](#2-mock-data-strategies)
3. [Common Patterns](#3-common-patterns)
4. [Quality Checklist](#4-quality-checklist)
5. [Service-Specific Guidance](#5-service-specific-guidance)
6. [TDD Workflow](#6-tdd-workflow)
7. [Anti-Patterns to Avoid](#7-anti-patterns-to-avoid)

---

## 1. Mock Implementation Pattern

### 1.1 Standard Mock Class Structure

Every mock service follows this template:

```typescript
/**
 * @fileoverview Mock Implementation of [ServiceName]
 * @purpose Provide realistic mock for UI development and testing
 * @phase Phase 3 - BUILD (TDD)
 */

import type {
  I[ServiceName],
  [InputType],
  [OutputType],
  [ErrorCode]
} from '../../contracts/[ServiceName]'
import {
  createSuccess,
  createFailure,
  createError,
  type ServiceResponse
} from '../../contracts/types/common'

/**
 * Mock implementation of [ServiceName]
 *
 * This mock:
 * - Returns realistic data that matches the contract exactly
 * - Handles all error cases defined in the contract
 * - Maintains internal state if needed (e.g., History service)
 * - Never throws exceptions - always returns ServiceResponse
 * - Uses readonly properties correctly (build values BEFORE creating objects)
 */
export class Mock[ServiceName] implements I[ServiceName] {
  // Internal state (if needed)
  private readonly mockData: Map<string, any> = new Map()

  // Counters for generating unique IDs
  private idCounter: number = 0

  /**
   * [Method implementation]
   */
  async methodName(input: InputType): Promise<ServiceResponse<OutputType>> {
    // 1. VALIDATE INPUT
    const validationError = this.validateInput(input)
    if (validationError) {
      return createFailure(validationError)
    }

    // 2. BUILD ALL VALUES FIRST (before creating readonly objects)
    const value1 = this.computeValue1(input)
    const value2 = this.computeValue2(input)
    const value3 = this.computeValue3(input)

    // 3. CREATE READONLY OBJECT IN ONE STATEMENT
    const output: OutputType = {
      field1: value1,
      field2: value2,
      field3: value3,
      // ... all required fields from contract
    }

    // 4. RETURN SUCCESS
    return createSuccess(output)
  }

  /**
   * Private helper to validate input
   */
  private validateInput(input: InputType): ServiceError | null {
    if (!input) {
      return createError(
        ErrorCode.INVALID_INPUT,
        'Input is required',
        'Please provide valid input parameters'
      )
    }
    // Add more validation as needed
    return null
  }

  /**
   * Private helpers to compute values
   */
  private computeValue1(input: InputType): ValueType {
    // Logic to compute value
    return /* computed value */
  }

  /**
   * Generate unique ID
   */
  private generateId(prefix: string): string {
    return `${prefix}_mock_${Date.now()}_${this.idCounter++}`
  }

  /**
   * Generate realistic mock data
   */
  private generateMockData(input: InputType): DataType {
    // Return data that looks real, not minimal
    // Include edge cases and variations
    return /* realistic mock data */
  }
}
```

### 1.2 Handling Readonly Properties Correctly

**THE CARDINAL RULE**: Determine ALL values BEFORE creating readonly objects.

```typescript
// ❌ WRONG - Will fail with readonly properties
const validatedPrompt: ValidatedPrompt = {
  id: createPromptId(),
  prompt: input.prompt,
  context: {},
  constraints: {},
  style: {},
  sanitized: false,
  validatedAt: new Date()
}

// Later trying to modify
validatedPrompt.context.genre = 'rock' // ERROR: readonly!

// ✅ CORRECT - Build everything first
// Step 1: Build all nested objects
const contextGenre = input.context?.genre || 'pop'
const contextMood = input.context?.mood || 'happy'
const promptContext: PromptContext = {
  genre: contextGenre,
  mood: contextMood,
  theme: input.context?.theme,
  referenceArtist: input.context?.referenceArtist,
  targetAudience: input.context?.targetAudience
}

// Step 2: Build constraints
const structureConstraints: StructureConstraints = {
  verseCount: input.constraints?.verseCount || 3,
  linesPerVerse: input.constraints?.linesPerVerse || 4,
  chorusCount: input.constraints?.chorusCount || 1,
  linesPerChorus: input.constraints?.linesPerChorus || 4,
  includeBridge: input.constraints?.includeBridge,
  includeIntro: input.constraints?.includeIntro,
  includeOutro: input.constraints?.includeOutro,
  rhymeScheme: input.constraints?.rhymeScheme
}

// Step 3: Build style config
const styleConfig: StyleConfig = {
  genre: contextGenre,
  mood: contextMood,
  tempo: input.style?.tempo,
  vocalStyle: input.style?.vocalStyle,
  harmony: input.style?.harmony,
  effects: input.style?.effects
}

// Step 4: Create the readonly object in ONE statement
const validatedPrompt: ValidatedPrompt = {
  id: createPromptId(),
  prompt: sanitizedPrompt,
  context: promptContext,
  constraints: structureConstraints,
  style: styleConfig,
  sanitized: true,
  validatedAt: new Date()
}
```

### 1.3 Generating Realistic Mock Data

Mocks should return data that looks **realistic**, not minimal.

```typescript
// ❌ BAD MOCK - Too minimal, not useful
async generate(): Promise<ServiceResponse<GenerateSongOutput>> {
  return createSuccess({
    song: { id: 'song_1' } as Song,
    alternatives: [],
    confidence: 0.8,
    generationMetadata: {} as GenerationMetadata
  })
}

// ✅ GOOD MOCK - Realistic and useful
async generate(input: GenerateSongInput): Promise<ServiceResponse<GenerateSongOutput>> {
  // Build realistic song structure
  const songId = createSongId(this.generateId('song'))

  // Generate verses based on input constraints
  const verseCount = input.constraints?.verseCount || 3
  const verses: Verse[] = []

  for (let i = 1; i <= verseCount; i++) {
    const verseId = createVerseId(this.generateId(`verse_${i}`))
    const lines: Line[] = this.generateLines(4, `verse ${i}`)

    const verse: Verse = {
      id: verseId,
      number: i,
      lines,
      rhymeScheme: 'ABAB',
      syllablePattern: [8, 8, 8, 8],
      mood: input.prompt.context.mood,
      narrative: `Verse ${i} narrative development`
    }
    verses.push(verse)
  }

  // Generate choruses
  const chorusLines: Line[] = this.generateLines(4, 'chorus')
  const chorus: Chorus = {
    id: createChorusId(this.generateId('chorus')),
    lines: chorusLines,
    rhymeScheme: 'AABB',
    syllablePattern: [8, 8, 8, 8],
    hook: chorusLines[0]?.text,
    isMainChorus: true
  }

  // Build complete song
  const song: Song = {
    id: songId,
    title: this.generateTitle(input.prompt.prompt),
    verses,
    choruses: [chorus],
    bridge: input.constraints?.includeBridge ? this.generateBridge() : undefined,
    intro: input.constraints?.includeIntro ? this.generateSection('intro') : undefined,
    outro: input.constraints?.includeOutro ? this.generateSection('outro') : undefined,
    metadata: {
      genre: input.prompt.context.genre,
      mood: input.prompt.context.mood,
      theme: input.prompt.context.theme,
      targetAudience: input.prompt.context.targetAudience,
      referenceArtist: input.prompt.context.referenceArtist,
      generationPrompt: input.prompt.prompt,
      version: 1,
      tags: []
    },
    generatedAt: new Date(),
    lastModified: undefined
  }

  // Generate realistic alternatives
  const alternatives: AlternativeSuggestion[] = [
    {
      sectionType: SectionType.CHORUS,
      sectionId: chorus.id as SectionId,
      alternatives: [
        'Alternative chorus line 1',
        'Alternative chorus line 2',
        'Alternative chorus line 3'
      ],
      reason: 'These alternatives offer different emotional tones'
    }
  ]

  // Create generation metadata
  const generationMetadata: GenerationMetadata = {
    model: 'mock-generator-v1',
    tokensUsed: 1500,
    generationTime: 2500,
    iterations: 2,
    promptVersion: '1.0',
    timestamp: new Date()
  }

  // Return complete output
  const output: GenerateSongOutput = {
    song,
    alternatives,
    confidence: 0.87,
    generationMetadata
  }

  return createSuccess(output)
}

/**
 * Helper to generate realistic lines
 */
private generateLines(count: number, context: string): Line[] {
  const lines: Line[] = []
  const mockVerbs = ['dancing', 'singing', 'running', 'dreaming', 'falling']
  const mockNouns = ['moonlight', 'shadows', 'memories', 'echoes', 'whispers']

  for (let i = 0; i < count; i++) {
    const verb = mockVerbs[i % mockVerbs.length]
    const noun = mockNouns[i % mockNouns.length]

    const line: Line = {
      text: `In the ${noun}, we're ${verb} together`,
      syllables: 8,
      stressPattern: 'x/x/x/x/',
      rhymeSound: i % 2 === 0 ? 'ER' : 'AY',
      internalRhymes: [],
      lineNumber: i + 1
    }
    lines.push(line)
  }

  return lines
}

/**
 * Helper to generate title from prompt
 */
private generateTitle(prompt: string): string {
  // Extract key themes from prompt
  const words = prompt.split(' ').filter(w => w.length > 4)
  const titleWords = words.slice(0, 3).map(w =>
    w.charAt(0).toUpperCase() + w.slice(1)
  )
  return titleWords.join(' ') || 'Untitled Song'
}
```

---

## 2. Mock Data Strategies

### 2.1 Simple Services (InputValidation, Export)

**Characteristics**:
- Limited state
- Straightforward transformations
- Focused validation logic

**Strategy**:
```typescript
export class MockInputValidationService implements IInputValidationService {
  // Use constants for validation rules
  private readonly MIN_PROMPT_LENGTH = 10
  private readonly MAX_PROMPT_LENGTH = 10000
  private readonly SUPPORTED_GENRES = ['rock', 'pop', 'country', 'hip-hop', 'r&b']

  // Use lookup tables for common warnings/modifications
  private readonly GENRE_FALLBACKS = new Map([
    ['rock', 'alternative'],
    ['pop', 'indie'],
    ['country', 'folk']
  ])

  async validate(input: RawPromptInput): Promise<ServiceResponse<ValidationResult>> {
    // Simple, direct validation logic
    const trimmedPrompt = input.prompt.trim()

    // Check for empty
    if (trimmedPrompt.length === 0) {
      return createFailure(
        createError(
          InputValidationErrorCode.EMPTY_PROMPT,
          'Prompt cannot be empty',
          'Please provide a description of the song you want to create',
          'Received empty string after trimming'
        )
      )
    }

    // Check length constraints
    if (trimmedPrompt.length < this.MIN_PROMPT_LENGTH) {
      return createFailure(
        createError(
          InputValidationErrorCode.PROMPT_TOO_SHORT,
          `Prompt must be at least ${this.MIN_PROMPT_LENGTH} characters`,
          'Please provide more detail about the song you want to create',
          `Prompt is ${trimmedPrompt.length} characters, minimum is ${this.MIN_PROMPT_LENGTH}`
        )
      )
    }

    // Build validated output (all at once)
    const warnings: ValidationWarning[] = []
    const modifications: string[] = []

    // Sanitize prompt
    const sanitizedPrompt = this.sanitizeText(trimmedPrompt)
    if (sanitizedPrompt !== trimmedPrompt) {
      modifications.push('Removed unsafe HTML/script tags')
    }

    // Validate genre
    let validatedGenre = input.context?.genre || 'pop'
    if (!this.SUPPORTED_GENRES.includes(validatedGenre.toLowerCase())) {
      warnings.push({
        field: 'genre',
        message: `Genre "${validatedGenre}" is not in supported list`,
        suggestion: `Try: ${this.SUPPORTED_GENRES.join(', ')}`
      })
      validatedGenre = 'alternative'
      modifications.push(`Changed genre from "${input.context?.genre}" to "${validatedGenre}"`)
    }

    // Build all values first
    const promptContext: PromptContext = {
      genre: validatedGenre,
      mood: input.context?.mood || 'neutral',
      theme: input.context?.theme,
      referenceArtist: input.context?.referenceArtist,
      targetAudience: input.context?.targetAudience
    }

    const constraints: StructureConstraints = {
      verseCount: Math.min(input.constraints?.verseCount || 3, 10),
      linesPerVerse: input.constraints?.linesPerVerse || 4,
      chorusCount: input.constraints?.chorusCount || 1,
      linesPerChorus: input.constraints?.linesPerChorus || 4,
      includeBridge: input.constraints?.includeBridge,
      includeIntro: input.constraints?.includeIntro,
      includeOutro: input.constraints?.includeOutro,
      rhymeScheme: input.constraints?.rhymeScheme
    }

    if (input.constraints?.verseCount && input.constraints.verseCount > 10) {
      warnings.push({
        field: 'verseCount',
        message: 'Verse count exceeds maximum of 10',
        suggestion: 'Consider breaking into multiple songs'
      })
      modifications.push(`Capped verse count at 10 (was ${input.constraints.verseCount})`)
    }

    const styleConfig: StyleConfig = {
      genre: validatedGenre,
      mood: input.context?.mood || 'neutral',
      tempo: input.style?.tempo,
      vocalStyle: input.style?.vocalStyle,
      harmony: input.style?.harmony,
      effects: input.style?.effects
    }

    const validatedPrompt: ValidatedPrompt = {
      id: createPromptId(),
      prompt: sanitizedPrompt,
      context: promptContext,
      constraints,
      style: styleConfig,
      sanitized: sanitizedPrompt !== input.prompt,
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
   * Helper to sanitize text
   */
  private sanitizeText(text: string): string {
    // Remove HTML tags
    let sanitized = text.replace(/<[^>]*>/g, '')

    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '')

    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim()

    return sanitized
  }
}
```

### 2.2 Complex Services (CritiqueEngine with 30+ issue types)

**Characteristics**:
- Multiple analysis dimensions
- Large enum of issue types
- Detailed scoring across categories
- Complex nested output structures

**Strategy**: Use **issue generators** and **scoring calculators**

```typescript
export class MockCritiqueEngineService implements ICritiqueEngineService {
  // Issue type probabilities for realistic mocking
  private readonly ISSUE_PROBABILITIES = new Map<IssueType, number>([
    [IssueType.CLICHE, 0.15],
    [IssueType.FORCED_RHYME, 0.10],
    [IssueType.WEAK_RHYME, 0.12],
    [IssueType.VAGUE_IMAGERY, 0.20],
    [IssueType.ABSTRACT_CONCEPT, 0.18],
    [IssueType.RHYTHM_BREAK, 0.08],
    [IssueType.VOICE_INCONSISTENCY, 0.05],
    [IssueType.WEAK_VERB, 0.15],
    [IssueType.REDUNDANCY, 0.10],
    [IssueType.OVERUSED_METAPHOR, 0.12]
  ])

  // Known clichés for detection
  private readonly COMMON_CLICHES = [
    'heart on my sleeve',
    'time will tell',
    'love is a battlefield',
    'stars in your eyes',
    'broken heart',
    'falling apart'
  ]

  async analyzeSong(
    song: Song,
    level: CritiqueLevel = CritiqueLevel.PROFESSIONAL
  ): Promise<ServiceResponse<CritiqueReport>> {
    // Validate input
    if (!song || !song.verses || song.verses.length === 0) {
      return createFailure(
        createError(
          CritiqueEngineErrorCode.INVALID_SONG,
          'Song must have at least one verse',
          'Please generate a complete song before requesting critique'
        )
      )
    }

    // STEP 1: Analyze each dimension separately
    const rhymeScore = this.analyzeRhymeQuality(song)
    const flowScore = this.analyzeFlowConsistency(song)
    const imageryScore = this.analyzeImageryVividness(song)
    const authenticityScore = this.analyzeEmotionalAuthenticity(song)
    const originalityScore = this.analyzeOriginality(song)
    const voiceScore = this.analyzeVoiceConsistency(song)
    const structuralScore = this.analyzeStructuralCoherence(song)
    const technicalScore = this.analyzeTechnicalExecution(song)

    // STEP 2: Build quality scores object
    const scores: QualityScores = {
      rhymeQuality: rhymeScore,
      flowConsistency: flowScore,
      imageryVividness: imageryScore,
      emotionalAuthenticity: authenticityScore,
      originalityScore,
      voiceConsistency: voiceScore,
      structuralCoherence: structuralScore,
      technicalExecution: technicalScore
    }

    // STEP 3: Generate issues for each dimension
    const issues: QualityIssue[] = [
      ...this.generateRhymeIssues(song, rhymeScore),
      ...this.generateImageryIssues(song, imageryScore),
      ...this.generateFlowIssues(song, flowScore),
      ...this.generateVoiceIssues(song, voiceScore),
      ...this.generateOriginalityIssues(song, originalityScore)
    ]

    // STEP 4: Generate suggestions based on issues
    const suggestions: Suggestion[] = issues
      .filter(issue => issue.severity === Severity.MAJOR || issue.severity === Severity.CRITICAL)
      .map(issue => this.issueToSuggestion(issue))

    // STEP 5: Identify strengths
    const strengths = this.identifyStrengths(scores, song)

    // STEP 6: Calculate overall score (weighted average)
    const overallScore = this.calculateOverallScore(scores, level)

    // STEP 7: Determine quality level
    const qualityLevel = getQualityLevel(overallScore)

    // STEP 8: Check if passes gold standard
    const passesGoldStandard = this.checkGoldStandard(scores, issues, level)

    // STEP 9: Perform line-by-line analysis
    const lineAnalysis = this.analyzeAllLines(song)

    // STEP 10: Perform section-level analysis
    const sectionAnalysis = this.analyzeAllSections(song)

    // STEP 11: Build final critique report (all at once)
    const report: CritiqueReport = {
      songId: song.id,
      overallScore,
      passesGoldStandard,
      qualityLevel,
      scores,
      issues,
      suggestions,
      strengths,
      lineAnalysis,
      sectionAnalysis,
      generatedAt: new Date()
    }

    return createSuccess(report)
  }

  /**
   * Generate rhyme-related issues
   */
  private generateRhymeIssues(song: Song, score: QualityScore): QualityIssue[] {
    const issues: QualityIssue[] = []

    // If score is low, add forced rhyme issues
    if (score < 70) {
      let lineNumber = 1
      for (const verse of song.verses) {
        // Check for forced rhymes (simple heuristic: same word rhyming)
        const lines = verse.lines.map(l => l.text)
        const rhymeWords = lines.map(line => {
          const words = line.split(' ')
          return words[words.length - 1]?.toLowerCase() || ''
        })

        // Check for identical rhymes
        const rhymePairs = new Set<string>()
        for (let i = 0; i < rhymeWords.length; i++) {
          for (let j = i + 1; j < rhymeWords.length; j++) {
            if (rhymeWords[i] === rhymeWords[j] && rhymeWords[i] !== '') {
              const issue: QualityIssue = {
                issueType: IssueType.IDENTICAL_RHYME,
                severity: Severity.MAJOR,
                type: 'rhyme',
                message: `Identical rhyme: "${rhymeWords[i]}" appears multiple times`,
                affectedLines: [lineNumber + i, lineNumber + j],
                score_impact: 5,
                suggestion: `Use a different word that rhymes with "${rhymeWords[i]}" instead of repeating it`,
                examples: this.generateRhymeAlternatives(rhymeWords[i]!)
              }
              issues.push(issue)
            }
          }
        }

        lineNumber += verse.lines.length
      }
    }

    // Check for common cliché rhymes
    if (score < 85) {
      const clicheRhymes = [
        ['fire', 'desire'],
        ['heart', 'apart'],
        ['night', 'light'],
        ['love', 'above']
      ]

      let lineNumber = 1
      for (const verse of song.verses) {
        const lines = verse.lines.map(l => l.text.toLowerCase())

        for (const [word1, word2] of clicheRhymes) {
          const has1 = lines.some(line => line.includes(word1))
          const has2 = lines.some(line => line.includes(word2))

          if (has1 && has2) {
            const issue: QualityIssue = {
              issueType: IssueType.CLICHE,
              severity: Severity.MINOR,
              type: 'rhyme',
              message: `Cliché rhyme pair: "${word1}" and "${word2}"`,
              affectedLines: [lineNumber],
              score_impact: 3,
              suggestion: 'Consider using a more original rhyme pair'
            }
            issues.push(issue)
          }
        }

        lineNumber += verse.lines.length
      }
    }

    return issues
  }

  /**
   * Generate imagery-related issues
   */
  private generateImageryIssues(song: Song, score: QualityScore): QualityIssue[] {
    const issues: QualityIssue[] = []

    // Check for vague imagery
    const vagueWords = ['thing', 'stuff', 'something', 'somehow', 'somewhere']
    let lineNumber = 1

    for (const verse of song.verses) {
      for (const line of verse.lines) {
        const lowerText = line.text.toLowerCase()

        for (const vagueWord of vagueWords) {
          if (lowerText.includes(vagueWord)) {
            const issue: QualityIssue = {
              issueType: IssueType.VAGUE_IMAGERY,
              severity: Severity.MAJOR,
              type: 'imagery',
              message: `Vague word "${vagueWord}" lacks specific imagery`,
              affectedLines: [lineNumber],
              score_impact: 8,
              location: {
                line: lineNumber,
                startChar: lowerText.indexOf(vagueWord),
                endChar: lowerText.indexOf(vagueWord) + vagueWord.length
              },
              suggestion: `Replace "${vagueWord}" with a specific, concrete image`,
              examples: this.generateConcreteAlternatives(vagueWord)
            }
            issues.push(issue)
          }
        }

        lineNumber++
      }
    }

    // Check for cliché phrases
    let currentLine = 1
    for (const verse of song.verses) {
      for (const line of verse.lines) {
        const lowerText = line.text.toLowerCase()

        for (const cliche of this.COMMON_CLICHES) {
          if (lowerText.includes(cliche)) {
            const issue: QualityIssue = {
              issueType: IssueType.CLICHE,
              severity: Severity.CRITICAL,
              type: 'imagery',
              message: `Cliché phrase detected: "${cliche}"`,
              affectedLines: [currentLine],
              score_impact: 12,
              suggestion: 'Replace with fresh, original imagery',
              examples: [`Instead of "${cliche}", try describing the feeling in a new way`]
            }
            issues.push(issue)
          }
        }

        currentLine++
      }
    }

    return issues
  }

  /**
   * Generate rhyme alternatives
   */
  private generateRhymeAlternatives(word: string): string[] {
    // Simple mock rhyme generator
    const rhymeMap: Record<string, string[]> = {
      'fire': ['higher', 'wire', 'choir', 'acquire'],
      'heart': ['start', 'art', 'chart', 'smart'],
      'night': ['sight', 'flight', 'bright', 'height'],
      'love': ['above', 'glove', 'shove', 'thereof']
    }

    return rhymeMap[word] || ['Consider consulting a rhyming dictionary']
  }

  /**
   * Generate concrete alternatives for vague words
   */
  private generateConcreteAlternatives(vagueWord: string): string[] {
    const alternatives: Record<string, string[]> = {
      'thing': ['melody', 'shadow', 'whisper', 'flame', 'echo'],
      'stuff': ['memories', 'photographs', 'letters', 'dreams', 'promises'],
      'something': ['a feeling', 'a moment', 'a glance', 'a touch', 'a sound'],
      'somehow': ['in the moonlight', 'through the silence', 'with a whisper'],
      'somewhere': ['in the distance', 'across the valley', 'beneath the stars']
    }

    return alternatives[vagueWord] || ['Use specific, sensory details']
  }

  /**
   * Analyze rhyme quality (returns score 0-100)
   */
  private analyzeRhymeQuality(song: Song): QualityScore {
    // Mock analysis: check for rhyme scheme consistency
    let totalScore = 85 // Start with good baseline

    for (const verse of song.verses) {
      // Check if rhyme scheme is consistent
      if (!verse.rhymeScheme || verse.rhymeScheme === 'FREE') {
        totalScore -= 5
      }

      // Check for identical rhymes (penalize)
      const rhymeWords = verse.lines.map(l => l.text.split(' ').pop()?.toLowerCase())
      const uniqueRhymes = new Set(rhymeWords)
      if (uniqueRhymes.size < rhymeWords.length * 0.7) {
        totalScore -= 10
      }
    }

    return Math.max(0, Math.min(100, totalScore)) as QualityScore
  }

  /**
   * Analyze flow consistency (returns score 0-100)
   */
  private analyzeFlowConsistency(song: Song): QualityScore {
    let totalScore = 80

    for (const verse of song.verses) {
      // Check syllable pattern consistency
      const syllableCounts = verse.lines.map(l => l.syllables)
      const avgSyllables = syllableCounts.reduce((a, b) => a + b, 0) / syllableCounts.length
      const variance = syllableCounts.reduce((sum, count) => sum + Math.pow(count - avgSyllables, 2), 0) / syllableCounts.length

      if (variance > 4) {
        totalScore -= 8 // High variance = inconsistent flow
      }
    }

    return Math.max(0, Math.min(100, totalScore)) as QualityScore
  }

  /**
   * Analyze imagery vividness (returns score 0-100)
   */
  private analyzeImageryVividness(song: Song): QualityScore {
    let totalScore = 90

    // Check for vague words
    const vagueWords = ['thing', 'stuff', 'something']
    for (const verse of song.verses) {
      for (const line of verse.lines) {
        const lowerText = line.text.toLowerCase()
        for (const vague of vagueWords) {
          if (lowerText.includes(vague)) {
            totalScore -= 10
          }
        }
      }
    }

    // Check for clichés
    for (const verse of song.verses) {
      for (const line of verse.lines) {
        const lowerText = line.text.toLowerCase()
        for (const cliche of this.COMMON_CLICHES) {
          if (lowerText.includes(cliche)) {
            totalScore -= 15
          }
        }
      }
    }

    return Math.max(0, Math.min(100, totalScore)) as QualityScore
  }

  /**
   * Analyze emotional authenticity (returns score 0-100)
   */
  private analyzeEmotionalAuthenticity(song: Song): QualityScore {
    // Mock: check for consistency in mood and theme
    return createQualityScore(92)
  }

  /**
   * Analyze originality (returns score 0-100)
   */
  private analyzeOriginality(song: Song): QualityScore {
    let totalScore = 85

    // Penalize for clichés
    for (const verse of song.verses) {
      for (const line of verse.lines) {
        const lowerText = line.text.toLowerCase()
        for (const cliche of this.COMMON_CLICHES) {
          if (lowerText.includes(cliche)) {
            totalScore -= 12
          }
        }
      }
    }

    return Math.max(0, Math.min(100, totalScore)) as QualityScore
  }

  /**
   * Analyze voice consistency (returns score 0-100)
   */
  private analyzeVoiceConsistency(song: Song): QualityScore {
    // Mock: assume good voice consistency
    return createQualityScore(88)
  }

  /**
   * Analyze structural coherence (returns score 0-100)
   */
  private analyzeStructuralCoherence(song: Song): QualityScore {
    let totalScore = 90

    // Check if has required sections
    if (song.verses.length === 0) totalScore -= 30
    if (song.choruses.length === 0) totalScore -= 20

    return Math.max(0, Math.min(100, totalScore)) as QualityScore
  }

  /**
   * Analyze technical execution (returns score 0-100)
   */
  private analyzeTechnicalExecution(song: Song): QualityScore {
    // Mock: check for technical consistency
    return createQualityScore(87)
  }

  /**
   * Calculate overall score from dimension scores
   */
  private calculateOverallScore(scores: QualityScores, level: CritiqueLevel): QualityScore {
    // Weighted average based on critique level
    const weights = level === CritiqueLevel.GOLD_STANDARD
      ? { rhyme: 0.15, flow: 0.15, imagery: 0.20, authenticity: 0.20, originality: 0.15, voice: 0.10, structural: 0.03, technical: 0.02 }
      : { rhyme: 0.15, flow: 0.15, imagery: 0.15, authenticity: 0.15, originality: 0.15, voice: 0.15, structural: 0.05, technical: 0.05 }

    const weighted =
      scores.rhymeQuality * weights.rhyme +
      scores.flowConsistency * weights.flow +
      scores.imageryVividness * weights.imagery +
      scores.emotionalAuthenticity * weights.authenticity +
      scores.originalityScore * weights.originality +
      scores.voiceConsistency * weights.voice +
      scores.structuralCoherence * weights.structural +
      scores.technicalExecution * weights.technical

    return Math.round(weighted) as QualityScore
  }

  /**
   * Check if song passes gold standard
   */
  private checkGoldStandard(
    scores: QualityScores,
    issues: QualityIssue[],
    level: CritiqueLevel
  ): boolean {
    if (level !== CritiqueLevel.GOLD_STANDARD) return true

    const criteria = DEFAULT_GOLD_STANDARD
    const criticalIssues = issues.filter(i => i.severity === Severity.CRITICAL)

    return (
      scores.rhymeQuality >= criteria.minRhymeQuality &&
      scores.flowConsistency >= criteria.minFlowConsistency &&
      scores.imageryVividness >= criteria.minImageryVividness &&
      scores.emotionalAuthenticity >= criteria.minEmotionalAuthenticity &&
      scores.originalityScore >= criteria.minOriginalityScore &&
      scores.voiceConsistency >= criteria.minVoiceConsistency &&
      criticalIssues.length <= criteria.maxClicheCount
    )
  }

  /**
   * Identify song strengths
   */
  private identifyStrengths(scores: QualityScores, song: Song): string[] {
    const strengths: string[] = []

    if (scores.rhymeQuality >= 85) {
      strengths.push('Excellent rhyme quality with creative word choices')
    }
    if (scores.flowConsistency >= 85) {
      strengths.push('Consistent rhythm and flow throughout')
    }
    if (scores.imageryVividness >= 90) {
      strengths.push('Vivid, concrete imagery that paints clear pictures')
    }
    if (scores.emotionalAuthenticity >= 90) {
      strengths.push('Authentic emotional expression that resonates')
    }
    if (scores.originalityScore >= 85) {
      strengths.push('Original voice and fresh perspectives')
    }
    if (song.bridge) {
      strengths.push('Effective bridge that adds depth to the narrative')
    }

    return strengths
  }

  /**
   * Convert issue to suggestion
   */
  private issueToSuggestion(issue: QualityIssue): Suggestion {
    return {
      type: issue.issueType,
      description: issue.message,
      alternatives: issue.examples,
      confidence: 0.85,
      location: issue.location
    }
  }

  /**
   * Analyze all lines
   */
  private analyzeAllLines(song: Song): ReadonlyMap<number, LineAnalysis> {
    const lineAnalysisMap = new Map<number, LineAnalysis>()
    let lineNumber = 1

    for (const verse of song.verses) {
      for (const line of verse.lines) {
        const analysis: LineAnalysis = {
          lineNumber,
          line,
          scores: {
            imagery: createQualityScore(85),
            rhythm: createQualityScore(88),
            wordChoice: createQualityScore(82),
            authenticity: createQualityScore(90),
            overall: createQualityScore(86)
          },
          issues: [],
          suggestions: ['Consider varying the syllable pattern', 'Add more sensory details'],
          strengths: ['Strong rhythm', 'Clear imagery']
        }

        lineAnalysisMap.set(lineNumber, analysis)
        lineNumber++
      }
    }

    return lineAnalysisMap
  }

  /**
   * Analyze all sections
   */
  private analyzeAllSections(song: Song): SectionAnalysis[] {
    const sectionAnalyses: SectionAnalysis[] = []

    // Analyze verses
    for (const verse of song.verses) {
      const analysis: SectionAnalysis = {
        sectionType: 'verse',
        sectionId: verse.id,
        scores: {
          rhymeConsistency: createQualityScore(85),
          rhythmConsistency: createQualityScore(88),
          thematicCohesion: createQualityScore(90),
          narrativeFlow: createQualityScore(87),
          overall: createQualityScore(87)
        },
        issues: [],
        cohesion: createQualityScore(90),
        effectiveness: createQualityScore(88)
      }
      sectionAnalyses.push(analysis)
    }

    // Analyze choruses
    for (const chorus of song.choruses) {
      const analysis: SectionAnalysis = {
        sectionType: 'chorus',
        sectionId: chorus.id,
        scores: {
          rhymeConsistency: createQualityScore(90),
          rhythmConsistency: createQualityScore(92),
          thematicCohesion: createQualityScore(95),
          narrativeFlow: createQualityScore(88),
          overall: createQualityScore(91)
        },
        issues: [],
        cohesion: createQualityScore(95),
        effectiveness: createQualityScore(93)
      }
      sectionAnalyses.push(analysis)
    }

    return sectionAnalyses
  }
}
```

### 2.3 Data Generation Services (SongGeneration)

**Strategy**: Template-based generation with variation

```typescript
export class MockSongGenerationService implements ISongGenerationService {
  // Template data for realistic generation
  private readonly VERSE_TEMPLATES = [
    ['In the {noun}, we {verb} together', 'Watching {object} fade away', '{adjective} moments in time', 'Can\'t escape this {feeling}'],
    ['When the {time} comes around', 'I remember {memory}', 'Everything we {action}', 'Still {emotion} inside'],
    ['{question} where we went wrong', 'Looking for {goal}', 'Through the {place} we roamed', 'Now I\'m standing {state}']
  ]

  private readonly VOCABULARY = {
    nouns: ['moonlight', 'shadows', 'distance', 'silence', 'echoes'],
    verbs: ['dancing', 'running', 'falling', 'flying', 'breaking'],
    adjectives: ['golden', 'fading', 'distant', 'fleeting', 'eternal'],
    objects: ['stars', 'memories', 'dreams', 'hopes', 'fears'],
    feelings: ['longing', 'yearning', 'aching', 'burning', 'desire']
  }

  async generate(
    input: GenerateSongInput,
    options?: GenerationOptions
  ): Promise<ServiceResponse<GenerateSongOutput>> {
    // Merge options with defaults
    const opts = mergeGenerationOptions(options)

    // Validate input
    if (!isValidGenerationInput(input)) {
      return createFailure(
        createError(
          SongGenerationErrorCode.INVALID_PROMPT,
          'Invalid generation input',
          'Ensure prompt is validated before generation'
        )
      )
    }

    // Generate song based on template + input
    const song = await this.generateSongFromTemplate(input, opts)
    const alternatives = this.generateAlternativesList(song)

    const output: GenerateSongOutput = {
      song,
      alternatives,
      confidence: 0.87,
      generationMetadata: {
        model: 'mock-generator-v1',
        tokensUsed: 1500,
        generationTime: 2500,
        iterations: opts.maxIterations || 3,
        promptVersion: '1.0',
        timestamp: new Date()
      }
    }

    return createSuccess(output)
  }

  /**
   * Generate song from template
   */
  private async generateSongFromTemplate(
    input: GenerateSongInput,
    options: GenerationOptions
  ): Promise<Song> {
    // Extract constraints
    const verseCount = input.constraints?.verseCount || 3
    const linesPerVerse = input.constraints?.linesPerVerse || 4

    // Generate verses
    const verses: Verse[] = []
    for (let i = 1; i <= verseCount; i++) {
      const templateIndex = i % this.VERSE_TEMPLATES.length
      const template = this.VERSE_TEMPLATES[templateIndex]!

      const lines = this.generateLinesFromTemplate(template, linesPerVerse)

      const verse: Verse = {
        id: createVerseId(`verse_mock_${i}`),
        number: i,
        lines,
        rhymeScheme: 'ABAB',
        syllablePattern: lines.map(l => l.syllables),
        mood: input.prompt.context.mood,
        narrative: `Development of verse ${i}`
      }
      verses.push(verse)
    }

    // Generate chorus
    const chorusLines = this.generateLinesFromTemplate(
      ['We are {verb} in the {noun}', 'Never looking {direction}', 'With every {timeunit} that passes', 'Our {feeling} grows {comparative}'],
      input.constraints?.linesPerChorus || 4
    )

    const chorus: Chorus = {
      id: createChorusId('chorus_mock_1'),
      lines: chorusLines,
      rhymeScheme: 'AABB',
      syllablePattern: chorusLines.map(l => l.syllables),
      hook: chorusLines[0]?.text || '',
      isMainChorus: true
    }

    // Build complete song
    const song: Song = {
      id: createSongId(`song_mock_${Date.now()}`),
      title: this.generateTitleFromPrompt(input.prompt.prompt),
      verses,
      choruses: [chorus],
      bridge: input.constraints?.includeBridge ? this.generateBridgeSection() : undefined,
      intro: input.constraints?.includeIntro ? this.generateIntroSection() : undefined,
      outro: input.constraints?.includeOutro ? this.generateOutroSection() : undefined,
      metadata: {
        genre: input.prompt.context.genre,
        mood: input.prompt.context.mood,
        theme: input.prompt.context.theme,
        targetAudience: input.prompt.context.targetAudience,
        referenceArtist: input.prompt.context.referenceArtist,
        generationPrompt: input.prompt.prompt,
        version: 1,
        tags: []
      },
      generatedAt: new Date()
    }

    return song
  }

  /**
   * Generate lines from template
   */
  private generateLinesFromTemplate(template: string[], count: number): Line[] {
    const lines: Line[] = []

    for (let i = 0; i < count; i++) {
      const templateLine = template[i % template.length]!
      const text = this.fillTemplate(templateLine)

      const line: Line = {
        text,
        syllables: this.estimateSyllables(text),
        stressPattern: this.generateStressPattern(text),
        rhymeSound: this.extractRhymeSound(text),
        internalRhymes: [],
        lineNumber: i + 1
      }

      lines.push(line)
    }

    return lines
  }

  /**
   * Fill template with vocabulary
   */
  private fillTemplate(template: string): string {
    let result = template

    // Replace placeholders
    result = result.replace(/\{noun\}/g, () => this.randomChoice(this.VOCABULARY.nouns))
    result = result.replace(/\{verb\}/g, () => this.randomChoice(this.VOCABULARY.verbs))
    result = result.replace(/\{adjective\}/g, () => this.randomChoice(this.VOCABULARY.adjectives))
    result = result.replace(/\{object\}/g, () => this.randomChoice(this.VOCABULARY.objects))
    result = result.replace(/\{feeling\}/g, () => this.randomChoice(this.VOCABULARY.feelings))

    // Additional replacements for variety
    result = result.replace(/\{direction\}/g, () => this.randomChoice(['back', 'away', 'down', 'up']))
    result = result.replace(/\{timeunit\}/g, () => this.randomChoice(['moment', 'second', 'hour', 'day']))
    result = result.replace(/\{comparative\}/g, () => this.randomChoice(['stronger', 'deeper', 'wider', 'brighter']))
    result = result.replace(/\{question\}/g, () => this.randomChoice(['Wonder', 'Think about', 'Remember', 'Forget']))

    return result
  }

  /**
   * Random choice from array
   */
  private randomChoice<T>(array: readonly T[]): T {
    return array[Math.floor(Math.random() * array.length)]!
  }

  /**
   * Estimate syllables in text
   */
  private estimateSyllables(text: string): number {
    // Simple estimation: count vowel groups
    const vowelGroups = text.toLowerCase().match(/[aeiouy]+/g)
    return vowelGroups ? vowelGroups.length : 1
  }

  /**
   * Generate stress pattern
   */
  private generateStressPattern(text: string): StressPattern {
    const syllables = this.estimateSyllables(text)
    // Generate iambic pattern (x/)
    return 'x/'.repeat(Math.floor(syllables / 2))
  }

  /**
   * Extract rhyme sound
   */
  private extractRhymeSound(text: string): RhymeSound {
    const words = text.split(' ')
    const lastWord = words[words.length - 1]?.toLowerCase() || ''
    // Simple: use last 2 chars
    return lastWord.slice(-2).toUpperCase()
  }
}
```

### 2.4 Analysis Services (RhymeAnalysis, SyllableCounting)

**Strategy**: Rule-based analysis with lookup tables

```typescript
export class MockRhymeAnalysisService implements IRhymeAnalysisService {
  // Phonetic endings for rhyme detection
  private readonly RHYME_SOUNDS = new Map<string, string>([
    ['day', 'AY'], ['way', 'AY'], ['say', 'AY'], ['play', 'AY'],
    ['night', 'ITE'], ['light', 'ITE'], ['sight', 'ITE'], ['right', 'ITE'],
    ['love', 'UV'], ['above', 'UV'], ['dove', 'UV'], ['shove', 'UV'],
    ['heart', 'ART'], ['part', 'ART'], ['start', 'ART'], ['chart', 'ART']
  ])

  async analyzeRhymes(input: RhymeAnalysisInput): Promise<ServiceResponse<RhymeAnalysis>> {
    // Validate input
    if (!input.lines || input.lines.length === 0) {
      return createFailure(
        createError(
          RhymeAnalysisErrorCode.INVALID_INPUT,
          'No lines provided for rhyme analysis',
          'Please provide at least one line to analyze'
        )
      )
    }

    // Analyze each line
    const linePairs: RhymePair[] = []
    const rhymeScheme = this.detectRhymeScheme(input.lines)

    // Find rhyming pairs
    for (let i = 0; i < input.lines.length; i++) {
      for (let j = i + 1; j < input.lines.length; j++) {
        const line1 = input.lines[i]!
        const line2 = input.lines[j]!

        const rhymeQuality = this.compareRhymes(line1, line2)

        if (rhymeQuality !== RhymeQuality.NONE) {
          const pair: RhymePair = {
            line1Index: i,
            line2Index: j,
            word1: this.getLastWord(line1),
            word2: this.getLastWord(line2),
            quality: rhymeQuality,
            phoneticMatch: this.getPhoneticMatch(line1, line2),
            confidence: this.calculateRhymeConfidence(rhymeQuality)
          }
          linePairs.push(pair)
        }
      }
    }

    // Detect internal rhymes
    const internalRhymes = this.detectInternalRhymes(input.lines)

    // Calculate overall rhyme density
    const rhymeDensity = linePairs.length / input.lines.length

    // Build analysis result
    const analysis: RhymeAnalysis = {
      scheme: rhymeScheme,
      pairs: linePairs,
      internalRhymes,
      density: rhymeDensity,
      overallQuality: this.calculateOverallRhymeQuality(linePairs),
      suggestions: this.generateRhymeSuggestions(input.lines, linePairs)
    }

    return createSuccess(analysis)
  }

  /**
   * Detect rhyme scheme pattern
   */
  private detectRhymeScheme(lines: readonly string[]): string {
    const rhymeSounds: string[] = []
    const schemeMap = new Map<string, string>()
    let currentLetter = 'A'

    for (const line of lines) {
      const lastWord = this.getLastWord(line).toLowerCase()
      const sound = this.RHYME_SOUNDS.get(lastWord) || lastWord.slice(-2)

      if (!schemeMap.has(sound)) {
        schemeMap.set(sound, currentLetter)
        currentLetter = String.fromCharCode(currentLetter.charCodeAt(0) + 1)
      }

      rhymeSounds.push(schemeMap.get(sound)!)
    }

    return rhymeSounds.join('')
  }

  /**
   * Compare two lines for rhyme quality
   */
  private compareRhymes(line1: string, line2: string): RhymeQuality {
    const word1 = this.getLastWord(line1).toLowerCase()
    const word2 = this.getLastWord(line2).toLowerCase()

    // Identical words don't rhyme
    if (word1 === word2) {
      return RhymeQuality.NONE
    }

    // Check phonetic sounds
    const sound1 = this.RHYME_SOUNDS.get(word1) || word1.slice(-2)
    const sound2 = this.RHYME_SOUNDS.get(word2) || word2.slice(-2)

    if (sound1 === sound2) {
      return RhymeQuality.PERFECT
    }

    // Check for near rhyme (last letter matches)
    if (word1.slice(-1) === word2.slice(-1)) {
      return RhymeQuality.NEAR
    }

    // Check for slant rhyme (consonant match)
    if (this.consonantMatch(word1, word2)) {
      return RhymeQuality.SLANT
    }

    return RhymeQuality.NONE
  }

  /**
   * Get last word from line
   */
  private getLastWord(line: string): string {
    const words = line.trim().split(/\s+/)
    return words[words.length - 1]?.replace(/[.,!?;:]$/g, '') || ''
  }

  /**
   * Check consonant match for slant rhyme
   */
  private consonantMatch(word1: string, word2: string): boolean {
    const consonants1 = word1.replace(/[aeiou]/gi, '')
    const consonants2 = word2.replace(/[aeiou]/gi, '')
    return consonants1.slice(-2) === consonants2.slice(-2)
  }

  /**
   * Get phonetic match description
   */
  private getPhoneticMatch(line1: string, line2: string): string {
    const word1 = this.getLastWord(line1)
    const word2 = this.getLastWord(line2)
    return `"${word1}" and "${word2}" share similar ending sounds`
  }

  /**
   * Calculate rhyme confidence
   */
  private calculateRhymeConfidence(quality: RhymeQuality): number {
    switch (quality) {
      case RhymeQuality.PERFECT:
        return 0.95
      case RhymeQuality.NEAR:
        return 0.75
      case RhymeQuality.SLANT:
        return 0.55
      case RhymeQuality.ASSONANCE:
        return 0.45
      case RhymeQuality.CONSONANCE:
        return 0.40
      case RhymeQuality.NONE:
        return 0.0
    }
  }

  /**
   * Detect internal rhymes
   */
  private detectInternalRhymes(lines: readonly string[]): InternalRhyme[] {
    const internalRhymes: InternalRhyme[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!
      const words = line.split(/\s+/)

      // Check for words that rhyme within the line
      for (let j = 0; j < words.length - 1; j++) {
        for (let k = j + 1; k < words.length; k++) {
          const word1 = words[j]!.toLowerCase().replace(/[.,!?;:]$/g, '')
          const word2 = words[k]!.toLowerCase().replace(/[.,!?;:]$/g, '')

          const sound1 = this.RHYME_SOUNDS.get(word1) || word1.slice(-2)
          const sound2 = this.RHYME_SOUNDS.get(word2) || word2.slice(-2)

          if (sound1 === sound2 && word1 !== word2) {
            const internal: InternalRhyme = {
              lineIndex: i,
              word1,
              word2,
              position1: j,
              position2: k,
              quality: RhymeQuality.PERFECT
            }
            internalRhymes.push(internal)
          }
        }
      }
    }

    return internalRhymes
  }

  /**
   * Calculate overall rhyme quality
   */
  private calculateOverallRhymeQuality(pairs: readonly RhymePair[]): QualityScore {
    if (pairs.length === 0) {
      return createQualityScore(50)
    }

    const qualityScores = {
      [RhymeQuality.PERFECT]: 100,
      [RhymeQuality.NEAR]: 80,
      [RhymeQuality.SLANT]: 60,
      [RhymeQuality.ASSONANCE]: 40,
      [RhymeQuality.CONSONANCE]: 35,
      [RhymeQuality.NONE]: 0
    }

    const avgScore = pairs.reduce((sum, pair) => sum + qualityScores[pair.quality], 0) / pairs.length

    return createQualityScore(Math.round(avgScore))
  }

  /**
   * Generate rhyme suggestions
   */
  private generateRhymeSuggestions(
    lines: readonly string[],
    pairs: readonly RhymePair[]
  ): Suggestion[] {
    const suggestions: Suggestion[] = []

    // Check for missing rhymes
    const rhymingLines = new Set<number>()
    for (const pair of pairs) {
      rhymingLines.add(pair.line1Index)
      rhymingLines.add(pair.line2Index)
    }

    for (let i = 0; i < lines.length; i++) {
      if (!rhymingLines.has(i)) {
        suggestions.push({
          type: 'missing_rhyme',
          description: `Line ${i + 1} doesn't rhyme with any other line`,
          alternatives: ['Consider adding a rhyming pair', 'Adjust ending word to create a rhyme'],
          confidence: 0.8,
          location: { line: i + 1 }
        })
      }
    }

    return suggestions
  }
}
```

### 2.5 Stateful Services (History)

**Strategy**: In-memory storage with Map/Array structures

```typescript
export class MockHistoryService implements IHistoryService {
  // In-memory storage (would be persistent storage in real implementation)
  private readonly versions: Map<SongId, SongVersion[]> = new Map()
  private readonly versionById: Map<VersionId, SongVersion> = new Map()
  private versionCounter: number = 1

  async saveVersion(input: SaveVersionInput): Promise<ServiceResponse<SaveVersionResult>> {
    // Validate input
    if (!input.song || !input.changeDescription) {
      return createFailure(
        createError(
          HistoryErrorCode.SAVE_FAILED,
          'Song and change description are required',
          'Provide both song data and a description of the changes'
        )
      )
    }

    // Get or create version array for this song
    const songId = input.song.id
    const existingVersions = this.versions.get(songId) || []
    const versionNumber = existingVersions.length + 1

    // Create version ID
    const versionId = createVersionId(songId, versionNumber)

    // Build version object (all at once)
    const version: SongVersion = {
      versionId,
      songId,
      song: input.song,
      versionNumber,
      changeDescription: input.changeDescription,
      changes: input.changes || [],
      critique: input.critique,
      createdAt: new Date(),
      createdBy: 'mock-user',
      tags: input.tags || [],
      notes: input.notes
    }

    // Store version
    existingVersions.push(version)
    this.versions.set(songId, existingVersions)
    this.versionById.set(versionId, version)

    // Calculate storage size
    const storageSize = calculateStorageSize(version)

    // Build result
    const result: SaveVersionResult = {
      versionId,
      versionNumber,
      savedAt: new Date(),
      storageSize
    }

    return createSuccess(result)
  }

  async getVersion(options: RetrieveVersionOptions): Promise<ServiceResponse<SongVersion>> {
    // Check if version ID provided
    if (options.versionId) {
      const version = this.versionById.get(options.versionId)
      if (!version) {
        return createFailure(
          createError(
            HistoryErrorCode.VERSION_NOT_FOUND,
            `Version ${options.versionId} not found`,
            'Check the version ID and try again'
          )
        )
      }
      return createSuccess(version)
    }

    // Check if version number provided
    if (options.versionNumber && options.songId) {
      const versions = this.versions.get(options.songId)
      if (!versions) {
        return createFailure(
          createError(
            HistoryErrorCode.SONG_NOT_FOUND,
            `No versions found for song ${options.songId}`,
            'Ensure the song ID is correct'
          )
        )
      }

      const version = versions.find(v => v.versionNumber === options.versionNumber)
      if (!version) {
        return createFailure(
          createError(
            HistoryErrorCode.VERSION_NOT_FOUND,
            `Version ${options.versionNumber} not found for song ${options.songId}`,
            'Check the version number and try again'
          )
        )
      }

      return createSuccess(version)
    }

    // If neither provided, return error
    return createFailure(
      createError(
        HistoryErrorCode.RETRIEVAL_FAILED,
        'Either versionId or (songId + versionNumber) must be provided',
        'Specify which version to retrieve'
      )
    )
  }

  async getHistory(songId: SongId): Promise<ServiceResponse<VersionHistory>> {
    const versions = this.versions.get(songId)

    if (!versions || versions.length === 0) {
      return createFailure(
        createError(
          HistoryErrorCode.SONG_NOT_FOUND,
          `No history found for song ${songId}`,
          'This song has no saved versions yet'
        )
      )
    }

    // Calculate statistics
    const firstCreated = versions[0]!.createdAt
    const lastModified = versions[versions.length - 1]!.createdAt
    const totalChanges = versions.reduce((sum, v) => sum + v.changes.length, 0)

    // Build history object (all at once)
    const history: VersionHistory = {
      songId,
      currentVersion: versions.length,
      versions,
      totalVersions: versions.length,
      firstCreated,
      lastModified,
      totalChanges
    }

    return createSuccess(history)
  }

  async getTimeline(songId: SongId): Promise<ServiceResponse<Timeline>> {
    const versions = this.versions.get(songId)

    if (!versions || versions.length === 0) {
      return createFailure(
        createError(
          HistoryErrorCode.SONG_NOT_FOUND,
          `No timeline found for song ${songId}`,
          'This song has no saved versions yet'
        )
      )
    }

    // Build timeline entries
    const entries: TimelineEntry[] = versions.map((version, index) => {
      const scoreDelta = index > 0 && version.critique && versions[index - 1]?.critique
        ? version.critique.overallScore - (versions[index - 1]?.critique?.overallScore || 0)
        : undefined

      const entry: TimelineEntry = {
        versionId: version.versionId,
        versionNumber: version.versionNumber,
        description: version.changeDescription,
        timestamp: version.createdAt,
        changeCount: version.changes.length,
        scoreDelta
      }

      return entry
    })

    // Build timeline object
    const timeline: Timeline = {
      songId,
      entries,
      totalVersions: versions.length,
      dateRange: {
        start: versions[0]!.createdAt,
        end: versions[versions.length - 1]!.createdAt
      }
    }

    return createSuccess(timeline)
  }

  async compareVersions(
    version1Id: VersionId,
    version2Id: VersionId
  ): Promise<ServiceResponse<VersionComparison>> {
    const version1 = this.versionById.get(version1Id)
    const version2 = this.versionById.get(version2Id)

    if (!version1 || !version2) {
      return createFailure(
        createError(
          HistoryErrorCode.VERSION_NOT_FOUND,
          'One or both versions not found',
          'Check version IDs and try again'
        )
      )
    }

    // Calculate differences
    const differences = this.calculateDifferences(version1, version2)

    // Calculate improvement metrics
    const improvementMetrics = this.calculateImprovementMetrics(version1, version2)

    // Generate summary
    const summary = this.generateComparisonSummary(version1, version2, differences)

    // Build comparison object
    const comparison: VersionComparison = {
      version1,
      version2,
      differences,
      improvementMetrics,
      summary
    }

    return createSuccess(comparison)
  }

  async rollback(options: RollbackOptions): Promise<ServiceResponse<RollbackResult>> {
    const versions = this.versions.get(options.songId)

    if (!versions || versions.length === 0) {
      return createFailure(
        createError(
          HistoryErrorCode.SONG_NOT_FOUND,
          `No versions found for song ${options.songId}`,
          'Cannot rollback a song with no version history'
        )
      )
    }

    // Find target version
    let targetVersion: SongVersion | undefined
    if (typeof options.targetVersion === 'number') {
      targetVersion = versions.find(v => v.versionNumber === options.targetVersion)
    } else {
      targetVersion = this.versionById.get(options.targetVersion as VersionId)
    }

    if (!targetVersion) {
      return createFailure(
        createError(
          HistoryErrorCode.VERSION_NOT_FOUND,
          'Target version not found',
          'Check the version number or ID'
        )
      )
    }

    const currentVersion = versions.length
    let backupVersionId: VersionId | undefined

    // Create backup if requested
    if (options.preserveCurrentAsBackup) {
      const currentSong = versions[versions.length - 1]!.song
      const backupResult = await this.saveVersion({
        song: currentSong,
        changeDescription: `Backup before rollback to v${targetVersion.versionNumber}`,
        tags: ['backup', 'rollback']
      })

      if (isSuccess(backupResult)) {
        backupVersionId = backupResult.data.versionId
      }
    }

    // Build rollback result
    const result: RollbackResult = {
      restoredSong: targetVersion.song,
      fromVersion: currentVersion,
      toVersion: targetVersion.versionNumber,
      backupVersionId,
      rolledBackAt: new Date()
    }

    return createSuccess(result)
  }

  async deleteVersion(versionId: VersionId): Promise<ServiceResponse<void>> {
    const version = this.versionById.get(versionId)

    if (!version) {
      return createFailure(
        createError(
          HistoryErrorCode.VERSION_NOT_FOUND,
          `Version ${versionId} not found`,
          'Cannot delete a version that doesn\'t exist'
        )
      )
    }

    // Remove from storage
    const versions = this.versions.get(version.songId)
    if (versions) {
      const index = versions.findIndex(v => v.versionId === versionId)
      if (index !== -1) {
        versions.splice(index, 1)
        this.versionById.delete(versionId)
      }
    }

    return createSuccess(undefined)
  }

  async deleteHistory(songId: SongId, keepCurrent?: boolean): Promise<ServiceResponse<number>> {
    const versions = this.versions.get(songId)

    if (!versions || versions.length === 0) {
      return createSuccess(0)
    }

    let deleteCount = 0

    if (keepCurrent && versions.length > 0) {
      // Keep only the last version
      const currentVersion = versions[versions.length - 1]!

      // Delete all but current
      for (let i = 0; i < versions.length - 1; i++) {
        this.versionById.delete(versions[i]!.versionId)
        deleteCount++
      }

      this.versions.set(songId, [currentVersion])
    } else {
      // Delete all versions
      deleteCount = versions.length

      for (const version of versions) {
        this.versionById.delete(version.versionId)
      }

      this.versions.delete(songId)
    }

    return createSuccess(deleteCount)
  }

  async cleanup(options: CleanupOptions): Promise<ServiceResponse<CleanupResult>> {
    const deletedVersionIds: VersionId[] = []
    let spaceFreed = 0
    const errors: string[] = []

    // Get songs to clean
    const songsToClean = options.songId
      ? [options.songId]
      : Array.from(this.versions.keys())

    for (const songId of songsToClean) {
      const versions = this.versions.get(songId)
      if (!versions) continue

      // Keep N latest versions
      const keepCount = options.keepLatest
      const toDelete = versions.slice(0, Math.max(0, versions.length - keepCount))

      // Apply additional filters
      const filtered = toDelete.filter(version => {
        if (options.olderThan && version.createdAt > options.olderThan) {
          return false
        }
        if (options.removeUntagged && version.tags.length > 0) {
          return false
        }
        return true
      })

      // Delete or just count (dry run)
      if (!options.dryRun) {
        for (const version of filtered) {
          spaceFreed += calculateStorageSize(version)
          deletedVersionIds.push(version.versionId)
          this.versionById.delete(version.versionId)
        }

        // Update versions array
        const remaining = versions.filter(v => !deletedVersionIds.includes(v.versionId))
        this.versions.set(songId, remaining)
      } else {
        // Just count
        for (const version of filtered) {
          spaceFreed += calculateStorageSize(version)
          deletedVersionIds.push(version.versionId)
        }
      }
    }

    // Build cleanup result
    const result: CleanupResult = {
      versionsDeleted: deletedVersionIds.length,
      spaceFreed,
      deletedVersionIds,
      errors
    }

    return createSuccess(result)
  }

  async getStorageStatistics(): Promise<ServiceResponse<StorageStatistics>> {
    let totalSongs = 0
    let totalVersions = 0
    let totalStorageUsed = 0
    let oldestVersion: Date | null = null
    let newestVersion: Date | null = null

    for (const [_songId, versions] of this.versions) {
      totalSongs++
      totalVersions += versions.length

      for (const version of versions) {
        totalStorageUsed += calculateStorageSize(version)

        if (!oldestVersion || version.createdAt < oldestVersion) {
          oldestVersion = version.createdAt
        }
        if (!newestVersion || version.createdAt > newestVersion) {
          newestVersion = version.createdAt
        }
      }
    }

    const statistics: StorageStatistics = {
      totalSongs,
      totalVersions,
      totalStorageUsed,
      averageVersionsPerSong: totalSongs > 0 ? totalVersions / totalSongs : 0,
      oldestVersion: oldestVersion || new Date(),
      newestVersion: newestVersion || new Date(),
      storageLimit: 100 * 1024 * 1024, // 100MB mock limit
      percentUsed: (totalStorageUsed / (100 * 1024 * 1024)) * 100
    }

    return createSuccess(statistics)
  }

  async exportHistory(options: ExportHistoryOptions): Promise<ServiceResponse<string>> {
    const versions = this.versions.get(options.songId)

    if (!versions || versions.length === 0) {
      return createFailure(
        createError(
          HistoryErrorCode.EXPORT_FAILED,
          `No history found for song ${options.songId}`,
          'Cannot export history for a song with no versions'
        )
      )
    }

    // Generate export path
    const exportPath = `/mock/exports/${options.songId}_history.${options.format}`

    // In real implementation, would write to file
    // Mock just returns the path

    return createSuccess(exportPath)
  }

  async searchVersions(criteria: VersionSearchCriteria): Promise<ServiceResponse<readonly SongVersion[]>> {
    const results: SongVersion[] = []

    // Search through all versions
    for (const [_songId, versions] of this.versions) {
      for (const version of versions) {
        // Apply filters
        if (criteria.songId && version.songId !== criteria.songId) {
          continue
        }

        if (criteria.dateRange) {
          if (version.createdAt < criteria.dateRange.start || version.createdAt > criteria.dateRange.end) {
            continue
          }
        }

        if (criteria.tags && criteria.tags.length > 0) {
          const hasTag = criteria.tags.some(tag => version.tags.includes(tag))
          if (!hasTag) continue
        }

        if (criteria.minScore && version.critique) {
          if (version.critique.overallScore < criteria.minScore) {
            continue
          }
        }

        if (criteria.searchText) {
          const searchLower = criteria.searchText.toLowerCase()
          const matchesDescription = version.changeDescription.toLowerCase().includes(searchLower)
          const matchesNotes = version.notes?.toLowerCase().includes(searchLower)

          if (!matchesDescription && !matchesNotes) {
            continue
          }
        }

        results.push(version)
      }
    }

    return createSuccess(results)
  }

  /**
   * Calculate differences between versions
   */
  private calculateDifferences(version1: SongVersion, version2: SongVersion): Difference[] {
    const differences: Difference[] = []

    // Compare titles
    if (version1.song.title !== version2.song.title) {
      differences.push({
        type: DifferenceType.METADATA_CHANGED,
        location: 'title',
        before: version1.song.title,
        after: version2.song.title,
        description: 'Title changed'
      })
    }

    // Compare verse counts
    if (version1.song.verses.length !== version2.song.verses.length) {
      differences.push({
        type: DifferenceType.STRUCTURE_CHANGED,
        location: 'verses',
        before: `${version1.song.verses.length} verses`,
        after: `${version2.song.verses.length} verses`,
        description: 'Number of verses changed'
      })
    }

    // Compare individual lines (simplified)
    const lines1 = version1.song.verses.flatMap(v => v.lines.map(l => l.text))
    const lines2 = version2.song.verses.flatMap(v => v.lines.map(l => l.text))

    for (let i = 0; i < Math.max(lines1.length, lines2.length); i++) {
      const line1 = lines1[i]
      const line2 = lines2[i]

      if (line1 && !line2) {
        differences.push({
          type: DifferenceType.LINE_REMOVED,
          location: `line ${i + 1}`,
          before: line1,
          after: '',
          description: `Line ${i + 1} was removed`
        })
      } else if (!line1 && line2) {
        differences.push({
          type: DifferenceType.LINE_ADDED,
          location: `line ${i + 1}`,
          before: '',
          after: line2,
          description: `Line ${i + 1} was added`
        })
      } else if (line1 && line2 && line1 !== line2) {
        differences.push({
          type: DifferenceType.LINE_CHANGED,
          location: `line ${i + 1}`,
          before: line1,
          after: line2,
          description: `Line ${i + 1} was modified`
        })
      }
    }

    return differences
  }

  /**
   * Calculate improvement metrics
   */
  private calculateImprovementMetrics(
    version1: SongVersion,
    version2: SongVersion
  ): ImprovementComparison | undefined {
    if (!version1.critique || !version2.critique) {
      return undefined
    }

    const scoreChange = version2.critique.overallScore - version1.critique.overallScore
    const issuesFixed = Math.max(0, version1.critique.issues.length - version2.critique.issues.length)
    const issuesIntroduced = Math.max(0, version2.critique.issues.length - version1.critique.issues.length)

    // Calculate category changes
    const categoryChanges = new Map<string, number>()
    categoryChanges.set('rhyme', version2.critique.scores.rhymeQuality - version1.critique.scores.rhymeQuality)
    categoryChanges.set('flow', version2.critique.scores.flowConsistency - version1.critique.scores.flowConsistency)
    categoryChanges.set('imagery', version2.critique.scores.imageryVividness - version1.critique.scores.imageryVividness)

    const metrics: ImprovementComparison = {
      scoreChange,
      issuesFixed,
      issuesIntroduced,
      qualityImproved: scoreChange > 0,
      categoryChanges
    }

    return metrics
  }

  /**
   * Generate comparison summary
   */
  private generateComparisonSummary(
    version1: SongVersion,
    version2: SongVersion,
    differences: readonly Difference[]
  ): string {
    const parts: string[] = []

    parts.push(`Comparing v${version1.versionNumber} to v${version2.versionNumber}`)
    parts.push(`${differences.length} differences found`)

    const lineChanges = differences.filter(d => d.type === DifferenceType.LINE_CHANGED).length
    const lineAdded = differences.filter(d => d.type === DifferenceType.LINE_ADDED).length
    const lineRemoved = differences.filter(d => d.type === DifferenceType.LINE_REMOVED).length

    if (lineChanges > 0) parts.push(`${lineChanges} lines changed`)
    if (lineAdded > 0) parts.push(`${lineAdded} lines added`)
    if (lineRemoved > 0) parts.push(`${lineRemoved} lines removed`)

    if (version2.critique && version1.critique) {
      const scoreDelta = version2.critique.overallScore - version1.critique.overallScore
      if (scoreDelta > 0) {
        parts.push(`Quality improved by ${scoreDelta} points`)
      } else if (scoreDelta < 0) {
        parts.push(`Quality decreased by ${Math.abs(scoreDelta)} points`)
      }
    }

    return parts.join('. ')
  }
}
```

---

## 3. Common Patterns

### 3.1 ServiceResponse Creation

```typescript
// ✅ SUCCESS RESPONSE
return createSuccess(data, {
  duration: Date.now() - startTime,
  timestamp: new Date(),
  serviceVersion: '1.0.0'
})

// ✅ FAILURE RESPONSE
return createFailure(
  createError(
    ErrorCode.SPECIFIC_ERROR,
    'User-friendly message explaining what went wrong',
    'Helpful suggestion for how to fix it',
    'Technical details for debugging (optional)',
    originalError // If wrapping another error
  ),
  {
    duration: Date.now() - startTime,
    timestamp: new Date()
  }
)

// ❌ NEVER THROW
throw new Error('something failed') // WRONG!
```

### 3.2 Error Handling Pattern

```typescript
async methodName(input: InputType): Promise<ServiceResponse<OutputType>> {
  try {
    // 1. Validate input
    if (!input || !input.requiredField) {
      return createFailure(
        createError(
          ErrorCode.INVALID_INPUT,
          'Required field is missing',
          'Provide a value for requiredField'
        )
      )
    }

    // 2. Perform operation
    const result = this.performOperation(input)

    // 3. Return success
    return createSuccess(result)

  } catch (error) {
    // 4. Catch unexpected errors and wrap them
    return createFailure(
      createError(
        ErrorCode.OPERATION_FAILED,
        'Operation failed unexpectedly',
        'Try again or contact support',
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error : undefined
      )
    )
  }
}
```

### 3.3 Validation Logic Pattern

```typescript
/**
 * Validate input and return error if invalid
 */
private validateInput(input: InputType): ServiceError | null {
  // Check required fields
  if (!input) {
    return createError(
      ErrorCode.INVALID_INPUT,
      'Input is required',
      'Provide valid input parameters'
    )
  }

  if (!input.requiredField) {
    return createError(
      ErrorCode.MISSING_FIELD,
      'Required field "requiredField" is missing',
      'Include requiredField in your input'
    )
  }

  // Check constraints
  if (input.count < 1 || input.count > 100) {
    return createError(
      ErrorCode.INVALID_RANGE,
      'Count must be between 1 and 100',
      `Adjust count value (current: ${input.count})`
    )
  }

  // All validation passed
  return null
}

// Usage in method
async method(input: InputType): Promise<ServiceResponse<OutputType>> {
  const error = this.validateInput(input)
  if (error) {
    return createFailure(error)
  }

  // Continue with operation...
}
```

### 3.4 Building Readonly Objects Pattern

```typescript
/**
 * Pattern for building complex readonly objects
 */
private buildComplexObject(input: InputType): ComplexReadonlyType {
  // STEP 1: Compute all primitive values
  const id = this.generateId('prefix')
  const timestamp = new Date()
  const count = input.count || 0

  // STEP 2: Build nested objects
  const nestedObject1: NestedType = {
    field1: input.field1 || 'default',
    field2: input.field2 || 0,
    field3: this.computeValue(input)
  }

  const nestedObject2: AnotherNestedType = {
    prop1: 'value',
    prop2: count * 2,
    prop3: []
  }

  // STEP 3: Build arrays
  const items: ItemType[] = []
  for (let i = 0; i < count; i++) {
    const item: ItemType = {
      id: this.generateId(`item_${i}`),
      value: i,
      label: `Item ${i}`
    }
    items.push(item)
  }

  // STEP 4: Create the readonly object in ONE statement
  const result: ComplexReadonlyType = {
    id,
    timestamp,
    nested1: nestedObject1,
    nested2: nestedObject2,
    items,
    metadata: {
      created: timestamp,
      version: 1
    }
  }

  return result
}
```

### 3.5 Mock Data Generation Pattern

```typescript
/**
 * Generate realistic mock data with variation
 */
private generateMockData(input: InputType, variation: number): DataType {
  // Use seed for deterministic variation
  const seed = variation % 10

  // Select from predefined options
  const options = ['option1', 'option2', 'option3', 'option4', 'option5']
  const selected = options[seed % options.length]!

  // Generate with slight randomness
  const score = 70 + (seed * 3) + Math.floor(Math.random() * 5)

  // Build realistic data
  const data: DataType = {
    id: this.generateId('data'),
    value: selected,
    score: createQualityScore(Math.min(100, score)),
    details: this.generateDetails(selected, seed),
    timestamp: new Date()
  }

  return data
}

/**
 * Generate details based on context
 */
private generateDetails(context: string, seed: number): string[] {
  const detailTemplates = {
    option1: ['Detail A', 'Detail B', 'Detail C'],
    option2: ['Info X', 'Info Y', 'Info Z'],
    option3: ['Item 1', 'Item 2', 'Item 3']
  }

  const templates = detailTemplates[context] || ['Generic detail']
  return templates.slice(0, (seed % 3) + 1)
}
```

---

## 4. Quality Checklist

### 4.1 Contract Compliance Checklist

Before marking a mock as complete, verify:

- [ ] **Interface Implementation**
  - [ ] Implements the correct interface (`I[ServiceName]`)
  - [ ] All methods from interface are implemented
  - [ ] Method signatures match exactly (parameter types, return types)
  - [ ] No additional public methods not in interface

- [ ] **Return Types**
  - [ ] All methods return `Promise<ServiceResponse<T>>`
  - [ ] Never returns `Promise<T>` directly
  - [ ] Never throws exceptions
  - [ ] Always uses `createSuccess()` or `createFailure()`

- [ ] **Error Handling**
  - [ ] All error codes from contract enum are handled
  - [ ] Error messages are user-friendly
  - [ ] Suggestions are helpful and actionable
  - [ ] Technical details included when appropriate

- [ ] **Readonly Properties**
  - [ ] All output types have readonly properties
  - [ ] No mutations after object creation
  - [ ] Values computed before object creation
  - [ ] Arrays use `readonly` type modifier

- [ ] **Type Safety**
  - [ ] No `any` types used
  - [ ] No `as any` casts
  - [ ] No `@ts-ignore` comments (except in tests)
  - [ ] Branded types used correctly

### 4.2 Mock Quality Checklist

- [ ] **Realism**
  - [ ] Returns data that looks realistic, not minimal
  - [ ] Includes edge cases and variations
  - [ ] Uses realistic values (not just "test", "mock", "fake")
  - [ ] Varies output based on input

- [ ] **Completeness**
  - [ ] All required fields are populated
  - [ ] Optional fields populated when relevant
  - [ ] Nested objects fully populated
  - [ ] Arrays contain realistic number of items

- [ ] **Consistency**
  - [ ] Related fields are consistent (e.g., verse count matches array length)
  - [ ] IDs are unique and properly formatted
  - [ ] Timestamps are realistic
  - [ ] Scores match quality descriptions

- [ ] **Usefulness for UI Development**
  - [ ] Provides enough data to test UI rendering
  - [ ] Includes variation for testing different states
  - [ ] Edge cases represented (empty, max, min)
  - [ ] Error states representable

### 4.3 Code Quality Checklist

- [ ] **Documentation**
  - [ ] Class has JSDoc header explaining purpose
  - [ ] Public methods have JSDoc comments
  - [ ] Complex private methods have comments
  - [ ] Examples provided in comments

- [ ] **Structure**
  - [ ] Follows standard mock pattern
  - [ ] Private helpers for complex logic
  - [ ] Validation separated from business logic
  - [ ] Readable and maintainable

- [ ] **Testing**
  - [ ] Tests written BEFORE implementation
  - [ ] All contract tests pass
  - [ ] Edge cases tested
  - [ ] Error cases tested

- [ ] **Validation**
  - [ ] `npm run check` shows 0 errors
  - [ ] `npm test` shows 100% pass
  - [ ] No linter warnings
  - [ ] Git diff reviewed

---

## 5. Service-Specific Guidance

### 5.1 MockCritiqueEngine (Most Complex)

**Complexity**: ★★★★★ (Highest)
**Challenge**: 8 quality dimensions, 30+ issue types, complex scoring

**Implementation Strategy**:

1. **Break into analyzers**: Create separate private methods for each dimension
   - `analyzeRhymeQuality(song): QualityScore`
   - `analyzeFlowConsistency(song): QualityScore`
   - `analyzeImageryVividness(song): QualityScore`
   - etc.

2. **Use issue generators**: Create methods that generate issues for each category
   - `generateRhymeIssues(song, score): QualityIssue[]`
   - `generateImageryIssues(song, score): QualityIssue[]`
   - `generateFlowIssues(song, score): QualityIssue[]`

3. **Lookup tables for clichés**: Maintain lists of common clichés/problems
   ```typescript
   private readonly COMMON_CLICHES = [
     'heart on my sleeve',
     'time will tell',
     // ... 30+ more
   ]

   private readonly FORCED_RHYME_PAIRS = [
     ['fire', 'desire'],
     ['love', 'above'],
     // ... more
   ]
   ```

4. **Scoring algorithm**: Weight different dimensions based on critique level
   ```typescript
   private calculateOverallScore(scores: QualityScores, level: CritiqueLevel): QualityScore {
     const weights = level === CritiqueLevel.GOLD_STANDARD
       ? { rhyme: 0.15, flow: 0.15, imagery: 0.20, authenticity: 0.20, ... }
       : { rhyme: 0.15, flow: 0.15, imagery: 0.15, ... }

     return weightedAverage(scores, weights)
   }
   ```

5. **Line-by-line analysis**: Iterate through all lines, scoring each
   ```typescript
   private analyzeAllLines(song: Song): ReadonlyMap<number, LineAnalysis> {
     const map = new Map<number, LineAnalysis>()
     let lineNum = 1

     for (const verse of song.verses) {
       for (const line of verse.lines) {
         map.set(lineNum, this.analyzeSingleLine(line, lineNum))
         lineNum++
       }
     }

     return map
   }
   ```

**Estimated Time**: 6-8 hours (largest mock)

### 5.2 MockSongGeneration (Large Output Objects)

**Complexity**: ★★★★☆
**Challenge**: Generate complete songs with proper structure

**Implementation Strategy**:

1. **Template-based generation**: Use templates with placeholders
   ```typescript
   private readonly VERSE_TEMPLATES = [
     ['In the {noun}, we {verb} together', ...],
     ['When the {time} comes around', ...],
     // ... more templates
   ]
   ```

2. **Vocabulary banks**: Maintain word lists for substitution
   ```typescript
   private readonly VOCABULARY = {
     nouns: ['moonlight', 'shadows', 'distance', ...],
     verbs: ['dancing', 'running', 'falling', ...],
     adjectives: ['golden', 'fading', 'distant', ...],
   }
   ```

3. **Constraint-driven generation**: Respect user constraints
   ```typescript
   const verseCount = input.constraints?.verseCount || 3
   const linesPerVerse = input.constraints?.linesPerVerse || 4

   for (let i = 1; i <= verseCount; i++) {
     verses.push(this.generateVerse(i, linesPerVerse, input))
   }
   ```

4. **Title generation**: Extract key words from prompt
   ```typescript
   private generateTitle(prompt: string): string {
     const keywords = this.extractKeywords(prompt)
     return keywords.slice(0, 3).map(capitalize).join(' ')
   }
   ```

**Estimated Time**: 4-6 hours

### 5.3 MockHistory (Stateful Service)

**Complexity**: ★★★★☆
**Challenge**: Maintain in-memory state, handle CRUD operations

**Implementation Strategy**:

1. **In-memory storage**: Use Maps for efficient lookup
   ```typescript
   private readonly versions: Map<SongId, SongVersion[]> = new Map()
   private readonly versionById: Map<VersionId, SongVersion> = new Map()
   ```

2. **Versioning logic**: Auto-increment version numbers
   ```typescript
   const existingVersions = this.versions.get(songId) || []
   const versionNumber = existingVersions.length + 1
   ```

3. **Comparison logic**: Calculate diffs between versions
   ```typescript
   private calculateDifferences(v1: SongVersion, v2: SongVersion): Difference[] {
     // Compare line by line, section by section
   }
   ```

4. **Search/filter**: Implement criteria matching
   ```typescript
   async searchVersions(criteria: VersionSearchCriteria) {
     const results = []
     for (const [_id, versions] of this.versions) {
       for (const version of versions) {
         if (this.matchesCriteria(version, criteria)) {
           results.push(version)
         }
       }
     }
     return createSuccess(results)
   }
   ```

**Estimated Time**: 5-7 hours

### 5.4 Simple Mocks (InputValidation, Export, RhymeAnalysis, SyllableCounting)

**Complexity**: ★★☆☆☆
**Challenge**: Straightforward validation and transformation

**Implementation Strategy**:

1. **Direct validation**: Check constraints, return errors or warnings
2. **Lookup tables**: Use predefined lists for validation
3. **Simple transformations**: Sanitize, normalize, format
4. **Minimal state**: Stateless or very simple state

**Estimated Time**: 2-3 hours each

### 5.5 Medium Mocks (RevisionEngine, SunoFormatter, GeminiAudio)

**Complexity**: ★★★☆☆
**Challenge**: Moderate complexity, dependencies on other services

**Implementation Strategy**:

1. **Service composition**: Call other mocks internally (if needed)
2. **Targeted transformations**: Focus on specific output format
3. **Validation + transformation**: Combine validation with formatting
4. **Mock external APIs**: Simulate API responses (GeminiAudio)

**Estimated Time**: 3-5 hours each

---

## 6. TDD Workflow

### 6.1 Red-Green-Refactor Cycle

**Phase 1: RED (Write Failing Test)**

```typescript
// File: tests/contracts/[ServiceName].test.ts

describe('I[ServiceName] Contract Tests', () => {
  let service: I[ServiceName]

  beforeEach(() => {
    // TODO: Will implement later
    // service = new Mock[ServiceName]()
  })

  it('should return success for valid input', async () => {
    const input: InputType = {
      // ... valid input
    }

    const result = await service.methodName(input)

    expect(isSuccess(result)).toBe(true)
    if (isSuccess(result)) {
      expect(result.data).toHaveProperty('requiredField')
      expect(result.data.requiredField).toBeDefined()
      // ... more assertions
    }
  })
})
```

Run: `npm test -- [ServiceName].test.ts`
Expected: **FAIL** (service not implemented yet)

**Phase 2: GREEN (Make Test Pass)**

```typescript
// File: src/services/mock/Mock[ServiceName].ts

export class Mock[ServiceName] implements I[ServiceName] {
  async methodName(input: InputType): Promise<ServiceResponse<OutputType>> {
    // Minimal implementation to pass test

    // Build output object
    const output: OutputType = {
      requiredField: 'value',
      // ... all required fields
    }

    return createSuccess(output)
  }
}
```

Update test:
```typescript
beforeEach(() => {
  service = new Mock[ServiceName]() // ✅ Uncomment
})
```

Run: `npm test -- [ServiceName].test.ts`
Expected: **PASS** ✅

**Phase 3: REFACTOR (Improve Code)**

```typescript
export class Mock[ServiceName] implements I[ServiceName] {
  // Add private helpers
  private readonly CONSTANTS = {
    // ... constants
  }

  async methodName(input: InputType): Promise<ServiceResponse<OutputType>> {
    // Improve implementation:
    // 1. Add validation
    const error = this.validateInput(input)
    if (error) return createFailure(error)

    // 2. Extract helper methods
    const value1 = this.computeValue1(input)
    const value2 = this.computeValue2(input)

    // 3. Build output
    const output: OutputType = {
      requiredField: value1,
      anotherField: value2,
      // ... more realistic data
    }

    return createSuccess(output)
  }

  private validateInput(input: InputType): ServiceError | null {
    // Validation logic
  }

  private computeValue1(input: InputType): ValueType {
    // Computation logic
  }
}
```

Run: `npm test -- [ServiceName].test.ts`
Expected: **STILL PASSES** ✅

Run: `npm run check`
Expected: **0 errors** ✅

### 6.2 Test Coverage Strategy

For each service, write tests for:

1. **Happy path**: Valid input returns success with complete data
2. **Edge cases**: Empty arrays, null optionals, boundary values
3. **Error cases**: Invalid input returns failure with proper error codes
4. **Contract compliance**: Never throws, always returns ServiceResponse
5. **Readonly enforcement**: Cannot mutate returned objects

Example test structure:
```typescript
describe('I[ServiceName] Contract Tests', () => {
  describe('methodName()', () => {
    describe('Success Cases', () => {
      it('should handle valid input with all fields')
      it('should handle minimal valid input')
      it('should handle edge case: empty optional')
      it('should handle edge case: maximum values')
      it('should vary output based on input')
    })

    describe('Error Cases', () => {
      it('should return error for missing required field')
      it('should return error for invalid constraint')
      it('should return error for out-of-range value')
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions')
      it('should always return ServiceResponse shape')
      it('should preserve readonly semantics')
    })
  })
})
```

### 6.3 Development Order (Wave-Based)

**Wave 1: Independent Services (No Dependencies)**
1. InputValidation ⟶ 2-3 hours
2. RhymeAnalysis ⟶ 3-4 hours
3. SyllableCounting ⟶ 3-4 hours

**Wave 2: Primary Services (Depend on Wave 1)**
4. SongGeneration (needs InputValidation) ⟶ 4-6 hours
5. GeminiAudio (independent, but similar to analysis) ⟶ 3-5 hours

**Wave 3: Analysis Services (Depend on Waves 1-2)**
6. CritiqueEngine (needs RhymeAnalysis, SyllableCounting) ⟶ 6-8 hours

**Wave 4: Revision Services (Depend on Waves 2-3)**
7. RevisionEngine (needs SongGeneration, CritiqueEngine) ⟶ 4-6 hours

**Wave 5: Output Services (Depend on Wave 2)**
8. SunoFormatter (needs SongGeneration output) ⟶ 3-4 hours
9. Export (needs Song data) ⟶ 2-3 hours

**Wave 6: History Service (Depends on Everything)**
10. History (needs all types) ⟶ 5-7 hours

**Total Estimated Time**: 35-50 hours

---

## 7. Anti-Patterns to Avoid

### 7.1 DON'T: Modify Readonly Objects

```typescript
// ❌ WRONG
const song: Song = {
  id: createSongId('123'),
  title: '',
  verses: [],
  choruses: [],
  metadata: {} as SongMetadata,
  generatedAt: new Date()
}

song.title = 'My Song' // ERROR: Cannot assign to readonly property

// ✅ CORRECT
const title = 'My Song'
const verses: Verse[] = this.generateVerses()
const choruses: Chorus[] = this.generateChoruses()
const metadata: SongMetadata = this.buildMetadata()

const song: Song = {
  id: createSongId('123'),
  title,
  verses,
  choruses,
  metadata,
  generatedAt: new Date()
}
```

### 7.2 DON'T: Use Minimal Mocks

```typescript
// ❌ WRONG - Too minimal, not useful
async generate(): Promise<ServiceResponse<Song>> {
  return createSuccess({
    id: 'song_1'
  } as Song) // Using 'as' to skip required fields!
}

// ✅ CORRECT - Complete and realistic
async generate(input: GenerateSongInput): Promise<ServiceResponse<GenerateSongOutput>> {
  const song = this.generateCompleteSong(input)
  const alternatives = this.generateAlternatives(song)

  const output: GenerateSongOutput = {
    song,
    alternatives,
    confidence: 0.87,
    generationMetadata: {
      model: 'mock-generator-v1',
      tokensUsed: 1500,
      generationTime: 2500,
      iterations: 3,
      promptVersion: '1.0',
      timestamp: new Date()
    }
  }

  return createSuccess(output)
}
```

### 7.3 DON'T: Throw Exceptions

```typescript
// ❌ WRONG
async validate(input: RawPromptInput): Promise<ServiceResponse<ValidationResult>> {
  if (!input.prompt) {
    throw new Error('Prompt required') // BREAKS CONTRACT!
  }
  // ...
}

// ✅ CORRECT
async validate(input: RawPromptInput): Promise<ServiceResponse<ValidationResult>> {
  if (!input.prompt) {
    return createFailure(
      createError(
        InputValidationErrorCode.EMPTY_PROMPT,
        'Prompt is required',
        'Please provide a prompt for song generation'
      )
    )
  }
  // ...
}
```

### 7.4 DON'T: Use 'any' Types

```typescript
// ❌ WRONG
async process(data: any): Promise<ServiceResponse<any>> {
  return createSuccess(data.result)
}

// ✅ CORRECT
async process(data: InputType): Promise<ServiceResponse<OutputType>> {
  const result: OutputType = this.transformData(data)
  return createSuccess(result)
}
```

### 7.5 DON'T: Skip Validation

```typescript
// ❌ WRONG - Assumes input is valid
async method(input: InputType): Promise<ServiceResponse<OutputType>> {
  // Directly use input without validation
  const result = this.compute(input.field1, input.field2)
  return createSuccess(result)
}

// ✅ CORRECT - Validate first
async method(input: InputType): Promise<ServiceResponse<OutputType>> {
  // Validate
  const error = this.validateInput(input)
  if (error) {
    return createFailure(error)
  }

  // Now safe to use
  const result = this.compute(input.field1, input.field2)
  return createSuccess(result)
}
```

### 7.6 DON'T: Implement Before Writing Tests

```typescript
// ❌ WRONG ORDER
// Step 1: Write MockService
// Step 2: Write tests later

// ✅ CORRECT ORDER (TDD)
// Step 1: Write tests/contracts/Service.test.ts
// Step 2: Run tests (they fail - expected)
// Step 3: Write MockService to pass tests
// Step 4: Run tests (they pass!)
// Step 5: Refactor if needed
```

### 7.7 DON'T: Ignore TypeScript Errors

```typescript
// ❌ WRONG
// @ts-ignore
return { success: true, data: undefined }

// ✅ CORRECT
// Fix the type error properly
return createSuccess({
  field1: 'value',
  field2: 0,
  // ... all required fields
})
```

---

## 8. Quick Reference

### Command Checklist

After implementing each mock:

```bash
# 1. Check TypeScript compilation
npm run check
# Expected: 0 errors

# 2. Run tests for this service
npm test -- [ServiceName].test.ts
# Expected: All tests pass

# 3. Run all tests (ensure no regressions)
npm test
# Expected: All tests pass

# 4. Check for 'any' types
git grep "as any" src/services/mock/
# Expected: No results (or only in test comments)

# 5. Format code
npm run format
# Expected: Code formatted consistently

# 6. Commit
git add src/services/mock/Mock[ServiceName].ts tests/contracts/[ServiceName].test.ts
git commit -m "feat(mock): Implement Mock[ServiceName] with TDD"
```

### Mock Implementation Checklist

For each mock:

- [ ] Contract test file created (`tests/contracts/[ServiceName].test.ts`)
- [ ] Tests written FIRST (before implementation)
- [ ] Tests run and fail initially (RED phase)
- [ ] Mock implementation created (`src/services/mock/Mock[ServiceName].ts`)
- [ ] Mock implements interface exactly
- [ ] Tests now pass (GREEN phase)
- [ ] Code refactored for quality (REFACTOR phase)
- [ ] `npm run check` → 0 errors
- [ ] `npm test` → 100% pass
- [ ] No 'any' types used
- [ ] All error codes handled
- [ ] Readonly properties handled correctly
- [ ] Mock data is realistic, not minimal
- [ ] Documentation added (JSDoc)
- [ ] Code committed with good message

### Success Metrics

Phase 3 (BUILD) is complete when:

- [ ] All 10 contract test files written
- [ ] All 10 mock services implemented
- [ ] `npm run check` → **0 errors**
- [ ] `npm test` → **100% pass rate**
- [ ] No 'any' types in mock code
- [ ] All tests follow TDD (written before mocks)
- [ ] Code reviewed and documented
- [ ] Ready for Phase 4 (UI development)

---

## 9. Examples by Service

### MockInputValidation (Simple)

**File**: `/src/services/mock/MockInputValidationService.ts`

See section 2.1 for complete example.

**Key Points**:
- Direct validation with clear error messages
- Sanitization logic (HTML removal, whitespace normalization)
- Warning system for non-blocking issues
- Modification tracking

### MockCritiqueEngine (Complex)

**File**: `/src/services/mock/MockCritiqueEngineService.ts`

See section 2.2 for complete example.

**Key Points**:
- Multiple analysis dimensions
- Issue generation per category
- Scoring algorithms with weights
- Line-by-line and section-level analysis
- Cliché detection with lookup tables

### MockSongGeneration (Large Output)

**File**: `/src/services/mock/MockSongGenerationService.ts`

See section 2.3 for complete example.

**Key Points**:
- Template-based generation
- Vocabulary substitution
- Constraint-driven structure
- Realistic variation in output

### MockHistory (Stateful)

**File**: `/src/services/mock/MockHistoryService.ts`

See section 2.4 for complete example.

**Key Points**:
- In-memory storage with Maps
- Version management and comparison
- Search and filter operations
- CRUD operations on versions

### MockRhymeAnalysis (Analysis)

**File**: `/src/services/mock/MockRhymeAnalysisService.ts`

See section 2.4 for complete example.

**Key Points**:
- Phonetic matching with lookup tables
- Rhyme quality classification
- Internal rhyme detection
- Scheme pattern recognition

---

## Conclusion

This TDD strategy provides:

1. **Clear patterns** for implementing all 10 mocks
2. **Specific guidance** for complex services (CritiqueEngine, History, SongGeneration)
3. **Common patterns** that apply across all services
4. **Quality checklists** to ensure contract compliance
5. **Anti-patterns** to avoid common mistakes
6. **Wave-based development order** respecting dependencies

**Key Principles**:
- Tests come FIRST (TDD)
- Contracts are IMMUTABLE
- Build values BEFORE creating readonly objects
- Return realistic data, not minimal mocks
- Never throw exceptions
- Zero TypeScript errors always

**Success Criteria**:
- All 10 mocks implemented
- All tests passing
- Zero errors on `npm run check`
- Ready for UI development (Phase 4)

**Estimated Total Time**: 35-50 hours (all 10 mocks)

Follow this strategy, and Phase 3 (BUILD) will be completed successfully with high-quality, tested, contract-compliant mocks.

---

**Next Steps**:
1. Start with Wave 1 (InputValidation, RhymeAnalysis, SyllableCounting)
2. Write tests for each service
3. Implement mocks to pass tests
4. Move to Wave 2, then Wave 3, etc.
5. Validate continuously: `npm run check && npm test`

**Remember**: TDD is not about writing tests. It's about writing *better code* through tests.

🎯 **Ready to build!**
