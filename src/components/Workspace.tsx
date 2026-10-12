import { useEffect, useRef, useState } from 'react'
import type { User } from '../firebase'
import { deleteItem, loadItems, loadRemoteSettings, saveItem, saveRemoteSettings } from '../db'
import { demoItems } from '../demo'
import { loadSettings, mergeSettings, saveSettings, type Settings } from '../settings'
import { newItem, type Item } from '../types'
import Dashboard from './Dashboard'
import Inventory from './Inventory'
import ItemEditor from './ItemEditor'
import SettingsView from './SettingsView'
import UserMenu from './UserMenu'

type View = 'inventory' | 'dashboard' | 'settings'

const NAV: { id: View; label: string }[] = [
  { id: 'inventory', label: 'Inventario' },
  { id: 'dashboard', label: 'Andamento' },
  { id: 'settings', label: 'Impostazioni' },
]

const byNewest = (list: Item[]) => list.sort((a, b) => b.createdAt - a.createdAt)
const message = (e: unknown) => (e instanceof Error ? e.message : 'Errore imprevisto')

interface Props {
  user: User
  onSignOut: () => Promise<void>
  initialView?: View
}

export default function Workspace({ user, onSignOut, initialView = 'inventory' }: Props) {
  const [items, setItems] = useState<Item[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [settings, setSettings] = useState<Settings>(() => loadSettings(user.uid))
  const [view, setView] = useState<View>(initialView)
  const [editing, setEditing] = useState<{ item: Item; isNew: boolean } | null>(null)
  const settingsTimer = useRef<number | undefined>(undefined)

  const reload = async () => {
    setLoadError('')
    try {
      setItems(byNewest(await loadItems()))
    } catch (e) {
      setLoadError(message(e))
    }
  }

  useEffect(() => {
    let alive = true
    loadItems()
      .then((list) => alive && setItems(byNewest(list)))
      .catch((e) => alive && setLoadError(message(e)))
    loadRemoteSettings()
      .then((remote) => {
        if (!alive || !remote) return
        setSettings((local) => {
          const merged = mergeSettings(remote, local.apiKey)
          saveSettings(merged, user.uid)
          return merged
        })
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [user.uid])

  const updateSettings = (s: Settings) => {
    setSettings(s)
    saveSettings(s, user.uid)
    window.clearTimeout(settingsTimer.current)
    settingsTimer.current = window.setTimeout(() => saveRemoteSettings(s).catch(() => {}), 600)
  }

  const upsert = async (item: Item) => {
    const saved = await saveItem({ ...item, updatedAt: Date.now() })
    setItems((prev) => {
      const list = prev ?? []
      return list.some((i) => i.id === saved.id) ? list.map((i) => (i.id === saved.id ? saved : i)) : [saved, ...list]
    })
    return saved
  }

  const remove = async (id: string) => {
    await deleteItem(id)
    setItems((prev) => prev?.filter((i) => i.id !== id) ?? null)
  }

  const open = (item: Item) => setEditing({ item, isNew: false })
  const create = () => setEditing({ item: newItem(), isNew: true })

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden>
            R
          </span>
          Rivendo
        </div>
        <nav className="tabs" aria-label="Sezioni">
          {NAV.map((n) => (
            <button key={n.id} className="tab" aria-current={view === n.id ? 'page' : undefined} onClick={() => setView(n.id)}>
              {n.label}
            </button>
          ))}
        </nav>
        <div className="topbar-end">
          <button className="btn btn-primary topbar-cta" onClick={create}>
            <span aria-hidden>+</span> Nuovo oggetto
          </button>
          <UserMenu user={user} onSettings={() => setView('settings')} onSignOut={() => onSignOut()} />
        </div>
      </header>

      <main className="content">
        {loadError ? (
          <div className="empty">
            <h1>Non riesco a caricare i tuoi dati</h1>
            <p className="muted">{loadError}</p>
            <button className="btn btn-primary" onClick={reload}>
              Riprova
            </button>
          </div>
        ) : items == null ? (
          <p className="muted">Caricamento…</p>
        ) : view === 'inventory' ? (
          <Inventory
            items={items}
            settings={settings}
            onOpen={open}
            onCreate={create}
            onDemo={async () => {
              await Promise.all(demoItems().map(saveItem))
              await reload()
            }}
          />
        ) : view === 'dashboard' ? (
          <Dashboard items={items} settings={settings} onOpen={open} />
        ) : (
          <SettingsView settings={settings} onChange={updateSettings} items={items} user={user} onSignOut={onSignOut} onImported={reload} />
        )}
      </main>

      <button className="fab" onClick={create} aria-label="Nuovo oggetto">
        +
      </button>

      {editing && (
        <ItemEditor
          key={editing.item.id}
          initial={editing.item}
          isNew={editing.isNew}
          settings={settings}
          onClose={() => setEditing(null)}
          onSave={async (item) => {
            await upsert(item)
            setEditing(null)
          }}
          onAutoSave={upsert}
          onDelete={async (id) => {
            await remove(id)
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}
