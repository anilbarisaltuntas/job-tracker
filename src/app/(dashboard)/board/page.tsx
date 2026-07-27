import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import KanbanBoard from '@/components/board/KanbanBoard'
import Header from '@/components/layout/Header'

/**
 * BOARD SAYFASI
 * 
 * Bu bir Server Component — sunucuda çalışır.
 * İşi: kullanıcının giriş yaptığını doğrula.
 * Asıl UI'ı Client Component olan KanbanBoard render eder.
 */
export default async function BoardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="relative z-10 flex-1 overflow-y-auto p-8">
        <div className="mb-10 text-center animate-fade-in-up">
          <h2 className="text-4xl font-extrabold tracking-tight text-gradient-animated">
            Başvuru Takip Panosu
          </h2>
          <p className="mt-3 text-[15px] font-medium" style={{ color: 'var(--text-secondary)' }}>
            Kariyer yolculuğunu profesyonelce, gücün doruklarında yönet.
          </p>
        </div>
        <KanbanBoard />
      </main>
    </div>
  )
}
