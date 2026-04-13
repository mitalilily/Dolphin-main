import { Stack, Typography, alpha } from '@mui/material'
import { motion } from 'framer-motion'
import { TbBolt } from 'react-icons/tb'
import { brand } from '../../theme/brand'

interface SectionHeadingProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  color?: string
}

const SectionHeading: React.FC<SectionHeadingProps> = ({
  title,
  subtitle,
  icon = <TbBolt />,
  color = brand.ink,
}) => {
  return (
    <Stack spacing={1} sx={{ mb: 3.2 }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <motion.div
          initial={{ rotate: -14, scale: 0.88 }}
          whileInView={{ rotate: 0, scale: 1 }}
          whileHover={{ rotate: 12, y: -1 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
            background: alpha(color, 0.1),
            padding: 10,
            borderRadius: 16,
            border: `1px solid ${alpha(color, 0.14)}`,
          }}
        >
          {icon}
        </motion.div>
        <Stack spacing={0.2}>
          <Typography
            sx={{
              fontSize: '0.72rem',
              fontWeight: 800,
              color,
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
            }}
          >
            Dolphin workflow
          </Typography>
          <Typography
            variant="h3"
            sx={{
              fontSize: { xs: '1.48rem', md: '1.92rem' },
              fontWeight: 800,
              color: brand.ink,
              letterSpacing: '-0.03em',
              lineHeight: 1.06,
            }}
          >
            {title}
          </Typography>
        </Stack>
      </Stack>
      {subtitle && (
        <Typography
          variant="body2"
          sx={{
            color: brand.inkSoft,
            fontSize: '0.96rem',
            fontWeight: 500,
            ml: 7.2,
            lineHeight: 1.65,
            maxWidth: 720,
          }}
        >
          {subtitle}
        </Typography>
      )}
    </Stack>
  )
}

export default SectionHeading
