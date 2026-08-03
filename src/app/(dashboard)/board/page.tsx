import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import KanbanBoard from '@/components/board/KanbanBoard'
import Header from '@/components/layout/Header'

/**
 * BOARD SAYFASI (Modern SaaS)
 */
export default async function BoardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <Header />
      <main className="flex-1 w-full px-6 py-6">
        <div className="mb-6 animate-stagger w-full flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
              Takip Panosu
            </h2>
            <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
              Kariyer serüveninizdeki tüm başvuru süreçlerini tek bir yerden yönetin.
            </p>
          </div>
        </div>
        
        <div className="w-full">
          <KanbanBoard />
        </div>
      </main>
    </div>
  )
}
