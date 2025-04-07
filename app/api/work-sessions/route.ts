import {
  createWorkSessionFromDate,
  getAuthUser,
  getSessionTasksData,
} from "@/services/server/utils";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createClient();

  try {
    const user = await getAuthUser(supabase);

    const now = new Date();

    const { data, error } = await supabase
      .from("work_sessions")
      .insert({
        user_id: user.id,
        start_time: now.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ id: data.id });
  } catch (error) {
    console.error("Error creating work session:", error);
    return NextResponse.json(
      { error: "작업 세션 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const supabase = createClient();

  try {
    const user = await getAuthUser(supabase);

    // 작업 세션 가져오기
    const { data: sessions, error: sessionsError } = await supabase
      .from("work_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("start_time", { ascending: false });

    if (sessionsError) throw sessionsError;

    // 각 세션에 대한 작업 가져오기
    const workSessions = await Promise.all(
      sessions.map(async (session) => {
        const tasks = await getSessionTasksData(supabase, session.id, user.id);

        const workSession = await createWorkSessionFromDate(
          session,
          tasks,
          user.id
        );

        return workSession;
      })
    );

    return NextResponse.json({ workSessions });
  } catch (error) {
    console.error("Error fetching work sessions:", error);
    return NextResponse.json(
      { error: "작업 세션 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
