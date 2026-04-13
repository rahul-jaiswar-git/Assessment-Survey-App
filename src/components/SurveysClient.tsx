'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, Plus } from 'lucide-react'
import SurveyActions from '@/components/SurveyActions'
import { formatDateTime } from '@/lib/formatDate'

export default function SurveysClient({ surveys }: { surveys: any[] }) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest')

  const hasActiveFilters =
    search.trim().length > 0 ||
    categoryFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    sortBy !== 'newest'

  const filteredSurveys = useMemo(() => {
    let result = [...(surveys || [])]

    if (search.trim()) {
      const s = search.toLowerCase()
      result = result.filter((x) => x.title?.toLowerCase().includes(s))
    }

    if (categoryFilter !== 'ALL') {
      result = result.filter((x) => x.category === categoryFilter)
    }

    if (statusFilter !== 'ALL') {
      result = result.filter((x) => x.status === statusFilter)
    }

    if (sortBy === 'newest') {
      result.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    } else if (sortBy === 'oldest') {
      result.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
    } else if (sortBy === 'title') {
      result.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    }

    return result
  }, [surveys, search, categoryFilter, statusFilter, sortBy])

  const resetAll = () => {
    setSearch('')
    setCategoryFilter('ALL')
    setStatusFilter('ALL')
    setSortBy('newest')
  }

  const total = surveys?.length || 0
  const shown = filteredSurveys.length

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Surveys</h1>
          <p className="text-gray-600">Manage and track your surveys.</p>
        </div>
        <Link
          href="/admin/surveys/new"
          className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors gap-2 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          New Survey
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 space-y-3">
          {/* Row 1: Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search surveys..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>

          {/* Row 2: Filters */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-gray-900 outline-none cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="INDUSTRIAL">Industrial</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="SKILL_ASSESSMENT">Skill Assessment</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-gray-900 outline-none cursor-pointer"
              >
                <option value="ALL">All Status</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-gray-900 outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">A → Z</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <span className="text-xs text-gray-500">
                  Showing {shown} of {total} surveys
                </span>
              )}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAll}
                  className="text-sm text-red-500 hover:text-red-700 font-medium cursor-pointer transition-colors active:scale-95"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-2 py-3 w-6">#</th>
                <th className="px-3 py-3 w-36">Title</th>
                <th className="px-3 py-3 w-24">Category</th>
                <th className="px-3 py-3 w-36">Start Date</th>
                <th className="px-3 py-3 w-36">End Date</th>
                <th className="px-2 py-3 w-12">Rspn</th>
                <th className="px-2 py-3 text-center w-72">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Actions</div>
                  <div className="flex items-center justify-end gap-3 text-[10px] font-normal normal-case tracking-normal text-gray-400 pr-1">
                    <span className="w-12 text-center">Review</span>
                    <span className="w-12 text-center">Dupe</span>
                    <span className="w-12 text-center">Status</span>
                    <span className="w-12 text-center">Share</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {total > 0 ? (
                filteredSurveys.length > 0 ? (
                  filteredSurveys.map((survey, index) => (
                    <tr key={survey.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-2 py-1.5 text-sm text-gray-500 font-medium">{index + 1}</td>
                      <td className="px-3 py-1.5 w-36">
                        <div className="font-semibold text-gray-900 text-sm leading-snug">{survey.title}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {new Date(survey.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-3 py-1.5">
                        <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 rounded">
                          {survey.category.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-sm text-gray-600">
                        {survey.starts_at ? formatDateTime(survey.starts_at) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-3 py-1.5 text-sm text-gray-600">
                        {survey.ends_at ? formatDateTime(survey.ends_at) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-2 py-1.5 text-sm text-gray-600">
                        {survey.responses?.[0]?.count || 0}
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <SurveyActions id={survey.id} status={survey.status} />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No surveys match your filters.{' '}
                      <button
                        type="button"
                        onClick={resetAll}
                        className="text-red-500 hover:text-red-700 font-medium"
                      >
                        Reset Filters
                      </button>
                    </td>
                  </tr>
                )
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No surveys found. Click &quot;New Survey&quot; to get started.
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
