const Card = {
  baseStyle: {
    p: '22px',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    position: 'relative',
    minWidth: '0px',
    wordWrap: 'break-word',
    backgroundClip: 'border-box',
  },
  variants: {
    panel: (props) => ({
      bg:
        props.colorMode === 'dark'
          ? 'rgba(16, 28, 52, 0.96)'
          : 'linear-gradient(180deg, rgba(255,253,248,0.98) 0%, rgba(255,244,232,0.92) 100%)',
      width: '100%',
      border:
        props.colorMode === 'dark'
          ? '1px solid rgba(148, 163, 184, 0.18)'
          : '1px solid rgba(12, 59, 128, 0.12)',
      boxShadow:
        props.colorMode === 'dark'
          ? '0 12px 30px rgba(2, 8, 23, 0.5)'
          : '0 18px 36px rgba(36, 26, 27, 0.08)',
      borderRadius: '26px',
      overflow: 'hidden',
      backdropFilter: 'blur(10px)',
    }),
  },
  defaultProps: {
    variant: 'panel',
  },
}

export const CardComponent = {
  components: {
    Card,
  },
}
