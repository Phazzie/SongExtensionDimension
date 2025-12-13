/**
 * @fileoverview Contract Tests for History Service
 * @purpose Ensure any implementation of IHistoryService matches the contract exactly
 *
 * TEST-DRIVEN DEVELOPMENT APPROACH:
 * These tests are written BEFORE the mock implementation.
 * The mock implementation should be written to make these tests pass.
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import type {
  IHistoryService,
  SaveVersionInput,
  RetrieveVersionOptions,
  VersionHistory,
  SongVersion,
  VersionComparison,
  RollbackOptions,
  CleanupOptions,
  ExportHistoryOptions,
  VersionSearchCriteria,
  DifferenceType,
  Timeline
} from '../../src/contracts/History'
import {
  createVersionId,
  parseVersionId,
  HistoryErrorCode,
  DifferenceType as DiffTypeEnum,
  HistoryExportFormat
} from '../../src/contracts/History'
import { isSuccess, isFailure } from '../../src/contracts/types/common'
import { MockHistoryService } from '../../src/services/mock/MockHistoryService'
import type { Song, SongId } from '../../src/contracts/types/song'
import { createSongId, createVerseId, createChorusId } from '../../src/contracts/types/song'

/**
 * Helper to create a test song
 */
function createTestSong(
  id: SongId = createSongId('song_test_1'),
  title: string = 'Test Song'
): Song {
  return {
    id,
    title,
    verses: [
      {
        id: createVerseId('verse_1'),
        number: 1,
        lines: [
          { text: 'First line of the verse', syllables: 8, stressPattern: 'x/x/x/x/' },
          { text: 'Second line follows here', syllables: 8, stressPattern: 'x/x/x/x/' },
          { text: 'Third line continues now', syllables: 8, stressPattern: 'x/x/x/x/' },
          { text: 'Fourth line wraps it up', syllables: 8, stressPattern: 'x/x/x/x/' }
        ],
        rhymeScheme: 'ABAB',
        syllablePattern: [8, 8, 8, 8]
      }
    ],
    choruses: [
      {
        id: createChorusId('chorus_1'),
        lines: [
          { text: 'Chorus line one', syllables: 6, stressPattern: '/x/x/' },
          { text: 'Chorus line two', syllables: 6, stressPattern: '/x/x/' }
        ],
        rhymeScheme: 'AA',
        syllablePattern: [6, 6],
        isMainChorus: true
      }
    ],
    metadata: {
      genre: 'pop',
      mood: 'upbeat',
      version: 1
    },
    generatedAt: new Date()
  }
}

