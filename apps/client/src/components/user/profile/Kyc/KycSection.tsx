import { Box, Skeleton } from '@mui/material'
import { useState } from 'react'
import { useUserKyc } from '../../../../hooks/User/Kyc/UseKyc'
import { useUserProfile } from '../../../../hooks/User/useUserProfile'
import KycDetailsCard from './KycDetailsCard'
import KYCVerificationStep from './KycVerificationSection'

const KycSection = () => {
  // Always fetch the authenticated user's profile inside protected routes
  const { isLoading } = useUserProfile(true)
  const [editingKyc, setEditingKyc] = useState(false)
  const { data: kycData, isLoading: loadingKyc } = useUserKyc()

  const hasKycDetails = !!kycData?.kyc && Object.keys(kycData.kyc).length > 0

  // Once KYC is submitted, always show the details card (even if status is "pending"),
  // and only show the multi-step form when there are no details yet or when explicitly editing.
  const showDetailsCard = hasKycDetails && !editingKyc

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" width="100%">
        <Skeleton
          width="100%"
          height={300}
          variant="rectangular"
          sx={{
            borderRadius: 3,
            bgcolor: '#F5F7FA',
            '&::after': {
              background:
                'linear-gradient(90deg, transparent, rgba(51, 51, 105, 0.08), transparent)',
            },
          }}
        />
      </Box>
    )
  }

  return (
    <Box display="flex" justifyContent="center" width="100%">
      {showDetailsCard ? (
        <KycDetailsCard
          kyc={kycData?.kyc ?? {}}
          isLoading={loadingKyc}
          onEdit={() => setEditingKyc(true)}
        />
      ) : (
        <KYCVerificationStep
          existingKyc={kycData?.kyc ?? {}}
          editing={editingKyc}
          onCancelEdit={() => setEditingKyc(false)}
          onComplete={() => setEditingKyc(false)}
        />
      )}
    </Box>
  )
}

export default KycSection
