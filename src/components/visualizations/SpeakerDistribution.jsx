import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#e8766d', '#f6a055', '#f9c74f', '#90be6d', '#43aa8b', '#4d908e', '#577590', '#f94144', '#f3722c', '#f8961e', '#f9844a', '#f9c74f'];

function SpeakerDistribution({ conversation }) {
  if (!conversation || !conversation.speakerTurnCounts) {
    return null;
  }

  // Prepare data for chart
  const turnData = Object.entries(conversation.speakerTurnCounts)
    .map(([speaker, count]) => ({
      speaker,
      turns: count,
      percentage: ((count / conversation.turnCount) * 100).toFixed(1),
    }))
    .sort((a, b) => b.turns - a.turns);

  return (
    <Paper elevation={1} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Turn Distribution
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Who spoke how many times
      </Typography>
      
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={turnData}
            dataKey="turns"
            nameKey="speaker"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ speaker, percentage }) => `${speaker}: ${percentage}%`}
            labelLine={false}
          >
            {turnData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => `${value} turns`}
            contentStyle={{ backgroundColor: '#fdfcfa', borderColor: '#d4704c' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Paper>
  );
}

export default SpeakerDistribution;

