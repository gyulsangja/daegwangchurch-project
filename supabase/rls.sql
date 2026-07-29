-- Run in the Supabase SQL editor after applying Prisma migrations.
-- Prisma uses a server-only database connection. These policies protect
-- Supabase Data API and Storage access from browser clients.

create or replace function public.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles
    where "authUserId" = auth.uid()
      and "isActive" = true
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles
    where "authUserId" = auth.uid()
      and "isActive" = true
      and role = 'SUPER_ADMIN'
  );
$$;

revoke all on function public.is_active_admin() from public;
revoke all on function public.is_super_admin() from public;
grant execute on function public.is_active_admin() to authenticated;
grant execute on function public.is_super_admin() to authenticated;

alter table public.admin_profiles enable row level security;
alter table public.media enable row level security;
alter table public.pages enable row level security;
alter table public.history_items enable row level security;
alter table public.worship_schedules enable row level security;
alter table public.people enable row level security;
alter table public.ministries enable row level security;
alter table public.worship_contents enable row level security;
alter table public.notices enable row level security;
alter table public.notice_attachments enable row level security;
alter table public.bulletins enable row level security;
alter table public.events enable row level security;
alter table public.albums enable row level security;
alter table public.album_images enable row level security;
alter table public.inquiries enable row level security;
alter table public.inquiry_notes enable row level security;
alter table public.inquiry_rate_limits enable row level security;
alter table public.site_settings enable row level security;
alter table public.activity_logs enable row level security;

create policy "public read published pages"
on public.pages for select to anon, authenticated
using (status = 'PUBLISHED' and "deletedAt" is null and ("publishedAt" is null or "publishedAt" <= now()));

create policy "public read visible history"
on public.history_items for select to anon, authenticated
using ("isVisible" = true and "deletedAt" is null);

create policy "public read worship schedules"
on public.worship_schedules for select to anon, authenticated
using ("isVisible" = true and "deletedAt" is null);

create policy "public read visible people"
on public.people for select to anon, authenticated
using ("isVisible" = true and "deletedAt" is null);

create policy "public read published ministries"
on public.ministries for select to anon, authenticated
using (status = 'PUBLISHED' and "deletedAt" is null and ("publishedAt" is null or "publishedAt" <= now()));

create policy "public read published worship contents"
on public.worship_contents for select to anon, authenticated
using (status = 'PUBLISHED' and "deletedAt" is null and ("publishedAt" is null or "publishedAt" <= now()));

create policy "public read published notices"
on public.notices for select to anon, authenticated
using (
  status = 'PUBLISHED'
  and "deletedAt" is null
  and ("publishedAt" is null or "publishedAt" <= now())
  and ("publishStartsAt" is null or "publishStartsAt" <= now())
  and ("publishEndsAt" is null or "publishEndsAt" >= now())
);

create policy "public read notice attachments"
on public.notice_attachments for select to anon, authenticated
using (
  exists (
    select 1 from public.notices
    where notices.id = notice_attachments."noticeId"
      and notices.status = 'PUBLISHED'
      and notices."deletedAt" is null
  )
);

create policy "public read published bulletins"
on public.bulletins for select to anon, authenticated
using (status = 'PUBLISHED' and "deletedAt" is null and ("publishedAt" is null or "publishedAt" <= now()));

create policy "public read published events"
on public.events for select to anon, authenticated
using (status = 'PUBLISHED' and "deletedAt" is null and ("publishedAt" is null or "publishedAt" <= now()));

create policy "public read published albums"
on public.albums for select to anon, authenticated
using (status = 'PUBLISHED' and "deletedAt" is null and ("publishedAt" is null or "publishedAt" <= now()));

create policy "public read album images"
on public.album_images for select to anon, authenticated
using (
  exists (
    select 1 from public.albums
    where albums.id = album_images."albumId"
      and albums.status = 'PUBLISHED'
      and albums."deletedAt" is null
  )
);

create policy "public read public media"
on public.media for select to anon, authenticated
using (visibility = 'PUBLIC' and "deletedAt" is null);

create policy "public read site settings"
on public.site_settings for select to anon, authenticated
using (true);

-- Active admins can manage normal content through the Supabase Data API.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'media', 'pages', 'history_items', 'worship_schedules', 'people',
    'ministries', 'worship_contents', 'notices', 'notice_attachments',
    'bulletins', 'events', 'albums', 'album_images', 'site_settings'
  ]
  loop
    execute format(
      'create policy "active admins manage %1$s" on public.%I for all to authenticated using (public.is_active_admin()) with check (public.is_active_admin())',
      table_name,
      table_name
    );
  end loop;
end $$;

create policy "admins read own profile"
on public.admin_profiles for select to authenticated
using ("authUserId" = auth.uid() or public.is_super_admin());

create policy "super admins manage profiles"
on public.admin_profiles for all to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "super admins manage inquiries"
on public.inquiries for all to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "super admins manage inquiry notes"
on public.inquiry_notes for all to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

create policy "active admins insert activity logs"
on public.activity_logs for insert to authenticated
with check (public.is_active_admin());

create policy "super admins read activity logs"
on public.activity_logs for select to authenticated
using (public.is_super_admin());

-- Storage buckets. Public assets have public reads; private files are limited
-- to SUPER_ADMIN because they may contain inquiry attachments.
insert into storage.buckets (id, name, public)
values ('public-assets', 'public-assets', true)
on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('private-files', 'private-files', false)
on conflict (id) do update set public = excluded.public;

create policy "public reads public assets"
on storage.objects for select to anon, authenticated
using (bucket_id = 'public-assets');

create policy "admins upload public assets"
on storage.objects for insert to authenticated
with check (bucket_id = 'public-assets' and public.is_active_admin());

create policy "admins update public assets"
on storage.objects for update to authenticated
using (bucket_id = 'public-assets' and public.is_active_admin())
with check (bucket_id = 'public-assets' and public.is_active_admin());

create policy "admins delete public assets"
on storage.objects for delete to authenticated
using (bucket_id = 'public-assets' and public.is_active_admin());

create policy "super admins manage private files"
on storage.objects for all to authenticated
using (bucket_id = 'private-files' and public.is_super_admin())
with check (bucket_id = 'private-files' and public.is_super_admin());
