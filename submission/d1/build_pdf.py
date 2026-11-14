"""Build the Deliverable 1 PDF from the engineering documents in docs/ (single source of truth).

Usage (repo root):  python submission/d1/build_pdf.py [release-tag]
Needs: Google Chrome (headless print) and `pip install pypdf`. Output: submission/d1/D1-<tag>.pdf
Markdown and mermaid are rendered by Chrome from cdnjs, so the machine needs internet access.
"""
import html
import os
import re
import subprocess
import sys
from pathlib import Path

from pypdf import PdfWriter

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'submission' / 'd1' / 'build'
CHROME = os.environ.get('CHROME', r'C:\Program Files\Google\Chrome\Application\chrome.exe')
TAG = sys.argv[1] if len(sys.argv) > 1 else 'v0.1.0-sprint1'

TEAM = [
    ('นายศารินทร์ ไชยารัตน์', '67070505207', 'Sxr1n'),
    ('นายตันติยวัตร จันทร์ศิริ', '67070505216', 'Leviathan-c137'),
]
CONTRACTS = sorted((ROOT / 'docs/sprints/sprint-1').glob('F0*.md'))
PARTS = [
    ('A', 'SRS and product scope', ['docs/srs.md'], 'FR-01–FR-27, BR-01–BR-17, NFR-01–NFR-11, D-01–D-09'),
    ('B', 'Feature inventory and traceability', ['docs/features.md', 'docs/traceability.md'], 'F-01–F-16, SR-01–SR-04'),
    ('C', 'System-Level SDS', ['docs/system-sds.md'], 'SD-01–SD-06, permission matrix'),
    ('D', 'Three-sprint plan', ['docs/sprints/plan.md'], 'Sprint 1–3 goals, F-IDs'),
    ('E', 'Sprint 1 engineering contracts and DoD', [p.relative_to(ROOT).as_posix() for p in CONTRACTS] + ['docs/dod.md'], 'F-01–F-06, AC-F01-01–AC-F06-07, TEST-F01-01–TEST-F06-07'),
    ('F', 'Working Sprint 1 and verification', ['submission/d1/part-f.md'], 'demos, test results, Issues/PRs, contributions'),
]

PAGE = """<!doctype html><html><head><meta charset="utf-8"><title>{title}</title>
<style>
 @page {{ size: A4; margin: 16mm 14mm; }}
 body {{ font: 10.5pt/1.45 "Segoe UI", "Leelawadee UI", Tahoma, sans-serif; color: #111; }}
 h1 {{ font-size: 17pt; border-bottom: 2px solid #333; padding-bottom: 4px; }}
 h1.part {{ page-break-before: always; }} h1.part:first-child {{ page-break-before: avoid; }}
 h2 {{ font-size: 13.5pt; margin-top: 18px; }} h3 {{ font-size: 11.5pt; }}
 table {{ border-collapse: collapse; width: 100%; margin: 8px 0; font-size: 9pt; page-break-inside: auto; }}
 th, td {{ border: 1px solid #999; padding: 3px 5px; vertical-align: top; text-align: left; }}
 th {{ background: #eee; }} tr {{ page-break-inside: avoid; }}
 code {{ font: 9pt Consolas, monospace; background: #f3f3f3; padding: 0 2px; }}
 pre {{ background: #f6f6f6; padding: 8px; white-space: pre-wrap; font-size: 8.5pt; }}
 .doc {{ margin-bottom: 18px; }} .src {{ color: #666; font-size: 8.5pt; }}
 .mermaid {{ text-align: center; page-break-inside: avoid; }}
 .mermaid svg {{ max-height: 245mm; max-width: 100%; }}
 img {{ max-width: 100%; page-break-inside: avoid; }}
</style></head><body>{body}
<script src="https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.2/marked.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/mermaid/10.9.1/mermaid.min.js"></script>
<script>
 for (const el of document.querySelectorAll('script[type="text/markdown"]')) {{
   const div = document.createElement('div'); div.className = 'doc';
   div.innerHTML = marked.parse(el.textContent); el.replaceWith(div);
 }}
 for (const code of document.querySelectorAll('pre code.language-mermaid')) {{
   const d = document.createElement('div'); d.className = 'mermaid'; d.textContent = code.textContent;
   code.parentElement.replaceWith(d);
 }}
 mermaid.initialize({{ startOnLoad: false, theme: 'neutral' }});
 mermaid.run();
</script></body></html>"""


