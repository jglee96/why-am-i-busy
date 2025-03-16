"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useEffect } from "react"

export default function Home() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/tracker")
    }
  }, [user, isLoading, router])

  const handleStartWork = () => {
    router.push("/login")
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>로딩 중...</p>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">작업 시간 추적기</h1>
        <p className="text-xl mb-12 text-muted-foreground">하루 동안의 작업을 추적하고 시간을 효율적으로 관리하세요</p>
        <Button size="lg" onClick={handleStartWork} className="text-lg px-8 py-6">
          출근하기
        </Button>
      </div>
    </main>
  )
}

