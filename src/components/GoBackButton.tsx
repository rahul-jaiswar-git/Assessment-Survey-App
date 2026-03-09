'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function GoBackButton() {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="fixed bottom-6 right-6 z-50 text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-2"
      aria-label="Go Back"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>Go Back</span>
    </button>
  )
}
