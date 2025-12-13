/**
 * @fileoverview Revision Panel Integration Guide
 * @purpose Show how to integrate RevisionPanel into the main extension
 * @phase Phase 4 - UI Development
 * @updated 2025-11-17
 *
 * This file demonstrates how to use the RevisionPanel in your VSCode extension.
 * It's intended for documentation purposes and can be removed before publication.
 * TypeScript unused warnings are intentional - these are example functions.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import * as vscode from 'vscode'
import { RevisionPanel } from './RevisionPanel'
import type { Song } from '../contracts/types/song'
import type { CritiqueReport } from '../contracts/CritiqueEngine'

/**
 * EXAMPLE 1: Basic Integration in Extension Activation
 *
 * This shows how to set up the revision panel in your extension's activate() function.
 */
export function example1_ExtensionActivation() {
  let revisionPanel: RevisionPanel | undefined

  const command = vscode.commands.registerCommand('songwriting.reviseSong', async (song?: Song, critique?: CritiqueReport) => {
    if (!song || !critique) {
      vscode.window.showErrorMessage('Please generate and critique a song first')
      return
    }

    // Create or reuse the revision panel
    if (!revisionPanel) {
      revisionPanel = new RevisionPanel(
        {
          // Extension context from activate()
        } as any // In real code, pass the actual context
      )
    }

    // Show the revision panel with song and critique
    await revisionPanel.show(song, critique)
  })

  return command
}

/**
 * EXAMPLE 2: Integration with Critique Engine
 *
 * Typical workflow: Generate → Critique → Revise
 */
export async function example2_CritiqueToRevisionFlow(song: Song, critiqueEngine: any) {
  // 1. Analyze song quality
  const critiqueResult = await critiqueEngine.analyzeSong(song)

  if (!critiqueResult.success) {
    vscode.window.showErrorMessage(`Critique failed: ${critiqueResult.error.message}`)
    return
  }

  const critique = critiqueResult.data

  // 2. Show revision panel if song needs improvement
  if (!critique.passesGoldStandard) {
    const context = {} as any // Extension context
    const revisionPanel = new RevisionPanel(context)
    await revisionPanel.show(song, critique)
  } else {
    vscode.window.showInformationMessage('Song meets gold standard! No revision needed.')
  }
}

/**
 * EXAMPLE 3: Iterative Revision Workflow
 *
 * Allow multiple revision cycles until gold standard is achieved
 */
export async function example3_IterativeRevision(initialSong: Song, critiqueEngine: any, _revisionEngine: any) {
  let currentSong = initialSong
  let iteration = 0
  const maxIterations = 5

  while (iteration < maxIterations) {
    iteration++

    // Critique current song
    const critiqueResult = await critiqueEngine.analyzeSong(currentSong)

    if (!critiqueResult.success) {
      vscode.window.showErrorMessage('Critique failed')
      return
    }

    const critique = critiqueResult.data

    // Check if gold standard achieved
    if (critique.passesGoldStandard) {
      vscode.window.showInformationMessage(
        `Gold standard achieved in iteration ${iteration}! Final score: ${critique.overallScore}`
      )
      return
    }

    // Show revision panel
    const context = {} as any
    const revisionPanel = new RevisionPanel(context)
    await revisionPanel.show(currentSong, critique)

    // Note: In real implementation, you'd wait for user to accept/revert
    // and get the revised song from revisionPanel
    // currentSong = revisionPanel.getRevisedSong()

    vscode.window.showInformationMessage(`Iteration ${iteration}: Score ${critique.overallScore} → Continue revising...`)
  }

  vscode.window.showWarningMessage(`Max iterations (${maxIterations}) reached. Please review manually.`)
}

/**
 * EXAMPLE 4: Revision with Custom Options
 *
 * Use different strategies for different scenarios
 */
export async function example4_CustomRevisionStrategies(song: Song, critique: CritiqueReport) {
  // Strategy selection based on quality level
  let selectedStrategy: string

  if (critique.overallScore >= 80) {
    // High quality - conservative fixes only
    selectedStrategy = 'conservative'
  } else if (critique.overallScore >= 60) {
    // Medium quality - balanced approach
    selectedStrategy = 'moderate'
  } else {
    // Low quality - major rewrites
    selectedStrategy = 'aggressive'
  }

  vscode.window.showInformationMessage(
    `Using ${selectedStrategy} revision strategy for score ${critique.overallScore}`
  )

  // The revision panel UI will show this as default selected
  const context = {} as any
  const revisionPanel = new RevisionPanel(context)
  await revisionPanel.show(song, critique)
}

/**
 * EXAMPLE 5: Revision with Voice Preservation
 *
 * Ensure the songwriter's original voice is maintained
 */
export async function example5_VoicePreservation(song: Song, critique: CritiqueReport, _voiceProfile?: any) {
  const context = {} as any
  const revisionPanel = new RevisionPanel(context)

  // The panel will show the voice preservation toggle enabled
  // The voiceProfile would be used during revision processing
  await revisionPanel.show(song, critique)

  vscode.window.showInformationMessage(
    'Voice preservation is enabled. Changes will maintain your original voice and style.'
  )
}

