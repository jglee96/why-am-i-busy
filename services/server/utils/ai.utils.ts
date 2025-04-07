export const createAIPrompt = (taskSummaries: string) => {
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

  return prompt;
};
