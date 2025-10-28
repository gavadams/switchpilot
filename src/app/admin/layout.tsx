import { ReactNode } from 'react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  console.log('🔧 AdminLayout: Rendering')

  return (
    <>
      {children}
    </>
  )
}

