import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient as createSRClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const formData = await request.formData()
    const surveyId = String(formData.get('survey_id') || '')

    if (!surveyId) {
      return NextResponse.redirect(new URL('/admin/surveys?error=invalid', request.url))
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
      return NextResponse.redirect(new URL('/admin/surveys?error=duplicate_failed', request.url))
    }
    const srv = createSRClient(url, serviceKey)

    const { data: original } = await srv
      .from('surveys')
      .select('*')
      .eq('id', surveyId)
      .single()
    if (!original) {
      return NextResponse.redirect(new URL('/admin/surveys?error=duplicate_failed', request.url))
    }

    const { data: originalQuestions } = await srv
      .from('questions')
      .select('*')
      .eq('survey_id', surveyId)
      .order('order_index', { ascending: true })

    const { data: newSurvey, error: insertSurveyError } = await srv
      .from('surveys')
      .insert({
        title: `Copy of ${original.title}`,
        description: original.description,
        category: original.category,
        status: 'DRAFT',
        created_by: user.id,
        starts_at: null,
        ends_at: null,
      })
      .select()
      .single()

    if (insertSurveyError || !newSurvey) {
      return NextResponse.redirect(new URL('/admin/surveys?error=duplicate_failed', request.url))
    }

    const questionsToInsert = (originalQuestions || []).map((q: any, index: number) => ({
      survey_id: newSurvey.id,
      question_text: q.question_text,
      question_type: q.question_type,
      options: q.options,
      order_index: typeof q.order_index === 'number' ? q.order_index : index,
      is_required: !!q.is_required,
    }))

    if (questionsToInsert.length > 0) {
      const { error: insertQuestionsError } = await srv
        .from('questions')
        .insert(questionsToInsert)
      if (insertQuestionsError) {
        return NextResponse.redirect(new URL('/admin/surveys?error=duplicate_failed', request.url))
      }
    }

    revalidatePath('/admin/surveys')
    revalidatePath('/admin/dashboard')
    return NextResponse.redirect(new URL('/admin/surveys', request.url))
  } catch {
    return NextResponse.redirect(new URL('/admin/surveys?error=duplicate_failed', request.url))
  }
}
