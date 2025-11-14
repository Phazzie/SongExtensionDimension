# Contract Test Structure - Visual Diagram

**Visual reference for test file organization based on InputValidation.test.ts**

---

## Test File Anatomy

```
[ServiceName].test.ts
│
├─ File Header
│  ├─ @fileoverview: Contract Tests for [Service]
│  ├─ @purpose: Ensure implementation matches contract
│  └─ TDD note: Tests written BEFORE implementation
│
├─ Imports
│  ├─ Jest functions (describe, it, expect, beforeEach)
│  ├─ Contract types (I[Service]Service, inputs, outputs, enums)
│  └─ Common helpers (isSuccess, isFailure)
│
├─ Main Describe Block: "I[Service]Service Contract Tests"
│  │
│  ├─ Service Variable Declaration
│  │  └─ let service: I[Service]Service
│  │
│  ├─ BeforeEach Setup
│  │  └─ TODO: Instantiate Mock[Service]Service when implemented
│  │
│  └─ Method Test Blocks (one per interface method)
│     │
│     ├─ describe("method1() method")
│     │  ├─ describe("Success Cases")
│     │  │  ├─ it("should return success for valid input with all fields")
│     │  │  ├─ it("should return success for minimal valid input")
│     │  │  ├─ it("should handle [edge case 1]")
│     │  │  ├─ it("should handle [edge case 2]")
│     │  │  └─ it("should warn/modify when [special case]")
│     │  │
│     │  ├─ describe("Error Cases")
│     │  │  ├─ it("should return error for empty input")
│     │  │  ├─ it("should return error for invalid input")
│     │  │  ├─ it("should return error for [ERROR_CODE_1]")
│     │  │  ├─ it("should return error for [ERROR_CODE_2]")
│     │  │  └─ it("should return error for [ERROR_CODE_N]")
│     │  │
│     │  └─ describe("Contract Compliance")
│     │     ├─ it("should never throw exceptions")
│     │     ├─ it("should always return ServiceResponse shape")
│     │     └─ it("should preserve readonly semantics on output")
│     │
│     ├─ describe("method2() method")
│     │  └─ ... (same structure)
│     │
│     └─ describe("methodN() method")
│        └─ ... (same structure)
```

---

## Test Method Internal Structure

```
it('should [action] [condition]', async () => {
  │
  ├─ 1. ARRANGE: Prepare input
  │  └─ const input: InputType = { ... }
  │
  ├─ 2. ACT: Call service method
  │  └─ const result = await service.method(input)
  │
  └─ 3. ASSERT: Verify output
     │
     ├─ A. Verify ServiceResponse shape
     │  ├─ expect(result).toHaveProperty('success')
     │  └─ expect(isSuccess(result)).toBe(true/false)
     │
     └─ B. Type-guarded verification
        ├─ if (isSuccess(result)) {
        │  ├─ Type-safe data access
        │  ├─ Verify all required fields
        │  ├─ Verify field types
        │  ├─ Verify nested structures
        │  └─ Verify business logic
        │
        └─ if (isFailure(result)) {
           ├─ Verify error.code
           ├─ Verify error.message
           ├─ Verify error.suggestion
           └─ Verify error details
})
```

---

## Success Test Pattern

```typescript
it('should return success for valid input', async () => {
  // ┌─────────────────────────────────────────┐
  // │ 1. ARRANGE: Create valid input          │
  // └─────────────────────────────────────────┘
  const input: InputType = {
    requiredField: 'valid value',
    optionalField: 'optional value'
  }

  // ┌─────────────────────────────────────────┐
  // │ 2. ACT: Call the service method         │
  // └─────────────────────────────────────────┘
  const result = await service.methodName(input)

  // ┌─────────────────────────────────────────┐
  // │ 3. ASSERT: Verify ServiceResponse       │
  // └─────────────────────────────────────────┘
  expect(result).toHaveProperty('success')
  expect(isSuccess(result)).toBe(true)

  // ┌─────────────────────────────────────────┐
  // │ 4. ASSERT: Verify data (type-safe)      │
  // └─────────────────────────────────────────┘
  if (isSuccess(result)) {
    const data: OutputType = result.data

    // Required fields
    expect(data).toHaveProperty('field1')
    expect(data).toHaveProperty('field2')

    // Field types
    expect(typeof data.field1).toBe('string')
    expect(typeof data.field2).toBe('number')

    // Field values
    expect(data.field1).toBe('expected value')
    expect(data.field2).toBeGreaterThan(0)

    // Nested structures
    expect(Array.isArray(data.items)).toBe(true)
    expect(data.items.length).toBeGreaterThanOrEqual(0)
  }
})
```