/**
 * EXAMPLE 6: Handling Revision Completion
 *
 * Process the result after user accepts or rejects revision
 */
export async function example6_HandleRevisionCompletion(_revisedSong: Song) {
  // After user clicks "Accept Revision" in the panel:
  vscode.window.showInformationMessage('Revision accepted! Updating song...')

  // 1. Save the revised song
  // await saveToWorkspace(revisedSong)

  // 2. Open in editor
  // await openSongInEditor(revisedSong)

  // 3. Re-critique to show improvement
  // const newCritique = await critiqueEngine.analyzeSong(revisedSong)
  // showImprovementSummary(newCritique)

  // 4. Add to history
  // await historyService.addEntry(revisedSong)
}

/**
 * EXAMPLE 7: Revision Panel in Sidebar
 *
 * Show revision panel as a sidebar view instead of main editor
 */
export function example7_SidebarIntegration() {
  // In package.json contribution:
  const packageJsonEntry = {
    views: {
      'songwriting-sidebar': [
        {
          id: 'revisionPanel',
          name: 'Revision Tools',
          when: 'songwriting.songLoaded && songwriting.critiqueAvailable'
        }
      ]
    }
  }

  console.log('Add to package.json contributions:', packageJsonEntry)
}

/**
 * EXAMPLE 8: Multiple Revision Strategies Comparison
 *
 * Show alternatives from different strategies
 */
export async function example8_StrategyComparison(song: Song, critique: CritiqueReport, revisionEngine: any) {
  const strategies = ['conservative', 'moderate', 'aggressive', 'creative'] as const
  const revisions = []

  // Get revisions from each strategy
  for (const strategy of strategies) {
    const result = await revisionEngine.reviseSong({
      song,
      critique,
      strategy,
      preserveVoice: true
    })

    if (result.success) {
      revisions.push({
        strategy,
        result: result.data
      })
    }
  }

  // Show comparison in revision panel
  // The panel's alternatives section displays these options
  vscode.window.showInformationMessage(`Generated ${revisions.length} alternative revisions`)
}

/**
 * EXAMPLE 9: Error Handling
 *
 * Handle various error scenarios
 */
export async function example9_ErrorHandling(song: Song, critique: CritiqueReport) {
  try {
    const context = {} as any
    const revisionPanel = new RevisionPanel(context)

    // Validate inputs
    if (!song || !song.id) {
      throw new Error('Invalid song: missing ID')
    }

    if (!critique || !critique.songId) {
      throw new Error('Invalid critique: missing song ID')
    }

    if (song.id !== critique.songId) {
      throw new Error('Song and critique mismatch: IDs do not match')
    }

    await revisionPanel.show(song, critique)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    vscode.window.showErrorMessage(`Revision panel error: ${message}`)
  }
}

/**
 * EXAMPLE 10: Keyboard Shortcuts
 *
 * Set up keyboard shortcuts for common revision operations
 */
export function example10_KeyboardShortcuts() {
  const keybindings = [
    {
      command: 'songwriting.reviseSong',
      key: 'ctrl+alt+r',
      mac: 'cmd+alt+r',
      when: 'editorFocus && songwriting.songLoaded'
    },
    {
      command: 'songwriting.revisionPanel.accept',
      key: 'ctrl+enter',
      mac: 'cmd+enter',
      when: 'revisionPanelFocused'
    },
    {
      command: 'songwriting.revisionPanel.revert',
      key: 'ctrl+z',
      mac: 'cmd+z',
      when: 'revisionPanelFocused'
    }
  ]

  console.log('Add to package.json keybindings:', keybindings)
}

/**
 * EXAMPLE 11: Telemetry Integration
 *
 * Track revision panel usage for analytics
 */
export async function example11_Telemetry(song: Song, critique: CritiqueReport, revisionResult?: any) {
  const telemetryEvent = {
    eventName: 'revision_panel_opened',
    properties: {
      songId: song.id,
      originalScore: critique.overallScore,
      issueCount: critique.issues.length,
      timestamp: new Date().toISOString()
    }
  }

  if (revisionResult) {
    telemetryEvent.eventName = 'revision_completed'
    Object.assign(telemetryEvent.properties, {
      newScore: revisionResult.improvementMetrics.afterScore,
      improvement: revisionResult.improvementMetrics.improvement,
      changesCount: revisionResult.changes.length
    })
  }

  // await telemetryService.trackEvent(telemetryEvent)
  console.log('Telemetry event:', telemetryEvent)
}

/**
 * EXAMPLE 12: Settings Integration
 *
 * Allow users to configure revision behavior
 */
export function example12_Settings() {
  const configSchema = {
    'songwriting.revision.defaultStrategy': {
      type: 'string',
      enum: ['conservative', 'moderate', 'aggressive', 'surgical', 'creative'],
      default: 'moderate',
      description: 'Default revision strategy when opening revision panel'
    },
    'songwriting.revision.autoPreserveVoice': {
      type: 'boolean',
      default: true,
      description: 'Automatically enable voice preservation when revising'
    },
    'songwriting.revision.autoGenerateAlternatives': {
      type: 'boolean',
      default: true,
      description: 'Automatically generate alternative versions'
    },
    'songwriting.revision.maxAlternatives': {
      type: 'number',
      default: 3,
      minimum: 1,
      maximum: 5,
      description: 'Maximum number of alternative versions to generate'
    }
  }

  console.log('Add to package.json configuration:', configSchema)
}

