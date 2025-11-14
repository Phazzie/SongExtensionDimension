/**
 * @fileoverview Export Contract
 * @purpose Export songs to various file formats for user consumption
 * @dataFlow FormattedSong → FileGeneration → FileOutput
 * @boundary Internal data → File system
 * @requirement Support multiple export formats (txt, md, json, pdf)
 * @updated 2025-11-14
 *
 * @example
 * const exporter = new MockExportService()
 * const result = await exporter.exportSong(song, {
 *   format: 'markdown',
 *   includeMetadata: true,
 *   includeCritique: true
 * })
 * if (result.success) {
 *   console.log(result.data.filePath)
 *   console.log(result.data.fileSize)
 * }
 */

import type { ServiceResponse } from './types/common'
import type { Song, SongId } from './types/song'
import type { CritiqueReport } from './CritiqueEngine'
import type { SunoFormatResult } from './SunoFormatter'

/**
 * Export format
 */
export enum ExportFormat {
  TEXT = 'text',           // Plain text (.txt)
  MARKDOWN = 'markdown',   // Markdown (.md)
  JSON = 'json',           // JSON (.json)
  PDF = 'pdf',             // PDF (.pdf)
  HTML = 'html',           // HTML (.html)
  SUNO = 'suno'            // Suno format (.txt)
}

/**
 * Export options
 */
export interface ExportOptions {
  readonly format: ExportFormat
  readonly filePath?: string // If not provided, use default location
  readonly includeMetadata?: boolean
  readonly includeCritique?: boolean
  readonly includeHistory?: boolean
  readonly includeAlternatives?: boolean
  readonly formatting?: FormattingOptions
}

/**
 * Formatting options for different export formats
 */
export interface FormattingOptions {
  readonly fontSize?: number
  readonly fontFamily?: string
  readonly lineSpacing?: number
  readonly margins?: Margins
  readonly pageSize?: PageSize
  readonly colorScheme?: ColorScheme
  readonly syntaxHighlight?: boolean
}

/**
 * Margins for PDF/HTML export
 */
export interface Margins {
  readonly top: number
  readonly right: number
  readonly bottom: number
  readonly left: number
}

/**
 * Page size for PDF export
 */
export enum PageSize {
  LETTER = 'letter',
  A4 = 'a4',
  LEGAL = 'legal',
  TABLOID = 'tabloid'
}

/**
 * Color scheme for export
 */
export enum ColorScheme {
  LIGHT = 'light',
  DARK = 'dark',
  SEPIA = 'sepia',
  HIGH_CONTRAST = 'high-contrast'
}

/**
 * Export result
 */
export interface ExportResult {
  readonly filePath: string
  readonly format: ExportFormat
  readonly fileSize: number
  readonly exportedAt: Date
  readonly success: boolean
  readonly validation?: FileValidation
}

/**
 * File validation result
 */
export interface FileValidation {
  readonly valid: boolean
  readonly readable: boolean
  readonly size: number
  readonly encoding: string
  readonly errors: readonly string[]
}

/**
 * Batch export options
 */
export interface BatchExportOptions {
  readonly songs: readonly Song[]
  readonly formats: readonly ExportFormat[]
  readonly baseDirectory?: string
  readonly includeIndex?: boolean // Generate index file listing all songs
}

/**
 * Batch export result
 */
export interface BatchExportResult {
  readonly exports: readonly ExportResult[]
  readonly totalExported: number
  readonly failed: number
  readonly indexPath?: string
}

/**
 * Export template
 */
export interface ExportTemplate {
  readonly id: string
  readonly name: string
  readonly format: ExportFormat
  readonly options: ExportOptions
  readonly description: string
}

/**
 * Predefined export templates
 */
export const EXPORT_TEMPLATES = {
  SUNO_READY: {
    id: 'suno-ready',
    name: 'Suno Ready',
    format: ExportFormat.SUNO,
    description: 'Export ready for Suno v5.0'
  },
  PORTFOLIO: {
    id: 'portfolio',
    name: 'Portfolio PDF',
    format: ExportFormat.PDF,
    description: 'Professional PDF with metadata and critique'
  },
  SIMPLE_TEXT: {
    id: 'simple-text',
    name: 'Simple Text',
    format: ExportFormat.TEXT,
    description: 'Plain text lyrics only'
  },
  FULL_ARCHIVE: {
    id: 'full-archive',
    name: 'Full Archive',
    format: ExportFormat.JSON,
    description: 'Complete song data including history'
  }
} as const

/**
 * Export metadata
 */
export interface ExportMetadata {
  readonly songId: SongId
  readonly songTitle: string
  readonly exportedBy?: string
  readonly exportedAt: Date
  readonly format: ExportFormat
  readonly includesExtras: boolean
  readonly version: string
}

/**
 * Archive export options (multiple songs + metadata)
 */
export interface ArchiveExportOptions {
  readonly songs: readonly Song[]
  readonly critiques?: ReadonlyMap<SongId, CritiqueReport>
  readonly sunoFormats?: ReadonlyMap<SongId, SunoFormatResult>
  readonly format: 'zip' | 'tar' | 'folder'
  readonly includeReadme?: boolean
}

