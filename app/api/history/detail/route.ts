import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')

  if (!date) {
    return NextResponse.json(
      { error: 'date が必要です。' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('consumption_logs')
    .select('id, consumption_date, quantity, created_at')
    .eq('consumption_date', date)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: '明細取得に失敗しました。' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    details: data ?? [],
  })
}