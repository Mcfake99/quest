"""Cross-checks every extracted part against the official QP and MS text.

Run: python3 scripts/papers/audit.py [paper-id]
Prints one line per problem and a per-paper summary. Exit code 1 when problems remain.
"""
import json, os, re, sys

sys.path.insert(0, os.path.dirname(__file__))
import extract as e  # noqa: E402

REAL = os.path.join(e.OUT)


def load(stem):
    s = open(os.path.join(REAL, f"{stem}.ts")).read()
    return json.loads(s[s.index("= ") + 2 :].rstrip().rstrip(";"))


def norm(t):
    return re.sub(r"[^a-z0-9]", "", t.lower())


def audit(paper):
    issues = []
    sub = paper["qp"].split("/")[2]
    qp = e.pdftext(os.path.join(e.ROOT, "public", paper["qp"].lstrip("/")))
    ms_text = e.pdftext(os.path.join(e.ROOT, "public", paper["ms"].lstrip("/"))) if paper["ms"] else ""
    ms = e.parse_ms(ms_text, paper["board"])
    qp_n = norm(qp)
    pages = qp.split("\f")
    parts = [p for q in paper["questions"] for p in q["parts"]]
    # 1. Cover total
    if not paper.get("choice") and paper["totalMarks"] != paper["coverMarks"]:
        issues.append(("paper", f"marks sum {paper['totalMarks']} != cover {paper['coverMarks']}"))
    # 2. Question totals against Pearson '(Total for Question N is M marks)' / AQA MS 'Total Question N'
    totals = {int(a): int(b) for a, b in re.findall(r"\(Total for Question (\d+) (?:is|=) (\d+) marks?\)", qp)}
    totals.update({int(a): int(b) for a, b in re.findall(r"Total Question (\d+)\s+(\d+)", ms_text)})
    for q in paper["questions"]:
        own = sum(p["marks"] + p.get("spag", 0) for p in q["parts"])
        if q.get("alternatives"):
            own = q["parts"][0]["marks"]
        if q["number"] in totals and totals[q["number"]] != own:
            issues.append((str(q["number"]), f"question marks {own} != official total {totals[q['number']]}"))
    for p in parts:
        lab = p["label"]
        # 3. Prompt text really is on the stated page
        first = next((l for l in p["prompt"].split("\n") if norm(l.replace("____", ""))), "")
        flat = first.replace("____", "").translate(str.maketrans("⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿˣʸᵃᵇᵏᵗ×÷π✓", "0123456789+-=()nxyabkt    "))
        probe = norm(flat)[:30]
        page_n = norm(pages[p["page"] - 1])
        hand = e.OVERRIDES.get(p["id"], {})
        if probe and probe not in page_n and "prompt" not in hand:
            issues.append((lab, "prompt not found on its stated page"))
        elif probe and probe not in qp_n and "prompt" not in hand:
            issues.append((lab, "prompt text not in QP"))
        # 4. AQA marks printed with the part
        if paper["board"] == "AQA" and "." in lab:
            pass
        # 5. Scheme comes from this part's own MS row
        if p.get("schemeSource") in ("pdf", ""):
            issues.append((lab, "no mark-scheme text extracted"))
        if p.get("schemeSource") == "heading" and paper["board"] != "AQA" and "writing" not in paper["id"]:
            issues.append((lab, "scheme taken from a question heading, not the part row"))
        # 6. Auto-mark answers appear in this part's MS row
        own = ms.get(lab, "")
        if p["kind"] == "mcq":
            for a in p.get("answer", []):
                if paper["board"] != "AQA":
                    letters = re.findall(r"correct answers? (?:is|are) ([A-E])(?:\b.*?\band ([A-E])\b)?", own, re.S)
                    if not letters or a[0] not in [x for t in letters for x in t if x]:
                        issues.append((lab, f"mcq answer '{a}' not the scheme's letter"))
                    continue
                if norm(a)[:25] not in norm(own):
                    issues.append((lab, f"mcq answer '{a}' not in its MS row"))
        if p["kind"] == "numeric":
            val = p["numeric"]
            shown = ("%g" % val)
            if shown not in own.replace(",", ""):
                if "numeric" not in hand:  # hand-verified values are exempt
                    issues.append((lab, f"numeric answer {shown} not in its MS row"))
    # 7. Every part on the scheme exists in the data and vice versa (a missed part would merge its marks into its neighbour).
    labels = {p["label"] for p in parts}
    for lab in ms:
        covered = lab in labels or any(lab.startswith(l) and lab[len(l)] in "(." for l in labels) or any(l.startswith(lab) and l[len(lab)] in "(." for l in labels)
        if not covered and re.match(r"^\d", lab) and lab != "0":
            issues.append((lab, "part on the mark scheme is missing from the data"))
    return parts, issues


def ms_marks(paper, row):
    raw = row
    if paper["spec"] == "1MA1":
        codes = re.findall(r"(?<![A-Za-z])(?:M|A|P|B|C)(\d)(?![\d])", raw.split("SC")[0])
        return sum(int(c) for c in codes) or None
    if paper["board"] != "AQA":
        m = re.search(r"\((\d{1,2})\)", raw)
        return int(m.group(1)) if m else None
    if paper["spec"] == "8464":
        if re.search(r"Level \d", raw):
            return None
        nums = re.findall(r"\s(\d)\s+AO\d", " " + raw)
        return sum(int(n) for n in nums) or None
    return None


def main():
    only = sys.argv[1:]
    bad = 0
    for f in sorted(os.listdir(REAL)):
        stem = f[:-3]
        if not re.match(r"(aqa|edexcel)-", stem) or (only and stem not in only):
            continue
        paper = load(stem)
        parts, issues = audit(paper)
        bad += len(issues)
        print(f"{stem}: {len(parts)} parts checked, {len(issues)} problems")
        for lab, msg in issues:
            print(f"   {lab}: {msg}")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
