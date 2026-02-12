'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

export default function SurveyActions({ id, status }: { id: string; status: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const togglePublish = async () => {
    const form = new FormData()
    form.append('survey_id', id)
    form.append('next_status', status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED')
    await fetch('/admin/surveys/toggle', { method: 'POST', body: form })
    startTransition(() => router.refresh())
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={togglePublish}
        disabled={isPending}
        className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        title={status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
      >
        {isPending ? 'Updating...' : status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
      </button>
      <a
        href={`/survey/${id}`}
        target="_blank"
        className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
        title="Open Public Link"
      >
        Open Link
      </a>
    </div>
  )
}
