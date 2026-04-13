import { Box, Container, Tab, Tabs } from '@mui/material'
import { useState } from 'react'
import PageHeading from '../UI/heading/PageHeading'
import B2BOrderForm from './b2b/B2BOrderForm'
import B2COrderFormSteps from './b2c/B2COrderForm'

const CreateOrderWrapper = () => {
  const [activeTab, setActiveTab] = useState<'b2c' | 'b2b'>('b2c')

  const handleTabChange = (_event: React.SyntheticEvent, newValue: 'b2c' | 'b2b') => {
    setActiveTab(newValue)
  }

  return (
    <Container
      maxWidth="xl"
      sx={{
        px: { xs: 1.5, sm: 2, md: 3 }, // responsive horizontal padding
        py: { xs: 2, sm: 3 }, // responsive vertical padding
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: { xs: 2, sm: 3 }, // tighter gap on mobile
        }}
      >
        <PageHeading title="Create New Order" />

        <Box
          sx={{
            flex: 1,
            bgcolor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: { xs: 2, sm: 3 },
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            p: { xs: 1.5, sm: 2, md: 3 },
            minHeight: '70vh',
          }}
        >
          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="order type tabs"
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  minHeight: 48,
                },
                '& .Mui-selected': {
                  color: '#333369',
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#333369',
                  height: 3,
                },
              }}
            >
              <Tab label="B2C Order" value="b2c" />
              <Tab label="B2B Order" value="b2b" />
            </Tabs>
          </Box>

          {/* Form Content */}
          <Box>{activeTab === 'b2c' ? <B2COrderFormSteps /> : <B2BOrderForm />}</Box>
        </Box>
      </Box>
    </Container>
  )
}

export default CreateOrderWrapper
