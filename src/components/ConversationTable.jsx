import React, { useState, useMemo } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableContainer,
  Box,
  Button,
  Menu,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Divider,
  Typography,
} from '@mui/material';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import { useSelection } from '../context/SelectionContext';
import ConversationTableHeader from './ConversationTableHeader';
import ConversationTableRow from './ConversationTableRow';
import { columnConfig, calculateColumnStats } from '../utils/tableVisualization';

function ConversationTable({ conversations, orderBy, order, onSort }) {
  const { selectedCount, selectAll, clearSelection } = useSelection();
  const [anchorEl, setAnchorEl] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const initialVisible = {};
    columnConfig.forEach(col => {
      initialVisible[col.key] = col.defaultVisible;
    });
    return initialVisible;
  });

  // Calculate stats for color coding
  const columnStats = useMemo(() => {
    return calculateColumnStats(conversations);
  }, [conversations]);

  const handleSelectAll = (checked) => {
    if (checked) {
      selectAll(conversations.map(c => c.id));
    } else {
      clearSelection();
    }
  };

  const handleColumnMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleColumnMenuClose = () => {
    setAnchorEl(null);
  };

  const toggleColumn = (columnKey) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  };

  const showAllColumns = () => {
    const allVisible = {};
    columnConfig.forEach(col => {
      allVisible[col.key] = true;
    });
    setVisibleColumns(allVisible);
  };

  const hideAllColumns = () => {
    const allHidden = {};
    columnConfig.forEach(col => {
      // Keep ID and Type visible
      allHidden[col.key] = col.key === 'id' || col.key === 'group';
    });
    setVisibleColumns(allHidden);
  };

  return (
    <Box>
      {/* Column visibility controls */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1, px: 2 }}>
        <Button
          size="small"
          startIcon={<ViewColumnIcon />}
          onClick={handleColumnMenuOpen}
          sx={{ color: 'text.secondary' }}
        >
          Columns
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleColumnMenuClose}
          PaperProps={{
            sx: { maxHeight: 400, width: 250 }
          }}
        >
          <Box sx={{ px: 2, py: 1, display: 'flex', gap: 1 }}>
            <Button size="small" onClick={showAllColumns}>Show All</Button>
            <Button size="small" onClick={hideAllColumns}>Hide All</Button>
          </Box>
          <Divider />
          {columnConfig.map(col => (
            <MenuItem key={col.key} onClick={() => toggleColumn(col.key)} dense>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={visibleColumns[col.key]}
                    size="small"
                  />
                }
                label={<Typography variant="body2">{col.label}</Typography>}
                sx={{ width: '100%', m: 0 }}
              />
            </MenuItem>
          ))}
        </Menu>
      </Box>

      <TableContainer 
        component={Paper} 
        elevation={1} 
        sx={{ 
          backgroundColor: 'background.paper',
          flexGrow: 1,
          overflow: 'auto',
          maxHeight: 'calc(100vh - 250px)',
        }}
      >
        <Table size="small" stickyHeader>
          <ConversationTableHeader 
            orderBy={orderBy} 
            order={order} 
            onSort={onSort}
            onSelectAll={handleSelectAll}
            selectedCount={selectedCount}
            totalCount={conversations.length}
            visibleColumns={visibleColumns}
          />
          <TableBody>
            {conversations.map((conversation) => (
              <ConversationTableRow 
                key={conversation.id} 
                conversation={conversation}
                visibleColumns={visibleColumns}
                columnStats={columnStats}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default ConversationTable;

