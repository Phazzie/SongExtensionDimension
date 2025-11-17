# History Panel - Quick Reference Guide

## At a Glance

| Aspect | Details |
|--------|---------|
| **Component** | Version Control UI for song history |
| **Files** | 3 core files (TS, HTML, CSS) + docs |
| **Service** | MockHistoryService |
| **State** | Reactive UI state management |
| **Styling** | CSS Grid + Flexbox, responsive |
| **Size** | ~2000 lines of code |

## Core Files

```
/src/
├── panels/
│   ├── HistoryPanel.ts                 (729 lines - Controller)
│   ├── HistoryPanel.usage.ts           (400+ lines - Examples)
├── ui/
│   ├── history.html                    (425 lines - Template)
│   ├── styles/
│   │   └── history.css                 (920+ lines - Styling)

Documentation/
├── HISTORY_PANEL.md                    (Complete guide)
└── HISTORY_PANEL_QUICK_REFERENCE.md   (This file)
```

## Quick Start

```typescript
import { HistoryPanel } from './src/panels/HistoryPanel'
import { MockHistoryService } from './src/services/mock/MockHistoryService'

// Initialize
const service = new MockHistoryService()
const panel = new HistoryPanel(service)

// Load history
await panel.loadHistory(songId)

// The UI automatically renders from history.html
```

## API Overview

### Loading Data
```typescript
panel.loadHistory(songId)           // Load version list
panel.loadTimeline(songId)          // Load timeline view
panel.loadStorageStats()            // Load storage info
```

### Comparison & Rollback
```typescript
panel.compareVersions(v1Id, v2Id)   // Compare two versions
panel.rollbackToVersion(versionId)  // Rollback + backup
```

### Search & Filter
```typescript
panel.searchVersions(searchText)     // Full-text search
panel.filterByTags(tagArray)         // Filter by tags
panel.setSortOrder(by, order)        // Sort results
```

### Management
```typescript
panel.deleteVersion(versionId)       // Delete with confirm
panel.exportHistory(format)          // JSON, Markdown, Timeline
panel.getState()                     // Get current state
```

## UI Components

### Views (Tabs)
- **Versions List**: Grid of version cards
- **Timeline**: Visual chronological view
- **Comparison**: Side-by-side version diff
- **Storage**: Usage stats and cleanup

### Key Elements
- Search bar + filters
- Sort controls (date/version, asc/desc)
- Version cards with actions
- Timeline with interactive dots
- Modals for confirmations
- Error messages and loading states

## HTML Sections

```html
<header>                    <!-- Title -->
<aside class="sidebar">     <!-- Controls -->
<main class="main-content">
  <div class="tabs">        <!-- Tab buttons -->
  <div id="list-view">      <!-- Versions list -->
  <div id="timeline-view">  <!-- Timeline -->
  <div id="comparison-view"><!-- Comparison -->
  <div id="stats-view">     <!-- Storage stats -->
</main>

<!-- Modals -->
<div id="rollback-modal">   <!-- Rollback confirm -->
<div id="delete-modal">     <!-- Delete confirm -->
<div id="tag-modal">        <!-- Tag management -->
<div id="notes-modal">      <!-- Notes editing -->
```

## CSS Classes

### Layout
- `.history-container` - Main wrapper
- `.history-header` - Top header
- `.history-sidebar` - Left sidebar
- `.history-main-content` - Right main area
- `.history-tabs` - Tab buttons

### Content
- `.versions-list` - Grid of versions
- `.version-item` - Individual version card
- `.timeline` - Timeline container
- `.timeline-item` - Timeline entry
- `.comparison-view` - Comparison display

### Controls
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`
- `.select-input`, `.text-input`, `.textarea`
- `.tag-filters`, `.tag`

## State Management

```typescript
interface HistoryPanelState {
  currentSongId?: SongId
  selectedVersionId?: VersionId
  compareVersionIds?: [VersionId, VersionId]
  isComparingVersions: boolean
  searchText: string
  filterTags: string[]
  sortBy: 'date' | 'version'
  sortOrder: 'asc' | 'desc'
  isLoading: boolean
  error?: string
}
```

Access via: `panel.getState()`

## Event Handling Pattern

```typescript
// Click handlers
document.addEventListener('click', async (e) => {
  const target = e.target as HTMLElement

  if (target.classList.contains('btn-rollback')) {
    await panel.rollbackToVersion(versionId)
  }
  if (target.classList.contains('btn-delete')) {
    await panel.deleteVersion(versionId)
  }
  if (target.classList.contains('btn-compare')) {
    await panel.compareVersions(v1, v2)
  }
})

