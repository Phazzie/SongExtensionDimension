# Seams List - Prioritized Implementation Order

**Project**: VSCode Songwriting Assistant
**Methodology**: Seam-Driven Development (SDD)
**Created**: 2025-11-14
**Status**: Ready for Phase 2 (DEFINE)

## Quick Reference: All Seams

| # | Seam Name | Priority | Complexity | Dependencies | Phase |
|---|-----------|----------|------------|--------------|-------|
| 1 | InputValidationSeam | P0 | Low | None | 1 |
| 2 | SongGenerationSeam | P0 | High | #1 | 1 |
| 3 | CritiqueEngineSeam | P0 | Very High | #2, #6, #7 | 1 |
| 4 | RevisionEngineSeam | P0 | Very High | #2, #3 | 1 |
| 5 | SunoFormatterSeam | P0 | Medium | #2 | 1 |
| 6 | RhymeAnalysisSeam | P1 | Medium | None | 2 |
| 7 | SyllableCountingSeam | P1 | Medium | None | 2 |
| 8 | GeminiAudioSeam | P2 | High | None | 3 |
| 9 | ExportSeam | P1 | Low | #5 | 2 |
| 10 | HistorySeam | P1 | Medium | All | 2 |

## Implementation Order (Dependency-First)

### Wave 1: Foundation (Build These First)
**Goal**: Basic song generation and validation working

1. **Seam #1: InputValidationSeam**
   - No dependencies
   - Simple contract
   - Foundation for everything else
   - **Contract**: `/contracts/InputValidation.ts`
   - **Mock**: `/services/mock/MockInputValidation.ts`
   - **Estimated Time**: 2 hours

2. **Seam #6: RhymeAnalysisSeam**
   - No dependencies
   - Needed by Seam #3
   - Can be built in parallel with #1
   - **Contract**: `/contracts/RhymeAnalysis.ts`
   - **Mock**: `/services/mock/MockRhymeAnalysis.ts`
   - **Estimated Time**: 3 hours

3. **Seam #7: SyllableCountingSeam**
   - No dependencies
   - Needed by Seam #3
   - Can be built in parallel with #1 and #6
   - **Contract**: `/contracts/SyllableCounting.ts`
   - **Mock**: `/services/mock/MockSyllableCounting.ts`
   - **Estimated Time**: 3 hours

### Wave 2: Core Generation
**Goal**: Song generation and quality analysis working

4. **Seam #2: SongGenerationSeam**
   - Depends on: #1
   - Core feature
   - **Contract**: `/contracts/SongGeneration.ts`
   - **Mock**: `/services/mock/MockSongGeneration.ts`
   - **Estimated Time**: 4 hours (complex contract)

5. **Seam #3: CritiqueEngineSeam**
   - Depends on: #2, #6, #7
   - Quality gatekeeper
   - Most complex seam
   - **Contract**: `/contracts/CritiqueEngine.ts`
   - **Mock**: `/services/mock/MockCritiqueEngine.ts`
   - **Estimated Time**: 5 hours (very complex)

### Wave 3: Improvement Loop
**Goal**: Revision and iteration working

6. **Seam #4: RevisionEngineSeam**
   - Depends on: #2, #3
   - Completes the generation → critique → revision loop
   - **Contract**: `/contracts/RevisionEngine.ts`
   - **Mock**: `/services/mock/MockRevisionEngine.ts`
   - **Estimated Time**: 4 hours

### Wave 4: Output & Persistence
**Goal**: Export and history management

7. **Seam #5: SunoFormatterSeam**
   - Depends on: #2
   - Required for usable output
   - **Contract**: `/contracts/SunoFormatter.ts`
   - **Mock**: `/services/mock/MockSunoFormatter.ts`
   - **Estimated Time**: 3 hours

8. **Seam #9: ExportSeam**
   - Depends on: #5
   - User-facing output
   - **Contract**: `/contracts/Export.ts`
   - **Mock**: `/services/mock/MockExport.ts`
   - **Estimated Time**: 2 hours

