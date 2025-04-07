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
interface WokrSessionArgType {
  id: string;
}
const endWorkSession = async (
  url: string,
  { arg }: { arg: WokrSessionArgType }
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

// 작업 세션 상세 조회
const getWorkSession = async (key: string[]): Promise<WorkSession> => {
  const [url, id] = key;
  const response = await fetch(url, {
    method: "GET",
    body: JSON.stringify({ id }),
  });
  return response.json();
};
export const useGetWorkSession = ({ id }: { id: string }) =>
  useSWR(["/api/work-sessions", id], getWorkSession);

// 현재 작업 세션 조회
const getCurrentWorkSession = async (url: string): Promise<WorkSession> => {
  const response = await fetch(url);
  return response.json();
};
export const useGetCurrentWorkSession = () =>
  useSWR("/api/work-sessions/current", getCurrentWorkSession);

// 작업 ai 요약
const generateSessionSummary = async (
  url: string,
  { arg }: { arg: WokrSessionArgType }
) => {
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(arg),
  });
  return response.json();
};
export const useGenerateSessionSummary = () =>
  useSWRMutation("/api/work-sessions/summary", generateSessionSummary);
