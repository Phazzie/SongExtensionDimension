/**
 * @fileoverview Grok AI Provider Implementation
 * @purpose Production AI provider using xAI's Grok API
 * @phase Phase 5 - INTEGRATE (Real Services)
 * @created 2025-11-17
 *
 * This provider:
 * - Implements IModelProvider interface
 * - Supports text generation and analysis via Grok API
 * - Includes exponential backoff retry logic
 * - Caches responses for 30 minutes with fuzzy matching
 * - Tracks costs and token usage
 * - Enforces rate limiting (60 requests/minute)
 * - Provides detailed error handling
 *
 * API Documentation:
 * - Base URL: https://api.x.ai/v1
 * - Model: grok-beta
 * - Pricing: $5 per 1M input tokens, $15 per 1M output tokens
 */

import type {
  IModelProvider,
  ModelCapabilities,
  GenerationRequest,
  GenerationResponse,
  AnalysisRequest,
  AnalysisResponse
} from '../../contracts/providers/IModelProvider'
import {
  createSuccess,
  createFailure,
  createError,
  type ServiceResponse
} from '../../contracts/types/common'

/**
 * Configuration for Grok provider
 */
export interface GrokProviderConfig {
  /** API key for authentication */
  readonly apiKey: string
  /** Base URL for API (default: https://api.x.ai/v1) */
  readonly baseUrl?: string
  /** Request timeout in milliseconds (default: 30000) */
  readonly timeout?: number
  /** Maximum retries for failed requests (default: 3) */
  readonly maxRetries?: number
  /** Enable response caching (default: true) */
  readonly enableCache?: boolean
  /** Cache expiry time in milliseconds (default: 1800000 = 30 minutes) */
  readonly cacheExpiryMs?: number
  /** Enable cost tracking (default: true) */
  readonly enableCostTracking?: boolean
}

/**
 * Cache entry for storing responses
 */
interface CacheEntry {
  readonly response: GenerationResponse | AnalysisResponse
  readonly timestamp: number
  readonly expiresAt: number
}

/**
 * Cost tracking entry
 */
interface CostEntry {
  readonly timestamp: Date
  readonly inputTokens: number
  readonly outputTokens: number
  readonly estimatedCost: number
}

/**
 * Grok API chat completion request
 */
interface GrokChatRequest {
  readonly model: string
  readonly messages: readonly {
    readonly role: 'system' | 'user' | 'assistant'
    readonly content: string
  }[]
  readonly temperature?: number
  readonly max_tokens?: number
  readonly top_p?: number
  readonly frequency_penalty?: number
  readonly stop?: readonly string[]
}

/**
 * Grok API chat completion response
 */
interface GrokChatResponse {
  readonly id: string
  readonly object: string
  readonly created: number
  readonly model: string
  readonly choices: readonly {
    readonly index: number
    readonly message: {
      readonly role: string
      readonly content: string
    }
    readonly finish_reason: 'stop' | 'length' | 'content_filter' | null
  }[]
  readonly usage: {
    readonly prompt_tokens: number
    readonly completion_tokens: number
    readonly total_tokens: number
  }
}

/**
 * Grok Provider Implementation
 *
 * Production-ready AI provider using xAI's Grok API.
 * Includes retry logic, caching, cost tracking, and rate limiting.
 */
export class GrokProvider implements IModelProvider {
  readonly name = 'grok'
  readonly capabilities: ModelCapabilities = Object.freeze({
    textGeneration: true,
    textAnalysis: true,
    audioAnalysis: false,
    imageAnalysis: false,
    streaming: false,
    maxTokens: 8192,
    temperatureRange: [0.0, 2.0] as const
  })

  private readonly config: Required<GrokProviderConfig>
  private readonly cache: Map<string, CacheEntry> = new Map()
  private readonly costHistory: CostEntry[] = []
  private requestCount: number = 0
  private lastRateLimitReset: number = Date.now()

