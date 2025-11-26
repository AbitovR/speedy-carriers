import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/sidebar'
import { SidebarProvider } from '@/components/sidebar-provider'
import { SidebarToggle } from '@/components/sidebar-toggle'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="sticky top-0 z-30 bg-background border-b border-border px-6 py-4">
            <SidebarToggle />
          </div>
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
