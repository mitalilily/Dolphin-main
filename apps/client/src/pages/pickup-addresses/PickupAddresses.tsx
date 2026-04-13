/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { BiDownload, BiUpload } from 'react-icons/bi'
import { FiMoreVertical, FiPlus } from 'react-icons/fi'

import { useQueryClient } from '@tanstack/react-query'
import { FilterBar, type FilterField } from '../../components/FilterBar'
import AddPickupAddressForm from '../../components/pickups/AddPickupAddressForm'
import ExportConfirmDialog from '../../components/pickups/ExportConfirmDialog'
import PickupAddressesList from '../../components/pickups/PickupAddressesList'
import UploadPickupCSVModal from '../../components/pickups/UploadPickupCSV'
import CustomDrawer from '../../components/UI/drawer/CustomDrawer'
import TableSkeleton from '../../components/UI/table/TableSkeleton'
import { toast } from '../../components/UI/Toast'
import {
  useExportPickupAddresses,
  useImportPickupAddresses,
  usePickupAddresses,
} from '../../hooks/Pickup/usePickupAddresses'
import type { HydratedPickup } from '../../types/generic.types'

// ✅ Filter fields with sortBy
const filterFields: FilterField[] = [
  {
    name: 'sortBy',
    label: 'Sort By',
    type: 'select',
    options: [
      { label: 'Latest Added', value: 'latest' },
      { label: 'Oldest First', value: 'oldest' },
      { label: 'Name (A-Z)', value: 'az' },
      { label: 'Name (Z-A)', value: 'za' },
    ],
    placeholder: 'Select sort order',
  },
  {
    name: 'name',
    label: 'Warehouse Name',
    type: 'text',
    placeholder: 'Search for name...',
  },
  {
    name: 'isPrimary',
    label: 'Primary',
    type: 'select',
    options: [
      { label: 'All', value: '' },
      { label: 'Yes', value: true },
      { label: 'No', value: false },
    ],
  },
  {
    name: 'pincode',
    label: 'Pincode',
    isAdvanced: true,
    type: 'text',
    placeholder: 'Search for Pincode...',
  },
  {
    name: 'city',
    label: 'City',
    isAdvanced: true,
    type: 'text',
    placeholder: 'Search for City...',
  },
  {
    name: 'state',
    label: 'State',
    isAdvanced: true,
    type: 'text',
    placeholder: 'Search for State...',
  },
  {
    name: 'isPickupEnabled',
    label: 'Status',
    type: 'select',
    isAdvanced: true,
    options: [
      { label: 'All', value: '' },
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
    ],
  },
]

const initialFilterValues = {
  name: '',
  city: '',
  state: '',
  pincode: '',
  sortBy: '',
  isPickupEnabled: '',
  isPrimary: '',
}

