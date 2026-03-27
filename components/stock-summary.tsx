"use client"

import { useInventory } from "@/contexts/inventory-context"
import {
  getConsumptionStats,
  getMorningAfternoonSummary,
  getTodayConsumeCount,
} from "@/lib/inventory-helpers"

export function StockSummary() {
  const { state } = useInventory()

  const todayCount = getTodayConsumeCount(state.histories)
  const morningAfternoon = getMorningAfternoonSummary(state.histories)
  const stats = getConsumptionStats(state.histories, state.currentStock)

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
          <p className="summary-label">平均消費量</p>
          <p className="summary-value">{stats.averagePerDay.toFixed(1)}本/日</p>
        </div>

        <div className="summary-box">
          <p className="summary-label">発注の目安</p>
          <p className="summary-value">{stats.requiredBottles}本</p>
        </div>
      </div>

      <div className="inline-note">
        <span>集計結果:</span>
        <strong>{morningAfternoon.winner}</strong>
      </div>

      <div className="inline-note">
        <span>おすすめケース数:</span>
        <strong>{stats.recommendedCases}ケース</strong>
      </div>

      <div className="inline-note">
        <span>今の在庫の想定残日数:</span>
        <strong>{stats.estimatedRemainingDays}日</strong>
      </div>
    </section>
  )
}