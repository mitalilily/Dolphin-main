import {
  Avatar,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import React, { useState } from 'react'
import { FaArrowDown, FaArrowUp } from 'react-icons/fa'
import { FilterBar, type FilterField } from '../../components/FilterBar'
import PageHeading from '../../components/UI/heading/PageHeading'
import { useWalletTransactions } from '../../hooks/useWalletBalance'

interface WalletFilter {
  type?: 'credit' | 'debit' | ''
  reason?: string
  dateFrom?: string
  dateTo?: string
}

const WALLET_DEBIT_FILTER_OPTIONS = [
  { label: 'All Debit Types', value: '' },
  { label: 'B2C Prepaid Charges', value: 'B2C Prepaid Order Payment' },
  { label: 'B2C COD Charges', value: 'B2C COD Service Charges' },
  { label: 'Reverse Shipment', value: 'reverse_shipment' },
  { label: 'Invoice Payment', value: 'invoice_payment' },
  { label: 'Invoice Credits/Waivers', value: 'invoice_credits_waivers' },
  { label: 'Weight Discrepancy', value: 'Weight discrepancy accepted by customer' },
  { label: 'Dispute Rejected', value: 'Dispute rejected by admin' },
]

const WalletTransactions = () => {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<WalletFilter>({})

  const { data, isLoading, isError } = useWalletTransactions({
    limit: 10,
    page,
    type: filters.type || undefined,
    reason: filters.type === 'debit' ? filters.reason || undefined : undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
  })

  const transactions = data?.transactions ?? []
  const totalCount = data?.totalCount ?? 0
  const hasNextPage = page * 10 < totalCount

  const filterFields: FilterField[] = [
    {
      name: 'type',
      label: 'Transaction Type',
      type: 'select',
      options: [
        { label: 'All', value: '' },
        { label: 'Credit', value: 'credit' },
        { label: 'Debit', value: 'debit' },
      ],
    },
    {
      name: 'reason',
      label: 'Debit Type',
      type: 'select',
      options: WALLET_DEBIT_FILTER_OPTIONS,
    },
    { name: 'dateFrom', label: 'From Date', type: 'date' },
    { name: 'dateTo', label: 'To Date', type: 'date' },
  ]

  if (isError)
    return (
      <Typography color="#E74C3C" sx={{ p: 4, textAlign: 'center' }}>
        Error loading Transactions
      </Typography>
    )

  return (
    <Stack gap={3} p={4}>
      <PageHeading
        eyebrow="Billing Panel"
        title="Wallet Transactions"
        subtitle="Track balance movement, filter credits and debits, and review recharge activity in the same billing workspace."
      />
      {/* Wallet Balance Card (back to your original solid look) */}
      <Card
        sx={{
          mb: 3,
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <CardContent>
          <Typography variant="subtitle2" color="#333369" sx={{ fontWeight: 600 }}>
            Current Wallet Balance
          </Typography>
          {isLoading ? (
            <Skeleton variant="text" width={120} height={48} />
          ) : (
            <Typography variant="h4" fontWeight="bold" color="#1A1A1A">
              ₹{Number(data?.wallet?.balance)?.toFixed(2)}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* FilterBar */}

      <FilterBar<WalletFilter>
        fields={filterFields}
        defaultValues={filters}
        onApply={(vals) => {
          setFilters(vals)
          setPage(1) // reset page when filters change
        }}
        loading={isLoading}
      />

      {/* Transaction List */}
      <Paper
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        {isLoading ? (
          <Stack gap={1.5} p={3}>
            {Array.from({ length: 5 }).map((_, idx) => (
              <Skeleton key={idx} variant="rectangular" height={60} />
            ))}
          </Stack>
        ) : transactions.length > 0 ? (
          <List disablePadding>
            {transactions.map((txn, idx) => (
              <React.Fragment key={txn.id}>
                <ListItem sx={{ px: 3, py: 2 }}>
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        bgcolor:
                          txn.type === 'credit'
                            ? 'rgba(61, 213, 152, 0.1)'
                            : 'rgba(231, 76, 60, 0.1)',
                        color: txn.type === 'credit' ? '#3DD598' : '#E74C3C',
                        border: txn.type === 'credit' ? '1px solid #3DD598' : '1px solid #E74C3C',
                      }}
                    >
                      {txn.type === 'credit' ? <FaArrowDown /> : <FaArrowUp />}
                    </Avatar>
                  </ListItemAvatar>

                  <ListItemText
                    primary={
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography fontWeight="medium" fontSize={15} color="#1A1A1A">
                          {txn.reason || 'Transaction'}
                        </Typography>
                        <Chip
                          label={`${txn.type === 'credit' ? '+' : '-'}₹${Number(
                            txn?.amount,
                          ).toFixed(2)}`}
                          size="small"
                          sx={{
                            fontWeight: 'bold',
                            backgroundColor:
                              txn.type === 'credit'
                                ? 'rgba(61, 213, 152, 0.1)'
                                : 'rgba(231, 76, 60, 0.1)',
                            color: txn.type === 'credit' ? '#3DD598' : '#E74C3C',
                            border:
                              txn.type === 'credit' ? '1px solid #3DD598' : '1px solid #E74C3C',
                          }}
                        />
                      </Stack>
                    }
                    secondary={
                      <Stack mt={0.5} gap={0.5}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" color="#6B7280">
                            {txn.meta?.order_number
                              ? `Order: ${txn.meta.order_number}`
                              : txn.ref
                                ? `Ref: ${txn.ref}`
                                : '—'}
                          </Typography>
                          <Typography variant="caption" color="#6B7280">
                            {new Date(txn.created_at).toLocaleString()}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="#6B7280">
                          {txn.meta?.order_number
                            ? `Breakdown: Freight ₹${Number(txn.meta?.freight_charges || 0).toFixed(2)} | Other ₹${Number(txn.meta?.other_charges || 0).toFixed(2)} | COD ₹${Number(txn.meta?.cod_charges || 0).toFixed(2)}`
                            : ' '}
                        </Typography>
                      </Stack>
                    }
                  />
                </ListItem>
                {idx !== transactions.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography textAlign="center" p={4} color="#6B7280">
            No transactions found.
          </Typography>
        )}
      </Paper>

      {/* Pagination */}
      <Stack direction="row" justifyContent="flex-end" spacing={2}>
        <Button
          variant="outlined"
          disabled={page === 1 || isLoading}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </Button>
        <Button
          variant="outlined"
          disabled={!hasNextPage || isLoading}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </Stack>
    </Stack>
  )
}

export default WalletTransactions
