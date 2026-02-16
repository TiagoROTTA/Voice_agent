-- interview_logs: stores transcript, audio URL, structured answers, and persona validation
create table if not exists interview_logs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  conversation_id text,
  transcript text,
  audio_url text,
  structured_answers jsonb not null default '{}',
  is_valid_persona boolean,
  created_at timestamptz default now()
);

create index if not exists interview_logs_lead_id_idx on interview_logs(lead_id);
create index if not exists interview_logs_conversation_id_idx on interview_logs(conversation_id);
