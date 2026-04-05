import { supabase } from './supabase'

const LOGO_URL = 'https://mvzjqktgnwjwuinnxxcc.supabase.co/storage/v1/object/public/assets/logo-watermark.png'
const WATERMARK_OPACITY = 0.20
const WATERMARK_RATIO = 0.30

/**
 * Converte qualquer imagem (Blob/File) para WebP via Canvas
 */
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
      canvas.toBlob(
        (webpBlob) => resolve(webpBlob!),
        'image/webp',
        quality
      )
    }
    img.onerror = reject
    img.src = URL.createObjectURL(blob)
  })
}

/**
 * Gera thumbnail local via Canvas em WebP
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

/**
 * Upload foto + marca d'água via QuickChart + conversão WebP + thumbnail
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
    // 1. Upload original (mantém formato original)
    const origPath = `${imovelId}/original/${ts}-${index}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('imoveis')
      .upload(origPath, file, { contentType: file.type, upsert: true })
    if (uploadError) throw uploadError

    const { data: origData } = supabase.storage.from('imoveis').getPublicUrl(origPath)
    const originalUrl = origData.publicUrl

    // 2. Marca d'água via QuickChart
    const wmApiUrl = `https://quickchart.io/watermark?` +
      `mainImageUrl=${encodeURIComponent(originalUrl)}` +
      `&markImageUrl=${encodeURIComponent(LOGO_URL)}` +
      `&opacity=${WATERMARK_OPACITY}` +
      `&position=center` +
      `&markRatio=${WATERMARK_RATIO}`

    const wmResponse = await fetch(wmApiUrl)
    if (!wmResponse.ok) throw new Error('Erro ao gerar marca d\'água')
    const wmJpegBlob = await wmResponse.blob()

    // 3. Converter marca d'água para WebP
    const wmWebpBlob = await convertToWebP(wmJpegBlob, 0.88)

    const wmPath = `${imovelId}/watermark/${ts}-${index}.webp`
    const { error: wmErr } = await supabase.storage
      .from('imoveis')
      .upload(wmPath, wmWebpBlob, { contentType: 'image/webp', upsert: true })
    if (wmErr) throw wmErr

    const { data: wmData } = supabase.storage.from('imoveis').getPublicUrl(wmPath)

    // 4. Thumbnail em WebP (local, instantâneo)
    const imgEl = await loadImage(originalUrl)
    const thumbBlob = await generateThumb(imgEl)

    const thumbPath = `${imovelId}/thumb/${ts}-${index}.webp`
    const { error: thErr } = await supabase.storage
      .from('imoveis')
      .upload(thumbPath, thumbBlob, { contentType: 'image/webp', upsert: true })
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
