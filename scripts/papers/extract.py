"""Extract questions and mark-scheme text from the official PDFs in public/papers.

Run: python3 scripts/papers/extract.py  (needs poppler-utils `pdftotext`).
Writes src/lib/game/exam/real/<paper-id>.ts and src/lib/game/exam/real/index.ts.
Question numbers, marks and sub-parts come from the papers; MCQ answers come from
the scheme; numeric auto-marks only from the hand-checked VERIFIED_NUMERIC table.
Powers are recovered from glyph positions (richtext.py). Needs PyMuPDF.
"""
import json, os, re, subprocess, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import richtext  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PAPERS = os.path.join(ROOT, "public", "papers")
OUT = os.path.join(ROOT, "src", "lib", "game", "exam", "real")

SUBJECT = {
    "combined-science-biology": "biology", "combined-science-chemistry": "chemistry",
    "combined-science-physics": "physics", "maths": "maths", "business": "business",
    "history": "history", "english-language": "english", "english-literature": "english",
    "spanish": "spanish",
}

TITLES = {
    "aqa-8464-biology-paper1h": "Combined Science Trilogy · Biology Paper 1H",
    "aqa-8464-biology-paper2h": "Combined Science Trilogy · Biology Paper 2H",
    "aqa-8464-chemistry-paper1h": "Combined Science Trilogy · Chemistry Paper 1H",
    "aqa-8464-chemistry-paper2h": "Combined Science Trilogy · Chemistry Paper 2H",
    "aqa-8464-physics-paper1h": "Combined Science Trilogy · Physics Paper 1H",
    "aqa-8464-physics-paper2h": "Combined Science Trilogy · Physics Paper 2H",
    "aqa-8700-paper1": "English Language Paper 1 · Explorations in creative reading and writing",
    "aqa-8700-paper2": "English Language Paper 2 · Writers’ viewpoints and perspectives",
    "aqa-8702-paper1": "English Literature Paper 1 · Shakespeare and the 19th-century novel",
    "aqa-8702-paper2": "English Literature Paper 2 · Modern texts and poetry",
    "aqa-8145-paper1-america-1840-1895": "History Paper 1A · America, 1840–1895: Expansion and consolidation",
    "aqa-8145-paper1-asia-1950-1975": "History Paper 1B · Conflict and tension in Asia, 1950–1975",
    "edexcel-1ma1-paper1h": "Maths 1MA1 Paper 1H · Non-calculator",
    "edexcel-1ma1-paper2h": "Maths 1MA1 Paper 2H · Calculator",
    "edexcel-1ma1-paper3h": "Maths 1MA1 Paper 3H · Calculator",
    "edexcel-1bs0-paper1": "Business 1BS0 Paper 1 · Investigating small business",
    "edexcel-1bs0-paper2": "Business 1BS0 Paper 2 · Building a business",
    "edexcel-1sp0-paper1h-listening": "Spanish 1SP0 Paper 1H · Listening",
    "edexcel-1sp0-paper3h-reading": "Spanish 1SP0 Paper 3H · Reading",
    "edexcel-1sp0-paper4h-writing": "Spanish 1SP0 Paper 4H · Writing",
}

# AQA Trilogy spec reference -> topic name.
SPEC_TOPICS = {
    "4.1": "Cell biology", "4.2": "Organisation", "4.3": "Infection and response", "4.4": "Bioenergetics",
    "4.5": "Homeostasis and response", "4.6": "Inheritance, variation and evolution", "4.7": "Ecology",
    "5.1": "Atomic structure and the periodic table", "5.2": "Bonding, structure and properties",
    "5.3": "Quantitative chemistry", "5.4": "Chemical changes", "5.5": "Energy changes",
    "5.6": "Rates and equilibrium", "5.7": "Organic chemistry", "5.8": "Chemical analysis",
    "5.9": "Chemistry of the atmosphere", "5.10": "Using resources",
    "6.1": "Energy", "6.2": "Electricity", "6.3": "Particle model of matter", "6.4": "Atomic structure",
    "6.5": "Forces", "6.6": "Waves", "6.7": "Magnetism and electromagnetism",
}

