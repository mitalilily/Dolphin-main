export const buttonStyles = {
  components: {
    Button: {
      variants: {
        'no-hover': {
          _hover: {
            boxShadow: 'none',
          },
        },
        'transparent-with-icon': {
          bg: 'transparent',
          fontWeight: '600',
          borderRadius: '999px',
          cursor: 'pointer',
          _active: {
            bg: 'transparent',
            transform: 'none',
            borderColor: 'transparent',
          },
          _focus: {
            boxShadow: 'none',
          },
          _hover: {
            bg: 'rgba(155, 49, 80, 0.08)',
          },
        },
      },
      baseStyle: {
        borderRadius: '999px',
        fontWeight: '700',
        transitionProperty: 'transform, background-color, border-color, box-shadow',
        transitionDuration: '180ms',
        _focus: {
          boxShadow: 'none',
        },
      },
    },
  },
}
