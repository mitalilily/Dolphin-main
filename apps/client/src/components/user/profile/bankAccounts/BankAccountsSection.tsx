import { alpha, Box, Button, Grid, Skeleton, Stack, Typography } from '@mui/material'
import React, { useState } from 'react'
import { MdOutlineAccountBalance } from 'react-icons/md'
import {
  useAddBankAccount,
  useBankAccounts,
  useDeleteBankAccount,
  useEditBankAccount,
  useMakePrimaryBankAccount,
} from '../../../../hooks/User/BankAccounts/useBankAccounts'
import type { BankAccount } from '../../../../types/user.types'
import { toast } from '../../../UI/Toast'
import { AddBankAccountDialog } from './AddBankAccountDialog'
import { BankAccountsList } from './BankAccountList'

const DE_BLUE = '#0052CC'
const DE_AMBER = '#FFAB00'
const BRAND_GRADIENT = `linear-gradient(135deg, ${DE_BLUE} 0%, ${DE_AMBER} 100%)`

export const BankAccountsSection: React.FC = () => {
  const [open, setOpen] = useState(false)
  const { data: accounts, isLoading } = useBankAccounts()
  const addBank = useAddBankAccount()
  const editBank = useEditBankAccount()

  const makePrimary = useMakePrimaryBankAccount()
  const delBank = useDeleteBankAccount()

  const [editing, setEditing] = useState<BankAccount | null>(null)

  const handleMakePrimary = (id: string) => {
    makePrimary.mutate(id, {
      onSuccess: () =>
        toast.open({
          message: 'Primary account updated!',
          severity: 'success',
        }),
      onError: (err) => toast.open({ message: err.message, severity: 'error' }),
    })
  }

  const openEdit = (id: string) => {
    const acc = accounts?.find((a: BankAccount) => a.id === id)
    if (acc) {
      setEditing(acc)
      setOpen(true)
    }
  }

  const handleAdd = (data: Partial<BankAccount>) => {
    if (editing) {
      /* ---------- EDIT ---------- */
      editBank.mutate(
        { id: editing.id, patch: data },
        {
          onSuccess: () => {
            toast.open({ message: 'Bank Account updated!' })
            setOpen(false)
            setEditing(null)
          },
          onError: () => toast.open({ message: 'Error updating Bank Account!' }),
        },
      )
    } else {
      /* ---------- ADD ---------- */
      addBank.mutate(data as BankAccount, {
        onSuccess: () => {
          toast.open({ message: 'Bank Account added successfully!' })
          setOpen(false)
        },
        onError: () => toast.open({ message: 'Error adding Bank Account!' }),
      })
    }
  }

  const handleDelete = (id: string) => {
    delBank.mutate(id, {
      onSuccess: () => toast.open({ message: 'Bank account deleted', severity: 'success' }),
      onError: (err) => toast.open({ message: err.message, severity: 'error' }),
    })
  }

  return (
    <Stack spacing={3} width={'100%'}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 1,
        }}
      >
        {accounts && accounts.length > 0 && (
          <Button variant="contained" onClick={() => setOpen(true)}>
            + Add Account
          </Button>
        )}
      </Box>

      {/* 👉 Loading skeletons */}
      {isLoading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 2 }).map((_, i) => (
            <Grid size={{ md: 6, xs: 12 }} key={i}>
              <Skeleton
                variant="rectangular"
                animation="wave"
                height={190}
                sx={{
                  borderRadius: 3,
                  bgcolor: alpha(DE_BLUE, 0.04),
                  '&::after': {
                    background: `linear-gradient(90deg, transparent, ${alpha(
                      DE_BLUE,
                      0.08,
                    )}, transparent)`,
                  },
                }}
              />
            </Grid>
          ))}
        </Grid>
      ) : accounts?.length ? (
        <BankAccountsList
          onMakePrimary={handleMakePrimary}
          accounts={accounts}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      ) : (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            flexDirection: 'column',
            py: 8,
            px: 4,
            gap: 3,
            bgcolor: alpha(DE_BLUE, 0.04),
            borderRadius: 3,
            border: `2px dashed ${alpha(DE_BLUE, 0.2)}`,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: BRAND_GRADIENT,
              borderRadius: '12px 12px 0 0',
              opacity: 0.8,
            },
          }}
        >
          <Box
            sx={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              background: BRAND_GRADIENT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 16px ${alpha(DE_BLUE, 0.25)}`,
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: -4,
                borderRadius: '50%',
                background: BRAND_GRADIENT,
                opacity: 0.15,
                zIndex: 0,
              },
            }}
          >
            <MdOutlineAccountBalance
              size={48}
              color="#FFFFFF"
              style={{ zIndex: 1, position: 'relative' }}
            />
          </Box>
          <Stack spacing={1} alignItems="center" textAlign="center">
            <Typography
              variant="h6"
              fontWeight={700}
              sx={{
                background: BRAND_GRADIENT,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '1.125rem', md: '1.25rem' },
              }}
            >
              No Bank Accounts
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: '#6b6b6b', maxWidth: 400, fontSize: '0.9rem' }}
            >
              Add your bank account to receive payments and settlements securely
            </Typography>
          </Stack>
          <Button
            variant="contained"
            onClick={() => setOpen(true)}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2.5,
              fontWeight: 600,
              background: BRAND_GRADIENT,
              boxShadow: `0 4px 16px ${alpha(DE_BLUE, 0.3)}`,
              textTransform: 'none',
              color: '#FFFFFF',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 6px 20px ${alpha(DE_BLUE, 0.4)}`,
                background: `linear-gradient(135deg, ${DE_BLUE} 0%, ${DE_AMBER} 100%)`,
              },
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            + Add Bank Account
          </Button>
        </Box>
      )}

      {!accounts?.length && (
        <Box sx={{ display: 'none' }}>
          <AddBankAccountDialog open={open} onClose={() => setOpen(false)} onAdd={handleAdd} />
        </Box>
      )}

      <AddBankAccountDialog
        addingAccount={addBank.isPending || editBank.isPending}
        open={open}
        onClose={() => setOpen(false)}
        initialData={editing ?? undefined}
        onAdd={handleAdd}
      />
    </Stack>
  )
}