KEYWORD_TOPICS = {
    "maths": [
        ("Probability and statistics", r"probabilit|mean|median|frequency|histogram|cumulative|box plot|scatter|sample|spinner|counters"),
        ("Geometry and measures", r"angle|triangle|circle|area|volume|perimeter|cylinder|sphere|cone|pythag|sin|cos|tan|bearing|polygon|vector|prism|diagram|arc|sector|transform|enlarge|rotat|reflect"),
        ("Ratio and proportion", r"ratio|proportion|percent|%|interest|depreciat|speed|density|pressure|rate|exchange|recipe|inversely"),
        ("Algebra", r"solve|equation|expand|factoris|simplify|graph|sequence|inequalit|formula|function|quadratic|gradient|straight line|\bx\b|\by\b|\bn\b"),
        ("Number", r".*"),
    ],
    "business": [
        ("Finance", r"revenue|cost|profit|cash|break.?even|finance|interest|loan|margin|calculate|£"),
        ("Marketing", r"market|price|promot|product|brand|customer|competit|segment|advert"),
        ("People and HR", r"employ|staff|recruit|train|motivat|organisation|human|worker|structure"),
        ("Operations", r"production|quality|supplier|stock|procure|logistic|batch|flow|job production|sales process"),
        ("Enterprise and the business environment", r".*"),
    ],
    "spanish": [
        ("Translation", r"translat"),
        ("Work and future plans", r"job|work|trabaj|career|empleo"),
        ("School", r"school|colegio|instituto|escuela"),
        ("Home, town and travel", r"live|house|casa|town|ciudad|holiday|viaje|vacacion"),
        ("Identity and culture", r".*"),
    ],
    "history": [
        ("Sources", r"source"), ("Interpretations", r"interpretation"),
        ("Account and narrative", r"write an account"), ("Explain / significance", r"explain|in what ways"),
        ("Extended essay", r".*"),
    ],
    "english": [
        ("Reading: retrieval", r"list four|identify"), ("Reading: language", r"language"),
        ("Reading: structure", r"structure|structured"), ("Reading: evaluation", r"evaluate|statement"),
        ("Comparison", r"compare"), ("Writing", r"write|describe|narrative|story|letter|article|speech"),
        ("Essay: set texts", r".*"),
    ],
}

JUNK = re.compile(
    r"DO NOT WRITE|Do not write|outside the|^\s*box\s*$|\*[A-Z0-9]{6,}\*|IB/[A-Z]/|Turn over|"
    r"continues on the next page|^\s*\d{1,2}\s*$|^\s*[\.\s…]{6,}$|Question \d+ continues|"
    r"©\s*20\d\d Pearson|^\s*P\d{5}[A-Z]{1,2}\s*$|^\s*[A-Z]:\d(/\d)*/?\s*$|BLANK PAGE|"
    r"^\s*\*\d{2}\*\s*$|^\s*number\s*$|MARK SCHEME\s*[–-]|^\s*Total Question \d+|Key idea\s+Answer|^\s*Question\s*$|"
    r"There are no questions printed|^\s*Copyright|^\s*AO\d\s*$|Answer ALL questions|Write your answers in|ANSWER IN THE SPACES PROVIDED"
)


def pdftext(path):
    return subprocess.run(["pdftotext", "-layout", path, "-"], capture_output=True, text=True, check=True).stdout


def clean_lines(lines):
    out = []
    for raw in lines:
        line = raw.replace("\t", " ").replace("\u2002", " ")
        if JUNK.search(line):
            continue
        line = re.sub(r"\.{4,}|(?:\. ){4,}\.?|…{2,}", " ____ ", line)
        line = re.sub(r"\s{3,}(box)?\s*$", "", line).rstrip()
        out.append(line)
    # Collapse layout spacing to single spaces but keep line breaks; drop runs of blanks.
    text = "\n".join(re.sub(r"\s{2,}", "  ", l.strip()) for l in out)
    text = re.sub(r"(\n\s*){3,}", "\n\n", text)
    text = re.sub(r"(____\s*){2,}", "____ ", text)
    return text.strip()


def minutes_from_cover(text):
    head = text[:3000]
    m = re.search(r"Time(?: allowed)?:?\s*(\d+)\s*hours?(?:\s*(\d+)\s*minutes)?", head)
    if m:
        return int(m.group(1)) * 60 + int(m.group(2) or 0)
    m = re.search(r"Time:?\s*(\d+)\s*minutes(?:\s*and\s*(\d+)\s*minutes)?", head, re.S)
    if m:
        return int(m.group(1)) + int(m.group(2) or 0)
    m = re.search(r"(\d+)\s*minutes", head)
    return int(m.group(1)) if m else 60


ROMAN = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii"]

# ---------------------------------------------------------------- QP parsing

