# Phase 5 Migration Strategy: Mock to Real AI Services
**Project**: VSCode Songwriting Assistant  
**Created**: 2025-11-17  
**Status**: Strategy Document - Implementation Pending  
**Migration Type**: Gradual Service-by-Service with Hybrid Mode  

---

## Executive Summary

### Recommended Approach: **Gradual Service-by-Service Migration with Shadow Mode**

This strategy migrates only the 3 AI-powered services (SongGeneration, CritiqueEngine, RevisionEngine) from mock to real Grok-4-fast-reasoning implementation, while keeping 7 heuristic services unchanged.

**Timeline**: 6-8 weeks  
**Risk Level**: Low  
**Estimated Cost**: $7-70/month (1K-10K users)  
**Rollback Capability**: Instant (single config toggle)  

### Key Decisions

1. **Migration Scope**: Only 3/10 services migrate to AI (30% of services, but 80% of value)
2. **Heuristic Services Stay Mock**: 7/10 services remain deterministic heuristics
3. **Hybrid Mode Support**: ServiceFactory supports mock|real|hybrid modes simultaneously
4. **Shadow Mode First**: Run real AI alongside mocks without showing to users for validation
5. **Gradual Rollout**: 0% → 10% → 25% → 50% → 100% over 2 weeks per service

---

## Table of Contents

