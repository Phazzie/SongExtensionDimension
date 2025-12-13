/**
 * @fileoverview Mock AI Provider Implementation
 * @purpose Testing and offline AI provider using deterministic templates
 * @phase Phase 5 - INTEGRATE (Real Services)
 * @created 2025-11-17
 *
 * This provider:
 * - Implements IModelProvider interface
 * - Returns deterministic, template-based responses
 * - Zero cost ($0)
 * - Fast response time (<50ms with simulated delay)
 * - Works offline (no API calls)
 * - Useful for testing and development
 *
 * Mock Logic:
 * - Uses genre-based templates for generation
 * - Uses rule-based analysis for critique
 * - Returns realistic but deterministic data
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
 * Mock Provider Implementation
 *
 * Deterministic AI provider for testing and offline use.
 * Returns template-based responses with realistic structure.
 */
export class MockProvider implements IModelProvider {
  readonly name = 'mock'
  readonly capabilities: ModelCapabilities = Object.freeze({
    textGeneration: true,
    textAnalysis: true,
    audioAnalysis: false,
    imageAnalysis: false,
    streaming: false,
    maxTokens: 8192,
    temperatureRange: [0.0, 2.0] as const
  })

  private requestCount: number = 0

  /**
   * Generate text content using templates
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

      // Simulate processing delay
      await this.simulateDelay()

      // Extract genre/style from system prompt if present
      const genre = this.extractGenre(request.systemPrompt + ' ' + request.userPrompt)

      // Generate content based on genre
      const content = this.generateContent(genre, request.userPrompt, request.temperature)

      // Estimate tokens (rough approximation: 1 word ≈ 1.3 tokens)
      const words = content.split(/\s+/).length
      const tokensUsed = Math.floor(words * 1.3)

      const response: GenerationResponse = Object.freeze({
        content,
        tokensUsed,
        finishReason: 'completed',
        confidence: 0.85,
        metadata: {
          model: 'mock-template-v1',
          provider: 'mock',
          cached: false
        }
      })

      this.requestCount++

      return createSuccess(response)
    } catch (error) {
      return this.handleError(error, 'generation')
    }
  }

  /**
   * Analyze text content using rule-based logic
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

      // Simulate processing delay
      await this.simulateDelay()

      // Perform analysis based on type
      const analysis = this.performAnalysis(
        request.content,
        request.analysisType,
        request.parameters
      )

      // Estimate tokens
      const words = request.content.split(/\s+/).length
      const tokensUsed = Math.floor(words * 1.3)

      const response: AnalysisResponse = Object.freeze({
        analysis,
        confidence: 0.8,
        tokensUsed
      })

      this.requestCount++

      return createSuccess(response)
    } catch (error) {
      return this.handleError(error, 'analysis')
    }
  }

  /**
   * Check if provider is available
   *
   * @returns Always true for mock provider
   */
  async isAvailable(): Promise<boolean> {
    return true
  }

  /**
   * Get cost estimate (always $0 for mock)
   *
   * @param _tokens - Token count (ignored)
   * @returns Always 0
   */
  estimateCost(_tokens: number): number {
    return 0
  }

  /**
   * Get request statistics
   *
   * @returns Mock provider statistics
   */
  getStatistics(): {
    readonly requestCount: number
    readonly averageResponseTime: number
  } {
    return {
      requestCount: this.requestCount,
      averageResponseTime: 25 // Mock average: 25ms
    }
  }

  /**
   * Reset statistics
   */
  resetStatistics(): void {
    this.requestCount = 0
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

    return null
  }

  /**
   * Extract genre from prompt text
   */
  private extractGenre(text: string): string {
    const lowerText = text.toLowerCase()

    if (lowerText.includes('pop')) return 'pop'
    if (lowerText.includes('rock')) return 'rock'
    if (lowerText.includes('indie') || lowerText.includes('folk')) return 'indie-folk'
    if (lowerText.includes('country')) return 'country'
    if (lowerText.includes('hip-hop') || lowerText.includes('rap')) return 'hip-hop'
    if (lowerText.includes('jazz')) return 'jazz'
    if (lowerText.includes('blues')) return 'blues'

    return 'pop' // Default
  }

