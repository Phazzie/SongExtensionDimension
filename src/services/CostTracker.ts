/**
 * @fileoverview Cost Tracker
 * @purpose Track AI service costs and enforce budget limits
 * @phase Phase 5 - INTEGRATE (Real Services)
 * @created 2025-11-17
 *
 * This tracker:
 * - Tracks token usage per service
 * - Tracks estimated costs in USD
 * - Enforces monthly budget limits
 * - Provides warning system (80%, 90%, 100% of budget)
 * - Generates cost reports
 * - Resets automatically on monthly basis
 * - Persists data across sessions (future: to workspace state)
 *
 * Cost Tracking:
 * - Each request records: service, tokens, cost, timestamp
 * - Monthly totals are calculated on demand
 * - Budget enforcement prevents requests when limit reached
 */

/**
 * Request tracking entry
 */
export interface CostEntry {
  readonly timestamp: Date
  readonly service: string
  readonly inputTokens: number
  readonly outputTokens: number
  readonly estimatedCost: number
  readonly provider: string
}

/**
 * Budget check result
 */
export interface BudgetCheckResult {
  readonly allowed: boolean
  readonly remaining: number
  readonly used: number
  readonly limit: number
  readonly percentageUsed: number
  readonly message?: string
}

/**
 * Cost statistics
 */
export interface CostStatistics {
  readonly totalTokens: number
  readonly totalCost: number
  readonly requestCount: number
  readonly averageCostPerRequest: number
  readonly monthToDate: {
    readonly totalCost: number
    readonly totalTokens: number
    readonly requestCount: number
  }
  readonly byService: Record<string, {
    readonly totalCost: number
    readonly totalTokens: number
    readonly requestCount: number
  }>
  readonly byProvider: Record<string, {
    readonly totalCost: number
    readonly totalTokens: number
    readonly requestCount: number
  }>
}

/**
 * Warning callback type
 */
export type CostWarningCallback = (
  percentageUsed: number,
  used: number,
  limit: number
) => void

/**
 * Cost Tracker
 *
 * Tracks AI service costs, enforces budgets, and provides cost analytics.
 */
export class CostTracker {
  private entries: CostEntry[] = []
  private monthlyLimit: number
  private warningCallbacks: CostWarningCallback[] = []
  private lastResetMonth: number
  private warningsIssued: Set<number> = new Set() // Track which warning levels have been issued
  private maxEntries: number
  private maxAgeDays: number

  /**
   * Create a new cost tracker
   *
   * @param monthlyLimit - Monthly budget limit in USD (default: $100)
   * @param maxEntries - Maximum number of entries to keep (default: 10000)
   * @param maxAgeDays - Maximum age of entries in days (default: 90)
   */
  constructor(monthlyLimit: number = 100, maxEntries: number = 10000, maxAgeDays: number = 90) {
    this.monthlyLimit = monthlyLimit
    this.maxEntries = maxEntries
    this.maxAgeDays = maxAgeDays
    this.lastResetMonth = new Date().getMonth()
  }

  /**
   * Track a request
   *
   * @param service - Service name (e.g., 'songGeneration', 'critiqueEngine')
   * @param inputTokens - Number of input tokens
   * @param outputTokens - Number of output tokens
   * @param cost - Estimated cost in USD
   * @param provider - Provider name (e.g., 'grok', 'mock')
   */
  trackRequest(
    service: string,
    inputTokens: number,
    outputTokens: number,
    cost: number,
    provider: string = 'unknown'
  ): void {
    // Check if we need to reset for new month
    this.checkMonthlyReset()

    // Prune old entries to prevent unbounded memory growth
    this.pruneOldEntries()

    // Create entry
    const entry: CostEntry = {
      timestamp: new Date(),
      service,
      inputTokens,
      outputTokens,
      estimatedCost: cost,
      provider
    }

    // Add to history
    this.entries.push(entry)

    // Check for budget warnings
    this.checkBudgetWarnings()
  }

