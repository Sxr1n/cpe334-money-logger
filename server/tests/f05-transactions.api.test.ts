import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import app from '../src/app'
import { getTodayBangkok } from '../src/lib/ledger'
import { prisma } from '../src/prisma'
import { createUser, loginCookie, resetDb } from './helpers/db'

let aliceId: number
let bobId: number
let aliceBankId: number
let aliceCreditId: number
let aliceSalaryId: number
let aliceDiningId: number
let aliceGroceriesId: number
let aliceSecondCashId: number
let aliceLoanGivenId: number
let bobCreditId: number
let bobDiningId: number

beforeEach(async () => {
  await resetDb()
  const alice = await createUser('alice', { seedAccounts: true })
  const bob = await createUser('bob', { seedAccounts: true })
  aliceId = alice.id
  bobId = bob.id

  const aliceAccounts = await prisma.account.findMany({ where: { userId: aliceId } })
  aliceBankId = aliceAccounts.find((a) => a.name === 'Bank')!.id
  aliceCreditId = aliceAccounts.find((a) => a.name === 'Credit Card')!.id
  aliceSalaryId = aliceAccounts.find((a) => a.name === 'Salary')!.id
  aliceDiningId = aliceAccounts.find((a) => a.name === 'Dining')!.id
  aliceGroceriesId = aliceAccounts.find((a) => a.name === 'Groceries')!.id

  // Create second CASH account and LOAN_GIVEN account for alice
  const secondCash = await prisma.account.create({
    data: { userId: aliceId, name: 'Wallet', type: 'CASH' },
  })
  aliceSecondCashId = secondCash.id

  const loanGiven = await prisma.account.create({
    data: { userId: aliceId, name: 'Loan to Friend', type: 'LOAN_GIVEN' },
  })
  aliceLoanGivenId = loanGiven.id

  const bobAccounts = await prisma.account.findMany({ where: { userId: bobId } })
  bobCreditId = bobAccounts.find((a) => a.name === 'Credit Card')!.id
  bobDiningId = bobAccounts.find((a) => a.name === 'Dining')!.id
})

