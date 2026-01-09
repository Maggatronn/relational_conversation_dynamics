import React from 'react';
import { TableRow, TableCell, Chip, Checkbox } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelection } from '../context/SelectionContext';
import { columnConfig, getPercentileColor } from '../utils/tableVisualization';

function ConversationTableRow({ conversation, visibleColumns, columnStats }) {
  const navigate = useNavigate();
  const { isSelected, toggleConversation } = useSelection();
  const selected = isSelected(conversation.id);

  const handleRowClick = (event) => {
    // Don't navigate if clicking the checkbox
    if (event.target.type === 'checkbox') {
      return;
    }
    navigate(`/conversation/${conversation.id}`);
  };

  const handleCheckboxClick = (event) => {
    event.stopPropagation();
    toggleConversation(conversation.id);
  };

  const renderCell = (col) => {
    const value = conversation[col.key];
    const align = col.type === 'number' ? 'right' : 'left';
    
    // Handle missing values
    if (value === undefined || value === null) {
      return (
        <TableCell key={col.key} align={align} sx={{ color: 'text.secondary' }}>
          —
        </TableCell>
      );
    }

    // Render based on type
    switch (col.type) {
      case 'chip':
        return (
          <TableCell key={col.key} align={align}>
            <Chip
              label={value}
              size="small"
              sx={{
                backgroundColor: col.key === 'group' ? '#f5ebe5' : '#e8ddd0',
                color: col.key === 'group' ? '#d4704c' : '#c9965c',
                fontWeight: 500,
                fontSize: col.key === 'group' ? '0.75rem' : '0.7rem',
                minWidth: col.key === 'cluster' ? '32px' : 'auto',
              }}
            />
          </TableCell>
        );
      
      case 'number':
        const stats = columnStats[col.key];
        const backgroundColor = stats && col.higherIsBetter !== null
          ? getPercentileColor(value, stats.min, stats.max, col.higherIsBetter)
          : 'transparent';
        
        const displayValue = col.format ? col.format(value) : value;
        
        return (
          <TableCell 
            key={col.key} 
            align={align}
            sx={{
              backgroundColor,
              color: 'text.primary',
              fontWeight: col.higherIsBetter !== null ? 500 : 'normal',
              transition: 'background-color 0.2s',
            }}
          >
            {displayValue}
          </TableCell>
        );
      
      case 'text':
      default:
        return (
          <TableCell 
            key={col.key} 
            align={align}
            sx={{ 
              fontWeight: col.key === 'id' ? 500 : 'normal',
              color: col.key === 'facilitator' ? 'text.secondary' : 'inherit',
            }}
          >
            {value}
          </TableCell>
        );
    }
  };

  return (
    <TableRow
      selected={selected}
      onClick={handleRowClick}
      sx={{
        '&:hover': {
          backgroundColor: '#f9f6f3',
          cursor: 'pointer',
        },
        '&.Mui-selected': {
          backgroundColor: '#f5ebe5',
          '&:hover': {
            backgroundColor: '#f0e0d5',
          },
        },
      }}
    >
      <TableCell padding="checkbox">
        <Checkbox
          checked={selected}
          onClick={handleCheckboxClick}
          sx={{
            color: 'primary.main',
            '&.Mui-checked': {
              color: 'primary.main',
            },
          }}
        />
      </TableCell>
      {columnConfig.map((col) => {
        if (!visibleColumns[col.key]) return null;
        return renderCell(col);
      })}
    </TableRow>
  );
}

export default ConversationTableRow;
