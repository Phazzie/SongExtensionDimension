# Grok-4-Fast-Reasoning AI Integration Architecture

**Document Version**: 1.0  
**Created**: 2025-11-15  
**Status**: Architecture Design  
**Purpose**: Complete architecture for replacing ALL heuristic implementations with Grok-4-fast-reasoning API calls

---

## Executive Summary

This document defines a comprehensive architecture for integrating Grok-4-fast-reasoning AI into ALL 10 services of the VSCode Songwriting Assistant, replacing the current heuristic-based mock implementations while maintaining strict Seam-Driven Development (SDD) and Test-Driven Development (TDD) compliance.

**Key Decision**: Use AI for EVERYTHING, not just generation/critique. Even analytical services (RhymeAnalysis, SyllableCounting, InputValidation) will use AI with carefully crafted prompts to ensure deterministic, contract-compliant responses.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [System Architecture](#2-system-architecture)
3. [API Integration Layer](#3-api-integration-layer)
4. [Contract Compliance Strategy](#4-contract-compliance-strategy)
5. [Service Implementation Design](#5-service-implementation-design)
6. [Prompt Engineering Framework](#6-prompt-engineering-framework)
7. [Testing Strategy](#7-testing-strategy)
8. [Migration Plan](#8-migration-plan)
9. [Cost & Performance Optimization](#9-cost--performance-optimization)
10. [Risk Mitigation](#10-risk-mitigation)

---

## 1. Current State Analysis

### 1.1 Existing Implementation

**Wave 1 (COMPLETE)** - 3 services with heuristics:
- `MockInputValidationService` (346 lines) - Text validation, sanitization, genre checking
- `MockRhymeAnalysisService` (1,064 lines) - Phonetic dictionary, pattern matching
- `MockSyllableCountingService` (800 lines) - Syllable counting algorithms, stress pattern detection

**Wave 2-5 (PENDING)** - 7 services planned:
- `SongGeneration` - Song creation (planned for AI)
- `CritiqueEngine` - Quality analysis (planned for AI)
- `RevisionEngine` - Song improvement (planned for AI)
- `SunoFormatter` - Platform formatting (heuristic)
- `Export` - File export (heuristic)
- `History` - Version control (CRUD)
- `GeminiAudio` - Audio analysis (AI - Gemini → needs Grok migration)

### 1.2 Service Classification by AI Suitability

| Service | Current Plan | AI Benefit | Complexity | Priority |
|---------|-------------|-----------|------------|----------|
| **SongGeneration** | AI | ★★★★★ High | Very High | P0 |
| **CritiqueEngine** | AI | ★★★★★ High | Very High | P0 |
| **RevisionEngine** | AI | ★★★★★ High | Very High | P0 |
| **RhymeAnalysis** | Heuristic | ★★★★☆ Medium-High | Medium | P1 |
| **SyllableCounting** | Heuristic | ★★★☆☆ Medium | Medium | P1 |
| **InputValidation** | Heuristic | ★★☆☆☆ Low-Medium | Low | P0 |
| **GeminiAudio** | AI (Gemini) | ★★★★★ High | High | P2 |
| **SunoFormatter** | Heuristic | ★☆☆☆☆ Low | Medium | P0 |
| **Export** | Heuristic | ☆☆☆☆☆ None | Low | P1 |
| **History** | CRUD | ☆☆☆☆☆ None | Low | P1 |

**User Requirement**: Use AI for ALL services where it makes sense (8/10 services).

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     VSCode Extension UI                          │
│                    (Phase 4 - Future)                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │   Service Factory       │
                │  (Mock/Real Selector)   │
                └────────────┬────────────┘
                             │
        ┌────────────────────┴────────────────────┐
        │                                         │
┌───────▼────────┐                    ┌───────────▼──────────┐
│  Mock Services │                    │   Real AI Services   │
│  (Phase 3)     │                    │    (Phase 5)         │
│                │                    │                      │
│  - Heuristics  │                    │  ┌────────────────┐  │
│  - Fast        │                    │  │ GrokAI Service │  │
│  - Offline     │                    │  │  (Singleton)   │  │
│  - Tests       │                    │  └────────┬───────┘  │
└────────────────┘                    │           │          │
                                      │  ┌────────▼───────┐  │
                     ┌────────────────┼──┤ Prompt Manager │  │
                     │                │  └────────┬───────┘  │
                     │                │           │          │
                     │                │  ┌────────▼───────┐  │
                     │                │  │Response Parser│  │
                     │                │  └────────┬───────┘  │
                     │                │           │          │
                     │                │  ┌────────▼───────┐  │
                     │                │  │ Cache Layer   │  │
                     │                │  └────────┬───────┘  │
                     │                └───────────┼──────────┘
                     │                            │
                     │                   ┌────────▼────────┐
                     └───────────────────┤  Grok-4-fast-   │
                                        │  reasoning API  │
                                        │   (External)    │
                                        └─────────────────┘
```

### 2.2 Layer Responsibilities

**Layer 1: Service Contracts** (Immutable)
- Define inputs, outputs, error codes
- Type-safe interfaces
- **NO CHANGES ALLOWED** (SDD compliance)

**Layer 2: Service Implementations**
- **Mock Services**: Fast, offline, heuristic-based (Phase 3)
- **Real Services**: AI-powered, production-quality (Phase 5)

**Layer 3: AI Integration Layer** (NEW)
- GrokAI Service (singleton)
- Prompt Manager
- Response Parser
- Cache Layer
- Error Handler
- Rate Limiter

**Layer 4: External API**
- Grok-4-fast-reasoning REST API
- API key management
- Network handling

---

## 3. API Integration Layer

### 3.1 GrokAI Service (Core Integration)

**Purpose**: Centralized AI API client with retry logic, caching, and error handling.

**Implementation**: `/src/services/ai/GrokAIService.ts`

```typescript
/**
 * Singleton service for Grok-4-fast-reasoning API integration
 */
export class GrokAIService {
  private static instance: GrokAIService
  private apiKey: string
  private baseUrl: string = 'https://api.x.ai/v1' // Grok API endpoint
  private cache: ResponseCache
  private rateLimiter: RateLimiter
  
  private constructor(config: GrokConfig) {
    this.apiKey = config.apiKey
    this.cache = new ResponseCache(config.cacheOptions)
    this.rateLimiter = new RateLimiter(config.rateLimitOptions)
  }
  
  public static getInstance(config?: GrokConfig): GrokAIService {
    if (!GrokAIService.instance) {
      if (!config) {
        throw new Error('GrokConfig required for first initialization')
      }
      GrokAIService.instance = new GrokAIService(config)
    }
    return GrokAIService.instance
  }
  
  /**
   * Execute a prompt and get structured response
   */
  async execute<T>(request: GrokRequest): Promise<GrokResponse<T>> {
    // 1. Check cache
    const cacheKey = this.generateCacheKey(request)
    const cached = this.cache.get<T>(cacheKey)
    if (cached && request.allowCache) {
      return cached
    }
    
    // 2. Rate limiting
    await this.rateLimiter.waitForSlot()
    
    // 3. Build request
    const apiRequest = this.buildAPIRequest(request)
    
    // 4. Execute with retry
    const response = await this.executeWithRetry(apiRequest)
    
    // 5. Parse response
    const parsed = await this.parseResponse<T>(response, request.schema)
    
    // 6. Cache if successful
    if (parsed.success && request.allowCache) {
      this.cache.set(cacheKey, parsed)
    }
    
    return parsed
  }
  
  private async executeWithRetry(
    request: APIRequest, 
    maxRetries: number = 3
  ): Promise<APIResponse> {
    let lastError: Error | null = null
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(request)
        })
        
        if (!response.ok) {
          if (response.status === 429) {
            // Rate limit - exponential backoff
            await this.sleep(Math.pow(2, attempt) * 1000)
            continue
          }
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }
        
        return await response.json()
      } catch (error) {
        lastError = error as Error
        if (attempt < maxRetries - 1) {
          await this.sleep(1000 * (attempt + 1))
        }
      }
    }
    
    throw lastError || new Error('Max retries exceeded')
  }
  
  private async parseResponse<T>(
    response: APIResponse,
    schema?: ResponseSchema<T>
  ): Promise<GrokResponse<T>> {
    try {
      const content = response.choices[0]?.message?.content
      if (!content) {
        return {
          success: false,
          error: 'No content in API response'
        }
      }
      
      // Try to parse as JSON
      let parsed: unknown
      try {
        parsed = JSON.parse(content)
      } catch {
        // If not JSON, return raw content
        return {
          success: true,
          data: content as T,
          metadata: {
            tokensUsed: response.usage?.total_tokens || 0,
            model: response.model
          }
        }
      }
      
      // Validate against schema if provided
      if (schema) {
        const validated = schema.validate(parsed)
        if (!validated.success) {
          return {
            success: false,
            error: `Schema validation failed: ${validated.error}`
          }
        }
        return {
          success: true,
          data: validated.data,
          metadata: {
            tokensUsed: response.usage?.total_tokens || 0,
            model: response.model
          }
        }
      }
      
      return {
        success: true,
        data: parsed as T,
        metadata: {
          tokensUsed: response.usage?.total_tokens || 0,
          model: response.model
        }
      }
    } catch (error) {
      return {
        success: false,
        error: `Response parsing failed: ${(error as Error).message}`
      }
    }
  }
  
  private generateCacheKey(request: GrokRequest): string {
    return `grok:${hashString(JSON.stringify(request.messages))}`
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
```

### 3.2 Configuration

**File**: `/src/services/ai/GrokConfig.ts`

```typescript
export interface GrokConfig {
  readonly apiKey: string
  readonly model: string // 'grok-4-fast-reasoning'
  readonly baseUrl?: string
  readonly cacheOptions: CacheOptions
  readonly rateLimitOptions: RateLimitOptions
  readonly timeoutMs: number
}

export interface CacheOptions {
  readonly enabled: boolean
  readonly ttlMs: number // Time to live
  readonly maxSize: number // Max cache entries
}

export interface RateLimitOptions {
  readonly requestsPerMinute: number
  readonly requestsPerHour: number
}

export const DEFAULT_GROK_CONFIG: GrokConfig = {
  apiKey: process.env.GROK_API_KEY || '',
  model: 'grok-4-fast-reasoning',
  baseUrl: 'https://api.x.ai/v1',
  cacheOptions: {
    enabled: true,
    ttlMs: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000
  },
  rateLimitOptions: {
    requestsPerMinute: 60,
    requestsPerHour: 1000
  },
  timeoutMs: 30000 // 30 seconds
}
```

### 3.3 Request/Response Types

**File**: `/src/services/ai/GrokTypes.ts`

```typescript
export interface GrokRequest {
  readonly messages: readonly GrokMessage[]
  readonly temperature?: number
  readonly maxTokens?: number
  readonly allowCache?: boolean
  readonly schema?: ResponseSchema<unknown>
}

export interface GrokMessage {
  readonly role: 'system' | 'user' | 'assistant'
  readonly content: string
}

export interface GrokResponse<T> {
  readonly success: boolean
  readonly data?: T
  readonly error?: string
  readonly metadata?: {
    readonly tokensUsed: number
    readonly model: string
    readonly cached?: boolean
  }
}

export interface ResponseSchema<T> {
  validate(data: unknown): ValidationResult<T>
}

export interface ValidationResult<T> {
  readonly success: boolean
  readonly data?: T
  readonly error?: string
}
```

### 3.4 Authentication & Security

**API Key Management**:
1. **Development**: `.env` file (gitignored)
2. **Production**: VSCode settings (`settings.json`)
3. **User Configuration**: Extension settings UI

**Security Measures**:
- Never log API keys
- Never commit API keys to git
- Use environment variables
- Encrypt keys in VSCode storage
- Validate key format before use

**File**: `/src/services/ai/AuthManager.ts`

```typescript
export class AuthManager {
  /**
   * Get API key from environment or VSCode settings
   */
  static async getApiKey(): Promise<string> {
    // 1. Check environment variable
    const envKey = process.env.GROK_API_KEY
    if (envKey) {
      return envKey
    }
    
    // 2. Check VSCode settings (future Phase 4)
    // const config = vscode.workspace.getConfiguration('songwriting')
    // const settingsKey = config.get<string>('grokApiKey')
    // if (settingsKey) {
    //   return settingsKey
    // }
    
    throw new Error('Grok API key not configured')
  }
  
  /**
   * Validate API key format
   */
  static validateApiKey(key: string): boolean {
    // Grok API keys typically start with "gsk-" (adjust as needed)
    return key.length > 0 && /^[a-zA-Z0-9\-_]+$/.test(key)
  }
}
```

---

## 4. Contract Compliance Strategy

### 4.1 The Core Challenge

**Problem**: AI responses are non-deterministic and free-form, but contracts require exact type signatures.

**Solution**: Strict prompt engineering + response parsing + validation layers.

### 4.2 Compliance Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Service Method (e.g., analyzeSong)                     │
│  Input: Song                                            │
│  Output: ServiceResponse<CritiqueReport>                │
└────────────────┬────────────────────────────────────────┘
                 │
        ┌────────▼────────┐
        │ Build Prompt    │  ← Structured JSON schema in system message
        │ with Schema     │  ← Example outputs
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │  Call Grok API  │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │  Parse JSON     │  ← Extract from markdown code blocks
        │  Response       │  ← Validate against schema
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │  Validate       │  ← Check all required fields exist
        │  Contract       │  ← Check types match contract
        └────────┬────────┘
                 │
                 ├─── Valid ──→ createSuccess(data)
                 │
                 └─── Invalid ──→ createFailure(error)
```

### 4.3 Response Validation Layer

**File**: `/src/services/ai/ResponseValidator.ts`

```typescript
export class ResponseValidator {
  /**
   * Validate AI response matches contract schema
   */
  static validate<T>(
    response: unknown,
    schema: ContractSchema<T>
  ): ValidationResult<T> {
    try {
      // 1. Type checking
      if (typeof response !== 'object' || response === null) {
        return {
          success: false,
          error: 'Response is not an object'
        }
      }
      
      // 2. Required fields
      for (const field of schema.required) {
        if (!(field in response)) {
          return {
            success: false,
            error: `Missing required field: ${field}`
          }
        }
      }
      
      // 3. Field types
      for (const [field, type] of Object.entries(schema.fields)) {
        if (field in response) {
          const value = (response as any)[field]
          if (!this.validateType(value, type)) {
            return {
              success: false,
              error: `Invalid type for field ${field}: expected ${type}`
            }
          }
        }
      }
      
      // 4. Type assertion (safe after validation)
      return {
        success: true,
        data: response as T
      }
    } catch (error) {
      return {
        success: false,
        error: `Validation error: ${(error as Error).message}`
      }
    }
  }
  
  private static validateType(value: unknown, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string'
      case 'number':
        return typeof value === 'number'
      case 'boolean':
        return typeof value === 'boolean'
      case 'array':
        return Array.isArray(value)
      case 'object':
        return typeof value === 'object' && value !== null
      default:
        return true // Unknown types pass
    }
  }
}
```

### 4.4 Contract Schemas

**Purpose**: Define expected structure for each service response.

**File**: `/src/services/ai/schemas/CritiqueEngineSchema.ts`

```typescript
import type { ContractSchema } from '../ResponseValidator'
import type { CritiqueReport } from '../../../contracts/CritiqueEngine'

export const CRITIQUE_REPORT_SCHEMA: ContractSchema<CritiqueReport> = {
  required: [
    'songId',
    'overallScore',
    'passesGoldStandard',
    'qualityLevel',
    'scores',
    'issues',
    'suggestions',
    'strengths',
    'generatedAt'
  ],
  fields: {
    songId: 'string',
    overallScore: 'number',
    passesGoldStandard: 'boolean',
    qualityLevel: 'string',
    scores: 'object',
    issues: 'array',
    suggestions: 'array',
    strengths: 'array',
    generatedAt: 'string' // ISO date string
  }
}
```

---

## 5. Service Implementation Design

### 5.1 Base AI Service Class

**Purpose**: Shared functionality for all AI-powered services.

**File**: `/src/services/real/base/BaseAIService.ts`

```typescript
export abstract class BaseAIService {
  protected grok: GrokAIService
  
  constructor(config?: GrokConfig) {
    this.grok = GrokAIService.getInstance(config)
  }
  
  /**
   * Execute AI request with automatic error handling
   */
  protected async executeAI<TInput, TOutput>(
    input: TInput,
    promptBuilder: (input: TInput) => GrokRequest,
    schema: ResponseSchema<TOutput>,
    errorCode: string
  ): Promise<ServiceResponse<TOutput>> {
    try {
      // 1. Build prompt
      const request = promptBuilder(input)
      
      // 2. Execute AI call
      const response = await this.grok.execute<TOutput>(request)
      
      // 3. Handle errors
      if (!response.success) {
        return createFailure(
          createError(
            errorCode,
            'AI request failed',
            'Please try again or contact support',
            response.error
          )
        )
      }
      
      // 4. Validate contract compliance
      const validated = ResponseValidator.validate(response.data, schema)
      if (!validated.success) {
        return createFailure(
          createError(
            errorCode,
            'AI response validation failed',
            'The AI returned invalid data. Please try again.',
            validated.error
          )
        )
      }
      
      // 5. Return success
      return createSuccess(validated.data)
      
    } catch (error) {
      return createFailure(
        createError(
          errorCode,
          'Unexpected error during AI request',
          'Please try again',
          (error as Error).message
        )
      )
    }
  }
  
  /**
   * Build system message with schema instructions
   */
  protected buildSystemMessage(schema: object, instructions: string): string {
    return `${instructions}

You MUST respond with valid JSON matching this exact schema:

\`\`\`json
${JSON.stringify(schema, null, 2)}
\`\`\`

CRITICAL RULES:
1. Your response must be valid JSON only
2. Include ALL required fields
3. Use exact field names from schema
4. Match types exactly (string, number, boolean, array, object)
5. No extra fields not in schema
6. No explanatory text outside JSON
7. Wrap JSON in markdown code block
`
  }
}
```

### 5.2 Example Service Implementation

**File**: `/src/services/real/CritiqueEngineService.ts`

```typescript
import { BaseAIService } from './base/BaseAIService'
import type { 
  ICritiqueEngineService,
  CritiqueReport,
  CritiqueLevel
} from '../../contracts/CritiqueEngine'
import type { Song } from '../../contracts/types/song'
import { CRITIQUE_REPORT_SCHEMA } from '../ai/schemas/CritiqueEngineSchema'

export class CritiqueEngineService extends BaseAIService implements ICritiqueEngineService {
  
  async analyzeSong(
    song: Song,
    level: CritiqueLevel = 'professional'
  ): Promise<ServiceResponse<CritiqueReport>> {
    return this.executeAI(
      { song, level },
      this.buildAnalyzeSongPrompt.bind(this),
      CRITIQUE_REPORT_SCHEMA,
      'ANALYSIS_FAILED'
    )
  }
  
  private buildAnalyzeSongPrompt(input: {
    song: Song,
    level: CritiqueLevel
  }): GrokRequest {
    const systemMessage = this.buildSystemMessage(
      CRITIQUE_REPORT_SCHEMA,
      `You are an expert songwriting critic analyzing lyrics for professional quality.

Your task: Analyze the provided song and return a comprehensive critique report.

Critique Level: ${input.level}

Evaluation Dimensions:
1. Rhyme Quality - Check for forced rhymes, weak rhymes, perfect rhymes
2. Flow Consistency - Analyze syllable patterns, stress patterns, rhythm
3. Imagery Vividness - Rate concrete vs abstract, sensory details, specificity
4. Emotional Authenticity - Detect clichés, assess genuine voice, check consistency
5. Originality - Identify overused phrases, rate unique perspectives, check for fresh metaphors
6. Voice Consistency - Check POV stability, vocabulary level, tone shifts

Gold Standard Criteria:
- Rhyme Quality: 80+
- Flow Consistency: 85+
- Imagery Vividness: 90+
- Emotional Authenticity: 95+
- Originality: 85+
- Voice Consistency: 90+
- Max Clichés: 0
- Max Forced Rhymes: 0
- Max Rhythm Breaks: 1

Return a detailed analysis with specific issues, line numbers, and actionable suggestions.`
    )
    
    const userMessage = `Analyze this song:

Title: ${input.song.title}

${this.formatSongForAnalysis(input.song)}

Provide comprehensive critique as JSON.`
    
    return {
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.3, // Low temperature for consistent analysis
      maxTokens: 4000,
      allowCache: false // Don't cache critiques (songs are unique)
    }
  }
  
  private formatSongForAnalysis(song: Song): string {
    let text = ''
    
    song.verses.forEach((verse, i) => {
      text += `\n[Verse ${i + 1}]\n`
      verse.lines.forEach(line => {
        text += `${line.text}\n`
      })
    })
    
    song.choruses.forEach((chorus, i) => {
      text += `\n[Chorus${chorus.isMainChorus ? ' - Main' : ` ${i + 1}`}]\n`
      chorus.lines.forEach(line => {
        text += `${line.text}\n`
      })
    })
    
    if (song.bridge) {
      text += `\n[Bridge]\n`
      song.bridge.lines.forEach(line => {
        text += `${line.text}\n`
      })
    }
    
    return text
  }
  
  // ... implement other methods similarly
}
```

### 5.3 Service-Specific Strategies

Each service needs tailored prompts and response handling:

| Service | AI Strategy | Temperature | Cache? | Notes |
|---------|-------------|-------------|--------|-------|
| **SongGeneration** | Creative generation | 0.8 | No | High creativity needed |
| **CritiqueEngine** | Analytical evaluation | 0.3 | No | Consistency important |
| **RevisionEngine** | Targeted improvement | 0.6 | No | Balance creativity + preservation |
| **RhymeAnalysis** | Pattern detection | 0.2 | Yes | Deterministic preferred |
| **SyllableCounting** | Counting + stress | 0.1 | Yes | Near-deterministic |
| **InputValidation** | Validation + sanitization | 0.1 | Yes | Deterministic required |
| **GrokAudio** | Audio interpretation | 0.5 | No | Context-dependent |
| **SunoFormatter** | Template application | 0.0 | No | Deterministic (may stay heuristic) |

---

## 6. Prompt Engineering Framework

### 6.1 Prompt Structure Template

All prompts follow this structure:

```
┌─────────────────────────────────────┐
│  SYSTEM MESSAGE                     │
│  ─────────────────                  │
│  1. Role Definition                 │
│  2. Task Description                │
│  3. Output Schema (JSON)            │
│  4. Critical Rules                  │
│  5. Examples (optional)             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  USER MESSAGE                       │
│  ─────────────────                  │
│  1. Input Data                      │
│  2. Specific Request                │
│  3. Output Format Reminder          │
└─────────────────────────────────────┘
```

### 6.2 Prompt Library

**File**: `/src/services/ai/prompts/PromptLibrary.ts`

```typescript
export class PromptLibrary {
  /**
   * Generate song from prompt
   */
  static songGeneration(input: GenerateSongInput): GrokRequest {
    return {
      messages: [
        {
          role: 'system',
          content: `You are a professional songwriter specializing in ${input.style?.genre || 'contemporary'} music.

Your task: Generate a complete song with verses, choruses, and optionally a bridge.

Song Structure Requirements:
- ${input.constraints?.verseCount || 3} verses
- ${input.constraints?.linesPerVerse || 4} lines per verse
- ${input.constraints?.chorusCount || 1} chorus
- ${input.constraints?.linesPerChorus || 4} lines per chorus
- Rhyme scheme: ${input.constraints?.rhymeScheme || 'ABAB'}

Quality Standards:
- Vivid, concrete imagery (avoid abstractions)
- Authentic emotional voice (no clichés)
- Consistent syllable patterns for flow
- Perfect or near-perfect rhymes
- Strong narrative or emotional arc

Output Schema:
{
  "title": "string",
  "verses": [
    {
      "number": 1,
      "lines": ["line1", "line2", "line3", "line4"],
      "mood": "string"
    }
  ],
  "choruses": [
    {
      "lines": ["line1", "line2", "line3", "line4"],
      "hook": "string"
    }
  ],
  "bridge": {
    "lines": ["line1", "line2"]
  } | null
}

Return ONLY valid JSON wrapped in markdown code block.`
        },
        {
          role: 'user',
          content: `Write a song about: ${input.prompt.prompt}

Genre: ${input.style?.genre || 'unspecified'}
Mood: ${input.style?.mood || 'unspecified'}

Generate the song as JSON.`
        }
      ],
      temperature: 0.8,
      maxTokens: 3000
    }
  }
  
  /**
   * Analyze rhyme patterns
   */
  static rhymeAnalysis(lines: readonly string[]): GrokRequest {
    return {
      messages: [
        {
          role: 'system',
          content: `You are a phonetic expert analyzing rhyme patterns in song lyrics.

Your task: Analyze the rhyme patterns, quality, and provide suggestions.

Rhyme Quality Levels:
- perfect: Identical sounds (cat/hat)
- near: Similar sounds (cat/cap)
- slant: Consonance/assonance (cat/cut)
- forced: Awkward word choice for rhyme
- weak: Barely rhymes
- none: No rhyme

Output Schema:
{
  "rhymeScheme": "string (e.g., ABAB)",
  "rhymePairs": [
    {
      "line1Index": 0,
      "line2Index": 1,
      "quality": "perfect|near|slant|forced|weak|none",
      "sharedSound": "string"
    }
  ],
  "qualityScore": 0-100,
  "suggestions": [
    {
      "lineIndex": 0,
      "issue": "string",
      "alternatives": ["word1", "word2"]
    }
  ]
}

Return ONLY valid JSON.`
        },
        {
          role: 'user',
          content: `Analyze rhyme patterns:

${lines.map((line, i) => `${i + 1}. ${line}`).join('\n')}

Return analysis as JSON.`
        }
      ],
      temperature: 0.2,
      maxTokens: 2000,
      allowCache: true
    }
  }
  
  // ... more prompt builders
}
```

### 6.3 Few-Shot Examples

For complex tasks, include examples in system message:

```typescript
const systemMessage = `You are a songwriting critic.

Example Input:
{
  "song": {
    "title": "Lost Dreams",
    "verses": [...]
  }
}

Example Output:
{
  "overallScore": 75,
  "passesGoldStandard": false,
  "issues": [
    {
      "severity": "major",
      "type": "cliche",
      "message": "Line 3 uses overused phrase 'heart on my sleeve'",
      "affectedLines": [3],
      "suggestion": "Replace with more specific, concrete imagery"
    }
  ],
  ...
}

Now analyze the following song...`
```

---

## 7. Testing Strategy

### 7.1 The Testing Challenge

**Problem**: AI responses are non-deterministic, but tests expect deterministic outputs.

**Solution**: Multi-layer testing approach.

### 7.2 Testing Layers

**Layer 1: Contract Compliance Tests** (Existing)
- Test that service methods match interface signatures
- Test ServiceResponse structure
- Test error codes
- **No changes needed** - these tests work with any implementation

**Layer 2: Response Validation Tests** (NEW)
- Test that AI responses can be parsed
- Test that parsed responses match contract types
- Test error handling when AI returns invalid data

**Layer 3: Integration Tests** (NEW)
- Test full AI service workflow
- Use snapshot testing for structure (not exact content)
- Focus on contract compliance, not exact outputs

**Layer 4: Mock Fallback** (Existing)
- Keep heuristic mocks for UI development
- Use mocks when API key not configured
- Fast tests without API calls

### 7.3 Test Strategy by Service

```typescript
// Layer 1: Contract compliance (EXISTING)
describe('CritiqueEngineService Contract Tests', () => {
  it('should return ServiceResponse<CritiqueReport>', async () => {
    const result = await service.analyzeSong(mockSong)
    
    // Assert structure, not content
    expect(result).toHaveProperty('success')
    if (result.success) {
      expect(result.data).toHaveProperty('overallScore')
      expect(result.data).toHaveProperty('passesGoldStandard')
      expect(typeof result.data.overallScore).toBe('number')
    }
  })
})

// Layer 2: Response validation (NEW)
describe('CritiqueEngineService Response Validation', () => {
  it('should validate AI response against schema', () => {
    const mockAIResponse = {
      overallScore: 85,
      passesGoldStandard: true,
      // ... full response
    }
    
    const result = ResponseValidator.validate(
      mockAIResponse,
      CRITIQUE_REPORT_SCHEMA
    )
    
    expect(result.success).toBe(true)
  })
  
  it('should reject invalid AI response', () => {
    const invalidResponse = {
      overallScore: 'not a number', // Wrong type
      // missing required fields
    }
    
    const result = ResponseValidator.validate(
      invalidResponse,
      CRITIQUE_REPORT_SCHEMA
    )
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('Invalid type')
  })
})

// Layer 3: Integration tests (NEW)
describe('CritiqueEngineService Integration', () => {
  it('should analyze song and return valid critique', async () => {
    const song = createTestSong()
    const result = await service.analyzeSong(song)
    
    expect(result.success).toBe(true)
    if (result.success) {
      // Snapshot test for structure
      expect(Object.keys(result.data)).toMatchSnapshot()
      
      // Assert contract compliance
      expect(result.data.overallScore).toBeGreaterThanOrEqual(0)
      expect(result.data.overallScore).toBeLessThanOrEqual(100)
      expect(Array.isArray(result.data.issues)).toBe(true)
    }
  }, 30000) // Longer timeout for AI calls
})
```

### 7.4 Handling Non-Determinism

**Strategies**:

1. **Structural Assertions**: Check shape, not exact values
```typescript
expect(result.data).toHaveProperty('issues')
expect(Array.isArray(result.data.issues)).toBe(true)
```

2. **Range Assertions**: Check values in valid range
```typescript
expect(result.data.overallScore).toBeGreaterThanOrEqual(0)
expect(result.data.overallScore).toBeLessThanOrEqual(100)
```

3. **Type Assertions**: Validate types match contract
```typescript
expect(typeof result.data.overallScore).toBe('number')
expect(typeof result.data.passesGoldStandard).toBe('boolean')
```

4. **Snapshot Testing**: Capture structure, not content
```typescript
expect(Object.keys(result.data).sort()).toMatchSnapshot()
```

5. **Mock Responses for Unit Tests**: Mock GrokAIService
```typescript
jest.mock('../../services/ai/GrokAIService')
const mockGrok = GrokAIService.getInstance as jest.Mock
mockGrok.mockResolvedValue({
  success: true,
  data: { /* predictable response */ }
})
```

### 7.5 Test Configuration

**File**: `/tests/setup/aiTestConfig.ts`

```typescript
export const AI_TEST_CONFIG = {
  // Use mock AI service by default
  useMockAI: process.env.USE_REAL_AI !== 'true',
  
  // Longer timeouts for AI tests
  timeout: 30000,
  
  // Skip AI tests in CI unless configured
  skipInCI: process.env.CI === 'true' && !process.env.GROK_API_KEY
}

// Test helper
export function describeAI(name: string, tests: () => void) {
  if (AI_TEST_CONFIG.skipInCI) {
    describe.skip(name, tests)
  } else {
    describe(name, tests)
  }
}
```

### 7.6 Migration Impact on Tests

**Existing Tests**: ✅ NO CHANGES NEEDED
- Contract tests already written (193 tests)
- Test against interface, not implementation
- Tests will pass with AI services if contract compliance is maintained

**New Tests**: Add response validation tests
```bash
/tests/services/ai/
  ├── ResponseValidator.test.ts
  ├── GrokAIService.test.ts
  ├── PromptLibrary.test.ts
  └── schemas/
      ├── CritiqueEngineSchema.test.ts
      ├── SongGenerationSchema.test.ts
      └── ...
```

---

## 8. Migration Plan

### 8.1 Phase Overview

```
Current: Wave 1 COMPLETE (Heuristic Mocks)
  ├── MockInputValidationService ✅
  ├── MockRhymeAnalysisService ✅
  └── MockSyllableCountingService ✅

Migration: Add AI Layer (Parallel to Phase 3-5)
  ├── Phase 3.5: Build AI Infrastructure
  ├── Phase 5.1: Implement AI Services
  └── Phase 5.2: Migrate from Mocks to AI
```

### 8.2 Detailed Migration Steps

#### Step 1: AI Infrastructure (Week 1)

**Goal**: Build reusable AI integration layer

**Tasks**:
1. Create `/src/services/ai/` directory structure
2. Implement `GrokAIService.ts` (singleton)
3. Implement `ResponseValidator.ts`
4. Implement `GrokConfig.ts`
5. Implement `AuthManager.ts`
6. Create base schemas for all services
7. Write unit tests for AI layer (no API calls)

**Deliverables**:
- ✅ GrokAIService with retry logic
- ✅ Response validation framework
- ✅ Configuration management
- ✅ 100% test coverage for AI layer

**Success Criteria**:
- Can execute mock AI requests
- Can parse and validate responses
- Can handle errors gracefully
- No TypeScript errors

#### Step 2: Prompt Library (Week 1-2)

**Goal**: Create all service-specific prompts

**Tasks**:
1. Create `/src/services/ai/prompts/` directory
2. Implement `PromptLibrary.ts`
3. Create prompt builders for each service:
   - `buildSongGenerationPrompt()`
   - `buildCritiquePrompt()`
   - `buildRevisionPrompt()`
   - `buildRhymeAnalysisPrompt()`
   - `buildSyllableCountingPrompt()`
   - `buildInputValidationPrompt()`
   - `buildAudioAnalysisPrompt()`
4. Write prompt tests (validate structure, no API)

**Deliverables**:
- ✅ Complete prompt library
- ✅ Prompt validation tests
- ✅ Few-shot examples for complex tasks

**Success Criteria**:
- All prompts follow template
- Prompts include JSON schemas
- Prompts tested for structure

#### Step 3: Base AI Service (Week 2)

**Goal**: Create shared functionality for AI services

**Tasks**:
1. Implement `BaseAIService.ts`
2. Add common methods:
   - `executeAI()`
   - `buildSystemMessage()`
   - `parseResponse()`
   - `handleErrors()`
3. Write tests for base class

**Deliverables**:
- ✅ Reusable base class
- ✅ Error handling patterns
- ✅ Test coverage

#### Step 4: First AI Service - CritiqueEngine (Week 2-3)

**Goal**: Implement and validate first AI service

**Tasks**:
1. Create `/src/services/real/CritiqueEngineService.ts`
2. Extend `BaseAIService`
3. Implement all `ICritiqueEngineService` methods
4. Create response schemas
5. Write integration tests
6. Test with real API

**Deliverables**:
- ✅ Working CritiqueEngineService
- ✅ All contract methods implemented
- ✅ Integration tests passing
- ✅ Real API tested

**Success Criteria**:
- All existing tests pass (193/193)
- New AI service returns valid responses
- Response validation succeeds
- Error handling works

#### Step 5: Remaining AI Services (Week 3-5)

**Priority Order**:
1. **SongGenerationService** (Week 3)
2. **RevisionEngineService** (Week 4)
3. **RhymeAnalysisService** (Week 5)
4. **SyllableCountingService** (Week 5)
5. **InputValidationService** (Week 5)
6. **GrokAudioService** (Week 5)

**Per Service**:
- Implement service extending BaseAIService
- Create response schemas
- Write integration tests
- Validate against existing tests
- Document prompts and responses

#### Step 6: Service Factory (Week 6)

**Goal**: Enable switching between mock and AI services

**File**: `/src/services/factory/ServiceFactory.ts`

```typescript
export class ServiceFactory {
  private static useAI: boolean = false
  
  static configure(config: { useAI: boolean }) {
    this.useAI = config.useAI
  }
  
  static createCritiqueEngine(): ICritiqueEngineService {
    if (this.useAI && this.hasApiKey()) {
      return new CritiqueEngineService()
    }
    return new MockCritiqueEngineService()
  }
  
  static createSongGeneration(): ISongGenerationService {
    if (this.useAI && this.hasApiKey()) {
      return new SongGenerationService()
    }
    return new MockSongGenerationService()
  }
  
  // ... other services
  
  private static hasApiKey(): boolean {
    try {
      AuthManager.getApiKey()
      return true
    } catch {
      return false
    }
  }
}
```

#### Step 7: Configuration & Testing (Week 6)

**Tasks**:
1. Add VSCode settings for API key
2. Create `.env.example` for API key
3. Update documentation
4. Run full test suite (mock + AI)
5. Performance testing
6. Cost analysis

**Deliverables**:
- ✅ Complete configuration guide
- ✅ All tests passing
- ✅ Performance metrics
- ✅ Cost estimates

### 8.3 Migration Checklist

**Per Service Migration**:
- [ ] Create AI service class extending BaseAIService
- [ ] Implement all contract methods
- [ ] Create response schemas
- [ ] Build service-specific prompts
- [ ] Write response validation tests
- [ ] Write integration tests
- [ ] Test with real API
- [ ] Verify existing tests still pass
- [ ] Update service factory
- [ ] Document prompts and schemas
- [ ] Measure performance
- [ ] Estimate costs

### 8.4 Rollback Plan

**If Migration Fails**:
1. **Keep Mocks**: Heuristic mocks remain functional
2. **Service Factory**: Can switch back to mocks
3. **No Contract Changes**: Contracts unchanged, safe to revert
4. **Version Control**: Use git branches for AI implementation

**Fallback Strategy**:
```typescript
// Graceful degradation
try {
  const aiService = new CritiqueEngineService()
  return await aiService.analyzeSong(song)
} catch (error) {
  logger.warn('AI service failed, falling back to mock')
  const mockService = new MockCritiqueEngineService()
  return await mockService.analyzeSong(song)
}
```

---

## 9. Cost & Performance Optimization

### 9.1 Cost Analysis

**Grok API Pricing** (estimated, verify current):
- Input: $5 per 1M tokens
- Output: $15 per 1M tokens
- Reasoning: Additional cost for reasoning model

**Token Usage Estimates**:

| Service | Input Tokens | Output Tokens | Cost/Call | Calls/Day | Daily Cost |
|---------|-------------|---------------|-----------|-----------|------------|
| SongGeneration | 500 | 1500 | $0.03 | 100 | $3.00 |
| CritiqueEngine | 800 | 2000 | $0.04 | 200 | $8.00 |
| RevisionEngine | 1000 | 1500 | $0.04 | 150 | $6.00 |
| RhymeAnalysis | 200 | 500 | $0.01 | 50 | $0.50 |
| SyllableCounting | 150 | 300 | $0.01 | 30 | $0.30 |
| InputValidation | 100 | 200 | $0.005 | 500 | $2.50 |
| **TOTAL** | - | - | - | **1030** | **$20.30** |

**Monthly Cost** (30 days): ~$600

### 9.2 Cost Optimization Strategies

**1. Aggressive Caching**
```typescript
const cacheConfig: CacheOptions = {
  enabled: true,
  ttlMs: {
    RhymeAnalysis: 60 * 60 * 1000, // 1 hour
    SyllableCounting: 60 * 60 * 1000, // 1 hour
    InputValidation: 30 * 60 * 1000, // 30 minutes
    SongGeneration: 0, // No cache (unique)
    CritiqueEngine: 10 * 60 * 1000, // 10 minutes
    RevisionEngine: 0 // No cache
  },
  maxSize: 10000
}
```

**2. Hybrid Approach**
- Use heuristics for simple tasks
- Use AI for complex tasks
- Decision tree based on input complexity

```typescript
async analyzeLines(lines: string[]): Promise<ServiceResponse<RhymeAnalysis>> {
  // Simple case: use heuristic
  if (lines.length <= 2) {
    return this.heuristicRhymeCheck(lines)
  }
  
  // Complex case: use AI
  return this.aiRhymeAnalysis(lines)
}
```

**3. Batch Processing**
- Group multiple requests
- Single AI call for multiple analyses
- Reduces API overhead

**4. Smart Prompts**
- Minimize input token count
- Use abbreviations where possible
- Remove unnecessary context

**5. Temperature Tuning**
- Lower temperature = faster, cheaper
- Use 0.1-0.3 for analytical tasks
- Use 0.6-0.8 only for creative tasks

### 9.3 Performance Optimization

**1. Parallel Requests**
```typescript
async analyzeSong(song: Song): Promise<ServiceResponse<CritiqueReport>> {
  // Run independent analyses in parallel
  const [rhymeResult, flowResult, imageryResult] = await Promise.all([
    this.checkRhymeQuality(song.lines),
    this.evaluateFlow(song.lines),
    this.analyzeImagery(song.lines)
  ])
  
  // Combine results
  return this.buildCritiqueReport(rhymeResult, flowResult, imageryResult)
}
```

**2. Streaming Responses** (future)
- Use server-sent events
- Display partial results to user
- Improve perceived performance

**3. Pre-computation**
- Cache common rhymes dictionary
- Pre-compute syllable patterns
- Store frequently used prompts

**4. Request Timeout**
```typescript
const TIMEOUT_MS = {
  SongGeneration: 30000, // 30s
  CritiqueEngine: 20000, // 20s
  RhymeAnalysis: 10000,  // 10s
  InputValidation: 5000  // 5s
}
```

### 9.4 Monitoring & Metrics

**Track**:
- API calls per service
- Token usage per call
- Response times
- Error rates
- Cache hit rates
- Cost per user session

**File**: `/src/services/ai/metrics/MetricsCollector.ts`

```typescript
export class MetricsCollector {
  private static metrics: Map<string, Metric[]> = new Map()
  
  static record(event: MetricEvent) {
    const service = event.service
    if (!this.metrics.has(service)) {
      this.metrics.set(service, [])
    }
    this.metrics.get(service)!.push({
      timestamp: Date.now(),
      tokensUsed: event.tokensUsed,
      duration: event.duration,
      cost: event.cost,
      cached: event.cached
    })
  }
  
  static getSummary(service: string): MetricSummary {
    const data = this.metrics.get(service) || []
    return {
      totalCalls: data.length,
      totalTokens: data.reduce((sum, m) => sum + m.tokensUsed, 0),
      totalCost: data.reduce((sum, m) => sum + m.cost, 0),
      avgDuration: data.reduce((sum, m) => sum + m.duration, 0) / data.length,
      cacheHitRate: data.filter(m => m.cached).length / data.length
    }
  }
}
```

---

## 10. Risk Mitigation

### 10.1 Identified Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| API rate limits | High | High | Rate limiter, queue system |
| Invalid AI responses | Medium | High | Response validation, retries |
| High costs | Medium | Medium | Caching, hybrid approach |
| API downtime | Low | High | Fallback to mocks |
| Breaking contracts | Low | Critical | Validation layer, tests |
| Non-deterministic tests | High | Medium | Structural testing |
| Slow responses | Medium | Medium | Timeouts, parallelization |
| API key leaks | Low | Critical | Environment variables, encryption |

### 10.2 Mitigation Strategies

**1. Rate Limiting**
```typescript
class RateLimiter {
  private queue: Request[] = []
  private processing = 0
  private maxConcurrent = 5
  private requestsPerMinute = 60
  
  async waitForSlot(): Promise<void> {
    while (this.processing >= this.maxConcurrent) {
      await this.sleep(100)
    }
    this.processing++
  }
  
  releaseSlot() {
    this.processing--
  }
}
```

**2. Response Validation**
- Validate ALL responses against schemas
- Retry if validation fails
- Log failed validations for debugging

**3. Fallback Chain**
```
AI Service → Retry (3x) → Mock Service → Error
```

**4. Circuit Breaker**
```typescript
class CircuitBreaker {
  private failureCount = 0
  private threshold = 5
  private resetTimeout = 60000 // 1 minute
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      throw new Error('Circuit breaker is open')
    }
    
    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }
  
  private onFailure() {
    this.failureCount++
    if (this.failureCount >= this.threshold) {
      this.state = 'open'
      setTimeout(() => {
        this.state = 'half-open'
        this.failureCount = 0
      }, this.resetTimeout)
    }
  }
  
  private onSuccess() {
    this.failureCount = 0
    this.state = 'closed'
  }
}
```

**5. Monitoring & Alerts**
- Log all API errors
- Track error rates
- Alert on high failure rates
- Alert on high costs

### 10.3 Testing Safeguards

**1. Schema Tests**: Validate all schemas compile
**2. Contract Tests**: Ensure AI responses match contracts
**3. Integration Tests**: Test full workflow with real API
**4. Performance Tests**: Measure response times
**5. Cost Tests**: Track token usage

---

## 11. SDD Compliance Validation

### 11.1 Contract Immutability ✅

**Validation**:
- ✅ No changes to `/src/contracts/` files
- ✅ All existing types remain unchanged
- ✅ Services implement exact interfaces
- ✅ ServiceResponse pattern maintained

**Proof**:
```typescript
// Contract remains unchanged
export interface ICritiqueEngineService {
  analyzeSong(song: Song, level?: CritiqueLevel): Promise<ServiceResponse<CritiqueReport>>
}

// AI service implements contract exactly
export class CritiqueEngineService implements ICritiqueEngineService {
  async analyzeSong(song: Song, level?: CritiqueLevel): Promise<ServiceResponse<CritiqueReport>> {
    // Implementation uses AI but contract stays the same
  }
}
```

### 11.2 TDD Compliance ✅

**Validation**:
- ✅ Existing tests remain unchanged (193 tests)
- ✅ Tests verify contract compliance, not implementation
- ✅ New tests added for AI layer
- ✅ Tests pass with both mock and AI implementations

**Test Strategy**:
```typescript
// Existing test (unchanged)
describe('ICritiqueEngineService Contract', () => {
  it('should return ServiceResponse<CritiqueReport>', async () => {
    const result = await service.analyzeSong(mockSong)
    expect(result).toHaveProperty('success')
  })
})

// Works with BOTH:
const service = new MockCritiqueEngineService() // Heuristic
const service = new CritiqueEngineService()     // AI
```

### 11.3 Seam Integrity ✅

**Validation**:
- ✅ All 10 seams remain intact
- ✅ Data flows unchanged
- ✅ Boundaries respected
- ✅ ServiceResponse pattern enforced

### 11.4 Success Criteria Checklist

**Architecture**:
- [ ] GrokAI Service implemented
- [ ] Response validation layer implemented
- [ ] All 8 AI services implemented
- [ ] Service factory implemented
- [ ] Configuration management implemented

**Testing**:
- [ ] All existing tests pass (193/193)
- [ ] New AI tests written and passing
- [ ] Integration tests passing
- [ ] Performance acceptable (<5s per request)

**Quality**:
- [ ] TypeScript errors: 0
- [ ] 'any' types: 0
- [ ] Test coverage: >80%
- [ ] SDD compliance: 100%
- [ ] TDD compliance: 100%

**Documentation**:
- [ ] Architecture documented
- [ ] Prompt library documented
- [ ] API integration guide written
- [ ] Migration guide written
- [ ] Cost analysis completed

---

## 12. Next Steps

### Immediate (Next Session)

1. **Review this architecture** with user
2. **Get approval** on approach
3. **Prioritize** services (which to migrate first)
4. **Set up** development environment:
   - Grok API key
   - Test account
   - Token budget

### Week 1

1. **Build AI Infrastructure**:
   - Implement GrokAIService
   - Implement ResponseValidator
   - Create base schemas
   - Write infrastructure tests

2. **Create Prompt Library**:
   - Build all service prompts
   - Test prompt structure
   - Document prompt patterns

### Week 2-6

1. **Implement AI Services** (one per week):
   - Week 2: CritiqueEngine
   - Week 3: SongGeneration
   - Week 4: RevisionEngine
   - Week 5: RhymeAnalysis, SyllableCounting
   - Week 6: InputValidation, GrokAudio

2. **Testing & Validation**:
   - Integration tests per service
   - Performance testing
   - Cost analysis

### Week 7

1. **Integration & Polish**:
   - Service factory
   - Configuration UI
   - Documentation
   - Final testing
   - Cost optimization

---

## Appendix

### A. File Structure

```
/src/services/
├── ai/                           # NEW: AI Integration Layer
│   ├── GrokAIService.ts          # Singleton AI client
│   ├── GrokConfig.ts             # Configuration
│   ├── GrokTypes.ts              # Type definitions
│   ├── AuthManager.ts            # API key management
│   ├── ResponseValidator.ts      # Schema validation
│   ├── RateLimiter.ts            # Rate limiting
│   ├── ResponseCache.ts          # Caching layer
│   ├── CircuitBreaker.ts         # Failure protection
│   ├── prompts/                  # Prompt library
│   │   ├── PromptLibrary.ts
│   │   ├── SongGenerationPrompts.ts
│   │   ├── CritiquePrompts.ts
│   │   └── ...
│   ├── schemas/                  # Response schemas
│   │   ├── CritiqueEngineSchema.ts
│   │   ├── SongGenerationSchema.ts
│   │   └── ...
│   └── metrics/                  # Monitoring
│       └── MetricsCollector.ts
│
├── mock/                         # EXISTING: Heuristic mocks
│   ├── MockInputValidationService.ts
│   ├── MockRhymeAnalysisService.ts
│   ├── MockSyllableCountingService.ts
│   └── ... (7 more)
│
├── real/                         # NEW: AI-powered services
│   ├── base/
│   │   └── BaseAIService.ts      # Shared functionality
│   ├── CritiqueEngineService.ts
│   ├── SongGenerationService.ts
│   ├── RevisionEngineService.ts
│   ├── RhymeAnalysisService.ts
│   ├── SyllableCountingService.ts
│   ├── InputValidationService.ts
│   └── GrokAudioService.ts
│
└── factory/                      # NEW: Service factory
    └── ServiceFactory.ts         # Mock/Real switcher
```

### B. Environment Setup

**.env** (gitignored):
```
GROK_API_KEY=your_api_key_here
USE_AI_SERVICES=true
AI_CACHE_ENABLED=true
AI_RATE_LIMIT_PER_MINUTE=60
```

**.env.example** (committed):
```
GROK_API_KEY=
USE_AI_SERVICES=false
AI_CACHE_ENABLED=true
AI_RATE_LIMIT_PER_MINUTE=60
```

### C. Key Dependencies

**package.json additions**:
```json
{
  "dependencies": {
    "node-fetch": "^3.3.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node-fetch": "^2.6.0"
  }
}
```

### D. Glossary

- **Grok-4-fast-reasoning**: xAI's reasoning-optimized language model
- **SDD**: Seam-Driven Development (this project's methodology)
- **TDD**: Test-Driven Development
- **Seam**: Data transformation point between system boundaries
- **Contract**: Immutable interface definition
- **Mock Service**: Heuristic-based implementation for development
- **Real Service**: AI-powered production implementation
- **ServiceResponse**: Standard response wrapper for all seams

---

**End of Architecture Document**

**Status**: Ready for review and implementation

**Next Action**: User approval and prioritization of services to migrate
