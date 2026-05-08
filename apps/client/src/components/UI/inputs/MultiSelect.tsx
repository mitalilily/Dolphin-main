import {
  alpha,
  Box,
  Checkbox,
  ClickAwayListener,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import { MdClose } from 'react-icons/md'
import CustomInput from './CustomInput'

interface MultiSelectOption {
  label: string
  value: string | number | boolean
}

interface MultiSelectProps {
  label: string
  value: MultiSelectOption[]
  onChange: (val: MultiSelectOption[]) => void
  options: MultiSelectOption[]
  placeholder?: string
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder,
}) => {
  const [inputValue, setInputValue] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 })

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const textColor = '#171310'
  const mutedColor = '#5F7A8F'
  const brandColor = '#10324A'
  const accentColor = '#D97943'

  const filteredOptions = useMemo(() => {
    if (!inputValue) return options
    return options.filter((opt) => opt.label.toLowerCase().includes(inputValue.toLowerCase()))
  }, [inputValue, options])

  const toggleOption = (option: MultiSelectOption) => {
    const exists = value.find((v) => v.value === option.value)
    if (exists) onChange(value.filter((v) => v.value !== option.value))
    else onChange([...value, option])
  }

  // Calculate dropdown position dynamically (desktop only)
  const calculatePosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect()
      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      })
    }
  }

  useEffect(() => {
    if (open && !isMobile) calculatePosition()
    window.addEventListener('resize', calculatePosition)
    window.addEventListener('scroll', calculatePosition)
    return () => {
      window.removeEventListener('resize', calculatePosition)
      window.removeEventListener('scroll', calculatePosition)
    }
  }, [open, isMobile])

  // Desktop dropdown
  const dropdown = !isMobile && open && filteredOptions.length > 0 && (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: dropdownPos.width,
        maxHeight: 250,
        overflowY: 'auto',
        bgcolor: '#FFFFFF',
        color: textColor,
        border: `1px solid ${alpha(brandColor, 0.12)}`,
        boxShadow: '0 16px 34px rgba(15,44,67,0.14)',
        zIndex: 9999,
        p: 1,
        borderRadius: 2,
      }}
    >
      {filteredOptions.map((opt) => {
        const selected = value.some((v) => v.value === opt.value)
        return (
          <Box
            key={opt.value.toString()}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1,
              py: 0.5,
              borderRadius: 1.5,
              cursor: 'pointer',
              '&:hover': { bgcolor: alpha(accentColor, 0.08) },
            }}
            onClick={() => toggleOption(opt)}
          >
            <Checkbox
              checked={selected}
              sx={{
                color: mutedColor,
                '&.Mui-checked': { color: brandColor },
              }}
            />
            <Typography sx={{ color: textColor, fontSize: 14, fontWeight: 600 }}>
              {opt.label}
            </Typography>
          </Box>
        )
      })}
    </Paper>
  )

  // Mobile dropdown as full-screen dialog
  const mobileDropdown = isMobile && (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" disableScrollLock>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {label}
        <IconButton onClick={() => setOpen(false)}>
          <MdClose />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {filteredOptions.map((opt) => {
          const selected = value.some((v) => v.value === opt.value)
          return (
            <Box
              key={opt.value.toString()}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1,
                py: 1,
                borderRadius: 1.5,
                cursor: 'pointer',
                '&:hover': { bgcolor: alpha(accentColor, 0.08) },
              }}
              onClick={() => toggleOption(opt)}
            >
              <Checkbox
                checked={selected}
                sx={{
                  color: mutedColor,
                  '&.Mui-checked': { color: brandColor },
                }}
              />
              <Typography sx={{ color: textColor, fontSize: 16, fontWeight: 600 }}>
                {opt.label}
              </Typography>
            </Box>
          )
        })}
      </DialogContent>
    </Dialog>
  )

  return (
    <ClickAwayListener onClickAway={() => !isMobile && setOpen(false)}>
      <Box sx={{ position: 'relative', width: '100%' }}>
        <CustomInput
          label={label}
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          width="100%"
          ref={inputRef}
          postfix={
            value.length > 0 ? (
              <Typography sx={{ color: brandColor, fontSize: 13, fontWeight: 800 }}>
                {value.length} selected
              </Typography>
            ) : undefined
          }
        />
        {ReactDOM.createPortal(dropdown, document.body)}
        {mobileDropdown}
      </Box>
    </ClickAwayListener>
  )
}

export default MultiSelect