def dedent_page(page):
    """Pearson pages carry a 'DO NOT WRITE IN THIS AREA' margin that shifts the text right."""
    lines = [re.sub(r"\(\s+([a-z]|[ivx]+)\s*\)|\(([a-z]|[ivx]+)\s+\)", lambda m: f"({m.group(1) or m.group(2)})", l.replace("\t", " ")) for l in page.split("\n")]
    real = [l for l in lines if l.strip() and not JUNK.search(l)]
    if not real:
        return lines
    margin = min(len(l) - len(l.lstrip()) for l in real)
    return [l[margin:] if len(l) - len(l.lstrip()) >= margin else l.lstrip() for l in lines]

END_RE = re.compile(r"E\s*N\s*D\s*O\s*F\s*Q\s*U\s*E\s*S\s*T\s*I\s*O\s*N\s*S", re.I)
PAPER_END_RE = re.compile(r"T\s*O\s*T\s*A\s*L\s*F\s*O\s*R\s*P\s*A\s*P\s*E\s*R", re.I)


def strip_end(text):
    """Remove an end-of-paper marker and anything after it."""
    if not text:
        return text
    m = END_RE.search(text) or PAPER_END_RE.search(text)
    return text[: m.start()].rstrip() if m else text


def parse_qp(text, board):
    pages = text.split("\f")
    totals = {int(n) for n in re.findall(r"\(Total for Question (\d+) (?:is|=)", text)}
    parts = []  # dict(label, q, sub, lines, marks, page)
    cur = None
    qnum = 0
    for pno, page in enumerate(pages, start=1):
        plines = dedent_page(page)
        ended = False
        for li, line in enumerate(plines):
            if END_RE.search(line) or (board != "AQA" and PAPER_END_RE.search(line)):
                ended = True
                break
            started = None
            if board != "AQA" and re.fullmatch(r"\s{0,3}(\d{1,2})\s*", line) and int(line) == qnum + 1:
                nxt = [l for l in plines[li + 1 : li + 6] if l.strip()]
                if nxt and not re.search(r"\*P\d{5}", nxt[0]) and (not totals or qnum + 1 in totals):
                    qnum = int(line)
                    cur = {"label": str(qnum), "q": qnum, "lines": [], "marks": 0, "page": pno, "pages": {pno}}
                    parts.append(cur)
                    continue
            if board == "AQA":
                m = re.match(r"^\s{0,4}(\d)\s{1,6}(\d)(?:\s?\.\s?(\d{1,2}))?(?=\s|$)\s*(.*)$", line)
                if m:
                    n = int(m.group(1) + m.group(2))
                    sub = m.group(3)
                    if (n == qnum and sub) or n == qnum + 1 or (qnum == 0 and n >= 1):
                        label = f"{n:02d}" + (f".{int(sub)}" if sub else "")
                        same = [p for p in parts if p["label"] == label]
                        if same:
                            cur = same[0]
                            cur["lines"].append(m.group(4))
                            continue
                        started = (n, label, m.group(4))
            else:
                m = re.match(r"^\s{0,3}(\d{1,2})(?:\s*(\([a-z]\)))?(?:\s*(\([ivx]+\)))?\s+(\S.*)$", line)
                if m and int(m.group(1)) == qnum + 1 and (re.search(r"[A-Za-z]{2,}", m.group(4)) or int(m.group(1)) in totals) and not re.match(r"^\s*\d+\s+(marks?|minutes|hours?)\b", line):
                    n = int(m.group(1))
                    label = f"{n}" + (m.group(2) or "") + (m.group(3) or "")
                    started = (n, label, m.group(4))
                elif qnum and cur is not None:
                    m2 = re.match(r"^\s{0,30}(\([a-z]\))?\s*(\([ivx]+\))?\s+(\S.*)$", line)
                    if m2 and (m2.group(1) or m2.group(2)):
                        letter = m2.group(1)
                        roman = m2.group(2)
                        base = re.match(r"^(\d+)(\([a-z]\))?", cur["label"])
                        prev_letter = base.group(2)
                        if letter:
                            ok = prev_letter is None and letter == "(a)" or (
                                prev_letter and ord(letter[1]) == ord(prev_letter[1]) + 1)
                            if ok:
                                label = f"{qnum}{letter}" + (roman or "")
                                started = (qnum, label, m2.group(3))
                        elif roman and prev_letter:
                            label = f"{qnum}{prev_letter}{roman}"
                            if not any(p["label"] == label for p in parts):
                                started = (qnum, label, m2.group(3))
            if started:
                n, label, rest = started
                # A part that only introduces context with no marks becomes the lead of the next one.
                qnum = n
                cur = {"label": label, "q": n, "lines": [rest], "marks": 0, "page": pno, "pages": {pno}}
                parts.append(cur)
                continue
            if cur is None:
                continue
            if board == "AQA":
                mk = re.search(r"\[(?:SPaG\s*)?(\d+) marks?\]", line)
                if mk and "SPaG" not in line and not re.search(r"AO4\s*\[", line):
                    cur["marks"] += int(mk.group(1))
                    continue
                if mk:
                    cur["spag"] = int(mk.group(1))
                    continue
            else:
                mk = re.match(r"^\s*\((\d{1,2})\)\s*$", line)
                if mk:
                    cur["marks"] += int(mk.group(1))
                    continue
                tot = re.search(r"\(Total for Question (\d+) (?:is|=) (\d+) marks?\)", line)
                if tot:
                    tq, tm = int(tot.group(1)), int(tot.group(2))
                    mine = [x for x in parts if x["q"] == tq]
                    have = sum(x["marks"] for x in mine)
                    if mine and have < tm:
                        mine[-1]["marks"] += tm - have
                    continue
                if re.search(r"TOTAL FOR (PAPER|SECTION)", line):
                    continue
            cur["lines"].append(line)
            cur["pages"].add(pno)
        if ended:
            break
    return parts


