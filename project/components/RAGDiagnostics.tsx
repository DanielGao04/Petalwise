import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { knowledgeManager } from '@/utils/knowledgeManager';
import { ragService } from '@/utils/ragService';
import { enhancedAiService } from '@/utils/enhancedAiService';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react-native';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export default function RAGDiagnostics() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const diagnosticResults: DiagnosticResult[] = [];

    try {
      // Test 1: Check if flower_knowledge table exists
      try {
        const { data, error } = await supabase
          .from('flower_knowledge')
          .select('count')
          .limit(1);
        
        if (error) {
          diagnosticResults.push({
            name: 'Database Table',
            status: 'error',
            message: 'flower_knowledge table not found',
            details: error.message
          });
        } else {
          diagnosticResults.push({
            name: 'Database Table',
            status: 'success',
            message: 'flower_knowledge table exists'
          });
        }
      } catch (error) {
        diagnosticResults.push({
          name: 'Database Table',
          status: 'error',
          message: 'Cannot connect to database',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 2: Check if knowledge base has data
      try {
        const stats = await knowledgeManager.getKnowledgeBaseStats();
        if (stats.totalEntries > 0) {
          diagnosticResults.push({
            name: 'Knowledge Base',
            status: 'success',
            message: `${stats.totalEntries} flower entries found`,
            details: `Flower types: ${stats.flowerTypes.join(', ')}`
          });
        } else {
          diagnosticResults.push({
            name: 'Knowledge Base',
            status: 'warning',
            message: 'Knowledge base is empty',
            details: 'Run initialization to add sample data'
          });
        }
      } catch (error) {
        diagnosticResults.push({
          name: 'Knowledge Base',
          status: 'error',
          message: 'Cannot access knowledge base',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 3: Check OpenAI API key
      try {
        const testEmbedding = await ragService['generateEmbedding']('test');
        if (testEmbedding && testEmbedding.length > 0) {
          diagnosticResults.push({
            name: 'OpenAI API',
            status: 'success',
            message: 'API key is valid and working'
          });
        } else {
          diagnosticResults.push({
            name: 'OpenAI API',
            status: 'error',
            message: 'API key not working'
          });
        }
      } catch (error) {
        diagnosticResults.push({
          name: 'OpenAI API',
          status: 'error',
          message: 'API key error',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 4: Test RAG retrieval
      try {
        const context = await ragService.retrieveContext('Rose', 'Red Naomi');
        if (context.context.length > 0) {
          diagnosticResults.push({
            name: 'RAG Retrieval',
            status: 'success',
            message: 'Successfully retrieved flower knowledge',
            details: `${context.context.length} relevant entries found`
          });
        } else {
          diagnosticResults.push({
            name: 'RAG Retrieval',
            status: 'warning',
            message: 'No relevant knowledge found',
            details: 'Knowledge base may need more data'
          });
        }
      } catch (error) {
        diagnosticResults.push({
          name: 'RAG Retrieval',
          status: 'error',
          message: 'RAG retrieval failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 5: Test enhanced AI prediction
      try {
        const testBatch = {
          flower_type: 'Rose',
          variety: 'Red Naomi',
          storage_environment: 'Refrigerated',
          initial_condition: 'Excellent',
          floral_food_used: true,
        } as any;

        const prediction = await enhancedAiService.getEnhancedSpoilagePrediction(testBatch);
        
        if (prediction.sources.length > 0) {
          diagnosticResults.push({
            name: 'Enhanced AI',
            status: 'success',
            message: 'Enhanced prediction working',
            details: `${prediction.sources.length} sources, ${(prediction.confidence * 100).toFixed(1)}% confidence`
          });
        } else {
          diagnosticResults.push({
            name: 'Enhanced AI',
            status: 'warning',
            message: 'Enhanced prediction working (no sources)',
            details: 'Using fallback prediction'
          });
        }
      } catch (error) {
        diagnosticResults.push({
          name: 'Enhanced AI',
          status: 'error',
          message: 'Enhanced prediction failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }

    } catch (error) {
      diagnosticResults.push({
        name: 'Overall System',
        status: 'error',
        message: 'System diagnostic failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    setResults(diagnosticResults);
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={20} color="#22C55E" />;
      case 'error':
        return <XCircle size={20} color="#EF4444" />;
      case 'warning':
        return <AlertTriangle size={20} color="#F59E0B" />;
      default:
        return <Info size={20} color="#6B7280" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return '#22C55E';
      case 'error':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getOverallStatus = () => {
    if (results.length === 0) return 'unknown';
    const errors = results.filter(r => r.status === 'error').length;
    const warnings = results.filter(r => r.status === 'warning').length;
    
    if (errors > 0) return 'error';
    if (warnings > 0) return 'warning';
    return 'success';
  };

  const overallStatus = getOverallStatus();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>RAG System Diagnostics</Text>
        <Text style={styles.subtitle}>
          Check if all components of the RAG system are working correctly
        </Text>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={runDiagnostics}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Running Diagnostics...' : 'Run Diagnostics'}
          </Text>
        </TouchableOpacity>

        {results.length > 0 && (
          <View style={styles.resultsContainer}>
            <View style={styles.overallStatus}>
              <Text style={styles.overallStatusText}>
                Overall Status: 
                <Text style={[styles.overallStatusValue, { color: getStatusColor(overallStatus) }]}>
                  {overallStatus.toUpperCase()}
                </Text>
              </Text>
            </View>

            {results.map((result, index) => (
              <View key={index} style={styles.resultItem}>
                <View style={styles.resultHeader}>
                  {getStatusIcon(result.status)}
                  <Text style={styles.resultName}>{result.name}</Text>
                </View>
                <Text style={styles.resultMessage}>{result.message}</Text>
                {result.details && (
                  <Text style={styles.resultDetails}>{result.details}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>What to look for:</Text>
          <Text style={styles.infoText}>
            ✅ <Text style={styles.successText}>Success</Text>: Component is working{'\n'}
            ⚠️ <Text style={styles.warningText}>Warning</Text>: Working but needs attention{'\n'}
            ❌ <Text style={styles.errorText}>Error</Text>: Component is broken{'\n'}
            {'\n'}
            <Text style={styles.boldText}>RAG is working if:</Text>{'\n'}
            • Database Table = Success{'\n'}
            • Knowledge Base = Success{'\n'}
            • OpenAI API = Success{'\n'}
            • RAG Retrieval = Success{'\n'}
            • Enhanced AI = Success
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
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#22C55E',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    marginBottom: 24,
  },
  overallStatus: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  overallStatusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  overallStatusValue: {
    fontWeight: '700',
  },
  resultItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  resultMessage: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
  },
  resultDetails: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
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
  warningText: {
    color: '#F59E0B',
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  boldText: {
    fontWeight: '600',
    color: '#111827',
  },
}); 