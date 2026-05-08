import { Alert, Box, Button, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import React, { useEffect, useState } from 'react'
import { MdCheckCircleOutline } from 'react-icons/md'
import { usePresignedDownloadUrls } from '../../../../hooks/Uploads/usePresignedDownloadUrls'
import { useMediaPipeFace } from '../../../../hooks/useMediaPipe'
import { brand } from '../../../../theme/brand'
interface Props {
  onCapture: (img: string) => void
  img: string
}

const ImageCaptureStep: React.FC<Props> = ({ onCapture, img }) => {
  const { webcamRef, detected, lowLight, offCenter, faceCovered, isLoading, error, setError } =
    useMediaPipeFace()

  const [captured, setCaptured] = useState<string | null>(null)
  const [isValid, setIsValid] = useState(false)

  const { data: presignedUrls } = usePresignedDownloadUrls({
    keys: img,
    enabled: !!img && !img.startsWith('data'),
  })

  const resolvedPresignedUrl = Array.isArray(presignedUrls) ? presignedUrls[0] : presignedUrls

  useEffect(() => {
    if (img && resolvedPresignedUrl) {
      setCaptured(resolvedPresignedUrl)
      setIsValid(true)
    } else if (img && !resolvedPresignedUrl) {
      setCaptured(img)
      setIsValid(true)
    }
  }, [img, resolvedPresignedUrl])

  // Report validity upward

  const canCapture = detected && !lowLight && !offCenter && !faceCovered && !error && !isLoading

  const captureSelfie = () => {
    if (!canCapture || !webcamRef.current) return

    const video = webcamRef.current
    const c = document.createElement('canvas')
    c.width = video.videoWidth
    c.height = video.videoHeight
    const ctx = c.getContext('2d')!
    ctx.translate(c.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0)

    onCapture(c?.toDataURL('image/jpeg'))
    setIsValid(true)
  }

  const reset = () => {
    setCaptured(null)
    setIsValid(false)
    onCapture('')
    setError('')
  }

  const borderColor = () => {
    if (captured || img) return isValid ? brand.success : brand.warning
    if (error) return brand.danger
    if (!detected) return alpha(brand.ink, 0.32)
    if (!canCapture) return brand.warning
    return brand.success
  }

  return (
    <Box textAlign="center">
      <Typography variant="h6" mb={3} fontWeight={700} color={brand.ink}>
        Align your face and take a selfie
      </Typography>

      <Box
        sx={{
          width: 280,
          height: 280,
          mx: 'auto',
          borderRadius: '50%',
          border: `4px dotted ${borderColor()}`,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <video
          ref={webcamRef}
          autoPlay
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: 'scaleX(-1)',
            display: captured ? 'none' : 'block',
          }}
        />
        {captured && (
          <img
            src={captured}
            alt="Selfie"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%',
            }}
          />
        )}
      </Box>

      {(lowLight || offCenter || faceCovered) && !captured && (
        <Alert sx={{ m: 1 }} severity="warning">
          {lowLight
            ? 'Please ensure you are in a well-lit environment.'
            : offCenter
            ? 'Center your face within the frame.'
            : 'Make sure your face is clearly visible without any obstructions.'}
        </Alert>
      )}

      {error && !captured && (
        <Alert sx={{ m: 1 }} severity="error">
          {error}
        </Alert>
      )}

      {!captured ? (
        <Button
          sx={{
            mt: 3,
            px: 4,
            py: 1.5,
            fontWeight: 600,
            borderRadius: 2,
            bgcolor: brand.ink,
            boxShadow: `0 12px 24px ${alpha(brand.ink, 0.14)}`,
            '&:hover': {
              transform: 'translateY(-1px)',
              bgcolor: brand.ink,
              boxShadow: `0 16px 28px ${alpha(brand.ink, 0.18)}`,
            },
            transition: 'all 0.3s ease',
          }}
          variant="contained"
          disabled={!canCapture}
          onClick={captureSelfie}
        >
          Take Selfie
        </Button>
      ) : (
        <Stack gap={2} justifyContent={'center'} mt={3}>
          <Box display={'flex'} justifyContent={'center'}>
            <Button
              sx={{
                width: 'max-content',
                px: 3,
                py: 1,
                fontWeight: 600,
                borderRadius: 2,
                borderColor: alpha(brand.danger, 0.24),
                color: brand.danger,
                '&:hover': {
                  bgcolor: alpha(brand.danger, 0.08),
                  borderColor: brand.danger,
                },
              }}
              variant="outlined"
              onClick={reset}
            >
              Retake
            </Button>
          </Box>
          <Alert
            icon={<MdCheckCircleOutline fontSize="inherit" />}
            severity="success"
            sx={{
              bgcolor: alpha(brand.success, 0.1),
              border: `1px solid ${alpha(brand.success, 0.3)}`,
              color: brand.ink,
              '& .MuiAlert-icon': {
                color: brand.success,
              },
            }}
          >
            Your selfie has been successfully verified
          </Alert>
        </Stack>
      )}
    </Box>
  )
}

export default ImageCaptureStep
