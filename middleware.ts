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
    // Always allow access to login and auth callback pages first
    if (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/auth')) {
      // For auth callback, always allow and let it handle the redirect
      if (request.nextUrl.pathname.startsWith('/auth/callback')) {
        return supabaseResponse
      }
      
      // Check if user is logged in and trying to access login
      const {
        data: { user },
      } = await supabase.auth.getUser()
      
      if (user && request.nextUrl.pathname === '/login') {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/'
        redirectUrl.search = '' // Clean any error params
        return NextResponse.redirect(redirectUrl)
      }
      
      // Otherwise, allow access to login/auth pages
      return supabaseResponse
    }

    // For protected routes, use getUser() which automatically refreshes the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    // If there's an auth error or no user, redirect to login
    if (authError || !user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.search = '' // Clean any error params from protected routes
      return NextResponse.redirect(redirectUrl)
    }

    // User is authenticated, allow access
    return supabaseResponse
  } catch (error) {
    // If auth check fails, log but don't redirect to avoid loops
    console.warn('[Middleware] Auth check failed:', error)
    // Allow request to proceed - let the page handle authentication
    return supabaseResponse
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

