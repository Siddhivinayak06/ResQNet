'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BadgeCheck,
  Bell,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  ShieldAlert,
  TriangleAlert,
  UserCircle,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import ThemeToggle from '@/components/layout/theme-toggle'
import PwaStatus from '@/components/pwa/pwa-status'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Home', icon: ShieldAlert },
  { href: '/report', label: 'Report', icon: TriangleAlert },
  { href: '/monitoring', label: 'Live Map', icon: Map },
  { href: '/first-aid', label: 'First Aid', icon: BookOpen },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
]

function getInitials(name?: string | null) {
  if (!name) return 'RN'
  const parts = name.trim().split(' ')
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''
  return `${first}${last}`.toUpperCase() || 'RN'
}

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-sm">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <div className="hidden sm:block">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">ResQNet</p>
              <p className="text-lg font-semibold text-foreground">Command Console</p>
            </div>
          </Link>
          <span className="hidden lg:inline-flex">
            <PwaStatus compact />
          </span>
        </div>

        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition',
                  isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex">
            <ThemeToggle />
          </div>
          <Button variant="ghost" size="icon" className="hidden md:inline-flex">
            <Bell className="h-4 w-4" />
          </Button>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-secondary text-xs font-semibold">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block text-sm font-medium">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <UserCircle className="h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <BadgeCheck className="h-4 w-4" />
                  Preferences
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="outline" onClick={() => router.push('/login')}>
                Sign in
              </Button>
              <Button className="bg-brand-gradient text-white" onClick={() => router.push('/register')}>
                Create account
              </Button>
            </div>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 bg-background p-0">
              <SheetHeader className="border-b border-border px-6 py-4">
                <SheetTitle className="text-left text-lg font-semibold">Navigation</SheetTitle>
              </SheetHeader>
              <div className="px-4 py-4 space-y-3">
                {navLinks.map((link) => {
                  const Icon = link.icon
                  const isActive = pathname === link.href
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                        isActive ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  )
                })}
                <div className="pt-4">
                  <ThemeToggle />
                </div>
                <div className="pt-2">
                  <PwaStatus compact />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
