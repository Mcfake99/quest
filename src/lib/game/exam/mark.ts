import type {
  ExamPaper,
  ExamPart,
  LinesPart,
  MarkBundle,
  MatchPart,
  NumberBlank,
  NumberPart,
  PaperResult,
  PartAnswer,
  PartResult,
  SchemePoint,
  TickPart,
  WrittenPart,
} from "./types";

export function markPaper(paper: ExamPaper, answers: Record<string, PartAnswer | undefined>): PaperResult {
  const questions = paper.questions.map((question) => {
    const parts = question.parts.map((part) => markPart(part, answers[part.id]));
    return {
      number: question.number,
      awarded: parts.reduce((sum, part) => sum + part.awarded, 0),
      max: question.marks,
      parts,
    };
  });
  return {
    awarded: questions.reduce((sum, question) => sum + question.awarded, 0),
    max: paper.totalMarks,
    questions,
  };
}

export function markPart(part: ExamPart, answer: PartAnswer | undefined): PartResult {
  if (part.kind === "tick") return markTick(part, answer);
  if (part.kind === "match") return markMatch(part, answer);
  if (part.kind === "lines") return markLines(part, answer);
  if (part.kind === "number") return markNumber(part, answer);
  return markWritten(part, answer);
}

function shell(part: ExamPart, awarded: number, credited: string[], notes: string[]): PartResult {
  return {
    id: part.id,
    awarded: clamp(awarded, 0, part.marks),
    max: part.marks,
    credited,
    notes,
    model: part.model,
  };
}

function markTick(part: TickPart, answer: PartAnswer | undefined): PartResult {
  const selected = answer?.kind === "tick" ? answer.selected : [];
  if (selected.length > part.choose) {
    return shell(
      part,
      0,
      [],
      [
        `You ticked ${selected.length} boxes. The instruction is ${part.choose} only, so this scores 0.`,
      ],
    );
  }
  const correct = new Set(part.options.filter((option) => option.correct).map((option) => option.id));
  const credited = selected
    .filter((id) => correct.has(id))
    .map((id) => part.options.find((option) => option.id === id)?.text ?? id);
  const wrong = selected.length - credited.length;
  const notes: string[] = [];
  if (wrong > 0) notes.push(wrong === 1 ? "One tick was not a correct option." : `${wrong} ticks were not correct options.`);
  if (selected.length === 0) notes.push("No boxes ticked.");
  return shell(part, credited.length, credited, notes);
}

function markMatch(part: MatchPart, answer: PartAnswer | undefined): PartResult {
  const picks = answer?.kind === "match" ? answer.picks : {};
  const credited: string[] = [];
  let awarded = 0;
  for (const item of part.items) {
    if (picks[item.id] === item.answerId) {
      awarded += 1;
      const term = part.bank.find((entry) => entry.id === item.answerId)?.text ?? item.answerId;
      credited.push(`${item.id.toUpperCase()}: ${term}`);
    }
  }
  const notes: string[] = [];
  const missed = part.items.length - awarded;
  if (missed > 0) notes.push(missed === part.items.length ? "No correct matches." : `${missed} match${missed === 1 ? "" : "es"} still needed.`);
  return shell(part, awarded, credited, notes);
}

function markLines(part: LinesPart, answer: PartAnswer | undefined): PartResult {
  const lines = answer?.kind === "lines" ? answer.lines : [];
  const used = new Set<string>();
  const credited: string[] = [];
  const notes: string[] = [];
  for (const line of lines) {
    const text = line.trim();
    if (!text) continue;
    const point = unusedHit(text, part.accept, used);
    if (point) {
      used.add(point.id);
      credited.push(point.label);
      continue;
    }
    const repeated = part.accept.find(
      (candidate) => used.has(candidate.id) && candidate.patterns.some((pattern) => includes(text, pattern)),
    );
    if (repeated) {
      notes.push("That point was already credited on another line.");
      continue;
    }
    if (part.rejectNote && part.rejectNote.patterns.some((pattern) => includes(text, pattern))) {
      notes.push(part.rejectNote.note);
    } else {
      notes.push(`“${trimNote(text)}” does not contain a point from the mark scheme. The wording does not have to match, but the idea does.`);
    }
  }
  if (credited.length === 0 && notes.length === 0) notes.push("No answer given.");
  return shell(part, credited.length, credited, notes);
}

