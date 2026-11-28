"""Build the Lab 7 PDF (Parts A–D) from docs/ and evidence/ — the committed files are the single source.

Usage (repo root):  STUDENT_IDS="<id A>,<id B>" python submission/lab7/build_pdf.py
Reuses the D1 renderer (Chrome headless + pypdf). Output: submission/lab7/Lab7-CHG01.pdf (gitignored; it holds IDs).
Directives inside part-*.md (include / code / gitdiff) are expanded by submission/directives.py.
"""
import html
import importlib.util
import json
import os
import sys
import urllib.request
from pathlib import Path

from pypdf import PdfWriter

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from directives import expand, git  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
HERE = ROOT / 'submission' / 'lab7'
_spec = importlib.util.spec_from_file_location('d1', ROOT / 'submission/d1/build_pdf.py')
d1 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(d1)
d1.OUT = OUT = HERE / 'build'

DEPLOY_URL = 'https://s87ce2df5-4d7hbszvwq-as.a.run.app'
RELEASE_TAG = 'v0.2.0-sprint2'  # the reviewed main release that carries CHG-01
PARTS = [
    ('A', 'Change impact and updated contract', 'part-a.md', 'CHG-01, #72, #73, FR-28, BR-18, AC-F05-09..16'),
    ('B', 'Implementation and regression-safe delivery', 'part-b.md', 'f8a9b70 red, 1660d08 green, #74, #77, PD-01..11'),
    ('C', 'Objective engineering metrics', 'part-c.md', 'M-1..M-5'),
    ('D', 'Release readiness and retrospective', 'part-d.md', 'D.1–D.4, retrospective, contributions, AI use'),
]


def part_body(letter, title, file):
    text = expand((HERE / file).read_text(encoding='utf-8'))
    safe = text.replace('</script', '<\\/script')
    return f'<h1 class="part">Part {letter} — {html.escape(title)}</h1>\n<script type="text/markdown">{safe}</script>'


def deployed_version():
    try:
        with urllib.request.urlopen(f'{DEPLOY_URL}/api/health', timeout=15) as r:
            return json.load(r).get('version', 'unknown')[:7]
    except OSError as e:
        return f'unreachable at build time ({e.__class__.__name__})'


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    ids = (os.environ.get('STUDENT_IDS', '').split(',') + ['', ''])[:2]
    team = [(n, ids[i].strip() or '(set STUDENT_IDS)', gh) for i, (n, _, gh) in enumerate(d1.TEAM)]
    parts = [(l, t, ev, part_body(l, t, f)) for l, t, f, ev in PARTS]
    counts = [d1.pages(d1.print_pdf(d1.PAGE.format(title=f'Part {l}', body=b), f'part-{l}')) for l, _, _, b in parts]
    tag = git('rev-list', '-n', '1', RELEASE_TAG).strip()[:7] or 'not tagged'
    rows_team = ''.join(f'<tr><td>{html.escape(n)}</td><td>{sid}</td><td><code>{gh}</code></td></tr>' for n, sid, gh in team)

    def cover(first):
        rows, page = [], first
        for (l, t, ev, _), n in zip(parts, counts):
            rows.append(f'<tr><td>Part {l}</td><td>{html.escape(t)}</td><td>{page}–{page + n - 1}</td><td>{html.escape(ev)}</td></tr>')
            page += n
        return f"""<h1>CPE334 Lab 7 — Software maintenance metrics and release readiness</h1>
<p><b>Theme 7:</b> Personal Money and Expense Logging System (Money Logger) · Team 59, section 131 · Semester 1/2026</p>
<table><tr><th>Student</th><th>ID</th><th>GitHub</th></tr>{rows_team}</table>
<table>
<tr><th>Item</th><th>Value</th></tr>
<tr><td>Approved change</td><td>CHG-01 optional credit limit on credit cards (LOAN_TAKEN) — Issue #72</td></tr>
<tr><td>Accepted Sprint 1 baseline</td><td><code>v0.1.0-sprint1</code> → <code>e1747cb</code> (deployed as <code>0831d0b</code>, same application code)</td></tr>
<tr><td>Pre-change commit</td><td><code>7832344</code> (staging/sprint-2 with the approved contract; red tests <code>f8a9b70</code> on top)</td></tr>
<tr><td>Submitted main release</td><td><code>{RELEASE_TAG}</code> → <code>{tag}</code></td></tr>
<tr><td>Repository</td><td>https://github.com/Sxr1n/cpe334-money-logger</td></tr>
<tr><td>Deployed URL / version</td><td>{DEPLOY_URL} — <code>{html.escape(deployed_version())}</code> at build time</td></tr>
</table>
<h2>Contents</h2>
<table><tr><th>Part</th><th>Title</th><th>Pages</th><th>Evidence IDs</th></tr>{''.join(rows)}</table>"""

    cover_pages = d1.pages(d1.print_pdf(d1.PAGE.format(title='cover', body=cover(2)), 'cover'))
    cover_pdf = d1.print_pdf(d1.PAGE.format(title='cover', body=cover(1 + cover_pages)), 'cover')
    writer = PdfWriter()
    for pdf in [cover_pdf, *[OUT / f'part-{l}.pdf' for l, *_ in parts]]:
        writer.append(str(pdf))
    target = HERE / 'Lab7-CHG01.pdf'
    with open(target, 'wb') as fh:
        writer.write(fh)
    print(f'{target} ({d1.pages(target)} pages = cover {cover_pages} + parts {counts})')


if __name__ == '__main__':
    main()
