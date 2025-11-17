# RealHistoryService - Quick Start Guide

**5-Minute Guide to AI-Powered Version Control**

---

## 🚀 Initialization

```typescript
import { RealHistoryService } from './services/real/RealHistoryService'
import * as vscode from 'vscode'

// In your extension's activate() function:
const apiKey = vscode.workspace.getConfiguration('songwriting').get('geminiApiKey')
const storage = context.workspaceState // or context.globalState
const history = new RealHistoryService(apiKey, storage)
```

---

## 📝 Save a Version

```typescript
const result = await history.saveVersion({
  song: mySong,
  changeDescription: "Improved imagery in verse 2",
  changes: [/* ChangeRecord[] */],
  critique: critiqueReport,
  tags: ['revision', 'approved'],
  notes: "Really happy with this one!"
})

if (result.success) {
  console.log(`Saved as v${result.data.versionNumber}`)
  // Version ID: song_123_v5
  // Storage used: 4523 bytes
}
```

---

## 🔍 Get a Version

```typescript
// By version number
const v5 = await history.getVersion({
  songId: mySong.id,
  versionNumber: 5
})

// By version ID
const version = await history.getVersion({
  songId: mySong.id,
  versionId: "song_123_v5" as VersionId
})

// By date range (returns latest in range)
const recent = await history.getVersion({
  songId: mySong.id,
  fromDate: new Date('2025-11-01')
})

// By tags
const approved = await history.getVersion({
  songId: mySong.id,
  tags: ['approved']
})
```

---

## 📖 Get Complete History

```typescript
const historyResult = await history.getHistory(mySong.id)

if (historyResult.success) {
  const data = historyResult.data
  console.log(`Total versions: ${data.totalVersions}`)
  console.log(`Current version: ${data.currentVersion}`)
  console.log(`First created: ${data.firstCreated}`)
  console.log(`Total changes: ${data.totalChanges}`)

  // Iterate versions
  for (const version of data.versions) {
    console.log(`v${version.versionNumber}: ${version.changeDescription}`)
  }
}
```

---

## 🤖 AI-Powered Comparison

**This is the killer feature!**

```typescript
const comparison = await history.compareVersions(
  "song_123_v1" as VersionId,
  "song_123_v5" as VersionId
)

if (comparison.success) {
  const data = comparison.data

  // AI-generated summary
  console.log(data.summary)
  // "5 changes total: 4 improvements, 1 degradation. Recommendation: keep_new"

  // Line-by-line differences
  for (const diff of data.differences) {
    console.log(`${diff.location} (${diff.type}):`)
    console.log(`  Before: ${diff.before}`)
    console.log(`  After: ${diff.after}`)
    console.log(`  ${diff.description}`)
  }

  // Quality improvements
  if (data.improvementMetrics) {
    console.log(`Score change: ${data.improvementMetrics.scoreChange}`)
    console.log(`Issues fixed: ${data.improvementMetrics.issuesFixed}`)
    console.log(`Quality improved: ${data.improvementMetrics.qualityImproved}`)

    // Category-specific changes
    data.improvementMetrics.categoryChanges.forEach((delta, category) => {
      console.log(`${category}: ${delta > 0 ? '+' : ''}${delta}`)
    })
  }
}
```

---

## ⏪ Rollback to Previous Version

```typescript
const rollback = await history.rollback({
  songId: mySong.id,
  targetVersion: 3,              // Can also use VersionId
  createNewVersion: true,        // Creates v6 from v3 (preserves history)
  preserveCurrentAsBackup: true  // Auto-backup current as "backup" tag
})

if (rollback.success) {
  const restoredSong = rollback.data.restoredSong
  console.log(`Rolled back from v${rollback.data.fromVersion} to v${rollback.data.toVersion}`)

  if (rollback.data.backupVersionId) {
    console.log(`Backup created: ${rollback.data.backupVersionId}`)
  }

  // Use restoredSong...
}
```

---

## 🧹 Smart Cleanup

