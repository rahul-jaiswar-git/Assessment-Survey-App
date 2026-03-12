import { createClient } from '@/lib/supabase/server'
import { createClient as createSRClient } from '@supabase/supabase-js'
import SurveyForm from '@/components/SurveyForm'
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function PublicSurveyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
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

  const now = new Date()
  if (survey.starts_at && new Date(survey.starts_at) > now) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Survey Not Yet Open</h1>
          <p className="text-gray-600">This survey opens on {new Date(survey.starts_at).toLocaleString()}. Please come back then.</p>
        </div>
      </div>
    )
  }

  if (survey.ends_at && new Date(survey.ends_at) < now) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Survey Closed</h1>
          <p className="text-gray-600">This survey closed on {new Date(survey.ends_at).toLocaleString()}. Submissions are no longer accepted.</p>
        </div>
      </div>
    )
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
          <div className="h-3 bg-gray-900 w-full" />
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{survey.title}</h1>
            {survey.description && (
              <p className="text-gray-600">{survey.description}</p>
            )}
            <div className="mt-4 flex items-center gap-2">
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                {survey.category.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        <SurveyForm surveyId={survey.id} questions={sortedQuestions} status={survey.status} />
      </div>
    </div>
  )
}
