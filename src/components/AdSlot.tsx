import { useEffect, useRef } from 'react'

// Configura in .env.production.local: VITE_ADSENSE_CLIENT (ca-pub-…) e gli id degli spazi VITE_AD_SLOT_*.
// Senza configurazione viene mostrato un segnaposto, utile per vedere dove andranno i banner.
const CLIENT = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

let scriptAdded = false

function loadScript() {
  if (scriptAdded || !CLIENT) return
  scriptAdded = true
  const s = document.createElement('script')
  s.async = true
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`
  s.crossOrigin = 'anonymous'
  document.head.appendChild(s)
}

export default function AdSlot({ slot, className = '' }: { slot?: string; className?: string }) {
  const ref = useRef<HTMLModElement>(null)
  const active = Boolean(CLIENT && slot)

  useEffect(() => {
    if (!active || ref.current?.dataset.adsbygoogleStatus) return
    loadScript()
    ;(window.adsbygoogle ??= []).push({})
  }, [active])

  return (
    <aside className={`ad-slot ${className}`} aria-label="Pubblicità">
      {active ? (
        <ins
          ref={ref}
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={CLIENT}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <span className="ad-placeholder">Spazio pubblicitario</span>
      )}
    </aside>
  )
}
