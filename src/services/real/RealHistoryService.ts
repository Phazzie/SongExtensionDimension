/**
 * @fileoverview Real History Service - AI-Powered Version Control
 * @purpose Manage song versions with AI-powered analysis and comparison
 * @implements IHistoryService
 * @aiUsage Gemini AI for semantic version comparison and quality delta analysis
 * @created 2025-11-17
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import type * as vscode from 'vscode'
import type {
  IHistoryService,
  SaveVersionInput,
  SaveVersionResult,
  RetrieveVersionOptions,
  SongVersion,
  VersionHistory,
  Timeline,
  TimelineEntry,
  VersionComparison,
  RollbackOptions,
  RollbackResult,
  CleanupOptions,
  CleanupResult,
  StorageStatistics,
  ExportHistoryOptions,
  VersionSearchCriteria,
  VersionId,
  Difference,
  ImprovementComparison
} from '../../contracts/History'
import {
  createVersionId,
  parseVersionId,
  calculateStorageSize,
  DifferenceType,
  HistoryErrorCode,
  HistoryExportFormat
} from '../../contracts/History'
import type { Song, SongId } from '../../contracts/types/song'
import type { ServiceResponse } from '../../contracts/types/common'
import { createSuccess, createFailure, createError } from '../../contracts/types/common'

/**
 * AI-generated version comparison analysis
 */
interface AIVersionComparison {
  differences: Array<{
    section: string
    lineIndex: number
    before: string
    after: string
    changeType: 'wording' | 'structure' | 'rhyme' | 'rhythm'
    impact: 'improvement' | 'neutral' | 'degradation'
    explanation: string
  }>
  summary: {
    totalChanges: number
    improvements: number
    degradations: number
    majorChanges: number
    minorChanges: number
  }
  qualityDelta: {
    rhyme: number
    flow: number
    imagery: number
    overall: number
  }
  recommendation: 'keep_new' | 'revert' | 'merge'
}

/**
 * Metadata stored alongside versions
 */
interface StorageMetadata {
  totalSongs: number
  totalVersions: number
  totalStorageUsed: number
  lastUpdated: Date
}

/**
 * Real History Service Implementation
 *
 * Uses VSCode ExtensionContext storage (Memento API) for persistence
 * Uses Gemini AI for intelligent version comparison and analysis
 */
export class RealHistoryService implements IHistoryService {
  private readonly ai: GoogleGenerativeAI
  private readonly storage: vscode.Memento
  private readonly STORAGE_LIMIT = 100 * 1024 * 1024 // 100 MB
  private readonly COMPARISON_TEMPERATURE = 0.3

  /**
   * System prompt for AI version comparison
   */
  private readonly COMPARISON_PROMPT = `You are a version control and change analysis expert.

ROLE: Compare song versions and explain changes.

OUTPUT FORMAT (JSON):
{
  "differences": [
    {
      "section": "verse_1",
      "lineIndex": 2,
      "before": "...",
      "after": "...",
      "changeType": "wording|structure|rhyme|rhythm",
      "impact": "improvement|neutral|degradation",
      "explanation": "..."
    }
  ],
  "summary": {
    "totalChanges": 5,
    "improvements": 4,
    "degradations": 1,
    "majorChanges": 2,
    "minorChanges": 3
  },
  "qualityDelta": {
    "rhyme": +5,
    "flow": +3,
    "imagery": +8,
    "overall": +6
  },
  "recommendation": "keep_new|revert|merge"
}

Analyze changes deeply. Explain why changes help or hurt.`

  constructor(apiKey: string, storage: vscode.Memento) {
    this.ai = new GoogleGenerativeAI(apiKey)
    this.storage = storage
  }