  /**
   * Generate content based on genre and prompt
   */
  private generateContent(genre: string, userPrompt: string, temperature: number): string {
    // Higher temperature = more variation
    const variationIndex = Math.floor(temperature * 3)

    // Extract key themes from prompt
    const themes = this.extractThemes(userPrompt)
    const mainTheme = themes[0] || 'life'

    // Genre-specific templates
    const templates: Record<string, string[]> = {
      'pop': [
        `Here's a pop song about ${mainTheme}:\n\nVerse 1:\nDancing under starlight, feeling so alive\nYour ${mainTheme} makes my heart come alive\nEvery moment with you feels like a dream come true\nTogether we can touch the sky, just me and you\n\nChorus:\nWe're unstoppable tonight\nOur ${mainTheme} burning bright\nNothing's gonna stop this feeling\nForever we'll keep believing`,
        `Pop song structure for ${mainTheme}:\n\nVerse 1:\nCaught up in the moment, can't let go\nYour ${mainTheme} is all I need to know\nSpinning in circles, lost in your eyes\nWith you I'm reaching for the skies\n\nChorus:\nThis ${mainTheme} is electric\nSo magnetic, so poetic\nWe're writing our own story\nIn all its glory`,
        `A pop melody about ${mainTheme}:\n\nVerse 1:\nCity lights are calling out my name\nBut your ${mainTheme} sets my soul aflame\nEvery heartbeat echoes your sweet sound\nIn this crazy world, with you I'm found\n\nChorus:\nLet the music play\nTake my breath away\nThis ${mainTheme} never fades\nIn the light we've made`
      ],
      'rock': [
        `Rock anthem about ${mainTheme}:\n\nVerse 1:\nThunder rolling through the night\nMy ${mainTheme} burning wild and bright\nBreaking chains, I'm breaking free\nNothing's gonna hold me\n\nChorus:\nRise up! Fight the ${mainTheme}\nStand tall! Through the storm\nWe are the ones who won't back down\nWe wear the crown`,
        `Hard-hitting rock for ${mainTheme}:\n\nVerse 1:\nFire in my veins, steel in my soul\nThis ${mainTheme} makes me whole\nCrashing through the walls of doubt\nHear me scream and shout\n\nChorus:\nWe are the rebels\nFighting for ${mainTheme}\nWe are unstoppable\nUnbreakable and free`,
        `Rock ballad about ${mainTheme}:\n\nVerse 1:\nIn the darkness I can see the light\nYour ${mainTheme} guides me through the night\nEvery scar tells a story true\nAll roads lead me back to you\n\nChorus:\nI'll keep on fighting\nFor this ${mainTheme}\nThrough the lightning\nI believe`
      ],
      'indie-folk': [
        `Indie-folk song about ${mainTheme}:\n\nVerse 1:\nWalking down these dusty roads\nCarrying ${mainTheme} and heavy loads\nWhispers of the morning breeze\nDancing through the willow trees\n\nChorus:\nOh, the ${mainTheme} we used to know\nEchoes in the river's flow\nTime moves slow but memories stay\nIn the light of yesterday`,
        `Folk melody for ${mainTheme}:\n\nVerse 1:\nShadows lengthen on the wall\nHear the ${mainTheme} gently call\nIn the quiet of the dawn\nAll our worries have withdrawn\n\nChorus:\nWe're just wanderers passing through\nSeeking ${mainTheme} in morning dew\nEvery step a story told\nIn the silence, we grow old`,
        `Acoustic piece about ${mainTheme}:\n\nVerse 1:\nMountains high and valleys low\nWhere the winds of ${mainTheme} blow\nCarry me on wings of song\nTo where my heart belongs\n\nChorus:\nHome is where the ${mainTheme} leads\nPlanted like forgotten seeds\nGrowing wild and growing free\nThat's where I want to be`
      ],
      'country': [
        `Country song about ${mainTheme}:\n\nVerse 1:\nDriving down these back roads\nWhere the ${mainTheme} freely flows\nDust and dirt beneath my boots\nRemembering my country roots\n\nChorus:\nTake me back to ${mainTheme}\nWhere the sun sets on the farm\nSimple life and simple ways\nMissing those good old days`,
        `Country ballad for ${mainTheme}:\n\nVerse 1:\nSunset falling on the porch\nHolding onto ${mainTheme} like a torch\nCold beer and a Friday night\nEverything feels just right\n\nChorus:\nThis small town ${mainTheme}\nIs all I'll ever need\nWhere everybody knows your name\nAnd we're all family`,
        `Honky-tonk about ${mainTheme}:\n\nVerse 1:\nTruck's loaded up, I'm heading home\nTo the ${mainTheme} I've always known\nGravel crunching under tire\nHome where my heart's desire\n\nChorus:\nNothing beats that ${mainTheme}\nCountry roads calling me\nBack to where I started from\nWhere I truly belong`
      ]
    }

    const genreTemplates = templates[genre] || templates['pop']
    if (!genreTemplates) {
      return `Generated content about ${mainTheme}`
    }
    const template = genreTemplates[variationIndex % genreTemplates.length]

    return template || `Generated content about ${mainTheme}`
  }

