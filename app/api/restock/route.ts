import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const caseCount = Number(body.caseCount ?? 0)

    if (!Number.isInteger(caseCount) || caseCount <= 0) {
      return NextResponse.json(
        { error: 'ケース数は1以上の整数で入力してください。' },
        { status: 400 }
      )
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, case_size')
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: '商品情報の取得に失敗しました。' },
        { status: 500 }
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

    const addBottles = caseCount * product.case_size
    const nextStock = inventory.current_stock + addBottles

    const { error: updateError } = await supabase
      .from('inventory')
      .update({ current_stock: nextStock })
      .eq('product_id', inventory.product_id)

    if (updateError) {
      return NextResponse.json(
        { error: '在庫追加に失敗しました。' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `${caseCount}ケース追加しました。`,
      current_stock: nextStock,
      added_bottles: addBottles,
    })
  } catch {
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました。' },
      { status: 500 }
    )
  }
}