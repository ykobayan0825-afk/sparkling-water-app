import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const formatDateJST = (date: Date) => {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Tokyo',
  }).format(date)
}

const addDays = (base: Date, days: number) => {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

const diffDays = (target: Date, base: Date) => {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.ceil((target.getTime() - base.getTime()) / msPerDay)
}

export async function GET() {
  try {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: '商品設定の取得に失敗しました。' },
        { status: 500 }
      )
    }

    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select('current_stock')
      .single()

    if (inventoryError || !inventory) {
      return NextResponse.json(
        { error: '在庫取得に失敗しました。' },
        { status: 500 }
      )
    }

    const { data: logs, error: logsError } = await supabase
      .from('consumption_logs')
      .select('quantity, consumption_date')
      .order('consumption_date', { ascending: true })

    if (logsError) {
      return NextResponse.json(
        { error: '消費履歴の取得に失敗しました。' },
        { status: 500 }
      )
    }

    const totalConsumed = (logs ?? []).reduce((sum, log) => sum + log.quantity, 0)

    const uniqueDays = new Set(
      (logs ?? []).map((log) => log.consumption_date)
    ).size

    const daysCount = uniqueDays > 0 ? uniqueDays : 1
    const averagePerDay = totalConsumed / daysCount

    const orderCycleDays = product.order_cycle_days
    const caseSize = product.case_size
    const leadDays = product.lead_days

    const requiredBottles = Math.ceil(
      averagePerDay * (orderCycleDays + leadDays)
    )

    const shortage = Math.max(requiredBottles - inventory.current_stock, 0)

    const recommendedCases =
      shortage <= 0 ? 0 : Math.ceil(shortage / caseSize)
      const estimatedDaysUntilOutOfStock =
  averagePerDay > 0
    ? Math.floor(inventory.current_stock / averagePerDay)
    : null

    const nextDeliveryDateObj = new Date(product.next_order_date)
    const orderDeadlineDateObj = addDays(nextDeliveryDateObj, -leadDays)
    const now = new Date()

    const next_delivery_date = formatDateJST(nextDeliveryDateObj)
    const order_deadline_date = formatDateJST(orderDeadlineDateObj)
    const days_until_order_deadline = diffDays(orderDeadlineDateObj, now)

    return NextResponse.json({
      current_stock: inventory.current_stock,
      total_consumed: totalConsumed,
      days_count: daysCount,
      average_per_day: Number(averagePerDay.toFixed(2)),
      required_bottles: requiredBottles,
      recommended_cases: recommendedCases,
      next_delivery_date,
      order_deadline_date,
      days_until_order_deadline,
      estimated_days_until_out_of_stock: estimatedDaysUntilOutOfStock,
    })
  } catch {
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました。' },
      { status: 500 }
    )
  }
}