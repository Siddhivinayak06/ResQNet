'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AlertTriangle, BookOpen, LayoutDashboard, Map, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/monitoring', label: 'Live Map', icon: Map },
  { href: '/report', label: 'Report', icon: AlertTriangle },
  { href: '/first-aid', label: 'First Aid', icon: BookOpen },
]

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <aside className="flex h-full flex-col gap-6 bg-sidebar px-4 py-6 text-sidebar-foreground">
      <div className="flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-sm">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">ResQNet</p>
          <p className="text-lg font-semibold">Control Center</p>
        </div>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto rounded-xl border border-sidebar-border bg-card px-3 py-3 text-xs text-muted-foreground">
        Stay connected for live incident updates and offline reporting.
      </div>
    </aside>
  )
}
