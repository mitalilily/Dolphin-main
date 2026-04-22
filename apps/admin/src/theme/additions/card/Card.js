const Card = {
  baseStyle: {
    p: '24px',
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
          : 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(248,251,255,0.98) 100%)',
      width: '100%',
      border:
        props.colorMode === 'dark'
          ? '1px solid rgba(148, 163, 184, 0.18)'
          : '1px solid rgba(16,50,74,0.08)',
      boxShadow:
        props.colorMode === 'dark'
          ? '0 12px 30px rgba(2, 8, 23, 0.5)'
          : '0 18px 36px rgba(15, 44, 67, 0.06)',
      borderRadius: '30px',
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
