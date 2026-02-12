import { createClient } from '@/lib/supabase/server'
import { FileText, Users, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch summary stats
  const { count: surveyCount } = await supabase
    .from('surveys')
    .select('*', { count: 'exact', head: true })

  const { count: responseCount } = await supabase
    .from('responses')
    .select('*', { count: 'exact', head: true })

  const { data: recentSurveys } = await supabase
    .from('surveys')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  const { count: publishedCount } = await supabase
    .from('surveys')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'PUBLISHED')

  const { count: draftCount } = await supabase
    .from('surveys')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'DRAFT')

  const stats = [
    {
      label: 'Total Surveys',
      value: surveyCount || 0,
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      label: 'Total Responses',
      value: responseCount || 0,
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      label: 'Published Surveys',
      value: publishedCount || 0,
      icon: CheckCircle,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
    {
      label: 'Draft Surveys',
      value: draftCount || 0,
      icon: Clock,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your survey activities.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className={`${stat.bg} p-3 rounded-xl`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Surveys</h2>
          <div className="space-y-4">
            {recentSurveys && recentSurveys.length > 0 ? (
              recentSurveys.map((survey) => (
                <div key={survey.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-semibold text-gray-900">{survey.title}</p>
                    <p className="text-sm text-gray-500 capitalize">{survey.category.toLowerCase().replace('_', ' ')}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                    survey.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {survey.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No surveys created yet.</p>
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <div className="bg-gray-100 p-4 rounded-full mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Create New Survey</h2>
          <p className="text-gray-500 mb-6 max-w-xs">
            Ready to collect some data? Start by creating a new survey structure.
          </p>
          <Link
            href="/admin/surveys/new"
            className="inline-flex items-center px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  )
}
