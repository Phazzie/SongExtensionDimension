/**
 * @fileoverview History Contract
 * @purpose Store and retrieve song versions and revision history
 * @dataFlow SongVersions ↔ PersistentStorage
 * @boundary Runtime data → Persistent storage (local VSCode storage)
 * @requirement Track all song versions with metadata for comparison and rollback
 * @updated 2025-11-14
 *
 * @example
 * const history = new MockHistoryService()
 * const result = await history.saveVersion({
 *   song,
 *   changeDescription: "Improved imagery in verse 2",
 *   critiqueReport
 * })
 * if (result.success) {
 *   console.log(result.data.versionId)
 *   console.log(result.data.version Number)
 * }
 */

import type { ServiceResponse } from './types/common'
import type { Song, SongId } from './types/song'
import type { CritiqueReport } from './CritiqueEngine'
import type { ChangeRecord } from './RevisionEngine'

/**
 * Branded type for Version IDs
 */
export type VersionId = string & { readonly __brand: 'VersionId' }

/**
 * Song version (snapshot in time)
 */
export interface SongVersion {
  readonly versionId: VersionId
  readonly songId: SongId
  readonly song: Song
  readonly versionNumber: number
  readonly changeDescription: string
  readonly changes: readonly ChangeRecord[]
  readonly critique?: CritiqueReport
  readonly createdAt: Date
  readonly createdBy?: string
  readonly tags: readonly string[]
  readonly notes?: string
}

/**
 * Save version input
 */
export interface SaveVersionInput {
  readonly song: Song
  readonly changeDescription: string
  readonly changes?: readonly ChangeRecord[]
  readonly critique?: CritiqueReport
  readonly tags?: readonly string[]
  readonly notes?: string
}

/**
 * Save version result
 */
export interface SaveVersionResult {
  readonly versionId: VersionId
  readonly versionNumber: number
  readonly savedAt: Date
  readonly storageSize: number
}

/**
 * Version retrieval options
 */
export interface RetrieveVersionOptions {
  readonly songId: SongId
  readonly versionNumber?: number
  readonly versionId?: VersionId
  readonly fromDate?: Date
  readonly toDate?: Date
  readonly tags?: readonly string[]
}

/**
 * Version history (all versions for a song)
 */
export interface VersionHistory {
  readonly songId: SongId
  readonly currentVersion: number
  readonly versions: readonly SongVersion[]
  readonly totalVersions: number
  readonly firstCreated: Date
  readonly lastModified: Date
  readonly totalChanges: number
}

/**
 * Version comparison
 */
export interface VersionComparison {
  readonly version1: SongVersion
  readonly version2: SongVersion
  readonly differences: readonly Difference[]
  readonly improvementMetrics?: ImprovementComparison
  readonly summary: string
}

/**
 * Difference between versions
 */
export interface Difference {
  readonly type: DifferenceType
  readonly location: string
  readonly before: string
  readonly after: string
  readonly description: string
}

/**
 * Difference type
 */
export enum DifferenceType {
  LINE_CHANGED = 'line_changed',
  LINE_ADDED = 'line_added',
  LINE_REMOVED = 'line_removed',
  SECTION_ADDED = 'section_added',
  SECTION_REMOVED = 'section_removed',
  METADATA_CHANGED = 'metadata_changed',
  STRUCTURE_CHANGED = 'structure_changed'
}

/**
 * Improvement comparison between versions
 */
export interface ImprovementComparison {
  readonly scoreChange: number
  readonly issuesFixed: number
  readonly issuesIntroduced: number
  readonly qualityImproved: boolean
  readonly categoryChanges: ReadonlyMap<string, number>
}

/**
 * Timeline entry (summary view)
 */
export interface TimelineEntry {
  readonly versionId: VersionId
  readonly versionNumber: number
  readonly description: string
  readonly timestamp: Date
  readonly changeCount: number
  readonly scoreDelta?: number
}

/**
 * Timeline (chronological view of all versions)
 */
