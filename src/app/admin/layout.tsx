import { ReactNode } from 'react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  console.log('🔧 AdminLayout: Rendering')

  return (
    <div className="min-h-screen bg-background">
      {/* Admin layout wrapper */}
      {children}
    </div>
  )
}

