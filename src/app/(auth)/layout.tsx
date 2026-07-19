/**
 * AUTH LAYOUT
 * 
 * Login ve Register sayfalarını saran layout.
 * Ortalanmış, güzel bir arka planlı sayfa çerçevesi sağlar.
 * Dashboard layout'undan farklı — sidebar/header yok.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      {/* Arka plandaki dekoratif elementler */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      {/* Sayfa içeriği (login veya register formu buraya gelir) */}
      <div className="relative z-10 w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
