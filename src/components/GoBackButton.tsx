'use client'

import { useRouter, usePathname } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Suspense } from 'react'

function GoBackButtonInner() {
  const router = useRouter()
  const pathname = usePathname()

  // Don't show on the main homepage
  if (pathname === '/') return null

  const handleClick = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="fixed bottom-4 right-4 z-50 bg-green-600 border border-green-700 shadow-md rounded-full px-4 py-2 text-sm font-medium text-white hover:bg-green-700 hover:shadow-lg transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
      aria-label="Go Back"
    >
      <ArrowLeft className="w-4 h-4" />
      <span className="hidden sm:inline">Go Back</span>
    </button>
  )
}

export default function GoBackButton() {
  return (
    <Suspense fallback={null}>
      <GoBackButtonInner />
    </Suspense>
  )
}