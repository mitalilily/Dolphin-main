import { Box, Button, Divider, Paper, Typography } from '@mui/material'
import { useState } from 'react'
import { FaUserPlus } from 'react-icons/fa'
import UserForm from '../../components/settings/user-management/UserForm'
import UsersList from '../../components/settings/user-management/UsersList'
import PageHeading from '../../components/UI/heading/PageHeading'

const UsersManagement = () => {
  const [openDialog, setOpenDialog] = useState(false)

  const handleAddUser = () => setOpenDialog(true)
  const handleCloseDialog = () => setOpenDialog(false)

  return (
    <Box p={{ xs: 2, sm: 4 }}>
      {/* Header */}
      <Box
        display="flex"
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        mb={3}
        gap={2}
      >
        <PageHeading title="Users Management" />

        <Button
          variant="contained"
          color="primary"
          startIcon={<FaUserPlus />}
          onClick={handleAddUser}
        >
          Add User
        </Button>
      </Box>

      {/* Users List in Paper Card */}
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 3,
          backgroundColor: 'background.paper',
          overflow: 'hidden',
        }}
      >
        <Typography variant="h6" fontWeight={600} mb={2}>
          All Users
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <UsersList />
      </Paper>

      {/* Add User Dialog */}
      <UserForm open={openDialog} onClose={handleCloseDialog} />
    </Box>
  )
}

export default UsersManagement
