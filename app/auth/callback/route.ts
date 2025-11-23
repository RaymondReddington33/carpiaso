import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const origin = requestUrl.origin

  // Handle authentication errors
  if (error) {
    console.error('[Auth Callback] Authentication error:', error, errorDescription)
    
    // Redirect to login with error message
    const loginUrl = new URL(`${origin}/login`)
    if (error === 'access_denied' || error === 'otp_expired') {
      loginUrl.searchParams.set('error', 'expired')
      loginUrl.searchParams.set('message', 'Your magic link has expired. Please request a new one.')
    } else {
      loginUrl.searchParams.set('error', 'auth_failed')
      loginUrl.searchParams.set('message', errorDescription || 'Authentication failed. Please try again.')
    }
    
    return NextResponse.redirect(loginUrl.toString())
  }

  if (code) {
    try {
      const supabase = await createClient()
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('[Auth Callback] Error exchanging code:', exchangeError)
        // Redirect to login with error
        const loginUrl = new URL(`${origin}/login`)
        loginUrl.searchParams.set('error', 'exchange_failed')
        loginUrl.searchParams.set('message', 'Failed to complete sign in. Please try again.')
        return NextResponse.redirect(loginUrl.toString())
      }
    } catch (error) {
      console.error('[Auth Callback] Error exchanging code:', error)
      // Redirect to login with error
      const loginUrl = new URL(`${origin}/login`)
      loginUrl.searchParams.set('error', 'unknown')
      loginUrl.searchParams.set('message', 'An error occurred during sign in. Please try again.')
      return NextResponse.redirect(loginUrl.toString())
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/`)
}

