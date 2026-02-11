import { createClient } from '@/lib/supabase/server'
import AnalyticsView from '@/components/AnalyticsView'

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ surveyId?: string }>
}) {
  const { surveyId } = await searchParams
  const supabase = await createClient()

  // Fetch all surveys for the filter
  const { data: surveys } = await supabase
    .from('surveys')
    .select('id, title')
    .eq('status', 'PUBLISHED')

  let surveyData = null
  let responses = []

  if (surveyId) {
    const { data: survey } = await supabase
      .from('surveys')
      .select('*, questions(*)')
      .eq('id', surveyId)
      .single()
    
    surveyData = survey

    const { data: resp } = await supabase
      .from('responses')
      .select('*, answers(*)')
      .eq('survey_id', surveyId)
    
    responses = resp || []
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600">Analyze survey responses and trends.</p>
      </div>

      <AnalyticsView 
        surveys={surveys || []} 
        selectedSurvey={surveyData} 
        responses={responses} 
      />
    </div>
  )
}
