"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function LoginPage() {
  const { user, isLoading, signInWithGoogle } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !isLoading) {
      router.push("/tracker")
    }
  }, [user, isLoading, router])

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error("Failed to sign in:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">작업 시간 추적기</CardTitle>
          <CardDescription>Google 계정으로 로그인하여 작업 시간을 추적하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGoogleSignIn} className="w-full" size="lg">
            Google로 로그인
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

