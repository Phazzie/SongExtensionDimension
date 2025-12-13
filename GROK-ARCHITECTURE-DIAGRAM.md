# Grok Architecture Visual Diagrams

**Companion to**: GROK-ARCHITECTURE.md  
**Purpose**: Visual representations of the AI integration architecture

---

## System Architecture Layers

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         VSCode Extension UI                              │
│                           (Phase 4 - Future)                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │  Generate  │  │  Critique  │  │   Revise   │  │   Export   │       │
│  │    Song    │  │    Song    │  │    Song    │  │    Song    │       │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘       │
└────────┼───────────────┼───────────────┼───────────────┼───────────────┘
         │               │               │               │
┌────────▼───────────────▼───────────────▼───────────────▼───────────────┐
│                       Service Factory                                   │
│                   (Mock/Real Service Selector)                          │
│                                                                          │
│  if (useAI && hasApiKey) → Real AI Services                            │
│  else → Mock Heuristic Services                                        │
└────────┬───────────────────────────────────────────────┬───────────────┘
         │                                               │
    ┌────▼─────┐                                    ┌────▼─────┐
    │   Mock   │                                    │   Real   │
    │ Services │                                    │    AI    │
    │          │                                    │ Services │
    │ Phase 3  │                                    │ Phase 5  │
    └──────────┘                                    └────┬─────┘
                                                         │
                                            ┌────────────▼────────────┐
                                            │   AI Integration Layer  │
                                            │                         │
                                            │  ┌──────────────────┐  │
                                            │  │ GrokAI Service   │  │
                                            │  │   (Singleton)    │  │
                                            │  └────────┬─────────┘  │
                                            │           │            │
                                            │  ┌────────▼─────────┐  │
                                            │  │ Prompt Manager   │  │
                                            │  │ Response Parser  │  │
                                            │  │ Cache Layer      │  │
                                            │  │ Rate Limiter     │  │
                                            │  │ Circuit Breaker  │  │
                                            │  └────────┬─────────┘  │
                                            └───────────┼────────────┘
                                                        │
                                               ┌────────▼─────────┐
                                               │   Grok-4-fast-   │
                                               │  reasoning API   │
                                               │   (External)     │
                                               └──────────────────┘
```

---

## Request Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│  1. User Request (e.g., "Analyze this song")                            │
└────────────────┬─────────────────────────────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────────────────────────────┐
│  2. Service Method Call                                                   │
│     CritiqueEngineService.analyzeSong(song)                              │
└────────────────┬─────────────────────────────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────────────────────────────┐
│  3. Build Structured Prompt                                              │
│     - System message with JSON schema                                    │
│     - User message with song data                                        │
│     - Few-shot examples (optional)                                       │
└────────────────┬─────────────────────────────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────────────────────────────┐
│  4. Check Cache                                                          │
│     - Hash prompt                                                        │
│     - Lookup in cache                                                    │
│     - If hit: return cached response ──────────────────┐                │
│     - If miss: continue ↓                              │                │
└────────────────┬─────────────────────────────────────┬─┘                │
                 │                                     │                  │
┌────────────────▼─────────────────────────────────────┐                  │
│  5. Rate Limiting                                    │                  │
│     - Wait for available slot                        │                  │
│     - Respect API limits                             │                  │
└────────────────┬─────────────────────────────────────┘                  │
                 │                                                        │
┌────────────────▼─────────────────────────────────────┐                  │
│  6. Execute API Call                                 │                  │
│     - POST to Grok API                               │                  │
│     - Include authentication                         │                  │
│     - Set timeout                                    │                  │
└────────────────┬─────────────────────────────────────┘                  │
                 │                                                        │
                 ├─── Success ─────┐                                      │
                 │                 │                                      │
                 └─── Failure ────►│ Retry Logic (3x)                    │
                                   │ - Exponential backoff                │
                                   │ - Circuit breaker check              │
                                   └───┬──────────────────────────────────┘
                                       │                                  │
┌──────────────────────────────────────▼──────────────────────────────────▼┐
│  7. Parse Response                                                        │
│     - Extract JSON from markdown                                         │
│     - Parse JSON                                                         │
│     - Handle parse errors                                                │
└──────────────────────────────────────┬───────────────────────────────────┘
                                       │
┌──────────────────────────────────────▼───────────────────────────────────┐
│  8. Validate Against Schema                                              │
│     - Check required fields exist                                        │
│     - Validate field types                                               │
│     - Ensure contract compliance                                         │
│     - If invalid: log and retry OR return error                          │
└──────────────────────────────────────┬───────────────────────────────────┘
                                       │
                          ┌────────────┴────────────┐
                          │                         │
                   ┌──────▼──────┐         ┌───────▼────────┐
                   │   VALID     │         │    INVALID     │
                   │             │         │                │
                   │ Cache result│         │  Return error  │
                   │             │         │  ServiceFailure│
                   └──────┬──────┘         └───────┬────────┘
                          │                        │
┌─────────────────────────▼────────────────────────▼───────────────────────┐
│  9. Return ServiceResponse<T>                                            │
│     - ServiceSuccess<CritiqueReport>  OR                                 │
│     - ServiceFailure with error details                                  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Contract Compliance Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│  AI generates free-form response                                        │
│  "This song has great imagery in verse 2..."                            │
└────────────────┬────────────────────────────────────────────────────────┘
                 │
                 │  ❌ Problem: Free-form text doesn't match contract
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  SOLUTION: Structured Prompt Engineering                                │
│                                                                          │
│  System Message:                                                         │
│  "You MUST return JSON matching this schema:                            │
│   {                                                                      │
│     overallScore: number (0-100),                                       │
│     passesGoldStandard: boolean,                                        │
│     issues: Array<{                                                     │
│       severity: 'critical'|'major'|'minor'|'info',                      │
│       type: string,                                                     │
│       message: string,                                                  │
│       affectedLines: number[]                                           │
│     }>,                                                                 │
│     ...                                                                 │
│   }"                                                                     │
└────────────────┬────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  AI returns structured JSON                                             │
│  ```json                                                                │
│  {                                                                      │
│    "overallScore": 85,                                                  │
│    "passesGoldStandard": true,                                          │
│    "issues": [...]                                                      │
│  }                                                                      │
│  ```                                                                    │
└────────────────┬────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Response Validation Layer                                              │
│                                                                          │
│  1. Extract JSON from markdown code block                               │
│  2. Parse JSON                                                          │
│  3. Check required fields: ✓                                            │
│  4. Validate types: ✓                                                   │
│  5. Check value ranges: ✓                                               │
│  6. Ensure readonly compliance: ✓                                       │
└────────────────┬────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Type-safe Response                                                     │
│  ServiceResponse<CritiqueReport>                                        │
│                                                                          │
│  ✅ Matches contract exactly                                            │
│  ✅ All fields present                                                  │
│  ✅ Types correct                                                       │
│  ✅ Readonly preserved                                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Service Migration Timeline

```
Weeks →  1         2         3         4         5         6         7
        │         │         │         │         │         │         │
        │         │         │         │         │         │         │
