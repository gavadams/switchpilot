'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { createClient } from '../../../lib/supabase/client'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSuccess?: () => void
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        setError(error.message)
        return
      }

      onSuccess?.()
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl mb-4">
          <span className="text-white text-2xl font-bold">SP</span>
        </div>
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">Welcome back</h2>
        <p className="text-neutral-600">Sign in to your SwitchPilot account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-neutral-700 mb-2">
            Email address
          </label>
          <input
            {...register('email')}
            type="email"
            id="email"
            className="input-professional w-full px-4 py-3 text-neutral-800 placeholder-neutral-400"
            placeholder="Enter your email"
          />
          {errors.email && (
            <p className="mt-2 text-sm text-error-600">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-neutral-700 mb-2">
            Password
          </label>
          <input
            {...register('password')}
            type="password"
            id="password"
            className="input-professional w-full px-4 py-3 text-neutral-800 placeholder-neutral-400"
            placeholder="Enter your password"
          />
          {errors.password && (
            <p className="mt-2 text-sm text-error-600">
              {errors.password.message}
            </p>
          )}
        </div>

        {error && (
          <div className="bg-gradient-to-r from-error-50 to-error-100 border border-error-200 rounded-xl p-4">
            <p className="text-sm text-error-700">
              {error}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-white font-semibold bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-neutral-600">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-semibold text-primary-600 hover:text-primary-500 transition-colors"
          >
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  )
}
