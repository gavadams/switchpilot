'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import { Button } from '@/components/ui/button'

interface LogoutButtonProps {
  className?: string
  children?: React.ReactNode
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export default function LogoutButton({ className, children, variant = 'default', size = 'default' }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { signOut } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await signOut()
      // Redirect to homepage after logout
      router.replace('/')
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleLogout}
      disabled={isLoading}
      className={className}
      variant={variant}
      size={size}
    >
      {isLoading ? 'Signing out...' : (children || 'Sign out')}
    </Button>
  )
}
