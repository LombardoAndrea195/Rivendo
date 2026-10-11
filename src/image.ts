const MAX_SIDE = 1280

export async function fileToResizedDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.85)
}

export function splitDataUrl(dataUrl: string) {
  const [head, data] = dataUrl.split(',')
  const mime = head.slice(5, head.indexOf(';'))
  return { mime, data }
}
