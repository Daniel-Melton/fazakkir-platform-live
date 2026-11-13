"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import type { RevisionAction } from "@/lib/cms/fields";
import { approveRevisionAction, rejectRevisionAction } from "@/lib/cms/actions";
import { Field, Notice, btn, inputClass } from "./ui";

export default function ReviewActions({
  revisionId,
  action,
  stale,
}: {
  revisionId: string;
  action: RevisionAction;
  stale: boolean;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [needsForce, setNeedsForce] = useState(stale);
  const [doing, setDoing] = useState<"approve" | "reject" | null>(null);
  const [pending, startTransition] = useTransition();

  const approve = (force: boolean) => {
    if (action === "delete" && !window.confirm("اعتماد هذا الطلب سيحذف المحتوى نهائياً من الموقع. متابعة؟")) return;
    setError("");
    setDoing("approve");
    startTransition(async () => {
      const res = await approveRevisionAction({ revisionId, note, force });
      setDoing(null);
      if (!res.ok) {
        if (res.code === "CMS_STALE_BASE") setNeedsForce(true);
        setError(res.error);
        return;
      }
      router.replace("/dashboard/admin/approvals?done=approved");
    });
  };

  const reject = () => {
    if (!note.trim() && !window.confirm("رفض الطلب بدون كتابة ملاحظة للمحرر؟")) return;
    setError("");
    setDoing("reject");
    startTransition(async () => {
      const res = await rejectRevisionAction({ revisionId, note });
      setDoing(null);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.replace("/dashboard/admin/approvals?done=rejected");
    });
  };

  return (
    <div className="space-y-3">
      {error && <Notice tone="error">{error}</Notice>}
      {needsForce && (
        <Notice tone="warn">
          عُدِّل المحتوى الحي بعد أن بدأ المحرر عمله. الاعتماد سيستبدل تلك التعديلات بنسخة المحرر — راجع الفروقات جيداً.
        </Notice>
      )}
      <Field label="ملاحظة للمحرر" htmlFor="review-note" hint="اختيارية عند الاعتماد، ومهمة عند الرفض ليعرف المحرر ما المطلوب.">
        <textarea
          id="review-note"
          dir="auto"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="مثال: عنوان الميتا أطول من 60 حرفاً، قصّره ثم أعد الإرسال."
          className={inputClass}
        />
      </Field>
      <button
        type="button"
        disabled={pending}
        onClick={() => approve(needsForce)}
        className={clsx(action === "delete" ? btn.dangerSolid : btn.primary, "w-full")}
      >
        {doing === "approve"
          ? "جارٍ التنفيذ…"
          : action === "delete"
            ? "اعتماد الحذف"
            : needsForce
              ? "اعتماد على أي حال ونشر"
              : "اعتماد ونشر على الموقع"}
      </button>
      <button type="button" disabled={pending} onClick={reject} className={clsx(btn.danger, "w-full")}>
        {doing === "reject" ? "جارٍ الرفض…" : "رفض الطلب"}
      </button>
    </div>
  );
}
