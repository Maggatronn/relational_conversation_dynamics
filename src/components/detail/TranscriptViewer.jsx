import React, { useState, useRef, useEffect } from 'react';
import { Paper, Typography, Box, Chip, TextField, InputAdornment, Divider } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';

function TranscriptViewer({ turns, conversation, height = 600, selectedSegment, onClearSelection, onSegmentHover, onSegmentClick: onTranscriptSegmentClick }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredSegmentKey, setHoveredSegmentKey] = useState(null);
  const turnRefs = useRef({});
  const scrollContainerRef = useRef(null);

  // Build a map of which segments were responded to and how many times
  const segmentResponseCounts = {};
  turns.forEach(turn => {
    if (turn.segments) {
      Object.entries(turn.segments).forEach(([segId, segment]) => {
        if (segment.majority_label === 'responsive_substantive' && segment.link_turn_id) {
          const key = `${segment.link_turn_id}`;
          if (!segmentResponseCounts[key]) {
            segmentResponseCounts[key] = {};
          }
          const linkedWords = segment.linked_words || '';
          segmentResponseCounts[key][linkedWords] = (segmentResponseCounts[key][linkedWords] || 0) + 1;
        }
      });
    }
  });

  // Scroll to selected segment when it changes
  useEffect(() => {
    if (selectedSegment && turnRefs.current[selectedSegment.turnNumber] && scrollContainerRef.current) {
      const turnElement = turnRefs.current[selectedSegment.turnNumber];
      const container = scrollContainerRef.current;
      
      // Scroll the turn into view within the container
      const containerRect = container.getBoundingClientRect();
      const turnRect = turnElement.getBoundingClientRect();
      const relativeTop = turnRect.top - containerRect.top;
      
      container.scrollTo({
        top: container.scrollTop + relativeTop - 100, // Extra space for overlay
        behavior: 'smooth'
      });
    }
  }, [selectedSegment]);

  if (!turns || turns.length === 0) {
    return (
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary">
          No transcript data available.
        </Typography>
      </Paper>
    );
  }

  const filteredTurns = turns.filter(turn => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      turn.speaker_name?.toLowerCase().includes(search) ||
      turn.words?.toLowerCase().includes(search)
    );
  });

  // Create speaker color mapping (matching network graph colors)
  const speakerColorMap = {};
  const COLORS = ['#e8766d', '#f6a055', '#f9c74f', '#90be6d', '#43aa8b', '#4d908e', '#577590', '#f94144', '#f3722c', '#f8961e', '#f9844a', '#f9c74f'];
  conversation.speakers.forEach((speaker, index) => {
    speakerColorMap[speaker] = COLORS[index % COLORS.length];
  });

  // Helper function to highlight segments based on thread membership
  const highlightThreadSegments = (turn, threadSegments, threadColor) => {
    if (!turn.words) return <em style={{ color: '#999' }}>No text available</em>;
    if (!turn.segments || Object.keys(turn.segments).length === 0) {
      // No segments, check if this turn is part of the thread
      const isInThread = threadSegments.some(seg => seg.startsWith(`${turn.turnNumber}-`));
      if (isInThread) {
        // Highlight entire turn in thread color
        return (
          <span style={{ 
            backgroundColor: `${threadColor}30`,
            padding: '2px 4px',
            borderRadius: '3px',
            boxShadow: `0 0 0 2px ${threadColor}20`
          }}>
            {turn.words}
          </span>
        );
      } else {
        // Light grey-brown for non-thread parts
        return (
          <span style={{ 
            backgroundColor: 'rgba(155, 140, 126, 0.15)',
            padding: '2px 4px',
            borderRadius: '3px'
          }}>
            {turn.words}
          </span>
        );
      }
    }

    // Turn has segments - highlight each segment appropriately
    const segmentsArray = Object.entries(turn.segments);
    const result = [];
    
    segmentsArray.forEach(([segId, segment], idx) => {
      const segmentKey = `${turn.turnNumber}-${idx}`;
      const isThreadSegment = threadSegments.includes(segmentKey);
      const segmentText = segment.segment_words || '';
      
      if (isThreadSegment) {
        result.push(
          <span 
            key={`seg-${segmentKey}`}
            style={{ 
              backgroundColor: `${threadColor}30`,
              padding: '2px 4px',
              borderRadius: '3px',
              boxShadow: `0 0 0 2px ${threadColor}20`,
              marginRight: '2px'
            }}
          >
            {segmentText}
          </span>
        );
      } else {
        result.push(
          <span 
            key={`seg-${segmentKey}`}
            style={{ 
              backgroundColor: 'rgba(155, 140, 126, 0.15)',
              padding: '2px 4px',
              borderRadius: '3px',
              marginRight: '2px'
            }}
          >
            {segmentText}
          </span>
        );
      }
    });
    
    return <>{result}</>;
  };

  // Helper function to render turn with segments styled appropriately
  const renderTurnWithSegments = (turn) => {
    if (!turn.words) return <em style={{ color: '#999' }}>No text available</em>;
    
    // If turn has no segments, render as plain text
    if (!turn.segments || Object.keys(turn.segments).length === 0) {
      return turn.words;
    }
    
    const segmentsArray = Object.entries(turn.segments);
    const result = [];
    
    segmentsArray.forEach(([segId, segment], idx) => {
      const segmentKey = `${turn.turnNumber}-${idx}`;
      const segmentText = segment.segment_words || '';
      
      // Check if this segment is responsive (responds to something)
      const isResponsive = segment.majority_label && segment.majority_label.startsWith('responsive');
      const isSubstantive = segment.majority_label === 'responsive_substantive';
      
      // Check if this segment was responded to (count how many times)
      const linkedWords = segment.segment_words;
      const responseCount = (segmentResponseCounts[turn.turnNumber] && 
                             segmentResponseCounts[turn.turnNumber][linkedWords]) || 0;
      
      // Calculate highlight intensity based on response count (neutral soft lavender/periwinkle)
      const baseOpacity = 0.1;
      const maxOpacity = 0.4;
      const bgOpacity = responseCount === 0 
        ? 0 
        : Math.min(baseOpacity + (responseCount * 0.1), maxOpacity);
      
      const isHovered = hoveredSegmentKey === segmentKey;
      
      result.push(
        <span
          key={`seg-${segmentKey}`}
          onMouseEnter={() => {
            setHoveredSegmentKey(segmentKey);
            if (onSegmentHover) {
              onSegmentHover(segmentKey);
            }
          }}
          onMouseLeave={() => {
            setHoveredSegmentKey(null);
            if (onSegmentHover) {
              onSegmentHover(null);
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (onTranscriptSegmentClick) {
              onTranscriptSegmentClick({
                turnNumber: turn.turnNumber,
                segmentIdx: idx,
                segmentKey: segmentKey,
                text: segmentText,
                isResponsive: isResponsive,
                targetTurnNumber: segment.link_turn_id || null,
              });
            }
          }}
          style={{
            backgroundColor: responseCount > 0 ? `rgba(180, 180, 220, ${bgOpacity})` : 'transparent',
            padding: '2px 4px',
            borderRadius: '3px',
            marginRight: '3px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: isHovered ? '0 0 0 2px rgba(180, 180, 220, 0.5)' : 'none',
            transform: isHovered ? 'scale(1.01)' : 'scale(1)',
            display: 'inline-block',
          }}
        >
          {segmentText}
        </span>
      );
    });
    
    return <>{result}</>;
  };

  // Helper function for target turn highlighting (when a segment is selected)
  const highlightLinkedWords = (text, linkedWords) => {
    if (!linkedWords || !text) return text;
    
    const index = text.toLowerCase().indexOf(linkedWords.toLowerCase());
    if (index === -1) return text;
    
    const before = text.substring(0, index);
    const match = text.substring(index, index + linkedWords.length);
    const after = text.substring(index + linkedWords.length);
    
    return (
      <>
        {before}
        <span style={{ 
          fontWeight: 700, 
          backgroundColor: 'rgba(67, 170, 139, 0.5)', 
          padding: '2px 4px', 
          borderRadius: '2px',
          border: '2px solid rgba(67, 170, 139, 0.8)',
        }}>
          {match}
        </span>
        {after}
      </>
    );
  };

  return (
    <Paper elevation={1} sx={{ p: 3, height: `${height}px`, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Transcript
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Search transcript..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 1 }}
        />
        <Typography variant="caption" color="text.secondary">
          {filteredTurns.length} of {turns.length} turns
        </Typography>
      </Box>


      <Box
        ref={scrollContainerRef}
        onClick={onClearSelection}
        sx={{
          flex: 1,
          overflowY: 'auto',
          pr: 1,
          cursor: selectedSegment ? 'pointer' : 'default',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f0e0d5',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#d4704c',
            borderRadius: '4px',
          },
        }}
      >
        {filteredTurns.map((turn, index) => {
          const isSelectedTurn = selectedSegment && turn.turnNumber === selectedSegment.turnNumber;
          const isTargetTurn = selectedSegment && turn.turnNumber === selectedSegment.targetTurnNumber;
          const isThreadTurn = selectedSegment && selectedSegment.threadTurns && 
                               selectedSegment.threadTurns.includes(turn.turnNumber);
          
          return (
            <Box 
              key={turn.turnNumber} 
              ref={(el) => turnRefs.current[turn.turnNumber] = el}
              sx={{ 
                mb: 2,
                transition: 'background-color 0.3s, border-left 0.3s',
                borderRadius: 1,
                p: 1,
                ml: -1,
                mr: -1,
                backgroundColor: isSelectedTurn 
                  ? 'rgba(67, 170, 139, 0.15)' 
                  : isTargetTurn 
                  ? 'rgba(77, 144, 142, 0.15)'
                  : isThreadTurn && selectedSegment?.threadColor
                  ? 'transparent' // No background when showing thread segments
                  : 'transparent',
                borderLeft: isSelectedTurn 
                  ? '4px solid #43aa8b' 
                  : isTargetTurn 
                  ? '4px solid #4d908e'
                  : isThreadTurn && selectedSegment?.threadColor
                  ? `4px solid ${selectedSegment.threadColor}`
                  : '4px solid transparent',
              }}
            >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Chip
                label={turn.speaker_name}
                size="small"
                sx={{
                  backgroundColor: speakerColorMap[turn.speaker_name],
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {Math.floor(turn.start_time / 60)}:{String(Math.floor(turn.start_time % 60)).padStart(2, '0')}
              </Typography>
              
              {(turn.subst_num_responses > 0 || turn.mech_num_responses > 0) && (
                <Chip
                  icon={<ChatBubbleOutlineIcon sx={{ fontSize: '0.9rem' }} />}
                  label={`${(turn.subst_num_responses || 0) + (turn.mech_num_responses || 0)} responses`}
                  size="small"
                  variant="outlined"
                  sx={{ 
                    ml: 'auto',
                    borderColor: speakerColorMap[turn.speaker_name],
                    color: speakerColorMap[turn.speaker_name],
                  }}
                />
              )}
            </Box>
            
            <Typography variant="body2" sx={{ pl: 2, lineHeight: 1.8 }}>
              {isThreadTurn && selectedSegment?.threadSegments && selectedSegment?.threadColor
                ? highlightThreadSegments(turn, selectedSegment.threadSegments, selectedSegment.threadColor)
                : isTargetTurn && selectedSegment?.linkedWords
                ? highlightLinkedWords(turn.words, selectedSegment.linkedWords)
                : renderTurnWithSegments(turn)
              }
            </Typography>
            
            {index < filteredTurns.length - 1 && <Divider sx={{ mt: 2 }} />}
          </Box>
          );
        })}
      </Box>
    </Paper>
  );
}

export default TranscriptViewer;

