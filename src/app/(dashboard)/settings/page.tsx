'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserStatus } from '@/lib/types'
import { useStatuses } from '@/hooks/useStatuses'
import Header from '@/components/layout/Header'

export default function SettingsPage() {
  const { statuses, setStatuses, loading, fetchStatuses } = useStatuses()
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const supabase = createClient()

  const handleAddStatus = () => {
    if (statuses.length >= 8) {
      setMessage({ type: 'error', text: 'Maksimum 8 statü oluşturabilirsiniz.' })
      return
    }
    
    // Add a temporary local status (will get real UUID on save if we let DB handle it,
    // but here we generate a random string ID for frontend tracking until saved)
    const newStatus: UserStatus = {
      id: crypto.randomUUID(),
      user_id: statuses.length > 0 ? statuses[0].user_id : '',
      title: 'Yeni Statü',
      emoji: '📌',
      color: '#3B82F6',
      bg_color: '#EFF6FF',
      order_index: statuses.length
    }
    setStatuses([...statuses, newStatus])
  }

  const handleDeleteStatus = async (id: string) => {
    // Check if any applications are using this status
    const { count } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', id)
      
    if (count && count > 0) {
      setMessage({ type: 'error', text: `Bu statüde ${count} adet başvuru bulunuyor. Lütfen önce o başvuruları başka statüye taşıyın.` })
      return
    }

    setStatuses(statuses.filter(s => s.id !== id))
  }

  const handleChange = (index: number, field: keyof UserStatus, value: string) => {
    const updated = [...statuses]
    updated[index] = { ...updated[index], [field]: value }
    setStatuses(updated)
  }

  const moveUp = (index: number) => {
    if (index === 0) return
    const updated = [...statuses]
    const temp = updated[index - 1]
    updated[index - 1] = updated[index]
    updated[index] = temp
    setStatuses(updated)
  }

  const moveDown = (index: number) => {
    if (index === statuses.length - 1) return
    const updated = [...statuses]
    const temp = updated[index + 1]
    updated[index + 1] = updated[index]
    updated[index] = temp
    setStatuses(updated)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)
    
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    
    if (!userId) {
      setIsSaving(false)
      return
    }

    // Re-assign correct order_index and user_id before saving
    const statusesToSave = statuses.map((s, idx) => ({
      id: s.id,
      user_id: userId,
      title: s.title,
      emoji: s.emoji,
      color: s.color,
      bg_color: s.bg_color,
      order_index: idx
    }))

    // Upsert works best if we also clean up deleted statuses.
    // Easiest approach: Delete all current user statuses, then insert all.
    // Wait! Deleting will trigger ON DELETE CASCADE if we had foreign keys. But applications don't strictly have a foreign key to user_statuses, it's just TEXT.
    // Even better, we can just upsert. But upsert doesn't delete removed items.
    // So we first fetch existing IDs, find what to delete, and delete them.
    
    const currentIds = statusesToSave.map(s => s.id)
    
    if (currentIds.length > 0) {
      // Delete removed ones
      await supabase
        .from('user_statuses')
        .delete()
        .eq('user_id', userId)
        .not('id', 'in', `(${currentIds.map(i => `"${i}"`).join(',')})`)
    } else {
      // If none left, delete all
      await supabase
        .from('user_statuses')
        .delete()
        .eq('user_id', userId)
    }

    // Upsert the rest
    if (statusesToSave.length > 0) {
      const { error } = await supabase
        .from('user_statuses')
        .upsert(statusesToSave)

      if (error) {
        console.error(error)
        setMessage({ type: 'error', text: 'Kaydedilirken bir hata oluştu.' })
      } else {
        setMessage({ type: 'success', text: 'Statüler başarıyla kaydedildi!' })
        fetchStatuses() // refresh data
      }
    } else {
        setMessage({ type: 'success', text: 'Tüm statüler silindi!' })
        fetchStatuses()
    }
    
    setIsSaving(false)
  }

  if (loading) {
    return <div className="p-8 text-slate-500">Yükleniyor...</div>
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-4xl space-y-6">
        
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Sütun Ayarları</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Panoda görünecek statüleri ve sütun sıralamalarını buradan yönetebilirsiniz.
          </p>
        </div>

        {message && (
          <div className={`rounded-xl p-4 text-sm font-medium ${message.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
            {message.text}
          </div>
        )}

        <div className="rounded-2xl border p-6" style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border)' }}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Kanban Statüleri</h2>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Panoda görünecek sütunları kendinize göre özelleştirin (Maksimum 8 adet).
              </p>
            </div>
            <button
              onClick={handleAddStatus}
              disabled={statuses.length >= 8}
              className="rounded-xl px-4 py-2 text-sm font-medium transition-all disabled:opacity-50"
              style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              + Yeni Statü Ekle
            </button>
          </div>

          <div className="space-y-3">
            {statuses.map((status, index) => (
              <div key={status.id} className="flex items-center gap-3 rounded-xl border p-3 transition-colors" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg)' }}>
                
                {/* Sıralama Okları */}
                <div className="flex flex-col gap-1">
                  <button onClick={() => moveUp(index)} disabled={index === 0} className="text-slate-400 hover:text-blue-500 disabled:opacity-30">▲</button>
                  <button onClick={() => moveDown(index)} disabled={index === statuses.length - 1} className="text-slate-400 hover:text-blue-500 disabled:opacity-30">▼</button>
                </div>

                {/* Emoji Seçici */}
                <input 
                  type="text" 
                  value={status.emoji} 
                  onChange={(e) => handleChange(index, 'emoji', e.target.value)}
                  className="w-12 rounded-lg bg-transparent text-center text-xl outline-none"
                  maxLength={2}
                />

                {/* Statü Adı */}
                <input 
                  type="text" 
                  value={status.title} 
                  onChange={(e) => handleChange(index, 'title', e.target.value)}
                  className="flex-1 bg-transparent px-2 py-1 text-sm font-medium outline-none"
                  style={{ color: 'var(--text-primary)' }}
                  placeholder="Statü Adı"
                />


                {/* Sil Butonu */}
                <button 
                  onClick={() => handleDeleteStatus(status.id)}
                  className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg text-red-500 hover:bg-red-500/10"
                  title="Statüyü Sil"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-xl px-6 py-2.5 text-sm font-medium transition-all disabled:opacity-50"
              style={{ backgroundColor: 'var(--btn-primary-bg)', color: 'var(--btn-primary-text)' }}
            >
              {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>

        </div>
      </div>
    </div>
  </div>
  )
}
