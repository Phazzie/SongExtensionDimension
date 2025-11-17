# Quality & Testing Strategy - Phase 5
**Project**: VSCode Songwriting Assistant  
**Phase**: Phase 5 (IMPLEMENT - Real AI Services)  
**AI Provider**: Grok-4-fast-reasoning (via IModelProvider abstraction)  
**Current Baseline**: 737 deterministic tests (100% passing)  
**Document Version**: 1.0  
**Created**: 2025-11-17  

---

## Executive Summary

### Challenge
Phase 3 achieved 737 deterministic tests (100% passing) with heuristic mocks. Phase 5 introduces **non-deterministic AI services** using Grok-4-fast-reasoning, where the same input produces different outputs. Traditional unit tests that expect exact values will fail.

### Approach
**Multi-Tiered Testing Strategy**:
1. **Contract Compliance Tests** (Must Have) - Verify structure, not content
2. **Behavioral Tests** (Must Have) - Test ranges and patterns, not exact values
3. **Quality Threshold Tests** (Must Have) - Ensure minimum quality standards
4. **Semantic Tests** (Nice to Have) - Validate contextual relevance
5. **Golden Set Validation** (Must Have) - Continuous quality monitoring with curated test cases

### Key Metrics
- **Success Rate Target**: ≥99% (AI service returns valid response)
- **Quality Baseline**: Match or exceed mock quality scores (avg ≥70)
- **Performance SLA**: P95 latency <5s for generation, <2s for analysis
- **Cost Budget**: ~$76.50/month for 1,000 active users
- **Contract Compliance**: 100% (every response matches interface exactly)

### Quality Gates
Before migrating any service to AI:
- ✅ All integration tests passing (100%)
- ✅ Contract compliance verified (100%)
- ✅ Performance within SLA (P95 latency)
- ✅ Cost within budget (per-call cost)
- ✅ Quality matches or exceeds mock baseline
- ✅ Error handling validated (all edge cases)
- ✅ Golden set tests passing (≥95%)

---

## 1. Test Strategy Matrix

### Overview
Mock tests verify **exact outputs** (deterministic). AI tests verify **valid outputs** (probabilistic).

| Test Type | Purpose | Example | Coverage |
|-----------|---------|---------|----------|
| **Contract Compliance** | Validate response structure | `result.data.song.verses` is array | 100% |
| **Behavioral** | Validate ranges & patterns | `verses.length` is 2-4 | 100% |
| **Quality Threshold** | Ensure minimum quality | `rhymeScore` ≥ 60 | 100% |
| **Semantic** | Validate relevance | "love song" contains love themes | 80% |
| **Edge Case** | Handle failures gracefully | Malformed AI JSON → helpful error | 100% |

### Service-Specific Test Coverage

#### 1. InputValidation (Heuristic - No AI)
**Status**: Remains deterministic (regex/pattern matching)  
**Test Count**: 32 existing tests (keep unchanged)  
**AI Integration**: None

**Tests to Maintain**:
- Contract compliance: 32/32 ✅
- All existing tests pass with real service

---

#### 2. RhymeAnalysis (Heuristic - No AI)
**Status**: Remains deterministic (phonetic dictionary)  
**Test Count**: 71 existing tests (keep unchanged)  
**AI Integration**: None

**Tests to Maintain**:
- Contract compliance: 71/71 ✅
- Phonetic accuracy: exact rhyme detection

---

#### 3. SyllableCounting (Heuristic - No AI)
**Status**: Remains deterministic (vowel counting algorithm)  
**Test Count**: 90 existing tests (keep unchanged)  
**AI Integration**: None

**Tests to Maintain**:
- Contract compliance: 90/90 ✅
- Syllable accuracy: exact counts

---

#### 4. SongGeneration (AI-Powered)
**Status**: Grok-4-fast-reasoning  
**Existing Mock Tests**: 143 tests  
**New Integration Tests Required**: ~50 tests

**A. Contract Compliance Tests** (20 tests)
| Test | Validates | Example |
|------|-----------|---------|
| Response structure | `ServiceResponse<GenerateSongOutput>` | `result.success === true` |
| Song ID exists | `song.id` is SongId | `typeof song.id === 'string'` |
| Title exists | `song.title` is non-empty string | `song.title.length > 0` |
| Verses array | `song.verses` is array | `Array.isArray(song.verses)` |
| Verse structure | Each verse has `id, number, lines, rhymeScheme` | Required fields present |
| Lines structure | Each line has `text, syllables, stressPattern` | Required fields present |
| Choruses array | `song.choruses` is array | At least 1 chorus |
| Metadata complete | `song.metadata` has all fields | `genre, mood, theme` exist |
| Confidence range | `confidence` is 0-1 | `0 <= confidence <= 1` |
| Alternatives array | `alternatives` is array | `Array.isArray(alternatives)` |

**B. Behavioral Tests** (15 tests)
| Test | Validates | Acceptable Range |
|------|-----------|------------------|
| Verse count | Respects constraints | 2-4 verses (if requested 3 ±1 variance) |
| Lines per verse | Consistent structure | 4-8 lines per verse |
| Chorus presence | Has at least one chorus | 1-3 choruses |
| Title relevance | Title relates to prompt | Contains theme keywords |
| Rhyme scheme | Follows requested pattern | ABAB, AABB, or ABCB |
| Syllable consistency | Lines have similar length | Variance ≤30% |
| Bridge inclusion | When requested | Present or absent based on constraints |
| Metadata accuracy | Genre matches prompt | Correct genre/mood/theme |
| Generation time | Performance SLA | P95 < 5s |
| Token usage | Cost control | < 4000 tokens |

**C. Quality Threshold Tests** (10 tests)
| Test | Threshold | Rationale |
|------|-----------|-----------|
| Min rhyme score | ≥60 | Below 60 = poor quality |
| Min flow score | ≥60 | Below 60 = awkward phrasing |
| Min imagery score | ≥65 | Below 65 = vague/generic |
| Min authenticity | ≥70 | Below 70 = inauthentic voice |
| Min originality | ≥65 | Below 65 = clichéd |
| Max cliché count | ≤3 | More = unoriginal |
| Coherence check | Narrative makes sense | No contradictions |
| Completeness | No empty sections | All verses/choruses have content |
| Language quality | Proper grammar | No gibberish |
| Character limit | ≤3000 chars | Suno compatibility |

**D. Semantic Tests** (5 tests)
| Test | Validates | Method |
|------|-----------|--------|
| Prompt relevance | Song matches prompt theme | Keyword overlap >30% |
| Emotional consistency | Mood matches requested | Sentiment analysis matches |
| Genre appropriateness | Vocabulary fits genre | Genre-specific words present |
| Narrative coherence | Story flows logically | No POV/tense shifts |
| Voice consistency | Maintains perspective | No 1st/3rd person mixing |

**E. Edge Case Tests** (10 tests)
| Test | Scenario | Expected Behavior |
|------|----------|-------------------|
| Malformed JSON | AI returns invalid JSON | Parse error → retry → fallback |
| Incomplete response | AI stops mid-generation | Detect truncation → retry |
| Rate limit hit | Too many requests | Exponential backoff → helpful error |
| Network timeout | API unreachable | Timeout after 10s → retry 3x → error |
| Empty response | AI returns empty string | Detect → retry → error |
| Token limit exceeded | Prompt too long | Truncate prompt → warn user |
| Inappropriate content | AI detects policy violation | Return error with suggestion |
| Invalid constraints | Impossible constraints (1-line song) | Validation error before API call |
| Concurrent requests | Multiple simultaneous calls | Queue/throttle → all succeed |
| API key invalid | Authentication fails | Clear error → guide to settings |

**Total Tests for SongGeneration**: 60 integration tests

---

#### 5. CritiqueEngine (AI-Powered)
**Status**: Grok-4-fast-reasoning  
**Existing Mock Tests**: 156 tests  
**New Integration Tests Required**: ~45 tests

**A. Contract Compliance Tests** (15 tests)
- Response structure: `ServiceResponse<CritiqueReport>`
- All 8 quality scores present: `rhymeQuality, flowConsistency, imageryVividness, emotionalAuthenticity, originalityScore, voiceConsistency, structuralCoherence, technicalExecution`
- Overall score: 0-100 range
- Quality level: Valid enum value
- Issues array: Correct structure (`issueType, severity, message, affectedLines`)
- Suggestions array: Non-empty for issues
- Strengths array: At least 1 strength
- Line analysis map: Entry for each line
- Section analysis: Entry for each section
- Passes gold standard: boolean

**B. Behavioral Tests** (12 tests)
- Score realism: Not all 100s or all 0s (variance >10)
- Issue detection: Detects obvious clichés ("heart on sleeve")
- Severity assignment: Critical issues have high score_impact (≥10)
- Suggestion relevance: Suggestions address detected issues
- Strengths identification: High scores generate strengths
- Line-by-line coverage: Every line analyzed
- Section coherence: Sections scored independently
- Gold standard accuracy: Correct pass/fail against criteria
- Performance: P95 < 2s
- Token usage: < 2000 tokens

**C. Quality Threshold Tests** (8 tests)
- Scores are reasonable: 40-95 range (not extreme)
- Issue count proportional: More issues → lower score
- Forced rhyme detection: Catches awkward rhymes
- Cliché detection: Catches common clichés
- Flow analysis accuracy: Detects rhythm breaks
- Emotional resonance: Identifies emotion keywords
- Consistency checking: Detects POV/tone shifts
- Specificity feedback: Actionable suggestions