```typescript
// Dry run first (preview)
const preview = await history.cleanup({
  songId: mySong.id,           // Optional: specific song or all
  keepLatest: 10,              // Keep 10 most recent
  olderThan: new Date('2024-01-01'),  // Delete before date
  removeUntagged: true,        // Remove untagged versions
  dryRun: true                 // Preview only
})

console.log(`Would delete ${preview.data.versionsDeleted} versions`)
console.log(`Would free ${preview.data.spaceFreed} bytes`)

// Actually do it
const cleanup = await history.cleanup({
  keepLatest: 10,
  dryRun: false
})

console.log(`Deleted ${cleanup.data.versionsDeleted} versions`)
console.log(`Freed ${cleanup.data.spaceFreed} bytes`)
```

---

## 🔎 Advanced Search

```typescript
const search = await history.searchVersions({
  // Search across all songs or specific song
  songId: mySong.id,  // Optional

  // Date range
  dateRange: {
    start: new Date('2025-11-01'),
    end: new Date('2025-11-17')
  },

  // Tags (match any)
  tags: ['approved', 'published'],

  // Quality score range
  minScore: 90,
  maxScore: 100,

  // Has changes
  hasChanges: true,

  // Full-text search
  searchText: "imagery improvement"
})

if (search.success) {
  console.log(`Found ${search.data.length} versions`)
  for (const version of search.data) {
    console.log(`v${version.versionNumber}: ${version.changeDescription}`)
  }
}
```

---

## 📊 Storage Statistics

```typescript
const stats = await history.getStorageStatistics()

if (stats.success) {
  console.log(`Total songs: ${stats.data.totalSongs}`)
  console.log(`Total versions: ${stats.data.totalVersions}`)
  console.log(`Storage used: ${stats.data.totalStorageUsed} bytes`)
  console.log(`Percent used: ${stats.data.percentUsed}%`)
  console.log(`Average versions per song: ${stats.data.averageVersionsPerSong}`)
}
```

---

## 📤 Export History

### JSON Export
```typescript
const exportResult = await history.exportHistory({
  songId: mySong.id,
  format: HistoryExportFormat.JSON,
  includeFullSongs: true,
  includeCritiques: true
})

console.log(`Exported to: ${exportResult.data}`)
```

### Markdown Export
```typescript
const exportResult = await history.exportHistory({
  songId: mySong.id,
  format: HistoryExportFormat.MARKDOWN,
  includeFullSongs: true,
  includeCritiques: false
})
```

### Timeline Export
```typescript
const exportResult = await history.exportHistory({
  songId: mySong.id,
  format: HistoryExportFormat.TIMELINE,
  includeFullSongs: false,
  includeCritiques: false
})
```

---

## 📅 Get Timeline

```typescript
const timeline = await history.getTimeline(mySong.id)

if (timeline.success) {
  console.log(`Total versions: ${timeline.data.totalVersions}`)
  console.log(`Date range: ${timeline.data.dateRange.start} - ${timeline.data.dateRange.end}`)

  for (const entry of timeline.data.entries) {
    console.log(`v${entry.versionNumber} - ${entry.timestamp}`)
    console.log(`  ${entry.description}`)
    console.log(`  Changes: ${entry.changeCount}`)
    if (entry.scoreDelta) {
      console.log(`  Score: ${entry.scoreDelta}`)
    }
  }
}
```

---

## 🗑️ Delete Operations

### Delete Specific Version
```typescript
const deleteResult = await history.deleteVersion("song_123_v3" as VersionId)

if (deleteResult.success) {
  console.log("Version deleted")
}
```

### Delete All History (Keep Current)
```typescript
const deleteCount = await history.deleteHistory(mySong.id, true)

if (deleteCount.success) {
  console.log(`Deleted ${deleteCount.data} versions (kept current)`)
}
```

### Delete All History
```typescript
const deleteCount = await history.deleteHistory(mySong.id, false)

if (deleteCount.success) {
  console.log(`Deleted all ${deleteCount.data} versions`)
}
```

---

## ⚠️ Error Handling

**All methods return `ServiceResponse<T>`** - never throw exceptions!

```typescript
const result = await history.someMethod(...)

if (result.success) {
  // Happy path
  const data = result.data
  // Use data...
} else {
  // Error path
  const error = result.error
  console.error(`Error: ${error.message}`)
  console.error(`Suggestion: ${error.suggestion}`)
  console.error(`Details: ${error.details}`)
  console.error(`Code: ${error.code}`)
}
```

