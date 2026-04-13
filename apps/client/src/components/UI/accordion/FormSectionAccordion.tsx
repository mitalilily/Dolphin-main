import { alpha, Accordion, AccordionDetails, AccordionSummary, Stack, Typography } from '@mui/material'
import React from 'react'
import { MdExpandMore } from 'react-icons/md'

const BRAND_PRIMARY = '#0D3B8E'

interface FormSectionAccordionProps {
  icon?: React.ReactNode
  title: string
  subtitle?: string
  children: React.ReactNode
  defaultExpanded?: boolean
}

export const glassStyles = {
  background: '#FFFFFF',
  borderRadius: 3,
  mb: 2,
  border: `1px solid ${alpha(BRAND_PRIMARY, 0.12)}`,
  boxShadow: `0 4px 14px ${alpha(BRAND_PRIMARY, 0.06)}`,
  overflow: 'hidden',
  color: '#1a1a1a',
  '&:before': {
    display: 'none',
  },
}

const FormSectionAccordion: React.FC<FormSectionAccordionProps> = ({
  icon,
  title,
  subtitle,
  children,
  defaultExpanded = false,
}) => {
  return (
    <Accordion defaultExpanded={defaultExpanded} disableGutters sx={glassStyles}>
      <AccordionSummary
        expandIcon={<MdExpandMore color={BRAND_PRIMARY} />}
        sx={{
          backgroundColor: alpha(BRAND_PRIMARY, 0.03),
          px: 2.5,
          py: 1.5,
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: alpha(BRAND_PRIMARY, 0.06),
          },
          '& .MuiAccordionSummary-expandIconWrapper': {
            color: BRAND_PRIMARY,
            transition: 'transform 0.2s ease',
          },
          '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
            transform: 'rotate(180deg)',
          },
        }}
      >
        <Stack gap={0.5}>
          <Typography
            fontWeight={700}
            display="flex"
            alignItems="center"
            sx={{
              color: '#102A54',
              fontSize: { xs: '0.95rem', sm: '1rem' },
            }}
          >
            {icon && <span style={{ marginRight: 8, display: 'flex', alignItems: 'center' }}>{icon}</span>}
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" fontWeight={400} sx={{ color: '#6b6b6b', fontSize: '0.8rem' }}>
              {subtitle}
            </Typography>
          )}
        </Stack>
      </AccordionSummary>
      <AccordionDetails
        sx={{
          px: 2.5,
          py: 2.5,
          backgroundColor: '#FFFFFF',
        }}
      >
        {children}
      </AccordionDetails>
    </Accordion>
  )
}

export default FormSectionAccordion