**D. Semantic Tests** (5 tests)
- Critique relevance: Issues match actual problems
- False positive rate: <20% (don't flag good lyrics)
- False negative rate: <30% (catch most issues)
- Actionability: Suggestions are implementable
- Quality correlation: Higher quality → fewer issues

**E. Edge Case Tests** (5 tests)
- Empty song: Error with helpful message
- Very short song: Analyze with limited data
- Very long song: Handle pagination/truncation
- Malformed song: Graceful error
- Invalid critique level: Default to professional

**Total Tests for CritiqueEngine**: 45 integration tests

---

#### 6. RevisionEngine (AI-Powered)
**Status**: Grok-4-fast-reasoning  
**Existing Mock Tests**: 89 tests  
**New Integration Tests Required**: ~40 tests

**A. Contract Compliance Tests** (12 tests)
- Response structure: `ServiceResponse<RevisionOutput>`
- Revised song: Complete Song object
- Changes array: At least 1 change
- Improvement summary: Non-empty string
- Before/after scores: Both present
- Score delta: Calculated correctly
- Confidence: 0-1 range
- Applied suggestions: Subset of input suggestions
- Rejected suggestions: Explanations provided
- Iteration count: Matches options
- Metadata: Complete

**B. Behavioral Tests** (10 tests)
- Quality improvement: New score ≥ old score (allow -5 variance)
- Targeted improvement: Addressed issues improved
- Preservation: Unaffected sections unchanged (≥80% similarity)
- Suggestion application: Requested suggestions applied
- Iteration convergence: Quality improves with iterations
- Structure preservation: Verse/chorus count maintained
- Rhyme scheme maintenance: Scheme preserved unless changing
- Syllable consistency: Line lengths similar
- Performance: P95 < 4s
- Token usage: < 3000 tokens

**C. Quality Threshold Tests** (8 tests)
- Min improvement: Score delta ≥ 5 (meaningful change)
- Max degradation: Score delta ≥ -5 (don't make worse)
- Issue resolution: Targeted issues reduced by ≥50%
- New issues: Don't introduce more issues than resolved
- Voice preservation: Maintain original voice (≥85% similarity)
- Coherence maintenance: Story still makes sense
- Completeness: No sections left empty
- Gold standard progress: Move toward gold standard

**D. Semantic Tests** (5 tests)
- Feedback application: Changes match critique suggestions
- Contextual awareness: Revisions fit song context
- Improvement focus: Highest-impact issues addressed first
- Progressive refinement: Each iteration better
- Minimal disruption: Changes are surgical, not rewrites

**E. Edge Case Tests** (5 tests)
- Already perfect song: Minimal changes, high confidence
- Very poor song: Extensive changes, lower confidence
- Conflicting feedback: Prioritize by severity
- Impossible constraints: Return error explaining conflict
- Max iterations exceeded: Return best attempt with warning

**Total Tests for RevisionEngine**: 40 integration tests

---

#### 7. SunoFormatter (Heuristic - No AI)
**Status**: Template-based formatting  
**Test Count**: 78 existing tests (keep unchanged)  
**AI Integration**: None

**Tests to Maintain**:
- Contract compliance: 78/78 ✅
- Character limit enforcement: ≤3000 chars
- Format validation: Correct Suno format

---

#### 8. Export (Heuristic - No AI)
**Status**: File I/O operations  
**Test Count**: 67 existing tests (keep unchanged)  
**AI Integration**: None

**Tests to Maintain**:
- Contract compliance: 67/67 ✅
- Format support: TXT, JSON, PDF, SUNO
- File system errors: Graceful handling

---

#### 9. History (Heuristic - No AI)
**Status**: CRUD database operations  
**Test Count**: 95 existing tests (keep unchanged)  
**AI Integration**: None

**Tests to Maintain**:
- Contract compliance: 95/95 ✅
- Version control: Correct snapshots
- Search functionality: Query accuracy

---

#### 10. AudioAnalysis (Hybrid - AI + Heuristic)
**Status**: Heuristic for basic features, Grok for deep analysis  
**Existing Mock Tests**: 116 tests  
**New Integration Tests Required**: ~30 tests

**A. Contract Compliance Tests** (10 tests)
- Response structure: `ServiceResponse<AudioAnalysisOutput>`
- Rhythm analysis: Complete structure
- Emotion detection: Array of emotions
- Tempo/key: Valid values
- Melody patterns: Array present
- Suggestions: Actionable feedback
- Confidence: 0-1 range

**B. Behavioral Tests** (8 tests)
- Rhythm detection: Reasonable BPM (60-180)
- Emotion identification: ≥1 emotion detected
- Key detection: Valid musical key
- Tempo classification: Slow/moderate/fast correct
- Pattern recognition: Identifies repetition
- Performance: P95 < 5s
- Token usage: < 5000 tokens

**C. Quality Threshold Tests** (5 tests)
- Analysis completeness: All sections analyzed
- Confidence minimum: ≥0.5 for all features
- Accuracy baseline: Match known test files
- False detection rate: <30%

**D. Semantic Tests** (4 tests)
- Genre appropriateness: Detected genre matches
- Mood consistency: Audio mood matches lyrics
- Style coherence: Elements align

**E. Edge Case Tests** (3 tests)
- Unsupported format: Clear error
- Corrupted file: Graceful error
- Very long audio: Handle or error

**Total Tests for AudioAnalysis**: 30 integration tests

---

### Test Strategy Summary

| Service | AI? | Mock Tests | Integration Tests | Total Coverage |
|---------|-----|------------|-------------------|----------------|
| InputValidation | No | 32 | 0 | 32 |
| RhymeAnalysis | No | 71 | 0 | 71 |
| SyllableCounting | No | 90 | 0 | 90 |
| **SongGeneration** | **Yes** | 143 | **60** | **203** |
| **CritiqueEngine** | **Yes** | 156 | **45** | **201** |
| **RevisionEngine** | **Yes** | 89 | **40** | **129** |
| SunoFormatter | No | 78 | 0 | 78 |
| Export | No | 67 | 0 | 67 |
| History | No | 95 | 0 | 95 |
| **AudioAnalysis** | **Hybrid** | 116 | **30** | **146** |
| **TOTAL** | - | **737** | **175** | **912** |

**Key Insight**: AI services get ~175 new integration tests (24% increase), focusing on non-deterministic validation.

---

## 2. Performance Benchmark Targets

### SLA Validation

| Service | Latency Target (P50) | P95 Target | P99 Acceptable | Failure Threshold | Rationale |
|---------|---------------------|------------|----------------|-------------------|-----------|
| InputValidation | 50ms | 100ms | 200ms | >500ms | Regex/validation is CPU-bound, should be instant |
| RhymeAnalysis | 100ms | 200ms | 500ms | >1s | Phonetic lookup in dictionary, minimal computation |
| SyllableCounting | 50ms | 100ms | 300ms | >500ms | Vowel counting algorithm, very fast |
| **SongGeneration** | **2.5s** | **5s** | **8s** | **>10s** | AI generation is network + compute heavy |
| **CritiqueEngine** | **1s** | **2s** | **4s** | **>8s** | Analysis faster than generation |
| **RevisionEngine** | **3s** | **6s** | **10s** | **>15s** | Most complex: analyze + generate + compare |
| SunoFormatter | 50ms | 100ms | 200ms | >500ms | Template substitution, very fast |
| Export | 200ms | 500ms | 1s | >3s | File I/O bound, depends on disk |
| History | 100ms | 200ms | 500ms | >1s | Database query, indexed lookups |
| **AudioAnalysis** | **3s** | **5s** | **10s** | **>20s** | Audio processing + AI analysis |

### Monitoring Approach

**Metrics Collection**:
```typescript
interface PerformanceMetrics {
  readonly service: string
  readonly operation: string
  readonly duration: number // milliseconds
  readonly timestamp: Date
  readonly success: boolean
  readonly retryCount: number
}
```

**Aggregation**:
- Calculate P50, P95, P99 latencies per service (daily/weekly)
- Track success rate per service
- Monitor retry counts (high retries = reliability issue)
- Alert on degradation: P95 increases >50% from baseline

**Alert Thresholds**:
- **Warning**: P95 exceeds target by 50% (e.g., 7.5s for SongGeneration)
- **Critical**: P95 exceeds failure threshold
- **Degradation**: P95 increases >2x baseline over 24 hours

**Implementation**:
```typescript
class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  
  async measureOperation<T>(
    service: string,
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = Date.now()
    let success = false
    try {
      const result = await fn()
      success = true
      return result
    } finally {
      const duration = Date.now() - start
      this.metrics.push({
        service,
        operation,
        duration,
        timestamp: new Date(),
        success,
        retryCount: 0
      })
    }
  }
  
  getP95(service: string, hours: number = 24): number {
    // Calculate 95th percentile latency for service in last N hours
  }
}
```

---

## 3. Cost Optimization Plan

### Cost Breakdown (Grok-4-fast-reasoning)

**Pricing Model** (Estimated):
- Input: $0.10 per 1M tokens
- Output: $0.30 per 1M tokens
- Average: ~$0.15 per 1M tokens (assuming 60% input, 40% output)

#### Per-Service Cost Estimates

| Service | Avg Input Tokens | Avg Output Tokens | Total Tokens | Cost per Call | Calls/User/Month | Cost/User/Month |
|---------|------------------|-------------------|--------------|---------------|------------------|-----------------|
| SongGeneration | 500 | 1500 | 2000 | $0.0003 | 10 | $0.003 |
| CritiqueEngine | 800 | 700 | 1500 | $0.000225 | 15 | $0.003375 |
| RevisionEngine | 1200 | 1800 | 3000 | $0.00045 | 8 | $0.0036 |
| AudioAnalysis | 2000 | 3000 | 5000 | $0.00075 | 2 | $0.0015 |
| **Total** | - | - | - | - | - | **$0.011625** |

**Monthly Costs by Scale**:
- **1,000 users**: $11.625/month (~$140/year)
- **10,000 users**: $116.25/month (~$1,400/year)
- **100,000 users**: $1,162.50/month (~$14,000/year)
- **1,000,000 users**: $11,625/month (~$140,000/year)

### Cost Optimization Strategies

#### 1. Aggressive Caching (Expected Savings: 30-40%)

**Strategy**: Cache identical prompts for 24 hours to reduce duplicate API calls.

```typescript
interface CacheEntry<T> {
  readonly data: T
  readonly timestamp: Date
  readonly hits: number
}

class ResponseCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map()
  private readonly ttl: number = 24 * 60 * 60 * 1000 // 24 hours
  
  async getOrCompute<T>(
    key: string,
    compute: () => Promise<T>
  ): Promise<T> {
    const cached = this.cache.get(key)
    
    // Check if cache is fresh
    if (cached && Date.now() - cached.timestamp.getTime() < this.ttl) {
      return cached.data as T
    }
    
    // Cache miss or stale - compute fresh
    const data = await compute()
    this.cache.set(key, {
      data,
      timestamp: new Date(),
      hits: 0
    })
    
    return data
  }
  
  // Generate cache key from prompt + options
  generateKey(input: unknown): string {
    return hashObject(input) // Stable hash function
  }
}
```

**Expected Impact**:
- Common prompts ("write a love song") get reused
- Tutorial/example prompts cached
- Reduces API calls by 30-40%
- **Savings**: ~$4-5/month per 1,000 users

**Implementation**:
- Cache at service layer (before AI provider)
- Invalidate on cache size >1000 entries (LRU eviction)
- User can disable cache in settings

---

#### 2. Prompt Compression (Expected Savings: 15-20%)

**Strategy**: Minimize system prompt tokens using abbreviations and concise examples.

**Before** (verbose):
```
You are a professional songwriter. Please generate a song with the following characteristics:
- Genre: pop
- Mood: melancholic
- Theme: love and loss
- Structure: 3 verses, 1 chorus, 1 bridge

Please ensure the song has:
- Strong rhyme scheme (ABAB preferred)
- Consistent syllable counts per line
- Vivid imagery
- Emotional authenticity
- Original metaphors (avoid clichés)

Return the result in JSON format with this structure: {...}
```
(~120 tokens)

**After** (compressed):
```
Songwriter. Generate song:
Genre: pop | Mood: melancholic | Theme: love/loss
Structure: 3v, 1c, 1b
Rules: ABAB rhyme, consistent syllables, vivid imagery, authentic emotion, no clichés
JSON: {...}
```
(~65 tokens = 46% reduction)

**Expected Impact**:
- Reduce input tokens by 40-50%
- Total token reduction: ~15-20% (output unchanged)
- **Savings**: ~$2/month per 1,000 users

**Implementation**:
- Create compressed prompt templates
- Test AI understanding (ensure quality maintained)
- A/B test compressed vs verbose

---

#### 3. Token Limits (Expected Savings: 10-15%)

**Strategy**: Cap `max_tokens` per request to prevent runaway costs.

```typescript
const TOKEN_LIMITS: Record<string, number> = {
  SongGeneration: 2000,    // ~500 words max
  CritiqueEngine: 1500,    // Enough for detailed feedback
  RevisionEngine: 2500,    // Larger (includes original + revisions)
  AudioAnalysis: 3000      // Complex analysis
}

async function callAI(service: string, prompt: string): Promise<Response> {
  const maxTokens = TOKEN_LIMITS[service] || 1000
  
  return await provider.generate({
    prompt,
    maxTokens,
    // Stop early if completion detected
    stopSequences: ['</song>', '```', 'END']
  })
}
```

**Expected Impact**:
- Prevent accidental 4000+ token responses
- Enforce concise outputs
- **Savings**: ~$1-2/month per 1,000 users

---

#### 4. Hybrid Approach (Expected Savings: 20-30%)

**Strategy**: Use heuristics where possible, AI only when necessary.

**Current Plan** (already optimized):
- ✅ InputValidation: Heuristic (regex)
- ✅ RhymeAnalysis: Heuristic (phonetic dictionary)
- ✅ SyllableCounting: Heuristic (vowel algorithm)
- ✅ SunoFormatter: Heuristic (templates)
- ✅ Export: Heuristic (file I/O)
- ✅ History: Heuristic (database)

**Additional Optimization**:
- **AudioAnalysis**: Use heuristics for basic features (tempo, key detection via FFT), AI only for deep semantic analysis
- **CritiqueEngine**: Use heuristics for cliché detection, syllable analysis, basic rhyme checking; AI for subjective quality (imagery, authenticity)

**Expected Impact**:
- AudioAnalysis cost: $0.00075 → $0.0003 (60% reduction)
- CritiqueEngine cost: $0.000225 → $0.00015 (33% reduction)
- **Savings**: ~$3/month per 1,000 users

---

#### 5. Batching (Expected Savings: 10-15%)

**Strategy**: Combine multiple operations into single API call where possible.

**Example**: Generate + Critique in one call
```typescript
// Instead of 2 calls:
const song = await generateSong(prompt)       // 2000 tokens
const critique = await critiqueSong(song)     // 1500 tokens
// Total: 3500 tokens, 2 API calls

