import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { FlowerBatch } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Clock, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Flower, Trash2, Sparkles } from 'lucide-react-native';

export default function DashboardScreen() {
  const router = useRouter();
  const [batches, setBatches] = useState<FlowerBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every 30 seconds for countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // Update every 30 seconds for more responsive countdown

    return () => clearInterval(interval);
  }, []);

  const fetchBatches = async () => {
    if (!user) {
      console.log('No user found, skipping fetch');
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      console.log('Fetching batches for user:', user.id);
      
      const { data, error } = await supabase
        .from('flower_batches')
        .select('*')
        .eq('user_id', user.id)
        .order('dynamic_spoilage_date', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Fetched batches:', data);
      setBatches(data || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    Alert.alert(
      'Delete Batch',
      'Are you sure you want to delete this flower batch? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('flower_batches')
                .delete()
                .eq('id', batchId);

              if (error) {
                throw error;
              }

              // Update local state
              setBatches(batches.filter(batch => batch.id !== batchId));
            } catch (error) {
              console.error('Error deleting batch:', error);
              Alert.alert('Error', 'Failed to delete the flower batch. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Calculate real-time countdown
  const calculateTimeRemaining = (spoilageDate: string) => {
    const spoilage = new Date(spoilageDate);
    const now = currentTime;
    const diff = spoilage.getTime() - now.getTime();
    
    // Debug logging (only for first few calls to avoid spam)
    if (Math.random() < 0.1) { // 10% chance to log
      console.log(`🔍 Countdown Debug:`, {
        spoilageDate: spoilage.toISOString(),
        currentTime: now.toISOString(),
        diffHours: diff / (1000 * 60 * 60),
        diffDays: diff / (1000 * 60 * 60 * 24)
      });
    }
    
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

  // Fetch batches when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchBatches();
    }, [user])
  );

  // Initial fetch
  useEffect(() => {
    fetchBatches();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBatches();
  };

  const renderBatchCard = (batch: FlowerBatch) => {
    // Use AI prediction directly as countdown timer
    // Calculate how much time has passed since batch creation
    const batchCreatedAt = new Date(batch.created_at);
    const timeElapsed = (currentTime.getTime() - batchCreatedAt.getTime()) / (1000 * 60 * 60 * 24); // in days
    
    // Calculate remaining time based on AI prediction
    const timeRemainingInDays = Math.max(0, (batch.ai_prediction || 0) - timeElapsed);
    const timeRemainingDays = Math.floor(timeRemainingInDays);
    const timeRemainingHours = Math.floor((timeRemainingInDays - timeRemainingDays) * 24);
    const timeRemainingMinutes = Math.floor(((timeRemainingInDays - timeRemainingDays) * 24 - timeRemainingHours) * 60);
    
    const isExpired = timeRemainingInDays <= 0;
    
    let status: 'critical' | 'warning' | 'good' | 'expired';
    let color: string;

    // Use the same logic as AI recommendations - based on original AI prediction
    const originalPrediction = batch.ai_prediction || 0;
    
    if (isExpired) {
      status = 'expired';
      color = '#6B7280'; // Gray for expired
    } else if (originalPrediction <= 1) {
      status = 'critical';
      color = '#EF4444';
    } else if (originalPrediction <= 3) {
      status = 'warning';
      color = '#F59E0B';
    } else {
      status = 'good';
      color = '#22C55E';
    }
    
    const StatusIcon = () => {
      switch (status) {
        case 'expired':
          return <Clock size={20} color={color} />;
        case 'critical':
          return <AlertTriangle size={20} color={color} />;
        case 'warning':
          return <Clock size={20} color={color} />;
        default:
          return <CheckCircle size={20} color={color} />;
      }
    };

    const getTimeDisplay = () => {
      if (isExpired) {
        if (timeRemainingDays > 0) {
          return `Expired ${timeRemainingDays}d ago`;
        } else if (timeRemainingHours > 0) {
          return `Expired ${timeRemainingHours}h ago`;
        } else {
          return `Expired ${timeRemainingMinutes}m ago`;
        }
      }
      return `${timeRemainingDays}d ${timeRemainingHours}h ${timeRemainingMinutes}m remaining`;
    };

    return (
      <View style={styles.batchCard}>
        <View style={styles.cardHeader}>
          <View style={styles.flowerInfo}>
            <Text style={styles.flowerType}>{batch.flower_type}</Text>
            <Text style={styles.flowerVariety}>{batch.variety}</Text>
          </View>
          <View style={styles.headerActions}>
            <View style={[styles.statusBadge, { backgroundColor: `${color}20` }]}>
              <StatusIcon />
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={(e) => {
                e.stopPropagation();
                handleDeleteBatch(batch.id);
              }}
            >
              <Trash2 size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.quantityRow}>
            <Text style={styles.quantity}>
              {batch.quantity} {batch.unit_of_measure}
            </Text>
            <Text style={styles.supplier}>{batch.supplier}</Text>
          </View>

          <View style={styles.timerRow}>
            <Clock size={16} color={color} />
            <Text style={[styles.timeRemaining, { color }]}>
              {getTimeDisplay()}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.aiButton}
            onPress={(e) => {
              e.stopPropagation();
              console.log('Navigating to AI recommendation with batch:', batch);
              router.push({
                pathname: '/ai-recommendation',
                params: {
                  id: batch.id,
                  user_id: batch.user_id,
                  flower_type: batch.flower_type,
                  variety: batch.variety,
                  quantity: batch.quantity.toString(),
                  unit_of_measure: batch.unit_of_measure,
                  purchase_date: batch.purchase_date,
                  expected_shelf_life: batch.expected_shelf_life.toString(),
                  shelf_life_unit: batch.shelf_life_unit,
                  supplier: batch.supplier,
                  initial_condition: batch.initial_condition,
                  storage_environment: batch.storage_environment,
                  floral_food_used: batch.floral_food_used.toString(),
                  vase_cleanliness: batch.vase_cleanliness,
                  water_type: batch.water_type,
                  humidity_level: batch.humidity_level,
                  dynamic_spoilage_date: batch.dynamic_spoilage_date,
                  created_at: batch.created_at,
                  updated_at: batch.updated_at,
                  visual_notes: batch.visual_notes || '',
                }
              });
            }}
          >
            <Sparkles size={16} color="#6366F1" />
            <Text style={styles.aiButtonText}>View Details and Recommendations</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Flower size={32} color="#22C55E" />
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Dashboard</Text>
              <Text style={styles.headerSubtitle}>Loading inventory...</Text>
            </View>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your inventory...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Flower size={32} color="#22C55E" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <View style={styles.headerSubtitleRow}>
              <Text style={styles.headerSubtitle}>
                {batches.length} {batches.length === 1 ? 'batch' : 'batches'} in inventory
              </Text>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Live</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {batches.length === 0 ? (
          <View style={styles.emptyState}>
            <Flower size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No flower batches yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your first batch to start tracking inventory
            </Text>
          </View>
        ) : (
          batches.map((batch) => (
            <View key={batch.id} style={styles.batchCardContainer}>
              {renderBatchCard(batch)}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
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
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    marginRight: 4,
  },
  liveText: {
    fontSize: 10,
    color: '#92400E',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  batchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  flowerInfo: {
    flex: 1,
  },
  flowerType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  flowerVariety: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    padding: 8,
    borderRadius: 8,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  cardContent: {
    gap: 8,
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  supplier: {
    fontSize: 14,
    color: '#6B7280',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  timeRemaining: {
    fontSize: 16,
    fontWeight: '600',
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  aiButtonText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  batchCardContainer: {
    marginBottom: 16,
  },
});