def options_for(part_text, board):
    t = part_text
    if board != "AQA":
        if not re.search(r"Select (one|two) answers?", t):
            return None
        opts = re.findall(r"^\s*([A-E])\s{1,}(\S.*)$", t, re.M)
        letters = [o[0] for o in opts]
        if letters[:4] == ["A", "B", "C", "D"]:
            return [f"{l} – {txt.strip()}" for l, txt in opts[: 5 if letters[4:5] == ["E"] else 4]]
        return None
    if not re.search(r"Tick \(.?\) one box", t):
        return None
    after = t.split("one box", 1)[1]
    cands = []
    for line in after.split("\n"):
        line = line.strip()
        if not line or line.startswith("____"):
            continue
        for chunk in re.split(r"\s{2,}", line):
            chunk = chunk.strip(" .")
            chunk = re.sub(r"\s+\d{1,2}$", "", chunk)
            if chunk and len(chunk) < 90:
                cands.append(chunk)
    if 2 <= len(cands) <= 6:
        return cands
    return None

# ---------------------------------------------------------------- MS parsing

def parse_ms(text, board):
    body = text
    sections = {}
    order = []
    if board == "AQA":
        pat = re.compile(r"^\s{0,8}(\d\d(?:\.\d{1,2})?)(?=\s)(.*)$")
        qpat2 = re.compile(r"^\s{0,8}(?:Question\s+)?0\s?(\d)(?=\s{2,}|\s*$)(.*)$")
    cur = None
    qnum = 0
    for line in body.split("\n"):
        line = line.replace("\t", " ")
        label = None
        if board == "AQA":
            ms2 = re.match(r"^\s{0,8}(\d)\s{1,4}(\d)(?:\s?\.\s?(\d{1,2}))?\s{2,}(\S.*)$", line)
            ms3 = re.match(r"^\s{0,3}Question (\d{1,2})\s*$", line)
            if ms2 and int(ms2.group(1) + ms2.group(2)) >= max(qnum, 1) and int(ms2.group(1) + ms2.group(2)) <= qnum + 1:
                n = int(ms2.group(1) + ms2.group(2))
                lab = f"{n:02d}" + (f".{int(ms2.group(3))}" if ms2.group(3) else "")
                if lab not in sections or lab != cur:
                    qnum = n
                    label, rest = lab, ms2.group(4)
            elif ms3 and qnum <= int(ms3.group(1)) <= qnum + 1:
                qnum = int(ms3.group(1))
                label, rest = f"{qnum:02d}", ""
        if board == "AQA" and not label:
            m = pat.match(line)
            if m:
                lab = m.group(1)
                n = int(lab[:2])
                if 1 <= n <= 40 and (n >= qnum) and not re.match(r"^\s*\d\d\.\d\d\.\d", line):
                    label, rest = lab if "." not in lab else f"{lab[:2]}.{int(lab[3:])}", m.group(2)
                    qnum = n
        else:
            m = re.match(r"^\s{0,6}(?:Q\s*)?(\d{1,2})\s*(\([a-z]\))?\s*(\([ivx]+\))?(?=\s)(.*)$", line)
            if m and qnum <= int(m.group(1)) <= qnum + 1 and not re.search(r"^\s*\d+\s+(All|The|If|Examiners|Mark|Where|When|Crossed|Choice|Incorrect|Follow|Ignoring|Probability|Linear|Range|Number|Use|Word|Misread|Parts)\b", line):
                qnum = int(m.group(1))
                label, rest = f"{qnum}{m.group(2) or ''}{m.group(3) or ''}", m.group(4)
            elif qnum:
                m2 = re.match(r"^\s{1,10}(\([a-z]\))?\s*(\([ivx]+\))?(?=\s)(.*)$", line)
                if m2 and (m2.group(1) or m2.group(2)):
                    if m2.group(1):
                        label, rest = f"{qnum}{m2.group(1)}{m2.group(2) or ''}", m2.group(3)
                    elif cur:
                        base = re.match(r"^\d+(\([a-z]\))?", cur)
                        label, rest = f"{qnum}{base.group(1) or ''}{m2.group(2)}", m2.group(3)
        if label:
            cur = label
            if label not in sections:
                sections[label] = []
                order.append(label)
            sections[label].append(rest)
            continue
        if cur:
            sections[cur].append(line)
    out = {}
    for k, v in sections.items():
        txt = "\n".join(v)
        txt = re.sub(r"^.*(Question\s+(number\s+)?Answers?|Mark\s+AO|Spec\.? Ref|Additional guidance|Paper: 1MA1).*$", "", txt, flags=re.M)
        txt = re.sub(r"^\s*(AO\d[a-z]?\s*/?\s*)+$|^\s*\d+\.\d+(\.\d+)+\s*$|^\s*\d{1,2}\s*$", "", txt, flags=re.M)
        txt = clean_lines(txt.split("\n"))
        out[k] = txt[:2500] + (" …" if len(txt) > 2500 else "")
    return out


