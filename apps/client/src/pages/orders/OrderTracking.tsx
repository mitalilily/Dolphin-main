import {
  Alert,
  alpha,
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Paper,
  Stack,
  Step,
  StepConnector,
  StepLabel,
  Stepper,
  styled,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  FaBoxOpen,
  FaBuilding,
  FaExclamationTriangle,
  FaSearch,
  FaShippingFast,
  FaStore,
  FaTruck,
} from 'react-icons/fa'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  isValidTrackingContact,
  normalizeAwbParam,
  normalizeContactParam,
} from '../../api/tracking.service'
import { useTracking } from '../../hooks/Orders/useTracking'

const stages = [
  { label: 'Booked', icon: <FaStore /> },
  { label: 'Pending Pickup', icon: <FaBuilding /> },
  { label: 'In Transit', icon: <FaTruck /> },
  { label: 'Out for Delivery', icon: <FaShippingFast /> },
  { label: 'Delivered', icon: <FaBoxOpen /> },
]

const statusLabels: Record<string, string> = {
  BK: 'Booked',
  PP: 'Pending Pickup',
  IT: 'In Transit',
  OFD: 'Out for Delivery',
  DL: 'Delivered',
  CAN: 'Cancelled',
  RT: 'RTO',
  'RT-IT': 'RTO In Transit',
  'RT-DL': 'RTO Delivered',
  EX: 'Exception',
}

const DE_BLUE = '#0052CC'
const BACKGROUND = '#F4F5F7'

const ColorConnector = styled(StepConnector)(() => ({
  '& .MuiStepConnector-alternativeLabel': { top: 22 },
  '&.Mui-active .MuiStepConnector-line': { backgroundColor: DE_BLUE },
  '&.Mui-completed .MuiStepConnector-line': { backgroundColor: '#36B37E' },
  '& .MuiStepConnector-line': {
    height: 4,
    border: 0,
    backgroundColor: '#DFE1E6',
    borderRadius: 1,
  },
}))

const getStatusCode = (value?: string | null) => {
  const raw = (value || '').trim()
  const compact = raw.toUpperCase().replace(/\s+/g, '-')
  if (statusLabels[compact]) return compact

  const text = raw.toLowerCase()
  if (text.includes('cancel')) return 'CAN'
  if (text.includes('rto') && text.includes('deliver')) return 'RT-DL'
  if (text.includes('rto')) return 'RT'
  if (text.includes('deliver')) return 'DL'
  if (text.includes('out for delivery')) return 'OFD'
  if (text.includes('transit') || text.includes('shipped') || text.includes('dispatch')) return 'IT'
  if (text.includes('pickup')) return 'PP'
  if (text.includes('book') || text.includes('created') || text.includes('manifest')) return 'BK'
  return compact || 'BK'
}

const getStageIndex = (value?: string | null) => {
  const code = getStatusCode(value)
  if (code === 'DL') return 4
  if (code === 'OFD') return 3
  if (code === 'IT') return 2
  if (code === 'PP') return 1
  return 0
}

type Mode = 'awb' | 'order'

