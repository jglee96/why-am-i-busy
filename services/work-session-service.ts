import { createClient } from "@/utils/supabase/client";
import type { WorkSession, Task } from "@/types/work-session";
import { decryptData } from "@/utils/encryption";

export async function createWorkSession(
  userId: string
): Promise<string | null> {
  const supabase = createClient();
  const now = new Date();

  try {
    const { data, error } = await supabase
      .from("work_sessions")
      .insert({
        user_id: userId,
        start_time: now.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error("Error creating work session:", error);
    return null;
  }
}

export async function endWorkSession(sessionId: string): Promise<boolean> {
  const supabase = createClient();
  const now = new Date();

  try {
    const { error } = await supabase
      .from("work_sessions")
      .update({
        end_time: now.toISOString(),
      })
      .eq("id", sessionId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error ending work session:", error);
    return false;
  }
}

export async function getWorkSessions(userId: string): Promise<WorkSession[]> {
  const supabase = createClient();

  try {
    // 작업 세션 가져오기
    const { data: sessions, error: sessionsError } = await supabase
      .from("work_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("start_time", { ascending: false });

    if (sessionsError) throw sessionsError;

    // 각 세션에 대한 작업 가져오기
    const workSessions: WorkSession[] = await Promise.all(
      sessions.map(async (session) => {
        const { data: tasks, error: tasksError } = await supabase
          .from("tasks")
          .select("*")
          .eq("session_id", session.id)
          .order("start_time", { ascending: true });

        if (tasksError) throw tasksError;

        // 작업 내용 복호화
        const decryptedTasks: Task[] = tasks.map((task) => ({
          id: task.id,
          content: decryptData(task.content, userId),
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

    return workSessions;
  } catch (error) {
    console.error("Error fetching work sessions:", error);
    return [];
  }
}

export async function getCurrentWorkSession(
  userId: string
): Promise<WorkSession | null> {
  const supabase = createClient();

  try {
    // 완료되지 않은 작업 세션 가져오기
    const { data: session, error } = await supabase
      .from("work_sessions")
      .select("*")
      .eq("user_id", userId)
      .is("end_time", null)
      .order("start_time", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // 결과가 없는 경우
        return null;
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
    const decryptedTasks: Task[] = tasks.map((task) => ({
      id: task.id,
      content: decryptData(task.content, userId),
      startTime: new Date(task.start_time),
      endTime: task.end_time ? new Date(task.end_time) : undefined,
      sessionId: task.session_id,
    }));

    // 총 작업 시간 계산
    const totalDuration =
      new Date().getTime() - new Date(session.start_time).getTime();

    return {
      id: session.id,
      startTime: new Date(session.start_time),
      endTime: session.end_time ? new Date(session.end_time) : undefined,
      tasks: decryptedTasks,
      totalDuration,
    };
  } catch (error) {
    console.error("Error fetching current work session:", error);
    return null;
  }
}
