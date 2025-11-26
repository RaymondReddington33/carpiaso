"use client"

import { Fish, LogOut, Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Only create client if env vars are available (client-side only)
    if (typeof window === 'undefined') return
    
    let supabase: ReturnType<typeof createClient> | null = null
    
    try {
      supabase = createClient()
      if (!supabase) return
      
      supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user)
      }).catch((err) => {
        console.warn('[Header] Error getting user:', err)
      })

      supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
      })
    } catch (error) {
      console.warn('[Header] Could not initialize Supabase client:', error)
    }
  }, [])

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/login")
    } catch (error) {
      console.error('[Header] Error during logout:', error)
      router.push("/login")
    }
  }

  return (
    <header className="relative flex h-14 sm:h-16 items-center border-b border-border bg-black px-3 sm:px-4 md:px-6">
      <Link href="/" className="flex items-center gap-2 font-semibold text-white flex-shrink-0">
        <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-white text-black">
          <Fish className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
        </div>
        <span className="hidden sm:inline text-sm sm:text-base">Carpitaso</span>
      </Link>
      <nav className="ml-3 sm:ml-4 md:ml-8 hidden md:flex gap-4 lg:gap-6 text-sm text-muted-foreground">
        <Link
          href="/"
          className={pathname === "/" ? "text-white hover:text-white" : "hover:text-white transition-colors"}
        >
          Generator
        </Link>
        <Link
          href="/history"
          className={pathname === "/history" ? "text-white hover:text-white" : "hover:text-white transition-colors"}
        >
          History
        </Link>
        <Link
          href="/settings"
          className={pathname === "/settings" ? "text-white hover:text-white" : "hover:text-white transition-colors"}
        >
          Settings
        </Link>
      </nav>
      <div className="ml-auto flex items-center gap-1.5 sm:gap-2 md:gap-4">
        {user && (
          <>
            <span className="hidden lg:inline text-xs text-muted-foreground truncate max-w-[150px] xl:max-w-none">
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground hover:text-white transition-colors p-1.5 sm:p-2 md:p-0"
              title="Logout"
            >
              <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </>
        )}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-muted-foreground hover:text-white transition-colors p-1.5 flex-shrink-0"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 bg-black border-b border-border md:hidden z-50 shadow-lg">
            <nav className="flex flex-col px-4 py-4 space-y-3">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-sm py-2 ${pathname === "/" ? "text-white font-medium" : "text-muted-foreground hover:text-white"}`}
              >
                Generator
              </Link>
              <Link
                href="/history"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-sm py-2 ${pathname === "/history" ? "text-white font-medium" : "text-muted-foreground hover:text-white"}`}
              >
                History
              </Link>
              <Link
                href="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-sm py-2 ${pathname === "/settings" ? "text-white font-medium" : "text-muted-foreground hover:text-white"}`}
              >
                Settings
              </Link>
              {user && (
                <div className="pt-3 border-t border-border">
                  <div className="text-xs text-muted-foreground mb-3 truncate px-1">{user.email}</div>
                  <button
                    onClick={() => {
                      handleLogout()
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors w-full py-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </nav>
          </div>
        </>
      )}
    </header>
  )
}
