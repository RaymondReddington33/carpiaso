// Storage utilities for ASO reports history

export interface ReportHistoryItem {
  id: string
  timestamp: number
  appName: string
  platforms: string[]
  country: string
  language: string
  category: string
  competitors: Array<{ name?: string; iosUrl?: string; androidUrl?: string }>
  keywords: string[]
  report: any // ASOReport type
  summary?: string
}

const STORAGE_KEY = "aso_reports_history"

export function saveReportToHistory(
  input: {
    appName: string
    platforms: string[]
    country: string
    language: string
    category: string
    competitors?: Array<{ name?: string; iosUrl?: string; androidUrl?: string }>
    keywords: string[]
  },
  report: any
): ReportHistoryItem {
  const item: ReportHistoryItem = {
    id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    appName: input.appName,
    platforms: input.platforms,
    country: input.country,
    language: input.language,
    category: input.category,
    competitors: input.competitors || [],
    keywords: input.keywords,
    report,
    summary: generateSummary(report),
  }

  const history = getReportHistory()
  history.unshift(item) // Add to beginning
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  
  return item
}

export function getReportHistory(): ReportHistoryItem[] {
  if (typeof window === "undefined") return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function deleteReport(id: string): void {
  const history = getReportHistory()
  const filtered = history.filter((item) => item.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

export function deleteReports(ids: string[]): void {
  const history = getReportHistory()
  const filtered = history.filter((item) => !ids.includes(item.id))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

export function getReportById(id: string): ReportHistoryItem | null {
  const history = getReportHistory()
  return history.find((item) => item.id === id) || null
}

function generateSummary(report: any): string {
  if (!report) return "No summary available"
  
  try {
    const recommendations = report.recommendations || []
    const insights = report.culturalInsights || {}
    
    let summary = ""
    if (recommendations.length > 0) {
      summary = recommendations[0].title || recommendations[0].insight || ""
    }
    if (!summary && insights.urbanMobility) {
      summary = insights.urbanMobility.substring(0, 150) + "..."
    }
    
    return summary || "ASO Report generated"
  } catch {
    return "ASO Report generated"
  }
}

export function exportReport(item: ReportHistoryItem): string {
  return JSON.stringify(item, null, 2)
}

export function exportReports(items: ReportHistoryItem[]): string {
  return JSON.stringify(items, null, 2)
}

export function getReportsByApp(appName: string): ReportHistoryItem[] {
  const history = getReportHistory()
  return history.filter((item) => item.appName === appName)
}

