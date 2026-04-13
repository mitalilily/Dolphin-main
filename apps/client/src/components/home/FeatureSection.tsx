import { alpha, Box, Stack, Typography } from '@mui/material'
import { motion } from 'framer-motion'
import React from 'react'
import { TbBolt, TbChartBar, TbClick, TbWorld } from 'react-icons/tb'

const NAVY = '#0C3B80'
const ORANGE = '#F57C00'
const TEXT_PRIMARY = '#241A1B'
const TEXT_SECONDARY = '#6A5E59'

const features = [
  {
    title: 'Smart routing board',
    description: 'Pick the right courier lane faster with clearer speed, cost, and success signals.',
    tag: 'Routing',
    icon: <TbBolt size={22} />,
    tone: alpha(NAVY, 0.08),
  },
  {
    title: 'Tracking stories',
    description: 'Turn tracking into a clean timeline that keeps both your team and buyers aligned.',
    tag: 'Tracking',
    icon: <TbWorld size={22} />,
    tone: alpha(ORANGE, 0.09),
  },
  {
    title: 'Order health snapshots',
    description: 'Spot late movement, NDR pressure, and courier gaps before they pile up.',
    tag: 'Signals',
    icon: <TbChartBar size={22} />,
    tone: alpha('#2C8FFF', 0.1),
  },
  {
    title: 'Fast setup layers',
    description: 'Move onboarding, rate checks, and serviceability into a friendlier launch flow.',
    tag: 'Setup',
    icon: <TbClick size={22} />,
    tone: alpha('#178A68', 0.1),
  },
]

const FeatureSection: React.FC = () => {
  return (
    <Box
      sx={{
        py: { xs: 3, md: 3.6 },
        px: { xs: 2.4, md: 3.2 },
        background: 'linear-gradient(180deg, #fffdf8 0%, #fff4e8 100%)',
        borderRadius: 6,
        border: `1px solid ${alpha(NAVY, 0.08)}`,
        boxShadow: `0 16px 34px ${alpha(TEXT_PRIMARY, 0.05)}`,
        my: 4,
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1.05fr 1.45fr' },
          gap: 3,
          alignItems: 'stretch',
        }}
      >
        <Box
          sx={{
            p: { xs: 2.4, md: 3.2 },
            borderRadius: 5,
            background: `
              radial-gradient(circle at 12% 10%, ${alpha('#2C8FFF', 0.16)} 0%, transparent 34%),
              radial-gradient(circle at 88% 12%, ${alpha(ORANGE, 0.14)} 0%, transparent 30%),
              linear-gradient(135deg, #ffffff 0%, #fff8ef 100%)
            `,
            border: `1px solid ${alpha(NAVY, 0.08)}`,
          }}
        >
          <Stack spacing={2.1} sx={{ height: '100%' }}>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 3,
                  bgcolor: alpha(ORANGE, 0.12),
                  color: ORANGE,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TbBolt size={18} />
              </Box>
              <Typography
                sx={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: NAVY,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                }}
              >
                Interface building blocks
              </Typography>
            </Stack>

            <Typography
              variant="h3"
              sx={{
                fontSize: { xs: '2rem', md: '2.7rem' },
                fontWeight: 800,
                color: TEXT_PRIMARY,
                letterSpacing: '-0.04em',
                lineHeight: 1.02,
                maxWidth: 420,
              }}
            >
              Sectioned like a product story, not a crowded shipping form.
            </Typography>

            <Typography sx={{ color: TEXT_SECONDARY, lineHeight: 1.72, maxWidth: 430 }}>
              The new client surface uses clearer blocks, softer contrast, and one confident visual
              direction so every task feels easier to scan.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.4} sx={{ mt: 'auto' }}>
              {['Cleaner cards', 'Faster navigation', 'Warmer palette'].map((pill) => (
                <Box
                  key={pill}
                  sx={{
                    px: 1.8,
                    py: 1.1,
                    borderRadius: 999,
                    bgcolor: alpha('#ffffff', 0.92),
                    border: `1px solid ${alpha(NAVY, 0.08)}`,
                    fontWeight: 700,
                    color: TEXT_PRIMARY,
                    fontSize: '0.82rem',
                    boxShadow: `0 8px 16px ${alpha(TEXT_PRIMARY, 0.04)}`,
                  }}
                >
                  {pill}
                </Box>
              ))}
            </Stack>
          </Stack>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
          }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              viewport={{ once: true }}
            >
              <Box
                sx={{
                  height: '100%',
                  borderRadius: 5,
                  p: 2.4,
                  background: '#fffdf8',
                  border: `1px solid ${alpha(NAVY, 0.08)}`,
                  boxShadow: `0 14px 28px ${alpha(TEXT_PRIMARY, 0.05)}`,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: `0 18px 36px ${alpha(TEXT_PRIMARY, 0.08)}`,
                  },
                }}
              >
                <Stack spacing={1.6}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 3.5,
                        bgcolor: feature.tone,
                        color: NAVY,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography
                      sx={{
                        px: 1.1,
                        py: 0.55,
                        borderRadius: 999,
                        bgcolor: alpha(ORANGE, 0.1),
                        color: ORANGE,
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {feature.tag}
                    </Typography>
                  </Stack>

                  <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: TEXT_PRIMARY }}>
                    {feature.title}
                  </Typography>
                  <Typography sx={{ color: TEXT_SECONDARY, fontSize: '0.9rem', lineHeight: 1.65 }}>
                    {feature.description}
                  </Typography>
                </Stack>
              </Box>
            </motion.div>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

export default FeatureSection
