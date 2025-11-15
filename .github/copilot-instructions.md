# GitHub Copilot Instructions

This file provides context and rules for GitHub Copilot when working on the VSCode Songwriting Assistant project.

---

## Project Context

**Type**: VSCode Extension
**Language**: TypeScript (strict mode)
**Methodology**: Seam-Driven Development (SDD) + Test-Driven Development (TDD)
**Current Phase**: Phase 3 (BUILD) - Writing tests before mocks
**AI Stack**: Google Gemini 2.0 Flash Experimental

---

## Critical Rules (NEVER Violate)

### 1. **Zero 'any' Types**
```typescript
// ❌ NEVER suggest:
function process(data: any) { ... }
const result: any = getValue()

// ✅ ALWAYS suggest:
function process<T>(data: T) { ... }
function process(data: unknown) {
  if (isValidData(data)) { ... }
}
```

### 2. **Contracts Are Immutable**
```typescript
// ❌ NEVER modify files in /src/contracts/
// Files: InputValidation.ts, SongGeneration.ts, etc.

// ✅ If changes needed, suggest creating v2:
// contracts/InputValidationV2.ts
```

### 3. **Test-Driven Development**
```typescript
// ❌ NEVER suggest implementing before testing:
// "Let's create MockInputValidationService first..."

// ✅ ALWAYS suggest TDD order:
// "Let's write InputValidation.test.ts first, then implement the mock"
```

### 4. **ServiceResponse Pattern**
```typescript
// ❌ NEVER suggest throwing exceptions:
throw new Error('validation failed')

// ✅ ALWAYS suggest ServiceResponse:
return createFailure(
  createError('INVALID_INPUT', 'Message', 'Suggestion')
)
```

### 5. **Readonly Property Handling**
```typescript
// ❌ NEVER suggest mutation after creation:
const song: Song = { id: createSongId('1'), title: '' }
song.title = 'My Song' // ERROR

// ✅ ALWAYS build values first:
const title = generateTitle()
const song: Song = { id: createSongId('1'), title }
```

---

## Code Patterns to Suggest

### Pattern: ServiceResponse Success
```typescript
async method(input: Input): Promise<ServiceResponse<Output>> {
  // Build all values BEFORE creating readonly object
  const field1 = computeField1(input)
  const field2 = computeField2(input)

  const output: Output = {
    field1,
    field2,
    // ... all required fields
  }

  return createSuccess(output)
}
```

### Pattern: ServiceResponse Failure
```typescript
if (!isValid(input)) {
  return createFailure(
    createError(
      'ERROR_CODE',
      'User-friendly message',
      'Helpful suggestion for user',
      'Technical details (optional)'
    )
  )
}
```

### Pattern: Type Guards
```typescript
if (isSuccess(result)) {
  // result.data is accessible here
  console.log(result.data)
} else {
  // result.error is accessible here
  console.error(result.error)
}
```

### Pattern: Branded Types
```typescript
// Use factory functions for branded types
const songId = createSongId('song_123')
const verseId = createVerseId('verse_1')
const score = createQualityScore(85)

// Don't suggest direct casting unless in factory function
```

---

## File Organization Patterns

### Test Files (Write First)
```typescript
// File: /tests/contracts/[ServiceName].test.ts

describe('[ServiceName] Contract Tests', () => {
  let service: I[ServiceName]Service

  beforeEach(() => {
    // Service instantiation will be added when mock is created
  })

  describe('Success Cases', () => {
    it('should return success for valid input', async () => {
      // Test implementation
    })
  })

  describe('Error Cases', () => {
    it('should return error for invalid input', async () => {
      // Test implementation
    })
  })

  describe('Contract Compliance', () => {
    it('should never throw exceptions', async () => {
      // Test implementation
    })
  })
})
```

### Mock Services (Write After Tests)
```typescript
// File: /src/services/mock/Mock[ServiceName].ts

/**
 * @fileoverview Mock [ServiceName] Service
 * @purpose Realistic mock implementation of I[ServiceName]Service
 */

import { createSuccess, createFailure, createError } from '../../contracts/types/common'
import type { I[ServiceName]Service } from '../../contracts/[ServiceName]'

export class Mock[ServiceName]Service implements I[ServiceName]Service {
  async method(input: Input): Promise<ServiceResponse<Output>> {
    // Implementation to pass tests
  }
}
```

---

## Import Patterns

### Prefer Named Imports
```typescript
// ✅ GOOD
import { createSuccess, createFailure } from '../../contracts/types/common'
import type { Song, Verse } from '../../contracts/types/song'

// ❌ AVOID
import * as common from '../../contracts/types/common'
```

### Type-Only Imports
```typescript
// ✅ GOOD - Use 'type' for interfaces/types
import type { IInputValidationService } from '../../contracts/InputValidation'

// ❌ AVOID - Don't mix value and type imports
import { IInputValidationService } from '../../contracts/InputValidation'
```

---

## Testing Patterns

### Assert ServiceResponse Shape
```typescript
const result = await service.method(input)

// Always check success flag
expect(result).toHaveProperty('success')

// Use type guards for narrowing
if (isSuccess(result)) {
  expect(result.data).toBeDefined()
  // Test data fields
} else {
  expect(result.error).toBeDefined()
  expect(result.error.code).toBe('EXPECTED_ERROR_CODE')
}
```

### Test Readonly Semantics
```typescript
if (isSuccess(result)) {
  expect(() => {
    // @ts-expect-error - Testing readonly enforcement
    result.data.field = 'changed'
  }).toThrow()
}
```

---

