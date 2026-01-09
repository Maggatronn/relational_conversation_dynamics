// Utility functions for table visualization

/**
 * Get color based on percentile rank and whether higher is better
 * @param {number} value - The value to color
 * @param {number} min - Minimum value in the dataset
 * @param {number} max - Maximum value in the dataset
 * @param {boolean} higherIsBetter - True if higher values are better, false if lower is better
 * @returns {string} - RGB color string
 */
export function getPercentileColor(value, min, max, higherIsBetter = true) {
  if (value === undefined || value === null || min === max) {
    return 'rgba(200, 200, 200, 0.15)'; // Gray for missing/uniform data
  }

  // Calculate percentile (0-1)
  const percentile = (value - min) / (max - min);
  
  // Invert if lower is better
  const adjustedPercentile = higherIsBetter ? percentile : (1 - percentile);

  // Color scale: Red (0) → Yellow (0.5) → Green (1)
  let r, g, b;
  
  if (adjustedPercentile < 0.5) {
    // Red to Yellow
    const t = adjustedPercentile * 2;
    r = 255;
    g = Math.round(150 + t * 105); // 150 to 255
    b = 100;
  } else {
    // Yellow to Green
    const t = (adjustedPercentile - 0.5) * 2;
    r = Math.round(255 - t * 135); // 255 to 120
    g = 220;
    b = Math.round(100 + t * 50); // 100 to 150
  }

  // Use transparency for background
  return `rgba(${r}, ${g}, ${b}, 0.25)`;
}

/**
 * Column configuration for the conversation table
 * Defines which columns exist, their display names, and visualization properties
 */
export const columnConfig = [
  { key: 'id', label: 'ID', sortable: true, type: 'text', defaultVisible: true, resizable: false },
  { key: 'group', label: 'Type', sortable: true, type: 'chip', defaultVisible: true },
  { key: 'facilitator', label: 'Facilitator', sortable: true, type: 'text', defaultVisible: true },
  { key: 'cluster', label: 'Cluster', sortable: true, type: 'chip', defaultVisible: true },
  { key: 'turnCount', label: 'Turns', sortable: true, type: 'number', defaultVisible: true, higherIsBetter: true },
  { key: 'speakerCount', label: 'Speakers', sortable: true, type: 'number', defaultVisible: true, higherIsBetter: true },
  { key: 'totalSpeakingTime', label: 'Total Time (s)', sortable: true, type: 'number', defaultVisible: true, higherIsBetter: null, format: (val) => Math.round(val) },
  { key: 'facilitatorSpeakingPercentage', label: 'Fac. Speaking %', sortable: true, type: 'number', defaultVisible: true, higherIsBetter: false, format: (val) => val.toFixed(1) + '%' },
  { key: 'facilitatorTurnsPercentage', label: 'Fac. Turns %', sortable: true, type: 'number', defaultVisible: true, higherIsBetter: false, format: (val) => val.toFixed(1) + '%' },
  { key: 'speakingTimeGini', label: 'Speaking Gini', sortable: true, type: 'number', defaultVisible: true, higherIsBetter: false, format: (val) => val.toFixed(3) },
  { key: 'turnDistributionGini', label: 'Turn Dist. Gini', sortable: true, type: 'number', defaultVisible: true, higherIsBetter: false, format: (val) => val.toFixed(3) },
  { key: 'turnSequenceEntropy', label: 'Turn Entropy', sortable: true, type: 'number', defaultVisible: true, higherIsBetter: true, format: (val) => val.toFixed(3) },
  { key: 'substantiveResponsivityEntropy', label: 'Resp. Entropy', sortable: true, type: 'number', defaultVisible: true, higherIsBetter: true, format: (val) => val.toFixed(3) },
  { key: 'avgSubstRespondedRate', label: 'Avg Subst. Resp.', sortable: true, type: 'number', defaultVisible: true, higherIsBetter: true, format: (val) => val.toFixed(3) },
  { key: 'turnCountVariance', label: 'Turn Variance', sortable: true, type: 'number', defaultVisible: true, higherIsBetter: false, format: (val) => Math.round(val) },
  { key: 'threadCount', label: 'Threads', sortable: true, type: 'number', defaultVisible: true, higherIsBetter: true },
  { key: 'avgThreadLength', label: 'Avg Thread Length', sortable: true, type: 'number', defaultVisible: true, higherIsBetter: true, format: (val) => val.toFixed(2) },
];

/**
 * Calculate min/max values for each numeric column across all conversations
 */
export function calculateColumnStats(conversations) {
  const stats = {};
  
  columnConfig.forEach(col => {
    if (col.type === 'number') {
      const values = conversations
        .map(c => c[col.key])
        .filter(v => v !== undefined && v !== null && !isNaN(v));
      
      if (values.length > 0) {
        stats[col.key] = {
          min: Math.min(...values),
          max: Math.max(...values),
        };
      }
    }
  });
  
  return stats;
}

