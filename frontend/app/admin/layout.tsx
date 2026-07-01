import RoleGuard from '@/components/auth/role-guard'
import { ReactNode } from 'react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowedRoles={['department_admin', 'super_admin']}>
      {children}
    </RoleGuard>
  )
}