## Documentation Patterns

### JSDoc for Public Functions
```typescript
/**
 * Validates and sanitizes user input prompts
 *
 * @param input - Raw user input with optional context and constraints
 * @returns ServiceResponse with validated prompt or error
 *
 * @example
 * ```typescript
 * const result = await service.validate({
 *   prompt: 'Write a song about hope'
 * })
 * if (isSuccess(result)) {
 *   console.log(result.data.validatedPrompt)
 * }
 * ```
 */
async validate(input: RawPromptInput): Promise<ServiceResponse<ValidationResult>>
```

---

## Error Code Patterns

### Error Code Enums
```typescript
export enum InputValidationErrorCode {
  EMPTY_PROMPT = 'EMPTY_PROMPT',
  PROMPT_TOO_SHORT = 'PROMPT_TOO_SHORT',
  PROMPT_TOO_LONG = 'PROMPT_TOO_LONG',
  CONFLICTING_CONSTRAINTS = 'CONFLICTING_CONSTRAINTS'
}
```

### Using Error Codes
```typescript
return createFailure(
  createError(
    InputValidationErrorCode.EMPTY_PROMPT, // Use enum, not string
    'Prompt cannot be empty',
    'Please provide a description of the song you want to create'
  )
)
```

---

## Naming Conventions

### Types and Interfaces
- PascalCase: `ServiceResponse`, `ValidationResult`, `SongId`
- Prefix interfaces with `I` for services: `IInputValidationService`
- Branded types: `SongId`, `VerseId`, `QualityScore` (no `I` prefix)

### Functions and Variables
- camelCase: `validateInput`, `createSongId`, `isSuccess`
- Boolean functions: `isValid`, `hasErrors`, `canGenerate`
- Factory functions: `create*` prefix: `createSuccess`, `createSongId`

### Constants
- SCREAMING_SNAKE_CASE: `MAX_PROMPT_LENGTH`, `DEFAULT_GENRE`
- Enum values: SCREAMING_SNAKE_CASE: `EMPTY_PROMPT`, `INVALID_INPUT`

### Files
- PascalCase for contracts: `InputValidation.ts`, `SongGeneration.ts`
- PascalCase for mocks: `MockInputValidation.ts`
- camelCase for tests: Match contract name + `.test.ts`

---

## TypeScript Configuration Patterns

### Always Leverage Strict Mode
The project uses strict TypeScript. Suggest code that:
- Uses `readonly` for immutable fields
- Uses `as const` for literal types
- Defines all function return types explicitly
- Handles `undefined` and `null` explicitly
- Uses discriminated unions (ServiceResponse pattern)

---

## Common Completions to Offer

### When creating a new test file:
```typescript
import { describe, it, expect, beforeEach } from '@jest/globals'
import type { I[ServiceName]Service } from '../../src/contracts/[ServiceName]'
import { isSuccess, isFailure } from '../../src/contracts/types/common'

describe('I[ServiceName]Service Contract Tests', () => {
  let service: I[ServiceName]Service

  beforeEach(() => {
    // TODO: Import and instantiate mock when created
  })

  describe('Success Cases', () => {
    // Tests here
  })

  describe('Error Cases', () => {
    // Tests here
  })

  describe('Contract Compliance', () => {
    it('should never throw exceptions', async () => {
      // Test here
    })
  })
})
```

### When creating a new mock service:
```typescript
import { createSuccess, createFailure, createError } from '../../contracts/types/common'
import type {
  I[ServiceName]Service,
  // Import all types from contract
} from '../../contracts/[ServiceName]'

export class Mock[ServiceName]Service implements I[ServiceName]Service {
  // Implement all interface methods
}
```

### When handling validation:
```typescript
// Validation pattern
if (!input.requiredField) {
  return createFailure(
    createError(
      ErrorCode.MISSING_FIELD,
      'Required field is missing',
      'Please provide a value for requiredField'
    )
  )
}

// Build values
const value = processInput(input)

// Create readonly object
const output: Output = {
  field: value,
  // ... all fields
}

return createSuccess(output)
```

---

## Metrics to Maintain

When suggesting code, ensure it maintains:
- **TypeScript Errors**: 0 (always)
- **'any' Types**: 0 (forbidden)
- **Test Coverage**: Aim for 100%
- **TDD Compliance**: Tests before implementation

---

## Quick Validation Checks

Before suggesting code completion, mentally check:
1. ✅ No 'any' types?
2. ✅ Follows TDD (test exists or being written first)?
3. ✅ Uses ServiceResponse pattern?
4. ✅ Handles readonly correctly?
5. ✅ Not modifying contracts?
6. ✅ Proper error handling (no throws)?

---

## Phase-Specific Guidance

### Current Phase: 3 (BUILD)
**What to suggest:**
- Writing contract tests
- Implementing mocks to pass tests
- Using TDD Red-Green-Refactor cycle

**What NOT to suggest:**
- Modifying contracts (Phase 2 is complete)
- Creating UI components (Phase 4)
- Implementing real services (Phase 5)

---

## Helpful Reminders

When user asks to "implement X":
1. First ask: "Should we write the test first (TDD)?"
2. Check if contract exists for X
3. Check if test exists for X
4. Follow TDD order if test doesn't exist

When user reports an error:
1. Check if it's a readonly mutation (common)
2. Check if 'any' type was used
3. Check if ServiceResponse pattern was followed
4. Suggest fix that maintains all rules

---

**Remember**: This project is a model of disciplined TypeScript development. Every suggestion should maintain the high standards of type safety, immutability, and test coverage.
