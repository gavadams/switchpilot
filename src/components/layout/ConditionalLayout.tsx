'use client'

import { usePathname } from 'next/navigation'
import MainLayout from './MainLayout'
import DashboardLayout from './DashboardLayout'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

// Routes that should use the dashboard layout (with sidebar)
const dashboardRoutes = ['/dashboard', '/deals', '/switches', '/billing', '/settings', '/admin', '/affiliate-products', '/affiliate']

// Routes that should use the main layout (with header)
const mainLayoutRoutes = ['/login', '/register', '/']

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()

  // Check if current route should use dashboard layout
  const shouldUseDashboardLayout = dashboardRoutes.some(route =>
    pathname.startsWith(route)
  )

  // Check if current route should use main layout
  const shouldUseMainLayout = mainLayoutRoutes.some(route =>
    pathname === route
  )

  // Use dashboard layout for protected routes
  if (shouldUseDashboardLayout) {
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
    } else if (pathname.startsWith('/admin/affiliates')) {
      if (pathname === '/admin/affiliates') {
        title = 'Affiliate Management'
        breadcrumbs = [{ label: 'Admin', href: '/admin/affiliates' }, { label: 'Affiliates' }]
      } else if (pathname.startsWith('/admin/affiliates/performance')) {
        title = 'Affiliate Performance'
        breadcrumbs = [
          { label: 'Admin', href: '/admin/affiliates' },
          { label: 'Affiliates', href: '/admin/affiliates' },
          { label: 'Performance' }
        ]
      }
    } else if (pathname === '/affiliate-products') {
      title = 'Affiliate Products'
      breadcrumbs = [{ label: 'Products' }]
    } else if (pathname === '/affiliate') {
      title = 'Affiliate Tracking'
      breadcrumbs = [{ label: 'Affiliate' }]
    } else if (pathname.startsWith('/switches/')) {
      if (pathname === '/switches') {
        title = 'My Switches'
        breadcrumbs = [{ label: 'Switches' }]
      } else {
        // Dynamic switch detail page
        title = 'Switch Details'
        breadcrumbs = [
          { label: 'Switches', href: '/switches' },
          { label: 'Details' }
        ]
      }
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
