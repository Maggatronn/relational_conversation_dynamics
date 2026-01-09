import React from 'react';
import { TableHead, TableRow, TableCell, TableSortLabel, Checkbox } from '@mui/material';
import { columnConfig } from '../utils/tableVisualization';

function ConversationTableHeader({ orderBy, order, onSort, onSelectAll, selectedCount, totalCount, visibleColumns }) {
  const createSortHandler = (property) => () => {
    onSort(property);
  };

  const headerCellStyle = { backgroundColor: '#f5f1ed' };

  const handleSelectAllClick = (event) => {
    onSelectAll(event.target.checked);
  };

  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox" sx={headerCellStyle}>
          <Checkbox
            indeterminate={selectedCount > 0 && selectedCount < totalCount}
            checked={totalCount > 0 && selectedCount === totalCount}
            onChange={handleSelectAllClick}
            sx={{
              color: 'primary.main',
              '&.Mui-checked': {
                color: 'primary.main',
              },
              '&.MuiCheckbox-indeterminate': {
                color: 'primary.main',
              },
            }}
          />
        </TableCell>
        {columnConfig.map((col) => {
          if (!visibleColumns[col.key]) return null;
          
          const align = col.type === 'number' ? 'right' : 'left';
          
          return (
            <TableCell key={col.key} align={align} sx={headerCellStyle}>
              {col.sortable ? (
                <TableSortLabel
                  active={orderBy === col.key}
                  direction={orderBy === col.key ? order : 'asc'}
                  onClick={createSortHandler(col.key)}
                >
                  {col.label}
                </TableSortLabel>
              ) : (
                col.label
              )}
            </TableCell>
          );
        })}
      </TableRow>
    </TableHead>
  );
}

export default ConversationTableHeader;
