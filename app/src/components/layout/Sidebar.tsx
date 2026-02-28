'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutGrid,
  Clock,
  Calendar,
  User,
  Users,
  Building2,
  FileText,
  Lightbulb,
  GraduationCap,
  BookOpen,
  DollarSign,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  children?: { name: string; href: string }[]
}

type SidebarProps = {
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

const navigation: NavItem[] = [
  { name: 'Home', href: '/projects', icon: LayoutGrid },
  { name: 'Time Tracking', href: '/time-tracking', icon: Clock },
  { name: 'Leaves', href: '/leaves', icon: Calendar },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Team', href: '/team', icon: Users },
  { name: 'Clients', href: '/clients', icon: Building2 },
  { name: 'Academy', href: '/academy', icon: GraduationCap },
  { name: 'Academy Settings', href: '/academy-settings', icon: BookOpen },
  {
    name: 'Policies',
    href: '/policies',
    icon: FileText,
    children: [
      { name: 'Company Policies', href: '/policies/company' },
      { name: 'Leave Policies', href: '/policies/leave' },
    ],
  },
  { name: 'Improvement request', href: '/improvement-request', icon: Lightbulb },
  { name: 'Financial request', href: '/financial-request', icon: DollarSign },
]

export default function Sidebar({ isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleExpanded = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    )
  }

  const isActive = (href: string) => {
    if (href === '/projects') return pathname === '/projects' || pathname === '/'
    if (href === '/academy') return pathname === '/academy'
    if (href === '/academy-settings') return pathname.startsWith('/academy-settings')
    return pathname.startsWith(href)
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-4 py-4`}>
        <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-200">
          <Image
            src="/quitcode-logo.svg"
            alt="QuitCode logo"
            width={22}
            height={22}
            priority
          />
        </div>
        {!isCollapsed && <span className="text-lg font-bold text-gray-900">QuitCode</span>}
        {!isCollapsed && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="ml-auto p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className={`flex-1 ${isCollapsed ? 'px-1' : 'px-2'} py-2 overflow-y-auto`}>
        <ul className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            const expanded = expandedItems.includes(item.name)

            return (
              <li key={item.name}>
                {item.children && !isCollapsed ? (
                  <div>
                    <button
                      onClick={() => toggleExpanded(item.name)}
                      className={`
                        w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg
                        text-[13px] font-medium transition-all duration-200
                        ${active
                          ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </div>
                      {expanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                    {expanded && (
                      <ul className="mt-1 ml-3 pl-3 border-l-2 border-gray-200 space-y-1">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={`
                                block px-3 py-2 rounded-lg text-[12px] transition-all duration-200
                                ${pathname === child.href
                                  ? 'text-cyan-700 bg-cyan-50 font-medium'
                                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }
                              `}
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              {child.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`
                      flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg
                      text-[13px] font-medium transition-all duration-200
                      ${active
                        ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                    onClick={() => setIsMobileMenuOpen(false)}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon className="w-4 h-4" />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Sign Out */}
      <div className="p-2 border-t border-gray-200">
        <button
          onClick={handleSignOut}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg text-[13px] font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200`}
          title={isCollapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200"
      >
        <Menu className="w-4 h-4 text-gray-600" />
      </button>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-gray-900/60 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`
          lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl
          transform transition-transform duration-300 ease-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
        <div className="flex flex-col h-full">
          <NavContent />
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:border-gray-200 lg:bg-white ${
          isCollapsed ? 'lg:w-20' : 'lg:w-60'
        }`}
      >
        {isCollapsed && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="mx-auto mt-4 p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            title="Expand sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
        <NavContent />
      </aside>
    </>
  )
}
