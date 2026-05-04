-- Supabase 대시보드의 SQL Editor에 이 코드를 복사해서 붙여넣고 Run(실행) 버튼을 눌러주세요.

CREATE TABLE IF NOT EXISTS public.dashboard_data (
  id integer PRIMARY KEY,
  content jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS (Row Level Security) 설정 해제 (가장 쉽고 빠른 접근 허용)
-- 만약 향후 로그인 기능 등 보안을 강화하고 싶다면 별도의 정책(Policy)이 필요합니다.
ALTER TABLE public.dashboard_data DISABLE ROW LEVEL SECURITY;
