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
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto flex gap-6 px-4 py-8">
        <div className="hidden lg:flex w-64 shrink-0">
          <div className="sticky top-24 h-[calc(100vh-120px)] w-full rounded-2xl border border-border bg-card">
            <Sidebar />
          </div>
        </div>

        <div className="flex-1 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden"
                onClick={() => setOpen(true)}
                aria-label="Open sidebar"
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
              </div>
            </div>
            {actions}
          </div>

          {children}
        </div>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-80 bg-background p-0">
          <SheetHeader className="border-b border-border px-6 py-4">
            <SheetTitle className="text-left text-lg font-semibold">Navigation</SheetTitle>
          </SheetHeader>
          <Sidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
