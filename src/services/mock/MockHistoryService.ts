/**
 * @fileoverview Mock Implementation of History Service
 * @purpose Provide in-memory version control and history management
 * @phase Phase 3 - BUILD (TDD)
 * @updated 2025-11-15
 *
 * This mock implementation:
 * - Maintains in-memory storage of song versions
 * - Handles all version control operations
 * - Tracks storage statistics
 * - Supports version comparison and timeline views
 * - Passes all tests in History.test.ts
 */

import type {
  IHistoryService,
  SaveVersionInput,
  SaveVersionResult,
  RetrieveVersionOptions,
  VersionHistory,
  SongVersion,
  VersionComparison,
  Difference,
  RollbackOptions,
  RollbackResult,
  CleanupOptions,
  CleanupResult,
  StorageStatistics,
  ExportHistoryOptions,
  VersionSearchCriteria,
  Timeline,
  TimelineEntry,
  DateRange,
  VersionId
} from '../../contracts/History'
import {
  createVersionId,
  parseVersionId,
  HistoryErrorCode,
  DifferenceType as DiffType,
  HistoryExportFormat,
  calculateStorageSize
} from '../../contracts/History'
import type { Song, SongId } from '../../contracts/types/song'
import { createSuccess, createFailure, createError, type ServiceResponse } from '../../contracts/types/common'

/**
 * In-memory storage for versions organized by song ID
 */
interface StoredVersion {
  readonly versionId: VersionId
  readonly songId: SongId
  readonly song: Song
  readonly versionNumber: number
  readonly changeDescription: string
  readonly createdAt: Date
  readonly createdBy?: string
  readonly tags: readonly string[]
  readonly notes?: string
  readonly storageSize: number
}

/**
 * Mock History Service Implementation
 * Uses in-memory storage to simulate version control
 */
export class MockHistoryService implements IHistoryService {
  // Storage: Map<songId, Map<versionNumber, StoredVersion>>
  private readonly versionStorage: Map<SongId, Map<number, StoredVersion>> = new Map()

  // Track version counters per song
  private readonly versionCounters: Map<SongId, number> = new Map()

  // Track storage usage
  private totalStorageUsed: number = 0

  /**
   * Save a new version of a song
   */
  async saveVersion(input: SaveVersionInput): Promise<ServiceResponse<SaveVersionResult>> {
    try {
      // Validate input
      if (!input || !input.song) {
        return createFailure(
          createError(
            'INVALID_INPUT',
            'Invalid save version input',
            'Ensure song and changeDescription are provided'
          )
        )
      }

      const songId = input.song.id
      const changeDescription = input.changeDescription || 'Untitled change'
      const tags = Array.from(input.tags || [])

      // Get or create version storage for this song
      if (!this.versionStorage.has(songId)) {
        this.versionStorage.set(songId, new Map())
        this.versionCounters.set(songId, 0)
      }

      // Increment version number
      const currentCounter = this.versionCounters.get(songId) ?? 0
      const versionNumber = currentCounter + 1
      this.versionCounters.set(songId, versionNumber)

      // Create version ID
      const versionId = createVersionId(songId, versionNumber)

      // Calculate storage size
      const storageSize = calculateStorageSize({
        versionId,
        songId,
        song: input.song,
        versionNumber,
        changeDescription,
        createdAt: new Date(),
        tags: tags as readonly string[],
        changes: [] as const
      } as SongVersion)

      // Create stored version
      const storedVersion: StoredVersion = {
        versionId,
        songId,
        song: input.song,
        versionNumber,
        changeDescription,
        createdAt: new Date(),
        createdBy: input.song.metadata.author,
        tags: tags as readonly string[],
        notes: input.notes,
        storageSize
      }

      // Store the version
      const songVersions = this.versionStorage.get(songId)
      if (songVersions) {
        songVersions.set(versionNumber, storedVersion)
      }

      // Update storage tracking
      this.totalStorageUsed += storageSize

      // Create result
      const result: SaveVersionResult = {
        versionId,
        versionNumber,
        savedAt: new Date(),
        storageSize
      }

      return createSuccess(result)
    } catch (error) {
      return createFailure(
        createError(
          HistoryErrorCode.SAVE_FAILED,
          'Failed to save version',
          'Try again or contact support',
          error instanceof Error ? error.message : 'Unknown error'
        )
      )
    }
  }

