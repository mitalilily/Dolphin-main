import { Box, Button, Chip, Grid, Stack, Typography, useMediaQuery, useTheme } from '@mui/material'
import moment from 'moment'
import { useState } from 'react'
import { BiCheckCircle } from 'react-icons/bi'
import { CiEdit } from 'react-icons/ci'
import { useUpdatePickupAddress } from '../../hooks/Pickup/usePickupAddresses'
import type { HydratedPickup } from '../../types/generic.types'
import CustomDrawer from '../UI/drawer/CustomDrawer'
import CustomSwitch from '../UI/inputs/CustomSwitch'
import MapViewer from '../UI/map/MapViewer'
import DataTable, { type Column } from '../UI/table/DataTable'
import AddPickupAddressForm from './AddPickupAddressForm'

interface IPickupAddressListProps {
  listData: HydratedPickup[]
  totalCount: number
  page: number
  rowsPerPage: number
  onPageChange: (page: number) => void
  onRowsPerPageChange: (limit: number) => void
}

const PickupAddressesList = ({
  listData,
  totalCount,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: IPickupAddressListProps) => {
  const { mutate: updatePickupAddress } = useUpdatePickupAddress()
  const theme = useTheme()
  const isXs = useMediaQuery(theme.breakpoints.down('sm')) // mobile
  const isSm = useMediaQuery(theme.breakpoints.between('sm', 'md')) // tablet
  const isMd = useMediaQuery(theme.breakpoints.between('md', 'lg')) // small desktop
  const isLgUp = useMediaQuery(theme.breakpoints.up('lg')) // large desktop

  let drawerWidth: string | number = '100%' // default full width
  if (isXs) drawerWidth = '100%' // mobile full width
  else if (isSm) drawerWidth = '95%' // tablets
  else if (isMd) drawerWidth = '95%' // small desktops
  else if (isLgUp) drawerWidth = 1200 // large desktop fixed width
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<HydratedPickup | undefined>(undefined)

  const handleMakePrimary = (id: string) => {
    updatePickupAddress({ id, payload: { isPrimary: true } })
  }

  const handleEdit = (address: HydratedPickup) => {
    setSelectedAddress(address)
    setDrawerOpen(true)
  }

  const handleStatusToggle = (id: string, enabled: boolean) => {
    updatePickupAddress({ id, payload: { isPickupEnabled: enabled } })
  }

  const columns: Column<HydratedPickup>[] = [
    {
      id: 'pickup',
      label: 'Pickup Point',
      minWidth: 200,
      render: (_, row) => (
        <Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography fontWeight={600}>{row?.pickup?.addressNickname}</Typography>
            {row.isPrimary && (
              <Chip
                label="Primary"
                color="success"
                size="small"
                icon={<BiCheckCircle style={{ fontSize: 16 }} />}
                sx={{
                  fontWeight: 600,
                  letterSpacing: 0.3,
                  borderRadius: '8px',
                  px: 1,
                  py: 0.2,
                  bgcolor: 'success.light',
                  color: 'success.dark',
                  '& .MuiChip-icon': {
                    color: 'success.dark',
                  },
                }}
              />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {row.pickup?.contactName} • {row.pickup?.contactPhone}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'pickup',
      label: 'Address',
      minWidth: 250,
      render: (_, row) => (
        <Typography variant="body2" color="text.secondary">
          {row.pickup?.addressLine1}
          {row.pickup?.addressLine2 ? `, ${row.pickup?.addressLine2}` : ''}
          {row.pickup?.landmark ? `, ${row.pickup?.landmark}` : ''}
          <br />
          {row.pickup?.city}, {row.pickup?.state} – {row.pickup?.pincode}
          <br />
          {row?.pickup?.gstNumber && (
            <Typography variant="caption">{row?.pickup?.gstNumber}</Typography>
          )}
        </Typography>
      ),
    },
    {
      id: 'rto',
      label: 'RTO Warehouse name',
      minWidth: 250,
      render: (_, row) => (
        <Typography variant="body2" color="text.secondary">
          {row?.rto?.addressNickname ?? '-'}
        </Typography>
      ),
    },
    {
      id: 'isPickupEnabled',
      label: 'Status',
      minWidth: 120,
      render: (value, row) => (
        <CustomSwitch
          onChange={(event) => handleStatusToggle(row.pickupId, event.target.checked)}
          checked={Boolean(value)}
        />
      ),
    },
    {
      id: 'id',
      label: 'Actions',
      minWidth: 180,
      align: 'right',
      render: (_, row) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          {!row.isPrimary && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleMakePrimary(row?.pickupId)}
            >
              Make Primary
            </Button>
          )}
          <Button
            size="small"
            variant="outlined"
            sx={{ color: '#333369' }}
            onClick={() => handleEdit(row)}
            startIcon={<CiEdit />}
          >
            Edit
          </Button>
        </Stack>
      ),
    },
  ]

  return (
    <>
      <DataTable<HydratedPickup>
        rows={listData}
        columns={columns}
        title="Pickup Addresses"
        subTitle="Manage your pickup locations"
        maxHeight={500}
        bgOverlayImg="/images/locations-bg.png"
        pagination
        currentPage={page}
        defaultRowsPerPage={rowsPerPage}
        expandable
        totalCount={totalCount}
        onPageChange={onPageChange}
        onRowsPerPageChange={onRowsPerPageChange}
        renderExpandedRow={(row) => (
          <Box mt={2} mb={2}>
            <Grid container spacing={2}>
              {/* Pickup Section */}
              <Grid size={12}>
                <Typography variant="subtitle2" mb={1} fontWeight={700}>
                  Pickup Address
                </Typography>
              </Grid>

              {row.pickup?.contactName && (
                <Grid size={{ sm: 6, md: 4, xs: 12 }}>
                  <Typography fontSize={12} color="text.secondary">
                    Contact Name
                  </Typography>
                  <Typography fontWeight={500} fontSize={13}>
                    {row.pickup.contactName}
                  </Typography>
                </Grid>
              )}

              {row.pickup?.contactPhone && (
                <Grid size={{ sm: 6, md: 4, xs: 12 }}>
                  <Typography fontSize={12} color="text.secondary">
                    Contact Phone
                  </Typography>
                  <Typography fontWeight={500} fontSize={13}>
                    {row.pickup.contactPhone}
                  </Typography>
                </Grid>
              )}

              {row.pickup?.addressNickname && (
                <Grid size={{ sm: 6, md: 4, xs: 12 }}>
                  <Typography fontSize={12} color="text.secondary">
                    Address Nickname
                  </Typography>
                  <Typography fontWeight={500} fontSize={13}>
                    {row.pickup.addressNickname}
                  </Typography>
                </Grid>
              )}

              {row.pickup?.contactEmail && (
                <Grid size={{ sm: 6, md: 4, xs: 12 }}>
                  <Typography fontSize={12} color="text.secondary">
                    Contact Email
                  </Typography>
                  <Typography fontWeight={500} fontSize={13}>
                    {row.pickup.contactEmail}
                  </Typography>
                </Grid>
              )}

              {row.pickup?.addressLine1 && (
                <Grid size={{ sm: 6, md: 4, xs: 12 }}>
                  <Typography fontSize={12} color="text.secondary">
                    Address Line 1
                  </Typography>
                  <Typography fontWeight={500} fontSize={13}>
                    {row.pickup.addressLine1}
                  </Typography>
                </Grid>
              )}

              {row.pickup?.addressLine2 && (
                <Grid size={{ sm: 6, md: 4, xs: 12 }}>
                  <Typography fontSize={12} color="text.secondary">
                    Address Line 2
                  </Typography>
                  <Typography fontWeight={500} fontSize={13}>
                    {row.pickup.addressLine2}
                  </Typography>
                </Grid>
              )}

              {row.pickup?.city && (
                <Grid size={{ sm: 6, md: 4, xs: 12 }}>
                  <Typography fontSize={12} color="text.secondary">
                    City
                  </Typography>
                  <Typography fontWeight={500} fontSize={13}>
                    {row.pickup.city}
                  </Typography>
                </Grid>
              )}

              {row.pickup?.state && (
                <Grid size={{ sm: 6, md: 4, xs: 12 }}>
                  <Typography fontSize={12} color="text.secondary">
                    State
                  </Typography>
                  <Typography fontWeight={500} fontSize={13}>
                    {row.pickup.state}
                  </Typography>
                </Grid>
              )}

              {row.pickup?.country && (
                <Grid size={{ sm: 6, md: 4, xs: 12 }}>
                  <Typography fontSize={12} color="text.secondary">
                    Country
                  </Typography>
                  <Typography fontWeight={500} fontSize={13}>
                    {row.pickup.country}
                  </Typography>
                </Grid>
              )}

              {row.pickup?.pincode && (
                <Grid size={{ sm: 6, md: 4, xs: 12 }}>
                  <Typography fontSize={12} color="text.secondary">
                    Pincode
                  </Typography>
                  <Typography fontWeight={500} fontSize={13}>
                    {row.pickup.pincode}
                  </Typography>
                </Grid>
              )}

              {row.pickup?.latitude && row.pickup?.longitude && (
                <Grid size={{ sm: 6, md: 4, xs: 12 }}>
                  <Typography fontSize={13} mb={1.2} fontWeight={600}>
                    Pickup Location
                  </Typography>
                  <MapViewer
                    coords={{
                      lat: parseFloat(String(row.pickup.latitude)),
                      lng: parseFloat(String(row.pickup.longitude)),
                    }}
                    currentLocation={false}
                    draggable={false}
                    setCoords={() => {}}
                    height="140px"
                    width="240px"
                    zoom={15}
                  />
                </Grid>
              )}

              {/* Divider */}
              {row.rto && (
                <Grid size={12}>
                  <Typography variant="subtitle2" mt={2} mb={1} fontWeight={700}>
                    RTO Address
                  </Typography>
                </Grid>
              )}

              {/* Repeat the same block for RTO */}
              {row.rto?.contactName && (
                <Grid size={{ sm: 6, md: 4, xs: 12 }}>
                  <Typography fontSize={12} color="text.secondary">
                    Contact Name
                  </Typography>
                  <Typography fontWeight={500} fontSize={13}>
                    {row.rto.contactName}
                  </Typography>
                </Grid>
              )}

              {row.rto?.contactPhone && (
                <Grid size={{ sm: 6, md: 4, xs: 12 }}>
                  <Typography fontSize={12} color="text.secondary">
                    Contact Phone
                  </Typography>
                  <Typography fontWeight={500} fontSize={13}>
                    {row.rto.contactPhone}
                  </Typography>
                </Grid>
              )}

              {row.rto?.contactEmail && (
                <Grid size={{ sm: 6, md: 4, xs: 12 }}>
                  <Typography fontSize={12} color="text.secondary">
                    Contact Email
                  </Typography>
                  <Typography fontWeight={500} fontSize={13}>
                    {row.rto.contactEmail}
                  </Typography>
                </Grid>
              )}

              {row.rto?.addressLine1 && (
                <Grid size={{ sm: 6, md: 4, xs: 12 }}>
                  <Typography fontSize={12} color="text.secondary">
                    Address Line 1
                  </Typography>
                  <Typography fontWeight={500} fontSize={13}>
                    {row.rto.addressLine1}
                  </Typography>
                </Grid>
              )}

              {row.rto?.addressLine2 && (
                <Grid size={{ sm: 6, md: 4, xs: 12 }}>
                  <Typography fontSize={12} color="text.secondary">
                    Address Line 2
                  </Typography>
                  <Typography fontWeight={500} fontSize={13}>
                    {row.rto.addressLine2}
                  </Typography>
                </Grid>
              )}

              {row.rto?.city && (
                <Grid size={{ sm: 6, md: 4, xs: 12 }}>
                  <Typography fontSize={12} color="text.secondary">
                    City
                  </Typography>
                  <Typography fontWeight={500} fontSize={13}>
                    {row.rto.city}
                  </Typography>
                </Grid>
              )}

              {row.rto?.state && (
                <Grid size={{ sm: 6, md: 4, xs: 12 }}>
                  <Typography fontSize={12} color="text.secondary">
                    State
                  </Typography>
                  <Typography fontWeight={500} fontSize={13}>
                    {row.rto.state}
                  </Typography>
                </Grid>
              )}

              {row.rto?.country && (
                <Grid size={{ sm: 6, md: 4, xs: 12 }}>
                  <Typography fontSize={12} color="text.secondary">
                    Country
                  </Typography>
                  <Typography fontWeight={500} fontSize={13}>
                    {row.rto.country}
                  </Typography>
                </Grid>
              )}

              {row.rto?.pincode && (
                <Grid size={{ sm: 6, md: 4, xs: 12 }}>
                  <Typography fontSize={12} color="text.secondary">
                    Pincode
                  </Typography>
                  <Typography fontWeight={500} fontSize={13}>
                    {row.rto.pincode}
                  </Typography>
                </Grid>
              )}

              {row.rto?.latitude && row.rto?.longitude && (
                <Grid size={{ sm: 6, md: 4, xs: 12 }}>
                  <Typography fontSize={13} mb={1.2} fontWeight={600}>
                    RTO Location
                  </Typography>
                  <MapViewer
                    coords={{
                      lat: parseFloat(String(row.rto.latitude)),
                      lng: parseFloat(String(row.rto.longitude)),
                    }}
                    currentLocation={false}
                    draggable={false}
                    setCoords={() => {}}
                    height="140px"
                    width="240px"
                    zoom={15}
                  />
                </Grid>
              )}

              {/* Last Updated */}
              <Grid size={{ sm: 6, md: 4, xs: 12 }}>
                <Typography fontSize={12} color="text.secondary">
                  Last Updated
                </Typography>
                <Typography fontWeight={500} fontSize={13}>
                  {moment(row.updatedAt).format('DD MMM YYYY, hh:mm A')}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      />

      {/* Drawer for editing */}

      <CustomDrawer
        width={drawerWidth}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedAddress(undefined)
        }}
        title={selectedAddress ? 'Edit Pickup Address' : 'Add New Pickup Address'}
      >
        <AddPickupAddressForm
          key={selectedAddress?.id ?? 'new'}
          setDrawer={setDrawerOpen}
          initialData={selectedAddress}
        />
      </CustomDrawer>
    </>
  )
}

export default PickupAddressesList
