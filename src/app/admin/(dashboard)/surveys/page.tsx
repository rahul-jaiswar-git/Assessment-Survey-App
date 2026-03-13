import { createClient } from '@/lib/supabase/server'
import SurveysClient from '@/components/SurveysClient'

export const dynamic = 'force-dynamic'

export default async function SurveysPage() {
  const supabase = await createClient()

  const { data: surveys } = await supabase
    .from('surveys')
    .select('*, responses(count)')
    .order('created_at', { ascending: false })

  return <SurveysClient surveys={surveys || []} />
}
