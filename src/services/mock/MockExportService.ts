/**
 * @fileoverview Mock Implementation of Export Service
 * @purpose Provide realistic mock for UI development and testing
 * @phase Phase 3 - BUILD (TDD)
 * @updated 2025-11-15
 *
 * This mock implementation:
 * - Returns realistic data that matches the contract exactly
 * - Handles all error cases defined in the contract
 * - Never throws exceptions - always returns ServiceResponse
 * - Uses readonly properties correctly (build values BEFORE creating objects)
 * - Passes all tests in Export.test.ts
 */

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
} from '../../contracts/Export'
import {
  ExportFormat,
  ExportErrorCode,
  EXPORT_TEMPLATES,
  getFileExtension,
  sanitizeFilename
} from '../../contracts/Export'
import {
  createSuccess,
  createFailure,
  createError,
  type ServiceResponse,
  type ServiceFailure
} from '../../contracts/types/common'
import type { Song } from '../../contracts/types/song'

/**
 * Mock file system to track "exported" files
 */
const mockFileSystem = new Map<string, string>()

/**
 * Mock implementation of Export Service
 *
 * Provides realistic export functionality for testing and UI development.
 * Simulates file operations without actually writing to disk.
 */
export class MockExportService implements IExportService {
  /**
   * Export song to specified format
   */
  async exportSong(
    song: Song,
    options: ExportOptions
  ): Promise<ServiceResponse<ExportResult>> {
    // Validate song
    const songValidation = this.validateSong(song)
    if (songValidation) {
      return songValidation
    }

    // Validate options
    if (!options || typeof options !== 'object') {
      return createFailure(
        createError(
          ExportErrorCode.INVALID_FORMAT,
          'Export options are required',
          'Please provide valid export options'
        )
      )
    }

    // Validate format
    if (!options.format || !Object.values(ExportFormat).includes(options.format)) {
      return createFailure(
        createError(
          ExportErrorCode.INVALID_FORMAT,
          'Invalid export format',
          `Please use one of: ${Object.values(ExportFormat).join(', ')}`
        )
      )
    }

    // Validate custom file path if provided
    if (options.filePath) {
      const pathValidation = this.validateFilePath(options.filePath)
      if (pathValidation) {
        return pathValidation
      }
    }

    // Generate file path
    const filePath = options.filePath || this.generateDefaultPath(song, options.format)

    // Generate export content
    const content = this.generateExportContent(song, options)

    // Calculate file size
    const fileSize = Buffer.byteLength(content, 'utf-8')

    // Store in mock file system
    mockFileSystem.set(filePath, content)

    // Create validation result
    const validation: FileValidation = Object.freeze({
      valid: true,
      readable: true,
      size: fileSize,
      encoding: 'utf-8',
      errors: Object.freeze([])
    })

    // Build export result
    const result: ExportResult = Object.freeze({
      filePath,
      format: options.format,
      fileSize,
      exportedAt: new Date(),
      success: true,
      validation
    })

    return createSuccess(result)
  }

  /**
   * Export multiple songs at once
   */
  async batchExport(
    options: BatchExportOptions
  ): Promise<ServiceResponse<BatchExportResult>> {
    // Validate options
    if (!options || typeof options !== 'object') {
      return createFailure(
        createError(
          ExportErrorCode.EXPORT_FAILED,
          'Batch export options are required',
          'Please provide valid batch export options'
        )
      )
    }

    // Validate songs array
    if (!Array.isArray(options.songs)) {
      return createFailure(
        createError(
          ExportErrorCode.INVALID_SONG,
          'Songs array is required',
          'Please provide an array of songs to export'
        )
      )
    }

    // Validate formats array
    if (!Array.isArray(options.formats) || options.formats.length === 0) {
      return createFailure(
        createError(
          ExportErrorCode.INVALID_FORMAT,
          'At least one export format is required',
          'Please provide at least one format to export to'
        )
      )
    }

    // Handle empty songs array (success with 0 exports)
    if (options.songs.length === 0) {
      const result: BatchExportResult = Object.freeze({
        exports: Object.freeze([]),
        totalExported: 0,
        failed: 0
      })
      return createSuccess(result)
    }

    // Export each song in each format
    const exports: ExportResult[] = []
    let failedCount = 0

    for (const song of options.songs) {
      for (const format of options.formats) {
        const exportOptions: ExportOptions = {
          format,
          filePath: options.baseDirectory
            ? `${options.baseDirectory}/${sanitizeFilename(song.title)}${getFileExtension(format)}`
            : undefined
        }

        const exportResult = await this.exportSong(song, exportOptions)

        if (exportResult.success) {
          exports.push(exportResult.data)
        } else {
          failedCount++
        }
      }
    }

    // Generate index file if requested
    let indexPath: string | undefined
    if (options.includeIndex && exports.length > 0) {
      const baseDir = options.baseDirectory || '/exports'
      indexPath = `${baseDir}/index.md`
      const indexContent = this.generateIndexFile(options.songs, exports)
      mockFileSystem.set(indexPath, indexContent)
    }

    // Build batch result
    const result: BatchExportResult = Object.freeze({
      exports: Object.freeze(exports),
      totalExported: exports.length,
      failed: failedCount,
      indexPath
    })

    return createSuccess(result)
  }

