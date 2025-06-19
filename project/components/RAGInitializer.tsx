import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { initializeRAGSystem, testRAGFunctionality } from '@/utils/initializeRAG';

export default function RAGInitializer() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');

  const handleInitialize = async () => {
    setLoading(true);
    setStatus('Initializing RAG system...');
    
    try {
      await initializeRAGSystem();
      setStatus('✅ RAG system initialized successfully!');
      Alert.alert(
        'Success', 
        'RAG system has been initialized with sample data. You can now test it with the diagnostic tools.',
        [
          { text: 'Run Diagnostics', onPress: () => router.push('/rag-diagnostics') },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      console.error('Error initializing RAG:', error);
      setStatus('❌ Error initializing RAG system');
      Alert.alert('Error', 'Failed to initialize RAG system. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestRose = async () => {
    setLoading(true);
    setStatus('Testing RAG with Rose...');
    
    try {
      await testRAGFunctionality('Rose', 'Red Naomi');
      setStatus('✅ Rose test completed! Check console for results.');
    } catch (error) {
      console.error('Error testing RAG:', error);
      setStatus('❌ Error testing RAG system');
    } finally {
      setLoading(false);
    }
  };

  const handleTestTulip = async () => {
    setLoading(true);
    setStatus('Testing RAG with Tulip...');
    
    try {
      await testRAGFunctionality('Tulip', 'Standard');
      setStatus('✅ Tulip test completed! Check console for results.');
    } catch (error) {
      console.error('Error testing RAG:', error);
      setStatus('❌ Error testing RAG system');
    } finally {
      setLoading(false);
    }
  };

  const handleRunDiagnostics = () => {
    router.push('/rag-diagnostics');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>RAG System Initializer</Text>
        <Text style={styles.subtitle}>
          Initialize the RAG system with sample flower care knowledge
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Step 1: Initialize System</Text>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleInitialize}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Initializing...' : 'Initialize RAG System'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Step 2: Test the System</Text>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleTestRose}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Test with Rose</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleTestTulip}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Test with Tulip</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Step 3: Check System Health</Text>
          <TouchableOpacity
            style={[styles.button, styles.diagnosticButton]}
            onPress={handleRunDiagnostics}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Run Full Diagnostics</Text>
          </TouchableOpacity>
        </View>

        {status && (
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>What this does:</Text>
          <Text style={styles.infoText}>
            • Creates flower knowledge database with sample data{'\n'}
            • Sets up vector search capabilities{'\n'}
            • Tests the RAG system with different flowers{'\n'}
            • Verifies everything is working correctly
          </Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How to tell if it's working:</Text>
          <Text style={styles.infoText}>
            ✅ <Text style={styles.successText}>Success indicators:</Text>{'\n'}
            • "RAG system initialized successfully" message{'\n'}
            • Diagnostic tests show all green checkmarks{'\n'}
            • AI recommendations show "Expert Care Information"{'\n'}
            • Source links appear in recommendations{'\n'}
            {'\n'}
            ❌ <Text style={styles.errorText}>Error indicators:</Text>{'\n'}
            • Red error messages in diagnostics{'\n'}
            • "No RAG context found" in AI recommendations{'\n'}
            • Missing source attribution{'\n'}
            • Generic recommendations without expert knowledge
          </Text>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Prerequisites:</Text>
          <Text style={styles.infoText}>
            • Supabase database migration must be run first{'\n'}
            • OpenAI API key must be configured{'\n'}
            • Internet connection required for API calls
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#22C55E',
  },
  secondaryButton: {
    backgroundColor: '#6366F1',
  },
  diagnosticButton: {
    backgroundColor: '#8B5CF6',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  statusText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  successText: {
    color: '#22C55E',
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    fontWeight: '600',
  },
}); 