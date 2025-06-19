import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import RAGInitializer from '@/components/RAGInitializer';

export default function RAGSetupScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <RAGInitializer />
    </SafeAreaView>
  );
} 