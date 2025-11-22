import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    try {
      const supabase = await createClient()
      await supabase.auth.exchangeCodeForSession(code)
    } catch (error) {
      console.error('[Auth Callback] Error exchanging code:', error)
      // Still redirect even if there's an error
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/`)
}

