import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  console.log('===== CALLBACK START =====')
  console.log('Code present:', !!code)

  if (!code) {
    return NextResponse.redirect(`${origin}/login`)
  }

  // Create redirect response
  const response = NextResponse.redirect(`${origin}/projects`)
  
  // Track if cookies were set
  let cookiesSet = false

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          console.log('[CALLBACK] setAll called with', cookiesToSet.length, 'cookies')
          cookiesToSet.forEach(({ name, value, options }) => {
            console.log('[CALLBACK] Setting cookie:', name)
            response.cookies.set(name, value, options)
          })
          cookiesSet = true
        },
      },
    }
  )

  // Exchange code for session - this should trigger setAll
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  console.log('Exchange result:', {
    success: !!data.session,
    userEmail: data.user?.email,
    error: error?.message,
  })

  if (error || !data.session) {
    console.error('Auth error:', error)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error?.message || 'no_session')}`)
  }

  // Wait a tick to ensure setAll has been called
  await new Promise(resolve => setTimeout(resolve, 0))

  console.log('Cookies set:', cookiesSet)
  console.log('Response cookies BEFORE manual:', response.cookies.getAll().map(c => c.name))
  
  // FALLBACK: If setAll didn't work, set cookies manually
  if (!cookiesSet || response.cookies.getAll().length === 0) {
    console.log('[CALLBACK] FALLBACK - Setting cookies manually from session data')
    
    const cookieName = `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL!.split('//')[1].split('.')[0]}-auth-token`
    const sessionData = {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      expires_in: data.session.expires_in,
      token_type: data.session.token_type,
      user: data.user,
    }
    
    response.cookies.set(cookieName, JSON.stringify(sessionData), {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    
    console.log('[CALLBACK] Set manual cookie:', cookieName)
  }
  
  console.log('Response cookies AFTER:', response.cookies.getAll().map(c => c.name))
  
  return response
}
