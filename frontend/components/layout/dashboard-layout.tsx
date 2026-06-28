'use client'

import { ReactNode, useState } from 'react'
import { PanelLeft } from 'lucide-react'
import Sidebar from '@/components/layout/sidebar'
import Navbar from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

export default function DashboardLayout({
  children,
  title,
  description,
  actions,
}: {
  children: ReactNode
  title: string
  description?: string
  actions?: ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20">
      {/* Background decorations for premium feel */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
      
      <Navbar />
      <div className="container mx-auto flex gap-8 px-4 py-8 relative z-10">
        <div className="hidden lg:flex w-[260px] shrink-0">
          <div className="sticky top-24 h-[calc(100vh-120px)] w-full glass-card overflow-hidden">
            <Sidebar />
          </div>
        </div>

        <div className="flex-1 space-y-8 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden glass border-border/50"
                onClick={() => setOpen(true)}
                aria-label="Open sidebar"
              >
                <PanelLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
                {description && <p className="text-sm font-medium text-muted-foreground mt-1">{description}</p>}
              </div>
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[300px] glass-card p-0 border-r-border/50">
          <SheetHeader className="border-b border-border/50 px-6 py-4 bg-background/50">
            <SheetTitle className="text-left text-lg font-bold">Navigation</SheetTitle>
          </SheetHeader>
          <Sidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
