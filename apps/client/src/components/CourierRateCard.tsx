import type { JSX } from '@emotion/react/jsx-runtime'
import {
  alpha,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { BiPackage, BiRupee, BiTimeFive } from 'react-icons/bi'
import { FaShippingFast, FaWeight } from 'react-icons/fa'
import { courierLogos } from '../utils/constants'

/* Types */
type ForwardRate = {
  mode?: string | null
  rate?: number | null
  ratePerKg?: number | string | null
  rate_per_kg?: number | string | null
  cod_charges?: number | null
  cod_percent?: number | null
  is_prepaid?: boolean
  is_cod?: boolean
}

type LocalRates = {
  forward?: ForwardRate | null
}

export type Courier = {
  id: string
  name?: string | null
  chargeable_weight?: number | null
  volumetric_weight?: number | null
  slabs?: number | null
  rate?: number | null
  edd?: string | null
  integration_type?: string | null
  service_provider?: string | null
  serviceProvider?: string | null
  localRates?: LocalRates | null
  special_zone?: boolean | null
  notes?: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  approxZone: any
}

type Props = {
  availableCouriers?: Courier[]
  defaultLogo?: string
  onSelect?: (courier: Courier) => void
  shipmentType?: string
}

const ACCENT = '#0D3B8E'
const TEXT_PRIMARY = '#102A54'
const TEXT_MUTED = '#496189'
const BORDER = '#E2E8F0'
const AGGREGATOR_LABELS: Record<string, string> = {
  shiprocket: 'Shiprocket',
  shipmozo: 'Shipmozo',
  delhivery: 'Delhivery',
  ekart: 'Ekart',
  xpressbees: 'Xpressbees',
  truxcargo: 'Truxcargo',
  icarry: 'iCarry',
}

const inferProviderFromName = (name?: string | null) => {
  const n = String(name || '').toLowerCase()
  if (n.includes('shiprocket')) return 'shiprocket'
  if (n.includes('shipmozo')) return 'shipmozo'
  if (n.includes('delhivery')) return 'delhivery'
  if (n.includes('ekart')) return 'ekart'
  if (n.includes('xpress')) return 'xpressbees'
  if (n.includes('trux')) return 'truxcargo'
  if (n.includes('icarry') || n.includes('i carry')) return 'icarry'
  return ''
}

export default function CourierRateList({
  availableCouriers = [],
  defaultLogo = '',
  onSelect,
  shipmentType,
}: Props): JSX.Element {
  if (!availableCouriers || availableCouriers.length === 0) {
    return (
      <Box
        py={8}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        sx={{
          background: '#FFFFFF',
          borderRadius: 4,
          border: `1px dashed ${alpha(ACCENT, 0.3)}`,
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: alpha(ACCENT, 0.08),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          <FaShippingFast size={30} color={ACCENT} />
        </Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: TEXT_PRIMARY,
            mb: 1,
          }}
        >
          No courier rates available
        </Typography>
        <Typography variant="body2" color={TEXT_MUTED} sx={{ textAlign: 'center', maxWidth: 400 }}>
          Please check your input parameters and try again
        </Typography>
      </Box>
    )
  }

  return (
    <Box mt={4}>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          color: TEXT_PRIMARY,
          mb: 3,
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
        }}
      >
        Available Couriers ({availableCouriers.length})
      </Typography>

      <Grid container spacing={3}>
        {availableCouriers?.map((courier) => {
          const providerKeyRaw = String(
            courier.integration_type || courier.service_provider || courier.serviceProvider || '',
          )
            .trim()
            .toLowerCase()
          const providerKey = providerKeyRaw || inferProviderFromName(courier?.name)
          const logo =
            Object.entries(courierLogos || {}).find(([key]) =>
              courier?.name?.toLowerCase().includes(key.toLowerCase()),
            )?.[1] ?? defaultLogo

          const forward: ForwardRate = courier?.localRates?.forward ?? {}
          const ratePerKg = Number(forward?.ratePerKg ?? forward?.rate_per_kg ?? 0)

          // Calculate total charges using slabbed rate
          const freight =
            courier?.rate !== undefined && courier?.rate !== null
              ? Number(courier.rate)
              : forward?.rate
              ? Number(forward?.rate)
              : ratePerKg > 0
              ? ratePerKg
              : 0
          const codCharges = forward?.cod_charges ? Number(forward?.cod_charges) : 0
          const isCOD = shipmentType === 'cod'
          const totalCharges = isCOD ? freight + codCharges : freight

          // Parse EDD
          const eddText = courier?.edd ?? '—'
          const isClickable = Boolean(onSelect)

          const aggregatorName = AGGREGATOR_LABELS[providerKey] || providerKey || 'Unknown Aggregator'

          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={courier.id}>
              <Card
                onClick={isClickable ? () => onSelect?.(courier) : undefined}
                sx={{
                  height: '100%',
                  overflow: 'hidden',
                  borderRadius: 0.75,
                  border: `1px solid ${alpha('#0B2348', 0.2)}`,
                  boxShadow: 'none',
                  transition: 'all 0.2s ease',
                  background: '#FCFEFF',
                  cursor: isClickable ? 'pointer' : 'default',
                  '&:hover': {
                    boxShadow: `6px 6px 0 ${alpha('#0B2348', 0.12)}`,
                    borderColor: alpha('#0B2348', 0.5),
                    transform: 'translate(-2px, -2px)',
                  },
                }}
              >
                <Box
                  sx={{
                    height: 5,
                    background: '#0B2348',
                  }}
                />

                <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                  <Stack direction="row" spacing={2} alignItems="center" mb={2.5}>
                    <Avatar
                      src={logo}
                      alt={courier?.name ?? 'logo'}
                      variant="rounded"
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 0.75,
                        border: `1px solid ${alpha(ACCENT, 0.14)}`,
                      }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 700,
                          color: TEXT_PRIMARY,
                          lineHeight: 1.3,
                          mb: 0.5,
                        }}
                        noWrap
                      >
                        {courier?.name ?? 'Unknown Courier'}
                      </Typography>
                      {courier?.approxZone?.name && (
                        <Chip
                          label={courier.approxZone.name}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            background: alpha(ACCENT, 0.08),
                            color: ACCENT,
                            border: `1px solid ${alpha(ACCENT, 0.2)}`,
                          }}
                        />
                      )}
                    </Box>
                  </Stack>

                  <Box
                    sx={{
                      background: '#F3F7FE',
                      borderRadius: 0.5,
                      p: 2,
                      mb: 2.5,
                      border: `1px solid ${alpha('#0B2348', 0.16)}`,
                    }}
                  >
                    <Stack direction="row" alignItems="baseline" spacing={1}>
                      <BiRupee size={20} color={ACCENT} />
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 800,
                          color: TEXT_PRIMARY,
                          fontSize: '2rem',
                          lineHeight: 1,
                        }}
                      >
                        {totalCharges > 0 ? totalCharges.toLocaleString('en-IN') : 'N/A'}
                      </Typography>
                    </Stack>
                    <Typography
                      variant="caption"
                      sx={{
                        color: TEXT_MUTED,
                        fontWeight: 500,
                        mt: 0.5,
                        display: 'block',
                      }}
                    >
                      {isCOD ? 'Including COD Charges' : 'Prepaid Rate'}
                      {ratePerKg > 0 && courier?.rate ? ` | ${ratePerKg.toLocaleString('en-IN')}/kg` : ''}
                    </Typography>
                  </Box>

                  {/* Details Grid */}
                  <Grid container spacing={1.5} mb={2}>
                    {/* EDD */}
                    <Grid size={{ xs: 6 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{
                          p: 1.5,
                          borderRadius: 1.5,
                          background: '#FFFFFF',
                          border: `1px solid ${BORDER}`,
                        }}
                      >
                        <BiTimeFive size={18} color={ACCENT} />
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: TEXT_MUTED,
                              fontSize: '0.7rem',
                              display: 'block',
                              lineHeight: 1.2,
                            }}
                          >
                            EDD
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              color: TEXT_PRIMARY,
                              fontSize: '0.85rem',
                              lineHeight: 1.2,
                            }}
                          >
                            {eddText}
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>

                    {/* Chargeable Weight */}
                    <Grid size={{ xs: 6 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{
                          p: 1.5,
                          borderRadius: 1.5,
                          background: '#FFFFFF',
                          border: `1px solid ${BORDER}`,
                        }}
                      >
                        <FaWeight size={16} color={ACCENT} />
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: TEXT_MUTED,
                              fontSize: '0.7rem',
                              display: 'block',
                              lineHeight: 1.2,
                            }}
                          >
                            Weight
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              color: TEXT_PRIMARY,
                              fontSize: '0.85rem',
                              lineHeight: 1.2,
                            }}
                          >
                            {courier?.chargeable_weight
                              ? `${courier.chargeable_weight.toLocaleString('en-IN')} g`
                              : '—'}
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                  </Grid>

                  {/* Additional Info */}
                  <Stack spacing={1}>
                    {forward?.mode && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <BiPackage size={14} color={TEXT_MUTED} />
                        <Typography variant="caption" color={TEXT_MUTED} sx={{ fontSize: '0.75rem' }}>
                          Mode: <strong>{forward.mode}</strong>
                        </Typography>
                      </Stack>
                    )}
                    {isCOD && codCharges > 0 && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <BiRupee size={14} color={TEXT_MUTED} />
                        <Typography variant="caption" color={TEXT_MUTED} sx={{ fontSize: '0.75rem' }}>
                          COD Charges: <strong>₹{codCharges.toLocaleString('en-IN')}</strong>
                        </Typography>
                      </Stack>
                    )}
                    {courier?.notes && (
                      <Tooltip title={courier.notes} arrow>
                        <Chip
                          label="Special Notes"
                          size="small"
                          sx={{
                            height: 24,
                            fontSize: '0.7rem',
                            fontWeight: 500,
                            background: alpha(ACCENT, 0.08),
                            color: ACCENT,
                            border: `1px solid ${alpha(ACCENT, 0.2)}`,
                            cursor: 'help',
                            '&:hover': {
                              background: alpha(ACCENT, 0.12),
                            },
                          }}
                        />
                      </Tooltip>
                    )}
                  </Stack>

                  <Typography
                    variant="body2"
                    sx={{
                      mt: 2.25,
                      display: 'block',
                      textAlign: 'left',
                      color: '#0B2348',
                      letterSpacing: '0.02em',
                      fontWeight: 700,
                      borderTop: `1px solid ${alpha('#0B2348', 0.14)}`,
                      pt: 1.1,
                    }}
                  >
                    {aggregatorName}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>
    </Box>
  )
}
