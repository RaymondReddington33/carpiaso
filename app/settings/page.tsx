"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { Save, Key, AlertCircle, CheckCircle2, XCircle, Loader2, CreditCard } from "lucide-react"
import { motion } from "framer-motion"

export default function SettingsPage() {
  const [openaiKey, setOpenaiKey] = useState("")
  const [pexelsKey, setPexelsKey] = useState("")
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [apiStatus, setApiStatus] = useState<{
    openai?: { status: "success" | "error" | "checking"; message: string; credits?: string }
    pexels?: { status: "success" | "error" | "checking"; message: string }
  }>({})
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    // Load API keys from localStorage
    const storedOpenai = localStorage.getItem("openai_api_key")
    const storedPexels = localStorage.getItem("pexels_api_key")
    if (storedOpenai) {
      setOpenaiKey(storedOpenai)
    }
    if (storedPexels) {
      setPexelsKey(storedPexels)
    }
  }, [])

  const checkApiStatus = async () => {
    setChecking(true)
    setApiStatus({
      openai: openaiKey ? { status: "checking", message: "Checking..." } : undefined,
      pexels: pexelsKey ? { status: "checking", message: "Checking..." } : undefined,
    })

    try {
      const response = await fetch("/api/check-api-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openaiApiKey: openaiKey.trim() || undefined,
          pexelsApiKey: pexelsKey.trim() || undefined,
        }),
      })

      if (response.ok) {
        const results = await response.json()
        setApiStatus(results)
      } else {
        setApiStatus({
          openai: openaiKey
            ? { status: "error", message: "Failed to check API status" }
            : undefined,
          pexels: pexelsKey
            ? { status: "error", message: "Failed to check API status" }
            : undefined,
        })
      }
    } catch (err) {
      setApiStatus({
        openai: openaiKey
          ? { status: "error", message: "Network error. Please check your connection." }
          : undefined,
        pexels: pexelsKey
          ? { status: "error", message: "Network error. Please check your connection." }
          : undefined,
      })
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    // Auto-check when keys change
    if (openaiKey || pexelsKey) {
      const timer = setTimeout(() => {
        checkApiStatus()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [openaiKey, pexelsKey])

  const handleSave = async () => {
    if (!openaiKey.trim()) {
      setError("OpenAI API Key is required")
      return
    }

    try {
      // Save to localStorage
      localStorage.setItem("openai_api_key", openaiKey.trim())
      // Always save Pexels key if provided, or remove it if empty
      if (pexelsKey.trim()) {
        localStorage.setItem("pexels_api_key", pexelsKey.trim())
        console.log("[Settings] Pexels API key saved to localStorage")
      } else {
        localStorage.removeItem("pexels_api_key")
        console.log("[Settings] Pexels API key removed from localStorage")
      }
      setSaved(true)
      setError("")
      
      // Re-check API status after saving
      await checkApiStatus()
      
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error("[Settings] Error saving API keys:", err)
      setError("Failed to save API keys")
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 sm:space-y-6"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-white mb-2">Settings</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Configure your OpenAI API key and other preferences.
            </p>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* OpenAI API Key */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    OpenAI API Key
                  </label>
                  {apiStatus.openai && (
                    <div className="flex items-center gap-2">
                      {apiStatus.openai.status === "checking" && (
                        <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
                      )}
                      {apiStatus.openai.status === "success" && (
                        <CheckCircle2 className="h-3 w-3 text-green-400" />
                      )}
                      {apiStatus.openai.status === "error" && (
                        <XCircle className="h-3 w-3 text-red-400" />
                      )}
                    </div>
                  )}
                </div>
                <input
                  type="password"
                  value={openaiKey}
                  onChange={(e) => {
                    setOpenaiKey(e.target.value)
                    setError("")
                  }}
                  placeholder="sk-proj-..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all"
                />
                {apiStatus.openai && (
                  <div
                    className={`text-xs rounded-lg p-2 ${
                      apiStatus.openai.status === "success"
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : apiStatus.openai.status === "error"
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {apiStatus.openai.status === "error" && <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />}
                      {apiStatus.openai.status === "success" && <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0" />}
                      <div className="flex-1">
                        <p className="font-medium">{apiStatus.openai.message}</p>
                        {apiStatus.openai.status === "success" && apiStatus.openai.credits && (
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-3 w-3" />
                              <p className="text-[10px] opacity-90">{apiStatus.openai.credits}</p>
                            </div>
                            <a
                              href="https://platform.openai.com/usage"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-blue-400 hover:text-blue-300 underline flex items-center gap-1 mt-1"
                            >
                              View detailed usage and credits on dashboard →
                            </a>
                          </div>
                        )}
                        {apiStatus.openai.status === "error" && (
                          <div className="mt-2 space-y-1 text-[10px]">
                            <p>• Verify that the API key is correct</p>
                            <p>• Make sure the key has not expired</p>
                            <p>• Check that you have credits available at{" "}
                              <a
                                href="https://platform.openai.com/usage"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline"
                              >
                                OpenAI Dashboard
                              </a>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Your API key is stored locally in your browser. Get your key from{" "}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    OpenAI Platform
                  </a>
                </p>
              </div>
            </div>

            {/* Pexels API Key */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Pexels API Key
                  </label>
                  {apiStatus.pexels && (
                    <div className="flex items-center gap-2">
                      {apiStatus.pexels.status === "checking" && (
                        <Loader2 className="h-3 w-3 animate-spin text-blue-400" />
                      )}
                      {apiStatus.pexels.status === "success" && (
                        <CheckCircle2 className="h-3 w-3 text-green-400" />
                      )}
                      {apiStatus.pexels.status === "error" && (
                        <XCircle className="h-3 w-3 text-red-400" />
                      )}
                    </div>
                  )}
                </div>
                <input
                  type="password"
                  value={pexelsKey}
                  onChange={(e) => {
                    setPexelsKey(e.target.value)
                    setError("")
                  }}
                  placeholder="Your Pexels API key..."
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all"
                />
                {apiStatus.pexels && (
                  <div
                    className={`text-xs rounded-lg p-2 ${
                      apiStatus.pexels.status === "success"
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : apiStatus.pexels.status === "error"
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {apiStatus.pexels.status === "error" && <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />}
                      {apiStatus.pexels.status === "success" && <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0" />}
                      <div className="flex-1">
                        <p className="font-medium">{apiStatus.pexels.message}</p>
                        {apiStatus.pexels.status === "success" && (
                          <div className="mt-2 space-y-1">
                            <p className="text-[10px] opacity-90">Free plan: 200 searches/hour</p>
                            <a
                              href="https://www.pexels.com/api/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-blue-400 hover:text-blue-300 underline flex items-center gap-1 mt-1"
                            >
                              View usage and limits on dashboard →
                            </a>
                          </div>
                        )}
                        {apiStatus.pexels.status === "error" && (
                          <div className="mt-2 space-y-1 text-[10px]">
                            <p>• Verify that the API key is correct</p>
                            <p>• Make sure the key has not expired</p>
                            <p>• Check your search limit at{" "}
                              <a
                                href="https://www.pexels.com/api/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline"
                              >
                                Pexels Dashboard
                              </a>
                            </p>
                            <p>• The free plan allows 200 searches/hour</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Used to fetch relevant images for local data recommendations. Get your key from{" "}
                  <a
                    href="https://www.pexels.com/api/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    Pexels API
                  </a>
                </p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <button
              onClick={handleSave}
              className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition-all hover:bg-neutral-200 flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saved ? "Saved!" : "Save API Keys"}
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  )
}

