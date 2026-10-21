"""Recover superscripts that pdftotext -layout flattens (2 × 5³ printed as "2 × 53").

PyMuPDF gives every glyph with its size and baseline. Glyphs clearly smaller than the
row they sit on, and raised above its baseline, are powers; they become Unicode
superscripts. `repair` swaps a flattened layout line for its rich version when the
two match glyph-for-glyph (ignoring spaces).
"""
import re

SUP = str.maketrans("0123456789+-−–=()nxyabkt", "⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁻⁻⁼⁽⁾ⁿˣʸᵃᵇᵏᵗ")
SUP_CHARS = "⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾ⁿˣʸᵃᵇᵏᵗ"


def key(text):
    return re.sub(r"\s+", "", text)


def page_rows(page):
    chars = []
    for block in page.get_text("rawdict")["blocks"]:
        for line in block.get("lines", []):
            for span in line["spans"]:
                for ch in span["chars"]:
                    c = ch["c"]
                    if c in "\t":
                        continue
                    chars.append((ch["origin"][0], ch["origin"][1], span["size"], c, ch["bbox"][2]))
    normal = [c for c in chars if c[2] >= 9]
    rows = []
    for c in sorted(normal, key=lambda c: c[1]):
        if rows and abs(rows[-1]["y"] - c[1]) <= 1.5 and abs(rows[-1]["size"] - c[2]) < 3:
            rows[-1]["chars"].append(c)
        else:
            rows.append({"y": c[1], "size": c[2], "chars": [c]})
    for c in chars:
        if c[2] >= 9 or not re.fullmatch(r"[0-9+\-−–=()nxyabkt]", c[3]):
            continue
        # Attach a small glyph to the row whose baseline is just below it.
        best = None
        for r in rows:
            lift = r["y"] - c[1]
            if 1.5 < lift < r["size"] * 0.75 and any(abs(o[0] - c[0]) < 400 for o in r["chars"]):
                near = min(abs(o[4] - c[0]) for o in r["chars"])
                if near < 6 and (best is None or near < best[0]):
                    best = (near, r)
        if best:
            best[1]["chars"].append((c[0], c[1], c[2], c[3].translate(SUP), c[4]))
    out = []
    for r in rows:
        cs = sorted(r["chars"], key=lambda c: c[0])
        text = ""
        last_x = None
        for c in cs:
            if last_x is not None and c[0] - last_x > 2.5 and not text.endswith(" ") and c[3] != " ":
                text += " "
            text += c[3]
            last_x = c[4]
        out.append(text)
    return out


def rich_lines(path):
    """Map "context+plain power" -> "context+superscript" for every raised run in the PDF."""
    import fitz  # PyMuPDF

    found = {}
    for page in fitz.open(path):
        for row in page_rows(page):
            for m in re.finditer("[" + SUP_CHARS + "]+", row):
                ctx = re.sub(r"\s+", "", row[: m.start()])[-5:]
                if len(ctx) < 3:
                    continue
                plain = m.group(0)
                for s, d in zip(SUP_CHARS, "0123456789+-=()nxyabkt"):
                    plain = plain.replace(s, d)
                found[(ctx, plain)] = m.group(0)
    return found


def repair(text, found):
    """Turn flattened powers ("cm3", "x2 + 5") back into superscripts using the PDF glyph map."""
    if not text or not found:
        return text
    for (ctx, plain), sup in sorted(found.items(), key=lambda kv: -len(kv[0][0])):
        pattern = r"\s*".join(re.escape(c) for c in ctx)
        text = re.sub("(" + pattern + r")\s?" + re.escape(plain) + r"(?![0-9])", lambda m: m.group(1) + sup, text)
    return text
