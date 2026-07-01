'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BadgeCheck,
  Bell,
  LogOut,
  ShieldAlert,
  UserCircle,
} from 'lucide-react'
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
import ThemeToggle from '@/components/layout/theme-toggle'
import PwaStatus from '@/components/pwa/pwa-status'

function getInitials(name?: string | null) {
  if (!name) return 'RN'
  const parts = name.trim().split(' ')
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''
  return `${first}${last}`.toUpperCase() || 'RN'
}

export default function Navbar() {
  const router = useRouter()
  const { user, logout } = useAuth()

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

        <div className="flex items-center gap-3 ml-auto">
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
        </div>
      </div>
    </header>
  )
}