// Tab switching
document.querySelectorAll('.tab-button').forEach(tab => {
  tab.addEventListener('click', (e) => {
    const tabName = (e.target as HTMLElement).dataset.tab
    // Show/hide tab content
  })
})
```

## Common Workflows

### Workflow 1: View & Compare
```typescript
await panel.loadHistory(songId)
// User clicks on versions...
await panel.compareVersions(v1, v2)
```

### Workflow 2: Rollback
```typescript
await panel.loadHistory(songId)
// User clicks rollback button...
const result = await panel.rollbackToVersion(versionId)
await panel.loadHistory(songId) // Reload
```

### Workflow 3: Search & Filter
```typescript
await panel.loadHistory(songId)
await panel.searchVersions("bridge")
await panel.filterByTags(["important"])
```

### Workflow 4: Export
```typescript
await panel.loadHistory(songId)
const data = await panel.exportHistory("json")
// Save to file
```

## Styling Customization

### CSS Variables
```css
--primary-color: #007acc;      /* Links, highlights */
--danger-color: #d73a49;       /* Delete, warnings */
--success-color: #28a745;      /* Positive actions */
--warning-color: #ffc107;      /* Cautions */
```

### Dark Mode (Example)
```css
@media (prefers-color-scheme: dark) {
  --text-primary: #e0e0e0;
  --text-secondary: #999;
  --light-bg: #2a2a2a;
}
```

## Error Handling

All operations return results:
```typescript
// Service returns ServiceResponse<T>
// Panel converts to user-friendly messages
// Error UI shows: .error-message div

// Errors include:
// - Service errors (from MockHistoryService)
// - Input validation errors
// - User-friendly suggestions for recovery
```

## Performance Tips

1. **Debounce Search**: 300ms delay before search
2. **Batch DOM Updates**: Multiple changes in one render
3. **Lazy Load Data**: Load only visible content
4. **CSS Animations**: Use GPU-accelerated properties

## Debugging

```typescript
// Check state
const state = panel.getState()
console.log(state)

// Check errors
if (state.error) {
  console.log('Panel error:', state.error)
}

// Check loading
console.log('Is loading:', state.isLoading)

// Monitor service calls
const result = await historyService.getHistory(songId)
console.log('Service result:', result)
```

## Browser DevTools

### Inspect Elements
```javascript
// Find version items
document.querySelectorAll('.version-item')

// Find timeline
document.querySelector('.timeline')

// Get state
// (if panel exposed) panel.getState()
```

### Network Inspection
All service calls are async/await patterns - no actual network in mock service.

### Console Testing
```javascript
// Simulate user interactions
panel.loadHistory('song_123')
panel.compareVersions('song_123_v1', 'song_123_v2')
```

## Integration Checklist

- [ ] Copy HistoryPanel.ts to `/src/panels/`
- [ ] Copy history.html to `/src/ui/`
- [ ] Copy history.css to `/src/ui/styles/`
- [ ] Import HistoryPanel in extension code
- [ ] Create MockHistoryService instance
- [ ] Initialize panel controller
- [ ] Load history.html in WebView
- [ ] Wire up event listeners
- [ ] Test all features
- [ ] Add keyboard shortcuts (optional)

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot find document" | Add "DOM" to tsconfig.json lib array ✓ |
| Styles not loading | Check CSS import path in HTML |
| Service not responding | Verify MockHistoryService initialized |
| State not updating | Check setState() calls |
| Version not found | Verify version ID format |

## Next Steps (Phase 5)

When implementing real services:

1. Replace MockHistoryService with real implementation
2. Add persistent storage (VS Code storage API)
3. Add network synchronization
4. Add collaborative features
5. Add conflict resolution
6. Add branches/merge support

## Key Design Decisions

| Decision | Reason |
|----------|--------|
| React-less | Lightweight, no dependencies |
| Vanilla JS | Works in any WebView context |
| CSS Grid | Modern, responsive layout |
| Service pattern | Easy to swap implementations |
| Readonly types | Prevent accidental mutations |

## Related Files

- Contract: `/src/contracts/History.ts`
- Service: `/src/services/mock/MockHistoryService.ts`
- Types: `/src/contracts/types/song.ts`
- Common types: `/src/contracts/types/common.ts`

## Documentation

- **HISTORY_PANEL.md** - Comprehensive guide (this folder)
- **HistoryPanel.usage.ts** - 12 detailed examples
- **Inline comments** - Throughout the code
- **JSDoc blocks** - Method documentation

## Support Resources

1. Read the complete guide: `HISTORY_PANEL.md`
2. Run the usage examples: `HistoryPanel.usage.ts`
3. Check the contract: `src/contracts/History.ts`
4. Review the service: `src/services/mock/MockHistoryService.ts`

---

**Version**: 1.0.0
**Last Updated**: 2025-11-17
**Status**: Ready for Integration
