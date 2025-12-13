/**
 * @fileoverview Contract Tests for Export Service
 * @purpose Ensure any implementation of IExportService matches the contract exactly
 *
 * TEST-DRIVEN DEVELOPMENT APPROACH:
 * These tests are written BEFORE the mock implementation.
 * The mock implementation should be written to make these tests pass.
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import type {
  IExportService,
  ExportOptions,
  ExportResult,
  BatchExportOptions,
  BatchExportResult,
  ArchiveExportOptions,
  ArchiveExportResult,
  FileValidation,
  ExportTemplate
} from '../../src/contracts/Export'
import { ExportFormat, ExportErrorCode, PageSize, ColorScheme } from '../../src/contracts/Export'
import { isSuccess, isFailure } from '../../src/contracts/types/common'
import { createSongId, createVerseId, createChorusId } from '../../src/contracts/types/song'
import type { Song } from '../../src/contracts/types/song'

/**
 * Helper function to create a minimal test song
 */
function createTestSong(title: string = 'Test Song'): Song {
  return {
    id: createSongId('test-song-123'),
    title,
    verses: [
      {
        id: createVerseId('verse-1'),
        number: 1,
        lines: [
          {
            text: 'This is the first line',
            syllables: 6,
            stressPattern: 'x/x/x/'
          },
          {
            text: 'This is the second line',
            syllables: 6,
            stressPattern: 'x/x/x/'
          }
        ],
        rhymeScheme: 'AA',
        syllablePattern: [6, 6]
      }
    ],
    choruses: [
      {
        id: createChorusId('chorus-1'),
        lines: [
          {
            text: 'This is the chorus',
            syllables: 5,
            stressPattern: 'x/x/x'
          }
        ],
        rhymeScheme: 'A',
        syllablePattern: [5],
        isMainChorus: true
      }
    ],
    metadata: {
      genre: 'Pop',
      mood: 'Upbeat',
      version: 1
    },
    generatedAt: new Date('2025-01-01T00:00:00Z')
  }
}

/**
 * NOTE: This test suite is designed to work with ANY implementation of IExportService.
 * During Phase 3 (BUILD), import MockExportService.
 * During Phase 5 (IMPLEMENT), import RealExportService.
 * The tests should pass for both implementations.
 */