  /**
   * Check if a request is allowed within budget
   *
   * @param estimatedCost - Estimated cost of the request
   * @returns Budget check result
   */
  checkBudget(estimatedCost: number = 0): BudgetCheckResult {
    this.checkMonthlyReset()

    const used = this.getMonthToDateCost()
    const remaining = Math.max(0, this.monthlyLimit - used)
    const percentageUsed = this.monthlyLimit > 0 ? (used / this.monthlyLimit) * 100 : 0

    // Check if request would exceed budget
    const wouldExceed = (used + estimatedCost) > this.monthlyLimit
    const allowed = !wouldExceed

    let message: string | undefined

    if (!allowed) {
      message = `Budget limit reached. Used $${used.toFixed(2)} of $${this.monthlyLimit.toFixed(2)} monthly limit. ` +
        `This request would cost approximately $${estimatedCost.toFixed(4)}.`
    } else if (percentageUsed >= 90) {
      message = `Warning: ${percentageUsed.toFixed(1)}% of monthly budget used.`
    }

    return {
      allowed,
      remaining,
      used,
      limit: this.monthlyLimit,
      percentageUsed,
      message
    }
  }

  /**
   * Get cost statistics
   *
   * @returns Detailed cost statistics
   */
  getStatistics(): CostStatistics {
    const totalTokens = this.entries.reduce(
      (sum, entry) => sum + entry.inputTokens + entry.outputTokens,
      0
    )

    const totalCost = this.entries.reduce(
      (sum, entry) => sum + entry.estimatedCost,
      0
    )

    const requestCount = this.entries.length

    const averageCostPerRequest = requestCount > 0 ? totalCost / requestCount : 0

    // Month-to-date statistics
    const monthEntries = this.getMonthToDateEntries()
    const monthToDate = {
      totalCost: monthEntries.reduce((sum, entry) => sum + entry.estimatedCost, 0),
      totalTokens: monthEntries.reduce(
        (sum, entry) => sum + entry.inputTokens + entry.outputTokens,
        0
      ),
      requestCount: monthEntries.length
    }

    // By service
    const byService: Record<string, {
      totalCost: number
      totalTokens: number
      requestCount: number
    }> = {}

    for (const entry of this.entries) {
      if (!byService[entry.service]) {
        byService[entry.service] = {
          totalCost: 0,
          totalTokens: 0,
          requestCount: 0
        }
      }

      const serviceStats = byService[entry.service]
      if (serviceStats) {
        serviceStats.totalCost += entry.estimatedCost
        serviceStats.totalTokens += entry.inputTokens + entry.outputTokens
        serviceStats.requestCount++
      }
    }

    // By provider
    const byProvider: Record<string, {
      totalCost: number
      totalTokens: number
      requestCount: number
    }> = {}

    for (const entry of this.entries) {
      if (!byProvider[entry.provider]) {
        byProvider[entry.provider] = {
          totalCost: 0,
          totalTokens: 0,
          requestCount: 0
        }
      }

      const providerStats = byProvider[entry.provider]
      if (providerStats) {
        providerStats.totalCost += entry.estimatedCost
        providerStats.totalTokens += entry.inputTokens + entry.outputTokens
        providerStats.requestCount++
      }
    }

    return {
      totalTokens,
      totalCost,
      requestCount,
      averageCostPerRequest,
      monthToDate,
      byService,
      byProvider
    }
  }

  /**
   * Reset monthly tracking
   *
   * This is called automatically on month change, but can be called manually if needed.
   */
  resetMonthly(): void {
    // Keep only entries from previous months for historical data
    // (or we could clear all entries - depends on requirements)
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    this.entries = this.entries.filter(entry => {
      const entryMonth = entry.timestamp.getMonth()
      const entryYear = entry.timestamp.getFullYear()
      return entryYear < currentYear || entryMonth < currentMonth
    })

    this.lastResetMonth = currentMonth
    this.warningsIssued.clear()
  }

  /**
   * Update monthly budget limit
   *
   * @param limit - New monthly limit in USD
   */
  setMonthlyLimit(limit: number): void {
    if (limit < 0) {
      throw new Error('Monthly limit must be non-negative')
    }

    this.monthlyLimit = limit

    // Re-check warnings with new limit
    this.checkBudgetWarnings()
  }

