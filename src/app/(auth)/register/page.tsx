'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import RegisterForm from '../../../components/features/auth/RegisterForm'

export default function RegisterPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!loading && user) {
      // Check if there's a redirect URL from middleware
      const redirectedFrom = searchParams.get('redirectedFrom')
      
      // Validate redirect URL to prevent malicious redirects
      let redirectUrl = '/dashboard'
      if (redirectedFrom) {
        // Only allow internal redirects (starting with /)
        if (redirectedFrom.startsWith('/') && !redirectedFrom.startsWith('//')) {
          // Allow only specific protected routes
          const allowedRoutes = ['/dashboard', '/deals', '/switches', '/billing', '/settings']
          if (allowedRoutes.some(route => redirectedFrom.startsWith(route))) {
            redirectUrl = redirectedFrom
          }
        }
      }
      
      router.replace(redirectUrl)
    }
  }, [user, loading, router, searchParams])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your SwitchPilot account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Start earning from bank switching rewards
          </p>
        </div>
        <RegisterForm onSuccess={() => router.push('/login')} />
      </div>
    </div>
  )
}
