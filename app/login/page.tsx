"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { motion } from "framer-motion"
import { Loader2, Mail, Fish } from "lucide-react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const router = useRouter()
  
  let supabase: ReturnType<typeof createClient> | null = null
  try {
    supabase = createClient()
  } catch (error: any) {
    console.error('[Login] Supabase client error:', error)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (!supabase) {
      setMessage({ 
        type: "error", 
        text: "Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables." 
      })
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setMessage({ type: "error", text: error.message })
      } else {
        setMessage({
          type: "success",
          text: "Check your email for the magic link to sign in!",
        })
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "An error occurred" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="rounded-xl border border-border bg-card p-8 shadow-lg">
          {/* Logo and Branding */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-black">
                <Fish className="h-7 w-7 fill-current" />
              </div>
              <h1 className="text-3xl font-bold text-white">Carpiaso</h1>
            </div>
            <h2 className="text-xl font-semibold text-white mb-3">
              Strategic ASO Report Generator
            </h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Generate professional App Store Optimization reports with AI-powered insights, 
              competitor analysis, and data-driven recommendations to maximize your app's conversion rate.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-muted-foreground focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-all"
                />
              </div>
            </div>

            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-lg p-3 text-sm ${
                  message.type === "success"
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                {message.text}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition-all hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending magic link...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Send Magic Link
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Powered by{" "}
              <span className="font-semibold text-white">Carpiapps</span> since 2017
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