  /**
   * Retrieve a specific version
   */
  async getVersion(options: RetrieveVersionOptions): Promise<ServiceResponse<SongVersion>> {
    try {
      if (!options || !options.songId) {
        return createFailure(
          createError(
            HistoryErrorCode.RETRIEVAL_FAILED,
            'Invalid retrieval options',
            'Provide songId'
          )
        )
      }

      const songId = options.songId
      const songVersions = this.versionStorage.get(songId)

      if (!songVersions) {
        return createFailure(
          createError(
            HistoryErrorCode.SONG_NOT_FOUND,
            `No history found for song ${songId}`,
            'Make sure this song has versions saved'
          )
        )
      }

      // If specific versionNumber was requested and not found, return VERSION_NOT_FOUND
      if (options.versionNumber !== undefined && !songVersions.has(options.versionNumber)) {
        return createFailure(
          createError(
            HistoryErrorCode.VERSION_NOT_FOUND,
            `Version ${options.versionNumber} not found`,
            'Check version number'
          )
        )
      }

      // Try to find by version ID first
      if (options.versionId) {
        const parsed = parseVersionId(options.versionId)
        const stored = songVersions.get(parsed.versionNumber)
        if (stored) {
          return createSuccess(this.createSongVersion(stored))
        }
      }

      // Try by version number
      if (options.versionNumber !== undefined) {
        const stored = songVersions.get(options.versionNumber)
        if (stored) {
          // Apply date range filter if provided
          if (options.fromDate && stored.createdAt < options.fromDate) {
            return createFailure(
              createError(
                HistoryErrorCode.VERSION_NOT_FOUND,
                'Version not found in date range',
                'Adjust date range'
              )
            )
          }

          if (options.toDate && stored.createdAt > options.toDate) {
            return createFailure(
              createError(
                HistoryErrorCode.VERSION_NOT_FOUND,
                'Version not found in date range',
                'Adjust date range'
              )
            )
          }

          // Apply tag filter if provided
          if (options.tags && options.tags.length > 0) {
            const hasMatchingTag = options.tags.some(tag => stored.tags.includes(tag))
            if (!hasMatchingTag) {
              return createFailure(
                createError(
                  HistoryErrorCode.VERSION_NOT_FOUND,
                  'Version not found with matching tags',
                  'Check available tags'
                )
              )
            }
          }

          return createSuccess(this.createSongVersion(stored))
        }
      }

      // If we have date range but no specific version, get latest in range
      if (options.fromDate || options.toDate) {
        const from = options.fromDate || new Date(0)
        const to = options.toDate || new Date()

        let bestMatch: StoredVersion | undefined

        for (const stored of songVersions.values()) {
          if (stored.createdAt >= from && stored.createdAt <= to) {
            if (!bestMatch || stored.versionNumber > bestMatch.versionNumber) {
              bestMatch = stored
            }
          }
        }

        if (bestMatch) {
          return createSuccess(this.createSongVersion(bestMatch))
        }
      }

      return createFailure(
        createError(
          HistoryErrorCode.VERSION_NOT_FOUND,
          'Version not found',
          'Check version number or ID'
        )
      )
    } catch (error) {
      return createFailure(
        createError(
          HistoryErrorCode.RETRIEVAL_FAILED,
          'Failed to retrieve version',
          'Try again',
          error instanceof Error ? error.message : 'Unknown error'
        )
      )
    }
  }

