# نظام المحررين وسير الموافقات ومحرر الـ SEO — دليل التشغيل

## 1) ترتيب التنفيذ (مهم)

1. **قاعدة البيانات أولاً** — من Supabase ← SQL Editor، شغّل الملفين بالترتيب، كل ملف في تشغيل مستقل:
   1. `supabase/migrations/20261112000001_cms_roles.sql`
   2. `supabase/migrations/20261112000002_cms_workflow_seo.sql`
2. **ثم انشر الكود** على Vercel. (الكود الجديد يقرأ أعمدة يضيفها الملف الثاني، فلا تنشره قبل تشغيل الـ SQL.)
3. تأكد من متغيرات البيئة في Vercel (كلها موجودة أصلاً في المشروع):
   `NEXT_PUBLIC_SUPABASE_URL`، `NEXT_PUBLIC_SUPABASE_ANON_KEY`، `SUPABASE_SERVICE_ROLE_KEY`، `NEXT_PUBLIC_SITE_URL`.
4. إن لم يكن لديك حساب `super_admin` أو `admin` بعد، رقِّ حسابك مرة واحدة من SQL Editor:
   ```sql
   update public.profiles set role = 'super_admin' where email = 'you@example.com';
   ```

> خذ نسخة احتياطية من قاعدة البيانات قبل تشغيل الـ migration (Database ← Backups)، وجرّبه على مشروع Supabase تجريبي إن أمكن.

## 2) الأدوار

| الدور | الصلاحيات في المحتوى |
|---|---|
| `super_admin` | كل شيء + إنشاء حسابات `admin` و `editor` |
| `admin` | نشر مباشر، اعتماد/رفض، إنشاء حسابات `editor` فقط |
| `editor` | إنشاء/تعديل/طلب حذف — **لا شيء يُنشر قبل اعتماد المدير** |
| `parent_student` (المستخدم العادي) | لا صلاحيات محتوى |

الأدوار القديمة (`academic_supervisor`، `tutor`، `parent_student`) لم تتغير. دور "user" في المتطلبات = `parent_student` الموجود فعلاً.

## 3) المسارات الجديدة

| المسار | لمن | الوظيفة |
|---|---|---|
| `/dashboard/content` | محرر/مدير | قائمة المقالات والكورسات + «طلباتي» |
| `/dashboard/content/article/new` و `/course/new` | محرر/مدير | مساحة العمل (المحرر + كل حقول الـ SEO) |
| `/dashboard/content/{article|course}/{id}` | محرر/مدير | تعديل محتوى حي |
| `/dashboard/content/revisions/{id}` | المحرر صاحب الطلب | متابعة مسودة/طلب معلّق/طلب مرفوض |
| `/dashboard/admin/approvals` | مدير | طابور الموافقات + سجل المراجعات |
| `/dashboard/admin/approvals/{id}` | مدير | الفروقات + المعاينة + اعتماد/رفض |
| `/dashboard/admin/editors` | مدير | إنشاء حسابات المحررين وتعطيلها |
| `/dashboard/account/password` | الجميع | تعيين/تغيير كلمة المرور |
| `POST /api/cms/upload` | محرر/مدير | رفع صورة وتحويلها إلى WebP |

## 4) كيف يُفرض القيد «المحرر لا ينشر مباشرة»

القيد مفروض على ثلاث طبقات مستقلة، فلا يكفي تجاوز واحدة:

1. **`proxy.ts`** (الاسم الجديد لـ middleware في Next.js 16): يمنع غير المصرح لهم من المسارات أصلاً.
2. **Server Actions** (`lib/cms/actions.ts`): المحرر يُحفظ عمله في `content_revisions` فقط، ومحاولة `publish` تُرفض.
3. **قاعدة البيانات (RLS + triggers)**: المحرر لا يملك أي صلاحية كتابة على `articles` و `courses`، ولا يستطيع تحويل طلبه إلى `published`. التطبيق على الموقع يتم فقط داخل الدالة `cms_approve_revision()` التي تتحقق من دور المستدعي. حتى لو استخدم المحرر مفتاح `anon` مباشرة من المتصفح فلن ينجح.

دورة حياة الطلب: `draft` ← `pending_approval` ← (`published` عند الاعتماد | `rejected` مع ملاحظة). الطلب المرفوض يعدّله المحرر ويعيد إرساله.

## 5) حسابات المحررين

- لا يوجد تسجيل عام لدور المحرر. الإنشاء من `/dashboard/admin/editors` فقط.
- طريقتان: **بريد + كلمة مرور** (تُولَّد كلمة قوية إن تركت الحقل فارغاً وتظهر مرة واحدة)، أو **دعوة بالبريد**.
- trigger في قاعدة البيانات (`cms_guard_profile_role`) يرفض منح `editor/admin/super_admin` من أي طريق غير السيرفر أو مدير مخوَّل، فلا يمكن لمستخدم ترقية نفسه.
- **لتفعيل الدعوة بالبريد**: في Supabase ← Authentication ← Email Templates ← Invite user، اجعل الرابط:
  ```
  {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/dashboard/account/password
  ```
  وتأكد أن Site URL هو نطاق الموقع. بدون هذا التعديل استخدم طريقة «بريد + كلمة مرور».

## 6) ما الذي أُزيل

لوحة المقالات/الكورسات القديمة كانت تعتمد على مفتاح مشترك (`ADMIN_SECRET_KEY`) يُرسل في الرابط وتكتب في القاعدة بمفتاح `anon`، أي أنها تتجاوز الأدوار وسير الموافقات كلياً. لذلك:

- حُذفت: `app/api/admin/articles`، `app/api/admin/courses`، `app/api/admin/upload`، وصفحات `new` و `edit` القديمة.
- `/admin/articles` و `/admin/courses` يحوّلان الآن إلى `/dashboard/content`.
- `/admin/leads` لم يُمَس.
- الـ migration يحذف أي سياسات RLS قديمة على `articles` و `courses` ويستبدلها (القراءة العامة للمنشور فقط).

**راجع يدوياً**: سياسات Storage على الـ bucket `blog-images`. الرفع القديم كان يتم بمفتاح `anon`، فإن كانت هناك سياسة تسمح لـ `anon` بالرفع فاحذفها — الرفع الجديد يتم من السيرفر بـ `service_role` بعد التحقق من الدور.

## 7) المحتوى القديم

- المقالات القديمة مخزنة Markdown؛ تُفتح في المحرر الجديد وتُحوَّل إلى HTML عند أول حفظ. صفحة المقال العامة تعرض الصيغتين.
- `published = true` القديمة تصبح `status = 'published'` تلقائياً، والكورسات الحالية كلها `published`.
- عنوان الميتا المخصص يُعرض كما هو (بدون إضافة `| Fazakkir`) ليطابق عدّاد الأحرف. إن تُرك فارغاً يُستخدم العنوان مع القالب كما كان.
