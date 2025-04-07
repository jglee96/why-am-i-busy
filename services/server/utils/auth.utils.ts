import { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const getAuthUser = async (supabase: SupabaseClient) => {
  // 현재 로그인된 유저 정보 가져오기
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw NextResponse.json(
      { error: "인증되지 않은 사용자입니다." },
      { status: 401 }
    );
  }

  return user;
};