  /**
   * Get complete version history for a song
   */
  async getHistory(songId: SongId): Promise<ServiceResponse<VersionHistory>> {
    try {
      const songVersions = this.versionStorage.get(songId)

      if (!songVersions || songVersions.size === 0) {
        return createFailure(
          createError(
            HistoryErrorCode.SONG_NOT_FOUND,
            `No history found for song ${songId}`,
            'Make sure this song has versions'
          )
        )
      }

      // Convert stored versions to SongVersion objects
      const versions: SongVersion[] = []
      const storedArray = Array.from(songVersions.values())

      for (const stored of storedArray) {
        versions.push(this.createSongVersion(stored))
      }

      // Sort by version number
      versions.sort((a, b) => a.versionNumber - b.versionNumber)

      const currentVersion = versions.length > 0 ? versions[versions.length - 1]!.versionNumber : 0
      const firstCreated = versions.length > 0 ? versions[0]!.createdAt : new Date()
      const lastModified = versions.length > 0 ? versions[versions.length - 1]!.createdAt : new Date()

      // Calculate total changes
      let totalChanges = 0
      for (const version of versions) {
        totalChanges += version.changes.length
      }

      const history: VersionHistory = {
        songId,
        currentVersion,
        versions: versions as readonly SongVersion[],
        totalVersions: versions.length,
        firstCreated,
        lastModified,
        totalChanges
      }

      return createSuccess(history)
    } catch (error) {
      return createFailure(
        createError(
          HistoryErrorCode.RETRIEVAL_FAILED,
          'Failed to get history',
          'Try again',
          error instanceof Error ? error.message : 'Unknown error'
        )
      )
    }
  }

  /**
   * Get timeline view of versions
   */
  async getTimeline(songId: SongId): Promise<ServiceResponse<Timeline>> {
    try {
      const historyResult = await this.getHistory(songId)

      if (!historyResult.success) {
        return historyResult as any
      }

      const history = historyResult.data
      const entries: TimelineEntry[] = []

      for (const version of history.versions) {
        const entry: TimelineEntry = {
          versionId: version.versionId,
          versionNumber: version.versionNumber,
          description: version.changeDescription,
          timestamp: version.createdAt,
          changeCount: version.changes.length
        }
        entries.push(entry)
      }

      const dateRange: DateRange = {
        start: history.firstCreated,
        end: history.lastModified
      }

      const timeline: Timeline = {
        songId,
        entries: entries as readonly TimelineEntry[],
        totalVersions: history.totalVersions,
        dateRange
      }

      return createSuccess(timeline)
    } catch (error) {
      return createFailure(
        createError(
          HistoryErrorCode.RETRIEVAL_FAILED,
          'Failed to get timeline',
          'Try again',
          error instanceof Error ? error.message : 'Unknown error'
        )
      )
    }
  }

  /**
   * Compare two versions
   */
  async compareVersions(
    version1Id: VersionId,
    version2Id: VersionId
  ): Promise<ServiceResponse<VersionComparison>> {
    try {
      // Parse version IDs
      const parsed1 = parseVersionId(version1Id)
      const parsed2 = parseVersionId(version2Id)

      // Get both versions
      const storage1 = this.versionStorage.get(parsed1.songId)
      const stored1 = storage1?.get(parsed1.versionNumber)

      const storage2 = this.versionStorage.get(parsed2.songId)
      const stored2 = storage2?.get(parsed2.versionNumber)

      if (!stored1 || !stored2) {
        return createFailure(
          createError(
            HistoryErrorCode.VERSION_NOT_FOUND,
            'One or both versions not found',
            'Check version IDs'
          )
        )
      }

      // Create comparison
      const version1 = this.createSongVersion(stored1)
      const version2 = this.createSongVersion(stored2)

      // Find differences
      const differences = this.detectDifferences(version1, version2)

      // Create summary
      const summary =
        differences.length === 0
          ? 'No differences found'
          : `Found ${differences.length} difference(s)`

      const comparison: VersionComparison = {
        version1,
        version2,
        differences: differences as readonly Difference[],
        summary
      }

      return createSuccess(comparison)
    } catch (error) {
      return createFailure(
        createError(
          HistoryErrorCode.RETRIEVAL_FAILED,
          'Failed to compare versions',
          'Try again',
          error instanceof Error ? error.message : 'Unknown error'
        )
      )
    }
  }

