import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Paper, Typography, Box, Tooltip as MuiTooltip, ToggleButton, ToggleButtonGroup } from '@mui/material';

const SPEAKER_COLORS = ['#e8766d', '#f6a055', '#f9c74f', '#90be6d', '#43aa8b', '#4d908e', '#577590', '#f94144', '#f3722c', '#f8961e', '#f9844a', '#f9c74f'];

function ConversationTimeline({ turns, conversation, onSegmentClick, onBackgroundClick, hoveredSegmentKey, selectedSegment, onTranscriptSegmentClick }) {
  const [hoveredTurn, setHoveredTurn] = useState(null);
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [hoveredThread, setHoveredThread] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const [viewMode, setViewMode] = useState('speaker'); // 'speaker', 'thread-depth', or 'responsivity'
  const [timelineWidth, setTimelineWidth] = useState(800);
  const timelineWidthRef = useRef(800); // Default width, will be updated
  const timelineContainerRef = useRef(null);
  
  // Calculate selected time from selectedSegment
  const selectedTime = useMemo(() => {
    if (!selectedSegment || !turns || turns.length === 0) return null;
    
    const turn = turns.find(t => t.turnNumber === selectedSegment.turnNumber);
    if (!turn) return null;
    
    // Return the middle of the turn
    return (turn.start_time + turn.end_time) / 2;
  }, [selectedSegment, turns]);

  // Constants for layout
  const marginLeft = 100;
  const marginRight = 20;

  // Update timeline width on resize
  useEffect(() => {
    if (!timelineContainerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const width = entry.contentRect.width - marginLeft - marginRight;
        timelineWidthRef.current = width;
        setTimelineWidth(width);
      }
    });

    resizeObserver.observe(timelineContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [marginLeft, marginRight]);

  const timelineData = useMemo(() => {
    if (!turns || turns.length === 0 || !conversation) {
      return { turns: [], speakerColorMap: {}, maxTime: 0, speakers: [], edges: [] };
    }

    // Calculate total speaking time
    const totalSpeakingTime = Object.values(conversation.speakerSpeakingTime).reduce((sum, time) => sum + time, 0);

    // Filter speakers who spoke more than 3% of the conversation
    const significantSpeakers = conversation.speakers.filter(speaker => {
      const speakingTime = conversation.speakerSpeakingTime[speaker] || 0;
      const percentage = totalSpeakingTime > 0 ? (speakingTime / totalSpeakingTime) * 100 : 0;
      return percentage > 3;
    });

    // Create speaker color mapping
    const speakerColorMap = {};
    conversation.speakers.forEach((speaker, index) => {
      speakerColorMap[speaker] = SPEAKER_COLORS[index % SPEAKER_COLORS.length];
    });

    const maxTime = Math.max(...turns.map(t => t.end_time));

    // Filter turns to only include significant speakers
    const filteredTurns = turns.filter(turn => significantSpeakers.includes(turn.speaker_name));

    // Build map of turn numbers to count of substantive responses they received
    const substantiveResponseCounts = {};
    filteredTurns.forEach(turn => {
      substantiveResponseCounts[turn.turnNumber] = 0;
    });

    // Thread colors for conversation chains
    const threadColors = [
      '#e63946', '#f77f00', '#06a77d', '#4361ee', '#7209b7',
      '#d62828', '#f77f00', '#2a9d8f', '#264653', '#e76f51',
      '#c9184a', '#ff006e', '#3a86ff', '#8338ec', '#fb5607',
    ];

    // Build edges for substantive responses and create segment lookup
    const edges = [];
    const segmentMap = {}; // Map of "turnIdx-segIdx" to segment data
    const turnConnections = new Map(); // Map turn pairs to track connections
    
    filteredTurns.forEach((turn, turnIdx) => {
      const hasSegments = turn.segments && Object.keys(turn.segments).length > 0;
      if (!hasSegments) return;

      const segments = Object.entries(turn.segments);
      const numSegments = segments.length;
      const turnDuration = turn.end_time - turn.start_time;
      const segmentDuration = turnDuration / numSegments;

      segments.forEach(([segmentId, segment], segIdx) => {
        const segmentKey = `${turnIdx}-${segIdx}`;
        segmentMap[segmentKey] = {
          ...segment,
          turnIdx,
          segIdx,
          turnNumber: turn.turnNumber,
          speaker: turn.speaker_name,
        };

        // Only draw edges for substantive responses
        if (segment.majority_label === 'responsive_substantive') {
          const targetTurnId = segment.link_turn_id;
          
          // Increment substantive response count for target turn
          if (substantiveResponseCounts[targetTurnId] !== undefined) {
            substantiveResponseCounts[targetTurnId]++;
          }
          
          // Find the target turn
          const targetTurnIdx = filteredTurns.findIndex(t => t.turnNumber === targetTurnId);
          if (targetTurnIdx === -1) return;

          const targetTurn = filteredTurns[targetTurnIdx];
          
          // Calculate source segment position
          const sourceStartTime = turn.start_time + (segIdx * segmentDuration);
          const sourceMidTime = sourceStartTime + (segmentDuration / 2);
          
          // Calculate target position (middle of the turn)
          const targetMidTime = (targetTurn.start_time + targetTurn.end_time) / 2;

          edges.push({
            sourceTime: sourceMidTime,
            targetTime: targetMidTime,
            sourceSpeaker: turn.speaker_name,
            targetSpeaker: targetTurn.speaker_name,
            sourceTurnIdx: turnIdx,
            targetTurnIdx: targetTurnIdx,
            sourceSegIdx: segIdx,
            sourceTurnNumber: turn.turnNumber,
            targetTurnNumber: targetTurnId,
            segmentText: segment.segment_words,
            linkedWords: segment.linked_words,
          });
        }
      });
    });

    // Find conversation threads using union-find at SEGMENT level
    const parent = {};
    const find = (x) => {
      if (parent[x] === undefined) parent[x] = x;
      if (parent[x] !== x) parent[x] = find(parent[x]);
      return parent[x];
    };
    const union = (x, y) => {
      const rootX = find(x);
      const rootY = find(y);
      if (rootX !== rootY) parent[rootX] = rootY;
    };

    // Create unique segment IDs and union connected segments
    edges.forEach(edge => {
      // Source segment ID: "turnNumber-segmentIndex"
      const sourceSegId = `${edge.sourceTurnNumber}-${edge.sourceSegIdx}`;
      
      // Find target segment by matching linked_words to segment text
      // First, get the target turn
      const targetTurn = filteredTurns.find(t => t.turnNumber === edge.targetTurnNumber);
      let targetSegId = `${edge.targetTurnNumber}-0`; // default to first segment
      
      if (targetTurn && targetTurn.segments) {
        // Convert segments object to array
        const targetSegmentsArray = Object.entries(targetTurn.segments);
        
        // Try to find which segment contains the linked_words
        const targetSegIdx = targetSegmentsArray.findIndex(([segId, seg]) => {
          return edge.linkedWords && seg.segment_words && 
                 seg.segment_words.includes(edge.linkedWords.substring(0, 20));
        });
        
        if (targetSegIdx !== -1) {
          targetSegId = `${edge.targetTurnNumber}-${targetSegIdx}`;
        }
      }
      
      union(sourceSegId, targetSegId);
    });

    // Count edges per thread root
    const threadEdgeCounts = {};
    edges.forEach(edge => {
      const sourceSegId = `${edge.sourceTurnNumber}-${edge.sourceSegIdx}`;
      const root = find(sourceSegId);
      threadEdgeCounts[root] = (threadEdgeCounts[root] || 0) + 1;
    });

    // Assign thread IDs and colors only to threads with 3+ edges (at least 3 links in a row)
    const threadIds = {};
    const threads = {};
    let threadCounter = 0;
    
    edges.forEach(edge => {
      const sourceSegId = `${edge.sourceTurnNumber}-${edge.sourceSegIdx}`;
      const root = find(sourceSegId);
      
      if (threadEdgeCounts[root] >= 3) {
        if (threadIds[root] === undefined) {
          threadIds[root] = threadCounter++;
          threads[threadIds[root]] = threadColors[threadIds[root] % threadColors.length];
        }
      }
    });

    // Assign thread color and thread ID to each edge (grey-brown for non-thread edges)
    edges.forEach(edge => {
      const sourceSegId = `${edge.sourceTurnNumber}-${edge.sourceSegIdx}`;
      const root = find(sourceSegId);
      
      if (threadEdgeCounts[root] >= 3) {
        edge.threadColor = threads[threadIds[root]];
        edge.threadId = threadIds[root];
      } else {
        edge.threadColor = '#9a8c7e'; // Light grey-brown for non-thread edges
        edge.threadId = null;
      }
    });

    // Build thread info for legend: map threadId to segments and count edges
    const threadInfo = {};
    
    edges.forEach(edge => {
      if (edge.threadId !== null) {
        if (!threadInfo[edge.threadId]) {
          threadInfo[edge.threadId] = {
            id: edge.threadId,
            color: edge.threadColor,
            segments: new Set(),
            turns: new Set(),
            edgeCount: 0,
          };
        }
        // Add source segment
        threadInfo[edge.threadId].segments.add(`${edge.sourceTurnNumber}-${edge.sourceSegIdx}`);
        threadInfo[edge.threadId].turns.add(edge.sourceTurnNumber);
        
        // Add target segment too! Find which segment in the target turn contains the linked_words
        // IMPORTANT: Only add if the target turn is in filteredTurns AND has segments
        const targetTurn = filteredTurns.find(t => t.turnNumber === edge.targetTurnNumber);
        if (targetTurn && targetTurn.segments && Object.keys(targetTurn.segments).length > 0) {
          const targetSegmentsArray = Object.entries(targetTurn.segments);
          const targetSegIdx = targetSegmentsArray.findIndex(([segId, seg]) => {
            return edge.linkedWords && seg.segment_words && 
                   seg.segment_words.includes(edge.linkedWords.substring(0, 20));
          });
          
          if (targetSegIdx !== -1) {
            const targetSegKey = `${edge.targetTurnNumber}-${targetSegIdx}`;
            threadInfo[edge.threadId].segments.add(targetSegKey);
          } else {
            // If we can't find the exact segment, add the first segment of the target turn
            const targetSegKey = `${edge.targetTurnNumber}-0`;
            threadInfo[edge.threadId].segments.add(targetSegKey);
          }
        }
        // Note: If target turn has no segments or is filtered out, we don't add it
        
        // Add target turn
        threadInfo[edge.threadId].turns.add(edge.targetTurnNumber);
        // Count edges
        threadInfo[edge.threadId].edgeCount++;
      }
    });

    // Convert to array and sort by thread ID
    const threadsArray = Object.values(threadInfo).sort((a, b) => a.id - b.id);
    
    // Calculate thread metrics for this conversation
    const threadCount = threadsArray.length;
    const avgThreadLength = threadCount > 0 
      ? threadsArray.reduce((sum, thread) => sum + thread.edgeCount, 0) / threadCount 
      : 0;

    return { 
      turns: filteredTurns, 
      speakerColorMap, 
      maxTime, 
      speakers: significantSpeakers,
      edges,
      segmentMap,
      substantiveResponseCounts,
      threads: threadsArray,
      threadCount,
      avgThreadLength,
    };
  }, [turns, conversation]);

  // Auto-select thread when a threaded segment is clicked in transcript (only in stream graph view)
  useEffect(() => {
    if (viewMode === 'thread-depth' && selectedSegment && timelineData.threads && selectedSegment.segmentKey) {
      // Check if this segment is part of a thread
      const segmentKey = selectedSegment.segmentKey;
      const thread = timelineData.threads.find(t => t.segments.has(segmentKey));
      
      if (thread) {
        setSelectedThread(thread.id);
      }
    }
  }, [selectedSegment, viewMode, timelineData.threads]);

  // Calculate stream graph data for thread depth view
  const streamGraphData = useMemo(() => {
    if (!timelineData.turns.length) return { layers: [], totalWords: 0, points: [] };

    // Build timeline of all segments with their word counts and thread membership
    const segments = [];
    
    timelineData.turns.forEach((turn) => {
      const hasSegments = turn.segments && Object.keys(turn.segments).length > 0;
      if (!hasSegments) return;

      const segmentEntries = Object.entries(turn.segments);
      
      segmentEntries.forEach(([segmentId, segment], segIdx) => {
        // Match the exact format used in thread detection: turnNumber-segIdx (line 157 in thread code)
        const segmentKey = `${turn.turnNumber}-${segIdx}`;
        const wordCount = segment.segment_words ? segment.segment_words.split(' ').length : 0;
        
        // Find which thread this segment belongs to
        let threadId = null;
        let threadColor = null;
        
        for (const thread of timelineData.threads) {
          if (thread.segments.has(segmentKey)) {
            threadId = thread.id;
            threadColor = thread.color;
            break;
          }
        }
        
        segments.push({
          time: turn.start_time,
          endTime: turn.end_time,
          wordCount,
          threadId,
          threadColor,
          segmentKey,
          speaker: turn.speaker_name,
          text: segment.segment_words,
        });
      });
    });

    // Sort by time
    segments.sort((a, b) => a.time - b.time);

    // Create time points at regular intervals for smooth stream graph
    const maxTime = timelineData.maxTime;
    const timeStep = maxTime / 150; // 150 points across timeline for smoother curves
    const timeWindow = 120; // 2 minute sliding window (in seconds)
    
    const points = [];
    
    for (let t = 0; t <= maxTime; t += timeStep) {
      // For this time point, find all segments within the time window
      const activeSegments = segments.filter(seg => 
        seg.time >= (t - timeWindow) && seg.time <= t
      );
      
      // Count word contributions from each thread in this window
      const layerValues = {};
      let totalWords = 0;
      
      activeSegments.forEach(seg => {
        // IMPORTANT: Use !== null instead of || because threadId can be 0 (which is falsy)
        const layerKey = seg.threadId !== null ? seg.threadId : 'unthreaded';
        if (!layerValues[layerKey]) {
          layerValues[layerKey] = 0;
        }
        // Weight by recency (more recent = more weight)
        const recency = 1 - (t - seg.time) / timeWindow;
        const weight = Math.max(0, recency);
        layerValues[layerKey] += seg.wordCount * weight;
        totalWords += seg.wordCount * weight;
      });
      
      points.push({
        time: t,
        totalWords,
        layerValues,
      });
    }

    // Create layers for rendering
    // Order: threaded content (each thread its own layer) + unthreaded content (grey)
    // IMPORTANT: Use !== null instead of || because threadId can be 0 (which is falsy)
    const layerKeys = Array.from(new Set(segments.map(s => s.threadId !== null ? s.threadId : 'unthreaded')));
    const threadLayers = layerKeys.filter(k => k !== 'unthreaded').sort();
    const orderedLayers = [...threadLayers, 'unthreaded'];

    const layers = orderedLayers.map(layerKey => {
      const thread = timelineData.threads.find(t => t.id === layerKey);
      return {
        id: layerKey,
        color: layerKey === 'unthreaded' ? '#d0c8c0' : thread?.color || '#999',
        isUnthreaded: layerKey === 'unthreaded',
      };
    });

    // Apply wiggle algorithm for centered stream graph layout
    // Calculate baseline offsets so layers flow around center
    points.forEach(point => {
      const layerSizes = orderedLayers.map(key => point.layerValues[key] || 0);
      const totalSize = layerSizes.reduce((sum, val) => sum + val, 0);
      
      // Calculate offsets using silhouette algorithm (center the stream)
      const offsets = [];
      let sum = 0;
      for (let i = 0; i < layerSizes.length; i++) {
        offsets[i] = sum;
        sum += layerSizes[i];
      }
      
      // Center the stream: shift all offsets so the center is at 50%
      const centerOffset = sum / 2;
      point.layerOffsets = offsets.map(offset => offset - centerOffset);
      point.layerSizes = layerSizes;
    });

    return {
      layers,
      points,
      maxTime: timelineData.maxTime,
      totalWords: points.length > 0 ? points[points.length - 1].totalWords : 0,
    };
  }, [timelineData]);

  // Calculate responsivity over time data
  const responsivityData = useMemo(() => {
    if (!timelineData.turns.length) return { points: [], maxRate: 1.0, maxDensity: 1.0, maxTime: 0 };

    const maxTime = timelineData.maxTime;
    const timeWindow = 240; // 4 minute sliding window for smoother transitions
    const timeStep = maxTime / 200; // 200 points for smoother curves
    
    const points = [];
    
    for (let t = 0; t <= maxTime; t += timeStep) {
      // Find all turns within the time window
      const activeTurns = timelineData.turns.filter(turn => 
        turn.start_time >= (t - timeWindow) && turn.start_time <= t
      );
      
      // Count substantive responses in this window
      let substantiveResponses = 0;
      let totalSegments = 0;
      const responsesReceived = new Map(); // Track responses received by each speaker
      
      // Initialize all conversation speakers (not just active in window) with 0
      timelineData.speakers.forEach(speaker => {
        responsesReceived.set(speaker, 0);
      });
      
      activeTurns.forEach(turn => {
        if (turn.segments && typeof turn.segments === 'object') {
          const segmentEntries = Object.values(turn.segments);
          totalSegments += segmentEntries.length;
          
          segmentEntries.forEach(segment => {
            if (segment.majority_label === 'responsive_substantive' && segment.link_turn_id) {
              substantiveResponses++;
              
              // Track who received this response
              const targetTurn = timelineData.turns.find(t => 
                t.turnNumber === segment.link_turn_id
              );
              if (targetTurn) {
                responsesReceived.set(
                  targetTurn.speaker_name, 
                  (responsesReceived.get(targetTurn.speaker_name) || 0) + 1
                );
              }
            }
          });
        }
      });
      
      // Responsivity rate = proportion of segments that are substantive responses
      const responsivityRate = totalSegments > 0 ? (substantiveResponses / totalSegments) : 0;
      
      // Network density = 1 - Gini coefficient of responses received
      // Gini coefficient measures inequality: 0 = perfect equality, 1 = perfect inequality
      // So networkDensity = 1 - Gini means:
      //   - High density = responses evenly distributed
      //   - Low density = responses concentrated on one person (star network)
      let networkDensity = 0;
      if (substantiveResponses > 0) {
        const responseCounts = Array.from(responsesReceived.values()).sort((a, b) => a - b);
        const n = responseCounts.length;
        
        if (n > 1) {
          // Calculate Gini coefficient
          let sumOfDifferences = 0;
          for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
              sumOfDifferences += Math.abs(responseCounts[i] - responseCounts[j]);
            }
          }
          const meanResponses = substantiveResponses / n;
          const gini = sumOfDifferences / (2 * n * n * meanResponses);
          
          // Network density is inverse of inequality
          networkDensity = Math.max(0, Math.min(1, 1 - gini));
        } else {
          networkDensity = 0; // Only one speaker, no network
        }
      }
      
      points.push({
        time: t,
        responsivityRate,
        networkDensity,
      });
    }

    // Use fixed scale of 0-1 for both metrics since they are ratios
    const maxRate = 1.0;
    const maxDensity = 1.0;

    return { points, maxTime, maxRate, maxDensity };
  }, [timelineData]);

  if (!timelineData.turns.length) {
    return (
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary">
          No timeline data available.
        </Typography>
      </Paper>
    );
  }

  const rowHeight = 28;
  const timelineHeight = timelineData.speakers.length * rowHeight + 40;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const handleThreadClick = (thread) => {
    setSelectedThread(thread.id);
    // Get all turn numbers and segments in this thread
    const turnNumbers = Array.from(thread.turns);
    const threadSegments = Array.from(thread.segments); // Format: "turnNumber-segmentIdx"
    
    if (turnNumbers.length > 0 && onSegmentClick) {
      // Scroll to the first turn in the thread
      const firstTurn = timelineData.turns.find(t => turnNumbers.includes(t.turnNumber));
      if (firstTurn) {
        onSegmentClick({
          turnNumber: firstTurn.turnNumber,
          speaker: firstTurn.speaker_name,
          text: firstTurn.words,
          targetTurnNumber: null,
          targetSpeaker: null,
          targetText: null,
          linkedWords: null,
          isResponse: false,
          threadTurns: turnNumbers, // Pass all turns in thread for highlighting
          threadSegments: threadSegments, // Pass specific segments
          threadColor: thread.color, // Pass thread color
        });
      }
    }
  };

  return (
    <Paper elevation={1} sx={{ p: 2 }}>
      {/* Unified Header */}
      <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ mb: 0 }}>
          Conversation Timeline
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {timelineData.threads.length > 0 && (
            <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
              {timelineData.threadCount} threads • avg {timelineData.avgThreadLength.toFixed(1)} links
            </Typography>
          )}
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newMode) => {
              if (newMode !== null) {
                setViewMode(newMode);
              }
            }}
            size="small"
            sx={{ height: 32 }}
          >
            <ToggleButton value="speaker" sx={{ px: 2, fontSize: '0.75rem' }}>
              Speaker Timeline
            </ToggleButton>
            <ToggleButton value="thread-depth" sx={{ px: 2, fontSize: '0.75rem' }}>
              Thread Depth
            </ToggleButton>
            <ToggleButton value="responsivity" sx={{ px: 2, fontSize: '0.75rem' }}>
              Responsivity
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Thread Histogram Legend */}
      {timelineData.threads.length > 0 && (
        <Box sx={{ mb: 2, p: 1.5, backgroundColor: '#faf8f6', borderRadius: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'flex-end', 
            gap: 1.5,
            height: 60,
            px: 1,
            position: 'relative',
          }}>
            {timelineData.threads.map((thread, idx) => {
              const threadLabel = String.fromCharCode(65 + idx); // A, B, C, etc.
              const isHovered = hoveredThread === thread.id;
              const isSelected = selectedThread === thread.id;
              const maxEdges = Math.max(...timelineData.threads.map(t => t.edgeCount));
              // Calculate bar height in pixels (max 45px, min 12px for visibility)
              const minBarHeight = 12;
              const maxBarHeight = 45;
              const barHeightPx = Math.max(
                minBarHeight, 
                (thread.edgeCount / maxEdges) * maxBarHeight
              );
              
              return (
                <Box
                  key={thread.id}
                  onMouseEnter={() => setHoveredThread(thread.id)}
                  onMouseLeave={() => setHoveredThread(null)}
                  onClick={() => handleThreadClick(thread)}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flex: 1,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  {/* Bar */}
                  <Box
                    sx={{
                      width: '100%',
                      height: `${barHeightPx}px`,
                      backgroundColor: thread.color,
                      borderRadius: '4px 4px 0 0',
                      position: 'relative',
                      boxShadow: isHovered || isSelected ? `0 0 12px ${thread.color}80` : 'none',
                      opacity: isHovered || isSelected ? 1 : 0.85,
                      border: isSelected ? `2px solid ${thread.color}` : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    {/* Edge count label on top of bar */}
                    <Typography
                      variant="caption"
                      sx={{
                        position: 'absolute',
                        top: -16,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontWeight: 600,
                        fontSize: '0.65rem',
                        color: 'text.secondary',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {thread.edgeCount}
                    </Typography>
                  </Box>
                  {/* Thread label */}
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 0.4,
                      fontWeight: isHovered || isSelected ? 700 : 600,
                      fontSize: '0.8rem',
                      color: isHovered || isSelected ? thread.color : 'text.primary',
                    }}
                  >
                    {threadLabel}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Render based on view mode */}
      <Box 
        ref={timelineContainerRef}
        sx={{ position: 'relative', width: '100%' }}
      >
        {viewMode === 'thread-depth' ? (
          <ThreadDepthView 
            streamGraphData={streamGraphData}
            timelineWidth={timelineWidth}
            timelineWidthRef={timelineWidthRef}
            marginLeft={marginLeft}
            marginRight={marginRight}
            height={timelineHeight}
            formatTime={formatTime}
            onSegmentClick={onSegmentClick}
            timelineData={timelineData}
            hoveredThread={hoveredThread}
            selectedThread={selectedThread}
            setSelectedThread={setSelectedThread}
            selectedTime={selectedTime}
          />
        ) : viewMode === 'responsivity' ? (
          <ResponsivityView 
            responsivityData={responsivityData}
            timelineWidth={timelineWidth}
            timelineWidthRef={timelineWidthRef}
            marginLeft={marginLeft}
            marginRight={marginRight}
            height={timelineHeight}
            formatTime={formatTime}
            onSegmentClick={onSegmentClick}
            timelineData={timelineData}
            selectedTime={selectedTime}
          />
        ) : (
          <Box sx={{ position: 'relative', height: timelineHeight, width: '100%' }}
          >
          {/* Speaker labels */}
          <Box sx={{ position: 'absolute', left: 0, top: 20, width: marginLeft - 10 }}>
            {timelineData.speakers.map((speaker, idx) => (
            <Box
              key={speaker}
              sx={{
                height: rowHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                pr: 1,
              }}
            >
              <Typography variant="body2" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                {speaker}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Timeline canvas */}
        <Box
          onClick={onBackgroundClick}
          sx={{
            position: 'absolute',
            left: marginLeft,
            right: marginRight,
            top: 30,
            height: timelineData.speakers.length * rowHeight,
            borderLeft: '2px solid #ddd',
            backgroundColor: '#fdfcfa',
            cursor: 'pointer',
          }}
        >
          {/* Grid lines */}
          {timelineData.speakers.map((speaker, idx) => (
            <Box
              key={`line-${speaker}`}
              sx={{
                position: 'absolute',
                top: idx * rowHeight,
                left: 0,
                right: 0,
                height: rowHeight,
                borderBottom: idx < timelineData.speakers.length - 1 ? '1px solid #f0e0d5' : 'none',
              }}
            />
          ))}

          {/* Response arcs - SVG layer */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              overflow: 'visible',
            }}
          >
            {timelineData.edges.map((edge, idx) => {
              const sourceSpeakerIdx = timelineData.speakers.indexOf(edge.sourceSpeaker);
              const targetSpeakerIdx = timelineData.speakers.indexOf(edge.targetSpeaker);
              
              if (sourceSpeakerIdx === -1 || targetSpeakerIdx === -1) return null;

              // Convert time to pixel positions
              const timelineWidth = timelineWidthRef.current;
              const sourceX = (edge.sourceTime / timelineData.maxTime) * timelineWidth;
              const targetX = (edge.targetTime / timelineData.maxTime) * timelineWidth;
              const sourceY = sourceSpeakerIdx * rowHeight + rowHeight / 2;
              const targetY = targetSpeakerIdx * rowHeight + rowHeight / 2;

              // Simple arch - curve down/up between the two points
              const midX = (sourceX + targetX) / 2;
              const midY = (sourceY + targetY) / 2;
              const arcOffset = Math.abs(sourceY - targetY) / 3;

              // Check if this edge should be highlighted
              const isSegmentHighlighted = hoveredSegment && (
                hoveredSegment === `${edge.sourceTurnIdx}-${edge.sourceSegIdx}` ||
                hoveredSegment === `${edge.targetTurnIdx}`
              );
              
              // Check if this edge is part of hovered or selected thread
              const isThreadHighlighted = (hoveredThread !== null && edge.threadId === hoveredThread) ||
                                          (selectedThread !== null && edge.threadId === selectedThread);

              const isHighlighted = isSegmentHighlighted || isThreadHighlighted;

              return (
                <path
                  key={`edge-${idx}`}
                  d={`M ${sourceX} ${sourceY} Q ${midX} ${midY - arcOffset} ${targetX} ${targetY}`}
                  stroke={edge.threadColor || "#6b5d54"}
                  strokeWidth={isHighlighted ? "3" : "1.5"}
                  fill="none"
                  opacity={isThreadHighlighted ? "1" : (isSegmentHighlighted ? "0.8" : "0.5")}
                  style={{ 
                    transition: 'all 0.2s',
                    filter: isThreadHighlighted ? 'drop-shadow(0 0 4px currentColor)' : 'none',
                    cursor: edge.threadId !== null ? 'pointer' : 'default',
                    pointerEvents: 'stroke',
                  }}
                  onMouseEnter={() => {
                    if (edge.threadId !== null) {
                      setHoveredThread(edge.threadId);
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredThread(null);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (edge.threadId !== null) {
                      // Find the thread
                      const thread = timelineData.threads.find(t => t.id === edge.threadId);
                      if (thread) {
                        setSelectedThread(edge.threadId);
                        
                        // Get all turn numbers in this thread
                        const turnNumbers = Array.from(thread.turns);
                        const threadSegments = Array.from(thread.segments);
                        
                        if (turnNumbers.length > 0 && onSegmentClick) {
                          // Scroll to the first turn in the thread
                          const firstTurn = timelineData.turns.find(t => turnNumbers.includes(t.turnNumber));
                          if (firstTurn) {
                            onSegmentClick({
                              turnNumber: firstTurn.turnNumber,
                              speaker: firstTurn.speaker_name,
                              text: firstTurn.words,
                              targetTurnNumber: null,
                              targetSpeaker: null,
                              targetText: null,
                              linkedWords: null,
                              isResponse: false,
                              threadTurns: turnNumbers,
                              threadSegments: threadSegments,
                              threadColor: thread.color,
                            });
                          }
                        }
                      }
                    }
                  }}
                />
              );
            })}
          </svg>

          {/* Turn segments */}
          {timelineData.turns.map((turn, turnIdx) => {
            const speakerIndex = timelineData.speakers.indexOf(turn.speaker_name);
            if (speakerIndex === -1) return null;

            const color = timelineData.speakerColorMap[turn.speaker_name];
            const turnDuration = turn.end_time - turn.start_time;
            
            // Check if turn has segments
            const hasSegments = turn.segments && Object.keys(turn.segments).length > 0;
            const segments = hasSegments ? Object.entries(turn.segments) : [];
            const numSegments = segments.length || 1;

            // If no segments, render as single block
            if (!hasSegments) {
              const leftPercent = (turn.start_time / timelineData.maxTime) * 100;
              const widthPercent = (turnDuration / timelineData.maxTime) * 100;
              
              // Calculate opacity and glow based on substantive responses
              const responseCount = timelineData.substantiveResponseCounts[turn.turnNumber] || 0;
              const baseOpacity = 0.15; // Min opacity for 0 responses
              const maxOpacity = 1.0;   // Max opacity for 4+ responses
              const blockOpacity = responseCount === 0 
                ? baseOpacity 
                : Math.min(0.4 + (responseCount * 0.2), maxOpacity);
              const hasGlow = responseCount >= 2;
              const glowIntensity = Math.min(responseCount * 3, 12);

              return (
                <MuiTooltip
                  key={`turn-${turnIdx}`}
                  title={
                    <Box sx={{ maxWidth: 400 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {turn.speaker_name} • Turn {turn.turnNumber}
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ mb: 1, opacity: 0.8 }}>
                        {turnDuration.toFixed(1)}s • {formatTime(turn.start_time)} - {formatTime(turn.end_time)}
                      </Typography>
                      {turn.words && (
                        <>
                          <Typography variant="caption" display="block" sx={{ 
                            mb: 0.5,
                            fontWeight: 600,
                            color: 'rgba(255,255,255,0.9)'
                          }}>
                            Said:
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ 
                            lineHeight: 1.4,
                            whiteSpace: 'normal',
                          }}>
                            "{turn.words}"
                          </Typography>
                        </>
                      )}
                    </Box>
                  }
                  arrow
                  placement="right"
                  PopperProps={{
                    sx: {
                      '& .MuiTooltip-tooltip': {
                        marginLeft: '8px !important',
                      }
                    }
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                      top: speakerIndex * rowHeight + 5,
                      height: rowHeight - 10,
                      backgroundColor: color,
                      opacity: hoveredTurn === `${turnIdx}` ? 1 : blockOpacity,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'opacity 0.2s, transform 0.2s, box-shadow 0.2s',
                      boxShadow: hasGlow ? `0 0 ${glowIntensity}px rgba(255, 220, 150, 0.6)` : 'none',
                      zIndex: 3,
                      '&:hover': {
                        opacity: 1,
                        transform: 'scaleY(1.1)',
                        zIndex: 10,
                      },
                    }}
                    onMouseEnter={() => {
                      setHoveredTurn(`${turnIdx}`);
                      setHoveredSegment(`${turnIdx}`);
                    }}
                    onMouseLeave={() => {
                      setHoveredTurn(null);
                      setHoveredSegment(null);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSegmentClick) {
                        onSegmentClick({
                          turnNumber: turn.turnNumber,
                          speaker: turn.speaker_name,
                          text: turn.words,
                          targetTurnNumber: null,
                          targetSpeaker: null,
                          targetText: null,
                          linkedWords: null,
                          isResponse: false,
                        });
                      }
                    }}
                  />
                </MuiTooltip>
              );
            }

            // Render segmented blocks
            const segmentDuration = turnDuration / numSegments;

            return segments.map(([segmentId, segment], segIdx) => {
              const segmentStartTime = turn.start_time + (segIdx * segmentDuration);
              const segmentEndTime = segmentStartTime + segmentDuration;
              
              const leftPercent = (segmentStartTime / timelineData.maxTime) * 100;
              const widthPercent = (segmentDuration / timelineData.maxTime) * 100;
              
              const isResponsive = segment.majority_label && segment.majority_label.startsWith('responsive');
              const isSubstantive = segment.majority_label === 'responsive_substantive';
              const isMechanical = segment.majority_label === 'responsive_mechanical';
              
              // Calculate opacity and glow based on substantive responses
              const responseCount = timelineData.substantiveResponseCounts[turn.turnNumber] || 0;
              const baseOpacity = 0.15; // Min opacity for 0 responses
              const maxOpacity = 1.0;   // Max opacity for 4+ responses
              const blockOpacity = responseCount === 0 
                ? baseOpacity 
                : Math.min(0.4 + (responseCount * 0.2), maxOpacity);
              const hasGlow = responseCount >= 2;
              const glowIntensity = Math.min(responseCount * 3, 12);
              
              // Check if this segment is connected to the hovered segment
              const segmentKey = `${turnIdx}-${segIdx}`;
              const segmentKeyByTurnNumber = `${turn.turnNumber}-${segIdx}`;
              const isCurrentlyHovered = hoveredSegment === segmentKey || hoveredSegmentKey === segmentKeyByTurnNumber;
              const isConnected = hoveredSegment && timelineData.edges.some(edge => 
                (hoveredSegment === `${edge.sourceTurnIdx}-${edge.sourceSegIdx}` && turnIdx === edge.targetTurnIdx) ||
                (hoveredSegment === `${edge.targetTurnIdx}` && segmentKey === `${edge.sourceTurnIdx}-${edge.sourceSegIdx}`)
              );
              
              // Check if this segment is part of the hovered or selected thread
              const segmentThreadEdge = timelineData.edges.find(edge => 
                segmentKey === `${edge.sourceTurnNumber}-${edge.sourceSegIdx}` ||
                turn.turnNumber === edge.targetTurnNumber
              );
              const isPartOfThread = segmentThreadEdge && (
                (hoveredThread !== null && segmentThreadEdge.threadId === hoveredThread) ||
                (selectedThread !== null && segmentThreadEdge.threadId === selectedThread)
              );

              // Get the full turn text and speaker for the target turn if this is a response
              let targetTurnFullText = null;
              let targetTurnSpeaker = null;
              if (isResponsive && segment.link_turn_id) {
                const targetTurn = timelineData.turns.find(t => t.turnNumber === segment.link_turn_id);
                if (targetTurn) {
                  targetTurnFullText = targetTurn.words;
                  targetTurnSpeaker = targetTurn.speaker_name;
                }
              }

              return (
                <MuiTooltip
                  key={`turn-${turnIdx}-seg-${segIdx}`}
                  title={
                    <Box sx={{ maxWidth: 400 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {turn.speaker_name} • Turn {turn.turnNumber}
                      </Typography>
                      
                      {isResponsive && (
                        <Typography variant="caption" display="block" sx={{ 
                          color: isSubstantive ? '#90be6d' : '#f9c74f',
                          fontWeight: 600,
                          mb: 0.5
                        }}>
                          {isSubstantive ? '🟢 Substantive' : '🟡 Mechanical'} response → Turn {segment.link_turn_id}
                        </Typography>
                      )}
                      
                      <Typography variant="caption" display="block" sx={{ 
                        mt: 1,
                        mb: 0.5,
                        fontWeight: 600,
                        color: 'rgba(255,255,255,0.9)'
                      }}>
                        Said:
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ 
                        lineHeight: 1.4,
                        whiteSpace: 'normal',
                      }}>
                        "{segment.segment_words}"
                      </Typography>
                      
                      {segment.linked_words && targetTurnFullText && (
                        <>
                          <Typography variant="caption" display="block" sx={{ 
                            mt: 1,
                            mb: 0.5,
                            fontWeight: 600,
                            color: 'rgba(255,255,255,0.9)'
                          }}>
                            Responding to {targetTurnSpeaker} (Turn {segment.link_turn_id}):
                          </Typography>
                          <Typography variant="caption" component="div" sx={{ 
                            fontStyle: 'italic',
                            opacity: 0.85,
                            lineHeight: 1.4,
                            whiteSpace: 'normal',
                          }}>
                            "{(() => {
                              const fullText = targetTurnFullText;
                              const linkedWords = segment.linked_words;
                              const index = fullText.toLowerCase().indexOf(linkedWords.toLowerCase());
                              
                              if (index === -1) {
                                // If exact match not found, just show the linked words
                                return <span style={{ fontWeight: 700, backgroundColor: 'rgba(67, 170, 139, 0.3)' }}>{linkedWords}</span>;
                              }
                              
                              // Show context: 80 chars before and after
                              const contextLength = 80;
                              const startIndex = Math.max(0, index - contextLength);
                              const endIndex = Math.min(fullText.length, index + linkedWords.length + contextLength);
                              
                              const beforeContext = fullText.substring(startIndex, index);
                              const match = fullText.substring(index, index + linkedWords.length);
                              const afterContext = fullText.substring(index + linkedWords.length, endIndex);
                              
                              return (
                                <>
                                  {startIndex > 0 && '...'}
                                  {beforeContext}
                                  <span style={{ fontWeight: 700, backgroundColor: 'rgba(67, 170, 139, 0.3)', padding: '2px 4px', borderRadius: '2px' }}>
                                    {match}
                                  </span>
                                  {afterContext}
                                  {endIndex < fullText.length && '...'}
                                </>
                              );
                            })()}"
                          </Typography>
                          <Typography variant="caption" display="block" sx={{ 
                            mt: 0.5,
                            fontSize: '0.65rem',
                            opacity: 0.6,
                          }}>
                            💡 Click to jump to this turn in transcript
                          </Typography>
                        </>
                      )}
                    </Box>
                  }
                  arrow
                  placement="right"
                  PopperProps={{
                    sx: {
                      '& .MuiTooltip-tooltip': {
                        marginLeft: '8px !important',
                      }
                    }
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                      top: speakerIndex * rowHeight + 5,
                      height: rowHeight - 10,
                      backgroundColor: color,
                      opacity: (isCurrentlyHovered || isConnected || isPartOfThread) ? 1 : blockOpacity,
                      borderRadius: '2px',
                      cursor: 'pointer',
                      transition: 'opacity 0.2s, transform 0.2s, box-shadow 0.2s',
                      boxShadow: hasGlow ? `0 0 ${glowIntensity}px rgba(255, 220, 150, 0.6)` : 
                                 isPartOfThread ? `0 0 8px ${segmentThreadEdge?.threadColor}` : 'none',
                      zIndex: (isCurrentlyHovered || isConnected || isPartOfThread) ? 10 : 3,
                      transform: (isCurrentlyHovered || isConnected || isPartOfThread) ? 'scaleY(1.15)' : 'none',
                      '&:hover': {
                        opacity: 1,
                        transform: 'scaleY(1.15)',
                        zIndex: 10,
                      },
                    }}
                    onMouseEnter={() => {
                      setHoveredTurn(`${turnIdx}-${segIdx}`);
                      setHoveredSegment(`${turnIdx}-${segIdx}`);
                    }}
                    onMouseLeave={() => {
                      setHoveredTurn(null);
                      setHoveredSegment(null);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSegmentClick) {
                        onSegmentClick({
                          turnNumber: turn.turnNumber,
                          speaker: turn.speaker_name,
                          text: segment.segment_words,
                          targetTurnNumber: segment.link_turn_id || null,
                          targetSpeaker: targetTurnSpeaker,
                          targetText: targetTurnFullText,
                          linkedWords: segment.linked_words,
                          isResponse: isResponsive,
                          responseType: isSubstantive ? 'substantive' : isMechanical ? 'mechanical' : null,
                        });
                      }
                    }}
                  />
                </MuiTooltip>
              );
            });
          })}
        </Box>

        {/* Time axis */}
        <Box
          sx={{
            position: 'absolute',
            left: marginLeft,
            right: marginRight,
            top: 0,
            height: 20,
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: '#666',
          }}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
            <Typography key={fraction} variant="caption">
              {formatTime(timelineData.maxTime * fraction)}
            </Typography>
          ))}
        </Box>
        </Box>
        )}
      </Box>
    </Paper>
  );
}