  /**
   * Get current monthly limit
   *
   * @returns Monthly limit in USD
   */
  getMonthlyLimit(): number {
    return this.monthlyLimit
  }

  /**
   * Register callback for budget warnings
   *
   * @param callback - Callback function
   * @returns Disposable to unregister
   */
  onWarning(callback: CostWarningCallback): { dispose: () => void } {
    this.warningCallbacks.push(callback)

    return {
      dispose: () => {
        const index = this.warningCallbacks.indexOf(callback)
        if (index >= 0) {
          this.warningCallbacks.splice(index, 1)
        }
      }
    }
  }

  /**
   * Get all cost entries (for export/analysis)
   *
   * @returns Array of cost entries
   */
  getEntries(): readonly CostEntry[] {
    return Object.freeze([...this.entries])
  }

  /**
   * Clear all entries (use with caution)
   */
  clearHistory(): void {
    this.entries = []
    this.warningsIssued.clear()
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Prune old entries to prevent unbounded memory growth
   *
   * Removes entries that are:
   * - Older than maxAgeDays (default: 90 days)
   * - Beyond maxEntries count (default: 10000)
   */
  private pruneOldEntries(): void {
    const now = new Date()
    const cutoffDate = new Date(now.getTime() - this.maxAgeDays * 24 * 60 * 60 * 1000)

    // Remove entries older than maxAgeDays
    this.entries = this.entries.filter(entry => entry.timestamp >= cutoffDate)

    // If still over maxEntries, remove oldest entries
    if (this.entries.length > this.maxEntries) {
      // Sort by timestamp descending and keep only maxEntries
      this.entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      this.entries = this.entries.slice(0, this.maxEntries)
    }
  }

  /**
   * Get month-to-date cost
   */
  private getMonthToDateCost(): number {
    return this.getMonthToDateEntries().reduce(
      (sum, entry) => sum + entry.estimatedCost,
      0
    )
  }

  /**
   * Get entries for current month
   */
  private getMonthToDateEntries(): CostEntry[] {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()

    return this.entries.filter(entry => {
      const entryMonth = entry.timestamp.getMonth()
      const entryYear = entry.timestamp.getFullYear()
      return entryYear === currentYear && entryMonth === currentMonth
    })
  }

  /**
   * Check if we need to reset for new month
   */
  private checkMonthlyReset(): void {
    const currentMonth = new Date().getMonth()

    if (currentMonth !== this.lastResetMonth) {
      this.resetMonthly()
    }
  }

  /**
   * Check for budget warnings and notify callbacks
   */
  private checkBudgetWarnings(): void {
    if (this.monthlyLimit === 0) {
      return // No budget set, no warnings
    }

    const used = this.getMonthToDateCost()
    const percentageUsed = (used / this.monthlyLimit) * 100

    // Warning thresholds: 80%, 90%, 100%
    const thresholds = [80, 90, 100]

    for (const threshold of thresholds) {
      if (percentageUsed >= threshold && !this.warningsIssued.has(threshold)) {
        // Issue warning
        this.notifyWarning(percentageUsed, used, this.monthlyLimit)
        this.warningsIssued.add(threshold)
      }
    }
  }

  /**
   * Notify all warning callbacks
   */
  private notifyWarning(percentageUsed: number, used: number, limit: number): void {
    for (const callback of this.warningCallbacks) {
      try {
        callback(percentageUsed, used, limit)
      } catch (error) {
        console.error('[CostTracker] Error in warning callback:', error)
      }
    }
  }
}

/**
 * Singleton instance of CostTracker
 */
let costTrackerInstance: CostTracker | null = null

/**
 * Get the singleton CostTracker instance
 *
 * @param monthlyLimit - Monthly budget limit (only used on first call)
 * @returns CostTracker instance
 */
export function getCostTracker(monthlyLimit?: number): CostTracker {
  if (!costTrackerInstance) {
    costTrackerInstance = new CostTracker(monthlyLimit)
  }
  return costTrackerInstance
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetCostTracker(): void {
  costTrackerInstance = null
}
