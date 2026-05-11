import * as bcrypt from 'bcryptjs'
import { db } from '../../src/models/client'
import {
  createUserWithWallet,
  handleEmailVerificationRequest,
} from '../../src/models/services/userService'
import { sendVerificationEmail } from '../../src/utils/emailSender'
import { generate8DigitsVerificationToken } from '../../src/utils/functions'

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}))

jest.mock('../../src/models/client', () => ({
  db: {
    transaction: jest.fn(),
  },
}))

jest.mock('../../src/utils/emailSender', () => ({
  sendTempPasswordEmail: jest.fn(),
  sendVerificationEmail: jest.fn(),
}))

jest.mock('../../src/utils/functions', () => ({
  generate8DigitsVerificationToken: jest.fn(),
}))

const makeTransaction = (user: Record<string, unknown> | null) => {
  const chain = {
    set: jest.fn(),
    where: jest.fn(),
    returning: jest.fn().mockResolvedValue([{ id: user?.id ?? 'user-1' }]),
  }

  chain.set.mockReturnValue({ where: chain.where })
  chain.where.mockReturnValue({ returning: chain.returning })

  const tx = {
    query: {
      users: {
        findFirst: jest.fn().mockResolvedValue(user),
      },
    },
    update: jest.fn().mockReturnValue({ set: chain.set }),
  }

  ;(db.transaction as jest.Mock).mockImplementation((work) => work(tx))

  return { tx, chain }
}

const makeCreateUserTransaction = () => {
  const createdUser = {
    id: 'user-new',
    email: 'new@example.com',
    phone: null,
    role: 'customer',
  }
  const insertValues: Record<string, unknown>[] = []

  const tx = {
    insert: jest.fn(),
    select: jest.fn(),
  }

  let insertCount = 0
  tx.insert.mockImplementation(() => {
    insertCount += 1
    const returning = jest.fn().mockResolvedValue([createdUser])
    return {
      values: jest.fn((payload) => {
        insertValues.push(payload)
        return insertCount === 1 ? { returning } : Promise.resolve([])
      }),
    }
  })

  const limit = jest.fn().mockResolvedValue([])
  const where = jest.fn(() => ({ limit }))
  const from = jest.fn(() => ({ where }))
  tx.select.mockReturnValue({ from })

  ;(db.transaction as jest.Mock).mockImplementation((work) => work(tx))

  return { createdUser, insertValues }
}

describe('handleEmailVerificationRequest signup verification', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(generate8DigitsVerificationToken as jest.Mock).mockReturnValue('ABC12345')
    ;(sendVerificationEmail as jest.Mock).mockResolvedValue(undefined)
  })

  it('resends a verification code for an existing unverified signup', async () => {
    const pendingUser = {
      id: 'user-1',
      email: 'pending@example.com',
      emailVerified: false,
      passwordHash: 'stored-hash',
      role: 'customer',
    }
    const { tx, chain } = makeTransaction(pendingUser)
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

    const result = await handleEmailVerificationRequest(
      ' Pending@Example.com ',
      'secret123',
      null,
      'signup',
    )

    expect(result.status).toBe(200)
    expect(result.data).toMatchObject({ message: 'Verification email sent' })
    expect(bcrypt.compare).toHaveBeenCalledWith('secret123', 'stored-hash')
    expect(tx.update).toHaveBeenCalledTimes(1)
    expect(chain.set).toHaveBeenCalledWith(
      expect.objectContaining({
        emailVerificationToken: 'ABC12345',
        emailVerificationTokenExpiresAt: expect.any(Date),
      }),
    )
    expect(sendVerificationEmail).toHaveBeenCalledWith('pending@example.com', 'ABC12345')
  })

  it('keeps verified users on the login path when they try to sign up again', async () => {
    makeTransaction({
      id: 'user-1',
      email: 'verified@example.com',
      emailVerified: true,
      passwordHash: 'stored-hash',
      role: 'customer',
    })

    const result = await handleEmailVerificationRequest(
      'verified@example.com',
      'secret123',
      null,
      'signup',
    )

    expect(result.status).toBe(409)
    expect(result.data).toMatchObject({
      code: 'ACCOUNT_EXISTS',
      error: 'User already exists. Please log in to open your dashboard.',
    })
    expect(bcrypt.compare).not.toHaveBeenCalled()
    expect(sendVerificationEmail).not.toHaveBeenCalled()
  })

  it('does not resend a pending signup code when the password is different', async () => {
    const { tx } = makeTransaction({
      id: 'user-1',
      email: 'pending@example.com',
      emailVerified: false,
      passwordHash: 'stored-hash',
      role: 'customer',
    })
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

    const result = await handleEmailVerificationRequest(
      'pending@example.com',
      'wrong-password',
      null,
      'signup',
    )

    expect(result.status).toBe(400)
    expect(result.data).toMatchObject({
      code: 'ACCOUNT_PENDING_VERIFICATION',
    })
    expect(tx.update).not.toHaveBeenCalled()
    expect(sendVerificationEmail).not.toHaveBeenCalled()
  })

  it('stores missing optional unique auth identifiers as null for new users', async () => {
    const { createdUser, insertValues } = makeCreateUserTransaction()

    const user = await createUserWithWallet({
      email: ' New@Example.com ',
      phone: '',
      googleId: '',
      passwordHash: 'stored-hash',
      emailVerified: false,
    })

    expect(user).toBe(createdUser)
    expect(insertValues[0]).toMatchObject({
      email: 'new@example.com',
      phone: null,
      googleId: null,
      role: 'customer',
    })
    expect(insertValues[insertValues.length - 1]?.companyInfo).toMatchObject({
      contactEmail: 'new@example.com',
      contactNumber: '',
    })
  })
})
