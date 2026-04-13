import { useMemo } from 'react'
import { usePickupAddresses } from './Pickup/usePickupAddresses'
import { useWalletBalance } from './useWalletBalance'
import { usePaymentOptions } from './usePaymentOptions'
import { useAuth } from '../context/auth/AuthContext'

type CompanyInfoLike = {
  businessName?: string
  companyAddress?: string
  companyEmail?: string
  companyContactNumber?: string
  contactNumber?: string
  contactEmail?: string
  state?: string
  city?: string
  pincode?: string
}

const requiredCompanyFields = [
  'businessName',
  'companyAddress',
  'companyEmail',
  'companyContactNumber',
  'contactNumber',
  'contactEmail',
  'state',
  'city',
  'pincode',
] as const

const hasRequiredCompanyInfo = (companyInfo: CompanyInfoLike | null | undefined) => {
  if (!companyInfo) return false

  return requiredCompanyFields.every((field) => {
    const value = companyInfo[field]
    return typeof value === 'string' ? value.trim().length > 0 : Boolean(value)
  })
}

export const useMerchantReadiness = () => {
  const { user, loading: authLoading } = useAuth()
  const { data: pickupData, isLoading: pickupLoading } = usePickupAddresses({ page: 1, limit: 1 })
  const { data: walletData, isLoading: walletLoading } = useWalletBalance()
  const { data: paymentOptions, isLoading: paymentOptionsLoading } = usePaymentOptions()

  const walletBalance = Number(walletData?.data?.balance || 0)
  const requiredWalletBalance = Math.max(Number(paymentOptions?.minWalletRecharge || 0), 1)
  const hasPickupAddress =
    Number(pickupData?.totalCount || 0) > 0 || (pickupData?.pickupAddresses?.length || 0) > 0
  const hasCompanyInfo = hasRequiredCompanyInfo(user?.companyInfo)
  const assignedPlanName = user?.currentPlanName?.trim() || null
  const assignedPlanId = user?.currentPlanId || null

  const checklist = useMemo(
    () => [
      {
        key: 'onboarding',
        title: 'Panel Setup Completed',
        description: 'Finish the onboarding flow so your seller panel is ready for booking.',
        done: Boolean(user?.onboardingComplete),
        path: '/onboarding-questions',
        actionLabel: 'Complete Panel Setup',
      },
      {
        key: 'company',
        title: 'Company Details Added',
        description: 'Add business identity, address, and primary contact details.',
        done: hasCompanyInfo,
        path: '/profile/company',
        actionLabel: 'Add Company Details',
      },
      {
        key: 'approval',
        title: 'Account Approval',
        description: 'Wait for internal review to approve the account for live operations.',
        done: Boolean(user?.approved),
        path: '/support/tickets',
        actionLabel: 'Contact Support',
      },
      {
        key: 'kyc',
        title: 'KYC Details Verified',
        description: 'KYC must be verified before order creation is enabled.',
        done: user?.domesticKyc?.status === 'verified',
        path: '/profile/kyc_details',
        actionLabel: 'Complete KYC Details',
      },
      {
        key: 'pickup',
        title: 'Pickup Addresses Added',
        description: 'Add at least one pickup location for shipment origin.',
        done: hasPickupAddress,
        path: '/settings/manage_pickups',
        actionLabel: 'Add Pickup Address',
      },
      {
        key: 'wallet',
        title: 'Wallet Balance Ready',
        description: `Keep at least Rs ${requiredWalletBalance.toLocaleString('en-IN')} available for first-order charges.`,
        done: walletBalance >= requiredWalletBalance,
        path: '/billing/wallet_transactions',
        actionLabel: 'Recharge Wallet',
      },
    ],
    [hasCompanyInfo, hasPickupAddress, requiredWalletBalance, user, walletBalance],
  )

  const completedCount = checklist.filter((item) => item.done).length
  const totalCount = checklist.length
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const isReady = completedCount === totalCount
  const firstIncompleteStep = checklist.find((item) => !item.done) || null

  return {
    checklist,
    completedCount,
    totalCount,
    progress,
    isReady,
    firstIncompleteStep,
    walletBalance,
    requiredWalletBalance,
    assignedPlanName,
    assignedPlanId,
    isLoading: authLoading || pickupLoading || walletLoading || paymentOptionsLoading,
  }
}