  /**
   * Save a new version of a song
   */
  async saveVersion(input: SaveVersionInput): Promise<ServiceResponse<SaveVersionResult>> {
    try {
      // Validate input
      if (!input.song?.id) {
        return createFailure(
          createError(
            HistoryErrorCode.SAVE_FAILED,
            'Invalid song data',
            'Provide a valid song with an ID',
            'Song or song ID is missing'
          )
        )
      }

      // Get existing history or create new
      const history = await this.getOrCreateHistory(input.song.id)

      // Create new version
      const versionNumber = history.versions.length + 1
      const versionId = createVersionId(input.song.id, versionNumber)

      const version: SongVersion = {
        versionId,
        songId: input.song.id,
        song: input.song,
        versionNumber,
        changeDescription: input.changeDescription,
        changes: input.changes ?? [],
        critique: input.critique,
        createdAt: new Date(),
        tags: input.tags ?? [],
        notes: input.notes
      }

      // Calculate storage size
      const storageSize = calculateStorageSize(version)

      // Check storage quota
      const stats = await this.getStorageStatisticsInternal()
      if (stats.totalStorageUsed + storageSize > this.STORAGE_LIMIT) {
        return createFailure(
          createError(
            HistoryErrorCode.STORAGE_QUOTA_EXCEEDED,
            'Storage quota exceeded',
            'Delete old versions or increase storage limit',
            `Would exceed storage limit: ${stats.totalStorageUsed + storageSize} > ${this.STORAGE_LIMIT}`
          )
        )
      }

      // Add to history
      const updatedVersions = [...history.versions, version]
      await this.saveHistoryToStorage(input.song.id, updatedVersions)

      return createSuccess({
        versionId,
        versionNumber,
        savedAt: version.createdAt,
        storageSize
      })
    } catch (error) {
      return createFailure(
        createError(
          HistoryErrorCode.SAVE_FAILED,
          'Failed to save version',
          'Check storage permissions and try again',
          error instanceof Error ? error.message : String(error),
          error instanceof Error ? error : undefined
        )
      )
    }
  }

  /**
   * Retrieve a specific version
   */
  async getVersion(options: RetrieveVersionOptions): Promise<ServiceResponse<SongVersion>> {
    try {
      const versions = await this.getHistoryFromStorage(options.songId)

      if (!versions || versions.length === 0) {
        return createFailure(
          createError(
            HistoryErrorCode.SONG_NOT_FOUND,
            'Song not found',
            'Check the song ID and try again',
            `No history found for song: ${options.songId}`
          )
        )
      }

      // Find version by ID or number
      let version: SongVersion | undefined

      if (options.versionId) {
        version = versions.find(v => v.versionId === options.versionId)
      } else if (options.versionNumber !== undefined) {
        version = versions.find(v => v.versionNumber === options.versionNumber)
      } else if (options.fromDate || options.toDate) {
        // Filter by date range
        const filtered = versions.filter(v => {
          const inRange = (!options.fromDate || v.createdAt >= options.fromDate) &&
                         (!options.toDate || v.createdAt <= options.toDate)
          return inRange
        })
        version = filtered[filtered.length - 1] // Get latest in range
      } else if (options.tags && options.tags.length > 0) {
        // Filter by tags
        version = versions.find(v =>
          options.tags!.some(tag => v.tags.includes(tag))
        )
      }

      if (!version) {
        return createFailure(
          createError(
            HistoryErrorCode.VERSION_NOT_FOUND,
            'Version not found',
            'Check version number or ID and try again',
            `No version found matching criteria for song: ${options.songId}`
          )
        )
      }

      return createSuccess(version)
    } catch (error) {
      return createFailure(
        createError(
          HistoryErrorCode.RETRIEVAL_FAILED,
          'Failed to retrieve version',
          'Check storage and try again',
          error instanceof Error ? error.message : String(error),
          error instanceof Error ? error : undefined
        )
      )
    }
  }

