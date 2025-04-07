import { Task, WorkSession } from "@/types/work-session";
import { decryptData } from "@/utils/encryption";
import { SupabaseClient } from "@supabase/supabase-js";

export const getUserWorkSessionData = async (
  supabase: SupabaseClient,
  sessionId: string,
  userId: string
) => {
  const { data, error } = await supabase
    .from("work_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (error) throw error;

  return data;
};

// 세션에 대한 작업 가져오기
export const getSessionTasksData = async (
  supabase: SupabaseClient,
  sessionId: string,
  userId: string
) => {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("session_id", sessionId)
    .order("start_time", { ascending: true });

  if (error) throw error;

  return data;
};

export const createWorkSessionFromDate = async (
  sessionData: any,
  tasksData: any[],
  userId: string
) => {
  // 작업 내용 복호화
  const decryptedTasks: Task[] = tasksData.map((task) => ({
    id: task.id,
    content: decryptData(task.content, userId),
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
    endTime: sessionData.end_time ? new Date(sessionData.end_time) : undefined,
    tasks: decryptedTasks,
    totalDuration,
  };

  return workSession;
};

export const createTaskSummaries = (tasks: any[]) => {
  const taskSummaries = tasks
    .map((task: { startTime: string; endTime: string; content: string }) => {
      const startTime = new Date(task.startTime).toLocaleTimeString("ko-KR");
      const endTime = task.endTime
        ? new Date(task.endTime).toLocaleTimeString("ko-KR")
        : "완료되지 않음";

      let duration = "알 수 없음";
      if (task.endTime) {
        const durationMs =
          new Date(task.endTime).getTime() - new Date(task.startTime).getTime();
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor(
          (durationMs % (1000 * 60 * 60)) / (1000 * 60)
        );
        duration = `${hours}시간 ${minutes}분`;
      }

      return `- 작업: ${task.content}\n  시작: ${startTime}, 종료: ${endTime}, 소요시간: ${duration}`;
    })
    .join("\n");

  return taskSummaries;
};