function markNumber(part: NumberPart, answer: PartAnswer | undefined): PartResult {
  const values = answer?.kind === "number" ? answer.values : {};
  const working = answer?.kind === "number" ? answer.working : "";
  let awarded = 0;
  const credited: string[] = [];
  const notes: string[] = [];
  const matched = new Set<string>();
  const bundled = Boolean(part.bundles?.length);
  for (const blank of part.blanks) {
    const raw = values[blank.id] ?? "";
    const parsed = parseLoose(raw);
    const blob = `${raw}\n${working}`;
    const source = blank.figureInWorking ? blob : raw;
    const figure = figureMatches(source, blank);
    if (figure || seenFullHit(parsed, blob, blank)) matched.add(blank.id);
    if (figure && blank.workingGroups?.length) {
      if (groupsReleased(blob, blank.workingGroups)) {
        awarded += blank.marks;
        credited.push(blank.label);
      } else {
        const method = methodCredit(blob, blank);
        const got = Math.max(method, blank.bareMarks ?? 0);
        awarded += got;
        if (got > 0) credited.push(`${blank.label} — method`);
        notes.push(`${blank.label}: the result is there, but not every required value is shown.`);
      }
      continue;
    }
    if (figure && blank.gradedAnswer) {
      const method = methodCredit(blob, blank);
      const bonus = method >= (blank.accuracyFrom ?? 2) ? 1 : 0;
      const got = Math.min(blank.marks, Math.max(blank.bareMarks ?? 0, method + bonus));
      awarded += got;
      if (got >= blank.marks) credited.push(blank.label);
      else if (got > 0) {
        credited.push(`${blank.label} — partial`);
        notes.push(
          method === 0
            ? `${blank.label}: that value with no algebraic working is only a special case.`
            : `${blank.label}: the value is right, but the working does not earn every method mark.`,
        );
      }
      continue;
    }
    if (figure || seenFullHit(parsed, blob, blank)) {
      if (!bundled) {
        awarded += blank.marks;
        credited.push(blank.label);
      }
      continue;
    }
    const counted = countCredit(source, blank);
    if (counted > 0) {
      awarded += counted;
      credited.push(`${blank.label} — partial`);
      notes.push(`${blank.label}: some of the values are right.`);
      continue;
    }
    const alt = bestAlt(blob, blank.alts);
    if (alt > 0) {
      awarded += alt;
      credited.push(`${blank.label} — special case`);
      notes.push(`${blank.label}: a special case from the mark scheme, not the full answer.`);
      continue;
    }
    const method = methodCredit(blob, blank);
    if (method > 0) {
      awarded += method;
      credited.push(`${blank.label} — method`);
      notes.push(`${blank.label}: the method is there, but the final figure is not correct.`);
      continue;
    }
    if (!raw.trim() && !blank.figureInWorking) {
      notes.push(`${blank.label}: no figure given.`);
      continue;
    }
    if (
      blank.signMatters &&
      parsed !== null &&
      blank.answers.some((target) => close(Math.abs(parsed), Math.abs(target), blank.tolerance))
    ) {
      notes.push(
        blank.signNote ??
          `${blank.label}: the size of the figure is right, but this balance is overdrawn — it needs a minus sign.`,
      );
    } else if (raw.trim() || (blank.figureInWorking && working.trim())) {
      notes.push(`${blank.label}: that figure is not accepted.`);
    } else {
      notes.push(`${blank.label}: no figure given.`);
    }
  }
  for (const bundle of part.bundles ?? []) {
    const got = bundleAward(bundle, matched, values);
    if (got > 0) {
      awarded += got;
      credited.push(bundle.ids.join(" + "));
    }
  }
  return shell(part, awarded, credited, notes);
}

