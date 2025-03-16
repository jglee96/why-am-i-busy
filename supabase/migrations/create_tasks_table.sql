-- 작업 테이블 생성
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- RLS(Row Level Security) 정책 설정
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 작업만 볼 수 있음
CREATE POLICY "Users can view their own tasks" 
  ON public.tasks 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- 사용자는 자신의 작업만 추가할 수 있음
CREATE POLICY "Users can insert their own tasks" 
  ON public.tasks 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 작업만 업데이트할 수 있음
CREATE POLICY "Users can update their own tasks" 
  ON public.tasks 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- 사용자는 자신의 작업만 삭제할 수 있음
CREATE POLICY "Users can delete their own tasks" 
  ON public.tasks 
  FOR DELETE 
  USING (auth.uid() = user_id);

