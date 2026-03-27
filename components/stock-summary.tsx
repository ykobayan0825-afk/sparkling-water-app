"use client"

import { useState } from "react"
import { useInventory } from "@/contexts/inventory-context"
import {
  getConsumptionStats,
  getMorningAfternoonSummary,
  getSubscriptionSummary,
  getTodayConsumeCount,
} from "@/lib/inventory-helpers"

export function StockSummary() {
  const { state, setNextSubscriptionDate } = useInventory()
  const [editingDate, setEditingDate] = useState(state.nextSubscriptionDate ?? "")

  const todayCount = getTodayConsumeCount(state.histories)
  const morningAfternoon = getMorningAfternoonSummary(state.histories)
  const stats = getConsumptionStats(state.histories, state.currentStock)
  const subscription = getSubscriptionSummary({
    currentStock: state.currentStock,
    histories: state.histories,
    nextSubscriptionDate: state.nextSubscriptionDate,
  })

  return (
    <section className="card stack-gap">
      <div className="summary-grid">
        <div className="summary-box summary-stock">
          <p className="summary-label">現在の在庫数</p>
          <p className="summary-value">{state.currentStock}本</p>
        </div>

        <div className="summary-box">
          <p className="summary-label">今日の消費本数</p>
          <p className="summary-value">{todayCount}本</p>
        </div>

        <div className="summary-box">
          <p className="summary-label">午前の消費</p>
          <p className="summary-value">{morningAfternoon.morning}本</p>
        </div>

        <div className="summary-box">
          <p className="summary-label">午後の消費</p>
          <p className="summary-value">{morningAfternoon.afternoon}本</p>
        </div>

        <div className="summary-box">
          <p className="summary-label">次回定期便まで</p>
          <p className="summary-value">
            {subscription.daysUntilSubscription === null ? "未設定" : `${subscription.daysUntilSubscription}日`}
          </p>
        </div>

        <div className="summary-box">
          <p className="summary-label">追加推奨</p>
          <p className="summary-value">{subscription.additionalCasesNeeded}ケース</p>
        </div>
      </div>

      <div className="inline-note">
        <span>集計結果</span>
        <strong>{morningAfternoon.winner}</strong>
      </div>

      <div className="inline-note">
        <span>平均消費量</span>
        <strong>{stats.averagePerDay.toFixed(1)}本/日</strong>
      </div>

      {subscription.daysUntilSubscription !== null && (
        <>
          <div className="inline-note">
            <span>次回定期便までに必要</span>
            <strong>{subscription.requiredBottlesUntilSubscription}本</strong>
          </div>

          <div className="inline-note">
            <span>在庫判定</span>
            <strong>
              {subscription.willLastUntilSubscription ? "今の在庫で足ります" : "追加購入が必要です"}
            </strong>
          </div>
        </>
      )}

      <div className="stack-gap">
        <div>
          <p className="summary-label">次回定期便の日付</p>
        </div>

        <div className="form-row">
          <input
            type="date"
            className="text-input"
            value={editingDate}
            onChange={(e) => setEditingDate(e.target.value)}
          />
          <button
            type="button"
            className="primary-button"
            onClick={() => setNextSubscriptionDate(editingDate || null)}
          >
            保存
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setEditingDate("")
              setNextSubscriptionDate(null)
            }}
          >
            クリア
          </button>
        </div>
      </div>
    </section>
  )
}