'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, ChevronDown, Settings, User, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { useEmployee } from '@/lib/hooks/useEmployee'

export default function Topbar() {
  const router = useRouter()
  const { employee } = useEmployee()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<
    { id: number; title: string; body: string | null; link: string | null; created_at: string; is_read: boolean }[]
  >([])
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const supabase = createClient()
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const clickedOutsideUser = dropdownRef.current ? !dropdownRef.current.contains(target) : true
      const clickedOutsideNotifications = notificationsRef.current
        ? !notificationsRef.current.contains(target)
        : true
      if (clickedOutsideUser && clickedOutsideNotifications) {
        setIsDropdownOpen(false)
        setIsNotificationsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const loadNotifications = async () => {
      if (!employee) return
      const supabase = createClient()
      const { data } = await supabase
        .from('notifications')
        .select('id, title, body, link, created_at, is_read')
        .eq('recipient_employee_id', employee.id)
        .order('created_at', { ascending: false })
        .limit(10)

      const rows = (data || []) as {
        id: number
        title: string
        body: string | null
        link: string | null
        created_at: string
        is_read: boolean
      }[]
      setNotifications(rows)
      setUnreadCount(rows.filter((row) => !row.is_read).length)
    }

    loadNotifications()
  }, [employee])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const getUserName = () => {
    if (!user) return 'Loading...'
    return user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  }

  const getAvatarUrl = () => {
    return user?.user_metadata?.avatar_url || null
  }

  const getInitials = () => {
    const name = getUserName()
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200">
      <div className="flex items-center justify-end h-full px-6">
        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div ref={notificationsRef} className="relative">
            <button
              onClick={() => setIsNotificationsOpen((prev) => !prev)}
              className="relative p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">Notifications</p>
                  <p className="text-xs text-gray-500">
                    {unreadCount ? `${unreadCount} unread` : 'All caught up'}
                  </p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-gray-500">No notifications yet.</div>
                  ) : (
                    notifications.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (item.link) router.push(item.link)
                        }}
                        className="block w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-b-0"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                          {!item.is_read && <span className="w-2 h-2 rounded-full bg-red-500" />}
                        </div>
                        {item.body && <p className="text-xs text-gray-500 mt-1">{item.body}</p>}
                        <p className="text-[11px] text-gray-400 mt-1">
                          {new Date(item.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: '2-digit',
                            year: 'numeric',
                          })}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200" />

          {/* User menu */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 p-1.5 pr-3 hover:bg-gray-100 rounded-xl transition-colors"
            >
              {getAvatarUrl() ? (
                <img
                  src={getAvatarUrl()!}
                  alt={getUserName()}
                  className="w-9 h-9 rounded-xl object-cover"
                />
              ) : (
                <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-sm font-semibold shadow-lg shadow-cyan-500/25">
                  {getInitials()}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-gray-900">{getUserName()}</p>
                <p className="text-xs text-gray-500">Employee</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-900">{getUserName()}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
                </div>
                
                <div className="py-1">
                  <a
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    View Profile
                  </a>
                  <a
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-gray-400" />
                    Settings
                  </a>
                </div>

                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