Infrastructure:   │         │         │         │         │         │
  GrokAIService  ████      │         │         │         │         │
  ResponseValid  ████      │         │         │         │         │
  PromptLibrary  ████████  │         │         │         │         │
  BaseAIService  ████████  │         │         │         │         │
                  │         │         │         │         │         │
Services:         │         │         │         │         │         │
  Critique        │        ████████   │         │         │         │
  SongGen         │         │        ████████   │         │         │
  Revision        │         │         │        ████████   │         │
  RhymeAnal       │         │         │         │        ████      │
  SyllableC       │         │         │         │        ████      │
  InputValid      │         │         │         │         │   ████ │
  GrokAudio       │         │         │         │         │   ████ │
                  │         │         │         │         │         │
Integration:      │         │         │         │         │         │
  ServiceFact     │         │         │         │         │        ████
  Testing         │         │         │         │         │        ████
  Docs            │         │         │         │         │        ████
                  │         │         │         │         │         │
                  └─────────┴─────────┴─────────┴─────────┴─────────┴─────
Legend:
  ████ = Active development
```

---

## Service Classification Matrix

```
                    AI Benefit         Implementation     Migration
Service             (★ = High)         Complexity         Priority
─────────────────────────────────────────────────────────────────────
SongGeneration      ★★★★★              Very High          P0 - Week 3
CritiqueEngine      ★★★★★              Very High          P0 - Week 2
RevisionEngine      ★★★★★              Very High          P0 - Week 4
RhymeAnalysis       ★★★★☆              Medium             P1 - Week 5
SyllableCounting    ★★★☆☆              Medium             P1 - Week 5
InputValidation     ★★☆☆☆              Low                P1 - Week 6
GrokAudio           ★★★★★              High               P2 - Week 6
SunoFormatter       ★☆☆☆☆              Low                KEEP HEURISTIC
Export              ☆☆☆☆☆              Low                KEEP HEURISTIC
History             ☆☆☆☆☆              Low                KEEP CRUD

Legend:
  P0 = Critical for core functionality
  P1 = Important for quality
  P2 = Nice to have
