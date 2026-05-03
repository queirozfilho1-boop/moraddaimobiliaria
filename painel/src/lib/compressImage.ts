// Comprime imagem no client: redimensiona para max 1600px no maior lado
// e converte para WebP (qualidade 0.85). WebP comprime ~30% melhor que JPEG.

export interface CompressOptions {
  maxDimension?: number  // default 1600
  quality?: number       // default 0.85 (0..1)
  mimeType?: 'image/webp' | 'image/jpeg'  // default webp
}

export async function compressImage(file: File, opts: CompressOptions = {}): Promise<File> {
  const max = opts.maxDimension ?? 1600
  const quality = opts.quality ?? 0.85
  const mime = opts.mimeType ?? 'image/webp'
  const ext = mime === 'image/webp' ? 'webp' : 'jpg'

  if (!file.type.startsWith('image/')) return file

  const dataUrl = await new Promise<string>((res, rej) => {
    const reader = new FileReader()
    reader.onload = () => res(reader.result as string)
    reader.onerror = () => rej(new Error('Falha ao ler arquivo'))
    reader.readAsDataURL(file)
  })

  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image()
    i.onload = () => res(i)
    i.onerror = () => rej(new Error('Falha ao decodificar imagem'))
    i.src = dataUrl
  })

  let w = img.naturalWidth
  let h = img.naturalHeight
  if (w > max || h > max) {
    if (w > h) { h = Math.round(h * max / w); w = max }
    else { w = Math.round(w * max / h); h = max }
  }

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)

  const blob: Blob = await new Promise((res, rej) => {
    canvas.toBlob((b) => b ? res(b) : rej(new Error('toBlob falhou')), mime, quality)
  })

  const baseName = file.name.replace(/\.[^.]+$/, '')
  return new File([blob], `${baseName}.${ext}`, { type: mime })
}