  /**
   * Rollback song to previous version
   */
  async rollback(options: RollbackOptions): Promise<ServiceResponse<RollbackResult>> {
    try {
      if (!options || !options.songId) {
        return createFailure(
          createError(
            HistoryErrorCode.ROLLBACK_FAILED,
            'Invalid rollback options',
            'Provide songId and target version'
          )
        )
      }

      const songId = options.songId
      const songVersions = this.versionStorage.get(songId)

      if (!songVersions || songVersions.size === 0) {
        return createFailure(
          createError(
            HistoryErrorCode.SONG_NOT_FOUND,
            `No history found for song ${songId}`,
            'Song has no versions'
          )
        )
      }

      // Determine target version number
      let targetVersionNumber: number | undefined

      if (typeof options.targetVersion === 'number') {
        targetVersionNumber = options.targetVersion
      } else {
        // It's a version ID
        const parsed = parseVersionId(options.targetVersion)
        targetVersionNumber = parsed.versionNumber
      }

      const targetStored = songVersions.get(targetVersionNumber)

      if (!targetStored) {
        return createFailure(
          createError(
            HistoryErrorCode.VERSION_NOT_FOUND,
            `Version ${targetVersionNumber} not found`,
            'Check version number'
          )
        )
      }

      // Get current version (last one)
      const currentVersionNumber = Math.max(...songVersions.keys())
      const currentStored = songVersions.get(currentVersionNumber)

      if (!currentStored) {
        return createFailure(
          createError(
            HistoryErrorCode.ROLLBACK_FAILED,
            'Could not determine current version',
            'Try again'
          )
        )
      }

      // If createNewVersion, save current as backup
      let backupVersionId: VersionId | undefined

      if (options.preserveCurrentAsBackup) {
        const backupResult = await this.saveVersion({
          song: currentStored.song,
          changeDescription: `Backup before rollback to v${targetVersionNumber}`
        })

        if (backupResult.success) {
          backupVersionId = backupResult.data.versionId
        }
      }

      // Create rollback result
      const result: RollbackResult = {
        restoredSong: targetStored.song,
        fromVersion: currentVersionNumber,
        toVersion: targetVersionNumber,
        backupVersionId,
        rolledBackAt: new Date()
      }

      return createSuccess(result)
    } catch (error) {
      return createFailure(
        createError(
          HistoryErrorCode.ROLLBACK_FAILED,
          'Failed to rollback',
          'Try again',
          error instanceof Error ? error.message : 'Unknown error'
        )
      )
    }
  }

  /**
   * Delete specific version
   */
  async deleteVersion(versionId: VersionId): Promise<ServiceResponse<void>> {
    try {
      const parsed = parseVersionId(versionId)
      const songVersions = this.versionStorage.get(parsed.songId)

      if (!songVersions || !songVersions.has(parsed.versionNumber)) {
        return createFailure(
          createError(
            HistoryErrorCode.VERSION_NOT_FOUND,
            'Version not found',
            'Check version ID'
          )
        )
      }

      const stored = songVersions.get(parsed.versionNumber)
      if (stored) {
        this.totalStorageUsed -= stored.storageSize
      }

      songVersions.delete(parsed.versionNumber)

      return createSuccess(undefined)
    } catch (error) {
      return createFailure(
        createError(
          HistoryErrorCode.RETRIEVAL_FAILED,
          'Failed to delete version',
          'Try again',
          error instanceof Error ? error.message : 'Unknown error'
        )
      )
    }
  }

