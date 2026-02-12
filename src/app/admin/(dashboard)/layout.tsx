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
    // If authenticated but not in admins table, sign out and redirect
    await supabase.auth.signOut()
    redirect('/admin/login?error=Unauthorized')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
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

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
