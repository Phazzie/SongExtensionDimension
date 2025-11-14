# CLAUDE.md - AI Assistant Context

**Project**: VSCode Songwriting Assistant
**Methodology**: Seam-Driven Development (SDD) + Test-Driven Development (TDD)
**Last Updated**: 2025-11-14
**Current Phase**: Phase 3 (BUILD)

---

## 🎯 Purpose of This Document

This document provides complete context for AI assistants (Claude, ChatGPT, etc.) working on this codebase. It ensures consistent understanding of:
- Project architecture and methodology
- Current development phase and status
- Critical rules and constraints
- Common patterns and anti-patterns
- How to navigate the codebase effectively

---

## 📋 Quick Context Summary

### What This Project Is:
An AI-powered VSCode extension that helps songwriters create professional-quality lyrics using Gemini AI, with built-in quality analysis, iterative revision, and Suno platform integration.

### Current Status:
- **Phase 1 (IDENTIFY)**: ✅ COMPLETE - All 10 seams mapped in DATA-BOUNDARIES.md
- **Phase 2 (DEFINE)**: ✅ COMPLETE - All 10 contracts defined in /src/contracts/
- **Phase 3 (BUILD)**: 🔄 IN PROGRESS - Writing tests FIRST, then mocks (TDD)
  - Tests written: 1/10 (InputValidation.test.ts)
  - Mocks implemented: 0/10
- **Phase 4-6**: ⏳ PENDING

### Critical Constraints:
- ✅ TypeScript errors: **MUST BE 0** at all times
- ✅ 'any' types: **FORBIDDEN** - use proper types or type guards
- ✅ Contracts: **IMMUTABLE** after Phase 2 - no modifications allowed
- ✅ TDD: **MANDATORY** - tests written BEFORE implementation
- ✅ Readonly: **MUST HANDLE CORRECTLY** - build values before creating readonly objects

---

## 🏗️ Architecture Overview

### Seam-Driven Development (SDD)

This project uses SDD, which means:
1. Identify all data transformation points ("seams") upfront
2. Define immutable contracts for each seam
3. Build and test mocks that match contracts exactly
4. Develop UI against mocks
5. Implement real services
6. Integrate real services (should work seamlessly)

**Key Insight**: Contracts are the single source of truth. Everything else must match them exactly.

### The 10 Seams (Data Transformation Points)

| Seam # | Name | Purpose | Priority | Dependencies |
|--------|------|---------|----------|--------------|
| 1 | InputValidation | Validate & sanitize user input | P0 | None |
| 2 | SongGeneration | Generate lyrics from prompts | P0 | #1 |
| 3 | CritiqueEngine | Analyze song quality | P0 | #2, #6, #7 |
| 4 | RevisionEngine | Improve songs iteratively | P0 | #2, #3 |
| 5 | SunoFormatter | Format for Suno platform | P0 | #2 |
| 6 | RhymeAnalysis | Analyze rhyme patterns | P1 | None |
| 7 | SyllableCounting | Count syllables & stress | P1 | None |
| 8 | GeminiAudio | Analyze audio files | P2 | None |
| 9 | Export | Export to various formats | P1 | #5 |
| 10 | History | Version control & history | P1 | All |

**Data Flow**:
```
User Input → [1] → [2] → [3] → [4] → [5] → [9]
                      ↑          ↑
                   [6][7]     [10]
                      ↑
                    [8]
```

---

## 📁 Codebase Structure