  /**
   * Delete all versions for a song
   */
  async deleteHistory(songId: SongId, keepCurrent?: boolean): Promise<ServiceResponse<number>> {
    try {
      const songVersions = this.versionStorage.get(songId)

      if (!songVersions) {
        return createFailure(
          createError(
            HistoryErrorCode.SONG_NOT_FOUND,
            'Song not found',
            'Check song ID'
          )
        )
      }

      let deletedCount = 0

      if (keepCurrent) {
        // Keep only the latest version
        const maxVersion = Math.max(...songVersions.keys())
        const versionsToDelete: number[] = []

        for (const [versionNumber] of songVersions) {
          if (versionNumber !== maxVersion) {
            versionsToDelete.push(versionNumber)
          }
        }

        for (const versionNumber of versionsToDelete) {
          const stored = songVersions.get(versionNumber)
          if (stored) {
            this.totalStorageUsed -= stored.storageSize
          }
          songVersions.delete(versionNumber)
          deletedCount++
        }
      } else {
        // Delete all versions
        for (const [, stored] of songVersions) {
          this.totalStorageUsed -= stored.storageSize
        }

        deletedCount = songVersions.size
        this.versionStorage.delete(songId)
      }

      return createSuccess(deletedCount)
    } catch (error) {
      return createFailure(
        createError(
          HistoryErrorCode.CLEANUP_FAILED,
          'Failed to delete history',
          'Try again',
          error instanceof Error ? error.message : 'Unknown error'
        )
      )
    }
  }

