-- Lion Dev v3.0 - Supabase Migration
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- ==========================================
-- TABLES
-- ==========================================

-- Projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  model text not null default 'claude-sonnet-4-5-20250929',
  current_template jsonb,
  system_prompt text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  role text not null check (role in ('user', 'ai')),
  content text,
  template_json jsonb,
  created_at timestamptz default now()
);

-- Message Images
create table if not exists public.message_images (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.messages(id) on delete cascade not null,
  storage_path text not null,
  created_at timestamptz default now()
);

-- Template Versions
create table if not exists public.template_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  version_number int not null,
  title text,
  template jsonb not null,
  created_at timestamptz default now(),
  unique(project_id, version_number)
);

-- ==========================================
-- INDEXES
-- ==========================================

create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_messages_project_id on public.messages(project_id);
create index if not exists idx_message_images_message_id on public.message_images(message_id);
create index if not exists idx_template_versions_project_id on public.template_versions(project_id);

-- ==========================================
-- ROW LEVEL SECURITY
-- ==========================================

alter table public.projects enable row level security;
alter table public.messages enable row level security;
alter table public.message_images enable row level security;
alter table public.template_versions enable row level security;

-- Projects: users can only access their own
create policy "Users can CRUD own projects"
  on public.projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Messages: users can access messages of their projects
create policy "Users can CRUD own messages"
  on public.messages for all
  using (project_id in (select id from public.projects where user_id = auth.uid()))
  with check (project_id in (select id from public.projects where user_id = auth.uid()));

-- Message Images: users can access images of their messages
create policy "Users can CRUD own images"
  on public.message_images for all
  using (message_id in (
    select m.id from public.messages m
    join public.projects p on m.project_id = p.id
    where p.user_id = auth.uid()
  ))
  with check (message_id in (
    select m.id from public.messages m
    join public.projects p on m.project_id = p.id
    where p.user_id = auth.uid()
  ));

-- Template Versions: users can access versions of their projects
create policy "Users can CRUD own versions"
  on public.template_versions for all
  using (project_id in (select id from public.projects where user_id = auth.uid()))
  with check (project_id in (select id from public.projects where user_id = auth.uid()));

-- ==========================================
-- STORAGE BUCKET
-- ==========================================

insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', false)
on conflict (id) do nothing;

-- Storage policy: users can upload to their project folders
create policy "Users can upload project images"
  on storage.objects for insert
  with check (bucket_id = 'project-images' and auth.uid() is not null);

create policy "Users can read project images"
  on storage.objects for select
  using (bucket_id = 'project-images' and auth.uid() is not null);
