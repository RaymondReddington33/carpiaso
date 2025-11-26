import { createBrowserClient } from '@supabase/ssr'

// Create a mock client for SSR/build time
const createMockClient = () => {
  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      signInWithOtp: () => Promise.resolve({ data: null, error: null }),
      onAuthStateChange: () => ({ data: { subscription: null }, error: null }),
    },
  } as any
}

export function createClient() {
  // During SSR/build, return a mock client
  if (typeof window === 'undefined') {
    return createMockClient()
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // During build, if env vars are missing, return mock instead of throwing
  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
      // Only throw in production runtime (not during build)
      throw new Error(
        'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
      )
    }
    // During build, return mock
    return createMockClient()
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