  /**
   * Export song using predefined template
   */
  async exportWithTemplate(
    song: Song,
    templateId: string,
    overrides?: Partial<ExportOptions>
  ): Promise<ServiceResponse<ExportResult>> {
    // Validate template ID
    if (!templateId || typeof templateId !== 'string' || templateId.trim().length === 0) {
      return createFailure(
        createError(
          ExportErrorCode.TEMPLATE_NOT_FOUND,
          'Template ID is required',
          'Please provide a valid template ID'
        )
      )
    }

    // Find template
    const template = this.findTemplate(templateId)
    if (!template) {
      return createFailure(
        createError(
          ExportErrorCode.TEMPLATE_NOT_FOUND,
          `Template "${templateId}" not found`,
          'Use listTemplates() to see available templates'
        )
      )
    }

    // Merge template options with overrides
    const options: ExportOptions = {
      ...template.options,
      ...overrides,
      format: template.format // Template format cannot be overridden
    }

    // Export using merged options
    return this.exportSong(song, options)
  }

  /**
   * Export to archive (zip/tar) with multiple formats
   */
  async exportArchive(
    options: ArchiveExportOptions
  ): Promise<ServiceResponse<ArchiveExportResult>> {
    // Validate options
    if (!options || typeof options !== 'object') {
      return createFailure(
        createError(
          ExportErrorCode.EXPORT_FAILED,
          'Archive export options are required',
          'Please provide valid archive export options'
        )
      )
    }

    // Validate songs array
    if (!Array.isArray(options.songs) || options.songs.length === 0) {
      return createFailure(
        createError(
          ExportErrorCode.INVALID_SONG,
          'At least one song is required for archive',
          'Please provide at least one song to archive'
        )
      )
    }

    // Validate format
    const validFormats = ['zip', 'tar', 'folder']
    if (!validFormats.includes(options.format)) {
      return createFailure(
        createError(
          ExportErrorCode.INVALID_FORMAT,
          'Invalid archive format',
          `Please use one of: ${validFormats.join(', ')}`
        )
      )
    }

    // Generate archive path
    const extension = options.format === 'folder' ? '' : `.${options.format}`
    const archivePath = `/exports/archive_${Date.now()}${extension}`

    // Collect all files to include in archive
    const files: string[] = []
    let totalSize = 0

    // Export each song to all standard formats
    for (const song of options.songs) {
      const songFormats = [ExportFormat.TEXT, ExportFormat.JSON, ExportFormat.MARKDOWN]

      for (const format of songFormats) {
        const exportResult = await this.exportSong(song, { format })

        if (exportResult.success) {
          const filename = `${sanitizeFilename(song.title)}${getFileExtension(format)}`
          files.push(filename)
          totalSize += exportResult.data.fileSize
        }
      }

      // Include critique if provided
      if (options.critiques?.has(song.id)) {
        const critiqueFile = `${sanitizeFilename(song.title)}_critique.md`
        files.push(critiqueFile)
        totalSize += 1000 // Mock size
      }

      // Include Suno format if provided
      if (options.sunoFormats?.has(song.id)) {
        const sunoFile = `${sanitizeFilename(song.title)}_suno.txt`
        files.push(sunoFile)
        totalSize += 500 // Mock size
      }
    }

    // Add README if requested
    if (options.includeReadme) {
      files.push('README.md')
      const readmeContent = this.generateReadme(options.songs)
      totalSize += Buffer.byteLength(readmeContent, 'utf-8')
    }

    // Build archive result
    const result: ArchiveExportResult = Object.freeze({
      archivePath,
      format: options.format,
      songCount: options.songs.length,
      totalSize,
      files: Object.freeze(files)
    })

    return createSuccess(result)
  }