// Do in 1 call:
const result = await generateAndCritique(prompt)  // 3000 tokens
// Total: 3000 tokens (14% savings), 1 API call
```

**Implementation**:
- Combine generate + critique + revision into workflow API
- Single system prompt, structured output
- Reduces token overhead (no repeated context)

**Expected Impact**:
- Reduce token usage by 10-15%
- Reduce latency (fewer round trips)
- **Savings**: ~$1-2/month per 1,000 users

---

### Cost Control Mechanisms

#### A. Per-User Limits

```typescript
interface UsageLimits {
  readonly dailyGenerations: number       // Default: 50
  readonly monthlyGenerations: number     // Default: 500
  readonly dailyCritiques: number         // Default: 100
  readonly monthlyCritiques: number       // Default: 1000
  readonly dailyTokens: number            // Default: 100,000
  readonly monthlyTokens: number          // Default: 1,000,000
}

class UsageTracker {
  async checkLimit(userId: string, operation: string): Promise<boolean> {
    const usage = await this.getUsage(userId)
    const limits = await this.getLimits(userId)
    
    switch (operation) {
      case 'generate':
        return usage.dailyGenerations < limits.dailyGenerations &&
               usage.monthlyGenerations < limits.monthlyGenerations
      case 'critique':
        return usage.dailyCritiques < limits.dailyCritiques &&
               usage.monthlyCritiques < limits.monthlyCritiques
      default:
        return true
    }
  }
  
  async incrementUsage(userId: string, operation: string, tokens: number): Promise<void> {
    // Atomic increment in database
  }
}
```

**Limits**:
- Free tier: 10 songs/day, 50/month
- Pro tier: 100 songs/day, 1000/month
- Enterprise: Unlimited (custom pricing)

---

#### B. Cost Monitoring Dashboard

**ASCII Mockup**:
```
┌─────────────────────────────────────────────────────────────┐
│                   AI Usage Dashboard                        │
├─────────────────────────────────────────────────────────────┤
│ Today's Costs:          $2.45                              │
│ Yesterday:              $1.87 (+31% ▲)                     │
│ Month to Date:          $42.30 / $100 budget (42%)         │
│ Projected Month:        $84.60 (On track ✓)               │
├─────────────────────────────────────────────────────────────┤
│ Service Breakdown (Today):                                 │
│   SongGeneration    1,234 calls   $0.37   15%   ███       │
│   CritiqueEngine    2,456 calls   $0.55   22%   ████      │
│   RevisionEngine      678 calls   $0.31   13%   ███       │
│   AudioAnalysis       123 calls   $0.09    4%   █         │
│   Cached Responses  3,891 hits    $0.00    0%             │
│                                   ------  ----             │
│   Total             4,491 calls   $1.32   53% (cached)    │
├─────────────────────────────────────────────────────────────┤
│ Top Users (Today):                                         │
│   user_123          45 calls   $0.05                      │
│   user_456          38 calls   $0.04                      │
│   user_789          32 calls   $0.04                      │
├─────────────────────────────────────────────────────────────┤
│ Alerts:                                                    │
│   ⚠ Daily spend 31% above yesterday (normal variance)     │
│   ✓ All services within SLA                               │
│   ✓ Cache hit rate: 53% (target: 30%)                     │
└─────────────────────────────────────────────────────────────┘
```

**Metrics Tracked**:
- Daily/monthly spend
- Cost per service
- Cost per user
- Cache hit rate
- Token usage trends
- Projected monthly cost

**Alert Rules**:
- Warning: Daily cost >2x average
- Critical: Monthly cost >90% of budget
- Info: Cache hit rate <20%

---

#### C. Auto-Fallback to Cheaper Providers

```typescript
class SmartProvider implements IModelProvider {
  private readonly providers: IModelProvider[]
  private readonly budgetRemaining: () => Promise<number>
  
