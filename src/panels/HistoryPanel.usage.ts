/**
 * @fileoverview HistoryPanel Usage Examples
 * @purpose Demonstrate how to integrate and use the HistoryPanel
 * @phase Phase 4 - UI Development
 * @updated 2025-11-17
 *
 * This file contains practical examples of how to use the HistoryPanel
 * class to manage song version history in your VSCode extension.
 *
 * Note: These are example functions for documentation purposes.
 * TypeScript unused warnings are intentional - these are example functions.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* tslint:disable:no-unused-variable */

/**
 * The noUnusedLocals check is disabled for this file.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck - This file contains usage examples that are not meant to be executed

import { HistoryPanel } from './HistoryPanel'
import { MockHistoryService } from '../services/mock/MockHistoryService'
import type { SongId } from '../contracts/types/song'
import { createSongId } from '../contracts/types/song'

/**
 * Example 1: Basic initialization and history loading
 */
function example1_BasicInitialization() {
  // Create service
  const historyService = new MockHistoryService()

  // Create panel
  const panel = new HistoryPanel(historyService)

  // Load history for a song
  const songId = createSongId('song_123') as SongId
  panel.loadHistory(songId).then(() => {
    console.log('History loaded successfully')
    const state = panel.getState()
    console.log('Current song:', state.currentSongId)
  })
}

/**
 * Example 2: Display timeline view
 */
function example2_DisplayTimeline() {
  const historyService = new MockHistoryService()
  const panel = new HistoryPanel(historyService)

  const songId = createSongId('song_456') as SongId

  // Load and display timeline
  panel.loadTimeline(songId).then(() => {
    console.log('Timeline loaded')
    // The panel automatically renders the timeline
    // when the tab is switched to 'timeline-view'
  })
}

/**
 * Example 3: Compare two versions
 */
function example3_CompareVersions() {
  const historyService = new MockHistoryService()
  const panel = new HistoryPanel(historyService)

  // Compare version 1 and version 2
  panel
    .compareVersions(
      'song_123_v1' as any, // First version ID
      'song_123_v2' as any // Second version ID
    )
    .then(() => {
      console.log('Comparison complete')
      // The comparison view is now displayed
      // User can see differences side-by-side
    })
}

/**
 * Example 4: Rollback to previous version
 */
function example4_RollbackToVersion() {
  const historyService = new MockHistoryService()
  const panel = new HistoryPanel(historyService)

  // First, load history for the song
  const songId = createSongId('song_789') as SongId

  panel.loadHistory(songId).then(() => {
    // Rollback to version 3
    // A backup of current version will be created
    panel.rollbackToVersion('song_789_v3' as any).then(result => {
      if (result) {
        console.log(`Rolled back from v${result.fromVersion} to v${result.toVersion}`)
        if (result.backupVersionId) {
          console.log(`Backup created: ${result.backupVersionId}`)
        }
      }
    })
  })
}

/**
 * Example 5: Search and filter versions
 */
function example5_SearchAndFilter() {
  const historyService = new MockHistoryService()
  const panel = new HistoryPanel(historyService)

  const songId = createSongId('song_search') as SongId

  // First load history
  panel.loadHistory(songId).then(() => {
    // Search for versions containing "bridge"
    panel.searchVersions('bridge').then(() => {
      console.log('Search results displayed')
    })

    // Or filter by tags
    panel.filterByTags(['important', 'final']).then(() => {
      console.log('Filtered by tags')
    })
  })
}

/**
 * Example 6: Delete a version
 */
function example6_DeleteVersion() {
  const historyService = new MockHistoryService()
  const panel = new HistoryPanel(historyService)

  // Delete a specific version
  // A confirmation dialog will be shown to the user
  panel.deleteVersion('song_123_v2' as any).then(success => {
    if (success) {
      console.log('Version deleted')
    } else {
      console.log('Deletion cancelled')
    }
  })
}

/**
 * Example 7: View storage statistics
 */
function example7_ViewStorageStats() {
  const historyService = new MockHistoryService()
  const panel = new HistoryPanel(historyService)

  // Load and display storage statistics
  panel.loadStorageStats().then(() => {
    console.log('Storage stats displayed')
    // Stats are automatically rendered in the stats view
  })
}

/**
 * Example 8: Export history
 */
function example8_ExportHistory() {
  const historyService = new MockHistoryService()
  const panel = new HistoryPanel(historyService)

  const songId = createSongId('song_export') as SongId

  // Load history first
  panel.loadHistory(songId).then(() => {
    // Export as JSON
    panel.exportHistory('json').then(data => {
      if (data) {
        console.log('Exported JSON:', data)
        // Save to file, send to server, etc.
      }
    })

    // Or export as Markdown
    panel.exportHistory('markdown').then(data => {
      if (data) {
        console.log('Exported Markdown:', data)
      }
    })

    // Or export as Timeline
    panel.exportHistory('timeline').then(data => {
      if (data) {
        console.log('Exported Timeline:', data)
      }
    })
  })
}

/**
 * Example 9: Sorting versions
 */
function example9_SortVersions() {
  const historyService = new MockHistoryService()
  const panel = new HistoryPanel(historyService)

  const songId = createSongId('song_sort') as SongId

  panel.loadHistory(songId).then(() => {
    // Sort by date, descending (newest first)
    panel.setSortOrder('date', 'desc')

    // Or sort by version number, ascending
    panel.setSortOrder('version', 'asc')

    // Versions list is automatically re-rendered
  })
}

/**
 * Example 10: Integration with VSCode WebviewPanel
 *
 * This shows how to integrate HistoryPanel with a VSCode extension.
 */
