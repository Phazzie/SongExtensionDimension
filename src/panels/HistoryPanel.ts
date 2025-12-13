/**
 * @fileoverview History Panel Controller
 * @purpose Manage version control UI and interactions
 * @phase Phase 4 - UI Development
 * @updated 2025-11-17
 *
 * Responsibilities:
 * - Display version timeline
 * - Compare versions
 * - Perform rollback operations
 * - Search and filter versions
 * - Manage version metadata and tags
 */

import type {
  IHistoryService,
  SongVersion,
  VersionHistory,
  Timeline,
  VersionComparison,
  RollbackResult,
  StorageStatistics,
  VersionId
} from '../contracts/History'
import type { SongId } from '../contracts/types/song'
import { isFailure } from '../contracts/types/common'

/**
 * UI state for the History Panel
 */
interface HistoryPanelState {
  readonly currentSongId?: SongId
  readonly selectedVersionId?: VersionId
  readonly compareVersionIds?: readonly [VersionId, VersionId]
  readonly isComparingVersions: boolean
  readonly searchText: string
  readonly filterTags: readonly string[]
  readonly sortBy: 'date' | 'version'
  readonly sortOrder: 'asc' | 'desc'
  readonly isLoading: boolean
  readonly error?: string
}

/**
 * History Panel Controller
 * Manages all history-related UI interactions and data flow
 */
export class HistoryPanel {
  private state: HistoryPanelState = {
    isComparingVersions: false,
    searchText: '',
    filterTags: [],
    sortBy: 'date',
    sortOrder: 'desc',
    isLoading: false
  }

  private versionHistory?: VersionHistory
  private timeline?: Timeline
  private comparison?: VersionComparison
  private statistics?: StorageStatistics

  constructor(private historyService: IHistoryService) {}