  async generate(request: GenerationRequest): Promise<ServiceResponse<GenerationResponse>> {
    const budget = await this.budgetRemaining()
    
    // If budget low, use cheaper provider or mock
    if (budget < 10) {
      console.warn('Budget low, using mock provider')
      return this.mockProvider.generate(request)
    }
    
    // Normal operation: use Grok
    return this.grokProvider.generate(request)
  }
}
```

**Fallback Hierarchy**:
1. Grok-4-fast-reasoning (primary, $0.15/1M tokens)
2. Mock provider (fallback, $0/free, lower quality)
3. Error message (budget exhausted, guide to upgrade)

---

#### D. Cost Alerting

**Email Alerts**:
- **Daily Summary**: Sent at midnight with usage stats
- **Budget Warning**: When 80% of monthly budget used
- **Budget Critical**: When 95% of monthly budget used
- **Anomaly Detection**: When daily cost >3x average

**VSCode Notifications**:
- Show toast when user approaches daily limit (80%, 90%, 100%)
- Show warning in status bar when budget low
- Offer to upgrade to Pro tier

---

### Cost Optimization Summary

| Strategy | Expected Savings | Implementation Complexity | Priority |
|----------|------------------|---------------------------|----------|
| Caching | 30-40% | Medium | P0 (Must Have) |
| Prompt Compression | 15-20% | Low | P0 (Must Have) |
| Token Limits | 10-15% | Low | P0 (Must Have) |
| Hybrid Approach | 20-30% | High (already done) | P0 (Complete) |
| Batching | 10-15% | High | P1 (Nice to Have) |
| **Total Savings** | **60-80%** | - | - |

**Revised Cost Estimate** (with optimizations):
- **Before**: $11.625/month per 1,000 users
- **After**: $3-5/month per 1,000 users (60-70% reduction)
- **Annual**: ~$36-60/year per 1,000 users

**Break-Even Analysis**:
- If VSCode extension is free: Need sponsorships or ads
- If Pro tier: $2/month subscription → profitable at >2,000 users
- If Enterprise: $50/month → profitable at >50 users

---

## 4. Quality Metrics Dashboard Design

### Metrics to Track

#### A. Service Health Metrics
```typescript
interface ServiceHealthMetrics {
  readonly service: string
  readonly successRate: number          // % of calls returning success
  readonly avgLatency: number          // P50 latency (ms)
  readonly p95Latency: number          // P95 latency (ms)
  readonly p99Latency: number          // P99 latency (ms)
  readonly errorRate: number           // % of calls with errors
  readonly retryRate: number           // % of calls requiring retries
  readonly timeoutRate: number         // % of calls timing out
  readonly dailyCalls: number          // Total calls in last 24h
  readonly monthlyCalls: number        // Total calls in last 30d
}
```

**Targets**:
- Success rate: ≥99%
- Error rate: ≤1%
- Retry rate: ≤5%
- Timeout rate: ≤0.5%

---

#### B. Quality Score Metrics
```typescript
interface QualityMetrics {
  readonly avgOverallScore: number               // Average overall quality
  readonly avgRhymeScore: number                 // Average rhyme quality
  readonly avgFlowScore: number                  // Average flow quality
  readonly avgImageryScore: number               // Average imagery quality
  readonly avgAuthenticityScore: number          // Average authenticity
  readonly avgOriginalityScore: number           // Average originality
  readonly goldStandardPassRate: number          // % passing gold standard
  readonly excellentPassRate: number             // % scoring 80+
  readonly acceptablePassRate: number            // % scoring 60+
  readonly avgIssueCount: number                 // Average issues per song
  readonly criticalIssueRate: number             // % songs with critical issues
}
```

**Targets** (based on mock baselines):
- Avg overall score: ≥70
- Gold standard pass rate: ≥10% (very strict)
- Excellent pass rate: ≥40%
- Acceptable pass rate: ≥90%

---

#### C. User Satisfaction Metrics
```typescript
interface SatisfactionMetrics {
  readonly thumbsUpRate: number           // % positive feedback
  readonly thumbsDownRate: number         // % negative feedback
  readonly avgRevisionCount: number       // Avg revisions per song
  readonly abandonmentRate: number        // % songs abandoned mid-generation
  readonly retryRate: number              // % users retrying after poor result
  readonly exportRate: number             // % songs exported (indicator of satisfaction)
  readonly shareRate: number              // % songs shared (future feature)
}
```

**Targets**:
- Thumbs up rate: ≥70%
- Avg revision count: 2-3 (indicates iterative improvement)
- Abandonment rate: ≤20%
- Export rate: ≥60% (if exported, likely satisfied)

---

#### D. Cost Metrics
```typescript
interface CostMetrics {
  readonly dailyCost: number              // Total cost today ($)
  readonly monthlyCost: number            // Total cost this month ($)
  readonly costPerGeneration: number      // Avg cost per song generation ($)
  readonly costPerCritique: number        // Avg cost per critique ($)
  readonly costPerRevision: number        // Avg cost per revision ($)
  readonly costPerUser: number            // Avg cost per active user ($)
  readonly cacheHitRate: number           // % requests served from cache
  readonly avgTokensPerCall: number       // Avg tokens used per call
  readonly projectedMonthlyCost: number   // Projected cost for full month ($)
}
```

**Targets**:
- Cost per user: ≤$0.01/month (free tier)
- Cache hit rate: ≥30%
- Projected monthly cost: Within budget

---

### Dashboard Design (ASCII Mockup)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                        VSCode Songwriting Assistant                            │
│                          Quality & Performance Dashboard                       │
│                          Last Updated: 2025-11-17 14:32:15                     │
└────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────┐
│ SERVICE HEALTH (Last 24 Hours)                                                 │
├────────────────────────────────────────────────────────────────────────────────┤
│ Service             │ Calls │ Success │ P50   │ P95   │ Errors │ Status      │
│─────────────────────┼───────┼─────────┼───────┼───────┼────────┼─────────────│
│ SongGeneration      │ 1,234 │  99.2%  │ 2.3s  │ 4.8s  │  0.8%  │ ✓ Healthy   │
│ CritiqueEngine      │ 2,456 │  99.8%  │ 0.9s  │ 1.8s  │  0.2%  │ ✓ Healthy   │
│ RevisionEngine      │   678 │  98.5%  │ 3.1s  │ 6.2s  │  1.5%  │ ⚠ Warning   │
│ AudioAnalysis       │   123 │ 100.0%  │ 2.7s  │ 4.9s  │  0.0%  │ ✓ Healthy   │
│ InputValidation     │ 4,567 │ 100.0%  │ 42ms  │  89ms │  0.0%  │ ✓ Healthy   │
│ RhymeAnalysis       │ 3,891 │ 100.0%  │ 78ms  │ 156ms │  0.0%  │ ✓ Healthy   │
│ SyllableCounting    │ 3,891 │ 100.0%  │ 34ms  │  67ms │  0.0%  │ ✓ Healthy   │
│─────────────────────┴───────┴─────────┴───────┴───────┴────────┴─────────────│
│ Overall System Health: ✓ HEALTHY (99.4% success rate)                         │
└────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────┐
│ QUALITY METRICS (Last 7 Days)                                                  │
├────────────────────────────────────────────────────────────────────────────────┤
│ Metric                          │ Current │ Target  │ Trend    │ Status       │
│─────────────────────────────────┼─────────┼─────────┼──────────┼──────────────│
│ Avg Overall Quality Score       │   72.3  │  ≥70    │ +2.1 ▲  │ ✓ On Target  │
│ Avg Rhyme Score                 │   78.5  │  ≥60    │ +1.3 ▲  │ ✓ Exceeds    │
│ Avg Flow Score                  │   74.2  │  ≥60    │ -0.5 ▼  │ ✓ On Target  │
│ Avg Imagery Score               │   69.8  │  ≥65    │ +3.2 ▲  │ ✓ On Target  │
│ Avg Authenticity Score          │   81.2  │  ≥70    │ +1.7 ▲  │ ✓ Exceeds    │
│ Avg Originality Score           │   68.9  │  ≥65    │ -1.2 ▼  │ ✓ On Target  │
│─────────────────────────────────┼─────────┼─────────┼──────────┼──────────────│
│ Gold Standard Pass Rate         │   12%   │  ≥10%   │ +2% ▲   │ ✓ Exceeds    │
│ Excellent Quality Rate (≥80)    │   43%   │  ≥40%   │ +1% ▲   │ ✓ On Target  │
│ Acceptable Quality Rate (≥60)   │   91%   │  ≥90%   │  0% —   │ ✓ On Target  │
│─────────────────────────────────┼─────────┼─────────┼──────────┼──────────────│
│ Avg Issues per Song             │   3.2   │  ≤5     │ -0.3 ▼  │ ✓ Good       │
│ Critical Issue Rate             │   8%    │  ≤15%   │ -1% ▼   │ ✓ Excellent  │
└────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────┐
│ USER SATISFACTION (Last 30 Days)                                               │
├────────────────────────────────────────────────────────────────────────────────┤
│ Metric                    │ Value   │ Target  │ Status                         │
│───────────────────────────┼─────────┼─────────┼────────────────────────────────│
│ Thumbs Up Rate            │   74%   │  ≥70%   │ ✓ Satisfied                   │
│ Thumbs Down Rate          │   12%   │  ≤20%   │ ✓ Low Dissatisfaction         │
│ Neutral (No Feedback)     │   14%   │    -    │   Engagement Opportunity       │
│───────────────────────────┼─────────┼─────────┼────────────────────────────────│
│ Avg Revisions per Song    │   2.4   │  2-3    │ ✓ Healthy Iteration           │
│ Abandonment Rate          │   15%   │  ≤20%   │ ✓ Low Abandonment             │
│ Export Rate               │   68%   │  ≥60%   │ ✓ High Completion             │
│───────────────────────────┴─────────┴─────────┴────────────────────────────────│
│ User Sentiment: POSITIVE (74% satisfaction, low abandonment)                   │
└────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────┐
│ COST ANALYTICS (This Month)                                                    │
├────────────────────────────────────────────────────────────────────────────────┤
│ Current Month-to-Date:     $42.30 / $100 budget (42% used, 17 days elapsed)   │
│ Projected Month Total:     $84.60 (On track ✓)                                │
│ Yesterday:                 $1.87                                               │
│ Today (so far):            $2.45 (+31% vs yesterday)                           │
│────────────────────────────────────────────────────────────────────────────────│
│ Cost per Service (Today):                                                      │
│   SongGeneration       $0.37  (1,234 calls @ $0.0003 avg)   ████████          │
│   CritiqueEngine       $0.55  (2,456 calls @ $0.0002 avg)   ████████████      │
│   RevisionEngine       $0.31  (  678 calls @ $0.0005 avg)   ██████            │
│   AudioAnalysis        $0.09  (  123 calls @ $0.0007 avg)   ██                │
│   Cached Responses     $0.00  (3,891 cache hits)             [FREE]           │
│────────────────────────────────────────────────────────────────────────────────│
│ Optimization Metrics:                                                          │
│   Cache Hit Rate:          53% (target: 30%) ✓ Excellent                      │
│   Avg Tokens per Call:     1,847 (target: <2,500) ✓ Efficient                │
│   Cost per Active User:    $0.0042 (target: <$0.01) ✓ Under Budget           │
│────────────────────────────────────────────────────────────────────────────────│
│ Alerts:                                                                        │
│   ⚠ Daily spend +31% vs yesterday (within normal variance)                    │
│   ✓ Cache performing above target                                             │
│   ✓ On track to stay within monthly budget                                    │
└────────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────────┐
│ ALERTS & RECOMMENDATIONS                                                       │
├────────────────────────────────────────────────────────────────────────────────┤
│ ⚠ RevisionEngine error rate at 1.5% (target: <1%)                             │
│   → Action: Investigate timeout issues in RevisionEngine.ts                   │
│                                                                                │
│ ✓ All other services operating within SLA                                     │
│ ✓ Quality metrics stable or improving week-over-week                          │
│ ✓ Cost optimization strategies performing well                                │
│                                                                                │
│ 💡 Recommendation: Consider increasing cache TTL to 48 hours for tutorial     │
│    prompts to further reduce costs (estimated +10% cache hit rate)            │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

### Data Collection Implementation

```typescript
interface MetricsCollector {
  // Service health
  recordServiceCall(
    service: string,
    duration: number,
    success: boolean,
    error?: string
  ): void
  
