#!/usr/bin/env python3
"""
Hand-build an editable Word doc from infrastructure-document.html.

Why hand-built: pandoc loses CSS, pdf2docx produces text-boxes. python-docx
emits native Word paragraphs/tables/runs that edit cleanly. We mirror the
HTML's design tokens (indigo accent, gold cover bar, light-gray callouts,
monospace code shading) using OOXML primitives.

Run:
    python scripts/html-to-docx-rtl.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

from lxml import html as lxml_html
from docx import Document
from docx.shared import Pt, Mm, RGBColor, Inches
from docx.enum.table import WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn, nsmap

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "docs" / "infrastructure-document.html"
OUT = ROOT / "docs" / "infrastructure-document.docx"

# ---- design tokens (mirror the HTML CSS variables) ----
ACCENT = "4338CA"
GOLD = "C9A84C"
MUTED = "475569"
INK = "0F172A"
PANEL = "F8FAFC"
LINE = "E2E8F0"
CODE_FG = "4338CA"
CODE_BG = "EEF2FF"

ARABIC_FONT = "Tahoma"
LATIN_FONT = "Tahoma"
MONO_FONT = "Consolas"

BODY_SIZE = 11
SMALL_SIZE = 9
H1_SIZE = 26
H2_SIZE = 16
H3_SIZE = 13
EYEBROW_SIZE = 9
SUBTITLE_SIZE = 12
CODE_SIZE = 10


# ============================================================================
# OOXML helpers
# ============================================================================
def w(tag: str) -> OxmlElement:
    return OxmlElement(f"w:{tag}")


def set_attr(elem, name: str, value: str) -> None:
    elem.set(qn(f"w:{name}"), value)


def make_shd(fill: str):
    s = w("shd")
    set_attr(s, "val", "clear")
    set_attr(s, "color", "auto")
    set_attr(s, "fill", fill)
    return s


def make_border(side: str, *, size: int = 4, color: str = LINE, style: str = "single"):
    """size is eighths of a point (4 = 0.5pt, 24 = 3pt)."""
    b = w(side)
    set_attr(b, "val", style)
    set_attr(b, "sz", str(size))
    set_attr(b, "space", "0")
    set_attr(b, "color", color)
    return b


def make_run(
    text: str,
    *,
    bold: bool = False,
    italic: bool = False,
    code: bool = False,
    color: str | None = None,
    size_pt: float | None = None,
    bg: str | None = None,
    letter_spacing: int | None = None,
    caps: bool = False,
):
    """Build a <w:r> element from scratch in schema-correct order."""
    r = w("r")
    rPr = w("rPr")

    rFonts = w("rFonts")
    if code:
        for k in ("ascii", "hAnsi", "cs"):
            set_attr(rFonts, k, MONO_FONT)
    else:
        set_attr(rFonts, "ascii", LATIN_FONT)
        set_attr(rFonts, "hAnsi", LATIN_FONT)
        set_attr(rFonts, "cs", ARABIC_FONT)
    rPr.append(rFonts)

    if bold:
        rPr.append(w("b"))
        rPr.append(w("bCs"))
    if italic:
        rPr.append(w("i"))
        rPr.append(w("iCs"))
    if caps:
        rPr.append(w("caps"))

    eff_color = color
    if code and eff_color is None:
        eff_color = CODE_FG
    if eff_color:
        c = w("color")
        set_attr(c, "val", eff_color)
        rPr.append(c)

    if letter_spacing is not None:
        sp = w("spacing")
        set_attr(sp, "val", str(letter_spacing))
        rPr.append(sp)

    if size_pt is None and code:
        size_pt = CODE_SIZE
    if size_pt is not None:
        half = str(int(round(size_pt * 2)))
        sz = w("sz")
        set_attr(sz, "val", half)
        rPr.append(sz)
        szCs = w("szCs")
        set_attr(szCs, "val", half)
        rPr.append(szCs)

    eff_bg = bg
    if code and eff_bg is None:
        eff_bg = CODE_BG
    if eff_bg:
        rPr.append(make_shd(eff_bg))

    r.append(rPr)

    t = w("t")
    t.text = text
    t.set(qn("xml:space"), "preserve")
    r.append(t)
    return r


def set_p_bidi(paragraph) -> None:
    pPr = paragraph._p.get_or_add_pPr()
    if pPr.find(qn("w:bidi")) is None:
        pPr.append(w("bidi"))


def set_p_alignment_right(paragraph) -> None:
    pPr = paragraph._p.get_or_add_pPr()
    jc = pPr.find(qn("w:jc"))
    if jc is None:
        jc = w("jc")
        pPr.append(jc)
    set_attr(jc, "val", "right")


def set_p_alignment_left(paragraph) -> None:
    pPr = paragraph._p.get_or_add_pPr()
    jc = pPr.find(qn("w:jc"))
    if jc is None:
        jc = w("jc")
        pPr.append(jc)
    set_attr(jc, "val", "left")


def set_p_shading(paragraph, fill: str) -> None:
    pPr = paragraph._p.get_or_add_pPr()
    for existing in pPr.findall(qn("w:shd")):
        pPr.remove(existing)
    pPr.append(make_shd(fill))


def set_p_borders(paragraph, sides: dict) -> None:
    pPr = paragraph._p.get_or_add_pPr()
    pBdr = pPr.find(qn("w:pBdr"))
    if pBdr is None:
        pBdr = w("pBdr")
        pPr.append(pBdr)
    for side, opts in sides.items():
        # opts: dict with size/color/style
        b = make_border(side, **opts)
        existing = pBdr.find(qn(f"w:{side}"))
        if existing is not None:
            pBdr.remove(existing)
        pBdr.append(b)


def set_p_spacing(paragraph, *, before: float | None = None, after: float | None = None, line: float | None = None) -> None:
    pPr = paragraph._p.get_or_add_pPr()
    spacing = pPr.find(qn("w:spacing"))
    if spacing is None:
        spacing = w("spacing")
        pPr.append(spacing)
    if before is not None:
        set_attr(spacing, "before", str(int(before * 20)))  # twips
    if after is not None:
        set_attr(spacing, "after", str(int(after * 20)))
    if line is not None:
        set_attr(spacing, "line", str(int(line * 240)))  # multiples of single-spacing
        set_attr(spacing, "lineRule", "auto")


def set_p_indent(paragraph, *, left_mm: float | None = None, right_mm: float | None = None) -> None:
    pPr = paragraph._p.get_or_add_pPr()
    ind = pPr.find(qn("w:ind"))
    if ind is None:
        ind = w("ind")
        pPr.append(ind)
    twips_per_mm = 56.7
    if left_mm is not None:
        set_attr(ind, "left", str(int(left_mm * twips_per_mm)))
    if right_mm is not None:
        set_attr(ind, "right", str(int(right_mm * twips_per_mm)))


def add_empty_paragraph(doc, *, size_pt: float = 4):
    p = doc.add_paragraph()
    set_p_bidi(p)
    set_p_spacing(p, before=0, after=0, line=1.0)
    # Add an invisible run with the requested size to control vertical space.
    p._p.append(make_run("", size_pt=size_pt))
    return p


# ============================================================================
# Inline rendering: walk lxml children, emit runs
# ============================================================================
def render_inline(paragraph, elem, *, bold=False, italic=False, code=False, color=None, size_pt=None):
    """Render the text content of `elem` into `paragraph` as Word runs."""
    if elem.text:
        paragraph._p.append(make_run(
            elem.text, bold=bold, italic=italic, code=code, color=color, size_pt=size_pt,
        ))
    for child in elem:
        tag = (child.tag or "").lower()
        if tag in ("b", "strong"):
            render_inline(paragraph, child, bold=True, italic=italic, code=code, color=color, size_pt=size_pt)
        elif tag in ("i", "em"):
            render_inline(paragraph, child, bold=bold, italic=True, code=code, color=color, size_pt=size_pt)
        elif tag == "code":
            render_inline(paragraph, child, bold=bold, italic=italic, code=True, color=color, size_pt=size_pt)
        elif tag == "br":
            r = w("r")
            r.append(w("br"))
            paragraph._p.append(r)
        elif tag == "span":
            render_inline(paragraph, child, bold=bold, italic=italic, code=code, color=color, size_pt=size_pt)
        else:
            # Generic fallback: render children
            render_inline(paragraph, child, bold=bold, italic=italic, code=code, color=color, size_pt=size_pt)
        if child.tail:
            paragraph._p.append(make_run(
                child.tail, bold=bold, italic=italic, code=code, color=color, size_pt=size_pt,
            ))


# ============================================================================
# Document setup
# ============================================================================
def setup_document(doc) -> None:
    # Page: A4, comfortable margins (mirrors the HTML cover page)
    section = doc.sections[0]
    section.page_width = Mm(210)
    section.page_height = Mm(297)
    section.top_margin = Mm(18)
    section.bottom_margin = Mm(20)
    section.left_margin = Mm(18)
    section.right_margin = Mm(18)

    # Section-level RTL so headers/footers/columns flow right-to-left
    sectPr = section._sectPr
    if sectPr.find(qn("w:bidi")) is None:
        sectPr.append(w("bidi"))

    # Normal style → Tahoma 11pt
    normal = doc.styles["Normal"]
    rPr = normal.element.get_or_add_rPr()
    # remove default rFonts then re-add
    for rf in rPr.findall(qn("w:rFonts")):
        rPr.remove(rf)
    rFonts = w("rFonts")
    set_attr(rFonts, "ascii", LATIN_FONT)
    set_attr(rFonts, "hAnsi", LATIN_FONT)
    set_attr(rFonts, "cs", ARABIC_FONT)
    rPr.insert(0, rFonts)
    for sz in rPr.findall(qn("w:sz")) + rPr.findall(qn("w:szCs")):
        rPr.remove(sz)
    sz = w("sz")
    set_attr(sz, "val", str(BODY_SIZE * 2))
    rPr.append(sz)
    szCs = w("szCs")
    set_attr(szCs, "val", str(BODY_SIZE * 2))
    rPr.append(szCs)

    # docDefaults RTL — every new paragraph inherits bidi
    styles_el = doc.styles.element
    docDefaults = styles_el.find(qn("w:docDefaults"))
    if docDefaults is not None:
        pPrDefault = docDefaults.find(qn("w:pPrDefault"))
        if pPrDefault is None:
            pPrDefault = w("pPrDefault")
            docDefaults.append(pPrDefault)
        pPr = pPrDefault.find(qn("w:pPr"))
        if pPr is None:
            pPr = w("pPr")
            pPrDefault.append(pPr)
        if pPr.find(qn("w:bidi")) is None:
            pPr.append(w("bidi"))


# ============================================================================
# Cover
# ============================================================================
def render_cover(doc, cover) -> None:
    eyebrow = (cover.find("./div[@class='eyebrow']").text or "").strip()
    title = (cover.find("./h1").text or "").strip()
    subtitle = (cover.find("./div[@class='subtitle']").text or "").strip()

    # Top accent rule — a paragraph with a thick gold top border
    rule = doc.add_paragraph()
    set_p_bidi(rule)
    set_p_spacing(rule, before=0, after=2, line=1.0)
    set_p_borders(rule, {"top": dict(size=36, color=ACCENT, style="single")})

    # Eyebrow
    p_eye = doc.add_paragraph()
    set_p_bidi(p_eye)
    set_p_spacing(p_eye, before=12, after=4, line=1.2)
    p_eye._p.append(make_run(
        eyebrow, bold=True, color=GOLD, size_pt=EYEBROW_SIZE,
        letter_spacing=40, caps=False,
    ))

    # H1 title
    p_h1 = doc.add_paragraph()
    set_p_bidi(p_h1)
    set_p_spacing(p_h1, before=0, after=6, line=1.2)
    p_h1._p.append(make_run(title, bold=True, color=INK, size_pt=H1_SIZE))

    # Subtitle
    if subtitle:
        p_sub = doc.add_paragraph()
        set_p_bidi(p_sub)
        set_p_spacing(p_sub, before=0, after=12, line=1.35)
        p_sub._p.append(make_run(subtitle, color=MUTED, size_pt=SUBTITLE_SIZE))

    # Bottom rule under cover header
    rule2 = doc.add_paragraph()
    set_p_bidi(rule2)
    set_p_spacing(rule2, before=0, after=12, line=1.0)
    set_p_borders(rule2, {"top": dict(size=4, color=LINE)})

    # Metadata grid: 2x2 borderless table on a light panel, gold right-side bar
    meta_items = []
    for div in cover.xpath("./div[@class='meta-grid']/div"):
        label = (div.find("./div[@class='label']").text or "").strip()
        value = (div.find("./div[@class='value']").text or "").strip()
        meta_items.append((label, value))

    if meta_items:
        # Force 2 columns; arrange into rows
        rows = [meta_items[i:i + 2] for i in range(0, len(meta_items), 2)]
        table = doc.add_table(rows=len(rows), cols=2)
        _apply_borderless_table_styling(table, fill=PANEL, right_bar=GOLD)
        for r_idx, row_items in enumerate(rows):
            for c_idx, (label, value) in enumerate(row_items):
                cell = table.cell(r_idx, c_idx)
                _fill_meta_cell(cell, label, value, fill=PANEL,
                                first_in_row=(c_idx == 0))

    # Spacer
    add_empty_paragraph(doc, size_pt=8)


def _apply_borderless_table_styling(table, *, fill: str, right_bar: str) -> None:
    tbl = table._tbl
    # Width: 100%
    tblPr = tbl.find(qn("w:tblPr"))
    if tblPr is None:
        tblPr = w("tblPr")
        tbl.insert(0, tblPr)
    # bidiVisual (RTL columns)
    if tblPr.find(qn("w:bidiVisual")) is None:
        tblPr.append(w("bidiVisual"))
    # 100% width
    tblW = tblPr.find(qn("w:tblW"))
    if tblW is None:
        tblW = w("tblW")
        tblPr.append(tblW)
    set_attr(tblW, "type", "pct")
    set_attr(tblW, "w", "5000")
    # Remove all borders
    existing = tblPr.find(qn("w:tblBorders"))
    if existing is not None:
        tblPr.remove(existing)
    tblBorders = w("tblBorders")
    for side in ("top", "left", "bottom", "right", "insideH", "insideV"):
        b = w(side)
        set_attr(b, "val", "nil")
        tblBorders.append(b)
    tblPr.append(tblBorders)


def _fill_meta_cell(cell, label: str, value: str, *, fill: str, first_in_row: bool):
    # Shade
    tcPr = cell._tc.get_or_add_tcPr()
    for shd in tcPr.findall(qn("w:shd")):
        tcPr.remove(shd)
    tcPr.append(make_shd(fill))

    # Cell margins
    tcMar = w("tcMar")
    for side, val in (("top", 80), ("bottom", 80), ("left", 140), ("right", 140)):
        e = w(side)
        set_attr(e, "w", str(val))
        set_attr(e, "type", "dxa")
        tcMar.append(e)
    tcPr.append(tcMar)

    # Add gold accent border on the "starting" edge of the row (right in RTL).
    if first_in_row:
        tcBorders = w("tcBorders")
        b = make_border("right", size=36, color=GOLD, style="single")
        tcBorders.append(b)
        tcPr.append(tcBorders)

    # Clear default first paragraph
    cell._tc.remove(cell.paragraphs[0]._p)

    # Label
    p_label = cell.add_paragraph()
    set_p_bidi(p_label)
    set_p_spacing(p_label, before=0, after=2, line=1.15)
    p_label._p.append(make_run(label, color=MUTED, size_pt=8, letter_spacing=20))

    # Value
    p_value = cell.add_paragraph()
    set_p_bidi(p_value)
    set_p_spacing(p_value, before=0, after=0, line=1.2)
    p_value._p.append(make_run(value, bold=True, color=INK, size_pt=BODY_SIZE))


# ============================================================================
# Headings
# ============================================================================
# Strip manual numbering like "2. ", "11. ", or "5.أ. " from the start of a
# heading. The HTML hard-codes the section number; in Word that ends up looking
# wrong in RTL because the LTR digit cluster bidi-resolves to the visual end of
# the line. Drop the prefix — the heading text alone reads cleanly.
HEADING_NUM_PREFIX = re.compile(r"^[\d\.ء-ي]+\.\s+")


def render_h2(doc, h2_elem) -> None:
    text = "".join(h2_elem.itertext()).strip()
    text = HEADING_NUM_PREFIX.sub("", text)
    p = doc.add_paragraph()
    set_p_bidi(p)
    set_p_spacing(p, before=18, after=8, line=1.25)
    set_p_borders(p, {"bottom": dict(size=18, color=ACCENT, style="single")})
    p._p.append(make_run(text, bold=True, color=INK, size_pt=H2_SIZE))
    # keep with next
    pPr = p._p.get_or_add_pPr()
    pPr.append(w("keepNext"))


def render_h3(doc, h3_elem) -> None:
    text = "".join(h3_elem.itertext()).strip()
    p = doc.add_paragraph()
    set_p_bidi(p)
    set_p_spacing(p, before=12, after=4, line=1.25)
    p._p.append(make_run(text, bold=True, color=ACCENT, size_pt=H3_SIZE))
    pPr = p._p.get_or_add_pPr()
    pPr.append(w("keepNext"))


# ============================================================================
# Paragraphs, lists, notes
# ============================================================================
def render_paragraph(doc, p_elem) -> None:
    p = doc.add_paragraph()
    set_p_bidi(p)
    set_p_spacing(p, before=0, after=6, line=1.45)
    render_inline(p, p_elem)


def render_list(doc, ul_elem, *, level: int = 0) -> None:
    # Use Word's native bullet styles; bullets are added by Word and flip to
    # the right edge automatically when the paragraph is bidi.
    style_name = "List Bullet" if level == 0 else "List Bullet 2"
    for li in ul_elem.findall("./li"):
        p = doc.add_paragraph(style=style_name)
        set_p_bidi(p)
        set_p_spacing(p, before=0, after=4, line=1.45)
        render_li_inline(p, li)
        for nested in li.findall("./ul"):
            render_list(doc, nested, level=level + 1)


def render_li_inline(paragraph, li) -> None:
    """Like render_inline, but ignore nested <ul>/<ol> children of li (they
    become separate paragraphs at a deeper indent)."""
    if li.text:
        paragraph._p.append(make_run(li.text))
    for child in li:
        tag = (child.tag or "").lower()
        if tag in ("ul", "ol"):
            # tail still belongs after this child — preserve it as text after.
            if child.tail:
                # Will be picked up after nested list — but since we render
                # nested list separately and the tail is rare/empty here,
                # render it back into this paragraph as text.
                paragraph._p.append(make_run(child.tail))
            continue
        if tag in ("b", "strong"):
            render_inline(paragraph, child, bold=True)
        elif tag in ("i", "em"):
            render_inline(paragraph, child, italic=True)
        elif tag == "code":
            render_inline(paragraph, child, code=True)
        elif tag == "br":
            r = w("r")
            r.append(w("br"))
            paragraph._p.append(r)
        else:
            render_inline(paragraph, child)
        if child.tail and tag not in ("ul", "ol"):
            paragraph._p.append(make_run(child.tail))


def render_note(doc, div_elem) -> None:
    text_runs = list(div_elem.iter())
    # Collect raw text
    p = doc.add_paragraph()
    set_p_bidi(p)
    set_p_spacing(p, before=8, after=10, line=1.45)
    set_p_shading(p, PANEL)
    set_p_borders(p, {"right": dict(size=24, color=ACCENT, style="single")})
    set_p_indent(p, left_mm=4, right_mm=4)
    # Add a thin border on the other 3 sides for a card feel
    pPr = p._p.get_or_add_pPr()
    pBdr = pPr.find(qn("w:pBdr"))
    for side in ("top", "bottom", "left"):
        if pBdr.find(qn(f"w:{side}")) is None:
            pBdr.append(make_border(side, size=2, color=LINE))
    render_inline(p, div_elem, color=INK)


# ============================================================================
# Tables
# ============================================================================
def render_table(doc, table_elem) -> None:
    # Collect headers + rows
    thead = table_elem.find("./thead")
    tbody = table_elem.find("./tbody")

    headers = []
    if thead is not None:
        first_tr = thead.find("./tr")
        if first_tr is not None:
            for th in first_tr.findall("./th"):
                headers.append(th)

    body_rows = []
    if tbody is not None:
        for tr in tbody.findall("./tr"):
            cells = tr.findall("./td")
            body_rows.append(cells)

    if not headers and not body_rows:
        return

    n_cols = max(len(headers), max((len(r) for r in body_rows), default=0))
    n_rows = (1 if headers else 0) + len(body_rows)
    table = doc.add_table(rows=n_rows, cols=n_cols)

    _apply_table_styling(table)

    row_offset = 0
    if headers:
        for c_idx, th in enumerate(headers):
            cell = table.cell(0, c_idx)
            _shade_cell(cell, PANEL)
            _bottom_border_cell(cell, size=12, color=LINE)
            _cell_margins(cell)
            _fill_cell(cell, th, header=True)
        row_offset = 1

    for r_idx, tds in enumerate(body_rows):
        for c_idx, td in enumerate(tds):
            cell = table.cell(r_idx + row_offset, c_idx)
            _bottom_border_cell(cell, size=4, color=LINE)
            _cell_margins(cell)
            _fill_cell(cell, td, header=False)


def _apply_table_styling(table) -> None:
    tbl = table._tbl
    tblPr = tbl.find(qn("w:tblPr"))
    if tblPr is None:
        tblPr = w("tblPr")
        tbl.insert(0, tblPr)
    if tblPr.find(qn("w:bidiVisual")) is None:
        tblPr.append(w("bidiVisual"))
    # 100% width
    tblW = tblPr.find(qn("w:tblW"))
    if tblW is None:
        tblW = w("tblW")
        tblPr.append(tblW)
    set_attr(tblW, "type", "pct")
    set_attr(tblW, "w", "5000")
    # Default cell margins via tblCellMar
    tblCellMar = w("tblCellMar")
    for side, val in (("top", 60), ("bottom", 60), ("left", 100), ("right", 100)):
        e = w(side)
        set_attr(e, "w", str(val))
        set_attr(e, "type", "dxa")
        tblCellMar.append(e)
    existing_mar = tblPr.find(qn("w:tblCellMar"))
    if existing_mar is not None:
        tblPr.remove(existing_mar)
    tblPr.append(tblCellMar)
    # No outer borders — only bottom borders per cell (HTML uses border-bottom)
    existing = tblPr.find(qn("w:tblBorders"))
    if existing is not None:
        tblPr.remove(existing)
    tblBorders = w("tblBorders")
    for side in ("top", "left", "bottom", "right", "insideH", "insideV"):
        b = w(side)
        set_attr(b, "val", "nil")
        tblBorders.append(b)
    tblPr.append(tblBorders)


def _shade_cell(cell, fill: str) -> None:
    tcPr = cell._tc.get_or_add_tcPr()
    for shd in tcPr.findall(qn("w:shd")):
        tcPr.remove(shd)
    tcPr.append(make_shd(fill))


def _bottom_border_cell(cell, *, size: int, color: str) -> None:
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = tcPr.find(qn("w:tcBorders"))
    if tcBorders is None:
        tcBorders = w("tcBorders")
        tcPr.append(tcBorders)
    existing = tcBorders.find(qn("w:bottom"))
    if existing is not None:
        tcBorders.remove(existing)
    tcBorders.append(make_border("bottom", size=size, color=color))


def _cell_margins(cell) -> None:
    tcPr = cell._tc.get_or_add_tcPr()
    existing = tcPr.find(qn("w:tcMar"))
    if existing is not None:
        return  # already set
    tcMar = w("tcMar")
    for side, val in (("top", 80), ("bottom", 80), ("left", 120), ("right", 120)):
        e = w(side)
        set_attr(e, "w", str(val))
        set_attr(e, "type", "dxa")
        tcMar.append(e)
    tcPr.append(tcMar)


def _fill_cell(cell, td_or_th, *, header: bool) -> None:
    # Remove default paragraph
    cell._tc.remove(cell.paragraphs[0]._p)

    p = cell.add_paragraph()
    set_p_bidi(p)
    set_p_spacing(p, before=0, after=0, line=1.35)

    cls = (td_or_th.get("class") or "").lower()
    if "path" in cls:
        # LTR monospace cell (file paths, code-style cells)
        # remove bidi for visual LTR text alignment
        pPr = p._p.get_or_add_pPr()
        b = pPr.find(qn("w:bidi"))
        if b is not None:
            pPr.remove(b)
        set_p_alignment_left(p)
        render_inline(p, td_or_th, code=True, size_pt=CODE_SIZE)
        return

    if header:
        render_inline(p, td_or_th, bold=True, color=MUTED, size_pt=SMALL_SIZE)
    else:
        render_inline(p, td_or_th)


# ============================================================================
# Images
# ============================================================================
def render_image(doc, img_elem, base_dir: Path) -> None:
    src = img_elem.get("src", "")
    if not src:
        return
    img_path = (base_dir / src).resolve()
    if not img_path.exists():
        print(f"  warning: image not found: {img_path}", file=sys.stderr)
        return
    # Center the image and constrain to printable width (A4 minus margins ≈ 174mm)
    p = doc.add_paragraph()
    set_p_bidi(p)
    pPr = p._p.get_or_add_pPr()
    jc = w("jc")
    set_attr(jc, "val", "center")
    pPr.append(jc)
    set_p_spacing(p, before=6, after=10, line=1.0)
    run = p.add_run()
    run.add_picture(str(img_path), width=Mm(168))


# ============================================================================
# Footer
# ============================================================================
def render_footer_block(doc, footer_elem) -> None:
    children = list(footer_elem.findall("./div"))
    if len(children) < 1:
        return
    left = (children[0].text or "").strip() if len(children) > 0 else ""
    right = (children[1].text or "").strip() if len(children) > 1 else ""

    # Top rule
    rule = doc.add_paragraph()
    set_p_bidi(rule)
    set_p_spacing(rule, before=16, after=6, line=1.0)
    set_p_borders(rule, {"top": dict(size=6, color=LINE)})

    # A two-column borderless table to mimic justify-between
    tbl = doc.add_table(rows=1, cols=2)
    _apply_borderless_table_styling(tbl, fill="FFFFFF", right_bar="FFFFFF")
    # left cell -> in RTL visual order this is the right cell (start)
    for c_idx, txt in enumerate((left, right)):
        cell = tbl.cell(0, c_idx)
        cell._tc.remove(cell.paragraphs[0]._p)
        p = cell.add_paragraph()
        set_p_bidi(p)
        set_p_spacing(p, before=0, after=0, line=1.2)
        if c_idx == 1:
            set_p_alignment_left(p)
        p._p.append(make_run(txt, color=MUTED, size_pt=SMALL_SIZE))


# ============================================================================
# Main walker
# ============================================================================
def walk_section(doc, section_elem, base_dir: Path) -> None:
    for child in section_elem:
        tag = (child.tag or "").lower()
        if tag == "h2":
            render_h2(doc, child)
        elif tag == "h3":
            render_h3(doc, child)
        elif tag == "p":
            render_paragraph(doc, child)
        elif tag == "ul":
            render_list(doc, child)
        elif tag == "table":
            render_table(doc, child)
            add_empty_paragraph(doc, size_pt=4)
        elif tag == "div":
            cls = (child.get("class") or "").lower()
            if "note" in cls:
                render_note(doc, child)
            else:
                # Generic div: look inside for an img
                img = child.find(".//img")
                if img is not None:
                    render_image(doc, img, base_dir)
                else:
                    # fallthrough: walk children
                    walk_section(doc, child, base_dir)
        elif tag == "img":
            render_image(doc, child, base_dir)


def build(src_html: Path, dst_docx: Path) -> None:
    raw = src_html.read_text(encoding="utf-8")
    root = lxml_html.fromstring(raw)
    base_dir = src_html.parent

    doc = Document()
    setup_document(doc)

    page = root.xpath("//div[@class='page']")
    if not page:
        sys.exit("Could not find <div class='page'> in HTML.")
    page = page[0]

    for section in page.xpath("./section | ./footer"):
        tag = (section.tag or "").lower()
        cls = (section.get("class") or "").lower()
        if tag == "section" and "cover" in cls:
            render_cover(doc, section)
            continue
        if tag == "footer":
            render_footer_block(doc, section)
            continue
        walk_section(doc, section, base_dir)
        add_empty_paragraph(doc, size_pt=4)

    doc.save(dst_docx)


def main() -> None:
    if not SRC.exists():
        sys.exit(f"Source HTML not found: {SRC}")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    build(SRC, OUT)
    print(f"DOCX written: {OUT} ({OUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
