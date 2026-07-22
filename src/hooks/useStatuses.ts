import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UserStatus } from '@/lib/types'
import { KANBAN_COLUMNS } from '@/lib/constants'

export function useStatuses() {
  const [statuses, setStatuses] = useState<UserStatus[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchStatuses = useCallback(async () => {
    setLoading(true)
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    
    if (!userId) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('user_statuses')
      .select('*')
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Statüler yüklenirken hata:', error)
      setLoading(false)
      return
    }

    // Eğer kullanıcının hiç statüsü yoksa, varsayılanları (seeding) ekleyelim
    if (!data || data.length === 0) {
      const defaultStatuses: Omit<UserStatus, 'created_at'>[] = KANBAN_COLUMNS.map((col, idx) => ({
        id: col.id,
        user_id: userId,
        title: col.title,
        emoji: col.emoji,
        color: col.color,
        bg_color: col.bgColor,
        order_index: idx
      }))

      const { data: insertedData, error: insertError } = await supabase
        .from('user_statuses')
        .insert(defaultStatuses)
        .select()

      if (insertError) {
        console.error('Varsayılan statüler eklenirken hata:', insertError)
      } else if (insertedData) {
        setStatuses(insertedData.sort((a, b) => a.order_index - b.order_index))
      }
    } else {
      setStatuses(data)
    }
    
    setLoading(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchStatuses()
  }, [fetchStatuses])

  return { statuses, setStatuses, loading, fetchStatuses }
}
