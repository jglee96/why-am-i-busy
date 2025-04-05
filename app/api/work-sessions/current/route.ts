import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { decryptData } from "@/utils/encryption"; // 암호화 유틸 import 가정

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

    // 완료되지 않은 작업 세션 가져오기
    const { data: session, error } = await supabase
      .from("work_sessions")
      .select("*")
      .eq("user_id", user.id)
      .is("end_time", null)
      .order("start_time", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // 결과가 없는 경우
        return NextResponse.json({ workSession: null });
      }
      throw error;
    }

    // 세션에 대한 작업 가져오기
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
    const totalDuration =
      new Date().getTime() - new Date(session.start_time).getTime();

    const workSession = {
      id: session.id,
      startTime: new Date(session.start_time),
      endTime: session.end_time ? new Date(session.end_time) : undefined,
      tasks: decryptedTasks,
      totalDuration,
    };

    return NextResponse.json({ workSession });
  } catch (error) {
    console.error("Error fetching current work session:", error);
    return NextResponse.json(
      { error: "현재 작업 세션 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
