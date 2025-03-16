"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Clock, ArrowLeft, Loader2 } from "lucide-react"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/utils/supabase/client"
import { decryptData } from "@/utils/encryption"

interface Task {
  id: string
  content: string
  startTime: Date
  endTime?: Date
}

export default function ReviewPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [summary, setSummary] = useState<string>("")
  const [isDataLoading, setIsDataLoading] = useState(true)
  const supabase = createClient()

  // 사용자가 로그인하지 않은 경우 로그인 페이지로 리디렉션
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  // Supabase에서 오늘의 작업 데이터 로드
  useEffect(() => {
    const fetchTodayTasks = async () => {
      if (!user) return

      setIsDataLoading(true)

      try {
        // 오늘 날짜의 시작과 끝 계산
        const today = new Date()
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString()

        // 오늘의 완료된 작업 가져오기
        const { data: todayTasks, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", user.id)
          .gte("start_time", startOfDay)
          .lte("start_time", endOfDay)
          .not("end_time", "is", null)
          .order("start_time", { ascending: true })

        if (error) throw error

        // 데이터 변환 및 복호화
        const formattedTasks = todayTasks.map((task) => ({
          id: task.id,
          content: decryptData(task.content, user.id),
          startTime: new Date(task.start_time),
          endTime: task.end_time ? new Date(task.end_time) : undefined,
        }))

        setTasks(formattedTasks)

        // 작업 요약 생성
        if (formattedTasks.length > 0) {
          generateSummary(formattedTasks)
        } else {
          setSummary("오늘 기록된 작업이 없습니다.")
          setIsDataLoading(false)
        }
      } catch (error) {
        console.error("Error fetching today's tasks:", error)
        setIsDataLoading(false)
      }
    }

    if (user) {
      fetchTodayTasks()
    }
  }, [user, supabase])

  const generateSummary = async (tasks: Task[]) => {
    if (tasks.length === 0) {
      setSummary("오늘 기록된 작업이 없습니다.")
      setIsDataLoading(false)
      return
    }

    try {
      // 작업 요약 형식 지정
      const taskSummaries = tasks
        .map((task) => {
          const startTime = format(new Date(task.startTime), "HH:mm:ss", { locale: ko })
          const endTime = task.endTime ? format(new Date(task.endTime), "HH:mm:ss", { locale: ko }) : "완료되지 않음"

          let duration = "알 수 없음"
          if (task.endTime) {
            const durationMs = new Date(task.endTime).getTime() - new Date(task.startTime).getTime()
            const hours = Math.floor(durationMs / (1000 * 60 * 60))
            const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
            duration = `${hours}시간 ${minutes}분`
          }

          return `- 작업: ${task.content}\n  시작: ${startTime}, 종료: ${endTime}, 소요시간: ${duration}`
        })
        .join("\n")

      const prompt = `
다음은 사용자가 오늘 수행한 작업 목록입니다:

${taskSummaries}

이 작업 목록을 바탕으로 사용자의 하루를 분석해주세요. 다음 내용을 포함해주세요:
1. 오늘 가장 많은 시간을 투자한 작업은 무엇인지
2. 작업 패턴에서 발견할 수 있는 특징 (예: 집중 시간대, 작업 전환 빈도 등)
3. 생산성을 높이기 위한 제안
4. 내일을 위한 조언

친근하고 격려하는 톤으로 작성해주세요. 한국어로 응답해주세요.
`

      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt: prompt,
      })

      setSummary(text)
    } catch (error) {
      console.error("Error generating summary:", error)
      setSummary("죄송합니다. 하루 리뷰를 생성하는 중 오류가 발생했습니다.")
    } finally {
      setIsDataLoading(false)
    }
  }

  const formatElapsedTime = (startTime: Date, endTime: Date) => {
    const elapsedMs = endTime.getTime() - startTime.getTime()

    const hours = Math.floor(elapsedMs / (1000 * 60 * 60))
    const minutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((elapsedMs % (1000 * 60)) / 1000)

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const getTotalWorkTime = () => {
    if (tasks.length === 0) return "00:00:00"

    const totalMs = tasks.reduce((total, task) => {
      if (!task.endTime) return total
      return total + (new Date(task.endTime).getTime() - new Date(task.startTime).getTime())
    }, 0)

    const hours = Math.floor(totalMs / (1000 * 60 * 60))
    const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((totalMs % (1000 * 60)) / 1000)

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const handleBackToHome = () => {
    router.push("/")
  }

  if (isLoading || isDataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>로딩 중...</p>
      </div>
    )
  }

  return (
    <main className="container mx-auto p-4 max-w-3xl">
      <div className="flex items-center mb-8 mt-8">
        <Button variant="ghost" size="icon" onClick={handleBackToHome} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-3xl font-bold">오늘의 업무 리뷰</h1>
      </div>

      <Card className="mb-8">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />총 근무 시간
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-mono font-bold text-primary text-center">{getTotalWorkTime()}</div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">오늘의 작업 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">오늘 기록된 작업이 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="border-b pb-3 last:border-0">
                  <p className="font-medium">{task.content}</p>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      {format(new Date(task.startTime), "HH:mm:ss", { locale: ko })} -
                      {task.endTime && format(new Date(task.endTime), " HH:mm:ss", { locale: ko })}
                    </span>
                    {task.endTime && <span>{formatElapsedTime(new Date(task.startTime), new Date(task.endTime))}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">AI 하루 리뷰</CardTitle>
        </CardHeader>
        <CardContent>
          {isDataLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">하루 리뷰를 생성하고 있습니다...</p>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              {summary.split("\n").map((paragraph, index) => (
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
  )
}

