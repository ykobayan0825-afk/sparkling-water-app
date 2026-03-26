import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('consumption_logs')
      .select('consumption_date, quantity')
      .order('consumption_date', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: '履歴取得に失敗しました' },
        { status: 500 }
      )
    }

    const groupedMap = new Map<string, number>()

    for (const row of data ?? []) {
      const current = groupedMap.get(row.consumption_date) ?? 0
      groupedMap.set(row.consumption_date, current + row.quantity)
    }

    const history = Array.from(groupedMap.entries()).map(
      ([consumption_date, total_quantity]) => ({
        consumption_date,
        total_quantity,
      })
    )

    history.sort((a, b) =>
      a.consumption_date < b.consumption_date ? 1 : -1
    )

    return NextResponse.json({ history })
  } catch {
    return NextResponse.json(
      { error: 'サーバーエラー' },
      { status: 500 }
    )
  }
}