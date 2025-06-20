import React from 'react';
import { ScrollView, Text, View, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');
const chartWidth = width - 32;

// Chart configurations
const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#ffa726',
  },
};

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [spoilageOverview, setSpoilageOverview] = React.useState([]);
  const [spoilageByCategory, setSpoilageByCategory] = React.useState({ labels: [], datasets: [{ data: [] }] });
  const [wasteTrend, setWasteTrend] = React.useState({ labels: [], datasets: [{ data: [] }]});
  const [discountCandidates, setDiscountCandidates] = React.useState([]);
  const [potentialSavings, setPotentialSavings] = React.useState(null);

  React.useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [
        overviewRes,
        riskRes,
        trendRes,
        candidatesRes,
        savingsRes
      ] = await Promise.all([
        supabase.rpc('get_spoilage_overview', { p_user_id: user.id }),
        supabase.rpc('get_spoilage_risk_by_category', { p_user_id: user.id, category_type: 'flower_type' }),
        supabase.rpc('get_predicted_waste_trend', { p_user_id: user.id, start_date: new Date().toISOString(), end_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString() }),
        supabase.rpc('get_discount_candidates', { p_user_id: user.id }),
        supabase.rpc('get_potential_savings', { p_user_id: user.id, assumed_price_per_stem: 1.5 })
      ]);

      if (overviewRes.error) throw overviewRes.error;
      if (riskRes.error) throw riskRes.error;
      if (trendRes.error) throw trendRes.error;
      if (candidatesRes.error) throw candidatesRes.error;
      if (savingsRes.error) throw savingsRes.error;

      // Format data for react-native-chart-kit
      const spoilageData = overviewRes.data || [];
      const pieChartColors = ['#d32f2f', '#f57c00', '#fbc02d', '#388e3c'];
      const spoilagePieData = spoilageData.map((item, index) => ({
        name: item.category.split(' (')[0],
        population: item.count,
        color: pieChartColors[index % pieChartColors.length],
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      }));
      setSpoilageOverview(spoilagePieData);

      const riskData = riskRes.data || [];
      const riskBarData = {
        labels: riskData.map(item => item.category_value.substring(0, 10)), // Truncate long labels
        datasets: [{
          data: riskData.map(item => item.spoiled_count)
        }]
      };
      setSpoilageByCategory(riskBarData);

      const trendData = trendRes.data || [];
      const trendLineData = {
        labels: trendData.map(item => new Date(item.trend_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
        datasets: [{
          data: trendData.map(item => item.total_quantity)
        }]
      };
      setWasteTrend(trendLineData);

      setDiscountCandidates(candidatesRes.data || []);
      setPotentialSavings(savingsRes.data);

    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" style={styles.loader} />;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Analytics Dashboard</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Predicted Spoilage Overview</Text>
        {spoilageOverview.length > 0 ? (
          <PieChart
            data={spoilageOverview}
            width={chartWidth}
            height={220}
            chartConfig={chartConfig}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            absolute
          />
        ) : <Text style={styles.noDataText}>No spoilage data available.</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Spoilage Risk by Flower Type</Text>
        {spoilageByCategory.labels.length > 0 ? (
          <BarChart
            data={spoilageByCategory}
            width={chartWidth}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={chartConfig}
            verticalLabelRotation={30}
          />
        ) : <Text style={styles.noDataText}>No spoilage risk data available.</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Predicted Waste Trend (Next 30 Days)</Text>
        {wasteTrend.labels.length > 0 ? (
          <LineChart
            data={wasteTrend}
            width={chartWidth}
            height={220}
            chartConfig={chartConfig}
            bezier
          />
        ) : <Text style={styles.noDataText}>No waste trend data available.</Text>}
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Potential Savings (Simulated)</Text>
        {potentialSavings && <Text style={styles.savingsText}>${Number(potentialSavings[0]?.potential_savings || 0).toFixed(2)}</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Discount Candidates</Text>
        {discountCandidates.length > 0 ? discountCandidates?.map(item => (
          <View key={item.id} style={styles.candidateItem}>
            <Text>{item.flower_type} - {item.variety} ({item.quantity} stems)</Text>
            <Text>Spoils on: {new Date(item.dynamic_spoilage_date).toLocaleDateString()}</Text>
          </View>
        )) : <Text style={styles.noDataText}>No discount candidates right now.</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  noDataText: {
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
    color: '#666'
  },
  candidateItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  savingsText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2e7d32',
    textAlign: 'center'
  }
}); 