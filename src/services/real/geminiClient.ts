/**
 * @fileoverview Gemini AI Client Utility
 * @purpose Centralized Gemini API interaction for all services
 * @phase Phase 5 - IMPLEMENT
 * @updated 2025-11-17
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'

/**
 * Gemini model configuration
 */
interface GeminiConfig {
  apiKey: string
  model?: string
  temperature?: number
  topP?: number
  topK?: number
  maxOutputTokens?: number
}

/**
 * Gemini API response wrapper (for future use)
 */
// interface GeminiResponse {
//   text: string
//   candidates?: unknown[]
// }

/**
 * Gemini client for making AI requests
 * Handles authentication, error handling, and response parsing
 */
export class GeminiClient {
  private client: GoogleGenerativeAI
  private model: GenerativeModel
  private readonly defaultModel: string = 'gemini-1.5-flash'

  constructor(config: GeminiConfig) {
    if (!config.apiKey) {
      throw new Error('Gemini API key is required')
    }

    this.client = new GoogleGenerativeAI(config.apiKey)

    const modelName = config.model || this.defaultModel
    this.model = this.client.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: config.temperature ?? 0.7,
        topP: config.topP ?? 0.95,
        topK: config.topK ?? 40,
        maxOutputTokens: config.maxOutputTokens ?? 1024,
      }
    })
  }

  /**
   * Generate content from a prompt
   *
   * @param prompt - The prompt to send to Gemini
   * @returns The generated text response
   * @throws Error if API call fails
   */
  async generateContent(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt)
      const response = result.response
      const text = response.text()

      if (!text) {
        throw new Error('Empty response from Gemini API')
      }

      return text
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Gemini API error: ${error.message}`)
      }
      throw new Error('Unknown error calling Gemini API')
    }
  }

  /**
   * Generate content with system instruction and user prompt
   *
   * @param systemPrompt - System instruction for the AI
   * @param userPrompt - User's input prompt
   * @returns The generated text response
   */
  async generateWithSystem(systemPrompt: string, userPrompt: string): Promise<string> {
    const fullPrompt = `${systemPrompt}\n\nUser Input:\n${userPrompt}`
    return this.generateContent(fullPrompt)
  }

  /**
   * Generate JSON response
   * Parses the response as JSON and returns the parsed object
   *
   * @param prompt - The prompt to send to Gemini
   * @returns Parsed JSON object
   * @throws Error if response is not valid JSON
   */
  async generateJSON<T>(prompt: string): Promise<T> {
    const text = await this.generateContent(prompt)

    // Clean the response - remove markdown code blocks if present
    const cleanText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    try {
      return JSON.parse(cleanText) as T
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${cleanText}`)
    }
  }

  /**
   * Generate JSON response with retry logic
   * Attempts to parse JSON, retries if parsing fails
   *
   * @param prompt - The prompt to send to Gemini
   * @param maxRetries - Maximum number of retry attempts (default: 2)
   * @returns Parsed JSON object
   */
  async generateJSONWithRetry<T>(prompt: string, maxRetries: number = 2): Promise<T> {
    let lastError: Error | undefined

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.generateJSON<T>(prompt)
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')

        // If not the last attempt, add clarification to prompt
        if (attempt < maxRetries) {
          prompt += '\n\nIMPORTANT: Ensure your response is ONLY valid JSON, with no markdown formatting or additional text.'
        }
      }
    }

    throw lastError || new Error('Failed to generate valid JSON after retries')
  }
}

/**
 * Factory function to create a Gemini client
 * Gets API key from VSCode settings or environment
 */
export function createGeminiClient(
  apiKey: string,
  options?: Partial<GeminiConfig>
): GeminiClient {
  return new GeminiClient({
    apiKey,
    ...options
  })
}
