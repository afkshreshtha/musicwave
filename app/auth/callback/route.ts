import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  console.log('🔍 Callback received:', { code: !!code, error, error_description })

  // Handle OAuth errors
  if (error) {
    console.error('❌ OAuth error:', error, error_description)
    return NextResponse.redirect(`${requestUrl.origin}/auth?error=${encodeURIComponent(error_description || error)}`)
  }

  if (code) {
    try {
      const cookieStore = cookies()
     
      
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (exchangeError) {
        console.error('❌ Code exchange error:', exchangeError)
        return NextResponse.redirect(`${requestUrl.origin}/auth?error=${encodeURIComponent('Authentication failed. Please try again.')}`)
      }

      console.log('✅ Auth successful for user:', data.user?.email)
      
      // Redirect to dashboard or intended page
      return NextResponse.redirect(`${requestUrl.origin}/`)
    } catch (error) {
      console.error('❌ Unexpected error during auth:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth?error=${encodeURIComponent('Authentication failed. Please try again.')}`)
    }
  }

  // No code parameter
  return NextResponse.redirect(`${requestUrl.origin}/auth?error=${encodeURIComponent('Invalid authentication response.')}`)
}
