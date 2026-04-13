import { Box, Button, IconButton, Stack, Typography } from '@mui/material'
import { saveAs } from 'file-saver'
import { MdContentCopy, MdDownload } from 'react-icons/md'
import CustomInput from '../../../components/UI/inputs/CustomInput'
import CustomDialog from '../../../components/UI/modal/CustomModal'
import { brand } from '../../../theme/brand'

interface ViewWebhookSecretModalProps {
  open: boolean
  onClose: () => void
  webhook: {
    secret: string
    name: string | null
    url: string
  } | null
  copiedSecret: string | null
  onCopy: (text: string, label: string) => void
}

export const ViewWebhookSecretModal = ({
  open,
  onClose,
  webhook,
  copiedSecret,
  onCopy,
}: ViewWebhookSecretModalProps) => {
  if (!webhook) return null

  const handleDownloadCredentials = () => {
    const timestamp = new Date().toISOString()
    const fileName = `dolphin-webhook-secret-${(webhook.name || 'webhook').replace(
      /\s/g,
      '-',
    )}-${timestamp.split('T')[0]}.txt`
    const fileContent = `
Dolphin Enterprise Webhook Secret
Generated: ${timestamp}
Webhook Name: ${webhook.name || 'Unnamed'}
Webhook URL: ${webhook.url}

IMPORTANT: Keep this secret secure and never share it publicly.
Use this secret to verify webhook signatures using HMAC SHA256.

Webhook Secret:
${webhook.secret}

---
This file contains sensitive credentials. Store it securely and never commit it to version control.
    `.trim()

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' })
    saveAs(blob, fileName)
  }

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Webhook Secret"
      maxWidth="sm"
      footer={
        <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
          <Button
            variant="outlined"
            onClick={handleDownloadCredentials}
            startIcon={<MdDownload />}
            fullWidth
            sx={{
              borderColor: brand.ink,
              color: brand.ink,
              '&:hover': {
                borderColor: brand.ink,
                bgcolor: 'rgba(255, 255, 255, 0.78)',
              },
            }}
          >
            Download Secret
          </Button>
          <Button variant="contained" onClick={onClose} fullWidth>
            I've saved the secret
          </Button>
        </Stack>
      }
    >
      <Stack spacing={3}>
        <Box
          sx={{
            p: 2,
            bgcolor: 'rgba(255, 248, 239, 0.96)',
            borderRadius: '22px',
            border: '1px solid',
            borderColor: 'rgba(245, 158, 11, 0.24)',
          }}
        >
          <Typography sx={{ fontWeight: 600, color: brand.ink, mb: 1, fontSize: '0.875rem' }}>
            Important: Save this secret securely
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: brand.inkSoft, m: 0, mt: 1 }}>
            You will not be able to view the webhook secret again after closing this dialog. Use
            this secret to verify webhook signatures using HMAC SHA256.
          </Typography>
        </Box>
        <Box>
          <Typography
            sx={{
              fontSize: '13px',
              color: brand.ink,
              fontWeight: 500,
              mb: 0.5,
            }}
          >
            Webhook Secret
          </Typography>
          <CustomInput
            value={webhook.secret}
            topMargin={false}
            disabled
            postfix={
              <IconButton
                onClick={() => onCopy(webhook.secret, 'secret')}
                size="small"
                sx={{
                  color: copiedSecret === 'secret' ? brand.success : brand.ink,
                  '&:hover': { bgcolor: 'rgba(16, 50, 74, 0.08)' },
                }}
              >
                <MdContentCopy size={18} />
              </IconButton>
            }
          />
        </Box>
        <Box>
          <Typography
            sx={{
              fontSize: '13px',
              color: brand.ink,
              fontWeight: 500,
              mb: 0.5,
            }}
          >
            Webhook URL
          </Typography>
          <CustomInput value={webhook.url} disabled topMargin={false} />
        </Box>
      </Stack>
    </CustomDialog>
  )
}
