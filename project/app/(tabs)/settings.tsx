import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, LogOut, User, Bell, Info, Database, Activity, X } from 'lucide-react-native';
import { initializeRAGSystem, testRAGFunctionality } from '@/utils/initializeRAG';
import RAGDiagnostics from '@/components/RAGDiagnostics';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [showRAGModal, setShowRAGModal] = useState(false);
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState(false);
  const [ragStatus, setRagStatus] = useState<string>('');

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            const { error } = await signOut();
            if (error) {
              Alert.alert('Error', error.message);
            } else {
              router.replace('/(auth)/login');
            }
          },
        },
      ]
    );
  };

  const handleInitializeRAG = async () => {
    setRagStatus('Initializing RAG system...');
    
    try {
      await initializeRAGSystem();
      setRagStatus('✅ RAG system initialized successfully!');
      Alert.alert(
        'Success', 
        'RAG system has been initialized with sample data. You can now test it with the diagnostic tools.',
        [
          { text: 'Run Diagnostics', onPress: () => setShowDiagnosticsModal(true) },
          { text: 'OK' }
        ]
      );
    } catch (error) {
      console.error('Error initializing RAG:', error);
      setRagStatus('❌ Error initializing RAG system');
      Alert.alert('Error', 'Failed to initialize RAG system. Check console for details.');
    }
  };

  const handleTestRAG = async () => {
    setRagStatus('Testing RAG with Rose...');
    
    try {
      await testRAGFunctionality('Rose', 'Red Naomi');
      setRagStatus('✅ Rose test completed! Check console for results.');
    } catch (error) {
      console.error('Error testing RAG:', error);
      setRagStatus('❌ Error testing RAG system');
    }
  };

  const SettingsItem = ({ 
    icon: Icon, 
    title, 
    subtitle, 
    onPress, 
    destructive = false 
  }: {
    icon: any;
    title: string;
    subtitle?: string;
    onPress: () => void;
    destructive?: boolean;
  }) => (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
      <View style={styles.settingsItemLeft}>
        <View style={[styles.iconContainer, destructive && styles.iconContainerDestructive]}>
          <Icon 
            size={20} 
            color={destructive ? '#EF4444' : '#6B7280'} 
          />
        </View>
        <View style={styles.settingsItemText}>
          <Text style={[styles.settingsItemTitle, destructive && styles.settingsItemTitleDestructive]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Settings size={32} color="#22C55E" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Settings</Text>
            <Text style={styles.headerSubtitle}>Manage your account</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <User size={24} color="#6B7280" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <Text style={styles.userStatus}>Active account</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI System</Text>
          <SettingsItem
            icon={Database}
            title="RAG System Setup"
            subtitle="Initialize and manage AI knowledge base"
            onPress={() => setShowRAGModal(true)}
          />
          <SettingsItem
            icon={Activity}
            title="System Diagnostics"
            subtitle="Check if RAG system is working correctly"
            onPress={() => setShowDiagnosticsModal(true)}
          />
          <SettingsItem
            icon={Info}
            title="Manage Flower Knowledge"
            subtitle="Add, edit, or remove flower care information"
            onPress={() => Alert.alert('Knowledge Management', 'This feature will be available in the next update. For now, you can add knowledge directly to the database or use the initialization script.')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <SettingsItem
            icon={Bell}
            title="Notifications"
            subtitle="Manage spoilage alerts and reminders"
            onPress={() => Alert.alert('Coming Soon', 'Notification settings will be available in a future update.')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <SettingsItem
            icon={Info}
            title="About PetalWise"
            subtitle="Version 1.0.0"
            onPress={() => Alert.alert('PetalWise', 'Smart inventory management for florists.\n\nVersion 1.0.0\nBuilt with ❤️ for florists everywhere.')}
          />
        </View>

        <View style={styles.section}>
          <SettingsItem
            icon={LogOut}
            title="Sign Out"
            onPress={handleSignOut}
            destructive
          />
        </View>
      </ScrollView>

      {/* RAG Setup Modal */}
      <Modal
        visible={showRAGModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>RAG System Setup</Text>
            <TouchableOpacity onPress={() => setShowRAGModal(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.ragSection}>
              <Text style={styles.ragSectionTitle}>Step 1: Initialize System</Text>
              <TouchableOpacity
                style={[styles.ragButton, styles.primaryButton]}
                onPress={handleInitializeRAG}
              >
                <Text style={styles.ragButtonText}>Initialize RAG System</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.ragSection}>
              <Text style={styles.ragSectionTitle}>Step 2: Test the System</Text>
              <TouchableOpacity
                style={[styles.ragButton, styles.secondaryButton]}
                onPress={handleTestRAG}
              >
                <Text style={styles.ragButtonText}>Test with Rose</Text>
              </TouchableOpacity>
            </View>

            {ragStatus && (
              <View style={styles.statusContainer}>
                <Text style={styles.statusText}>{ragStatus}</Text>
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
                • AI recommendations show "Expert Care Information"{'\n'}
                • Source links appear in recommendations{'\n'}
                {'\n'}
                ❌ <Text style={styles.errorText}>Error indicators:</Text>{'\n'}
                • Red error messages{'\n'}
                • "No RAG context found" in AI recommendations{'\n'}
                • Missing source attribution
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Diagnostics Modal */}
      <Modal
        visible={showDiagnosticsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>System Diagnostics</Text>
            <TouchableOpacity onPress={() => setShowDiagnosticsModal(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <RAGDiagnostics />
          </View>
        </SafeAreaView>
      </Modal>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  userInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userAvatar: {
    width: 48,
    height: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    marginLeft: 16,
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  userStatus: {
    fontSize: 14,
    color: '#22C55E',
    marginTop: 2,
  },
  settingsItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    backgroundColor: '#F3F4F6',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconContainerDestructive: {
    backgroundColor: '#FEF2F2',
  },
  settingsItemText: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  settingsItemTitleDestructive: {
    color: '#EF4444',
  },
  settingsItemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  // RAG specific styles
  ragSection: {
    marginBottom: 24,
  },
  ragSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  ragButton: {
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
  ragButtonText: {
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