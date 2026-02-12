'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { Send, CheckCircle, AlertCircle } from 'lucide-react'

function RequestForm() {
  const searchParams = useSearchParams()
  const category = searchParams.get('category') || 'INDUSTRIAL'
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.append('access_key', process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY || '')
    formData.append('subject', `New Survey Request: ${category}`)
    formData.append('category', category)

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        setIsSuccess(true)
      } else {
        setError(data.message || 'Something went wrong. Please try again.')
      }
    } catch (err) {
      setError('Failed to send request. Please check your internet connection.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Sent!</h2>
        <p className="text-gray-600 mb-6">
          Thank you for your interest. Our team will review your request and get back to you soon.
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="w-full bg-gray-900 text-white font-semibold py-3 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Return Home
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Request a Survey</h2>
      <p className="text-gray-600 mb-8">
        Category: <span className="font-semibold text-gray-900">{category.replace('_', ' ')}</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-500 bg-white"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-1">
            Organization Name
          </label>
          <input
            type="text"
            id="organization"
            name="organization"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-500 bg-white"
            placeholder="ACME Corp"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Contact Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-500 bg-white"
            placeholder="john@example.com"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Contact Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-500 bg-white"
            placeholder="+1 (555) 000-0000"
          />
        </div>

        {error && (
          <div className="flex items-center text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gray-900 text-white font-semibold py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
        >
          {isSubmitting ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit Request
            </>
          )}
        </button>
      </form>
    </div>
  )
}

export default function RequestPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <Suspense fallback={<div>Loading...</div>}>
        <RequestForm />
      </Suspense>
    </div>
  )
}
