import { createClient } from "@/utils/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // 인증 후 트래커 페이지로 리디렉션
  return NextResponse.redirect(new URL("/tracker", request.url))
}