def heading_sections(ms_text):
    """Level-of-response schemes (English Literature, Spanish writing) are headed 'Question 28.1' or 'Question 1 – Higher tier'."""
    out = {}
    marks = [(m.start(), m.group(1)) for m in re.finditer(r"(?m)^\s{0,4}(?:Section [A-C]:[^\n]*?)?Question (\d+(?:\.\d)?)\b", ms_text)]
    for i, (pos, lab) in enumerate(marks):
        end = marks[i + 1][0] if i + 1 < len(marks) else len(ms_text)
        chunk = clean_lines(ms_text[pos:end].split("\n"))
        if len(chunk) > 80:
            out.setdefault(lab, chunk[:4000] + (" …" if len(chunk) > 4000 else ""))
    return out


def ms_lookup(ms, label, board, headed=None):
    """Returns (scheme text, source) where source is exact | children | heading | ''."""
    if label in ms:
        return ms[label], "exact"
    kids = [k for k in ms if k.startswith(label) and k != label and k[len(label)] in "(."]
    if kids:
        return "\n\n".join(f"{k}\n{ms[k]}" for k in kids), "children"
    headed = headed or {}
    num = label.split(".")[0].lstrip("0") if board == "AQA" else re.match(r"\d+", label).group(0)
    for cand in (label.lstrip("0"), num):
        if cand in headed:
            return headed[cand], "heading"
    return "", ""


def mcq_answer(scheme, options, board):
    if not options or not scheme:
        return None
    if board != "AQA":
        m2 = re.search(r"correct answers are ([A-E])\b.*? and ([A-E])\b", scheme)
        if m2:
            picks = [o for o in options if o[0] in (m2.group(1), m2.group(2))]
            return picks if len(picks) == 2 else None
        m = re.search(r"correct answer is ([A-E])\b", scheme) or re.match(r"^\s*([A-E])\b", scheme)
        if m:
            for o in options:
                if o.startswith(m.group(1) + " "):
                    return [o]
        return None
    first = scheme.strip().split("\n")[0]
    first = re.split(r"\s{2,}", first)[0].strip().lower()
    hits = [o for o in options if o.lower() == first or o.lower().rstrip(".") == first.rstrip(".")]
    return hits if len(hits) == 1 else None


NUM = r"-?\d[\d,]*(?:\.\d+)?"


