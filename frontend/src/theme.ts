import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'orange',
  fontFamily:
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontFamilyMonospace: '"SF Mono", "Fira Code", "Fira Mono", Menlo, monospace',
  primaryShade: { light: 5, dark: 8 },
  defaultRadius: 'md',
  components: {
    Card: {
      defaultProps: {
        withBorder: true,
        shadow: 'none',
      },
    },
    Table: {
      defaultProps: {
        withTableBorder: true,
        withColumnBorders: false,
        highlightOnHover: true,
      },
    },
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    ActionIcon: {
      defaultProps: {
        radius: 'md',
      },
    },
    Badge: {
      defaultProps: {
        radius: 'sm',
      },
    },
    Modal: {
      defaultProps: {
        overlayProps: { backgroundOpacity: 0.55, blur: 3 },
      },
    },
    Paper: {
      defaultProps: {
        withBorder: true,
      },
    },
  },
  colors: {
    dark: [
      '#C1C2C5',
      '#A6A7AB',
      '#909296',
      '#5C5F66',
      '#373A40',
      '#2C2E33',
      '#25262B',
      '#1A1B1E',
      '#141517',
      '#101113',
    ],
  },
});