import SavedJobsList from '@/components/saved/SavedJobsList'
import Header from '@/components/layout/Header'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Kaydedilen İlanlar - JobTracker',
}

export default async function SavedJobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <SavedJobsList />
      </main>
    </div>
  )
}
