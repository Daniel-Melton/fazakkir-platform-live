// مقارنة بين المحتوى الحي والمحتوى المقترح — لعرض الفروقات في طابور الموافقات.
import { htmlToText } from "./seo-analysis";

export type DiffOp = "same" | "add" | "del";
export interface DiffPart {
  op: DiffOp;
  text: string;
}

/** LCS diff بسيط على مصفوفتين من الرموز */
function diffTokens(a: string[], b: string[]): DiffPart[] {
  const n = a.length;
  const m = b.length;
  // حماية من الانفجار في النصوص الطويلة جداً
  if (n * m > 4_000_000) {
    return [
      ...(n ? [{ op: "del" as const, text: a.join("") }] : []),
      ...(m ? [{ op: "add" as const, text: b.join("") }] : []),
    ];
  }
  const w = m + 1;
  const dp = new Uint32Array((n + 1) * w);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i * w + j] = a[i] === b[j] ? dp[(i + 1) * w + j + 1] + 1 : Math.max(dp[(i + 1) * w + j], dp[i * w + j + 1]);
    }
  }
  const parts: DiffPart[] = [];
  const push = (op: DiffOp, text: string) => {
    const last = parts[parts.length - 1];
    if (last && last.op === op) last.text += text;
    else parts.push({ op, text });
  };
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      push("same", a[i]);
      i++;
      j++;
    } else if (dp[(i + 1) * w + j] >= dp[i * w + j + 1]) {
      push("del", a[i++]);
    } else {
      push("add", b[j++]);
    }
  }
  while (i < n) push("del", a[i++]);
  while (j < m) push("add", b[j++]);
  return parts;
}

/** مقارنة على مستوى الكلمات */
export function diffWords(before: string, after: string): DiffPart[] {
  const tok = (s: string) => s.match(/\s+|[^\s]+/g) ?? [];
  return diffTokens(tok(before), tok(after));
}

export interface LineDiff {
  op: DiffOp | "change";
  before?: string;
  after?: string;
  parts?: DiffPart[];
}

/** مقارنة النصوص الطويلة سطراً بسطر (فقرة بفقرة)، مع إبراز الكلمات المتغيرة داخل الفقرة المعدلة */
export function diffLongText(beforeHtml: string, afterHtml: string): LineDiff[] {
  const lines = (s: string) =>
    htmlToText(s)
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  const raw = diffTokens(
    lines(beforeHtml).map((l) => l + "\n"),
    lines(afterHtml).map((l) => l + "\n"),
  );
  const out: LineDiff[] = [];
  for (let k = 0; k < raw.length; k++) {
    const cur = raw[k];
    const next = raw[k + 1];
    const split = (t: string) => t.split("\n").filter(Boolean);
    if (cur.op === "del" && next?.op === "add") {
      const dels = split(cur.text);
      const adds = split(next.text);
      const pairs = Math.min(dels.length, adds.length);
      for (let x = 0; x < pairs; x++) {
        out.push({ op: "change", before: dels[x], after: adds[x], parts: diffWords(dels[x], adds[x]) });
      }
      dels.slice(pairs).forEach((t) => out.push({ op: "del", before: t }));
      adds.slice(pairs).forEach((t) => out.push({ op: "add", after: t }));
      k++;
    } else if (cur.op === "same") {
      split(cur.text).forEach((t) => out.push({ op: "same", before: t, after: t }));
    } else if (cur.op === "del") {
      split(cur.text).forEach((t) => out.push({ op: "del", before: t }));
    } else {
      split(cur.text).forEach((t) => out.push({ op: "add", after: t }));
    }
  }
  return out;
}

export interface FieldChange {
  key: string;
  before: unknown;
  after: unknown;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/** الحقول التي تغيّرت بين نسختين (بترتيب keys) */
export function changedFields(
  before: Record<string, unknown> | null,
  after: Record<string, unknown>,
  keys: string[],
): FieldChange[] {
  const out: FieldChange[] = [];
  for (const key of keys) {
    const b = before ? before[key] : undefined;
    const a = after[key];
    if (!before || !same(b, a)) out.push({ key, before: b, after: a });
  }
  return out;
}
