-- 작업 세션 테이블 생성
CREATE TABLE IF NOT EXISTS public.work_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT work_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- tasks 테이블에 session_id 컬럼 추가
ALTER TABLE public.tasks 
ADD COLUMN session_id UUID REFERENCES public.work_sessions(id) ON DELETE CASCADE;

-- RLS(Row Level Security) 정책 설정
ALTER TABLE public.work_sessions ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 세션만 볼 수 있음
CREATE POLICY "Users can view their own work sessions" 
  ON public.work_sessions 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- 사용자는 자신의 세션만 추가할 수 있음
CREATE POLICY "Users can insert their own work sessions" 
  ON public.work_sessions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 세션만 업데이트할 수 있음
CREATE POLICY "Users can update their own work sessions" 
  ON public.work_sessions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- 사용자는 자신의 세션만 삭제할 수 있음
CREATE POLICY "Users can delete their own work sessions" 
  ON public.work_sessions 
  FOR DELETE 
  USING (auth.uid() = user_id);