```
/SongExtensionDimension/
├── 📄 Documentation (READ THESE FIRST)
│   ├── README.md              # Project overview, quick start
│   ├── DATA-BOUNDARIES.md     # All 10 seams documented (Phase 1)
│   ├── SEAMSLIST.md          # Implementation roadmap
│   ├── PROGRESS.md           # Detailed development progress
│   ├── LESSONS-LEARNED.md    # Critical lessons from Phases 1-2
│   ├── CLAUDE.md             # This file - AI assistant context
│   ├── copilot-instructions.md # GitHub Copilot context
│   └── AGENTS.md             # Sub-agent usage guide
│
├── 🔒 src/contracts/         # IMMUTABLE CONTRACTS (Phase 2)
│   ├── types/
│   │   ├── common.ts         # ServiceResponse, error handling
│   │   └── song.ts           # Song domain types
│   ├── InputValidation.ts    # Seam #1 contract
│   ├── SongGeneration.ts     # Seam #2 contract
│   ├── CritiqueEngine.ts     # Seam #3 contract
│   ├── RevisionEngine.ts     # Seam #4 contract
│   ├── SunoFormatter.ts      # Seam #5 contract
│   ├── RhymeAnalysis.ts      # Seam #6 contract
│   ├── SyllableCounting.ts   # Seam #7 contract
│   ├── GeminiAudio.ts        # Seam #8 contract
│   ├── Export.ts             # Seam #9 contract
│   ├── History.ts            # Seam #10 contract
│   └── index.ts              # Barrel export
│
├── 🧪 tests/                 # TEST-DRIVEN DEVELOPMENT
│   ├── contracts/            # Contract tests (written FIRST)
│   │   └── InputValidation.test.ts  # ✅ Complete
│   ├── services/mock/        # Mock unit tests (future)
│   └── integration/          # Integration tests (future)
│
├── 🎭 src/services/          # IMPLEMENTATIONS (Phase 3-5)
│   ├── mock/                 # Mock services (Phase 3, TDD)
│   │   └── (empty - awaiting tests)
│   ├── real/                 # Real services (Phase 5)
│   └── factory.ts            # Service factory (future)
│
├── 🎨 src/ui/                # VSCode UI (Phase 4)
│   └── (pending)
│
└── ⚙️ Configuration
    ├── package.json          # Dependencies & scripts
    ├── tsconfig.json         # TypeScript strict config
    ├── jest.config.js        # Jest test config
    └── .gitignore           # Git ignore rules
```

---

## 🚨 CRITICAL RULES (Must Follow)

### 1. **Contracts Are Immutable**
- ❌ **NEVER** modify files in `/src/contracts/` after Phase 2
- ✅ If changes needed, create a v2 contract alongside
- **Why**: Prevents breaking downstream code that depends on contracts

### 2. **Test-Driven Development (TDD) Is Mandatory**
- ❌ **NEVER** write implementation before writing tests
- ✅ **ALWAYS** follow: Write Test → Run Test (fail) → Implement → Run Test (pass)
- **Why**: Prevents contract violations and ensures correctness

### 3. **Zero TypeScript Errors Always**
- ❌ **NEVER** commit code with TypeScript errors
- ✅ Run `npm run check` after every change
- **Why**: Strict typing catches bugs at compile time

### 4. **No 'any' Types Ever**
- ❌ **NEVER** use `any`, `as any`, or `@ts-ignore` (except in tests for edge cases)
- ✅ Use proper types, type guards, or `unknown` + validation
- **Why**: Type safety is core to project quality

### 5. **Handle Readonly Properties Correctly**
- ❌ **NEVER** assign to readonly properties after creation
```typescript
// ❌ WRONG
const obj: ReadonlyType = { field: 'initial' }
obj.field = 'changed' // ERROR!

// ✅ CORRECT
const value = computeValue()
const obj: ReadonlyType = { field: value }
```
- **Why**: Immutability prevents bugs and enables safe concurrency

### 6. **ServiceResponse Pattern Always**
- ❌ **NEVER** throw exceptions across seam boundaries
- ✅ **ALWAYS** return `ServiceResponse<T>` with success/error union
```typescript
// ✅ CORRECT
return createSuccess(data)
return createFailure(error)

// ❌ WRONG
throw new Error('something failed')
```
- **Why**: Predictable error handling and type-safe error paths

### 7. **Validate at Seam Boundaries**
- ✅ Validate inputs at entry to every seam
- ✅ Use type guards for runtime validation
- ✅ Return descriptive errors with suggestions
- **Why**: Fail fast with helpful messages

---

## 🎨 Common Patterns

### Pattern 1: ServiceResponse
```typescript
import { createSuccess, createFailure, createError } from './contracts/types/common'

async function mySeamMethod(input: Input): Promise<ServiceResponse<Output>> {
  // Validate input
  if (!input.requiredField) {
    return createFailure(
      createError(
        'INVALID_INPUT',
        'Missing required field',
        'Please provide a value for requiredField',
        'Field requiredField is required but was undefined'
      )
    )
  }

  // Build all values BEFORE creating readonly objects
  const value1 = computeValue1(input)
  const value2 = computeValue2(input)

  // Create readonly output in one statement
  const output: Output = {
    field1: value1,
    field2: value2,
    // ... all required fields
  }

  return createSuccess(output)
}
```

### Pattern 2: Type Guards
```typescript
export function isSuccess<T>(response: ServiceResponse<T>): response is ServiceSuccess<T> {
  return response.success === true
}

export function isFailure<T>(response: ServiceResponse<T>): response is ServiceFailure {
  return response.success === false
}

// Usage:
const result = await service.method(input)
if (isSuccess(result)) {
  console.log(result.data) // TypeScript knows data exists
} else {
  console.error(result.error) // TypeScript knows error exists
}
```

