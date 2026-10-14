import { useEffect, useRef } from 'react'

// Configura gli id degli spazi con VITE_AD_SLOT_* (su Render: Environment).
// Senza configurazione viene mostrato un segnaposto, utile per vedere dove andranno i banner.
// Lo script AdSense è caricato in index.html, con lo stesso codice editore.
const CLIENT = (import.meta.env.VITE_ADSENSE_CLIENT as string | undefined) || 'ca-pub-7576464672691797'

declare global {
  interface Window {
    adsbygoogle?: unknown[]
  }
}

export default function AdSlot({ slot, className = '' }: { slot?: string; className?: string }) {
  const ref = useRef<HTMLModElement>(null)
  const active = Boolean(CLIENT && slot)

  useEffect(() => {
    if (!active || ref.current?.dataset.adsbygoogleStatus) return
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