function markWritten(part: WrittenPart, answer: PartAnswer | undefined): PartResult {
  const text = answer?.kind === "written" ? answer.text.trim() : "";
  if (!text) return shell(part, 0, [], ["No answer given."]);
  if (part.phraseSets?.length) {
    let best = 0;
    let label = "";
    for (const set of part.phraseSets) {
      if (set.marks > best && set.all.every((pattern) => mathsHas(text, pattern))) {
        best = set.marks;
        label = set.all.join(", ");
      }
    }
    const notes: string[] = [];
    if (best === 0) notes.push("That does not match a full mark-scheme answer yet.");
    else if (best < part.marks) notes.push("Part of the description is there. The top mark needs the full statement.");
    return shell(part, best, label ? [label] : [], notes);
  }
  const found = hitPoints(text, part.points);
  const words = wordCount(text);
  const link = hasLink(text);
  const judged = hasJudgement(text);
  const groups = new Set(found.map((point) => point.group).filter((group): group is string => Boolean(group)));
  const figure = (part.figureHints ?? []).some((hint) => includes(text, hint));
  const awarded = scoreProse(part, { hits: found.length, words, link, judged, groups: groups.size, figure });
  const notes: string[] = [];
  if (found.length === 0) notes.push("Nothing from the mark scheme was found in that answer. You do not need the exact words — the idea just has to appear somewhere in what you wrote.");
  else if (awarded < part.marks && wantsJudgement(part) && !judged) {
    notes.push("Add a clear judgement — say what you would actually recommend, and why.");
  } else if (awarded < part.marks && part.marks >= 4 && !link) notes.push("Develop the points. Say what the effect would be, not only the name of the idea.");
  if (found.length > 0 && part.marks >= 6 && needsBothSides(part)) {
    const spread = part.command === "advise" ? found.length >= 3 : groups.size >= 2;
    if (!spread) {
      notes.push(
        part.command === "advise"
          ? "Give more than one reason, then say what you would actually advise."
          : "A top band needs both sides, not only reasons for or only reasons against.",
      );
    }
  }
  return shell(part, awarded, found.map((point) => point.label), notes);
}

function scoreProse(
  part: WrittenPart,
  ctx: { hits: number; words: number; link: boolean; judged: boolean; groups: number; figure: boolean },
): number {
  const { hits, words, link, judged, groups } = ctx;
  if (hits <= 0) return 0;
  if (part.exactIdeas) return Math.min(part.marks, hits);
  // A mark-scheme idea anywhere in the answer is enough to start scoring.
  // Full marks still need enough separate ideas, not a copied sentence.
  if (part.marks <= 2) {
    if (hits >= 2) return part.marks;
    if (hits === 1 && (link || words >= 8)) return part.marks;
    return 1;
  }
  if (part.marks === 3) {
    if (hits >= 2 && (link || ctx.figure || words >= 12)) return 3;
    if (hits >= 2 || (hits === 1 && (link || ctx.figure))) return 2;
    return 1;
  }
  if (part.marks === 4) {
    if (hits >= 2 && (link || words >= 16 || ctx.figure)) return 4;
    if (hits >= 2) return 3;
    if (hits === 1 && (link || words >= 12 || ctx.figure)) return 2;
    return 1;
  }
  if (part.marks === 6) {
    let score = 2;
    if (hits >= 2) score = 4;
    if (hits >= 3 && (link || words >= 20)) score = 6;
    if (needsBothSides(part) && groups < 2) score = Math.min(score, 4);
    return score;
  }
  let score = 2;
  if (hits >= 2) score = 4;
  if (hits >= 3 && (link || words >= 24)) score = 6;
  const spread = part.command === "advise" ? hits >= 2 : groups >= 2 && hits >= 2;
  if (hits >= 4 && link && spread) score = part.marks >= 10 ? 8 : 7;
  if (spread && score < part.marks) score += 1;
  if (judged && hits >= 2 && score < part.marks) score += 1;
  if (hits >= 5 && judged && link && spread) score = part.marks;
  return Math.min(part.marks, score);
}

