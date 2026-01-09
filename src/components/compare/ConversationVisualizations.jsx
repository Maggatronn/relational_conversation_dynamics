import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useConversationDetail } from '../../hooks/useConversationDetail';
import SpeakerNetwork from '../visualizations/SpeakerNetwork';
import ConversationTimeline from '../visualizations/ConversationTimeline';

function ConversationVisualizations({ conversationId, showNetwork = true, showTimeline = true, height = 400 }) {
  const { conversation, turns, loading } = useConversationDetail(conversationId);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: `${height}px` }}>
        <CircularProgress size={30} sx={{ color: '#d4704c' }} />
      </Box>
    );
  }

  if (!conversation || !turns) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: `${height}px` }}>
        <Typography variant="body2" color="text.secondary">
          No data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {showNetwork && (
        <Box sx={{ mb: showTimeline ? 3 : 0 }}>
          <SpeakerNetwork turns={turns} conversation={conversation} height={height} />
        </Box>
      )}
      {showTimeline && (
        <Box>
          <ConversationTimeline 
            turns={turns} 
            conversation={conversation}
            onSegmentClick={() => {}}
            onBackgroundClick={() => {}}
          />
        </Box>
      )}
    </Box>
  );
}

export default ConversationVisualizations;

