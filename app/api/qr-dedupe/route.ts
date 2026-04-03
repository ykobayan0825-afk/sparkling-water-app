import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Body = {
  memberId?: string;
  windowSeconds?: number;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Body;
    const memberId = body.memberId?.trim();
    const windowSeconds =
      typeof body.windowSeconds === "number" && body.windowSeconds > 0
        ? Math.floor(body.windowSeconds)
        : 5;

    if (!memberId) {
      return NextResponse.json(
        { ok: false, accepted: false, message: "memberId is required" },
        { status: 400 }
      );
    }

    const now = new Date();
    const bucket = Math.floor(now.getTime() / (windowSeconds * 1000));
    const bucketStartedAt = new Date(bucket * windowSeconds * 1000);
    const dedupeKey = `${memberId}:${bucket}`;

    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor
      ? forwardedFor.split(",")[0]?.trim() || null
      : null;

    const userAgent = request.headers.get("user-agent");

    const { error } = await supabaseAdmin.from("qr_consume_events").insert({
      member_id: memberId,
      dedupe_key: dedupeKey,
      bucket_started_at: bucketStartedAt.toISOString(),
      window_seconds: windowSeconds,
      user_agent: userAgent,
      ip_address: ipAddress,
    });

    if (error) {
      const message = error.message || "";

      const isDuplicate =
        message.includes("duplicate key") ||
        message.includes("unique") ||
        error.code === "23505";

      if (isDuplicate) {
        return NextResponse.json({
          ok: true,
          accepted: false,
          message: `${windowSeconds}秒以内の重複読み取りを防止しました。`,
        });
      }

      console.error("[qr-dedupe] insert error:", error);

      return NextResponse.json(
        {
          ok: false,
          accepted: false,
          message: "重複防止チェックに失敗しました。",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      accepted: true,
      message: "読み取りを受け付けました。",
    });
  } catch (error) {
    console.error("[qr-dedupe] unexpected error:", error);

    return NextResponse.json(
      {
        ok: false,
        accepted: false,
        message: "サーバーエラーが発生しました。",
      },
      { status: 500 }
    );
  }
}