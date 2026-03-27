"use client"

import { useState } from "react"
import { useInventory } from "@/contexts/inventory-context"

export function MemberActionGrid() {
  const { state, consumeByMember, restock, setCurrentStock } = useInventory()
  const [showManualRestock, setShowManualRestock] = useState(false)
  const [manualQuantity, setManualQuantity] = useState("")
  const [showSetStock, setShowSetStock] = useState(false)
  const [targetStock, setTargetStock] = useState("")

  const handleManualRestock = () => {
    const quantity = Number(manualQuantity)

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return
    }

    restock(quantity)
    setManualQuantity("")
    setShowManualRestock(false)
  }

  const handleSetStock = () => {
    const quantity = Number(targetStock)

    if (!Number.isInteger(quantity) || quantity < 0) {
      return
    }

    setCurrentStock(quantity)
    setTargetStock("")
    setShowSetStock(false)
  }

  return (
    <section className="card stack-gap">
      <div className="section-head">
        <div>
          <h2>ワンタップ記録</h2>
          <p>押すだけで1本消費を記録します</p>
        </div>
      </div>

      <div className="member-grid">
        {state.members.map((member) => (
          <button
            key={member.id}
            type="button"
            className="member-button"
            onClick={() => consumeByMember(member.id, "manual")}
          >
            <span className="member-button-name">{member.name}</span>
            <span className="member-button-action">-1本 記録</span>
          </button>
        ))}
      </div>

      <div className="restock-row">
        <button type="button" className="secondary-button" onClick={() => restock(6)}>
          +6本 補充
        </button>
        <button type="button" className="secondary-button" onClick={() => restock(24)}>
          +24本 補充
        </button>
        <button type="button" className="secondary-button" onClick={() => restock(32)}>
          +32本 補充
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setShowManualRestock((prev) => !prev)}
        >
          手動入力
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setShowSetStock((prev) => !prev)}
        >
          在庫数を直接修正
        </button>
      </div>

      {showManualRestock && (
        <div className="form-row">
          <input
            type="number"
            min="1"
            step="1"
            className="text-input"
            value={manualQuantity}
            onChange={(e) => setManualQuantity(e.target.value)}
            placeholder="補充本数を入力"
          />
          <button type="button" className="primary-button" onClick={handleManualRestock}>
            追加する
          </button>
        </div>
      )}

      {showSetStock && (
        <div className="form-row">
          <input
            type="number"
            min="0"
            step="1"
            className="text-input"
            value={targetStock}
            onChange={(e) => setTargetStock(e.target.value)}
            placeholder={`現在は${state.currentStock}本`}
          />
          <button type="button" className="primary-button" onClick={handleSetStock}>
            在庫数を更新
          </button>
        </div>
      )}
    </section>
  )
}