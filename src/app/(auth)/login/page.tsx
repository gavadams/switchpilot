'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import LoginForm from '../../../components/features/auth/LoginForm'

// Prevent static generation during build
export const dynamic = 'force-dynamic'

export default function LoginPage() {
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
        <LoginForm redirectUrl="/dashboard" />
      </div>
    </div>
  )
}
