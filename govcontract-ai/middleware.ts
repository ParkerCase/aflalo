import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // This will refresh the session if expired - required for Server Components
  const { data: { user }, error } = await supabase.auth.getUser()

  console.log('Middleware - User:', user?.id, user?.email)
  console.log('Middleware - Error:', error?.message)
  console.log('Middleware - Path:', request.nextUrl.pathname)

  // If user is signed in and trying to access auth pages, redirect to dashboard
  if (user && !error) {
    if (request.nextUrl.pathname === '/login' || 
        request.nextUrl.pathname === '/signup' ||
        request.nextUrl.pathname === '/') {
      console.log('Middleware - Redirecting authenticated user to dashboard')
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // If user is not signed in and trying to access protected pages, redirect to login
  if ((!user || error) && request.nextUrl.pathname.startsWith('/dashboard')) {
    console.log('Middleware - Redirecting unauthenticated user to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