  // Quality scores
  recordQualityScores(
    songId: string,
    scores: QualityScores,
    passesGoldStandard: boolean
  ): void
  
  // User feedback
  recordUserFeedback(
    songId: string,
    feedback: 'thumbs_up' | 'thumbs_down',
    comment?: string
  ): void
  
  // Cost tracking
  recordTokenUsage(
    service: string,
    inputTokens: number,
    outputTokens: number,
    cost: number
  ): void
  
  // Generate dashboard data
  getDashboardData(timeRange: string): DashboardData
}
```

**Storage**:
- In-memory ring buffer for recent metrics (last 10,000 events)
- Daily aggregates written to local SQLite database
- No PII or lyrics stored (only IDs, scores, metadata)

**Display Location**:
- VSCode Output Channel: "Songwriting Assistant - Metrics"
- Settings panel: "View Quality Dashboard"
- Status bar: Show current health icon (✓/⚠/✗)

---

## 5. Continuous Validation Procedures

### Golden Test Set Specification

**Purpose**: Curated test cases with known-good outputs for continuous quality monitoring.

#### Structure
```typescript
interface GoldenTestCase {
  readonly id: string
  readonly prompt: string
  readonly context: {
    readonly genre: string
    readonly mood: string
    readonly theme: string
  }
  readonly expectedQuality: {
    readonly minOverallScore: number
    readonly minRhymeScore: number
    readonly minFlowScore: number
    readonly minImageryScore: number
    readonly passesGoldStandard: boolean
  }
  readonly expectedBehavior: {
    readonly verseCount: { min: number; max: number }
    readonly hasChorus: boolean
    readonly hasBridge?: boolean
    readonly rhymeScheme?: string
  }
  readonly semanticExpectations: {
    readonly requiredThemes: readonly string[]      // Must contain these themes
    readonly forbiddenPhrases: readonly string[]    // Should not contain clichés
    readonly emotionalTone: string                  // Expected emotion
  }
}
```

#### Test Set Composition (50 Total Cases)

**Category Breakdown**:
- **Common Genres** (20 cases): Pop, Rock, Country, Indie, Hip-Hop, Folk
- **Edge Cases** (10 cases): Very short prompts, complex constraints, unusual themes
- **Quality Tiers** (10 cases): Known gold-standard prompts, known poor prompts
- **Revision Scenarios** (10 cases): Songs needing specific improvements

**Example Test Cases**:

```typescript
const GOLDEN_TEST_SET: readonly GoldenTestCase[] = [
  // 1. Classic Love Song (High Quality Expected)
  {
    id: 'golden_001',
    prompt: 'Write a heartfelt ballad about finding love after loss',
    context: {
      genre: 'pop',
      mood: 'hopeful',
      theme: 'love and healing'
    },
    expectedQuality: {
      minOverallScore: 70,
      minRhymeScore: 75,
      minFlowScore: 70,
      minImageryScore: 75,
      passesGoldStandard: false  // Realistic expectation
    },
    expectedBehavior: {
      verseCount: { min: 2, max: 4 },
      hasChorus: true,
      hasBridge: true,
      rhymeScheme: 'ABAB'
    },
    semanticExpectations: {
      requiredThemes: ['love', 'healing', 'hope'],
      forbiddenPhrases: ['heart on my sleeve', 'love at first sight'],
      emotionalTone: 'hopeful'
    }
  },
  
  // 2. Rock Anthem (High Energy)
  {
    id: 'golden_002',
    prompt: 'Create a powerful rock anthem about breaking free and rebellion',
    context: {
      genre: 'rock',
      mood: 'defiant',
      theme: 'freedom'
    },
    expectedQuality: {
      minOverallScore: 65,
      minRhymeScore: 60,
      minFlowScore: 70,
      minImageryScore: 70,
      passesGoldStandard: false
    },
    expectedBehavior: {
      verseCount: { min: 2, max: 3 },
      hasChorus: true,
      hasBridge: false
    },
    semanticExpectations: {
      requiredThemes: ['freedom', 'rebellion', 'power'],
      forbiddenPhrases: ['heart of gold'],
      emotionalTone: 'defiant'
    }
  },
  
  // 3. Edge Case: Very Short Prompt
  {
    id: 'golden_edge_001',
    prompt: 'Rain',
    context: {
      genre: 'any',
      mood: 'any',
      theme: 'rain'
    },
    expectedQuality: {
      minOverallScore: 50,  // Lower expectations for vague prompt
      minRhymeScore: 50,
      minFlowScore: 50,
      minImageryScore: 60,
      passesGoldStandard: false
    },
    expectedBehavior: {
      verseCount: { min: 2, max: 4 },
      hasChorus: true
    },
    semanticExpectations: {
      requiredThemes: ['rain'],
      forbiddenPhrases: [],
      emotionalTone: 'melancholic'
    }
  },
  
  // ... 47 more test cases covering diverse scenarios
]
```

#### Validation Frequency
- **Weekly**: Run full golden set (50 cases) against production AI
- **Nightly**: Run subset (10 critical cases) for quick smoke test
- **Pre-release**: Run full golden set before any deployment

#### Success Criteria
- **Pass Rate**: ≥95% of test cases meet minimum quality thresholds
- **No Regressions**: No case should degrade >10 points from baseline
- **Semantic Accuracy**: ≥80% of semantic expectations met

#### Alert Triggers
- **Warning**: Pass rate drops below 90%
- **Critical**: Pass rate drops below 85%
- **Regression**: Any individual test case score drops >15 points

---

### Shadow Testing

**Purpose**: Compare multiple AI providers to identify best-performing model.

#### Approach
```typescript
class ShadowTester {
  private readonly primaryProvider: IModelProvider    // Grok-4-fast-reasoning
  private readonly shadowProviders: IModelProvider[]  // Claude, GPT-4, etc.
  private readonly shadowRate: number = 0.01          // 1% of requests
  
  async generate(request: GenerationRequest): Promise<ServiceResponse<GenerationResponse>> {
    // Always use primary provider for actual response
    const primaryResponse = await this.primaryProvider.generate(request)
    
    // Randomly shadow test 1% of requests
    if (Math.random() < this.shadowRate) {
      // Run request through all shadow providers (don't block primary)
      this.runShadowTest(request, primaryResponse).catch(console.error)
    }
    
    return primaryResponse
  }
  
  private async runShadowTest(
    request: GenerationRequest,
    primaryResponse: ServiceResponse<GenerationResponse>
  ): Promise<void> {
    const shadowResults = await Promise.allSettled(
      this.shadowProviders.map(provider => provider.generate(request))
    )
    
    // Compare results (quality, latency, cost)
    const comparison = this.compareResponses(primaryResponse, shadowResults)
    
    // Log to analytics
    this.logShadowTestResult(comparison)
  }
  
  private compareResponses(
    primary: ServiceResponse<GenerationResponse>,
    shadows: PromiseSettledResult<ServiceResponse<GenerationResponse>>[]
  ): ShadowTestComparison {
    // Extract quality scores via critique
    // Compare latency
    // Compare token usage (cost)
    // Determine winner
  }
}
```

#### Metrics Tracked
- **Quality**: Run critique on all generated songs, compare scores
- **Latency**: Measure P50, P95 response times
- **Cost**: Track token usage and cost per request
- **Reliability**: Success rate, error types

#### Decision Criteria
If shadow provider outperforms primary by:
- **Quality**: +10 points average score (significant)
- **Latency**: -30% P95 latency (faster)
- **Cost**: -40% per request (much cheaper)
- **Reliability**: +5% success rate (more stable)

→ Recommend switching primary provider

#### Implementation Timeline
- **Phase 5**: Implement shadow testing infrastructure
- **Phase 6**: Enable shadow testing at 1% traffic
- **Monthly**: Review shadow test results, decide on provider

---

### User Feedback Loop

**Purpose**: Collect implicit and explicit user satisfaction signals.

#### A. Explicit Feedback
```typescript
interface UserFeedback {
  readonly songId: SongId
  readonly userId: string
  readonly rating: 1 | 2 | 3 | 4 | 5  // Star rating
  readonly thumbs: 'up' | 'down' | null
  readonly comment?: string
  readonly timestamp: Date
}

// VSCode UI
function showFeedbackPrompt(song: Song): void {
  vscode.window.showInformationMessage(
    'How would you rate this song?',
    { modal: false },
    '👍 Great',
    '👎 Needs Work',
    '⭐ Rate (1-5)'
  ).then(selection => {
    if (selection === '👍 Great') {
      recordFeedback(song.id, { thumbs: 'up', rating: 5 })
    } else if (selection === '👎 Needs Work') {
      recordFeedback(song.id, { thumbs: 'down', rating: 2 })
      // Optionally prompt for details
      vscode.window.showInputBox({
        prompt: 'What could be improved?',
        placeHolder: 'Optional feedback...'
      }).then(comment => {
        if (comment) {
          recordFeedback(song.id, { thumbs: 'down', rating: 2, comment })
        }
      })
    }
  })
}
```

#### B. Implicit Feedback
```typescript
interface ImplicitSignals {
  readonly songId: SongId
  readonly exported: boolean              // User exported → likely satisfied
  readonly revisionCount: number          // Many revisions → initial quality poor
  readonly timeToExport: number           // Fast export → satisfied quickly
  readonly abandoned: boolean             // Closed without export → dissatisfied
  readonly sharedExternally: boolean      // Shared → very satisfied (future)
}
```

**Interpretation**:
- **Exported + 0 revisions**: Excellent quality, immediate satisfaction
- **Exported + 1-2 revisions**: Good quality, minor improvements needed
- **Exported + 3+ revisions**: Poor initial quality, required work
- **Abandoned**: Very poor quality, gave up
- **Exported quickly (<5 min)**: High satisfaction
- **Exported slowly (>30 min)**: Required iteration, lower satisfaction

#### C. Trend Analysis
```typescript
function analyzeSatisfactionTrend(days: number): SatisfactionTrend {
  const feedback = getRecentFeedback(days)
  
  return {
    avgRating: calculateAverage(feedback.map(f => f.rating)),
    thumbsUpRate: feedback.filter(f => f.thumbs === 'up').length / feedback.length,
    thumbsDownRate: feedback.filter(f => f.thumbs === 'down').length / feedback.length,
    avgRevisions: calculateAverage(feedback.map(f => f.revisionCount)),
    exportRate: feedback.filter(f => f.exported).length / feedback.length,
    abandonmentRate: feedback.filter(f => f.abandoned).length / feedback.length,
    trend: calculateTrend(feedback) // 'improving' | 'stable' | 'degrading'
  }
}
```

**Alert Triggers**:
- **Warning**: Thumbs down rate >20%
- **Critical**: Thumbs down rate >30%
- **Regression**: Thumbs up rate drops >10% in 7 days

---

### Automated Regression Detection

**Purpose**: Automatically detect quality degradation and alert immediately.

#### A. Baseline Establishment
```typescript
interface QualityBaseline {
  readonly service: string
  readonly metric: string
  readonly mean: number
  readonly stdDev: number
  readonly p95: number
  readonly calculatedAt: Date
  readonly sampleSize: number
}

