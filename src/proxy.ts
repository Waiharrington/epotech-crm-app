import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { Database } from '@/types/supabase'

export async function middleware(request: NextRequest) {
  const { nextUrl } = request
  const response = await updateSession(request)
  
  // We need to create a server client to check the session here too
  // or use the user data from updateSession if it returns it.
  // Actually, updateSession calls getUser(), so we can use a simpler approach.
  
  // For simplicity in this step, let's create a server client to check session
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // Handled by updateSession
        },
        remove(name: string, options: CookieOptions) {
          // Handled by updateSession
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && nextUrl.pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
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
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
