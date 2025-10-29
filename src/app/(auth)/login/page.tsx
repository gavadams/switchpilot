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

  useEffect(() => {
    if (!loading && user) {
      console.log('🔐 LoginPage: User authenticated, redirecting to dashboard')
      console.log('🔐 LoginPage: Router object:', router)
      try {
        console.log('🔐 LoginPage: Attempting router.replace...')
        router.replace('/dashboard')
        console.log('🔐 LoginPage: router.replace completed')
      } catch (error) {
        console.error('🔐 LoginPage: Error calling router.replace:', error)
        // Try fallback methods
        try {
          console.log('🔐 LoginPage: Trying router.push as fallback...')
          router.push('/dashboard')
          console.log('🔐 LoginPage: router.push completed')
        } catch (pushError) {
          console.error('🔐 LoginPage: router.push also failed:', pushError)
          // Last resort: force navigation
          console.log('🔐 LoginPage: Using window.location as last resort...')
          window.location.href = '/dashboard'
        }
      }
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
          console.log('🔐 LoginForm onSuccess called - waiting for auth state update')
        }} />
      </div>
    </div>
  )
}
