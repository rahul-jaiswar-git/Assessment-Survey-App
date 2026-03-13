'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, Globe, Copy, Check } from 'lucide-react'

export default function SurveyActions({ id, status }: { id: string; status: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isDuplicating, startDuplicateTransition] = useTransition()
  const [copied, setCopied] = useState(false)

  const togglePublish = () => {
    startTransition(async () => {
      const form = new FormData()
      form.append('survey_id', id)
      form.append('next_status', status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED')
      await fetch('/admin/surveys/toggle', { method: 'POST', body: form })
      router.refresh()
    })
  }

  const copyLink = () => {
    const url = `${window.location.origin}/survey/${id}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const duplicateSurvey = () => {
    startDuplicateTransition(async () => {
      const form = new FormData()
      form.append('survey_id', id)
      await fetch('/admin/surveys/duplicate', { method: 'POST', body: form })
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => router.push(`/admin/surveys/${id}/review`)}
        className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 select-none"
      >
        <Eye className="w-4 h-4" />
        Review
      </button>
      <button
        type="button"
        onClick={duplicateSurvey}
        disabled={isDuplicating}
        className="px-3 py-1.5 text-sm font-medium rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 select-none disabled:opacity-50"
      >
        <Copy className="w-4 h-4" />
        {isDuplicating ? 'Duplicating...' : 'Duplicate'}
      </button>
      <button
        type="button"
        onClick={togglePublish}
        disabled={isPending}
        className={`px-3 py-1.5 text-sm font-medium rounded-lg border flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer active:scale-95 select-none ${
          status === 'PUBLISHED'
            ? 'border-orange-200 text-orange-600 hover:bg-orange-50'
            : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
        }`}
      >
        {status === 'PUBLISHED' ? (
          <>
            <Globe className="w-4 h-4" />
            Unpublish
          </>
        ) : (
          <>
            <Globe className="w-4 h-4" />
            {isPending ? 'Updating...' : 'Publish'}
          </>
        )}
      </button>
      <button
        type="button"
        onClick={copyLink}
        className={`px-3 py-1.5 text-sm font-medium rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 select-none ${
          copied ? 'border-green-200 text-green-600' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
        }`}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
    </div>
  )
}
