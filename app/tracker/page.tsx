"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Clock, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/utils/supabase/client";
import { encryptData } from "@/utils/encryption";
import type { Task } from "@/types/work-session";
import {
  formatTime,
  formatDuration,
  formatRelativeTime,
} from "@/utils/date-utils";
import {
  useCreateWorkSession,
  useEndWorkSession,
  useGetCurrentWorkSession,
} from "@/services/work-session.service";

export default function TrackerPage() {
  const router = useRouter();
  const { user, isLoading, signOut } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [newTaskContent, setNewTaskContent] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const supabase = createClient();
  const { data: currentWorkSession, isLoading: isCurrentWorkSessionLoading } =
    useGetCurrentWorkSession();
  const { trigger: createWorkSession } = useCreateWorkSession();
  const { trigger: endWorkSession } = useEndWorkSession();
  // 사용자가 로그인하지 않은 경우 로그인 페이지로 리디렉션
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // 현재 작업 세션 로드 또는 새 세션 생성
  useEffect(() => {
    const initializeSession = async () => {
      if (!user) return;

      setIsDataLoading(true);

      try {
        if (currentWorkSession) {
          // 기존 세션이 있는 경우
          setSessionId(currentWorkSession.id);
          setSessionStartTime(currentWorkSession.startTime);
          setTasks(currentWorkSession?.tasks.filter((task) => task.endTime)); // 완료된 작업만

          // 진행 중인 작업이 있는지 확인
          const ongoingTask = currentWorkSession.tasks.find(
            (task) => !task.endTime
          );
          if (ongoingTask) {
            setCurrentTask(ongoingTask);
          }
        } else {
          // 새 세션 생성
          const newSessionId = await createWorkSession();
          if (newSessionId) {
            setSessionId(newSessionId);
            setSessionStartTime(new Date());
          }
        }
      } catch (error) {
        console.error("Error initializing session:", error);
      } finally {
        setIsDataLoading(false);
      }
    };

    if (user) {
      initializeSession();
    }
  }, [user]);

  // 현재 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !sessionId || !newTaskContent.trim()) return;

    const now = new Date();

    try {
      // 현재 작업이 있으면 완료 처리
      if (currentTask) {
        const { error: updateError } = await supabase
          .from("tasks")
          .update({ end_time: now.toISOString() })
          .eq("id", currentTask.id);

        if (updateError) throw updateError;

        const completedTask = { ...currentTask, endTime: now };
        setTasks((prevTasks) => [completedTask, ...prevTasks]);
      }

      // 새 작업 생성
      const encryptedContent = encryptData(newTaskContent, user.id);

      const { data: newTaskData, error: insertError } = await supabase
        .from("tasks")
        .insert({
          user_id: user.id,
          content: encryptedContent,
          start_time: now.toISOString(),
          session_id: sessionId,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const newTask: Task = {
        id: newTaskData.id,
        content: newTaskContent,
        startTime: now,
        sessionId: sessionId,
      };

      setCurrentTask(newTask);
      setNewTaskContent("");
    } catch (error) {
      console.error("Error saving task:", error);
    }
  };

  const handleEndWork = async () => {
    if (!user || !sessionId) return;

    const now = new Date();

    try {
      // 현재 작업이 있으면 완료 처리
      if (currentTask) {
        const { error: updateError } = await supabase
          .from("tasks")
          .update({ end_time: now.toISOString() })
          .eq("id", currentTask.id);

        if (updateError) throw updateError;
      }

      // 세션 종료
      await endWorkSession({ id: sessionId });

      // 리뷰 페이지로 이동
      router.push(`/review/${sessionId}`);
    } catch (error) {
      console.error("Error ending work:", error);
    }
  };

  if (isLoading || isDataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <main className="container mx-auto p-4 max-w-3xl pb-24">
      <div className="flex justify-between items-center mb-8 mt-8">
        <h1 className="text-3xl font-bold">작업 시간 추적기</h1>
        <Button variant="outline" onClick={signOut}>
          로그아웃
        </Button>
      </div>

      {sessionStartTime && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">출근 시간</p>
                <p className="text-lg font-medium">
                  {formatTime(sessionStartTime)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">경과 시간</p>
                <p className="text-lg font-mono font-medium text-primary">
                  {formatDuration(
                    currentTime.getTime() - sessionStartTime.getTime()
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-2">
          <Input
            type="text"
            value={newTaskContent}
            onChange={(e) => setNewTaskContent(e.target.value)}
            placeholder="지금 무슨 작업을 하고 있나요?"
            className="flex-1"
          />
          <Button type="submit">시작</Button>
        </div>
      </form>

      {currentTask && (
        <Card className="mb-8 border-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              현재 작업
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xl font-medium">{currentTask.content}</p>
                <p className="text-sm text-muted-foreground">
                  시작: {formatTime(currentTask.startTime)}
                </p>
              </div>
              <div className="text-2xl font-mono font-bold text-primary">
                {formatDuration(
                  currentTime.getTime() - currentTask.startTime.getTime()
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          완료된 작업
        </h2>

        {tasks.length === 0 && !currentTask ? (
          <p className="text-center text-muted-foreground py-8">
            아직 기록된 작업이 없습니다. 첫 작업을 입력해보세요!
          </p>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <Card key={task.id} className="border-muted">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{task.content}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(task.startTime)} -
                        {task.endTime && formatTime(task.endTime)}
                        {task.endTime &&
                          ` (${formatDuration(
                            task.endTime.getTime() - task.startTime.getTime()
                          )})`}
                      </p>
                    </div>
                    <div className="text-sm">
                      {formatRelativeTime(task.startTime)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Fixed End Work button */}
      <div className="fixed bottom-6 right-6">
        <Button
          onClick={handleEndWork}
          size="lg"
          variant="destructive"
          className="rounded-full shadow-lg"
        >
          퇴근하기
        </Button>
      </div>
    </main>
  );
}
