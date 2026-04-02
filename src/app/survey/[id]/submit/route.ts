import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSRClient } from '@supabase/supabase-js'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: surveyId } = await params
    const body = await req.json().catch(() => ({}))
    const { answers, timeTakenSeconds } = body as { answers?: Record<string, any>, timeTakenSeconds?: number }

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

    // Fetch the survey to check publish status and schedule windows
    const { data: survey } = await supabase
      .from('surveys')
      .select('status, starts_at, ends_at')
      .eq('id', surveyId)
      .single()

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found.' }, { status: 404 })
    }

    if (survey.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'This survey is no longer accepting responses.' },
        { status: 403 }
      )
    }

    const now = new Date()
    if (survey.ends_at && new Date(survey.ends_at) < now) {
      return NextResponse.json(
        { error: 'This survey has closed. Your response could not be submitted.' },
        { status: 403 }
      )
    }

    if (survey.starts_at && new Date(survey.starts_at) > now) {
      return NextResponse.json(
        { error: 'This survey is not yet open.' },
        { status: 403 }
      )
    }

    // 1. Create response record
    const { data: response, error: responseError } = await supabase
      .from('responses')
      .insert({ 
        survey_id: surveyId,
        started_at: new Date().toISOString(),
        time_taken_seconds: timeTakenSeconds || null
      })
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

    // Auto-grade QUIZ questions by comparing submitted answer to correct answer
    const { data: quizQuestions } = await supabase
      .from('questions')
      .select('id, question_type, options')
      .eq('survey_id', surveyId)
      .eq('question_type', 'QUIZ')

    if (quizQuestions && quizQuestions.length > 0) {
      for (const q of quizQuestions as any[]) {
        const userAnswer = (answers as Record<string, any>)[q.id]
        const correctAnswer = (q.options as any)?.correct
        if (userAnswer !== undefined && correctAnswer !== undefined) {
          const isCorrect =
            String(userAnswer).trim() === String(correctAnswer).trim()
          await supabase
            .from('answers')
            .update({ is_correct: isCorrect })
            .eq('response_id', response.id)
            .eq('question_id', q.id)
        }
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

