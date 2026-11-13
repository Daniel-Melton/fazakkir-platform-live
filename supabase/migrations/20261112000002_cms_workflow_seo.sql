-- =====================================================================
-- Fazakkir Academy — CMS migration 2/2
-- سير الموافقات (Approval Workflow) + حقول الـ SEO + سجل المراجعات
-- ---------------------------------------------------------------------
-- شغّل الملف 1/2 أولاً. هذا الملف آمن لإعادة التشغيل (idempotent).
--
-- فكرة التصميم:
--   * الجداول الحية (articles / courses) لا يكتب فيها إلا admin / super_admin.
--   * المحرر (editor) لا يملك أي صلاحية كتابة على الجداول الحية إطلاقاً؛
--     كل ما ينشئه/يعدله/يطلب حذفه يُحفظ في جدول content_revisions
--     بحالة draft أو pending_approval مع نوع الإجراء ومعرّف المحرر.
--   * التطبيق على الموقع الحي يتم فقط عبر الدالة cms_approve_revision()
--     التي تتحقق من دور المستدعي داخل قاعدة البيانات نفسها.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0) الأنواع
-- ---------------------------------------------------------------------
do $$ begin
  create type public.content_status as enum ('draft', 'pending_approval', 'published', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.revision_action as enum ('create', 'update', 'delete');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- 1) profiles: تعطيل الحساب + من أنشأه
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists disabled_at timestamptz;
alter table public.profiles add column if not exists created_by  uuid references auth.users (id) on delete set null;

-- ---------------------------------------------------------------------
-- 2) دوال مساعدة للأدوار (SECURITY DEFINER لتفادي تكرار RLS على profiles)
-- ---------------------------------------------------------------------
create or replace function public.cms_current_role()
returns text
language sql stable security definer set search_path = public
as $$
  select p.role::text
  from public.profiles p
  where p.id = auth.uid() and p.disabled_at is null
$$;

create or replace function public.cms_is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(public.cms_current_role() in ('admin', 'super_admin'), false)
$$;

create or replace function public.cms_is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(public.cms_current_role() in ('editor', 'admin', 'super_admin'), false)
$$;

revoke all on function public.cms_current_role() from public;
revoke all on function public.cms_is_admin()     from public;
revoke all on function public.cms_is_staff()     from public;
grant execute on function public.cms_current_role() to anon, authenticated, service_role;
grant execute on function public.cms_is_admin()     to anon, authenticated, service_role;
grant execute on function public.cms_is_staff()     to anon, authenticated, service_role;

-- ---------------------------------------------------------------------
-- 3) حارس الأدوار: لا أحد يحصل على editor / admin / super_admin
--    عبر التسجيل العام أو بتعديل ملفه الشخصي.
--    المسموح لهم فقط:
--      - service_role (كود السيرفر بعد التحقق من دور المدير)
--      - SQL Editor / migrations (session_user = postgres)
--      - super_admin: يمنح/يسحب أي دور
--      - admin: يمنح/يسحب دور editor فقط
-- ---------------------------------------------------------------------
create or replace function public.cms_guard_profile_role()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_new    text := new.role::text;
  v_old    text := case when tg_op = 'UPDATE' then old.role::text else null end;
  v_priv   constant text[] := array['editor', 'admin', 'super_admin'];
  v_caller text;
begin
  if tg_op = 'UPDATE' and v_new is not distinct from v_old then
    return new;
  end if;

  -- انتقال لا يمسّ الأدوار المحمية: خارج نطاق هذا الحارس
  if not (v_new = any (v_priv)) and (v_old is null or not (v_old = any (v_priv))) then
    return new;
  end if;

  if coalesce(auth.role(), '') = 'service_role'
     or (session_user in ('postgres', 'supabase_admin') and auth.uid() is null) then
    return new;
  end if;

  v_caller := public.cms_current_role();

  if v_caller = 'super_admin' then
    return new;
  end if;

  if v_caller = 'admin'
     and coalesce(v_old, '') not in ('admin', 'super_admin')
     and v_new not in ('admin', 'super_admin') then
    return new;
  end if;

  raise exception 'CMS_ROLE_FORBIDDEN: غير مسموح بمنح أو سحب الدور "%"', v_new
    using errcode = '42501';
