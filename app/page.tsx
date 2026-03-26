'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Summary = {
  current_stock: number
  total_consumed: number
  days_count: number
  average_per_day: number
  required_bottles: number
  recommended_cases: number
  next_order_date?: string | null
  next_delivery_date?: string | null
  order_deadline_date?: string | null
  days_until_order_deadline?: number
  lead_days?: number
  order_cycle_days?: number
  case_size?: number
  estimated_days_until_out_of_stock?: number | null
}

type HistoryDay = {
  id?: string
  consumption_date: string
  quantity?: number
  total_quantity?: number
}

type HistoryDetail = {
  id: string
  consumption_date: string
  quantity: number
  created_at: string
}

export default function Home() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [history, setHistory] = useState<HistoryDay[]>([])
  const [detailsMap, setDetailsMap] = useState<Record<string, HistoryDetail[]>>({})
  const [openDate, setOpenDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [stockInput, setStockInput] = useState('')
  const [manualConsumeInput, setManualConsumeInput] = useState('1')
  const [manualRestockInput, setManualRestockInput] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
const [editingQuantity, setEditingQuantity] = useState('')

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-'
    return dateString.replaceAll('-', '/')
  }

const formatTime = (dateTimeString: string) => {
  if (!dateTimeString) return '-'

  const normalized = dateTimeString.includes('T')
    ? dateTimeString
    : dateTimeString.replace(' ', 'T')

  const utcString =
    /[zZ]$|[+-]\d{2}:\d{2}$/.test(normalized)
      ? normalized
      : `${normalized}Z`

  const d = new Date(utcString)

  if (Number.isNaN(d.getTime())) return '-'

  return new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(d)
}

  const getHistoryQuantity = (item: HistoryDay) => {
    if (typeof item.quantity === 'number') return item.quantity
    if (typeof item.total_quantity === 'number') return item.total_quantity
    return 0
  }

  const fetchSummary = async () => {
    try {
      const res = await fetch('/api/summary', { cache: 'no-store' })
      const json = await res.json()

      if (!res.ok) {
        console.error('summary error:', json)
        setMessage(json?.error || '発注の目安の取得に失敗しました')
        return
      }

      setSummary(json)

      if (json?.current_stock !== undefined && json?.current_stock !== null) {
        setStockInput(String(json.current_stock))
      }
    } catch (error) {
      console.error('summary fetch failed:', error)
      setMessage('発注の目安の取得に失敗しました')
    }
  }

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history', { cache: 'no-store' })
      const json = await res.json()

      if (!res.ok) {
        console.error('history error:', json)
        setMessage(json?.error || '履歴取得に失敗しました')
        return
      }

      setHistory(Array.isArray(json.history) ? json.history : [])
    } catch (error) {
      console.error('history fetch failed:', error)
      setMessage('履歴取得に失敗しました')
    }
  }

  const fetchDetails = async (date: string) => {
    try {
      const res = await fetch(`/api/history/detail?date=${date}`, {
        cache: 'no-store',
      })
      const json = await res.json()

      if (!res.ok) {
        console.error('detail error:', json)
        setMessage(json?.error || '履歴明細の取得に失敗しました')
        return
      }

      setDetailsMap((prev) => ({
        ...prev,
        [date]: Array.isArray(json.details) ? json.details : [],
      }))
    } catch (error) {
      console.error('detail fetch failed:', error)
      setMessage('履歴明細の取得に失敗しました')
    }
  }

  const refreshAll = async () => {
    await Promise.all([fetchSummary(), fetchHistory()])
  }

  const consume = async (quantity: number) => {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setMessage('消費本数を正しく入力してください')
      return
    }

    try {
      setLoading(true)
      setMessage('')

      const res = await fetch('/api/consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      })

      const json = await res.json()

      if (!res.ok) {
        setMessage(json?.error || '消費登録に失敗しました')
        return
      }

      setMessage(`${quantity}本消費しました`)
      await refreshAll()

      if (openDate) {
        await fetchDetails(openDate)
      }

      setManualConsumeInput('1')
    } catch (error) {
      console.error('consume failed:', error)
      setMessage('消費登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const restock = async (caseCount: number) => {
    if (!Number.isFinite(caseCount) || caseCount <= 0) {
      setMessage('ケース数を正しく入力してください')
      return
    }

    try {
      setLoading(true)
      setMessage('')

      const res = await fetch('/api/restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseCount }),
      })

      const json = await res.json()

      if (!res.ok) {
        setMessage(json?.error || 'ケース追加に失敗しました')
        return
      }

      setMessage(`${caseCount}ケース追加しました`)
      await refreshAll()
      setManualRestockInput('')
    } catch (error) {
      console.error('restock failed:', error)
      setMessage('ケース追加に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const updateCurrentStock = async () => {
    const currentStock = Number(stockInput)

    if (!Number.isFinite(currentStock) || currentStock < 0) {
      setMessage('現在在庫を正しく入力してください')
      return
    }

    try {
      setLoading(true)
      setMessage('')

      const res = await fetch('/api/inventory/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentStock }),
      })

      const json = await res.json()

      if (!res.ok) {
        setMessage(json?.error || '現在在庫の更新に失敗しました')
        return
      }

      setMessage('現在在庫を更新しました')
      await refreshAll()
    } catch (error) {
      console.error('update stock failed:', error)
      setMessage('現在在庫の更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const deleteHistory = async (id: string) => {
    try {
      setLoading(true)
      setMessage('')

      const res = await fetch('/api/history/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      const json = await res.json()

      if (!res.ok) {
        setMessage(json?.error || '削除に失敗しました')
        return
      }

      setMessage('削除しました')
      await refreshAll()

      if (openDate) {
        await fetchDetails(openDate)
      }
    } catch (error) {
      console.error('delete history failed:', error)
      setMessage('削除に失敗しました')
    } finally {
      setLoading(false)
    }
  }
  const updateHistory = async () => {
  if (!editingId) return

  const quantity = Number(editingQuantity)

  if (!Number.isFinite(quantity) || quantity <= 0) {
    setMessage('本数を正しく入力してください')
    return
  }

  try {
    setLoading(true)
    setMessage('')

    const res = await fetch('/api/history/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingId,
        quantity,
      }),
    })

    const json = await res.json()

    if (!res.ok) {
      setMessage(json?.error || '更新に失敗しました')
      return
    }

    setMessage('更新しました')
    setEditingId(null)
    setEditingQuantity('')
    await refreshAll()

    if (openDate) {
      await fetchDetails(openDate)
    }
  } catch (error) {
    console.error('update history failed:', error)
    setMessage('更新に失敗しました')
  } finally {
    setLoading(false)
  }
}

  const toggleDetails = async (date: string) => {
    if (openDate === date) {
      setOpenDate(null)
      return
    }

    setOpenDate(date)
    await fetchDetails(date)
  }

  useEffect(() => {
    refreshAll()
  }, [])

  return (
    <main className="mx-auto min-h-screen max-w-md bg-gray-50 p-4">
      <div className="mb-4 flex items-center justify-between">
  <h1 className="text-2xl font-bold">炭酸水 在庫管理アプリ</h1>

  <Link
    href="/settings"
    className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm"
  >
    設定
  </Link>
</div>

      <div className="mb-4 rounded-2xl bg-white p-5 text-center shadow">
        <p className="text-sm text-gray-500">現在の在庫</p>
        <p className="mt-2 text-4xl font-bold text-gray-800">
  {summary ? summary.current_stock : '...'}
</p>
        <p className="mt-1 text-sm text-gray-500">本</p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">平均消費量</p>
          <p className="mt-2 text-2xl font-bold">
            {summary ? summary.average_per_day : '...'}
          </p>
          <p className="text-sm text-gray-500">本/日</p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow">
          <p className="text-sm text-gray-500">必要本数</p>
          <p className="mt-2 text-2xl font-bold">
            {summary ? summary.required_bottles : '...'}
          </p>
          <p className="text-sm text-gray-500">本</p>
        </div>
      </div>

      <div className="mb-4 rounded-2xl bg-white p-4 shadow">
        <p className="font-semibold">発注の目安</p>

        <div className="mt-3 rounded-xl bg-blue-50 p-4">
          <p className="text-sm text-gray-600">推奨注文ケース数</p>
          <p className="mt-1 text-3xl font-bold text-blue-600">
  {summary ? `${summary.recommended_cases} ケース` : '読み込み中...'}
</p>
{summary && summary.recommended_cases === 0 && (
  <p className="mt-2 text-sm font-semibold text-green-600">
    現在は発注不要です
  </p>
)}

<div className="mt-3 space-y-1 text-sm text-gray-600">
  <p>
    次回配送日: {summary?.next_delivery_date ? formatDate(summary.next_delivery_date) : '-'}
  </p>
  <p>
    注文締切日: {summary?.order_deadline_date ? formatDate(summary.order_deadline_date) : '-'}
  </p>
  <p>
    締切まであと: {summary?.days_until_order_deadline ?? '-'}日
  </p>
</div>
<div className="mt-3 rounded-xl bg-white/70 p-3 text-sm text-gray-700">
  <p className="font-semibold">在庫切れ予測</p>
  <p className="mt-1">
    {summary?.estimated_days_until_out_of_stock === null ||
    summary?.estimated_days_until_out_of_stock === undefined
      ? '-'
      : summary.estimated_days_until_out_of_stock <= 0
      ? '当日'
      : `あと${summary.estimated_days_until_out_of_stock}日`}
  </p>
</div>

        </div>
      </div>

      <div className="mb-4 rounded-2xl bg-white p-4 shadow">
        <p className="mb-2 font-semibold">現在在庫を修正</p>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            value={stockInput}
            onChange={(e) => setStockInput(e.target.value)}
            className="flex-1 rounded-xl border px-3 py-2"
            placeholder="現在の本数"
          />
          <button
            onClick={updateCurrentStock}
            disabled={loading}
            className="rounded-xl bg-blue-500 px-4 py-2 font-bold text-white disabled:opacity-50"
          >
            保存
          </button>
        </div>
      </div>

      <div className="mb-4 rounded-2xl bg-white p-4 shadow">
        <p className="mb-3 font-semibold">消費入力</p>
       
<div className="mb-3 grid grid-cols-2 gap-2">
  <button
    onClick={() => consume(1)}
    className="rounded-xl bg-red-500 py-3 text-lg font-bold text-white active:scale-95"
  >
    -1本
  </button>

  <button
    onClick={() => consume(2)}
    className="rounded-xl bg-red-400 py-3 text-lg font-bold text-white active:scale-95"
  >
    -2本
  </button>
</div>

<div className="flex gap-2">
  <input
    type="number"
    min="1"
    value={manualConsumeInput}
    onChange={(e) => setManualConsumeInput(e.target.value)}
    className="flex-1 rounded-xl border px-3 py-2"
    placeholder="手動入力（本）"
  />

  <button
    onClick={() => consume(Number(manualConsumeInput))}
    disabled={loading}
    className="rounded-xl bg-blue-500 px-4 py-2 font-bold text-white active:scale-95 disabled:opacity-50"
  >
    登録
  </button>
</div>
      </div>

      <div className="mb-4 rounded-2xl bg-white p-4 shadow">
        <p className="mb-3 font-semibold">ケース追加</p>

        <div className="grid grid-cols-2 gap-2">
          {[1, 2].map((n) => (
            <button
              key={n}
              onClick={() => restock(n)}
              disabled={loading}
              className="rounded-xl bg-green-500 py-3 font-bold text-white active:scale-95 disabled:opacity-50"
            >
              +{n}ケース
            </button>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            type="number"
            min="1"
            value={manualRestockInput}
            onChange={(e) => setManualRestockInput(e.target.value)}
            className="flex-1 rounded-xl border px-3 py-2"
            placeholder="手動入力（ケース）"
          />
          <button
            onClick={() => restock(Number(manualRestockInput))}
            disabled={loading}
            className="rounded-xl bg-green-100 px-4 py-2 font-bold text-green-700 disabled:opacity-50"
          >
            追加
          </button>
        </div>
      </div>

      <div className="mb-4 rounded-2xl bg-white p-4 shadow">
        <p className="mb-3 font-semibold">消費履歴（1日ごと）</p>

        {history.length === 0 ? (
          <p className="text-sm text-gray-500">まだ履歴がありません</p>
        ) : (
          <div className="space-y-3">
            {history.map((item, index) => {
              const dateKey = item.consumption_date
              const totalQty = getHistoryQuantity(item)

              return (
                <div
                  key={item.id ?? `${item.consumption_date}-${index}`}
                  className="rounded-xl border p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold">{formatDate(item.consumption_date)}</p>
                      <p className="text-sm text-gray-600">{totalQty}本</p>
                    </div>

                    <button
                      onClick={() => toggleDetails(dateKey)}
                      className="text-sm font-bold text-blue-600"
                    >
                      {openDate === dateKey ? '閉じる' : '編集'}
                    </button>
                  </div>

                  {openDate === dateKey && (
                    <div className="mt-3 space-y-2 border-t pt-3">
                      {(detailsMap[dateKey] ?? []).length === 0 ? (
                        <p className="text-sm text-gray-500">明細がありません</p>
                      ) : (
                        detailsMap[dateKey].map((detail) => (
                          <div
  key={detail.id}
  className="rounded-lg border border-gray-200 p-2 text-sm"
>
  {editingId === detail.id ? (
    <div className="space-y-2">
      <div className="text-gray-700">
        {formatTime(detail.created_at)} / 編集中
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min="1"
          value={editingQuantity}
          onChange={(e) => setEditingQuantity(e.target.value)}
          className="w-24 rounded-lg border px-2 py-1"
        />
        <span>本</span>
      </div>

      <div className="flex gap-3">
        <button
          onClick={updateHistory}
          className="font-bold text-blue-600"
        >
          保存
        </button>
        <button
          onClick={() => {
            setEditingId(null)
            setEditingQuantity('')
          }}
          className="font-bold text-gray-500"
        >
          キャンセル
        </button>
      </div>
    </div>
  ) : (
    <div className="flex items-center justify-between gap-3">
      <span>
        {formatTime(detail.created_at)} / {detail.quantity}本
      </span>

      <div className="flex gap-3">
        <button
          onClick={() => {
            setEditingId(detail.id)
            setEditingQuantity(String(detail.quantity))
          }}
          className="font-bold text-blue-600"
        >
          編集
        </button>

        <button
          onClick={() => deleteHistory(detail.id)}
          className="font-bold text-red-500"
        >
          削除
        </button>
      </div>
    </div>
  )}
</div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {message && (
        <div className="rounded-xl bg-gray-100 p-3 text-center text-sm">
          {message}
        </div>
      )}
    </main>
  )
}