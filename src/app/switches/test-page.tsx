'use client'

import { useAuth } from '../../context/AuthContext'

// Prevent static generation during build
export const dynamic = 'force-dynamic'

export default function TestPage() {
  console.log('TestPage: Component rendering')
  
  const { user, loading: authLoading } = useAuth()
  console.log('TestPage: Auth state - user:', !!user, 'authLoading:', authLoading)
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      <div className="space-y-2">
        <p>User: {user ? 'Yes' : 'No'}</p>
        <p>Auth Loading: {authLoading ? 'Yes' : 'No'}</p>
        <p>User ID: {user?.id || 'None'}</p>
        <p>Render Time: {new Date().toLocaleTimeString()}</p>
      </div>
      <button 
        onClick={() => {
          console.log('Test button clicked')
          alert('Test button works!')
        }}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
      >
        Test Button
      </button>
    </div>
  )
}
