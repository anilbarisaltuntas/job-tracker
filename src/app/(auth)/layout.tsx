/**
 * AUTH LAYOUT
 * 
 * Login ve Register sayfalarını saran layout.
 * Ortalanmış, dekoratif arka planlı sayfa çerçevesi sağlar.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      {/* Dekoratif gradient blob'lar */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-indigo-500/8 blur-[100px]" />
        <div className="absolute top-1/3 -left-20 h-72 w-72 rounded-full bg-violet-500/6 blur-[80px]" />
        <div className="absolute -bottom-32 right-1/3 h-80 w-80 rounded-full bg-indigo-500/5 blur-[90px]" />
      </div>

      {/* Sayfa içeriği */}
      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        {children}
      </div>
    </div>
  )
}
