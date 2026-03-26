import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from('inventory')
    .select('current_stock')
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: '在庫取得に失敗しました。' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    current_stock: data.current_stock,
  })
}