export function parseLoose(raw: string): number | null {
  const compact = raw.trim().toLowerCase().replace(/,/g, "");
  if (!compact) return null;
  const overdrawn = /\b(od|o\/d|overdrawn|in the red|deficit)\b/.test(compact);
  const re = /(\()?\s*(-|−)?\s*(\d+(?:\.\d+)?)\s*(\))?/g;
  let match: RegExpExecArray | null;
  let last: { value: number; neg: boolean } | null = null;
  while ((match = re.exec(compact))) {
    const wrapped = Boolean(match[1] || match[4]);
    const signed = Boolean(match[2]);
    last = { value: Number.parseFloat(match[3] ?? ""), neg: wrapped || signed };
  }
  if (!last || Number.isNaN(last.value)) return null;
  if (overdrawn) last.neg = true;
  return last.neg ? -Math.abs(last.value) : last.value;
}

const SUP: Record<string, string> = {
  "⁰": "0",
  "¹": "1",
  "²": "2",
  "³": "3",
  "⁴": "4",
  "⁵": "5",
  "⁶": "6",
  "⁷": "7",
  "⁸": "8",
  "⁹": "9",
  "⁺": "+",
  "⁻": "-",
};

function normMath(value: string): string {
  const expanded = value.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+/g, (run) => `^${[...run].map((ch) => SUP[ch] ?? ch).join("")}`);
  return expanded
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[−–—]/g, "-")
    .replace(/[×·∗*]/g, "x")
    .replace(/÷/g, "/")
    .replace(/√/g, "sqrt")
    .replace(/\s+/g, "");
}

function mathsHas(text: string, pattern: string): boolean {
  const hay = normMath(text);
  const needle = normMath(pattern);
  if (!needle || !hay.includes(needle)) return false;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (/^-?\d+(?:\.\d+)?$/.test(needle)) {
    return new RegExp(`(^|[^0-9.])${escaped}([^0-9.]|$)`).test(hay);
  }
  if (/\d$/.test(needle)) return new RegExp(`${escaped}(?![0-9])`).test(hay);
  return true;
}

function fractionValue(raw: string): number | null {
  const cleaned = raw.toLowerCase().replace(/[−–—]/g, "-");
  const mixed = cleaned.match(/(-?)\s*(\d+)\s+(\d+)\s*\/\s*(\d+)/);
  if (mixed?.[2] && mixed[3] && mixed[4]) {
    const sign = mixed[1] === "-" ? -1 : 1;
    const den = Number(mixed[4]);
    if (den === 0) return null;
    return (sign * (Number(mixed[2]) * den + Number(mixed[3]))) / den;
  }
  const frac = normMath(raw).match(/(-?\d+)\/(-?\d+)/);
  if (frac?.[1] && frac[2]) {
    const den = Number(frac[2]);
    if (den === 0) return null;
    return Number(frac[1]) / den;
  }
  return parseLoose(raw);
}

function equivalentFraction(text: string, n: number, d: number): boolean {
  const cleaned = text.toLowerCase().replace(/[−–—]/g, "-");
  const mixed = cleaned.match(/(-?)\s*(\d+)\s+(\d+)\s*\/\s*(\d+)/);
  if (mixed?.[2] && mixed[3] && mixed[4]) {
    const sign = mixed[1] === "-" ? -1 : 1;
    const den = Number(mixed[4]);
    if (den !== 0 && sign * (Number(mixed[2]) * den + Number(mixed[3])) * d === n * den) return true;
  }
  const source = normMath(text);
  const frac = source.match(/(-?\d+)\/(-?\d+)/);
  if (!frac?.[1] || !frac[2]) return false;
  const a = Number(frac[1]);
  const b = Number(frac[2]);
  return b !== 0 && a * d === n * b;
}