end
$$;

drop trigger if exists cms_guard_profile_role on public.profiles;
create trigger cms_guard_profile_role
  before insert or update of role on public.profiles
  for each row execute function public.cms_guard_profile_role();

-- ---------------------------------------------------------------------
-- 4) articles: الحالة + حقول الـ SEO
-- ---------------------------------------------------------------------
alter table public.articles
  add column if not exists status           public.content_status not null default 'draft',
  add column if not exists categories       text[]  not null default '{}',
  add column if not exists tags             text[]  not null default '{}',
  add column if not exists cover_image_alt  text    not null default '',
  add column if not exists meta_title       text    not null default '',
  add column if not exists meta_description text    not null default '',
  add column if not exists focus_keyword    text    not null default '',
  add column if not exists og_title         text    not null default '',
  add column if not exists og_description   text    not null default '',
  add column if not exists og_image         text    not null default '',
  add column if not exists canonical_url    text    not null default '',
  add column if not exists robots_index     boolean not null default true,
  add column if not exists robots_follow    boolean not null default true,
  add column if not exists word_count       integer not null default 0,
  add column if not exists published_at     timestamptz,
  add column if not exists updated_at       timestamptz not null default now(),
  add column if not exists created_by       uuid references auth.users (id) on delete set null,
  add column if not exists updated_by       uuid references auth.users (id) on delete set null;

-- ترحيل البيانات القديمة: published (boolean) -> status
update public.articles
   set status       = 'published',
       published_at = coalesce(published_at, created_at)
 where published is true and status = 'draft' and published_at is null;

update public.articles
   set categories = array[category]
 where categories = '{}' and coalesce(category, '') <> '';

-- ---------------------------------------------------------------------
-- 5) courses: الحالة + حقول الـ SEO + نص تفصيلي (body)
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'courses' and column_name = 'status'
  ) then
    -- الكورسات الموجودة حالياً كلها ظاهرة للزوار => published
    alter table public.courses add column status public.content_status not null default 'published';
    alter table public.courses alter column status set default 'draft';
  end if;
end $$;

alter table public.courses
  add column if not exists body             text    not null default '',
  add column if not exists categories       text[]  not null default '{}',
  add column if not exists tags             text[]  not null default '{}',
  add column if not exists cover_image      text    not null default '',
  add column if not exists cover_image_alt  text    not null default '',
  add column if not exists meta_title       text    not null default '',
  add column if not exists meta_description text    not null default '',
  add column if not exists focus_keyword    text    not null default '',
  add column if not exists og_title         text    not null default '',
  add column if not exists og_description   text    not null default '',
  add column if not exists og_image         text    not null default '',
  add column if not exists canonical_url    text    not null default '',
  add column if not exists robots_index     boolean not null default true,
  add column if not exists robots_follow    boolean not null default true,
  add column if not exists word_count       integer not null default 0,
  add column if not exists reading_time     text    not null default '',
  add column if not exists published_at     timestamptz,
  add column if not exists updated_at       timestamptz not null default now(),
  add column if not exists created_by       uuid references auth.users (id) on delete set null,
  add column if not exists updated_by       uuid references auth.users (id) on delete set null;

update public.courses
   set published_at = coalesce(published_at, created_at)
 where status = 'published' and published_at is null;

update public.courses
   set categories = array[category]
 where categories = '{}' and coalesce(category, '') <> '';

-- ---------------------------------------------------------------------
-- 6) تفرّد الـ slug (غير حساس لحالة الأحرف)
-- ---------------------------------------------------------------------
do $$ begin
  create unique index if not exists articles_slug_lower_key on public.articles (lower(slug));
