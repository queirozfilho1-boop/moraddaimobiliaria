import { supabase } from './supabase'

const LOGO_URL = 'https://mvzjqktgnwjwuinnxxcc.supabase.co/storage/v1/object/public/assets/logo-watermark.png'
const WATERMARK_OPACITY = 0.20
const WATERMARK_RATIO = 0.30

/**
 * Gera thumbnail local via Canvas (rápido, sem API externa)
 */
function generateThumb(img: HTMLImageElement): Promise<Blob> {
  const THUMB_W = 600
  const THUMB_H = 450
  const canvas = document.createElement('canvas')
  canvas.width = THUMB_W
  canvas.height = THUMB_H
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  // Crop centralizado (cover)
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
    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.85)
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

/**
 * Upload foto + marca d'água via QuickChart + thumbnail local
 */
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
    if (uploadError) throw uploadError

    const { data: origData } = supabase.storage.from('imoveis').getPublicUrl(origPath)
    const originalUrl = origData.publicUrl

    // 2. Marca d'água via QuickChart (1 chamada só)
    const wmApiUrl = `https://quickchart.io/watermark?` +
      `mainImageUrl=${encodeURIComponent(originalUrl)}` +
      `&markImageUrl=${encodeURIComponent(LOGO_URL)}` +
      `&opacity=${WATERMARK_OPACITY}` +
      `&position=center` +
      `&markRatio=${WATERMARK_RATIO}`

    const wmResponse = await fetch(wmApiUrl)
    if (!wmResponse.ok) throw new Error('Erro ao gerar marca d\'água')
    const wmBlob = await wmResponse.blob()

    const wmPath = `${imovelId}/watermark/${ts}-${index}.jpg`
    const { error: wmErr } = await supabase.storage
      .from('imoveis')
      .upload(wmPath, wmBlob, { contentType: 'image/jpeg', upsert: true })
    if (wmErr) throw wmErr

    const { data: wmData } = supabase.storage.from('imoveis').getPublicUrl(wmPath)

    // 3. Thumbnail local (instantâneo, sem API)
    const imgEl = await loadImage(originalUrl)
    const thumbBlob = await generateThumb(imgEl)

    const thumbPath = `${imovelId}/thumb/${ts}-${index}.jpg`
    const { error: thErr } = await supabase.storage
      .from('imoveis')
      .upload(thumbPath, thumbBlob, { contentType: 'image/jpeg', upsert: true })
    if (thErr) throw thErr

    const { data: thumbData } = supabase.storage.from('imoveis').getPublicUrl(thumbPath)

    return {
      url: originalUrl,
      url_watermark: wmData.publicUrl,
      url_thumb: thumbData.publicUrl,
    }
  } catch (err) {
    console.error(`Erro foto ${index + 1}:`, err)
    return null
  }
}