// Establish baseline from first 1,000 requests
const baselines: QualityBaseline[] = [
  {
    service: 'SongGeneration',
    metric: 'overallScore',
    mean: 72.3,
    stdDev: 8.5,
    p95: 85,
    calculatedAt: new Date('2025-11-17'),
    sampleSize: 1000
  },
  {
    service: 'SongGeneration',
    metric: 'p95Latency',
    mean: 4200,
    stdDev: 600,
    p95: 5100,
    calculatedAt: new Date('2025-11-17'),
    sampleSize: 1000
  }
  // ... more baselines
]
```

#### B. Real-Time Monitoring
```typescript
class RegressionDetector {
  private readonly baselines: Map<string, QualityBaseline>
  private readonly windowSize: number = 100  // Rolling window of 100 requests
  private readonly recentMetrics: Map<string, number[]> = new Map()
  
  checkForRegression(service: string, metric: string, value: number): void {
    const baseline = this.baselines.get(`${service}:${metric}`)
    if (!baseline) return
    
    // Add to rolling window
    const key = `${service}:${metric}`
    const window = this.recentMetrics.get(key) || []
    window.push(value)
    if (window.length > this.windowSize) {
      window.shift()
    }
    this.recentMetrics.set(key, window)
    
    // Calculate current average
    const currentMean = window.reduce((a, b) => a + b) / window.length
    
    // Detect regression
    const degradation = baseline.mean - currentMean
    const threshold = baseline.stdDev * 2  // 2 standard deviations
    
    if (degradation > threshold) {
      this.alertRegression({
        service,
        metric,
        baselineMean: baseline.mean,
        currentMean,
        degradation,
        severity: this.calculateSeverity(degradation, threshold)
      })
    }
  }
  
  private calculateSeverity(degradation: number, threshold: number): 'warning' | 'critical' {
    return degradation > threshold * 1.5 ? 'critical' : 'warning'
  }
  
  private alertRegression(alert: RegressionAlert): void {
    // Send email, log to dashboard, create GitHub issue
    console.error(`[REGRESSION] ${alert.service}.${alert.metric}: ${alert.degradation.toFixed(1)} point drop`)
    // Could trigger automatic rollback in production
  }
}
```

#### C. Automated Responses

**Warning Level** (degradation >2σ):
1. Log alert to dashboard
2. Send email to maintainers
3. Increase monitoring frequency (every 10 requests instead of 100)

**Critical Level** (degradation >3σ):
1. All of above
2. Create GitHub issue automatically
3. Consider automatic rollback to previous AI model version
4. Notify users in VSCode ("We're experiencing quality issues, using fallback provider")

---

### Continuous Validation Schedule

| Frequency | Test Type | Purpose | Success Criteria |
|-----------|-----------|---------|------------------|
| **Every Request** | Contract compliance | Ensure valid responses | 100% pass |
| **Every Request** | Performance tracking | Monitor latency/cost | Within SLA |
| **Every 100 Requests** | Regression detection | Detect quality drift | No alerts |
| **Daily** | Golden subset (10 cases) | Quick smoke test | ≥95% pass |
| **Weekly** | Full golden set (50 cases) | Comprehensive validation | ≥95% pass |
| **Weekly** | Shadow testing analysis | Compare AI providers | Document results |
| **Monthly** | User feedback review | Analyze satisfaction trends | Thumbs up ≥70% |
| **Quarterly** | Baseline recalibration | Update quality baselines | New baselines set |

---

## 6. Test Infrastructure Blueprint

### Directory Structure

```
/tests/
├── contracts/                           # Phase 3: Mock tests (737 tests - KEEP)
│   ├── InputValidation.test.ts          # 32 tests
│   ├── RhymeAnalysis.test.ts            # 71 tests
│   ├── SyllableCounting.test.ts         # 90 tests
│   ├── SongGeneration.test.ts           # 143 tests
│   ├── CritiqueEngine.test.ts           # 156 tests
│   ├── RevisionEngine.test.ts           # 89 tests
│   ├── SunoFormatter.test.ts            # 78 tests
│   ├── Export.test.ts                   # 67 tests
│   ├── History.test.ts                  # 95 tests
│   └── AudioAnalysis.test.ts            # 116 tests
│
├── integration/                         # Phase 5: Real AI tests (NEW)
│   ├── real-services/
│   │   ├── SongGeneration.integration.test.ts     # 60 tests
│   │   ├── CritiqueEngine.integration.test.ts     # 45 tests
│   │   ├── RevisionEngine.integration.test.ts     # 40 tests
│   │   └── AudioAnalysis.integration.test.ts      # 30 tests
│   │
│   ├── providers/
│   │   ├── GrokProvider.integration.test.ts       # 25 tests
│   │   ├── MockProvider.integration.test.ts       # 15 tests
│   │   └── ProviderFactory.integration.test.ts    # 10 tests
│   │
│   └── golden-set/
│       ├── golden-test-cases.json                 # 50 curated test cases
│       ├── golden-set.test.ts                     # Runs golden tests
│       └── baselines.json                         # Expected quality baselines
│
├── performance/                         # Phase 5: Load & latency tests (NEW)
│   ├── latency.test.ts                  # Measure P50, P95, P99 latencies
│   ├── load.test.ts                     # Concurrent request handling
│   ├── cost.test.ts                     # Token usage & cost tracking
│   └── stress.test.ts                   # Find breaking points
│
├── e2e/                                 # Phase 5: Full workflow tests (NEW)
│   ├── song-generation-workflow.e2e.test.ts       # Generate → Critique → Revise
│   ├── revision-workflow.e2e.test.ts              # Iterative improvement loop
│   └── export-workflow.e2e.test.ts                # Generate → Format → Export
│
├── regression/                          # Phase 5: Continuous validation (NEW)
│   ├── regression-detector.test.ts      # Test regression detection logic
│   └── shadow-testing.test.ts           # Test shadow testing infrastructure
│
└── helpers/                             # Shared test utilities
    ├── test-fixtures.ts                 # Sample songs, prompts, etc.
    ├── test-builders.ts                 # Builder pattern for test data
    ├── assertion-helpers.ts             # Custom matchers for AI tests
    └── mock-providers.ts                # Test doubles for providers
```

---

### Test File Templates

#### A. Integration Test Template
```typescript
/**
 * @fileoverview Integration Tests for Real SongGenerationService
 * @purpose Validate AI-powered service against contract and quality standards
 *
 * DIFFERENCES FROM MOCK TESTS:
 * - Mock: Exact outputs expected
 * - Real: Ranges, patterns, quality thresholds expected
 * - Mock: Fast (ms)
 * - Real: Slower (seconds), use longer timeouts
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { SongGenerationService } from '../../../src/services/real/SongGenerationService'
import { GrokProvider } from '../../../src/services/providers/GrokProvider'
import type { ISongGenerationService } from '../../../src/contracts/SongGeneration'
import { isSuccess, isFailure } from '../../../src/contracts/types/common'
import { createValidatedPrompt } from '../../helpers/test-builders'

describe('SongGenerationService (Real AI) Integration Tests', () => {
  let service: ISongGenerationService
  let provider: GrokProvider
  
  beforeAll(() => {
    // Ensure API key is available
    const apiKey = process.env.GROK_API_KEY
    if (!apiKey) {
      throw new Error('GROK_API_KEY environment variable required for integration tests')
    }
    
    provider = new GrokProvider({ apiKey })
    service = new SongGenerationService(provider)
  })
  
  afterAll(async () => {
    // Cleanup if needed
  })
  
  describe('Contract Compliance', () => {
    it('should return ServiceResponse<GenerateSongOutput>', async () => {
      const input = createValidatedPrompt('Write a love song')
      
      const result = await service.generate(input)
      
      // Always has success field
      expect(result).toHaveProperty('success')
      expect(typeof result.success).toBe('boolean')
      
      if (isSuccess(result)) {
        expect(result.data).toHaveProperty('song')
        expect(result.data).toHaveProperty('confidence')
        expect(result.data).toHaveProperty('alternatives')
      }
    }, 10000) // 10s timeout for AI calls
    
    // ... 19 more contract compliance tests
  })
  
  describe('Behavioral Tests', () => {
    it('should respect verse count constraints (±1 variance)', async () => {
      const input = createValidatedPrompt('Write a song', {
        constraints: { verseCount: 3 }
      })
      
      const result = await service.generate(input)
      
      if (isSuccess(result)) {
        const { song } = result.data
        expect(song.verses.length).toBeGreaterThanOrEqual(2)  // 3 - 1
        expect(song.verses.length).toBeLessThanOrEqual(4)     // 3 + 1
      }
    }, 10000)
    
    // ... 14 more behavioral tests
  })
  
  describe('Quality Thresholds', () => {
    it('should meet minimum rhyme score (≥60)', async () => {
      const input = createValidatedPrompt('Write a rhyming song')
      
      const result = await service.generate(input)
      
      if (isSuccess(result)) {
        // Run critique to get quality scores
        const critique = await critiqueService.analyzeSong(result.data.song)
        
        if (isSuccess(critique)) {
          expect(critique.data.scores.rhymeQuality).toBeGreaterThanOrEqual(60)
        }
      }
    }, 15000)
    
    // ... 9 more quality threshold tests
  })
  
  describe('Semantic Tests', () => {
    it('should generate song relevant to prompt theme', async () => {
      const input = createValidatedPrompt('Write a song about oceans')
      
      const result = await service.generate(input)
      
      if (isSuccess(result)) {
        const lyrics = extractAllLyrics(result.data.song)
        
        // Check for ocean-related keywords
        const oceanKeywords = ['ocean', 'sea', 'wave', 'tide', 'shore', 'beach', 'water']
        const containsOceanTheme = oceanKeywords.some(keyword => 
          lyrics.toLowerCase().includes(keyword)
        )
        
        expect(containsOceanTheme).toBe(true)
      }
    }, 10000)
    
    // ... 4 more semantic tests
  })
  
  describe('Edge Cases', () => {
    it('should handle malformed AI response gracefully', async () => {
      // This test may require mocking the provider to return malformed JSON
      // For now, test that service handles network errors
      
      const badProvider = new GrokProvider({ apiKey: 'invalid_key' })
      const badService = new SongGenerationService(badProvider)
      const input = createValidatedPrompt('Test')
      
      const result = await badService.generate(input)
      
      expect(isFailure(result)).toBe(true)
      if (isFailure(result)) {
        expect(result.error.code).toBe('AI_GENERATION_FAILED')
        expect(result.error.suggestion).toBeTruthy()
      }
    }, 10000)
    
    // ... 9 more edge case tests
  })
})

// Helper to extract all lyrics from song
function extractAllLyrics(song: Song): string {
  const lines: string[] = []
  song.verses.forEach(v => v.lines.forEach(l => lines.push(l.text)))
  song.choruses.forEach(c => c.lines.forEach(l => lines.push(l.text)))
  if (song.bridge) {
    song.bridge.lines.forEach(l => lines.push(l.text))
  }
  return lines.join(' ')
}
```

---

#### B. Golden Set Test Template
```typescript
/**
 * @fileoverview Golden Test Set - Continuous Quality Validation
 * @purpose Run curated test cases weekly to detect AI quality regression
 */