# Final answers that were checked by hand against the rendered mark-scheme pages
# (value first, then any other answers the scheme allows). Only these parts are
# auto-marked as numeric; everything else is self-marked against the scheme.
VERIFIED_NUMERIC = {
    "aqa-8464-biology-paper2h:03.6": [105],
    "aqa-8464-physics-paper1h:02.1": [920],
    "aqa-8464-physics-paper1h:03.2": [6],
    "aqa-8464-physics-paper1h:05.5": [2.5],
    "aqa-8464-physics-paper2h:01.2": [2.2, 2.24],  # MS: v = 2.2… (1 500 000 / 670 000 = 2.238…)
    "aqa-8464-physics-paper2h:01.3": [1700],
    "aqa-8464-physics-paper2h:02.1": [6.75, 6.8],  # MS: a = 6.75, allow 6.8 (was wrongly stored as 2)
    "aqa-8464-physics-paper2h:05.4": [0.375, 0.38],
    "edexcel-1ma1-paper1h:1": [6],
    "edexcel-1ma1-paper1h:2(a)": [0.4],
    "edexcel-1ma1-paper1h:2(b)": [150],
    "edexcel-1ma1-paper1h:4(a)": [4.5],
    "edexcel-1ma1-paper1h:6": [12],
    "edexcel-1ma1-paper1h:11": [125],
    "edexcel-1ma1-paper1h:12(b)": [220],
    "edexcel-1ma1-paper2h:1(b)": [150],
    "edexcel-1ma1-paper2h:3(a)": [6],
    "edexcel-1ma1-paper2h:6": [370],
    "edexcel-1ma1-paper2h:7": [60.3],
    "edexcel-1ma1-paper2h:8": [25],
    "edexcel-1ma1-paper2h:11(b)": [0.29],
    "edexcel-1ma1-paper2h:19": [17],
    "edexcel-1ma1-paper2h:23": [73],
    "edexcel-1ma1-paper3h:3": [60],
    "edexcel-1ma1-paper3h:6": [630],
    "edexcel-1ma1-paper3h:8": [44.9],
    "edexcel-1ma1-paper3h:10": [12.6],
    "edexcel-1ma1-paper3h:11(a)": [2],
    "edexcel-1ma1-paper3h:12(b)": [160],
    "edexcel-1ma1-paper3h:14": [23.3],
    "edexcel-1ma1-paper3h:16": [15],
    "edexcel-1ma1-paper3h:19": [633],
    "edexcel-1ma1-paper3h:20": [57],
}
# Symbol-font glyphs (Private Use Area) that pdftotext passes through.
PUA = str.maketrans({"\uf0b4": "×", "\uf0b8": "÷", "\uf070": "π", "\uf0a2": "", "\uf0b1": "±", "\uf02d": "−",
                     "\uf03d": "=", "\uf02b": "+", "\uf0a3": "≤", "\uf0b3": "≥", "\uf0d6": "√", "\uf071": "θ",
                     "\uf0b0": "°", "\uf061": "α", "\uf0e6": "", "\uf0f6": "", "\uf0e8": "", "\uf0f8": "", "\uf0e7": "", "\uf0f7": "",
                     "\uf03c": "<", "\uf050": "✓", "\uf05b": "[", "\uf05d": "]", "\uf06c": "λ", "\uf06d": "μ",
                     "\uf084": "≤", "\uf0a1": "○", "\uf0d0": "∠", "\uf0ee": "", "\uf0fa": "•", "\uf0fc": "✓"})


with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "overrides.json"), encoding="utf-8") as _fh:
    OVERRIDES = {k: v for k, v in json.load(_fh).items() if not k.startswith("_")}


def apply_override(part, o):
    """Hand-checked fixes (overrides.json): retyped maths, moved context, verified answers."""
    if not o:
        return
    for key in ("prompt", "lead"):
        if key in o:
            part[key] = o[key]
    if "answer" in o:
        part["scheme"] = f"Answer: {o['answer']}\n\n{part['scheme']}"
        part["schemeSource"] = part.get("schemeSource") if part.get("schemeSource") != "pdf" else "manual"
    if "numeric" in o:
        part["kind"] = "numeric"
        part["numeric"] = o["numeric"][0]
        if len(o["numeric"]) > 1:
            part["accept"] = o["numeric"][1:]
        else:
            part.pop("accept", None)
    if o.get("kind") == "self":
        part["kind"] = "self"
        part.pop("numeric", None)
        part.pop("accept", None)


def tidy(text, rich):
    if not text:
        return text
    text = strip_end(richtext.repair(text.translate(PUA), rich))
    # Standard form with a negative power, e.g. "× 10−3" or "× 10–7" -> "× 10⁻³".
    text = re.sub(r"× 10\s?[−–-](\d{1,2})\b", lambda m: "× 10⁻" + m.group(1).translate(richtext.SUP), text)
    return text


