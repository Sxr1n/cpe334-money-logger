"""Read-only checks of the live service after a deployment (adapted from the Lab 5 starter kit).

    python3 deploy/smoke_test.py SERVICE_URL [EXPECTED_VERSION]

Exits non-zero (failing the workflow) if any check fails. Each check is retried up to
5 times, 3 seconds apart, to tolerate Cloud Run cold starts. Standard library only.

Checks
  1. GET /api/health    -> {"status": "ok"} and, if given, "version" == EXPECTED_VERSION (R-08)
  2. GET /api/ready     -> {"db": "connected"}   (the app reaches Cloud SQL)
  3. GET /              -> HTML (the built React app is served)
  4. GET /api/accounts  -> 401 without a session (backend authorization is on)

The kit's optional login check is not used: Money Logger sessions are an httpOnly
cookie, not a bearer token, and logout revokes every session of that user.
"""
import json
import sys
import time
import urllib.error
import urllib.request


def fetch(base, path):
    """Returns (status, body); HTTP errors are returned, not raised."""
    try:
        with urllib.request.urlopen(base + path, timeout=30) as response:
            return response.status, response.read()
    except urllib.error.HTTPError as err:
        return err.code, err.read()


def check(base, version=None):
    checks = (
        ('/api/health', lambda s, b: s == 200 and json.loads(b).get('status') == 'ok'
            and (version is None or json.loads(b).get('version') == version)),
        ('/api/ready', lambda s, b: s == 200 and json.loads(b).get('db') == 'connected'),
        ('/', lambda s, b: s == 200 and b'<html' in b.lower()),
        ('/api/accounts', lambda s, b: s == 401 and json.loads(b)['error']['code'] == 'UNAUTHENTICATED'),
    )
    for path, ok in checks:
        for attempt in range(5):
            try:
                if ok(*fetch(base, path)):
                    break
                raise ValueError('Unexpected response')
            except (urllib.error.URLError, TimeoutError, ValueError, KeyError):
                if attempt == 4:
                    raise RuntimeError('Smoke check failed: ' + path) from None
                time.sleep(3)
        print('PASS ' + path)


if __name__ == '__main__':
    if len(sys.argv) not in (2, 3):
        sys.exit('Usage: python3 deploy/smoke_test.py SERVICE_URL [EXPECTED_VERSION]')
    check(sys.argv[1].rstrip('/'), sys.argv[2] if len(sys.argv) == 3 else None)
