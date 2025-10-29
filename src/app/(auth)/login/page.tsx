'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import LoginForm from '../../../components/features/auth/LoginForm'

// Prevent static generation during build
export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  console.log('🔐 LoginPage: user =', user, 'loading =', loading)

  useEffect(() => {
    console.log('🔐 LoginPage useEffect: checking redirect', { user: !!user, loading })
    if (!loading && user) {
      console.log('🔐 LoginPage: Redirecting to dashboard')
      // Always redirect to dashboard after login
      router.replace('/dashboard')
    }
  }, [user, loading, router])

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
            Sign in to SwitchPilot
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your bank switching dashboard
          </p>
        </div>
        <LoginForm onSuccess={() => {
          console.log('🔐 LoginForm success callback triggered')
          router.replace('/dashboard')
        }} />
      </div>
    </div>
  )
}
