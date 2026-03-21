'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ArrowUp, ArrowDown, Save, ArrowLeft, Layers } from 'lucide-react'
import Link from 'next/link'

type QuestionType = 'SHORT_TEXT' | 'LONG_TEXT' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'RATING' | 'QUIZ' | 'SECTION' | 'DATE' | 'IMAGE'
type Category = 'INDUSTRIAL' | 'PROFESSIONAL' | 'SKILL_ASSESSMENT'

interface Question {
  id: string
  question_text: string
  question_type: QuestionType
  options: string[]
  correct_answer: string
  is_required: boolean
}

export default function NewSurveyPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('INDUSTRIAL')
  const [startDate, setStartDate] = useState('')
  const [startHour, setStartHour] = useState('08')
  const [startMinute, setStartMinute] = useState('00')
  const [startAmPm, setStartAmPm] = useState<'AM' | 'PM'>('AM')

  const [endDate, setEndDate] = useState('')
  const [endHour, setEndHour] = useState('05')
  const [endMinute, setEndMinute] = useState('00')
  const [endAmPm, setEndAmPm] = useState<'AM' | 'PM'>('PM')
  const [allowPrevious, setAllowPrevious] = useState(true)
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(0)
  const [imageUploading, setImageUploading] = useState<Record<string, boolean>>({})
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: crypto.randomUUID(),
      question_text: '',
      question_type: 'SHORT_TEXT',
      options: [''],
      correct_answer: '',
      is_required: true,
    },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...questions]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= newQuestions.length) return
    const temp = newQuestions[index]
    newQuestions[index] = newQuestions[swapIndex]
    newQuestions[swapIndex] = temp
    setQuestions(newQuestions)
  }

  const handleImageUpload = async (questionId: string, file: File) => {
    setImageUploading(prev => ({ ...prev, [questionId]: true }))
    try {
      const ext = file.name.split('.').pop()
      const fileName = `${questionId}-${Date.now()}.${ext}`
      const { data, error } = await supabase.storage
        .from('question-images')
        .upload(fileName, file, { upsert: true })
      if (error) throw error
      const { data: urlData } = supabase.storage
        .from('question-images')
        .getPublicUrl(data.path)
      // Append to existing options array instead of replacing
      setQuestions(prev => prev.map(q =>
        q.id === questionId
          ? { ...q, options: [...(q.options || []), urlData.publicUrl] }
          : q
      ))
    } catch (err) {
      alert('Failed to upload image. Please try again.')
    } finally {
      setImageUploading(prev => ({ ...prev, [questionId]: false }))
    }
  }

  const toLocalInputValue = (isoString: string): { date: string, time: string, ampm: 'AM' | 'PM', hour: string, minute: string } => {
    if (!isoString) return { date: '', time: '', ampm: 'AM', hour: '', minute: '' }
    const d = new Date(isoString)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours24 = d.getHours()
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const ampm = hours24 >= 12 ? 'PM' : 'AM'
    const hours12 = hours24 % 12 || 12
    return {
      date: `${year}-${month}-${day}`,
      time: `${String(hours12).padStart(2, '0')}:${minutes}`,
      ampm,
      hour: String(hours12).padStart(2, '0'),
      minute: minutes,
    }
  }