  // Pricing constants (per million tokens)
  private static readonly INPUT_COST_PER_MILLION = 5.0
  private static readonly OUTPUT_COST_PER_MILLION = 15.0

  /**
   * Create a new Grok provider
   *
   * @param config - Provider configuration
   * @throws Error if API key is missing
   */
  constructor(config: GrokProviderConfig) {
    if (!config.apiKey || config.apiKey.trim().length === 0) {
      throw new Error('Grok API key is required')
    }

    this.config = {
      apiKey: config.apiKey,
      baseUrl: config.baseUrl || 'https://api.x.ai/v1',
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3,
      enableCache: config.enableCache !== undefined ? config.enableCache : true,
      cacheExpiryMs: config.cacheExpiryMs || 1800000, // 30 minutes
      enableCostTracking: config.enableCostTracking !== undefined ? config.enableCostTracking : true
    }
  }

  /**
   * Generate text content using Grok
   *
   * @param request - Generation parameters
   * @returns ServiceResponse with generated content
   */
  async generate(request: GenerationRequest): Promise<ServiceResponse<GenerationResponse>> {
    try {
      // Validate request
      const validationError = this.validateGenerationRequest(request)
      if (validationError) {
        return validationError
      }

      // Check cache first
      if (this.config.enableCache) {
        const cacheKey = this.generateCacheKey(request)
        const cached = this.getFromCache(cacheKey)
        if (cached && this.isGenerationResponse(cached)) {
          return createSuccess(cached)
        }
      }

      // Check rate limit
      this.checkRateLimit()

      // Build API request
      const apiRequest: GrokChatRequest = {
        model: 'grok-beta',
        messages: [
          { role: 'system', content: request.systemPrompt },
          { role: 'user', content: request.userPrompt }
        ],
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        top_p: request.topP,
        frequency_penalty: request.frequencyPenalty,
        stop: request.stopSequences
      }

      // Make API call with retries
      const apiResponse = await this.callApiWithRetry(apiRequest)

      // Parse response
      const generationResponse = this.parseGenerationResponse(apiResponse)

      // Track costs
      if (this.config.enableCostTracking) {
        this.trackCost(
          apiResponse.usage.prompt_tokens,
          apiResponse.usage.completion_tokens
        )
      }

      // Cache response
      if (this.config.enableCache) {
        const cacheKey = this.generateCacheKey(request)
        this.addToCache(cacheKey, generationResponse)
      }

      return createSuccess(generationResponse)
    } catch (error) {
      return this.handleError(error, 'generation')
    }
  }

  /**
   * Analyze text content using Grok
   *
   * @param request - Analysis parameters
   * @returns ServiceResponse with analysis results
   */
  async analyze(request: AnalysisRequest): Promise<ServiceResponse<AnalysisResponse>> {
    try {
      // Validate request
      const validationError = this.validateAnalysisRequest(request)
      if (validationError) {
        return validationError
      }

      // Check cache first
      if (this.config.enableCache) {
        const cacheKey = this.generateCacheKey(request)
        const cached = this.getFromCache(cacheKey)
        if (cached && this.isAnalysisResponse(cached)) {
          return createSuccess(cached)
        }
      }

      // Check rate limit
      this.checkRateLimit()

      // Build system prompt for analysis
      const systemPrompt = this.buildAnalysisSystemPrompt(request.analysisType, request.parameters)

      // Build API request
      const apiRequest: GrokChatRequest = {
        model: 'grok-beta',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: request.content }
        ],
        temperature: request.temperature,
        max_tokens: 2048 // Analysis typically needs less tokens
      }

      // Make API call with retries
      const apiResponse = await this.callApiWithRetry(apiRequest)

      // Parse response
      const analysisResponse = this.parseAnalysisResponse(apiResponse)

      // Track costs
      if (this.config.enableCostTracking) {
        this.trackCost(
          apiResponse.usage.prompt_tokens,
          apiResponse.usage.completion_tokens
        )
      }

