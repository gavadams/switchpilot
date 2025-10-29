// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function AdminAffiliatesPage() {
  console.log('🔧 AdminAffiliatesPage: COMPONENT RENDERED!')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-green-600">✅ Admin Affiliates Page Loaded!</h1>
      <p className="text-gray-600">If you can see this message, the component is rendering correctly.</p>
      <p className="text-sm text-gray-500">Check browser console for the render log.</p>
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Debug Info:</strong> Admin routes now use DashboardLayout with sidebar.
          If you see content but no console logs, it's a JavaScript execution issue.
          If you see nothing, it's a routing issue.
        </p>
      </div>
    </div>
  )
}