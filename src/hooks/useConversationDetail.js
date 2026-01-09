import { useState, useEffect } from 'react';
import conversationData from '../combined.json';
import featuresData from '../features+umap+clusters.json';

export function useConversationDetail(conversationId) {
  const [conversation, setConversation] = useState(null);
  const [turns, setTurns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) return;

    try {
      const convData = conversationData[conversationId];
      
      if (!convData) {
        setLoading(false);
        return;
      }

      // Get features for this conversation
      const features = featuresData.find(f => f.conv_id === parseInt(conversationId)) || {};

      // Extract turns data
      const turnKeys = Object.keys(convData).sort((a, b) => parseInt(a) - parseInt(b));
      const turnsArray = turnKeys.map(key => ({
        turnNumber: parseInt(key),
        ...convData[key],
      }));

      // Get unique speakers
      const speakers = new Set();
      const speakerTurnCounts = {};
      const speakerSpeakingTime = {};

      turnsArray.forEach(turn => {
        if (turn.speaker_name) {
          speakers.add(turn.speaker_name);
          speakerTurnCounts[turn.speaker_name] = (speakerTurnCounts[turn.speaker_name] || 0) + 1;
          const duration = turn.end_time - turn.start_time;
          speakerSpeakingTime[turn.speaker_name] = (speakerSpeakingTime[turn.speaker_name] || 0) + duration;
        }
      });

      const firstTurn = turnsArray[0];
      const lastTurn = turnsArray[turnsArray.length - 1];

      setConversation({
        id: conversationId,
        group: features.group || firstTurn?.group || 'Unknown',
        title: firstTurn?.title || '',
        facilitator: features.facilitator_name || '',
        collectionTitle: features.coll_title || '',
        sourceType: features.source_type || '',
        
        // Basic metrics
        turnCount: turnsArray.length,
        speakerCount: speakers.size,
        duration: Math.round((lastTurn?.end_time || 0) - (firstTurn?.start_time || 0)),
        totalSpeakingTime: features.total_speaking_time_seconds,
        
        // Speakers
        speakers: Array.from(speakers),
        speakerTurnCounts,
        speakerSpeakingTime,
        
        // Features from features.json
        cluster: features.cluster !== undefined ? features.cluster : null,
        d0: features.d0,
        d1: features.d1,
        
        // Gini coefficients
        speakingTimeGini: features.speaking_time_gini_coefficient,
        turnDistributionGini: features.turn_distribution_gini_coefficient,
        
        // Entropy metrics
        turnSequenceEntropy: features.turn_sequence_entropy,
        substantiveResponsivityEntropy: features.substantive_responsivity_entropy,
        
        // Facilitator metrics
        facilitatorSpeakingPercentage: features.facilitator_speaking_percentage,
        facilitatorTurnsPercentage: features.facilitator_turns_percentage,
        numTurnsFacilitator: features.num_turns_facilitator,
        
        // Response metrics
        avgSubstRespondedRate: features.avg_subst_responded_rate,
        avgMechRespondedRate: features.avg_mech_responded_rate,
        
        // Variance
        turnCountVariance: features.turn_count_variance,
      });

      setTurns(turnsArray);
      setLoading(false);
    } catch (error) {
      console.error('Error loading conversation:', error);
      setLoading(false);
    }
  }, [conversationId]);

  return { conversation, turns, loading };
}

export function useRelatedConversations(conversation) {
  const [relatedConversations, setRelatedConversations] = useState([]);

  useEffect(() => {
    if (!conversation || conversation.cluster === null) {
      setRelatedConversations([]);
      return;
    }

    // Find conversations in the same cluster
    const related = featuresData
      .filter(f => 
        f.cluster === conversation.cluster && 
        f.conv_id !== parseInt(conversation.id)
      )
      .slice(0, 5) // Get top 5
      .map(f => ({
        id: f.conv_id,
        group: f.group,
        facilitator: f.facilitator_name,
        turnCount: f.num_turns_in_conversation,
        speakers: f.num_observed_speakers,
        collectionTitle: f.coll_title,
      }));

    setRelatedConversations(related);
  }, [conversation]);

  return relatedConversations;
}

