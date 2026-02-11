'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, AlertCircle, Send } from 'lucide-react'

interface SurveyFormProps {
  surveyId: string
  questions: any[]
}

export default function SurveyForm({ surveyId, questions }: SurveyFormProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

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
      // 1. Create response record
      const { data: response, error: responseError } = await supabase
        .from('responses')
        .insert({ survey_id: surveyId })
        .select()
        .single()

      if (responseError) throw responseError

      // 2. Create answers records
      const answersToInsert = Object.entries(answers).map(([questionId, value]) => ({
        response_id: response.id,
        question_id: questionId,
        answer_value: value,
      }))

      const { error: answersError } = await supabase
        .from('answers')
        .insert(answersToInsert)

      if (answersError) throw answersError

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-20">
      {questions.map((question) => (
        <div key={question.id} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <label className="block text-lg font-semibold text-gray-900 mb-4">
            {question.question_text}
            {question.is_required && <span className="text-red-500 ml-1">*</span>}
          </label>

          {question.question_type === 'SHORT_TEXT' && (
            <input
              type="text"
              required={question.is_required}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
              placeholder="Your answer"
            />
          )}

          {question.question_type === 'LONG_TEXT' && (
            <textarea
              required={question.is_required}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all resize-none"
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

          {question.question_type === 'RATING' && (
            <div className="flex items-center justify-between gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleAnswerChange(question.id, rating)}
                  className={`flex-1 py-3 rounded-lg border text-sm font-bold transition-all ${
                    answers[question.id] === rating
                      ? 'bg-gray-900 border-gray-900 text-white'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      {error && (
        <div className="flex items-center text-red-600 text-sm bg-red-50 p-4 rounded-xl">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg"
      >
        {isSubmitting ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Send className="w-5 h-5" />
            Submit Response
          </>
        )}
      </button>
    </form>
  )
}
