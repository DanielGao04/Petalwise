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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { calculateDynamicSpoilageDate } from '@/utils/spoilageCalculator';
import { FlowerBatchInsert } from '@/types/database';
import { Plus, Save } from 'lucide-react-native';

export default function AddBatchScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [flowerType, setFlowerType] = useState('');
  const [variety, setVariety] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState('Stem');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedShelfLife, setExpectedShelfLife] = useState('');
  const [shelfLifeUnit, setShelfLifeUnit] = useState('Days');
  const [supplier, setSupplier] = useState('');
  const [initialCondition, setInitialCondition] = useState('Good');
  const [visualNotes, setVisualNotes] = useState('');
  const [storageEnvironment, setStorageEnvironment] = useState('Room Temperature');
  const [waterType, setWaterType] = useState('Tap Water');
  const [humidityLevel, setHumidityLevel] = useState('Medium');
  const [floralFoodUsed, setFloralFoodUsed] = useState(false);
  const [vaseCleanliness, setVaseCleanliness] = useState('Clean');

  const resetForm = () => {
    setFlowerType('');
    setVariety('');
    setQuantity('');
    setExpectedShelfLife('');
    setSupplier('');
    setVisualNotes('');
    setUnitOfMeasure('Stem');
    setShelfLifeUnit('Days');
    setInitialCondition('Good');
    setStorageEnvironment('Room Temperature');
    setWaterType('Tap Water');
    setHumidityLevel('Medium');
    setFloralFoodUsed(false);
    setVaseCleanliness('Clean');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
  };

  const handleSubmit = async () => {
    // Validation
    if (!flowerType.trim() || !variety.trim() || !quantity.trim() || !expectedShelfLife.trim() || !supplier.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const quantityNum = parseInt(quantity);
    const shelfLifeNum = parseInt(expectedShelfLife);

    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    if (isNaN(shelfLifeNum) || shelfLifeNum <= 0) {
      Alert.alert('Error', 'Please enter a valid shelf life');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to add flower batches');
      return;
    }

    setLoading(true);

    try {
      // Calculate dynamic spoilage date using AI
      const dynamicSpoilageDate = await calculateDynamicSpoilageDate(
        purchaseDate,
        shelfLifeNum,
        shelfLifeUnit,
        initialCondition,
        storageEnvironment,
        floralFoodUsed,
        vaseCleanliness
      );

      const newBatch: FlowerBatchInsert = {
        user_id: user.id,
        flower_type: flowerType.trim(),
        variety: variety.trim(),
        quantity: quantityNum,
        unit_of_measure: unitOfMeasure,
        purchase_date: purchaseDate,
        expected_shelf_life: shelfLifeNum,
        shelf_life_unit: shelfLifeUnit,
        supplier: supplier.trim(),
        initial_condition: initialCondition,
        visual_notes: visualNotes.trim() || null,
        storage_environment: storageEnvironment,
        water_type: waterType,
        humidity_level: humidityLevel,
        floral_food_used: floralFoodUsed,
        vase_cleanliness: vaseCleanliness,
        dynamic_spoilage_date: dynamicSpoilageDate,
      };

      console.log('Attempting to insert batch:', newBatch);

      const { data, error } = await supabase
        .from('flower_batches')
        .insert([newBatch])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Successfully created batch:', data);

      Alert.alert('Success', 'Flower batch added successfully!', [
        {
          text: 'Add Another',
          onPress: () => resetForm(),
        },
        {
          text: 'View Dashboard',
          onPress: () => router.replace('/(tabs)'),
          style: 'default',
        },
      ]);
    } catch (error: any) {
      console.error('Error adding batch:', error);
      Alert.alert('Error', `Failed to add flower batch: ${error.message || 'Unknown error'}`);
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Plus size={32} color="#22C55E" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Add New Batch</Text>
            <Text style={styles.headerSubtitle}>Enter flower batch details</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Flower Type *</Text>
            <TextInput
              style={styles.input}
              value={flowerType}
              onChangeText={setFlowerType}
              placeholder="e.g., Rose, Lily, Tulip"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Variety *</Text>
            <TextInput
              style={styles.input}
              value={variety}
              onChangeText={setVariety}
              placeholder="e.g., Red Naomi, Stargazer"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Quantity *</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, styles.flex1, styles.marginLeft]}>
              <Text style={styles.label}>Unit</Text>
              {renderPicker(unitOfMeasure, setUnitOfMeasure, ['Stem', 'Bunch', 'Dozen'])}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Supplier *</Text>
            <TextInput
              style={styles.input}
              value={supplier}
              onChangeText={setSupplier}
              placeholder="Supplier name"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timing & Storage</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Purchase Date</Text>
            <TextInput
              style={styles.input}
              value={purchaseDate}
              onChangeText={setPurchaseDate}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.flex1]}>
              <Text style={styles.label}>Expected Shelf Life *</Text>
              <TextInput
                style={styles.input}
                value={expectedShelfLife}
                onChangeText={setExpectedShelfLife}
                placeholder="7"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, styles.flex1, styles.marginLeft]}>
              <Text style={styles.label}>Unit</Text>
              {renderPicker(shelfLifeUnit, setShelfLifeUnit, ['Days', 'Weeks'])}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Initial Condition</Text>
            {renderPicker(initialCondition, setInitialCondition, ['Excellent', 'Good', 'Fair', 'Poor'])}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Storage Environment</Text>
            {renderPicker(storageEnvironment, setStorageEnvironment, ['Refrigerated', 'Room Temperature', 'Other'])}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Care Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Water Type</Text>
            {renderPicker(waterType, setWaterType, ['Tap Water', 'Filtered Water', 'Distilled Water', 'Other'])}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Humidity Level</Text>
            {renderPicker(humidityLevel, setHumidityLevel, ['Low', 'Medium', 'High'])}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vase/Bucket Cleanliness</Text>
            {renderPicker(vaseCleanliness, setVaseCleanliness, ['Clean', 'Rinsed', 'Dirty'])}
          </View>

          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setFloralFoodUsed(!floralFoodUsed)}
          >
            <View style={[styles.checkbox, floralFoodUsed && styles.checkboxChecked]}>
              {floralFoodUsed && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Floral food used</Text>
          </TouchableOpacity>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Visual Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={visualNotes}
              onChangeText={setVisualNotes}
              placeholder="Any specific observations..."
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Save size={20} color="#FFFFFF" />
          <Text style={styles.submitButtonText}>
            {loading ? 'Adding Batch...' : 'Add Flower Batch'}
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
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  flex1: {
    flex: 1,
  },
  marginLeft: {
    marginLeft: 12,
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
  },
  picker: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#374151',
  },
  submitButton: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});