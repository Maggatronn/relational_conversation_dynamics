import React, { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Alert,
  Grid,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useSelection } from '../context/SelectionContext';
import { useConversationData } from '../hooks/useConversationData';
import ConversationVisualizations from '../components/compare/ConversationVisualizations';

function ConversationComparePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearSelection } = useSelection();
  const { conversations, loading } = useConversationData();

  // Get IDs from URL query parameters (keep as strings to match conversation data)
  const selectedIds = useMemo(() => {
    const idsParam = searchParams.get('ids');
    if (!idsParam) return [];
    return idsParam.split(',').map(id => id.trim());
  }, [searchParams]);

  // Get the selected conversation objects
  const selectedConversations = useMemo(() => {
    if (loading || conversations.length === 0) return [];
    return conversations.filter(c => selectedIds.includes(c.id));
  }, [conversations, selectedIds, loading]);

  // Helper function to get cell styling based on metric comparison
  const getCellStyle = (value, allValues, metricType = 'higher-better') => {
    if (value === null || value === undefined || value === '—') return {};
    
    const numericValues = allValues
      .map(v => typeof v === 'string' ? parseFloat(v.replace('%', '')) : v)
      .filter(v => v !== null && v !== undefined && !isNaN(v));
    
    if (numericValues.length < 2) return {};
    
    const numValue = typeof value === 'string' ? parseFloat(value.replace('%', '')) : value;
    const maxValue = Math.max(...numericValues);
    const minValue = Math.min(...numericValues);
    
    // For higher-is-better metrics
    if (metricType === 'higher-better') {
      if (numValue === maxValue) {
        return { backgroundColor: '#e8f5e9', fontWeight: 600 }; // Light green
      } else if (numValue === minValue) {
        return { backgroundColor: '#fafafa' }; // Light gray
      }
    }
    
    // For lower-is-better metrics (like Gini where lower = more equal)
    if (metricType === 'lower-better') {
      if (numValue === minValue) {
        return { backgroundColor: '#e8f5e9', fontWeight: 600 }; // Light green
      } else if (numValue === maxValue) {
        return { backgroundColor: '#fafafa' }; // Light gray
      }
    }
    
    return {};
  };

  // Calculate aggregate statistics
  const aggregateStats = useMemo(() => {
    if (selectedConversations.length === 0) return null;

    const stats = {
      totalConversations: selectedConversations.length,
      avgThreads: 0,
      avgThreadLength: 0,
      avgTurns: 0,
      avgSpeakers: 0,
      avgDuration: 0,
      avgSpeakingGini: 0,
      avgTurnEntropy: 0,
      totalThreads: 0,
    };

    selectedConversations.forEach(conv => {
      stats.totalThreads += conv.threadCount || 0;
      stats.avgThreads += conv.threadCount || 0;
      stats.avgThreadLength += conv.avgThreadLength || 0;
      stats.avgTurns += conv.turnCount || 0;
      stats.avgSpeakers += conv.speakerCount || 0;
      stats.avgDuration += conv.duration || 0;
      stats.avgSpeakingGini += conv.speakingTimeGini || 0;
      stats.avgTurnEntropy += conv.turnSequenceEntropy || 0;
    });

    const count = selectedConversations.length;
    stats.avgThreads = (stats.avgThreads / count).toFixed(1);
    stats.avgThreadLength = (stats.avgThreadLength / count).toFixed(1);
    stats.avgTurns = Math.round(stats.avgTurns / count);
    stats.avgSpeakers = Math.round(stats.avgSpeakers / count);
    stats.avgDuration = Math.round(stats.avgDuration / count);
    stats.avgSpeakingGini = (stats.avgSpeakingGini / count).toFixed(3);
    stats.avgTurnEntropy = (stats.avgTurnEntropy / count).toFixed(3);

    return stats;
  }, [selectedConversations]);

  // Show loading state
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, textAlign: 'center' }}>
        <Typography>Loading conversations...</Typography>
      </Container>
    );
  }

  // Show empty state if no IDs in URL or no conversations found
  if (selectedIds.length === 0 || selectedConversations.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          {selectedIds.length === 0 
            ? 'No conversations selected for comparison. Select conversations from the main table and click "Compare Selected" to begin.'
            : `Could not find conversations with IDs: ${selectedIds.join(', ')}. They may have been removed or the IDs are invalid.`
          }
        </Alert>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{
            backgroundColor: '#d4704c',
            '&:hover': {
              backgroundColor: '#c06040',
            },
          }}
        >
          Back to Conversations
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
            Compare Conversations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comparing {selectedConversations.length} conversation{selectedConversations.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/')}
            sx={{
              borderColor: '#d4704c',
              color: '#d4704c',
              '&:hover': {
                borderColor: '#c06040',
                backgroundColor: '#fdf8f5',
              },
            }}
          >
            Back
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={clearSelection}
          >
            Clear Selection
          </Button>
        </Box>
      </Box>

      {/* Speaker Networks Comparison */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {selectedConversations.map((conv) => (
          <Grid item xs={12} md={12 / Math.min(selectedConversations.length, 3)} key={`network-${conv.id}`}>
            <Box sx={{ mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Conversation {conv.id} - {conv.group}
              </Typography>
            </Box>
            <ConversationVisualizations
              conversationId={conv.id}
              showNetwork={true}
              showTimeline={false}
              height={400}
            />
          </Grid>
        ))}
      </Grid>

      {/* Conversation Timelines Comparison */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {selectedConversations.map((conv) => (
          <Grid item xs={12} md={12 / Math.min(selectedConversations.length, 2)} key={`timeline-${conv.id}`}>
            <Box sx={{ mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Conversation {conv.id} - {conv.group}
              </Typography>
            </Box>
            <ConversationVisualizations
              conversationId={conv.id}
              showNetwork={false}
              showTimeline={true}
            />
          </Grid>
        ))}
      </Grid>

      {/* Metrics Comparison Table */}
      <Paper elevation={1} sx={{ mb: 3 }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Detailed Comparison
          </Typography>
        </Box>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#faf8f6' }}>
                  Metric
                </TableCell>
                {selectedConversations.map((conv) => (
                  <TableCell
                    key={conv.id}
                    align="right"
                    sx={{
                      fontWeight: 600,
                      backgroundColor: '#faf8f6',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: '#f0e8e0',
                      },
                    }}
                    onClick={() => navigate(`/conversation/${conv.id}`)}
                  >
                    Conv {conv.id}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Group/Type */}
              <TableRow>
                <TableCell sx={{ fontWeight: 500 }}>Type</TableCell>
                {selectedConversations.map((conv) => (
                  <TableCell key={conv.id} align="right">
                    {conv.group}
                  </TableCell>
                ))}
              </TableRow>

              {/* Facilitator */}
              <TableRow>
                <TableCell sx={{ fontWeight: 500 }}>Facilitator</TableCell>
                {selectedConversations.map((conv) => (
                  <TableCell key={conv.id} align="right">
                    {conv.facilitator}
                  </TableCell>
                ))}
              </TableRow>

              <TableRow>
                <TableCell colSpan={selectedConversations.length + 1} sx={{ backgroundColor: '#faf8f6' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    THREAD METRICS
                  </Typography>
                </TableCell>
              </TableRow>

              {/* Threads */}
              <TableRow>
                <TableCell sx={{ fontWeight: 500 }}>Number of Threads</TableCell>
                {selectedConversations.map((conv) => {
                  const values = selectedConversations.map(c => c.threadCount || 0);
                  return (
                    <TableCell 
                      key={conv.id} 
                      align="right"
                      sx={getCellStyle(conv.threadCount || 0, values, 'higher-better')}
                    >
                      {conv.threadCount || 0}
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Avg Thread Length */}
              <TableRow>
                <TableCell sx={{ fontWeight: 500 }}>Avg Thread Length</TableCell>
                {selectedConversations.map((conv) => {
                  const values = selectedConversations.map(c => c.avgThreadLength || 0);
                  const displayValue = conv.avgThreadLength ? conv.avgThreadLength.toFixed(2) : '0.00';
                  return (
                    <TableCell 
                      key={conv.id} 
                      align="right"
                      sx={getCellStyle(conv.avgThreadLength || 0, values, 'higher-better')}
                    >
                      {displayValue}
                    </TableCell>
                  );
                })}
              </TableRow>

              <TableRow>
                <TableCell colSpan={selectedConversations.length + 1} sx={{ backgroundColor: '#faf8f6' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    BASIC METRICS
                  </Typography>
                </TableCell>
              </TableRow>

              {/* Turns */}
              <TableRow>
                <TableCell sx={{ fontWeight: 500 }}>Turns</TableCell>
                {selectedConversations.map((conv) => {
                  const values = selectedConversations.map(c => c.turnCount);
                  return (
                    <TableCell 
                      key={conv.id} 
                      align="right"
                      sx={getCellStyle(conv.turnCount, values, 'higher-better')}
                    >
                      {conv.turnCount}
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Speakers */}
              <TableRow>
                <TableCell sx={{ fontWeight: 500 }}>Speakers</TableCell>
                {selectedConversations.map((conv) => {
                  const values = selectedConversations.map(c => c.speakerCount);
                  return (
                    <TableCell 
                      key={conv.id} 
                      align="right"
                      sx={getCellStyle(conv.speakerCount, values, 'higher-better')}
                    >
                      {conv.speakerCount}
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Duration */}
              <TableRow>
                <TableCell sx={{ fontWeight: 500 }}>Duration (s)</TableCell>
                {selectedConversations.map((conv) => (
                  <TableCell key={conv.id} align="right">
                    {conv.totalSpeakingTime ? Math.round(conv.totalSpeakingTime) : '—'}
                  </TableCell>
                ))}
              </TableRow>

              <TableRow>
                <TableCell colSpan={selectedConversations.length + 1} sx={{ backgroundColor: '#faf8f6' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    DISTRIBUTION METRICS
                  </Typography>
                </TableCell>
              </TableRow>

              {/* Speaking Gini */}
              <TableRow>
                <TableCell sx={{ fontWeight: 500 }}>Speaking Gini</TableCell>
                {selectedConversations.map((conv) => {
                  const values = selectedConversations.map(c => c.speakingTimeGini);
                  const displayValue = conv.speakingTimeGini ? conv.speakingTimeGini.toFixed(3) : '—';
                  return (
                    <TableCell 
                      key={conv.id} 
                      align="right"
                      sx={getCellStyle(conv.speakingTimeGini, values, 'lower-better')}
                    >
                      {displayValue}
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Turn Entropy */}
              <TableRow>
                <TableCell sx={{ fontWeight: 500 }}>Turn Entropy</TableCell>
                {selectedConversations.map((conv) => {
                  const values = selectedConversations.map(c => c.turnSequenceEntropy);
                  const displayValue = conv.turnSequenceEntropy ? conv.turnSequenceEntropy.toFixed(3) : '—';
                  return (
                    <TableCell 
                      key={conv.id} 
                      align="right"
                      sx={getCellStyle(conv.turnSequenceEntropy, values, 'higher-better')}
                    >
                      {displayValue}
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Facilitator Speaking % */}
              <TableRow>
                <TableCell sx={{ fontWeight: 500 }}>Fac. Speaking %</TableCell>
                {selectedConversations.map((conv) => {
                  const values = selectedConversations.map(c => c.facilitatorSpeakingPercentage);
                  const displayValue = conv.facilitatorSpeakingPercentage ? conv.facilitatorSpeakingPercentage.toFixed(1) + '%' : '—';
                  return (
                    <TableCell 
                      key={conv.id} 
                      align="right"
                      sx={getCellStyle(conv.facilitatorSpeakingPercentage, values, 'lower-better')}
                    >
                      {displayValue}
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Facilitator Turns % */}
              <TableRow>
                <TableCell sx={{ fontWeight: 500 }}>Fac. Turns %</TableCell>
                {selectedConversations.map((conv) => {
                  const values = selectedConversations.map(c => c.facilitatorTurnsPercentage);
                  const displayValue = conv.facilitatorTurnsPercentage ? conv.facilitatorTurnsPercentage.toFixed(1) + '%' : '—';
                  return (
                    <TableCell 
                      key={conv.id} 
                      align="right"
                      sx={getCellStyle(conv.facilitatorTurnsPercentage, values, 'lower-better')}
                    >
                      {displayValue}
                    </TableCell>
                  );
                })}
              </TableRow>

              <TableRow>
                <TableCell colSpan={selectedConversations.length + 1} sx={{ backgroundColor: '#faf8f6' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                    RESPONSE METRICS
                  </Typography>
                </TableCell>
              </TableRow>

              {/* Avg Subst Response */}
              <TableRow>
                <TableCell sx={{ fontWeight: 500 }}>Avg Subst. Resp.</TableCell>
                {selectedConversations.map((conv) => {
                  const values = selectedConversations.map(c => c.avgSubstRespondedRate);
                  const displayValue = conv.avgSubstRespondedRate ? conv.avgSubstRespondedRate.toFixed(3) : '—';
                  return (
                    <TableCell 
                      key={conv.id} 
                      align="right"
                      sx={getCellStyle(conv.avgSubstRespondedRate, values, 'higher-better')}
                    >
                      {displayValue}
                    </TableCell>
                  );
                })}
              </TableRow>

              {/* Response Entropy */}
              <TableRow>
                <TableCell sx={{ fontWeight: 500 }}>Resp. Entropy</TableCell>
                {selectedConversations.map((conv) => {
                  const values = selectedConversations.map(c => c.substantiveResponsivityEntropy);
                  const displayValue = conv.substantiveResponsivityEntropy ? conv.substantiveResponsivityEntropy.toFixed(3) : '—';
                  return (
                    <TableCell 
                      key={conv.id} 
                      align="right"
                      sx={getCellStyle(conv.substantiveResponsivityEntropy, values, 'higher-better')}
                    >
                      {displayValue}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}

export default ConversationComparePage;
