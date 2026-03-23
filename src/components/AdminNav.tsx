'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FileText, BarChart3, LogOut } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const navItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Surveys', href: '/admin/surveys', icon: FileText },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
]

export default function AdminNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname()

  if (mobile) {
    // Mobile: icon-only buttons in a row
    return (
      <>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.name}
              href={item.href}
              title={item.name}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
              )}
            >
              <item.icon className="w-5 h-5" />
            </Link>
          )
        })}
        {/* Sign out button in mobile bar */}
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            title="Sign Out"
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </form>
      </>
    )
  }

  // Desktop: full labels
  return (
    <>
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
              isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </Link>
        )
      })}
    </>
  )
}