def numeric_answer(prompt, scheme, board, marks):
    if not scheme:
        return None
    if board == "AQA":
        m = re.search(r"an answer of (" + NUM + r")(?:\s*\(?[^\n]{0,20}?\)?)?\s+scores? (\d+) marks?", scheme)
        if m and int(m.group(2)) == marks:
            return float(m.group(1).replace(",", ""))
        if re.search(r"\bCalculate\b", prompt) and not re.search(r"Give your answer in standard form|significant", prompt):
            vals = re.findall(r"^\s*[A-Za-z][A-Za-z ]{0,12}=\s*(" + NUM + r")\b", scheme, re.M)
            if vals:
                return float(vals[-1].replace(",", ""))
        return None
    if not re.search(r"work out|calculate|find|how many|what is|estimate", prompt, re.I):
        return None
    first = scheme.strip().split("\n")[0]
    cell = re.split(r"\s{2,}", first.strip())[0]
    cell = cell.replace("£", "").replace("%", "").strip()
    if re.fullmatch(NUM, cell):
        return float(cell.replace(",", ""))
    return None


def topic_for(subject, scheme, prompt):
    refs = re.findall(r"\b([4-6]\.\d{1,2})\.\d", scheme or "")
    for r in refs:
        if r in SPEC_TOPICS:
            return SPEC_TOPICS[r]
    rules = KEYWORD_TOPICS.get(subject)
    if subject in ("biology", "chemistry", "physics"):
        return {"biology": "Biology", "chemistry": "Chemistry", "physics": "Physics"}[subject] + " (mixed)"
    if rules:
        for name, rx in rules:
            if re.search(rx, prompt, re.I):
                return name
    return "General"


FIG = re.compile(r"\b(Figure|Table|graph|diagram|grid|Source [A-F]|Interpretation [A-F]|map|photograph|chart)\b", re.I)


def build(stem, subj_dir, files):
    board = "AQA" if stem.startswith("aqa") else "Edexcel"
    qp_file = files["qp"]
    qp_text = pdftext(os.path.join(PAPERS, subj_dir, qp_file))
    ms_text = pdftext(os.path.join(PAPERS, subj_dir, files["ms"])) if "ms" in files else ""
    subject = SUBJECT[subj_dir]
    minutes = minutes_from_cover(qp_text)
    if "listening" in stem:
        minutes = 45  # 40 minutes plus 5 minutes' reading time (front cover)
    raw = parse_qp(qp_text, board)
    ms = parse_ms(ms_text, board)
    headed = heading_sections(ms_text)
    rich = richtext.rich_lines(os.path.join(PAPERS, subj_dir, qp_file))
    rich_ms = richtext.rich_lines(os.path.join(PAPERS, subj_dir, files["ms"])) if "ms" in files else {}
    qp_url = f"/papers/{subj_dir}/{qp_file}"
    ins_url = f"/papers/{subj_dir}/{files['ins']}" if "ins" in files else None
    questions = {}
    pending_lead = ""
    for p in raw:
        text = clean_lines(p["lines"])
        if p["marks"] == 0 and board == "AQA" and "." not in p["label"] and not re.search(r"\?", text[-200:] if text else ""):
            # Context paragraph before 0 1 . 1 etc.
            pending_lead += ("\n\n" if pending_lead else "") + tidy(text, rich)
            continue
        if p["marks"] == 0 and board != "AQA":
            pending_lead += ("\n\n" if pending_lead else "") + tidy(text, rich)
            continue
        scheme, source = ms_lookup(ms, p["label"], board, headed)
        opts = options_for(text, board)
        ans = mcq_answer(scheme, opts, board)
        pid = f"{stem}:{p['label']}"
        verified = VERIFIED_NUMERIC.get(pid)
        num = None if opts or not verified else verified[0]
        text = tidy(text, rich)
        scheme = tidy(scheme, rich_ms)
        if opts:
            opts = [tidy(o, rich) for o in opts]
            if any(len(o) > 3 for o in opts):  # stray page numbers caught as options
                opts = [o for o in opts if not re.fullmatch(r"\d{1,2}", o)]
        if ans:
            ans = [tidy(a, rich) for a in ans]
            if opts and not all(a in opts for a in ans):
                ans = None
        kind = "mcq" if (opts and ans) else ("numeric" if num is not None else "self")
        part = {
            "id": f"{stem}:{p['label']}",
            "label": p["label"],
            "marks": p["marks"],
            "prompt": text,
            "page": p["page"],
            "kind": kind,
            "scheme": scheme or "See the official mark scheme PDF for this part.",
            "schemeSource": source or "pdf",
            "topic": topic_for(subject, scheme, text),
        }
        if pending_lead:
            part["lead"] = pending_lead.strip()
            pending_lead = ""
        if opts and ans:
            part["options"] = opts
            part["answer"] = ans
            cut = re.search(r"(Tick \(.?\) one box\.?|Select (one|two) answers?\.?)", text)
            if cut:
                part["prompt"] = text[: cut.end()].strip()
        if num is not None:
            part["numeric"] = num
            if len(verified) > 1:
                part["accept"] = verified[1:]
        if FIG.search(text) or (part.get("lead") and FIG.search(part["lead"])):
            part["seePaper"] = True
        if p.get("spag"):
            part["spag"] = p["spag"]
        questions.setdefault(p["q"], []).append(part)
    for ps in questions.values():
        for part in ps:
            apply_override(part, OVERRIDES.get(part["id"]))
    official = {int(a): int(b) for a, b in re.findall(r"\(Total for Question (\d+) (?:is|=) (\d+) marks?\)", qp_text)}
    qs = []
    for n, ps in sorted(questions.items()):
        own = sum(x["marks"] + x.get("spag", 0) for x in ps)
        if board == "AQA" and ps:
            # The "total for this question" box prints its mark at the end of the last answer line.
            last = ps[-1]
            last["prompt"] = re.sub(rf"\s{{2,}}{own}\s*$", "", last["prompt"]).rstrip()
        for part in ps:
            for fld in ("prompt", "lead"):
                if part.get(fld):
                    part[fld] = re.sub(r"\s*\bExtra space\s*$", "", part[fld], flags=re.I).rstrip()
        q = {"number": n, "marks": own, "parts": ps}
        if n in official and own > official[n] and len({x["marks"] for x in ps}) == 1:
            # Either/or tasks: each option carries the full question total.
            q["marks"] = official[n]
            q["alternatives"] = True
        qs.append(q)
    total = sum(q["marks"] for q in qs)
    cover_total = re.search(r"maximum mark for this paper is (\d+)|total mark for this paper is (\d+)", qp_text, re.I)
    return {
        "id": stem,
        "subjectId": subject,
        "board": board,
        "spec": stem.split("-")[1].upper(),
        "series": "June 2025",
        "title": TITLES.get(stem, stem),
        "minutes": minutes,
        "totalMarks": total,
        "coverMarks": int(next(g for g in cover_total.groups() if g)) if cover_total else total,
        "qp": qp_url,
        "ms": f"/papers/{subj_dir}/{files['ms']}" if "ms" in files else None,
        "insert": ins_url,
        "choice": total > (int(next(g for g in cover_total.groups() if g)) if cover_total else total),
        "questions": qs,
    }


