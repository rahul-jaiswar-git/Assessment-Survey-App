'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Download, FileSpreadsheet, FileText as FilePdf } from 'lucide-react'
import Papa from 'papaparse'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

interface AnalyticsViewProps {
  surveys: any[]
  selectedSurvey: any
  responses: any[]
}

export default function AnalyticsView({ surveys, selectedSurvey, responses }: AnalyticsViewProps) {
  const router = useRouter()

  const questionStats = useMemo(() => {
    if (!selectedSurvey || !responses.length) return []

    return selectedSurvey.questions.map((q: any) => {
      const answers = responses.flatMap(r => r.answers.filter((a: any) => a.question_id === q.id))
      
      let chartData: any[] = []
      if (q.question_type === 'SINGLE_CHOICE' || q.question_type === 'MULTIPLE_CHOICE') {
        const counts: Record<string, number> = {}
        answers.forEach(a => {
          const val = a.answer_value
          if (Array.isArray(val)) {
            val.forEach(v => counts[v] = (counts[v] || 0) + 1)
          } else {
            counts[val] = (counts[val] || 0) + 1
          }
        })
        chartData = Object.entries(counts).map(([name, value]) => ({ name, value }))
      } else if (q.question_type === 'RATING') {
        const counts: Record<number, number> = {}
        for (let i = 1; i <= 10; i++) counts[i] = 0
        answers.forEach(a => counts[Number(a.answer_value)]++)
        chartData = Object.entries(counts).map(([name, value]) => ({ name, value }))
      }

      return { ...q, chartData, totalResponses: answers.length }
    })
  }, [selectedSurvey, responses])

  const exportToCSV = () => {
    if (!selectedSurvey || !responses.length) return

    const csvData = responses.map(r => {
      const row: any = { 'Submitted At': new Date(r.submitted_at).toLocaleString() }
      selectedSurvey.questions.forEach((q: any) => {
        const answer = r.answers.find((a: any) => a.question_id === q.id)
        row[q.question_text] = Array.isArray(answer?.answer_value) 
          ? answer.answer_value.join(', ') 
          : answer?.answer_value || ''
      })
      return row
    })

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${selectedSurvey.title}_responses.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Survey</label>
          <select
            value={selectedSurvey?.id || ''}
            onChange={(e) => router.push(`/admin/analytics?surveyId=${e.target.value}`)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all"
          >
            <option value="">Choose a survey...</option>
            {surveys.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>

        {selectedSurvey && responses.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        )}
      </div>

      {!selectedSurvey ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center text-gray-500">
          Select a survey from the dropdown above to view analytics.
        </div>
      ) : responses.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center text-gray-500">
          No responses collected for this survey yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {questionStats.map((q: any) => (
            <div key={q.id} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{q.question_text}</h3>
              <p className="text-sm text-gray-500 mb-6">{q.totalResponses} responses</p>

              <div className="h-64 w-full">
                {q.chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    {q.question_type === 'RATING' ? (
                      <BarChart data={q.chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#111827" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    ) : (
                      <PieChart>
                        <Pie
                          data={q.chartData}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {q.chartData.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    )}
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center bg-gray-50 rounded-xl text-sm text-gray-500 italic p-4">
                    <p>Text-based responses cannot be visualized.</p>
                    <button className="mt-2 text-blue-600 font-medium hover:underline">View all responses</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