/**
 * EXAMPLE 13: Complete Integration Example
 *
 * Full workflow from generation to revision to acceptance
 */
export async function example13_CompleteWorkflow(
  prompt: string,
  songGenerator: any,
  critiqueEngine: any,
  revisionEngine: any,
  context: vscode.ExtensionContext
) {
  try {
    // Step 1: Generate song from prompt
    vscode.window.showInformationMessage('Generating song...')
    const generateResult = await songGenerator.generateSong({
      prompt,
      style: 'lyrical'
    })

    if (!generateResult.success) {
      vscode.window.showErrorMessage(`Generation failed: ${generateResult.error.message}`)
      return
    }

    let song = generateResult.data.song

    // Step 2: Critique the song
    vscode.window.showInformationMessage('Analyzing song quality...')
    const critiqueResult = await critiqueEngine.analyzeSong(song)

    if (!critiqueResult.success) {
      vscode.window.showErrorMessage(`Critique failed: ${critiqueResult.error.message}`)
      return
    }

    let critique = critiqueResult.data

    // Step 3: Loop until gold standard or user stops
    let iteration = 0
    while (!critique.passesGoldStandard && iteration < 3) {
      iteration++

      // Show revision panel
      const revisionPanel = new RevisionPanel(context)
      await revisionPanel.show(song, critique)

      // Wait for user action (in real implementation)
      // For demo, assume user accepted revision
      const revisionResult = await revisionEngine.reviseSong({
        song,
        critique,
        strategy: 'moderate',
        preserveVoice: true
      })

      if (!revisionResult.success) {
        vscode.window.showErrorMessage(`Revision failed: ${revisionResult.error.message}`)
        break
      }

      song = revisionResult.data.revisedSong

      // Re-critique
      const newCritiqueResult = await critiqueEngine.analyzeSong(song)
      if (newCritiqueResult.success) {
        critique = newCritiqueResult.data
        vscode.window.showInformationMessage(
          `Revision complete! New score: ${critique.overallScore}`
        )
      }
    }

    if (critique.passesGoldStandard) {
      vscode.window.showInformationMessage('Gold standard achieved! Song is ready.')
    }

    return song
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    vscode.window.showErrorMessage(`Workflow error: ${message}`)
  }
}

/**
 * EXAMPLE 14: Testing the Revision Panel
 *
 * Create mock data for testing the panel UI
 */
export function example14_TestData() {
  // Create a mock song for testing
  const mockSong = {
    id: 'test_song_001' as any,
    title: 'Test Song',
    verses: [
      {
        id: 'verse_1' as any,
        number: 1,
        lines: [
          { text: 'The sky is blue', syllables: 4, stressPattern: 'x/x/' },
          { text: 'I feel so sad', syllables: 4, stressPattern: 'x/x/' },
          { text: 'The night is cold', syllables: 4, stressPattern: 'x/x/' },
          { text: 'My heart is old', syllables: 4, stressPattern: 'x/x/' }
        ],
        rhymeScheme: 'ABAB',
        syllablePattern: [4, 4, 4, 4],
        mood: 'melancholic'
      }
    ],
    choruses: [
      {
        id: 'chorus_1' as any,
        lines: [
          { text: 'Love is pain', syllables: 3, stressPattern: 'x/x' },
          { text: 'Love is rain', syllables: 3, stressPattern: 'x/x' },
          { text: 'Love is wrong', syllables: 3, stressPattern: 'x/x' },
          { text: 'Love is long', syllables: 3, stressPattern: 'x/x' }
        ],
        rhymeScheme: 'AABB',
        syllablePattern: [3, 3, 3, 3],
        isMainChorus: true
      }
    ],
    bridge: null,
    metadata: { genre: 'Pop', mood: 'melancholic' },
    generatedAt: new Date()
  }

  const mockCritique = {
    songId: mockSong.id,
    overallScore: 65,
    passesGoldStandard: false,
    qualityLevel: 'good' as any,
    scores: {
      rhymeQuality: 60,
      flowConsistency: 70,
      imageryVividness: 50,
      emotionalAuthenticity: 75,
      originalityScore: 60,
      voiceConsistency: 70,
      structuralCoherence: 65,
      technicalExecution: 60
    },
    issues: [
      {
        issueType: 'CLICHE' as any,
        affectedLines: [0, 1],
        severity: 'major' as any,
        score_impact: 15,
        type: 'CLICHE',
        message: 'Cliched phrases detected',
        suggestion: 'Use more original language'
      }
    ],
    suggestions: [],
    strengths: ['Good emotional core', 'Decent rhyme scheme'],
    lineAnalysis: new Map(),
    sectionAnalysis: [],
    generatedAt: new Date()
  }

  return { mockSong, mockCritique }
}
