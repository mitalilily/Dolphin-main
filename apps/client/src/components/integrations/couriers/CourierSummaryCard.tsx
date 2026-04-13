// src/components/CourierSummaryCard.tsx
import { Box, Card, CardContent, Grid, Typography } from '@mui/material'
import {
  FaExclamationTriangle,
  FaMapMarkedAlt,
  FaShippingFast,
  FaStore,
  FaUndoAlt,
} from 'react-icons/fa'
import type { CourierSummary } from '../../../api/courier'

interface Props {
  summary: CourierSummary
}

const summaryItems = (summary: CourierSummary) => [
  {
    label: 'Total Couriers',
    value: summary.totalCourierCount,
    icon: <FaShippingFast size={28} color="#1976d2" />,
  },
  {
    label: 'Serviceable Pincodes',
    value: summary.serviceablePincodesCount,
    icon: <FaMapMarkedAlt size={28} color="#2e7d32" />,
  },
  {
    label: 'Pickup Pincodes',
    value: summary.pickupPincodesCount,
    icon: <FaStore size={28} color="#0288d1" />,
  },
  {
    label: 'Total RTO Count',
    value: summary.totalRtoCount,
    icon: <FaUndoAlt size={28} color="#f9a825" />,
  },
  {
    label: 'Total ODA Count',
    value: summary.totalOdaCount,
    icon: <FaExclamationTriangle size={28} color="#d32f2f" />,
  },
]

export default function CourierSummaryCard({ summary }: Props) {
  return (
    <Grid container spacing={2}>
      {summaryItems(summary).map(({ label, value, icon }) => (
        <Grid
          key={label}
          size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}
          sx={{
            flex: '1 1 auto',
            display: 'flex',
          }}
        >
          <Card
            variant="outlined"
            sx={{
              width: '100%',
              background: '#FFFFFF',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <CardContent
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                px: 2,
                py: 1.5,
              }}
            >
              <Box>{icon}</Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {label}
                </Typography>
                <Typography variant="h6" fontWeight={600}>
                  {value}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}
