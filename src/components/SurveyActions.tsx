'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, Copy, Check, Share2 } from 'lucide-react'

export default function SurveyActions({ id, status }: { id: string; status: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isDuplicating, startDuplicateTransition] = useTransition()
  const [showShare, setShowShare] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)

  const getSurveyUrl = () => `${window.location.origin}/survey/${id}`

  const shareViaWhatsApp = () => {
    const url = encodeURIComponent(getSurveyUrl())
    const text = encodeURIComponent('Please fill out this survey: ')
    window.open(`https://wa.me/?text=${text}${url}`, '_blank')
    setShowShare(false)
  }

  const shareViaEmail = () => {
    const url = getSurveyUrl()
    const subject = encodeURIComponent('Survey Invitation')
    const body = encodeURIComponent(`You are invited to fill out this survey:\n\n${url}`)
    window.open(`mailto:?subject=${subject}&body=${body}`)
    setShowShare(false)
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(getSurveyUrl())
    setShareCopied(true)
    setTimeout(() => { setShareCopied(false); setShowShare(false) }, 2000)
  }

  const togglePublish = () => {
    startTransition(async () => {
      const form = new FormData()
      form.append('survey_id', id)
      form.append('next_status', status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED')
      await fetch('/admin/surveys/toggle', { method: 'POST', body: form })
      router.refresh()
    })
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
    <div className="flex items-center gap-1.5">

      {/* Review */}
      <button
        type="button"
        onClick={() => router.push(`/admin/surveys/${id}/review`)}
        title="Review Survey"
        className="px-2 py-1 text-xs font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 flex flex-col items-center gap-0.5 transition-colors cursor-pointer active:scale-95 select-none min-w-[40px]"
      >
        <Eye className="w-3.5 h-3.5" />
        <span className="text-[10px] leading-none">Review</span>
      </button>

      {/* Duplicate */}
      <button
        type="button"
        onClick={duplicateSurvey}
        disabled={isDuplicating}
        title="Duplicate Survey"
        className="px-2 py-1 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 flex flex-col items-center gap-0.5 transition-colors cursor-pointer active:scale-95 select-none disabled:opacity-50 min-w-[40px]"
      >
        <Copy className="w-3.5 h-3.5" />
        <span className="text-[10px] leading-none">Copy</span>
      </button>

      {/* Survey ON/OFF */}
      <button
        type="button"
        onClick={togglePublish}
        disabled={isPending}
        title={status === 'PUBLISHED' ? 'Survey is ON — click to turn OFF' : 'Survey is OFF — click to turn ON'}
        className={`px-2 py-1 text-xs font-semibold rounded-lg border flex flex-col items-center gap-0.5 transition-colors disabled:opacity-50 cursor-pointer active:scale-95 select-none min-w-[40px] ${
          status === 'PUBLISHED'
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            : 'border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100'
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
          status === 'PUBLISHED' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
        }`} />
        <span className="text-[10px] leading-none">{isPending ? '...' : status === 'PUBLISHED' ? 'ON' : 'OFF'}</span>
      </button>

      {/* Share */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowShare(!showShare)}
          title="Share Survey"
          className="px-2 py-1 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 flex flex-col items-center gap-0.5 transition-colors cursor-pointer active:scale-95 select-none min-w-[40px]"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="text-[10px] leading-none">Share</span>
        </button>

        {showShare && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowShare(false)} />
            <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden">
              <button
                type="button"
                onClick={copyShareLink}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {shareCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {shareCopied ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                type="button"
                onClick={shareViaWhatsApp}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <span className="text-base">💬</span>
                WhatsApp
              </button>
              <button
                type="button"
                onClick={shareViaEmail}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <span className="text-base">✉️</span>
                Email
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}