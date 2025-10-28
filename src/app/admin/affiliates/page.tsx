'use client'

import { usePathname } from 'next/navigation'

// Force dynamic rendering to fix direct URL navigation issues
export const dynamic = 'force-dynamic'

export default function AdminAffiliatesPage() {
  const pathname = usePathname()
  console.log('🔧 AdminAffiliatesPage: Component rendering!', { pathname })

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold">Admin Affiliates Test</h1>
      <p>Path: {pathname}</p>
      <p>Time: {new Date().toISOString()}</p>
      <p>If you see this message, the component is working!</p>
    </div>
  )
}
