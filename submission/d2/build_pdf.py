"""Build the Deliverable 2 PDF from docs/ (single source of truth) plus the part-*.md evidence pages here.

Usage (repo root):  D1_STUDENT_IDS="<id A>,<id B>" python submission/d2/build_pdf.py [release-tag]
Same needs as submission/d1/build_pdf.py (Chrome, pypdf, internet for cdnjs); this script reuses its renderer.
The cover reads the deployed version from /api/health at build time, so build right after the RC deploy.
"""
import html
import importlib.util
import json
import sys
import urllib.request
from pathlib import Path

from pypdf import PdfWriter

ROOT = Path(__file__).resolve().parents[2]
_spec = importlib.util.spec_from_file_location('d1', ROOT / 'submission/d1/build_pdf.py')
d1 = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(d1)
d1.OUT = OUT = ROOT / 'submission' / 'd2' / 'build'  # d1's print_pdf writes into its module-level OUT

TAG = sys.argv[1] if len(sys.argv) > 1 else 'v0.3.0-rc1'
DEPLOY_URL = 'https://s87ce2df5-4d7hbszvwq-as.a.run.app'
S1_TAG, S2_TAG = 'v0.1.0-sprint1', 'v0.2.0-sprint2'


def rel(paths):
    return [p.relative_to(ROOT).as_posix() for p in paths]


S2 = rel(sorted((ROOT / 'docs/sprints/sprint-2').glob('F*.md')))
S3 = rel(sorted((ROOT / 'docs/sprints/sprint-3').glob('F*.md')))
PARTS = [
    ('A', 'Sprint 1 continuity and change status', ['submission/d2/part-a.md', 'docs/changes.md'],
     f'{S1_TAG}, CHG/DEF register, Lab 5–7 findings'),
    ('B', 'Sprint 2 contracts and working increment', S2 + ['docs/dod.md', 'submission/d2/part-b.md'],
     f'F-07–F-12, AC-F07-01–AC-F12-07, {S2_TAG}'),
    ('C', 'Sprint 3 contracts and working progress', S3 + ['submission/d2/part-c.md'],
     'F-13–F-16, AC-F13-01–AC-F16-06, remaining-work plan'),
    ('D', 'Requirements, design and traceability',
     ['docs/srs.md', 'docs/features.md', 'docs/system-sds.md', 'docs/traceability.md'],
     'FR/BR/NFR, F-01–F-16, SR-01–SR-04, coverage gaps'),
    ('E', 'Integrated release candidate', ['submission/d2/part-e.md'],
     f'{TAG}, regression, CI, deployment, readiness, plan to 13 Dec'),
]


def deployed_version():
    try:
        with urllib.request.urlopen(f'{DEPLOY_URL}/api/health', timeout=15) as r:
            return json.load(r).get('version', 'unknown')[:7]
    except OSError as e:
        return f'unreachable at build time ({e.__class__.__name__})'


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    parts = [(l, t, ids, d1.part_body(l, t, files)) for l, t, files, ids in PARTS]
    counts = [d1.pages(d1.print_pdf(d1.PAGE.format(title=f'Part {l}', body=b), f'part-{l}')) for l, _, _, b in parts]

    tag_commit = d1.git('rev-list', '-n', '1', TAG)
    release = f'{TAG} — commit {tag_commit[:7]}' if tag_commit else f'{TAG} — tag not created yet'
    version = deployed_version()
    match = '' if tag_commit and tag_commit.startswith(version) else ' (does not match the submitted tag)'
    team = ''.join(f'<tr><td>{html.escape(n)}</td><td>{sid}</td><td><code>{gh}</code></td></tr>' for n, sid, gh in d1.TEAM)

    def cover(first_page):
        rows, page = [], first_page
        for (letter, title, ids, _), n in zip(parts, counts):
            rows.append(f'<tr><td>Part {letter}</td><td>{html.escape(title)}</td><td>{page}–{page + n - 1}</td><td>{html.escape(ids)}</td></tr>')
            page += n
        return f"""<h1>CPE334 Project Deliverable 2 — Sprint 2 completion and Sprint 3 progress</h1>
<p><b>Theme 7:</b> Personal Money and Expense Logging System · <b>Semester</b> 1/2026</p>
<table><tr><th>Student</th><th>ID</th><th>GitHub</th></tr>{team}</table>
<p><b>Repository:</b> https://github.com/Sxr1n/cpe334-money-logger<br>
<b>Submitted release:</b> {html.escape(release)}<br>
<b>Deployed application:</b> {DEPLOY_URL} — version {html.escape(version + match)}</p>
<h2>Contents and navigation</h2>
<table><tr><th>Part</th><th>Title</th><th>Pages</th><th>Relevant IDs</th></tr>{''.join(rows)}</table>"""

    cover_pages = d1.pages(d1.print_pdf(d1.PAGE.format(title='cover', body=cover(2)), 'cover'))
    cover_pdf = d1.print_pdf(d1.PAGE.format(title='cover', body=cover(1 + cover_pages)), 'cover')

    writer = PdfWriter()
    for pdf in [cover_pdf, *[OUT / f'part-{l}.pdf' for l, *_ in parts]]:
        writer.append(str(pdf))
    target = ROOT / 'submission' / 'd2' / f'D2-{TAG}.pdf'
    with open(target, 'wb') as fh:
        writer.write(fh)
    print(f'{target} ({d1.pages(target)} pages = cover {cover_pages} + parts {counts})')


if __name__ == '__main__':
    main()