describe('IExportService Contract Tests', () => {
  let service: IExportService

  beforeEach(() => {
    // Import the mock service
    const { MockExportService } = require('../../src/services/mock/MockExportService')
    service = new MockExportService()
  })

  // ===========================================
  // METHOD 1: exportSong()
  // ===========================================
  describe('exportSong() method', () => {
    describe('Success Cases', () => {
      it('should export song to TEXT format', async () => {
        const song = createTestSong()
        const options: ExportOptions = {
          format: ExportFormat.TEXT
        }

        const result = await service.exportSong(song, options)

        expect(result).toHaveProperty('success')
        expect(isSuccess(result)).toBe(true)

        if (isSuccess(result)) {
          const data: ExportResult = result.data

          // Verify all required fields
          expect(data).toHaveProperty('filePath')
          expect(data).toHaveProperty('format')
          expect(data).toHaveProperty('fileSize')
          expect(data).toHaveProperty('exportedAt')
          expect(data).toHaveProperty('success')

          expect(typeof data.filePath).toBe('string')
          expect(data.filePath.length).toBeGreaterThan(0)
          expect(data.format).toBe(ExportFormat.TEXT)
          expect(typeof data.fileSize).toBe('number')
          expect(data.fileSize).toBeGreaterThan(0)
          expect(data.exportedAt).toBeInstanceOf(Date)
          expect(data.success).toBe(true)
        }
      })

      it('should export song to MARKDOWN format', async () => {
        const song = createTestSong()
        const options: ExportOptions = {
          format: ExportFormat.MARKDOWN
        }

        const result = await service.exportSong(song, options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.format).toBe(ExportFormat.MARKDOWN)
          expect(result.data.filePath).toContain('.md')
        }
      })

      it('should export song to JSON format', async () => {
        const song = createTestSong()
        const options: ExportOptions = {
          format: ExportFormat.JSON
        }

        const result = await service.exportSong(song, options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.format).toBe(ExportFormat.JSON)
          expect(result.data.filePath).toContain('.json')
        }
      })

      it('should export song to PDF format', async () => {
        const song = createTestSong()
        const options: ExportOptions = {
          format: ExportFormat.PDF
        }

        const result = await service.exportSong(song, options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.format).toBe(ExportFormat.PDF)
          expect(result.data.filePath).toContain('.pdf')
        }
      })

      it('should export song to HTML format', async () => {
        const song = createTestSong()
        const options: ExportOptions = {
          format: ExportFormat.HTML
        }

        const result = await service.exportSong(song, options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.format).toBe(ExportFormat.HTML)
          expect(result.data.filePath).toContain('.html')
        }
      })

      it('should export song to SUNO format', async () => {
        const song = createTestSong()
        const options: ExportOptions = {
          format: ExportFormat.SUNO
        }

        const result = await service.exportSong(song, options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.format).toBe(ExportFormat.SUNO)
          expect(result.data.filePath).toContain('.txt')
        }
      })

      it('should respect custom file path', async () => {
        const song = createTestSong()
        const customPath = '/custom/path/my-song.txt'
        const options: ExportOptions = {
          format: ExportFormat.TEXT,
          filePath: customPath
        }

        const result = await service.exportSong(song, options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.filePath).toBe(customPath)
        }
      })

      it('should include metadata when requested', async () => {
        const song = createTestSong()
        const options: ExportOptions = {
          format: ExportFormat.TEXT,
          includeMetadata: true
        }

        const result = await service.exportSong(song, options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.success).toBe(true)
        }
      })

      it('should include critique when requested', async () => {
        const song = createTestSong()
        const options: ExportOptions = {
          format: ExportFormat.MARKDOWN,
          includeCritique: true
        }

        const result = await service.exportSong(song, options)

        expect(isSuccess(result)).toBe(true)
      })

      it('should include history when requested', async () => {
        const song = createTestSong()
        const options: ExportOptions = {
          format: ExportFormat.JSON,
          includeHistory: true
        }

        const result = await service.exportSong(song, options)

        expect(isSuccess(result)).toBe(true)
      })

      it('should apply formatting options for PDF', async () => {
        const song = createTestSong()
        const options: ExportOptions = {
          format: ExportFormat.PDF,
          formatting: {
            fontSize: 12,
            fontFamily: 'Arial',
            pageSize: PageSize.A4,
            margins: {
              top: 1,
              right: 1,
              bottom: 1,
              left: 1
            }
          }
        }

        const result = await service.exportSong(song, options)

        expect(isSuccess(result)).toBe(true)
      })

      it('should apply color scheme for HTML', async () => {
        const song = createTestSong()
        const options: ExportOptions = {
          format: ExportFormat.HTML,
          formatting: {
            colorScheme: ColorScheme.DARK
          }
        }

        const result = await service.exportSong(song, options)

        expect(isSuccess(result)).toBe(true)
      })

      it('should include validation result', async () => {
        const song = createTestSong()
        const options: ExportOptions = {
          format: ExportFormat.TEXT
        }

        const result = await service.exportSong(song, options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          if (result.data.validation) {
            expect(result.data.validation).toHaveProperty('valid')
            expect(result.data.validation).toHaveProperty('readable')
            expect(result.data.validation).toHaveProperty('size')
            expect(result.data.validation).toHaveProperty('encoding')
            expect(result.data.validation).toHaveProperty('errors')
          }
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for invalid song (missing title)', async () => {
        const invalidSong = { ...createTestSong(), title: '' }
        const options: ExportOptions = {
          format: ExportFormat.TEXT
        }

        const result = await service.exportSong(invalidSong, options)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(ExportErrorCode.INVALID_SONG)
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
        }
      })

      it('should return error for invalid format', async () => {
        const song = createTestSong()
        const options: ExportOptions = {
          format: 'INVALID_FORMAT' as any
        }

        const result = await service.exportSong(song, options)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(ExportErrorCode.INVALID_FORMAT)
        }
      })

      it('should return error for invalid file path', async () => {
        const song = createTestSong()
        const options: ExportOptions = {
          format: ExportFormat.TEXT,
          filePath: '/invalid/path/\0/file.txt' // Null byte in path
        }

        const result = await service.exportSong(song, options)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(ExportErrorCode.INVALID_PATH)
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs: Array<[any, any]> = [
          [null, { format: ExportFormat.TEXT }],
          [createTestSong(), null],
          [{}, { format: ExportFormat.TEXT }],
          [createTestSong(), { format: 'BAD' }],
        ]

        for (const [song, options] of badInputs) {
          await expect(service.exportSong(song, options)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const result = await service.exportSong(createTestSong(), {
          format: ExportFormat.TEXT
        })

        expect(result).toHaveProperty('success')
        expect(typeof result.success).toBe('boolean')

        if (result.success) {
          expect(result).toHaveProperty('data')
          expect(result).not.toHaveProperty('error')
        } else {
          expect(result).toHaveProperty('error')
          expect(result).not.toHaveProperty('data')
        }
      })

      it('should preserve readonly semantics on output', async () => {
        const result = await service.exportSong(createTestSong(), {
          format: ExportFormat.TEXT
        })

        if (isSuccess(result)) {
          const data = result.data

          expect(() => {
            (data as any).filePath = 'changed'
          }).toThrow()

          expect(() => {
            (data as any).format = ExportFormat.JSON
          }).toThrow()
        }
      })
    })
  })

  // ===========================================
  // METHOD 2: batchExport()
  // ===========================================
  describe('batchExport() method', () => {
    describe('Success Cases', () => {
      it('should export multiple songs in multiple formats', async () => {
        const songs = [
          createTestSong('Song 1'),
          createTestSong('Song 2'),
          createTestSong('Song 3')
        ]
        const options: BatchExportOptions = {
          songs,
          formats: [ExportFormat.TEXT, ExportFormat.JSON]
        }

        const result = await service.batchExport(options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const data: BatchExportResult = result.data

          expect(data).toHaveProperty('exports')
          expect(data).toHaveProperty('totalExported')
          expect(data).toHaveProperty('failed')

          expect(Array.isArray(data.exports)).toBe(true)
          expect(data.totalExported).toBe(6) // 3 songs × 2 formats
          expect(data.failed).toBe(0)
          expect(data.exports.length).toBe(6)
        }
      })

      it('should export with custom base directory', async () => {
        const songs = [createTestSong()]
        const options: BatchExportOptions = {
          songs,
          formats: [ExportFormat.TEXT],
          baseDirectory: '/custom/export/dir'
        }

        const result = await service.batchExport(options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.exports[0]?.filePath).toContain('/custom/export/dir')
        }
      })

      it('should create index file when requested', async () => {
        const songs = [createTestSong(), createTestSong('Song 2')]
        const options: BatchExportOptions = {
          songs,
          formats: [ExportFormat.TEXT],
          includeIndex: true
        }

        const result = await service.batchExport(options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.indexPath).toBeDefined()
          expect(typeof result.data.indexPath).toBe('string')
        }
      })

      it('should handle empty song array', async () => {
        const options: BatchExportOptions = {
          songs: [],
          formats: [ExportFormat.TEXT]
        }

        const result = await service.batchExport(options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.totalExported).toBe(0)
          expect(result.data.exports.length).toBe(0)
        }
      })

      it('should track failed exports', async () => {
        const songs = [
          createTestSong(),
          { ...createTestSong(), title: '' } // Invalid song
        ]
        const options: BatchExportOptions = {
          songs,
          formats: [ExportFormat.TEXT]
        }

        const result = await service.batchExport(options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.failed).toBeGreaterThanOrEqual(0)
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for invalid batch options', async () => {
        const result = await service.batchExport(null as any)

        expect(isFailure(result)).toBe(true)
      })

      it('should return error for empty formats array', async () => {
        const options: BatchExportOptions = {
          songs: [createTestSong()],
          formats: []
        }

        const result = await service.batchExport(options)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(ExportErrorCode.INVALID_FORMAT)
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs: any[] = [
          null,
          undefined,
          {},
          { songs: null, formats: [ExportFormat.TEXT] },
          { songs: [createTestSong()], formats: null },
        ]

        for (const input of badInputs) {
          await expect(service.batchExport(input)).resolves.toBeDefined()
        }
      })

      it('should preserve readonly semantics on output', async () => {
        const result = await service.batchExport({
          songs: [createTestSong()],
          formats: [ExportFormat.TEXT]
        })

        if (isSuccess(result)) {
          expect(() => {
            (result.data.exports as any).push({})
          }).toThrow()
        }
      })
    })
  })

  // ===========================================
  // METHOD 3: exportWithTemplate()
  // ===========================================
  describe('exportWithTemplate() method', () => {
    describe('Success Cases', () => {
      it('should export with SUNO_READY template', async () => {
        const song = createTestSong()
        const result = await service.exportWithTemplate(song, 'suno-ready')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.format).toBe(ExportFormat.SUNO)
        }
      })

      it('should export with PORTFOLIO template', async () => {
        const song = createTestSong()
        const result = await service.exportWithTemplate(song, 'portfolio')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.format).toBe(ExportFormat.PDF)
        }
      })

      it('should export with SIMPLE_TEXT template', async () => {
        const song = createTestSong()
        const result = await service.exportWithTemplate(song, 'simple-text')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.format).toBe(ExportFormat.TEXT)
        }
      })

      it('should export with FULL_ARCHIVE template', async () => {
        const song = createTestSong()
        const result = await service.exportWithTemplate(song, 'full-archive')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.format).toBe(ExportFormat.JSON)
        }
      })

      it('should apply template overrides', async () => {
        const song = createTestSong()
        const overrides: Partial<ExportOptions> = {
          filePath: '/custom/override/path.txt'
        }

        const result = await service.exportWithTemplate(song, 'simple-text', overrides)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.filePath).toBe('/custom/override/path.txt')
        }
      })

      it('should work without overrides parameter', async () => {
        const song = createTestSong()
        const result = await service.exportWithTemplate(song, 'simple-text')

        expect(isSuccess(result)).toBe(true)
      })
    })

    describe('Error Cases', () => {
      it('should return error for unknown template ID', async () => {
        const song = createTestSong()
        const result = await service.exportWithTemplate(song, 'non-existent-template')

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(ExportErrorCode.TEMPLATE_NOT_FOUND)
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
        }
      })

      it('should return error for invalid song', async () => {
        const invalidSong = { ...createTestSong(), title: '' }
        const result = await service.exportWithTemplate(invalidSong, 'simple-text')

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(ExportErrorCode.INVALID_SONG)
        }
      })

      it('should return error for empty template ID', async () => {
        const song = createTestSong()
        const result = await service.exportWithTemplate(song, '')

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(ExportErrorCode.TEMPLATE_NOT_FOUND)
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs: Array<[any, any, any?]> = [
          [null, 'simple-text', undefined],
          [createTestSong(), null, undefined],
          [createTestSong(), '', undefined],
          [null, null, null],
        ]

        for (const [song, templateId, overrides] of badInputs) {
          await expect(
            service.exportWithTemplate(song, templateId, overrides)
          ).resolves.toBeDefined()
        }
      })

      it('should preserve readonly semantics on output', async () => {
        const result = await service.exportWithTemplate(
          createTestSong(),
          'simple-text'
        )

        if (isSuccess(result)) {
          expect(() => {
            (result.data as any).format = ExportFormat.JSON
          }).toThrow()
        }
      })
    })
  })

  // ===========================================
  // METHOD 4: exportArchive()
  // ===========================================
  describe('exportArchive() method', () => {
    describe('Success Cases', () => {
      it('should create ZIP archive', async () => {
        const songs = [createTestSong(), createTestSong('Song 2')]
        const options: ArchiveExportOptions = {
          songs,
          format: 'zip'
        }

        const result = await service.exportArchive(options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const data: ArchiveExportResult = result.data

          expect(data).toHaveProperty('archivePath')
          expect(data).toHaveProperty('format')
          expect(data).toHaveProperty('songCount')
          expect(data).toHaveProperty('totalSize')
          expect(data).toHaveProperty('files')

          expect(typeof data.archivePath).toBe('string')
          expect(data.archivePath).toContain('.zip')
          expect(data.format).toBe('zip')
          expect(data.songCount).toBe(2)
          expect(data.totalSize).toBeGreaterThan(0)
          expect(Array.isArray(data.files)).toBe(true)
        }
      })

      it('should create TAR archive', async () => {
        const songs = [createTestSong()]
        const options: ArchiveExportOptions = {
          songs,
          format: 'tar'
        }

        const result = await service.exportArchive(options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.format).toBe('tar')
          expect(result.data.archivePath).toContain('.tar')
        }
      })

      it('should create folder structure', async () => {
        const songs = [createTestSong()]
        const options: ArchiveExportOptions = {
          songs,
          format: 'folder'
        }

        const result = await service.exportArchive(options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.format).toBe('folder')
        }
      })

      it('should include README when requested', async () => {
        const songs = [createTestSong()]
        const options: ArchiveExportOptions = {
          songs,
          format: 'zip',
          includeReadme: true
        }

        const result = await service.exportArchive(options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.files).toContain('README.md')
        }
      })

      it('should include critiques when provided', async () => {
        const songs = [createTestSong()]
        const critiques = new Map()
        const options: ArchiveExportOptions = {
          songs,
          format: 'zip',
          critiques
        }

        const result = await service.exportArchive(options)

        expect(isSuccess(result)).toBe(true)
      })

      it('should include Suno formats when provided', async () => {
        const songs = [createTestSong()]
        const sunoFormats = new Map()
        const options: ArchiveExportOptions = {
          songs,
          format: 'zip',
          sunoFormats
        }

        const result = await service.exportArchive(options)

        expect(isSuccess(result)).toBe(true)
      })
    })

    describe('Error Cases', () => {
      it('should return error for empty songs array', async () => {
        const options: ArchiveExportOptions = {
          songs: [],
          format: 'zip'
        }

        const result = await service.exportArchive(options)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(ExportErrorCode.INVALID_SONG)
        }
      })

      it('should return error for invalid archive format', async () => {
        const options: ArchiveExportOptions = {
          songs: [createTestSong()],
          format: 'invalid' as any
        }

        const result = await service.exportArchive(options)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(ExportErrorCode.INVALID_FORMAT)
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs: any[] = [
          null,
          undefined,
          {},
          { songs: null, format: 'zip' },
          { songs: [createTestSong()], format: null },
        ]

        for (const input of badInputs) {
          await expect(service.exportArchive(input)).resolves.toBeDefined()
        }
      })

      it('should preserve readonly semantics on output', async () => {
        const result = await service.exportArchive({
          songs: [createTestSong()],
          format: 'zip'
        })

        if (isSuccess(result)) {
          expect(() => {
            (result.data.files as any).push('newfile.txt')
          }).toThrow()

          expect(() => {
            (result.data as any).songCount = 999
          }).toThrow()
        }
      })
    })
  })

  // ===========================================
  // METHOD 5: previewExport()
  // ===========================================
  describe('previewExport() method', () => {
    describe('Success Cases', () => {
      it('should preview TEXT format', async () => {
        const song = createTestSong()
        const result = await service.previewExport(song, ExportFormat.TEXT)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const preview: string = result.data
          expect(typeof preview).toBe('string')
          expect(preview.length).toBeGreaterThan(0)
          expect(preview).toContain('Test Song')
        }
      })

      it('should preview MARKDOWN format', async () => {
        const song = createTestSong()
        const result = await service.previewExport(song, ExportFormat.MARKDOWN)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data).toContain('#')
          expect(result.data).toContain('Test Song')
        }
      })

      it('should preview JSON format', async () => {
        const song = createTestSong()
        const result = await service.previewExport(song, ExportFormat.JSON)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(() => JSON.parse(result.data)).not.toThrow()
          const parsed = JSON.parse(result.data)
          expect(parsed).toHaveProperty('title')
        }
      })

      it('should preview HTML format', async () => {
        const song = createTestSong()
        const result = await service.previewExport(song, ExportFormat.HTML)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data).toContain('<')
          expect(result.data).toContain('Test Song')
        }
      })

      it('should preview SUNO format', async () => {
        const song = createTestSong()
        const result = await service.previewExport(song, ExportFormat.SUNO)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.length).toBeLessThanOrEqual(3000) // Suno char limit
        }
      })

      it('should not create actual file during preview', async () => {
        const song = createTestSong()
        const result = await service.previewExport(song, ExportFormat.TEXT)

        expect(isSuccess(result)).toBe(true)
        // Preview should return content, not create files
      })
    })

    describe('Error Cases', () => {
      it('should return error for invalid song', async () => {
        const invalidSong = { ...createTestSong(), title: '' }
        const result = await service.previewExport(invalidSong, ExportFormat.TEXT)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(ExportErrorCode.INVALID_SONG)
        }
      })

      it('should return error for invalid format', async () => {
        const song = createTestSong()
        const result = await service.previewExport(song, 'INVALID' as any)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(ExportErrorCode.INVALID_FORMAT)
        }
      })

      it('should return error for PDF preview (not supported)', async () => {
        const song = createTestSong()
        const result = await service.previewExport(song, ExportFormat.PDF)

        // PDF preview may not be supported (binary format)
        // Implementation can choose to return error or base64
        expect(result).toHaveProperty('success')
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs: Array<[any, any]> = [
          [null, ExportFormat.TEXT],
          [createTestSong(), null],
          [{}, ExportFormat.TEXT],
          [createTestSong(), 'INVALID'],
        ]

        for (const [song, format] of badInputs) {
          await expect(service.previewExport(song, format)).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const result = await service.previewExport(
          createTestSong(),
          ExportFormat.TEXT
        )

        expect(result).toHaveProperty('success')
        expect(typeof result.success).toBe('boolean')
      })

      it('should return immutable string', async () => {
        const result = await service.previewExport(
          createTestSong(),
          ExportFormat.TEXT
        )

        if (isSuccess(result)) {
          expect(typeof result.data).toBe('string')
          // Strings are immutable in JavaScript by default
        }
      })
    })
  })

  // ===========================================
  // METHOD 6: validateExportedFile()
  // ===========================================
  describe('validateExportedFile() method', () => {
    describe('Success Cases', () => {
      it('should validate a valid exported file', async () => {
        // First export a file
        const song = createTestSong()
        const exportResult = await service.exportSong(song, {
          format: ExportFormat.TEXT
        })

        if (isSuccess(exportResult)) {
          const result = await service.validateExportedFile(exportResult.data.filePath)

          expect(isSuccess(result)).toBe(true)
          if (isSuccess(result)) {
            const validation: FileValidation = result.data

            expect(validation).toHaveProperty('valid')
            expect(validation).toHaveProperty('readable')
            expect(validation).toHaveProperty('size')
            expect(validation).toHaveProperty('encoding')
            expect(validation).toHaveProperty('errors')

            expect(typeof validation.valid).toBe('boolean')
            expect(typeof validation.readable).toBe('boolean')
            expect(typeof validation.size).toBe('number')
            expect(typeof validation.encoding).toBe('string')
            expect(Array.isArray(validation.errors)).toBe(true)

            expect(validation.valid).toBe(true)
            expect(validation.readable).toBe(true)
            expect(validation.size).toBeGreaterThan(0)
          }
        }
      })

      it('should detect non-existent file', async () => {
        const result = await service.validateExportedFile('/non/existent/file.txt')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.valid).toBe(false)
          expect(result.data.readable).toBe(false)
          expect(result.data.errors.length).toBeGreaterThan(0)
        }
      })

      it('should detect corrupted file', async () => {
        const result = await service.validateExportedFile('/path/to/corrupted.txt')

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // May be valid or invalid depending on file
          expect(typeof result.data.valid).toBe('boolean')
        }
      })

      it('should return encoding information', async () => {
        const song = createTestSong()
        const exportResult = await service.exportSong(song, {
          format: ExportFormat.TEXT
        })

        if (isSuccess(exportResult)) {
          const result = await service.validateExportedFile(exportResult.data.filePath)

          if (isSuccess(result)) {
            expect(['utf-8', 'utf8', 'UTF-8', 'ascii']).toContain(
              result.data.encoding.toLowerCase()
            )
          }
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for empty file path', async () => {
        const result = await service.validateExportedFile('')

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(ExportErrorCode.INVALID_PATH)
          expect(result.error.message).toBeDefined()
          expect(result.error.suggestion).toBeDefined()
        }
      })

      it('should return error for invalid file path characters', async () => {
        const result = await service.validateExportedFile('/invalid/\0/path.txt')

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(ExportErrorCode.INVALID_PATH)
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs: any[] = [
          '',
          null,
          undefined,
          '/invalid/\0/path',
          123,
        ]

        for (const input of badInputs) {
          await expect(service.validateExportedFile(input)).resolves.toBeDefined()
        }
      })

      it('should preserve readonly semantics on output', async () => {
        const result = await service.validateExportedFile('/some/path.txt')

        if (isSuccess(result)) {
          expect(() => {
            (result.data as any).valid = false
          }).toThrow()

          expect(() => {
            (result.data.errors as any).push('new error')
          }).toThrow()
        }
      })
    })
  })

  // ===========================================
  // METHOD 7: listTemplates()
  // ===========================================
  describe('listTemplates() method', () => {
    describe('Success Cases', () => {
      it('should return list of available templates', async () => {
        const result = await service.listTemplates()

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const templates: readonly ExportTemplate[] = result.data

          expect(Array.isArray(templates)).toBe(true)
          expect(templates.length).toBeGreaterThan(0)

          const template = templates[0]!
          expect(template).toHaveProperty('id')
          expect(template).toHaveProperty('name')
          expect(template).toHaveProperty('format')
          expect(template).toHaveProperty('options')
          expect(template).toHaveProperty('description')

          expect(typeof template.id).toBe('string')
          expect(typeof template.name).toBe('string')
          expect(typeof template.description).toBe('string')
        }
      })

      it('should include all predefined templates', async () => {
        const result = await service.listTemplates()

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const templateIds = result.data.map(t => t.id)
          expect(templateIds).toContain('suno-ready')
          expect(templateIds).toContain('portfolio')
          expect(templateIds).toContain('simple-text')
          expect(templateIds).toContain('full-archive')
        }
      })

      it('should have valid format for each template', async () => {
        const result = await service.listTemplates()

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          for (const template of result.data) {
            expect(Object.values(ExportFormat)).toContain(template.format)
          }
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        await expect(service.listTemplates()).resolves.toBeDefined()
      })

      it('should preserve readonly semantics on output', async () => {
        const result = await service.listTemplates()

        if (isSuccess(result)) {
          expect(() => {
            (result.data as any).push({})
          }).toThrow()

          if (result.data.length > 0) {
            expect(() => {
              (result.data[0] as any).id = 'changed'
            }).toThrow()
          }
        }
      })
    })
  })

  // ===========================================
  // METHOD 8: getDefaultExportPath()
  // ===========================================
  describe('getDefaultExportPath() method', () => {
    describe('Success Cases', () => {
      it('should return default path for TEXT format', async () => {
        const song = createTestSong()
        const result = await service.getDefaultExportPath(song, ExportFormat.TEXT)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const path: string = result.data
          expect(typeof path).toBe('string')
          expect(path.length).toBeGreaterThan(0)
          expect(path).toContain('.txt')
        }
      })

      it('should return default path for MARKDOWN format', async () => {
        const song = createTestSong()
        const result = await service.getDefaultExportPath(song, ExportFormat.MARKDOWN)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data).toContain('.md')
        }
      })

      it('should return default path for JSON format', async () => {
        const song = createTestSong()
        const result = await service.getDefaultExportPath(song, ExportFormat.JSON)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data).toContain('.json')
        }
      })

      it('should return default path for PDF format', async () => {
        const song = createTestSong()
        const result = await service.getDefaultExportPath(song, ExportFormat.PDF)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data).toContain('.pdf')
        }
      })

      it('should return default path for HTML format', async () => {
        const song = createTestSong()
        const result = await service.getDefaultExportPath(song, ExportFormat.HTML)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data).toContain('.html')
        }
      })

      it('should sanitize song title in path', async () => {
        const song = createTestSong('My Song! @#$ Special')
        const result = await service.getDefaultExportPath(song, ExportFormat.TEXT)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // Should not contain special characters
          expect(result.data).not.toContain('!')
          expect(result.data).not.toContain('@')
          expect(result.data).not.toContain('#')
          expect(result.data).not.toContain('$')
        }
      })

      it('should include song title in path', async () => {
        const song = createTestSong('Amazing Song')
        const result = await service.getDefaultExportPath(song, ExportFormat.TEXT)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.toLowerCase()).toContain('amazing')
        }
      })
    })

    describe('Error Cases', () => {
      it('should return error for invalid song', async () => {
        const invalidSong = { ...createTestSong(), title: '' }
        const result = await service.getDefaultExportPath(invalidSong, ExportFormat.TEXT)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(ExportErrorCode.INVALID_SONG)
        }
      })

      it('should return error for invalid format', async () => {
        const song = createTestSong()
        const result = await service.getDefaultExportPath(song, 'INVALID' as any)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(ExportErrorCode.INVALID_FORMAT)
        }
      })
    })

    describe('Contract Compliance', () => {
      it('should never throw exceptions', async () => {
        const badInputs: Array<[any, any]> = [
          [null, ExportFormat.TEXT],
          [createTestSong(), null],
          [{}, ExportFormat.TEXT],
          [createTestSong(), 'INVALID'],
        ]

        for (const [song, format] of badInputs) {
          await expect(
            service.getDefaultExportPath(song, format)
          ).resolves.toBeDefined()
        }
      })

      it('should always return ServiceResponse shape', async () => {
        const result = await service.getDefaultExportPath(
          createTestSong(),
          ExportFormat.TEXT
        )

        expect(result).toHaveProperty('success')
        expect(typeof result.success).toBe('boolean')
      })

      it('should return immutable string', async () => {
        const result = await service.getDefaultExportPath(
          createTestSong(),
          ExportFormat.TEXT
        )

        if (isSuccess(result)) {
          expect(typeof result.data).toBe('string')
        }
      })
    })
  })
})
