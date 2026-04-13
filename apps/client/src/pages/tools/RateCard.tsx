// src/pages/client/RateCard.tsx

import {
  Avatar,
  Button,
  Card,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import Papa from 'papaparse'
import { useState } from 'react'
import { MdCalculate, MdDownload } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import { FilterBar, type FilterField } from '../../components/FilterBar'
import PageHeading from '../../components/UI/heading/PageHeading'
import { SmartTabs } from '../../components/UI/tab/Tabs'
import type { Column } from '../../components/UI/table/DataTable'
import DataTable from '../../components/UI/table/DataTable'
import TableSkeleton from '../../components/UI/table/TableSkeleton'
import { useAllCouriers, useShippingRates } from '../../hooks/Integrations/useCouriers'
import { useZones } from '../../hooks/useZones'
import { courierLogos, defaultLogo } from '../../utils/constants'

interface ShippingRate {
  id: string | number
  courier_name: string
  mode: string
  min_weight: number
  cod_charges?: number | string
  cod_percent?: number | string
  other_charges?: number | string
  rates: {
    [zone: string]: {
      forward?: number | string
      rto?: number | string
      description?: string
      forward_per_kg?: number | string
      rto_per_kg?: number | string
      min_weight?: number
    }
  }
}

// --- B2C Table ---
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const B2CClientTable = ({ data, zones }: { data: ShippingRate[]; zones: any[] }) => {
  const columns: Column<ShippingRate>[] = [
    {
      id: 'courier_name',
      label: 'Courier',
      render: (_, row) => {
        const logoSrc =
          Object.entries(courierLogos)?.find(([key]) =>
            row?.courier_name?.toLowerCase().includes(key.toLowerCase()),
          )?.[1] ?? defaultLogo
        return (
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar
              src={logoSrc || defaultLogo}
              alt={row.courier_name}
              sx={{ width: 24, height: 24 }}
            />
            <Typography fontWeight={500}>{row.courier_name}</Typography>
          </Stack>
        )
      },
    },
    { id: 'min_weight', label: 'Min Weight (kg)' },
    ...zones.map(
      (zone: { code: string; description: string; name: string }) =>
        ({
          id: zone.code,
          label: `${zone.name} (F | RTO)`,
          label_desc: zone?.description,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          render: (_: any, row: any) => {
            const rates = row.rates?.[zone.name] || {}

            const forward = rates.forward ?? 'NA'
            const rto = rates.rto ?? 'NA'

            return `Forward: ₹${forward} | RTO: ₹${rto}`
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any),
    ),

    {
      id: 'cod',
      label: 'COD (Charges | %)',
      render: (_, row) => `₹${row.cod_charges ?? '0'} | ${row.cod_percent ?? '0'}%`,
    },
    {
      id: 'other',
      label: 'Other Charges',
      render: (_, row) => `₹${row.other_charges ?? '0'}`,
    },
  ]

  return (
    <DataTable
      rows={data}
      columns={columns}
      title="Shipping Rate Card - B2C"
      totalCount={data.length}
    />
  )
}

// --- B2B Table ---
const B2BClientTable = ({
  data,
  zones,
}: {
  data: ShippingRate[]
  zones: { code: string; id: string; description: string; name: string }[]
}) => {
  if (!data?.length) {
    return <Typography>No B2B rates available</Typography>
  }

  return (
    <Stack spacing={3}>
      {data.map((courier) => (
        <Card key={courier.courier_name} sx={{ p: 2 }}>
          <CardContent>
            <Stack spacing={1}>
              <Typography variant="h6">{courier.courier_name}</Typography>
              <Typography variant="body2">Min Weight: {courier.min_weight} kg</Typography>
              <Typography variant="body2">
                COD: ₹{courier.cod_charges ?? '0'} | {courier.cod_percent ?? '0'}%
              </Typography>
              <Typography variant="body2">Other: ₹{courier.other_charges ?? '0'}</Typography>
            </Stack>

            <Table size="small" sx={{ mt: 2 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Zone</TableCell>
                  <TableCell>Forward (Per Kg)</TableCell>
                  <TableCell>RTO (Per Kg)</TableCell>
                  <TableCell>Min Weight</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {zones.map((zone) => {
                  const rates = courier.rates?.[zone.name] || {}
                  return (
                    <TableRow key={zone.code}>
                      <TableCell>{zone.name}</TableCell>
                      <TableCell>₹{rates.forward_per_kg ?? 'NA'}</TableCell>
                      <TableCell>₹{rates.rto_per_kg ?? 'NA'}</TableCell>
                      <TableCell>{rates.min_weight ?? courier.min_weight ?? 'NA'} kg</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </Stack>
  )
}

// --- Main Component ---
const RateCard = () => {
  const navigate = useNavigate()
  const [businessType, setBusinessType] = useState<'b2c' | 'b2b'>('b2c') // 0 = B2C, 1 = B2B
  const [filters, setFilters] = useState({
    courier: [] as string[],
    min_weight: '',
  })

  const { zones } = useZones(businessType)
  const { data: couriers } = useAllCouriers()
  const { data, isLoading, isError } = useShippingRates({ ...filters, businessType: businessType })

  const rates: ShippingRate[] = data || []

  console.log('rates', rates)

  // CSV export
  const handleExportCSV = (): void => {
    const csvData = rates.map((r) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const base: Record<string, any> = {
        Courier: r.courier_name,
        Mode: r.mode,
        'Min Weight': r.min_weight,
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      zones.forEach((zone: any) => {
        // NOTE: UI tables use `zone.name` as the key into `rates`, so CSV export
        // should use the same to avoid returning NA for all values.
        const zoneRates = r.rates?.[zone.name] || {}
        if (businessType === 'b2b') {
          base[`${zone.name} (Per Kg)`] = `F: ₹${zoneRates.forward_per_kg ?? 'NA'} | RTO: ₹${
            zoneRates.rto_per_kg ?? 'NA'
          }`
        } else {
          base[`${zone.name} (F | RTO)`] = `F: ₹${zoneRates.forward ?? 'NA'} | RTO: ₹${
            zoneRates.rto ?? 'NA'
          }`
        }
      })

      base['COD Charges'] = r.cod_charges ?? 'N/A'
      base['COD %'] = r.cod_percent ?? 'N/A'
      base['Other Charges'] = r.other_charges ?? 'N/A'

      return base
    })

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', `rate_card_${businessType}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filter fields (courier + min_weight only, business type comes from tab)
  const filterFields: FilterField[] = [
    {
      name: 'courier',
      label: 'Courier',
      type: 'multiselect',
      options: couriers?.map((c: string) => ({ label: c, value: c })) || [],
    },
    { name: 'min_weight', label: 'Min Weight (kg)', type: 'text', placeholder: 'Enter min weight' },
  ]

  return (
    <Stack gap={3}>
      <PageHeading
        eyebrow="Tools Panel"
        title="Rate Card"
        subtitle="Review B2C and B2B rate slabs, filter courier pricing, and export the latest commercial matrix from one utility workspace."
      />

      {/* Tabs for B2C / B2B */}
      <SmartTabs
        tabs={[
          { label: 'B2C', value: 'b2c' },
          { label: 'B2B', value: 'b2b' },
        ]}
        value={businessType}
        onChange={(value) => setBusinessType(value)}
      />

      <FilterBar
        fields={filterFields}
        defaultValues={filters}
        onApply={(applied) => {
          setFilters((prev) => ({
            ...prev,
            ...applied,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            courier: applied?.courier?.map((cour) => (cour as any)?.value),
          }))
        }}
      />

      <Stack justifyContent="flex-end" gap={2.5} alignItems="center" direction="row">
        <Button
          startIcon={<MdCalculate />}
          variant="contained"
          onClick={() => navigate('/tools/rate_calculator')}
        >
          Calculate Rates
        </Button>
        <Button startIcon={<MdDownload />} variant="contained" onClick={handleExportCSV}>
          Download Rate Card
        </Button>
      </Stack>

      {isLoading ? (
        <TableSkeleton />
      ) : isError ? (
        <Typography color="error">Error loading shipping rates</Typography>
      ) : businessType === 'b2b' ? (
        <B2BClientTable zones={zones} data={rates} />
      ) : (
        <B2CClientTable data={rates} zones={zones} />
      )}
    </Stack>
  )
}

export default RateCard
