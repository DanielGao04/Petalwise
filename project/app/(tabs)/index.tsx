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
import { useFocusEffect } from '@react-navigation/native';
import { FlowerBatch } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getSpoilageStatus, formatTimeRemaining } from '@/utils/spoilageCalculator';
import { Clock, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Flower, Trash2 } from 'lucide-react-native';

export default function DashboardScreen() {
  const [batches, setBatches] = useState<FlowerBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

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
    const spoilageStatus = getSpoilageStatus(batch.dynamic_spoilage_date);
    
    const StatusIcon = () => {
      switch (spoilageStatus.status) {
        case 'critical':
          return <AlertTriangle size={20} color={spoilageStatus.color} />;
        case 'warning':
          return <Clock size={20} color={spoilageStatus.color} />;
        default:
          return <CheckCircle size={20} color={spoilageStatus.color} />;
      }
    };

    return (
      <TouchableOpacity key={batch.id} style={styles.batchCard}>
        <View style={styles.cardHeader}>
          <View style={styles.flowerInfo}>
            <Text style={styles.flowerType}>{batch.flower_type}</Text>
            <Text style={styles.flowerVariety}>{batch.variety}</Text>
          </View>
          <View style={styles.headerActions}>
            <View style={[styles.statusBadge, { backgroundColor: `${spoilageStatus.color}15` }]}>
              <StatusIcon />
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteBatch(batch.id)}
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
            <Text style={styles.supplier}>from {batch.supplier}</Text>
          </View>

          <View style={styles.timerRow}>
            <Clock size={16} color="#6B7280" />
            <Text style={[styles.timeRemaining, { color: spoilageStatus.color }]}>
              {spoilageStatus.lifespan}
            </Text>
          </View>

          <View style={styles.recommendationRow}>
            <Text style={styles.recommendationLabel}>Action:</Text>
            <Text style={styles.recommendation}>{spoilageStatus.recommendation}</Text>
          </View>

          {spoilageStatus.status !== 'good' && (
            <View style={styles.discountRow}>
              <Text style={styles.discountText}>{spoilageStatus.discountSuggestion}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Flower size={32} color="#22C55E" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <Text style={styles.headerSubtitle}>
              {batches.length} {batches.length === 1 ? 'batch' : 'batches'} in inventory
            </Text>
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
          batches.map(renderBatchCard)
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
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
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
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  batchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  flowerInfo: {
    flex: 1,
  },
  flowerType: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  flowerVariety: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    padding: 8,
    borderRadius: 12,
  },
  cardContent: {
    gap: 12,
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '600',
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
  },
  timeRemaining: {
    fontSize: 16,
    fontWeight: '600',
  },
  recommendationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recommendationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  recommendation: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  discountRow: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
  },
  discountText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#92400E',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
});