def main():
    os.makedirs(OUT, exist_ok=True)
    index = []
    report = []
    for d in sorted(os.listdir(PAPERS)):
        groups = {}
        for f in sorted(os.listdir(os.path.join(PAPERS, d))):
            m = re.match(r"(.+)-jun2025-(qp|ms|ins)\.pdf$", f)
            if m:
                groups.setdefault(m.group(1), {})[m.group(2)] = f
        for stem, files in groups.items():
            if "qp" not in files:
                continue
            paper = build(stem, d, files)
            var = re.sub(r"[^a-zA-Z0-9]", "_", stem)
            with open(os.path.join(OUT, f"{stem}.ts"), "w") as fh:
                fh.write("// Generated by scripts/papers/extract.py from the official PDFs. Do not edit by hand.\n")
                fh.write('import type { RealPaper } from "./types";\n\n')
                fh.write(f"export const {var}: RealPaper = ")
                fh.write(json.dumps(paper, ensure_ascii=False, indent=1))
                fh.write(";\n")
            index.append((stem, var))
            parts = [p for q in paper["questions"] for p in q["parts"]]
            report.append(f"{stem}: {len(paper['questions'])} questions, {len(parts)} parts, {paper['totalMarks']}/{paper['coverMarks']} marks, "
                          f"{sum(p['kind']=='mcq' for p in parts)} mcq, {sum(p['kind']=='numeric' for p in parts)} numeric, "
                          f"{sum(1 for p in parts if p['scheme'].startswith('See the official'))} no-scheme, {paper['minutes']} min")
    with open(os.path.join(OUT, "index.ts"), "w") as fh:
        fh.write("// Generated by scripts/papers/extract.py. Do not edit by hand.\n")
        fh.write('import type { RealPaper } from "./types";\n')
        for stem, var in index:
            fh.write(f'import {{ {var} }} from "./{stem}";\n')
        fh.write("\nexport const REAL_PAPERS: RealPaper[] = [" + ", ".join(v for _, v in index) + "];\n")
    print("\n".join(report))


if __name__ == "__main__":
    main()
