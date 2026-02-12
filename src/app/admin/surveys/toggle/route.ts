import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  const supabase = await createClient()
  const formData = await request.formData()
  const surveyId = String(formData.get('survey_id') || '')
  const nextStatus = String(formData.get('next_status') || '')

  if (!surveyId || !nextStatus) {
    return NextResponse.redirect(new URL('/admin/surveys?error=invalid', request.url))
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  const { error } = await supabase
    .from('surveys')
    .update({ status: nextStatus })
    .eq('id', surveyId)

  if (error) {
    return NextResponse.redirect(new URL('/admin/surveys?error=update', request.url))
  }

  revalidatePath('/admin/surveys')
  revalidatePath('/admin/dashboard')

  return NextResponse.redirect(new URL('/admin/surveys', request.url))
}
