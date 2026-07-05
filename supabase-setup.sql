-- Run this once in your Supabase project's SQL Editor
-- (Dashboard -> SQL Editor -> New query -> paste all of this -> Run)

-- 1. One row per user, holding their entire workspace as JSON.
--    This is deliberately simple (a personal tracker, not a multi-tenant
--    relational app) so the whole app can autosave with a single upsert.
create table if not exists job_tracker_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table job_tracker_data enable row level security;

create policy "Users can view own data"
  on job_tracker_data for select
  using (auth.uid() = user_id);

create policy "Users can insert own data"
  on job_tracker_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update own data"
  on job_tracker_data for update
  using (auth.uid() = user_id);

-- 2. Storage bucket for uploaded resumes / cover letters / certificates.
--    Marked public for simplicity: file paths are random and unguessable
--    (userId/uid-filename), but anyone with the exact URL could view a file.
--    If you'd rather it be fully private, flip `public` to false below and
--    switch the app to use `createSignedUrl` instead of `getPublicUrl`.
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

create policy "Users can upload their own documents"
  on storage.objects for insert
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can view their own documents"
  on storage.objects for select
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own documents"
  on storage.objects for delete
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

-- Done. In Authentication -> Providers, Email sign-up is on by default.
-- Optional: Authentication -> Settings -> disable "Confirm email" while you're
-- testing, so you can sign up and use the app immediately without a confirmation email.
