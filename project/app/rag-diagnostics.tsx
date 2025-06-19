import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import RAGDiagnostics from '@/components/RAGDiagnostics';

export default function RAGDiagnosticsScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <RAGDiagnostics />
    </SafeAreaView>
  );
} 