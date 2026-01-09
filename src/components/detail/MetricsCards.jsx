import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import TimerIcon from '@mui/icons-material/Timer';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

function MetricCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <Paper
      elevation={1}
      sx={{
        p: 2.5,
        height: '100%',
        borderLeft: 3,
        borderColor: color || 'primary.main',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          {title}
        </Typography>
        {Icon && <Icon sx={{ color: color || 'primary.main', opacity: 0.7 }} />}
      </Box>
      
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
        {value}
      </Typography>
      
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
}

function MetricsCards({ conversation }) {
  if (!conversation) return null;

  const metrics = [
    {
      title: 'Speakers',
      value: conversation.speakerCount,
      subtitle: conversation.speakers?.slice(0, 3).join(', '),
      icon: PeopleIcon,
      color: '#c9965c',
    },
    {
      title: 'Duration',
      value: `${Math.floor(conversation.totalSpeakingTime / 60)}m`,
      subtitle: `${conversation.totalSpeakingTime}s total`,
      icon: TimerIcon,
      color: '#a67c52',
    },
    {
      title: 'Speaking Gini',
      value: conversation.speakingTimeGini !== undefined 
        ? conversation.speakingTimeGini.toFixed(3)
        : '—',
      subtitle: 'Distribution inequality',
      icon: EqualizerIcon,
      color: '#d4704c',
    },
    {
      title: 'Turn Entropy',
      value: conversation.turnSequenceEntropy !== undefined
        ? conversation.turnSequenceEntropy.toFixed(3)
        : '—',
      subtitle: 'Turn-taking diversity',
      icon: TrendingUpIcon,
      color: '#c9965c',
    },
  ];

  return (
    <Grid container spacing={2}>
      {metrics.map((metric, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <MetricCard {...metric} />
        </Grid>
      ))}
    </Grid>
  );
}

export default MetricsCards;

