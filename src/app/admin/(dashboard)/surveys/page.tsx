import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Search, Filter, MoreVertical, ExternalLink } from 'lucide-react'

export default async function SurveysPage() {
  const supabase = await createClient()

  const { data: surveys } = await supabase
    .from('surveys')
    .select('*, questions(count)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Surveys</h1>
          <p className="text-gray-600">Manage and track your surveys.</p>
        </div>
        <Link
          href="/admin/surveys/new"
          className="inline-flex items-center px-4 py-2 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors gap-2"
        >
          <Plus className="w-5 h-5" />
          New Survey
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search surveys..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Questions</th>
                <th className="px-6 py-4">Responses</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {surveys && surveys.length > 0 ? (
                surveys.map((survey) => (
                  <tr key={survey.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{survey.title}</div>
                      <div className="text-xs text-gray-500">Created on {new Date(survey.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-md">
                        {survey.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        survey.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {survey.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {survey.questions?.[0]?.count || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      --
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {survey.status === 'PUBLISHED' && (
                          <Link
                            href={`/survey/${survey.id}`}
                            target="_blank"
                            className="p-2 text-gray-400 hover:text-gray-900 transition-colors"
                            title="View Public Link"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </Link>
                        )}
                        <details className="relative">
                          <summary className="list-none p-2 text-gray-400 hover:text-gray-900 transition-colors cursor-pointer">
                            <MoreVertical className="w-5 h-5" />
                          </summary>
                          <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                            <form action="/admin/surveys/toggle" method="post" className="border-b border-gray-100">
                              <input type="hidden" name="survey_id" value={survey.id} />
                              <input
                                type="hidden"
                                name="next_status"
                                value={survey.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED'}
                              />
                              <button
                                type="submit"
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                {survey.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                              </button>
                            </form>
                            {survey.status === 'PUBLISHED' && (
                              <a
                                href={`/survey/${survey.id}`}
                                target="_blank"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                Open Public Link
                              </a>
                            )}
                          </div>
                        </details>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No surveys found. Click "New Survey" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
