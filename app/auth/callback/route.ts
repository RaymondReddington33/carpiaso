import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
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
      const cookieStore = await cookies()
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables')
      }

      // Create a response object to handle cookies - redirect to home
      const redirectUrl = new URL(`${origin}/`)
      const response = NextResponse.redirect(redirectUrl.toString())
      
      const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) => {
                  // Set cookie in cookieStore
                  cookieStore.set(name, value, {
                    ...options,
                    // Ensure cookies work across www and non-www
                    sameSite: 'lax' as const,
                    httpOnly: options?.httpOnly ?? true,
                    secure: options?.secure ?? process.env.NODE_ENV === 'production',
                  })
                  // Also set in response
                  response.cookies.set(name, value, {
                    ...options,
                    sameSite: 'lax' as const,
                    httpOnly: options?.httpOnly ?? true,
                    secure: options?.secure ?? process.env.NODE_ENV === 'production',
                  })
                })
                console.log('[Auth Callback] Cookies set:', cookiesToSet.map(c => c.name))
              } catch (err) {
                console.warn('[Auth Callback] Cookie set warning:', err)
              }
            },
          },
        }
      )

      console.log('[Auth Callback] Exchanging code for session...')
      const { error: exchangeError, data: exchangeData } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('[Auth Callback] Error exchanging code:', exchangeError)
        // Redirect to login with error
        const loginUrl = new URL(`${origin}/login`)
        loginUrl.searchParams.set('error', 'exchange_failed')
        loginUrl.searchParams.set('message', exchangeError.message || 'Failed to complete sign in. Please try again.')
        return NextResponse.redirect(loginUrl.toString())
      }

      console.log('[Auth Callback] Code exchanged successfully, verifying session...')

      // Verify the session was created by checking the user
      const { data: { user }, error: getUserError } = await supabase.auth.getUser()
      
      if (getUserError) {
        console.error('[Auth Callback] Error getting user:', getUserError)
        const loginUrl = new URL(`${origin}/login`)
        loginUrl.searchParams.set('error', 'session_failed')
        loginUrl.searchParams.set('message', 'Session could not be verified. Please try again.')
        return NextResponse.redirect(loginUrl.toString())
      }

      if (!user) {
        console.error('[Auth Callback] No user after exchange')
        const loginUrl = new URL(`${origin}/login`)
        loginUrl.searchParams.set('error', 'session_failed')
        loginUrl.searchParams.set('message', 'Session could not be established. Please try again.')
        return NextResponse.redirect(loginUrl.toString())
      }

      console.log('[Auth Callback] Successfully authenticated user:', user.email)
      console.log('[Auth Callback] Redirecting to home with cookies...')
      
      // Return the response with cookies set
      return response
    } catch (error: any) {
      console.error('[Auth Callback] Error exchanging code:', error)
      // Redirect to login with error
      const loginUrl = new URL(`${origin}/login`)
      loginUrl.searchParams.set('error', 'unknown')
      loginUrl.searchParams.set('message', error?.message || 'An error occurred during sign in. Please try again.')
      return NextResponse.redirect(loginUrl.toString())
    }
  }

  // If no code and no error, redirect to login
  return NextResponse.redirect(`${origin}/login`)
}