### Pattern 3: Branded Types
```typescript
export type SongId = string & { readonly __brand: 'SongId' }

export function createSongId(id: string): SongId {
  if (!id || id.trim().length === 0) {
    throw new Error('SongId cannot be empty')
  }
  return id as SongId
}

// Usage:
const songId = createSongId('song_123')
// TypeScript prevents: const badId: SongId = 'raw_string'
```

### Pattern 4: Readonly Object Creation
```typescript
// ❌ WRONG - Mutation after creation
const song: Song = {
  id: createSongId('123'),
  title: '',
  verses: []
}
song.title = 'My Song' // ERROR: Cannot assign to readonly property

// ✅ CORRECT - Build first, create once
const title = generateTitle(input)
const verses = generateVerses(input)
const choruses = generateChoruses(input)

const song: Song = {
  id: createSongId('123'),
  title,
  verses,
  choruses,
  bridge: null,
  metadata: {
    created: new Date(),
    version: 1
  }
}
```

---

## ⚠️ Common Anti-Patterns (Avoid These)

### Anti-Pattern 1: Modifying Contracts
```typescript
// ❌ WRONG - Modifying existing contract
// File: /src/contracts/SongGeneration.ts
export interface Song {
  id: SongId
  title: string
  newField: string // DON'T ADD TO EXISTING CONTRACT
}

// ✅ CORRECT - Create v2 contract
// File: /src/contracts/SongGenerationV2.ts
export interface SongV2 extends Song {
  newField: string
}
```

### Anti-Pattern 2: Implementation Before Tests
```typescript
// ❌ WRONG - Writing mock first
// Step 1: Create MockInputValidationService
// Step 2: Write tests later

// ✅ CORRECT - TDD approach
// Step 1: Write InputValidation.test.ts
// Step 2: Run tests (they fail - expected)
// Step 3: Create MockInputValidationService to pass tests
// Step 4: Tests now pass!
```

### Anti-Pattern 3: Using 'any' Type
```typescript
// ❌ WRONG
function processData(data: any) {
  return data.field // No type safety
}

// ✅ CORRECT
function processData<T extends { field: string }>(data: T): string {
  return data.field // Type-safe
}

// ✅ ALSO CORRECT
function processData(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'field' in data) {
    return (data as { field: string }).field
  }
  throw new Error('Invalid data shape')
}
```

### Anti-Pattern 4: Throwing Exceptions Across Seams
```typescript
// ❌ WRONG
async function generateSong(input: Input): Promise<Song> {
  if (!input.prompt) {
    throw new Error('Prompt required') // Breaks contract
  }
  // ...
}

// ✅ CORRECT
async function generateSong(input: Input): Promise<ServiceResponse<Song>> {
  if (!input.prompt) {
    return createFailure(
      createError('INVALID_INPUT', 'Prompt required', 'Please provide a prompt')
    )
  }
  // ...
}
```

---

## 🧪 Test-Driven Development (TDD) Workflow

### Red-Green-Refactor Cycle

**1. RED Phase - Write Failing Test**
```typescript
// File: tests/contracts/InputValidation.test.ts
it('should validate prompt length', async () => {
  const result = await service.validate({ prompt: 'short' })

  expect(isFailure(result)).toBe(true)
  if (isFailure(result)) {
    expect(result.error.code).toBe('PROMPT_TOO_SHORT')
  }
})
```
Run: `npm test -- InputValidation.test.ts` → **FAILS** (expected)

**2. GREEN Phase - Make Test Pass**
```typescript
// File: src/services/mock/MockInputValidation.ts
async validate(input: RawPromptInput): Promise<ServiceResponse<ValidationResult>> {
  if (input.prompt.length < 10) {
    return createFailure(
      createError('PROMPT_TOO_SHORT', 'Prompt too short', 'Use at least 10 characters')
    )
  }
  // ...
}
```
Run: `npm test -- InputValidation.test.ts` → **PASSES** ✅

**3. REFACTOR Phase - Improve Code**
```typescript
// Extract constant
const MIN_PROMPT_LENGTH = 10

async validate(input: RawPromptInput): Promise<ServiceResponse<ValidationResult>> {
  if (input.prompt.length < MIN_PROMPT_LENGTH) {
    return createFailure(
      createError(
        'PROMPT_TOO_SHORT',
        `Prompt must be at least ${MIN_PROMPT_LENGTH} characters`,
        'Please provide more detail in your prompt'
      )
    )
  }
  // ...
}
```
Run: `npm test -- InputValidation.test.ts` → **STILL PASSES** ✅