exception when unique_violation then
  raise warning 'يوجد slug مكرر في articles — أصلح التكرار ثم أعد تشغيل هذا الملف';
end $$;

do $$ begin
  create unique index if not exists courses_slug_lower_key on public.courses (lower(slug));
exception when unique_violation then
  raise warning 'يوجد slug مكرر في courses — أصلح التكرار ثم أعد تشغيل هذا الملف';
end $$;

create index if not exists articles_status_idx on public.articles (status);
create index if not exists courses_status_idx  on public.courses  (status);

-- ---------------------------------------------------------------------
-- 7) مزامنة الحالة والتواريخ على الجداول الحية
-- ---------------------------------------------------------------------
create or replace function public.cms_articles_sync()
returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' then
    -- دعم الكود القديم الذي يبدّل published فقط
    if new.published is distinct from old.published and new.status = old.status then
      new.status := case when new.published then 'published' else 'draft' end;
    end if;
    new.updated_at := now();
  end if;

  new.published := (new.status = 'published');
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end $$;

drop trigger if exists cms_articles_sync on public.articles;
create trigger cms_articles_sync
  before insert or update on public.articles
  for each row execute function public.cms_articles_sync();

create or replace function public.cms_courses_sync()
returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' then
    new.updated_at := now();
  end if;
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end $$;

drop trigger if exists cms_courses_sync on public.courses;
create trigger cms_courses_sync
  before insert or update on public.courses
  for each row execute function public.cms_courses_sync();

-- ---------------------------------------------------------------------
-- 8) جدول المراجعات / طابور الموافقات
-- ---------------------------------------------------------------------
create table if not exists public.content_revisions (
  id              uuid primary key default gen_random_uuid(),
  entity_type     text not null check (entity_type in ('article', 'course')),
  entity_id       text,                                   -- null عند طلب الإنشاء حتى يُعتمد
  action          public.revision_action not null,
  status          public.content_status  not null default 'draft',
  title           text not null default '',
  slug            text not null default '',
  payload         jsonb not null default '{}'::jsonb,     -- المحتوى المقترح كاملاً
  base_snapshot   jsonb,                                  -- نسخة المحتوى الحي لحظة الطلب (للمقارنة)
  base_updated_at timestamptz,
  submit_note     text not null default '',               -- ملاحظة المحرر للمراجع
  submitted_by    uuid not null references auth.users (id) on delete cascade,
  submitted_at    timestamptz,
  reviewed_by     uuid references auth.users (id) on delete set null,
  reviewed_at     timestamptz,
  review_note     text not null default '',               -- ملاحظة الرفض/الاعتماد
  direct          boolean not null default false,         -- true = نشر مباشر من مدير (للسجل فقط)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint content_revisions_entity_ck check (
    (action = 'create') or (entity_id is not null)
  )
);

create index if not exists content_revisions_status_idx on public.content_revisions (status, submitted_at desc);
create index if not exists content_revisions_owner_idx  on public.content_revisions (submitted_by, updated_at desc);
create index if not exists content_revisions_entity_idx on public.content_revisions (entity_type, entity_id);

-- طلب معلّق واحد فقط لكل عنصر محتوى (يمنع تضارب الاعتمادات)
create unique index if not exists content_revisions_one_pending
  on public.content_revisions (entity_type, entity_id)
  where status = 'pending_approval' and entity_id is not null;

-- لا يتكرر slug بين طلبات الإنشاء المعلقة
create unique index if not exists content_revisions_pending_slug
  on public.content_revisions (entity_type, lower(slug))
  where status = 'pending_approval' and action = 'create';

-- قراءة صف حي كـ jsonb بشكل عام (يدعم id من نوع uuid أو bigint)
create or replace function public.cms_live_row(p_entity_type text, p_entity_id text)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  v_tbl text := case p_entity_type when 'article' then 'articles' when 'course' then 'courses' end;
  v_row jsonb;