function example10_VscodeIntegration() {
  // In your extension's activation function:
  // 1. Create history service
  const historyService = new MockHistoryService()

  // 2. Create panel controller
  const panel = new HistoryPanel(historyService)

  // 3. Load HTML content
  // const htmlPath = vscode.Uri.joinPath(extensionUri, 'src', 'ui', 'history.html')
  // webview.html = fs.readFileSync(htmlPath.fsPath, 'utf-8')

  // 4. Set up event listeners in webview
  // webview.onDidReceiveMessage((message) => {
  //   switch (message.command) {
  //     case 'loadHistory':
  //       panel.loadHistory(message.songId)
  //       break
  //     case 'compareVersions':
  //       panel.compareVersions(message.version1Id, message.version2Id)
  //       break
  //     case 'rollback':
  //       panel.rollbackToVersion(message.versionId)
  //       break
  //     case 'deleteVersion':
  //       panel.deleteVersion(message.versionId)
  //       break
  //     case 'searchVersions':
  //       panel.searchVersions(message.searchText)
  //       break
  //     case 'exportHistory':
  //       panel.exportHistory(message.format)
  //       break
  //   }
  // })

  // 5. Load history for current song
  // when extension activates or user selects a song
  // panel.loadHistory(currentSongId)
}

/**
 * Example 11: Real-world workflow
 *
 * Complete workflow showing how a user might interact with the history panel.
 */
async function example11_CompleteWorkflow() {
  const historyService = new MockHistoryService()
  const panel = new HistoryPanel(historyService)

  const songId = createSongId('my_song') as SongId

  try {
    // Step 1: Load the history when panel opens
    console.log('Loading version history...')
    await panel.loadHistory(songId)

    // Step 2: User scrolls through versions
    // Automatically rendered in the UI

    // Step 3: User wants to see timeline
    console.log('Switching to timeline view...')
    await panel.loadTimeline(songId)

    // Step 4: User compares two versions
    console.log('Comparing versions...')
    await panel.compareVersions('my_song_v2' as any, 'my_song_v4' as any)

    // Step 5: User wants to rollback
    console.log('Rolling back to version 2...')
    const rollbackResult = await panel.rollbackToVersion('my_song_v2' as any)
    if (rollbackResult) {
      console.log(`Successfully rolled back. Backup: ${rollbackResult.backupVersionId}`)

      // Step 6: Reload history to show the new version
      await panel.loadHistory(songId)
    }

    // Step 7: Export the history
    console.log('Exporting history as markdown...')
    const exported = await panel.exportHistory('markdown')
    if (exported) {
      console.log('History exported successfully')
      // Save to file, clipboard, etc.
    }

    // Step 8: View storage stats
    console.log('Checking storage usage...')
    await panel.loadStorageStats()

    console.log('Workflow complete!')
  } catch (error) {
    console.error('Error during workflow:', error)
  }
}

/**
 * Example 12: Event handling and UI integration
 *
 * Shows how to wire up event listeners for user interactions.
 */
function example12_EventHandling() {
  const historyService = new MockHistoryService()
  const panel = new HistoryPanel(historyService)

  // Version item click handler
  document.addEventListener('click', async event => {
    const target = event.target as HTMLElement
    const versionId = target.dataset.versionId

    if (target.classList.contains('btn-rollback')) {
      // Rollback button clicked
      await panel.rollbackToVersion(versionId as any)
    } else if (target.classList.contains('btn-delete')) {
      // Delete button clicked
      await panel.deleteVersion(versionId as any)
    } else if (target.classList.contains('btn-compare')) {
      // Compare button clicked
      // Show comparison UI to select second version
      console.log('Selected first version for comparison:', versionId)
    }
  })

  // Tab switching
  document.querySelectorAll('.tab-button').forEach(tab => {
    tab.addEventListener('click', event => {
      const button = event.target as HTMLElement
      const tabName = button.dataset.tab

      // Hide all tabs
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active')
      })

      // Show selected tab
      const tabContent = document.getElementById(tabName || '')
      if (tabContent) {
        tabContent.classList.add('active')

        // Load data if needed
        if (tabName === 'timeline-view') {
          const state = panel.getState()
          if (state.currentSongId) {
            panel.loadTimeline(state.currentSongId)
          }
        } else if (tabName === 'stats-view') {
          panel.loadStorageStats()
        }
      }
    })
  })

  // Search input
  const searchInput = document.getElementById('search-input') as HTMLInputElement
  let searchTimeout: ReturnType<typeof setTimeout>
  searchInput?.addEventListener('input', event => {
    const target = event.target as HTMLInputElement
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      panel.searchVersions(target.value)
    }, 300) // Debounce search
  })

  // Sort controls
  document.getElementById('sort-date')?.addEventListener('click', () => {
    panel.setSortOrder('date', 'desc')
  })

  document.getElementById('sort-version')?.addEventListener('click', () => {
    panel.setSortOrder('version', 'asc')
  })

  document.getElementById('sort-asc')?.addEventListener('click', () => {
    const state = panel.getState()
    panel.setSortOrder(state.sortBy, 'asc')
  })

  document.getElementById('sort-desc')?.addEventListener('click', () => {
    const state = panel.getState()
    panel.setSortOrder(state.sortBy, 'desc')
  })

  // Export buttons
  document.getElementById('export-json')?.addEventListener('click', () => {
    panel.exportHistory('json')
  })

  document.getElementById('export-markdown')?.addEventListener('click', () => {
    panel.exportHistory('markdown')
  })

  document.getElementById('export-timeline')?.addEventListener('click', () => {
    panel.exportHistory('timeline')
  })
}

// Export for use in other modules
export { example1_BasicInitialization, example2_DisplayTimeline, example3_CompareVersions }
