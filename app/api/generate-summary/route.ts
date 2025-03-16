import { type NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: NextRequest) {
  try {
    const { tasks } = await req.json();

    if (!tasks || tasks.length === 0) {
      return NextResponse.json({ summary: "오늘 기록된 작업이 없습니다." });
    }

    // Format tasks for the prompt
    const taskSummaries = tasks
      .map((task: { startTime: string; endTime: string; content: string }) => {
        const startTime = new Date(task.startTime).toLocaleTimeString("ko-KR");
        const endTime = task.endTime
          ? new Date(task.endTime).toLocaleTimeString("ko-KR")
          : "완료되지 않음";

        let duration = "알 수 없음";
        if (task.endTime) {
          const durationMs =
            new Date(task.endTime).getTime() -
            new Date(task.startTime).getTime();
          const hours = Math.floor(durationMs / (1000 * 60 * 60));
          const minutes = Math.floor(
            (durationMs % (1000 * 60 * 60)) / (1000 * 60)
          );
          duration = `${hours}시간 ${minutes}분`;
        }

        return `- 작업: ${task.content}\n  시작: ${startTime}, 종료: ${endTime}, 소요시간: ${duration}`;
      })
      .join("\n");

    const prompt = `
다음은 사용자가 오늘 수행한 작업 목록입니다:

${taskSummaries}

이 작업 목록을 바탕으로 사용자의 하루를 분석해주세요. 다음 내용을 포함해주세요:
1. 오늘 가장 많은 시간을 투자한 작업은 무엇인지
2. 작업 패턴에서 발견할 수 있는 특징 (예: 집중 시간대, 작업 전환 빈도 등)
3. 생산성을 높이기 위한 제안
4. 내일을 위한 조언

친근하고 격려하는 톤으로 작성해주세요. 한국어로 응답해주세요.
`;

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt: prompt,
    });

    return NextResponse.json({ summary: text });
  } catch (error) {
    console.error("Error generating summary:", error);
    return NextResponse.json(
      { error: "하루 리뷰를 생성하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
