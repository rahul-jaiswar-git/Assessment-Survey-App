import Link from 'next/link'
import Image from 'next/image'
import { Factory, Briefcase, GraduationCap } from 'lucide-react'

const surveyCategories = [
  {
    id: 'INDUSTRIAL',
    title: 'Company Health Assessment Climate Survey',
    description: 'Request a survey for industrial operations, manufacturing, or logistics.',
    icon: Factory,
    color: 'bg-blue-500',
  },
  {
    id: 'PROFESSIONAL',
    title: 'Professional Level Assessment Individual Capability Study',
    description: 'Request a survey for corporate, consulting, or professional services.',
    icon: Briefcase,
    color: 'bg-emerald-500',
  },
  {
    id: 'SKILL_ASSESSMENT',
    title: 'Skill level Assessment Individual Expertise Study',
    description: 'Request a survey for talent evaluation or educational assessments.',
    icon: GraduationCap,
    color: 'bg-purple-500',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Header ── */}
      <header className="w-full bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Left — Canaffor Corp Logo */}
          <div className="flex items-center gap-3">
            <Image
              src="/canaffor corp logo.png"
              alt="Canaffor Corp"
              width={48}
              height={48}
              className="object-contain"
            />
            <span className="text-lg font-bold text-gray-900 hidden sm:block">
              Canaffor Corp
            </span>
          </div>

          {/* Right — Upskilling logo */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-500 hidden sm:block">
              Powered by
            </span>
            <Image
              src="/upskilling.jpg"
              alt="Upskilling"
              width={120}
              height={40}
              className="object-contain rounded-lg"
            />
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 py-16">
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
      </main>

      {/* ── Footer ── */}
      <footer className="w-full bg-gray-900 text-white mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">

            {/* Col 1 — Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/canaffor corp logo.png"
                  alt="Canaffor Corp"
                  width={40}
                  height={40}
                  className="object-contain rounded-lg"
                />
                <span className="text-lg font-bold">Canaffor Corp</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Empowering organizations with intelligent survey and assessment solutions for measurable growth.
              </p>
            </div>

            {/* Col 2 — Quick Links */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
                Quick Links
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>
                  <Link href="/request?category=INDUSTRIAL" className="hover:text-white transition-colors">
                    Company Health Assessment
                  </Link>
                </li>
                <li>
                  <Link href="/request?category=PROFESSIONAL" className="hover:text-white transition-colors">
                    Professional Level Assessment
                  </Link>
                </li>
                <li>
                  <Link href="/request?category=SKILL_ASSESSMENT" className="hover:text-white transition-colors">
                    Skill Level Assessment
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3 — Powered by + Admin */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
                Platform
              </h3>
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/upskilling.jpg"
                  alt="Upskilling"
                  width={100}
                  height={32}
                  className="object-contain rounded"
                />
              </div>
              <p className="text-gray-400 text-xs mb-4">
                Developed and maintained by the Upskilling team.
              </p>
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-2 rounded-lg transition-colors"
              >
                🔒 Admin Portal
              </Link>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <p>
              © {new Date().getFullYear()} Canaffor Corp. All rights reserved.
            </p>
            <p>
              Powered by Upskilling · Survey Management Platform
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}