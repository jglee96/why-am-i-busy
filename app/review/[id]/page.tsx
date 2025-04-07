"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/utils/supabase/client";
import { decryptData } from "@/utils/encryption";
import type { WorkSession, Task } from "@/types/work-session";
import { formatDateTime, formatTime, formatDuration } from "@/utils/date-utils";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { useGetWorkSession } from "@/services/work-session.service";

export default function SessionReviewPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  const { user, isLoading } = useAuth();
  const [summary, setSummary] = useState<string>("");
  const [isDataLoading, setIsDataLoading] = useState(true);
  const supabase = createClient();
  const { data: session } = useGetWorkSession({ id: sessionId });

  // 사용자가 로그인하지 않은 경우 로그인 페이지로 리디렉션
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // 세션 데이터 로드
  useEffect(() => {
    const fetchSessionData = async () => {
      if (!user || !sessionId) return;

      setIsDataLoading(true);

      try {
        // 작업 요약 생성
        if (!session?.tasks) {
          generateSessionSummary(session);
        } else {
          setSummary("이 세션에 기록된 작업이 없습니다.");
          setIsDataLoading(false);
        }
      } catch (error) {
        console.error("Error fetching session data:", error);
        setIsDataLoading(false);
      }
    };

    if (user && sessionId) {
      fetchSessionData();
    }
  }, [user, sessionId, supabase]);

  const generateSessionSummary = async (session: WorkSession) => {
    if (session.tasks.length === 0) {
      setSummary("이 세션에 기록된 작업이 없습니다.");
      setIsDataLoading(false);
      return;
    }
    setIsDataLoading(true);
    const response = await fetch("/api/generate-summary", {
      method: "POST",
      body: JSON.stringify(session),
    });
    const data = await response.json();
    setSummary(data.summary);
    setIsDataLoading(false);
  };

  const handleBackToHome = () => {
    router.push("/");
  };

  if (isLoading || isDataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>로딩 중...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>세션을 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <main className="container mx-auto p-4 max-w-3xl">
      <div className="flex items-center mb-8 mt-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBackToHome}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">작업 세션 리뷰</h1>
      </div>

      <Card className="mb-8">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">세션 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">시작 시간</p>
              <p className="font-medium">{formatDateTime(session.startTime)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">종료 시간</p>
              <p className="font-medium">
                {session.endTime ? formatDateTime(session.endTime) : "진행 중"}
              </p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-muted-foreground">총 작업 시간</p>
              <p className="text-xl font-mono font-bold text-primary">
                {formatDuration(session.totalDuration)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            작업 목록
          </CardTitle>
        </CardHeader>
        <CardContent>
          {session.tasks.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              이 세션에 기록된 작업이 없습니다.
            </p>
          ) : (
            <div className="space-y-4">
              {session.tasks.map((task) => (
                <div key={task.id} className="border-b pb-3 last:border-0">
                  <p className="font-medium">{task.content}</p>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      {formatTime(task.startTime)} ~
                      {task.endTime ? formatTime(task.endTime) : "진행 중"}
                    </span>
                    {task.endTime && (
                      <span>
                        {formatDuration(
                          task.endTime.getTime() - task.startTime.getTime()
                        )}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">AI 세션 리뷰</CardTitle>
        </CardHeader>
        <CardContent>
          {isDataLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">
                세션 리뷰를 생성하고 있습니다...
              </p>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              {summary?.split("\n").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 text-center">
        <Button onClick={handleBackToHome} size="lg">
          홈으로 돌아가기
        </Button>
      </div>
    </main>
  );
}