---

## 📚 Key Documentation Files

### Must-Read Before Starting:
1. **README.md** - Project overview, quick start, current status
2. **DATA-BOUNDARIES.md** - Complete seam analysis (Phase 1 output)
3. **PROGRESS.md** - Detailed progress tracking with metrics
4. **This file (CLAUDE.md)** - AI assistant context

### Reference During Development:
5. **LESSONS-LEARNED.md** - Critical lessons from Phases 1-2
6. **SEAMSLIST.md** - Implementation roadmap with templates
7. **/src/contracts/*.ts** - Contract definitions (source of truth)

---

## 🛠️ Development Commands

```bash
# TypeScript validation (must show 0 errors)
npm run check

# Compile TypeScript
npm run compile

# Watch mode (auto-compile on changes)
npm run watch

# Run all tests
npm test

# Run specific test file
npm test -- InputValidation.test.ts

# Run tests with coverage
npm test -- --coverage

# Run contract tests only
npm run test:contracts
```

---

## 🎯 Current Phase 3 (BUILD) Status

### What's Done:
- ✅ Test infrastructure created (`/tests/contracts/`)
- ✅ First contract test written (`InputValidation.test.ts`)
- ✅ TDD methodology documented
- ✅ Previous broken mock deleted (fresh start)

### What's Next (In Order):
1. Implement `MockInputValidationService` to pass existing tests
2. Write `RhymeAnalysis.test.ts`
3. Implement `MockRhymeAnalysisService` to pass tests
4. Write `SyllableCounting.test.ts`
5. Implement `MockSyllableCountingService` to pass tests
6. Continue for remaining 7 services

### Success Criteria for Phase 3:
- [ ] All 10 contract test files written
- [ ] All 10 mock services implemented
- [ ] `npm run check` → 0 errors
- [ ] `npm test` → 100% pass rate
- [ ] No 'any' types introduced
- [ ] All tests follow TDD (written before mocks)

---

## 💡 Tips for AI Assistants Working on This Project

### When Asked to Implement a Feature:
1. **First**, check which phase we're in (currently Phase 3 - BUILD)
2. **Second**, check if it requires modifying contracts (if yes, create v2)
3. **Third**, if in Phase 3, write tests BEFORE implementation
4. **Fourth**, implement to make tests pass
5. **Finally**, run `npm run check` and `npm test` to validate

### When You See TypeScript Errors:
1. **Fix immediately** - don't defer or accumulate
2. Check for readonly property mutations (common issue)
3. Check for missing 'any' type replacements
4. Run `npm run check` to verify fix

### When Reviewing Code:
1. Check for TDD compliance (tests before mocks?)
2. Check for contract violations (does mock match interface?)
3. Check for 'any' types (should be zero)
4. Check for readonly handling (build before create?)
5. Check for ServiceResponse pattern (no throws?)

### When User Asks "What Should I Do Next?":
1. Check PROGRESS.md for current status
2. Check README.md "Next Steps" section
3. Provide specific, actionable next step with TDD approach

---

## 📞 Quick Reference

### Phase We're In:
**Phase 3: BUILD (TDD)** - Writing tests first, then mocks

### Current Task:
Implement `MockInputValidationService` to pass `InputValidation.test.ts`

### Files to Focus On:
- `/tests/contracts/InputValidation.test.ts` (test - already written)
- `/src/services/mock/MockInputValidation.ts` (mock - to be created)
- `/src/contracts/InputValidation.ts` (contract - immutable reference)

### Validation Commands:
```bash
npm run check  # Must be 0 errors
npm test -- InputValidation.test.ts  # Must pass
```

---

## 🔄 Methodology Summary

**Seam-Driven Development (SDD)**:
- Identify seams → Define contracts → Build mocks → Develop UI → Implement real → Integrate

**Test-Driven Development (TDD)**:
- Red (write test) → Green (make it pass) → Refactor (improve)

**Combined SDD + TDD**:
- Contracts define the "what"
- Tests define the "how it should behave"
- Mocks are implemented to pass tests
- UI is built against tested mocks
- Real services replace mocks seamlessly

---

**Remember**: Contracts are immutable. Tests come first. Zero errors always. No 'any' types ever.

This project is a model of disciplined software development. Maintain that standard!
