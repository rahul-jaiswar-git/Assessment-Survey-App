import { createClient } from '@/lib/supabase/server'
import { FileText, Users, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch summary stats
  const { count: surveyCount } = await supabase
    .from('surveys')
    .select('*', { count: 'exact', head: true })

  const { count: responseCount } = await supabase
    .from('responses')
    .select('*', { count: 'exact', head: true })


  const { count: publishedCount } = await supabase
    .from('surveys')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'PUBLISHED')

  const { count: draftCount } = await supabase
    .from('surveys')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'DRAFT')

  const { count: industrialCount } = await supabase
    .from('surveys')
    .select('*', { count: 'exact', head: true })
    .eq('category', 'INDUSTRIAL')

  const { count: professionalCount } = await supabase
    .from('surveys')
    .select('*', { count: 'exact', head: true })
    .eq('category', 'PROFESSIONAL')

  const { count: skillCount } = await supabase
    .from('surveys')
    .select('*', { count: 'exact', head: true })
    .eq('category', 'SKILL_ASSESSMENT')

  const { count: industrialResponses } = await supabase
    .from('responses')
    .select('*, surveys!inner(category)', { count: 'exact', head: true })
    .eq('surveys.category', 'INDUSTRIAL')

  const { count: professionalResponses } = await supabase
    .from('responses')
    .select('*, surveys!inner(category)', { count: 'exact', head: true })
    .eq('surveys.category', 'PROFESSIONAL')

  const { count: skillResponses } = await supabase
    .from('responses')
    .select('*, surveys!inner(category)', { count: 'exact', head: true })
    .eq('surveys.category', 'SKILL_ASSESSMENT')

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
        {/* Category-wise breakdown */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Surveys by Category</h2>
          <div className="space-y-4">

            {/* Institution / Corporate / Establishment */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Institution / Corporate / Establishment</p>
                  <p className="text-xs text-gray-500">Health Survey Assessment Climate Study</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">{industrialCount || 0}</p>
                <p className="text-xs text-gray-500">surveys</p>
              </div>
            </div>

            {/* Individual Professional */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Individual Professional</p>
                  <p className="text-xs text-gray-500">Individual Capability Assessment Potential Study</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">{professionalCount || 0}</p>
                <p className="text-xs text-gray-500">surveys</p>
              </div>
            </div>

            {/* Skills */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Skills</p>
                  <p className="text-xs text-gray-500">Skill Assessment Proficiency Study</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">{skillCount || 0}</p>
                <p className="text-xs text-gray-500">surveys</p>
              </div>
            </div>

          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <div className="bg-gray-100 p-4 rounded-full mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Survey</h2>
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
