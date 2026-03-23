'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Suspense } from 'react'

function GoBackButtonInner() {
  const router = useRouter()

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
      className="fixed bottom-4 right-4 z-50 bg-white border border-gray-200 shadow-md rounded-full px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:shadow-lg transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
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