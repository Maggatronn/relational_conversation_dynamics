import React from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Box, CircularProgress, Alert, Button, Grid } from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { useConversationDetail } from '../hooks/useConversationDetail';
import SpeakerNetwork from '../components/visualizations/SpeakerNetwork';
import ConversationTimeline from '../components/visualizations/ConversationTimeline';
import TranscriptViewer from '../components/detail/TranscriptViewer';
import { useSelection } from '../context/SelectionContext';

function ConversationDetailPage() {
  const { id } = useParams();
  const { conversation, turns, loading } = useConversationDetail(id);
  const { toggleConversation, isSelected } = useSelection();
  const [selectedSegment, setSelectedSegment] = React.useState(null);
  const [hoveredSegmentKey, setHoveredSegmentKey] = React.useState(null);

  const handleSegmentClick = (segmentData) => {
    setSelectedSegment(segmentData);
  };

  const handleClearSelection = () => {
    setSelectedSegment(null);
  };

  const handleSegmentHover = (segmentKey) => {
    setHoveredSegmentKey(segmentKey);
  };

  const handleTranscriptSegmentClick = (segmentData) => {
    // When clicking a segment in the transcript, scroll to it in the timeline
    setSelectedSegment({
      ...segmentData,
      isResponse: segmentData.isResponsive,
    });
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress sx={{ color: '#d4704c' }} />
        <Typography sx={{ mt: 2 }}>Loading conversation...</Typography>
      </Container>
    );
  }

  if (!conversation) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">
          Conversation not found (ID: {id})
        </Alert>
      </Container>
    );
  }

  const selected = isSelected(parseInt(id));

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
              {conversation.group}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.3 }}>
              {conversation.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Facilitated by {conversation.facilitator} • {conversation.sourceType}
            </Typography>
          </Box>
          
          <Button
            variant={selected ? "contained" : "outlined"}
            onClick={() => toggleConversation(parseInt(id))}
            startIcon={<CompareArrowsIcon />}
            sx={{
              backgroundColor: selected ? '#d4704c' : 'transparent',
              borderColor: '#d4704c',
              color: selected ? 'white' : '#d4704c',
              '&:hover': {
                backgroundColor: selected ? '#c06040' : '#fdf8f5',
                borderColor: '#d4704c',
              },
            }}
          >
            {selected ? 'Selected for Comparison' : 'Select for Comparison'}
          </Button>
        </Box>

        {/* Conversation Timeline - Full Width */}
        <Box sx={{ mb: 3 }}>
          <ConversationTimeline 
            turns={turns} 
            conversation={conversation} 
            onSegmentClick={handleSegmentClick}
            onBackgroundClick={handleClearSelection}
            hoveredSegmentKey={hoveredSegmentKey}
            selectedSegment={selectedSegment}
            onTranscriptSegmentClick={handleTranscriptSegmentClick}
          />
        </Box>

        {/* Transcript and Network Graph - Same Height */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <TranscriptViewer 
              turns={turns} 
              conversation={conversation} 
              height={600} 
              selectedSegment={selectedSegment}
              onClearSelection={handleClearSelection}
              onSegmentHover={handleSegmentHover}
              onSegmentClick={handleTranscriptSegmentClick}
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <SpeakerNetwork turns={turns} conversation={conversation} height={600} />
          </Grid>
        </Grid>
      </Container>
  );
}

export default ConversationDetailPage;
