import { Task, WorkSession } from "@/types/work-session";
import { decryptData } from "@/utils/encryption";
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

export async function GET(
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

    // 세션 정보 가져오기
    const { data: sessionData, error: sessionsError } = await supabase
      .from("work_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (sessionsError) throw sessionsError;

    // 세션에 대한 작업 가져오기
    const { data: tasksData, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .eq("session_id", sessionId)
      .order("start_time", { ascending: true });

    if (tasksError) throw tasksError;

    // 작업 내용 복호화
    const decryptedTasks: Task[] = tasksData.map((task) => ({
      id: task.id,
      content: decryptData(task.content, user.id),
      startTime: new Date(task.start_time),
      endTime: task.end_time ? new Date(task.end_time) : undefined,
      sessionId: task.session_id,
    }));

    // 총 작업 시간 계산
    let totalDuration = 0;
    if (sessionData.end_time) {
      totalDuration =
        new Date(sessionData.end_time).getTime() -
        new Date(sessionData.start_time).getTime();
    } else if (decryptedTasks.length > 0) {
      const lastTask = decryptedTasks[decryptedTasks.length - 1];
      const endTime = lastTask.endTime || new Date();
      totalDuration =
        endTime.getTime() - new Date(sessionData.start_time).getTime();
    }

    const workSession: WorkSession = {
      id: sessionData.id,
      startTime: new Date(sessionData.start_time),
      endTime: sessionData.end_time
        ? new Date(sessionData.end_time)
        : undefined,
      tasks: decryptedTasks,
      totalDuration,
    };

    return NextResponse.json(workSession);
  } catch (error) {
    console.error("Error getting work session:", error);
    return NextResponse.json(
      { error: "작업 세션 가져오기 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
