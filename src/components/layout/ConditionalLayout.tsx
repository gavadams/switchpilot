'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import MainLayout from './MainLayout'
import DashboardLayout from './DashboardLayout'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

// Routes that should use the dashboard layout (with sidebar)
const dashboardRoutes = ['/dashboard', '/deals', '/switches', '/billing', '/settings']

// Routes that should use the main layout (with header)
const mainLayoutRoutes = ['/login', '/register', '/']

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  const { user, loading } = useAuth()

  // Check if current route should use dashboard layout
  const shouldUseDashboardLayout = dashboardRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Check if current route should use main layout
  const shouldUseMainLayout = mainLayoutRoutes.some(route => 
    pathname === route
  )

  // Show loading state for protected routes while auth is loading
  if (shouldUseDashboardLayout && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Use dashboard layout for protected routes (only if user is authenticated)
  if (shouldUseDashboardLayout && user) {
    // Determine title and breadcrumbs based on current route
    let title = 'Dashboard'
    let breadcrumbs: Array<{ label: string; href?: string }> = []

    if (pathname.startsWith('/deals')) {
      title = 'Active Deals'
      breadcrumbs = [{ label: 'Deals' }]
    } else if (pathname.startsWith('/switches')) {
      title = 'My Switches'
      breadcrumbs = [{ label: 'Switches' }]
    } else if (pathname.startsWith('/billing')) {
      title = 'Billing'
      breadcrumbs = [{ label: 'Billing' }]
    } else if (pathname.startsWith('/settings')) {
      title = 'Settings'
      breadcrumbs = [{ label: 'Settings' }]
    }

    return (
      <DashboardLayout title={title} breadcrumbs={breadcrumbs}>
        {children}
      </DashboardLayout>
    )
  }

  // Use main layout for auth and landing pages
  if (shouldUseMainLayout) {
    return (
      <MainLayout>
        {children}
      </MainLayout>
    )
  }

  // Default to main layout for any other routes
  return (
    <MainLayout>
      {children}
    </MainLayout>
  )
}