begin
  if v_tbl is null then
    raise exception 'CMS_BAD_ENTITY_TYPE';
  end if;
  execute format('select to_jsonb(t) from public.%I t where t.id::text = $1', v_tbl)
    into v_row using p_entity_id;
  return v_row;
end $$;

revoke all on function public.cms_live_row(text, text) from public;

-- حارس جدول المراجعات
create or replace function public.cms_revisions_guard()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_trusted boolean := coalesce(current_setting('cms.trusted', true), '') = 'on'
                       or coalesce(auth.role(), '') = 'service_role';
  v_live jsonb;
begin
  new.updated_at := now();

  if tg_op = 'INSERT' then
    if new.action in ('update', 'delete') then
      -- الطلبات العادية: نلتقط نسخة المحتوى الحي من القاعدة نفسها (لا نثق بما يرسله العميل)
      if not v_trusted or new.base_snapshot is null then
        v_live := public.cms_live_row(new.entity_type, new.entity_id);
        if v_live is null then
          raise exception 'CMS_ENTITY_MISSING: العنصر المطلوب تعديله غير موجود';
        end if;
        new.base_snapshot   := v_live;
        new.base_updated_at := (v_live ->> 'updated_at')::timestamptz;
      end if;
    elsif not v_trusted then
      new.entity_id       := null;
      new.base_snapshot   := null;
      new.base_updated_at := null;
    end if;

    if not v_trusted then
      new.submitted_by := auth.uid();
      new.reviewed_by  := null;
      new.reviewed_at  := null;
      new.review_note  := '';
      new.direct       := false;
    end if;
  else
    -- حقول لا تتغير بعد الإنشاء
    new.entity_type     := old.entity_type;
    new.action          := old.action;
    new.submitted_by    := old.submitted_by;
    new.base_snapshot   := old.base_snapshot;
    new.base_updated_at := old.base_updated_at;
    new.created_at      := old.created_at;

    if not v_trusted then
      new.entity_id   := old.entity_id;
      new.reviewed_by := old.reviewed_by;
      new.reviewed_at := old.reviewed_at;
      new.review_note := old.review_note;
      new.direct      := old.direct;
    end if;
  end if;

  if not v_trusted and new.status not in ('draft', 'pending_approval') then
    raise exception 'CMS_STATUS_FORBIDDEN: الاعتماد والرفض يتمان عبر طابور الموافقات فقط'
      using errcode = '42501';
  end if;

  if new.status = 'pending_approval'
     and (tg_op = 'INSERT' or old.status is distinct from 'pending_approval') then
    new.submitted_at := now();
  end if;

  return new;
end $$;

drop trigger if exists cms_revisions_guard on public.content_revisions;
create trigger cms_revisions_guard
  before insert or update on public.content_revisions
  for each row execute function public.cms_revisions_guard();

