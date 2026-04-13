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
  LineChart,
  Line,
  Legend,
} from 'recharts'
import { FileSpreadsheet, FileText as FilePdf, Download } from 'lucide-react'
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
  
  // Chart type state management
  const [chartTypes, setChartTypes] = useState<Record<string, 'bar' | 'line' | 'pie'>>({})
  const chartRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const getChartType = (questionId: string, defaultType: 'bar' | 'pie' = 'pie') => {
    return chartTypes[questionId] || defaultType
  }

  const setChartType = (questionId: string, type: 'bar' | 'line' | 'pie') => {
    setChartTypes(prev => ({ ...prev, [questionId]: type }))
  }

  // Chart download helper function
  const downloadChart = async (questionId: string, questionText: string) => {
    const el = chartRefs.current[questionId]
    if (!el) return
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(el, { backgroundColor: '#ffffff', scale: 2 })
      const link = document.createElement('a')
      link.download = `${questionText.replace(/[^a-z0-9]/gi, '_').substring(0, 30)}_chart.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch {
      alert('Could not download chart. Please try again.')
    }
  }

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

      if (q.question_type === 'QUIZ') {
        const correct = answers.filter((a: any) => a.is_correct === true).length
        const incorrect = answers.filter((a: any) => a.is_correct === false).length
        const unanswered = answers.length - correct - incorrect
        const pct = answers.length > 0 ? Math.round((correct / answers.length) * 100) : 0
        chartData = [
          { name: '✓ Correct', value: correct },
          { name: '✗ Incorrect', value: incorrect },
          ...(unanswered > 0 ? [{ name: 'No Answer', value: unanswered }] : []),
        ]
        // Store extra quiz stats for display
        return {
          ...q,
          chartData,
          totalResponses: answers.length,
          textAnswers: [],
          quizStats: { correct, incorrect, total: answers.length, pct },
        }
      } else if (q.question_type === 'SINGLE_CHOICE' || q.question_type === 'MULTIPLE_CHOICE') {
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

    // Helper: apply wrap text style to every cell in a worksheet
    const applyWrapText = (ws: XLSX.WorkSheet) => {
      if (!ws['!ref']) return
      const range = XLSX.utils.decode_range(ws['!ref'])
      for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
          if (!ws[cellAddress]) continue
          if (!ws[cellAddress].s) ws[cellAddress].s = {}
          ws[cellAddress].s.alignment = { wrapText: true, vertical: 'top' }
        }
      }
    }

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
    wsSummary['!cols'] = [{ wch: 22 }, { wch: 45 }]
    applyWrapText(wsSummary)
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
        if (q.question_type === 'QUIZ') {
          if (answer?.is_correct === true) row.push('✓ Correct')
          else if (answer?.is_correct === false) row.push('✗ Incorrect')
          else row.push('')
        } else {
          const val = answer?.answer_value
          if (val === null || val === undefined) {
            row.push('')
          } else if (Array.isArray(val)) {
            const joined = val.join(', ')
            row.push(joined.length > 500 ? joined.substring(0, 497) + '...' : joined)
          } else {
            const strVal = String(val)
            row.push(strVal.length > 500 ? strVal.substring(0, 497) + '...' : strVal)
          }
        }
      })
      return row
    })
    const wsResponses = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows])
    // Set column widths
    wsResponses['!cols'] = [
      { wch: 5 },   // # column
      { wch: 20 },  // Submitted At
      ...answerableQuestions.map(() => ({ wch: 40 }))
    ]
    applyWrapText(wsResponses)
    // Set row heights for wrapped text
    wsResponses['!rows'] = [
      { hpt: 30 }, // header row height
      ...filteredResponses.map(() => ({ hpt: 60 })) // data rows — tall enough for 3 lines
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

      if (q.question_type === 'QUIZ') {
        const correct = answers.filter((a: any) => a.is_correct === true).length
        const incorrect = answers.filter((a: any) => a.is_correct === false).length
        const pct = answers.length > 0 ? ((correct / answers.length) * 100).toFixed(1) + '%' : '0%'
        statsRows.push(['Result', 'Count', 'Percentage'])
        statsRows.push(['✓ Correct', correct, pct])
        statsRows.push(['✗ Incorrect', incorrect, answers.length > 0 ? ((incorrect / answers.length) * 100).toFixed(1) + '%' : '0%'])
        statsRows.push(['Score', pct, ''])
      } else if (q.question_type === 'SINGLE_CHOICE' || q.question_type === 'MULTIPLE_CHOICE') {
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
    wsStats['!cols'] = [{ wch: 50 }, { wch: 12 }, { wch: 12 }]
    applyWrapText(wsStats)
    // Set row heights for stats sheet
    const statsRowsCount = statsRows.length
    wsStats['!rows'] = Array.from({ length: statsRowsCount }, () => ({ hpt: 45 }))
    XLSX.utils.book_append_sheet(wb, wsStats, 'Question Stats')

    // ── Download ──────────────────────────────────────────────────
    const safeTitle = selectedSurvey.title.replace(/[^a-z0-9]/gi, '_').substring(0, 40)
    XLSX.writeFile(wb, `${safeTitle}_report.xlsx`)
  }

  const exportToPDF = async () => {
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

      if (q.question_type === 'QUIZ') {
        const correct = answers.filter((a: any) => a.is_correct === true).length
        const incorrect = answers.filter((a: any) => a.is_correct === false).length
        const pct = answers.length > 0 ? ((correct / answers.length) * 100).toFixed(1) + '%' : '0%'
        autoTable(doc, {
          startY: y,
          head: [['Result', 'Count', '%']],
          body: [
            ['✓ Correct', String(correct), pct],
            ['✗ Incorrect', String(incorrect), answers.length > 0 ? ((incorrect / answers.length) * 100).toFixed(1) + '%' : '0%'],
            ['Score', pct, ''],
          ],
          theme: 'striped',
          headStyles: { fillColor: [55, 65, 81] },
          margin: { left: 15, right: 15 },
        })
        y = (doc as any).lastAutoTable.finalY + 10
      } else if (q.question_type === 'SINGLE_CHOICE' || q.question_type === 'MULTIPLE_CHOICE') {
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

    // ── Chart images in PDF ───────────────────────────────────────
    if (y > 220) { doc.addPage(); y = 20 }
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(17, 24, 39)
    doc.text('CHARTS', 15, y)
    y += 10

    for (const q of answerableQuestions) {
      const el = chartRefs.current[q.id]
      if (!el) continue
      try {
        const { default: html2canvas } = await import('html2canvas')
        const canvas = await html2canvas(el, { backgroundColor: '#ffffff', scale: 1.5 })
        const imgData = canvas.toDataURL('image/png')
        const imgW = pageW - 30
        const imgH = (canvas.height / canvas.width) * imgW
        const totalBlockH = 14 + imgH + 10
        if (y + totalBlockH > 270) { doc.addPage(); y = 20 }

        const qIdx = answerableQuestions.indexOf(q)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(17, 24, 39)
        const chartQLines = doc.splitTextToSize(`Q${qIdx + 1}. ${q.question_text}`, imgW)
        doc.text(chartQLines, 15, y)
        y += chartQLines.length * 5 + 3

        doc.addImage(imgData, 'PNG', 15, y, imgW, imgH)
        y += imgH + 12
      } catch {
        // skip chart if capture fails
      }
    }

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
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel
            </button>

            <button
              type="button"
              onClick={() => exportToPDF()}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors active:scale-95"
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
                          <div
                            key={stat.id}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 break-inside-avoid"
                          >
                            {/* Question header */}
                            <h3 className="text-base font-bold text-gray-900 mb-1">{stat.question_text}</h3>
                            <p className="text-sm text-gray-500 mb-4">{stat.totalResponses} responses</p>

                            {/* Chart type switcher — only for questions with chartData */}
                            {stat.chartData.length > 0 && stat.question_type !== 'QUIZ' && (
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                                  {(['bar', 'line', 'pie'] as const).map((type) => (
                                    <button
                                      key={type}
                                      type="button"
                                      onClick={() => setChartType(stat.id, type)}
                                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer capitalize ${
                                        getChartType(stat.id) === type
                                          ? 'bg-white text-gray-900 shadow-sm'
                                          : 'text-gray-500 hover:text-gray-700'
                                      }`}
                                    >
                                      {type === 'bar' ? '▊ Bar' : type === 'line' ? '↗ Line' : '◉ Pie'}
                                    </button>
                                  ))}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => downloadChart(stat.id, stat.question_text)}
                                  title="Download chart as PNG"
                                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                  <Download className="w-3 h-3" />
                                  PNG
                                </button>
                              </div>
                            )}

                            {/* Chart area */}
                            <div
                              className="h-64 w-full"
                              ref={(el) => { chartRefs.current[stat.id] = el }}
                            >
                              {stat.question_type === 'QUIZ' && stat.quizStats ? (
                                /* QUIZ score display — unchanged from current code */
                                <div className="h-full flex flex-col items-center justify-center gap-4">
                                  <div className="text-center">
                                    <div className={`text-5xl font-bold ${
                                      stat.quizStats.pct >= 70 ? 'text-emerald-600' : stat.quizStats.pct >= 40 ? 'text-orange-500' : 'text-red-500'
                                    }`}>
                                      {stat.quizStats.pct}%
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1">correct answers</div>
                                  </div>
                                  <div className="flex items-center gap-6 text-sm">
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                      <span className="text-gray-700 font-medium">{stat.quizStats.correct} Correct</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded-full bg-red-400" />
                                      <span className="text-gray-700 font-medium">{stat.quizStats.incorrect} Incorrect</span>
                                    </div>
                                  </div>
                                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                    <div className="h-3 rounded-full bg-emerald-500 transition-all" style={{ width: `${stat.quizStats.pct}%` }} />
                                  </div>
                                </div>
                              ) : stat.chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                  {(() => {
                                    const type = getChartType(stat.id, stat.question_type === 'RATING' ? 'bar' : 'pie')
                                    if (type === 'bar') {
                                      return (
                                        <BarChart data={stat.chartData}>
                                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                          <Tooltip />
                                          <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                      )
                                    } else if (type === 'line') {
                                      return (
                                        <LineChart data={stat.chartData}>
                                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                          <Tooltip />
                                          <Legend />
                                          <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 4 }} />
                                        </LineChart>
                                      )
                                    } else {
                                      return (
                                        <PieChart>
                                          <Pie data={stat.chartData} innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="value">
                                            {stat.chartData.map((_: any, index: number) => (
                                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                          </Pie>
                                          <Tooltip />
                                          <Legend />
                                        </PieChart>
                                      )
                                    }
                                  })()}
                                </ResponsiveContainer>
                              ) : (
                                <div className="h-full flex flex-col items-center justify-center bg-gray-50 rounded-xl text-sm text-gray-600 p-4">
                                  <p className="text-center">
                                    This question collects open text responses.<br />
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