import { describe, it, expect, beforeAll } from '@jest/globals'
import { loadGoldenTestCases } from './golden-test-cases'
import { SongGenerationService } from '../../../src/services/real/SongGenerationService'
import { CritiqueEngineService } from '../../../src/services/real/CritiqueEngineService'
import { GrokProvider } from '../../../src/services/providers/GrokProvider'
import type { GoldenTestCase } from './types'

describe('Golden Test Set - Quality Validation', () => {
  let songService: SongGenerationService
  let critiqueService: CritiqueEngineService
  let testCases: GoldenTestCase[]
  
  beforeAll(() => {
    const provider = new GrokProvider({ apiKey: process.env.GROK_API_KEY! })
    songService = new SongGenerationService(provider)
    critiqueService = new CritiqueEngineService(provider)
    testCases = loadGoldenTestCases()
  })
  
  describe('Golden Test Cases', () => {
    testCases.forEach(testCase => {
      it(`should meet quality standards for: ${testCase.id} - ${testCase.prompt}`, async () => {
        // Generate song
        const result = await songService.generate({
          prompt: createValidatedPrompt(testCase.prompt),
          style: testCase.context,
          constraints: testCase.expectedBehavior
        })
        
        expect(isSuccess(result)).toBe(true)
        if (!isSuccess(result)) return
        
        const { song } = result.data
        
        // Run critique
        const critique = await critiqueService.analyzeSong(song)
        expect(isSuccess(critique)).toBe(true)
        if (!isSuccess(critique)) return
        
        const { scores, passesGoldStandard } = critique.data
        
        // Validate quality thresholds
        expect(scores.overallScore).toBeGreaterThanOrEqual(testCase.expectedQuality.minOverallScore)
        expect(scores.rhymeQuality).toBeGreaterThanOrEqual(testCase.expectedQuality.minRhymeScore)
        expect(scores.flowConsistency).toBeGreaterThanOrEqual(testCase.expectedQuality.minFlowScore)
        expect(scores.imageryVividness).toBeGreaterThanOrEqual(testCase.expectedQuality.minImageryScore)
        
        // Validate behavioral expectations
        expect(song.verses.length).toBeGreaterThanOrEqual(testCase.expectedBehavior.verseCount.min)
        expect(song.verses.length).toBeLessThanOrEqual(testCase.expectedBehavior.verseCount.max)
        expect(song.choruses.length > 0).toBe(testCase.expectedBehavior.hasChorus)
        
        // Validate semantic expectations
        const lyrics = extractAllLyrics(song)
        testCase.semanticExpectations.requiredThemes.forEach(theme => {
          expect(lyrics.toLowerCase()).toContain(theme.toLowerCase())
        })
        
        testCase.semanticExpectations.forbiddenPhrases.forEach(phrase => {
          expect(lyrics.toLowerCase()).not.toContain(phrase.toLowerCase())
        })
        
        // Log result for tracking
        console.log(`✓ ${testCase.id}: Overall=${scores.overallScore}, Rhyme=${scores.rhymeQuality}`)
      }, 20000) // Long timeout for AI generation + critique
    })
  })
  
  describe('Aggregate Golden Set Metrics', () => {
    it('should have ≥95% pass rate across all golden tests', async () => {
      // This test runs after all individual tests
      // Calculate pass rate from results
      
      const passRate = calculatePassRate()
      expect(passRate).toBeGreaterThanOrEqual(0.95)
    })
    
    it('should have stable average quality (no regression)', async () => {
      const avgQuality = calculateAverageQuality()
      const baseline = loadBaseline()
      
      // Average quality should not degrade >10 points
      expect(avgQuality).toBeGreaterThanOrEqual(baseline.avgQuality - 10)
    })
  })
})
```

---

#### C. Performance Test Template
```typescript
/**
 * @fileoverview Performance & Load Testing
 * @purpose Measure latency, throughput, and identify bottlenecks
 */

import { describe, it, expect } from '@jest/globals'
import { performance } from 'perf_hooks'
import { SongGenerationService } from '../../../src/services/real/SongGenerationService'
import { GrokProvider } from '../../../src/services/providers/GrokProvider'

describe('Performance Tests', () => {
  let service: SongGenerationService
  
  beforeAll(() => {
    const provider = new GrokProvider({ apiKey: process.env.GROK_API_KEY! })
    service = new SongGenerationService(provider)
  })
  
  describe('Latency Benchmarks', () => {
    it('should meet P95 latency target (<5s)', async () => {
      const latencies: number[] = []
      const iterations = 20  // Run 20 times to get P95
      
      for (let i = 0; i < iterations; i++) {
        const start = performance.now()
        
        await service.generate(createValidatedPrompt('Test song'))
        
        const duration = performance.now() - start
        latencies.push(duration)
      }
      
      // Calculate P95 (95th percentile)
      latencies.sort((a, b) => a - b)
      const p95Index = Math.floor(latencies.length * 0.95)
      const p95Latency = latencies[p95Index]
      
      console.log(`P50: ${latencies[Math.floor(latencies.length * 0.5)]}ms`)
      console.log(`P95: ${p95Latency}ms`)
      console.log(`P99: ${latencies[Math.floor(latencies.length * 0.99)]}ms`)
      
      expect(p95Latency).toBeLessThan(5000)  // <5 seconds
    }, 120000) // 2-minute timeout for 20 iterations
  })
  
  describe('Concurrent Load', () => {
    it('should handle 10 concurrent requests', async () => {
      const promises = Array.from({ length: 10 }, () =>
        service.generate(createValidatedPrompt('Concurrent test'))
      )
      
      const results = await Promise.allSettled(promises)
      
      const successCount = results.filter(r => r.status === 'fulfilled').length
      
      expect(successCount).toBeGreaterThanOrEqual(9)  // At least 90% success
    }, 60000)
  })
  
  describe('Cost Tracking', () => {
    it('should stay within token budget', async () => {
      const result = await service.generate(createValidatedPrompt('Cost test'))
      
      if (isSuccess(result)) {
        const tokensUsed = result.data.generationMetadata?.tokensUsed || 0
        
        expect(tokensUsed).toBeLessThan(4000)  // Budget: 4000 tokens max
        
        const cost = (tokensUsed / 1_000_000) * 0.15  // $0.15 per 1M tokens
        console.log(`Tokens: ${tokensUsed}, Cost: $${cost.toFixed(4)}`)
        
        expect(cost).toBeLessThan(0.001)  // <$0.001 per call
      }
    }, 15000)
  })
})
```

---

### CI/CD Integration

#### GitHub Actions Workflow
```yaml
name: Quality & Testing Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC

jobs:
  # Job 1: Fast Unit Tests (Mock Services)
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:contracts
        timeout-minutes: 5
      - name: Upload coverage
        uses: codecov/codecov-action@v3
  
  # Job 2: Integration Tests (Real AI Services)
  integration-tests:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' || github.event_name == 'schedule'
    env:
      GROK_API_KEY: ${{ secrets.GROK_API_KEY }}
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:integration
        timeout-minutes: 30
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: integration-test-results
          path: test-results/
  
  # Job 3: Golden Set Validation (Weekly)
  golden-set:
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule'
    env:
      GROK_API_KEY: ${{ secrets.GROK_API_KEY }}
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:golden
        timeout-minutes: 60
      - name: Check for regressions
        run: npm run check:regression
      - name: Create issue if regression detected
        if: failure()
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: '🚨 Quality Regression Detected in Golden Set',
              body: 'Golden test set failed. Review test results and investigate quality degradation.',
              labels: ['bug', 'quality', 'regression']
            })
  
  # Job 4: Performance Benchmarks (Weekly)
  performance:
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule'
    env:
      GROK_API_KEY: ${{ secrets.GROK_API_KEY }}
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:performance
        timeout-minutes: 30
      - name: Upload performance metrics
        uses: actions/upload-artifact@v3
        with:
          name: performance-metrics
          path: performance-results/
