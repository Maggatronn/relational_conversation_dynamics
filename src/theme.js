import { createTheme } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#d4704c', // Warm terracotta
    },
    secondary: {
      main: '#c9965c', // Warm gold
    },
    background: {
      default: '#faf8f5', // Off-white
      paper: '#fdfcfa', // Slightly off-white for paper
    },
    text: {
      primary: '#2a2a2a',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 13,
    h4: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
    body2: {
      fontSize: '0.8125rem',
    },
  },
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontSize: '0.8125rem',
          padding: '12px 16px',
        },
        head: {
          fontWeight: 600,
          backgroundColor: '#f5f1ed',
        },
      },
    },
  },
});

export default theme;