/**
 * Archive export result
 */
export interface ArchiveExportResult {
  readonly archivePath: string
  readonly format: string
  readonly songCount: number
  readonly totalSize: number
  readonly files: readonly string[]
}

/**
 * Error codes for export service
 */
export enum ExportErrorCode {
  INVALID_SONG = 'INVALID_SONG',
  INVALID_FORMAT = 'INVALID_FORMAT',
  WRITE_PERMISSION_DENIED = 'WRITE_PERMISSION_DENIED',
  DISK_FULL = 'DISK_FULL',
  INVALID_PATH = 'INVALID_PATH',
  FILE_EXISTS = 'FILE_EXISTS',
  FORMAT_CONVERSION_FAILED = 'FORMAT_CONVERSION_FAILED',
  EXPORT_FAILED = 'EXPORT_FAILED',
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND'
}

/**
 * Export Service Interface
 *
 * This is the contract that both mock and real implementations must follow.
 * DO NOT modify this interface once implementation starts (create v2 instead).
 */
export interface IExportService {
  /**
   * Export song to specified format
   *
   * @param song - Song to export
   * @param options - Export options
   * @returns Promise with export result or error
   * @throws Never throws - always returns ServiceResponse
   */
  exportSong(
    song: Song,
    options: ExportOptions
  ): Promise<ServiceResponse<ExportResult>>

  /**
   * Export multiple songs at once
   *
   * @param options - Batch export options
   * @returns Promise with batch export result or error
   * @throws Never throws - always returns ServiceResponse
   */
  batchExport(
    options: BatchExportOptions
  ): Promise<ServiceResponse<BatchExportResult>>

  /**
   * Export song using predefined template
   *
   * @param song - Song to export
   * @param templateId - ID of template to use
   * @param overrides - Optional overrides for template options
   * @returns Promise with export result or error
   * @throws Never throws - always returns ServiceResponse
   */
  exportWithTemplate(
    song: Song,
    templateId: string,
    overrides?: Partial<ExportOptions>
  ): Promise<ServiceResponse<ExportResult>>

  /**
   * Export to archive (zip/tar) with multiple formats
   *
   * @param options - Archive export options
   * @returns Promise with archive result or error
   * @throws Never throws - always returns ServiceResponse
   */
  exportArchive(
    options: ArchiveExportOptions
  ): Promise<ServiceResponse<ArchiveExportResult>>

  /**
   * Preview export output without saving to file
   *
   * @param song - Song to preview
   * @param format - Export format
   * @returns Promise with preview text or error
   * @throws Never throws - always returns ServiceResponse
   */
  previewExport(
    song: Song,
    format: ExportFormat
  ): Promise<ServiceResponse<string>>

  /**
   * Validate export file
   *
   * @param filePath - Path to exported file
   * @returns Promise with validation result
   * @throws Never throws - always returns ServiceResponse
   */
  validateExportedFile(
    filePath: string
  ): Promise<ServiceResponse<FileValidation>>

  /**
   * Get list of available export templates
   *
   * @returns Promise with template list
   * @throws Never throws - always returns ServiceResponse
   */
  listTemplates(): Promise<ServiceResponse<readonly ExportTemplate[]>>

  /**
   * Get default export path for a song
   *
   * @param song - Song to get path for
   * @param format - Export format
   * @returns Promise with suggested file path
   * @throws Never throws - always returns ServiceResponse
   */
  getDefaultExportPath(
    song: Song,
    format: ExportFormat
  ): Promise<ServiceResponse<string>>
}

/**
 * Helper to get file extension for format
 */
export function getFileExtension(format: ExportFormat): string {
  switch (format) {
    case ExportFormat.TEXT:
    case ExportFormat.SUNO:
      return '.txt'
    case ExportFormat.MARKDOWN:
      return '.md'
    case ExportFormat.JSON:
      return '.json'
    case ExportFormat.PDF:
      return '.pdf'
    case ExportFormat.HTML:
      return '.html'
  }
}

/**
 * Helper to sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9_\-]/gi, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase()
}

/**
 * Helper to create default export options
 */
export function createDefaultExportOptions(format: ExportFormat): ExportOptions {
  return {
    format,
    includeMetadata: true,
    includeCritique: false,
    includeHistory: false,
    includeAlternatives: false
  }
}

/**
 * Helper to estimate file size
 */
export function estimateFileSize(song: Song, format: ExportFormat): number {
  // Rough estimates in bytes
  const baseSize = JSON.stringify(song).length

  switch (format) {
    case ExportFormat.TEXT:
      return baseSize * 0.5
    case ExportFormat.MARKDOWN:
      return baseSize * 0.7
    case ExportFormat.JSON:
      return baseSize
    case ExportFormat.PDF:
      return baseSize * 2
    case ExportFormat.HTML:
      return baseSize * 1.5
    case ExportFormat.SUNO:
      return 3000 // Max character limit
  }
}
