import { createClient } from '@/lib/supabase/server'
import { createClient as createSRClient } from '@supabase/supabase-js'
import SurveyForm from '@/components/SurveyForm'
export const dynamic = 'force-dynamic'

export default async function PublicSurveyPage({
  params,
}: {
  params: { id: string }
}) {
  const { id } = params
  const supabase = await createClient()

  const { data: surveyFromAnon } = await supabase
    .from('surveys')
    .select('*')
    .eq('id', id)
    .single()

  let survey = surveyFromAnon

  if (!survey) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (url && serviceKey) {
      const srv = createSRClient(url, serviceKey)
      const { data: srvSurvey } = await srv
        .from('surveys')
        .select('*')
        .eq('id', id)
        .single()
      survey = srvSurvey || null
    }
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

  const { data: questionsFromAnon } = await supabase
    .from('questions')
    .select('*')
    .eq('survey_id', id)
    .order('order_index', { ascending: true })

  let questions = questionsFromAnon
  if (!questions || questions.length === 0) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (url && serviceKey) {
      const srv = createSRClient(url, serviceKey)
      const { data: srvQuestions } = await srv
        .from('questions')
        .select('*')
        .eq('survey_id', id)
        .order('order_index', { ascending: true })
      questions = srvQuestions || []
    }
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

        <SurveyForm surveyId={survey.id} questions={sortedQuestions} />
      </div>
    </div>
  )
}