9. **Seam #10: HistorySeam**
   - Depends on: All others
   - Can be built last
   - **Contract**: `/contracts/History.ts`
   - **Mock**: `/services/mock/MockHistory.ts`
   - **Estimated Time**: 3 hours

### Wave 5: Advanced Features (Optional)
**Goal**: Audio analysis integration

10. **Seam #8: GeminiAudioSeam**
    - No dependencies
    - Advanced feature
    - Can be added later
    - **Contract**: `/contracts/GeminiAudio.ts`
    - **Mock**: `/services/mock/MockGeminiAudio.ts`
    - **Estimated Time**: 4 hours

## Parallel Development Opportunities

### Can Be Built Simultaneously:
- **Group A**: #1, #6, #7 (no dependencies on each other)
- **Group B**: #2, #8 (both depend on #1, but not on each other)
- **Group C**: #5, #9 (linear dependency, but #10 can start while these finish)

### Must Be Sequential:
- #1 → #2 (validation before generation)
- #2 → #3 (song before critique)
- #3 → #4 (critique before revision)
- #2 → #5 (song before formatting)
- #5 → #9 (formatting before export)

## Phase 2 Contract Creation Order

Based on dependencies, create contracts in this exact order:

```
Day 1 Morning:
✓ Common types (ServiceResponse, error handling)
✓ Song types (Song, Verse, Chorus, Line, etc.)

Day 1 Afternoon:
1. InputValidation.ts
2. RhymeAnalysis.ts
3. SyllableCounting.ts

Day 2 Morning:
4. SongGeneration.ts
5. CritiqueEngine.ts

Day 2 Afternoon:
6. RevisionEngine.ts
7. SunoFormatter.ts

Day 3 Morning:
8. Export.ts
9. History.ts

Day 3 Afternoon (if needed):
10. GeminiAudio.ts
```

## Validation Checkpoints

After each seam's contract is created:

```bash
# 1. TypeScript validation
npm run check
# Expected: 0 errors

# 2. Verify no 'any' types
git grep "as any" contracts/
# Expected: empty result

# 3. Check exports
cat contracts/index.ts | grep "export"
# Expected: see new contract exported
```

After each seam's mock is created:

```bash
# 1. TypeScript validation
npm run check
# Expected: 0 errors

# 2. Verify no 'any' types
git grep "as any" services/mock/
# Expected: empty result

# 3. Run contract tests
npm test -- <SeamName>.test.ts
# Expected: all tests pass
```

## Contract Template (Use for All Seams)

```typescript
/**
 * @fileoverview [Seam Name] Contract
 * @purpose [One sentence: What this seam does]
 * @dataFlow [Input → Transform → Output]
 * @boundary [What systems/layers this crosses]
 * @requirement [High-level requirement this fulfills]
 * @updated 2025-11-14
 *
 * @example
 * const service = new Mock[SeamName]Service()
 * const result = await service.method(input)
 * if (result.success) {
 *   console.log(result.data)
 * } else {
 *   console.error(result.error)
 * }
 */

import type { ServiceResponse } from './types/common'

// Branded types for IDs (prevents mixing different ID types)
export type [Entity]Id = string & { readonly __brand: '[Entity]Id' }

// Core data structures
export interface [Entity] {
  id: [Entity]Id
  // ... fields
}

// Input/Output contracts
export interface [Method]Input {
  // ... required fields
  // ... optional fields with ?
}

export interface [Method]Output {
  // ... return data
}

// Error codes (enum for type safety)
export enum [Seam]ErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  // ... specific error codes
}

// Service interface (THE CONTRACT - IMMUTABLE ONCE IMPLEMENTATION STARTS)
export interface I[Seam]Service {
  /**
   * [Method description]
   * @param input - [Describe input]
   * @returns Promise with success/error response
   * @throws Never throws - always returns ServiceResponse
   */
  method(input: [Method]Input): Promise<ServiceResponse<[Method]Output>>

  // ... other methods
}
```

## Mock Template (Use for All Seams)

