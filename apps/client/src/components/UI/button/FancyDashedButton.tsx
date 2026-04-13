import React from 'react'

interface FancyDashedButtonProps {
  label: string
  onClick: () => void
  borderColor?: string
  backgroundColor?: string
  textColor?: string
  shadowColor?: string
  paddingX?: string
  paddingY?: string
  fontSize?: string
  borderRadius?: string
  style?: React.CSSProperties
}

const FancyDashedButton: React.FC<FancyDashedButtonProps> = ({
  label,
  onClick,
  borderColor = '#0C3B80',
  backgroundColor = 'linear-gradient(135deg, #0C3B80 0%, #1457B0 100%)',
  textColor = '#ffffff',
  shadowColor = 'rgba(12, 59, 128, 0.18)',
  paddingX = '2.6em',
  paddingY = '0.95em',
  fontSize = '0.98rem',
  borderRadius = '999px',
  style = {},
}) => {
  return (
    <button
      onClick={onClick}
      style={{
        outline: 'none',
        color: textColor,
        padding: `${paddingY} ${paddingX}`,
        border: `1px solid ${borderColor}33`,
        borderRadius,
        background: backgroundColor,
        boxShadow: `0 18px 30px ${shadowColor}`,
        transition: 'transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease',
        fontSize,
        fontWeight: 800,
        letterSpacing: '0.02em',
        cursor: 'pointer',
        backdropFilter: 'blur(10px)',
        ...style,
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'translateY(1px) scale(0.995)'
        e.currentTarget.style.boxShadow = `0 10px 18px ${shadowColor}`
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)'
        e.currentTarget.style.boxShadow = `0 18px 30px ${shadowColor}`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)'
        e.currentTarget.style.boxShadow = `0 18px 30px ${shadowColor}`
      }}
    >
      {label}
    </button>
  )
}

export default FancyDashedButton
