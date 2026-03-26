import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, case_size, order_cycle_days, lead_days, safety_stock, next_order_date')
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: '設定取得に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ settings: data })
  } catch {
    return NextResponse.json(
      { error: 'サーバーエラー' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const id = body.id
    const name = body.name
    const case_size = Number(body.case_size)
    const order_cycle_days = Number(body.order_cycle_days)
    const lead_days = Number(body.lead_days)
    const safety_stock = Number(body.safety_stock)
    const next_order_date = body.next_order_date

    if (!id) {
      return NextResponse.json(
        { error: 'IDが必要です' },
        { status: 400 }
      )
    }

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: '商品名を入力してください' },
        { status: 400 }
      )
    }

    if (!Number.isFinite(case_size) || case_size <= 0) {
      return NextResponse.json(
        { error: 'ケース本数を正しく入力してください' },
        { status: 400 }
      )
    }

    if (!Number.isFinite(order_cycle_days) || order_cycle_days <= 0) {
      return NextResponse.json(
        { error: '発注周期を正しく入力してください' },
        { status: 400 }
      )
    }

    if (!Number.isFinite(lead_days) || lead_days < 0) {
      return NextResponse.json(
        { error: '締切日数を正しく入力してください' },
        { status: 400 }
      )
    }

    if (!Number.isFinite(safety_stock) || safety_stock < 0) {
      return NextResponse.json(
        { error: '安全在庫を正しく入力してください' },
        { status: 400 }
      )
    }

    if (!next_order_date) {
      return NextResponse.json(
        { error: '次回配送日を入力してください' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('products')
      .update({
        name,
        case_size,
        order_cycle_days,
        lead_days,
        safety_stock,
        next_order_date,
      })
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { error: '設定更新に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: '設定を更新しました' })
  } catch {
    return NextResponse.json(
      { error: 'サーバーエラー' },
      { status: 500 }
    )
  }
}