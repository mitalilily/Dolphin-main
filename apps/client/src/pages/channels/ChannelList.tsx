import { Box, Divider, Paper, Typography, useMediaQuery, useTheme } from '@mui/material'
import { FaPlug } from 'react-icons/fa6'
import AllChannelOptions from '../../components/channels/AllChannelOptions'
import PageHeading from '../../components/UI/heading/PageHeading'

const ChannelList = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Box sx={{ mb: 3 }}>
        <PageHeading
          eyebrow="Channels Panel"
          title="Channel Integrations"
          subtitle="Browse available storefront integrations and connect new sales channels with the same panel structure used across the app."
        />
      </Box>

      <Paper
        elevation={4}
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 4,
          background: theme.palette.mode === 'dark' ? '#1e1e2f' : '#f9f9f9',
          color: theme.palette.text.primary,
        }}
      >
        <Box display="flex" alignItems="center" mb={2} gap={1}>
          <FaPlug size={22} color={theme.palette.primary.main} />
          <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={700} component="h1">
            Connect Your Sales Channels
          </Typography>
        </Box>

        <Typography variant="body1" color="text.secondary" mb={3} maxWidth="70ch">
          Integrate with top e-commerce platforms like Shopify, WooCommerce, Amazon and more to
          automate your order flow and boost productivity.
        </Typography>

        <Divider sx={{ mb: 4 }} />

        <AllChannelOptions fromChannelList />
      </Paper>
    </Box>
  )
}

export default ChannelList
