'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, PlusCircle, FileText, Leaf,
  Settings, HelpCircle, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard',  icon: LayoutDashboard },
  { label: 'New Audit', href: '/audit/new',  icon: PlusCircle      },
  { label: 'Reports',   href: '/dashboard',  icon: FileText        },
]

const BOTTOM_ITEMS = [
  { label: 'Settings', href: '#', icon: Settings   },
  { label: 'Help',     href: '#', icon: HelpCircle },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const [userName, setUserName]   = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [initials, setInitials]   = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      const name: string  = user.user_metadata?.full_name ?? user.email ?? 'User'
      const email: string = user.email ?? ''
      setUserName(name)
      setUserEmail(email)
      const parts = name.trim().split(' ').filter(Boolean)
      if (parts.length >= 2) {
        setInitials((parts[0][0] + parts[parts.length - 1][0]).toUpperCase())
      } else if (parts.length === 1) {
        setInitials(parts[0].slice(0, 2).toUpperCase())
      } else {
        setInitials('?')
      }
    })
  }, [])

  return (
    <aside className={cn(
      'hidden lg:flex flex-col w-60 shrink-0 h-screen sticky top-0',
      'bg-[#0f172a] border-r border-white/5',
      className,
    )}>

      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/5 shrink-0">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-900/40 shrink-0">
          <Leaf className="h-4 w-4 text-white" />
        </span>
        <div>
          <span className="text-sm font-black tracking-tight text-white">ThermaMorph</span>
          <span className="block text-[9px] text-slate-500 font-semibold tracking-widest uppercase mt-px">
            Carbon Platform
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="px-3 pt-1 pb-2 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-600">
          Navigation
        </p>

        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all mb-0.5',
                active
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              )}
            >
              {/* Active indicator bar */}
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-400 rounded-r-full" />
              )}

              <Icon className={cn(
                'h-4 w-4 shrink-0 transition-colors',
                active ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'
              )} />

              <span className="flex-1">{label}</span>

              {active && (
                <ChevronRight className="h-3.5 w-3.5 text-emerald-500/60" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom links */}
      <div className="border-t border-white/5 px-3 py-3">
        {BOTTOM_ITEMS.map(({ label, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-all mb-0.5"
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {label}
          </Link>
        ))}
      </div>

      {/* User card */}
      <div className="border-t border-white/5 px-4 py-3.5 flex items-center gap-3">
        <span className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-xs font-black text-white shrink-0 select-none shadow-md">
          {initials || '··'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-200 truncate">
            {userName || 'Loading…'}
          </p>
          <p className="text-[10px] text-slate-500 truncate mt-px">
            {userEmail || ''}
          </p>
        </div>
      </div>
    </aside>
  )
}
