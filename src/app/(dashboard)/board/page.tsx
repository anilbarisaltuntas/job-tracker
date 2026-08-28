import KanbanBoard from '@/components/board/KanbanBoard'

/**
 * BOARD SAYFASI (Modern SaaS)
 */
export default function BoardPage() {
  return (
    <section className="w-full px-4 py-5 sm:px-6 lg:px-8">
      <div className="mb-4 flex w-full items-end justify-between gap-6">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
            Başvuru akışı
          </p>
          <h1 className="text-2xl font-bold tracking-[-0.035em] text-[var(--text-primary)] sm:text-[28px]">
            Takip Panosu
          </h1>
          <p className="mt-1 max-w-2xl text-[13px] text-[var(--text-secondary)]">
            Başvurularını statüler arasında taşı, filtrele ve ayrıntılarını düzenle.
          </p>
        </div>
      </div>

      <KanbanBoard />
    </section>
  )
}
