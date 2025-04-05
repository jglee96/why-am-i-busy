import useSWRMutation from "swr/mutation";
import useSWR from "swr";
import { WorkSession } from "@/types/work-session";

// 작업 세션 생성
const createWorkSession = async (url: string) => {
  const response = await fetch(url, {
    method: "POST",
  });

  return response.json();
};

export const useCreateWorkSession = () =>
  useSWRMutation("/api/work-sessions", createWorkSession);

// 작업 세션 종료
interface EndWokrSessionArgType {
  id: string;
}
const endWorkSession = async (
  url: string,
  { arg }: { arg: EndWokrSessionArgType }
) => {
  const response = await fetch(url, {
    method: "PATCH",
    body: JSON.stringify(arg),
  });

  return response.json();
};
export const useEndWorkSession = () =>
  useSWRMutation("/api/work-sessions/[id]", endWorkSession);

// 작업 세션들 조회
const getWorkSessions = async (url: string): Promise<WorkSession[]> => {
  const response = await fetch(url);
  return response.json();
};
export const useGetWorkSessions = () =>
  useSWR("/api/work-sessions", getWorkSessions);

// 현재 작업 세션 조회
const getCurrentWorkSession = async (url: string): Promise<WorkSession> => {
  const response = await fetch(url);
  return response.json();
};
export const useGetCurrentWorkSession = () =>
  useSWR("/api/work-sessions/current", getCurrentWorkSession);
