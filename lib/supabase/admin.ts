import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// عميل بصلاحيات service_role — يتجاوز RLS.
// لا يُستورد إلا في كود السيرفر وبعد التحقق من دور المستخدم.
let cached: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient {
  if (!cached) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL أو SUPABASE_SERVICE_ROLE_KEY غير مضبوط");
    }
    cached = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  }
  return cached;
}
