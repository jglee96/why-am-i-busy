import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const sessionId = params.id;

  try {
    // 현재 로그인된 유저 정보 가져오기
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    const now = new Date();

    const { error } = await supabase
      .from("work_sessions")
      .update({
        end_time: now.toISOString(),
      })
      .eq("id", sessionId)
      // 해당 세션이 현재 유저의 것인지 확인
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error ending work session:", error);
    return NextResponse.json(
      { error: "작업 세션 종료 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