-- ---------------------------------------------------------------------
-- 9) تطبيق التغيير على الجدول الحي (دالة داخلية)
-- ---------------------------------------------------------------------
create or replace function public.cms_apply_change(
  p_entity_type text,
  p_entity_id   text,
  p_action      public.revision_action,
  p_payload     jsonb,
  p_live_status public.content_status,
  p_author      uuid
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_tbl  text;
  v_cols text;
  v_id   text;
  v_slug text;
  v_old  jsonb;
begin
  if p_entity_type = 'article' then
    v_tbl  := 'articles';
    v_cols := 'slug, title, excerpt, content, category, categories, tags, author, author_role, '
           || 'reading_time, word_count, cover_image, cover_image_alt, meta_title, meta_description, '
           || 'focus_keyword, og_title, og_description, og_image, canonical_url, robots_index, robots_follow';
  elsif p_entity_type = 'course' then
    v_tbl  := 'courses';
    v_cols := 'slug, title, subtitle, badge, category, categories, tags, icon, summary, body, '
           || 'prerequisites, duration, levels, learning_outcomes, books_materials, '
           || 'reading_time, word_count, cover_image, cover_image_alt, meta_title, meta_description, '
           || 'focus_keyword, og_title, og_description, og_image, canonical_url, robots_index, robots_follow';
  else
    raise exception 'CMS_BAD_ENTITY_TYPE';
  end if;

  if p_live_status not in ('draft', 'published') then
    raise exception 'CMS_BAD_LIVE_STATUS';
  end if;

  if p_action <> 'create' then
    v_old := public.cms_live_row(p_entity_type, p_entity_id);
    if v_old is null then
      raise exception 'CMS_ENTITY_MISSING: العنصر غير موجود (ربما حُذف)';
    end if;
  end if;

  if p_action = 'create' then
    execute format(
      'insert into public.%1$I (%2$s, status, created_by, updated_by)
       select %2$s, $2, $3, $3 from jsonb_populate_record(null::public.%1$I, $1)
       returning id::text, slug',
      v_tbl, v_cols)
      into v_id, v_slug
      using p_payload, p_live_status, p_author;

  elsif p_action = 'update' then
    execute format(
      'update public.%1$I t
          set (%2$s) = (select %2$s from jsonb_populate_record(t, $1)),
              status = $2,
              updated_by = $3
        where t.id::text = $4
        returning t.id::text, t.slug',
      v_tbl, v_cols)
      into v_id, v_slug
      using p_payload, p_live_status, p_author, p_entity_id;

  else -- delete
    execute format('delete from public.%I t where t.id::text = $1', v_tbl) using p_entity_id;
    v_id   := p_entity_id;
    v_slug := v_old ->> 'slug';
  end if;

  return jsonb_build_object(
    'entity_type', p_entity_type,
    'entity_id',   v_id,
    'action',      p_action,
    'slug',        v_slug,
    'old_slug',    v_old ->> 'slug'
  );
end $$;

revoke all on function public.cms_apply_change(text, text, public.revision_action, jsonb, public.content_status, uuid) from public;

-- ---------------------------------------------------------------------
-- 10) اعتماد / رفض طلب (admin و super_admin فقط)
-- ---------------------------------------------------------------------
create or replace function public.cms_approve_revision(
  p_revision_id uuid,
  p_note        text default '',
  p_force       boolean default false
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  r        public.content_revisions;
  v_live   jsonb;
  v_result jsonb;
begin
  if not public.cms_is_admin() then
    raise exception 'CMS_FORBIDDEN: الاعتماد متاح للمدير فقط' using errcode = '42501';
  end if;

  select * into r from public.content_revisions where id = p_revision_id for update;
  if not found then
    raise exception 'CMS_REVISION_MISSING';
  end if;
  if r.status <> 'pending_approval' then
    raise exception 'CMS_NOT_PENDING: هذا الطلب ليس في انتظار الموافقة';
  end if;

  -- هل تغيّر المحتوى الحي بعد أن بدأ المحرر تعديله؟
  if r.action = 'update' and not p_force then
    v_live := public.cms_live_row(r.entity_type, r.entity_id);
    if v_live is not null
       and r.base_updated_at is not null
       and (v_live ->> 'updated_at')::timestamptz > r.base_updated_at then
      raise exception 'CMS_STALE_BASE: تم تعديل المحتوى الحي بعد إنشاء هذا الطلب';
    end if;
  end if;

  v_result := public.cms_apply_change(r.entity_type, r.entity_id, r.action, r.payload, 'published', r.submitted_by);

  perform set_config('cms.trusted', 'on', true);
  update public.content_revisions
     set status      = 'published',
         entity_id   = v_result ->> 'entity_id',
         reviewed_by = auth.uid(),
         reviewed_at = now(),
         review_note = coalesce(p_note, '')
   where id = p_revision_id;
  perform set_config('cms.trusted', 'off', true);

  return v_result || jsonb_build_object('revision_id', p_revision_id, 'submitted_by', r.submitted_by, 'title', r.title);
end $$;

create or replace function public.cms_reject_revision(
  p_revision_id uuid,
  p_note        text default ''
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  r public.content_revisions;
begin
  if not public.cms_is_admin() then
    raise exception 'CMS_FORBIDDEN: الرفض متاح للمدير فقط' using errcode = '42501';
  end if;

  select * into r from public.content_revisions where id = p_revision_id for update;
  if not found then
    raise exception 'CMS_REVISION_MISSING';
  end if;
  if r.status <> 'pending_approval' then
    raise exception 'CMS_NOT_PENDING: هذا الطلب ليس في انتظار الموافقة';
  end if;

  perform set_config('cms.trusted', 'on', true);
  update public.content_revisions
     set status      = 'rejected',
         reviewed_by = auth.uid(),
         reviewed_at = now(),
         review_note = coalesce(p_note, '')
   where id = p_revision_id;
  perform set_config('cms.trusted', 'off', true);

  return jsonb_build_object(
    'revision_id', p_revision_id, 'entity_type', r.entity_type, 'entity_id', r.entity_id,
    'action', r.action, 'submitted_by', r.submitted_by, 'title', r.title
  );
end $$;

-- ---------------------------------------------------------------------
-- 11) حفظ/حذف مباشر من المدير (يُسجَّل في السجل كمراجعة direct)
-- ---------------------------------------------------------------------
create or replace function public.cms_admin_save(
  p_entity_type text,
  p_entity_id   text,
  p_payload     jsonb,
  p_live_status public.content_status
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_action public.revision_action := case when p_entity_id is null then 'create' else 'update' end;
  v_base   jsonb;
  v_result jsonb;
begin
  if not public.cms_is_admin() then
    raise exception 'CMS_FORBIDDEN: النشر المباشر متاح للمدير فقط' using errcode = '42501';
  end if;

  if v_action = 'update' then
    v_base := public.cms_live_row(p_entity_type, p_entity_id);
  end if;

  v_result := public.cms_apply_change(p_entity_type, p_entity_id, v_action, p_payload, p_live_status, auth.uid());

  perform set_config('cms.trusted', 'on', true);
  insert into public.content_revisions
    (entity_type, entity_id, action, status, title, slug, payload,
     base_snapshot, base_updated_at,
     submitted_by, submitted_at, reviewed_by, reviewed_at, direct)
  values
    (p_entity_type, v_result ->> 'entity_id', v_action, p_live_status,
     coalesce(p_payload ->> 'title', ''), coalesce(p_payload ->> 'slug', ''), p_payload,
     v_base, (v_base ->> 'updated_at')::timestamptz,
     auth.uid(), now(), auth.uid(), now(), true);
  perform set_config('cms.trusted', 'off', true);

  return v_result;
end $$;

create or replace function public.cms_admin_delete(
  p_entity_type text,
  p_entity_id   text
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_base   jsonb;
  v_result jsonb;
begin
  if not public.cms_is_admin() then
    raise exception 'CMS_FORBIDDEN: الحذف المباشر متاح للمدير فقط' using errcode = '42501';
  end if;

  v_base := public.cms_live_row(p_entity_type, p_entity_id);
  if v_base is null then
    raise exception 'CMS_ENTITY_MISSING: العنصر غير موجود';
  end if;

  perform set_config('cms.trusted', 'on', true);
  -- السجل أولاً (الحارس يلتقط نسخة المحتوى قبل حذفه)
  insert into public.content_revisions
    (entity_type, entity_id, action, status, title, slug, payload,
     submitted_by, submitted_at, reviewed_by, reviewed_at, direct)
  values
    (p_entity_type, p_entity_id, 'delete', 'published',
     coalesce(v_base ->> 'title', ''), coalesce(v_base ->> 'slug', ''), '{}'::jsonb,
     auth.uid(), now(), auth.uid(), now(), true);
  -- الطلبات المعلقة على عنصر محذوف تُرفض تلقائياً
  update public.content_revisions
     set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(),
         review_note = 'تم حذف المحتوى الأصلي'
   where entity_type = p_entity_type and entity_id = p_entity_id and status = 'pending_approval';
  perform set_config('cms.trusted', 'off', true);

  v_result := public.cms_apply_change(p_entity_type, p_entity_id, 'delete', '{}'::jsonb, 'published', auth.uid());
  return v_result;
end $$;

revoke all on function public.cms_approve_revision(uuid, text, boolean) from public;
revoke all on function public.cms_reject_revision(uuid, text)           from public;
revoke all on function public.cms_admin_save(text, text, jsonb, public.content_status) from public;
revoke all on function public.cms_admin_delete(text, text)              from public;
grant execute on function public.cms_approve_revision(uuid, text, boolean) to authenticated;
grant execute on function public.cms_reject_revision(uuid, text)           to authenticated;
grant execute on function public.cms_admin_save(text, text, jsonb, public.content_status) to authenticated;
grant execute on function public.cms_admin_delete(text, text)              to authenticated;

-- ---------------------------------------------------------------------
-- 12) Row Level Security
-- ---------------------------------------------------------------------
-- تنبيه: نحذف أي سياسات قديمة على articles و courses لأن الكود القديم
-- كان يكتب فيهما بمفتاح anon، وأي سياسة متساهلة قديمة ستبقى ثغرة.
do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public' and tablename in ('articles', 'courses', 'content_revisions')
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

alter table public.articles          enable row level security;
alter table public.courses           enable row level security;
alter table public.content_revisions enable row level security;

grant select on public.articles, public.courses to anon, authenticated;
grant insert, update, delete on public.articles, public.courses to authenticated;
grant select, insert, update, delete on public.content_revisions to authenticated;

-- articles
create policy articles_public_read on public.articles
  for select to anon, authenticated
  using (status = 'published' or public.cms_is_staff());

create policy articles_admin_insert on public.articles
  for insert to authenticated with check (public.cms_is_admin());
create policy articles_admin_update on public.articles
  for update to authenticated using (public.cms_is_admin()) with check (public.cms_is_admin());
create policy articles_admin_delete on public.articles
  for delete to authenticated using (public.cms_is_admin());

-- courses
create policy courses_public_read on public.courses
  for select to anon, authenticated
  using (status = 'published' or public.cms_is_staff());

create policy courses_admin_insert on public.courses
  for insert to authenticated with check (public.cms_is_admin());
create policy courses_admin_update on public.courses
  for update to authenticated using (public.cms_is_admin()) with check (public.cms_is_admin());
create policy courses_admin_delete on public.courses
  for delete to authenticated using (public.cms_is_admin());

-- content_revisions
create policy revisions_read on public.content_revisions
  for select to authenticated
  using (public.cms_is_admin() or (public.cms_is_staff() and submitted_by = auth.uid()));

create policy revisions_insert on public.content_revisions
  for insert to authenticated
  with check (
    public.cms_is_staff()
    and submitted_by = auth.uid()
    and status in ('draft', 'pending_approval')
  );

-- المحرر يعدّل طلباته فقط، وما دامت لم تُعتمد
create policy revisions_update_own on public.content_revisions
  for update to authenticated
  using (
    public.cms_is_staff()
    and submitted_by = auth.uid()
    and status in ('draft', 'pending_approval', 'rejected')
  )
  with check (
    submitted_by = auth.uid()
    and status in ('draft', 'pending_approval')
  );

create policy revisions_delete_own on public.content_revisions
  for delete to authenticated
  using (
    public.cms_is_staff()
    and submitted_by = auth.uid()
    and status in ('draft', 'rejected')
  );

-- ---------------------------------------------------------------------
-- 13) (اختياري) ترقية أول مدير — نفّذه يدوياً من SQL Editor
-- ---------------------------------------------------------------------
-- update public.profiles set role = 'admin' where email = 'someone@example.com';