const PickupAddresses = () => {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerType, setDrawerType] = useState<'filter' | 'add' | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [showExportConfirm, setShowExportConfirm] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  const queryClient = useQueryClient()

  const { mutate: exportAddresses, isPending: isExporting } = useExportPickupAddresses()

  const { mutateAsync: importAddresses, isPending } = useImportPickupAddresses()

  const [filters, setFilters] = useState<Partial<HydratedPickup>>({})
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const { data, isLoading, isError } = usePickupAddresses({
    ...filters,
    page: page + 1,
    limit: rowsPerPage,
  })

  // Action menu for mobile
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const openMenu = (e: React.MouseEvent<HTMLElement>) => setMenuAnchor(e.currentTarget)
  const closeMenu = () => setMenuAnchor(null)

  const handleImport = () => {
    setImportDialogOpen(true)
    closeMenu()
  }

  const handleExport = () => {
    setShowExportConfirm(true)
    closeMenu()
  }

  const confirmImport = (data: HydratedPickup[]) => {
    importAddresses(data, {
      onSuccess: () => {
        toast.open({
          message: 'Pickup addresses imported successfully.',
          severity: 'success',
        })
        queryClient.invalidateQueries({
          queryKey: ['pickupAddresses', filters],
        })
        setImportDialogOpen(false)
      },
      onError: () =>
        toast.open({
          message: 'Failed to import pickup addresses.',
          severity: 'error',
        }),
    })
  }

  const confirmExport = () => {
    setShowExportConfirm(false)
    exportAddresses(
      { ...filters, page: undefined, limit: undefined }, // Don't send pagination
      {
        onSuccess: () =>
          toast.open({
            message: 'Pickup addresses exported successfully.',
            severity: 'success',
          }),
        onError: () =>
          toast.open({
            message: 'Failed to export pickup addresses.',
            severity: 'error',
          }),
      },
    )
  }

  const handleFilterApply = (filters: Partial<HydratedPickup>) => {
    setFilters({ ...filters })
  }
  const handleOpenAddDrawer = () => {
    setDrawerType('add')
    setDrawerOpen(true)
    setMenuAnchor(null)
  }

  const handleCloseDrawer = () => {
    setDrawerType(null)
    setDrawerOpen(false)
  }

  const appliedFilterCount = useMemo(() => {
    return Object.entries(filters).filter(([_, v]) => v !== '' && v !== undefined && v !== null)
      .length
  }, [filters])

  if (isError)
    return (
      <Typography color="error" textAlign="center" mt={4}>
        Failed to load pickup addresses.
      </Typography>
    )

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <FilterBar<Partial<HydratedPickup>>
          fields={filterFields}
          defaultValues={initialFilterValues as unknown as Partial<HydratedPickup>}
          onApply={handleFilterApply}
          appliedCount={
            Object.entries(filters)?.filter(([_, v]) => v !== '' && v !== undefined && v !== null)
              .length
          }
          loading={isLoading}
        />
        {/* Right side: Actions */}
        <Stack ml={!isMobile ? '50px' : 0} direction="row" spacing={1} alignItems="center">
          {/* Mobile menu icon */}
          {isMobile ? (
            <>
              <IconButton onClick={openMenu}>
                <FiMoreVertical />
              </IconButton>
              <Menu
                slotProps={{
                  paper: {
                    sx: {
                      mt: 1,
                      width: 200,
                      bgcolor: 'primary.dark',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 2,
                      overflow: 'hidden',
                      boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
                      position: 'relative',
                    },
                  },
                }}
                anchorEl={menuAnchor}
                open={!!menuAnchor}
                onClose={closeMenu}
              >
                <MenuItem
                  sx={{ display: 'flex', alignItems: 'center', gap: '13px' }}
                  onClick={() => handleOpenAddDrawer()}
                >
                  <FiPlus size={18} />
                  Add
                </MenuItem>
                <MenuItem
                  sx={{ display: 'flex', alignItems: 'center', gap: '13px' }}
                  onClick={handleImport}
                >
                  {' '}
                  <BiUpload />
                  Import
                </MenuItem>
                <MenuItem
                  sx={{ display: 'flex', alignItems: 'center', gap: '13px' }}
                  onClick={handleExport}
                >
                  {isExporting ? (
                    <>
                      {' '}
                      <CircularProgress /> Exporting...{' '}
                    </>
                  ) : (
                    <>
                      <BiDownload size={18} /> Export{' '}
                    </>
                  )}
                </MenuItem>
              </Menu>
            </>
          ) : (
            // Desktop actions
            <>
              <Button
                size="small"
                variant="contained"
                startIcon={<FiPlus size={18} />}
                onClick={() => handleOpenAddDrawer()}
              >
                Add
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<BiUpload size={18} />}
                onClick={handleImport}
              >
                Import
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<BiDownload size={18} />}
                onClick={handleExport}
              >
                Export
              </Button>
            </>
          )}
        </Stack>
      </Stack>

      <Divider sx={{ display: { xs: 'block', md: 'none' } }} />

      {/* Pickup list */}
      <Box>
        {isLoading ? (
          <TableSkeleton />
        ) : (
          <PickupAddressesList
            listData={data?.pickupAddresses ?? []}
            totalCount={data?.totalCount ?? 0}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={(limit) => {
              setRowsPerPage(limit)
              setPage(0)
            }}
          />
        )}
      </Box>

      <ExportConfirmDialog
        open={showExportConfirm}
        onConfirm={confirmExport}
        filterCount={appliedFilterCount}
        onClose={() => setShowExportConfirm(false)}
      />
      <UploadPickupCSVModal
        onClose={() => setImportDialogOpen(false)}
        onConfirm={(data) => confirmImport(data)}
        open={importDialogOpen}
        loading={isPending}
      />
      {/* Filter drawer for mobile */}
      <CustomDrawer
        open={drawerOpen}
        onClose={handleCloseDrawer}
        width={isMobile ? '100%' : drawerType === 'add' ? 1100 : 400}
        anchor={drawerType === 'filter' && isMobile ? 'left' : 'right'}
        title={drawerType === 'add' ? 'Add New Pickup Address' : 'Filter Pickup Addresses'}
      >
        {drawerType === 'add' ? (
          <AddPickupAddressForm setDrawer={setDrawerOpen} />
        ) : (
          <FilterBar<Partial<HydratedPickup>>
            fields={filterFields}
            defaultValues={{}}
            onApply={(filters) => {
              handleFilterApply(filters)
              handleCloseDrawer()
            }}
            loading={isLoading}
          />
        )}
      </CustomDrawer>
    </Stack>
  )
}

export default PickupAddresses
