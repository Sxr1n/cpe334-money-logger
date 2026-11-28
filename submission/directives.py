"""Markdown directives shared by the PDF builders, expanded at build time so a PDF shows the committed files:
  <!-- include: PATH -->                      whole Markdown file
  <!-- include: PATH | START | END -->        lines from the heading START up to (not including) heading END
  <!-- code: PATH[:FROM-TO] -->               file (or line range) as a code block
  <!-- gitdiff: A B PATH... -->               `git diff A B -- PATH...` as a diff block
"""
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def git(*args):
    return subprocess.run(['git', *args], cwd=ROOT, capture_output=True, text=True, encoding='utf-8').stdout


def section(text, start, end):
    lines, out, on = text.splitlines(), [], False
    for line in lines:
        if line.strip() == start.strip():
            on = True
        elif end and line.strip() == end.strip():
            break
        if on:
            out.append(line)
    if not out:
        raise SystemExit(f'heading not found: {start!r}')
    return '\n'.join(out)


def fence(body, lang=''):
    return f'\n```{lang}\n{body.rstrip()}\n```\n'


def expand(text):
    def include(m):
        parts = [p.strip() for p in m.group(1).split('|')]
        body = (ROOT / parts[0]).read_text(encoding='utf-8')
        return section(body, parts[1], parts[2] if len(parts) > 2 else None) if len(parts) > 1 else body

    def code(m):
        path, _, rng = m.group(1).partition(':')
        lines = (ROOT / path).read_text(encoding='utf-8').splitlines()
        if rng:
            a, b = map(int, rng.split('-'))
            lines = lines[a - 1:b]
        lang = {'ts': 'ts', 'py': 'python', 'sql': 'sql'}.get(path.rsplit('.', 1)[-1], '')
        return f'`{m.group(1)}`' + fence('\n'.join(lines), lang)

    def gitdiff(m):
        a, b, *paths = m.group(1).split()
        return fence(git('diff', a, b, '--', *paths), 'diff')

    text = re.sub(r'<!-- include: (.+?) -->', include, text)
    text = re.sub(r'<!-- code: (\S+) -->', code, text)
    return re.sub(r'<!-- gitdiff: (.+?) -->', gitdiff, text)
