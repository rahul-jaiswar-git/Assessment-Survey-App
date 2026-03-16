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
      className="fixed bottom-6 right-6 z-50 text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-2"
      aria-label="Go Back"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>Go Back</span>
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