const buildISOString = (date: string, hour: string, minute: string, ampm: 'AM' | 'PM'): string | null => {
  if (!date) return null
  let h = parseInt(hour || '12', 10)
  const m = parseInt(minute || '0', 10)
  if (ampm === 'AM') {
    if (h === 12) h = 0
  } else {
    if (h !== 12) h += 12
  }
  const [year, month, day] = date.split('-').map(Number)
  // Store using UTC so what admin types is exactly what gets saved and displayed
  const iso = new Date(Date.UTC(year, month - 1, day, h, m, 0)).toISOString()
  return iso
}

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: crypto.randomUUID(),
        question_text: '',
        question_type: 'SHORT_TEXT',
        options: [''],
        correct_answer: '',
        is_required: true,
      },
    ])
  }

  const addSection = () => {
    setQuestions([
      ...questions,
      {
        id: crypto.randomUUID(),
        question_text: '',
        question_type: 'SECTION',
        options: [''],
        correct_answer: '',
        is_required: false,
      },
    ])
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map((q) => {
      if (q.id !== id) return q
      const next = { ...q, ...updates }
      if (updates.question_type === 'RATING') {
        const defaults = ['Extremely Good', 'Good', 'Neutral', 'Bad', 'Extremely Bad']
        const prev = Array.isArray(q.options) ? q.options : []
        next.options = prev.length >= 5 ? prev.slice(0, 5) : defaults
        next.correct_answer = q.correct_answer || ''
      }
      if (updates.question_type && updates.question_type !== 'QUIZ' && q.question_type === 'QUIZ') {
        next.correct_answer = ''
      }
      return next
    }))
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
      questions.map((q) => {
        if (q.id !== questionId) return q
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
          starts_at: buildISOString(startDate, startHour, startMinute, startAmPm),
          ends_at: buildISOString(endDate, endHour, endMinute, endAmPm),
          created_by: user?.id,
          allow_previous: allowPrevious,
          time_limit_minutes: timeLimitMinutes,
        })
        .select()
        .single()

      if (surveyError) throw surveyError

      // 2. Create questions
      const questionsToInsert = questions.map((q, index) => ({
        survey_id: survey.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.question_type === 'IMAGE'
          ? { images: (q.options || []).filter(Boolean), answerType: q.correct_answer || 'SHORT_TEXT' }
          : q.question_type === 'SECTION'
          ? { description: q.options?.[0] || '' }
          : q.question_type === 'QUIZ'
          ? { choices: q.options.filter(o => o.trim() !== ''), correct: q.correct_answer }
          : q.options.filter(opt => opt.trim() !== ''),
        order_index: index,
        is_required: q.question_type === 'SECTION' ? false : q.is_required,
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
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Start Date & Time
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-gray-900 outline-none"
                  />
                  <select
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-gray-900 outline-none cursor-pointer"
                  >
                    {['01','02','03','04','05','06','07','08','09','10','11','12'].map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <span className="text-gray-500 font-bold">:</span>
                  <select
                    value={startMinute}
                    onChange={(e) => setStartMinute(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-gray-900 outline-none cursor-pointer"
                  >
                    {['00','05','10','15','20','25','30','35','40','45','50','55'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={startAmPm}
                    onChange={(e) => setStartAmPm(e.target.value as 'AM' | 'PM')}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-gray-900 outline-none cursor-pointer"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  End Date & Time
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-gray-900 outline-none"
                  />
                  <select
                    value={endHour}
                    onChange={(e) => setEndHour(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-gray-900 outline-none cursor-pointer"
                  >
                    {['01','02','03','04','05','06','07','08','09','10','11','12'].map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <span className="text-gray-500 font-bold">:</span>
                  <select
                    value={endMinute}
                    onChange={(e) => setEndMinute(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-gray-900 outline-none cursor-pointer"
                  >
                    {['00','05','10','15','20','25','30','35','40','45','50','55'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={endAmPm}
                    onChange={(e) => setEndAmPm(e.target.value as 'AM' | 'PM')}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-gray-900 outline-none cursor-pointer"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Allow Previous Button</label>
              <p className="text-xs text-gray-500 mt-0.5">
                When enabled, respondents can go back to review and edit previous answers.
                Disable this for quiz-style surveys where going back is not allowed.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAllowPrevious(!allowPrevious)}
              className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ml-6 ${
                allowPrevious ? 'bg-gray-900' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                allowPrevious ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Time Limit</label>
              <p className="text-xs text-gray-500 mt-0.5">
                Set a countdown timer for respondents. Set to 0 for no time limit.
              </p>
            </div>
            <div className="flex items-center gap-2 ml-6">
              <select
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-gray-900 outline-none cursor-pointer"
              >
                <option value={0}>No limit</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={20}>20 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {questions.map((question, qIndex) => (
            <div
              key={question.id}
              className={`p-8 rounded-2xl shadow-sm border relative group ${
                question.question_type === 'SECTION'
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-white border-gray-100'
              }`}
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-gray-200 rounded-l-2xl transition-colors" />
              
              {question.question_type === 'SECTION' ? (
                <div className="space-y-4">
                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                    Section Divider
                  </div>
                  <input
                    type="text"
                    value={question.question_text}
                    onChange={(e) => updateQuestion(question.id, { question_text: e.target.value })}
                    className="w-full px-4 py-2 text-2xl font-bold border-b border-blue-200 focus:border-blue-500 outline-none transition-all text-gray-900 placeholder:text-gray-500 bg-blue-50"
                    placeholder="Section Title e.g. Discipline"
                  />
                  <textarea
                    value={question.options?.[0] ?? ''}
                    onChange={(e) => updateOption(question.id, 0, e.target.value)}
                    className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-500 bg-white"
                    placeholder="Optional description for this section"
                    rows={2}
                  />
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4 mb-6">
                    {/* Up / Down reorder buttons */}
                    <div className="flex flex-col gap-1 pt-1">
                      <button
                        type="button"
                        onClick={() => moveQuestion(qIndex, 'up')}
                        disabled={qIndex === 0}
                        title="Move question up"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveQuestion(qIndex, 'down')}
                        disabled={qIndex === questions.length - 1}
                        title="Move question down"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-95"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-bold text-gray-400 mb-1 block">
                        Q{qIndex + 1}
                      </span>
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
                        } else if (newType === 'QUIZ') {
                          resetOptions = ['', '', '']
                        } else if (newType === 'SECTION') {
                          resetOptions = ['']
                        } else if (newType === 'DATE') {
                          resetOptions = []
                        } else if (newType === 'IMAGE') {
                          resetOptions = []
                        } else if (newType === 'SINGLE_CHOICE' || newType === 'MULTIPLE_CHOICE') {
                          resetOptions = ['']
                        }
                        updateQuestion(question.id, { question_type: newType, options: resetOptions, correct_answer: newType === 'QUIZ' ? '' : '' , ...(newType === 'SECTION' ? { is_required: false } : {}) })
                      }}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white"
                    >
                      <option value="SHORT_TEXT">Short Text</option>
                      <option value="LONG_TEXT">Long Text</option>
                      <option value="SINGLE_CHOICE">Single Choice</option>
                      <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                      <option value="RATING">Rating (1–5)</option>
                      <option value="QUIZ">Quiz (Correct Answer)</option>
                      <option value="SECTION">Section</option>
                      <option value="DATE">Date</option>
                      <option value="IMAGE">Image Question</option>
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

              {question.question_type === 'QUIZ' && (
                <div className="ml-4 mb-6">
                  <label className="block text-sm font-medium text-gray-700">Answer Options</label>
                  <div className="space-y-3 mt-2">
                    {question.options.map((option, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
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

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Correct Answer <span className="ml-1 text-emerald-600 text-xs">✓ This will be auto-graded</span>
                    </label>
                    {question.options.filter((o) => o.trim() !== '').length > 0 ? (
                      <select
                        value={question.correct_answer}
                        onChange={(e) => updateQuestion(question.id, { correct_answer: e.target.value })}
                        className="mt-1 w-full px-3 py-2 border border-emerald-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      >
                        <option value="" disabled>Select correct answer</option>
                        {question.options
                          .filter((o) => o.trim() !== '')
                          .map((opt, idx) => (
                            <option key={idx} value={opt}>{opt}</option>
                          ))}
                      </select>
                    ) : (
                      <div className="mt-1 text-xs text-gray-500">Add options above first</div>
                    )}
                  </div>
                </div>
              )}

              {question.question_type === 'DATE' && (
                <div className="ml-4 mb-6">
                  <label className="block text-sm font-medium text-gray-700">Date Input</label>
                  <p className="text-xs text-gray-500 mb-2">
                    Respondents will see a date picker to select a date.
                  </p>
                  <div className="text-sm text-gray-600">
                    No additional configuration needed.
                  </div>
                </div>
              )}

              {question.question_type === 'IMAGE' && (
                <div className="ml-4 mb-6 space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Question Images</label>
                  <p className="text-xs text-gray-500">
                    Upload one or more images. Respondents will see all images above the answer input.
                  </p>

                  {/* Show all uploaded images */}
                  {(question.options || []).filter(Boolean).length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {(question.options || []).filter(Boolean).map((url, imgIdx) => (
                        <div key={imgIdx} className="relative">
                          <img
                            src={url}
                            alt={`Image ${imgIdx + 1}`}
                            className="w-32 h-32 object-cover rounded-xl border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(question.id, imgIdx)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 cursor-pointer"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Always show upload button */}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImageUpload(question.id, file)
                        e.target.value = ''
                      }}
                      disabled={imageUploading[question.id]}
                      className="hidden"
                      id={`image-upload-${question.id}`}
                    />
                    <label
                      htmlFor={`image-upload-${question.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer text-sm text-gray-600 hover:border-gray-500 hover:text-gray-800 transition-colors"
                    >
                      {imageUploading[question.id] ? (
                        <><div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> Uploading...</>
                      ) : (
                        <>+ Add Image</>
                      )}
                    </label>
                  </div>

                  {/* Answer type selector */}
                  <div className="mt-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Answer Type</label>
                    <select
                      value={question.correct_answer || 'SHORT_TEXT'}
                      onChange={(e) => updateQuestion(question.id, { correct_answer: e.target.value })}
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-gray-900 outline-none cursor-pointer"
                    >
                      <option value="SHORT_TEXT">Short Text Answer</option>
                      <option value="LONG_TEXT">Long Text Answer</option>
                      <option value="SINGLE_CHOICE">Single Choice</option>
                    </select>
                  </div>
                </div>
              )}
                </>
              )}

              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-50">
                {question.question_type !== 'SECTION' && (
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
                )}
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
        <button
          type="button"
          onClick={addSection}
          className="w-full py-4 border-2 border-dashed border-blue-200 rounded-2xl text-blue-500 font-medium hover:border-blue-400 hover:text-blue-700 transition-all flex items-center justify-center gap-2"
        >
          <Layers className="w-5 h-5" />
          Add Section
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