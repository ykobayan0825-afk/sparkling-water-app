import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const currentStock = Number(body.currentStock)

    if (!Number.isInteger(currentStock) || currentStock < 0) {
      return NextResponse.json(
        { error: '現在在庫は0以上の整数で入力してください。' },
        { status: 400 }
      )
    }

    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select('product_id')
      .single()

    if (inventoryError || !inventory) {
      return NextResponse.json(
        { error: '在庫情報の取得に失敗しました。' },
        { status: 500 }
      )
    }

    const { error: updateError } = await supabase
      .from('inventory')
      .update({ current_stock: currentStock })
      .eq('product_id', inventory.product_id)

    if (updateError) {
      return NextResponse.json(
        { error: '在庫更新に失敗しました。' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: '現在在庫を更新しました。',
      current_stock: currentStock,
    })
  } catch {
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました。' },
      { status: 500 }
    )
  }
}