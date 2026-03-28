import Link from 'next/link'
import Image from 'next/image'
import { Factory, Briefcase, GraduationCap } from 'lucide-react'

const surveyCategories = [
  {
    id: 'INDUSTRIAL',
    title: 'Health Survey Assessment Climate Study',
    description: 'A structured assessment to evaluate organizational health, workplace climate, and operational effectiveness across industrial and corporate environments.',
    icon: Factory,
    color: 'bg-[#10B981]',
  },
  {
    id: 'PROFESSIONAL',
    title: 'Individual Capability Assessment Potential Study',
    description: 'An in-depth evaluation of individual professional capabilities, competencies, and growth potential for career development and role alignment.',
    icon: Briefcase,
    color: 'bg-[#10B981]',
  },
  {
    id: 'SKILL_ASSESSMENT',
    title: 'Skill Assessment Proficiency Study',
    description: 'A targeted proficiency study to measure skill levels, knowledge depth, and expertise for talent evaluation and learning outcomes.',
    icon: GraduationCap,
    color: 'bg-[#10B981]',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Header ── */}
      <header className="w-full bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Left — Canaffor Corp logo — bigger */}
          <div className="flex items-center">
            <Image
              src="/canaffor corp logo.png"
              alt="Canaffor Corporation"
              width={160}
              height={160}
              className="object-contain"
            />
          </div>
          {/* Right — Gurukul logo only */}
          <div className="flex items-center">
            <Image
              src="/upskilling.jpg"
              alt="Gurukul"
              width={90}
              height={90}
              className="object-contain rounded-full"
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
                <h2 className="text-xl font-bold text-gray-900 mb-2">{category.title}</h2>
                <p className="text-gray-600 mb-6 text-sm leading-relaxed">{category.description}</p>
                <div className="flex items-center text-sm font-semibold text-[#10B981]">
                  Request Survey
                  <svg
                    className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="w-full mt-auto" style={{ backgroundColor: '#BDC3C7' }}>
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">

            {/* Col 1 — Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/canaffor corp logo.png"
                  alt="Canaffor Corporation"
                  width={100}
                  height={100}
                  className="object-contain rounded-lg"
                />
                <span className="text-lg font-bold text-gray-900">Canaffor Corporation</span>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                Empowering organizations with intelligent survey and assessment solutions for measurable growth.
              </p>
            </div>

            {/* Col 2 — Quick Links */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-4">
                Quick Links
              </h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li>
                  <Link href="/request?category=INDUSTRIAL" className="hover:text-[#10B981] transition-colors font-medium">
                    Health Survey Assessment Climate Study
                  </Link>
                </li>
                <li>
                  <Link href="/request?category=PROFESSIONAL" className="hover:text-[#10B981] transition-colors font-medium">
                    Individual Capability Assessment Potential Study
                  </Link>
                </li>
                <li>
                  <Link href="/request?category=SKILL_ASSESSMENT" className="hover:text-[#10B981] transition-colors font-medium">
                    Skill Assessment Proficiency Study
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3 — Gurukul + Admin Portal */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-4">
                Platform
              </h3>
              <div className="flex items-center gap-3 mb-3">
                <Image
                  src="/upskilling.jpg"
                  alt="Gurukul"
                  width={56}
                  height={56}
                  className="object-contain rounded-full"
                />
                <span className="text-gray-900 font-semibold text-base">Gurukul</span>
              </div>
              <p className="text-gray-600 text-xs mb-5">
                Developed and maintained by the Gurukul team.
              </p>
              <Link
                href="/admin/login"
                className="inline-flex items-center gap-2 text-sm font-bold text-white px-6 py-3 rounded-xl transition-all active:scale-95 cursor-pointer shadow-md hover:shadow-lg hover:opacity-90"
                style={{ backgroundColor: '#10B981' }}
              >
                🔒 Admin Portal
              </Link>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-gray-400 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
            <p>© {new Date().getFullYear()} Canaffor Corporation. All rights reserved.</p>
            <p>Powered by Gurukul · Survey Management Platform</p>
          </div>
        </div>
      </footer>

    </div>
  )
}