  /**
   * Load version history for a song
   */
  async loadHistory(songId: SongId): Promise<void> {
    this.setState({ isLoading: true, currentSongId: songId })

    try {
      const result = await this.historyService.getHistory(songId)

      if (isFailure(result)) {
        this.setState({
          error: result.error.message,
          isLoading: false
        })
        return
      }

      this.versionHistory = result.data
      this.setState({ isLoading: false })
      this.renderVersionsList()
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      })
    }
  }

  /**
   * Load timeline view
   */
  async loadTimeline(songId: SongId): Promise<void> {
    try {
      const result = await this.historyService.getTimeline(songId)

      if (isFailure(result)) {
        this.setState({ error: result.error.message })
        return
      }

      this.timeline = result.data
      this.renderTimeline()
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Compare two versions
   */
  async compareVersions(version1Id: VersionId, version2Id: VersionId): Promise<void> {
    this.setState({
      isLoading: true,
      compareVersionIds: [version1Id, version2Id],
      isComparingVersions: true
    })

    try {
      const result = await this.historyService.compareVersions(version1Id, version2Id)

      if (isFailure(result)) {
        this.setState({
          error: result.error.message,
          isLoading: false
        })
        return
      }

      this.comparison = result.data
      this.setState({ isLoading: false })
      this.renderComparison()
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      })
    }
  }

  /**
   * Rollback to a previous version
   */
  async rollbackToVersion(versionId: VersionId): Promise<RollbackResult | undefined> {
    if (!this.state.currentSongId) {
      this.setState({ error: 'No song selected' })
      return undefined
    }

    this.setState({ isLoading: true })

    try {
      const result = await this.historyService.rollback({
        songId: this.state.currentSongId,
        targetVersion: versionId,
        createNewVersion: true,
        preserveCurrentAsBackup: true
      })

      if (isFailure(result)) {
        this.setState({
          error: result.error.message,
          isLoading: false
        })
        return undefined
      }

      this.setState({ isLoading: false })
      this.showNotification('Version restored successfully')

      // Reload history after rollback
      await this.loadHistory(this.state.currentSongId)

      return result.data
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      })
      return undefined
    }
  }

  /**
   * Delete a version
   */
  async deleteVersion(versionId: VersionId): Promise<boolean> {
    if (typeof window === 'undefined' || !window.confirm) {
      return false
    }
    const confirmed = window.confirm('Are you sure you want to delete this version?')
    if (!confirmed) return false

    try {
      const result = await this.historyService.deleteVersion(versionId)

      if (isFailure(result)) {
        this.setState({ error: result.error.message })
        return false
      }

      this.showNotification('Version deleted')

      // Reload history
      if (this.state.currentSongId) {
        await this.loadHistory(this.state.currentSongId)
      }

      return true
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return false
    }
  }

  /**
   * Search versions
   */
  async searchVersions(searchText: string): Promise<void> {
    this.setState({ searchText, isLoading: true })

    try {
      if (!this.state.currentSongId) {
        this.setState({ error: 'No song selected', isLoading: false })
        return
      }

      const result = await this.historyService.searchVersions({
        songId: this.state.currentSongId,
        searchText,
        tags: this.state.filterTags.length > 0 ? this.state.filterTags : undefined
      })

      if (isFailure(result)) {
        this.setState({
          error: result.error.message,
          isLoading: false
        })
        return
      }

      // Display search results
      this.renderSearchResults(result.data)
      this.setState({ isLoading: false })
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      })
    }
  }

  /**
   * Filter by tags
   */
  async filterByTags(tags: readonly string[]): Promise<void> {
    this.setState({ filterTags: tags, isLoading: true })

    try {
      if (!this.state.currentSongId) {
        this.setState({ error: 'No song selected', isLoading: false })
        return
      }

      const result = await this.historyService.searchVersions({
        songId: this.state.currentSongId,
        tags: tags.length > 0 ? tags : undefined,
        searchText: this.state.searchText || undefined
      })

      if (isFailure(result)) {
        this.setState({
          error: result.error.message,
          isLoading: false
        })
        return
      }

      this.renderSearchResults(result.data)
      this.setState({ isLoading: false })
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false
      })
    }
  }

  /**
   * Load storage statistics
   */
  async loadStorageStats(): Promise<void> {
    try {
      const result = await this.historyService.getStorageStatistics()

      if (isFailure(result)) {
        this.setState({ error: result.error.message })
        return
      }

      this.statistics = result.data
      this.renderStorageStats()
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * Sort versions
   */
  setSortOrder(by: 'date' | 'version', order: 'asc' | 'desc'): void {
    this.setState({ sortBy: by, sortOrder: order })
    this.renderVersionsList()
  }

  /**
   * Export history
   */
  async exportHistory(format: 'json' | 'markdown' | 'timeline'): Promise<string | undefined> {
    if (!this.state.currentSongId) {
      this.setState({ error: 'No song selected' })
      return undefined
    }

    try {
      // Convert format string to enum
      let exportFormat: 'json' | 'markdown' | 'timeline'
      switch (format) {
        case 'json':
          exportFormat = 'json'
          break
        case 'markdown':
          exportFormat = 'markdown'
          break
        case 'timeline':
          exportFormat = 'timeline'
          break
        default:
          exportFormat = 'json'
      }

      const result = await this.historyService.exportHistory({
        songId: this.state.currentSongId,
        format: exportFormat as unknown as any, // Safe cast - enum value matches string
        includeFullSongs: true,
        includeCritiques: true
      })

      if (isFailure(result)) {
        this.setState({ error: result.error.message })
        return undefined
      }

      this.showNotification(`Exported as ${format.toUpperCase()}`)
      return result.data
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return undefined
    }
  }

  /**
   * Get current state
   */
  getState(): Readonly<HistoryPanelState> {
    return this.state
  }

  // Private helper methods

  /**
   * Update state
   */
  private setState(updates: Partial<HistoryPanelState>): void {
    this.state = { ...this.state, ...updates }
    this.renderUI()
  }

  /**
   * Render versions list
   */
  private renderVersionsList(): void {
    if (!this.versionHistory) return

    const container = document.getElementById('versions-list')
    if (!container) return

    // Sort versions
    let versions = Array.from(this.versionHistory.versions)
    if (this.state.sortBy === 'date') {
      versions.sort((a, b) => {
        const aTime = a.createdAt.getTime()
        const bTime = b.createdAt.getTime()
        return this.state.sortOrder === 'asc' ? aTime - bTime : bTime - aTime
      })
    } else {
      versions.sort((a, b) => {
        return this.state.sortOrder === 'asc'
          ? a.versionNumber - b.versionNumber
          : b.versionNumber - a.versionNumber
      })
    }

    // Filter by tags if needed
    if (this.state.filterTags.length > 0) {
      versions = versions.filter(v => this.state.filterTags.some(tag => v.tags.includes(tag)))
    }

    // Filter by search text if needed
    if (this.state.searchText) {
      const searchLower = this.state.searchText.toLowerCase()
      versions = versions.filter(
        v =>
          v.changeDescription.toLowerCase().includes(searchLower) ||
          (v.notes && v.notes.toLowerCase().includes(searchLower))
      )
    }

    // Clear and populate
    container.innerHTML = ''

    for (const version of versions) {
      const item = this.createVersionItem(version)
      container.appendChild(item)
    }

    // Update stats
    this.updateStatsDisplay(versions)
  }

  /**
   * Render timeline
   */
  private renderTimeline(): void {
    if (!this.timeline) return

    const container = document.getElementById('timeline-container')
    if (!container) return

    container.innerHTML = ''

    const timelineDiv = document.createElement('div')
    timelineDiv.className = 'timeline'

    for (let i = 0; i < this.timeline.entries.length; i++) {
      const entry = this.timeline.entries[i]
      if (!entry) continue // Skip undefined entries

      const isLast = i === this.timeline.entries.length - 1

      const itemDiv = document.createElement('div')
      itemDiv.className = `timeline-item ${isLast ? 'latest' : ''}`

      const dotDiv = document.createElement('div')
      dotDiv.className = 'timeline-dot'

      const contentDiv = document.createElement('div')
      contentDiv.className = 'timeline-content'
      contentDiv.innerHTML = `
        <div class="timeline-version">v${entry.versionNumber}</div>
        <div class="timeline-description">${this.escapeHtml(entry.description)}</div>
        <div class="timeline-date">${entry.timestamp.toLocaleDateString()} ${entry.timestamp.toLocaleTimeString()}</div>
        <div class="timeline-changes">${entry.changeCount} change${entry.changeCount !== 1 ? 's' : ''}</div>
      `

      if (entry.scoreDelta !== undefined) {
        const scoreDiv = document.createElement('div')
        scoreDiv.className = `timeline-score ${entry.scoreDelta > 0 ? 'improved' : 'declined'}`
        scoreDiv.textContent = `Score: ${entry.scoreDelta > 0 ? '+' : ''}${entry.scoreDelta}`
        contentDiv.appendChild(scoreDiv)
      }

      itemDiv.appendChild(dotDiv)
      itemDiv.appendChild(contentDiv)
      timelineDiv.appendChild(itemDiv)
    }

    container.appendChild(timelineDiv)
  }

  /**
   * Render comparison view
   */
  private renderComparison(): void {
    if (!this.comparison) return

    const container = document.getElementById('comparison-container')
    if (!container) return

    container.innerHTML = ''

    const compDiv = document.createElement('div')
    compDiv.className = 'comparison-view'

    // Header
    const headerDiv = document.createElement('div')
    headerDiv.className = 'comparison-header'
    headerDiv.innerHTML = `
      <h3>Version ${this.comparison.version1.versionNumber} vs Version ${this.comparison.version2.versionNumber}</h3>
      <p class="comparison-summary">${this.escapeHtml(this.comparison.summary)}</p>
    `
    compDiv.appendChild(headerDiv)

    // Versions side by side
    const contentDiv = document.createElement('div')
    contentDiv.className = 'comparison-content'

    const v1Div = document.createElement('div')
    v1Div.className = 'comparison-version'
    v1Div.innerHTML = `
      <h4>Version ${this.comparison.version1.versionNumber}</h4>
      <div class="version-info">
        <p><strong>Title:</strong> ${this.escapeHtml(this.comparison.version1.song.title)}</p>
        <p><strong>Verses:</strong> ${this.comparison.version1.song.verses.length}</p>
        <p><strong>Choruses:</strong> ${this.comparison.version1.song.choruses.length}</p>
        <p><strong>Created:</strong> ${this.comparison.version1.createdAt.toLocaleString()}</p>
        <p><strong>Changes:</strong> ${this.comparison.version1.changeDescription}</p>
      </div>
    `
    contentDiv.appendChild(v1Div)

    const v2Div = document.createElement('div')
    v2Div.className = 'comparison-version'
    v2Div.innerHTML = `
      <h4>Version ${this.comparison.version2.versionNumber}</h4>
      <div class="version-info">
        <p><strong>Title:</strong> ${this.escapeHtml(this.comparison.version2.song.title)}</p>
        <p><strong>Verses:</strong> ${this.comparison.version2.song.verses.length}</p>
        <p><strong>Choruses:</strong> ${this.comparison.version2.song.choruses.length}</p>
        <p><strong>Created:</strong> ${this.comparison.version2.createdAt.toLocaleString()}</p>
        <p><strong>Changes:</strong> ${this.comparison.version2.changeDescription}</p>
      </div>
    `
    contentDiv.appendChild(v2Div)

    compDiv.appendChild(contentDiv)

    // Differences list
    if (this.comparison.differences.length > 0) {
      const diffsDiv = document.createElement('div')
      diffsDiv.className = 'comparison-differences'
      diffsDiv.innerHTML = '<h4>Differences</h4>'

      const diffsList = document.createElement('ul')
      for (const diff of this.comparison.differences) {
        const li = document.createElement('li')
        li.className = `diff-${diff.type.toLowerCase()}`
        li.innerHTML = `
          <strong>${diff.location}:</strong> ${this.escapeHtml(diff.description)}
          <div class="diff-detail">
            <span class="diff-before">Before: ${this.escapeHtml(diff.before)}</span>
            <span class="diff-after">After: ${this.escapeHtml(diff.after)}</span>
          </div>
        `
        diffsList.appendChild(li)
      }
      diffsDiv.appendChild(diffsList)
      compDiv.appendChild(diffsDiv)
    }

    container.appendChild(compDiv)
  }

  /**
   * Render search results
   */
  private renderSearchResults(versions: readonly SongVersion[]): void {
    const container = document.getElementById('versions-list')
    if (!container) return

    container.innerHTML = ''

    if (versions.length === 0) {
      container.innerHTML = '<p class="no-results">No versions found matching your criteria</p>'
      return
    }

    for (const version of versions) {
      const item = this.createVersionItem(version)
      container.appendChild(item)
    }
  }

  /**
   * Render storage statistics
   */
  private renderStorageStats(): void {
    if (!this.statistics) return

    const container = document.getElementById('storage-stats')
    if (!container) return

    const used = (this.statistics.totalStorageUsed / 1024 / 1024).toFixed(2)
    const limit = (this.statistics.storageLimit / 1024 / 1024).toFixed(2)

    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-label">Total Songs</span>
          <span class="stat-value">${this.statistics.totalSongs}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Total Versions</span>
          <span class="stat-value">${this.statistics.totalVersions}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Avg Versions/Song</span>
          <span class="stat-value">${this.statistics.averageVersionsPerSong}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Storage Used</span>
          <span class="stat-value">${used}MB / ${limit}MB</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Oldest Version</span>
          <span class="stat-value">${this.statistics.oldestVersion.toLocaleDateString()}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Newest Version</span>
          <span class="stat-value">${this.statistics.newestVersion.toLocaleDateString()}</span>
        </div>
      </div>
      <div class="storage-bar">
        <div class="storage-used" style="width: ${this.statistics.percentUsed}%"></div>
        <span class="storage-label">${this.statistics.percentUsed.toFixed(1)}% used</span>
      </div>
    `
  }

  /**
   * Create a version item element
   */
  private createVersionItem(version: SongVersion): HTMLElement {
    const item = document.createElement('div')
    item.className = 'version-item'
    item.id = `version-${version.versionId}`

    const isSelected = this.state.selectedVersionId === version.versionId

    item.innerHTML = `
      <div class="version-header">
        <div class="version-number">v${version.versionNumber}</div>
        <div class="version-title">${this.escapeHtml(version.song.title)}</div>
        <div class="version-date">${version.createdAt.toLocaleString()}</div>
      </div>
      <div class="version-description">${this.escapeHtml(version.changeDescription)}</div>
      ${
        version.notes
          ? `<div class="version-notes"><strong>Notes:</strong> ${this.escapeHtml(version.notes)}</div>`
          : ''
      }
      ${
        version.tags.length > 0
          ? `<div class="version-tags">${version.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}</div>`
          : ''
      }
      <div class="version-stats">
        <span class="stat">Verses: ${version.song.verses.length}</span>
        <span class="stat">Choruses: ${version.song.choruses.length}</span>
        <span class="stat">Changes: ${version.changes.length}</span>
      </div>
      <div class="version-actions">
        <button class="btn-compare" data-version-id="${version.versionId}">Compare</button>
        <button class="btn-rollback" data-version-id="${version.versionId}">Rollback</button>
        <button class="btn-delete" data-version-id="${version.versionId}">Delete</button>
      </div>
    `

    if (isSelected) {
      item.classList.add('selected')
    }

    return item
  }

  /**
   * Update statistics display
   */
  private updateStatsDisplay(versions: SongVersion[]): void {
    const statsContainer = document.getElementById('filter-stats')
    if (!statsContainer) return

    statsContainer.innerHTML = `
      <div class="filter-results">
        Showing ${versions.length} version${versions.length !== 1 ? 's' : ''}
        ${this.state.searchText ? ` matching "${this.escapeHtml(this.state.searchText)}"` : ''}
      </div>
    `
  }

  /**
   * Render main UI
   */
  private renderUI(): void {
    const errorContainer = document.getElementById('error-message')
    if (errorContainer) {
      if (this.state.error) {
        errorContainer.textContent = this.state.error
        errorContainer.style.display = 'block'
      } else {
        errorContainer.style.display = 'none'
      }
    }

    const loadingContainer = document.getElementById('loading-indicator')
    if (loadingContainer) {
      loadingContainer.style.display = this.state.isLoading ? 'flex' : 'none'
    }
  }

  /**
   * Show notification
   */
  private showNotification(message: string): void {
    const notificationDiv = document.createElement('div')
    notificationDiv.className = 'notification'
    notificationDiv.textContent = message

    document.body.appendChild(notificationDiv)

    setTimeout(() => {
      notificationDiv.remove()
    }, 3000)
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }
    return text.replace(/[&<>"']/g, m => map[m] || m)
  }
}
