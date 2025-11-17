# Integration Tests - Complete Documentation

## Overview

This directory contains comprehensive integration tests for all 10 real AI services in the VSCode Songwriting Assistant project. These tests validate AI-powered services against contracts, quality standards, and behavioral expectations.

**Total Test Count**: 205 integration tests
**Test Coverage**: 4 AI-powered services + 1 provider
**Execution Time**: ~30-60 minutes (full suite)
**Frequency**: On-demand, pre-release, weekly (golden set)

## Test Structure

```
tests/
├── integration/
│   ├── setup.ts                          # Test configuration
│   ├── providers/
│   │   └── GrokProvider.integration.test.ts       # 30 tests
│   ├── real-services/
│   │   ├── RealSongGenerationService.integration.test.ts    # 60 tests
│   │   ├── RealCritiqueEngineService.integration.test.ts    # 45 tests
│   │   ├── RealRevisionEngineService.integration.test.ts    # 40 tests
│   │   └── RealAudioAnalysisService.integration.test.ts     # 30 tests
│   └── golden-set/
│       ├── golden-test-cases.json                 # 50 curated cases
│       └── golden-set.test.ts                     # Golden set runner
├── helpers/
│   ├── test-builders.ts                  # Test data builders
│   └── assertion-helpers.ts              # Custom assertions
└── jest.config.integration.js            # Integration test config
```

## Test Categories

### 1. Provider Tests (GrokProvider)
**File**: `tests/integration/providers/GrokProvider.integration.test.ts`
**Test Count**: 30 tests
**Purpose**: Validate Grok API integration

**Categories**:
- API Connectivity (5 tests)
- Generation Method (8 tests)
- Analysis Method (5 tests)
- Retry Logic (3 tests)
- Caching (4 tests)
- Cost Tracking (3 tests)
- Error Handling (2 tests)

### 2. Service Tests

#### SongGeneration (60 tests)
**File**: `tests/integration/real-services/RealSongGenerationService.integration.test.ts`

**Categories**:
- Contract Compliance (20 tests): Validates response structure
- Behavioral Tests (15 tests): Validates ranges and patterns
- Quality Thresholds (10 tests): Ensures minimum quality
- Semantic Tests (5 tests): Validates relevance
- Edge Cases (10 tests): Handles unusual inputs

**Key Validations**:
- ✅ Response structure matches contract
- ✅ Verse count within constraints (±1 variance)
- ✅ Lines per verse reasonable (2-8 lines)
- ✅ Has at least one chorus
- ✅ Rhyme schemes valid (ABAB, AABB, etc.)
- ✅ Lyrics coherent (no gibberish)
- ✅ Latency within SLA (P95 < 30s)
- ✅ Token usage < 4000

#### CritiqueEngine (45 tests)
**File**: `tests/integration/real-services/RealCritiqueEngineService.integration.test.ts`

**Categories**:
- Contract Compliance (15 tests)
- Behavioral Tests (12 tests)
- Quality Threshold Tests (8 tests)
- Semantic Tests (5 tests)
- Edge Cases (5 tests)

**Key Validations**:
- ✅ All 8 quality scores present (0-100 range)
- ✅ Issues array with proper structure
- ✅ Suggestions actionable and specific
- ✅ Score variance realistic (not all 100s)
- ✅ Latency within SLA (P95 < 10s)

#### RevisionEngine (40 tests)
**File**: `tests/integration/real-services/RealRevisionEngineService.integration.test.ts`

**Categories**:
- Contract Compliance (12 tests)
- Behavioral Tests (10 tests)
- Quality Threshold Tests (8 tests)
- Semantic Tests (5 tests)
- Edge Cases (5 tests)

**Key Validations**:
- ✅ Quality improvement (score delta ≥ -5)
- ✅ Addresses targeted issues
- ✅ Preserves unaffected sections (≥80% similarity)
- ✅ Maintains structure (verse/chorus count)
- ✅ Latency within SLA (P95 < 30s)

#### AudioAnalysis (30 tests)
**File**: `tests/integration/real-services/RealAudioAnalysisService.integration.test.ts`

**Categories**:
- Contract Compliance (10 tests)
- Behavioral Tests (8 tests)
- Quality Threshold Tests (5 tests)
- Semantic Tests (4 tests)
- Edge Cases (3 tests)

**Key Validations**:
- ✅ Rhythm analysis present
- ✅ Emotion detection (≥1 emotion)
- ✅ Tempo/key detection (valid values)
- ✅ BPM reasonable (60-180)
- ✅ Latency within SLA (P95 < 30s)

### 3. Golden Test Set
**Files**:
- `tests/integration/golden-set/golden-test-cases.json` (50 cases)
- `tests/integration/golden-set/golden-set.test.ts`

**Purpose**: Continuous quality validation to detect AI model drift

**Test Cases**:
- Common Genres (20): Pop, rock, country, folk, indie, hip-hop
- Edge Cases (10): Very short prompts, unusual themes, complex constraints
- Quality Tiers (10): High (70-85), medium (55-70), low (40-55)
- Revision Scenarios (10): Targeted improvement tests

**Success Criteria**:
- ✅ ≥95% pass rate
- ✅ No regressions >10 points from baseline
- ✅ Semantic expectations met (≥80%)

