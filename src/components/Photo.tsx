import type { ImgHTMLAttributes } from 'react'
import { usePhotoUrl } from '../photos'

export default function Photo({ path, alt = '', ...rest }: { path: string } & ImgHTMLAttributes<HTMLImageElement>) {
  const src = usePhotoUrl(path)
  return src ? <img src={src} alt={alt} {...rest} /> : <span className="photo-skeleton" aria-hidden />
}
