import React from 'react';
import { Box } from '@mui/material';
import Navigation from './Navigation';
import SelectionBar from './SelectionBar';

function PageLayout({ children }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navigation />
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </Box>
      <SelectionBar />
    </Box>
  );
}

export default PageLayout;

