import {
  createWorkSessionFromDate,
  getAuthUser,
  getSessionTasksData,
  getUserWorkSessionData,
} from "@/services/server/utils";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const sessionId = params.id;

  try {
    const user = await getAuthUser(supabase);

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
    if (error instanceof NextResponse) {
      return error;
    }

    console.error("Error ending work session:", error);
    return NextResponse.json(
      { error: "작업 세션 종료 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const sessionId = params.id;

  try {
    const user = await getAuthUser(supabase);
    const sessionData = await getUserWorkSessionData(
      supabase,
      sessionId,
      user.id
    );
    const tasksData = await getSessionTasksData(supabase, sessionId, user.id);

    const workSession = await createWorkSessionFromDate(
      sessionData,
      tasksData,
      user.id
    );

    return NextResponse.json(workSession);
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }

    console.error("Error getting work session:", error);
    return NextResponse.json(
      { error: "작업 세션 가져오기 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
