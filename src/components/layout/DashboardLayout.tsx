'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Home,
  CreditCard,
  ArrowRightLeft,
  Receipt,
  Settings,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Package,
  Shield,
  BarChart3,
  Users,
  DollarSign,
  Activity,
  Headphones,
  FileText,
  Database,
  TrendingUp,
  ChevronDown
} from 'lucide-react'
import LogoutButton from '../features/auth/LogoutButton'

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
}

const sidebarNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Active Deals', href: '/deals', icon: CreditCard },
  { name: 'My Switches', href: '/switches', icon: ArrowRightLeft },
  { name: 'Products', href: '/affiliate-products', icon: Package },
  { name: 'Affiliate Tracking', href: '/affiliate', icon: BarChart3 },
  { name: 'Billing', href: '/billing', icon: Receipt },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function DashboardLayout({
  children,
  title = 'Dashboard',
  breadcrumbs = []
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [adminScrapingOpen, setAdminScrapingOpen] = useState(false)
  const [adminAffiliatesOpen, setAdminAffiliatesOpen] = useState(false)
  const pathname = usePathname()
  const { user, profile } = useAuth()

  // Check if user is admin (check both is_admin flag and admin_users table)
  const isAdmin = profile?.is_admin === true || profile?.role === 'admin'

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  // Auto-expand admin sub-menus if on those pages
  useEffect(() => {
    if (pathname.startsWith('/admin/scraping')) {
      setAdminScrapingOpen(true)
    }
    if (pathname.startsWith('/admin/affiliates')) {
      setAdminAffiliatesOpen(true)
    }
  }, [pathname])

  const getInitials = (name?: string | null) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`} style={{ backgroundColor: 'white', opacity: 1 }}>
        <div className="flex h-full flex-col">
          {/* Sidebar header */}
          <div className="flex h-16 items-center justify-between px-6 border-b">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">SP</span>
              </div>
              <span className="font-bold text-lg">SwitchPilot</span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {sidebarNavigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActiveRoute(item.href)
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
            
            {/* Admin Section */}
            {isAdmin && (
              <>
                <Separator className="my-4" />
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                  Admin
                </div>
                
                {/* Admin Dashboard */}
                <Link
                  href="/admin"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === '/admin'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>

                {/* Users */}
                <Link
                  href="/admin/users"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith('/admin/users')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Users className="h-4 w-4" />
                  <span>Users</span>
                </Link>

                {/* Revenue */}
                <Link
                  href="/admin/revenue"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith('/admin/revenue')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <DollarSign className="h-4 w-4" />
                  <span>Revenue</span>
                </Link>

                {/* Switches Monitor */}
                <Link
                  href="/admin/switches"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith('/admin/switches')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <ArrowRightLeft className="h-4 w-4" />
                  <span>Switches Monitor</span>
                </Link>

                {/* Deals Management */}
                <Link
                  href="/admin/deals"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith('/admin/deals')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Deals Management</span>
                </Link>

                {/* Scraping - Collapsible */}
                <div>
                  <button
                    onClick={() => setAdminScrapingOpen(!adminScrapingOpen)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith('/admin/scraping')
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Database className="h-4 w-4" />
                      <span>Scraping</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${adminScrapingOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {adminScrapingOpen && (
                    <div className="ml-4 mt-1 space-y-1">
                      <Link
                        href="/admin/scraping"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          pathname === '/admin/scraping'
                            ? 'bg-primary/20 text-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span>Dashboard</span>
                      </Link>
                      <Link
                        href="/admin/scraping/sources"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          pathname === '/admin/scraping/sources'
                            ? 'bg-primary/20 text-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span>Sources</span>
                      </Link>
                      <Link
                        href="/admin/scraping/logs"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          pathname === '/admin/scraping/logs'
                            ? 'bg-primary/20 text-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span>Logs</span>
                      </Link>
                      <Link
                        href="/admin/scraping/conflicts"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          pathname === '/admin/scraping/conflicts'
                            ? 'bg-primary/20 text-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span>Conflicts</span>
                      </Link>
                      <Link
                        href="/admin/scraping/analytics"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          pathname === '/admin/scraping/analytics'
                            ? 'bg-primary/20 text-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span>Analytics</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Affiliates - Collapsible */}
                <div>
                  <button
                    onClick={() => setAdminAffiliatesOpen(!adminAffiliatesOpen)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith('/admin/affiliates')
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="h-4 w-4" />
                      <span>Affiliates</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform ${adminAffiliatesOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {adminAffiliatesOpen && (
                    <div className="ml-4 mt-1 space-y-1">
                      <Link
                        href="/admin/affiliates"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          pathname === '/admin/affiliates'
                            ? 'bg-primary/20 text-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span>Management</span>
                      </Link>
                      <Link
                        href="/admin/affiliates/performance"
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          pathname === '/admin/affiliates/performance'
                            ? 'bg-primary/20 text-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span>Performance</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* System Health */}
                <Link
                  href="/admin/system"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith('/admin/system')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Activity className="h-4 w-4" />
                  <span>System Health</span>
                </Link>

                {/* Support Tools */}
                <Link
                  href="/admin/support"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith('/admin/support')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Headphones className="h-4 w-4" />
                  <span>Support Tools</span>
                </Link>

                {/* Fraud Detection */}
                <Link
                  href="/admin/fraud"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith('/admin/fraud')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Shield className="h-4 w-4" />
                  <span>Fraud Detection</span>
                </Link>

                {/* Audit Log */}
                <Link
                  href="/admin/audit"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith('/admin/audit')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <FileText className="h-4 w-4" />
                  <span>Audit Log</span>
                </Link>
              </>
            )}
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t">
            <div className="flex items-center space-x-3 mb-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt={profile?.full_name || user?.email || ''} />
                <AvatarFallback>{getInitials(profile?.full_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <Separator className="mb-3" />
            <LogoutButton className="w-full justify-start" variant="ghost" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </LogoutButton>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            
            {/* Breadcrumbs */}
            <nav className="flex items-center space-x-2 text-sm">
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  {crumb.href ? (
                    <Link href={crumb.href} className="text-muted-foreground hover:text-foreground">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-foreground font-medium">{crumb.label}</span>
                  )}
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {breadcrumbs.length > 0 && (
              <p className="text-muted-foreground mt-1">
                {breadcrumbs.map(crumb => crumb.label).join(' / ')}
              </p>
            )}
          </div>
          {children}
        </main>
      </div>
    </div>
  )
}
