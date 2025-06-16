import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const { error } = isLogin
      ? await signIn(email, password)
      : await signUp(email, password);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      if (!isLogin) {
        Alert.alert('Success', 'Check your email for verification link');
      } else {
        router.replace('/(tabs)');
      }
    }
    setLoading(false);
  };

  const handleOptionSelect = (isLoginOption: boolean) => {
    setIsLogin(isLoginOption);
    setShowForm(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('@/assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>PetalWise</Text>
            <Text style={styles.subtitle}>
              Smart inventory management for florists
            </Text>
          </View>

          {!showForm ? (
            <View style={styles.bottomContainer}>
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => handleOptionSelect(true)}
                >
                  <Text style={styles.optionButtonText}>Sign In</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.optionButton, styles.signUpButton]}
                  onPress={() => handleOptionSelect(false)}
                >
                  <Text style={styles.signUpButtonText}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleAuth}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => {
                  if (isLogin) {
                    setShowForm(false);
                  } else {
                    setIsLogin(true);
                    setShowForm(true);
                  }
                }}
              >
                <Text style={styles.switchText}>
                  {isLogin ? 'Go Back' : 'Already have an account? Sign In'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 48,
  },
  bottomContainer: {
    marginTop: 'auto',
    paddingBottom: 24,
  },
  logoContainer: {
    width: 180,
    height: 180,
    backgroundColor: '#F0FDF4',
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    padding: 30,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  optionsContainer: {
    width: '100%',
    gap: 16,
  },
  optionButton: {
    backgroundColor: '#22C55E',
    borderRadius: 25,
    padding: 16,
    alignItems: 'center',
  },
  signUpButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#22C55E',
    borderRadius: 25,
  },
  optionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signUpButtonText: {
    color: '#22C55E',
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
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
  button: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  switchText: {
    color: '#22C55E',
    fontSize: 16,
    fontWeight: '500',
  },
});