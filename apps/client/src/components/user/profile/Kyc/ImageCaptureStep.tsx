import { Alert, Box, Button, Stack, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { MdCheckCircleOutline } from 'react-icons/md'
import { usePresignedDownloadUrls } from '../../../../hooks/Uploads/usePresignedDownloadUrls'
import { useMediaPipeFace } from '../../../../hooks/useMediaPipe'
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

  useEffect(() => {
    if (img && presignedUrls) {
      setCaptured(presignedUrls as string)
    } else if (img && !presignedUrls) {
      setCaptured(img)
    }
  }, [img, presignedUrls])

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
    setError('')
  }

  const borderColor = () => {
    if (captured || img) return isValid ? 'green' : 'orange'
    if (error) return 'red'
    if (!detected) return 'gray'
    if (!canCapture) return 'orange'
    return 'green'
  }

  return (
    <Box textAlign="center">
      <Typography variant="h6" mb={3} fontWeight={700} color="#333369">
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

      {!captured ? (
        <Button
          sx={{
            mt: 3,
            px: 4,
            py: 1.5,
            fontWeight: 600,
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(51, 51, 105, 0.2)',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 6px 16px rgba(51, 51, 105, 0.3)',
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
                borderColor: '#E0E6ED',
                color: '#E74C3C',
                '&:hover': {
                  bgcolor: 'rgba(231, 76, 60, 0.1)',
                  borderColor: '#E74C3C',
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
              bgcolor: 'rgba(61, 213, 152, 0.1)',
              border: '1px solid rgba(61, 213, 152, 0.3)',
              color: '#1A1A1A',
              '& .MuiAlert-icon': {
                color: '#3DD598',
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
