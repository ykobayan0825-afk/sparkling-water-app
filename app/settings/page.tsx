'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'


type Settings = {
  id: string
  name: string
  case_size: number
  order_cycle_days: number
  lead_days: number
  safety_stock: number
  next_order_date: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchSettings = async () => {
    const res = await fetch('/api/settings')
    const json = await res.json()

    if (res.ok) {
      setSettings(json.settings)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const updateSettings = async () => {
    if (!settings) return

    try {
      setLoading(true)
      setMessage('')

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      const json = await res.json()

      if (!res.ok) {
        setMessage(json.error || '更新に失敗しました')
        return
      }

      setMessage('設定を保存しました')
    } catch {
      setMessage('更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (!settings) {
    return <div className="p-4">読み込み中...</div>
  }

  return (
    <main className="mx-auto min-h-screen max-w-md bg-gray-50 p-4">
      <div className="mb-4 flex items-center justify-between">
  <Link
    href="/"
    className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-700 shadow-sm"
  >
    ← 戻る
  </Link>

  <h1 className="text-xl font-bold">設定</h1>

  <div className="w-[60px]" /> {/* 右側の余白調整 */}
</div>

      <div className="space-y-4 rounded-2xl bg-white p-4 shadow">
        <div>
          <label className="text-sm text-gray-600">商品名</label>
          <input
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={settings.name}
            onChange={(e) =>
              setSettings({ ...settings, name: e.target.value })
            }
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">ケース本数</label>
          <input
            type="number"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={settings.case_size}
            onChange={(e) =>
              setSettings({
                ...settings,
                case_size: Number(e.target.value),
              })
            }
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">発注周期（日）</label>
          <input
            type="number"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={settings.order_cycle_days}
            onChange={(e) =>
              setSettings({
                ...settings,
                order_cycle_days: Number(e.target.value),
              })
            }
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">締切までの日数</label>
          <input
            type="number"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={settings.lead_days}
            onChange={(e) =>
              setSettings({
                ...settings,
                lead_days: Number(e.target.value),
              })
            }
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">安全在庫</label>
          <input
            type="number"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={settings.safety_stock}
            onChange={(e) =>
              setSettings({
                ...settings,
                safety_stock: Number(e.target.value),
              })
            }
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">次回配送日</label>
          <input
            type="date"
            className="mt-1 w-full rounded-lg border px-3 py-2"
            value={settings.next_order_date}
            onChange={(e) =>
              setSettings({
                ...settings,
                next_order_date: e.target.value,
              })
            }
          />
        </div>

        <button
          onClick={updateSettings}
          disabled={loading}
          className="w-full rounded-xl bg-blue-500 py-3 font-bold text-white disabled:opacity-50"
        >
          保存
        </button>

        {message && (
          <p className="text-center text-sm text-gray-600">{message}</p>
        )}
      </div>
    </main>
  )
}