import {
  createAIPrompt,
  createTaskSummaries,
  getAuthUser,
  getSessionTasksData,
  getUserWorkSessionData,
} from "@/services/server/utils";
import { Task, WorkSession } from "@/types/work-session";
import { decryptData } from "@/utils/encryption";
import { createClient } from "@/utils/supabase/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const sessionId = params.id;

  try {
    const user = await getAuthUser(supabase);

    const tasksData = await getSessionTasksData(supabase, sessionId, user.id);

    // 작업 내용 복호화
    const decryptedTasks: Task[] = tasksData.map((task) => ({
      id: task.id,
      content: decryptData(task.content, user.id),
      startTime: task.start_time,
      endTime: task.end_time,
      sessionId: task.session_id,
    }));

    const taskSummaries = createTaskSummaries(decryptedTasks);
    const prompt = createAIPrompt(taskSummaries);

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: prompt,
    });

    return NextResponse.json({ summary: text });
  } catch (error) {
    console.error("Error generating AI summary:", error);
    return NextResponse.json(
      { error: "AI 요약 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

function generateAISummary(tasks: Task[]): string {
  // 여기에 AI 요약 생성 로직 구현
  // 예시: 작업 내용을 기반으로 요약 생성
  return "작업 세션에 대한 AI 요약";
}