def git(*args):
    return subprocess.run(['git', *args], cwd=ROOT, capture_output=True, text=True).stdout.strip()


def print_pdf(html_text, name):
    src, pdf = OUT / f'{name}.html', OUT / f'{name}.pdf'
    src.write_text(html_text, encoding='utf-8')
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--virtual-time-budget=20000',
                    f'--print-to-pdf={pdf}', src.as_uri()], check=True, capture_output=True)
    return pdf


def pages(pdf):
    # Chrome writes one /Type /Page object per page (checked against pdfinfo); avoids poppler, which
    # Windows Smart App Control blocks on one developer machine.
    return len(re.findall(rb'/Type\s*/Page(?![a-zA-Z])', pdf.read_bytes()))


def part_body(letter, title, files):
    body = [f'<h1 class="part">Part {letter} — {html.escape(title)}</h1>']
    for f in files:
        path = ROOT / f
        text = path.read_text(encoding='utf-8') if path.exists() else f'*Missing: `{f}` — not yet written.*'
        body.append(f'<p class="src">Source: <code>{html.escape(f)}</code></p>')
        safe = text.replace('</script', '<\\/script')  # keep the embedded Markdown inside its <script> block
        body.append(f'<script type="text/markdown">{safe}</script>')
    return '\n'.join(body)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    parts = [(letter, title, ids, part_body(letter, title, files)) for letter, title, files, ids in PARTS]
    # Each part starts on a new page, so its page count printed alone equals its count in the full document.
    counts = [pages(print_pdf(PAGE.format(title=f'Part {l}', body=b), f'part-{l}')) for l, _, _, b in parts]

    tag_commit = git('rev-list', '-n', '1', TAG) or None
    release = f'{TAG} — commit {tag_commit[:7]}' if tag_commit else f'{TAG} — tag not created yet (staging {git("rev-parse", "--short", "origin/staging/sprint-1")})'
    team = ''.join(f'<tr><td>{html.escape(n)}</td><td>{sid}</td><td><code>{gh}</code></td></tr>' for n, sid, gh in TEAM)

    def cover(first_page):
        rows, page = [], first_page
        for (letter, title, ids, _), n in zip(parts, counts):
            rows.append(f'<tr><td>Part {letter}</td><td>{html.escape(title)}</td><td>{page}–{page + n - 1}</td><td>{html.escape(ids)}</td></tr>')
            page += n
        return f"""<h1>CPE334 Project Deliverable 1 — Engineering baseline and working Sprint 1</h1>
<p><b>Theme 7:</b> Personal Money and Expense Logging System · <b>Semester</b> 1/2026</p>
<table><tr><th>Student</th><th>ID</th><th>GitHub</th></tr>{team}</table>
<p><b>Repository:</b> https://github.com/Sxr1n/cpe334-money-logger<br><b>Submitted release:</b> {html.escape(release)}</p>
<h2>Contents and navigation</h2>
<table><tr><th>Part</th><th>Title</th><th>Pages</th><th>Relevant IDs</th></tr>{''.join(rows)}</table>"""

    cover_pages = pages(print_pdf(PAGE.format(title='cover', body=cover(2)), 'cover'))
    cover_pdf = print_pdf(PAGE.format(title='cover', body=cover(1 + cover_pages)), 'cover')

    # Concatenate the separately printed files, so the navigation page ranges are exact.
    writer = PdfWriter()
    for pdf in [cover_pdf, *[OUT / f'part-{l}.pdf' for l, *_ in parts]]:
        writer.append(str(pdf))
    target = ROOT / 'submission' / 'd1' / f'D1-{TAG}.pdf'
    with open(target, 'wb') as fh:
        writer.write(fh)
    print(f'{target} ({pages(target)} pages = cover {cover_pages} + parts {counts})')


if __name__ == '__main__':
    main()
