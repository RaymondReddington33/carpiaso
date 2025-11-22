"use client"

import { Fish, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <header className="flex h-16 items-center border-b border-border bg-black px-6">
      <Link href="/" className="flex items-center gap-2 font-semibold text-white">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-black">
          <Fish className="h-5 w-5 fill-current" />
        </div>
        <span>Carpitaso</span>
      </Link>
      <nav className="ml-8 flex gap-6 text-sm text-muted-foreground">
        <Link
          href="/"
          className={pathname === "/" ? "text-white hover:text-white" : "hover:text-white"}
        >
          Generator
        </Link>
        <Link
          href="/history"
          className={pathname === "/history" ? "text-white hover:text-white" : "hover:text-white"}
        >
          History
        </Link>
        <Link
          href="/settings"
          className={pathname === "/settings" ? "text-white hover:text-white" : "hover:text-white"}
        >
          Settings
        </Link>
      </nav>
      <div className="ml-auto flex items-center gap-4">
        {user && (
          <>
            <span className="text-xs text-muted-foreground">{user.email}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  )
}