export interface Timeline {
  readonly songId: SongId
  readonly entries: readonly TimelineEntry[]
  readonly totalVersions: number
  readonly dateRange: DateRange
}

/**
 * Date range
 */
export interface DateRange {
  readonly start: Date
  readonly end: Date
}

/**
 * Rollback options
 */
export interface RollbackOptions {
  readonly songId: SongId
  readonly targetVersion: number | VersionId
  readonly createNewVersion: boolean // If true, rollback creates new version
  readonly preserveCurrentAsBackup: boolean
}

/**
 * Rollback result
 */
export interface RollbackResult {
  readonly restoredSong: Song
  readonly fromVersion: number
  readonly toVersion: number
  readonly backupVersionId?: VersionId
  readonly rolledBackAt: Date
}

/**
 * Storage statistics
 */
export interface StorageStatistics {
  readonly totalSongs: number
  readonly totalVersions: number
  readonly totalStorageUsed: number // bytes
  readonly averageVersionsPerSong: number
  readonly oldestVersion: Date
  readonly newestVersion: Date
  readonly storageLimit: number
  readonly percentUsed: number
}

/**
 * Cleanup options
 */
export interface CleanupOptions {
  readonly songId?: SongId // If provided, clean only this song
  readonly keepLatest: number // Keep N most recent versions
  readonly olderThan?: Date // Delete versions older than date
  readonly removeUntagged?: boolean
  readonly dryRun?: boolean // Preview without deleting
}

/**
 * Cleanup result
 */
export interface CleanupResult {
  readonly versionsDeleted: number
  readonly spaceFreed: number
  readonly deletedVersionIds: readonly VersionId[]
  readonly errors: readonly string[]
}

/**
 * Export history options
 */
export interface ExportHistoryOptions {
  readonly songId: SongId
  readonly format: HistoryExportFormat
  readonly includeFullSongs?: boolean
  readonly includeCritiques?: boolean
}

/**
 * History export format
 */
export enum HistoryExportFormat {
  JSON = 'json',
  MARKDOWN = 'markdown',
  TIMELINE = 'timeline' // Visual timeline format
}

/**
 * Error codes for history service
 */
export enum HistoryErrorCode {
  VERSION_NOT_FOUND = 'VERSION_NOT_FOUND',
  SONG_NOT_FOUND = 'SONG_NOT_FOUND',
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',
  CORRUPTED_VERSION = 'CORRUPTED_VERSION',
  SAVE_FAILED = 'SAVE_FAILED',
  RETRIEVAL_FAILED = 'RETRIEVAL_FAILED',
  ROLLBACK_FAILED = 'ROLLBACK_FAILED',
  CLEANUP_FAILED = 'CLEANUP_FAILED',
  EXPORT_FAILED = 'EXPORT_FAILED'
}

/**
 * History Service Interface
 *
 * This is the contract that both mock and real implementations must follow.
 * DO NOT modify this interface once implementation starts (create v2 instead).
 */
export interface IHistoryService {
  /**
   * Save a new version of a song
   *
   * @param input - Version save input
   * @returns Promise with save result or error
   * @throws Never throws - always returns ServiceResponse
   */
  saveVersion(
    input: SaveVersionInput
  ): Promise<ServiceResponse<SaveVersionResult>>

  /**
   * Retrieve a specific version
   *
   * @param options - Version retrieval options
   * @returns Promise with song version or error
   * @throws Never throws - always returns ServiceResponse
   */
  getVersion(
    options: RetrieveVersionOptions
  ): Promise<ServiceResponse<SongVersion>>

  /**
   * Get complete version history for a song
   *
   * @param songId - ID of song to get history for
   * @returns Promise with version history or error
   * @throws Never throws - always returns ServiceResponse
   */
  getHistory(
    songId: SongId
  ): Promise<ServiceResponse<VersionHistory>>

