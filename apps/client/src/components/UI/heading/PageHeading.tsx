import { alpha, Box, Stack, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import React from 'react'
import { TbSparkles } from 'react-icons/tb'
import { brand, brandGradients } from '../../../theme/brand'

interface PageHeadingProps {
  title: string | React.ReactNode
  subtitle?: string
  center?: boolean
  fontSize?: string | number
  icon?: React.ReactNode
  eyebrow?: string
}

const PageHeading: React.FC<PageHeadingProps> = ({
  title,
  subtitle,
  center = false,
  fontSize,
  icon = <TbSparkles size={18} />,
  eyebrow = 'Panel',
}) => {
  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '30px',
        border: `1px solid ${alpha('#FFFFFF', 0.7)}`,
        background: brandGradients.surface,
        px: { xs: 1.8, sm: 2.4 },
        py: { xs: 1.8, sm: 2.1 },
        boxShadow: '0 20px 42px rgba(15,44,67,0.08)',
      }}
    >
      <Stack spacing={1} textAlign={center ? 'center' : 'left'} position="relative" zIndex={1}>
        <Stack
          direction="row"
          spacing={1.2}
          alignItems="center"
          sx={{
            justifyContent: center ? 'center' : 'flex-start',
          }}
        >
          <motion.div
            initial={{ rotate: -18, scale: 0.82, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            whileHover={{ rotate: 12, scale: 1.06 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '16px',
                background: brandGradients.button,
                color: brand.ink,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 20px rgba(130,194,255,0.24)',
              }}
            >
              {icon}
            </Box>
          </motion.div>
          <Stack spacing={0.4}>
            <Typography
              sx={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: brand.inkSoft,
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
              }}
            >
              {eyebrow}
            </Typography>
            <Typography
              fontSize={fontSize ?? { xs: '1.45rem', md: '1.95rem' }}
              fontWeight={800}
              lineHeight={1.08}
              sx={{
                color: brand.ink,
                letterSpacing: '-0.04em',
              }}
            >
              {title}
            </Typography>
          </Stack>
        </Stack>

        {subtitle && (
          <Typography
            sx={{
              color: brand.inkSoft,
              fontSize: { xs: '0.9rem', md: '0.96rem' },
              maxWidth: center ? 820 : 760,
              mx: center ? 'auto' : 0,
              lineHeight: 1.75,
              pl: center ? 0 : { xs: 0, sm: 6 },
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Stack>
    </Box>
  )
}

export default PageHeading
