"use client"

import { useState, useEffect, useRef } from "react"
import { Header } from "@/components/dashboard/header"
import { ASOForm } from "@/components/dashboard/aso-form"
import { ASOReportView } from "@/components/dashboard/aso-report"
import { experimental_useObject as useObject } from "@ai-sdk/react"
import { asoReportSchema, type ASOInput, type ASOReport } from "@/lib/schemas"
import { AnimatePresence, motion } from "framer-motion"
import { Loader2, AlertCircle, Clock } from "lucide-react"
import { saveReportToHistory } from "@/lib/storage"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const GENERATION_STAGES = [
  { 
    message: "Initializing market analysis...", 
    description: "Setting up the analysis framework and gathering initial market data",
    progress: 10 
  },
  { 
    message: "Analyzing competition and visual patterns...", 
    description: "Extracting competitor app data, screenshots, icons, and identifying visual trends",
    progress: 25 
  },
  { 
    message: "Identifying cultural insights and local regulations...", 
    description: "Researching local market specifics, cultural preferences, and regulatory requirements",
    progress: 40 
  },
  { 
    message: "Generating A/B testing hypotheses...", 
    description: "Creating strategic hypotheses based on competitor analysis and market insights",
    progress: 55 
  },
  { 
    message: "Creating personalized recommendations...", 
    description: "Developing tailored recommendations for visual elements, copy, and positioning",
    progress: 70 
  },
  { 
    message: "Optimizing keywords for target market...", 
    description: "Analyzing keyword opportunities and local search patterns",
    progress: 85 
  },
  { 
    message: "Finalizing strategic report...", 
    description: "Compiling all insights into a comprehensive, actionable report",
    progress: 95 
  },
]

