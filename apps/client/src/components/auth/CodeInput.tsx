import { Stack, TextField } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react'
import { brand } from '../../theme/brand'

interface CodeInputProps {
  length: number
  mode?: 'numeric' | 'alphanumeric'
  value: string
  onChange: (value: string) => void
}

const normalizeCharacter = (value: string, mode: 'numeric' | 'alphanumeric') => {
  if (mode === 'numeric') {
    return value.replace(/\D/g, '')
  }

  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
}

export default function CodeInput({
  length,
  mode = 'numeric',
  value,
  onChange,
}: CodeInputProps) {
  const values = useMemo(
    () =>
      Array.from({ length }, (_, index) => {
        return value[index] ?? ''
      }),
    [length, value],
  )
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)

  const updateValue = (nextValues: string[]) => {
    onChange(nextValues.join('').slice(0, length))
  }

  const handleChange = (index: number, rawValue: string) => {
    const normalized = normalizeCharacter(rawValue, mode).slice(-1)
    const nextValues = [...values]
    nextValues[index] = normalized
    updateValue(nextValues)

    if (normalized && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !values[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (event.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pasted = normalizeCharacter(event.clipboardData.getData('text'), mode).slice(0, length)
    if (!pasted) return

    const nextValues = Array.from({ length }, (_, index) => pasted[index] ?? '')
    updateValue(nextValues)
    inputRefs.current[Math.min(pasted.length, length - 1)]?.focus()
  }

  return (
    <Stack direction="row" spacing={1.1} justifyContent="center" flexWrap="wrap" useFlexGap>
      {values.map((digit, index) => {
        const active = focusedIndex === index || Boolean(digit)

        return (
          <TextField
            key={`${index}-${mode}`}
            value={digit}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            onFocus={() => setFocusedIndex(index)}
            onBlur={() => setFocusedIndex((current) => (current === index ? null : current))}
            inputRef={(node) => {
              inputRefs.current[index] = node
            }}
            variant="outlined"
            size="small"
            inputProps={{
              maxLength: 1,
              style: {
                textAlign: 'center',
                fontWeight: 800,
                fontSize: '1.08rem',
                padding: '14px 0',
                textTransform: mode === 'alphanumeric' ? 'uppercase' : 'none',
              },
            }}
            sx={{
              width: { xs: 46, sm: 52 },
              '& .MuiOutlinedInput-root': {
                borderRadius: '20px',
                bgcolor: active ? alpha('#FFFFFF', 0.95) : alpha('#FFFFFF', 0.78),
                boxShadow: active ? '0 12px 22px rgba(15, 44, 67, 0.08)' : 'none',
                '& fieldset': {
                  borderColor: active ? alpha(brand.ink, 0.26) : alpha(brand.line, 0.9),
                  borderWidth: active ? 1.5 : 1,
                },
                '&:hover fieldset': {
                  borderColor: alpha(brand.ink, 0.28),
                },
                '&.Mui-focused fieldset': {
                  borderColor: brand.ink,
                },
              },
            }}
          />
        )
      })}
    </Stack>
  )
}
