# Contract Test-Writing Guide

**Purpose**: Ensure all 9 remaining contract tests follow the same high-quality patterns as InputValidation.test.ts

**Last Updated**: 2025-11-14

---

## Table of Contents
1. [Test Structure Pattern Extracted from InputValidation.test.ts](#test-structure-pattern)
2. [Universal Test Coverage Checklist](#universal-test-coverage-checklist)
3. [Reusable Test Template](#reusable-test-template)
4. [Contract-Specific Guidance](#contract-specific-guidance)
5. [Time Estimates](#time-estimates)
6. [Common Pitfalls to Avoid](#common-pitfalls-to-avoid)
7. [Quality Checklist](#quality-checklist)

---

## Test Structure Pattern Extracted from InputValidation.test.ts

### Pattern Analysis

The InputValidation.test.ts file demonstrates these key patterns:

#### 1. **File Header Documentation**
```typescript
/**
 * @fileoverview Contract Tests for [Service Name]
 * @purpose Ensure any implementation of I[ServiceName] matches the contract exactly
 *
 * TEST-DRIVEN DEVELOPMENT APPROACH:
 * These tests are written BEFORE the mock implementation.
 * The mock implementation should be written to make these tests pass.
 */
```

#### 2. **Import Structure**
```typescript
import { describe, it, expect, beforeEach } from '@jest/globals'
import type {
  IServiceInterface,
  InputType,
  OutputType,
  ErrorCodeEnum
} from '../../src/contracts/ServiceName'
import { isSuccess, isFailure } from '../../src/contracts/types/common'
```

#### 3. **Test Organization Hierarchy**
```
describe('IServiceInterface Contract Tests')
  ├─ let service: IServiceInterface
  ├─ beforeEach() with TODO comment
  └─ For each interface method:
      ├─ describe('methodName() method')
      │   ├─ describe('Success Cases')
      │   │   ├─ it('should return success for valid input with all fields')
      │   │   ├─ it('should return success for minimal valid input')
      │   │   ├─ it('should handle edge case X')
      │   │   └─ it('should warn/modify when Y')
      │   ├─ describe('Error Cases')
      │   │   ├─ it('should return error for empty input')
      │   │   ├─ it('should return error for invalid input')
      │   │   └─ it('should return error for conflicting constraints')
      │   └─ describe('Contract Compliance')
      │       ├─ it('should never throw exceptions')
      │       ├─ it('should always return ServiceResponse shape')
      │       └─ it('should preserve readonly semantics on output')
```

#### 4. **Type Guard Usage Pattern**
```typescript
const result = await service.methodName(input)

expect(result).toHaveProperty('success')
expect(isSuccess(result)).toBe(true)

if (isSuccess(result)) {
  const data: OutputType = result.data

  // Verify all required fields exist
  expect(data).toHaveProperty('field1')
  expect(data).toHaveProperty('field2')

  // Verify field types and values
  expect(typeof data.field1).toBe('string')
  expect(data.field2).toBeDefined()

  // Verify nested structures
  expect(Array.isArray(data.arrayField)).toBe(true)
  expect(data.arrayField.length).toBeGreaterThanOrEqual(0)
}
```

#### 5. **Error Testing Pattern**
```typescript
const result = await service.methodName(invalidInput)

expect(isFailure(result)).toBe(true)
if (isFailure(result)) {
  expect(result.error.code).toBe('SPECIFIC_ERROR_CODE')
  expect(result.error.message).toBeDefined()
  expect(result.error.suggestion).toBeDefined()
  expect(result.error.message.length).toBeGreaterThan(0)
  expect(result.error.suggestion.length).toBeGreaterThan(0)
}
```

#### 6. **Contract Compliance Pattern**
```typescript
// Test 1: Never throw exceptions
it('should never throw exceptions', async () => {
  const badInputs: InputType[] = [
    { /* empty */ },
    // @ts-expect-error - Testing runtime behavior
    { field: null },
    // @ts-expect-error - Testing runtime behavior
    { field: undefined },
  ]

  for (const input of badInputs) {
    await expect(service.method(input as any)).resolves.toBeDefined()
  }
})

// Test 2: Always return ServiceResponse shape
it('should always return ServiceResponse shape', async () => {
  const result = await service.method(validInput)

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

// Test 3: Readonly enforcement
it('should preserve readonly semantics on output', async () => {
  const result = await service.method(validInput)

  if (isSuccess(result)) {
    const data = result.data

    expect(() => {
      // @ts-expect-error - Testing readonly enforcement
      data.field = 'changed'
    }).toThrow()
  }
})
```

---

## Universal Test Coverage Checklist

Use this checklist for EVERY contract test file:

### For Each Interface Method:

#### ✅ Success Cases (Minimum 2-4 tests)
- [ ] Valid input with all optional fields provided
- [ ] Valid input with only required fields (minimal input)
- [ ] Edge case: boundary values (min/max lengths, counts)
- [ ] Edge case: special characters, whitespace handling
- [ ] Warning/modification cases (if applicable)
- [ ] Array/collection edge cases (empty arrays, single item, many items)

#### ✅ Error Cases (Minimum 1 per error code)
- [ ] Empty/missing required fields
- [ ] Invalid type values
- [ ] Values too short/small
- [ ] Values too long/large
- [ ] Conflicting parameters
- [ ] Invalid enum values
- [ ] Null/undefined handling (with @ts-expect-error)

#### ✅ Contract Compliance (Required 3 tests)
- [ ] Never throws exceptions (test with various bad inputs)
- [ ] Always returns ServiceResponse shape
- [ ] Preserves readonly semantics on output

#### ✅ Type Verification
- [ ] All required output fields are present
- [ ] Field types match contract definitions
- [ ] Arrays are properly typed and iterable
- [ ] Nested objects have correct structure
- [ ] Branded types are used correctly

#### ✅ Error Quality
- [ ] Error codes match enum values
- [ ] Error messages are descriptive (not empty)
- [ ] Suggestions are provided and helpful
- [ ] Details field is populated when relevant

---

## Reusable Test Template

```typescript
/**
 * @fileoverview Contract Tests for [Service Name] Service
 * @purpose Ensure any implementation of I[ServiceName]Service matches the contract exactly
 *
 * TEST-DRIVEN DEVELOPMENT APPROACH:
 * These tests are written BEFORE the mock implementation.
 * The mock implementation should be written to make these tests pass.
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import type {
  I[ServiceName]Service,
  [InputType1],
  [OutputType1],
  [ErrorCodeEnum]
} from '../../src/contracts/[ServiceName]'
import { isSuccess, isFailure } from '../../src/contracts/types/common'

/**
 * NOTE: This test suite is designed to work with ANY implementation of I[ServiceName]Service.
 * During Phase 3 (BUILD), import Mock[ServiceName]Service.
 * During Phase 5 (IMPLEMENT), import Real[ServiceName]Service.
 * The tests should pass for both implementations.
 */
describe('I[ServiceName]Service Contract Tests', () => {
  let service: I[ServiceName]Service

  beforeEach(() => {
    // TODO: Uncomment when Mock[ServiceName]Service is implemented
    // service = new Mock[ServiceName]Service()

    // For now, this will fail - that's expected in TDD
    // We write the tests first, then implement the service
  })

  // ===========================================
  // METHOD 1: [methodName]()
  // ===========================================
  describe('[methodName]() method', () => {
    describe('Success Cases', () => {
      it('should return success for valid input with all fields', async () => {
        const input: [InputType] = {
          // Complete valid input
        }

        const result = await service.[methodName](input)

        // Verify ServiceResponse shape
        expect(result).toHaveProperty('success')
        expect(isSuccess(result)).toBe(true)

        if (isSuccess(result)) {
          const data: [OutputType] = result.data

          // Verify all required fields exist
          expect(data).toHaveProperty('[field1]')
          expect(data).toHaveProperty('[field2]')

          // Verify field types
          expect(typeof data.[field1]).toBe('[type]')
          expect(data.[field2]).toBeDefined()

          // Verify nested structures
          expect(Array.isArray(data.[arrayField])).toBe(true)
        }
      })

      it('should return success for minimal valid input', async () => {
        const input: [InputType] = {
          // Only required fields
        }

        const result = await service.[methodName](input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // Basic assertions
          expect(result.data).toBeDefined()
        }
      })

      // Add more success cases for:
      // - Edge cases
      // - Boundary values
      // - Special handling scenarios
    })

    describe('Error Cases', () => {
      it('should return error for [specific invalid case]', async () => {
        const input: [InputType] = {
          // Invalid input
        }

        const result = await service.[methodName](input)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe('[ERROR_CODE]')
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
          expect(result.error.message.length).toBeGreaterThan(0)
        }
      })

      // Add error test for each error code in the enum
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs: [InputType][] = [
          // @ts-expect-error - Testing runtime behavior
          {},
          // @ts-expect-error - Testing runtime behavior
          { field: null },
          // @ts-expect-error - Testing runtime behavior
          { field: undefined },
        ]

        for (const input of badInputs) {
          await expect(service.[methodName](input as any)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const input: [InputType] = { /* valid input */ }

        const result = await service.[methodName](input)

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
        const input: [InputType] = { /* valid input */ }

        const result = await service.[methodName](input)

        if (isSuccess(result)) {
          const data = result.data

          expect(() => {
            // @ts-expect-error - Testing readonly enforcement
            data.[someField] = 'changed'
          }).toThrow()
        }
      })
    })
  })

  // Repeat for each method in the interface
})
```

---

## Contract-Specific Guidance

### 1. RhymeAnalysis (Seam #6) - Medium Complexity

**Priority**: P1 (High)
**Dependencies**: None
**Methods**: 6

#### Specific Considerations:
- **Complex output types**: RhymeAnalysis has nested structures (AnalyzedLine, RhymePair, InternalRhyme)
- **Enum testing**: Test all RhymeQuality and RhymeType enum values
- **Edge cases**:
  - Lines with no rhymes
  - All lines rhyme with each other
  - Internal rhymes vs end rhymes
  - Multi-syllable rhymes
  - Empty/whitespace lines

#### Key Test Scenarios:
```typescript
// Test rhyme quality detection
it('should detect perfect rhyme', async () => {
  const lines = ['The cat sat on the mat', 'She wore a fancy hat']
  const result = await service.analyzeLines(lines)

  if (isSuccess(result)) {
    expect(result.data.rhymePairs[0].quality).toBe(RhymeQuality.PERFECT)
  }
})

// Test rhyme scheme detection
it('should detect ABAB rhyme scheme', async () => {
  const lines = [
    'Line ending with day',
    'Line ending with night',
    'Line ending with way',
    'Line ending with light'
  ]

  const result = await service.analyzeLines(lines)

  if (isSuccess(result)) {
    expect(result.data.rhymeScheme).toBe('ABAB')
  }
})
```

#### Time Estimate: **4-6 hours**
- Test file setup: 30 min
- Method tests (6 methods × 45 min): 4.5 hours
- Refinement and validation: 1 hour

---

### 2. SyllableCounting (Seam #7) - Medium Complexity

**Priority**: P1 (High)
**Dependencies**: None
**Methods**: 4-5

#### Specific Considerations:
- **Phonetic complexity**: Syllable counting can be tricky (subtle, rhythm, etc.)
- **Stress pattern detection**: x/ patterns need careful testing
- **Flow analysis**: Requires multiple lines to analyze flow consistency

#### Key Test Scenarios:
```typescript
// Test syllable counting accuracy
it('should count syllables correctly', async () => {
  const testCases = [
    { word: 'cat', expected: 1 },
    { word: 'happy', expected: 2 },
    { word: 'beautiful', expected: 3 },
    { word: 'temporarily', expected: 5 }
  ]

  for (const test of testCases) {
    const result = await service.countSyllables(test.word)
    if (isSuccess(result)) {
      expect(result.data).toBe(test.expected)
    }
  }
})

// Test stress pattern detection
it('should detect stress pattern', async () => {
  const line = 'The CAT sat ON the MAT'
  const result = await service.analyzeStress(line)

  if (isSuccess(result)) {
    expect(result.data.pattern).toMatch(/x\/x\/x\//i)
  }
})
```

#### Time Estimate: **3-4 hours**

---

### 3. SongGeneration (Seam #2) - Medium-High Complexity

**Priority**: P0 (Critical)
**Dependencies**: Seam #1 (InputValidation)
**Methods**: 6

#### Specific Considerations:
- **Complex input types**: GenerateSongInput, VoiceProfile, AudioGenerationContext
- **Complex output types**: GenerateSongOutput with Song, GenerationMetadata
- **Large data structures**: Song object with verses, choruses, bridge, etc.
- **Branded types**: SongId, VerseId, ChorusId, BridgeId
- **Optional sections**: Bridge, intro, outro

#### Key Test Scenarios:
```typescript
// Test complete song generation
it('should generate complete song with all sections', async () => {
  const input: GenerateSongInput = {
    prompt: validatedPrompt,
    constraints: {
      verseCount: 3,
      chorusCount: 1,
      includeBridge: true
    }
  }

  const result = await service.generate(input)

  if (isSuccess(result)) {
    const song = result.data.song

    expect(song.verses.length).toBe(3)
    expect(song.choruses.length).toBeGreaterThanOrEqual(1)
    expect(song.bridge).toBeDefined()

    // Verify Song structure
    expect(song.id).toBeDefined()
    expect(song.title).toBeDefined()
    expect(song.metadata).toBeDefined()
  }
})

// Test voice profile extraction
it('should extract voice profile from song', async () => {
  const result = await service.extractVoiceProfile(existingSong)

  if (isSuccess(result)) {
    expect(result.data.vocabulary).toBeInstanceOf(Array)
    expect(result.data.perspectivePOV).toBeDefined()
  }
})
```

#### Time Estimate: **6-8 hours**

---

### 4. CritiqueEngine (Seam #3) - High Complexity

**Priority**: P0 (Critical)
**Dependencies**: Seam #2, #6, #7
**Methods**: 8

#### Specific Considerations:
- **Most complex contract**: Many enums, nested types, complex logic
- **Multiple analysis dimensions**: Rhyme, flow, imagery, emotion, voice, structure
- **Quality scoring**: QualityScore branded type, multiple score types
- **Large output structures**: CritiqueReport with maps, arrays, nested objects
- **Enum testing**: IssueType (30+ values), QualityLevel, ClicheType, etc.

#### Key Test Scenarios:
```typescript
// Test comprehensive analysis
it('should analyze song and return complete critique', async () => {
  const result = await service.analyzeSong(testSong, CritiqueLevel.PROFESSIONAL)

  if (isSuccess(result)) {
    const report = result.data

    // Verify all required fields
    expect(report.songId).toBe(testSong.id)
    expect(report.overallScore).toBeGreaterThanOrEqual(0)
    expect(report.overallScore).toBeLessThanOrEqual(100)
    expect(report.passesGoldStandard).toBeDefined()
    expect(report.qualityLevel).toBeDefined()

    // Verify scores object
    expect(report.scores.rhymeQuality).toBeDefined()
    expect(report.scores.flowConsistency).toBeDefined()

    // Verify collections
    expect(Array.isArray(report.issues)).toBe(true)
    expect(Array.isArray(report.suggestions)).toBe(true)
    expect(Array.isArray(report.strengths)).toBe(true)
  }
})

// Test gold standard check
it('should correctly identify gold standard songs', async () => {
  const perfectSong = createPerfectSong()
  const result = await service.passesGoldStandard(perfectSong)

  if (isSuccess(result)) {
    expect(result.data).toBe(true)
  }
})

// Test issue type detection
it('should detect clichés', async () => {
  const result = await service.detectCliches('heart on my sleeve, stars in your eyes')

  if (isSuccess(result)) {
    expect(result.data.cliches.length).toBeGreaterThan(0)
    expect(result.data.cliches[0].type).toBeDefined()
  }
})
```

#### Time Estimate: **10-12 hours** (largest contract)

---

### 5. RevisionEngine (Seam #4) - High Complexity

**Priority**: P0 (Critical)
**Dependencies**: Seam #2, #3
**Methods**: 7

#### Specific Considerations:
- **Complex transformations**: Song → Revised Song
- **Strategy pattern**: RevisionStrategy enum with 5 different approaches
- **Change tracking**: ChangeRecord array with detailed metadata
- **Before/after comparison**: ImprovementMetrics with ScoreChange
- **Voice preservation**: Critical requirement to test thoroughly
- **Alternative generation**: Multiple creative directions

#### Key Test Scenarios:
```typescript
// Test song revision
it('should revise song based on critique', async () => {
  const input: RevisionInput = {
    song: originalSong,
    critique: critiqueReport,
    strategy: RevisionStrategy.MODERATE,
    preserveVoice: true
  }

  const result = await service.reviseSong(input)

  if (isSuccess(result)) {
    const revision = result.data

    // Verify revised song
    expect(revision.revisedSong.id).toBe(originalSong.id)
    expect(revision.revisedSong).not.toEqual(originalSong)

    // Verify changes are tracked
    expect(Array.isArray(revision.changes)).toBe(true)
    expect(revision.changes.length).toBeGreaterThan(0)

    // Verify improvement metrics
    expect(revision.improvementMetrics.afterScore).toBeGreaterThan(
      revision.improvementMetrics.beforeScore
    )

    // Verify voice consistency
    expect(revision.voiceConsistency).toBeGreaterThanOrEqual(80)
  }
})

// Test voice preservation
it('should preserve original voice in revision', async () => {
  const result = await service.checkVoicePreservation(
    originalSong,
    revisedSong,
    voiceProfile
  )

  if (isSuccess(result)) {
    expect(result.data.passed).toBe(true)
    expect(result.data.consistencyScore).toBeGreaterThanOrEqual(85)
    expect(result.data.violations.length).toBe(0)
  }
})
```

#### Time Estimate: **8-10 hours**

---

### 6. SunoFormatter (Seam #5) - Medium Complexity

**Priority**: P0 (Critical)
**Dependencies**: Seam #2
**Methods**: 4-5

#### Specific Considerations:
- **Platform-specific formatting**: Suno has specific requirements
- **Metadata handling**: Tags, style descriptors, instrumentation
- **Section markers**: [Verse], [Chorus], [Bridge] formatting
- **Character limits**: Suno has platform constraints
- **Format validation**: Must validate output format

#### Key Test Scenarios:
```typescript
// Test Suno format generation
it('should format song for Suno platform', async () => {
  const result = await service.formatForSuno(testSong)

  if (isSuccess(result)) {
    const formatted = result.data.formattedText

    // Verify Suno-specific markers
    expect(formatted).toContain('[Verse')
    expect(formatted).toContain('[Chorus')

    // Verify metadata
    expect(result.data.metadata.genre).toBeDefined()
    expect(result.data.metadata.tags.length).toBeGreaterThan(0)
  }
})

// Test format validation
it('should validate Suno format', async () => {
  const validFormat = '[Verse 1]\nLyrics here\n\n[Chorus]\nMore lyrics'
  const result = await service.validateFormat(validFormat)

  if (isSuccess(result)) {
    expect(result.data).toBe(true)
  }
})
```

#### Time Estimate: **4-5 hours**

---

### 7. GeminiAudio (Seam #8) - Medium Complexity

**Priority**: P2 (Lower)
**Dependencies**: None
**Methods**: 3-4

#### Specific Considerations:
- **File handling**: Audio file paths, base64, URLs
- **API integration**: External Gemini API (mock in tests)
- **Audio analysis results**: Tempo, mood, rhythm, melody extraction
- **Error handling**: File not found, unsupported format, API errors

#### Key Test Scenarios:
```typescript
// Test audio analysis
it('should analyze audio file and extract metadata', async () => {
  const input = {
    audioPath: '/path/to/test.mp3',
    analysisType: 'full'
  }

  const result = await service.analyzeAudio(input)

  if (isSuccess(result)) {
    expect(result.data.tempo).toBeDefined()
    expect(result.data.mood).toBeDefined()
    expect(result.data.emotions.length).toBeGreaterThan(0)
  }
})

// Test unsupported format error
it('should return error for unsupported audio format', async () => {
  const input = { audioPath: '/path/to/file.txt' }

  const result = await service.analyzeAudio(input)

  expect(isFailure(result)).toBe(true)
  if (isFailure(result)) {
    expect(result.error.code).toBe('UNSUPPORTED_FORMAT')
  }
})
```

#### Time Estimate: **3-4 hours**

---

### 8. Export (Seam #9) - Simple-Medium Complexity

**Priority**: P1
**Dependencies**: Seam #5
**Methods**: 4-6

#### Specific Considerations:
- **Multiple formats**: Plain text, Markdown, PDF, JSON, Suno format
- **Format-specific options**: Page size for PDF, syntax highlighting for Markdown
- **File system operations**: Write to file, return buffer
- **Encoding handling**: UTF-8, ASCII, etc.

#### Key Test Scenarios:
```typescript
// Test export to different formats
it('should export song to plain text', async () => {
  const result = await service.exportToText(testSong)

  if (isSuccess(result)) {
    expect(typeof result.data).toBe('string')
    expect(result.data).toContain(testSong.title)
    expect(result.data).toContain(testSong.verses[0].lines[0].text)
  }
})

// Test PDF export with options
it('should export song to PDF with custom options', async () => {
  const options = {
    pageSize: 'A4',
    includeMetadata: true,
    fontSize: 12
  }

  const result = await service.exportToPDF(testSong, options)

  if (isSuccess(result)) {
    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.data.length).toBeGreaterThan(0)
  }
})
```

#### Time Estimate: **4-5 hours**

---

### 9. History (Seam #10) - Simple-Medium Complexity

**Priority**: P1
**Dependencies**: All seams (observes all changes)
**Methods**: 5-7

#### Specific Considerations:
- **Version control**: Track song versions over time
- **Diff generation**: Show what changed between versions
- **Query operations**: Search history, filter by criteria
- **Storage management**: Limit history size, cleanup old versions
- **Metadata tracking**: Who, when, what changed

#### Key Test Scenarios:
```typescript
// Test save version
it('should save song version to history', async () => {
  const input = {
    song: testSong,
    changeDescription: 'Updated verse 2 based on critique',
    changeTags: ['revision', 'verse-improvement']
  }

  const result = await service.saveVersion(input)

  if (isSuccess(result)) {
    expect(result.data.versionId).toBeDefined()
    expect(result.data.versionNumber).toBeGreaterThan(0)
  }
})

// Test retrieve history
it('should retrieve song history', async () => {
  const result = await service.getHistory(testSong.id)

  if (isSuccess(result)) {
    expect(Array.isArray(result.data.versions)).toBe(true)
    expect(result.data.versions.length).toBeGreaterThan(0)

    const firstVersion = result.data.versions[0]
    expect(firstVersion.versionNumber).toBeDefined()
    expect(firstVersion.timestamp).toBeInstanceOf(Date)
  }
})

// Test diff generation
it('should generate diff between versions', async () => {
  const result = await service.diffVersions(versionId1, versionId2)

  if (isSuccess(result)) {
    expect(result.data.changes.length).toBeGreaterThan(0)
    expect(result.data.additions).toBeDefined()
    expect(result.data.deletions).toBeDefined()
    expect(result.data.modifications).toBeDefined()
  }
})
```

#### Time Estimate: **4-6 hours**

---

## Time Estimates Summary

| Contract | Complexity | Methods | Estimated Time | Priority |
|----------|-----------|---------|----------------|----------|
| RhymeAnalysis | Medium | 6 | 4-6 hours | P1 |
| SyllableCounting | Medium | 4-5 | 3-4 hours | P1 |
| SongGeneration | Medium-High | 6 | 6-8 hours | P0 |
| CritiqueEngine | High | 8 | 10-12 hours | P0 |
| RevisionEngine | High | 7 | 8-10 hours | P0 |
| SunoFormatter | Medium | 4-5 | 4-5 hours | P0 |
| GeminiAudio | Medium | 3-4 | 3-4 hours | P2 |
| Export | Simple-Medium | 4-6 | 4-5 hours | P1 |
| History | Simple-Medium | 5-7 | 4-6 hours | P1 |

**Total Estimated Time**: 46-60 hours

### Recommended Order:
1. **RhymeAnalysis** (no dependencies, simpler) - 4-6h
2. **SyllableCounting** (no dependencies, simpler) - 3-4h
3. **SongGeneration** (depends on InputValidation) - 6-8h
4. **SunoFormatter** (depends on SongGeneration) - 4-5h
5. **CritiqueEngine** (depends on SongGeneration, RhymeAnalysis, SyllableCounting) - 10-12h
6. **RevisionEngine** (depends on SongGeneration, CritiqueEngine) - 8-10h
7. **Export** (depends on SunoFormatter) - 4-5h
8. **History** (depends on all, but can be tested in isolation) - 4-6h
9. **GeminiAudio** (no dependencies, lower priority) - 3-4h

---

## Common Pitfalls to Avoid

### 1. **Forgetting to Test All Error Codes**
❌ **Wrong**: Only testing 2-3 error cases
✅ **Right**: Test EVERY error code defined in the ErrorCodeEnum

```typescript
// Check the enum for all codes
export enum ServiceErrorCode {
  ERROR_1 = 'ERROR_1',  // ← Need test
  ERROR_2 = 'ERROR_2',  // ← Need test
  ERROR_3 = 'ERROR_3',  // ← Need test
}
```

### 2. **Not Testing Readonly Enforcement**
❌ **Wrong**: Assuming TypeScript readonly is enough
✅ **Right**: Test runtime readonly behavior with Object.freeze

```typescript
it('should preserve readonly semantics on output', async () => {
  const result = await service.method(input)

  if (isSuccess(result)) {
    expect(() => {
      // @ts-expect-error - Testing readonly enforcement
      result.data.field = 'changed'
    }).toThrow()
  }
})
```

### 3. **Incomplete ServiceResponse Shape Testing**
❌ **Wrong**: Only checking `result.success`
✅ **Right**: Verify discriminated union is properly enforced

```typescript
// Must verify: if success=true, has data and no error
// Must verify: if success=false, has error and no data
if (result.success) {
  expect(result).toHaveProperty('data')
  expect(result).not.toHaveProperty('error')
}
```

### 4. **Not Testing with @ts-expect-error for Runtime Safety**
❌ **Wrong**: Only testing TypeScript-valid inputs
✅ **Right**: Test runtime behavior with invalid types

```typescript
it('should handle null gracefully', async () => {
  // @ts-expect-error - Testing runtime behavior
  const result = await service.method(null)

  // Should return error, not throw
  expect(isFailure(result)).toBe(true)
})
```

### 5. **Forgetting Array/Collection Edge Cases**
❌ **Wrong**: Only testing with normal arrays
✅ **Right**: Test empty, single-item, and large arrays

```typescript
it('should handle empty array', async () => {
  const result = await service.analyzeLines([])
  // Should handle gracefully
})

it('should handle single line', async () => {
  const result = await service.analyzeLines(['one line'])
  // Should work
})
```

### 6. **Not Testing Nested Object Structures**
❌ **Wrong**: Only testing top-level fields
✅ **Right**: Verify entire object tree

```typescript
if (isSuccess(result)) {
  // Top level
  expect(result.data).toHaveProperty('scores')

  // Nested level
  expect(result.data.scores).toHaveProperty('rhymeQuality')
  expect(result.data.scores.rhymeQuality).toBeGreaterThanOrEqual(0)

  // Deep nested
  expect(result.data.lineAnalysis.get(0)?.issues[0]).toBeDefined()
}
```

### 7. **Skipping the Contract Compliance Tests**
❌ **Wrong**: Only testing happy path and errors
✅ **Right**: ALWAYS include all 3 contract compliance tests

Required for every method:
1. Never throws exceptions
2. Always returns ServiceResponse shape
3. Preserves readonly semantics

### 8. **Not Using Type Guards Properly**
❌ **Wrong**: Accessing result.data without type guard
✅ **Right**: Use isSuccess/isFailure before accessing

```typescript
// ❌ WRONG
const data = result.data  // TypeScript error!

// ✅ CORRECT
if (isSuccess(result)) {
  const data = result.data  // Type-safe!
}
```

### 9. **Testing Implementation Details Instead of Contract**
❌ **Wrong**: Testing internal algorithms
✅ **Right**: Testing contract requirements only

```typescript
// ❌ WRONG - Testing how it works internally
expect(mockService.internalCache).toBeDefined()

// ✅ CORRECT - Testing what the contract promises
expect(result.data.rhymeScheme).toBe('ABAB')
```

### 10. **Inconsistent Test Naming**
❌ **Wrong**: Random test names
✅ **Right**: Consistent "should [action] [condition]" format

```typescript
// ❌ WRONG
it('valid input', async () => { ... })
it('test error', async () => { ... })

// ✅ CORRECT
it('should return success for valid input', async () => { ... })
it('should return error for empty input', async () => { ... })
```

---

## Quality Checklist

Before considering a test file complete, verify:

### Documentation
- [ ] File header with @fileoverview, @purpose, TDD note
- [ ] NOTE comment about mock vs real implementation
- [ ] Clear describe blocks for each method
- [ ] Comments explaining complex test scenarios

### Coverage
- [ ] All interface methods have tests
- [ ] All error codes have corresponding tests
- [ ] Success cases: minimal input + complete input + edge cases
- [ ] Error cases: all error codes covered
- [ ] Contract compliance: all 3 tests for each method

### Type Safety
- [ ] All imports use `type` keyword for types
- [ ] Type guards (isSuccess/isFailure) used correctly
- [ ] @ts-expect-error used for intentional type violations
- [ ] Output types explicitly declared in tests

### Assertions
- [ ] toHaveProperty() for required fields
- [ ] toBeDefined() for existence checks
- [ ] Type checks (typeof, instanceof, Array.isArray)
- [ ] Boundary checks (toBeGreaterThan, toBeLessThan)
- [ ] String content checks (toContain, toMatch)
- [ ] Error structure verified (code, message, suggestion)

### Readonly Testing
- [ ] At least one test per method verifies readonly enforcement
- [ ] Tests expect mutations to throw
- [ ] Tests cover different readonly levels (properties, nested objects)

### Edge Cases
- [ ] Empty inputs tested
- [ ] Null/undefined tested (with @ts-expect-error)
- [ ] Boundary values tested (min, max)
- [ ] Special characters tested (if relevant)
- [ ] Array edge cases tested (empty, single, many)

### Validation
- [ ] `npm run check` passes (0 TypeScript errors)
- [ ] `npm test` passes all tests
- [ ] No 'any' types used (except with @ts-expect-error in tests)
- [ ] No skipped tests (no .skip())
- [ ] No focused tests (no .only())

### Consistency with InputValidation.test.ts
- [ ] Same file structure
- [ ] Same documentation style
- [ ] Same test organization (Success/Error/Compliance)
- [ ] Same type guard patterns
- [ ] Same assertion patterns

---

## Quick Reference: Test Writing Steps

### Step 1: Setup (15-30 min)
1. Create test file: `/tests/contracts/[ServiceName].test.ts`
2. Copy template from this guide
3. Import contract types and service interface
4. Add beforeEach with TODO comment

### Step 2: For Each Method (30-90 min per method)
1. Create describe block for method
2. Add Success Cases describe block
   - Valid complete input test
   - Valid minimal input test
   - Edge case tests (2-3)
3. Add Error Cases describe block
   - One test per error code
   - Null/undefined tests
4. Add Contract Compliance describe block
   - Never throws test
   - ServiceResponse shape test
   - Readonly enforcement test

### Step 3: Validation (30 min)
1. Run `npm run check` → fix any TypeScript errors
2. Run `npm test -- [TestFile].test.ts` → verify all pass (they should fail initially)
3. Review against quality checklist
4. Document any special considerations

### Step 4: Document Findings (15 min)
1. Add comments for complex test scenarios
2. Note any ambiguities in contract
3. Update this guide if new patterns emerge

---

## Example: Complete Test for a Simple Method

```typescript
describe('isValid() method', () => {
  describe('Success Cases', () => {
    it('should return true for valid input', async () => {
      const result = await service.isValid('This is valid input text')

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data).toBe(true)
        expect(typeof result.data).toBe('boolean')
      }
    })

    it('should return false for invalid input', async () => {
      const result = await service.isValid('x')  // Too short

      expect(isSuccess(result)).toBe(true)  // Success response, but data is false
      if (isSuccess(result)) {
        expect(result.data).toBe(false)
      }
    })
  })

  describe('Error Cases', () => {
    it('should handle empty string gracefully', async () => {
      const result = await service.isValid('')

      // May return success with data=false, or error - depends on contract
      expect(result).toHaveProperty('success')
    })
  })

  describe('Contract Compliance', () => {
    it('should never throw', async () => {
      await expect(service.isValid('')).resolves.toBeDefined()
      // @ts-expect-error - Testing runtime behavior
      await expect(service.isValid(null)).resolves.toBeDefined()
      // @ts-expect-error - Testing runtime behavior
      await expect(service.isValid(undefined)).resolves.toBeDefined()
    })

    it('should always return ServiceResponse shape', async () => {
      const result = await service.isValid('test')

      expect(result).toHaveProperty('success')
      expect(typeof result.success).toBe('boolean')

      if (result.success) {
        expect(result).toHaveProperty('data')
      } else {
        expect(result).toHaveProperty('error')
      }
    })
  })
})
```

---

## Final Notes

### Remember:
1. **Tests come FIRST** - Don't look at implementation
2. **Test the CONTRACT** - Not implementation details
3. **Be thorough** - Better too many tests than too few
4. **Stay consistent** - Follow InputValidation.test.ts patterns
5. **Document edge cases** - Help future developers understand
6. **Validate frequently** - Run `npm run check` and `npm test` often

### When Stuck:
1. Look at InputValidation.test.ts for patterns
2. Read the contract interface carefully
3. Consider: "What could go wrong with this method?"
4. Test boundary conditions
5. Ask: "Does this match the ServiceResponse pattern?"

### Success Metrics:
- ✅ All methods tested
- ✅ All error codes tested
- ✅ All contract compliance tests present
- ✅ TypeScript errors = 0
- ✅ Test coverage matches or exceeds InputValidation.test.ts
- ✅ Tests are clear and well-documented

---

**This guide ensures all 9 remaining contract tests maintain the same high quality as InputValidation.test.ts.**

**Last Updated**: 2025-11-14
**Version**: 1.0
**Next Review**: After completing first 3 contract tests
