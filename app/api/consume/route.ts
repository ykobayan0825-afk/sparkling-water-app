import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const quantity = Number(body.quantity ?? 0)

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return NextResponse.json(
        { error: '数量は1以上の整数で入力してください。' },
        { status: 400 }
      )
    }

    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select('product_id, current_stock')
      .single()

    if (inventoryError || !inventory) {
      return NextResponse.json(
        { error: '在庫情報の取得に失敗しました。' },
        { status: 500 }
      )
    }

    const nextStock = inventory.current_stock - quantity

    if (nextStock < 0) {
      return NextResponse.json(
        { error: '在庫が足りません。' },
        { status: 400 }
      )
    }

    const now = new Date()

const today = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Tokyo',
}).format(now)

    const { error: logError } = await supabase
      .from('consumption_logs')
      .insert({
        product_id: inventory.product_id,
        consumption_date: today,
        quantity,
      })

    if (logError) {
      return NextResponse.json(
        { error: '消費履歴の保存に失敗しました。' },
        { status: 500 }
      )
    }

    const { error: updateError } = await supabase
      .from('inventory')
      .update({ current_stock: nextStock })
      .eq('product_id', inventory.product_id)

    if (updateError) {
      return NextResponse.json(
        { error: '在庫更新に失敗しました。' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: '消費を登録しました。',
      current_stock: nextStock,
    })
  } catch {
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました。' },
      { status: 500 }
    )
  }
}