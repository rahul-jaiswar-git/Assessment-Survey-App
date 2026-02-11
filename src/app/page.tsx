import Link from 'next/link'
import { Factory, Briefcase, GraduationCap } from 'lucide-react'

const surveyCategories = [
  {
    id: 'INDUSTRIAL',
    title: 'Industrial Survey',
    description: 'Request a survey for industrial operations, manufacturing, or logistics.',
    icon: Factory,
    color: 'bg-blue-500',
  },
  {
    id: 'PROFESSIONAL',
    title: 'Professional Survey',
    description: 'Request a survey for corporate, consulting, or professional services.',
    icon: Briefcase,
    color: 'bg-emerald-500',
  },
  {
    id: 'SKILL_ASSESSMENT',
    title: 'Skill Assessment',
    description: 'Request a survey for talent evaluation or educational assessments.',
    icon: GraduationCap,
    color: 'bg-purple-500',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-5xl w-full text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
          Survey Management Platform
        </h1>
        <p className="text-xl text-gray-600">
          Select a category to request a custom survey for your organization.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        {surveyCategories.map((category) => (
          <Link
            key={category.id}
            href={`/request?category=${category.id}`}
            className="group relative bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
          >
            <div className={`h-32 ${category.color} flex items-center justify-center`}>
              <category.icon className="w-16 h-16 text-white group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{category.title}</h2>
              <p className="text-gray-600 mb-6">{category.description}</p>
              <div className="flex items-center text-sm font-semibold text-gray-900">
                Request Survey
                <svg
                  className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <footer className="mt-20 text-gray-500 text-sm">
        <Link href="/admin/login" className="hover:text-gray-900 transition-colors">
          Admin Portal
        </Link>
      </footer>
    </div>
  )
}
