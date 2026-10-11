import type { User } from '@supabase/supabase-js'
import { useEffect, useRef, useState } from 'react'

interface Props {
  user: User
  onSettings: () => void
  onSignOut: () => void
}

export default function UserMenu({ user, onSettings, onSignOut }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const name = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? 'Account'
  const avatar = user.user_metadata?.avatar_url as string | undefined

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="user-menu" ref={ref}>
      <button className="avatar" aria-label="Account" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {avatar ? <img src={avatar} alt="" referrerPolicy="no-referrer" /> : name.charAt(0).toUpperCase()}
      </button>
      {open && (
        <div className="menu" role="menu">
          <div className="menu-head">
            <strong>{name}</strong>
            {user.email && name !== user.email && <span className="muted small">{user.email}</span>}
          </div>
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onSettings()
            }}
          >
            Impostazioni
          </button>
          <button role="menuitem" className="menu-danger" onClick={onSignOut}>
            Esci
          </button>
        </div>
      )}
    </div>
  )
}