      // Cache response
      if (this.config.enableCache) {
        const cacheKey = this.generateCacheKey(request)
        this.addToCache(cacheKey, analysisResponse)
      }

      return createSuccess(analysisResponse)
    } catch (error) {
      return this.handleError(error, 'analysis')
    }
  }

  /**
   * Check if provider is available and ready
   *
   * @returns True if provider can handle requests
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Make a minimal test request
      const testRequest: GrokChatRequest = {
        model: 'grok-beta',
        messages: [
          { role: 'user', content: 'test' }
        ],
        max_tokens: 1
      }

      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testRequest),
        signal: AbortSignal.timeout(5000) // 5 second timeout for availability check
      })

      return response.ok || response.status === 400 // 400 is ok, means API is responding
    } catch {
      return false
    }
  }

  /**
   * Get cost estimate for a request
   *
   * @param tokens - Estimated token count
   * @returns Estimated cost in USD
   */
  estimateCost(tokens: number): number {
    // Assume 50/50 split between input and output tokens
    const inputTokens = tokens * 0.5
    const outputTokens = tokens * 0.5

    const inputCost = (inputTokens / 1_000_000) * GrokProvider.INPUT_COST_PER_MILLION
    const outputCost = (outputTokens / 1_000_000) * GrokProvider.OUTPUT_COST_PER_MILLION

    return inputCost + outputCost
  }

  /**
   * Get cost statistics
   *
   * @returns Cost tracking data
   */
  getCostStatistics(): {
    readonly totalTokens: number
    readonly totalCost: number
    readonly requestCount: number
    readonly averageCostPerRequest: number
  } {
    const totalTokens = this.costHistory.reduce(
      (sum, entry) => sum + entry.inputTokens + entry.outputTokens,
      0
    )
    const totalCost = this.costHistory.reduce(
      (sum, entry) => sum + entry.estimatedCost,
      0
    )
    const requestCount = this.costHistory.length
    const averageCostPerRequest = requestCount > 0 ? totalCost / requestCount : 0

    return {
      totalTokens,
      totalCost,
      requestCount,
      averageCostPerRequest
    }
  }

  /**
   * Clear the response cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Clear cost history
   */
  clearCostHistory(): void {
    this.costHistory.length = 0
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Validate generation request
   */
  private validateGenerationRequest(
    request: GenerationRequest
  ): ServiceResponse<GenerationResponse> | null {
    if (!request.systemPrompt || request.systemPrompt.trim().length === 0) {
      return createFailure(
        createError(
          'INVALID_REQUEST',
          'System prompt is required',
          'Please provide a system prompt for generation'
        )
      )
    }

    if (!request.userPrompt || request.userPrompt.trim().length === 0) {
      return createFailure(
        createError(
          'INVALID_REQUEST',
          'User prompt is required',
          'Please provide a user prompt for generation'
        )
      )
    }

    if (request.temperature < 0 || request.temperature > 2) {
      return createFailure(
        createError(
          'INVALID_REQUEST',
          'Temperature must be between 0 and 2',
          'Please provide a valid temperature value'
        )
      )
    }

    if (request.maxTokens <= 0 || request.maxTokens > this.capabilities.maxTokens) {
      return createFailure(
        createError(
          'INVALID_REQUEST',
          `Max tokens must be between 1 and ${this.capabilities.maxTokens}`,
          'Please provide a valid max tokens value'
        )
      )
    }

    return null
  }

  /**
   * Validate analysis request
   */
  private validateAnalysisRequest(
    request: AnalysisRequest
  ): ServiceResponse<AnalysisResponse> | null {
    if (!request.content || request.content.trim().length === 0) {
      return createFailure(
        createError(
          'INVALID_REQUEST',
          'Content is required for analysis',
          'Please provide content to analyze'
        )
      )
    }

    if (!request.analysisType || request.analysisType.trim().length === 0) {
      return createFailure(
        createError(
          'INVALID_REQUEST',
          'Analysis type is required',
          'Please specify the type of analysis to perform'
        )
      )
    }

    if (request.temperature < 0 || request.temperature > 2) {
      return createFailure(
        createError(
          'INVALID_REQUEST',
          'Temperature must be between 0 and 2',
          'Please provide a valid temperature value'
        )
      )
    }

    return null
  }

  /**
   * Call Grok API with exponential backoff retry
   */
  private async callApiWithRetry(request: GrokChatRequest): Promise<GrokChatResponse> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(request),
          signal: AbortSignal.timeout(this.config.timeout)
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`)
        }

        const data = await response.json() as GrokChatResponse
        return data
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        // Don't retry on final attempt
        if (attempt < this.config.maxRetries - 1) {
          // Exponential backoff: 2s, 4s, 8s
          const delayMs = Math.pow(2, attempt + 1) * 1000
          await this.sleep(delayMs)
        }
      }
    }

    throw lastError || new Error('API request failed after retries')
  }

  /**
   * Parse Grok API response to GenerationResponse
   */
  private parseGenerationResponse(apiResponse: GrokChatResponse): GenerationResponse {
    const choice = apiResponse.choices[0]
    if (!choice) {
      throw new Error('No choices in API response')
    }

    const finishReason = this.mapFinishReason(choice.finish_reason)

    return Object.freeze({
      content: choice.message.content,
      tokensUsed: apiResponse.usage.total_tokens,
      finishReason,
      confidence: this.estimateConfidence(finishReason),
      metadata: {
        model: apiResponse.model,
        created: apiResponse.created,
        id: apiResponse.id,
        inputTokens: apiResponse.usage.prompt_tokens,
        outputTokens: apiResponse.usage.completion_tokens
      }
    })
  }

  /**
   * Parse Grok API response to AnalysisResponse
   */
  private parseAnalysisResponse(apiResponse: GrokChatResponse): AnalysisResponse {
    const choice = apiResponse.choices[0]
    if (!choice) {
      throw new Error('No choices in API response')
    }

    // Parse JSON response from AI
    let analysis: Record<string, unknown>
    try {
      analysis = JSON.parse(choice.message.content)
    } catch {
      // If not JSON, wrap in object
      analysis = { result: choice.message.content }
    }

    const finishReason = this.mapFinishReason(choice.finish_reason)

    return Object.freeze({
      analysis,
      confidence: this.estimateConfidence(finishReason),
      tokensUsed: apiResponse.usage.total_tokens
    })
  }

  /**
   * Build system prompt for analysis requests
   */
  private buildAnalysisSystemPrompt(
    analysisType: string,
    parameters?: Record<string, unknown>
  ): string {
    let prompt = `You are an expert analyzer specialized in ${analysisType}. `
    prompt += 'Analyze the provided content and return your analysis in JSON format. '
    prompt += 'Be thorough, precise, and provide actionable insights. '

    if (parameters) {
      prompt += `\n\nAnalysis parameters: ${JSON.stringify(parameters, null, 2)}`
    }

    return prompt
  }

  /**
   * Map Grok finish reason to GenerationResponse finish reason
   */
  private mapFinishReason(
    grokReason: 'stop' | 'length' | 'content_filter' | null
  ): 'completed' | 'length' | 'stop' | 'error' {
    switch (grokReason) {
      case 'stop':
        return 'completed'
      case 'length':
        return 'length'
      case 'content_filter':
        return 'error'
      case null:
        return 'error'
      default:
        return 'error'
    }
  }

  /**
   * Estimate confidence based on finish reason
   */
  private estimateConfidence(finishReason: 'completed' | 'length' | 'stop' | 'error'): number {
    switch (finishReason) {
      case 'completed':
        return 0.95
      case 'stop':
        return 0.9
      case 'length':
        return 0.7
      case 'error':
        return 0.3
      default:
        return 0.5
    }
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: GenerationRequest | AnalysisRequest): string {
    // Create fuzzy hash: normalize, sort words, take first 20
    let text = ''
    if ('systemPrompt' in request) {
      text = `${request.systemPrompt}|${request.userPrompt}`
    } else {
      text = `${request.analysisType}|${request.content}`
    }

    const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, '')
    const words = normalized.split(/\s+/).filter(w => w.length > 0)
    const sortedWords = words.sort().slice(0, 20)
    return sortedWords.join('_')
  }

  /**
   * Get response from cache
   */
  private getFromCache(key: string): GenerationResponse | AnalysisResponse | null {
    const entry = this.cache.get(key)
    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.response
  }

  /**
   * Add response to cache
   */
  private addToCache(key: string, response: GenerationResponse | AnalysisResponse): void {
    const entry: CacheEntry = {
      response,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.config.cacheExpiryMs
    }
    this.cache.set(key, entry)
  }

  /**
   * Type guard for GenerationResponse
   */
  private isGenerationResponse(
    response: GenerationResponse | AnalysisResponse
  ): response is GenerationResponse {
    return 'content' in response
  }

  /**
   * Type guard for AnalysisResponse
   */
  private isAnalysisResponse(
    response: GenerationResponse | AnalysisResponse
  ): response is AnalysisResponse {
    return 'analysis' in response
  }

  /**
   * Track cost for a request
   */
  private trackCost(inputTokens: number, outputTokens: number): void {
    const inputCost = (inputTokens / 1_000_000) * GrokProvider.INPUT_COST_PER_MILLION
    const outputCost = (outputTokens / 1_000_000) * GrokProvider.OUTPUT_COST_PER_MILLION
    const estimatedCost = inputCost + outputCost

    const entry: CostEntry = {
      timestamp: new Date(),
      inputTokens,
      outputTokens,
      estimatedCost
    }

    this.costHistory.push(entry)
  }

  /**
   * Check rate limit (60 requests per minute)
   */
  private checkRateLimit(): void {
    const now = Date.now()
    const timeSinceReset = now - this.lastRateLimitReset

    // Reset counter every minute
    if (timeSinceReset > 60000) {
      this.requestCount = 0
      this.lastRateLimitReset = now
    }

    // Check if over limit
    if (this.requestCount >= 60) {
      const waitTime = 60000 - timeSinceReset
      throw new Error(
        `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before making another request.`
      )
    }

    this.requestCount++
  }

  /**
   * Handle errors and convert to ServiceResponse
   */
  private handleError<T extends GenerationResponse | AnalysisResponse>(
    error: unknown,
    operation: 'generation' | 'analysis'
  ): ServiceResponse<T> {
    const errorMessage = error instanceof Error ? error.message : String(error)

    // Check for specific error types
    if (errorMessage.includes('Rate limit')) {
      return createFailure(
        createError(
          'RATE_LIMIT_EXCEEDED',
          'Rate limit exceeded',
          'Please wait a moment before making another request',
          errorMessage
        )
      )
    }

    if (errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
      return createFailure(
        createError(
          'API_TIMEOUT',
          'Request timed out',
          'The AI service took too long to respond. Please try again.',
          errorMessage
        )
      )
    }

    if (errorMessage.includes('401') || errorMessage.includes('403')) {
      return createFailure(
        createError(
          'AUTHENTICATION_FAILED',
          'Authentication failed',
          'Please check your API key configuration',
          errorMessage
        )
      )
    }

    if (errorMessage.includes('content_filter')) {
      return createFailure(
        createError(
          'INAPPROPRIATE_CONTENT',
          'Content policy violation',
          'The request was rejected due to content policy. Please modify your input.',
          errorMessage
        )
      )
    }

    // Generic error
    return createFailure(
      createError(
        'API_ERROR',
        `AI ${operation} failed`,
        'An error occurred while communicating with the AI service. Please try again.',
        errorMessage,
        error instanceof Error ? error : undefined
      )
    )
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
