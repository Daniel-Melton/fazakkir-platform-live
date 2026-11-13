"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Field, Notice, btn, inputClass } from "./ui";

export default function PasswordForm({ home }: { home: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 10) return setError("كلمة المرور يجب ألا تقل عن 10 أحرف");
    if (password !== confirm) return setError("كلمتا المرور غير متطابقتين");
    setBusy(true);
    const { error: err } = await createClient().auth.updateUser({ password });
    setBusy(false);
    if (err) setError(err.message);
    else {
      setDone(true);
      setPassword("");
      setConfirm("");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <Notice tone="error">{error}</Notice>}
      {done && (
        <Notice tone="success">
          تم تحديث كلمة المرور.{" "}
          <a href={home} className="font-bold underline">
            الانتقال إلى لوحة التحكم
          </a>
        </Notice>
      )}
      <Field label="كلمة المرور الجديدة" htmlFor="pw-new" required hint="10 أحرف على الأقل.">
        <input
          id="pw-new"
          dir="ltr"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </Field>
      <Field label="تأكيد كلمة المرور" htmlFor="pw-confirm" required>
        <input
          id="pw-confirm"
          dir="ltr"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
        />
      </Field>
      <button type="submit" disabled={busy} className={btn.primary}>
        {busy ? "جارٍ الحفظ…" : "حفظ كلمة المرور"}
      </button>
    </form>
  );
}
