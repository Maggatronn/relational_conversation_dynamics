import React from 'react';
import { Paper, Box, Typography, Button, Chip, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { useSelection } from '../../context/SelectionContext';

function SelectionBar() {
  const { selectedConversationIds, clearSelection, selectedCount } = useSelection();
  const navigate = useNavigate();

  if (selectedCount === 0) {
    return null;
  }

  const handleCompare = () => {
    const idsParam = selectedConversationIds.join(',');
    navigate(`/compare?ids=${idsParam}`);
  };

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        backgroundColor: 'primary.main',
        color: 'white',
        px: 3,
        py: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        minWidth: 400,
        borderRadius: 2,
      }}
    >
      <Chip
        label={selectedCount}
        size="small"
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          color: 'white',
          fontWeight: 600,
        }}
      />
      
      <Typography variant="body2" sx={{ flexGrow: 1 }}>
        {selectedCount} conversation{selectedCount !== 1 ? 's' : ''} selected
      </Typography>

      <Button
        variant="contained"
        size="small"
        startIcon={<CompareArrowsIcon />}
        onClick={handleCompare}
        disabled={selectedCount < 2}
        sx={{
          backgroundColor: 'white',
          color: 'primary.main',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
          },
          '&.Mui-disabled': {
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            color: 'rgba(255, 255, 255, 0.5)',
          },
        }}
      >
        Compare
      </Button>

      <IconButton
        size="small"
        onClick={clearSelection}
        sx={{
          color: 'white',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Paper>
  );
}

export default SelectionBar;