function standardHit(text: string, a: number, k: number): boolean {
  const source = normMath(text);
  const match = source.match(/(-?\d+(?:\.\d+)?)x10\^?(-?\d+)/);
  if (!match?.[1] || !match[2]) return false;
  return Math.abs(Number(match[1]) - a) < 1e-9 && Number(match[2]) === k;
}

function coordHit(raw: string, x: number, y: number): boolean {
  const nums = [...raw.replace(/[−–—]/g, "-").matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
  if (nums.length < 2) return false;
  return nums[nums.length - 2] === x && nums[nums.length - 1] === y;
}

function figureMatches(raw: string, blank: NumberBlank): boolean {
  const parsed = parseLoose(raw);
  if (parsed !== null && blank.answers.some((target) => close(parsed, target, blank.tolerance))) return true;
  if (blank.coords && coordHit(raw, blank.coords.x, blank.coords.y)) return true;
  if (
    blank.forms?.some((form) => {
      if (!mathsHas(raw, form)) return false;
      if (blank.looseForms) return true;
      return normMath(raw).length <= normMath(form).length + 8;
    })
  ) {
    return true;
  }
  if (blank.formSets?.some((set) => set.every((form) => mathsHas(raw, form)))) return true;
  if (blank.fraction && equivalentFraction(raw, blank.fraction.n, blank.fraction.d)) return true;
  if (blank.standard && standardHit(raw, blank.standard.a, blank.standard.k)) return true;
  return false;
}

function seenFullHit(parsed: number | null, blob: string, blank: NumberBlank): boolean {
  if (parsed === null || !blank.seenFull?.length) return false;
  return blank.seenFull.some(
    (rule) => rule.box.some((value) => close(parsed, value, blank.tolerance)) && mathsHas(blob, rule.seen),
  );
}

function countCredit(raw: string, blank: NumberBlank): number {
  let best = 0;
  for (const tier of blank.countForms ?? []) {
    const hits = tier.forms.filter((form) => mathsHas(raw, form)).length;
    if (hits >= tier.count) best = Math.max(best, tier.marks);
  }
  return best;
}

function groupsReleased(blob: string, groups: string[][]): boolean {
  return groups.every((group) => group.some((pattern) => mathsHas(blob, pattern)));
}

function bestAlt(blob: string, alts: NumberBlank["alts"]): number {
  let best = 0;
  for (const alt of alts ?? []) {
    if (alt.forms.some((form) => mathsHas(blob, form))) best = Math.max(best, alt.marks);
  }
  return best;
}

function methodCredit(blob: string, blank: NumberBlank): number {
  let best = 0;
  for (const tier of blank.methodTiers ?? []) {
    if (tier.patterns.every((pattern) => mathsHas(blob, pattern))) best = Math.max(best, tier.marks);
  }
  if ((blank.methodMarks ?? 0) > 0 && (blank.methodPatterns ?? []).some((pattern) => includes(blob, pattern))) {
    best = Math.max(best, blank.methodMarks ?? 0);
  }
  return Math.min(best, Math.max(0, blank.marks - (blank.gradedAnswer ? 1 : 0)));
}

function bundleAward(bundle: MarkBundle, matched: Set<string>, values: Record<string, string>): number {
  if (bundle.ids.every((id) => matched.has(id))) return bundle.marks;
  if (bundle.ftDifference?.length && bundle.ftDifference.every((check) => differenceHolds(values, check))) {
    return bundle.marks;
  }
  if (bundle.ftDouble && doubleHolds(values, bundle.ftDouble)) return bundle.marks;
  if (bundle.partial && bundle.ids.some((id) => matched.has(id))) return bundle.partial;
  return 0;
}

function differenceHolds(
  values: Record<string, string>,
  check: { total: string; subtract: string; result: string },
): boolean {
  const total = fractionValue(values[check.total] ?? "");
  const subtract = fractionValue(values[check.subtract] ?? "");
  const result = fractionValue(values[check.result] ?? "");
  if (total === null || subtract === null || result === null) return false;
  return Math.abs(result - (total - subtract)) < 0.051;
}

function doubleHolds(
  values: Record<string, string>,
  rule: { source: string; doubled: string; rest: string },
): boolean {
  const source = fractionValue(values[rule.source] ?? "");
  const doubled = fractionValue(values[rule.doubled] ?? "");
  const rest = fractionValue(values[rule.rest] ?? "");
  if (source === null || doubled === null || rest === null) return false;
  if (!(source < 0.5 - 1e-9)) return false;
  return Math.abs(doubled - 2 * source) < 0.02 && Math.abs(rest - (1 - doubled)) < 0.02;
}

function unusedHit(text: string, points: SchemePoint[], used: Set<string>): SchemePoint | undefined {
  return points.find((point) => !used.has(point.id) && point.patterns.some((pattern) => includes(text, pattern)));
}

function hitPoints(text: string, points: SchemePoint[]): SchemePoint[] {
  return points.filter((point) => point.patterns.some((pattern) => includes(text, pattern)));
}

const STOP = new Set([
  "a",
  "an",
  "the",
  "of",
  "to",
  "and",
  "or",
  "in",
  "on",
  "for",
  "with",
  "by",
  "it",
  "is",
  "be",
  "as",
  "at",
  "from",
  "that",
  "this",
  "their",
  "they",
  "not",
  "than",
  "into",
  "its",
]);

function includes(text: string, pattern: string): boolean {
  const hay = norm(text);
  const needle = norm(pattern);
  if (!needle) return false;
  if (hay.includes(needle)) return true;
  const words = needle.split(" ").filter((word) => word.length >= 3 && !STOP.has(word));
  if (words.length === 0) return false;
  const tokens = hay.split(/[^a-z0-9]+/).filter((token) => token.length >= 3);
  return words.every((word) =>
    tokens.some((token) => {
      if (token === word) return true;
      if (token.startsWith(word)) return true;
      return token.length >= 4 && word.startsWith(token);
    }),
  );
}

function norm(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/×/g, "x")
    .replace(/\s+/g, " ")
    .trim();
}

