import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Check if Supabase env vars are available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If env vars are missing, skip auth check (useful for build time)
  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  try {
    // Refresh the session to ensure cookies are up to date
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    // Always allow access to login and auth callback pages
    if (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/auth')) {
      // If user is logged in and tries to access login, redirect to home
      if (user && request.nextUrl.pathname === '/login') {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/'
        redirectUrl.search = '' // Clean any error params
        return NextResponse.redirect(redirectUrl)
      }
      // For auth callback, always allow and let it handle the redirect
      // Don't check auth here as cookies might not be set yet
      if (request.nextUrl.pathname.startsWith('/auth/callback')) {
        return supabaseResponse
      }
      // Otherwise, allow access to login/auth pages
      return supabaseResponse
    }

    // Protect all other routes - require authentication
    if (!user) {
      // Only redirect if we're not coming from the auth callback
      // Check if there's a code parameter (might be a redirect from callback)
      const code = request.nextUrl.searchParams.get('code')
      if (!code) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/login'
        redirectUrl.search = '' // Clean any error params from protected routes
        return NextResponse.redirect(redirectUrl)
      }
    }
  } catch (error) {
    // If auth check fails, allow request to proceed (useful for build time)
    console.warn('[Middleware] Auth check failed:', error)
    // Don't redirect on error to avoid loops - let the page handle it
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

