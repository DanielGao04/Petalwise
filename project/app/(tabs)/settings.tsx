import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, LogOut, User, Bell, Info } from 'lucide-react-native';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();

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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
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
});