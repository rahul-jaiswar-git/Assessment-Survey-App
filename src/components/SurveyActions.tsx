'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, Globe, Copy, Check, Share2 } from 'lucide-react'

export default function SurveyActions({ id, status }: { id: string; status: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isDuplicating, startDuplicateTransition] = useTransition()
  const [copied, setCopied] = useState(false)
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
        className={`px-3 py-1.5 text-sm font-medium rounded-lg border flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer active:scale-95 select-none ${
          status === 'PUBLISHED'
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            : 'border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100'
        }`}
        title={status === 'PUBLISHED' ? 'Survey is ON — click to turn OFF' : 'Survey is OFF — click to turn ON'}
      >
        {/* Status dot indicator */}
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
          status === 'PUBLISHED' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
        }`} />
        {isPending ? 'Updating...' : status === 'PUBLISHED' ? 'Survey ON' : 'Survey OFF'}
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
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowShare(!showShare)}
          className="px-3 py-1.5 text-sm font-medium rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95 select-none"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>

        {showShare && (
          <>
            {/* Backdrop to close on outside click */}
            <div className="fixed inset-0 z-10" onClick={() => setShowShare(false)} />
            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 overflow-hidden">
              <button
                type="button"
                onClick={copyShareLink}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {shareCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                {shareCopied ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                type="button"
                onClick={shareViaWhatsApp}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <span className="text-base">💬</span>
                WhatsApp
              </button>
              <button
                type="button"
                onClick={shareViaEmail}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
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
