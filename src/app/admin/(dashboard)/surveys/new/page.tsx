'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, GripVertical, Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type QuestionType = 'SHORT_TEXT' | 'LONG_TEXT' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'RATING'

interface Question {
  id: string
  question_text: string
  question_type: QuestionType
  options: string[]
  is_required: boolean
}

export default function NewSurveyPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<'INDUSTRIAL' | 'PROFESSIONAL' | 'SKILL_ASSESSMENT'>('INDUSTRIAL')
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: crypto.randomUUID(),
      question_text: '',
      question_type: 'SHORT_TEXT',
      options: [''],
      is_required: true,
    },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)))
  }

  const addOption = (questionId: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId ? { ...q, options: [...q.options, ''] } : q
      )
    )
  }

  const updateOption = (questionId: string, index: number, value: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt, i) => (i === index ? value : opt)),
            }
          : q
      )
    )
  }

  const removeOption = (questionId: string, index: number) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.filter((_, i) => i !== index),
            }
          : q
      )
    )
  }

  const handleSubmit = async (e: React.FormEvent, status: 'DRAFT' | 'PUBLISHED') => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // 1. Create survey
      const { data: survey, error: surveyError } = await supabase
        .from('surveys')
        .insert({
          title,
          description,
          category,
          status,
          created_by: user?.id,
        })
        .select()
        .single()

      if (surveyError) throw surveyError

      // 2. Create questions
      const questionsToInsert = questions.map((q, index) => ({
        survey_id: survey.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options.filter(opt => opt.trim() !== ''),
        order_index: index,
        is_required: q.is_required,
      }))

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert)

      if (questionsError) throw questionsError

      router.push('/admin/surveys')
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Failed to create survey')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/surveys" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Create New Survey</h1>
      </div>

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
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-gray-900 bg-white"
            >
              <option value="INDUSTRIAL">Industrial</option>
              <option value="PROFESSIONAL">Professional</option>
              <option value="SKILL_ASSESSMENT">Skill Assessment</option>
            </select>
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
                  onChange={(e) => updateQuestion(question.id, { question_type: e.target.value as QuestionType })}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white"
                >
                  <option value="SHORT_TEXT">Short Text</option>
                  <option value="LONG_TEXT">Long Text</option>
                  <option value="SINGLE_CHOICE">Single Choice</option>
                  <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                  <option value="RATING">Rating (1-10)</option>
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
            onClick={(e) => handleSubmit(e, 'DRAFT')}
            className="px-6 py-2 border border-gray-900 text-gray-900 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={(e) => handleSubmit(e, 'PUBLISHED')}
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
