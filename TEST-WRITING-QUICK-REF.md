# Contract Test Writing - Quick Reference Card

**Use this for quick lookups while writing tests. See TEST-WRITING-GUIDE.md for full details.**

---

## The 3 Required Test Categories (For Every Method)

### 1. Success Cases
```typescript
describe('Success Cases', () => {
  it('should return success for valid input with all fields', async () => { ... })
  it('should return success for minimal valid input', async () => { ... })
  it('should handle [edge case X]', async () => { ... })
})
```

### 2. Error Cases
```typescript
describe('Error Cases', () => {
  it('should return error for [specific case]', async () => {
    expect(isFailure(result)).toBe(true)
    if (isFailure(result)) {
      expect(result.error.code).toBe('ERROR_CODE')
      expect(result.error.message).toBeDefined()
      expect(result.error.suggestion).toBeDefined()
    }
  })
})
```

### 3. Contract Compliance (REQUIRED FOR ALL)
```typescript
describe('Contract Compliance', () => {
  it('should never throw exceptions', async () => {
    const badInputs = [
      // @ts-expect-error - Testing runtime behavior
      {},
      // @ts-expect-error - Testing runtime behavior
      { field: null },
    ]
    for (const input of badInputs) {
      await expect(service.method(input as any)).resolves.toBeDefined()
    }
  })

  it('should always return ServiceResponse shape', async () => {
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
    if (isSuccess(result)) {
      expect(() => {
        // @ts-expect-error - Testing readonly enforcement
        result.data.field = 'changed'
      }).toThrow()
    }
  })
})
```

---

## Type Guard Pattern (Use EVERYWHERE)

```typescript
const result = await service.method(input)

// Always check with type guard first
expect(isSuccess(result)).toBe(true)

// Then access data safely
if (isSuccess(result)) {
  const data: OutputType = result.data
  // Now TypeScript knows data exists
  expect(data.field).toBeDefined()
}
```

---

## Common Assertions Cheat Sheet

### ServiceResponse Structure
```typescript
expect(result).toHaveProperty('success')
expect(typeof result.success).toBe('boolean')
```

### Error Structure
```typescript
expect(result.error.code).toBe('ERROR_CODE')
expect(result.error.message).toBeDefined()
expect(result.error.suggestion).toBeDefined()
expect(result.error.message.length).toBeGreaterThan(0)
```

### Data Structure
```typescript
expect(data).toHaveProperty('field')
expect(typeof data.field).toBe('string')
expect(data.field).toBeDefined()
expect(Array.isArray(data.array)).toBe(true)
expect(data.array.length).toBeGreaterThanOrEqual(0)
```

### Branded Types
```typescript
expect(data.id).toBeDefined()
expect(typeof data.id).toBe('string')
```

### Nested Objects
```typescript
expect(data.nested.field).toBeDefined()
expect(data.nested.subfield).toBe(expectedValue)
```

### Arrays and Collections
```typescript
expect(Array.isArray(data.items)).toBe(true)
expect(data.items.length).toBeGreaterThan(0)
expect(data.items[0]).toHaveProperty('field')
```

### Readonly Enforcement
```typescript
expect(() => {
  // @ts-expect-error - Testing readonly enforcement
  data.field = 'new value'
}).toThrow()
```

---

## Error Testing Pattern

```typescript
it('should return error for [case]', async () => {
  const input = { /* invalid input */ }

  const result = await service.method(input)

  expect(isFailure(result)).toBe(true)
  if (isFailure(result)) {
    expect(result.error.code).toBe('SPECIFIC_ERROR_CODE')
    expect(result.error.message).toContain('expected text')
    expect(result.error.suggestion).toBeDefined()
  }
})
```

---

## Edge Cases to Always Test

1. **Empty inputs**: `''`, `[]`, `{}`
2. **Null/undefined**: Use `@ts-expect-error`
3. **Boundary values**: Min/max lengths, counts
4. **Special characters**: HTML tags, scripts, control chars
5. **Whitespace**: Leading, trailing, multiple spaces
6. **Array sizes**: Empty, single item, many items

---

## File Header Template

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
  [Types]
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
  })

  // Tests go here...
})
```

---

## Validation Commands

```bash
# Check TypeScript errors (must be 0)
npm run check

# Run specific test file
npm test -- [TestName].test.ts

# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage
```

---

## 10 Common Pitfalls to Avoid

1. ❌ Not testing all error codes
2. ❌ Forgetting readonly enforcement tests
3. ❌ Not verifying ServiceResponse discriminated union
4. ❌ Skipping @ts-expect-error runtime tests
5. ❌ Not testing empty/null/undefined cases
6. ❌ Forgetting nested object structure verification
7. ❌ Skipping contract compliance tests
8. ❌ Not using type guards before accessing result.data
9. ❌ Testing implementation instead of contract
10. ❌ Inconsistent test naming

---

## Quick Checklist (Before Considering Test Complete)

- [ ] All interface methods tested
- [ ] All error codes tested
- [ ] Success: minimal + complete + edge cases
- [ ] Error: all codes + null/undefined
- [ ] Contract compliance: all 3 tests per method
- [ ] Type guards used correctly
- [ ] Readonly enforcement tested
- [ ] `npm run check` passes (0 errors)
- [ ] `npm test` passes (will fail until mock implemented)
- [ ] File header with TDD note
- [ ] Clear describe blocks

---

## Time Budget Per Contract

| Contract | Time | Complexity |
|----------|------|------------|
| RhymeAnalysis | 4-6h | Medium |
| SyllableCounting | 3-4h | Medium |
| SongGeneration | 6-8h | Medium-High |
| CritiqueEngine | 10-12h | High |
| RevisionEngine | 8-10h | High |
| SunoFormatter | 4-5h | Medium |
| GeminiAudio | 3-4h | Medium |
| Export | 4-5h | Simple-Medium |
| History | 4-6h | Simple-Medium |

**Total**: 46-60 hours

---

## When to Reference Full Guide

- Contract-specific test scenarios
- Complex nested type testing
- Detailed examples for specific contracts
- Understanding the "why" behind patterns
- Troubleshooting test failures

---

**Keep InputValidation.test.ts open as reference while writing tests!**