### Type Guards
```typescript
import { isSuccess, isFailure } from './contracts/types/common'

const result = await history.getVersion(options)

if (isSuccess(result)) {
  // TypeScript knows result.data exists
  console.log(result.data.versionNumber)
} else {
  // TypeScript knows result.error exists
  console.error(result.error.message)
}
```

---

## 🎯 Common Workflows

### 1. Save After Revision
```typescript
async function saveRevision(song: Song, changes: ChangeRecord[], critique: CritiqueReport) {
  return await history.saveVersion({
    song,
    changeDescription: "Automated revision",
    changes,
    critique,
    tags: ['auto-revision'],
    notes: `Applied ${changes.length} changes`
  })
}
```

### 2. Compare Before Accept
```typescript
async function shouldAcceptRevision(originalId: VersionId, revisedId: VersionId): Promise<boolean> {
  const comparison = await history.compareVersions(originalId, revisedId)

  if (!comparison.success) return false

  const metrics = comparison.data.improvementMetrics
  if (!metrics) return false

  // Accept if quality improved and no new issues
  return metrics.qualityImproved && metrics.issuesIntroduced === 0
}
```

### 3. Auto-Cleanup on Save
```typescript
async function saveWithAutoCleanup(input: SaveVersionInput) {
  // Save new version
  const saveResult = await history.saveVersion(input)
  if (!saveResult.success) return saveResult

  // Check storage
  const stats = await history.getStorageStatistics()
  if (stats.success && stats.data.percentUsed > 80) {
    // Cleanup if >80% used
    await history.cleanup({
      songId: input.song.id,
      keepLatest: 20,
      removeUntagged: true,
      dryRun: false
    })
  }

  return saveResult
}
```

### 4. Find Best Version
```typescript
async function findBestVersion(songId: SongId): Promise<SongVersion | null> {
  const search = await history.searchVersions({
    songId,
    minScore: 90,
    tags: ['approved']
  })

  if (!search.success || search.data.length === 0) return null

  // Return highest scoring approved version
  return search.data.reduce((best, current) => {
    const bestScore = best.critique?.overallScore ?? 0
    const currentScore = current.critique?.overallScore ?? 0
    return currentScore > bestScore ? current : best
  })
}
```

---

## 💡 Pro Tips

1. **Always Tag Important Versions**
   ```typescript
   tags: ['milestone', 'approved', 'published']
   ```

2. **Use Dry Run First**
   ```typescript
   const preview = await history.cleanup({ ..., dryRun: true })
   // Check preview.data.versionsDeleted before actual cleanup
   ```

3. **Leverage AI Comparison**
   ```typescript
   // AI tells you WHY changes are better/worse
   const comparison = await history.compareVersions(v1, v2)
   console.log(comparison.data.summary) // Human-readable explanation
   ```

4. **Monitor Storage**
   ```typescript
   const stats = await history.getStorageStatistics()
   if (stats.data.percentUsed > 90) {
     // Warning: approaching quota!
   }
   ```

5. **Use Version Notes**
   ```typescript
   notes: "Final version before submission to publisher"
   ```

---

## 🆘 Common Issues

### "Storage Quota Exceeded"
```typescript
// Solution: Run cleanup
await history.cleanup({
  keepLatest: 10,
  removeUntagged: true
})
```

### "Version Not Found"
```typescript
// Solution: Check version exists first
const historyResult = await history.getHistory(songId)
if (historyResult.success) {
  const exists = historyResult.data.versions.some(v => v.versionNumber === 5)
}
```

### "Gemini API Error"
```typescript
// Solution: Check API key configured
const apiKey = vscode.workspace.getConfiguration('songwriting').get('geminiApiKey')
if (!apiKey) {
  vscode.window.showErrorMessage('Please configure Gemini API key')
}
```

---

## 📚 Learn More

- **Full Documentation**: `IMPLEMENTATION_REPORT_RealHistoryService.md`
- **Verification**: `VERIFICATION_RealHistoryService.md`
- **Summary**: `RealHistoryService_SUMMARY.md`
- **Source Code**: `/src/services/real/RealHistoryService.ts`

---

**Happy Version Controlling!** 🎵✨

The AI knows your songs better than you do. Let it help! 🤖
