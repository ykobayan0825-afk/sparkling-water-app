import { InventoryState, Member, StockHistory } from "@/types/inventory"
import { createId, isMorning, isToday } from "@/lib/utils"

export type ChartRange = "all" | "1d" | "1m" | "6m" | "1y"

export function createConsumeHistory(params: {
  memberId: string
  memberName: string
  source: "manual" | "qr"
  quantity?: number
}): StockHistory {
  return {
    id: createId("history"),
    type: "consume",
    quantity: params.quantity ?? 1,
    memberId: params.memberId,
    memberName: params.memberName,
    source: params.source,
    timestamp: new Date().toISOString(),
  }
}

export function createRestockHistory(quantity: number): StockHistory {
  return {
    id: createId("history"),
    type: "restock",
    quantity,
    source: "manual",
    timestamp: new Date().toISOString(),
  }
}

export function getMemberConsumeCount(histories: StockHistory[], memberId: string) {
  return histories
    .filter((history) => history.type === "consume" && history.memberId === memberId)
    .reduce((sum, history) => sum + history.quantity, 0)
}

export function getTodayConsumeCount(histories: StockHistory[]) {
  return histories
    .filter((history) => history.type === "consume" && isToday(history.timestamp))
    .reduce((sum, history) => sum + history.quantity, 0)
}

export function getMorningAfternoonSummary(histories: StockHistory[]) {
  let morning = 0
  let afternoon = 0

  for (const history of histories) {
    if (history.type !== "consume") continue
    if (isMorning(history.timestamp)) {
      morning += history.quantity
    } else {
      afternoon += history.quantity
    }
  }

  const winner =
    morning === afternoon ? "同数" : morning > afternoon ? "午前の方が多い" : "午後の方が多い"

  return { morning, afternoon, winner }
}

export function filterHistoriesByRange(histories: StockHistory[], range: ChartRange) {
  if (range === "all") return histories

  const now = new Date()

  return histories.filter((history) => {
    const historyDate = new Date(history.timestamp)

    if (range === "1d") {
      return isToday(history.timestamp)
    }

    if (range === "1m") {
      return (
        historyDate.getFullYear() === now.getFullYear() &&
        historyDate.getMonth() === now.getMonth()
      )
    }

    if (range === "6m") {
      const start = new Date(now)
      start.setMonth(now.getMonth() - 6)
      return historyDate >= start
    }

    if (range === "1y") {
      const start = new Date(now)
      start.setFullYear(now.getFullYear() - 1)
      return historyDate >= start
    }

    return true
  })
}

export function getMemberChartData(members: Member[], histories: StockHistory[]) {
  return members.map((member) => ({
    name: member.name,
    count: getMemberConsumeCount(histories, member.id),
  }))
}

export function getDailyConsumeData(histories: StockHistory[]) {
  const map = new Map<string, number>()

  histories
    .filter((history) => history.type === "consume")
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .forEach((history) => {
      const date = new Date(history.timestamp)
      const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
      map.set(key, (map.get(key) ?? 0) + history.quantity)
    })

  return Array.from(map.entries()).map(([date, count]) => ({
    date,
    count,
  }))
}

export function getStockTrendData(state: InventoryState, range: ChartRange = "all") {
  const filteredHistories = filterHistoriesByRange(state.histories, range)

  let runningStock = 0
  const rows: Array<{ label: string; stock: number }> = []

  const histories = [...filteredHistories].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  const totalRestocked = histories
    .filter((history) => history.type === "restock")
    .reduce((sum, history) => sum + history.quantity, 0)

  const totalConsumed = histories
    .filter((history) => history.type === "consume")
    .reduce((sum, history) => sum + history.quantity, 0)

  runningStock = state.currentStock - totalRestocked + totalConsumed
  rows.push({ label: "開始", stock: runningStock })

  for (const history of histories) {
    if (history.type === "consume") {
      runningStock -= history.quantity
    } else {
      runningStock += history.quantity
    }

    rows.push({
      label: `${new Date(history.timestamp).getMonth() + 1}/${new Date(
        history.timestamp
      ).getDate()} ${new Date(history.timestamp).getHours()}:${String(
        new Date(history.timestamp).getMinutes()
      ).padStart(2, "0")}`,
      stock: runningStock,
    })
  }

  return rows
}

export function getConsumptionStats(histories: StockHistory[], currentStock: number) {
  const consumeHistories = histories.filter((history) => history.type === "consume")
  const totalConsumed = consumeHistories.reduce((sum, history) => sum + history.quantity, 0)

  if (consumeHistories.length === 0) {
    return {
      totalConsumed: 0,
      daysCount: 0,
      averagePerDay: 0,
      recommendedCases: 0,
      estimatedRemainingDays: 0,
    }
  }

  const sorted = [...consumeHistories].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  const uniqueDays = new Set(
    sorted.map((history) => {
      const date = new Date(history.timestamp)
      return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    })
  )

  const daysCount = uniqueDays.size
  const averagePerDay = daysCount > 0 ? totalConsumed / daysCount : 0
  const recommendedCases = Math.ceil(Math.ceil(averagePerDay * 14) / 32)
  const estimatedRemainingDays =
    averagePerDay > 0 ? Number((currentStock / averagePerDay).toFixed(1)) : 0

  return {
    totalConsumed,
    daysCount,
    averagePerDay,
    recommendedCases,
    estimatedRemainingDays,
  }
}

export function getSubscriptionSummary(params: {
  currentStock: number
  histories: StockHistory[]
  nextSubscriptionDate: string | null
}) {
  const stats = getConsumptionStats(params.histories, params.currentStock)

  if (!params.nextSubscriptionDate) {
    return {
      daysUntilSubscription: null,
      requiredBottlesUntilSubscription: 0,
      shortageBottles: 0,
      additionalCasesNeeded: 0,
      willLastUntilSubscription: null,
    }
  }

  const today = new Date()
  const target = new Date(params.nextSubscriptionDate)

  today.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)

  const diffMs = target.getTime() - today.getTime()
  const daysUntilSubscription = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

  const requiredBottlesUntilSubscription = Math.ceil(stats.averagePerDay * daysUntilSubscription)
  const shortageBottles = Math.max(0, requiredBottlesUntilSubscription - params.currentStock)
  const additionalCasesNeeded = Math.ceil(shortageBottles / 32)
  const willLastUntilSubscription = params.currentStock >= requiredBottlesUntilSubscription

  return {
    daysUntilSubscription,
    requiredBottlesUntilSubscription,
    shortageBottles,
    additionalCasesNeeded,
    willLastUntilSubscription,
  }
}