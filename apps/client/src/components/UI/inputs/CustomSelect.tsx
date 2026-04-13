import {
  Box,
  ClickAwayListener,
  Grow,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Popper,
  Typography,
  alpha,
} from '@mui/material'
import React, { useMemo, useRef, useState } from 'react'
import { MdArrowDropDown } from 'react-icons/md'
import CustomInput from './CustomInput'

interface DropdownItem {
  key: string | boolean
  label: string
  description?: string
  icon?: React.ElementType
}

interface DropdownMenuProps {
  label: string
  items: DropdownItem[]
  onSelect: (key: string | boolean) => void
  value?: string | boolean
  width?: number | string
  required?: boolean
  placeholder?: string
  inputValue?: string
  helperText?: string
  onInputChange?: (val: string) => void
  error?: boolean
  topMargin?: boolean
  searchable?: boolean
}

const NAVY = '#0C3B80'
const ORANGE = '#F57C00'
const TEXT = '#241A1B'
const MUTED = '#6A5E59'

export default function CustomSelect({
  label,
  items = [],
  onSelect,
  value,
  placeholder,
  required,
  topMargin = true,
  helperText,
  error,
  searchable = true,
}: DropdownMenuProps) {
  const anchorRef = useRef<HTMLDivElement | null>(null)
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selectedItem = items.find((item) => item?.key === value)

  const filteredItems = useMemo(() => {
    if (!searchable || !search) return items
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase()),
    )
  }, [items, search, searchable])

  return (
    <Box>
      <div ref={anchorRef}>
        <CustomInput
          fullWidth
          required={required}
          topMargin={topMargin}
          error={error}
          label={label}
          value={search || selectedItem?.label || placeholder || ''}
          onClick={() => setOpen((prev) => !prev)}
          onChange={(e) => {
            if (searchable) {
              setSearch(e.target.value)
              if (!open) setOpen(true)
            }
          }}
          postfix={<MdArrowDropDown color={NAVY} size={20} />}
        />
      </div>

      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        transition
        style={{ zIndex: 1300 }}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} style={{ transformOrigin: 'top left' }}>
            <Box>
              {open && (
                <ClickAwayListener onClickAway={() => setOpen(false)}>
                  <Paper
                    elevation={8}
                    sx={{
                      bgcolor: '#ffffff',
                      borderRadius: 2,
                      border: '1px solid rgba(12,59,128,0.12)',
                      boxShadow: '0 12px 24px rgba(12,59,128,0.12)',
                      width: anchorRef.current
                        ? anchorRef.current.getBoundingClientRect().width
                        : '100%',
                      maxHeight: 320,
                      overflowY: 'auto',
                      mt: 0.6,
                      p: 0.4,
                    }}
                  >
                    <List dense disablePadding sx={{ py: 0.3 }}>
                      {filteredItems.length > 0 ? (
                        filteredItems.map((item) => (
                          <ListItemButton
                            key={String(item.key)}
                            selected={value === item.key}
                            onClick={() => {
                              onSelect(item.key)
                              setSearch(item.label)
                              setOpen(false)
                            }}
                            sx={{
                              mx: 0.3,
                              my: 0.35,
                              px: 1.2,
                              py: 0.9,
                              borderRadius: 2,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                bgcolor: alpha(item.key === value ? NAVY : ORANGE, 0.06),
                                transform: 'translateX(2px)',
                              },
                              '&.Mui-selected': {
                                bgcolor: alpha(NAVY, 0.08),
                                border: '1px solid rgba(12,59,128,0.12)',
                                '&:hover': {
                                  bgcolor: alpha(NAVY, 0.1),
                                },
                              },
                            }}
                          >
                            {item.icon && (
                              <ListItemIcon
                                sx={{
                                  minWidth: 40,
                                  color: value === item.key ? NAVY : ORANGE,
                                }}
                              >
                                {React.createElement(item.icon, { size: 18 })}
                              </ListItemIcon>
                            )}
                            <ListItemText
                              primary={
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 700,
                                    color: TEXT,
                                  }}
                                >
                                  {item.label}
                                </Typography>
                              }
                              secondary={
                                item.description ? (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: MUTED,
                                      fontSize: '0.76rem',
                                      display: 'block',
                                      mt: 0.3,
                                    }}
                                  >
                                    {item.description}
                                  </Typography>
                                ) : null
                              }
                            />
                          </ListItemButton>
                        ))
                      ) : (
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              color: MUTED,
                              fontWeight: 600,
                            }}
                          >
                            No results found
                          </Typography>
                        </Box>
                      )}
                    </List>
                  </Paper>
                </ClickAwayListener>
              )}
            </Box>
          </Grow>
        )}
      </Popper>

      {helperText ? (
        <Box sx={{ mt: 0.6, display: 'flex', justifyContent: 'flex-end' }}>
          <Typography variant="caption" sx={{ fontSize: '11px', opacity: 0.76 }}>
            {helperText}
          </Typography>
        </Box>
      ) : null}
    </Box>
  )
}
