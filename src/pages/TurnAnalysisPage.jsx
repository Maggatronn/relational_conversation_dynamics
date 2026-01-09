import React from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Paper, Box } from '@mui/material';

function TurnAnalysisPage() {
  const { conversationId } = useParams();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper elevation={1} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Turn Analysis: Conversation {conversationId}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          This page will show turn-level analysis for conversation {conversationId}:
        </Typography>

        <Box component="ul" sx={{ mb: 3 }}>
          <li>Response network graph (interactive)</li>
          <li>Sortable turn table (by response count, speaker, etc.)</li>
          <li>Filters (min responses, response type, keywords)</li>
          <li>Turn detail panel (shows response chain)</li>
          <li>Turn comparison (select multiple turns)</li>
          <li>Response timeline visualization</li>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 4 }}>
          📝 This page will be built in Phase 5
        </Typography>
      </Paper>
    </Container>
  );
}

export default TurnAnalysisPage;