describe('F-05 Payment/charge API', () => {
  it('TEST-F05-01 alice posts PAYMENT from Credit Card (debt 0) total 120000 lines Dining 70000 + Groceries 50000 (AC-F05-01)', async () => {
    const cookie = await loginCookie('alice')
    const today = getTodayBangkok()

    const res = await request(app)
      .post('/api/transactions')
      .set('Cookie', cookie)
      .send({
        form: 'PAYMENT',
        primaryAccountId: aliceCreditId,
        date: today,
        total: 120000,
        note: 'Weekend shopping',
        lines: [
          { accountId: aliceDiningId, amount: 70000 },
          { accountId: aliceGroceriesId, amount: 50000 },
        ],
      })

    expect(res.status).toBe(201)
    expect(res.body.form).toBe('PAYMENT')
    expect(res.body.total).toBe(120000)
    expect(res.body.primaryAccount.id).toBe(aliceCreditId)
    expect(res.body.lines).toHaveLength(2)

    // DB verification: card balance becomes 120000 (debt increases)
    const card = await prisma.account.findUnique({ where: { id: aliceCreditId } })
    expect(Number(card?.balance)).toBe(120000)

    // Lines stored properly
    const txn = await prisma.txn.findUnique({
      where: { id: res.body.id },
      include: { lines: true },
    })
    expect(txn?.status).toBe('POSTED')
    expect(txn?.lines).toHaveLength(2)
    const diningLine = txn?.lines.find((l) => l.accountId === aliceDiningId)
    const groceriesLine = txn?.lines.find((l) => l.accountId === aliceGroceriesId)
    expect(Number(diningLine?.amount)).toBe(70000)
    expect(Number(groceriesLine?.amount)).toBe(50000)
  })

  it('TEST-F05-02 alice repays card debt from Bank: Bank -= 120000, card debt becomes 0, expense sum unchanged (AC-F05-02)', async () => {
    const cookie = await loginCookie('alice')
    const today = getTodayBangkok()

    // Precondition: Bank 3500000, card debt 0
    await prisma.account.update({
      where: { id: aliceBankId },
      data: { balance: 3500000n },
    })
    await prisma.account.update({
      where: { id: aliceCreditId },
      data: { balance: 0n },
    })

    // Card purchase 120000 so card debt becomes 120000 and expense sum > 0
    await request(app)
      .post('/api/transactions')
      .set('Cookie', cookie)
      .send({
        form: 'PAYMENT',
        primaryAccountId: aliceCreditId,
        date: today,
        total: 120000,
        lines: [{ accountId: aliceDiningId, amount: 120000 }],
      })

    // Helper to calculate total expense from EXPENSE lines in DB
    const getExpenseSum = async () => {
      const expenseAccounts = await prisma.account.findMany({
        where: { userId: aliceId, type: 'EXPENSE' },
        select: { id: true },
      })
      const expenseIds = expenseAccounts.map((a) => a.id)
      const lines = await prisma.txnLine.findMany({
        where: { accountId: { in: expenseIds } },
      })
      return lines.reduce((acc, l) => acc + Number(l.amount), 0)
    }

    const expenseBefore = await getExpenseSum()

    // Action: Repay card 120000 from Bank
    const res = await request(app)
      .post('/api/transactions')
      .set('Cookie', cookie)
      .send({
        form: 'PAYMENT',
        primaryAccountId: aliceBankId,
        date: today,
        total: 120000,
        lines: [{ accountId: aliceCreditId, amount: 120000 }],
      })

    expect(res.status).toBe(201)

    // Bank becomes 3380000 (3500000 - 120000)
    const bank = await prisma.account.findUnique({ where: { id: aliceBankId } })
    expect(Number(bank?.balance)).toBe(3380000)

    // Card debt becomes 0 (120000 - 120000)
    const card = await prisma.account.findUnique({ where: { id: aliceCreditId } })
    expect(Number(card?.balance)).toBe(0)

    // Expense total is unchanged (BR-06: repayment is not an EXPENSE line)
    const expenseAfter = await getExpenseSum()
    expect(expenseAfter).toBe(expenseBefore)
  })

  it('TEST-F05-03 PAYMENT lines sum mismatch (1 satang more) -> 422 RULE_VIOLATION (AC-F05-03)', async () => {
    const cookie = await loginCookie('alice')
    const today = getTodayBangkok()

    const res = await request(app)
      .post('/api/transactions')
      .set('Cookie', cookie)
      .send({
        form: 'PAYMENT',
        primaryAccountId: aliceCreditId,
        date: today,
        total: 120000,
        lines: [
          { accountId: aliceDiningId, amount: 70000 },
          { accountId: aliceGroceriesId, amount: 50001 },
        ],
      })

    expect(res.status).toBe(422)
    expect(res.body.error?.code).toBe('RULE_VIOLATION')
    expect(res.body.error?.details?.lines).toBe('Lines must add up to the total')

    expect(await prisma.txn.count()).toBe(0)
    expect(await prisma.txnLine.count()).toBe(0)
  })

  it('TEST-F05-04 invalid account combinations rejected with 422 RULE_VIOLATION (AC-F05-04)', async () => {
    const cookie = await loginCookie('alice')
    const today = getTodayBangkok()

    // 1. Primary Salary (INCOME)
    const resIncomePrimary = await request(app)
      .post('/api/transactions')
      .set('Cookie', cookie)
      .send({
        form: 'PAYMENT',
        primaryAccountId: aliceSalaryId,
        date: today,
        total: 50000,
        lines: [{ accountId: aliceDiningId, amount: 50000 }],
      })
    expect(resIncomePrimary.status).toBe(422)
    expect(resIncomePrimary.body.error?.code).toBe('RULE_VIOLATION')

    // 2. Primary Dining (EXPENSE)
    const resExpensePrimary = await request(app)
      .post('/api/transactions')
      .set('Cookie', cookie)
      .send({
        form: 'PAYMENT',
        primaryAccountId: aliceDiningId,
        date: today,
        total: 50000,
        lines: [{ accountId: aliceGroceriesId, amount: 50000 }],
      })
    expect(resExpensePrimary.status).toBe(422)
    expect(resExpensePrimary.body.error?.code).toBe('RULE_VIOLATION')

    // 3. Primary LOAN_GIVEN
    const resLoanGivenPrimary = await request(app)
      .post('/api/transactions')
      .set('Cookie', cookie)
      .send({
        form: 'PAYMENT',
        primaryAccountId: aliceLoanGivenId,
        date: today,
        total: 50000,
        lines: [{ accountId: aliceDiningId, amount: 50000 }],
      })
    expect(resLoanGivenPrimary.status).toBe(422)
    expect(resLoanGivenPrimary.body.error?.code).toBe('RULE_VIOLATION')

    // 4. Line to another CASH account (Wallet)
    const resCashLine = await request(app)
      .post('/api/transactions')
      .set('Cookie', cookie)
      .send({
        form: 'PAYMENT',
        primaryAccountId: aliceBankId,
        date: today,
        total: 50000,
        lines: [{ accountId: aliceSecondCashId, amount: 50000 }],
      })
    expect(resCashLine.status).toBe(422)
    expect(resCashLine.body.error?.code).toBe('RULE_VIOLATION')

    // 5. Line equal to primary
    const resSameAccount = await request(app)
      .post('/api/transactions')
      .set('Cookie', cookie)
      .send({
        form: 'PAYMENT',
        primaryAccountId: aliceBankId,
        date: today,
        total: 50000,
        lines: [{ accountId: aliceBankId, amount: 50000 }],
      })
    expect(resSameAccount.status).toBe(422)
    expect(resSameAccount.body.error?.code).toBe('RULE_VIOLATION')

    // 6. Duplicate account in lines
    const resDupLine = await request(app)
      .post('/api/transactions')
      .set('Cookie', cookie)
      .send({
        form: 'PAYMENT',
        primaryAccountId: aliceBankId,
        date: today,
        total: 50000,
        lines: [
          { accountId: aliceDiningId, amount: 25000 },
          { accountId: aliceDiningId, amount: 25000 },
        ],
      })
    expect(resDupLine.status).toBe(422)
    expect(resDupLine.body.error?.code).toBe('RULE_VIOLATION')

    expect(await prisma.txn.count()).toBe(0)
  })

  it('TEST-F05-05 overspending CASH balance rejected with 422, exact balance accepted (AC-F05-05, BR-07)', async () => {
    const cookie = await loginCookie('alice')
    const today = getTodayBangkok()

    // Precondition: Bank balance 1000000
    await prisma.account.update({
      where: { id: aliceBankId },
      data: { balance: 1000000n },
    })

    // Post 1000001 -> 422 RULE_VIOLATION and Bank stays 1000000
    const overspend = await request(app)
      .post('/api/transactions')
      .set('Cookie', cookie)
      .send({
        form: 'PAYMENT',
        primaryAccountId: aliceBankId,
        date: today,
        total: 1000001,
        lines: [{ accountId: aliceDiningId, amount: 1000001 }],
      })
    expect(overspend.status).toBe(422)
    expect(overspend.body.error?.code).toBe('RULE_VIOLATION')
    expect(overspend.body.error?.details?.total).toBeDefined()

    const bankStay = await prisma.account.findUnique({ where: { id: aliceBankId } })
    expect(Number(bankStay?.balance)).toBe(1000000)

    // Post exactly 1000000 -> 201 and Bank becomes 0
    const exact = await request(app)
      .post('/api/transactions')
      .set('Cookie', cookie)
      .send({
        form: 'PAYMENT',
        primaryAccountId: aliceBankId,
        date: today,
        total: 1000000,
        lines: [{ accountId: aliceDiningId, amount: 1000000 }],
      })
    expect(exact.status).toBe(201)

    const bankZero = await prisma.account.findUnique({ where: { id: aliceBankId } })
    expect(Number(bankZero?.balance)).toBe(0)
  })

  it('TEST-F05-06 repayment line exceeding debt rejected with 422, exact debt accepted (AC-F05-06, BR-08)', async () => {
    const cookie = await loginCookie('alice')
    const today = getTodayBangkok()

    // Precondition: Bank 5000000, card debt 120000
    await prisma.account.update({
      where: { id: aliceBankId },
      data: { balance: 5000000n },
    })
    await prisma.account.update({
      where: { id: aliceCreditId },
      data: { balance: 120000n },
    })

    // Post repayment line 120001 -> 422 RULE_VIOLATION, debt stays 120000
    const overpay = await request(app)
      .post('/api/transactions')
      .set('Cookie', cookie)
      .send({
        form: 'PAYMENT',
        primaryAccountId: aliceBankId,
        date: today,
        total: 120001,
        lines: [{ accountId: aliceCreditId, amount: 120001 }],
      })
    expect(overpay.status).toBe(422)
    expect(overpay.body.error?.code).toBe('RULE_VIOLATION')
    expect(overpay.body.error?.details?.['lines[0].amount']).toBeDefined()

    const cardStay = await prisma.account.findUnique({ where: { id: aliceCreditId } })
    expect(Number(cardStay?.balance)).toBe(120000)

    // Post repayment line exactly 120000 -> 201, debt becomes 0
    const exact = await request(app)
      .post('/api/transactions')
      .set('Cookie', cookie)
      .send({
        form: 'PAYMENT',
        primaryAccountId: aliceBankId,
        date: today,
        total: 120000,
        lines: [{ accountId: aliceCreditId, amount: 120000 }],
      })
    expect(exact.status).toBe(201)

    const cardZero = await prisma.account.findUnique({ where: { id: aliceCreditId } })
    expect(Number(cardZero?.balance)).toBe(0)
  })

  it('TEST-F05-07 cross-user isolation: alice using bob Credit Card or bob Dining gets 404 (AC-F05-07, BR-11)', async () => {
    const cookie = await loginCookie('alice')
    const today = getTodayBangkok()

    // Alice using bob's Credit Card as primary
    const bobPrimaryRes = await request(app)
      .post('/api/transactions')
      .set('Cookie', cookie)
      .send({
        form: 'PAYMENT',
        primaryAccountId: bobCreditId,
        date: today,
        total: 50000,
        lines: [{ accountId: aliceDiningId, amount: 50000 }],
      })
    expect(bobPrimaryRes.status).toBe(404)
    expect(bobPrimaryRes.body.error?.code).toBe('NOT_FOUND')

    // Alice using bob's Dining as a line
    const bobLineRes = await request(app)
      .post('/api/transactions')
      .set('Cookie', cookie)
      .send({
        form: 'PAYMENT',
        primaryAccountId: aliceCreditId,
        date: today,
        total: 50000,
        lines: [{ accountId: bobDiningId, amount: 50000 }],
      })
    expect(bobLineRes.status).toBe(404)
    expect(bobLineRes.body.error?.code).toBe('NOT_FOUND')

    // Verify bob's accounts unchanged
    const bobCredit = await prisma.account.findUnique({ where: { id: bobCreditId } })
    expect(Number(bobCredit?.balance)).toBe(0)
    expect(await prisma.txn.count()).toBe(0)
  })
})
