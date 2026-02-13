'use client'

import { useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { FileSpreadsheet, FileText as FilePdf } from 'lucide-react'
import Papa from 'papaparse'
import { useReactToPrint } from 'react-to-print'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

interface AnalyticsViewProps {
  surveys: any[]
  selectedSurvey: any
  responses: any[]
}

export default function AnalyticsView({ surveys, selectedSurvey, responses }: AnalyticsViewProps) {
  const router = useRouter()
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [activeTextQuestion, setActiveTextQuestion] = useState<any | null>(null)
  const analyticsRef = useRef<HTMLDivElement | null>(null)

  const filteredResponses = useMemo(() => {
    if (!responses.length) return []
    return responses.filter((r: any) => {
      const submitted = new Date(r.submitted_at)
      if (fromDate) {
        const from = new Date(fromDate)
        if (submitted < from) return false
      }
      if (toDate) {
        const to = new Date(toDate)
        // include entire day for "to" date
        to.setHours(23, 59, 59, 999)
        if (submitted > to) return false
      }
      return true
    })
  }, [responses, fromDate, toDate])

  const questionStats = useMemo(() => {
    if (!selectedSurvey || !filteredResponses.length) return []

    return selectedSurvey.questions.map((q: any) => {
      const answers = filteredResponses.flatMap((r: any) =>
        r.answers.filter((a: any) => a.question_id === q.id)
      )

      let chartData: any[] = []
      let textAnswers: string[] = []

      if (q.question_type === 'SINGLE_CHOICE' || q.question_type === 'MULTIPLE_CHOICE') {
        const counts: Record<string, number> = {}
        answers.forEach((a: any) => {
          const val = a.answer_value
          if (Array.isArray(val)) {
            val.forEach((v) => (counts[v] = (counts[v] || 0) + 1))
          } else {
            counts[val] = (counts[val] || 0) + 1
          }
        })
        chartData = Object.entries(counts).map(([name, value]) => ({ name, value }))
      } else if (q.question_type === 'RATING') {
        const counts: Record<number, number> = {}
        for (let i = 1; i <= 10; i++) counts[i] = 0
        answers.forEach((a: any) => {
          const rating = Number(a.answer_value)
          if (!Number.isNaN(rating) && rating >= 1 && rating <= 10) {
            counts[rating] = (counts[rating] || 0) + 1
          }
        })
        chartData = Object.entries(counts).map(([name, value]) => ({ name, value }))
      } else {
        // SHORT_TEXT / LONG_TEXT
        textAnswers = answers
          .map((a: any) =>
            typeof a.answer_value === 'string'
              ? a.answer_value
              : Array.isArray(a.answer_value)
              ? a.answer_value.join(', ')
              : a.answer_value != null
              ? String(a.answer_value)
              : ''
          )
          .filter((val: string) => val.trim().length > 0)
      }

      return { ...q, chartData, totalResponses: answers.length, textAnswers }
    })
  }, [selectedSurvey, filteredResponses])

  const summary = useMemo(() => {
    if (!selectedSurvey || !filteredResponses.length) {
      return null
    }

    const totalResponses = filteredResponses.length
    const totalQuestions = selectedSurvey.questions.length
    const dates = filteredResponses.map((r: any) => new Date(r.submitted_at))
    const firstDate = new Date(Math.min(...dates.map((d: Date) => d.getTime())))
    const latestDate = new Date(Math.max(...dates.map((d: Date) => d.getTime())))

    return {
      totalResponses,
      totalQuestions,
      firstDate: firstDate.toLocaleDateString(),
      latestDate: latestDate.toLocaleDateString(),
    }
  }, [selectedSurvey, filteredResponses])

  const exportToCSV = () => {
    if (!selectedSurvey || !filteredResponses.length) return

    const csvData = filteredResponses.map((r: any) => {
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

  const exportToExcel = () => {
    if (!selectedSurvey || !filteredResponses.length) return

    const csvData = filteredResponses.map((r: any) => {
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
    const blob = new Blob([csv], {
      type: 'application/vnd.ms-excel;charset=utf-8;',
    })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${selectedSurvey.title}_responses.xls`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = useReactToPrint({
    content: () => analyticsRef.current,
    documentTitle: selectedSurvey ? `${selectedSurvey.title}_analytics` : 'survey_analytics',
  })

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Survey</label>
          <select
            value={selectedSurvey?.id || ''}
            onChange={(e) => router.push(`/admin/analytics?surveyId=${e.target.value}`)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-gray-900 bg-white"
          >
            <option value="">Choose a survey...</option>
            {surveys.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        </div>

        {selectedSurvey && responses.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 mr-4">
              <div>
                <span className="block text-xs font-medium text-gray-500">From</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="mt-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500">To</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="mt-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
                />
              </div>
              {(fromDate || toDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setFromDate('')
                    setToDate('')
                  }}
                  className="mt-5 text-xs text-gray-600 hover:text-gray-900 underline"
                >
                  Clear filters
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
            >
              <FilePdf className="w-4 h-4" />
              Export PDF
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
        <>
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Total Responses (filtered)
                </p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalResponses}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Questions in Survey
                </p>
                <p className="text-2xl font-bold text-gray-900">{summary.totalQuestions}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Response Window
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {summary.firstDate} – {summary.latestDate}
                </p>
              </div>
            </div>
          )}

          <div ref={analyticsRef} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {questionStats.map((q: any) => (
              <div key={q.id} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 break-inside-avoid">
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
                    <div className="h-full flex flex-col items-center justify-center bg-gray-50 rounded-xl text-sm text-gray-600 p-4">
                      <p className="text-center">
                        This question collects open text responses.
                        <br />
                        Use the list below to review what people wrote.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTextQuestion(q)}
                        className="mt-3 text-sm text-blue-600 font-medium hover:underline"
                      >
                        View all responses
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {activeTextQuestion && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
              <div className="bg-white max-w-2xl w-full max-h-[80vh] rounded-2xl shadow-xl overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 line-clamp-2">
                      {activeTextQuestion.question_text}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">
                      {activeTextQuestion.textAnswers?.length || 0} text responses
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTextQuestion(null)}
                    className="text-sm text-gray-500 hover:text-gray-900"
                  >
                    Close
                  </button>
                </div>
                <div className="px-6 py-4 overflow-y-auto space-y-3">
                  {activeTextQuestion.textAnswers && activeTextQuestion.textAnswers.length > 0 ? (
                    activeTextQuestion.textAnswers.map((answer: string, index: number) => (
                      <div
                        key={index}
                        className="border border-gray-100 rounded-xl px-4 py-3 bg-gray-50 text-sm text-gray-900"
                      >
                        <span className="font-semibold text-xs text-gray-500 mr-2">
                          #{index + 1}
                        </span>
                        {answer}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      No text responses recorded yet for this question.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
