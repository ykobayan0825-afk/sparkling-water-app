import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = body.id
    const quantity = Number(body.quantity)

    if (!id) {
      return NextResponse.json(
        { error: 'IDが必要です' },
        { status: 400 }
      )
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return NextResponse.json(
        { error: '本数を正しく入力してください' },
        { status: 400 }
      )
    }

    const { data: log, error: logError } = await supabase
      .from('consumption_logs')
      .select('id, product_id, quantity')
      .eq('id', id)
      .single()

    if (logError || !log) {
      return NextResponse.json(
        { error: '対象の履歴が見つかりません' },
        { status: 404 }
      )
    }

    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select('product_id, current_stock')
      .eq('product_id', log.product_id)
      .single()

    if (inventoryError || !inventory) {
      return NextResponse.json(
        { error: '在庫情報の取得に失敗しました' },
        { status: 500 }
      )
    }

    const diff = quantity - log.quantity
    const newStock = inventory.current_stock - diff

    if (newStock < 0) {
      return NextResponse.json(
        { error: '在庫が不足するため編集できません' },
        { status: 400 }
      )
    }

    const { error: updateInventoryError } = await supabase
      .from('inventory')
      .update({
        current_stock: newStock,
      })
      .eq('product_id', log.product_id)

    if (updateInventoryError) {
      return NextResponse.json(
        { error: '在庫更新に失敗しました' },
        { status: 500 }
      )
    }

    const { error: updateLogError } = await supabase
      .from('consumption_logs')
      .update({
        quantity,
      })
      .eq('id', id)

    if (updateLogError) {
      return NextResponse.json(
        { error: '履歴更新に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: '更新しました' })
  } catch {
    return NextResponse.json(
      { error: 'サーバーエラー' },
      { status: 500 }
    )
  }
}