  /**
   * Preview export output without saving to file
   */
  async previewExport(
    song: Song,
    format: ExportFormat
  ): Promise<ServiceResponse<string>> {
    // Validate song
    const songValidation = this.validateSong(song)
    if (songValidation) {
      return songValidation
    }

    // Validate format
    if (!format || !Object.values(ExportFormat).includes(format)) {
      return createFailure(
        createError(
          ExportErrorCode.INVALID_FORMAT,
          'Invalid export format',
          `Please use one of: ${Object.values(ExportFormat).join(', ')}`
        )
      )
    }

    // PDF preview returns error (binary format)
    if (format === ExportFormat.PDF) {
      return createFailure(
        createError(
          ExportErrorCode.FORMAT_CONVERSION_FAILED,
          'PDF preview not supported',
          'PDF is a binary format and cannot be previewed as text'
        )
      )
    }

    // Generate preview content
    const options: ExportOptions = { format }
    const content = this.generateExportContent(song, options)

    return createSuccess(content)
  }

  /**
   * Validate export file
   */
  async validateExportedFile(
    filePath: string
  ): Promise<ServiceResponse<FileValidation>> {
    // Validate file path
    if (!filePath || typeof filePath !== 'string' || filePath.trim().length === 0) {
      return createFailure(
        createError(
          ExportErrorCode.INVALID_PATH,
          'File path is required',
          'Please provide a valid file path to validate'
        )
      )
    }

    // Check for invalid characters
    if (filePath.includes('\0')) {
      return createFailure(
        createError(
          ExportErrorCode.INVALID_PATH,
          'File path contains invalid characters',
          'File path cannot contain null bytes'
        )
      )
    }

    // Check if file exists in mock file system
    const content = mockFileSystem.get(filePath)
    const exists = content !== undefined

    const errors: string[] = []
    if (!exists) {
      errors.push('File does not exist')
    }

    // Build validation result
    const validation: FileValidation = Object.freeze({
      valid: exists,
      readable: exists,
      size: exists ? Buffer.byteLength(content, 'utf-8') : 0,
      encoding: 'utf-8',
      errors: Object.freeze(errors)
    })

    return createSuccess(validation)
  }

  /**
   * Get list of available export templates
   */
  async listTemplates(): Promise<ServiceResponse<readonly ExportTemplate[]>> {
    const templates: ExportTemplate[] = [
      {
        id: EXPORT_TEMPLATES.SUNO_READY.id,
        name: EXPORT_TEMPLATES.SUNO_READY.name,
        format: EXPORT_TEMPLATES.SUNO_READY.format,
        options: {
          format: EXPORT_TEMPLATES.SUNO_READY.format,
          includeMetadata: false,
          includeCritique: false
        },
        description: EXPORT_TEMPLATES.SUNO_READY.description
      },
      {
        id: EXPORT_TEMPLATES.PORTFOLIO.id,
        name: EXPORT_TEMPLATES.PORTFOLIO.name,
        format: EXPORT_TEMPLATES.PORTFOLIO.format,
        options: {
          format: EXPORT_TEMPLATES.PORTFOLIO.format,
          includeMetadata: true,
          includeCritique: true
        },
        description: EXPORT_TEMPLATES.PORTFOLIO.description
      },
      {
        id: EXPORT_TEMPLATES.SIMPLE_TEXT.id,
        name: EXPORT_TEMPLATES.SIMPLE_TEXT.name,
        format: EXPORT_TEMPLATES.SIMPLE_TEXT.format,
        options: {
          format: EXPORT_TEMPLATES.SIMPLE_TEXT.format,
          includeMetadata: false,
          includeCritique: false
        },
        description: EXPORT_TEMPLATES.SIMPLE_TEXT.description
      },
      {
        id: EXPORT_TEMPLATES.FULL_ARCHIVE.id,
        name: EXPORT_TEMPLATES.FULL_ARCHIVE.name,
        format: EXPORT_TEMPLATES.FULL_ARCHIVE.format,
        options: {
          format: EXPORT_TEMPLATES.FULL_ARCHIVE.format,
          includeMetadata: true,
          includeCritique: true,
          includeHistory: true
        },
        description: EXPORT_TEMPLATES.FULL_ARCHIVE.description
      }
    ]

    // Freeze all templates
    const frozenTemplates = templates.map(t => Object.freeze({
      ...t,
      options: Object.freeze(t.options)
    }))

    return createSuccess(Object.freeze(frozenTemplates))
  }

