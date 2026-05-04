import { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default function StatCard({
  title,
  value,
  icon,
  trend,
  className,
}: {
  title: string
  value: string | number
  icon?: ReactNode
  trend?: string
  className?: string
}) {
  return (
    <Card className={cn('rounded-xl border border-border/60 shadow-sm', className)}>
      <CardContent className="flex items-center justify-between gap-4 px-6 py-5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
          {trend ? <p className="mt-1 text-xs text-muted-foreground">{trend}</p> : null}
        </div>
        {icon ? (
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-foreground">
            {icon}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
