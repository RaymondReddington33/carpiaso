"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import {
  getReportHistory,
  deleteReport,
  deleteReports,
  exportReport,
  exportReports,
  type ReportHistoryItem,
} from "@/lib/storage"
import { motion, AnimatePresence } from "framer-motion"
import {
  Trash2,
  Download,
  Eye,
  Calendar,
  Globe,
  Smartphone,
  Folder,
  CheckSquare,
  Square,
  FileText,
} from "lucide-react"
import { ASOReportView } from "@/components/dashboard/aso-report"
import { format } from "date-fns"

export default function HistoryPage() {
  const [history, setHistory] = useState<ReportHistoryItem[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [groupedByApp, setGroupedByApp] = useState<Record<string, ReportHistoryItem[]>>({})

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = () => {
    const reports = getReportHistory()
    setHistory(reports)
    
    // Group by app name
    const grouped: Record<string, ReportHistoryItem[]> = {}
    reports.forEach((report) => {
      if (!grouped[report.appName]) {
        grouped[report.appName] = []
      }
      grouped[report.appName].push(report)
    })
    setGroupedByApp(grouped)
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this report?")) {
      deleteReport(id)
      loadHistory()
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      if (previewId === id) {
        setPreviewId(null)
      }
    }
  }

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return
    if (confirm(`Are you sure you want to delete ${selectedIds.size} report(s)?`)) {
      deleteReports(Array.from(selectedIds))
      loadHistory()
      setSelectedIds(new Set())
      if (previewId && selectedIds.has(previewId)) {
        setPreviewId(null)
      }
    }
  }

  const handleExport = (id: string) => {
    const item = history.find((r) => r.id === id)
    if (!item) return

    const data = exportReport(item)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `aso-report-${item.appName}-${item.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleBulkExport = () => {
    if (selectedIds.size === 0) return

    const items = history.filter((r) => selectedIds.has(r.id))
    const data = exportReports(items)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `aso-reports-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === history.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(history.map((r) => r.id)))
    }
  }

  const previewItem = history.find((r) => r.id === previewId)

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-white mb-2">History</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            View, export, and manage your generated ASO reports.
          </p>
        </div>

        {history.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No reports generated yet.</p>
            <a
              href="/"
              className="text-blue-400 hover:text-blue-300 underline mt-2 inline-block"
            >
              Generate your first report
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Bulk Actions */}
            {selectedIds.size > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-border bg-card p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2"
              >
                <span className="text-sm text-white">
                  {selectedIds.size} report(s) selected
                </span>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleBulkExport}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm text-white transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Export Selected</span>
                    <span className="sm:hidden">Export</span>
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-sm text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Delete Selected</span>
                    <span className="sm:hidden">Delete</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Reports grouped by app */}
            {Object.entries(groupedByApp).map(([appName, reports]) => (
              <div key={appName} className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-white">
                  <Folder className="h-4 w-4 text-blue-400" />
                  <span>{appName}</span>
                  <span className="text-muted-foreground">({reports.length})</span>
                </div>

                <div className="space-y-2">
                  {reports.map((item) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="rounded-lg border border-border bg-card p-3 sm:p-4 hover:border-white/20 transition-colors"
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        <button
                          onClick={() => toggleSelect(item.id)}
                          className="mt-1 text-muted-foreground hover:text-white transition-colors flex-shrink-0"
                        >
                          {selectedIds.has(item.id) ? (
                            <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                          ) : (
                            <Square className="h-4 w-4 sm:h-5 sm:w-5" />
                          )}
                        </button>

                        <div className="flex-1 space-y-2 min-w-0">
                          <div className="flex items-start justify-between gap-2 sm:gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                                <h3 className="font-medium text-white text-sm sm:text-base truncate">{item.appName}</h3>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {format(new Date(item.timestamp), "MMM d, yyyy HH:mm")}
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                                {item.summary || "ASO Report"}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              <span className="truncate">{item.country}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Smartphone className="h-3 w-3" />
                              <span className="truncate">{item.platforms.join(", ")}</span>
                            </div>
                            <span className="truncate">{item.category}</span>
                            {item.competitors.length > 0 && (
                              <span className="truncate">{item.competitors.length} competitor(s)</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                          <button
                            onClick={() => setPreviewId(previewId === item.id ? null : item.id)}
                            className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                            title="Preview"
                          >
                            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                          <button
                            onClick={() => handleExport(item.id)}
                            className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                            title="Export"
                          >
                            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 sm:p-2 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Preview Modal */}
        <AnimatePresence>
          {previewItem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50 overflow-y-auto"
              onClick={() => setPreviewId(null)}
            >
              <div className="min-h-screen px-2 sm:px-4 py-4 sm:py-8">
                <div className="max-w-6xl mx-auto">
                  <div className="bg-card rounded-xl border border-border p-4 sm:p-6 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg sm:text-xl font-medium text-white truncate pr-2">
                        Preview: {previewItem.appName}
                      </h2>
                      <button
                        onClick={() => setPreviewId(null)}
                        className="text-muted-foreground hover:text-white flex-shrink-0 p-1"
                        aria-label="Close"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <ASOReportView data={previewItem.report} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

