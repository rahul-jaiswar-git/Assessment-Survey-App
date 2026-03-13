'use client'

import { useState } from 'react'
import { CheckCircle, AlertCircle, Send } from 'lucide-react'

interface SurveyFormProps {
  surveyId: string
  questions: any[]
  status?: 'DRAFT' | 'PUBLISHED'
}

export default function SurveyForm({ surveyId, questions, status }: SurveyFormProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleCheckboxChange = (questionId: string, option: string, checked: boolean) => {
    const currentAnswers = answers[questionId] || []
    if (checked) {
      handleAnswerChange(questionId, [...currentAnswers, option])
    } else {
      handleAnswerChange(questionId, currentAnswers.filter((opt: string) => opt !== option))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/survey/${surveyId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to submit survey.')
      }

      setIsSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error(err)
      setError('Failed to submit survey. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="bg-white p-12 rounded-2xl shadow-xl text-center">
        <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
        <p className="text-gray-600 mb-8">
          Your response has been successfully recorded.
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-2 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
        >
          Return Home
        </button>
      </div>
    )
  }

  const isDraft = status && status !== 'PUBLISHED'

  return (
    <form
      onSubmit={handleSubmit}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
      className="space-y-6 pb-20 select-none"
    >
      {isDraft && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl">
          This survey is currently in draft. Public responses are disabled until it is published.
        </div>
      )}
      {(() => {
        const answerableQuestions = questions.filter((q: any) => q.question_type !== 'SECTION')
        const totalAnswerable = answerableQuestions.length || 1
        const answeredBefore = questions.slice(0, currentIndex).filter((q: any) => q.question_type !== 'SECTION').length
        const isCurrentAnswerable = questions[currentIndex]?.question_type !== 'SECTION'
        const displayNumber = Math.min(answeredBefore + (isCurrentAnswerable ? 1 : 0), totalAnswerable)
        const percent = Math.round((displayNumber / totalAnswerable) * 100)
        return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            Question {displayNumber} of {totalAnswerable}
          </span>
          <span className="text-sm text-gray-400">
            {percent}% complete
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-gray-900 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
        )
      })()}

      {(() => {
        const question = questions[currentIndex]
        if (!question) return null
        const isSection = question.question_type === 'SECTION'
        return (
          <div
            key={question.id}
            className={`bg-white p-8 rounded-2xl shadow-sm border border-gray-100 ${isSection ? 'min-h-[180px]' : 'min-h-[280px]'}`}
          >
            <label className="block text-lg font-semibold text-gray-900 mb-4">
              {question.question_text}
              {question.is_required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {isSection && (
              <div className="py-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-px flex-1 bg-blue-200" />
                  <span className="text-xs font-bold text-blue-500 uppercase tracking-widest px-2">Section</span>
                  <div className="h-px flex-1 bg-blue-200" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{question.question_text}</h2>
                {(question.options as any)?.description && (
                  <p className="text-gray-500 text-sm">{(question.options as any).description}</p>
                )}
                <p className="text-xs text-gray-400 mt-3">Click Next to continue to the questions in this section.</p>
              </div>
            )}

            {question.question_type === 'SHORT_TEXT' && (
              <input
                type="text"
                required={question.is_required}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-500 bg-white"
                placeholder="Your answer"
              />
            )}

            {question.question_type === 'LONG_TEXT' && (
              <textarea
                required={question.is_required}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all resize-none text-gray-900 placeholder:text-gray-500 bg-white"
                placeholder="Your answer"
                rows={4}
              />
            )}

            {question.question_type === 'SINGLE_CHOICE' && (
              <div className="space-y-3">
                {question.options.map((option: string) => (
                  <label key={option} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name={question.id}
                      required={question.is_required}
                      onChange={() => handleAnswerChange(question.id, option)}
                      className="w-4 h-4 text-gray-900 focus:ring-gray-900 border-gray-300"
                    />
                    <span className="text-gray-700 group-hover:text-gray-900 transition-colors">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {question.question_type === 'MULTIPLE_CHOICE' && (
              <div className="space-y-3">
                {question.options.map((option: string) => (
                  <label key={option} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      onChange={(e) => handleCheckboxChange(question.id, option, e.target.checked)}
                      className="w-4 h-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded"
                    />
                    <span className="text-gray-700 group-hover:text-gray-900 transition-colors">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {question.question_type === 'QUIZ' && (
              <div className="space-y-3">
                {((question.options as any)?.choices || question.options || []).map((option: string) => (
                  <label key={option} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name={question.id}
                      value={option}
                      required={question.is_required}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      className="w-4 h-4 text-gray-900 focus:ring-gray-900 border-gray-300"
                    />
                    <span className="text-gray-700 group-hover:text-gray-900 transition-colors">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {question.question_type === 'RATING' && (
              <div className="flex items-center justify-between gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => handleAnswerChange(question.id, rating)}
                    className={`flex-1 py-3 px-1 rounded-lg border text-sm font-bold transition-all flex flex-col items-center justify-center ${
                      answers[question.id] === rating
                        ? 'bg-gray-900 border-gray-900 text-white'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900'
                    }`}
                  >
                    <span className="block text-sm font-bold">{rating}</span>
                    {question.options?.[rating - 1] && (
                      <span className="block text-xs text-current opacity-75 mt-0.5 leading-tight">
                        {question.options?.[rating - 1]}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })()}

      {error && (
        <div className="flex items-center text-red-600 text-sm bg-red-50 p-4 rounded-xl">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-0 disabled:pointer-events-none transition-all cursor-pointer active:scale-95 select-none"
        >
          ← Previous
        </button>

        {currentIndex < questions.length - 1 ? (
          <button
            type="button"
            onClick={() => {
              const question = questions[currentIndex]
              if (question.question_type !== 'SECTION' && question.is_required && !answers[question.id]) {
                setError('Please answer this question before continuing.')
                return
              }
              setError(null)
              setCurrentIndex((i) => i + 1)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all cursor-pointer active:scale-95 select-none"
          >
            Next →
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting || isDraft}
            className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer active:scale-95 select-none"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" /> Submit Response
              </>
            )}
          </button>
        )}
      </div>
    </form>
  )
}
