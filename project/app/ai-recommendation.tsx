import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { enhancedAiService, EnhancedPrediction } from '@/utils/enhancedAiService';
import { FlowerBatch } from '@/types/database';
import { ArrowLeft, Clock, AlertTriangle, CheckCircle2, RefreshCw, ExternalLink, BookOpen } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function AIRecommendationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recommendation, setRecommendation] = useState<EnhancedPrediction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendation = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Reconstruct the batch object from URL parameters
      const batch: FlowerBatch = {
        id: params.id as string,
        user_id: params.user_id as string,
        flower_type: params.flower_type as string,
        variety: params.variety as string,
        quantity: parseInt(params.quantity as string),
        unit_of_measure: params.unit_of_measure as string,
        purchase_date: params.purchase_date as string,
        expected_shelf_life: parseInt(params.expected_shelf_life as string),
        shelf_life_unit: params.shelf_life_unit as string,
        supplier: params.supplier as string,
        initial_condition: params.initial_condition as 'Excellent' | 'Good' | 'Fair' | 'Poor',
        storage_environment: params.storage_environment as 'Refrigerated' | 'Room Temperature' | 'Other',
        water_type: params.water_type as string,
        humidity_level: params.humidity_level as string,
        floral_food_used: params.floral_food_used === 'true',
        vase_cleanliness: params.vase_cleanliness as 'Clean' | 'Rinsed' | 'Dirty',
        dynamic_spoilage_date: params.dynamic_spoilage_date as string,
        ai_reasoning: null,
        ai_recommendations: null,
        ai_last_updated: null,
        ai_detailed_prediction: null,
        created_at: params.created_at as string,
        updated_at: params.updated_at as string,
        visual_notes: params.visual_notes as string | null,
        ai_prediction: null,
        ai_confidence: null,
      };

      // Check if this is a new batch (no stored AI data) or if we're forcing refresh
      const { data: storedData, error: fetchError } = await supabase
        .from('flower_batches')
        .select('ai_prediction, ai_confidence, ai_reasoning, ai_recommendations, ai_last_updated, ai_detailed_prediction')
        .eq('id', batch.id)
        .single();

      // Check if this is a new batch (created within the last 5 minutes)
      const batchCreatedAt = new Date(batch.created_at);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const isNewBatch = batchCreatedAt > fiveMinutesAgo;

      console.log(`🔍 Batch Debug: created_at=${batch.created_at}, isNewBatch=${isNewBatch}, forceRefresh=${forceRefresh}`);

      // Always generate fresh predictions for new batches or when forcing refresh
      // Also generate fresh predictions if no stored AI data exists
      // Also generate fresh predictions if there's any issue with stored data
      if (!forceRefresh && !isNewBatch && !fetchError && storedData?.ai_prediction && storedData?.ai_last_updated) {
        // Check if the stored data is recent (within last hour)
        const lastUpdated = new Date(storedData.ai_last_updated);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        
        if (lastUpdated > oneHourAgo) {
          console.log('📋 Using stored prediction data');
          // Parse stored RAG context if available
          let ragContext, sources;
          if (storedData.ai_detailed_prediction) {
            try {
              const detailedData = JSON.parse(storedData.ai_detailed_prediction);
              ragContext = detailedData.ragContext;
              sources = detailedData.sources;
            } catch (e) {
              console.warn('Failed to parse stored RAG context:', e);
            }
          }
          // Use stored data regardless of RAG context
          setRecommendation({
            prediction: storedData.ai_prediction,
            confidence: storedData.ai_confidence || 0,
            reasoning: storedData.ai_reasoning || '',
            recommendations: storedData.ai_recommendations || [],
            sources: sources || [],
            ragContext: ragContext,
          });
          setLoading(false);
          return;
        }
      }

      // Generate fresh enhanced AI prediction with RAG
      console.log(`🚀 Generating fresh enhanced AI prediction... (new batch: ${isNewBatch}, force refresh: ${forceRefresh}, has stored data: ${!!storedData?.ai_prediction})`);
      const result = await enhancedAiService.getEnhancedSpoilagePrediction(batch);
      
      console.log(`✅ Enhanced prediction generated: ragContext=${!!result.ragContext}, sources=${result.sources?.length || 0}`);
      setRecommendation(result);

      // Store the new recommendation in the database
      const { error: updateError } = await supabase
        .from('flower_batches')
        .update({
          ai_prediction: result.prediction,
          ai_confidence: result.confidence || 0,
          ai_reasoning: result.reasoning || '',
          ai_recommendations: result.recommendations,
          ai_last_updated: new Date().toISOString(),
          // Store RAG context as JSON for future use
          ai_detailed_prediction: JSON.stringify({
            ragContext: result.ragContext,
            sources: result.sources,
            detailedPrediction: result.detailedPrediction
          })
        })
        .eq('id', batch.id);

      if (updateError) {
        console.error('Error storing AI recommendation:', updateError);
        // Don't throw the error, just log it and continue
      }
    } catch (err) {
      console.error('Error fetching AI recommendation:', err);
      setError('Failed to get AI recommendation. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecommendation();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRecommendation(true);
  };

  const handleSourcePress = (url: string) => {
    Linking.openURL(url);
  };

  const renderPrediction = () => {
    if (!recommendation) return null;

    // Ensure we have a valid number for prediction
    const prediction = typeof recommendation.prediction === 'number' ? recommendation.prediction : 0;
    
    const days = Math.floor(prediction);
    const hours = Math.floor((prediction - days) * 24);
    const minutes = Math.floor(((prediction - days) * 24 - hours) * 60);

    let status: 'critical' | 'warning' | 'good';
    let color: string;

    if (prediction <= 1) {
      status = 'critical';
      color = '#EF4444';
    } else if (prediction <= 3) {
      status = 'warning';
      color = '#F59E0B';
    } else {
      status = 'good';
      color = '#22C55E';
    }

    return (
      <View style={styles.predictionContainer}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Clock size={24} color={color} />
            <Text style={styles.cardTitle}>Predicted Lifespan</Text>
          </View>
          <Text style={[styles.predictionText, { color }]}>
            {days}d {hours}h {minutes}m
          </Text>
          <View style={[styles.confidenceBadge, { backgroundColor: `${color}20` }]}>
            <Text style={[styles.confidenceText, { color }]}>
              {Math.round(recommendation.confidence * 100)}% confidence
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <CheckCircle2 size={24} color="#22C55E" />
            <Text style={styles.cardTitle}>AI Analysis</Text>
          </View>
          <Text style={styles.reasoningText}>{recommendation.reasoning}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <AlertTriangle size={24} color="#22C55E" />
            <Text style={styles.cardTitle}>Recommendations</Text>
          </View>
          {recommendation.recommendations && recommendation.recommendations.length > 0 ? (
            recommendation.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <View style={[styles.recommendationBullet, { backgroundColor: '#22C55E' }]} />
                <Text style={styles.recommendationText}>{rec}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.recommendationText}>No specific recommendations available.</Text>
          )}
        </View>

        {/* RAG Context Section */}
        {recommendation.ragContext && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <BookOpen size={24} color="#6366F1" />
              <Text style={styles.cardTitle}>Expert Care Information</Text>
            </View>
            <View style={styles.ragContextContainer}>
              <Text style={styles.ragContextTitle}>
                {recommendation.ragContext.flowerType}
                {recommendation.ragContext.variety && ` (${recommendation.ragContext.variety})`}
              </Text>
              <Text style={styles.ragContextText}>
                <Text style={styles.ragContextLabel}>Care Requirements:</Text> {recommendation.ragContext.careRequirements}
              </Text>
              <Text style={styles.ragContextText}>
                <Text style={styles.ragContextLabel}>Optimal Conditions:</Text> {recommendation.ragContext.optimalConditions}
              </Text>
              <Text style={styles.ragContextText}>
                <Text style={styles.ragContextLabel}>Common Issues:</Text> {recommendation.ragContext.commonIssues}
              </Text>
              <Text style={styles.ragContextText}>
                <Text style={styles.ragContextLabel}>Vase Life Tips:</Text> {recommendation.ragContext.vaseLifeTips}
              </Text>
            </View>
          </View>
        )}

        {/* Sources Section */}
        {recommendation.sources && recommendation.sources.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <ExternalLink size={24} color="#8B5CF6" />
              <Text style={styles.cardTitle}>Sources</Text>
            </View>
            {recommendation.sources.map((source, index) => (
              <TouchableOpacity
                key={index}
                style={styles.sourceItem}
                onPress={() => handleSourcePress(source.url)}
              >
                <Text style={styles.sourceName}>{source.name}</Text>
                <ExternalLink size={16} color="#8B5CF6" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Getting AI recommendation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <AlertTriangle size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!recommendation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <AlertTriangle size={48} color="#EF4444" />
          <Text style={styles.errorText}>No recommendation available</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>AI Recommendation</Text>
          <Text style={styles.headerSubtitle}>
            Enhanced with expert flower care knowledge
          </Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={24} color="#22C55E" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {renderPrediction()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#22C55E',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  predictionContainer: {
    // Add appropriate styles for the prediction container
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
  },
  predictionText: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  confidenceBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '500',
  },
  reasoningText: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginRight: 12,
  },
  recommendationText: {
    fontSize: 16,
    color: '#4B5563',
    flex: 1,
    lineHeight: 24,
  },
  ragContextContainer: {
    marginTop: 8,
  },
  ragContextTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  ragContextText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 8,
  },
  ragContextLabel: {
    fontWeight: '600',
    color: '#374151',
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 8,
  },
  sourceName: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
}); 