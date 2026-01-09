import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';

function ConversationFilters({
  totalConversations,
  filteredCount,
  filterGroup,
  setFilterGroup,
  filterSourceType,
  setFilterSourceType,
  availableGroups,
  availableSourceTypes,
}) {
  return (
    <Box sx={{ mb: 2, flexShrink: 0 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'text.primary' }}>
        Conversation Dynamics
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary">
          {filteredCount} of {totalConversations} conversations
        </Typography>
        
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="group-filter-label">Filter by Type</InputLabel>
          <Select
            labelId="group-filter-label"
            value={filterGroup}
            label="Filter by Type"
            onChange={(e) => setFilterGroup(e.target.value)}
          >
            <MenuItem value="all">All Types</MenuItem>
            {availableGroups.map((group) => (
              <MenuItem key={group} value={group}>
                {group}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="source-type-filter-label">Filter by Source</InputLabel>
          <Select
            labelId="source-type-filter-label"
            value={filterSourceType}
            label="Filter by Source"
            onChange={(e) => setFilterSourceType(e.target.value)}
          >
            <MenuItem value="all">All Sources</MenuItem>
            {availableSourceTypes.map((sourceType) => (
              <MenuItem key={sourceType} value={sourceType}>
                {sourceType}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
}

export default ConversationFilters;

