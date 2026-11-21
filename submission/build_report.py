"""Build a lab report PDF from one Markdown file (same renderer as the D1 builder).

Usage (repo root):  STUDENT_IDS="<id A>,<id B>" python submission/build_report.py submission/lab5/report.md <output.pdf>
Student IDs are not committed (public repository): `{{ID_A}}` / `{{ID_B}}` in the Markdown are filled at build time.
Relative `img/...` PNG links resolve against the Markdown file's folder and are embedded.
"""
import base64
import importlib.util
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('d1', ROOT / 'submission' / 'd1' / 'build_pdf.py')
d1 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(d1)


def main():
    src, out = Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve()
    ids = (os.environ.get('STUDENT_IDS', '').split(',') + ['', ''])[:2]
    text = src.read_text(encoding='utf-8')
    # `<!-- include: docs/x.md -->` embeds a repo document, so the PDF shows the committed version.
    text = re.sub(r'<!-- include: (\S+) -->', lambda m: (ROOT / m.group(1)).read_text(encoding='utf-8'), text)
    text = text.replace('{{ID_A}}', ids[0].strip() or '(set STUDENT_IDS)').replace('{{ID_B}}', ids[1].strip() or '(set STUDENT_IDS)')
    # Embed img/ files as data URIs: headless Chrome printed only the first few file:// images.
    text = re.sub(r'\]\(img/([^)]+)\)', lambda m: '](data:image/png;base64,' + base64.b64encode((src.parent / 'img' / m.group(1)).read_bytes()).decode() + ')', text)
    body = '<script type="text/markdown">' + text.replace('</script', '<\\/script') + '</script>'
    d1.OUT.mkdir(parents=True, exist_ok=True)
    pdf = d1.print_pdf(d1.PAGE.format(title=src.stem, body=body), f'report-{src.parent.name}')
    out.write_bytes(pdf.read_bytes())
    print(f'{out} ({d1.pages(out)} pages)')


if __name__ == '__main__':
    main()
