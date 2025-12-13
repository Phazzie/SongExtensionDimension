/**
 * @fileoverview AI Model Provider Contract
 * @purpose Abstract interface for swappable AI providers (Grok, Claude, GPT-4, Mock)
 * @phase Phase 3 - BUILD (Architecture)
 * @created 2025-11-15
 *
 * This contract enables:
 * - Swapping AI providers without changing service code
 * - Testing with mock providers (deterministic, fast, free)
 * - Production use with real AI providers (Grok, Claude, etc.)
 * - A/B testing different models
 * - Graceful fallback if one provider fails
 *
 * SDD Compliance:
 * - This is a NEW contract (not modifying existing)
 * - Defines a data transformation seam: [Service] → [AI Provider] → [Service]
 * - Implementation-agnostic (can use any AI API)
 * - Type-safe with full error handling
 */

import type { ServiceResponse } from '../types/common'

/**
 * Model capabilities that providers may support
 */
export interface ModelCapabilities {
  /** Can generate creative text content */
  readonly textGeneration: boolean
  /** Can analyze and critique text */
  readonly textAnalysis: boolean
  /** Can process and analyze audio files */
  readonly audioAnalysis: boolean
  /** Can process images */
  readonly imageAnalysis: boolean
  /** Supports streaming responses */
  readonly streaming: boolean
  /** Maximum tokens per request */
  readonly maxTokens: number
  /** Supported temperature range */
  readonly temperatureRange: readonly [number, number]
}

/**
 * Request for text generation
 */
export interface GenerationRequest {
  /** System prompt (role definition, JSON schema, rules) */
  readonly systemPrompt: string
  /** User prompt (actual request with data) */
  readonly userPrompt: string
  /** Temperature (0.0 = deterministic, 1.0 = creative) */
  readonly temperature: number
  /** Maximum tokens to generate */
  readonly maxTokens: number
  /** Optional: Stop sequences */
  readonly stopSequences?: readonly string[]
  /** Optional: Top-p sampling */
  readonly topP?: number
  /** Optional: Frequency penalty */
  readonly frequencyPenalty?: number
}

/**
 * Response from text generation
 */
export interface GenerationResponse {
  /** Generated text content */
  readonly content: string
  /** Tokens used in request */
  readonly tokensUsed: number
  /** Finish reason (completed, length, stop, error) */
  readonly finishReason: 'completed' | 'length' | 'stop' | 'error'
  /** Confidence score (0-1) if available */
  readonly confidence?: number
  /** Raw response metadata */
  readonly metadata?: Record<string, unknown>
}

/**
 * Request for analysis/critique
 */
export interface AnalysisRequest {
  /** Content to analyze */
  readonly content: string
  /** Type of analysis (quality, rhyme, rhythm, etc.) */
  readonly analysisType: string
  /** Optional: Analysis parameters */
  readonly parameters?: Record<string, unknown>
  /** Temperature (usually low for analytical tasks) */
  readonly temperature: number
}

/**
 * Response from analysis
 */
export interface AnalysisResponse {
  /** Analysis results (structured data) */
  readonly analysis: Record<string, unknown>
  /** Confidence in analysis (0-1) */
  readonly confidence: number
  /** Tokens used */
  readonly tokensUsed: number
}

/**
 * Model provider interface
 *
 * All AI providers (Grok, Claude, GPT-4, Mock) must implement this interface.
 * Services depend on this interface, not on specific providers.
 */
export interface IModelProvider {
  /** Provider name (e.g., "grok", "claude", "gpt4", "mock") */
  readonly name: string

  /** Provider capabilities */
  readonly capabilities: ModelCapabilities

  /**
   * Generate text content
   *
   * @param request - Generation parameters
   * @returns ServiceResponse with generated content
   */
  generate(request: GenerationRequest): Promise<ServiceResponse<GenerationResponse>>

  /**
   * Analyze text content
   *
   * @param request - Analysis parameters
   * @returns ServiceResponse with analysis results
   */
  analyze(request: AnalysisRequest): Promise<ServiceResponse<AnalysisResponse>>

  /**
   * Check if provider is available and ready
   *
   * @returns True if provider can handle requests
   */
  isAvailable(): Promise<boolean>

  /**
   * Get cost estimate for a request
   *
   * @param tokens - Estimated token count
   * @returns Estimated cost in USD
   */
  estimateCost(tokens: number): number
}

/**
 * Configuration for creating a model provider
 */
export interface ModelProviderConfig {
  /** Provider type */
  readonly provider: 'grok' | 'claude' | 'gpt4' | 'gemini' | 'mock'
  /** API key (not needed for mock) */
  readonly apiKey?: string
  /** Optional: Base URL for API */
  readonly baseUrl?: string
  /** Optional: Organization ID */
  readonly organizationId?: string
  /** Optional: Request timeout in milliseconds */
  readonly timeout?: number
  /** Optional: Max retries for failed requests */
  readonly maxRetries?: number
}

/**
 * Factory function type for creating providers
 *
 * @param config - Provider configuration
 * @returns Model provider instance
 */
export type CreateModelProvider = (config: ModelProviderConfig) => IModelProvider