---

## Error Test Pattern

```typescript
it('should return error for invalid input', async () => {
  // ┌─────────────────────────────────────────┐
  // │ 1. ARRANGE: Create invalid input        │
  // └─────────────────────────────────────────┘
  const input: InputType = {
    requiredField: ''  // Invalid: empty string
  }

  // ┌─────────────────────────────────────────┐
  // │ 2. ACT: Call the service method         │
  // └─────────────────────────────────────────┘
  const result = await service.methodName(input)

  // ┌─────────────────────────────────────────┐
  // │ 3. ASSERT: Verify failure response      │
  // └─────────────────────────────────────────┘
  expect(isFailure(result)).toBe(true)

  // ┌─────────────────────────────────────────┐
  // │ 4. ASSERT: Verify error (type-safe)     │
  // └─────────────────────────────────────────┘
  if (isFailure(result)) {
    // Error code matches enum
    expect(result.error.code).toBe('EMPTY_FIELD')

    // Error message is descriptive
    expect(result.error.message).toBeDefined()
    expect(result.error.message.length).toBeGreaterThan(0)
    expect(result.error.message).toContain('field')

    // Suggestion is helpful
    expect(result.error.suggestion).toBeDefined()
    expect(result.error.suggestion.length).toBeGreaterThan(0)

    // Details provide context
    expect(result.error.details).toBeDefined()
  }
})
```

---

## Contract Compliance Test Pattern

### Test 1: Never Throws

```typescript
it('should never throw exceptions', async () => {
  // ┌─────────────────────────────────────────┐
  // │ Create array of problematic inputs      │
  // └─────────────────────────────────────────┘
  const badInputs: InputType[] = [
    { requiredField: '' },           // Empty
    { requiredField: 'x'.repeat(10000) }, // Too large
    // @ts-expect-error - Testing runtime behavior
    { requiredField: null },         // Null
    // @ts-expect-error - Testing runtime behavior
    { requiredField: undefined },    // Undefined
    // @ts-expect-error - Testing runtime behavior
    {},                              // Missing required
  ]

  // ┌─────────────────────────────────────────┐
  // │ Verify each input resolves (no throw)   │
  // └─────────────────────────────────────────┘
  for (const input of badInputs) {
    await expect(
      service.methodName(input as any)
    ).resolves.toBeDefined()
  }
})
```

### Test 2: ServiceResponse Shape

```typescript
it('should always return ServiceResponse shape', async () => {
  const input: InputType = { /* any valid input */ }

  const result = await service.methodName(input)

  // ┌─────────────────────────────────────────┐
  // │ Verify success property exists          │
  // └─────────────────────────────────────────┘
  expect(result).toHaveProperty('success')
  expect(typeof result.success).toBe('boolean')

  // ┌─────────────────────────────────────────┐
  // │ Verify discriminated union              │
  // └─────────────────────────────────────────┘
  if (result.success) {
    // Success = has data, no error
    expect(result).toHaveProperty('data')
    expect(result).not.toHaveProperty('error')
  } else {
    // Failure = has error, no data
    expect(result).toHaveProperty('error')
    expect(result).not.toHaveProperty('data')
  }
})
```

### Test 3: Readonly Enforcement

```typescript
it('should preserve readonly semantics on output', async () => {
  const input: InputType = { /* valid input */ }

  const result = await service.methodName(input)

  if (isSuccess(result)) {
    const data = result.data

    // ┌─────────────────────────────────────────┐
    // │ Test top-level readonly                 │
    // └─────────────────────────────────────────┘
    expect(() => {
      // @ts-expect-error - Testing readonly enforcement
      data.field = 'changed'
    }).toThrow()

    // ┌─────────────────────────────────────────┐
    // │ Test nested readonly (if applicable)    │
    // └─────────────────────────────────────────┘
    expect(() => {
      // @ts-expect-error - Testing readonly enforcement
      data.nested.field = 'changed'
    }).toThrow()

    // ┌─────────────────────────────────────────┐
    // │ Test array readonly (if applicable)     │
    // └─────────────────────────────────────────┘
    if (data.items && data.items.length > 0) {
      expect(() => {
        // @ts-expect-error - Testing readonly enforcement
        data.items.push('new item')
      }).toThrow()
    }
  }
})
```

