"""Post-deployment checks for a release: the CHG-01 changed behaviour and preserved Sprint 1 paths (Lab 7 §3.2).

    python deploy/post_deploy_checks.py SERVICE_URL EXPECTED_VERSION

Passwords are read from BOB_PASSWORD / ALICE_PASSWORD / ADMIN_PASSWORD or typed at the prompt, never printed.
Writes only bob's synthetic data (a new card + one charge). alice is only read, and one write attempt
against her card must fail with 404. Does not log out (logout revokes every session of the user).
Standard library only; exits non-zero if any check fails.
"""
import getpass
import http.cookiejar
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone

BASE, VERSION = sys.argv[1].rstrip('/'), sys.argv[2]
failures = 0


def session():
    return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))


def call(opener, method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method, headers={'Content-Type': 'application/json'})
    try:
        with opener.open(req, timeout=30) as r:
            return r.status, json.loads(r.read() or b'null')
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b'null')


def check(cid, action, expected, ok, actual):
    global failures
    failures += 0 if ok else 1
    print(f"{'PASS' if ok else 'FAIL'} {cid} | {action} | expected: {expected} | actual: {actual}")


def login(name, env):
    s = session()
    password = os.environ.get(env) or getpass.getpass(f'{name} password: ')
    status, _ = call(s, 'POST', '/api/auth/login', {'username': name, 'password': password})
    if status != 200:
        sys.exit(f'login failed for {name}: {status}')
    return s


def by_name(items, name):
    return next(a for a in items if a['name'] == name)


from datetime import timedelta
today = (datetime.now(timezone.utc) + timedelta(hours=7)).strftime('%Y-%m-%d')  # Asia/Bangkok (UTC+7, no DST)
print(f'Post-deploy checks {datetime.now(timezone.utc):%Y-%m-%d %H:%M:%S} UTC against {BASE}')

status, health = call(session(), 'GET', '/api/health')
check('PD-01', 'GET /api/health', f'version {VERSION}', status == 200 and health.get('version') == VERSION, f"{status} {health.get('version')}")

bob, alice, admin = login('bob', 'BOB_PASSWORD'), login('alice', 'ALICE_PASSWORD'), login('admin', 'ADMIN_PASSWORD')

# CHG-01 changed behaviour on a fresh card of bob (FR-28, BR-18)
name = f"Card CHG01 {datetime.now(timezone.utc):%H%M%S}"
status, card = call(bob, 'POST', '/api/accounts', {'name': name, 'type': 'LOAN_TAKEN'})
check('PD-02', f'bob creates LOAN_TAKEN "{name}"', '201, no limit', status == 201 and card.get('creditLimit') is None, f"{status} creditLimit={card.get('creditLimit')}")
status, body = call(bob, 'PATCH', f"/api/accounts/{card['id']}", {'creditLimit': 500000})
check('PD-03', 'bob sets creditLimit 500000 (฿5,000.00)', '200, availableCredit 500000', status == 200 and body.get('availableCredit') == 500000, f"{status} availableCredit={body.get('availableCredit')}")

_, accts = call(bob, 'GET', '/api/accounts')
dining = by_name(accts['items'], 'Dining')['id']
charge = lambda amount: call(bob, 'POST', '/api/transactions', {
    'form': 'PAYMENT', 'primaryAccountId': card['id'], 'date': today, 'total': amount,
    'lines': [{'accountId': dining, 'amount': amount}], 'note': 'CHG-01 post-deploy check'})
status, body = charge(500001)
msg = (body or {}).get('error', {}).get('details', {}).get('total')
check('PD-04', 'bob charges 500001 (1 satang over the limit)', '422 "Over the credit limit ... (available ฿5,000.00)"',
      status == 422 and msg == f'Over the credit limit of {name} (available ฿5,000.00)', f'{status} {msg}')
status, body = charge(500000)
check('PD-05', 'bob charges 500000 (exactly the limit)', '201', status == 201, f"{status} txn id={body.get('id')}")
_, accts = call(bob, 'GET', '/api/accounts')
saved = next(a for a in accts['items'] if a['id'] == card['id'])
check('PD-06', 'bob re-reads accounts (persistence)', 'balance 500000, availableCredit 0',
      saved['balance'] == 500000 and saved['availableCredit'] == 0, f"balance={saved['balance']} availableCredit={saved['availableCredit']}")

# Preserved Sprint 1 domain rule: BR-07 cash cannot go negative
bank = by_name(accts['items'], 'Bank')
status, body = call(bob, 'POST', '/api/transactions', {
    'form': 'PAYMENT', 'primaryAccountId': bank['id'], 'date': today, 'total': bank['balance'] + 1,
    'lines': [{'accountId': dining, 'amount': bank['balance'] + 1}]})
_, after = call(bob, 'GET', '/api/accounts')
check('PD-07', f"bob pays Bank balance + 1 ({bank['balance'] + 1})", '422, Bank unchanged',
      status == 422 and by_name(after['items'], 'Bank')['balance'] == bank['balance'], f"{status} Bank={by_name(after['items'], 'Bank')['balance']}")

# Preserved access paths: no session, admin denial, user isolation
status, _ = call(session(), 'GET', '/api/accounts')
check('PD-08', 'GET /api/accounts without a session', '401', status == 401, status)
status, _ = call(admin, 'GET', '/api/accounts')
check('PD-09', 'admin GET /api/accounts (financial data)', '403', status == 403, status)
status, _ = call(admin, 'PATCH', f"/api/accounts/{card['id']}", {'creditLimit': 1})
check('PD-10', "admin PATCH bob's card creditLimit", '403', status == 403, status)
_, alice_accts = call(alice, 'GET', '/api/accounts')
alice_card = by_name(alice_accts['items'], 'Credit Card')
status, _ = call(bob, 'PATCH', f"/api/accounts/{alice_card['id']}", {'creditLimit': 1})
_, alice_again = call(alice, 'GET', '/api/accounts')
check('PD-11', "bob PATCH alice's Credit Card creditLimit", "404, alice's limit unchanged",
      status == 404 and by_name(alice_again['items'], 'Credit Card')['creditLimit'] == alice_card['creditLimit'],
      f"{status} alice creditLimit={by_name(alice_again['items'], 'Credit Card')['creditLimit']}")

print(f'{11 - failures}/11 passed, {failures} failed')
sys.exit(1 if failures else 0)
