import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

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
          <div className="flex items-center justify-between mb-2">
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
            <p className="text-gray-600 mb-4">{survey.description}</p>
          )}
          <div className="flex items-center flex-wrap gap-2 text-sm">
            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">
              {survey.category.replace('_', ' ')}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600">
              Start:{' '}
              {survey.starts_at
                ? new Date(survey.starts_at).toLocaleString()
                : '—'}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600">
              End:{' '}
              {survey.ends_at
                ? new Date(survey.ends_at).toLocaleString()
                : '—'}
            </span>
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
              <div className="mt-2 text-xs text-gray-500">
                Required: {q.is_required ? 'Yes' : 'No'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
