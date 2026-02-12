import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import SurveyForm from '@/components/SurveyForm'
export const dynamic = 'force-dynamic'

export default async function PublicSurveyPage({
  params,
}: {
  params: { id: string }
}) {
  const { id } = params
  const supabase = await createClient()

  const { data: survey } = await supabase
    .from('surveys')
    .select('*')
    .eq('id', id)
    .eq('status', 'PUBLISHED')
    .single()

  if (!survey) {
    notFound()
  }

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('survey_id', id)
    .order('order_index', { ascending: true })

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