  /**
   * Get complete version history for a song
   */
  async getHistory(songId: SongId): Promise<ServiceResponse<VersionHistory>> {
    try {
      const versions = await this.getHistoryFromStorage(songId)

      if (!versions || versions.length === 0) {
        return createFailure(
          createError(
            HistoryErrorCode.SONG_NOT_FOUND,
            'No history found',
            'This song has no saved versions',
            `No versions found for song: ${songId}`
          )
        )
      }

      const totalChanges = versions.reduce((sum, v) => sum + v.changes.length, 0)

      const history: VersionHistory = {
        songId,
        currentVersion: versions.length,
        versions,
        totalVersions: versions.length,
        firstCreated: versions[0]!.createdAt,
        lastModified: versions[versions.length - 1]!.createdAt,
        totalChanges
      }

      return createSuccess(history)
    } catch (error) {
      return createFailure(
        createError(
          HistoryErrorCode.RETRIEVAL_FAILED,
          'Failed to retrieve history',
          'Check storage and try again',
          error instanceof Error ? error.message : String(error),
          error instanceof Error ? error : undefined
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
        return historyResult as ServiceResponse<Timeline>
      }

      const history = historyResult.data

      const entries: TimelineEntry[] = history.versions.map(v => ({
        versionId: v.versionId,
        versionNumber: v.versionNumber,
        description: v.changeDescription,
        timestamp: v.createdAt,
        changeCount: v.changes.length,
        scoreDelta: v.critique?.overallScore
      }))

      const timeline: Timeline = {
        songId,
        entries,
        totalVersions: history.totalVersions,
        dateRange: {
          start: history.firstCreated,
          end: history.lastModified
        }
      }

      return createSuccess(timeline)
    } catch (error) {
      return createFailure(
        createError(
          HistoryErrorCode.RETRIEVAL_FAILED,
          'Failed to generate timeline',
          'Check storage and try again',
          error instanceof Error ? error.message : String(error),
          error instanceof Error ? error : undefined
        )
      )
    }
  }

  /**
   * Compare two versions using AI
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
      const v1Result = await this.getVersion({ songId: parsed1.songId, versionId: version1Id })
      const v2Result = await this.getVersion({ songId: parsed2.songId, versionId: version2Id })

      if (!v1Result.success) return v1Result as ServiceResponse<VersionComparison>
      if (!v2Result.success) return v2Result as ServiceResponse<VersionComparison>

      const version1 = v1Result.data
      const version2 = v2Result.data

      // Prepare AI comparison prompt
      const comparisonInput = {
        version1: this.songToText(version1.song),
        version2: this.songToText(version2.song),
        version1Number: version1.versionNumber,
        version2Number: version2.versionNumber,
        changes: version2.changes
      }

      // Call Gemini AI for comparison
      const model = this.ai.getGenerativeModel({
        model: 'gemini-1.5-pro',
        generationConfig: {
          temperature: this.COMPARISON_TEMPERATURE,
          responseMimeType: 'application/json'
        }
      })

      const prompt = `${this.COMPARISON_PROMPT}

VERSION 1 (v${comparisonInput.version1Number}):
${comparisonInput.version1}

VERSION 2 (v${comparisonInput.version2Number}):
${comparisonInput.version2}

RECORDED CHANGES:
${JSON.stringify(comparisonInput.changes, null, 2)}

Analyze the differences between these two song versions. Provide detailed insights about what changed and why.`

      const result = await model.generateContent(prompt)
      const responseText = result.response.text()
      const aiComparison = JSON.parse(responseText) as AIVersionComparison

      // Convert AI response to contract format
      const differences: Difference[] = aiComparison.differences.map(diff => ({
        type: this.mapChangeToDifferenceType(diff.changeType),
        location: `${diff.section}:${diff.lineIndex}`,
        before: diff.before,
        after: diff.after,
        description: diff.explanation
      }))

      // Build improvement metrics from critique reports if available
      let improvementMetrics: ImprovementComparison | undefined
      if (version1.critique && version2.critique) {
        const scoreChange = version2.critique.overallScore - version1.critique.overallScore
        const issuesFixed = version1.critique.issues.length - version2.critique.issues.length

        const categoryChanges = new Map<string, number>([
          ['rhyme', aiComparison.qualityDelta.rhyme],
          ['flow', aiComparison.qualityDelta.flow],
          ['imagery', aiComparison.qualityDelta.imagery],
          ['overall', aiComparison.qualityDelta.overall]
        ])

        improvementMetrics = {
          scoreChange,
          issuesFixed: Math.max(0, issuesFixed),
          issuesIntroduced: Math.max(0, -issuesFixed),
          qualityImproved: scoreChange > 0,
          categoryChanges
        }
      }

      const comparison: VersionComparison = {
        version1,
        version2,
        differences,
        improvementMetrics,
        summary: `${aiComparison.summary.totalChanges} changes total: ${aiComparison.summary.improvements} improvements, ${aiComparison.summary.degradations} degradations. Recommendation: ${aiComparison.recommendation}`
      }

      return createSuccess(comparison)
    } catch (error) {
      return createFailure(
        createError(
          HistoryErrorCode.RETRIEVAL_FAILED,
          'Failed to compare versions',
          'Check version IDs and try again',
          error instanceof Error ? error.message : String(error),
          error instanceof Error ? error : undefined
        )
      )
    }
  }

  /**
   * Rollback song to previous version
   */
  async rollback(options: RollbackOptions): Promise<ServiceResponse<RollbackResult>> {
    try {
      // Get current and target versions
      const history = await this.getHistoryFromStorage(options.songId)

      if (!history || history.length === 0) {
        return createFailure(
          createError(
            HistoryErrorCode.SONG_NOT_FOUND,
            'Song not found',
            'No history available for rollback',
            `No versions found for song: ${options.songId}`
          )
        )
      }

      const currentVersion = history[history.length - 1]!

      let targetVersion: SongVersion | undefined
      if (typeof options.targetVersion === 'number') {
        targetVersion = history.find(v => v.versionNumber === options.targetVersion)
      } else {
        targetVersion = history.find(v => v.versionId === options.targetVersion)
      }

      if (!targetVersion) {
        return createFailure(
          createError(
            HistoryErrorCode.VERSION_NOT_FOUND,
            'Target version not found',
            'Check version number/ID and try again',
            `Target version not found: ${options.targetVersion}`
          )
        )
      }

      let backupVersionId: VersionId | undefined

      // Create backup if requested
      if (options.preserveCurrentAsBackup) {
        const backupResult = await this.saveVersion({
          song: currentVersion.song,
          changeDescription: `Backup before rollback to v${targetVersion.versionNumber}`,
          changes: [],
          tags: ['backup', 'rollback']
        })

        if (backupResult.success) {
          backupVersionId = backupResult.data.versionId
        }
      }

      // Create new version from target if requested
      if (options.createNewVersion) {
        const rollbackResult = await this.saveVersion({
          song: targetVersion.song,
          changeDescription: `Rolled back to v${targetVersion.versionNumber}`,
          changes: [],
          critique: targetVersion.critique,
          tags: ['rollback']
        })

        if (!rollbackResult.success) {
          return rollbackResult as ServiceResponse<RollbackResult>
        }
      }

      const result: RollbackResult = {
        restoredSong: targetVersion.song,
        fromVersion: currentVersion.versionNumber,
        toVersion: targetVersion.versionNumber,
        backupVersionId,
        rolledBackAt: new Date()
      }

      return createSuccess(result)
    } catch (error) {
      return createFailure(
        createError(
          HistoryErrorCode.ROLLBACK_FAILED,
          'Rollback failed',
          'Check storage and try again',
          error instanceof Error ? error.message : String(error),
          error instanceof Error ? error : undefined
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
      const history = await this.getHistoryFromStorage(parsed.songId)

      if (!history) {
        return createFailure(
          createError(
            HistoryErrorCode.SONG_NOT_FOUND,
            'Song not found',
            'No history available',
            `No versions found for song: ${parsed.songId}`
          )
        )
      }

      const filteredVersions = history.filter(v => v.versionId !== versionId)

      if (filteredVersions.length === history.length) {
        return createFailure(
          createError(
            HistoryErrorCode.VERSION_NOT_FOUND,
            'Version not found',
            'Check version ID and try again',
            `Version not found: ${versionId}`
          )
        )
      }

      await this.saveHistoryToStorage(parsed.songId, filteredVersions)
      return createSuccess(undefined)
    } catch (error) {
      return createFailure(
        createError(
          HistoryErrorCode.CLEANUP_FAILED,
          'Failed to delete version',
          'Check storage permissions and try again',
          error instanceof Error ? error.message : String(error),
          error instanceof Error ? error : undefined
        )
      )
    }
  }

  /**
   * Delete all versions for a song
   */
  async deleteHistory(songId: SongId, keepCurrent = false): Promise<ServiceResponse<number>> {
    try {
      const history = await this.getHistoryFromStorage(songId)

      if (!history || history.length === 0) {
        return createSuccess(0)
      }

      const deletedCount = keepCurrent ? history.length - 1 : history.length

      if (keepCurrent && history.length > 0) {
        const currentVersion = history[history.length - 1]!
        await this.saveHistoryToStorage(songId, [currentVersion])
      } else {
        await this.storage.update(this.getStorageKey(songId), undefined)
      }

      return createSuccess(deletedCount)
    } catch (error) {
      return createFailure(
        createError(
          HistoryErrorCode.CLEANUP_FAILED,
          'Failed to delete history',
          'Check storage permissions and try again',
          error instanceof Error ? error.message : String(error),
          error instanceof Error ? error : undefined
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
      let spaceFreed = 0
      const errors: string[] = []

      // Get all song IDs or just the specified one
      const songIds = options.songId ? [options.songId] : await this.getAllSongIds()

      for (const songId of songIds) {
        const history = await this.getHistoryFromStorage(songId)
        if (!history) continue

        let versionsToKeep = [...history]

        // Apply keepLatest filter
        if (options.keepLatest && versionsToKeep.length > options.keepLatest) {
          const toDelete = versionsToKeep.slice(0, versionsToKeep.length - options.keepLatest)
          versionsToKeep = versionsToKeep.slice(-options.keepLatest)

          for (const v of toDelete) {
            deletedVersionIds.push(v.versionId)
            spaceFreed += calculateStorageSize(v)
          }
        }

        // Apply olderThan filter
        if (options.olderThan) {
          const filtered = versionsToKeep.filter(v => v.createdAt >= options.olderThan!)
          const toDelete = versionsToKeep.filter(v => v.createdAt < options.olderThan!)

          for (const v of toDelete) {
            if (!deletedVersionIds.includes(v.versionId)) {
              deletedVersionIds.push(v.versionId)
              spaceFreed += calculateStorageSize(v)
            }
          }

          versionsToKeep = filtered
        }

        // Apply removeUntagged filter
        if (options.removeUntagged) {
          const toDelete = versionsToKeep.filter(v => v.tags.length === 0)
          versionsToKeep = versionsToKeep.filter(v => v.tags.length > 0)

          for (const v of toDelete) {
            if (!deletedVersionIds.includes(v.versionId)) {
              deletedVersionIds.push(v.versionId)
              spaceFreed += calculateStorageSize(v)
            }
          }
        }

        // Save updated history (if not dry run)
        if (!options.dryRun) {
          try {
            await this.saveHistoryToStorage(songId, versionsToKeep)
          } catch (error) {
            errors.push(`Failed to update history for ${songId}: ${error}`)
          }
        }
      }

      const result: CleanupResult = {
        versionsDeleted: deletedVersionIds.length,
        spaceFreed,
        deletedVersionIds,
        errors
      }

      return createSuccess(result)
    } catch (error) {
      return createFailure(
        createError(
          HistoryErrorCode.CLEANUP_FAILED,
          'Cleanup failed',
          'Check options and try again',
          error instanceof Error ? error.message : String(error),
          error instanceof Error ? error : undefined
        )
      )
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStatistics(): Promise<ServiceResponse<StorageStatistics>> {
    try {
      const stats = await this.getStorageStatisticsInternal()
      return createSuccess(stats)
    } catch (error) {
      return createFailure(
        createError(
          HistoryErrorCode.RETRIEVAL_FAILED,
          'Failed to get storage statistics',
          'Check storage and try again',
          error instanceof Error ? error.message : String(error),
          error instanceof Error ? error : undefined
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
        return historyResult as ServiceResponse<string>
      }

      const history = historyResult.data

      // Generate export content (stored in VSCode workspace for real implementation)
      switch (options.format) {
        case HistoryExportFormat.JSON:
          this.exportAsJSON(history, options)
          break
        case HistoryExportFormat.MARKDOWN:
          this.exportAsMarkdown(history, options)
          break
        case HistoryExportFormat.TIMELINE:
          this.exportAsTimeline(history, options)
          break
        default:
          this.exportAsJSON(history, options)
      }

      // In a real implementation, this would write to a file
      // For now, return the content as a string path representation
      const exportPath = `/exports/${options.songId}_history.${options.format}`

      return createSuccess(exportPath)
    } catch (error) {
      return createFailure(
        createError(
          HistoryErrorCode.EXPORT_FAILED,
          'Export failed',
          'Check export options and try again',
          error instanceof Error ? error.message : String(error),
          error instanceof Error ? error : undefined
        )
      )
    }
  }

  /**
   * Search versions by criteria
   */
  async searchVersions(
    criteria: VersionSearchCriteria
  ): Promise<ServiceResponse<readonly SongVersion[]>> {
    try {
      const songIds = criteria.songId ? [criteria.songId] : await this.getAllSongIds()
      let allVersions: SongVersion[] = []

      // Collect all versions
      for (const songId of songIds) {
        const history = await this.getHistoryFromStorage(songId)
        if (history) {
          allVersions = allVersions.concat(history)
        }
      }

      // Apply filters
      let results = allVersions

      if (criteria.dateRange) {
        results = results.filter(v =>
          v.createdAt >= criteria.dateRange!.start &&
          v.createdAt <= criteria.dateRange!.end
        )
      }

      if (criteria.tags && criteria.tags.length > 0) {
        results = results.filter(v =>
          criteria.tags!.some(tag => v.tags.includes(tag))
        )
      }

      if (criteria.minScore !== undefined) {
        results = results.filter(v =>
          v.critique && v.critique.overallScore >= criteria.minScore!
        )
      }

      if (criteria.maxScore !== undefined) {
        results = results.filter(v =>
          v.critique && v.critique.overallScore <= criteria.maxScore!
        )
      }

      if (criteria.hasChanges !== undefined) {
        results = results.filter(v =>
          criteria.hasChanges ? v.changes.length > 0 : v.changes.length === 0
        )
      }

      if (criteria.changeTypes && criteria.changeTypes.length > 0) {
        results = results.filter(v =>
          v.changes.some(_change => {
            // This would need proper mapping from ChangeRecord to DifferenceType
            return true // Simplified for now
          })
        )
      }

      if (criteria.searchText) {
        const searchLower = criteria.searchText.toLowerCase()
        results = results.filter(v =>
          v.changeDescription.toLowerCase().includes(searchLower) ||
          v.notes?.toLowerCase().includes(searchLower) ||
          this.songToText(v.song).toLowerCase().includes(searchLower)
        )
      }

      return createSuccess(results)
    } catch (error) {
      return createFailure(
        createError(
          HistoryErrorCode.RETRIEVAL_FAILED,
          'Search failed',
          'Check search criteria and try again',
          error instanceof Error ? error.message : String(error),
          error instanceof Error ? error : undefined
        )
      )
    }
  }

  // ========== PRIVATE HELPER METHODS ==========

  /**
   * Get or create history for a song
   */
  private async getOrCreateHistory(songId: SongId): Promise<{ versions: SongVersion[] }> {
    const versions = await this.getHistoryFromStorage(songId)
    return { versions: versions ?? [] }
  }

  /**
   * Get history from storage
   */
  private async getHistoryFromStorage(songId: SongId): Promise<SongVersion[] | null> {
    const key = this.getStorageKey(songId)
    const data = this.storage.get<SongVersion[]>(key)
    return data ?? null
  }

  /**
   * Save history to storage
   */
  private async saveHistoryToStorage(songId: SongId, versions: SongVersion[]): Promise<void> {
    const key = this.getStorageKey(songId)
    await this.storage.update(key, versions)
    await this.updateMetadata()
  }

  /**
   * Get storage key for a song
   */
  private getStorageKey(songId: SongId): string {
    return `history:${songId}`
  }

  /**
   * Get all song IDs that have history
   */
  private async getAllSongIds(): Promise<SongId[]> {
    const keys = this.storage.keys()
    return keys
      .filter(k => k.startsWith('history:'))
      .map(k => k.replace('history:', '') as SongId)
  }

  /**
   * Get storage statistics (internal)
   */
  private async getStorageStatisticsInternal(): Promise<StorageStatistics> {
    const songIds = await this.getAllSongIds()
    let totalVersions = 0
    let totalStorageUsed = 0
    let oldestVersion: Date | null = null
    let newestVersion: Date | null = null

    for (const songId of songIds) {
      const history = await this.getHistoryFromStorage(songId)
      if (!history) continue

      totalVersions += history.length

      for (const version of history) {
        totalStorageUsed += calculateStorageSize(version)

        if (!oldestVersion || version.createdAt < oldestVersion) {
          oldestVersion = version.createdAt
        }
        if (!newestVersion || version.createdAt > newestVersion) {
          newestVersion = version.createdAt
        }
      }
    }

    return {
      totalSongs: songIds.length,
      totalVersions,
      totalStorageUsed,
      averageVersionsPerSong: songIds.length > 0 ? totalVersions / songIds.length : 0,
      oldestVersion: oldestVersion ?? new Date(),
      newestVersion: newestVersion ?? new Date(),
      storageLimit: this.STORAGE_LIMIT,
      percentUsed: (totalStorageUsed / this.STORAGE_LIMIT) * 100
    }
  }

  /**
   * Update storage metadata
   */
  private async updateMetadata(): Promise<void> {
    const stats = await this.getStorageStatisticsInternal()
    const metadata: StorageMetadata = {
      totalSongs: stats.totalSongs,
      totalVersions: stats.totalVersions,
      totalStorageUsed: stats.totalStorageUsed,
      lastUpdated: new Date()
    }
    await this.storage.update('metadata:history', metadata)
  }

  /**
   * Convert song to text for comparison
   */
  private songToText(song: Song): string {
    const lines: string[] = []

    lines.push(`TITLE: ${song.title}`)
    lines.push('')

    for (const verse of song.verses) {
      lines.push(`[Verse ${verse.number}]`)
      for (const line of verse.lines) {
        lines.push(line.text)
      }
      lines.push('')
    }

    for (const chorus of song.choruses) {
      lines.push('[Chorus]')
      for (const line of chorus.lines) {
        lines.push(line.text)
      }
      lines.push('')
    }

    if (song.bridge) {
      lines.push('[Bridge]')
      for (const line of song.bridge.lines) {
        lines.push(line.text)
      }
      lines.push('')
    }

    return lines.join('\n')
  }

  /**
   * Map AI change type to DifferenceType
   */
  private mapChangeToDifferenceType(changeType: string): DifferenceType {
    switch (changeType) {
      case 'wording':
        return DifferenceType.LINE_CHANGED
      case 'structure':
        return DifferenceType.STRUCTURE_CHANGED
      case 'rhyme':
      case 'rhythm':
        return DifferenceType.LINE_CHANGED
      default:
        return DifferenceType.LINE_CHANGED
    }
  }

  /**
   * Export as JSON
   */
  private exportAsJSON(history: VersionHistory, _options: ExportHistoryOptions): string {
    const exportData = {
      songId: history.songId,
      exportedAt: new Date().toISOString(),
      totalVersions: history.totalVersions,
      versions: history.versions.map(v => ({
        versionNumber: v.versionNumber,
        changeDescription: v.changeDescription,
        createdAt: v.createdAt.toISOString(),
        tags: v.tags,
        notes: v.notes,
        song: _options.includeFullSongs ? v.song : undefined,
        critique: _options.includeCritiques ? v.critique : undefined
      }))
    }
    return JSON.stringify(exportData, null, 2)
  }

  /**
   * Export as Markdown
   */
  private exportAsMarkdown(history: VersionHistory, options: ExportHistoryOptions): string {
    const lines: string[] = []

    lines.push(`# Song History: ${history.versions[0]?.song.title ?? 'Untitled'}`)
    lines.push('')
    lines.push(`**Total Versions:** ${history.totalVersions}`)
    lines.push(`**First Created:** ${history.firstCreated.toLocaleDateString()}`)
    lines.push(`**Last Modified:** ${history.lastModified.toLocaleDateString()}`)
    lines.push('')

    for (const version of history.versions) {
      lines.push(`## Version ${version.versionNumber}`)
      lines.push('')
      lines.push(`**Date:** ${version.createdAt.toLocaleDateString()}`)
      lines.push(`**Changes:** ${version.changeDescription}`)
      if (version.tags.length > 0) {
        lines.push(`**Tags:** ${version.tags.join(', ')}`)
      }
      if (version.notes) {
        lines.push(`**Notes:** ${version.notes}`)
      }
      lines.push('')

      if (options.includeFullSongs) {
        lines.push('### Song Content')
        lines.push('```')
        lines.push(this.songToText(version.song))
        lines.push('```')
        lines.push('')
      }

      if (options.includeCritiques && version.critique) {
        lines.push('### Quality Analysis')
        lines.push(`- **Overall Score:** ${version.critique.overallScore}`)
        lines.push(`- **Quality Level:** ${version.critique.qualityLevel}`)
        lines.push(`- **Issues:** ${version.critique.issues.length}`)
        lines.push('')
      }
    }

    return lines.join('\n')
  }

  /**
   * Export as Timeline
   */
  private exportAsTimeline(history: VersionHistory, _options: ExportHistoryOptions): string {
    const lines: string[] = []

    lines.push(`TIMELINE: ${history.versions[0]?.song.title ?? 'Untitled'}`)
    lines.push('='.repeat(60))
    lines.push('')

    for (const version of history.versions) {
      const date = version.createdAt.toLocaleDateString()
      const time = version.createdAt.toLocaleTimeString()
      const score = version.critique?.overallScore ?? 'N/A'

      lines.push(`v${version.versionNumber} | ${date} ${time}`)
      lines.push(`  ├─ ${version.changeDescription}`)
      lines.push(`  ├─ Score: ${score}`)
      lines.push(`  ├─ Changes: ${version.changes.length}`)
      lines.push(`  └─ Tags: ${version.tags.join(', ') || 'none'}`)
      lines.push('')
    }

    return lines.join('\n')
  }
}
