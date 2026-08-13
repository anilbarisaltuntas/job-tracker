import KanbanBoard from '@/components/board/KanbanBoard'

/**
 * BOARD SAYFASI (Modern SaaS)
 */
export default function BoardPage() {
  return (
    <section className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 w-full">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent-strong)]">
          Çalışma alanı
        </p>
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.03em] text-[var(--text-primary)] sm:text-3xl">
            Takip Panosu
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-[var(--text-secondary)]">
            Başvurularınızı, takip tarihlerinizi ve ilerleme durumlarını tek bir yerden yönetin.
          </p>
        </div>
      </div>

      <KanbanBoard />
    </section>
  )
}
