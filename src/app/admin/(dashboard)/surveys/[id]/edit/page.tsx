'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Trash2, Save } from 'lucide-react'

type QuestionType = 'SHORT_TEXT' | 'LONG_TEXT' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'RATING'
type Category = 'INDUSTRIAL' | 'PROFESSIONAL' | 'SKILL_ASSESSMENT'

interface Question {
  id: string
  question_text: string
  question_type: QuestionType
  options: string[]
  is_required: boolean
}

export default function EditSurveyPage() {
  const router = useRouter()
  const params = useParams()
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : ''
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasResponses, setHasResponses] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('INDUSTRIAL')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [questions, setQuestions] = useState<Question[]>([])

  const toLocalInputValue = (s: string) => {
    const d = new Date(s)
    const tz = d.getTimezoneOffset() * 60000
    return new Date(d.getTime() - tz).toISOString().slice(0, 16)
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const { data: survey } = await supabase
          .from('surveys')
          .select('*')
          .eq('id', id)
          .single()

        const { data: qs } = await supabase
          .from('questions')
          .select('*')
          .eq('survey_id', id)
          .order('order_index', { ascending: true })

        const { data: resp } = await supabase
          .from('responses')
          .select('id')
          .eq('survey_id', id)
          .limit(1)

        if (!active) return
        if (survey) {
          setTitle(survey.title || '')
          setDescription(survey.description || '')
          setCategory(survey.category)
          setStartsAt(survey.starts_at ? toLocalInputValue(survey.starts_at) : '')
          setEndsAt(survey.ends_at ? toLocalInputValue(survey.ends_at) : '')
        }
        const normQs: Question[] = (qs || []).map((q: any) => ({
          id: q.id,
          question_text: q.question_text || '',
          question_type: q.question_type,
          options: Array.isArray(q.options) ? q.options : [],
          is_required: !!q.is_required,
        }))
        setQuestions(normQs.length ? normQs : [{
          id: crypto.randomUUID(),
          question_text: '',
          question_type: 'SHORT_TEXT',
          options: [''],
          is_required: true,
        }])
        setHasResponses((resp || []).length > 0)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [id])

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: crypto.randomUUID(),
        question_text: '',
        question_type: 'SHORT_TEXT',
        options: [''],
        is_required: true,
      },
    ])
  }

  const removeQuestion = (qid: string) => {
    setQuestions(questions.filter((q) => q.id !== qid))
  }

  const updateQuestion = (qid: string, updates: Partial<Question>) => {
    setQuestions(questions.map((q) => {
      if (q.id !== qid) return q
      const next = { ...q, ...updates }
      if (updates.question_type === 'RATING') {
        const defaults = ['Extremely Good', 'Good', 'Neutral', 'Bad', 'Extremely Bad']
        const prev = Array.isArray(q.options) ? q.options : []
        next.options = prev.length >= 5 ? prev.slice(0, 5) : defaults
      }
      return next
    }))
  }

  const updateOption = (qid: string, index: number, value: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id !== qid) return q
        const opts = Array.isArray(q.options) ? [...q.options] : []
        const needed = index + 1 - opts.length
        if (needed > 0) {
          opts.push(...Array(needed).fill(''))
        }
        opts[index] = value
        return { ...q, options: opts }
      })
    )
  }

  const addOption = (qid: string) => {
    setQuestions(questions.map((q) => (q.id === qid ? { ...q, options: [...q.options, ''] } : q)))
  }

  const removeOption = (qid: string, index: number) => {
    setQuestions(
      questions.map((q) =>
        q.id === qid ? { ...q, options: q.options.filter((_, i) => i !== index) } : q
      )
    )
  }

  const handleSave = async (status: 'DRAFT' | 'PUBLISHED') => {
    setIsSubmitting(true)
    try {
      await supabase
        .from('surveys')
        .update({
          title,
          description,
          category,
          status,
          starts_at: startsAt ? new Date(startsAt).toISOString() : null,
          ends_at: endsAt ? new Date(endsAt).toISOString() : null,
        })
        .eq('id', id)

      await supabase.from('questions').delete().eq('survey_id', id)

      const questionsToInsert = questions.map((q, index) => ({
        survey_id: id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options.filter((opt) => opt.trim() !== ''),
        order_index: index,
        is_required: q.is_required,
      }))
      if (questionsToInsert.length > 0) {
        await supabase.from('questions').insert(questionsToInsert)
      }

      router.push(`/admin/surveys/${id}/review`)
      router.refresh()
    } catch {
      alert('Failed to update survey')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link href={`/admin/surveys/${id}/review`} className="text-sm text-gray-600 hover:text-gray-900">
          ← Back to Review
        </Link>
        {hasResponses && (
          <div className="px-3 py-2 text-sm rounded-lg bg-yellow-50 text-yellow-700 border border-yellow-200">
            This survey has responses. Editing questions may affect existing response data.
          </div>
        )}
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Edit Survey</h1>

      <form className="space-y-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Survey Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-2 text-xl font-bold border-b-2 border-gray-100 focus:border-gray-900 outline-none transition-all text-gray-900 placeholder:text-gray-500 bg-white"
              placeholder="Untitled Survey"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all resize-none text-gray-900 placeholder:text-gray-500 bg-white"
              placeholder="Enter survey description..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-gray-900 bg-white"
            >
              <option value="INDUSTRIAL">Industrial</option>
              <option value="PROFESSIONAL">Professional</option>
              <option value="SKILL_ASSESSMENT">Skill Assessment</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Survey Schedule
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Set when this survey is open for responses. Leave blank for no time restriction.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Start Date &amp; Time</label>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 text-gray-900 bg-white outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">End Date &amp; Time</label>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 text-gray-900 bg-white outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {questions.map((question, qIndex) => (
            <div key={question.id} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative group">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-gray-200 rounded-l-2xl transition-colors" />

              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex-1">
                  <input
                    type="text"
                    value={question.question_text}
                    onChange={(e) => updateQuestion(question.id, { question_text: e.target.value })}
                    className="w-full px-4 py-2 text-lg font-semibold border-b border-gray-100 focus:border-gray-900 outline-none transition-all text-gray-900 placeholder:text-gray-500 bg-white"
                    placeholder={`Question ${qIndex + 1}`}
                  />
                </div>
                <select
                  value={question.question_type}
                  onChange={(e) => {
                    const newType = e.target.value as QuestionType
                    let resetOptions: string[] = []
                    if (newType === 'RATING') {
                      resetOptions = ['Extremely Good', 'Good', 'Neutral', 'Bad', 'Extremely Bad']
                    } else if (newType === 'SINGLE_CHOICE' || newType === 'MULTIPLE_CHOICE') {
                      resetOptions = ['']
                    }
                    updateQuestion(question.id, { question_type: newType, options: resetOptions })
                  }}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white"
                >
                  <option value="SHORT_TEXT">Short Text</option>
                  <option value="LONG_TEXT">Long Text</option>
                  <option value="SINGLE_CHOICE">Single Choice</option>
                  <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                  <option value="RATING">Rating (1–5)</option>
                </select>
              </div>

              {(question.question_type === 'SINGLE_CHOICE' || question.question_type === 'MULTIPLE_CHOICE') && (
                <div className="space-y-3 ml-4 mb-6">
                  {question.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${question.question_type === 'SINGLE_CHOICE' ? 'rounded-full' : 'rounded-sm'} border-gray-300`} />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateOption(question.id, oIndex, e.target.value)}
                        className="flex-1 px-2 py-1 border-b border-transparent focus:border-gray-200 outline-none text-gray-900 placeholder:text-gray-500 bg-white"
                        placeholder={`Option ${oIndex + 1}`}
                      />
                      {question.options.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeOption(question.id, oIndex)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addOption(question.id)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 ml-7"
                  >
                    + Add Option
                  </button>
                </div>
              )}

              {question.question_type === 'RATING' && (
                <div className="ml-4 mb-6">
                  <label className="block text-sm font-medium text-gray-700">Rating Labels</label>
                  <p className="text-xs text-gray-500">
                    Customize the description for each rating value (1 = first label, 5 = last label)
                  </p>
                  <div className="space-y-2 mt-3">
                    {[1, 2, 3, 4, 5].map((num, idx) => (
                      <div key={num} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 text-sm font-bold flex items-center justify-center">
                          {num}
                        </div>
                        <input
                          type="text"
                          value={question.options?.[idx] ?? ''}
                          onChange={(e) => updateOption(question.id, idx, e.target.value)}
                          className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-gray-900 outline-none"
                          placeholder={`Label for ${num}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Required</span>
                  <button
                    type="button"
                    onClick={() => updateQuestion(question.id, { is_required: !question.is_required })}
                    className={`w-10 h-5 rounded-full transition-colors relative ${question.is_required ? 'bg-gray-900' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${question.is_required ? 'left-6' : 'left-1'}`} />
                  </button>
                </div>
                <div className="h-4 w-px bg-gray-200" />
                <button
                  type="button"
                  onClick={() => removeQuestion(question.id)}
                  disabled={questions.length === 1}
                  className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-0 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addQuestion}
          className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 font-medium hover:border-gray-900 hover:text-gray-900 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Question
        </button>

        <div className="flex items-center justify-end gap-4 pt-8">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSave('DRAFT')}
            className="px-6 py-2 border border-gray-900 text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSave('PUBLISHED')}
            className="px-6 py-2 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Publish Survey
          </button>
        </div>
      </form>
    </div>
  )
}
