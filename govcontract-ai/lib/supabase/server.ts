import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

export const createServerClient = async () => {
  const cookieStore = await cookies()

  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // Ignore errors in server components
          }
        },
      },
    }
  )
}

// Alternative approach for API routes
export const createServerClientForRequest = (request: Request) => {
  const requestUrl = new URL(request.url)
  const cookieHeader = request.headers.get('cookie') || ''
  
  // Parse cookies manually
  const cookies = cookieHeader
    .split(';')
    .map(cookie => cookie.trim())
    .filter(cookie => cookie.length > 0)
    .map(cookie => {
      const [name, value] = cookie.split('=')
      return { name: name?.trim(), value: value?.trim() }
    })
    .filter(cookie => cookie.name && cookie.value)

  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookies
        },
        setAll() {
          // Can't set cookies in API routes this way
        },
      },
    }
  )
}