```

---

### Test Data Management

#### Fixtures Storage
```
/tests/fixtures/
├── prompts/
│   ├── common-prompts.json          # Frequently used prompts
│   ├── edge-case-prompts.json       # Unusual/challenging prompts
│   └── tutorial-prompts.json        # Tutorial examples
│
├── songs/
│   ├── high-quality-songs.json      # Known good songs
│   ├── low-quality-songs.json       # Known poor songs
│   └── diverse-genre-songs.json     # Various genres
│
├── critiques/
│   └── expected-critiques.json      # Known critique results
│
└── golden/
    ├── golden-test-cases.json       # 50 curated test cases
    └── baselines.json               # Expected quality baselines
```

#### Data Builders
```typescript
// tests/helpers/test-builders.ts

export function createValidatedPrompt(
  text: string,
  overrides?: Partial<ValidatedPrompt>
): ValidatedPrompt {
  return {
    id: `prompt_${Date.now()}` as any,
    prompt: text,
    context: {
      genre: 'pop',
      mood: 'neutral',
      theme: 'general',
      targetAudience: 'adults',
      ...overrides?.context
    },
    constraints: {
      verseCount: 3,
      linesPerVerse: 4,
      chorusCount: 1,
      linesPerChorus: 4,
      rhymeScheme: 'ABAB',
      ...overrides?.constraints
    },
    style: {
      genre: 'pop',
      mood: 'neutral',
      ...overrides?.style
    },
    sanitized: true,
    validatedAt: new Date(),
    ...overrides
  }
}

export function createTestSong(overrides?: Partial<Song>): Song {
  // ... build complete Song object with defaults
}

export function createCritiqueReport(overrides?: Partial<CritiqueReport>): CritiqueReport {
  // ... build complete CritiqueReport with realistic scores
}
```

---

## 7. Quality Gates Per Service

### Migration Checklist

Before migrating any service from mock to real AI implementation, ALL quality gates must pass.

---

#### SongGeneration Service Quality Gates

**Contract Compliance** ✅
- [ ] All 60 integration tests passing (100%)
- [ ] Response structure matches `ISongGenerationService` exactly
- [ ] All required fields present in every response
- [ ] No TypeScript errors

**Performance** ✅
- [ ] P50 latency: <2.5s (median)
- [ ] P95 latency: <5s (95th percentile)
- [ ] P99 latency: <8s (99th percentile)
- [ ] No timeouts in normal operation (<0.5%)

**Cost** ✅
- [ ] Average cost per call: <$0.0003
- [ ] Token usage: <4000 tokens per call
- [ ] No token limit exceeded errors

**Quality** ✅
- [ ] Average overall score: ≥70 (matches or exceeds mock baseline)
- [ ] Average rhyme score: ≥60
- [ ] Average flow score: ≥60
- [ ] Average imagery score: ≥65
- [ ] Acceptable quality rate (≥60): ≥90%

**Error Handling** ✅
- [ ] All edge case tests passing (10/10)
- [ ] Malformed AI responses handled gracefully
- [ ] Rate limiting handled (exponential backoff)
- [ ] Network failures handled (retry + fallback)
- [ ] Invalid constraints return clear error messages

**Golden Set** ✅
- [ ] ≥95% of golden test cases passing
- [ ] No regressions >10 points from baseline
- [ ] Semantic expectations met (≥80%)

**Documentation** ✅
- [ ] Service implementation documented
- [ ] API usage examples provided
- [ ] Error codes documented
- [ ] Migration guide written

**Approval** ✅
- [ ] Code review completed
- [ ] Quality metrics reviewed
- [ ] Cost projection approved
- [ ] Deployment plan approved

---

#### CritiqueEngine Service Quality Gates

**Contract Compliance** ✅
- [ ] All 45 integration tests passing (100%)
- [ ] Response structure matches `ICritiqueEngineService` exactly
- [ ] All 8 quality scores present and valid (0-100)
- [ ] Issues, suggestions, strengths arrays properly populated

**Performance** ✅
- [ ] P50 latency: <1s
- [ ] P95 latency: <2s
- [ ] P99 latency: <4s

**Cost** ✅
- [ ] Average cost per call: <$0.00025
- [ ] Token usage: <2000 tokens per call

**Quality** ✅
- [ ] Score realism: Scores vary (not all 100s or 0s)
- [ ] Issue detection accuracy: Catches obvious clichés
- [ ] False positive rate: <20%
- [ ] False negative rate: <30%
- [ ] Suggestion relevance: Suggestions address issues

**Error Handling** ✅
- [ ] All edge case tests passing (5/5)
- [ ] Empty/invalid song handled gracefully
- [ ] Very long songs handled (pagination/truncation)

**Golden Set** ✅
- [ ] ≥95% of golden critiques accurate
- [ ] Quality correlation: Higher quality → fewer issues

**Approval** ✅
- [ ] All checkboxes above completed
- [ ] Deployment approved

---

#### RevisionEngine Service Quality Gates

**Contract Compliance** ✅
- [ ] All 40 integration tests passing (100%)
- [ ] Response structure matches `IRevisionEngineService` exactly
- [ ] Changes array documents all modifications
- [ ] Before/after scores correctly calculated

**Performance** ✅
- [ ] P50 latency: <3s
- [ ] P95 latency: <6s
- [ ] P99 latency: <10s

**Cost** ✅
- [ ] Average cost per call: <$0.00045
- [ ] Token usage: <3000 tokens per call

**Quality** ✅
- [ ] Quality improvement: New score ≥ old score (allow -5 variance)
- [ ] Targeted improvement: Addressed issues improved
- [ ] Preservation: Unaffected sections ≥80% similar
- [ ] Issue resolution: Targeted issues reduced ≥50%
- [ ] No new critical issues introduced

**Error Handling** ✅
- [ ] All edge case tests passing (5/5)
- [ ] Already perfect songs handled (minimal changes)
- [ ] Very poor songs handled (extensive changes)
- [ ] Conflicting feedback prioritized by severity

**Golden Set** ✅
- [ ] ≥95% of revisions improve quality
- [ ] No degradations >5 points

**Approval** ✅
- [ ] All checkboxes above completed
- [ ] Deployment approved

---

#### AudioAnalysis Service Quality Gates

**Contract Compliance** ✅
- [ ] All 30 integration tests passing (100%)
- [ ] Response structure matches `IAudioAnalysisService` exactly
- [ ] Rhythm, emotion, tempo, key detected

**Performance** ✅
- [ ] P50 latency: <3s
- [ ] P95 latency: <5s
- [ ] P99 latency: <10s

**Cost** ✅
- [ ] Average cost per call: <$0.0003 (after hybrid optimization)
- [ ] Token usage: <3000 tokens per call (AI portion only)

**Quality** ✅
- [ ] Rhythm detection: Reasonable BPM (60-180)
- [ ] Emotion identification: ≥1 emotion detected
- [ ] Key detection: Valid musical key
- [ ] Confidence minimum: ≥0.5 for all features

**Error Handling** ✅
- [ ] All edge case tests passing (3/3)
- [ ] Unsupported formats return clear error
- [ ] Corrupted files handled gracefully

**Golden Set** ✅
- [ ] ≥90% accuracy on known test audio files

**Approval** ✅
- [ ] All checkboxes above completed
- [ ] Deployment approved

---

### Quality Gate Enforcement

**Automated Enforcement**:
```typescript
// Pre-deployment check script
async function checkQualityGates(service: string): Promise<boolean> {
  console.log(`Checking quality gates for ${service}...`)
  
  // Run integration tests
  const testsPassed = await runTests(`integration/${service}`)
  if (!testsPassed) {
    console.error('❌ Integration tests failed')
    return false
  }
  
  // Check performance benchmarks
  const performanceOk = await checkPerformance(service)
  if (!performanceOk) {
    console.error('❌ Performance benchmarks not met')
    return false
  }
  
  // Check cost budget
  const costOk = await checkCostBudget(service)
  if (!costOk) {
    console.error('❌ Cost budget exceeded')
    return false
  }
  
  // Run golden set
  const goldenSetPassed = await runGoldenSet(service)
  if (!goldenSetPassed) {
    console.error('❌ Golden set validation failed')
    return false
  }
  
  console.log('✅ All quality gates passed!')
  return true
}

// Block deployment if gates fail
if (await checkQualityGates('SongGeneration')) {
  deploy('SongGeneration')
} else {
  console.error('Deployment blocked. Fix quality issues first.')
  process.exit(1)
}
```

**Manual Review**:
- Team lead reviews quality metrics dashboard
- Approves deployment in GitHub PR
- Documents any exceptions/risks

---

## Conclusion

This Quality & Testing Strategy provides a comprehensive framework for migrating from deterministic mock services to non-deterministic AI-powered real services while maintaining high quality standards, performance, and cost efficiency.

### Key Takeaways

1. **Test Strategy**: 175 new integration tests focus on contract compliance, behavioral ranges, quality thresholds, and semantic relevance instead of exact outputs.

2. **Performance**: Validated SLA targets with monitoring and alerting to catch degradation immediately.

3. **Cost Control**: Multiple optimization strategies (caching, compression, token limits, batching) reduce costs by 60-80%, bringing per-user monthly cost to $3-5 instead of $11.

4. **Quality Metrics**: Comprehensive dashboard tracks service health, quality scores, user satisfaction, and costs in real-time.

5. **Continuous Validation**: Golden test set (50 cases), shadow testing (1% of traffic), user feedback loop, and automated regression detection ensure quality remains stable.

6. **Quality Gates**: Rigorous checklist must pass before any service migration, ensuring no regressions.

### Next Steps

1. **Phase 5 Start**: Implement GrokProvider and first real service (SongGeneration)
2. **Establish Baselines**: Run 1,000 requests to establish quality/performance baselines
3. **Enable Monitoring**: Deploy metrics dashboard and alerting
4. **Run Golden Set**: Validate against curated test cases
5. **Iterate**: Refine prompts, optimize costs, improve quality based on data

This strategy ensures a smooth, safe, and data-driven migration to AI-powered services. 🚀
