/**
 * @fileoverview ServiceFactory Integration Tests
 * @purpose Verify service factory and provider integration with mock services
 * @phase Phase 3 - BUILD (Service Infrastructure)
 * @created 2025-11-17
 */

import { ServiceFactory, ServiceMode } from '../../src/services/ServiceFactory'
import { CritiqueLevel } from '../../src/contracts/CritiqueEngine'

describe('ServiceFactory', () => {
  beforeEach(async () => {
    // Reset factory before each test
    await ServiceFactory.dispose()
    ServiceFactory.reset()
  })

  afterEach(async () => {
    // Clean up after each test
    await ServiceFactory.dispose()
    ServiceFactory.reset()
  })

  describe('Initialization', () => {
    it('should initialize with mock mode', async () => {
      await ServiceFactory.initializeMock()

      expect(ServiceFactory.isInitialized()).toBe(true)
      expect(ServiceFactory.getMode()).toBe(ServiceMode.MOCK)
    })

    it('should throw error if not initialized', () => {
      expect(() => {
        ServiceFactory.getInputValidationService()
      }).toThrow('ServiceFactory not initialized')
    })

    it('should allow re-initialization', async () => {
      await ServiceFactory.initializeMock()
      expect(ServiceFactory.isInitialized()).toBe(true)

      // Re-initialize (should dispose old and create new)
      await ServiceFactory.initializeMock()
      expect(ServiceFactory.isInitialized()).toBe(true)
    })
  })

  describe('Service Access - Wave 1 (Foundation Services)', () => {
    beforeEach(async () => {
      await ServiceFactory.initializeMock()
    })

    it('should provide InputValidationService', () => {
      const service = ServiceFactory.getInputValidationService()
      expect(service).toBeDefined()
      expect(typeof service.validate).toBe('function')
      expect(typeof service.isValid).toBe('function')
      expect(typeof service.sanitize).toBe('function')
    })

    it('should provide RhymeAnalysisService', () => {
      const service = ServiceFactory.getRhymeAnalysisService()
      expect(service).toBeDefined()
      expect(typeof service.analyzeLines).toBe('function')
      expect(typeof service.detectScheme).toBe('function')
    })

    it('should provide SyllableCountingService', () => {
      const service = ServiceFactory.getSyllableCountingService()
      expect(service).toBeDefined()
      expect(typeof service.countSyllables).toBe('function')
      expect(typeof service.analyzeLines).toBe('function')
    })

    it('should return same instance on multiple calls (singleton)', () => {
      const service1 = ServiceFactory.getInputValidationService()
      const service2 = ServiceFactory.getInputValidationService()
      expect(service1).toBe(service2)
    })
  })

  describe('Service Access - Wave 2 (Core Generation)', () => {
    beforeEach(async () => {
      await ServiceFactory.initializeMock()
    })

    it('should provide SongGenerationService', () => {
      const service = ServiceFactory.getSongGenerationService()
      expect(service).toBeDefined()
      expect(typeof service.generate).toBe('function')
    })

    it('should provide CritiqueEngineService', () => {
      const service = ServiceFactory.getCritiqueEngineService()
      expect(service).toBeDefined()
      expect(typeof service.analyzeSong).toBe('function')
    })
  })

  describe('Service Access - Wave 3 (Improvement Loop)', () => {
    beforeEach(async () => {
      await ServiceFactory.initializeMock()
    })

    it('should provide RevisionEngineService', () => {
      const service = ServiceFactory.getRevisionEngineService()
      expect(service).toBeDefined()
      expect(typeof service.reviseSong).toBe('function')
    })
  })

  describe('Service Access - Wave 4 (Output & Persistence)', () => {
    beforeEach(async () => {
      await ServiceFactory.initializeMock()
    })

    it('should provide SunoFormatterService', () => {
      const service = ServiceFactory.getSunoFormatterService()
      expect(service).toBeDefined()
      expect(typeof service.formatSong).toBe('function')
    })

    it('should provide ExportService', () => {
      const service = ServiceFactory.getExportService()
      expect(service).toBeDefined()
      expect(typeof service.exportSong).toBe('function')
    })

    it('should provide HistoryService', () => {
      const service = ServiceFactory.getHistoryService()
      expect(service).toBeDefined()
      expect(typeof service.saveVersion).toBe('function')
      expect(typeof service.getHistory).toBe('function')
    })
  })

  describe('Service Access - Wave 5 (Advanced Features)', () => {
    beforeEach(async () => {
      await ServiceFactory.initializeMock()
    })

    it('should provide GeminiAudioService', () => {
      const service = ServiceFactory.getGeminiAudioService()
      expect(service).toBeDefined()
      expect(typeof service.analyzeAudio).toBe('function')
    })
  })

  describe('Integration Test - Full Service Chain', () => {
    beforeEach(async () => {
      await ServiceFactory.initializeMock()
    })

    it('should successfully validate input with InputValidationService', async () => {
      const validator = ServiceFactory.getInputValidationService()

      const result = await validator.validate({
        prompt: 'Write a song about summer love'
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.validatedPrompt.prompt).toBeDefined()
        expect(result.data.validatedPrompt.sanitized).toBe(true)
      }
    })

    it('should successfully generate song with SongGenerationService', async () => {
      const validator = ServiceFactory.getInputValidationService()
      const generator = ServiceFactory.getSongGenerationService()

      // First validate
      const validationResult = await validator.validate({
        prompt: 'Write a rock song about freedom'
      })
      expect(validationResult.success).toBe(true)

      if (validationResult.success) {
        // Then generate
        const generationResult = await generator.generate({
          prompt: validationResult.data.validatedPrompt
        })
        expect(generationResult.success).toBe(true)
        if (generationResult.success) {
          expect(generationResult.data.song.title).toBeDefined()
          expect(generationResult.data.song.verses.length).toBeGreaterThan(0)
        }
      }
    })

    it('should successfully critique song with CritiqueEngineService', async () => {
      const validator = ServiceFactory.getInputValidationService()
      const generator = ServiceFactory.getSongGenerationService()
      const critic = ServiceFactory.getCritiqueEngineService()

      // Validate → Generate → Critique
      const validationResult = await validator.validate({
        prompt: 'Write a pop song about dreams'
      })
      expect(validationResult.success).toBe(true)

      if (validationResult.success) {
        const generationResult = await generator.generate({
          prompt: validationResult.data.validatedPrompt
        })
        expect(generationResult.success).toBe(true)

        if (generationResult.success) {
          const critiqueResult = await critic.analyzeSong(
            generationResult.data.song,
            CritiqueLevel.PROFESSIONAL
          )
          expect(critiqueResult.success).toBe(true)
          if (critiqueResult.success) {
            expect(critiqueResult.data.overallScore).toBeGreaterThanOrEqual(0)
            expect(critiqueResult.data.overallScore).toBeLessThanOrEqual(100)
          }
        }
      }
    })

    it('should format song for Suno with SunoFormatterService', async () => {
      const validator = ServiceFactory.getInputValidationService()
      const generator = ServiceFactory.getSongGenerationService()
      const formatter = ServiceFactory.getSunoFormatterService()

      // Validate → Generate → Format
      const validationResult = await validator.validate({
        prompt: 'Write a country song about home'
      })
      expect(validationResult.success).toBe(true)

      if (validationResult.success) {
        const generationResult = await generator.generate({
          prompt: validationResult.data.validatedPrompt
        })
        expect(generationResult.success).toBe(true)

        if (generationResult.success) {
          const formatResult = await formatter.formatSong(
            generationResult.data.song,
            {
              version: 'v5.0' as any,
              includeTags: true
            }
          )
          expect(formatResult.success).toBe(true)
        }
      }
    })
  })

  describe('Disposal and Cleanup', () => {
    it('should dispose and reset properly', async () => {
      await ServiceFactory.initializeMock()
      expect(ServiceFactory.isInitialized()).toBe(true)

      await ServiceFactory.dispose()
      ServiceFactory.reset()

      expect(() => {
        ServiceFactory.getInputValidationService()
      }).toThrow('ServiceFactory not initialized')
    })

    it('should allow re-initialization after disposal', async () => {
      await ServiceFactory.initializeMock()
      const service1 = ServiceFactory.getInputValidationService()

      await ServiceFactory.dispose()
      ServiceFactory.reset()

      await ServiceFactory.initializeMock()
      const service2 = ServiceFactory.getInputValidationService()

      // Should be different instances after reset
      expect(service1).not.toBe(service2)
    })
  })
})
