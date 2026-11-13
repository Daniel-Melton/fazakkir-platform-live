-- =====================================================================
-- Fazakkir Academy — CMS migration 1/2 : الأدوار (Roles)
-- ---------------------------------------------------------------------
-- يضيف الدورين الجديدين `admin` و `editor` إلى عمود profiles.role.
-- الأدوار الموجودة حالياً تبقى كما هي:
--   super_admin | academic_supervisor | tutor | parent_student
-- (الدور `parent_student` هو المقابل لدور "user" العادي في المتطلبات).
--
-- مهم: شغّل هذا الملف أولاً وبمفرده، ثم شغّل الملف 2/2.
-- السبب: PostgreSQL لا يسمح باستخدام قيمة ENUM جديدة داخل نفس
-- المعاملة (transaction) التي أُضيفت فيها.
-- =====================================================================

do $$
declare
  v_type    regtype;
  v_typtype "char";
  v_con     record;
  v_roles   text[];
begin
  select a.atttypid::regtype, t.typtype
    into v_type, v_typtype
  from pg_attribute a
  join pg_type t on t.oid = a.atttypid
  where a.attrelid = 'public.profiles'::regclass
    and a.attname = 'role'
    and not a.attisdropped;

  if v_type is null then
    raise exception 'لم يتم العثور على العمود public.profiles.role';
  end if;

  if v_typtype = 'e' then
    -- الحالة (أ): العمود من نوع ENUM
    execute format('alter type %s add value if not exists %L', v_type, 'admin');
    execute format('alter type %s add value if not exists %L', v_type, 'editor');
    raise notice 'تمت إضافة admin و editor إلى النوع %', v_type;
  else
    -- الحالة (ب): العمود نصي مع CHECK constraint
    select array_agg(distinct r) into v_roles
    from (
      select role::text as r from public.profiles
      union
      select unnest(array[
        'super_admin', 'admin', 'editor',
        'academic_supervisor', 'tutor', 'parent_student'
      ])
    ) s
    where r is not null;

    for v_con in
      select conname
      from pg_constraint
      where conrelid = 'public.profiles'::regclass
        and contype = 'c'
        and pg_get_constraintdef(oid) ~* '\mrole\M'
    loop
      execute format('alter table public.profiles drop constraint %I', v_con.conname);
    end loop;

    execute format(
      'alter table public.profiles add constraint profiles_role_check check (role = any (%L::text[]))',
      v_roles
    );
    raise notice 'تم تحديث قيد الأدوار: %', v_roles;
  end if;
end
$$;
