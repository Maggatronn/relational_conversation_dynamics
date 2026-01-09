import React, { useMemo, useState } from 'react';
import { Paper, Typography, Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import ForceGraph2D from 'react-force-graph-2d';
import participantMetricsData from '../../participant-metrics.json';

const SPEAKER_COLORS = ['#e8766d', '#f6a055', '#f9c74f', '#90be6d', '#43aa8b', '#4d908e', '#577590', '#f94144', '#f3722c', '#f8961e', '#f9844a', '#f9c74f'];

function SpeakerNetwork({ turns, conversation, height = 600 }) {
  const [nodeMetric, setNodeMetric] = useState('speakingTime');
  const [edgeType, setEdgeType] = useState('sequence');

  // Auto-switch edge type based on node metric
  const handleNodeMetricChange = (newMetric) => {
    setNodeMetric(newMetric);
    // Auto-switch edge type
    if (newMetric === 'respondingRate' || newMetric === 'respondedRate') {
      setEdgeType('responsivity');
    } else if (newMetric === 'speakingTime' || newMetric === 'turnTaking') {
      setEdgeType('sequence');
    }
  };

  // Auto-switch node metric based on edge type (if needed)
  const handleEdgeTypeChange = (newEdgeType) => {
    setEdgeType(newEdgeType);
    // If switching to responsivity and current metric isn't response-related, switch it
    if (newEdgeType === 'responsivity' && nodeMetric !== 'respondingRate' && nodeMetric !== 'respondedRate') {
      setNodeMetric('respondedRate');
    }
    // If switching to sequence and current metric isn't distribution-related, switch it
    else if (newEdgeType === 'sequence' && nodeMetric !== 'speakingTime' && nodeMetric !== 'turnTaking') {
      setNodeMetric('speakingTime');
    }
  };
  const graphData = useMemo(() => {
    if (!turns || turns.length === 0 || !conversation) {
      return { nodes: [], links: [] };
    }

    // Get participant metrics for this conversation
    const participantMetrics = participantMetricsData[conversation.id] || {};

    // Create speaker color mapping
    const speakerColorMap = {};
    conversation.speakers.forEach((speaker, index) => {
      speakerColorMap[speaker] = SPEAKER_COLORS[index % SPEAKER_COLORS.length];
    });

    // Calculate total speaking time for percentage
    const totalSpeakingTime = Object.values(conversation.speakerSpeakingTime).reduce((sum, time) => sum + time, 0);

    // Filter speakers who spoke more than 3% of the conversation
    const significantSpeakers = conversation.speakers.filter(speaker => {
      const speakingTime = conversation.speakerSpeakingTime[speaker] || 0;
      const percentage = totalSpeakingTime > 0 ? (speakingTime / totalSpeakingTime) * 100 : 0;
      return percentage > 3;
    });

    // Calculate edges based on edge type
    let edgeMap = new Map();
    
    if (edgeType === 'sequence') {
      // Calculate turn sequences (edges) - only between significant speakers
      for (let i = 0; i < turns.length - 1; i++) {
        const currentSpeaker = turns[i].speaker_name;
        const nextSpeaker = turns[i + 1].speaker_name;
        
        if (currentSpeaker && nextSpeaker && currentSpeaker !== nextSpeaker &&
            significantSpeakers.includes(currentSpeaker) && significantSpeakers.includes(nextSpeaker)) {
          const key = `${currentSpeaker}->${nextSpeaker}`;
          edgeMap.set(key, (edgeMap.get(key) || 0) + 1);
        }
      }
    } else if (edgeType === 'responsivity') {
      // Calculate responsivity edges from segments
      turns.forEach(turn => {
        const sourceSpeaker = turn.speaker_name;
        if (!sourceSpeaker || !significantSpeakers.includes(sourceSpeaker)) return;
        
        // Check segments for links
        if (turn.segments && typeof turn.segments === 'object') {
          Object.values(turn.segments).forEach(segment => {
            if (segment.majority_label === 'responsive_substantive' && segment.link_turn_id) {
              // Find the target turn
              const targetTurn = turns.find(t => 
                t.turn_num === segment.link_turn_id || 
                t.turnNumber === segment.link_turn_id
              );
              if (targetTurn && targetTurn.speaker_name) {
                const targetSpeaker = targetTurn.speaker_name;
                if (significantSpeakers.includes(targetSpeaker)) {
                  const key = `${sourceSpeaker}->${targetSpeaker}`;
                  edgeMap.set(key, (edgeMap.get(key) || 0) + 1);
                }
              }
            }
          });
        }
      });
    }

    // Calculate network centrality if using responsivity edges
    const centralityMetrics = {};
    if (edgeType === 'responsivity') {
      // Initialize centrality for all significant speakers
      significantSpeakers.forEach(speaker => {
        centralityMetrics[speaker] = {
          inDegree: 0,  // How many responses this speaker receives
          outDegree: 0, // How many responses this speaker gives
        };
      });

      // Count edges
      edgeMap.forEach((value, key) => {
        const [source, target] = key.split('->');
        if (centralityMetrics[source]) centralityMetrics[source].outDegree += value;
        if (centralityMetrics[target]) centralityMetrics[target].inDegree += value;
      });
    }

    // Get node metric values for all significant speakers
    const metricValues = significantSpeakers.map(speaker => {
      const metrics = participantMetrics[speaker];
      if (!metrics) return 0;
      
      // Use centrality for responsivity metrics when edge type is responsivity
      if (edgeType === 'responsivity') {
        if (nodeMetric === 'respondingRate') {
          return centralityMetrics[speaker]?.outDegree || 0;
        } else if (nodeMetric === 'respondedRate') {
          return centralityMetrics[speaker]?.inDegree || 0;
        }
      }
      
      // Otherwise use participant metrics
      switch (nodeMetric) {
        case 'speakingTime':
          return metrics.speakingTimePercentage || 0;
        case 'turnTaking':
          return metrics.turnTakingPercentage || 0;
        case 'respondingRate':
          return metrics.rateOfRespondingToOthers || 0;
        case 'respondedRate':
          return metrics.rateOfBeingRespondedTo || 0;
        default:
          return 0;
      }
    });

    const maxMetricValue = Math.max(...metricValues, 0.01); // Avoid division by zero

    // Create nodes - only for significant speakers
    const nodes = significantSpeakers.map(speaker => {
      const metrics = participantMetrics[speaker] || {};
      const isFacilitator = speaker === conversation.facilitator;
      
      let metricValue = 0;
      let metricLabel = '';
      
      // Use centrality for responsivity metrics when edge type is responsivity
      if (edgeType === 'responsivity') {
        if (nodeMetric === 'respondingRate') {
          metricValue = centralityMetrics[speaker]?.outDegree || 0;
          metricLabel = `Out-degree: ${metricValue} responses given`;
        } else if (nodeMetric === 'respondedRate') {
          metricValue = centralityMetrics[speaker]?.inDegree || 0;
          metricLabel = `In-degree: ${metricValue} responses received`;
        } else {
          // For other metrics, use regular values
          switch (nodeMetric) {
            case 'speakingTime':
              metricValue = metrics.speakingTimePercentage || 0;
              metricLabel = `${metricValue.toFixed(1)}% speaking time`;
              break;
            case 'turnTaking':
              metricValue = metrics.turnTakingPercentage || 0;
              metricLabel = `${metricValue.toFixed(1)}% of turns`;
              break;
            default:
              metricValue = 0;
              metricLabel = 'N/A';
          }
        }
      } else {
        // Regular metrics for sequence edge type
        switch (nodeMetric) {
          case 'speakingTime':
            metricValue = metrics.speakingTimePercentage || 0;
            metricLabel = `${metricValue.toFixed(1)}% speaking time`;
            break;
          case 'turnTaking':
            metricValue = metrics.turnTakingPercentage || 0;
            metricLabel = `${metricValue.toFixed(1)}% of turns`;
            break;
          case 'respondingRate':
            metricValue = metrics.rateOfRespondingToOthers || 0;
            metricLabel = `${metricValue.toFixed(2)} responses/turn`;
            break;
          case 'respondedRate':
            metricValue = metrics.rateOfBeingRespondedTo || 0;
            metricLabel = `${metricValue.toFixed(2)} received/turn`;
            break;
          default:
            metricValue = metrics.speakingTimePercentage || 0;
            metricLabel = `${metricValue.toFixed(1)}% speaking time`;
        }
      }
      
      // Scale node size: 2px (min) to 15px (max)
      const normalizedValue = maxMetricValue > 0 ? metricValue / maxMetricValue : 0;
      const nodeSize = 2 + (normalizedValue * 13);
      
      return {
        id: speaker,
        name: speaker,
        val: nodeSize,
        color: speakerColorMap[speaker],
        isFacilitator,
        metricLabel,
      };
    });

    // Create links
    const links = Array.from(edgeMap.entries()).map(([key, value]) => {
      const [source, target] = key.split('->');
      return {
        source,
        target,
        value,
        width: Math.min(value / 2, 5), // Edge width based on frequency
      };
    });

    return { nodes, links };
  }, [turns, conversation, nodeMetric, edgeType]);

  if (!graphData.nodes.length) {
    return (
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary">
          No speaker network data available.
        </Typography>
      </Paper>
    );
  }

  // Get descriptive labels
  const nodeMetricLabels = {
    speakingTime: 'Speaking Time Distribution',
    turnTaking: 'Turn Taking Distribution',
    respondingRate: 'Rate of Responding to Others',
    respondedRate: 'Rate of Being Responded To',
  };

  const edgeTypeLabels = {
    sequence: 'Turn Sequences',
    responsivity: 'Substantive Responses',
  };

  return (
    <Paper elevation={1} sx={{ p: 3, height: `${height}px`, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Speaker Network
        </Typography>
        
        {/* Dropdowns */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Node Size</InputLabel>
            <Select
              value={nodeMetric}
              label="Node Size"
              onChange={(e) => handleNodeMetricChange(e.target.value)}
            >
              <MenuItem value="speakingTime">Speaking Time Distribution</MenuItem>
              <MenuItem value="turnTaking">Turn Taking Distribution</MenuItem>
              <MenuItem value="respondingRate">Rate of Responding to Others</MenuItem>
              <MenuItem value="respondedRate">Rate of Being Responded To</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Edge Type</InputLabel>
            <Select
              value={edgeType}
              label="Edge Type"
              onChange={(e) => handleEdgeTypeChange(e.target.value)}
            >
              <MenuItem value="sequence">Sequence</MenuItem>
              <MenuItem value="responsivity">Responsivity</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Node size = {nodeMetricLabels[nodeMetric]} 
          {edgeType === 'responsivity' && (nodeMetric === 'respondingRate' || nodeMetric === 'respondedRate') && 
            ' (using network centrality)'} (2-15px) • Edges = {edgeTypeLabels[edgeType]} • Facilitator has black border • Speakers &lt;3% excluded
        </Typography>
      </Box>

      <Box sx={{ 
        flex: 1, 
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
      }}>
        <ForceGraph2D
          graphData={graphData}
          width={600}
          height={height - 200}
          nodeLabel={node => `${node.name}: ${node.metricLabel}`}
          nodeVal="val"
          nodeColor="color"
          linkColor={() => '#e0d0c0'}
          linkWidth={link => link.width}
          linkDirectionalArrowLength={3.5}
          linkDirectionalArrowRelPos={1}
          linkCurvature={0.2}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const label = node.name;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Sans-Serif`;
            
            // Draw node circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
            ctx.fillStyle = node.color;
            ctx.fill();
            
            // Draw border for facilitator
            if (node.isFacilitator) {
              ctx.strokeStyle = '#000';
              ctx.lineWidth = 3 / globalScale;
              ctx.stroke();
            }
            
            // Draw label
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#333';
            ctx.fillText(label, node.x, node.y + node.val + fontSize);
          }}
          backgroundColor="#fdfcfa"
          d3VelocityDecay={0.3}
          d3AlphaDecay={0.02}
          d3Force={{
            charge: { strength: -1200, distanceMax: 800 },
            link: { distance: 200 },
            collision: { strength: 1, radius: node => node.val + 80 }
          }}
          cooldownTicks={100}
          onEngineStop={() => {}}
        />
      </Box>
    </Paper>
  );
}

export default SpeakerNetwork;