## Running Tests

### Prerequisites

1. **API Key Required**:
   ```bash
   export GROK_API_KEY="your-api-key-here"
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

### Run All Integration Tests

```bash
# Full integration test suite (~30-60 minutes)
npm run test:integration

# Specific test file
npm test -- tests/integration/providers/GrokProvider.integration.test.ts

# Specific service
npm test -- tests/integration/real-services/RealSongGenerationService.integration.test.ts
```

### Run Golden Test Set

```bash
# Weekly quality validation
npm run test:golden

# With verbose output
npm run test:golden -- --verbose
```

### Run Tests with Coverage

```bash
npm run test:integration -- --coverage
```

## Test Configuration

**Timeout**: 60 seconds default (can be increased per-test)
**Retry**: 3 attempts for transient failures
**Cache**: Disabled for golden tests, enabled for others
**Parallel**: Tests run sequentially to avoid rate limits

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROK_API_KEY` | Yes | Grok API authentication key |
| `SUPPRESS_TEST_LOGS` | No | Set to `'true'` to suppress console output |
| `CI` | No | Set to `'true'` to skip tests in CI without API key |

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Integration Tests

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 2 * * 0'  # Weekly on Sunday at 2 AM

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    env:
      GROK_API_KEY: ${{ secrets.GROK_API_KEY }}
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:integration
        timeout-minutes: 60
```

## Test Helpers

### Test Builders
**File**: `tests/helpers/test-builders.ts`

```typescript
// Create validated prompt
const prompt = createValidatedPrompt('Write a love song')

// Create test song
const song = createTestSong()

// Pre-built test prompts
TestPrompts.simple()
TestPrompts.complex()
TestPrompts.shortPrompt()
TestPrompts.withConstraints()
```

### Assertion Helpers
**File**: `tests/helpers/assertion-helpers.ts`

```typescript
// Assert song quality
assertSongQuality(song, { minVerses: 2, maxVerses: 4, hasChorus: true })

// Assert score in range
assertScoreInRange(score, 0, 100)

// Assert contains theme
assertContainsTheme(lyrics, ['love', 'hope'])

// Assert performance
assertLatencyWithinSLA(duration, 5000)

// Measure performance
const { result, duration } = await measurePerformance(() => service.generate(input), 30000)
```

## Expected Outcomes

### Success Criteria

For **all integration tests** to pass:

1. **Contract Compliance**: 100% of responses match contract structure
2. **Performance SLA**: P95 latency within targets
3. **Quality Thresholds**: Scores meet minimum baselines
4. **Behavioral**: Outputs within expected ranges
5. **Semantic**: Content relevant to prompts

### Known Limitations

1. **Non-Deterministic**: AI outputs vary, so exact matches are not tested
2. **Cost**: Full suite costs ~$0.50-1.00 in API calls
3. **Time**: Full suite takes 30-60 minutes
4. **Rate Limits**: Tests may be throttled if run too frequently
5. **API Dependency**: Requires live Grok API access

## Troubleshooting

### Tests Skipped

**Symptom**: `⚠️ Skipping tests: GROK_API_KEY not set`
**Solution**: Export GROK_API_KEY environment variable

### Tests Timeout

**Symptom**: Tests exceed 60s timeout
**Solution**: Increase timeout in test or check network connectivity

### Tests Fail Randomly

**Symptom**: Intermittent failures
**Solution**: This is expected with AI tests; re-run to verify

### Rate Limit Errors

**Symptom**: `Rate limit exceeded` errors
**Solution**: Wait 1 minute between test runs

## Maintenance

### Adding New Tests

1. Create test file in appropriate directory
2. Follow existing patterns (Contract → Behavioral → Quality → Semantic → Edge)
3. Use test builders and assertion helpers
4. Set appropriate timeouts
5. Skip if no API key

### Updating Golden Set

1. Edit `golden-test-cases.json`
2. Add new test cases following existing structure
3. Run golden set to validate
4. Update baselines if needed

### Updating Baselines

When AI model improves quality:

1. Run golden set with new model
2. Record new average scores
3. Update `expectedQuality` thresholds in test cases
4. Commit updated baselines

## Metrics & Reporting

### Test Execution Report

After running integration tests, view:
- `test-results/integration/junit.xml` (CI-friendly format)
- Console output with pass/fail status
- Performance metrics (P50, P95, P99 latencies)
- Cost tracking (token usage, estimated cost)

### Golden Set Report

Golden set tests output:
- Pass rate (should be ≥95%)
- Average quality score
- Failed test details
- Regression warnings

## Best Practices

1. **Run Before Release**: Always run integration tests before merging to main
2. **Monitor Costs**: Track API costs to avoid budget overruns
3. **Weekly Golden Set**: Run golden set weekly to detect drift
4. **Update Thresholds**: Adjust quality thresholds as AI improves
5. **Document Failures**: Log all failures for investigation

## Support

For issues or questions:
- Check troubleshooting section above
- Review test code for patterns
- Consult QUALITY-TESTING-STRATEGY.md
- Create GitHub issue with details

---

**Last Updated**: 2025-11-17
**Version**: 1.0
**Maintained By**: Development Team
