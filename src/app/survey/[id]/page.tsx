import { createClient } from '@/lib/supabase/server'
import { createClient as createSRClient } from '@supabase/supabase-js'
import SurveyForm from '@/components/SurveyForm'
import { Eye } from 'lucide-react'
import { formatDateTime } from '@/lib/formatDate'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function PublicSurveyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ preview?: string }>
}) {
  const { id } = await params
  const { preview } = await searchParams
  const isPreview = preview === 'true'
  const supabase = await createClient()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  let survey = null as any
  if (url && serviceKey) {
    const srv = createSRClient(url, serviceKey)
    const { data: srvSurvey } = await srv
      .from('surveys')
      .select('*')
      .eq('id', id)
      .single()
    survey = srvSurvey || null
  } else {
    const { data: surveyFromAnon } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', id)
      .single()
    survey = surveyFromAnon || null
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            <div className="h-3 bg-gray-900 w-full" />
            <div className="p-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Survey unavailable</h1>
              <p className="text-gray-600">
                The survey link is invalid or the survey is not accessible. Please verify the link or try again later.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  let isAdminPreview = false
  if (isPreview) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user && url && serviceKey) {
      const srv = createSRClient(url, serviceKey)
      const { data: adminRow } = await srv
        .from('admins')
        .select('id')
        .eq('id', user.id)
        .single()
      isAdminPreview = !!adminRow
    }
  }

  const now = new Date()
  if (!isAdminPreview) {
    if (survey.starts_at && new Date(survey.starts_at) > now) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Survey Not Yet Open</h1>
            <p className="text-gray-600">This survey opens on {formatDateTime(survey.starts_at)}. Please come back then.</p>
          </div>
        </div>
      )
    }
  
    if (survey.ends_at && new Date(survey.ends_at) < now) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Survey Closed</h1>
            <p className="text-gray-600">This survey closed on {formatDateTime(survey.ends_at)}. Submissions are no longer accepted.</p>
          </div>
        </div>
      )
    }
  }

  let questions = [] as any[]
  if (url && serviceKey) {
    const srv = createSRClient(url, serviceKey)
    const { data: srvQuestions } = await srv
      .from('questions')
      .select('*')
      .eq('survey_id', id)
      .order('order_index', { ascending: true })
    questions = srvQuestions || []
  } else {
    const { data: questionsFromAnon } = await supabase
      .from('questions')
      .select('*')
      .eq('survey_id', id)
      .order('order_index', { ascending: true })
    questions = questionsFromAnon || []
  }

  const sortedQuestions = questions || []

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          {/* Colored top bar */}
          <div className="h-2 bg-gray-900 w-full" />

          <div className="p-8">
            {/* Logo + Title row */}
            <div className="flex items-start gap-5 mb-4">
              {survey.logo_url && (
                <img
                  src={survey.logo_url}
                  alt="Organization logo"
                  className="w-16 h-16 object-contain rounded-xl border border-gray-100 bg-gray-50 flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold text-gray-900 mb-1 leading-tight">
                  {survey.title}
                </h1>
                {survey.description && (
                  <p className="text-gray-500 text-sm leading-relaxed">{survey.description}</p>
                )}
              </div>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg">
                {survey.category.replace(/_/g, ' ')}
              </span>
              {survey.time_limit_minutes > 0 && (
                <span className="px-2 py-1 text-xs font-medium bg-orange-50 text-orange-600 rounded-lg">
                  ⏱ {survey.time_limit_minutes} min limit
                </span>
              )}
            </div>
          </div>
        </div>

        {isAdminPreview && (
          <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Admin Preview Mode — responses submitted here will be saved to the database. This survey may not be publicly accessible yet.
          </div>
        )}

        <SurveyForm surveyId={survey.id} questions={sortedQuestions} status={survey.status} allowPrevious={survey.allow_previous ?? true} timeLimitMinutes={survey.time_limit_minutes ?? 0} />
      </div>
    </div>
  )
}
