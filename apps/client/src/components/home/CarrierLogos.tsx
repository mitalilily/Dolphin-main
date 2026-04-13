import { alpha, Box, Stack, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import React from 'react'
import { brand, brandGradients } from '../../theme/brand'

const carriers = [
  { name: 'Amazon', logo: '/logo/integrations/amazon.png' },
  { name: 'BlueDart', logo: '/logo/integrations/bluedart.png' },
  { name: 'Delhivery', logo: '/logo/integrations/delhivery.png' },
  { name: 'DTDC', logo: '/logo/integrations/dtdc.png' },
  { name: 'Ekart', logo: '/logo/integrations/ekart.png' },
  { name: 'Shadowfax', logo: '/logo/integrations/shadowfax.png' },
  { name: 'Xpressbees', logo: '/logo/integrations/xpressbees.png' },
  { name: 'Shopify', logo: '/logo/integrations/shopify.webp' },
]

const NAVY = brand.ink
const ORANGE = brand.warning
const TEXT_SECONDARY = brand.inkSoft
const marqueeCarriers = [...carriers, ...carriers]

const CarrierLogos: React.FC = () => {
  return (
    <Box
      sx={{
        py: 5,
        px: { xs: 2, md: 3 },
        background: brandGradients.softSurface,
        borderRadius: 6,
        border: `1px solid ${alpha(NAVY, 0.08)}`,
        boxShadow: `0 16px 34px ${alpha(brand.ink, 0.05)}`,
        mt: 4,
        overflow: 'hidden',
      }}
    >
      <Stack alignItems="center" spacing={1} mb={4}>
        <Typography
          sx={{
            fontSize: '10px',
            fontWeight: 900,
            color: NAVY,
            textTransform: 'uppercase',
            letterSpacing: 3,
          }}
        >
          Integrated Ecosystem
        </Typography>
        <Typography
          sx={{
            color: TEXT_SECONDARY,
            fontWeight: 700,
            textAlign: 'center',
            fontSize: '0.95rem',
          }}
        >
          Connected carriers and commerce brands moving inside one Dolphin shipping flow.
        </Typography>
      </Stack>

      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
        }}
      >
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: '-50%' }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{ display: 'flex', width: 'max-content', gap: 18 }}
        >
          {marqueeCarriers.map((carrier, index) => (
            <motion.div
              key={`${carrier.name}-${index}`}
              whileHover={{ y: -4, scale: 1.03 }}
              transition={{ duration: 0.2 }}
              style={{ cursor: 'pointer' }}
            >
              <Box
                sx={{
                  minWidth: { xs: 132, md: 152 },
                  height: 74,
                  px: 2.2,
                  py: 1.6,
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `linear-gradient(180deg, ${alpha('#FFFFFF', 0.98)} 0%, ${alpha('#F8FBFF', 0.98)} 100%)`,
                  border: `1px solid ${alpha(index % 2 === 0 ? NAVY : ORANGE, 0.16)}`,
                  boxShadow: `0 10px 22px ${alpha(brand.ink, 0.05)}`,
                }}
              >
                <img
                  src={carrier.logo}
                  alt={carrier.name}
                  style={{
                    maxHeight: '34px',
                    width: 'auto',
                    objectFit: 'contain',
                  }}
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src =
                      'https://via.placeholder.com/120x40?text=' + carrier.name
                  }}
                />
              </Box>
            </motion.div>
          ))}
        </motion.div>
      </Box>
    </Box>
  )
}

export default CarrierLogos
