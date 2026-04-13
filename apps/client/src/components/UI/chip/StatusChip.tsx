import { Chip, alpha, useTheme, type ChipProps } from '@mui/material'
import React from 'react'
import { FaCheckCircle } from 'react-icons/fa'
import { MdError, MdInfo, MdPending } from 'react-icons/md'

interface StatusChipProps extends Partial<ChipProps> {
  status: 'success' | 'pending' | 'error' | 'info'
  label?: string
}

const STATUS_META = {
  success: {
    defaultLabel: 'Active',
    bg: '#E4F6EE',
    fg: '#147A56',
    icon: <FaCheckCircle size={12} />,
  },
  pending: {
    defaultLabel: 'Pending',
    bg: '#FFF0DE',
    fg: '#C96D00',
    icon: <MdPending size={14} />,
  },
  error: {
    defaultLabel: 'Needs attention',
    bg: '#FCE6E6',
    fg: '#B33A3A',
    icon: <MdError size={14} />,
  },
  info: {
    defaultLabel: 'In review',
    bg: '#E8F0FF',
    fg: '#225CA8',
    icon: <MdInfo size={14} />,
  },
}

const StatusChip: React.FC<StatusChipProps> = ({ status, label, ...props }) => {
  const theme = useTheme()
  const meta = STATUS_META[status] || STATUS_META.info

  return (
    <Chip
      size="small"
      icon={meta.icon}
      label={label || meta.defaultLabel}
      sx={{
        height: 28,
        px: 0.75,
        fontSize: '11px',
        fontWeight: 800,
        letterSpacing: '0.02em',
        backgroundColor: meta.bg,
        color: meta.fg,
        border: `1px solid ${alpha(meta.fg, 0.16)}`,
        borderRadius: '999px',
        boxShadow: `0 8px 18px ${alpha(theme.palette.text.primary, 0.05)}`,
        '& .MuiChip-icon': {
          color: meta.fg,
          ml: 0.6,
        },
        ...props.sx,
      }}
      {...props}
    />
  )
}

export default StatusChip
