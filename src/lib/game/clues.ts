import type { Question } from "./types";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function clueBody(text: string): string {
  const parts = text
    .trim()
    .split(/(?<=[.!?…])\s+/)
    .filter(Boolean);
  if (parts.length === 0) return text.trim();
  let out = parts[0] ?? "";
  if (out.length < 42 && parts[1]) out = `${out} ${parts[1]}`;
  return out.trim();
}

function redact(text: string, needles: readonly string[]): string {
  let out = text;
  const sorted = [...needles].filter((n) => n.trim().length > 0).sort((a, b) => b.length - a.length);
  for (const needle of sorted) {
    const t = needle.trim();
    if (/^-?\d+(\.\d+)?$/.test(t)) {
      out = out.replace(new RegExp(`(?<![\\d.])${escapeRegExp(t)}(?!\\d)`, "g"), "…");
      continue;
    }
    if (t.length < 3) continue;
    out = out.replace(new RegExp(escapeRegExp(t), "ig"), "…");
  }
  return out.replace(/\s{2,}/g, " ").replace(/\s+([,.;:])/g, "$1").trim();
}

export function clueFor(question: Question): string {
  if (question.clue?.trim()) return question.clue.trim();

  const leaks = [question.answer, ...(question.accept ?? [])];
  const redacted = redact(question.explanation, leaks);
  const sentence = clueBody(redacted);
  const leaked = leaks.some(
    (n) => n.trim().length >= 3 && sentence.toLowerCase().includes(n.trim().toLowerCase()),
  );

  if (sentence.length >= 18 && !leaked) {
    return /[.!?…]$/.test(sentence) ? sentence : `${sentence}.`;
  }

  return `Not that one. Think again about ${question.topic.toLowerCase()}.`;
}
