"use client"

import { useMemo, useState } from "react"
import {
  BarChart,
  Bar,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Legend,
} from "recharts"
import { useInventory } from "@/contexts/inventory-context"
import {
  ChartRange,
  filterHistoriesByRange,
  getDailyConsumeData,
  getMemberChartData,
  getMorningAfternoonSummary,
  getStockTrendData,
} from "@/lib/inventory-helpers"
import { cn } from "@/lib/utils"

const rangeOptions: Array<{ value: ChartRange; label: string }> = [
  { value: "all", label: "すべての累計" },
  { value: "1d", label: "今日の累計" },
  { value: "1m", label: "今月の累計" },
  { value: "6m", label: "6カ月の累計" },
  { value: "1y", label: "1年の累計" },
]

export function ChartsPanel() {
  const { state } = useInventory()
  const [range, setRange] = useState<ChartRange>("all")

  const filteredHistories = useMemo(
    () => filterHistoriesByRange(state.histories, range),
    [state.histories, range]
  )

  const memberData = useMemo(
    () => getMemberChartData(state.members, filteredHistories),
    [state.members, filteredHistories]
  )

  const summary = useMemo(
    () => getMorningAfternoonSummary(filteredHistories),
    [filteredHistories]
  )

  const dayData = useMemo(() => getDailyConsumeData(filteredHistories), [filteredHistories])

  const stockTrend = useMemo(() => getStockTrendData(state, range), [state, range])

  const currentRangeLabel = rangeOptions.find((item) => item.value === range)?.label ?? ""

  const morningAfternoonData = [
    { name: "午前", value: summary.morning },
    { name: "午後", value: summary.afternoon },
  ]

  return (
    <div className="stack-gap-lg">
      <section className="card stack-gap">
        <div className="section-head">
          <div>
            <h2>表示期間</h2>
            <p>見たい期間ごとの累計に切り替えられます</p>
          </div>
        </div>

        <div className="range-chip-wrap">
          {rangeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={cn("range-chip", range === option.value && "range-chip-active")}
              onClick={() => setRange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card stack-gap">
        <div className="section-head">
          <div>
            <h2>メンバー別消費本数</h2>
            <p>{currentRangeLabel}</p>
          </div>
        </div>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={memberData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card stack-gap">
        <div className="section-head">
          <div>
            <h2>午前 / 午後 比較</h2>
            <p>{summary.winner}</p>
          </div>
        </div>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={morningAfternoonData} dataKey="value" nameKey="name" outerRadius={90} label>
                <Cell />
                <Cell />
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card stack-gap">
        <div className="section-head">
          <div>
            <h2>日別消費推移</h2>
            <p>{currentRangeLabel}</p>
          </div>
        </div>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dayData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" strokeWidth={3} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card stack-gap">
        <div className="section-head">
          <div>
            <h2>在庫推移</h2>
            <p>{currentRangeLabel}</p>
          </div>
        </div>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={stockTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" hide />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="stock" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}