export default function TrackingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const awb = searchParams.get('awb') || ''
  const order = searchParams.get('orderNumber') || ''
  const contact = searchParams.get('contact') || ''
  const hasLookup = Boolean(awb || (order && contact))

  const [mode, setMode] = useState<Mode>(order && contact ? 'order' : 'awb')
  const [form, setForm] = useState({
    awb,
    orderNumber: order,
    contact,
  })
  const [formError, setFormError] = useState('')

  useEffect(() => {
    setMode(order && contact ? 'order' : 'awb')
    setForm({ awb, orderNumber: order, contact })
    setFormError('')
  }, [awb, order, contact])

  const { data: trackingData, isLoading, error, isFetching } = useTracking(awb, order, contact)

  const sortedHistory = useMemo(() => {
    if (!trackingData?.history) return []
    return [...trackingData.history].sort(
      (a, b) => new Date(b.event_time).getTime() - new Date(a.event_time).getTime(),
    )
  }, [trackingData])

  const currentStage = getStageIndex(
    trackingData?.status_code || sortedHistory[0]?.status_code || trackingData?.status,
  )
  const statusCode = getStatusCode(trackingData?.status_code || trackingData?.status)
  const isCancelled = statusCode === 'CAN'
  const isRTO = statusCode.startsWith('RT')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')

    const params = new URLSearchParams()
    if (mode === 'awb') {
      const nextAwb = normalizeAwbParam(form.awb)
      if (nextAwb.length < 4) {
        setFormError('Enter a valid AWB number.')
        return
      }
      params.set('awb', nextAwb)
    } else {
      const orderNumber = form.orderNumber.trim()
      const nextContact = normalizeContactParam(form.contact)
      if (orderNumber.length < 3 || !isValidTrackingContact(form.contact)) {
        setFormError('Enter a valid order number and email or phone.')
        return
      }
      params.set('orderNumber', orderNumber)
      params.set('contact', nextContact)
    }

    navigate(`/tracking?${params.toString()}`)
  }

  const renderLookupForm = () => (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      elevation={0}
      sx={{
        p: { xs: 3, md: 4 },
        borderRadius: 1,
        border: `1px solid ${alpha(DE_BLUE, 0.1)}`,
        bgcolor: '#FFFFFF',
      }}
    >
      <Stack spacing={3}>
        <Stack spacing={0.5}>
          <Typography variant="caption" sx={{ color: DE_BLUE, fontWeight: 900, letterSpacing: 1 }}>
            SHIPMENT TRACKING
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#172B4D' }}>
            Track your shipment
          </Typography>
          <Typography variant="body2" sx={{ color: '#42526E', maxWidth: 620 }}>
            Enter your AWB number, or use your order number with the email or phone used for the shipment.
          </Typography>
        </Stack>

        <ToggleButtonGroup
          exclusive
          value={mode}
          onChange={(_, value: Mode | null) => {
            if (value) {
              setMode(value)
              setFormError('')
            }
          }}
          size="small"
        >
          <ToggleButton value="awb">AWB Number</ToggleButton>
          <ToggleButton value="order">Order Details</ToggleButton>
        </ToggleButtonGroup>

        {mode === 'awb' ? (
          <TextField
            label="AWB Number"
            value={form.awb}
            onChange={(event) => setForm((prev) => ({ ...prev, awb: event.target.value }))}
            placeholder="e.g. SR123456789IN"
            fullWidth
          />
        ) : (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Order Number"
                value={form.orderNumber}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, orderNumber: event.target.value }))
                }
                placeholder="e.g. ORD-2026-0001"
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Email or Phone"
                value={form.contact}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, contact: event.target.value }))
                }
                placeholder="you@example.com or +91 98765 43210"
                fullWidth
              />
            </Grid>
          </Grid>
        )}

        {formError && <Alert severity="error">{formError}</Alert>}

        <Box>
          <Button
            type="submit"
            variant="contained"
            startIcon={<FaSearch />}
            disabled={isFetching}
            sx={{
              bgcolor: DE_BLUE,
              fontWeight: 800,
              '&:hover': { bgcolor: '#0043A4' },
            }}
          >
            {isFetching ? 'Tracking...' : 'Track Shipment'}
          </Button>
        </Box>
      </Stack>
    </Paper>
  )

  return (
    <Box sx={{ bgcolor: BACKGROUND, minHeight: '100vh', py: { xs: 4, md: 8 } }}>
      <Container maxWidth="lg">
        <Stack spacing={4}>
          {renderLookupForm()}

          {isLoading && hasLookup && (
            <Paper elevation={0} sx={{ p: 5, borderRadius: 1, textAlign: 'center' }}>
              <Box
                sx={{
                  mx: 'auto',
                  width: 70,
                  height: 70,
                  borderRadius: 1,
                  border: `6px solid ${alpha(DE_BLUE, 0.1)}`,
                  borderTopColor: DE_BLUE,
                  animation: 'spin 1.2s linear infinite',
                  mb: 2,
                }}
              />
              <Typography variant="h6" sx={{ fontWeight: 800, color: DE_BLUE }}>
                Fetching tracking details...
              </Typography>
              <style>{`
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
              `}</style>
            </Paper>
          )}

          {!isLoading && hasLookup && (error || !trackingData) && (
            <Paper elevation={0} sx={{ p: 5, borderRadius: 1, textAlign: 'center' }}>
              <FaExclamationTriangle size={52} color="#FFAB00" style={{ marginBottom: 18 }} />
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#172B4D', mb: 1 }}>
                No shipment data found
              </Typography>
              <Typography variant="body2" sx={{ color: '#42526E', maxWidth: 520, mx: 'auto' }}>
                {error instanceof Error
                  ? error.message
                  : 'Please check the AWB or order details and try again.'}
              </Typography>
            </Paper>
          )}

          {!isLoading && hasLookup && trackingData && (
            <>
              {trackingData.warning && (
                <Alert severity={trackingData.stale ? 'warning' : 'info'}>{trackingData.warning}</Alert>
              )}

              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, md: 4.5 },
                  borderRadius: 1,
                  border: `1px solid ${alpha(DE_BLUE, 0.1)}`,
                  background: `linear-gradient(135deg, #FFFFFF 0%, ${alpha(DE_BLUE, 0.02)} 100%)`,
                }}
              >
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', md: 'center' }}
                  spacing={3}
                >
                  <Stack spacing={0.5}>
                    <Typography variant="caption" sx={{ color: DE_BLUE, fontWeight: 900, letterSpacing: 1 }}>
                      SHIPMENT STATUS
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#172B4D' }}>
                      {trackingData.status || statusLabels[statusCode] || 'Order Placed'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#42526E' }}>
                      AWB: <b>{trackingData.awb_number || awb || '-'}</b> | Order:{' '}
                      <b>{trackingData.order_number || order || '-'}</b>
                    </Typography>
                    {trackingData.source === 'local_cache' && (
                      <Chip label="Latest saved status" color="warning" size="small" sx={{ width: 'fit-content' }} />
                    )}
                  </Stack>

                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                      <Typography variant="caption" sx={{ color: '#6B778C', fontWeight: 800, display: 'block' }}>
                        ESTIMATED DELIVERY
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 900, color: '#172B4D' }}>
                        {trackingData.edd || 'To be updated'}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        p: 1.8,
                        borderRadius: 1,
                        bgcolor: alpha(DE_BLUE, 0.08),
                        color: DE_BLUE,
                        display: 'flex',
                      }}
                    >
                      <FaTruck size={28} />
                    </Box>
                  </Stack>
                </Stack>
              </Paper>

              <Grid container spacing={4}>
                <Grid size={{ xs: 12, lg: 8 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: { xs: 3, md: 5 },
                      borderRadius: 1,
                      border: `1px solid ${alpha(DE_BLUE, 0.08)}`,
                      bgcolor: '#FFFFFF',
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#172B4D', mb: 6 }}>
                      Tracking Timeline
                    </Typography>

                    {!isCancelled && !isRTO ? (
                      <Stepper
                        alternativeLabel
                        activeStep={currentStage}
                        connector={<ColorConnector />}
                        sx={{ mb: 4 }}
                      >
                        {stages.map((stage, index) => (
                          <Step key={stage.label}>
                            <StepLabel
                              StepIconComponent={() => (
                                <Box
                                  sx={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor:
                                      index <= currentStage
                                        ? index === 4
                                          ? '#36B37E'
                                          : DE_BLUE
                                        : '#DFE1E6',
                                    color: '#fff',
                                    boxShadow:
                                      index <= currentStage ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                                    zIndex: 1,
                                  }}
                                >
                                  {stage.icon}
                                </Box>
                              )}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 800,
                                  mt: 1.5,
                                  color: index <= currentStage ? '#172B4D' : '#6B778C',
                                }}
                              >
                                {stage.label}
                              </Typography>
                            </StepLabel>
                          </Step>
                        ))}
                      </Stepper>
                    ) : (
                      <Box
                        sx={{
                          p: 4,
                          borderRadius: 1,
                          bgcolor: alpha('#DE350B', 0.06),
                          border: '1px solid #FF5630',
                          textAlign: 'center',
                          mb: 4,
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#DE350B' }}>
                          {isCancelled ? 'Order Cancelled' : 'RTO Initiated'}
                        </Typography>
                      </Box>
                    )}

                    <Stack spacing={3.5} sx={{ mt: 8 }}>
                      {sortedHistory.length === 0 ? (
                        <Typography color="text.secondary">No tracking events available yet.</Typography>
                      ) : (
                        sortedHistory.map((event, i) => (
                          <Stack key={`${event.event_time}-${i}`} direction="row" spacing={3}>
                            <Box sx={{ minWidth: 90, pt: 0.5 }}>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: '#172B4D' }}>
                                {event.event_time ? new Date(event.event_time).toLocaleDateString('en-GB') : 'N/A'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#6B778C' }}>
                                {event.event_time
                                  ? new Date(event.event_time).toLocaleTimeString('en-IN', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : 'N/A'}
                              </Typography>
                            </Box>
                            <Box sx={{ position: 'relative' }}>
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: 1,
                                  bgcolor: i === 0 ? DE_BLUE : '#DFE1E6',
                                  mt: 1,
                                  zIndex: 1,
                                }}
                              />
                              {i < sortedHistory.length - 1 && (
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    left: 5,
                                    top: 24,
                                    bottom: -24,
                                    width: 2,
                                    bgcolor: '#F4F5F7',
                                  }}
                                />
                              )}
                            </Box>
                            <Box sx={{ pb: 3 }}>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: '#172B4D' }}>
                                {event.message || statusLabels[getStatusCode(event.status_code)] || event.status_code}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#42526E', display: 'block', mt: 0.5 }}>
                                Location: {event.location || 'N/A'}
                              </Typography>
                            </Box>
                          </Stack>
                        ))
                      )}
                    </Stack>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, lg: 4 }}>
                  <Stack spacing={4}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3.5,
                        borderRadius: 1,
                        border: `1px solid ${alpha(DE_BLUE, 0.08)}`,
                        bgcolor: '#FFFFFF',
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#172B4D', mb: 3 }}>
                        Shipment Details
                      </Typography>
                      <Stack spacing={2}>
                        {[
                          { label: 'Courier', value: trackingData.courier_name || trackingData.provider },
                          { label: 'Payment', value: trackingData.payment_type },
                          { label: 'Status Code', value: statusCode },
                          {
                            label: 'Last Updated',
                            value: trackingData.last_updated_at
                              ? new Date(trackingData.last_updated_at).toLocaleString('en-IN')
                              : null,
                          },
                        ].map((item) => (
                          <Box key={item.label}>
                            <Typography variant="caption" sx={{ color: '#6B778C', fontWeight: 800 }}>
                              {item.label.toUpperCase()}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#172B4D' }}>
                              {item.value || 'N/A'}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Paper>

                    <Paper
                      elevation={0}
                      sx={{
                        p: 3.5,
                        borderRadius: 1,
                        border: `1px solid ${alpha(DE_BLUE, 0.08)}`,
                        bgcolor: '#FFFFFF',
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#172B4D', mb: 3 }}>
                        Shipment Info
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#172B4D' }}>
                        {trackingData.shipment_info || trackingData.dimensions || 'Details will update as the courier shares them.'}
                      </Typography>
                    </Paper>
                  </Stack>
                </Grid>
              </Grid>
            </>
          )}
        </Stack>
      </Container>
    </Box>
  )
}
