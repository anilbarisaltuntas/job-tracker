import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL gerekli' }, { status: 400 })
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      throw new Error(`Sayfa yüklenemedi: ${response.statusText}`)
    }

    const html = await response.text()

    // 1. Meta og:title veya <title> etiketini bul
    let rawTitle = ''
    const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)

    if (ogTitleMatch && ogTitleMatch[1]) {
      rawTitle = ogTitleMatch[1]
    } else if (titleMatch && titleMatch[1]) {
      rawTitle = titleMatch[1]
    }

    if (!rawTitle) {
      return NextResponse.json({ error: 'Profil başlığı bulunamadı' }, { status: 404 })
    }

    // HTML Entity temizleme
    rawTitle = rawTitle
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim()

    // "| LinkedIn" ekini temizle
    const cleanTitle = rawTitle.replace(/\s*\|\s*LinkedIn.*$/i, '').trim()

    let name = ''
    let role = ''

    // Örnek Formatlar:
    // "Seda Özberk - Talent Acquisition Partner - Yıldız Tech"
    // "Seda Özberk - Talent Acquisition Partner"
    if (cleanTitle.includes(' - ')) {
      const parts = cleanTitle.split(' - ').map(p => p.trim())
      name = parts[0]
      if (parts.length >= 2) {
        role = parts.slice(1).join(' - ')
      }
    } else if (cleanTitle.includes(' | ')) {
      const parts = cleanTitle.split(' | ').map(p => p.trim())
      name = parts[0]
      if (parts.length >= 2) role = parts[1]
    } else {
      name = cleanTitle
    }

    return NextResponse.json({
      success: true,
      data: {
        name: name || '',
        role: role || '',
      }
    })

  } catch (error: any) {
    console.error('LinkedIn contact parse error:', error)
    return NextResponse.json(
      { error: 'LinkedIn profil bilgileri çekilirken bir hata oluştu' },
      { status: 500 }
    )
  }
}