// Thread Depth View Component
function ThreadDepthView({ streamGraphData, timelineWidth, timelineWidthRef, marginLeft, marginRight, height, formatTime, onSegmentClick, timelineData, hoveredThread, selectedThread, setSelectedThread, selectedTime }) {
  const streamHeight = height - 60; // Account for margins/padding
  
  // Handle click on stream graph to scroll to that time in transcript and select thread
  const handleStreamClick = (e, clickedThreadId = null) => {
    if (!onSegmentClick || !timelineData) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left - marginLeft;
    const relativeX = clickX / timelineWidthRef.current;
    const clickedTime = relativeX * streamGraphData.maxTime;
    
    // Find the turn closest to this time
    const closestTurn = timelineData.turns.reduce((closest, turn) => {
      const turnMidTime = (turn.start_time + turn.end_time) / 2;
      const closestMidTime = (closest.start_time + closest.end_time) / 2;
      return Math.abs(turnMidTime - clickedTime) < Math.abs(closestMidTime - clickedTime) ? turn : closest;
    });
    
    // Handle thread selection
    if (clickedThreadId !== null && clickedThreadId !== 'unthreaded') {
      // Select the thread
      setSelectedThread(clickedThreadId);
      
      // Find the thread and scroll to its first turn
      const thread = timelineData.threads.find(t => t.id === clickedThreadId);
      if (thread) {
        const turnNumbers = Array.from(thread.turns);
        const threadSegments = Array.from(thread.segments);
        
        if (turnNumbers.length > 0) {
          const firstTurn = timelineData.turns.find(t => turnNumbers.includes(t.turnNumber));
          if (firstTurn) {
            onSegmentClick({
              turnNumber: firstTurn.turnNumber,
              speaker: firstTurn.speaker_name,
              text: firstTurn.words,
              targetTurnNumber: null,
              targetSpeaker: null,
              targetText: null,
              linkedWords: null,
              isResponse: false,
              threadTurns: turnNumbers,
              threadSegments: threadSegments,
              threadColor: thread.color,
            });
            return;
          }
        }
      }
    } else {
      // Clicked on whitespace or unthreaded area - deselect thread
      setSelectedThread(null);
    }
    
    // Scroll to the clicked time
    if (closestTurn) {
      onSegmentClick({
        turnNumber: closestTurn.turnNumber,
        speaker: closestTurn.speaker_name,
        text: closestTurn.words,
        targetTurnNumber: null,
        targetSpeaker: null,
        targetText: null,
        linkedWords: null,
        isResponse: false,
      });
    }
  };

  // Check if we have data
  if (!streamGraphData || !streamGraphData.layers || streamGraphData.layers.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No thread depth data available for this conversation.
        </Typography>
      </Box>
    );
  }

  // Create centered stream graph paths
  const createStreamPath = (points, layerIds, currentLayerIndex, maxTime) => {
    if (points.length === 0) return '';

    const width = timelineWidthRef.current;
    const centerY = streamHeight / 2;
    
    // Find max total size across all points for scaling
    const maxTotalSize = Math.max(...points.map(p => p.totalWords));
    
    // Calculate path points with centered layout
    const pathPoints = points.map((point) => {
      const x = (point.time / maxTime) * width;
      
      // Get offset and size for this layer
      const offset = point.layerOffsets[currentLayerIndex] || 0;
      const size = point.layerSizes[currentLayerIndex] || 0;
      
      // Scale to fit in view (use percentage of max)
      const scale = maxTotalSize > 0 ? streamHeight / maxTotalSize : 1;
      
      // Calculate Y positions centered around middle
      const bottomY = centerY + (offset * scale);
      const topY = centerY + ((offset + size) * scale);
      
      return { x, bottomY, topY };
    });

    // Ensure we have start and end points
    if (pathPoints.length > 0) {
      if (pathPoints[0].x > 0) {
        pathPoints.unshift({ x: 0, bottomY: centerY, topY: centerY });
      }
      if (pathPoints[pathPoints.length - 1].x < width) {
        pathPoints.push({ 
          x: width, 
          bottomY: pathPoints[pathPoints.length - 1].bottomY, 
          topY: pathPoints[pathPoints.length - 1].topY 
        });
      }
    }

    // Create smooth area path using cubic bezier curves (top line + bottom line in reverse)
    let topPath = `M ${pathPoints[0].x} ${pathPoints[0].topY}`;
    
    for (let i = 1; i < pathPoints.length; i++) {
      const curr = pathPoints[i];
      const prev = pathPoints[i - 1];
      
      // Use cubic bezier with control points for smoother curves
      // Control points are 1/3 of the way between points
      const cp1x = prev.x + (curr.x - prev.x) / 3;
      const cp1y = prev.topY;
      const cp2x = prev.x + 2 * (curr.x - prev.x) / 3;
      const cp2y = curr.topY;
      
      topPath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.topY}`;
    }

    let bottomPath = '';
    for (let i = pathPoints.length - 1; i >= 0; i--) {
      const curr = pathPoints[i];
      if (i === pathPoints.length - 1) {
        bottomPath += ` L ${curr.x} ${curr.bottomY}`;
      } else {
        const next = pathPoints[i + 1];
        
        // Cubic bezier for bottom path too
        const cp1x = next.x - (next.x - curr.x) / 3;
        const cp1y = next.bottomY;
        const cp2x = next.x - 2 * (next.x - curr.x) / 3;
        const cp2y = curr.bottomY;
        
        bottomPath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.bottomY}`;
      }
    }

    return topPath + bottomPath + ' Z';
  };

  return (
    <Box 
      sx={{ position: 'relative', height: height, width: '100%' }}
    >
      {/* Y-axis label */}
      <Box sx={{ position: 'absolute', left: 0, top: height / 2, width: marginLeft - 10 }}>
        <Typography 
          variant="caption" 
          sx={{ 
            fontSize: '0.75rem', 
            fontWeight: 500,
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
            whiteSpace: 'nowrap',
            display: 'block',
            textAlign: 'center'
          }}
        >
          Thread Flow
        </Typography>
      </Box>

      {/* Stream graph canvas */}
      <Box
        onClick={(e) => handleStreamClick(e, null)}
        sx={{
          position: 'absolute',
          left: marginLeft,
          right: marginRight,
          top: 30,
          height: streamHeight,
          backgroundColor: '#fdfcfa',
          borderLeft: '2px solid #ddd',
          borderBottom: '2px solid #ddd',
          overflow: 'hidden',
          cursor: 'pointer',
        }}
      >
        <svg
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
          }}
        >
          {/* Render layers as centered stream */}
          {streamGraphData.layers.map((layer, idx) => {
            const path = createStreamPath(
              streamGraphData.points,
              streamGraphData.layers.map(l => l.id),
              idx,
              streamGraphData.maxTime
            );
            
            // Check if this layer should be highlighted
            const isThreadHighlighted = (hoveredThread !== null && layer.id === hoveredThread) ||
                                        (selectedThread !== null && layer.id === selectedThread);

            return (
              <path
                key={layer.id}
                d={path}
                fill={layer.color}
                fillOpacity={layer.isUnthreaded ? 0.5 : (isThreadHighlighted ? 0.95 : 0.7)}
                stroke="none"
                style={{
                  transition: 'fill-opacity 0.2s',
                  filter: isThreadHighlighted ? 'drop-shadow(0 0 8px currentColor)' : 'none',
                  cursor: layer.isUnthreaded ? 'default' : 'pointer',
                  pointerEvents: 'all',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStreamClick(e, layer.id);
                }}
              />
            );
          })}
          
          {/* Center line */}
          <line
            x1="0"
            y1={streamHeight / 2}
            x2="100%"
            y2={streamHeight / 2}
            stroke="#999"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.3"
          />
          
          {/* Time marker line for selected segment */}
          {selectedTime !== null && streamGraphData.maxTime > 0 && (
            <line
              x1={(selectedTime / streamGraphData.maxTime) * timelineWidthRef.current}
              y1="0"
              x2={(selectedTime / streamGraphData.maxTime) * timelineWidthRef.current}
              y2={streamHeight}
              stroke="#d4704c"
              strokeWidth="2"
              strokeDasharray="5 5"
              opacity="0.8"
              style={{
                pointerEvents: 'none',
              }}
            />
          )}
        </svg>
      </Box>

      {/* Time axis */}
      <Box
        sx={{
          position: 'absolute',
          left: marginLeft,
          right: marginRight,
          top: 0,
          height: 20,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: '#666',
        }}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
          <Typography key={fraction} variant="caption">
            {formatTime(streamGraphData.maxTime * fraction)}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

