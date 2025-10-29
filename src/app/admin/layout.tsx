import { ReactNode } from 'react'

// This layout is no longer used - admin routes now use DashboardLayout
export default function AdminLayout({ children }: { children: ReactNode }) {
  console.log('🔧 AdminLayout: This should not render - admin routes use DashboardLayout')

  return (
    <div className="min-h-screen bg-background">
      {/* Admin layout wrapper - DEPRECATED */}
      {children}
    </div>
  )
}

