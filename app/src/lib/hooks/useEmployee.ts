'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/types/database'
import type { User } from '@supabase/supabase-js'

type Employee = Tables<'employees'>

export function useEmployee() {
  const [user, setUser] = useState<User | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const loadUserAndEmployee = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // First check session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log('Session check:', { 
          hasSession: !!session, 
          userEmail: session?.user?.email,
          accessToken: session?.access_token ? 'present' : 'missing',
          sessionError: sessionError?.message 
        })

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) throw userError
        if (!user) {
          setIsLoading(false)
          return
        }

        setUser(user)

        if (!user.email) {
          setError('No email found in user account.')
          setIsLoading(false)
          return
        }

        // Get employee by email
        console.log('Looking for employee with email:', user.email)
        
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('*')
          .eq('email', user.email)
          .single()

        console.log('Employee query result:', {
          found: !!employeeData,
          error: employeeError,
          email: user.email,
        })

        if (employeeError) {
          if (employeeError.code === 'PGRST116') {
            // No employee found for this email
            setError(`No employee record found for ${user.email}. Please contact administrator.`)
          } else {
            console.error('Employee query error FULL:', employeeError)
            console.error('Employee query error message:', employeeError.message)
            console.error('Employee query error details:', employeeError.details)
            console.error('Employee query error code:', employeeError.code)
            throw employeeError
          }
        } else {
          console.log('Employee loaded:', employeeData)
          setEmployee(employeeData)
        }
      } catch (err) {
        console.error('Error loading user/employee:', err)
        setError(err instanceof Error ? err.message : 'Failed to load user data')
      } finally {
        setIsLoading(false)
      }
    }

    loadUserAndEmployee()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        loadUserAndEmployee()
      } else {
        setUser(null)
        setEmployee(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, employee, isLoading, error }
}