// Responsivity View Component
function ResponsivityView({ responsivityData, timelineWidthRef, marginLeft, marginRight, height, formatTime, onSegmentClick, timelineData, selectedTime }) {
  const vizHeight = height - 40; // Reduced padding since legend is removed

  if (!responsivityData || !responsivityData.points || responsivityData.points.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No responsivity data available for this conversation.
        </Typography>
      </Box>
    );
  }
  
  // Handle click on responsivity graph to scroll to that time in transcript
  const handleResponsivityClick = (e) => {
    if (!onSegmentClick || !timelineData) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const relativeX = clickX / rect.width;
    const clickedTime = relativeX * responsivityData.maxTime;
    
    // Find the turn closest to this time
    const closestTurn = timelineData.turns.reduce((closest, turn) => {
      const turnMidTime = (turn.start_time + turn.end_time) / 2;
      const closestMidTime = (closest.start_time + closest.end_time) / 2;
      return Math.abs(turnMidTime - clickedTime) < Math.abs(closestMidTime - clickedTime) ? turn : closest;
    });
    
    if (closestTurn) {
      onSegmentClick({
        turnNumber: closestTurn.turnNumber,
        speaker: closestTurn.speaker_name,
        text: closestTurn.words,
        targetTurnNumber: null,
        targetSpeaker: null,
        targetText: null,
        linkedWords: null,
        isResponse: false,
      });
    }
  };

  // Create area path for responsivity using cubic bezier for smoothness
  const createResponsivityPath = () => {
    const points = responsivityData.points;
    if (points.length === 0) return '';

    const width = 1000; // Use fixed coordinate system
    const chartHeight = vizHeight - 45; // Account for labels and time axis
    
    const pathPoints = points.map((point) => {
      const x = (point.time / responsivityData.maxTime) * width;
      const value = point.responsivityRate;
      const y = chartHeight * (1 - value / responsivityData.maxRate);
      return { x, y };
    });

    // Create smooth area with cubic bezier
    let path = `M 0,${chartHeight}`;
    path += ` L ${pathPoints[0].x},${pathPoints[0].y}`;
    
    for (let i = 1; i < pathPoints.length; i++) {
      const curr = pathPoints[i];
      const prev = pathPoints[i - 1];
      
      // Cubic bezier control points for smooth curve
      const cp1x = prev.x + (curr.x - prev.x) / 3;
      const cp1y = prev.y;
      const cp2x = prev.x + 2 * (curr.x - prev.x) / 3;
      const cp2y = curr.y;
      
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
    }
    
    path += ` L ${width},${chartHeight}`;
    path += ` Z`;
    
    return path;
  };

  // Create line path for network density using cubic bezier for smoothness
  const createDensityPath = () => {
    const points = responsivityData.points;
    if (points.length === 0) return '';

    const width = 1000; // Use fixed coordinate system
    const chartHeight = vizHeight - 45; // Match responsivity path height
    
    const pathPoints = points.map((point) => {
      const x = (point.time / responsivityData.maxTime) * width;
      const value = point.networkDensity;
      const y = chartHeight * (1 - value / responsivityData.maxDensity);
      return { x, y };
    });

    let path = `M ${pathPoints[0].x},${pathPoints[0].y}`;
    
    for (let i = 1; i < pathPoints.length; i++) {
      const curr = pathPoints[i];
      const prev = pathPoints[i - 1];
      
      // Cubic bezier control points for smooth curve
      const cp1x = prev.x + (curr.x - prev.x) / 3;
      const cp1y = prev.y;
      const cp2x = prev.x + 2 * (curr.x - prev.x) / 3;
      const cp2y = curr.y;
      
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
    }
    
    return path;
  };

  return (
    <Box sx={{ position: 'relative', height, width: '100%' }}>
      {/* Canvas */}
      <Box
        onClick={handleResponsivityClick}
        sx={{
          position: 'absolute',
          left: marginLeft,
          right: marginRight,
          top: 45,
          height: vizHeight - 45,
          backgroundColor: '#fdfcfa',
          borderLeft: '2px solid #ddd',
          borderBottom: '2px solid #ddd',
          overflow: 'hidden',
          cursor: 'pointer',
        }}
      >
        <svg
          viewBox={`0 0 1000 ${vizHeight - 45}`}
          preserveAspectRatio="none"
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
          }}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
            const y = fraction * (vizHeight - 45);
            return (
              <line
                key={fraction}
                x1="0"
                y1={y}
                x2="1000"
                y2={y}
                stroke="#e0e0e0"
                strokeWidth="1"
                strokeDasharray={fraction === 0 || fraction === 1 ? "none" : "4 4"}
              />
            );
          })}

          {/* Responsivity area */}
          <path
            d={createResponsivityPath()}
            fill="#f6a055"
            fillOpacity="0.3"
            stroke="#f6a055"
            strokeWidth="2"
          />

          {/* Network density line */}
          <path
            d={createDensityPath()}
            fill="none"
            stroke="#4d908e"
            strokeWidth="3"
          />
          
          {/* Time marker line for selected segment */}
          {selectedTime !== null && responsivityData.maxTime > 0 && (
            <line
              x1={(selectedTime / responsivityData.maxTime) * 1000}
              y1="0"
              x2={(selectedTime / responsivityData.maxTime) * 1000}
              y2={vizHeight - 45}
              stroke="#d4704c"
              strokeWidth="2"
              strokeDasharray="5 5"
              opacity="0.8"
              style={{
                pointerEvents: 'none',
              }}
            />
          )}
        </svg>
      </Box>

      {/* Y-axis labels - Single axis for both metrics (0-1.0 scale) */}
      <Box sx={{ position: 'absolute', left: 5, top: 45, width: marginLeft - 15, height: vizHeight - 45 }}>
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const y = fraction * (vizHeight - 45);
          const value = ((1 - fraction) * responsivityData.maxRate).toFixed(2);
          return (
            <Typography
              key={`axis-${fraction}`}
              sx={{
                position: 'absolute',
                top: y,
                right: 5,
                transform: 'translateY(-50%)',
                fontSize: '0.7rem',
                color: '#666',
                fontWeight: 500,
              }}
            >
              {value}
            </Typography>
          );
        })}
      </Box>

      {/* Legend with color indicators */}
      <Box sx={{ position: 'absolute', left: marginLeft + 10, top: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 3, backgroundColor: '#f6a055', opacity: 0.7 }} />
          <Typography 
            variant="caption" 
            sx={{ 
              fontSize: '0.7rem', 
              fontWeight: 600,
              color: '#f6a055',
            }}
          >
            Responsivity Rate
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 16, height: 3, backgroundColor: '#4d908e' }} />
          <Typography 
            variant="caption" 
            sx={{ 
              fontSize: '0.7rem', 
              fontWeight: 600,
              color: '#4d908e',
            }}
          >
            Network Density
          </Typography>
        </Box>
      </Box>

      {/* Time axis */}
      <Box
        sx={{
          position: 'absolute',
          left: marginLeft,
          right: marginRight,
          top: 20,
          height: 20,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: '#666',
        }}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
          <Typography key={fraction} variant="caption">
            {formatTime(responsivityData.maxTime * fraction)}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

export default ConversationTimeline;