```typescript
/**
 * @fileoverview Mock [Seam Name] Service
 * @purpose Realistic mock implementation of I[Seam]Service
 * @dataFlow Returns deterministic but realistic mock data
 * @testing Used for UI development and contract testing
 */

import type { ServiceResponse } from '../../contracts/types/common'
import type {
  I[Seam]Service,
  [Entity],
  [Method]Input,
  [Method]Output,
  [Seam]ErrorCode
} from '../../contracts/[SeamName]'

export class Mock[Seam]Service implements I[Seam]Service {
  /**
   * Mock implementation of [method]
   */
  async method(input: [Method]Input): Promise<ServiceResponse<[Method]Output>> {
    // Validate input (same as real service would)
    if (!this.validateInput(input)) {
      return {
        success: false,
        error: {
          code: [Seam]ErrorCode.INVALID_INPUT,
          message: 'Invalid input provided',
          details: 'Input validation failed',
          suggestion: 'Check input format and try again'
        }
      }
    }

    // Return realistic mock data that EXACTLY matches contract
    return {
      success: true,
      data: {
        // Every field from [Method]Output must be here
        // Use realistic values, not placeholders
      }
    }
  }

  private validateInput(input: [Method]Input): boolean {
    // Validation logic
    return true
  }
}
```

## Contract Test Template (Use for All Seams)

```typescript
/**
 * @fileoverview [Seam Name] Contract Tests
 * @purpose Verify mock implementation matches contract exactly
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { Mock[Seam]Service } from '../../services/mock/Mock[Seam]'
import type { [Method]Input } from '../../contracts/[SeamName]'

describe('[Seam Name] Contract Tests', () => {
  let service: Mock[Seam]Service

  beforeEach(() => {
    service = new Mock[Seam]Service()
  })

  describe('Success Cases', () => {
    it('should return correct shape for valid input', async () => {
      const input: [Method]Input = {
        // Valid test input
      }

      const result = await service.method(input)

      // Verify success
      expect(result.success).toBe(true)

      // Verify EVERY field in output
      expect(result.data).toBeDefined()
      expect(result.data?.field1).toBeDefined()
      expect(result.data?.field2).toBeArray()
      // ... test EVERY field from contract
    })
  })

  describe('Error Cases', () => {
    it('should return error for invalid input', async () => {
      const invalidInput: [Method]Input = {
        // Invalid test input
      }

      const result = await service.method(invalidInput)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe([Seam]ErrorCode.INVALID_INPUT)
      expect(result.error?.message).toBeTruthy()
      expect(result.error?.suggestion).toBeTruthy()
    })
  })
})
```

## Success Criteria for Phase 2 (DEFINE)

### All Contracts Must Have:
- ✅ Complete JSDoc header with @fileoverview, @purpose, @dataFlow
- ✅ Branded types for all IDs
- ✅ Complete input/output interfaces
- ✅ Error code enums
- ✅ Service interface with all methods
- ✅ JSDoc for every method
- ✅ Exported from /contracts/index.ts
- ✅ Zero TypeScript errors
- ✅ Zero uses of 'any' type

### Phase 2 Complete When:
- ✅ All 10 contract files created
- ✅ Common types defined (/contracts/types/common.ts)
- ✅ Song types defined (/contracts/types/song.ts)
- ✅ All contracts exported from index
- ✅ `npm run check` shows 0 errors
- ✅ No 'any' types in entire /contracts/ directory
- ✅ All contracts reviewed and approved for immutability

## Critical Reminder

**⚠️ CONTRACTS ARE IMMUTABLE ONCE PHASE 3 (BUILD) STARTS ⚠️**

Once you start building mocks against a contract, you CANNOT change that contract. If you need changes, create a v2 contract.

Why? Because:
1. Mocks are built to match contracts exactly
2. Tests validate mocks against contracts
3. UI is developed against mocks
4. Real services implement contracts
5. Changing contracts breaks EVERYTHING

**Review carefully before marking Phase 2 complete!**

---

**Next Action**: Begin Phase 2 - Create contracts in dependency order
**First Contracts**: Common types, Song types, InputValidation, RhymeAnalysis, SyllableCounting
