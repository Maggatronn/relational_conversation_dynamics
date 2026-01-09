import { useState, useEffect, useMemo } from 'react';
import conversationData from '../combined.json';
import featuresData from '../features+umap+clusters.json';

export function useConversationData() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [availableSourceTypes, setAvailableSourceTypes] = useState([]);

  useEffect(() => {
    try {
      // Create a lookup map for features data by conv_id
      const featuresMap = {};
      featuresData.forEach((feature) => {
        featuresMap[feature.conv_id] = feature;
      });

      // Extract conversation IDs and get some metadata about each conversation
      const conversationList = Object.keys(conversationData).map((convId) => {
        const turns = conversationData[convId];
        const turnKeys = Object.keys(turns);
        const firstTurn = turns[turnKeys[0]];
        const lastTurn = turns[turnKeys[turnKeys.length - 1]];
        
        // Get unique speakers
        const speakers = new Set();
        turnKeys.forEach((turnKey) => {
          if (turns[turnKey].speaker_name) {
            speakers.add(turns[turnKey].speaker_name);
          }
        });

        // Get features data for this conversation
        const features = featuresMap[parseInt(convId)] || {};

        return {
          id: convId,
          turnCount: turnKeys.length,
          group: features.group || firstTurn?.group || 'Unknown',
          title: firstTurn?.title || '',
          facilitator: features.facilitator_name || firstTurn?.facilitator || '',
          startTime: firstTurn?.start_time || 0,
          endTime: lastTurn?.end_time || 0,
          duration: Math.round((lastTurn?.end_time || 0) - (firstTurn?.start_time || 0)),
          speakerCount: speakers.size,
          speakers: Array.from(speakers),
          // Add all features from features+umap+clusters.json
          cluster: features.cluster !== undefined ? features.cluster : null,
          collectionTitle: features.coll_title || '',
          sourceType: features.source_type || '',
          totalSpeakingTime: features.total_speaking_time_seconds,
          numTurnsFacilitator: features.num_turns_facilitator,
          facilitatorSpeakingPercentage: features.facilitator_speaking_percentage,
          facilitatorTurnsPercentage: features.facilitator_turns_percentage,
          speakingTimeGini: features.speaking_time_gini_coefficient,
          turnDistributionGini: features.turn_distribution_gini_coefficient,
          nonFacilitatorSpeakingGini: features.non_facilitator_speaking_gini_coefficient,
          nonFacilitatorTurnGini: features.non_facilitator_turn_gini_coefficient,
          turnSequenceEntropy: features.turn_sequence_entropy,
          substantiveResponsivityEntropy: features.substantive_responsivity_entropy,
          avgSubstRespondedRate: features.avg_subst_responded_rate,
          avgMechRespondedRate: features.avg_mech_responded_rate,
          turnCountVariance: features.turn_count_variance,
          d0: features.d0,
          d1: features.d1,
          threadCount: features.thread_count !== undefined ? features.thread_count : 0,
          avgThreadLength: features.avg_thread_length !== undefined ? features.avg_thread_length : 0,
        };
      });
      
      setConversations(conversationList);
      
      // Extract unique groups for filtering
      const groups = [...new Set(conversationList.map(c => c.group))].sort();
      setAvailableGroups(groups);
      
      // Extract unique source types for filtering
      const sourceTypes = [...new Set(conversationList.map(c => c.sourceType).filter(st => st))].sort();
      setAvailableSourceTypes(sourceTypes);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setLoading(false);
    }
  }, []);

  return {
    conversations,
    loading,
    availableGroups,
    availableSourceTypes,
  };
}

export function useConversationFilters(conversations, filterGroup, filterSourceType, orderBy, order) {
  return useMemo(() => {
    let filtered = conversations;
    
    // Apply group filter
    if (filterGroup !== 'all') {
      filtered = filtered.filter(c => c.group === filterGroup);
    }
    
    // Apply source type filter
    if (filterSourceType !== 'all') {
      filtered = filtered.filter(c => c.sourceType === filterSourceType);
    }
    
    // Apply sorting
    return [...filtered].sort((a, b) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];
      
      // Handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = -Infinity;
      if (bValue === null || bValue === undefined) bValue = -Infinity;
      
      // Convert to numbers for numeric fields
      const numericFields = [
        'id', 'turnCount', 'speakerCount', 'duration', 'cluster',
        'speakingTimeGini', 'turnSequenceEntropy', 'substantiveResponsivityEntropy',
        'facilitatorSpeakingPercentage', 'totalSpeakingTime', 'numTurnsFacilitator',
        'facilitatorTurnsPercentage', 'turnDistributionGini', 'nonFacilitatorSpeakingGini',
        'nonFacilitatorTurnGini', 'avgSubstRespondedRate', 'avgMechRespondedRate',
        'turnCountVariance', 'd0', 'd1', 'threadCount', 'avgThreadLength'
      ];
      
      if (numericFields.includes(orderBy)) {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }
      
      if (order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [conversations, filterGroup, filterSourceType, orderBy, order]);
}

