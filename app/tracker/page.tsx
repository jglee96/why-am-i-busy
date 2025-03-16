"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Clock, CheckCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow, format } from "date-fns"
import { ko } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { createClient } from "@/utils/supabase/client"
import { encryptData, decryptData } from "@/utils/encryption"

interface Task {
  id: string
  content: string
  startTime: Date
  endTime?: Date
}

export default function TrackerPage() {
  const router = useRouter()
  const { user, isLoading, signOut } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  const [newTaskContent, setNewTaskContent] = useState("")
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isDataLoading, setIsDataLoading] = useState(true)
  const supabase = createClient()

  // 사용자가 로그인하지 않은 경우 로그인 페이지로 리디렉션
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  // Supabase에서 작업 데이터 로드
  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) return

      setIsDataLoading(true)

      try {
        // 완료된 작업 가져오기
        const { data: completedTasks, error: completedError } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", user.id)
          .not("end_time", "is", null)
          .order("start_time", { ascending: false })

        if (completedError) throw completedError

        // 진행 중인 작업 가져오기
        const { data: currentTaskData, error: currentError } = await supabase
          .from("tasks")
          .select("*")
          .eq("user_id", user.id)
          .is("end_time", null)
          .order("start_time", { ascending: false })
          .limit(1)
          .single()

        // 데이터 변환 및 복호화
        const formattedTasks = completedTasks.map((task) => ({
          id: task.id,
          content: decryptData(task.content, user.id),
          startTime: new Date(task.start_time),
          endTime: task.end_time ? new Date(task.end_time) : undefined,
        }))

        setTasks(formattedTasks)

        if (currentTaskData && !currentError) {
          setCurrentTask({
            id: currentTaskData.id,
            content: decryptData(currentTaskData.content, user.id),
            startTime: new Date(currentTaskData.start_time),
            endTime: currentTaskData.end_time ? new Date(currentTaskData.end_time) : undefined,
          })
        } else {
          setCurrentTask(null)
        }
      } catch (error) {
        console.error("Error fetching tasks:", error)
      } finally {
        setIsDataLoading(false)
      }
    }

    if (user) {
      fetchTasks()
    }
  }, [user, supabase])

  // 현재 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !newTaskContent.trim()) return

    const now = new Date()

    try {
      // 현재 작업이 있으면 완료 처리
      if (currentTask) {
        const { error: updateError } = await supabase
          .from("tasks")
          .update({ end_time: now.toISOString() })
          .eq("id", currentTask.id)

        if (updateError) throw updateError

        const completedTask = { ...currentTask, endTime: now }
        setTasks((prevTasks) => [completedTask, ...prevTasks])
      }

      // 새 작업 생성
      const encryptedContent = encryptData(newTaskContent, user.id)

      const { data: newTaskData, error: insertError } = await supabase
        .from("tasks")
        .insert({
          user_id: user.id,
          content: encryptedContent,
          start_time: now.toISOString(),
        })
        .select()
        .single()

      if (insertError) throw insertError

      const newTask: Task = {
        id: newTaskData.id,
        content: newTaskContent,
        startTime: now,
      }

      setCurrentTask(newTask)
      setNewTaskContent("")
    } catch (error) {
      console.error("Error saving task:", error)
    }
  }

  const handleEndWork = async () => {
    if (!user) return

    const now = new Date()

    try {
      // 현재 작업이 있으면 완료 처리
      if (currentTask) {
        const { error: updateError } = await supabase
          .from("tasks")
          .update({ end_time: now.toISOString() })
          .eq("id", currentTask.id)

        if (updateError) throw updateError

        const completedTask = { ...currentTask, endTime: now }
        setTasks((prevTasks) => [completedTask, ...prevTasks])
        setCurrentTask(null)
      }

      // 리뷰 페이지로 이동
      router.push("/review")
    } catch (error) {
      console.error("Error ending work:", error)
    }
  }

  const formatElapsedTime = (startTime: Date, endTime: Date = currentTime) => {
    const elapsedMs = endTime.getTime() - startTime.getTime()

    const hours = Math.floor(elapsedMs / (1000 * 60 * 60))
    const minutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((elapsedMs % (1000 * 60)) / 1000)

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  if (isLoading || isDataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>로딩 중...</p>
      </div>
    )
  }

  return (
    <main className="container mx-auto p-4 max-w-3xl pb-24">
      <div className="flex justify-between items-center mb-8 mt-8">
        <h1 className="text-3xl font-bold">작업 시간 추적기</h1>
        <Button variant="outline" onClick={signOut}>
          로그아웃
        </Button>
      </div>

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
                  시작: {format(currentTask.startTime, "HH:mm:ss", { locale: ko })}
                </p>
              </div>
              <div className="text-2xl font-mono font-bold text-primary">
                {formatElapsedTime(currentTask.startTime)}
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
          <p className="text-center text-muted-foreground py-8">아직 기록된 작업이 없습니다. 첫 작업을 입력해보세요!</p>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <Card key={task.id} className="border-muted">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{task.content}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(task.startTime, "HH:mm:ss", { locale: ko })} -
                        {task.endTime && format(task.endTime, " HH:mm:ss", { locale: ko })}
                        {task.endTime && ` (${formatElapsedTime(task.startTime, task.endTime)})`}
                      </p>
                    </div>
                    <div className="text-sm">
                      {formatDistanceToNow(task.startTime, { addSuffix: true, locale: ko })}
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
        <Button onClick={handleEndWork} size="lg" variant="destructive" className="rounded-full shadow-lg">
          퇴근하기
        </Button>
      </div>
    </main>
  )
}

