import { NextResponse } from 'next/server'

// URL slug'ından isim çıkaran yardımcı fonksiyon (örn: seda-ozberk-1234 -> Seda Ozberk)
function formatSlugToName(slug: string): string {
  // Rastgele ID numaralarını temizle (örn: seda-ozberk-88b14a275 veya seda-ozberk-123456)
  let cleanSlug = slug
    .replace(/-[a-f0-9]{7,}$/i, '')
    .replace(/-\d{5,}$/i, '')
    
  const words = cleanSlug.split('-').filter(Boolean)
  
  const formattedWords = words.map(word => {
    if (!word) return ''
    const firstChar = word.charAt(0).toUpperCase()
    const rest = word.slice(1).toLowerCase()
    return firstChar + rest
  })

  return formattedWords.join(' ')
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Lütfen geçerli bir LinkedIn profil linki girin.' }, { status: 400 })
  }

  // URL'den profil slug'ını yakala (örn: https://www.linkedin.com/in/seda-ozberk/)
  let slug = ''
  const inMatch = url.match(/\/in\/([^\/\?#]+)/i)
  if (inMatch && inMatch[1]) {
    slug = inMatch[1]
  }

  let extractedName = slug ? formatSlugToName(slug) : ''
  let extractedRole = ''

  try {
    // Tarayıcı taklidi ile HTML fetch dene
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: AbortSignal.timeout(5000)
    })

    if (response.ok) {
      const html = await response.text()

      // Meta og:title veya <title> etiketlerini tara
      const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)

      let rawTitle = ogTitleMatch ? ogTitleMatch[1] : titleMatch ? titleMatch[1] : ''

      if (
        rawTitle && 
        !rawTitle.toLowerCase().includes('authwall') && 
        !rawTitle.toLowerCase().includes('sign in') && 
        !rawTitle.toLowerCase().includes('giriş')
      ) {
        rawTitle = rawTitle
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s*\|\s*LinkedIn.*$/i, '')
          .trim()

        if (rawTitle.includes(' - ')) {
          const parts = rawTitle.split(' - ').map(p => p.trim())
          if (parts[0]) extractedName = parts[0]
          if (parts.length >= 2) extractedRole = parts.slice(1).join(' - ')
        } else {
          if (rawTitle) extractedName = rawTitle
        }
      }
    }
  } catch (err) {
    // Fetch LinkedIn engelini aşamadığında hata fırlatmak yerine slug'dan elde edilen ismi kullanır
    console.log('LinkedIn fetch kısıtlandı veya zaman aşımına uğradı. Slug ayrıştırması kullanılıyor.')
  }

  // İsim bulunduysa (slug veya title üzerinden) başarılı dön!
  if (extractedName) {
    return NextResponse.json({
      success: true,
      data: {
        name: extractedName,
        role: extractedRole,
      }
    })
  }

  return NextResponse.json({
    error: 'LinkedIn profil bilgileri çekilemedi. Lütfen manuel giriniz.'
  }, { status: 404 })
}
