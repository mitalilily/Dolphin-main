import { db } from '../../src/models/client'
import { findUserById } from '../../src/models/services/userService'

jest.mock('../../src/models/client', () => ({
  db: {
    select: jest.fn(),
  },
}))

const mockFindUserByIdRows = (rows: any[]) => {
  const limit = jest.fn().mockResolvedValue(rows)
  const where = jest.fn(() => ({ limit }))
  const secondLeftJoin = jest.fn(() => ({ where }))
  const firstLeftJoin = jest.fn(() => ({ leftJoin: secondLeftJoin }))
  const from = jest.fn(() => ({ leftJoin: firstLeftJoin }))

  ;(db.select as jest.Mock).mockReturnValue({ from })
}

describe('findUserById auth shape', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('keeps id as the auth user id when a profile row is joined', async () => {
    mockFindUserByIdRows([
      {
        user: {
          id: 'user-1',
          email: 'merchant@example.com',
          role: 'customer',
        },
        profile: {
          id: 'profile-1',
          userId: 'user-1',
          onboardingStep: -1,
          onboardingComplete: true,
        },
        userPlan: {
          plan_id: 'plan-1',
        },
      },
    ])

    const result = await findUserById('user-1')

    expect(result?.id).toBe('user-1')
    expect(result?.userId).toBe('user-1')
    expect(result?.profileId).toBe('profile-1')
    expect(result?.onboardingComplete).toBe(true)
    expect(result?.currentPlanId).toBe('plan-1')
  })

  it('falls back to the user id when no profile row exists yet', async () => {
    mockFindUserByIdRows([
      {
        user: {
          id: 'user-2',
          email: 'new@example.com',
          role: 'customer',
        },
        profile: null,
        userPlan: null,
      },
    ])

    const result = await findUserById('user-2')

    expect(result?.id).toBe('user-2')
    expect(result?.userId).toBe('user-2')
    expect(result?.profileId).toBeNull()
    expect(result?.currentPlanId).toBeNull()
  })
})