  /**
   * Extract themes from user prompt
   */
  private extractThemes(prompt: string): string[] {
    const lowerPrompt = prompt.toLowerCase()
    const themes: string[] = []

    const themeKeywords = {
      'love': ['love', 'heart', 'romance'],
      'freedom': ['freedom', 'free', 'liberty'],
      'journey': ['journey', 'travel', 'road'],
      'hope': ['hope', 'dream', 'future'],
      'loss': ['loss', 'goodbye', 'miss'],
      'celebration': ['celebrate', 'party', 'dance'],
      'struggle': ['struggle', 'fight', 'battle']
    }

    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      if (keywords.some(keyword => lowerPrompt.includes(keyword))) {
        themes.push(theme)
      }
    }

    return themes.length > 0 ? themes : ['life']
  }

  /**
   * Perform analysis based on type
   */
  private performAnalysis(
    content: string,
    analysisType: string,
    parameters?: Record<string, unknown>
  ): Record<string, unknown> {
    const lowerType = analysisType.toLowerCase()

    // Quality/critique analysis
    if (lowerType.includes('quality') || lowerType.includes('critique')) {
      return this.performQualityAnalysis(content)
    }

    // Rhyme analysis
    if (lowerType.includes('rhyme')) {
      return this.performRhymeAnalysis(content)
    }

    // Syllable analysis
    if (lowerType.includes('syllable')) {
      return this.performSyllableAnalysis(content)
    }

    // Generic analysis
    return {
      type: analysisType,
      content_length: content.length,
      word_count: content.split(/\s+/).length,
      parameters: parameters || {},
      summary: 'Analysis completed successfully'
    }
  }

  /**
   * Perform quality analysis
   */
  private performQualityAnalysis(content: string): Record<string, unknown> {
    const lines = content.split('\n').filter(line => line.trim().length > 0)
    const words = content.split(/\s+/)

    return {
      overall_quality: 75,
      scores: {
        rhyme: 80,
        flow: 70,
        imagery: 75,
        authenticity: 80,
        originality: 70,
        voice: 75
      },
      strengths: [
        'Strong thematic consistency',
        'Good rhythm and flow',
        'Authentic voice'
      ],
      weaknesses: [
        'Some predictable phrases',
        'Could use more vivid imagery'
      ],
      suggestions: [
        'Try varying the rhyme scheme',
        'Add more specific, sensory details'
      ],
      line_count: lines.length,
      word_count: words.length
    }
  }

  /**
   * Perform rhyme analysis
   */
  private performRhymeAnalysis(content: string): Record<string, unknown> {
    const lines = content.split('\n').filter(line => line.trim().length > 0)

    // Simple rhyme detection based on last word endings
    const lastWords = lines.map(line => {
      const words = line.trim().split(/\s+/)
      return words[words.length - 1]?.toLowerCase().replace(/[^a-z]/g, '') || ''
    })

    const rhymeScheme = this.detectRhymeScheme(lastWords)

    return {
      rhyme_scheme: rhymeScheme,
      rhyme_quality: 'good',
      perfect_rhymes: Math.floor(lines.length * 0.6),
      near_rhymes: Math.floor(lines.length * 0.3),
      suggestions: [
        'Consider using more perfect rhymes for stronger impact',
        'Vary rhyme placement to avoid predictability'
      ]
    }
  }

  /**
   * Perform syllable analysis
   */
  private performSyllableAnalysis(content: string): Record<string, unknown> {
    const lines = content.split('\n').filter(line => line.trim().length > 0)
    const syllableCounts = lines.map(line => this.countSyllables(line))

    return {
      total_syllables: syllableCounts.reduce((a, b) => a + b, 0),
      average_syllables_per_line: syllableCounts.length > 0
        ? syllableCounts.reduce((a, b) => a + b, 0) / syllableCounts.length
        : 0,
      syllable_pattern: syllableCounts,
      rhythm: 'iambic',
      consistency: 'moderate',
      suggestions: [
        'Try maintaining consistent syllable counts for better rhythm',
        'Consider stress patterns for improved flow'
      ]
    }
  }

  /**
   * Detect rhyme scheme from last words
   */
  private detectRhymeScheme(words: string[]): string {
    if (words.length === 0) return ''

    const scheme: string[] = []
    const rhymeMap: Map<string, string> = new Map()
    let currentLetter = 65 // ASCII 'A'

    for (const word of words) {
      const ending = word.slice(-2) // Simple: last 2 chars

      if (rhymeMap.has(ending)) {
        scheme.push(rhymeMap.get(ending)!)
      } else {
        const letter = String.fromCharCode(currentLetter)
        rhymeMap.set(ending, letter)
        scheme.push(letter)
        currentLetter++
      }
    }

    return scheme.join('')
  }

  /**
   * Count syllables in text (simple heuristic)
   */
  private countSyllables(text: string): number {
    const cleaned = text.toLowerCase().replace(/[^a-z\s]/g, '')
    const words = cleaned.split(/\s+/).filter(w => w.length > 0)

    let total = 0
    for (const word of words) {
      // Count vowel groups
      let count = 0
      let inVowelGroup = false

      for (const char of word) {
        const isVowel = 'aeiou'.includes(char)
        if (isVowel && !inVowelGroup) {
          count++
          inVowelGroup = true
        } else if (!isVowel) {
          inVowelGroup = false
        }
      }

      // Handle silent 'e'
      if (word.endsWith('e') && count > 1) {
        count--
      }

      total += Math.max(1, count)
    }

    return Math.max(1, total)
  }

  /**
   * Simulate processing delay (10-40ms)
   */
  private async simulateDelay(): Promise<void> {
    const delay = Math.floor(Math.random() * 30) + 10
    return new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Handle errors and convert to ServiceResponse
   */
  private handleError<T extends GenerationResponse | AnalysisResponse>(
    error: unknown,
    operation: 'generation' | 'analysis'
  ): ServiceResponse<T> {
    const errorMessage = error instanceof Error ? error.message : String(error)

    return createFailure(
      createError(
        'MOCK_ERROR',
        `Mock ${operation} failed`,
        'An unexpected error occurred in the mock provider. This should not happen.',
        errorMessage,
        error instanceof Error ? error : undefined
      )
    )
  }
}
