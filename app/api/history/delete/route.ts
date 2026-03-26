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

    if (!id) {
      return NextResponse.json(
        { error: 'IDが必要です' },
        { status: 400 }
      )
    }

    // ① 削除対象の消費ログを取得
    const { data: log, error: logError } = await supabase
      .from('consumption_logs')
      .select('id, product_id, quantity')
      .eq('id', id)
      .single()

    if (logError || !log) {
      return NextResponse.json(
        { error: '削除対象の履歴が見つかりませんでした' },
        { status: 404 }
      )
    }

    // ② 対象商品の現在在庫を取得
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

    // ③ 在庫を戻す
    const { error: updateError } = await supabase
      .from('inventory')
      .update({
        current_stock: inventory.current_stock + log.quantity,
      })
      .eq('product_id', log.product_id)

    if (updateError) {
      return NextResponse.json(
        { error: '在庫の戻し処理に失敗しました' },
        { status: 500 }
      )
    }

    // ④ 消費ログを削除
    const { error: deleteError } = await supabase
      .from('consumption_logs')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json(
        { error: '履歴の削除に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: '削除しました' })
  } catch {
    return NextResponse.json(
      { error: 'サーバーエラー' },
      { status: 500 }
    )
  }
}