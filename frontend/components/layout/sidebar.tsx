'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  AlertTriangle,
  MessageSquare,
  Map,
  Users,
  BarChart,
  Bell,
  User,
  Building,
  Settings,
  Bot,
  ShieldAlert,
  MapPin,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { user } = useAuth()

  if (!user) {
    return null;
  }

  const citizenLinks = [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/report', label: 'Report Emergency', icon: AlertTriangle },
    { href: '/citizen/reports', label: 'My Reports', icon: MapPin },
    { href: '/notifications', label: 'Alerts', icon: Bell },
    { href: '/profile', label: 'Profile', icon: User },
  ]

  const volunteerLinks = [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/volunteer/missions', label: 'Missions', icon: Building },
    { href: '/monitoring', label: 'Live Map', icon: Map },
    { href: '/notifications', label: 'Alerts', icon: Bell },
    { href: '/profile', label: 'Profile', icon: User },
  ]

  const departmentAdminLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/incidents', label: 'Emergency Incidents', icon: AlertTriangle },
    { href: '/admin/civic', label: 'Civic Complaints', icon: MessageSquare },
    { href: '/monitoring', label: 'Live Map', icon: Map },
    { href: '/admin/volunteers', label: 'Volunteers', icon: Users },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart },
    { href: '/notifications', label: 'Notifications', icon: Bell },
    { href: '/profile', label: 'Profile', icon: User },
  ]

  const superAdminLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/departments', label: 'Departments', icon: Building },
    { href: '/admin/incidents', label: 'Emergency Incidents', icon: AlertTriangle },
    { href: '/admin/civic', label: 'Civic Complaints', icon: MessageSquare },
    { href: '/admin/analytics', label: 'Analytics', icon: BarChart },
    { href: '/admin/settings', label: 'System Settings', icon: Settings },
    { href: '/admin/ai-settings', label: 'AI Settings', icon: Bot },
    { href: '/notifications', label: 'Notifications', icon: Bell },
    { href: '/profile', label: 'Profile', icon: User },
  ]

  let navItems = citizenLinks;
  if (user.role === 'super_admin') navItems = superAdminLinks;
  else if (user.role === 'department_admin') navItems = departmentAdminLinks;
  else if (user.role === 'volunteer') navItems = volunteerLinks;

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

      <nav className="space-y-1.5 flex-1 overflow-y-auto pr-2 pb-16 custom-scrollbar">
        <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 mt-4">
          Navigation
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
