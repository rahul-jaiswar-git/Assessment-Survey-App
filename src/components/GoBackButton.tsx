'use client'

import { usePathname, useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function GoBackButton() {
  const router = useRouter()
  const pathname = usePathname()

  const handleClick = () => {
    const ref = document.referrer
    const sameOrigin = !!ref && (() => {
      try {
        return new URL(ref).origin === window.location.origin
      } catch {
        return false
      }
    })()
    const fallback = pathname && pathname.startsWith('/admin') ? '/admin/dashboard' : '/'
    if (sameOrigin && window.history.length > 1) {
      router.back()
    } else {
      router.push(fallback)
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