export default function Page() {
  const [hasStarted, setHasStarted] = useState(false)
  const [inputData, setInputData] = useState<ASOInput | null>(null)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [currentStage, setCurrentStage] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isEnriching, setIsEnriching] = useState(false)
  const [enrichedReport, setEnrichedReport] = useState<ASOReport | null>(null)
  const router = useRouter()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const stageIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Check for authentication errors in URL and redirect to login (only once)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const error = params.get('error')
      
      // Only redirect if there's an error and we're not already on login
      if (error && !window.location.pathname.startsWith('/login')) {
        const loginUrl = new URL('/login', window.location.origin)
        
        if (error === 'access_denied' || error === 'otp_expired') {
          loginUrl.searchParams.set('error', 'expired')
          loginUrl.searchParams.set('message', 'Your magic link has expired. Please request a new one.')
        } else {
          loginUrl.searchParams.set('error', 'auth_failed')
          loginUrl.searchParams.set('message', 'Authentication failed. Please try signing in again.')
        }
        
        // Clean current URL and redirect
        window.history.replaceState({}, '', '/')
        router.replace(loginUrl.toString())
      }
    }
  }, [router])

  // Refresh session after auth callback to ensure cookies are set
  useEffect(() => {
    const refreshSession = async () => {
      try {
        const supabase = createClient()
        // This will refresh the session and ensure cookies are properly set
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.warn('[Page] Session refresh error:', error)
        } else if (session) {
          console.log('[Page] Session refreshed successfully')
        }
      } catch (err) {
        console.warn('[Page] Could not refresh session:', err)
      }
    }
    
    // Only refresh once on mount
    refreshSession()
  }, [])
  
  const { object, submit, isLoading, error } = useObject({
    api: "/api/generate-aso-report",
    schema: asoReportSchema,
    onError: (error) => {
      console.error("[ASO] Generation error:", error)
    },
    onFinish: (result) => {
      console.log("[ASO] Generation finished:", result)
    },
  })

  // Timer effect - continue during enrichment
  useEffect(() => {
    if ((isLoading || isEnriching) && startTime) {
      // Update immediately
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
      
      intervalRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isLoading, isEnriching, startTime])

  // Stage progression effect with real progress simulation
  useEffect(() => {
    if (isLoading && startTime) {
      setCurrentStage(0)
      setProgress(3)
      
      // Simulate real progress based on time elapsed
      const progressInterval = setInterval(() => {
        if (startTime) {
          const elapsed = (Date.now() - startTime) / 1000 // seconds
          // More realistic progress: slower start, steady middle, slower end
          let estimatedProgress = 3
          if (elapsed < 60) {
            // First minute: 3% to 30% (slow start)
            estimatedProgress = 3 + (elapsed / 60) * 27
          } else if (elapsed < 120) {
            // Second minute: 30% to 70% (steady progress)
            estimatedProgress = 30 + ((elapsed - 60) / 60) * 40
          } else if (elapsed < 180) {
            // Third minute: 70% to 90% (slowing down)
            estimatedProgress = 70 + ((elapsed - 120) / 60) * 20
          } else {
            // After 3 minutes: 90% to 95% (very slow)
            estimatedProgress = 90 + Math.min(((elapsed - 180) / 60) * 5, 5)
          }
          setProgress(Math.min(Math.round(estimatedProgress), 95))
        }
      }, 300) // Update every 300ms for smoother progress
      
      stageIntervalRef.current = setInterval(() => {
        setCurrentStage((prev) => {
          const next = prev + 1
          if (next < GENERATION_STAGES.length) {
            return next
          }
          return prev
        })
      }, 20000) // Change stage every 20 seconds for more realistic feel
      
      return () => {
        clearInterval(progressInterval)
        if (stageIntervalRef.current) {
          clearInterval(stageIntervalRef.current)
        }
      }
    } else {
      if (stageIntervalRef.current) {
        clearInterval(stageIntervalRef.current)
        stageIntervalRef.current = null
      }
      if (object && !isEnriching) {
        setProgress(95) // Set to 95% when report is generated, 100% after enrichment
      }
    }
  }, [isLoading, object, isEnriching, startTime])

  const handleSubmit = (data: ASOInput) => {
    console.log("[ASO] Submitting form data:", data)
    setHasStarted(true)
    setInputData(data)
    setStartTime(Date.now())
    setElapsedTime(0)
    setCurrentStage(0)
    setProgress(3)
    
    // Get API keys from localStorage if available
    const apiKey = typeof window !== "undefined" ? localStorage.getItem("openai_api_key") : null
    const pexelsApiKey = typeof window !== "undefined" ? localStorage.getItem("pexels_api_key") : null
    
    if (!apiKey && !process.env.OPENAI_API_KEY) {
      console.warn("[ASO] No API key found in localStorage or env")
    }
    
    // Submit with API keys if available
    const submitData = { 
      ...data, 
      apiKey: apiKey || undefined,
      pexelsApiKey: pexelsApiKey || undefined,
    }
    console.log("[ASO] Submitting with API keys:", {
      openai: apiKey ? "***" + apiKey.slice(-4) : "none",
      pexels: pexelsApiKey ? "***" + pexelsApiKey.slice(-4) : "none",
    })
    submit(submitData)
  }

  // Enrich report with Pexels images and save to history when it's generated
  useEffect(() => {
    if (object && inputData && !isLoading && !enrichedReport) {
      // Enrich with Pexels images if available
      const enrichWithPexels = async () => {
        setIsEnriching(true)
        setProgress(90) // Start enrichment at 90%
        setCurrentStage(GENERATION_STAGES.length - 1) // Last stage
        
        // Simulate progress during enrichment
        const enrichmentProgressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev < 98) {
              return prev + 0.3 // Slowly increase to 98%
            }
            return prev
          })
        }, 1000) // Update every second
        
        const pexelsApiKey = typeof window !== "undefined" ? localStorage.getItem("pexels_api_key") : null
        if (pexelsApiKey) {
          try {
            console.log("[ASO] Starting Pexels enrichment...")
            const response = await fetch("/api/enrich-with-pexels", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                report: object,
                country: inputData.country,
                pexelsApiKey,
              }),
            })
            if (response.ok) {
              const { report: enriched } = await response.json()
              console.log("[ASO] Pexels enrichment completed")
              clearInterval(enrichmentProgressInterval)
              setProgress(100)
              // Small delay to show 100% before switching
              setTimeout(() => {
                setEnrichedReport(enriched)
                saveReportToHistory(inputData, enriched)
                setIsEnriching(false)
              }, 500)
              return
            } else {
              console.error("[ASO] Pexels enrichment failed:", response.status)
            }
          } catch (error) {
            console.error("[ASO] Error enriching with Pexels:", error)
          }
        }
        // Fallback: save without enrichment
        console.log("[ASO] Saving report without Pexels enrichment")
        clearInterval(enrichmentProgressInterval)
        setEnrichedReport(object as any)
        setProgress(100)
        saveReportToHistory(inputData, object as any)
        setIsEnriching(false)
      }
      enrichWithPexels()
    }
  }, [object, inputData, isLoading, enrichedReport])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Calculate estimated time remaining (countdown)
  const getEstimatedTimeRemaining = () => {
    if (!startTime || progress < 10) return null
    
    const elapsed = elapsedTime
    const progressPercent = progress / 100
    
    if (progressPercent < 0.10) return null // Don't show if progress is too low
    
    // Estimate: if we've done X% in Y seconds, total time = Y / X%
    // Add some buffer for remaining work
    const estimatedTotal = (elapsed / progressPercent) * 1.15 // 15% buffer
    const remaining = Math.max(0, estimatedTotal - elapsed)
    
    const mins = Math.floor(remaining / 60)
    const secs = Math.floor(remaining % 60)
    
    if (mins > 0 || secs > 15) { // Only show if more than 15 seconds
      return `${mins}:${secs.toString().padStart(2, "0")}`
    }
    return null
  }

  const getStatusText = () => {
    if (error) return "Generation Failed"
    if (isEnriching) return "Enriching with images and local data..."
    if (isLoading) return GENERATION_STAGES[currentStage]?.message || "Generating Report..."
    if (enrichedReport) return "Report Generated and Enriched"
    if (object) return "Report Generated (Preparing...)"
    return "Report Generated"
  }

  const getStatusColor = () => {
    if (error) return "bg-red-500"
    if (isEnriching) return "bg-blue-500"
    if (isLoading) return "bg-green-500"
    if (enrichedReport) return "bg-indigo-500"
    return "bg-neutral-500"
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          {!hasStarted ? (
            <motion.div key="form" exit={{ opacity: 0, y: -20 }} className="py-6 sm:py-12">
              <ASOForm onSubmit={handleSubmit} isLoading={false} />
            </motion.div>
          ) : (
            <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto">
              {/* Status Bar */}
              <div className="mb-6 sm:mb-8 flex items-center justify-between rounded-lg border border-border bg-card px-3 sm:px-4 py-2 sm:py-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  {(isLoading || isEnriching) ? (
                    <div className="flex h-2 w-2 flex-shrink-0">
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </div>
                  ) : (
                    <div className={`h-2 w-2 rounded-full flex-shrink-0 ${getStatusColor()}`} />
                  )}
                  <span className="text-xs sm:text-sm font-medium text-white truncate">{getStatusText()}</span>
                </div>
                {!isLoading && !isEnriching && (
                  <button
                    onClick={() => window.location.reload()}
                    className="text-xs text-muted-foreground hover:text-white flex-shrink-0 ml-2"
                  >
                    New Report
                  </button>
                )}
              </div>

              {/* Progress Bar - Compact Version */}
              {(isLoading || isEnriching || (object && !enrichedReport)) && (
                <div className="mb-4 sm:mb-6 rounded-lg border border-border bg-card p-3 sm:p-4">
                  {/* Compact Header */}
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="flex h-1.5 w-1.5 flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base font-semibold text-white truncate">
                          {isEnriching 
                            ? "Enriching Report with Visual Data"
                            : GENERATION_STAGES[currentStage]?.message || "Generating Report..."}
                        </h3>
                        <p className="text-xs text-neutral-400 truncate">
                          {isEnriching 
                            ? "Adding contextual images from Pexels..."
                            : GENERATION_STAGES[currentStage]?.description || "Processing..."}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 text-xs">
                      <div className="flex items-center gap-1.5 text-neutral-400">
                        <Clock className="h-3.5 w-3.5 text-green-400" />
                        <span className="font-mono text-white">{formatTime(elapsedTime)}</span>
                      </div>
                      {progress >= 5 && (
                        <span className="font-semibold text-green-400">{Math.round(progress)}%</span>
                      )}
                    </div>
                  </div>

                  {/* Compact Progress Bar */}
                  <div className="relative h-2 w-full rounded-full bg-neutral-900 overflow-hidden border border-neutral-800">
                    <motion.div
                      className={`absolute left-0 top-0 h-full rounded-full transition-all ${
                        progress < 25 
                          ? "bg-gradient-to-r from-green-400 via-green-500 to-green-500"
                          : progress < 50
                          ? "bg-gradient-to-r from-green-500 via-green-500 to-green-600"
                          : progress < 75
                          ? "bg-gradient-to-r from-green-500 via-green-600 to-green-500"
                          : progress < 95
                          ? "bg-gradient-to-r from-green-500 via-green-400 to-green-500"
                          : "bg-gradient-to-r from-green-400 via-green-300 to-green-200"
                      }`}
                      initial={{ width: "0%" }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>

                  {/* Compact Stage Indicator */}
                  {!isEnriching && (
                    <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-border">
                      <div className="flex gap-1">
                        {GENERATION_STAGES.map((stage, idx) => (
                          <div
                            key={idx}
                            className={`h-1.5 rounded-full transition-all ${
                              idx < currentStage
                                ? "bg-green-500 w-6"
                                : idx === currentStage
                                ? "bg-green-400 w-6 animate-pulse"
                                : "bg-neutral-800 w-3"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-neutral-500 ml-1">
                        {currentStage + 1}/{GENERATION_STAGES.length}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {error ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4 rounded-xl border border-red-500/20 bg-red-500/10 p-8">
                  <div className="rounded-full bg-red-500/20 p-4">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-medium text-white">Generation Error</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      {error.message ||
                        "Failed to generate the report. Please check your API configuration and try again."}
                    </p>
                    {(error.message?.includes("401") || 
                       error.message?.includes("OPENAI_API_KEY") || 
                       error.message?.includes("Missing")) && (
                      <div className="space-y-2 mt-4">
                        <p className="text-xs text-red-400 font-mono">
                          Error: Invalid or missing OpenAI API key
                        </p>
                        <a
                          href="/settings"
                          className="text-xs text-blue-400 hover:text-blue-300 underline"
                        >
                          Configure API key in Settings
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-neutral-200 transition-colors"
                    >
                      Try Again
                    </button>
                    <a
                      href="/settings"
                      className="px-4 py-2 bg-neutral-800 text-white text-sm font-medium rounded-lg hover:bg-neutral-700 transition-colors"
                    >
                      Go to Settings
                    </a>
                  </div>
                </div>
              ) : enrichedReport ? (
                <ASOReportView data={enrichedReport} />
              ) : object ? (
                <div className="flex flex-col items-center justify-center py-32 space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-green-400" />
                  <p className="text-muted-foreground text-sm">Preparing report with images...</p>
                </div>
              ) : null}
              {/* End of Error State Handling */}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
