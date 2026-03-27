"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useInventory } from "@/contexts/inventory-context"

export default function QrRegisterPage() {
  const searchParams = useSearchParams()
  const { state, consumeByMember, isReady } = useInventory()

  const memberId = searchParams.get("memberId") ?? ""
  const token = searchParams.get("t") ?? ""

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("記録を準備しています")
  const didRunRef = useRef(false)

  const member = useMemo(
    () => state.members.find((item) => item.id === memberId),
    [state.members, memberId]
  )

  useEffect(() => {
    if (!isReady) return
    if (!memberId) {
      setStatus("error")
      setMessage("memberId が見つかりません")
      return
    }

    if (!member) {
      setStatus("error")
      setMessage("登録されていないメンバーです")
      return
    }

    const onceKey = `qr-once:${memberId}:${token || "default"}`
    const alreadyDone = typeof window !== "undefined" ? sessionStorage.getItem(onceKey) : null

    if (alreadyDone) {
      setStatus("success")
      setMessage(`${member.name}の記録はすでに完了しています`)
      return
    }

    if (didRunRef.current) return
    didRunRef.current = true

    if (state.currentStock <= 0) {
      setStatus("error")
      setMessage("在庫がありません")
      return
    }

    consumeByMember(memberId, "qr")

    if (typeof window !== "undefined") {
      sessionStorage.setItem(onceKey, "done")
    }

    setStatus("success")
    setMessage(`${member.name}が1本飲みました。残り${Math.max(state.currentStock - 1, 0)}本です`)
  }, [isReady, memberId, member, consumeByMember, state.currentStock, token])

  return (
    <div className="qr-register-page">
      <div className="card stack-gap qr-register-card">
        <div>
          <p className="eyebrow">QRから記録</p>
          <h1 className="page-title qr-register-title">炭酸水の記録</h1>
        </div>

        <div
          className={
            status === "success"
              ? "qr-register-status qr-register-status-success"
              : status === "error"
              ? "qr-register-status qr-register-status-error"
              : "qr-register-status"
          }
        >
          {message}
        </div>

        {member && (
          <div className="inline-note">
            <span>対象メンバー:</span>
            <strong>{member.name}</strong>
          </div>
        )}

        <div className="inline-note">
          <span>現在の在庫数:</span>
          <strong>{state.currentStock}本</strong>
        </div>

        <div className="restock-row">
          <Link href="/" className="primary-button">
            ホームへ戻る
          </Link>
          <Link href="/members" className="secondary-button">
            メンバー一覧へ
          </Link>
        </div>
      </div>
    </div>
  )
}