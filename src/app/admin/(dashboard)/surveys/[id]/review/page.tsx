import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Eye } from 'lucide-react'
import { formatDateTime } from '@/lib/formatDate'

export default async function ReviewSurveyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: survey } = await supabase
    .from('surveys')
    .select('*')
    .eq('id', id)
    .single()

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('survey_id', id)
    .order('order_index', { ascending: true })

  if (!survey) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <Link href="/admin/surveys" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to Surveys
          </Link>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Survey not found</h1>
          <p className="text-gray-600">The requested survey does not exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/admin/surveys" className="text-sm text-gray-600 hover:text-gray-900">
          ← Back to Surveys
        </Link>
        <div className="flex items-center gap-2">
          <a
            href={`/survey/${id}?preview=true`}
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer active:scale-95 select-none"
          >
            <Eye className="w-4 h-4" />
            Preview Form
          </a>
          <Link
            href={`/admin/surveys/${id}/edit`}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            Edit Survey
          </Link>
          <form action="/admin/surveys/delete" method="post">
            <input type="hidden" name="survey_id" value={id} />
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
            >
              Delete Survey
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-8">
          <div className="flex items-start gap-4 mb-2">
            {survey.logo_url && (
              <img
                src={survey.logo_url}
                alt="Logo"
                className="w-14 h-14 object-contain rounded-xl border border-gray-100 bg-gray-50 flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">{survey.title}</h1>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    survey.status === 'PUBLISHED'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {survey.status}
                </span>
              </div>
              {survey.description && (
                <p className="text-gray-600 mt-1">{survey.description}</p>
              )}
              <div className="flex items-center flex-wrap gap-2 text-sm mt-2">
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">
                  {survey.category.replace('_', ' ')}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-900 font-medium">
                  Previous Button: {survey.allow_previous ? (
                    <span className="text-emerald-600 font-medium">Enabled</span>
                  ) : (
                    <span className="text-red-500 font-medium">Disabled</span>
                  )}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-900 font-medium">
                  Time Limit:{' '}
                  {survey.time_limit_minutes > 0
                    ? `${survey.time_limit_minutes} minutes`
                    : <span className="text-gray-500">No limit</span>
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Questions</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {(questions || []).map((q: any, idx: number) => (
            <div key={q.id} className="p-6">
              {q.question_type === 'SECTION' ? (
                <div className="p-4 border-l-4 border-blue-400 bg-blue-50 rounded-r-xl">
                  <div className="text-xs font-semibold text-blue-700 mb-1">📋 Section Divider</div>
                  <div className="text-gray-900 font-bold text-lg">
                    {q.question_text}
                  </div>
                  {q.options && typeof q.options === 'object' && (q.options as any).description && (
                    <div className="text-sm text-gray-600 mt-1">
                      {(q.options as any).description}
                    </div>
                  )}
                </div>
              ) : (
              <>
              <div className="flex items-start justify-between mb-2">
                <div className="text-gray-900 font-medium">
                  {idx + 1}. {q.question_text}
                </div>
                <div className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                  {q.question_type.replace('_', ' ')}
                </div>
              </div>
              {(q.question_type === 'SINGLE_CHOICE' || q.question_type === 'MULTIPLE_CHOICE') && Array.isArray(q.options) && (
                <ul className="mt-2 list-disc list-inside text-sm text-gray-700">
                  {q.options.map((opt: string, i: number) => (
                    <li key={i}>{opt}</li>
                  ))}
                </ul>
              )}
              {q.question_type === 'RATING' && (
                <div className="mt-3 flex items-center justify-between gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <div
                      key={rating}
                      className="flex-1 py-3 px-1 rounded-lg border bg-white text-gray-600 flex flex-col items-center justify-center"
                    >
                      <span className="block text-sm font-bold">{rating}</span>
                      {Array.isArray(q.options) && q.options?.[rating - 1] && (
                        <span className="block text-xs text-current opacity-75 mt-0.5 leading-tight">
                          {q.options[rating - 1]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {q.question_type === 'DATE' && (
                <div className="mt-2 text-sm text-gray-600">
                  Respondents will see a date picker to select a date.
                </div>
              )}
              {q.question_type === 'IMAGE' && (() => {
                const opts = q.options as any
                const images: string[] = Array.isArray(opts?.images) ? opts.images : (Array.isArray(opts) ? opts : []).filter(Boolean)
                const answerType: string = opts?.answerType || 'SHORT_TEXT'
                return (
                  <div className="mt-2 space-y-3">
                    {/* Show all images */}
                    {images.length > 0 && (
                      <div className={`grid gap-3 ${images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {images.map((url: string, i: number) => (
                          <img
                            key={i}
                            src={url}
                            alt={`Image ${i + 1}`}
                            className="w-full rounded-xl border border-gray-100 object-contain max-h-72"
                            draggable={false}
                          />
                        ))}
                      </div>
                    )}
                    {/* Answer type info */}
                    <div className="text-sm text-gray-600">
                      Answer Type: <span className="font-medium">{answerType.replace('_', ' ')}</span>
                    </div>
                  </div>
                )
              })()}
              <div className="mt-2 text-xs text-gray-500">
                Required: {q.is_required ? 'Yes' : 'No'}
              </div>
              </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