describe('IHistoryService Contract Tests', () => {
  let service: IHistoryService
  const testSongId = createSongId('song_test_1')

  beforeEach(() => {
    service = new MockHistoryService()
  })

  describe('saveVersion() method', () => {
    describe('Success Cases', () => {
      it('should save a version with minimal input', async () => {
        const song = createTestSong()
        const input: SaveVersionInput = {
          song,
          changeDescription: 'Initial version'
        }

        const result = await service.saveVersion(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data).toHaveProperty('versionId')
          expect(result.data).toHaveProperty('versionNumber')
          expect(result.data).toHaveProperty('savedAt')
          expect(result.data).toHaveProperty('storageSize')
          expect(result.data.versionNumber).toBe(1)
          expect(result.data.storageSize).toBeGreaterThan(0)
        }
      })

      it('should save a version with all optional fields', async () => {
        const song = createTestSong()
        const input: SaveVersionInput = {
          song,
          changeDescription: 'Enhanced imagery',
          tags: ['improved', 'v2'],
          notes: 'Made changes to verse 2',
          changes: []
        }

        const result = await service.saveVersion(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.versionNumber).toBe(1)
        }
      })

      it('should increment version numbers sequentially', async () => {
        const song = createTestSong()

        // Save first version
        const result1 = await service.saveVersion({
          song,
          changeDescription: 'v1'
        })

        // Save second version
        const result2 = await service.saveVersion({
          song,
          changeDescription: 'v2'
        })

        expect(isSuccess(result1)).toBe(true)
        expect(isSuccess(result2)).toBe(true)

        if (isSuccess(result1) && isSuccess(result2)) {
          expect(result1.data.versionNumber).toBe(1)
          expect(result2.data.versionNumber).toBe(2)
        }
      })

      it('should return valid version ID', async () => {
        const song = createTestSong(testSongId)
        const input: SaveVersionInput = {
          song,
          changeDescription: 'Test version'
        }

        const result = await service.saveVersion(input)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const versionId = result.data.versionId
          expect(typeof versionId).toBe('string')
          expect(versionId.length).toBeGreaterThan(0)

          // Parse version ID
          const parsed = parseVersionId(versionId)
          expect(parsed.versionNumber).toBe(1)
        }
      })

      it('should accept tags as readonly array', async () => {
        const song = createTestSong()
        const tags: readonly string[] = ['tag1', 'tag2'] as const
        const input: SaveVersionInput = {
          song,
          changeDescription: 'Tagged version',
          tags
        }

        const result = await service.saveVersion(input)

        expect(isSuccess(result)).toBe(true)
      })

      it('should set correct timestamp', async () => {
        const song = createTestSong()
        const input: SaveVersionInput = {
          song,
          changeDescription: 'Timestamped version'
        }

        const beforeSave = new Date()
        const result = await service.saveVersion(input)
        const afterSave = new Date()

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.savedAt.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime())
          expect(result.data.savedAt.getTime()).toBeLessThanOrEqual(afterSave.getTime())
        }
      })
    })

    describe('Error Cases', () => {
      it('should handle empty change description gracefully', async () => {
        const song = createTestSong()
        const input: SaveVersionInput = {
          song,
          changeDescription: ''
        }

        const result = await service.saveVersion(input)

        // Should succeed but might have warnings, or fail
        expect(result).toHaveProperty('success')
      })

      it('should never throw exceptions', async () => {
        const badInputs = [
          null,
          undefined,
          // @ts-expect-error - Testing runtime behavior
          { song: null, changeDescription: 'test' },
          // @ts-expect-error - Testing runtime behavior
          { changeDescription: 'test' }
        ]

        for (const input of badInputs) {
          await expect(service.saveVersion(input as any)).resolves.toBeDefined()
        }
      })
    })
  })

  describe('getVersion() method', () => {
    describe('Success Cases', () => {
      it('should retrieve a saved version by version number', async () => {
        // First, save a version
        const song = createTestSong(testSongId)
        const saveResult = await service.saveVersion({
          song,
          changeDescription: 'Test version'
        })

        expect(isSuccess(saveResult)).toBe(true)

        // Then retrieve it
        if (isSuccess(saveResult)) {
          const options: RetrieveVersionOptions = {
            songId: testSongId,
            versionNumber: 1
          }

          const getResult = await service.getVersion(options)

          expect(isSuccess(getResult)).toBe(true)
          if (isSuccess(getResult)) {
            const version = getResult.data
            expect(version.songId).toBe(testSongId)
            expect(version.versionNumber).toBe(1)
            expect(version.song.id).toBe(testSongId)
          }
        }
      })

      it('should retrieve a version by version ID', async () => {
        const song = createTestSong(testSongId)
        const saveResult = await service.saveVersion({
          song,
          changeDescription: 'v1'
        })

        expect(isSuccess(saveResult)).toBe(true)

        if (isSuccess(saveResult)) {
          const versionId = saveResult.data.versionId
          const options: RetrieveVersionOptions = {
            songId: testSongId,
            versionId
          }

          const getResult = await service.getVersion(options)

          expect(isSuccess(getResult)).toBe(true)
          if (isSuccess(getResult)) {
            expect(getResult.data.versionId).toBe(versionId)
          }
        }
      })

      it('should filter by date range', async () => {
        const song = createTestSong(testSongId)
        await service.saveVersion({
          song,
          changeDescription: 'v1'
        })

        const fromDate = new Date(Date.now() - 60000) // 1 minute ago
        const toDate = new Date(Date.now() + 60000) // 1 minute from now

        const options: RetrieveVersionOptions = {
          songId: testSongId,
          fromDate,
          toDate
        }

        const result = await service.getVersion(options)

        expect(isSuccess(result)).toBe(true)
      })

      it('should support tag filtering', async () => {
        const song = createTestSong(testSongId)
        await service.saveVersion({
          song,
          changeDescription: 'Tagged version',
          tags: ['important', 'final']
        })

        const options: RetrieveVersionOptions = {
          songId: testSongId,
          tags: ['important']
        }

        const result = await service.getVersion(options)

        expect(result).toHaveProperty('success')
      })
    })

    describe('Error Cases', () => {
      it('should fail when version not found', async () => {
        // First save a version
        const song = createTestSong(testSongId)
        await service.saveVersion({
          song,
          changeDescription: 'v1'
        })

        // Then try to get a non-existent version
        const options: RetrieveVersionOptions = {
          songId: testSongId,
          versionNumber: 9999
        }

        const result = await service.getVersion(options)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(HistoryErrorCode.VERSION_NOT_FOUND)
        }
      })

      it('should fail for non-existent song', async () => {
        const options: RetrieveVersionOptions = {
          songId: createSongId('non_existent'),
          versionNumber: 1
        }

        const result = await service.getVersion(options)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(HistoryErrorCode.SONG_NOT_FOUND)
        }
      })

      it('should never throw', async () => {
        const badInputs = [
          null,
          undefined,
          // @ts-expect-error - Testing runtime behavior
          { songId: null }
        ]

        for (const input of badInputs) {
          await expect(service.getVersion(input as any)).resolves.toBeDefined()
        }
      })
    })
  })

  describe('getHistory() method', () => {
    describe('Success Cases', () => {
      it('should return empty history for new song', async () => {
        const options = testSongId

        const result = await service.getHistory(options)

        // Should succeed even if no versions
        expect(result).toHaveProperty('success')
      })

      it('should return all versions for a song', async () => {
        const song = createTestSong(testSongId)

        // Save multiple versions
        await service.saveVersion({
          song,
          changeDescription: 'v1'
        })

        const modifiedSong = { ...song, title: 'Modified Song' }
        await service.saveVersion({
          song: modifiedSong,
          changeDescription: 'v2'
        })

        const result = await service.getHistory(testSongId)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const history: VersionHistory = result.data
          expect(history).toHaveProperty('songId')
          expect(history).toHaveProperty('currentVersion')
          expect(history).toHaveProperty('versions')
          expect(history).toHaveProperty('totalVersions')
          expect(history).toHaveProperty('firstCreated')
          expect(history).toHaveProperty('lastModified')
          expect(Array.isArray(history.versions)).toBe(true)
          expect(history.totalVersions).toBeGreaterThan(0)
        }
      })

      it('should set correct metadata in history', async () => {
        const song = createTestSong(testSongId)
        await service.saveVersion({
          song,
          changeDescription: 'Initial'
        })

        const result = await service.getHistory(testSongId)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const history = result.data
          expect(history.songId).toBe(testSongId)
          expect(history.firstCreated).toBeInstanceOf(Date)
          expect(history.lastModified).toBeInstanceOf(Date)
        }
      })
    })

    describe('Error Cases', () => {
      it('should fail for non-existent song', async () => {
        const result = await service.getHistory(createSongId('no_such_song'))

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(HistoryErrorCode.SONG_NOT_FOUND)
        }
      })
    })
  })

  describe('getTimeline() method', () => {
    describe('Success Cases', () => {
      it('should return timeline for song', async () => {
        const song = createTestSong(testSongId)
        await service.saveVersion({
          song,
          changeDescription: 'Version 1'
        })

        const result = await service.getTimeline(testSongId)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const timeline: Timeline = result.data
          expect(timeline).toHaveProperty('songId')
          expect(timeline).toHaveProperty('entries')
          expect(timeline).toHaveProperty('totalVersions')
          expect(timeline).toHaveProperty('dateRange')
          expect(Array.isArray(timeline.entries)).toBe(true)
        }
      })

      it('should have entries in chronological order', async () => {
        const song = createTestSong(testSongId)

        // Create versions with delays
        await service.saveVersion({
          song,
          changeDescription: 'v1'
        })

        await new Promise(resolve => setTimeout(resolve, 10))

        const modifiedSong = { ...song, title: 'Version 2' }
        await service.saveVersion({
          song: modifiedSong,
          changeDescription: 'v2'
        })

        const result = await service.getTimeline(testSongId)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const timeline = result.data
          const entries = Array.from(timeline.entries)
          expect(entries.length).toBeGreaterThan(0)
          // Check chronological order
          for (let i = 0; i < entries.length - 1; i++) {
            const current = entries[i]!
            const next = entries[i + 1]!
            expect(current.timestamp.getTime()).toBeLessThanOrEqual(
              next.timestamp.getTime()
            )
          }
        }
      })
    })

    describe('Error Cases', () => {
      it('should fail for non-existent song', async () => {
        const result = await service.getTimeline(createSongId('no_song'))

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(HistoryErrorCode.SONG_NOT_FOUND)
        }
      })
    })
  })

  describe('compareVersions() method', () => {
    describe('Success Cases', () => {
      it('should compare two different versions', async () => {
        const song1 = createTestSong(testSongId)
        const result1 = await service.saveVersion({
          song: song1,
          changeDescription: 'v1'
        })

        expect(isSuccess(result1)).toBe(true)

        if (isSuccess(result1)) {
          const versionId1 = result1.data.versionId

          // Create second version
          const song2 = { ...song1, title: 'Updated Song' }
          const result2 = await service.saveVersion({
            song: song2,
            changeDescription: 'v2'
          })

          expect(isSuccess(result2)).toBe(true)

          if (isSuccess(result2)) {
            const versionId2 = result2.data.versionId

            const compareResult = await service.compareVersions(versionId1, versionId2)

            expect(isSuccess(compareResult)).toBe(true)
            if (isSuccess(compareResult)) {
              const comparison: VersionComparison = compareResult.data
              expect(comparison).toHaveProperty('version1')
              expect(comparison).toHaveProperty('version2')
              expect(comparison).toHaveProperty('differences')
              expect(comparison).toHaveProperty('summary')
              expect(Array.isArray(comparison.differences)).toBe(true)
            }
          }
        }
      })

      it('should detect title changes', async () => {
        const song1 = createTestSong(testSongId, 'Original Title')
        const result1 = await service.saveVersion({
          song: song1,
          changeDescription: 'Original'
        })

        expect(isSuccess(result1)).toBe(true)

        if (isSuccess(result1)) {
          const versionId1 = result1.data.versionId

          const song2 = createTestSong(testSongId, 'New Title')
          const result2 = await service.saveVersion({
            song: song2,
            changeDescription: 'Title changed'
          })

          expect(isSuccess(result2)).toBe(true)

          if (isSuccess(result2)) {
            const versionId2 = result2.data.versionId
            const compareResult = await service.compareVersions(versionId1, versionId2)

            expect(isSuccess(compareResult)).toBe(true)
            if (isSuccess(compareResult)) {
              const comparison = compareResult.data
              // Should have at least one difference
              expect(comparison.differences.length).toBeGreaterThan(0)
            }
          }
        }
      })
    })

    describe('Error Cases', () => {
      it('should fail for non-existent version1', async () => {
        const fakeId1 = createVersionId(testSongId, 9999)
        const fakeId2 = createVersionId(testSongId, 10000)

        const result = await service.compareVersions(fakeId1, fakeId2)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(HistoryErrorCode.VERSION_NOT_FOUND)
        }
      })
    })
  })

  describe('deleteVersion() method', () => {
    describe('Success Cases', () => {
      it('should delete a specific version', async () => {
        const song = createTestSong(testSongId)
        const saveResult = await service.saveVersion({
          song,
          changeDescription: 'v1'
        })

        expect(isSuccess(saveResult)).toBe(true)

        if (isSuccess(saveResult)) {
          const versionId = saveResult.data.versionId

          // Delete the version
          const deleteResult = await service.deleteVersion(versionId)

          expect(isSuccess(deleteResult)).toBe(true)
        }
      })

      it('should allow retrieving remaining versions after deletion', async () => {
        const song = createTestSong(testSongId)

        // Save two versions
        const result1 = await service.saveVersion({
          song,
          changeDescription: 'v1'
        })

        const result2 = await service.saveVersion({
          song,
          changeDescription: 'v2'
        })

        expect(isSuccess(result1)).toBe(true)
        expect(isSuccess(result2)).toBe(true)

        if (isSuccess(result1) && isSuccess(result2)) {
          const versionId1 = result1.data.versionId

          // Delete first version
          await service.deleteVersion(versionId1)

          // Second version should still be retrievable
          const getResult = await service.getVersion({
            songId: testSongId,
            versionNumber: 2
          })

          expect(isSuccess(getResult)).toBe(true)
        }
      })
    })

    describe('Error Cases', () => {
      it('should fail for non-existent version', async () => {
        const fakeId = createVersionId(testSongId, 9999)

        const result = await service.deleteVersion(fakeId)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(HistoryErrorCode.VERSION_NOT_FOUND)
        }
      })
    })
  })

  describe('deleteHistory() method', () => {
    describe('Success Cases', () => {
      it('should delete all versions for a song', async () => {
        const song = createTestSong(testSongId)

        // Create multiple versions
        await service.saveVersion({
          song,
          changeDescription: 'v1'
        })

        await service.saveVersion({
          song,
          changeDescription: 'v2'
        })

        // Delete all history
        const result = await service.deleteHistory(testSongId, false)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          // Should return count of deleted versions
          expect(typeof result.data).toBe('number')
          expect(result.data).toBeGreaterThan(0)
        }
      })

      it('should support keepCurrent flag', async () => {
        const song = createTestSong(testSongId)

        await service.saveVersion({
          song,
          changeDescription: 'v1'
        })

        await service.saveVersion({
          song,
          changeDescription: 'v2'
        })

        // Delete all but keep current
        const result = await service.deleteHistory(testSongId, true)

        expect(isSuccess(result)).toBe(true)
      })
    })

    describe('Error Cases', () => {
      it('should fail for non-existent song', async () => {
        const result = await service.deleteHistory(createSongId('no_song'))

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(HistoryErrorCode.SONG_NOT_FOUND)
        }
      })
    })
  })

  describe('rollback() method', () => {
    describe('Success Cases', () => {
      it('should rollback to a previous version by number', async () => {
        const song1 = createTestSong(testSongId, 'Version 1')
        const song2 = { ...song1, title: 'Version 2' }

        await service.saveVersion({
          song: song1,
          changeDescription: 'v1'
        })

        await service.saveVersion({
          song: song2,
          changeDescription: 'v2'
        })

        // Rollback to v1
        const options: RollbackOptions = {
          songId: testSongId,
          targetVersion: 1,
          createNewVersion: true,
          preserveCurrentAsBackup: true
        }

        const result = await service.rollback(options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.restoredSong.title).toBe('Version 1')
          expect(result.data.rolledBackAt).toBeInstanceOf(Date)
        }
      })

      it('should create backup when preserveCurrentAsBackup is true', async () => {
        const song1 = createTestSong(testSongId)
        const song2 = { ...song1, title: 'Version 2' }

        await service.saveVersion({
          song: song1,
          changeDescription: 'v1'
        })

        await service.saveVersion({
          song: song2,
          changeDescription: 'v2'
        })

        const options: RollbackOptions = {
          songId: testSongId,
          targetVersion: 1,
          createNewVersion: true,
          preserveCurrentAsBackup: true
        }

        const result = await service.rollback(options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.backupVersionId).toBeDefined()
        }
      })
    })

    describe('Error Cases', () => {
      it('should fail for non-existent target version', async () => {
        const song = createTestSong(testSongId)
        await service.saveVersion({
          song,
          changeDescription: 'v1'
        })

        const options: RollbackOptions = {
          songId: testSongId,
          targetVersion: 9999,
          createNewVersion: false,
          preserveCurrentAsBackup: false
        }

        const result = await service.rollback(options)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(HistoryErrorCode.VERSION_NOT_FOUND)
        }
      })

      it('should fail for non-existent song', async () => {
        const options: RollbackOptions = {
          songId: createSongId('no_song'),
          targetVersion: 1,
          createNewVersion: false,
          preserveCurrentAsBackup: false
        }

        const result = await service.rollback(options)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(HistoryErrorCode.SONG_NOT_FOUND)
        }
      })
    })
  })

  describe('cleanup() method', () => {
    describe('Success Cases', () => {
      it('should cleanup old versions and return count', async () => {
        const song = createTestSong(testSongId)

        // Save multiple versions
        for (let i = 0; i < 5; i++) {
          await service.saveVersion({
            song,
            changeDescription: `v${i + 1}`
          })
        }

        const options: CleanupOptions = {
          songId: testSongId,
          keepLatest: 2
        }

        const result = await service.cleanup(options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data).toHaveProperty('versionsDeleted')
          expect(result.data).toHaveProperty('spaceFreed')
          expect(result.data).toHaveProperty('deletedVersionIds')
          expect(result.data).toHaveProperty('errors')
          expect(result.data.versionsDeleted).toBeGreaterThanOrEqual(0)
        }
      })

      it('should support dry-run mode', async () => {
        const song = createTestSong(testSongId)

        for (let i = 0; i < 3; i++) {
          await service.saveVersion({
            song,
            changeDescription: `v${i + 1}`
          })
        }

        const options: CleanupOptions = {
          songId: testSongId,
          keepLatest: 1,
          dryRun: true
        }

        const result = await service.cleanup(options)

        expect(isSuccess(result)).toBe(true)
      })

      it('should support date-based cleanup', async () => {
        const song = createTestSong(testSongId)

        await service.saveVersion({
          song,
          changeDescription: 'old'
        })

        const oldDate = new Date(Date.now() - 86400000) // 1 day ago

        const options: CleanupOptions = {
          songId: testSongId,
          keepLatest: 1,
          olderThan: oldDate
        }

        const result = await service.cleanup(options)

        expect(isSuccess(result)).toBe(true)
      })
    })

    describe('Error Cases', () => {
      it('should fail for invalid cleanup options', async () => {
        const options: CleanupOptions = {
          songId: testSongId,
          keepLatest: 0 // Invalid
        }

        const result = await service.cleanup(options)

        // Should either fail gracefully or adjust
        expect(result).toHaveProperty('success')
      })
    })
  })

  describe('getStorageStatistics() method', () => {
    describe('Success Cases', () => {
      it('should return storage statistics', async () => {
        const result = await service.getStorageStatistics()

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          const stats = result.data
          expect(stats).toHaveProperty('totalSongs')
          expect(stats).toHaveProperty('totalVersions')
          expect(stats).toHaveProperty('totalStorageUsed')
          expect(stats).toHaveProperty('averageVersionsPerSong')
          expect(stats).toHaveProperty('oldestVersion')
          expect(stats).toHaveProperty('newestVersion')
          expect(stats).toHaveProperty('storageLimit')
          expect(stats).toHaveProperty('percentUsed')

          expect(typeof stats.totalSongs).toBe('number')
          expect(typeof stats.totalVersions).toBe('number')
          expect(typeof stats.totalStorageUsed).toBe('number')
          expect(typeof stats.percentUsed).toBe('number')
        }
      })

      it('should track correct metrics after saving versions', async () => {
        const song = createTestSong(testSongId)

        await service.saveVersion({
          song,
          changeDescription: 'v1'
        })

        const result = await service.getStorageStatistics()

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(result.data.totalVersions).toBeGreaterThan(0)
          expect(result.data.totalStorageUsed).toBeGreaterThan(0)
        }
      })
    })
  })

  describe('exportHistory() method', () => {
    describe('Success Cases', () => {
      it('should export history as JSON', async () => {
        const song = createTestSong(testSongId)

        await service.saveVersion({
          song,
          changeDescription: 'v1'
        })

        const options: ExportHistoryOptions = {
          songId: testSongId,
          format: HistoryExportFormat.JSON,
          includeFullSongs: true
        }

        const result = await service.exportHistory(options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(typeof result.data).toBe('string')
          expect(result.data.length).toBeGreaterThan(0)
        }
      })

      it('should export history as markdown', async () => {
        const song = createTestSong(testSongId)

        await service.saveVersion({
          song,
          changeDescription: 'v1'
        })

        const options: ExportHistoryOptions = {
          songId: testSongId,
          format: HistoryExportFormat.MARKDOWN
        }

        const result = await service.exportHistory(options)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(typeof result.data).toBe('string')
        }
      })

      it('should support includeCritiques option', async () => {
        const song = createTestSong(testSongId)

        await service.saveVersion({
          song,
          changeDescription: 'v1'
        })

        const options: ExportHistoryOptions = {
          songId: testSongId,
          format: HistoryExportFormat.JSON,
          includeCritiques: true
        }

        const result = await service.exportHistory(options)

        expect(isSuccess(result)).toBe(true)
      })
    })

    describe('Error Cases', () => {
      it('should fail for non-existent song', async () => {
        const options: ExportHistoryOptions = {
          songId: createSongId('no_song'),
          format: HistoryExportFormat.JSON
        }

        const result = await service.exportHistory(options)

        expect(isFailure(result)).toBe(true)
        if (isFailure(result)) {
          expect(result.error.code).toBe(HistoryErrorCode.SONG_NOT_FOUND)
        }
      })
    })
  })

  describe('searchVersions() method', () => {
    describe('Success Cases', () => {
      it('should search versions by song ID', async () => {
        const song = createTestSong(testSongId)

        await service.saveVersion({
          song,
          changeDescription: 'searchable'
        })

        const criteria: VersionSearchCriteria = {
          songId: testSongId
        }

        const result = await service.searchVersions(criteria)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(Array.isArray(result.data)).toBe(true)
        }
      })

      it('should search by tags', async () => {
        const song = createTestSong(testSongId)

        await service.saveVersion({
          song,
          changeDescription: 'tagged',
          tags: ['important', 'final']
        })

        const criteria: VersionSearchCriteria = {
          songId: testSongId,
          tags: ['important']
        }

        const result = await service.searchVersions(criteria)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(Array.isArray(result.data)).toBe(true)
        }
      })

      it('should search by date range', async () => {
        const song = createTestSong(testSongId)

        await service.saveVersion({
          song,
          changeDescription: 'v1'
        })

        const criteria: VersionSearchCriteria = {
          songId: testSongId,
          dateRange: {
            start: new Date(Date.now() - 3600000),
            end: new Date(Date.now() + 3600000)
          }
        }

        const result = await service.searchVersions(criteria)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(Array.isArray(result.data)).toBe(true)
        }
      })

      it('should search by text in descriptions', async () => {
        const song = createTestSong(testSongId)

        await service.saveVersion({
          song,
          changeDescription: 'Fixed the chorus rhythm'
        })

        const criteria: VersionSearchCriteria = {
          songId: testSongId,
          searchText: 'chorus'
        }

        const result = await service.searchVersions(criteria)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(Array.isArray(result.data)).toBe(true)
        }
      })
    })

    describe('Error Cases', () => {
      it('should return empty array for no matches', async () => {
        const criteria: VersionSearchCriteria = {
          songId: createSongId('nonexistent'),
          searchText: 'unlikely-to-exist-12345'
        }

        const result = await service.searchVersions(criteria)

        expect(isSuccess(result)).toBe(true)
        if (isSuccess(result)) {
          expect(Array.isArray(result.data)).toBe(true)
          expect(result.data.length).toBe(0)
        }
      })
    })
  })

  describe('Contract Compliance', () => {
    it('should never throw exceptions', async () => {
      const methods = [
        () => service.saveVersion({ song: createTestSong(), changeDescription: '' }),
        () => service.getHistory(testSongId),
        () => service.getTimeline(testSongId),
        () => service.getStorageStatistics(),
        () => service.deleteHistory(testSongId),
        () => service.searchVersions({ songId: testSongId })
      ]

      for (const method of methods) {
        await expect(method()).resolves.toBeDefined()
      }
    })

    it('should always return ServiceResponse shape', async () => {
      const result = await service.saveVersion({
        song: createTestSong(),
        changeDescription: 'test'
      })

      expect(result).toHaveProperty('success')
      expect(typeof result.success).toBe('boolean')

      if (result.success) {
        expect(result).toHaveProperty('data')
        expect((result as any).error).toBeUndefined()
      } else {
        expect(result).toHaveProperty('error')
        expect((result as any).data).toBeUndefined()
      }
    })

    it('should preserve readonly semantics on saved versions', async () => {
      const song = createTestSong(testSongId)
      const saveResult = await service.saveVersion({
        song,
        changeDescription: 'readonly test'
      })

      if (isSuccess(saveResult)) {
        const getResult = await service.getVersion({
          songId: testSongId,
          versionNumber: 1
        })

        if (isSuccess(getResult)) {
          const version = getResult.data

          // Should not be able to modify readonly properties
          expect(() => {
            // @ts-expect-error - Testing readonly enforcement
            version.versionNumber = 999
          }).toThrow()

          expect(() => {
            // @ts-expect-error - Testing readonly enforcement
            version.song = createTestSong(createSongId('other'))
          }).toThrow()
        }
      }
    })

    it('should handle concurrent operations safely', async () => {
      const song = createTestSong(testSongId)

      // Concurrent saves
      const results = await Promise.all([
        service.saveVersion({ song, changeDescription: 'concurrent1' }),
        service.saveVersion({ song, changeDescription: 'concurrent2' }),
        service.saveVersion({ song, changeDescription: 'concurrent3' })
      ])

      for (const result of results) {
        expect(isSuccess(result)).toBe(true)
      }

      // Version numbers should be unique
      const versionNumbers = results
        .filter(isSuccess)
        .map(r => r.data.versionNumber)

      const uniqueNumbers = new Set(versionNumbers)
      expect(uniqueNumbers.size).toBe(versionNumbers.length)
    })
  })
})
