'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, AlertTriangle, MapPin, Bell, User, Map, Ambulance } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

export default function BottomTabs() {
  const pathname = usePathname()
  const { user } = useAuth()

  if (!user || (user.role !== 'citizen' && user.role !== 'volunteer')) {
    return null;
  }

  const citizenTabs = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/report', label: 'Report', icon: AlertTriangle },
    { href: '/citizen/reports', label: 'My Reports', icon: MapPin },
    { href: '/notifications', label: 'Alerts', icon: Bell },
    { href: '/profile', label: 'Profile', icon: User },
  ]

  const volunteerTabs = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/volunteer/missions', label: 'Missions', icon: Ambulance },
    { href: '/monitoring', label: 'Live Map', icon: Map },
    { href: '/notifications', label: 'Alerts', icon: Bell },
    { href: '/profile', label: 'Profile', icon: User },
  ]

  const tabs = user.role === 'volunteer' ? volunteerTabs : citizenTabs;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border/50 bg-background/80 px-2 py-3 backdrop-blur-md pb-safe lg:hidden">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
        const Icon = tab.icon

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 min-w-[64px]',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div className={cn(
              "flex h-8 w-16 items-center justify-center rounded-full transition-all duration-300",
              isActive ? "bg-primary/20" : "bg-transparent"
            )}>
              <Icon className={cn("h-5 w-5", isActive ? "text-primary" : "")} />
            </div>
            <span className="text-[10px] font-medium">{tab.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
