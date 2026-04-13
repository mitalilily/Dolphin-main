'use client'

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
  FaBoxOpen,
  FaEnvelopeOpenText,
  FaHashtag,
  FaPhoneAlt,
  FaReceipt,
  FaSearch,
} from 'react-icons/fa'
import { MdLocationOn, MdSchedule } from 'react-icons/md'
import type { TrackingHistory } from '../../api/tracking.service'
import PageHeading from '../../components/UI/heading/PageHeading'
import CustomInput from '../../components/UI/inputs/CustomInput'
import { SmartTabs } from '../../components/UI/tab/Tabs'
import { useTracking } from '../../hooks/Orders/useTracking'
import { cardStyles } from './RateCalculator'

type FormValues = {
  awb: string
  orderNumber: string
  contact: string
}

export default function OrderTrackingForm() {
  const [mode, setMode] = useState<'awb' | 'order'>('awb')
  const [error, setError] = useState<string>('')
  const [queryParams, setQueryParams] = useState<{
    awb?: string
    orderNumber?: string
    contact?: string
  } | null>(null)

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      awb: '',
      orderNumber: '',
      contact: '',
    },
  })

  const formValues = watch()

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.contact)
  const isPhone = /^[0-9+\-\s()]{7,}$/.test(formValues.contact)
  const isContactValid = !formValues.contact || isEmail || isPhone

  const {
    data: tracking,
    isFetching: trackingLoading,
    isError: trackingError,
    error: trackingErrorObj,
    isSuccess,
  } = useTracking(
    queryParams?.awb ?? null,
    queryParams?.orderNumber ?? null,
    queryParams?.contact ?? null,
  )

  useEffect(() => {
    if (trackingError) {
      setError(
        trackingErrorObj instanceof Error ? trackingErrorObj.message : 'Failed to fetch tracking',
      )
    } else if (isSuccess) {
      setError('')
    }
  }, [trackingError, trackingErrorObj, isSuccess])

  const canSubmit =
    mode === 'awb'
      ? formValues.awb.trim().length > 3
      : formValues.orderNumber.trim().length > 2 &&
        formValues.contact.trim().length > 3 &&
        isContactValid

  const onSubmit = (data: FormValues) => {
    if (!canSubmit) return
    setError('')

    if (mode === 'awb') {
      setQueryParams({ awb: data.awb.trim() })
    } else {
      setQueryParams({
        orderNumber: data.orderNumber.trim(),
        contact: data.contact.trim(),
      })
    }
  }

  const sortedHistory = useMemo<TrackingHistory[]>(() => {
    if (!tracking?.history) return []
    return [...tracking.history].sort(
      (a, b) => new Date(b.event_time).getTime() - new Date(a.event_time).getTime(),
    )
  }, [tracking])

  const resetResults = () => {
    setQueryParams(null)
    setError('')
  }

  return (
    <Stack sx={{ py: 6 }}>
      <PageHeading
        eyebrow="Tools Panel"
        title="Track Order"
        subtitle="Track by AWB or order details, review shipment timelines, and keep the utility view aligned with the rest of the panel."
      />
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ p: 4, ...cardStyles }}>
        {/* Header */}
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Track Your <span style={{ color: '#333369' }}>Order</span>
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Enter your AWB number or order details to track shipment.
        </Typography>

        {/* Tabs */}
        <SmartTabs
          onChange={(v) => {
            setMode(v)
            reset()
            setError('')
            resetResults()
          }}
          tabs={[
            { label: 'Track By AWB', value: 'awb' },
            { label: 'Track By Order ID', value: 'order' },
          ]}
          value={mode}
        />

        {/* Form Fields */}
        {mode === 'awb' ? (
          <FormControl fullWidth sx={{ mb: 3 }}>
            <Controller
              name="awb"
              control={control}
              render={({ field }) => (
                <CustomInput
                  {...field}
                  id="awb"
                  placeholder="e.g. 1234567890"
                  prefix={<FaHashtag />}
                  error={!!errors.awb}
                  label="AWB Number"
                />
              )}
              rules={{ required: 'AWB number is required' }}
            />
            {errors.awb && <FormHelperText error>{errors.awb.message}</FormHelperText>}
          </FormControl>
        ) : (
          <>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <Controller
                name="orderNumber"
                control={control}
                render={({ field }) => (
                  <CustomInput
                    {...field}
                    id="orderNumber"
                    placeholder="e.g. ORD-2025-0001"
                    prefix={<FaReceipt />}
                    error={!!errors.orderNumber}
                    label="Order ID"
                  />
                )}
                rules={{ required: 'Order ID is required' }}
              />
              {errors.orderNumber && (
                <FormHelperText error>{errors.orderNumber.message}</FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <Controller
                name="contact"
                control={control}
                render={({ field }) => (
                  <CustomInput
                    {...field}
                    id="contact"
                    placeholder="you@example.com or +91 98765 43210"
                    prefix={isEmail ? <FaEnvelopeOpenText /> : <FaPhoneAlt />}
                    error={!isContactValid}
                    label="Email or Phone"
                  />
                )}
                rules={{ required: 'Email or Phone is required' }}
              />
              {!isContactValid && (
                <FormHelperText error>Enter a valid email or phone number</FormHelperText>
              )}
            </FormControl>
          </>
        )}

        {/* Error */}
        {error && (
          <Typography color="error" variant="body2" mb={2}>
            {error}
          </Typography>
        )}

        {/* Buttons */}
        <Box display="flex" gap={2} alignItems="center">
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={trackingLoading ? <CircularProgress size={18} /> : <FaSearch />}
            disabled={!canSubmit || trackingLoading}
          >
            {trackingLoading ? 'Tracking…' : 'Track Order'}
          </Button>
          <Button
            type="button"
            variant="text"
            color="inherit"
            onClick={() => {
              reset()
              resetResults()
            }}
          >
            Reset
          </Button>
        </Box>
      </Box>

      {isSuccess && tracking && queryParams && (
        <Stack spacing={3} mt={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Shipment Overview
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    AWB Number
                  </Typography>
                  <Typography fontWeight={600}>{tracking.awb_number || '—'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Order Number
                  </Typography>
                  <Typography fontWeight={600}>{tracking.order_number || '—'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Courier
                  </Typography>
                  <Typography fontWeight={600}>{tracking.courier_name || '—'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={tracking.status || 'Unknown'}
                    color={(() => {
                      const normalized = (tracking.status || '').toLowerCase()
                      if (normalized.includes('deliver')) return 'success'
                      if (normalized.includes('transit')) return 'info'
                      if (normalized.includes('cancel')) return 'error'
                      if (normalized.includes('rto')) return 'warning'
                      return 'default'
                    })()}
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Payment Type
                  </Typography>
                  <Typography fontWeight={600} textTransform="uppercase">
                    {tracking.payment_type || '—'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Estimated Delivery
                  </Typography>
                  <Typography fontWeight={600}>
                    {tracking.edd ? new Date(tracking.edd).toLocaleDateString() : '—'}
                  </Typography>
                </Grid>
              </Grid>
              {tracking.shipment_info && (
                <Box mt={3}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Shipment Info
                  </Typography>
                  <Typography fontSize={14}>{tracking.shipment_info}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Tracking Timeline
              </Typography>
              {sortedHistory.length === 0 ? (
                <Typography color="text.secondary">No tracking events available yet.</Typography>
              ) : (
                <List>
                  {sortedHistory.map((event, idx) => (
                    <Fragment key={`${event.event_time}-${idx}`}>
                      <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {idx === 0 ? (
                            <FaBoxOpen color="#333369" size={20} />
                          ) : (
                            <MdLocationOn color="#6B7280" size={20} />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography fontWeight={600}>
                                {event.message || event.status_code}
                              </Typography>
                              <Chip
                                size="small"
                                label={event.status_code}
                                color={idx === 0 ? 'primary' : 'default'}
                              />
                            </Stack>
                          }
                          secondary={
                            <Stack
                              direction={{ xs: 'column', sm: 'row' }}
                              spacing={1}
                              mt={0.5}
                              alignItems={{ sm: 'center' }}
                            >
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <MdSchedule size={16} />
                                <Typography variant="caption">
                                  {new Date(event.event_time).toLocaleString()}
                                </Typography>
                              </Stack>
                              {event.location && (
                                <Typography variant="caption" color="text.secondary">
                                  {event.location}
                                </Typography>
                              )}
                            </Stack>
                          }
                        />
                      </ListItem>
                      {idx !== sortedHistory.length - 1 && <Divider component="li" />}
                    </Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Stack>
      )}
    </Stack>
  )
}