function hasLink(text: string): boolean {
  return /\b(because|so that|which means|therefore|this means|this leads|this helps|this could|this would|as a result|so the|so it|so they|meaning|in order to|leading to|leads to|due to|since|this allows|this lets|which lets|which helps|which could|which would|causing|means that)\b/i.test(
    text,
  );
}

function hasJudgement(text: string): boolean {
  return /\b(overall|on balance|i would|i advise|i recommend|i suggest they|in conclusion|the better option|they should|should not|i do not think|not worth|worth doing|advisable|i think they should|my advice|i recommend they)\b/i.test(
    text,
  );
}

function wantsJudgement(part: WrittenPart): boolean {
  return part.command === "evaluate" || part.command === "discuss" || part.command === "advise" || part.command === "assess";
}

function needsBothSides(part: WrittenPart): boolean {
  return part.points.some((point) => point.group === "for" || point.group === "against");
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function close(value: number, target: number, tolerance: number): boolean {
  return Math.abs(value - target) <= tolerance + 1e-6;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function trimNote(text: string): string {
  return text.length > 80 ? `${text.slice(0, 77)}…` : text;
}

export function practiceReading(score: number, max = 100): string {
  const pct = max > 0 ? (score / max) * 100 : 0;
  if (pct >= 80) return "Strong script — the ideas are landing.";
  if (pct >= 60) return "Solid — the longer answers still have marks left in them.";
  if (pct >= 40) return "Developing — the mark scheme shows what was missing.";
  return "Early — read the model points, then sit the paper again.";
}