  /**
   * Get timeline view of versions
   *
   * @param songId - ID of song to get timeline for
   * @returns Promise with timeline or error
   * @throws Never throws - always returns ServiceResponse
   */
  getTimeline(
    songId: SongId
  ): Promise<ServiceResponse<Timeline>>

  /**
   * Compare two versions
   *
   * @param version1Id - First version ID
   * @param version2Id - Second version ID
   * @returns Promise with comparison result or error
   * @throws Never throws - always returns ServiceResponse
   */
  compareVersions(
    version1Id: VersionId,
    version2Id: VersionId
  ): Promise<ServiceResponse<VersionComparison>>

  /**
   * Rollback song to previous version
   *
   * @param options - Rollback options
   * @returns Promise with rollback result or error
   * @throws Never throws - always returns ServiceResponse
   */
  rollback(
    options: RollbackOptions
  ): Promise<ServiceResponse<RollbackResult>>

  /**
   * Delete specific version
   *
   * @param versionId - ID of version to delete
   * @returns Promise with success confirmation
   * @throws Never throws - always returns ServiceResponse
   */
  deleteVersion(
    versionId: VersionId
  ): Promise<ServiceResponse<void>>

  /**
   * Delete all versions for a song
   *
   * @param songId - ID of song to delete history for
   * @param keepCurrent - If true, keep only current version
   * @returns Promise with deletion count
   * @throws Never throws - always returns ServiceResponse
   */
  deleteHistory(
    songId: SongId,
    keepCurrent?: boolean
  ): Promise<ServiceResponse<number>>

  /**
   * Cleanup old versions based on criteria
   *
   * @param options - Cleanup options
   * @returns Promise with cleanup result or error
   * @throws Never throws - always returns ServiceResponse
   */
  cleanup(
    options: CleanupOptions
  ): Promise<ServiceResponse<CleanupResult>>

  /**
   * Get storage statistics
   *
   * @returns Promise with storage statistics
   * @throws Never throws - always returns ServiceResponse
   */
  getStorageStatistics(): Promise<ServiceResponse<StorageStatistics>>

  /**
   * Export history to file
   *
   * @param options - Export options
   * @returns Promise with export path or error
   * @throws Never throws - always returns ServiceResponse
   */
  exportHistory(
    options: ExportHistoryOptions
  ): Promise<ServiceResponse<string>>

  /**
   * Search versions by criteria
   *
   * @param criteria - Search criteria
   * @returns Promise with matching versions
   * @throws Never throws - always returns ServiceResponse
   */
  searchVersions(
    criteria: VersionSearchCriteria
  ): Promise<ServiceResponse<readonly SongVersion[]>>
}

/**
 * Version search criteria
 */
export interface VersionSearchCriteria {
  readonly songId?: SongId
  readonly dateRange?: DateRange
  readonly tags?: readonly string[]
  readonly minScore?: number
  readonly maxScore?: number
  readonly hasChanges?: boolean
  readonly changeTypes?: readonly DifferenceType[]
  readonly searchText?: string
}

/**
 * Helper to create Version ID
 */
export function createVersionId(songId: SongId, versionNumber: number): VersionId {
  return `${songId}_v${versionNumber}` as VersionId
}

/**
 * Helper to parse version ID
 */
export function parseVersionId(versionId: VersionId): { songId: SongId; versionNumber: number } {
  const parts = versionId.split('_v')
  return {
    songId: parts[0] as SongId,
    versionNumber: parseInt(parts[1] ?? '0', 10)
  }
}

/**
 * Helper to get latest version from history
 */
export function getLatestVersion(history: VersionHistory): SongVersion | undefined {
  return history.versions[history.versions.length - 1]
}

/**
 * Helper to calculate storage size
 */
export function calculateStorageSize(version: SongVersion): number {
  return JSON.stringify(version).length
}

/**
 * Helper to format version description
 */
export function formatVersionDescription(version: SongVersion): string {
  return `v${version.versionNumber}: ${version.changeDescription} (${version.createdAt.toLocaleDateString()})`
}
