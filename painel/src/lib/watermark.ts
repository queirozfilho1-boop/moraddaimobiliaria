import { supabase } from './supabase'

const LOGO_URL = 'https://mvzjqktgnwjwuinnxxcc.supabase.co/storage/v1/object/public/assets/logo-watermark.png'
const WATERMARK_OPACITY = 0.20
const WATERMARK_RATIO = 0.30

function convertToWebP(blob: Blob, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0)
      canvas.toBlob((webpBlob) => {
        if (webpBlob) resolve(webpBlob)
        else reject(new Error('WebP conversion failed'))
      }, 'image/webp', quality)
    }
    img.onerror = reject
    img.src = URL.createObjectURL(blob)
  })
}

function generateThumb(img: HTMLImageElement): Promise<Blob> {
  const THUMB_W = 600
  const THUMB_H = 450
  const canvas = document.createElement('canvas')
  canvas.width = THUMB_W
  canvas.height = THUMB_H
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  const srcRatio = img.naturalWidth / img.naturalHeight
  const destRatio = THUMB_W / THUMB_H
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight
  if (srcRatio > destRatio) {
    sw = Math.round(sh * destRatio)
    sx = Math.round((img.naturalWidth - sw) / 2)
  } else {
    sh = Math.round(sw / destRatio)
    sy = Math.round((img.naturalHeight - sh) / 2)
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, THUMB_W, THUMB_H)

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/webp', 0.80)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export async function uploadFotoComWatermark(
  file: File,
  imovelId: string,
  index: number
): Promise<{
  url: string
  url_watermark: string
  url_thumb: string
} | null> {
  const ts = Date.now()
  const ext = file.name.split('.').pop() || 'jpg'

  try {
    // 1. Upload original
    const origPath = `${imovelId}/original/${ts}-${index}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('imoveis')
      .upload(origPath, file, { contentType: file.type, upsert: true })
    if (uploadError) {
      console.error('Erro upload original:', uploadError)
      throw uploadError
    }

    const { data: origData } = supabase.storage.from('imoveis').getPublicUrl(origPath)
    const originalUrl = origData.publicUrl

    let wmPublicUrl = originalUrl // fallback: usar original se marca d'água falhar
    let thumbPublicUrl = originalUrl

    // 2. Tentar marca d'água via QuickChart
    try {
      const wmApiUrl = `https://quickchart.io/watermark?` +
        `mainImageUrl=${encodeURIComponent(originalUrl)}` +
        `&markImageUrl=${encodeURIComponent(LOGO_URL)}` +
        `&opacity=${WATERMARK_OPACITY}` +
        `&position=center` +
        `&markRatio=${WATERMARK_RATIO}`

      const wmResponse = await fetch(wmApiUrl)
      if (wmResponse.ok) {
        const wmJpegBlob = await wmResponse.blob()
        // Converter para WebP
        let wmBlob: Blob
        try {
          wmBlob = await convertToWebP(wmJpegBlob, 0.88)
        } catch {
          wmBlob = wmJpegBlob // fallback: usar JPEG se WebP falhar
        }

        const wmPath = `${imovelId}/watermark/${ts}-${index}.webp`
        const { error: wmErr } = await supabase.storage
          .from('imoveis')
          .upload(wmPath, wmBlob, { contentType: wmBlob.type === 'image/webp' ? 'image/webp' : 'image/jpeg', upsert: true })

        if (!wmErr) {
          const { data: wmData } = supabase.storage.from('imoveis').getPublicUrl(wmPath)
          wmPublicUrl = wmData.publicUrl
        } else {
          console.warn('Erro upload marca d\'água, usando original:', wmErr)
        }
      } else {
        console.warn('QuickChart falhou, usando foto original sem marca d\'água')
      }
    } catch (wmError) {
      console.warn('Marca d\'água indisponível, usando foto original:', wmError)
    }

    // 3. Gerar thumbnail
    try {
      const imgEl = await loadImage(originalUrl)
      const thumbBlob = await generateThumb(imgEl)

      const thumbPath = `${imovelId}/thumb/${ts}-${index}.webp`
      const { error: thErr } = await supabase.storage
        .from('imoveis')
        .upload(thumbPath, thumbBlob, { contentType: 'image/webp', upsert: true })

      if (!thErr) {
        const { data: thumbData } = supabase.storage.from('imoveis').getPublicUrl(thumbPath)
        thumbPublicUrl = thumbData.publicUrl
      }
    } catch (thumbError) {
      console.warn('Erro gerando thumbnail, usando original:', thumbError)
    }

    return {
      url: originalUrl,
      url_watermark: wmPublicUrl,
      url_thumb: thumbPublicUrl,
    }
  } catch (err) {
    console.error(`Erro fatal foto ${index + 1}:`, err)
    return null
  }
}
