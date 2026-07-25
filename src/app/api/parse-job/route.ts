import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL gerekli' }, { status: 400 })
  }

  try {
    // 1. URL'i fetch et
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      // 10 saniye zaman aşımı
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      throw new Error(`Sayfa yüklenemedi: ${response.statusText}`)
    }

    const html = await response.text()

    // 2. Title etiketini bul
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (!titleMatch || !titleMatch[1]) {
      return NextResponse.json({ error: 'Başlık bulunamadı' }, { status: 404 })
    }

    // HTML entity'leri temizle (basit seviyede)
    let rawTitle = titleMatch[1]
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim()

    let companyName = ''
    let position = ''
    let postedDate = ''

    // Tarihi JSON-LD veya meta etiketlerinden çekmeyi deneyelim
    const dateMatch = html.match(/"datePosted"\s*:\s*"([^"]+)"/i)
    const timeMatch = html.match(/<time[^>]+datetime=["']([^"']+)["']/i)
    const metaDateMatch = html.match(/<meta[^>]+(?:name|property)=["'](?:datePosted|article:published_time)["'][^>]+content=["']([^"']+)["']/i)

    let rawDate = ''
    if (dateMatch && dateMatch[1]) rawDate = dateMatch[1]
    else if (timeMatch && timeMatch[1]) rawDate = timeMatch[1]
    else if (metaDateMatch && metaDateMatch[1]) rawDate = metaDateMatch[1]

    if (rawDate) {
      // Sadece YYYY-MM-DD kısmını alalım (T veya boşluktan öncesi)
      postedDate = rawDate.split('T')[0].split(' ')[0]
    }

    // 3. LinkedIn formatı: 
    // - "Pozisyon Adı at Şirket Adı | LinkedIn"
    // - "Şirket Adı şirketi ... konumunda Pozisyon Adı işe alacak | LinkedIn" (Türkçe)
    if (url.includes('linkedin.com/jobs')) {
      const cleanTitle = rawTitle.replace(/\s*\|\s*LinkedIn.*$/i, '')
      
      // Türkçe Format Kontrolü (örn: "DenizBank şirketi İstanbul, Türkiye konumunda Business Analyst işe alacak")
      const trMatch = cleanTitle.match(/^(.*?)\s+şirketi\s+.*?\s+konumunda\s+(.*?)\s+işe alacak/i)
      if (trMatch) {
        companyName = trMatch[1].trim()
        position = trMatch[2].trim()
      } 
      // " at " veya " - " ile ayıralım
      else if (cleanTitle.includes(' at ')) {
        const parts = cleanTitle.split(' at ')
        position = parts[0].trim()
        companyName = parts[1].trim()
      } else if (cleanTitle.includes(' - ')) {
        const parts = cleanTitle.split(' - ')
        position = parts[0].trim()
        companyName = parts[1].trim()
      } else {
        position = cleanTitle
      }
    } 
    // Kariyer.net formatı: "Şirket Adı - Pozisyon Adı İş İlanı" veya tam tersi
    else if (url.includes('kariyer.net')) {
      const cleanTitle = rawTitle.replace(/\s*İş İlanları.*$/i, '').replace(/\s*İş İlanı.*$/i, '')
      if (cleanTitle.includes(' - ')) {
        const parts = cleanTitle.split(' - ')
        companyName = parts[0].trim()
        position = parts[1].trim()
      } else {
        position = cleanTitle
      }
    }
    // Indeed formatı: "Pozisyon Adı - Lokasyon - Şirket Adı - Indeed.com"
    else if (url.includes('indeed.com')) {
      const cleanTitle = rawTitle.replace(/\s*-\s*Indeed\.com.*$/i, '')
      const parts = cleanTitle.split(' - ')
      if (parts.length >= 2) {
        position = parts[0].trim()
        // Son parça genellikle şirket adıdır (ortada lokasyon olabilir)
        companyName = parts[parts.length - 1].trim()
      } else {
        position = cleanTitle
      }
    }
    // Genel Format "Pozisyon - Şirket" veya "Şirket - Pozisyon"
    else {
      if (rawTitle.includes(' - ')) {
        const parts = rawTitle.split(' - ')
        position = parts[0].trim()
        companyName = parts[1].trim()
      } else if (rawTitle.includes(' | ')) {
        const parts = rawTitle.split(' | ')
        position = parts[0].trim()
        companyName = parts[1].trim()
      } else {
        position = rawTitle
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        company_name: companyName || '',
        position: position || rawTitle,
        posted_date: postedDate || ''
      }
    })

  } catch (error: any) {
    console.error('URL parse error:', error)
    return NextResponse.json(
      { error: 'Bilgiler çekilirken bir hata oluştu' },
      { status: 500 }
    )
  }
}
