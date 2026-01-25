import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.error('Missing Supabase environment variables:', { 
      hasUrl: !!url, 
      hasKey: !!key 
    })
    throw new Error('Missing Supabase configuration. Make sure .env.local is set up correctly.')
  }
  
  const client = createBrowserClient<Database>(url, key)
  
  // Log current session for debugging
  client.auth.getSession().then(({ data: { session }, error }) => {
    if (error) {
      console.error('Error getting session:', error)
    } else {
      console.log('Current session:', session ? `User: ${session.user.email}` : 'No session')
    }
  })
  
  return client
}
