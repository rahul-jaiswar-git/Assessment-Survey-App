import { NextResponse } from 'next/server'
import { createClient as createSRClient } from '@supabase/supabase-js'

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: surveyId } = params
    const body = await req.json().catch(() => ({}))
    const { answers } = body as { answers?: Record<string, any> }

    if (!surveyId || !answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request payload.' },
        { status: 400 }
      )
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceKey) {
      console.error('Supabase service configuration missing for survey submit.')
      return NextResponse.json(
        { error: 'Server configuration error. Please contact the administrator.' },
        { status: 500 }
      )
    }

    const supabase = createSRClient(url, serviceKey)

    // 1. Create response record
    const { data: response, error: responseError } = await supabase
      .from('responses')
      .insert({ survey_id: surveyId })
      .select()
      .single()

    if (responseError || !response) {
      throw responseError ?? new Error('Failed to create response.')
    }

    // 2. Create answers records (if any)
    const answersEntries = Object.entries(answers)
    if (answersEntries.length > 0) {
      const answersToInsert = answersEntries.map(([questionId, value]) => ({
        response_id: response.id,
        question_id: questionId,
        answer_value: value,
      }))

      const { error: answersError } = await supabase
        .from('answers')
        .insert(answersToInsert)

      if (answersError) {
        throw answersError
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Survey submit error', err)
    return NextResponse.json(
      { error: err?.message || 'Failed to submit survey.' },
      { status: 500 }
    )
  }
}

