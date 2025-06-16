import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getAISpoilagePrediction } from '@/utils/aiService';
import { FlowerBatchInsert, FlowerBatch } from '@/types/database';
import { Plus, Save, Flower } from 'lucide-react-native';

export default function AddBatchScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<FlowerBatchInsert>({
    user_id: user?.id || '',
    flower_type: '',
    variety: '',
    quantity: 0,
    unit_of_measure: 'stems',
    purchase_date: new Date().toISOString().split('T')[0],
    expected_shelf_life: 7,
    shelf_life_unit: 'days',
    supplier: '',
    initial_condition: 'Good',
    storage_environment: 'Refrigerated',
    water_type: 'Tap Water',
    humidity_level: '40-50%',
    floral_food_used: false,
    vase_cleanliness: 'Clean',
    dynamic_spoilage_date: new Date().toISOString(),
  });

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to add a batch');
      return;
    }

    if (!formData.flower_type || !formData.variety || !formData.supplier) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      // Get AI prediction
      const aiPrediction = await getAISpoilagePrediction({
        ...formData,
        id: 'temp',
        user_id: user.id,
        dynamic_spoilage_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as FlowerBatch);
      
      // Calculate the dynamic spoilage date based on AI prediction
      const purchaseDate = new Date(formData.purchase_date);
      const spoilageDate = new Date(purchaseDate);
      spoilageDate.setDate(purchaseDate.getDate() + aiPrediction.prediction);

      // Create the final batch object with all required fields
      const batch: FlowerBatchInsert = {
        user_id: user.id,
        flower_type: formData.flower_type,
        variety: formData.variety,
        quantity: formData.quantity,
        unit_of_measure: formData.unit_of_measure || 'stems',
        purchase_date: formData.purchase_date,
        expected_shelf_life: formData.expected_shelf_life,
        shelf_life_unit: formData.shelf_life_unit || 'days',
        supplier: formData.supplier,
        initial_condition: formData.initial_condition || 'Good',
        storage_environment: formData.storage_environment || 'Refrigerated',
        water_type: formData.water_type || 'Tap Water',
        humidity_level: formData.humidity_level || '40-50%',
        floral_food_used: formData.floral_food_used || false,
        vase_cleanliness: formData.vase_cleanliness || 'Clean',
        dynamic_spoilage_date: spoilageDate.toISOString(),
        ai_prediction: aiPrediction.prediction,
        ai_confidence: aiPrediction.confidence || 0,
        ai_reasoning: aiPrediction.reasoning || '',
        ai_recommendations: aiPrediction.recommendations || [],
        ai_last_updated: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('flower_batches')
        .insert(batch);

      if (error) {
        throw error;
      }

      Alert.alert('Success', 'Flower batch added successfully', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error adding batch:', error);
      Alert.alert('Error', 'Failed to add flower batch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderPicker = (
    value: string,
    onValueChange: (value: string) => void,
    items: string[]
  ) => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={value}
            onValueChange={onValueChange}
            style={styles.picker}
          >
            {items.map((item) => (
              <Picker.Item key={item} label={item} value={item} />
            ))}
          </Picker>
        </View>
      );
    }

    return (
      <Picker
        selectedValue={value}
        onValueChange={onValueChange}
        style={styles.picker}
      >
        {items.map((item) => (
          <Picker.Item key={item} label={item} value={item} />
        ))}
      </Picker>
    );
  };

  const OptionButton = ({ label, value, selected, onPress }: { label: string; value: string; selected: boolean; onPress: () => void }) => (
    <TouchableOpacity
      style={[
        styles.optionButton,
        selected && styles.optionButtonSelected
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.optionButtonText,
        selected && styles.optionButtonTextSelected
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const OptionGroup = ({ label, options, value, onChange }: { 
    label: string; 
    options: { label: string; value: string }[]; 
    value: string; 
    onChange: (value: string) => void;
  }) => (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <OptionButton
            key={option.value}
            label={option.label}
            value={option.value}
            selected={value === option.value}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Flower size={32} color="#22C55E" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Add New Batch</Text>
            <Text style={styles.headerSubtitle}>Enter flower batch details</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Basic Information</Text>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Flower Type *</Text>
          <TextInput
            style={styles.input}
            value={formData.flower_type}
            onChangeText={(text) => setFormData({ ...formData, flower_type: text })}
            placeholder="e.g., Rose, Lily, Tulip"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Variety *</Text>
          <TextInput
            style={styles.input}
            value={formData.variety}
            onChangeText={(text) => setFormData({ ...formData, variety: text })}
            placeholder="e.g., Red, White, Pink"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Quantity</Text>
          <TextInput
            style={styles.input}
            value={formData.quantity?.toString()}
            onChangeText={(text) => setFormData({ ...formData, quantity: parseInt(text) || 0 })}
            keyboardType="numeric"
            placeholder="Enter quantity"
          />
        </View>

        <OptionGroup
          label="Unit of Measure"
          options={[
            { label: 'Stems', value: 'stems' },
            { label: 'Bunches', value: 'bunches' },
            { label: 'Boxes', value: 'boxes' },
          ]}
          value={formData.unit_of_measure}
          onChange={(value) => setFormData({ ...formData, unit_of_measure: value })}
        />

        <View style={styles.formGroup}>
          <Text style={styles.label}>Supplier *</Text>
          <TextInput
            style={styles.input}
            value={formData.supplier}
            onChangeText={(text) => setFormData({ ...formData, supplier: text })}
            placeholder="Enter supplier name"
          />
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Purchase Details</Text>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Purchase Date</Text>
          <TextInput
            style={styles.input}
            value={formData.purchase_date}
            onChangeText={(text) => setFormData({ ...formData, purchase_date: text })}
            placeholder="YYYY-MM-DD"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Expected Shelf Life</Text>
          <TextInput
            style={styles.input}
            value={formData.expected_shelf_life?.toString()}
            onChangeText={(text) => setFormData({ ...formData, expected_shelf_life: parseInt(text) || 0 })}
            keyboardType="numeric"
            placeholder="Enter number"
          />
        </View>

        <OptionGroup
          label="Shelf Life Unit"
          options={[
            { label: 'Days', value: 'days' },
            { label: 'Weeks', value: 'weeks' },
          ]}
          value={formData.shelf_life_unit}
          onChange={(value) => setFormData({ ...formData, shelf_life_unit: value })}
        />

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Storage Conditions</Text>
        <OptionGroup
          label="Initial Condition"
          options={[
            { label: 'Excellent', value: 'Excellent' },
            { label: 'Good', value: 'Good' },
            { label: 'Fair', value: 'Fair' },
            { label: 'Poor', value: 'Poor' },
          ]}
          value={formData.initial_condition}
          onChange={(value) => setFormData({ ...formData, initial_condition: value as 'Excellent' | 'Good' | 'Fair' | 'Poor' })}
        />

        <OptionGroup
          label="Storage Environment"
          options={[
            { label: 'Refrigerated', value: 'Refrigerated' },
            { label: 'Room Temperature', value: 'Room Temperature' },
            { label: 'Other', value: 'Other' },
          ]}
          value={formData.storage_environment}
          onChange={(value) => setFormData({ ...formData, storage_environment: value as 'Refrigerated' | 'Room Temperature' | 'Other' })}
        />

        <OptionGroup
          label="Water Type"
          options={[
            { label: 'Tap Water', value: 'Tap Water' },
            { label: 'Filtered Water', value: 'Filtered Water' },
            { label: 'Distilled Water', value: 'Distilled Water' },
          ]}
          value={formData.water_type}
          onChange={(value) => setFormData({ ...formData, water_type: value })}
        />

        <OptionGroup
          label="Humidity Level"
          options={[
            { label: '40-50%', value: '40-50%' },
            { label: '50-60%', value: '50-60%' },
            { label: '60-70%', value: '60-70%' },
            { label: '70-80%', value: '70-80%' },
          ]}
          value={formData.humidity_level}
          onChange={(value) => setFormData({ ...formData, humidity_level: value })}
        />

        <OptionGroup
          label="Vase Cleanliness"
          options={[
            { label: 'Clean', value: 'Clean' },
            { label: 'Rinsed', value: 'Rinsed' },
            { label: 'Dirty', value: 'Dirty' },
          ]}
          value={formData.vase_cleanliness}
          onChange={(value) => setFormData({ ...formData, vase_cleanliness: value as 'Clean' | 'Rinsed' | 'Dirty' })}
        />

        <View style={styles.formGroup}>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Floral Food Used</Text>
            <Switch
              value={formData.floral_food_used}
              onValueChange={(value) => setFormData({ ...formData, floral_food_used: value })}
              trackColor={{ false: '#E5E7EB', true: '#22C55E' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Save size={24} color="#FFFFFF" />
          <Text style={styles.submitButtonText}>
            {loading ? 'Adding Batch...' : 'Add Batch'}
          </Text>
        </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  switchLabel: {
    fontSize: 16,
    color: '#111827',
  },
  submitButton: {
    backgroundColor: '#22C55E',
    borderRadius: 8,
    paddingVertical: 16,
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  requiredLabel: {
    color: '#EF4444',
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 24,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 24,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 100,
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  optionButtonText: {
    fontSize: 16,
    color: '#374151',
  },
  optionButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});