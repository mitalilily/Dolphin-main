import { alpha, Grid, Paper, Stack, Typography } from '@mui/material'
import { type FieldErrors } from 'react-hook-form'
import { FaMoneyBillWave, FaRupeeSign, FaShoppingCart } from 'react-icons/fa'
import type { B2CFormData } from './b2c/B2COrderForm'

const ACCENT = '#0D3B8E'
const TEXT_PRIMARY = '#102A54'

interface OrderSummaryProps {
  subtotal: number
  totalOrderValue: number
  totalCollectable: number
  errors?: FieldErrors<B2CFormData>
}

const AmountSummaryCard = ({
  subtotal,
  totalOrderValue,
  totalCollectable,
  errors,
}: OrderSummaryProps) => {
  const hasError = (field?: string) =>
    field && errors && errors[field as keyof B2CFormData] ? true : false

  return (
    <Grid size={12}>
      <Paper
        sx={{
          p: 3,
          mt: 1,
          borderRadius: 3,
          backgroundColor: '#FFFFFF',
          color: TEXT_PRIMARY,
          boxShadow: `0 4px 14px ${alpha(ACCENT, 0.06)}`,
          border: `1px solid ${alpha(ACCENT, 0.12)}`,
        }}
      >
        <Stack spacing={2}>
          {/* Sub-total */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <FaRupeeSign size={16} color={hasError('products') ? '#E74C3C' : ACCENT} />
              <Typography
                variant="body2"
                sx={{
                  color: hasError('products') ? '#E74C3C' : ACCENT,
                  fontWeight: 600,
                }}
              >
                Sub-total for Product(s)
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: TEXT_PRIMARY, fontWeight: 700 }}>
              ₹{' '}
              {subtotal.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </Stack>

          {/* Total Order Value */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <FaShoppingCart
                size={15}
                color={hasError('totalOrderValue') ? '#E74C3C' : ACCENT}
              />
              <Typography
                variant="body2"
                sx={{
                  color: hasError('totalOrderValue') ? '#E74C3C' : ACCENT,
                  fontWeight: 600,
                }}
              >
                Total Order Value
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: TEXT_PRIMARY, fontWeight: 700 }}>
              ₹{' '}
              {totalOrderValue.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </Stack>

          {/* Total Collectable */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{
              mt: 1,
              pt: 1.5,
              borderTop: `2px solid ${hasError('prepaidAmount') ? '#E74C3C' : ACCENT}`,
              backgroundColor: hasError('prepaidAmount')
                ? alpha('#E74C3C', 0.05)
                : alpha(ACCENT, 0.05),
              borderRadius: 2.5,
              px: 2.5,
              py: 1.5,
              transition: 'all 0.2s ease',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <FaMoneyBillWave
                size={20}
                color={hasError('prepaidAmount') ? '#E74C3C' : ACCENT}
              />
              <Typography
                variant="body1"
                fontWeight={700}
                sx={{
                  color: hasError('prepaidAmount') ? '#E74C3C' : ACCENT,
                  fontSize: { xs: '0.95rem', sm: '1rem' },
                }}
              >
                Total Collectable Value
              </Typography>
            </Stack>
            <Typography
              variant="body1"
              fontWeight={700}
              sx={{
                color: hasError('prepaidAmount') ? '#E74C3C' : TEXT_PRIMARY,
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
              }}
            >
              ₹{' '}
              {totalCollectable.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </Stack>
        </Stack>
      </Paper>
    </Grid>
  )
}

export default AmountSummaryCard
