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
 * 
 * Neden ayrı? Server Component'te auth kontrolü daha güvenli.
 * Client Component'te interaktif UI (sürükle-bırak, modal) yapabiliyoruz.
 */
export default async function BoardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-900">
      <Header />
      <main className="flex-1 overflow-hidden p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">📋 Başvuru Takip Panosu</h2>
          <p className="mt-1 text-sm text-slate-400">
            Kartları sürükleyerek durumlarını güncelleyebilirsin
          </p>
        </div>
        <KanbanBoard />
      </main>
    </div>
  )
}
