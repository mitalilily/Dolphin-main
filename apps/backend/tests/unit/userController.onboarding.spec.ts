import { completeRegistration } from '../../src/controllers/userController'
import { getProfileByUserId, upsertUserProfile } from '../../src/models/services/userProfile.service'
import {
  findUserByEmail,
  findUserById,
  findUserByPhone,
  updateUser,
} from '../../src/models/services/userService'

jest.mock('../../src/models/services/userProfile.service', () => ({
  getProfileByUserId: jest.fn(),
  upsertUserProfile: jest.fn(),
}))

jest.mock('../../src/models/services/userService', () => ({
  findUserByEmail: jest.fn(),
  findUserById: jest.fn(),
  findUserByPhone: jest.fn(),
  updateUser: jest.fn(),
}))

const makeResponse = () => {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  }
  res.status.mockReturnValue(res)
  res.json.mockReturnValue(res)
  return res
}

describe('completeRegistration onboarding finish', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(findUserByPhone as jest.Mock).mockResolvedValue(null)
    ;(findUserByEmail as jest.Mock).mockResolvedValue({ id: 'user-1' })
    ;(upsertUserProfile as jest.Mock).mockResolvedValue({
      id: 'profile-1',
      userId: 'user-1',
      onboardingComplete: true,
      onboardingStep: -1,
    })
    ;(updateUser as jest.Mock).mockResolvedValue({ id: 'user-1' })
  })

  it('finishes step 3 without writing blank phone values back to users', async () => {
    ;(findUserById as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'seller@example.com',
      phone: '',
      emailVerified: true,
      phoneVerified: false,
    })
    ;(getProfileByUserId as jest.Mock).mockResolvedValue({
      id: 'profile-1',
      userId: 'user-1',
      companyInfo: {
        contactEmail: 'seller@example.com',
        contactNumber: '',
        contactPerson: 'Seller One',
        businessName: 'Seller Co',
        brandName: 'Seller',
      },
    })

    const req = {
      user: { sub: 'user-1' },
      body: {
        step: 3,
        data: {
          basicInfo: {
            firstName: 'Seller',
            lastName: 'One',
            email: 'seller@example.com',
            phone: '',
            companyName: 'Seller Co',
            personalWebsite: 'https://seller.example.com',
          },
          businessLegal: {
            brandName: 'Seller',
            businessCategory: ['b2c'],
            monthlyShipments: '0-100',
          },
        },
      },
    }
    const res = makeResponse()

    await completeRegistration(req, res as any)

    expect(upsertUserProfile).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        onboardingComplete: true,
        onboardingStep: -1,
        companyInfo: expect.objectContaining({
          contactEmail: 'seller@example.com',
          contactNumber: '',
        }),
      }),
    )
    expect(updateUser).toHaveBeenCalledWith('user-1', {
      email: 'seller@example.com',
      phone: null,
    })
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Step 3 completed successfully',
      }),
    )
  })

  it('returns a clear 400 if the final step phone belongs to another user', async () => {
    ;(findUserById as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'seller@example.com',
      phone: null,
    })
    ;(getProfileByUserId as jest.Mock).mockResolvedValue({ companyInfo: {} })
    ;(findUserByPhone as jest.Mock).mockResolvedValue({ id: 'user-2' })

    const req = {
      user: { sub: 'user-1' },
      body: {
        step: 3,
        data: {
          basicInfo: {
            email: 'seller@example.com',
            phone: '9876543210',
          },
          businessLegal: {},
        },
      },
    }
    const res = makeResponse()

    await completeRegistration(req, res as any)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      error: 'Phone already linked to another account',
      user: {},
    })
    expect(upsertUserProfile).not.toHaveBeenCalled()
    expect(updateUser).not.toHaveBeenCalled()
  })
})
