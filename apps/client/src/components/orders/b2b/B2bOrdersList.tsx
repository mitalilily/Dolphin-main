import { Button, Link, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import type { ReactNode } from 'react'
import moment from 'moment'
import { useB2BOrdersByUser, useGenerateManifest } from '../../../hooks/Orders/useOrders'
import type { B2BOrder } from '../../../types/generic.types'
import StatusChip from '../../UI/chip/StatusChip'
import DataTable, { type Column } from '../../UI/table/DataTable'
import TableSkeleton from '../../UI/table/TableSkeleton'
import { OrderExpandedRow } from '../OrderExpandedRow'

export const statusColorMap: Record<string, 'success' | 'pending' | 'error' | 'info'> = {
  delivered: 'success',
  processing: 'pending',
  cancelled: 'error',
  pending: 'info',
  shipment_booked: 'info',
  manifest_generated: 'success',
}

interface B2BOrdersListProps {
  page: number
  rowsPerPage: number
  setPage: (page: number) => void
  setRowsPerPage: (rows: number) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters: any
}

const B2BOrdersList = ({
  page,
  rowsPerPage,
  setPage,
  setRowsPerPage,
  filters,
}: B2BOrdersListProps) => {
  const { data, isLoading, isError } = useB2BOrdersByUser(page, rowsPerPage, filters)
  const { mutate: triggerManifest, isPending: isGeneratingManifest } = useGenerateManifest()
  const [manifestingAwb, setManifestingAwb] = useState<string | null>(null)

  const handleGenerateManifest = (order: B2BOrder) => {
    if (!order.awb_number) return
    setManifestingAwb(order.awb_number)
    triggerManifest(
      { awbs: [order.awb_number], type: 'b2b' },
      {
        onSettled: () => {
          setManifestingAwb((current) => (current === order.awb_number ? null : current))
        },
      },
    )
  }

  const hasLabelGenerated = (row: B2BOrder) =>
    Boolean(String(row.label_url || row.label_key || row.label || '').trim())

  const hasInvoiceGenerated = (row: B2BOrder) =>
    Boolean(String(row.invoice_url || row.invoice_key || row.invoice_link || '').trim())

  const columns: Column<B2BOrder>[] = [
    {
      label: 'Source',
      id: 'is_external_api',
      render: (_, row) => (
        <StatusChip
          label={row.is_external_api ? 'API' : 'Local'}
          status={row.is_external_api ? 'info' : 'success'}
        />
      ),
    },
    { label: 'Order #', id: 'order_number' },
    { label: 'AWB', id: 'awb_number' },
    {
      label: 'Docs',
      id: 'id',
      minWidth: 220,
      sticky: 'right',
      stickyOffset: 140,
      render: (_v, row) => (
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
          <StatusChip
            label={hasLabelGenerated(row) ? 'Label Generated' : 'Label Pending'}
            status={hasLabelGenerated(row) ? 'success' : 'pending'}
          />
          <StatusChip
            label={hasInvoiceGenerated(row) ? 'Invoice Generated' : 'Invoice Pending'}
            status={hasInvoiceGenerated(row) ? 'success' : 'pending'}
          />
        </Stack>
      ),
    },
    { label: 'Buyer', id: 'buyer_name' },
    { label: 'Amount', id: 'order_amount', render: (v) => `₹${Number(v)?.toFixed(2)}` },
    { label: 'Courier', id: 'courier_partner' },
    {
      label: 'Source',
      id: 'is_external_api',
      render: (_v, row) => (
        <StatusChip
          label={row.is_external_api ? 'API' : 'Local'}
          status={row.is_external_api ? 'info' : 'success'}
        />
      ),
    },
    {
      label: 'Status',
      id: 'order_status',
      minWidth: 150,
      sticky: 'right',
      stickyOffset: 360,
      render: (v) => <StatusChip label={v} status={statusColorMap[v] || 'info'} />,
    },
    { label: 'Order Date', id: 'order_date', render: (v) => moment(v).format('DD MMM YYYY') },
    { label: 'Last Updated', id: 'updated_at', render: (v) => moment(v).format('DD MMM YYYY') },
    {
      label: 'Actions',
      id: 'id',
      minWidth: 140,
      sticky: 'right',
      stickyOffset: 0,
      render: (_, row) => {
        const courierText = (row.courier_partner || '').toLowerCase()
        const integrationText = String((row as B2BOrder & { integration_type?: string }).integration_type || '').toLowerCase()
        const isXpressbees =
          integrationText === 'xpressbees' || courierText.includes('xpressbees')
        const isEkart = integrationText === 'ekart' || courierText.includes('ekart')

        const canManifest = !!row.awb_number && !row.manifest && (isXpressbees || isEkart)

        const actions: ReactNode[] = []

        if (canManifest) {
          const isThisManifesting = isGeneratingManifest && manifestingAwb === row.awb_number
          actions.push(
            <Button
              key="manifest"
              size="small"
              variant="contained"
              disabled={isThisManifesting}
              onClick={(e) => {
                e.stopPropagation()
                handleGenerateManifest(row)
              }}
            >
              {isThisManifesting ? 'Manifesting…' : 'Manifest'}
            </Button>,
          )
        }

        if (row.manifest) {
          actions.push(
            <Link
              key="view-manifest"
              href={row.manifest}
              target="_blank"
              rel="noopener"
              underline="hover"
              onClick={(e) => e.stopPropagation()}
            >
              View
            </Link>,
          )
        }

        if (!actions.length) return null

        return <Stack direction="row" spacing={1}>{actions}</Stack>
      },
    },
  ]

  if (isError)
    return (
      <Typography color="error" textAlign="center" py={4}>
        Failed to fetch B2B orders
      </Typography>
    )

  return (
    <Stack spacing={2}>
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <DataTable<B2BOrder>
          rows={data?.orders || []}
          columns={columns}
          title="My B2B Orders"
          pagination
          currentPage={page}
          expandable
          renderExpandedRow={(row) => <OrderExpandedRow type="b2b" row={row} />}
          defaultRowsPerPage={rowsPerPage}
          totalCount={data?.totalCount || 0}
          onPageChange={setPage}
          onRowsPerPageChange={(newLimit) => {
            setRowsPerPage(newLimit)
            setPage(1)
          }}
        />
      )}
    </Stack>
  )
}

export default B2BOrdersList
