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
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatDateTime } from '@/lib/formatDate'

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

    const answerableQuestions = selectedSurvey.questions.filter((q: any) => q.question_type !== 'SECTION')
    return answerableQuestions.map((q: any) => {
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

  const exportToExcel = () => {
    if (!selectedSurvey || !filteredResponses.length) return

    const wb = XLSX.utils.book_new()

    // ── SHEET 1: Summary ──────────────────────────────────────────
    const summaryRows = [
      ['SURVEY REPORT'],
      [],
      ['Survey Title', selectedSurvey.title],
      ['Category', selectedSurvey.category.replace(/_/g, ' ')],
      ['Status', selectedSurvey.status],
      ['Total Responses', filteredResponses.length],
      ['Total Questions', selectedSurvey.questions.filter((q: any) => q.question_type !== 'SECTION').length],
      ['Report Generated', formatDateTime(new Date().toISOString())],
      [],
      ['Start Date', selectedSurvey.starts_at ? formatDateTime(selectedSurvey.starts_at) : 'No restriction'],
      ['End Date', selectedSurvey.ends_at ? formatDateTime(selectedSurvey.ends_at) : 'No restriction'],
    ]
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
    wsSummary['!cols'] = [{ wch: 25 }, { wch: 50 }]
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary')

    // ── SHEET 2: All Responses (one row per respondent) ───────────
    const answerableQuestions = selectedSurvey.questions.filter(
      (q: any) => q.question_type !== 'SECTION'
    )
    const headerRow = [
      '#',
      'Submitted At',
      ...answerableQuestions.map((q: any, i: number) => `Q${i + 1}. ${q.question_text}`)
    ]
    const dataRows = filteredResponses.map((r: any, idx: number) => {
      const row: any[] = [
        idx + 1,
        formatDateTime(r.submitted_at),
      ]
      answerableQuestions.forEach((q: any) => {
        const answer = r.answers.find((a: any) => a.question_id === q.id)
        const val = answer?.answer_value
        if (val === null || val === undefined) {
          row.push('')
        } else if (Array.isArray(val)) {
          row.push(val.join(', '))
        } else {
          row.push(String(val))
        }
      })
      return row
    })
    const wsResponses = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows])
    // Set column widths
    wsResponses['!cols'] = [
      { wch: 5 },
      { wch: 22 },
      ...answerableQuestions.map(() => ({ wch: 35 }))
    ]
    XLSX.utils.book_append_sheet(wb, wsResponses, 'All Responses')

    // ── SHEET 3: Question Stats ────────────────────────────────────
    const statsRows: any[][] = [
      ['QUESTION-WISE STATISTICS'],
      [],
    ]
    answerableQuestions.forEach((q: any, idx: number) => {
      statsRows.push([`Q${idx + 1}. ${q.question_text}`])
      statsRows.push(['Type', q.question_type.replace(/_/g, ' ')])

      const answers = filteredResponses.flatMap((r: any) =>
        r.answers.filter((a: any) => a.question_id === q.id)
      )
      statsRows.push(['Total Answers', answers.length])

      if (q.question_type === 'SINGLE_CHOICE' || q.question_type === 'MULTIPLE_CHOICE' || q.question_type === 'QUIZ') {
        const counts: Record<string, number> = {}
        answers.forEach((a: any) => {
          const val = a.answer_value
          if (Array.isArray(val)) {
            val.forEach((v: string) => (counts[v] = (counts[v] || 0) + 1))
          } else {
            counts[String(val)] = (counts[String(val)] || 0) + 1
          }
        })
        statsRows.push(['Option', 'Count', 'Percentage'])
        Object.entries(counts).forEach(([option, count]) => {
          const pct = answers.length > 0 ? ((count / answers.length) * 100).toFixed(1) + '%' : '0%'
          statsRows.push([option, count, pct])
        })
      } else if (q.question_type === 'RATING') {
        const counts: Record<number, number> = {}
        for (let i = 1; i <= 5; i++) counts[i] = 0
        answers.forEach((a: any) => {
          const rating = Number(a.answer_value)
          if (!isNaN(rating) && rating >= 1 && rating <= 5) counts[rating]++
        })
        const total = answers.length
        const avg = total > 0
          ? (answers.reduce((sum: number, a: any) => sum + Number(a.answer_value), 0) / total).toFixed(2)
          : '0'
        statsRows.push(['Rating', 'Count', 'Percentage'])
        for (let i = 1; i <= 5; i++) {
          const pct = total > 0 ? ((counts[i] / total) * 100).toFixed(1) + '%' : '0%'
          statsRows.push([`Rating ${i}`, counts[i], pct])
        }
        statsRows.push(['Average Rating', avg, ''])
      } else {
        // SHORT_TEXT / LONG_TEXT
        statsRows.push(['Response #', 'Answer'])
        answers.forEach((a: any, i: number) => {
          const val = a.answer_value
          statsRows.push([
            i + 1,
            typeof val === 'string' ? val : Array.isArray(val) ? val.join(', ') : String(val ?? '')
          ])
        })
      }
      statsRows.push([]) // blank row between questions
    })

    const wsStats = XLSX.utils.aoa_to_sheet(statsRows)
    wsStats['!cols'] = [{ wch: 45 }, { wch: 15 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, wsStats, 'Question Stats')

    // ── Download ──────────────────────────────────────────────────
    const safeTitle = selectedSurvey.title.replace(/[^a-z0-9]/gi, '_').substring(0, 40)
    XLSX.writeFile(wb, `${safeTitle}_report.xlsx`)
  }

  const exportToPDF = () => {
    if (!selectedSurvey || !filteredResponses.length) return

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    let y = 20

    // ── Header ────────────────────────────────────────────────────
    doc.setFillColor(17, 24, 39) // gray-900
    doc.rect(0, 0, pageW, 14, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('SURVEY ANALYTICS REPORT', pageW / 2, 9, { align: 'center' })

    // ── Survey title ──────────────────────────────────────────────
    doc.setTextColor(17, 24, 39)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    const titleLines = doc.splitTextToSize(selectedSurvey.title, pageW - 30)
    doc.text(titleLines, 15, y + 5)
    y += titleLines.length * 8 + 8

    // ── Summary table ─────────────────────────────────────────────
    autoTable(doc, {
      startY: y,
      head: [['Field', 'Value']],
      body: [
        ['Category', selectedSurvey.category.replace(/_/g, ' ')],
        ['Status', selectedSurvey.status],
        ['Total Responses', String(filteredResponses.length)],
        ['Total Questions', String(selectedSurvey.questions.filter((q: any) => q.question_type !== 'SECTION').length)],
        ['Report Generated', formatDateTime(new Date().toISOString())],
        ['Start Date', selectedSurvey.starts_at ? formatDateTime(selectedSurvey.starts_at) : 'No restriction'],
        ['End Date', selectedSurvey.ends_at ? formatDateTime(selectedSurvey.ends_at) : 'No restriction'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [17, 24, 39], textColor: 255, fontStyle: 'bold' },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 }, 1: { cellWidth: 'auto' } },
      margin: { left: 15, right: 15 },
    })

    y = (doc as any).lastAutoTable.finalY + 12

    // ── Per-question stats ────────────────────────────────────────
    const answerableQuestions = selectedSurvey.questions.filter(
      (q: any) => q.question_type !== 'SECTION'
    )

    answerableQuestions.forEach((q: any, idx: number) => {
      if (y > 240) { doc.addPage(); y = 20 }

      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(17, 24, 39)
      const qLines = doc.splitTextToSize(`Q${idx + 1}. ${q.question_text}`, pageW - 30)
      doc.text(qLines, 15, y)
      y += qLines.length * 6 + 2

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(107, 114, 128)
      doc.text(`Type: ${q.question_type.replace(/_/g, ' ')}`, 15, y)
      y += 6

      const answers = filteredResponses.flatMap((r: any) =>
        r.answers.filter((a: any) => a.question_id === q.id)
      )

      if (q.question_type === 'SINGLE_CHOICE' || q.question_type === 'MULTIPLE_CHOICE' || q.question_type === 'QUIZ') {
        const counts: Record<string, number> = {}
        answers.forEach((a: any) => {
          const val = a.answer_value
          if (Array.isArray(val)) val.forEach((v: string) => (counts[v] = (counts[v] || 0) + 1))
          else counts[String(val)] = (counts[String(val)] || 0) + 1
        })
        autoTable(doc, {
          startY: y,
          head: [['Option', 'Count', '%']],
          body: Object.entries(counts).map(([opt, cnt]) => [
            opt,
            String(cnt),
            answers.length > 0 ? ((cnt / answers.length) * 100).toFixed(1) + '%' : '0%',
          ]),
          theme: 'striped',
          headStyles: { fillColor: [55, 65, 81] },
          margin: { left: 15, right: 15 },
        })
        y = (doc as any).lastAutoTable.finalY + 10
      } else if (q.question_type === 'RATING') {
        const counts: Record<number, number> = {}
        for (let i = 1; i <= 5; i++) counts[i] = 0
        answers.forEach((a: any) => {
          const r = Number(a.answer_value)
          if (!isNaN(r) && r >= 1 && r <= 5) counts[r]++
        })
        const total = answers.length
        const avg = total > 0
          ? (answers.reduce((s: number, a: any) => s + Number(a.answer_value), 0) / total).toFixed(2)
          : '0'
        autoTable(doc, {
          startY: y,
          head: [['Rating', 'Count', '%']],
          body: [
            ...([1,2,3,4,5].map(i => [
              `Rating ${i}`,
              String(counts[i]),
              total > 0 ? ((counts[i] / total) * 100).toFixed(1) + '%' : '0%',
            ])),
            ['Average', avg, ''],
          ],
          theme: 'striped',
          headStyles: { fillColor: [55, 65, 81] },
          margin: { left: 15, right: 15 },
        })
        y = (doc as any).lastAutoTable.finalY + 10
      } else {
        // Text responses
        const textAnswers = answers.map((a: any) =>
          typeof a.answer_value === 'string' ? a.answer_value : String(a.answer_value ?? '')
        ).filter((v: string) => v.trim())
        if (textAnswers.length > 0) {
          autoTable(doc, {
            startY: y,
            head: [['#', 'Response']],
            body: textAnswers.map((ans: string, i: number) => [String(i + 1), ans]),
            theme: 'striped',
            headStyles: { fillColor: [55, 65, 81] },
            columnStyles: { 0: { cellWidth: 12 }, 1: { cellWidth: 'auto' } },
            margin: { left: 15, right: 15 },
          })
          y = (doc as any).lastAutoTable.finalY + 10
        }
      }
    })

    // ── Footer with page numbers ──────────────────────────────────
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(156, 163, 175)
      doc.text(`Page ${i} of ${pageCount}`, pageW / 2, 290, { align: 'center' })
    }

    const safeTitle = selectedSurvey.title.replace(/[^a-z0-9]/gi, '_').substring(0, 40)
    doc.save(`${safeTitle}_report.pdf`)
  }

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
              onClick={exportToPDF}
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

          {(() => {
            if (!selectedSurvey) return null
            const sectionGroups = (() => {
              const groups: { sectionTitle: string | null, questions: any[] }[] = []
              let currentGroup: { sectionTitle: string | null, questions: any[] } = { sectionTitle: null, questions: [] }
              for (const q of selectedSurvey.questions) {
                if (q.question_type === 'SECTION') {
                  if (currentGroup.questions.length > 0) groups.push(currentGroup)
                  currentGroup = { sectionTitle: q.question_text, questions: [] }
                } else {
                  currentGroup.questions.push(q)
                }
              }
              if (currentGroup.questions.length > 0) groups.push(currentGroup)
              return groups
            })()
            return (
              <div className="space-y-10">
                {sectionGroups.map((group, groupIdx) => (
                  <div key={groupIdx} className="space-y-6">
                    {group.sectionTitle && (
                      <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-gray-200" />
                        <h2 className="text-lg font-bold text-gray-700 px-3 py-1 bg-gray-100 rounded-full">
                          {group.sectionTitle}
                        </h2>
                        <div className="h-px flex-1 bg-gray-200" />
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {group.questions.map((q: any) => {
                        const stat = questionStats.find((s: any) => s.id === q.id)
                        if (!stat) return null
                        return (
                          <div key={stat.id} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 break-inside-avoid">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{stat.question_text}</h3>
                            <p className="text-sm text-gray-500 mb-6">{stat.totalResponses} responses</p>
                            <div className="h-64 w-full">
                              {stat.chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                  {stat.question_type === 'RATING' ? (
                                    <BarChart data={stat.chartData}>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                      <XAxis dataKey="name" />
                                      <YAxis allowDecimals={false} />
                                      <Tooltip />
                                      <Bar dataKey="value" fill="#111827" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                  ) : (
                                    <PieChart>
                                      <Pie
                                        data={stat.chartData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                      >
                                        {stat.chartData.map((_: any, index: number) => (
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
                                    onClick={() => setActiveTextQuestion(stat)}
                                    className="mt-3 text-sm text-blue-600 font-medium hover:underline"
                                  >
                                    View all responses
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )
          })()}

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