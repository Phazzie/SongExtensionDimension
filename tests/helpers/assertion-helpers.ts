/**
 * @fileoverview Custom Jest Matchers for AI Tests
 * @purpose Assertion helpers for non-deterministic AI outputs
 */

import type { Song } from '../../src/contracts/types/song'
import type { ServiceResponse } from '../../src/contracts/types/common'
import { isSuccess, isFailure } from '../../src/contracts/types/common'

/**
 * Assert that a song meets quality thresholds
 */
export function assertSongQuality(song: Song, thresholds: {
  minVerses?: number
  maxVerses?: number
  minLines?: number
  maxLines?: number
  hasChorus?: boolean
  hasBridge?: boolean
}) {
  if (thresholds.minVerses !== undefined) {
    expect(song.verses.length).toBeGreaterThanOrEqual(thresholds.minVerses)
  }

  if (thresholds.maxVerses !== undefined) {
    expect(song.verses.length).toBeLessThanOrEqual(thresholds.maxVerses)
  }

  if (thresholds.hasChorus !== undefined && thresholds.hasChorus) {
    expect(song.choruses.length).toBeGreaterThan(0)
  }

  if (thresholds.hasBridge !== undefined && thresholds.hasBridge) {
    expect(song.bridge).not.toBeNull()
  }

  // Check all verses have lines
  song.verses.forEach((verse, i) => {
    expect(verse.lines.length).toBeGreaterThan(0)
    expect(verse.number).toBe(i + 1)

    if (thresholds.minLines !== undefined) {
      expect(verse.lines.length).toBeGreaterThanOrEqual(thresholds.minLines)
    }

    if (thresholds.maxLines !== undefined) {
      expect(verse.lines.length).toBeLessThanOrEqual(thresholds.maxLines)
    }

    // Check all lines have text
    verse.lines.forEach(line => {
      expect(line.text).toBeTruthy()
      expect(line.text.length).toBeGreaterThan(0)
    })
  })

  // Check all choruses have lines
  song.choruses.forEach(chorus => {
    expect(chorus.lines.length).toBeGreaterThan(0)

    chorus.lines.forEach(line => {
      expect(line.text).toBeTruthy()
      expect(line.text.length).toBeGreaterThan(0)
    })
  })
}

/**
 * Assert that response structure is valid
 */
export function assertValidServiceResponse<T>(response: ServiceResponse<T>) {
  expect(response).toHaveProperty('success')
  expect(typeof response.success).toBe('boolean')

  if (isSuccess(response)) {
    expect(response.data).toBeDefined()
  } else {
    expect(response.error).toBeDefined()
    expect(response.error.code).toBeTruthy()
    expect(response.error.message).toBeTruthy()
    expect(response.error.suggestion).toBeTruthy()
  }
}

/**
 * Assert that text contains theme keywords
 */
export function assertContainsTheme(text: string, theme: string | string[]) {
  const themes = Array.isArray(theme) ? theme : [theme]
  const lowerText = text.toLowerCase()

  const containsTheme = themes.some(t => lowerText.includes(t.toLowerCase()))

  expect(containsTheme).toBe(true)
}

/**
 * Assert that text does NOT contain forbidden phrases
 */
export function assertDoesNotContainClichés(text: string, clichés: string[]) {
  const lowerText = text.toLowerCase()

  clichés.forEach(cliché => {
    expect(lowerText).not.toContain(cliché.toLowerCase())
  })
}

/**
 * Assert score is in valid range
 */
export function assertScoreInRange(score: number, min: number, max: number) {
  expect(score).toBeGreaterThanOrEqual(min)
  expect(score).toBeLessThanOrEqual(max)
}

/**
 * Assert that a number is within a range (with tolerance)
 */
export function assertWithinRange(value: number, target: number, tolerance: number) {
  const min = target - tolerance
  const max = target + tolerance

  expect(value).toBeGreaterThanOrEqual(min)
  expect(value).toBeLessThanOrEqual(max)
}

/**
 * Assert latency is within SLA
 */
export function assertLatencyWithinSLA(latencyMs: number, targetP95: number) {
  expect(latencyMs).toBeLessThan(targetP95)
}

/**
 * Measure and assert operation performance
 */
export async function measurePerformance<T>(
  operation: () => Promise<T>,
  maxLatencyMs: number
): Promise<{ result: T; duration: number }> {
  const start = Date.now()
  const result = await operation()
  const duration = Date.now() - start

  expect(duration).toBeLessThan(maxLatencyMs)

  return { result, duration }
}

/**
 * Calculate percentile from sorted array using nearest rank method
 * @param sortedValues Array of numbers sorted in ascending order
 * @param percentile Value between 0 and 1 (e.g., 0.5 for median, 0.95 for P95)
 * @returns The value at the given percentile, or 0 if array is empty
 */
export function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0

  // Clamp percentile to valid range [0, 1] to handle edge cases
  const clampedPercentile = Math.max(0, Math.min(percentile, 1))

  // Calculate index with both lower and upper bound clamping
  const index = Math.max(
    0,
    Math.min(
      Math.floor(sortedValues.length * clampedPercentile),
      sortedValues.length - 1
    )
  )

  return sortedValues[index] ?? 0
}

/**
 * Run multiple iterations and check percentiles
 * @param operation Async function to measure
 * @param iterations Number of times to run (must be positive integer)
 * @param p95Target Maximum acceptable P95 latency in ms
 */
export async function runPerformanceTest<T>(
  operation: () => Promise<T>,
  iterations: number,
  p95Target: number
): Promise<{
  p50: number
  p95: number
  p99: number
  results: T[]
}> {
  // Validate iterations to prevent meaningless results
  if (!Number.isInteger(iterations) || iterations <= 0) {
    throw new Error(
      `runPerformanceTest: iterations must be a positive integer (got ${iterations})`
    )
  }

  const latencies: number[] = []
  const results: T[] = []

  for (let i = 0; i < iterations; i++) {
    const start = Date.now()
    const result = await operation()
    const duration = Date.now() - start

    latencies.push(duration)
    results.push(result)
  }

  // Sort latencies for percentile calculation
  latencies.sort((a, b) => a - b)

  const p50 = calculatePercentile(latencies, 0.5)
  const p95 = calculatePercentile(latencies, 0.95)
  const p99 = calculatePercentile(latencies, 0.99)

  // Assert P95 is within target
  expect(p95).toBeLessThan(p95Target)

  return { p50, p95, p99, results }
}
