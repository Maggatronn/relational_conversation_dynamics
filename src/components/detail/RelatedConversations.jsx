import React from 'react';
import { Paper, Typography, Box, List, ListItem, ListItemText, ListItemButton, Chip } from '@mui/material';
import { Link } from 'react-router-dom';
import GroupWorkIcon from '@mui/icons-material/GroupWork';

function RelatedConversations({ relatedConversations, currentCluster }) {
  if (!relatedConversations || relatedConversations.length === 0) {
    return (
      <Paper elevation={1} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <GroupWorkIcon sx={{ color: '#d4704c' }} />
          <Typography variant="h6">
            Related Conversations
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          No related conversations found (no cluster assignment).
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={1} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <GroupWorkIcon sx={{ color: '#d4704c' }} />
        <Typography variant="h6">
          Related Conversations
        </Typography>
        <Chip 
          label={`Cluster ${currentCluster}`} 
          size="small" 
          sx={{ ml: 1, backgroundColor: '#f0e0d5', color: '#8b6f47' }}
        />
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Similar conversations based on clustering analysis
      </Typography>

      <List sx={{ p: 0 }}>
        {relatedConversations.map((conv, index) => (
          <ListItem 
            key={conv.id} 
            disablePadding
            sx={{ 
              borderBottom: index < relatedConversations.length - 1 ? 1 : 0,
              borderColor: 'divider',
            }}
          >
            <ListItemButton
              component={Link}
              to={`/conversation/${conv.id}`}
              sx={{
                py: 1.5,
                '&:hover': {
                  backgroundColor: '#fdf8f5',
                },
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {conv.group}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      (ID: {conv.id})
                    </Typography>
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {conv.collectionTitle}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                      <Typography variant="caption">
                        <strong>{conv.turnCount}</strong> turns
                      </Typography>
                      <Typography variant="caption">
                        <strong>{conv.speakers}</strong> speakers
                      </Typography>
                      <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                        {conv.facilitator}
                      </Typography>
                    </Box>
                  </Box>
                }
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}

export default RelatedConversations;

