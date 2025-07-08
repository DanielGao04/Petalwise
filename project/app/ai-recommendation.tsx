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
import { ArrowLeft, Clock, AlertTriangle, CheckCircle2, RefreshCw, ExternalLink, BookOpen, Sparkles } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function AIRecommendationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recommendation, setRecommendation] = useState<EnhancedPrediction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usingStoredData, setUsingStoredData] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every 30 seconds for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // Update every 30 seconds for more responsive countdown

    return () => clearInterval(interval);
  }, []);

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
        ai_financial_recommendations: null,
      };

      // Check if this is a new batch (no stored AI data) or if we're forcing refresh
      const { data: storedData, error: fetchError } = await supabase
        .from('flower_batches')
        .select('ai_prediction, ai_confidence, ai_reasoning, ai_recommendations, ai_financial_recommendations, ai_last_updated, ai_detailed_prediction')
        .eq('id', batch.id)
        .single();

      console.log(`🔍 Batch Debug: created_at=${batch.created_at}, forceRefresh=${forceRefresh}`);
      console.log(`🔍 Stored Data Debug: hasStoredData=${!!storedData?.ai_prediction}, lastUpdated=${storedData?.ai_last_updated}, fetchError=${!!fetchError}`);

      // Use stored data if available and not forcing refresh
      // This ensures we always show the same recommendation unless user explicitly refreshes
      if (!forceRefresh && !fetchError && storedData?.ai_prediction && storedData?.ai_last_updated) {
        console.log('📋 Using stored prediction data (last updated:', storedData.ai_last_updated, ')');
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
          financialRecommendations: storedData.ai_financial_recommendations || [],
          sources: sources || [],
          ragContext: ragContext,
        });
        setUsingStoredData(true);
        setLoading(false);
        return;
      } else {
        console.log('📋 No stored data available or forcing refresh, generating fresh prediction');
      }

      // Generate fresh enhanced AI prediction with RAG
      console.log(`🚀 Generating fresh enhanced AI prediction... (force refresh: ${forceRefresh}, has stored data: ${!!storedData?.ai_prediction})`);
      const result = await enhancedAiService.getEnhancedSpoilagePrediction(batch);
      
      console.log(`✅ Enhanced prediction generated: ragContext=${!!result.ragContext}, sources=${result.sources?.length || 0}`);
      setRecommendation(result);
      setUsingStoredData(false);

      // Store the new recommendation in the database
      const { error: updateError } = await supabase
        .from('flower_batches')
        .update({
          ai_prediction: result.prediction,
          ai_confidence: result.confidence || 0,
          ai_reasoning: result.reasoning || '',
          ai_recommendations: result.recommendations,
          ai_financial_recommendations: result.financialRecommendations,
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
    setUsingStoredData(false);
    fetchRecommendation(true);
  };

  // Calculate real-time countdown (same as dashboard)
  const calculateTimeRemaining = (spoilageDate: string) => {
    const spoilage = new Date(spoilageDate);
    const now = currentTime;
    const diff = spoilage.getTime() - now.getTime();
    
    if (diff <= 0) {
      // Calculate how long ago it expired
      const expiredDiff = Math.abs(diff);
      const expiredDays = Math.floor(expiredDiff / (1000 * 60 * 60 * 24));
      const expiredHours = Math.floor((expiredDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const expiredMinutes = Math.floor((expiredDiff % (1000 * 60 * 60)) / (1000 * 60));
      return { days: expiredDays, hours: expiredHours, minutes: expiredMinutes, isExpired: true };
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { days, hours, minutes, isExpired: false };
  };

  const handleSourcePress = (url: string) => {
    Linking.openURL(url);
  };

  const getUrgencyColor = (urgency: 'low' | 'medium' | 'high' | 'critical') => {
    switch (urgency) {
      case 'low':
        return '#22C55E20';
      case 'medium':
        return '#F59E0B20';
      case 'high':
        return '#EF444420';
      case 'critical':
        return '#DC262620';
      default:
        return '#6B728020';
    }
  };

  const renderPrediction = () => {
    if (!recommendation) return null;

    // Ensure we have a valid number for prediction
    const prediction = typeof recommendation.prediction === 'number' ? recommendation.prediction : 0;
    
    const days = Math.floor(prediction);
    const hours = Math.floor((prediction - days) * 24);
    const minutes = Math.floor(((prediction - days) * 24 - hours) * 60);

    // Use AI prediction directly as countdown timer
    // Calculate how much time has passed since batch creation
    const batchCreatedAt = new Date(params.created_at as string);
    const timeElapsed = (currentTime.getTime() - batchCreatedAt.getTime()) / (1000 * 60 * 60 * 24); // in days
    
    // Calculate remaining time based on AI prediction
    const timeRemainingInDays = Math.max(0, prediction - timeElapsed);
    const timeRemainingDays = Math.floor(timeRemainingInDays);
    const timeRemainingHours = Math.floor((timeRemainingInDays - timeRemainingDays) * 24);
    const timeRemainingMinutes = Math.floor(((timeRemainingInDays - timeRemainingDays) * 24 - timeRemainingHours) * 60);
    
    const isExpired = timeRemainingInDays <= 0;

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
            <Clock size={24} color={isExpired ? '#6B7280' : color} />
            <Text style={styles.cardTitle}>Time Remaining</Text>
          </View>
          <Text style={[styles.predictionText, { color: isExpired ? '#6B7280' : color }]}>
            {isExpired 
              ? (timeRemainingDays > 0 
                  ? `Expired ${timeRemainingDays}d ago`
                  : timeRemainingHours > 0 
                    ? `Expired ${timeRemainingHours}h ago`
                    : `Expired ${timeRemainingMinutes}m ago`)
              : `${timeRemainingDays}d ${timeRemainingHours}h ${timeRemainingMinutes}m remaining`
            }
          </Text>
          <View style={[styles.confidenceBadge, { backgroundColor: isExpired ? '#6B728020' : `${color}20` }]}>
            <Text style={[styles.confidenceText, { color: isExpired ? '#6B7280' : color }]}>
              {isExpired ? 'Expired' : `${Math.round(recommendation.confidence * 100)}% confidence`}
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
            <Text style={styles.cardTitle}>Care Recommendations</Text>
          </View>
          {recommendation.recommendations && recommendation.recommendations.length > 0 ? (
            recommendation.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <View style={[styles.recommendationBullet, { backgroundColor: '#22C55E' }]} />
                <Text style={styles.recommendationText}>{rec}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.recommendationText}>No specific care recommendations available.</Text>
          )}
        </View>

        {/* Financial Recommendations Section */}
        {recommendation.financialRecommendations && recommendation.financialRecommendations.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Sparkles size={24} color="#F59E0B" />
              <Text style={styles.cardTitle}>Pricing & Discount Suggestions</Text>
            </View>
            {recommendation.financialRecommendations.map((financialRec, index) => (
              <View key={index} style={styles.financialRecommendationItem}>
                <View style={styles.financialRecommendationHeader}>
                  <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(financialRec.urgency) }]}>
                    <Text style={styles.urgencyText}>{financialRec.urgency.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.financialRecommendationTitle}>{financialRec.title}</Text>
                </View>
                
                <Text style={styles.financialRecommendationDescription}>{financialRec.description}</Text>
                
                {(financialRec.discountPercentage || financialRec.suggestedPrice) && (
                  <View style={styles.pricingDetails}>
                    {financialRec.discountPercentage && (
                      <View style={styles.pricingItem}>
                        <Text style={styles.pricingLabel}>Suggested Discount:</Text>
                        <Text style={styles.pricingValue}>{financialRec.discountPercentage}%</Text>
                      </View>
                    )}
                    {financialRec.suggestedPrice && (
                      <View style={styles.pricingItem}>
                        <Text style={styles.pricingLabel}>Suggested Price:</Text>
                        <Text style={styles.pricingValue}>${financialRec.suggestedPrice}</Text>
                      </View>
                    )}
                  </View>
                )}
                
                <View style={styles.timeWindowContainer}>
                  <Clock size={16} color="#6B7280" />
                  <Text style={styles.timeWindowText}>{financialRec.timeWindow}</Text>
                </View>
                
                <View style={styles.justificationContainer}>
                  <Text style={styles.justificationLabel}>Why this strategy:</Text>
                  <Text style={styles.justificationText}>{financialRec.justification}</Text>
                </View>
                
                {financialRec.actionItems && financialRec.actionItems.length > 0 && (
                  <View style={styles.actionItemsContainer}>
                    <Text style={styles.actionItemsLabel}>Action Items:</Text>
                    {financialRec.actionItems.map((action, actionIndex) => (
                      <View key={actionIndex} style={styles.actionItem}>
                        <View style={[styles.actionBullet, { backgroundColor: '#F59E0B' }]} />
                        <Text style={styles.actionText}>{action}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

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
          <View style={styles.headerSubtitleRow}>
            <Text style={styles.headerSubtitle}>
              {usingStoredData ? 'Using stored recommendation (tap refresh for new analysis)' : 'Enhanced with expert flower care knowledge'}
            </Text>
          </View>
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
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  storedDataBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  storedDataBadgeText: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '500',
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
  infoBox: {
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0EA5E9',
  },
  infoText: {
    fontSize: 14,
    color: '#0C4A6E',
    lineHeight: 20,
  },
  infoBold: {
    fontWeight: '600',
  },
  predictionDetails: {
    marginTop: 8,
  },
  predictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  predictionLabel: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  predictionValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },
  // Financial Recommendations Styles
  financialRecommendationItem: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  financialRecommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  urgencyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  urgencyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400E',
  },
  financialRecommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  financialRecommendationDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 8,
  },
  pricingDetails: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 8,
    marginBottom: 8,
  },
  pricingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  pricingLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  pricingValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  timeWindowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeWindowText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  justificationContainer: {
    marginBottom: 8,
  },
  justificationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  justificationText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  actionItemsContainer: {
    marginTop: 8,
  },
  actionItemsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  actionBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 6,
    marginRight: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
    lineHeight: 20,
  },
}); 