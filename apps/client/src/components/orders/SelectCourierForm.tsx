import { Box, Chip, CircularProgress, Divider, Grid, Paper, Stack, Typography, alpha } from '@mui/material'
import { useFormContext } from 'react-hook-form'
import { BiCalendar, BiCheckCircle, BiMap, BiPackage, BiUser } from 'react-icons/bi'
import { TbPlane, TbTruck } from 'react-icons/tb'
import {
  useAvailableCouriers,
  type UseAvailableCouriersParams,
} from '../../hooks/Integrations/useCouriers'
import { courierLogos, defaultLogo } from '../../utils/constants'
import type { Box as B2BBox, B2BFormData } from './b2b/B2BOrderForm'
import type { B2CFormData } from './b2c/B2COrderForm'

const ACCENT = '#0D3B8E'
const TEXT_PRIMARY = '#102A54'
const TEXT_SECONDARY = '#4C6185'
const SURFACE = '#F6F8FC'

export const SelectCourierForm = ({ shipment_type }: { shipment_type: 'b2b' | 'b2c' }) => {
  const { watch, setValue, clearErrors } = useFormContext<B2BFormData | B2CFormData>()

  const products = watch('products') ?? []
  const deliveryPincode = watch('pincode') ?? ''
  const pickupPincode = watch('pickupLocationPincode') ?? ''
  const pickupName = watch('pickupLocationName') ?? ''
  const pickupId = watch('pickupLocationId') ?? ''
  const pickupAddressLine = watch('pickupAddress') ?? ''
  const pickupCity = watch('pickupCity') ?? ''
  const pickupState = watch('pickupState') ?? ''
  const deliveryAddressLine = watch('address') ?? ''
  const deliveryCity = watch('city') ?? ''
  const deliveryState = watch('state') ?? ''
  const length = watch('length') ?? 0
  const breadth = watch('breadth') ?? 0
  const height = watch('height') ?? 0
  const prepaidAmount = Number(watch('prepaidAmount') ?? 0)
  const orderType = watch('orderType') ?? 'prepaid'
  const selectedCourierId = watch('courierPartnerId') ?? ''
  const selectedCourierOptionKey = watch('courierOptionKey') ?? ''
  const shippingCharges = Number(watch('shippingCharges') || 0)
  const transactionFee = Number(watch('transactionFee') || 0)
  const giftWrap = Number(watch('giftWrap') || 0)
  const discount = Number(watch('discount') || 0)
  const courierCod = Number(watch('courierCod') || 0)
  const forwardCharges = Number(watch('forwardCharges') || 0)
  const otherCharges = Number(watch('otherCharges') || 0)

  // COMPUTE TOTAL WEIGHT AND PRICE
  let totalWeight = 0
  let totalProductPrice = 0

  if (shipment_type === 'b2b') {
    // B2B uses flat boxes array, not nested in products
    const boxes = watch('boxes') as B2BBox[] | undefined
    if (boxes && Array.isArray(boxes)) {
      boxes.forEach((box: B2BBox) => {
        // Calculate chargeable weight per box (max of actual and volumetric)
        const actualWeightKg = Number(box.weightKg ?? 0) // in kg
        const length = Number(box.lengthCm ?? 0) // in cm
        const breadth = Number(box.breadthCm ?? 0) // in cm
        const height = Number(box.heightCm ?? 0) // in cm

        const VOLUMETRIC_DIVISOR = 5000
        const volumetricWeightKg =
          length > 0 && breadth > 0 && height > 0
            ? (length * breadth * height) / VOLUMETRIC_DIVISOR
            : 0

        // Chargeable weight per box = max(actual, volumetric) in kg, convert to grams
        const chargeableWeightKg = Math.max(actualWeightKg, volumetricWeightKg)
        const chargeableWeightGrams = chargeableWeightKg * 1000

        totalWeight += chargeableWeightGrams // Sum chargeable weights in grams
      })
    }
    // For B2B, product price is not stored in boxes, it's in invoices
    // totalProductPrice remains 0 or can be calculated from invoices if needed
  } else if (shipment_type === 'b2c') {
    totalWeight = watch('weight') ?? 0
    totalProductPrice = products?.reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sum, p: any) => sum + Number(p.price ?? 0) * Number(p.quantity ?? 1),
      0,
    )
  }

  // Total shown to seller: customer-facing charges only (what customer pays)
  // Includes: products + shipping + COD (for COD orders only) + transaction_fee + gift_wrap - discount - prepaid
  // Does NOT include courier freight/COD/other charges (those are what seller pays to courier)
  const totalOrderValue =
    totalProductPrice + shippingCharges + transactionFee + giftWrap - discount - prepaidAmount
  const declaredOrderValue = Math.max(
    totalProductPrice + shippingCharges + transactionFee + giftWrap - discount,
    0,
  )
  const courierPayloadOrderAmount =
    declaredOrderValue > 0 ? declaredOrderValue : Math.max(totalProductPrice, 0)

  const cod = orderType === 'cod' ? 1 : 0

  // COURIER API payload
  const courierPayload: UseAvailableCouriersParams = {
    pickupPincode,
    deliveryPincode,
    pickupName,
    pickupId,
    pickupAddressKey: `${pickupPincode}-${pickupAddressLine}-${pickupCity}-${pickupState}`,
    deliveryAddressKey: `${deliveryPincode}-${deliveryAddressLine}-${deliveryCity}-${deliveryState}`,
    weight: totalWeight,
    cod,
    payment_type: orderType,
    orderAmount: courierPayloadOrderAmount,
    shipmentType: shipment_type,
  }

  if (shipment_type === 'b2c') {
    courierPayload.length = length
    courierPayload.breadth = breadth
    courierPayload.height = height
  }

  const { data: couriers, isLoading, isError, isFetching } = useAvailableCouriers(courierPayload)
  const availableCouriers = couriers ?? []
  if (!pickupPincode || !deliveryPincode || !totalWeight) {
    return <Typography>Fill pickup, delivery, and weight first to fetch couriers</Typography>
  }
  if (isLoading || isFetching)
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress color="primary" size={28} sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          Checking serviceability and rates…
        </Typography>
      </Paper>
    )
  if (isError) return <Typography color="error">Failed to fetch couriers</Typography>
  if (!availableCouriers.length) return <Typography>No couriers available</Typography>

  const getModeIcon = (mode?: string) => {
    const normalizedMode = String(mode || '').toLowerCase()
    if (normalizedMode === 'air') return <TbPlane size={16} />
    if (normalizedMode === 'surface') return <TbTruck size={16} />
    return null
  }

  const formatCurrency = (value?: number | string | null) => `₹${Number(value || 0).toFixed(2)}`

  const formatWeightKg = (value?: number | null) =>
    value ? `${(Number(value) / 1000).toFixed(2)} kg` : '—'
  const getCourierDisplayName = (courier: { displayName?: string; name?: string }) => courier?.displayName || courier?.name || 'Courier'

  const selectedCourierSummary = availableCouriers.find((courier) => {
    const courierOptionKey = String(
      courier?.courier_option_key ?? courier?.id ?? courier?.courier_id ?? '',
    )
    return selectedCourierOptionKey
      ? selectedCourierOptionKey === courierOptionKey
      : String(selectedCourierId) === String(courier?.id ?? courier?.courier_id ?? '')
  })

  return (
    <Grid container spacing={3}>
      <Grid size={{ md: 4.5, xs: 12 }}>
        <Stack spacing={2.5} sx={{ position: { md: 'sticky' }, top: { md: 16 } }}>
          <Paper
            sx={{
              p: 0,
              overflow: 'hidden',
              borderRadius: 4,
              border: `1px solid ${alpha(ACCENT, 0.14)}`,
              boxShadow: '0 22px 44px rgba(13,59,142,0.08)',
            }}
          >
            <Box
              sx={{
                px: 2.5,
                py: 2.25,
                color: '#fff',
                background:
                  'linear-gradient(135deg, #0D3B8E 0%, #1A5DD1 55%, #3D8BFF 100%)',
              }}
            >
              <Typography sx={{ fontSize: 12, letterSpacing: '0.08em', opacity: 0.88, color: '#fff' }}>
                SHIPMENT SNAPSHOT
              </Typography>
              <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 800, color: '#fff' }}>
                {watch('orderId') || 'Pending Order ID'}
              </Typography>
              <Typography sx={{ mt: 0.75, opacity: 0.9, color: '#fff' }}>
                {shipment_type.toUpperCase()} • {orderType.toUpperCase()} •{' '}
                {(Number(totalWeight) / 1000).toFixed(2)} kg
              </Typography>
            </Box>

            <Box sx={{ p: 2.5, bgcolor: '#fff' }}>
              <Grid container spacing={1.5}>
                {[
                  { label: 'Customer Total', value: formatCurrency(totalOrderValue) },
                  { label: 'Courier Options', value: String(availableCouriers.length) },
                  { label: 'Pickup', value: pickupPincode || '-' },
                  { label: 'Delivery', value: deliveryPincode || '-' },
                ].map((item) => (
                  <Grid key={item.label} size={{ xs: 6 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: SURFACE,
                        border: '1px solid rgba(13,59,142,0.08)',
                      }}
                    >
                      <Typography sx={{ fontSize: 11, color: TEXT_SECONDARY }}>{item.label}</Typography>
                      <Typography sx={{ mt: 0.5, fontWeight: 800, color: TEXT_PRIMARY }}>
                        {item.value}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Stack spacing={1.2}>
                <Typography sx={{ fontSize: 12, fontWeight: 800, color: TEXT_SECONDARY }}>
                  Price Breakup
                </Typography>
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ color: TEXT_SECONDARY }}>Products</Typography>
                  <Typography sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>
                    {formatCurrency(totalProductPrice)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ color: TEXT_SECONDARY }}>Shipping</Typography>
                  <Typography sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>
                    {formatCurrency(shippingCharges)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ color: TEXT_SECONDARY }}>Transaction Fee</Typography>
                  <Typography sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>
                    {formatCurrency(transactionFee)}
                  </Typography>
                </Stack>
                {giftWrap > 0 && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography sx={{ color: TEXT_SECONDARY }}>Gift Wrap</Typography>
                    <Typography sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>
                      {formatCurrency(giftWrap)}
                    </Typography>
                  </Stack>
                )}
                {discount > 0 && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography sx={{ color: '#B42318' }}>Discount</Typography>
                    <Typography sx={{ fontWeight: 700, color: '#B42318' }}>
                      -{formatCurrency(discount)}
                    </Typography>
                  </Stack>
                )}
                {prepaidAmount > 0 && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography sx={{ color: '#B42318' }}>Prepaid Amount</Typography>
                    <Typography sx={{ fontWeight: 700, color: '#B42318' }}>
                      -{formatCurrency(prepaidAmount)}
                    </Typography>
                  </Stack>
                )}
              </Stack>

              {(forwardCharges > 0 || (orderType === 'cod' && courierCod > 0) || otherCharges > 0) && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Stack spacing={1.2}>
                    <Typography sx={{ fontSize: 12, fontWeight: 800, color: TEXT_SECONDARY }}>
                      Wallet Debit Preview
                    </Typography>
                    {forwardCharges > 0 && (
                      <Stack direction="row" justifyContent="space-between">
                        <Typography sx={{ color: TEXT_SECONDARY }}>Forward Freight</Typography>
                        <Typography sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>
                          {formatCurrency(forwardCharges)}
                        </Typography>
                      </Stack>
                    )}
                    {orderType === 'cod' && courierCod > 0 && (
                      <Stack direction="row" justifyContent="space-between">
                        <Typography sx={{ color: TEXT_SECONDARY }}>Courier COD</Typography>
                        <Typography sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>
                          {formatCurrency(courierCod)}
                        </Typography>
                      </Stack>
                    )}
                    {otherCharges > 0 && (
                      <Stack direction="row" justifyContent="space-between">
                        <Typography sx={{ color: TEXT_SECONDARY }}>Other Charges</Typography>
                        <Typography sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>
                          {formatCurrency(otherCharges)}
                        </Typography>
                      </Stack>
                    )}
                  </Stack>
                </>
              )}
            </Box>
          </Paper>

          <Paper sx={{ p: 2.25, borderRadius: 4, bgcolor: '#fff' }}>
            <Typography sx={{ fontWeight: 800, color: TEXT_PRIMARY }}>Delivery Summary</Typography>
            <Stack spacing={1.2} sx={{ mt: 1.5 }}>
              <Stack direction="row" spacing={1.2} alignItems="flex-start">
                <BiUser color={ACCENT} size={18} />
                <Box>
                  <Typography sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>
                    {watch('buyerName') || 'Customer'}
                  </Typography>
                  <Typography sx={{ color: TEXT_SECONDARY, fontSize: 14 }}>
                    {watch('buyerPhone') || '-'}
                  </Typography>
                  <Typography sx={{ color: TEXT_SECONDARY, fontSize: 14 }}>
                    {watch('buyerEmail') || '-'}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1.2} alignItems="flex-start">
                <BiMap color={ACCENT} size={18} />
                <Typography sx={{ color: TEXT_SECONDARY, fontSize: 14 }}>
                  {deliveryAddressLine || '-'}, {deliveryCity || '-'}, {deliveryState || '-'} -{' '}
                  {deliveryPincode || '-'}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1.2} alignItems="flex-start">
                <BiPackage color={ACCENT} size={18} />
                <Typography sx={{ color: TEXT_SECONDARY, fontSize: 14 }}>
                  {shipment_type === 'b2b'
                    ? `${(watch('boxes') as B2BBox[] | undefined)?.length || 0} boxes`
                    : `${products?.length || 0} products`}
                </Typography>
              </Stack>
            </Stack>
          </Paper>

          <Paper sx={{ p: 2.25, borderRadius: 4, bgcolor: '#fff' }}>
            <Typography sx={{ fontWeight: 800, color: TEXT_PRIMARY }}>Pickup Summary</Typography>
            <Stack spacing={1.2} sx={{ mt: 1.5 }}>
              <Stack direction="row" spacing={1.2} alignItems="flex-start">
                <BiCalendar color={ACCENT} size={18} />
                <Box>
                  <Typography sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>
                    {pickupName || 'Pickup Location'}
                  </Typography>
                  <Typography sx={{ color: TEXT_SECONDARY, fontSize: 14 }}>
                    {pickupAddressLine || '-'}, {pickupCity || '-'}, {pickupState || '-'} -{' '}
                    {pickupPincode || '-'}
                  </Typography>
                </Box>
              </Stack>
              {selectedCourierSummary && (
                <>
                  <Divider />
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 3,
                      bgcolor: alpha(ACCENT, 0.05),
                      border: `1px solid ${alpha(ACCENT, 0.12)}`,
                    }}
                  >
                    <Typography sx={{ fontSize: 11, color: TEXT_SECONDARY, letterSpacing: '0.08em' }}>
                      SELECTED COURIER
                    </Typography>
                    <Typography sx={{ mt: 0.5, fontWeight: 800, color: TEXT_PRIMARY }}>
                      {getCourierDisplayName(selectedCourierSummary)}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                      <Chip size="small" label={`Freight ${formatCurrency(selectedCourierSummary.rate)}`} />
                      <Chip
                        size="small"
                        label={`Chargeable ${formatWeightKg(selectedCourierSummary.chargeable_weight)}`}
                      />
                    </Stack>
                  </Box>
                </>
              )}
            </Stack>
          </Paper>
        </Stack>
      </Grid>

      <Grid size={{ md: 7.5, xs: 12 }}>
        <Paper
          sx={{
            p: 2.5,
            borderRadius: 4,
            border: `1px solid ${alpha(ACCENT, 0.1)}`,
            boxShadow: '0 18px 40px rgba(16,42,84,0.06)',
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
            spacing={1}
            sx={{ mb: 2.5 }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: TEXT_PRIMARY }}>
                Select Courier Partner
              </Typography>
              <Typography sx={{ mt: 0.5, color: TEXT_SECONDARY }}>
                Compare freight, speed and chargeable weight before locking the shipment.
              </Typography>
            </Box>
            <Chip
              label={`${availableCouriers.length} options`}
              sx={{
                bgcolor: alpha(ACCENT, 0.08),
                color: ACCENT,
                fontWeight: 700,
                borderRadius: '999px',
              }}
            />
          </Stack>

          <Stack spacing={2}>
            {availableCouriers?.map((courier) => {
              const local = courier?.localRates
              const courierOptionKey = String(
                courier?.courier_option_key ?? courier?.id ?? courier?.courier_id ?? '',
              )
              const isSelected = selectedCourierOptionKey
                ? selectedCourierOptionKey === courierOptionKey
                : String(selectedCourierId) === String(courier?.id ?? courier?.courier_id ?? '')

              const forwardCharge =
                courier?.rate !== undefined && courier?.rate !== null
                  ? Number(courier.rate)
                  : local?.forward?.rate

              return (
                <Paper
                  key={courierOptionKey}
                  onClick={() => {
                    setValue('courierPartner', courier?.name ?? '')
                    setValue('courierPartnerId', courier?.id ?? '')
                    setValue('courierOptionKey', courierOptionKey)
                    setValue('selectedMaxSlabWeight', courier?.max_slab_weight ?? null)
                    setValue('courierCod', local?.forward?.cod_charges ?? 0)
                    setValue('forwardCharges', forwardCharge)
                    setValue('otherCharges', local?.forward?.other_charges ?? 0)
                    setValue(
                      'courierCost',
                      courier?.courier_cost_estimate || courier?.rateEstimate || null,
                    ) // Estimated courier cost from serviceability
                    setValue('integrationType', courier?.integration_type)
                    setValue('zone', courier?.approxZone?.code ?? courier?.approxZone?.name ?? '')
                    setValue('zoneId', courier?.approxZone?.id ?? '')
                    setValue('chargeableWeight', courier?.chargeable_weight ?? null)
                    setValue('volumetricWeight', courier?.volumetric_weight ?? null)
                    setValue('slabs', courier?.slabs ?? null)
                    clearErrors('courierPartnerId')
                  }}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    borderRadius: 4,
                    border: isSelected
                      ? `2px solid ${alpha(ACCENT, 0.42)}`
                      : `1px solid ${alpha('#102A54', 0.12)}`,
                    bgcolor: isSelected ? alpha(ACCENT, 0.045) : '#fff',
                    boxShadow: isSelected
                      ? '0 18px 36px rgba(13,59,142,0.14)'
                      : '0 8px 22px rgba(16,42,84,0.06)',
                    transition: '0.25s ease',
                    '&:hover': {
                      borderColor: alpha(ACCENT, 0.38),
                      boxShadow: '0 18px 36px rgba(13,59,142,0.12)',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  <Stack spacing={1.75}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      spacing={1.5}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                          sx={{
                            width: 52,
                            height: 52,
                            borderRadius: 3,
                            bgcolor: SURFACE,
                            border: `1px solid ${alpha(ACCENT, 0.08)}`,
                            display: 'grid',
                            placeItems: 'center',
                            overflow: 'hidden',
                          }}
                        >
                          <img
                            src={
                              Object.entries(courierLogos)?.find(([key]) =>
                                courier?.name?.toLowerCase().includes(key.toLowerCase()),
                              )?.[1] ?? defaultLogo
                            }
                            alt={courier?.name}
                            style={{ width: 34, height: 34, objectFit: 'contain' }}
                          />
                        </Box>
                        <Box>
                          <Stack direction="row" spacing={0.8} alignItems="center" flexWrap="wrap">
                            {getModeIcon(local?.forward?.mode || local?.mode)}
                            <Typography sx={{ fontWeight: 800, color: TEXT_PRIMARY }}>
                              {getCourierDisplayName(courier)}
                            </Typography>
                            {courier?.tag === 'fastest' && (
                              <Chip
                                size="small"
                                label="Fastest"
                                sx={{ bgcolor: '#E8F1FF', color: ACCENT, fontWeight: 700 }}
                              />
                            )}
                            {courier?.tag === 'economy' && (
                              <Chip
                                size="small"
                                label="Best Rate"
                                sx={{ bgcolor: '#ECFDF3', color: '#067647', fontWeight: 700 }}
                              />
                            )}
                          </Stack>
                          <Typography sx={{ mt: 0.35, fontSize: 13, color: TEXT_SECONDARY }}>
                            {courier?.edd ? `Estimated delivery: ${courier.edd}` : 'EDD unavailable'}
                          </Typography>
                        </Box>
                      </Stack>

                      <Stack alignItems={{ xs: 'flex-start', sm: 'flex-end' }} spacing={0.25}>
                        <Typography sx={{ fontSize: 12, color: TEXT_SECONDARY }}>
                          Forward Freight
                        </Typography>
                        <Typography sx={{ fontSize: 28, fontWeight: 900, color: TEXT_PRIMARY }}>
                          {formatCurrency(forwardCharge)}
                        </Typography>
                      </Stack>
                    </Stack>

                    <Grid container spacing={1.1}>
                      {[
                        ['COD', formatCurrency(local?.forward?.cod_charges)],
                        ['Other', formatCurrency(local?.forward?.other_charges)],
                        ['Chargeable', formatWeightKg(courier?.chargeable_weight)],
                        ['Volumetric', formatWeightKg(courier?.volumetric_weight)],
                      ].map(([label, value]) => (
                        <Grid key={label} size={{ xs: 6, lg: 3 }}>
                          <Box
                            sx={{
                              p: 1.25,
                              borderRadius: 3,
                              bgcolor: SURFACE,
                              border: '1px solid rgba(13,59,142,0.08)',
                            }}
                          >
                            <Typography sx={{ fontSize: 11, color: TEXT_SECONDARY }}>{label}</Typography>
                            <Typography sx={{ mt: 0.35, fontWeight: 800, color: TEXT_PRIMARY }}>
                              {value}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>

                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {courier?.prepaid === false && (
                        <Chip size="small" variant="outlined" color="error" label="Prepaid N/A" />
                      )}
                      {courier?.cod === false && (
                        <Chip size="small" variant="outlined" color="error" label="COD N/A" />
                      )}
                    </Stack>

                    {isSelected && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <BiCheckCircle size={20} color={ACCENT} />
                        <Typography sx={{ fontWeight: 800, color: ACCENT }}>
                          Selected for booking
                        </Typography>
                      </Stack>
                    )}
                  </Stack>
                </Paper>
              )
            })}
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  )
}
