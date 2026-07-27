import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import KanbanBoard from '@/components/board/KanbanBoard'
import Header from '@/components/layout/Header'

/**
 * BOARD SAYFASI (Modern Minimalizm)
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
      <main className="relative z-10 flex-1 overflow-y-auto p-10">
        <div className="mb-8 animate-stagger max-w-[1400px] mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-medium tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Takip Panosu
            </h2>
            <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
              Tüm başvuru süreçleriniz tek bir yerde.
            </p>
          </div>
        </div>
        
        <div className="max-w-[1400px] mx-auto">
          <KanbanBoard />
        </div>
      </main>
    </div>
  )
}
