// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function AdminAffiliatesPage() {
  console.log('🔧 AdminAffiliatesPage: COMPONENT RENDERED!')

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold text-green-600">✅ Admin Affiliates Page Loaded!</h1>
      <p className="mt-4">If you can see this message, the component is rendering correctly.</p>
      <p className="mt-2 text-sm text-gray-600">Check browser console for the render log.</p>
      <p className="mt-2 text-xs text-red-500">If you see this but no console log, there's a Next.js routing issue.</p>
    </div>
  )
}