  /**
   * Cleanup old versions based on criteria
   */
  async cleanup(options: CleanupOptions): Promise<ServiceResponse<CleanupResult>> {
    try {
      const deletedVersionIds: VersionId[] = []
      let versionsDeleted = 0
      let spaceFreed = 0
      const errors: string[] = []

      if (options.dryRun) {
        // In dry-run mode, just calculate what would be deleted
        if (options.songId) {
          const songVersions = this.versionStorage.get(options.songId)
          if (songVersions) {
            const versionsArray = Array.from(songVersions.entries()).sort((a, b) =>
              b[0] - a[0]
            )

            for (let i = options.keepLatest; i < versionsArray.length; i++) {
              const entry = versionsArray[i]
              if (entry) {
                const [, stored] = entry
                versionsDeleted++
                spaceFreed += stored.storageSize
                deletedVersionIds.push(stored.versionId)
              }
            }
          }
        }
      } else {
        // Actually delete versions
        if (options.songId) {
          const songVersions = this.versionStorage.get(options.songId)
          if (songVersions) {
            const versionsArray = Array.from(songVersions.entries())
              .sort((a, b) => a[0] - b[0])

            for (const [versionNumber, stored] of versionsArray) {
              let shouldDelete = false

              // Check if older than cutoff date
              if (options.olderThan && stored.createdAt < options.olderThan) {
                shouldDelete = true
              }

              // Check keepLatest (keep N most recent)
              const sortedByNumber = Array.from(songVersions.entries())
                .sort((a, b) => b[0] - a[0])
              if (sortedByNumber.length > options.keepLatest) {
                const index = sortedByNumber.findIndex(([v]) => v === versionNumber)
                if (index >= options.keepLatest) {
                  shouldDelete = true
                }
              }

              if (shouldDelete) {
                this.totalStorageUsed -= stored.storageSize
                songVersions.delete(versionNumber)
                versionsDeleted++
                spaceFreed += stored.storageSize
                deletedVersionIds.push(stored.versionId)
              }
            }
          }
        }
      }

      const result: CleanupResult = {
        versionsDeleted,
        spaceFreed,
        deletedVersionIds: deletedVersionIds as readonly VersionId[],
        errors: errors as readonly string[]
      }

      return createSuccess(result)
    } catch (error) {
      return createFailure(
        createError(
          HistoryErrorCode.CLEANUP_FAILED,
          'Failed to cleanup',
          'Try again',
          error instanceof Error ? error.message : 'Unknown error'
        )
      )
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStatistics(): Promise<ServiceResponse<StorageStatistics>> {
    try {
      let totalSongs = 0
      let totalVersions = 0
      let oldestVersion = new Date()
      let newestVersion = new Date(0)

      for (const [, songVersions] of this.versionStorage) {
        totalSongs++
        for (const [, stored] of songVersions) {
          totalVersions++
          if (stored.createdAt < oldestVersion) {
            oldestVersion = stored.createdAt
          }
          if (stored.createdAt > newestVersion) {
            newestVersion = stored.createdAt
          }
        }
      }

      const storageLimit = 100 * 1024 * 1024 // 100 MB
      const percentUsed = (this.totalStorageUsed / storageLimit) * 100

      const stats: StorageStatistics = {
        totalSongs,
        totalVersions,
        totalStorageUsed: this.totalStorageUsed,
        averageVersionsPerSong:
          totalSongs > 0 ? Math.round(totalVersions / totalSongs) : 0,
        oldestVersion: totalVersions > 0 ? oldestVersion : new Date(),
        newestVersion: totalVersions > 0 ? newestVersion : new Date(),
        storageLimit,
        percentUsed
      }

      return createSuccess(stats)
    } catch (error) {
      return createFailure(
        createError(
          'STORAGE_STATS_FAILED',
          'Failed to get storage statistics',
          'Try again',
          error instanceof Error ? error.message : 'Unknown error'
        )
      )
    }
  }

  /**
   * Export history to file
   */
  async exportHistory(options: ExportHistoryOptions): Promise<ServiceResponse<string>> {
    try {
      const historyResult = await this.getHistory(options.songId)

      if (!historyResult.success) {
        return createFailure(
          createError(
            HistoryErrorCode.SONG_NOT_FOUND,
            'Cannot export - song not found',
            'Check song ID'
          )
        )
      }

      const history = historyResult.data
      let exportData = ''

      if (options.format === HistoryExportFormat.JSON) {
        const jsonData = {
          songId: options.songId,
          versions: history.versions.map(v => ({
            versionId: v.versionId,
            versionNumber: v.versionNumber,
            changeDescription: v.changeDescription,
            createdAt: v.createdAt,
            song: options.includeFullSongs ? v.song : undefined,
            tags: v.tags
          })),
          exportedAt: new Date()
        }
        exportData = JSON.stringify(jsonData, null, 2)
      } else if (options.format === HistoryExportFormat.MARKDOWN) {
        exportData = `# History for ${options.songId}\n\n`
        exportData += `Exported: ${new Date().toLocaleString()}\n\n`

        for (const version of history.versions) {
          exportData += `## Version ${version.versionNumber}\n\n`
          exportData += `**Description**: ${version.changeDescription}\n\n`
          exportData += `**Created**: ${version.createdAt.toLocaleString()}\n\n`

          if (version.tags.length > 0) {
            exportData += `**Tags**: ${version.tags.join(', ')}\n\n`
          }

          if (options.includeCritiques && version.critique) {
            exportData += `**Score**: ${version.critique.overallScore}\n\n`
          }

          exportData += '---\n\n'
        }
      } else if (options.format === HistoryExportFormat.TIMELINE) {
        exportData = `# Timeline for ${options.songId}\n\n`

        for (const version of history.versions) {
          exportData += `- **v${version.versionNumber}** (${version.createdAt.toLocaleDateString()}): ${version.changeDescription}\n`
        }
      }

      return createSuccess(exportData)
    } catch (error) {
      return createFailure(
        createError(
          HistoryErrorCode.EXPORT_FAILED,
          'Failed to export history',
          'Try again',
          error instanceof Error ? error.message : 'Unknown error'
        )
      )
    }
  }

  /**
   * Search versions by criteria
   */
  async searchVersions(criteria: VersionSearchCriteria): Promise<ServiceResponse<readonly SongVersion[]>> {
    try {
      const results: SongVersion[] = []

      // Build search predicates
      const predicates: ((sv: StoredVersion) => boolean)[] = []

      if (criteria.songId) {
        predicates.push(sv => sv.songId === criteria.songId)
      }

      if (criteria.dateRange) {
        predicates.push(
          sv =>
            sv.createdAt >= criteria.dateRange!.start &&
            sv.createdAt <= criteria.dateRange!.end
        )
      }

      if (criteria.tags && criteria.tags.length > 0) {
        predicates.push(sv => criteria.tags!.some(tag => sv.tags.includes(tag)))
      }

      if (criteria.searchText) {
        const lowerText = criteria.searchText.toLowerCase()
        predicates.push(
          sv =>
            sv.changeDescription.toLowerCase().includes(lowerText) ||
            (sv.notes ? sv.notes.toLowerCase().includes(lowerText) : false)
        )
      }

      // Execute search
      for (const [, songVersions] of this.versionStorage) {
        for (const [, stored] of songVersions) {
          const matches = predicates.every(pred => pred(stored))
          if (matches) {
            results.push(this.createSongVersion(stored))
          }
        }
      }

      // Sort by version number
      results.sort((a, b) => a.versionNumber - b.versionNumber)

      return createSuccess(results as readonly SongVersion[])
    } catch (error) {
      return createFailure(
        createError(
          'SEARCH_FAILED',
          'Failed to search versions',
          'Try again',
          error instanceof Error ? error.message : 'Unknown error'
        )
      )
    }
  }

  /**
   * Helper: Create SongVersion from stored version
   */
  private createSongVersion(stored: StoredVersion): SongVersion {
    const version: SongVersion = {
      versionId: stored.versionId,
      songId: stored.songId,
      song: stored.song,
      versionNumber: stored.versionNumber,
      changeDescription: stored.changeDescription,
      changes: [] as const,
      createdAt: stored.createdAt,
      createdBy: stored.createdBy,
      tags: stored.tags,
      notes: stored.notes
    }
    // Freeze to enforce readonly at runtime
    return Object.freeze(version)
  }

  /**
   * Helper: Detect differences between two versions
   */
  private detectDifferences(version1: SongVersion, version2: SongVersion): Difference[] {
    const differences: Difference[] = []

    // Check title
    if (version1.song.title !== version2.song.title) {
      differences.push({
        type: DiffType.METADATA_CHANGED,
        location: 'title',
        before: version1.song.title,
        after: version2.song.title,
        description: 'Song title changed'
      })
    }

    // Check verse count
    if (version1.song.verses.length !== version2.song.verses.length) {
      differences.push({
        type: DiffType.SECTION_ADDED,
        location: 'verses',
        before: `${version1.song.verses.length} verses`,
        after: `${version2.song.verses.length} verses`,
        description: `Verse count changed from ${version1.song.verses.length} to ${version2.song.verses.length}`
      })
    }

    // Check chorus count
    if (version1.song.choruses.length !== version2.song.choruses.length) {
      differences.push({
        type: DiffType.SECTION_ADDED,
        location: 'choruses',
        before: `${version1.song.choruses.length} choruses`,
        after: `${version2.song.choruses.length} choruses`,
        description: `Chorus count changed from ${version1.song.choruses.length} to ${version2.song.choruses.length}`
      })
    }

    // Check metadata
    const meta1 = JSON.stringify(version1.song.metadata)
    const meta2 = JSON.stringify(version2.song.metadata)

    if (meta1 !== meta2) {
      differences.push({
        type: DiffType.METADATA_CHANGED,
        location: 'metadata',
        before: meta1,
        after: meta2,
        description: 'Metadata changed'
      })
    }

    return differences
  }
}
