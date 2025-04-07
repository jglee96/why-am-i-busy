"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatTime, formatDuration, groupByDay } from "@/utils/date-utils";
import { Clock, Calendar, ChevronRight } from "lucide-react";
import { useGetWorkSessions } from "@/services/server/work-session.service";

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { data: workSessions, isLoading: isSessionsLoading } =
    useGetWorkSessions();

  const handleStartWork = () => {
    if (user) {
      router.push("/tracker");
    } else {
      router.push("/login");
    }
  };

  const groupedSessions = groupByDay(workSessions);

  if (isLoading || isSessionsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <main className="container mx-auto p-4 max-w-3xl">
      <div className="text-center my-8">
        <h1 className="text-4xl font-bold mb-4">작업 시간 추적기</h1>
        <p className="text-xl mb-8 text-muted-foreground">
          하루 동안의 작업을 추적하고 시간을 효율적으로 관리하세요
        </p>
        <Button
          size="lg"
          onClick={handleStartWork}
          className="text-lg px-8 py-6 mb-12"
        >
          출근하기
        </Button>
      </div>

      {Object.keys(groupedSessions).length > 0 ? (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            이전 작업 기록
          </h2>

          <Accordion type="single" collapsible className="space-y-4">
            {Object.entries(groupedSessions)
              .sort(
                ([dateA], [dateB]) =>
                  new Date(dateB).getTime() - new Date(dateA).getTime()
              )
              .map(([dateKey, sessions]) => (
                <AccordionItem
                  key={dateKey}
                  value={dateKey}
                  className="border rounded-lg overflow-hidden"
                >
                  <AccordionTrigger className="px-4 py-3 hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {new Date(dateKey).toLocaleDateString("ko-KR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          weekday: "long",
                        })}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({sessions.length}개 세션)
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-0">
                    <div className="space-y-3 py-2">
                      {sessions.map((session) => (
                        <Card key={session.id} className="border-0 shadow-none">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary" />
                                <span className="font-medium">
                                  {formatTime(session.startTime)} ~{" "}
                                  {session.endTime
                                    ? formatTime(session.endTime)
                                    : "진행 중"}
                                </span>
                              </div>
                              <span className="text-sm font-mono text-primary">
                                {formatDuration(session.totalDuration)}
                              </span>
                            </div>

                            {session.tasks.length > 0 ? (
                              <div className="mt-3 space-y-2">
                                <div className="text-sm text-muted-foreground mb-1">
                                  작업 목록:
                                </div>
                                {session.tasks.map((task) => (
                                  <div
                                    key={task.id}
                                    className="pl-4 border-l-2 border-muted py-1"
                                  >
                                    <div className="flex justify-between">
                                      <span>{task.content}</span>
                                      {task.endTime && (
                                        <span className="text-xs text-muted-foreground">
                                          {formatDuration(
                                            task.endTime.getTime() -
                                              task.startTime.getTime()
                                          )}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {formatTime(task.startTime)} ~{" "}
                                      {task.endTime
                                        ? formatTime(task.endTime)
                                        : "진행 중"}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground mt-2">
                                기록된 작업이 없습니다.
                              </div>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-3 w-full text-primary"
                              onClick={() =>
                                router.push(`/review/${session.id}`)
                              }
                            >
                              <span>세션 상세 보기</span>
                              <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
          </Accordion>
        </div>
      ) : (
        user && (
          <div className="text-center py-12 border rounded-lg bg-muted/20">
            <p className="text-muted-foreground">
              아직 기록된 작업 세션이 없습니다.
            </p>
            <p className="text-muted-foreground mt-1">
              출근하기 버튼을 눌러 첫 작업을 시작해보세요!
            </p>
          </div>
        )
      )}
    </main>
  );
}
