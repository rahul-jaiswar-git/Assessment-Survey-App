import { createClient, getAdminRole } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, FileText, BarChart3, LogOut, UserCircle } from 'lucide-react'
import AdminNav from '@/components/AdminNav'

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const role = await getAdminRole(user.id)

  if (!role) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      await supabase.auth.signOut()
      redirect('/admin/login?error=Server configuration missing: SUPABASE_SERVICE_ROLE_KEY')
    }
    // If authenticated but not in admins table, sign out and redirect
    await supabase.auth.signOut()
    redirect('/admin/login?error=Unauthorized')
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Mobile top bar ── */}
      <div className="lg:hidden flex items-center justify-between bg-gray-900 text-white px-4 py-3">
        <Link href="/admin/dashboard" className="text-lg font-bold flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5" />
          Admin Panel
        </Link>
        {/* Mobile nav links inline */}
        <div className="flex items-center gap-1">
          <AdminNav mobile />
        </div>
      </div>

      <div className="flex">
        {/* ── Desktop sidebar — hidden on mobile ── */}
        <aside className="hidden lg:flex w-56 bg-gray-900 text-white flex-col min-h-screen fixed top-0 left-0">
          <div className="p-6">
            <Link href="/admin/dashboard" className="text-xl font-bold flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6" />
              Admin Panel
            </Link>
          </div>
          <nav className="flex-1 px-4 space-y-2">
            <AdminNav />
          </nav>
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center gap-3 px-2 py-3 mb-2">
              <UserCircle className="w-8 h-8 text-gray-400" />
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{user.email}</p>
                <p className="text-xs text-gray-500 capitalize">{role.toLowerCase().replace('_', ' ')}</p>
              </div>
            </div>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </form>
          </div>
        </aside>

        {/* ── Main content ── */}
        {/* lg:ml-56 offsets content for the fixed sidebar on desktop */}
        <main className="flex-1 lg:ml-56 min-h-screen overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