```

---

## Cost vs Performance Trade-offs

```
                                 Performance
                                     ▲
                                     │
                          Heuristic  │  
                          Services   │   ● SyllableCounting
                          (Fast)     │   ● RhymeAnalysis (simple)
                                     │
                                     │
                          Hybrid     │     ● InputValidation
                          Approach   │     ● RhymeAnalysis (complex)
                                     │
                                     │
                          AI         │         ● CritiqueEngine
                          Services   │         ● RevisionEngine
                          (Slow)     │         ● SongGeneration
                                     │
                                     └───────────────────────►
                                   Low                    High
                                            Cost

Strategy:
  - Bottom-left: Use heuristics (fast, cheap)
  - Top-right: Use AI (high quality, expensive)
  - Middle: Hybrid (decision tree based on complexity)
```

---

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  AI Service Call                                                │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
      ┌──────────────┐
      │  Try API     │
      │  Request     │
      └──────┬───────┘
             │
      ┌──────▼────────────────────────┐
      │  Success?                     │
      └──────┬────────────────────────┘
             │
      ┌──────┴──────┐
      │             │
   ✅ Yes          ❌ No
      │             │
      │        ┌────▼─────┐
      │        │ Error    │
      │        │ Type?    │
      │        └────┬─────┘
      │             │
      │        ┌────┴────────────────────────┐
      │        │                             │
      │   Rate Limit                    Network Error
      │        │                             │
      │   ┌────▼────┐                  ┌─────▼─────┐
      │   │ Wait &  │                  │  Retry    │
      │   │ Retry   │                  │  (3x)     │
      │   └────┬────┘                  └─────┬─────┘
      │        │                             │
      │        └─────────┬───────────────────┘
      │                  │
      │             ┌────▼─────┐
      │             │ Still    │
      │             │ Failing? │
      │             └────┬─────┘
      │                  │
      │             ┌────┴────┐
      │             │         │
      │          ✅ Yes      ❌ No
      │             │         │
      │        ┌────▼────┐    │
      │        │Circuit  │    │
      │        │Breaker  │    │
      │        │Check    │    │
      │        └────┬────┘    │
      │             │         │
      │        ┌────▼────┐    │
      │        │Open?    │    │
      │        └────┬────┘    │
      │             │         │
      │        ┌────┴────┐    │
      │        │         │    │
      │     ✅ Yes      ❌ No │
      │        │         │    │
      │   ┌────▼────┐    │    │
      │   │Fallback │    │    │
      │   │to Mock  │    │    │
      │   └────┬────┘    │    │
      │        │         │    │
      └────────┴─────────┴────┘
               │
          ┌────▼────┐
          │ Return  │
          │Response │
          └─────────┘
```

---

## File Structure

```
/src/services/
│
├── ai/                               # AI Integration Layer (NEW)
│   ├── GrokAIService.ts              # 🔑 Core AI client
│   ├── GrokConfig.ts                 # Configuration
│   ├── GrokTypes.ts                  # Type definitions
│   ├── AuthManager.ts                # API key management
│   ├── ResponseValidator.ts          # Schema validation
│   ├── RateLimiter.ts                # Rate limiting
│   ├── ResponseCache.ts              # Caching
│   ├── CircuitBreaker.ts             # Failure protection
│   │
│   ├── prompts/                      # Prompt Engineering
│   │   ├── PromptLibrary.ts          # Central prompt manager
│   │   ├── SongGenerationPrompts.ts
│   │   ├── CritiquePrompts.ts
│   │   └── ...
│   │
│   ├── schemas/                      # Response Schemas
│   │   ├── CritiqueEngineSchema.ts
│   │   ├── SongGenerationSchema.ts
│   │   └── ...
│   │
│   └── metrics/                      # Monitoring
│       └── MetricsCollector.ts
│
├── mock/                             # Heuristic Mocks (EXISTING)
│   ├── MockInputValidationService.ts ✅ Wave 1
│   ├── MockRhymeAnalysisService.ts   ✅ Wave 1
│   ├── MockSyllableCountingService.ts ✅ Wave 1
│   └── ... (7 more to be created)
│
├── real/                             # AI Services (NEW)
│   ├── base/
│   │   └── BaseAIService.ts          # 🔑 Shared functionality
│   │
│   ├── CritiqueEngineService.ts      # Week 2
│   ├── SongGenerationService.ts      # Week 3
│   ├── RevisionEngineService.ts      # Week 4
│   ├── RhymeAnalysisService.ts       # Week 5
│   ├── SyllableCountingService.ts    # Week 5
│   ├── InputValidationService.ts     # Week 6
│   └── GrokAudioService.ts           # Week 6
│
└── factory/                          # Service Selection (NEW)
    └── ServiceFactory.ts             # 🔑 Mock/Real switcher
```

---

**End of Diagrams**
