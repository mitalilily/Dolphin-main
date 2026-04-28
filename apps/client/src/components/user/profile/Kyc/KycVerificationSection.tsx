import { Box, Button, Container, Grid, Paper, Step, StepLabel, Stepper } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import React, { useEffect, useRef, useState } from 'react'
import { IoChevronBack, IoChevronForward } from 'react-icons/io5'
import axiosInstance from '../../../../api/axiosInstance'
import { useSubmitKyc } from '../../../../hooks/User/Kyc/UseKyc'
import type { BusinessStructure, CompanyType } from '../../../../types/generic.types'
import type { KycDetails } from '../../../../types/user.types'
import { dataUrlToFile } from '../../../../utils/functions'
import { toast } from '../../../UI/Toast'
import AdditionalDetailsStep, { type AdditionalKYCForm } from './AdditionalInfoStep'
import { BusinessStructureStep } from './BusinessStructureStep'
import ImageCaptureStep from './ImageCaptureStep'

const steps = ['Business Structure', 'Selfie', 'Additional Details']
const KYC_INLINE_UPLOAD_ONLY = true

const KYCVerificationStep: React.FC<{
  editing?: boolean
  onCancelEdit?: () => void
  onComplete?: () => void
  existingKyc?: KycDetails | null
}> = ({ editing = false, onCancelEdit, onComplete, existingKyc = null }) => {
  const queryClient = useQueryClient()
  const { mutateAsync, isPending } = useSubmitKyc()

  const [activeStep, setActiveStep] = useState(0)
  const [kycData, setKycData] = useState<Partial<KycDetails>>({})
  const kycDataRef = useRef<Partial<KycDetails>>({})
  const [isStepValid, setIsStepValid] = useState(false)

  const updateKycData = (newData: Partial<KycDetails>) => {
    setKycData((prev) => {
      const updated = { ...prev, ...newData }
      kycDataRef.current = updated
      return updated
    })
  }

  // Prefill when editing mode is on
  useEffect(() => {
    if (editing && existingKyc) {
      const initial = { ...existingKyc }
      setKycData(initial)
      kycDataRef.current = initial
      if (existingKyc.structure) setIsStepValid(true)
    }
  }, [editing, existingKyc])

  const handleBusinessStructureChange = (value: BusinessStructure | CompanyType, key: string) => {
    updateKycData({
      ...(key === 'structure' ? { structure: value as BusinessStructure } : {}),
      ...(key === 'companyType' ? { companyType: value as CompanyType } : {}),
    })
    setIsStepValid(true)
  }

  const handleSelfieCapture = (img: string) => {
    updateKycData({ selfieUrl: img })
    setIsStepValid(true)
  }

  const handleAdditionalInfoChange = async (value: AdditionalKYCForm) => {
    return new Promise<void>((resolve) => {
      updateKycData(value)
      setIsStepValid(true)
      resolve()
    })
  }

  const handleFinalSubmit = async (data: AdditionalKYCForm) => {
    await handleAdditionalInfoChange(data)
    handleNext()
  }

  useEffect(() => {
    if (kycData?.selfieUrl) setIsStepValid(true)
  }, [kycData?.selfieUrl])

  const handleNext = async () => {
    const data = kycDataRef.current

    if (
      activeStep === 0 &&
      (!data.structure || (data?.structure === 'company' && !data?.companyType))
    ) {
      return
    }

    if (activeStep === 1 && !data.selfieUrl) return

    if (isStepValid && activeStep === 2) {
      try {
        toast.open({ message: 'Submitting KYC details...', severity: 'info' })

        let selfieUrl = data?.selfieUrl ?? ''

        if (selfieUrl.startsWith('data:image') && !KYC_INLINE_UPLOAD_ONLY) {
          const file = dataUrlToFile(selfieUrl, 'selfie.jpg')

          if (file.size / 1024 / 1024 > 5) {
            throw new Error('Selfie exceeds 5MB limit')
          }

          try {
            const { data: presign } = await axiosInstance.post('/uploads/presign', {
              contentType: file.type,
              filename: file.name,
              folder: 'kyc',
            })

            if (!presign?.uploadUrl || typeof presign.uploadUrl !== 'string') {
              throw new Error('Presigned upload URL missing for selfie upload')
            }

            await axios.put(presign.uploadUrl, file, {
              headers: { 'Content-Type': file.type },
              withCredentials: false,
            })

            selfieUrl = presign?.key
          } catch (uploadErr) {
            console.warn('[KYC] Selfie upload failed; using inline fallback.', uploadErr)
            toast.open({
              message: 'Selfie upload failed on storage. Using inline demo fallback.',
              severity: 'warning',
            })
          }
        }

        if (selfieUrl.startsWith('data:image') && KYC_INLINE_UPLOAD_ONLY) {
          toast.open({
            message: 'Using inline demo upload mode for selfie.',
            severity: 'info',
          })
        }

        const result = await mutateAsync({
          details: {
            ...data,
            selfieUrl,
          },
        })

        toast.open({
          message: result?.message ?? 'KYC details submitted successfully!',
          severity: 'success',
        })

        // Refresh both the dedicated KYC query and the overall user profile
        // so that status and details are up to date when the user revisits the KYC page.
        queryClient.invalidateQueries({ queryKey: ['userKyc'] })
        queryClient.invalidateQueries({ queryKey: ['userProfile'] })

        if (onComplete) {
          // After a successful submission (new or edit), let the parent decide what to show next.
          onComplete()
        } else {
          setActiveStep((prev) => Math.min(prev + 1, steps.length - 1))
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        toast.open({
          message: err?.response?.data?.message ?? err?.message ?? 'Failed to submit KYC details',
          severity: 'error',
        })

        if (data.selfieUrl?.startsWith('data:image')) {
          updateKycData({ selfieUrl: undefined })
        }

        setIsStepValid(false)
      }

      return
    }

    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0))
    setIsStepValid(true)
  }

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <BusinessStructureStep
            defaultValue={{
              structure: kycData.structure ?? 'individual',
              companyType: kycData.companyType ?? undefined,
            }}
            value={{
              structure: kycData.structure ?? 'individual',
              companyType: kycData.companyType ?? undefined,
            }}
            onChange={handleBusinessStructureChange}
          />
        )
      case 1:
        return <ImageCaptureStep img={kycData?.selfieUrl ?? ''} onCapture={handleSelfieCapture} />
      default:
        return (
          <AdditionalDetailsStep
            structure={kycData?.structure}
            companyType={kycData?.companyType}
            defaultValue={kycData}
            onComplete={(data) => handleFinalSubmit(data ?? {})}
          />
        )
    }
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 9 }} order={{ md: 1, xs: 2 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 3,
              bgcolor: '#FFFFFF',
              border: '1px solid #E0E6ED',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #333369 0%, #3DD598 100%)',
                borderRadius: '12px 12px 0 0',
              },
            }}
          >
            <Box display="flex" mb={3} justifyContent="space-between" alignItems="center">
              <Button
                variant="outlined"
                onClick={handleBack}
                startIcon={<IoChevronBack />}
                disabled={activeStep === 0}
                sx={{
                  borderColor: '#E0E6ED',
                  color: '#333369',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: '#F5F7FA',
                    borderColor: '#333369',
                  },
                }}
              >
                Back
              </Button>

              <Box display="flex" gap={2}>
                {editing && (
                  <Button
                    variant="outlined"
                    onClick={onCancelEdit}
                    sx={{
                      borderColor: '#E0E6ED',
                      color: '#E74C3C',
                      fontWeight: 600,
                      '&:hover': {
                        bgcolor: 'rgba(231, 76, 60, 0.1)',
                        borderColor: '#E74C3C',
                      },
                    }}
                  >
                    Cancel Editing
                  </Button>
                )}

                {activeStep !== steps.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!isStepValid || isPending}
                    endIcon={<IoChevronForward />}
                    sx={{
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(51, 51, 105, 0.2)',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 6px 16px rgba(51, 51, 105, 0.3)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {'Next'}
                  </Button>
                ) : null}
              </Box>
            </Box>
            {renderStepContent()}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }} order={{ md: 2, xs: 1 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 3,
              bgcolor: '#FFFFFF',
              border: '1px solid #E0E6ED',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              position: 'sticky',
              top: 24,
            }}
          >
            <Stepper
              activeStep={activeStep}
              orientation="vertical"
              sx={{
                '& .MuiStepLabel-label': {
                  color: '#4A5568',
                  fontWeight: 500,
                  '&.Mui-active': {
                    color: '#333369',
                    fontWeight: 700,
                  },
                  '&.Mui-completed': {
                    color: '#3DD598',
                    fontWeight: 600,
                  },
                },
                '& .MuiStepIcon-root': {
                  color: '#E0E6ED',
                  '&.Mui-active': {
                    color: '#333369',
                  },
                  '&.Mui-completed': {
                    color: '#3DD598',
                  },
                },
              }}
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}

export default KYCVerificationStep
