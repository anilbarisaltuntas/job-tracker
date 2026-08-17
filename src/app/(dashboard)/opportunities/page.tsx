import OpportunitiesBoard from '@/components/opportunities/OpportunitiesBoard'

export const metadata = {
  title: 'Programlar - Başvuru Pusulası',
}

export default function OpportunitiesPage() {
  return (
    <section className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 w-full">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent-strong)]">
          Kariyer gelişimi
        </p>
        <h1 className="text-2xl font-bold tracking-[-0.03em] text-[var(--text-primary)] sm:text-3xl">
          Programlar
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm text-[var(--text-secondary)]">
          Bootcamp, gönüllü proje ve network etkinliklerini tek bir panoda takip et.
        </p>
      </div>

      <OpportunitiesBoard />
    </section>
  )
}