  /**
   * Get default export path for a song
   */
  async getDefaultExportPath(
    song: Song,
    format: ExportFormat
  ): Promise<ServiceResponse<string>> {
    // Validate song
    const songValidation = this.validateSong(song)
    if (songValidation) {
      return songValidation
    }

    // Validate format
    if (!format || !Object.values(ExportFormat).includes(format)) {
      return createFailure(
        createError(
          ExportErrorCode.INVALID_FORMAT,
          'Invalid export format',
          `Please use one of: ${Object.values(ExportFormat).join(', ')}`
        )
      )
    }

    // Generate default path
    const path = this.generateDefaultPath(song, format)

    return createSuccess(path)
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Validate song object
   */
  private validateSong(song: Song): ServiceFailure | null {
    if (!song || typeof song !== 'object') {
      return createFailure(
        createError(
          ExportErrorCode.INVALID_SONG,
          'Song object is required',
          'Please provide a valid song object'
        )
      )
    }

    if (!song.title || song.title.trim().length === 0) {
      return createFailure(
        createError(
          ExportErrorCode.INVALID_SONG,
          'Song title is required',
          'Please ensure the song has a non-empty title'
        )
      )
    }

    return null
  }

  /**
   * Validate file path
   */
  private validateFilePath(filePath: string): ServiceFailure | null {
    if (filePath.includes('\0')) {
      return createFailure(
        createError(
          ExportErrorCode.INVALID_PATH,
          'File path contains invalid characters',
          'File path cannot contain null bytes'
        )
      )
    }

    return null
  }

  /**
   * Generate default file path for song
   */
  private generateDefaultPath(song: Song, format: ExportFormat): string {
    const sanitizedTitle = sanitizeFilename(song.title)
    const extension = getFileExtension(format)
    return `/exports/${sanitizedTitle}${extension}`
  }

  /**
   * Generate export content based on format
   */
  private generateExportContent(song: Song, options: ExportOptions): string {
    switch (options.format) {
      case ExportFormat.TEXT:
        return this.generateTextContent(song, options)
      case ExportFormat.MARKDOWN:
        return this.generateMarkdownContent(song, options)
      case ExportFormat.JSON:
        return this.generateJsonContent(song, options)
      case ExportFormat.HTML:
        return this.generateHtmlContent(song, options)
      case ExportFormat.SUNO:
        return this.generateSunoContent(song)
      case ExportFormat.PDF:
        return '[PDF Binary Content]' // Mock PDF content
      default:
        return ''
    }
  }

  /**
   * Generate plain text content
   */
  private generateTextContent(song: Song, options: ExportOptions): string {
    let content = ''

    // Title
    content += `${song.title}\n`
    content += '='.repeat(song.title.length) + '\n\n'

    // Metadata
    if (options.includeMetadata) {
      content += 'Metadata:\n'
      if (song.metadata.genre) content += `Genre: ${song.metadata.genre}\n`
      if (song.metadata.mood) content += `Mood: ${song.metadata.mood}\n`
      if (song.metadata.theme) content += `Theme: ${song.metadata.theme}\n`
      content += '\n'
    }

    // Verses
    for (const verse of song.verses) {
      content += `Verse ${verse.number}:\n`
      for (const line of verse.lines) {
        content += `${line.text}\n`
      }
      content += '\n'
    }

    // Choruses
    for (let i = 0; i < song.choruses.length; i++) {
      const chorus = song.choruses[i]!
      content += `Chorus${song.choruses.length > 1 ? ` ${i + 1}` : ''}:\n`
      for (const line of chorus.lines) {
        content += `${line.text}\n`
      }
      content += '\n'
    }

    // Bridge
    if (song.bridge) {
      content += 'Bridge:\n'
      for (const line of song.bridge.lines) {
        content += `${line.text}\n`
      }
      content += '\n'
    }

    return content
  }

  /**
   * Generate Markdown content
   */
  private generateMarkdownContent(song: Song, options: ExportOptions): string {
    let content = ''

    // Title
    content += `# ${song.title}\n\n`

    // Metadata
    if (options.includeMetadata) {
      content += '## Metadata\n\n'
      if (song.metadata.genre) content += `- **Genre:** ${song.metadata.genre}\n`
      if (song.metadata.mood) content += `- **Mood:** ${song.metadata.mood}\n`
      if (song.metadata.theme) content += `- **Theme:** ${song.metadata.theme}\n`
      content += '\n'
    }

    // Verses
    content += '## Lyrics\n\n'
    for (const verse of song.verses) {
      content += `### Verse ${verse.number}\n\n`
      for (const line of verse.lines) {
        content += `${line.text}  \n`
      }
      content += '\n'
    }

    // Choruses
    for (let i = 0; i < song.choruses.length; i++) {
      const chorus = song.choruses[i]!
      content += `### Chorus${song.choruses.length > 1 ? ` ${i + 1}` : ''}\n\n`
      for (const line of chorus.lines) {
        content += `${line.text}  \n`
      }
      content += '\n'
    }

    // Bridge
    if (song.bridge) {
      content += '### Bridge\n\n'
      for (const line of song.bridge.lines) {
        content += `${line.text}  \n`
      }
      content += '\n'
    }

    return content
  }

  /**
   * Generate JSON content
   */
  private generateJsonContent(song: Song, options: ExportOptions): string {
    const exportData: any = {
      title: song.title,
      id: song.id,
      verses: song.verses,
      choruses: song.choruses
    }

    if (song.bridge) {
      exportData.bridge = song.bridge
    }

    if (options.includeMetadata) {
      exportData.metadata = song.metadata
    }

    if (options.includeHistory) {
      exportData.generatedAt = song.generatedAt
      exportData.lastModified = song.lastModified
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * Generate HTML content
   */
  private generateHtmlContent(song: Song, options: ExportOptions): string {
    const colorScheme = options.formatting?.colorScheme || 'light'
    const bgColor = colorScheme === 'dark' ? '#1e1e1e' : '#ffffff'
    const textColor = colorScheme === 'dark' ? '#d4d4d4' : '#000000'

    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${song.title}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: ${bgColor};
      color: ${textColor};
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 { border-bottom: 2px solid ${textColor}; }
    .verse, .chorus, .bridge { margin: 20px 0; }
    .line { margin: 5px 0; }
  </style>
</head>
<body>
  <h1>${song.title}</h1>
`

    // Verses
    for (const verse of song.verses) {
      html += `  <div class="verse">\n`
      html += `    <h2>Verse ${verse.number}</h2>\n`
      for (const line of verse.lines) {
        html += `    <div class="line">${line.text}</div>\n`
      }
      html += `  </div>\n`
    }

    // Choruses
    for (const chorus of song.choruses) {
      html += `  <div class="chorus">\n`
      html += `    <h2>Chorus</h2>\n`
      for (const line of chorus.lines) {
        html += `    <div class="line">${line.text}</div>\n`
      }
      html += `  </div>\n`
    }

    html += `</body>
</html>`

    return html
  }

  /**
   * Generate Suno format content (max 3000 chars)
   */
  private generateSunoContent(song: Song): string {
    let content = ''

    // Verses
    for (const verse of song.verses) {
      content += `[Verse ${verse.number}]\n`
      for (const line of verse.lines) {
        content += `${line.text}\n`
      }
      content += '\n'
    }

    // Choruses
    for (const chorus of song.choruses) {
      content += '[Chorus]\n'
      for (const line of chorus.lines) {
        content += `${line.text}\n`
      }
      content += '\n'
    }

    // Bridge
    if (song.bridge) {
      content += '[Bridge]\n'
      for (const line of song.bridge.lines) {
        content += `${line.text}\n`
      }
    }

    // Enforce 3000 character limit
    if (content.length > 3000) {
      content = content.substring(0, 2997) + '...'
    }

    return content
  }

  /**
   * Find template by ID
   */
  private findTemplate(templateId: string): ExportTemplate | null {
    const id = templateId.toLowerCase()

    if (id === EXPORT_TEMPLATES.SUNO_READY.id) {
      return {
        id: EXPORT_TEMPLATES.SUNO_READY.id,
        name: EXPORT_TEMPLATES.SUNO_READY.name,
        format: EXPORT_TEMPLATES.SUNO_READY.format,
        options: {
          format: EXPORT_TEMPLATES.SUNO_READY.format,
          includeMetadata: false
        },
        description: EXPORT_TEMPLATES.SUNO_READY.description
      }
    } else if (id === EXPORT_TEMPLATES.PORTFOLIO.id) {
      return {
        id: EXPORT_TEMPLATES.PORTFOLIO.id,
        name: EXPORT_TEMPLATES.PORTFOLIO.name,
        format: EXPORT_TEMPLATES.PORTFOLIO.format,
        options: {
          format: EXPORT_TEMPLATES.PORTFOLIO.format,
          includeMetadata: true,
          includeCritique: true
        },
        description: EXPORT_TEMPLATES.PORTFOLIO.description
      }
    } else if (id === EXPORT_TEMPLATES.SIMPLE_TEXT.id) {
      return {
        id: EXPORT_TEMPLATES.SIMPLE_TEXT.id,
        name: EXPORT_TEMPLATES.SIMPLE_TEXT.name,
        format: EXPORT_TEMPLATES.SIMPLE_TEXT.format,
        options: {
          format: EXPORT_TEMPLATES.SIMPLE_TEXT.format,
          includeMetadata: false
        },
        description: EXPORT_TEMPLATES.SIMPLE_TEXT.description
      }
    } else if (id === EXPORT_TEMPLATES.FULL_ARCHIVE.id) {
      return {
        id: EXPORT_TEMPLATES.FULL_ARCHIVE.id,
        name: EXPORT_TEMPLATES.FULL_ARCHIVE.name,
        format: EXPORT_TEMPLATES.FULL_ARCHIVE.format,
        options: {
          format: EXPORT_TEMPLATES.FULL_ARCHIVE.format,
          includeMetadata: true,
          includeCritique: true,
          includeHistory: true
        },
        description: EXPORT_TEMPLATES.FULL_ARCHIVE.description
      }
    }

    return null
  }

  /**
   * Generate index file for batch export
   */
  private generateIndexFile(songs: readonly Song[], exports: readonly ExportResult[]): string {
    let content = '# Export Index\n\n'
    content += `Generated: ${new Date().toISOString()}\n\n`
    content += `## Songs (${songs.length})\n\n`

    for (const song of songs) {
      content += `### ${song.title}\n`
      if (song.metadata.genre) content += `- Genre: ${song.metadata.genre}\n`
      if (song.metadata.mood) content += `- Mood: ${song.metadata.mood}\n`

      // Find exports for this song
      const songExports = exports.filter(e => e.filePath.includes(sanitizeFilename(song.title)))
      if (songExports.length > 0) {
        content += '- Formats:\n'
        for (const exp of songExports) {
          content += `  - [${exp.format}](${exp.filePath})\n`
        }
      }
      content += '\n'
    }

    return content
  }

  /**
   * Generate README for archive
   */
  private generateReadme(songs: readonly Song[]): string {
    let content = '# Song Archive\n\n'
    content += `This archive contains ${songs.length} song${songs.length !== 1 ? 's' : ''}.\n\n`
    content += '## Contents\n\n'

    for (const song of songs) {
      content += `- **${song.title}**`
      if (song.metadata.genre) content += ` (${song.metadata.genre})`
      content += '\n'
    }

    content += '\n## File Formats\n\n'
    content += '- `.txt` - Plain text lyrics\n'
    content += '- `.md` - Markdown formatted lyrics\n'
    content += '- `.json` - Complete song data in JSON format\n'

    return content
  }
}
