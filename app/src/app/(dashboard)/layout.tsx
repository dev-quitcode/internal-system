'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  useEffect(() => {
    const stored = window.localStorage.getItem('qc_sidebar_collapsed')
    if (stored === 'true') setIsSidebarCollapsed(true)
  }, [])

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev
      window.localStorage.setItem('qc_sidebar_collapsed', String(next))
      return next
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={toggleSidebar} />
      <div className={isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-60'}>
        <Topbar />
        <main className="p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
