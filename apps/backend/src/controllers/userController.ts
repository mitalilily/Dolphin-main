import { Response } from 'express'
import { getProfileByUserId, upsertUserProfile } from '../models/services/userProfile.service'
import {
  findUserByEmail,
  findUserById,
  findUserByPhone,
  updateUser,
} from '../models/services/userService'

const normalizeEmailInput = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim().toLowerCase() : ''

const normalizePhoneInput = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.replace(/\D/g, '') : ''

export const getCurrentUser = async (req: any, res: Response): Promise<any> => {
  try {
    const { sub: userId } = req?.user

    const user = await findUserById(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.status(200).json({
      data: user,
      message: 'User data fetched successfully!',
    })
  } catch (err) {
    console.error('Error in /users/me:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

export const getUserById = async (req: any, res: Response) => {
  try {
    const user = await findUserById(req.params.userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    return res.status(200).json({
      data: user,
      message: 'User data fetched successfully!',
    })
  } catch (err) {
    console.error('Error in /users/me:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}

export const completeRegistration = async (req: any, res: Response): Promise<any> => {
  const { step, data } = req.body
  const { sub: userId } = req?.user

  if (!step || !data || !userId) {
    return res.status(400).json({ error: 'User ID, step, and data are required' })
  }

  try {
    const user = await findUserById(userId)
    const userProfile = await getProfileByUserId(userId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    let updates: any = {}
    const isOnlyB2B =
      Array.isArray(data?.businessLegal?.businessCategory) &&
      data.businessLegal.businessCategory.length === 1 &&
      data.businessLegal.businessCategory[0]?.toLowerCase() === 'b2b'

    const phoneDigits = normalizePhoneInput(data?.basicInfo?.phone)
    const profilePhoneDigits = normalizePhoneInput(userProfile?.companyInfo?.contactNumber)
    const userPhoneDigits = normalizePhoneInput(user.phone)
    const canonicalPhone = phoneDigits || profilePhoneDigits || userPhoneDigits || null

    const emailLower = normalizeEmailInput(data?.basicInfo?.email)
    const profileEmailLower = normalizeEmailInput(userProfile?.companyInfo?.contactEmail)
    const userEmailLower = normalizeEmailInput(user.email)
    const canonicalEmail = emailLower || profileEmailLower || userEmailLower

    if (phoneDigits && !/^\d{10}$/.test(phoneDigits)) {
      return res.status(400).json({ error: 'Enter a valid 10-digit phone number' })
    }

    if (canonicalPhone) {
      const other = await findUserByPhone(canonicalPhone)
      if (other && other.id !== userId) {
        return res.status(400).json({
          error: 'Phone already linked to another account',
          user: {},
        })
      }
    }

    if (canonicalEmail) {
      const other = await findUserByEmail(canonicalEmail)
      if (other && other.id !== userId) {
        return res.status(400).json({
          error: 'Email already linked to another account',
          user: {},
        })
      }
    }

    switch (step) {
      /* ─────────────────────────── STEP 1 ─────────────────────────── */
      case 1: {
        /* --- Validate phone (10 digits) --- */
        if (phoneDigits && !/^\d{10}$/.test(phoneDigits)) {
          return res.status(400).json({ error: 'Enter a valid 10‑digit phone number' })
        }

        /* --- Uniqueness checks --- */
        if (phoneDigits) {
          const other = await findUserByPhone(phoneDigits)
          if (other && other.id !== userId) {
            return res.status(400).json({
              error: 'Phone already linked to another account',
              user: {},
            })
          }
        }

        if (emailLower) {
          const other = await findUserByEmail(emailLower)
          if (other && other.id !== userId) {
            return res.status(400).json({
              error: 'Email already linked to another account',
              user: {},
            })
          }
        }

        updates = {
          companyInfo: {
            contactPerson: `${data?.basicInfo?.firstName} ${data?.basicInfo?.lastName}`,
            contactEmail: canonicalEmail || '',
            contactNumber: canonicalPhone || '',
            pincode: data?.basicInfo?.pincode,
            state: data?.basicInfo?.state,
            POCEmailVerified: user?.emailVerified,
            POCPhoneVerified: user?.phoneVerified,
            businessName: data?.basicInfo?.companyName,
            city: data?.basicInfo?.city,
            profilePicture: user?.profilePicture,
          },
          onboardingStep: 1,
          profileComplete: false,
          onboardingComplete: false,
        }
        break
      }

      /* ─────────────────────────── STEP 2 ─────────────────────────── */
      case 2:
        updates = {
          companyInfo: {
            ...userProfile?.companyInfo,
            brandName: data?.businessLegal?.brandName,
          },
          businessType: data?.businessLegal?.businessCategory,
          monthlyOrderCount: data?.businessLegal?.monthlyShipments,
          onboardingComplete: false,
          onboardingStep: 2,
        }
        break

      /* ─────────────────────────── STEP 3 ─────────────────────────── */
      case 3:
        updates = {
          onboardingStep: -1,
          onboardingComplete: true,
          businessType: data?.businessLegal?.businessCategory,
          monthlyOrderCount: data?.businessLegal?.monthlyShipments,
          companyInfo: {
            ...userProfile?.companyInfo,
            contactPerson:
              `${data?.basicInfo?.firstName ?? ''} ${data?.basicInfo?.lastName ?? ''}`.trim() ||
              userProfile?.companyInfo?.contactPerson,
            contactEmail: canonicalEmail || '',
            contactNumber: canonicalPhone || '',
            pincode: data?.basicInfo?.pincode || userProfile?.companyInfo?.pincode,
            state: data?.basicInfo?.state || userProfile?.companyInfo?.state,
            businessName: data?.basicInfo?.companyName || userProfile?.companyInfo?.businessName,
            city: data?.basicInfo?.city || userProfile?.companyInfo?.city,
            brandName: data?.businessLegal?.brandName || userProfile?.companyInfo?.brandName,
            website: data?.basicInfo?.personalWebsite,
          },
        }
        break

      default:
        return res.status(400).json({ error: 'Invalid step' })
    }

    const updatedUser = await upsertUserProfile(userId, updates)
    await updateUser(userId, {
      email: canonicalEmail || user.email,
      phone: canonicalPhone,
    })

    return res.json({
      message: `Step ${step} completed successfully`,
      user: updatedUser,
    })
  } catch (error) {
    console.error('Registration step error:', error)
    return res.status(500).json({ error: 'Failed to complete registration step' })
  }
}