1. [Migration Approach Comparison](#migration-approach-comparison)
2. [Service Classification & Migration Order](#service-classification--migration-order)
3. [Architecture Design](#architecture-design)
4. [Step-by-Step Migration Procedure](#step-by-step-migration-procedure)
5. [Rollback Playbook](#rollback-playbook)
6. [Testing Strategy](#testing-strategy)
7. [Monitoring & Observability](#monitoring--observability)
8. [Timeline & Milestones](#timeline--milestones)
9. [Risk Matrix & Mitigations](#risk-matrix--mitigations)
10. [Success Metrics](#success-metrics)

---

## Migration Approach Comparison

### Options Evaluated

| Approach | Pros | Cons | Risk Level | Recommended? |
|----------|------|------|------------|--------------|
| **A: Big Bang** | Simple, clean cutover | High risk, difficult rollback, no validation | 🔴 High | ❌ No |
| **B: Gradual Service-by-Service** | Low risk, easy rollback, incremental validation | Complex state management | 🟢 Low | ✅ **YES** |
| **C: Canary (User %)** | A/B testing, real validation | Requires feature flags, complex UX | 🟡 Medium | ⚠️ Phase 2 |
| **D: Shadow Mode** | Zero user impact, validates AI | Double cost during shadow | 🟢 Low | ✅ **YES (First)** |

### Selected Strategy: **Gradual Migration with Shadow Mode**

**Phase 1**: Shadow Mode (Weeks 1-2)
- Run real AI services alongside mocks
- Compare outputs, validate quality
- No user impact, pure validation
- Measure: latency, cost, quality

**Phase 2**: Canary Rollout (Weeks 3-4 per service)
- 0% → 10% → 25% → 50% → 75% → 100%
- Feature flag: `aiProvider: 'mock' | 'real' | 'hybrid'`
- Monitor: error rate, latency, cost, user feedback
- Instant rollback via config toggle

**Phase 3**: Full Migration (Week 8)
- All 3 AI services at 100% real
- 7 heuristic services unchanged
- Mocks kept as fallback for 1 month
- Final validation and monitoring

---

## Service Classification & Migration Order

### AI-Powered Services (Migrate to Real)

**Priority 1: SongGeneration** (Week 3-4)
- **Why First**: Core feature, high user value, no dependencies on other AI services
- **Risk**: Medium (user-facing, quality critical)
- **Dependencies**: InputValidation (stays heuristic)
- **Fallback**: MockSongGenerationService
- **Success Criteria**: Latency <3s, Quality score >0.85, Cost <$0.05/song

**Priority 2: CritiqueEngine** (Week 5-6)
- **Why Second**: Depends on SongGeneration being stable, quality gatekeeper
- **Risk**: High (complex analysis, 8 quality dimensions)
- **Dependencies**: RhymeAnalysis, SyllableCounting (stay heuristic), SongGeneration (now real)
- **Fallback**: MockCritiqueEngineService
- **Success Criteria**: Latency <2s, Accuracy >90%, Cost <$0.02/critique

**Priority 3: RevisionEngine** (Week 7-8)
- **Why Last**: Depends on both SongGeneration and CritiqueEngine, most complex
- **Risk**: Very High (iterative loop, quality improvement)
- **Dependencies**: SongGeneration (real), CritiqueEngine (real)
- **Fallback**: MockRevisionEngineService
- **Success Criteria**: Latency <3s, Quality improvement >15%, Cost <$0.08/revision

### Heuristic Services (Stay Mock - No Migration)

These services use deterministic algorithms and DO NOT migrate to AI:

1. **InputValidation** - Regex/validation (mock = real implementation)
2. **RhymeAnalysis** - Phonetic dictionary lookup (fast, accurate, free)
3. **SyllableCounting** - Vowel counting algorithm (deterministic)
4. **SunoFormatter** - Template-based formatting (no AI benefit)
5. **Export** - File I/O operations (no AI needed)
6. **History** - CRUD database operations (no AI needed)
7. **GeminiAudio** - Stays mock for now (P2 feature, low priority)

**Key Insight**: "Mock" for heuristics means "real heuristic implementation", not "fake". They're already production-ready!

---

## Architecture Design

### Service Factory Enhancement

```typescript
// Current (Phase 4):
export async function initializeServices(): Promise<Services> {
  return {
    inputValidation: new MockInputValidationService(),
    songGeneration: new MockSongGenerationService(),
    // ... all mocks
  }
}

// Target (Phase 5):
export async function initializeServices(mode?: ServiceMode): Promise<Services> {
  const config = getConfiguration()
  const serviceMode = mode ?? config.serviceMode ?? 'mock'
  
  // Create AI provider (only if real mode)
  const aiProvider = serviceMode === 'real' || serviceMode === 'hybrid'
    ? await createGrokProvider(config.grokApiKey)
    : new MockProvider()
  
  return {
    // Heuristics (always use "mock" = real heuristic)
    inputValidation: new MockInputValidationService(),
    rhymeAnalysis: new MockRhymeAnalysisService(),
    syllableCounting: new MockSyllableCountingService(),
    sunoFormatter: new MockSunoFormatterService(),
    export: new MockExportService(),
    history: new MockHistoryService(),
    geminiAudio: new MockAudioAnalysisService(),
    
    // AI Services (toggle between mock and real)
    songGeneration: serviceMode === 'real' || serviceMode === 'hybrid'
      ? new SongGenerationService(aiProvider)
      : new MockSongGenerationService(),
    
    critiqueEngine: serviceMode === 'real' || serviceMode === 'hybrid'
      ? new CritiqueEngineService(aiProvider)
      : new MockCritiqueEngineService(),
    
    revisionEngine: serviceMode === 'real' || serviceMode === 'hybrid'
      ? new RevisionEngineService(aiProvider)
      : new MockRevisionEngineService()
  }
}
```

### Configuration Schema

Add to `package.json` (VSCode settings):

```json
{
  "songwriting.serviceMode": {
    "type": "string",
    "enum": ["mock", "real", "hybrid", "shadow"],
    "default": "mock",
    "description": "Service implementation mode",
    "markdownEnumDescriptions": [
      "All services use mock implementations (fast, offline, free)",
      "AI services use real Grok API, heuristics stay mock",
      "Mix of real and mock based on feature flags",
      "Shadow mode: Run real alongside mock for validation"
    ]
  },
  "songwriting.grokApiKey": {
    "type": "string",
    "default": "",
    "markdownDescription": "API key for Grok-4-fast-reasoning. Get one at https://x.ai",
    "scope": "machine-overridable"
  },
  "songwriting.aiServiceRollout": {
    "type": "object",
    "default": {
      "songGeneration": 100,
      "critiqueEngine": 100,
      "revisionEngine": 100
    },
    "description": "Percentage rollout for each AI service (0-100)"
  }
}
```

### Shadow Mode Implementation

```typescript
/**
 * Shadow mode: Run both mock and real, compare results
 */
export class ShadowSongGenerationService implements ISongGenerationService {
  constructor(
    private readonly mockService: MockSongGenerationService,
    private readonly realService: SongGenerationService,
    private readonly logger: ShadowLogger
  ) {}
  
  async generate(input: GenerateSongInput, options?: GenerationOptions): Promise<ServiceResponse<GenerateSongOutput>> {
    // Run both in parallel
    const [mockResult, realResult] = await Promise.allSettled([
      this.mockService.generate(input, options),
      this.realService.generate(input, options)
    ])
    
    // Log comparison metrics
    await this.logger.logComparison({
      service: 'songGeneration',
      mockLatency: mockResult.status === 'fulfilled' ? mockResult.value.latency : null,
      realLatency: realResult.status === 'fulfilled' ? realResult.value.latency : null,
      mockQuality: mockResult.status === 'fulfilled' ? mockResult.value.data.confidence : null,
      realQuality: realResult.status === 'fulfilled' ? realResult.value.data.confidence : null,
      realCost: realResult.status === 'fulfilled' ? estimateCost(realResult.value.data.tokensUsed) : null,
      realErrors: realResult.status === 'rejected' ? realResult.reason : null
    })
    
    // Return mock result to user (shadow mode = no user impact)
    return mockResult.status === 'fulfilled' 
      ? mockResult.value 
      : createFailure(createError('SHADOW_MODE_MOCK_FAILED', 'Mock failed in shadow mode'))
  }
}
```

---

## Step-by-Step Migration Procedure

### Service Migration Template

For each AI service (SongGeneration, CritiqueEngine, RevisionEngine), follow this procedure:

#### Step 1: Build Real Service (Week 1)

```bash
# Create real service implementation
src/services/real/SongGenerationService.ts  # Implements ISongGenerationService

# Checklist:
- [ ] Service implements interface exactly (contract compliance)
- [ ] All methods match contract signatures
- [ ] Uses IModelProvider abstraction (not hardcoded to Grok)
- [ ] Proper error handling (ServiceResponse pattern)
- [ ] TypeScript 0 errors
- [ ] No 'any' types
```

**Code Review Checklist**:
- ✅ Contract compliance (all methods implemented)
- ✅ Error handling (ServiceResponse, no throws)
- ✅ Type safety (no 'any' types)
- ✅ Logging (debug logs for all operations)
- ✅ Cost tracking (log tokens used)
- ✅ Timeout handling (30s max)

#### Step 2: Integration Tests (Week 1)

```bash
# Create integration test suite
tests/integration/SongGeneration.integration.test.ts

# Run with live Grok API
GROK_API_KEY=xxx npm test -- SongGeneration.integration.test.ts

# Checklist:
- [ ] Tests pass with live AI (95%+ pass rate)
- [ ] Latency within targets (<3s for generation)
- [ ] Quality meets expectations (confidence >0.85)
- [ ] Cost within budget (<$0.05 per call)
- [ ] Error handling works (timeout, API failure)
```

**Integration Test Template**:
```typescript
describe('SongGenerationService Integration (Live Grok)', () => {
  let service: SongGenerationService
  let provider: GrokProvider
  
  beforeAll(() => {
    const apiKey = process.env.GROK_API_KEY
    if (!apiKey) throw new Error('GROK_API_KEY required for integration tests')
    
    provider = new GrokProvider({ apiKey })
    service = new SongGenerationService(provider)
  })
  
  it('should generate song from prompt', async () => {
    const result = await service.generate(validInput)
    
    expect(result.success).toBe(true)
    expect(result.data.song.verses.length).toBeGreaterThan(0)
    expect(result.data.confidence).toBeGreaterThan(0.85)
    expect(result.data.tokensUsed).toBeLessThan(4000)
  }, 30000) // 30s timeout
  
  // 10+ tests covering happy path, edge cases, errors
})
```

#### Step 3: Shadow Mode (Week 2)

```bash
# Deploy shadow mode to internal testing
"songwriting.serviceMode": "shadow"

# Run for 48 hours, monitor:
- Mock vs Real latency comparison
- Mock vs Real quality comparison  
- Real service error rate
- Real service cost accumulation
- Any quality regressions

# Validation gates:
- [ ] Real latency <5s (P95)
- [ ] Real error rate <5%
- [ ] Real cost <$0.10 per operation
- [ ] Quality score delta <10% (mock vs real)
```

**Shadow Mode Dashboard** (logs to console/file):
```
=== Shadow Mode Report: SongGeneration ===
Duration: 48 hours
Total Requests: 1,247

Mock Service:
  Avg Latency: 127ms
  P95 Latency: 245ms
  Error Rate: 0.1%
  Cost: $0.00

Real Service (Grok):
  Avg Latency: 2,341ms
  P95 Latency: 4,782ms
  Error Rate: 2.3%
  Cost: $3.47
  
Quality Comparison:
  Mock Confidence: 0.87 (avg)
  Real Confidence: 0.91 (avg)
  Delta: +4.6% (real is better)
  
Recommendation: ✅ PROCEED TO CANARY (all gates passed)
```

#### Step 4: Canary Rollout (Week 3-4)

**Day 1-2: 10% Rollout**
```json
{
  "songwriting.serviceMode": "hybrid",
  "songwriting.aiServiceRollout": {
    "songGeneration": 10,  // 10% of users get real AI
    "critiqueEngine": 0,
    "revisionEngine": 0
  }
}
```

**Monitoring (24 hours)**:
- Error rate: Target <1%, Rollback if >3%
- Latency: Target P95 <5s, Rollback if >10s
- Cost: Target <$0.10/call, Alert if >$0.20
- User feedback: No critical bugs reported

**Day 3-4: 25% Rollout** (if 10% successful)
```json
{ "songGeneration": 25 }
```

**Day 5-7: 50% Rollout** (if 25% successful)
```json
{ "songGeneration": 50 }
```

**Day 8-10: 75% Rollout** (if 50% successful)
```json
{ "songGeneration": 75 }
```

**Day 11-14: 100% Rollout** (if 75% successful)
```json
{ "songGeneration": 100 }
```

**Automated Rollout Script**:
```typescript
async function gradualRollout(service: string, schedule: number[]) {
  for (const percentage of schedule) {
    console.log(`Rolling out ${service} to ${percentage}%`)
    
    // Update config
    await updateConfiguration(`aiServiceRollout.${service}`, percentage)
    
    // Monitor for 24 hours
    const metrics = await monitorFor24Hours(service)
    
    // Check gates
    if (metrics.errorRate > 0.03) {
      console.error(`❌ Rollback triggered: error rate ${metrics.errorRate}`)
      await rollback(service)
      return
    }
    
    if (metrics.p95Latency > 10000) {
      console.error(`❌ Rollback triggered: latency ${metrics.p95Latency}ms`)
      await rollback(service)
      return
    }
    
    console.log(`✅ ${percentage}% successful, proceeding...`)
  }
  
  console.log(`🎉 ${service} fully migrated to real AI!`)
}

// Run migration
await gradualRollout('songGeneration', [10, 25, 50, 75, 100])
```

#### Step 5: Validation & Stabilization (Week 4)

```bash
# Full migration validation
- [ ] 100% of users on real AI
- [ ] Error rate <1% for 7 days
- [ ] Latency P95 <5s for 7 days
- [ ] Cost within budget for 7 days
- [ ] No critical user feedback
- [ ] Mock still available as fallback
```

#### Step 6: Mock Deprecation (Week 8+)

```bash
# After 1 month of stable real service:
- [ ] Archive mock service (don't delete, keep as reference)
- [ ] Update docs to indicate real service as default
- [ ] Remove mock from factory (optional, keep for offline dev)
```

---

## Rollback Playbook

### Automated Rollback Triggers

**Trigger Conditions** (automatically rollback if ANY condition met):

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error Rate | >3% for 10 minutes | Instant rollback to mock |
| P95 Latency | >10s for 10 minutes | Instant rollback to mock |
| P99 Latency | >30s for 5 minutes | Instant rollback to mock |
| Cost | >$1.00 per user per day | Pause rollout, alert admin |
| API Availability | <95% for 5 minutes | Instant rollback to mock |

### Manual Rollback Procedure

**One-Click Rollback** (instant):

```typescript
// In VSCode command palette:
> Songwriter: Emergency Rollback to Mock Services

// Or configuration change:
{
  "songwriting.serviceMode": "mock"  // Instant switch
}

// Or CLI:
vscode-settings set songwriting.serviceMode mock
```

**Rollback Steps**:

1. **Immediate** (0-5 minutes):
   - Change config to `serviceMode: "mock"`
   - Restart extension (automatic)
   - All users now on mock services
   - Zero downtime (config hot-reload)

2. **Investigation** (5-60 minutes):
   - Analyze logs for root cause
   - Check Grok API status
   - Review recent code changes
   - Identify failure pattern

3. **Communication** (within 1 hour):
   - Update status page
   - Notify users if impacted
   - Post incident report

4. **Resolution** (hours-days):
   - Fix underlying issue
   - Re-test in shadow mode
   - Restart gradual rollout

### Rollback Communication Templates

**User Notification** (if user-impacting):
```
Songwriting Assistant Update

We temporarily switched to offline mode due to a service issue. 
Your extension continues to work normally with our fallback system.

The AI-powered features will return shortly. No action needed.

- The Songwriting Assistant Team
```

**Incident Report** (internal):
```
Incident: SongGeneration Real Service Rollback
Date: 2025-XX-XX
Duration: 15 minutes
Impact: 50% of users (canary rollout)

Root Cause: Grok API 503 errors (>10% error rate)
Trigger: Automated rollback (error rate >3%)
Resolution: Rolled back to mock, Grok resolved issue in 1 hour

Action Items:
- [ ] Add multi-provider fallback (Grok → Claude → GPT-4)
- [ ] Improve error handling for API timeouts
- [ ] Add circuit breaker pattern
```

---

## Testing Strategy

### Test Pyramid (Per Service)

```
        /\
       /  \
      / E2E \  (5 tests - Full user flows)
     /--------\
    /  Integ.  \  (20 tests - Live API)
   /------------\
  /   Contract   \  (100+ tests - Mock)
 /----------------\
```

### Test Types

#### 1. Contract Tests (Already Complete - 737 tests)
- ✅ All 737 tests passing with mocks
- ✅ 100% contract compliance
- ✅ Fast (<5s total runtime)
- ✅ Offline-capable
- **Purpose**: Ensure mocks match contracts (already done in Phase 3)

#### 2. Integration Tests (New - Per Real Service)

```typescript
// tests/integration/SongGeneration.integration.test.ts
describe('SongGeneration Integration (Live Grok)', () => {
  // Setup
  let service: SongGenerationService
  let provider: GrokProvider
  
  beforeAll(() => {
    provider = new GrokProvider({ apiKey: process.env.GROK_API_KEY! })
    service = new SongGenerationService(provider)
  })
  
  // Contract compliance
  it('should match ISongGenerationService contract', async () => {
    const result = await service.generate(validInput)
    expect(result).toHaveProperty('success')
    expect(result).toHaveProperty('data')
    // ... validate all contract fields
  })
  
  // Performance
  it('should complete within 5 seconds', async () => {
    const start = Date.now()
    await service.generate(validInput)
    const duration = Date.now() - start
    expect(duration).toBeLessThan(5000)
  })
  
  // Quality
  it('should generate high-quality song', async () => {
    const result = await service.generate(validInput)
    expect(result.data.confidence).toBeGreaterThan(0.85)
    expect(result.data.song.verses.length).toBeGreaterThan(0)
  })
  
  // Cost
  it('should stay within cost budget', async () => {
    const result = await service.generate(validInput)
    const cost = estimateCost(result.data.tokensUsed)
    expect(cost).toBeLessThan(0.10) // $0.10 max
  })
  
  // Error handling
  it('should handle API timeout gracefully', async () => {
    const slowProvider = new GrokProvider({ apiKey: 'xxx', timeout: 100 })
    const slowService = new SongGenerationService(slowProvider)
    
    const result = await slowService.generate(validInput)
    expect(result.success).toBe(false)
    expect(result.error.code).toBe('TIMEOUT')
  })
  
  // 15+ more tests...
})
```

**Integration Test Checklist (Per Service)**:
- [ ] Contract compliance (all fields present)
- [ ] Happy path (valid input → valid output)
- [ ] Edge cases (max length, special chars, etc.)
- [ ] Error handling (timeout, API failure, invalid response)
- [ ] Performance (latency <5s P95)
- [ ] Quality (confidence >0.85 avg)
- [ ] Cost (within budget <$0.10/call)
- [ ] Retry logic (recovers from transient failures)
- [ ] Concurrent requests (handles 10 parallel)
- [ ] Large inputs (3000 char prompts)

#### 3. Shadow Mode Tests (Automated Comparison)

```typescript
// tests/shadow/SongGeneration.shadow.test.ts
describe('SongGeneration Shadow Mode', () => {
  it('should log comprehensive comparison metrics', async () => {
    const shadowService = new ShadowSongGenerationService(mock, real, logger)
    
    await shadowService.generate(validInput)
    
    // Verify logger captured metrics
    expect(logger.getLastLog()).toMatchObject({
      service: 'songGeneration',
      mockLatency: expect.any(Number),
      realLatency: expect.any(Number),
      mockQuality: expect.any(Number),
      realQuality: expect.any(Number),
      realCost: expect.any(Number)
    })
  })
  
  it('should return mock result to user', async () => {
    const result = await shadowService.generate(validInput)
    
    // Verify user gets mock result (shadow = no user impact)
    expect(result.data.modelUsed).toBe('mock')
  })
})
```

#### 4. End-to-End Tests (Critical User Flows)

```typescript
// tests/e2e/songwriting.e2e.test.ts
describe('Songwriting E2E (Real Services)', () => {
  it('should complete full song generation flow', async () => {
    // 1. Validate input
    const validation = await services.inputValidation.validate(rawInput)
    expect(validation.success).toBe(true)
    
    // 2. Generate song
    const generation = await services.songGeneration.generate(validation.data.validatedPrompt)
    expect(generation.success).toBe(true)
    
    // 3. Critique song
    const critique = await services.critiqueEngine.analyzeSong(generation.data.song)
    expect(critique.success).toBe(true)
    
    // 4. If not gold standard, revise
    if (!critique.data.passesGoldStandard) {
      const revision = await services.revisionEngine.reviseSong({
        song: generation.data.song,
        critique: critique.data,
        strategy: 'moderate'
      })
      expect(revision.success).toBe(true)
      expect(revision.data.improvementMetrics.overallImprovement).toBeGreaterThan(0)
    }
    
    // 5. Format for Suno
    const formatted = await services.sunoFormatter.formatSong(finalSong, 'v5.0')
    expect(formatted.success).toBe(true)
    
    // Full flow completed successfully!
  }, 60000) // 60s timeout for full flow
})
```

### Testing Timeline

| Week | Test Type | Coverage | Environment |
|------|-----------|----------|-------------|
| 1 | Integration Tests | 95%+ | Local + CI |
| 2 | Shadow Mode | 100 requests | Staging |
| 3 | Canary (10%) | Real users | Production |
| 4 | Canary (100%) | All users | Production |
| 5 | E2E Tests | Critical flows | Production |

---

## Monitoring & Observability

### Metrics to Track

#### Service Health Metrics

```typescript
interface ServiceMetrics {
  // Performance
  readonly latencyP50: number  // Median latency (ms)
  readonly latencyP95: number  // 95th percentile (ms)
  readonly latencyP99: number  // 99th percentile (ms)
  
  // Reliability
  readonly successRate: number      // % of successful requests
  readonly errorRate: number        // % of failed requests
  readonly timeoutRate: number      // % of timeout errors
  
  // Cost
  readonly totalTokensUsed: number  // Tokens consumed
  readonly totalCost: number        // USD spent
  readonly avgCostPerRequest: number
  
  // Quality
  readonly avgConfidence: number    // Average quality score
  readonly lowQualityRate: number   // % of low-confidence results
  
  // Volume
  readonly totalRequests: number
  readonly requestsPerMinute: number
}
```

#### Dashboard (VSCode Output Panel)

```
=== Songwriting Assistant: Service Metrics (Last 1 hour) ===

SongGeneration (Real):
  Requests:    127 total (2.1/min)
  Success:     98.4% (125/127)
  Latency:     P50: 1.8s | P95: 3.2s | P99: 5.1s
  Quality:     Avg Confidence: 0.89
  Cost:        $0.42 total ($0.0033/request)
  Errors:      2 timeouts, 0 API failures

CritiqueEngine (Mock):
  Requests:    89 total (1.5/min)
  Success:     100% (89/89)
  Latency:     P50: 45ms | P95: 78ms | P99: 102ms
  Quality:     Avg Score: 0.82
  Cost:        $0.00 (heuristic)
  Errors:      0

RevisionEngine (Mock):
  Requests:    34 total (0.6/min)
  Success:     100% (34/34)
  Latency:     P50: 67ms | P95: 123ms | P99: 189ms
  Quality:     Avg Improvement: +12.3%
  Cost:        $0.00 (heuristic)
  Errors:      0

=== Alerts ===
⚠️  SongGeneration P95 latency: 3.2s (target: <3s, yellow zone)
✅  All other metrics within targets
```

### Logging Strategy

```typescript
// Debug logs (if debugMode enabled)
export function logServiceCall(service: string, method: string, duration: number, success: boolean) {
  if (!getConfiguration().debugMode) return
  
  console.log(`[${service}] ${method} - ${duration}ms - ${success ? 'OK' : 'FAIL'}`)
}

// Telemetry (if enableTelemetry enabled, anonymous)
export async function logTelemetry(event: TelemetryEvent) {
  const config = getConfiguration()
  if (!config.enableTelemetry) return
  
  // Log to local file or analytics service (no PII)
  await telemetryService.log({
    event: event.name,
    service: event.service,
    duration: event.duration,
    success: event.success,
    timestamp: new Date().toISOString()
    // NO user data, NO prompts, NO API keys
  })
}
```

### Alerting (For Rollback)

```typescript
// Automated monitoring (runs every 1 minute)
export async function checkServiceHealth() {
  const metrics = await getMetrics('songGeneration', '10m')
  
  // Check error rate
  if (metrics.errorRate > 0.03) {
    await triggerRollback('songGeneration', 'ERROR_RATE_HIGH', metrics.errorRate)
    return
  }
  
  // Check latency
  if (metrics.latencyP95 > 10000) {
    await triggerRollback('songGeneration', 'LATENCY_HIGH', metrics.latencyP95)
    return
  }
  
  // Check cost
  if (metrics.avgCostPerRequest > 0.20) {
    await alertAdmin('COST_HIGH', metrics.avgCostPerRequest)
    // Don't auto-rollback on cost, just alert
  }
}

setInterval(checkServiceHealth, 60000) // Check every minute
```

---

## Timeline & Milestones

### Detailed 8-Week Schedule

#### Week 1: Infrastructure (GrokProvider, Monitoring)
- **Day 1-2**: Create `GrokProvider.ts` (IModelProvider implementation)
  - [ ] API integration (fetch + retry logic)
  - [ ] Error handling (timeout, rate limit, API errors)
  - [ ] Cost estimation
  - [ ] Health check endpoint
- **Day 3-4**: Create `MockProvider.ts` (heuristic provider)
  - [ ] Match IModelProvider interface
  - [ ] Deterministic responses
  - [ ] Zero API calls
- **Day 5**: Implement monitoring/telemetry
  - [ ] Metrics collection
  - [ ] Dashboard (VSCode Output)
  - [ ] Alerting hooks
- **Deliverable**: ✅ Provider infrastructure ready

#### Week 2: SongGeneration (Shadow Mode)
- **Day 1-3**: Implement `RealSongGenerationService.ts`
  - [ ] Contract compliance
  - [ ] Integration tests (20+ tests)
  - [ ] 0 TypeScript errors
- **Day 4-5**: Shadow mode deployment
  - [ ] Run 100 requests
  - [ ] Log comparisons
  - [ ] Validate metrics
- **Day 6-7**: Analysis & validation gates
  - [ ] Latency <5s ✅
  - [ ] Error rate <5% ✅
  - [ ] Cost <$0.10 ✅
- **Deliverable**: ✅ SongGeneration ready for canary

#### Week 3-4: SongGeneration (Canary Rollout)
- **Week 3 Day 1-2**: 10% rollout
  - Monitor 24h, validate gates
- **Week 3 Day 3-4**: 25% rollout
  - Monitor 24h, validate gates
- **Week 3 Day 5-7**: 50% rollout
  - Monitor 48h, validate gates
- **Week 4 Day 1-3**: 75% rollout
  - Monitor 48h, validate gates
- **Week 4 Day 4-7**: 100% rollout
  - Monitor 72h, final validation
- **Deliverable**: ✅ SongGeneration 100% migrated

#### Week 5: CritiqueEngine (Shadow + Canary)
- **Day 1-3**: Implement `RealCritiqueEngineService.ts`
  - [ ] 8 quality dimensions (complex!)
  - [ ] Integration tests
  - [ ] Shadow mode (48h)
- **Day 4-7**: Canary rollout (10% → 100%)
  - Faster than SongGeneration (proven process)
- **Deliverable**: ✅ CritiqueEngine 100% migrated

#### Week 6: RevisionEngine (Shadow + Canary)
- **Day 1-3**: Implement `RealRevisionEngineService.ts`
  - [ ] Iterative improvement loop
  - [ ] Voice preservation
  - [ ] Integration tests
  - [ ] Shadow mode (48h)
- **Day 4-7**: Canary rollout (10% → 100%)
- **Deliverable**: ✅ RevisionEngine 100% migrated

#### Week 7: Stabilization & Optimization
- **Day 1-3**: Performance tuning
  - [ ] Optimize prompts for speed
  - [ ] Add caching layer
  - [ ] Batch API calls where possible
- **Day 4-5**: Cost optimization
  - [ ] Review token usage
  - [ ] Adjust temperature for analysis tasks
  - [ ] Implement aggressive caching
- **Day 6-7**: Documentation
  - [ ] Update README with migration notes
  - [ ] Migration success report
  - [ ] Lessons learned document
- **Deliverable**: ✅ All services optimized

#### Week 8: Validation & Cleanup
- **Day 1-3**: Full E2E testing
  - [ ] 100+ real user flows
  - [ ] No critical bugs
  - [ ] Performance within SLA
- **Day 4-5**: Mock deprecation planning
  - [ ] Archive mock services
  - [ ] Update factory
  - [ ] Keep offline dev mode
- **Day 6-7**: Final release
  - [ ] Update version to 1.0.0
  - [ ] Publish release notes
  - [ ] Celebrate! 🎉
- **Deliverable**: ✅ Phase 5 COMPLETE

---

## Risk Matrix & Mitigations

### Top 10 Risks

| # | Risk | Probability | Impact | Severity | Mitigation |
|---|------|-------------|--------|----------|------------|
| 1 | **Grok API Downtime** | Medium | High | 🔴 Critical | Multi-provider fallback (Grok→Claude→GPT-4), instant rollback to mock |
| 2 | **Cost Exceeds Budget** | Low | High | 🟡 High | Cost caps ($100/day), alerts at $50, rollout pause |
| 3 | **Real Service Slower Than Mocks** | High | Medium | 🟡 High | Loading indicators, async processing, 5s timeout |
| 4 | **Quality Worse Than Expected** | Medium | High | 🔴 Critical | Shadow mode validation, quality gates (>0.85), rollback triggers |
| 5 | **User Feedback Negative** | Low | High | 🟡 High | Feature flag (opt-out to mock), feedback collection, rapid iteration |
| 6 | **Integration Test Flakiness** | High | Low | 🟢 Low | Retry logic (3x), longer timeouts (30s), skip on CI |
| 7 | **API Key Leakage** | Low | Critical | 🔴 Critical | Secure storage (VSCode secrets), .env in .gitignore, key rotation |
| 8 | **Contract Violation by AI** | Medium | Medium | 🟡 High | Schema validation, fallback to mock, retry with stricter prompt |
| 9 | **Rollback Doesn't Work** | Very Low | Critical | 🔴 Critical | Rollback testing in staging, hot-reload config, 24/7 monitoring |
| 10 | **Mock Services Break** | Very Low | High | 🟡 High | Keep 737 tests passing, no changes to mocks during migration |

### Detailed Mitigations

#### Risk 1: Grok API Downtime
**Scenario**: Grok API goes down (503, 504 errors) during production use.

**Mitigation Strategy**:
1. **Circuit Breaker Pattern**:
   ```typescript
   class CircuitBreaker {
     private failureCount = 0
     private state: 'closed' | 'open' | 'half-open' = 'closed'
     
     async execute<T>(fn: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
       if (this.state === 'open') {
         return fallback() // Use mock immediately
       }
       
       try {
         const result = await fn()
         this.failureCount = 0
         return result
       } catch (error) {
         this.failureCount++
         
         if (this.failureCount > 3) {
           this.state = 'open' // Open circuit, use fallback
           setTimeout(() => this.state = 'half-open', 60000) // Retry after 1min
         }
         
         return fallback()
       }
     }
   }
   ```

2. **Multi-Provider Fallback**:
   ```typescript
   async generate(input: GenerateSongInput): Promise<ServiceResponse<GenerateSongOutput>> {
     // Try Grok first
     const grokResult = await this.grokProvider.generate(...)
     if (grokResult.success) return grokResult
     
     // Fallback to Claude
     const claudeResult = await this.claudeProvider.generate(...)
     if (claudeResult.success) return claudeResult
     
     // Fallback to mock
     return this.mockProvider.generate(...)
   }
   ```

3. **Automated Rollback**:
   - If error rate >5% for 5 minutes → instant rollback to mock
   - Alert admin immediately
   - Check Grok status page

#### Risk 2: Cost Exceeds Budget
**Scenario**: Viral usage causes $1000/day bill instead of $10/day.

**Mitigation Strategy**:
1. **Hard Cost Caps**:
   ```typescript
   class CostTracker {
     private dailyCost = 0
     private readonly maxDailyCost = 100 // $100/day hard cap
     
     async trackCost(tokens: number): Promise<boolean> {
       const cost = estimateCost(tokens)
       
       if (this.dailyCost + cost > this.maxDailyCost) {
         // Exceeded budget!
         await this.alertAdmin('BUDGET_EXCEEDED', this.dailyCost)
         await this.rollbackToMock()
         return false
       }
       
       this.dailyCost += cost
       return true
     }
   }
   ```

2. **Progressive Alerts**:
   - $25: Warning (25% of budget)
   - $50: Alert admin (50%)
   - $75: Pause rollout (75%)
   - $100: Auto-rollback (100%)

3. **User Quotas**:
   - Free tier: 10 songs/day
   - Paid tier: unlimited (if monetizing)

#### Risk 3: Latency Too High
**Scenario**: Real service takes 10s instead of 3s, users frustrated.

**Mitigation Strategy**:
1. **Loading Indicators**:
   ```typescript
   // Show progress to user
   vscode.window.withProgress({
     location: vscode.ProgressLocation.Notification,
     title: "Generating song with AI...",
     cancellable: true
   }, async (progress) => {
     progress.report({ increment: 0, message: "Analyzing prompt..." })
     
     const result = await service.generate(input)
     
     progress.report({ increment: 100, message: "Complete!" })
     return result
   })
   ```

2. **Aggressive Timeouts**:
   - Generation: 5s timeout → fallback to mock
   - Critique: 3s timeout → fallback to mock
   - Revision: 5s timeout → fallback to mock

3. **Async Processing** (future):
   - Queue requests, process in background
   - Notify user when ready
   - "Your song is being generated, we'll notify you in ~30s"

---

## Success Metrics

### Migration Complete When:

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| **Services Migrated** | 3/10 AI services | _/3 | ⏳ |
| **Heuristic Services** | 7/10 unchanged | 7/7 | ✅ |
| **Tests Passing** | 737/737 (100%) | _/737 | ⏳ |
| **Integration Tests** | 95%+ pass rate | _% | ⏳ |
| **TypeScript Errors** | 0 | _ | ⏳ |
| **Error Rate (Production)** | <1% | _% | ⏳ |
| **Latency P95** | <5s | _s | ⏳ |
| **Cost Per User** | <$0.10/day | $_ | ⏳ |
| **User Satisfaction** | >90% positive | _% | ⏳ |
| **Rollback Capability** | 1-click working | _ | ⏳ |

### Key Performance Indicators (KPIs)

**Service Performance**:
- SongGeneration: P95 latency <3s, quality >0.85, cost <$0.05
- CritiqueEngine: P95 latency <2s, accuracy >90%, cost <$0.02
- RevisionEngine: P95 latency <3s, improvement >15%, cost <$0.08

**Business Metrics**:
- User retention: >80% (users continue using after migration)
- Feature usage: >50% use AI features weekly
- Support tickets: <5% increase (migration should be transparent)

**Technical Metrics**:
- Zero downtime migrations
- Zero data loss
- Zero breaking changes
- Rollback time: <5 minutes

---

## Appendix

### A. Service Dependency Graph

```
              ┌─────────────────┐
              │ InputValidation │ (Heuristic - No Migration)
              └────────┬────────┘
                       │
                       ▼
┌──────────────┐  ┌───────────────────┐
│ RhymeAnalysis│  │ SongGeneration    │ ◀─── MIGRATE (Week 2-4)
│ (Heuristic)  │  │ (AI - PRIORITY 1) │
└──────┬───────┘  └─────────┬─────────┘
       │                    │
       │  ┌─────────────────┘
       │  │
       ▼  ▼
┌─────────────────┐
│ CritiqueEngine  │ ◀─── MIGRATE (Week 5)
│ (AI - PRIORITY 2)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ RevisionEngine  │ ◀─── MIGRATE (Week 6)
│ (AI - PRIORITY 3)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ SunoFormatter   │ (Heuristic - No Migration)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Export          │ (Heuristic - No Migration)
└─────────────────┘

(History service monitors all → No migration)
```

### B. Configuration Examples

**Development (Offline)**:
```json
{
  "songwriting.serviceMode": "mock",
  "songwriting.debugMode": true
}
```

**Shadow Mode (Validation)**:
```json
{
  "songwriting.serviceMode": "shadow",
  "songwriting.grokApiKey": "${env:GROK_API_KEY}",
  "songwriting.enableTelemetry": true
}
```

**Canary Rollout (10%)**:
```json
{
  "songwriting.serviceMode": "hybrid",
  "songwriting.aiServiceRollout": {
    "songGeneration": 10,
    "critiqueEngine": 0,
    "revisionEngine": 0
  }
}
```

**Production (100%)**:
```json
{
  "songwriting.serviceMode": "real",
  "songwriting.grokApiKey": "${env:GROK_API_KEY}",
  "songwriting.enableTelemetry": true
}
```

### C. Cost Estimation

**Assumptions**:
- Grok-4-fast-reasoning: $0.10 per 1M tokens (estimate)
- Average song generation: 2,000 tokens
- Average critique: 1,000 tokens
- Average revision: 2,500 tokens

**User Profile** (Heavy User):
- 10 songs/day
- 3 critiques per song = 30 critiques/day
- 1 revision per song = 10 revisions/day

**Daily Cost Per Heavy User**:
```
Songs:     10 × 2,000 tokens = 20,000 tokens = $0.002
Critiques: 30 × 1,000 tokens = 30,000 tokens = $0.003
Revisions: 10 × 2,500 tokens = 25,000 tokens = $0.0025
----------------------------------------------------
Total:                         75,000 tokens = $0.0075/day
```

**Monthly Cost Per Heavy User**: $0.0075 × 30 = $0.225/month

**At Scale**:
- 1,000 heavy users: $225/month
- 10,000 heavy users: $2,250/month
- 100,000 heavy users: $22,500/month

**Most users are light** (2 songs/day, 6 critiques, 2 revisions):
- Light user: $0.0025/day = $0.075/month
- 10,000 light users: $750/month

**Optimization Strategies**:
- Caching (50% cache hit rate): -50% cost
- Batching critiques: -30% cost
- Lower temperature for analysis: -10% cost
- **Optimized cost**: $525/month for 10,000 light users

---

## Summary

This migration strategy provides a **low-risk, high-confidence path** to transitioning from mock to real AI services. Key highlights:

✅ **Only 3/10 services migrate** (SongGeneration, CritiqueEngine, RevisionEngine)  
✅ **7/10 services stay heuristic** (already production-ready)  
✅ **Shadow mode validation** before user impact  
✅ **Gradual rollout** with automated rollback  
✅ **Comprehensive monitoring** and alerting  
✅ **Cost controls** and optimization  
✅ **Zero downtime** migrations  
✅ **8-week timeline** with clear milestones  

**Next Step**: Begin Week 1 implementation (GrokProvider infrastructure).

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-17  
**Status**: Ready for Implementation  
**Approval**: Pending
