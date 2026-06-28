'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AlertTriangle, BookOpen, LayoutDashboard, Map, ShieldAlert, Users, Hospital, Stethoscope } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const navItems = [
  { href: '/dashboard', label: 'Command Center', icon: LayoutDashboard },
  { href: '/monitoring', label: 'Live Map', icon: Map },
  { href: '/report', label: 'Report Incident', icon: AlertTriangle },
  { href: '/first-aid', label: 'First Aid DB', icon: BookOpen },
]

const adminItems = [
  { href: '/admin/users', label: 'Citizen Directory', icon: Users },
  { href: '/admin/hospitals', label: 'Hospitals', icon: Hospital },
  { href: '/admin/volunteers', label: 'Volunteers', icon: Stethoscope },
]

export default function Sidebar({ onNavigate, isAdmin = true }: { onNavigate?: () => void, isAdmin?: boolean }) {
  const pathname = usePathname()

  return (
    <aside className="flex h-full flex-col gap-6 bg-transparent px-4 py-6 text-sidebar-foreground">
      <div className="flex items-center gap-3 px-2 mb-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-lg shadow-primary/20">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-primary font-bold">ResQNet</p>
          <p className="text-xl font-bold tracking-tight">Enterprise</p>
        </div>
      </div>

      <nav className="space-y-1.5 flex-1">
        <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 mt-4">
          Operations
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <Icon className={cn("h-5 w-5 relative z-10 transition-transform group-hover:scale-110", isActive ? "text-primary" : "")} />
              <span className="relative z-10">{item.label}</span>
            </Link>
          )
        })}

        {isAdmin && (
          <>
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 mt-8">
              Administration
            </p>
            {adminItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all',
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon className={cn("h-5 w-5 relative z-10 transition-transform group-hover:scale-110", isActive ? "text-primary" : "")} />
                  <span className="relative z-10">{item.label}</span>
                </Link>
              )
            })}
          </>
        )}
      </nav>

      <div className="mt-auto relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 px-4 py-4">
        <div className="absolute top-0 right-0 w-16 h-16 bg-primary/20 blur-2xl rounded-full -mr-8 -mt-8" />
        <p className="text-xs font-medium text-foreground relative z-10">
          <span className="inline-block w-2 h-2 rounded-full bg-success mr-2 animate-pulse" />
          System Online
        </p>
        <p className="text-[10px] text-muted-foreground mt-1 relative z-10">All services operational</p>
      </div>
    </aside>
  )
}
