import { decryptData } from "@/utils/encryption";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createClient();

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
        const { data: tasks, error: tasksError } = await supabase
          .from("tasks")
          .select("*")
          .eq("session_id", session.id)
          .order("start_time", { ascending: true });

        if (tasksError) throw tasksError;

        // 작업 내용 복호화
        const decryptedTasks = tasks.map((task) => ({
          id: task.id,
          content: decryptData(task.content, user.id),
          startTime: new Date(task.start_time),
          endTime: task.end_time ? new Date(task.end_time) : undefined,
          sessionId: task.session_id,
        }));

        // 총 작업 시간 계산
        let totalDuration = 0;
        if (session.end_time) {
          totalDuration =
            new Date(session.end_time).getTime() -
            new Date(session.start_time).getTime();
        } else if (decryptedTasks.length > 0) {
          const lastTask = decryptedTasks[decryptedTasks.length - 1];
          const endTime = lastTask.endTime || new Date();
          totalDuration =
            endTime.getTime() - new Date(session.start_time).getTime();
        }

        return {
          id: session.id,
          startTime: new Date(session.start_time),
          endTime: session.end_time ? new Date(session.end_time) : undefined,
          tasks: decryptedTasks,
          totalDuration,
        };
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
