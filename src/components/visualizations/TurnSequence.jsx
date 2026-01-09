import React, { useMemo } from 'react';
import { Paper, Typography, Box, Chip } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ScatterChart, Scatter } from 'recharts';

const SPEAKER_COLORS = ['#d4704c', '#c9965c', '#a67c52', '#8b6f47', '#b88a5d', '#9d7a4a', '#c5a374', '#d9b68c'];

function TurnSequence({ turns, conversation }) {
  const chartData = useMemo(() => {
    if (!turns || turns.length === 0) return [];

    // Create speaker color mapping
    const speakerColorMap = {};
    conversation.speakers.forEach((speaker, index) => {
      speakerColorMap[speaker] = SPEAKER_COLORS[index % SPEAKER_COLORS.length];
    });

    return turns.map((turn, index) => ({
      turnNumber: turn.turnNumber,
      duration: (turn.end_time - turn.start_time).toFixed(2),
      speaker: turn.speaker_name,
      speakerColor: speakerColorMap[turn.speaker_name],
      timestamp: turn.start_time.toFixed(1),
      substantiveResponses: turn.subst_num_responses || 0,
      mechanicalResponses: turn.mech_num_responses || 0,
      totalResponses: (turn.subst_num_responses || 0) + (turn.mech_num_responses || 0),
    }));
  }, [turns, conversation]);

  if (!chartData.length) return null;

  return (
    <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
      {/* Turn Duration Over Time */}
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Turn Duration Over Time
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          How long each turn lasted throughout the conversation
        </Typography>
        
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0e0d5" />
            <XAxis 
              dataKey="turnNumber" 
              label={{ value: 'Turn Number', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              label={{ value: 'Duration (s)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fdfcfa', borderColor: '#d4704c' }}
              formatter={(value, name) => [
                name === 'duration' ? `${value}s` : value,
                name === 'duration' ? 'Duration' : name
              ]}
            />
            <Line 
              type="monotone" 
              dataKey="duration" 
              stroke="#d4704c" 
              strokeWidth={2}
              dot={{ fill: '#d4704c', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      {/* Response Patterns */}
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Response Patterns
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Which turns generated the most responses
        </Typography>
        
        <ResponsiveContainer width="100%" height={250}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0e0d5" />
            <XAxis 
              dataKey="turnNumber" 
              label={{ value: 'Turn Number', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              label={{ value: 'Total Responses', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#fdfcfa', borderColor: '#d4704c' }}
              formatter={(value, name, props) => {
                if (name === 'totalResponses') {
                  const subst = props.payload.substantiveResponses;
                  const mech = props.payload.mechanicalResponses;
                  return [
                    `${value} total (${subst} substantive, ${mech} mechanical)`,
                    'Responses'
                  ];
                }
                return [value, name];
              }}
            />
            <Legend />
            <Scatter 
              name="Total Responses" 
              data={chartData} 
              dataKey="totalResponses"
              fill="#c9965c"
              opacity={0.7}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
}

export default TurnSequence;