---

## Decision Tree: What to Test

```
For each method in the interface:
│
├─ Is it a query method (returns data)?
│  ├─ YES → Test success cases with various inputs
│  │       Test all output fields are present
│  │       Test nested structures
│  │       Test edge cases (empty, large, etc.)
│  │
│  └─ NO → Is it a command method (performs action)?
│          └─ Test action completes successfully
│             Test side effects (if observable)
│             Test return value indicates success
│
├─ Does it have error conditions?
│  └─ YES → Test EACH error code enum value
│            Test error message quality
│            Test suggestion provided
│            Test null/undefined handling
│
├─ Does it return ServiceResponse?
│  └─ YES → ALWAYS test all 3 contract compliance tests
│            1. Never throws
│            2. ServiceResponse shape
│            3. Readonly enforcement
│
└─ Does it have complex types?
   └─ YES → Test each level of nesting
            Test branded types are used
            Test arrays are properly typed
            Test optional fields work correctly
```

---

## Coverage Matrix

| Test Type | Success Cases | Error Cases | Compliance |
|-----------|--------------|-------------|------------|
| **Required per method** | 2-5 tests | 1+ per error code | 3 tests |
| **What to verify** | • All fields present<br>• Correct types<br>• Valid values<br>• Edge cases | • Error code matches<br>• Message descriptive<br>• Suggestion helpful | • Never throws<br>• ServiceResponse shape<br>• Readonly enforced |
| **Minimum coverage** | • Complete input<br>• Minimal input | • All error codes | • All 3 tests |

---

## Quality Gates

Before moving to next test file:

```
┌─────────────────────────────────────────┐
│ ✓ All interface methods tested          │
├─────────────────────────────────────────┤
│ ✓ All error codes tested                │
├─────────────────────────────────────────┤
│ ✓ 3 compliance tests per method         │
├─────────────────────────────────────────┤
│ ✓ Type guards used correctly            │
├─────────────────────────────────────────┤
│ ✓ npm run check → 0 errors              │
├─────────────────────────────────────────┤
│ ✓ File header with TDD note             │
├─────────────────────────────────────────┤
│ ✓ Clear describe blocks                 │
├─────────────────────────────────────────┤
│ ✓ Consistent with InputValidation       │
└─────────────────────────────────────────┘
```

---

## Example: Mapping Contract to Tests

**Contract Interface:**
```typescript
export interface IExampleService {
  method1(input: Input1): Promise<ServiceResponse<Output1>>
  method2(input: Input2): Promise<ServiceResponse<Output2>>
}

export enum ExampleErrorCode {
  ERROR_A = 'ERROR_A',
  ERROR_B = 'ERROR_B',
  ERROR_C = 'ERROR_C'
}
```

**Required Test Structure:**
```
ExampleService.test.ts
├─ describe("IExampleService Contract Tests")
│  ├─ describe("method1() method")
│  │  ├─ describe("Success Cases")
│  │  │  ├─ it("valid input with all fields")
│  │  │  └─ it("minimal valid input")
│  │  ├─ describe("Error Cases")
│  │  │  ├─ it("error for ERROR_A")
│  │  │  ├─ it("error for ERROR_B")
│  │  │  └─ it("error for ERROR_C")
│  │  └─ describe("Contract Compliance")
│  │     ├─ it("never throws")
│  │     ├─ it("ServiceResponse shape")
│  │     └─ it("readonly semantics")
│  └─ describe("method2() method")
│     └─ ... (same structure)
```

**Minimum Tests Required:**
- method1: 2 success + 3 error + 3 compliance = **8 tests**
- method2: 2 success + 3 error + 3 compliance = **8 tests**
- **Total: 16 tests minimum**

---

**Use this diagram alongside TEST-WRITING-QUICK-REF.md for fast reference!**
