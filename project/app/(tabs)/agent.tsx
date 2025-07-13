import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Button, FlatList, Text, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Bot } from 'lucide-react-native';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AgentScreen() {
  const { session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! 👋 I'm your PetalWise AI assistant. I'm here to help you with your flower inventory management. I can help you with:\n\n• Flower care advice and recommendations\n• Inventory optimization suggestions\n• Spoilage prevention tips\n• Pricing and discount strategies\n• General florist questions\n\nHow can I assist you today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = async () => {
    if (input.trim().length === 0) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('conversational-agent', {
        body: { 
          query: input,
          history: messages 
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;
      
      const assistantMessage: Message = { role: 'assistant', content: data.response };
      setMessages([...newMessages, assistantMessage]);

    } catch (error) {
      console.error('Error invoking function:', error);
      let detail = "Sorry, I couldn't get a response. Please try again.";
      // Check if this is a Supabase FunctionsHttpError
      if (error && typeof error === 'object' && 'context' in error) {
          const functionError = (error as any).context;
          if (functionError && functionError.error) {
              detail = `Function Error: ${functionError.error}`;
          }
      } else if (error instanceof Error) {
          detail = error.message;
      }
      const errorMessage: Message = { role: 'assistant', content: detail };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Bot size={32} color="#22C55E" />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>AI Assistant</Text>
            <Text style={styles.headerSubtitle}>Your flower care expert</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.chatContainer}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={[styles.messageBubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
              <Text style={item.role === 'user' ? styles.userText : styles.assistantText}>{item.content}</Text>
            </View>
          )}
          contentContainerStyle={styles.messageList}
        />
        {loading && <ActivityIndicator style={styles.loadingIndicator} size="small" />}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask me anything..."
            editable={!loading}
          />
          <Button title="Send" onPress={handleSend} disabled={loading} />
        </View>
      </KeyboardAvoidingView>
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
  chatContainer: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  messageList: {
    padding: 10,
  },
  messageBubble: {
    borderRadius: 20,
    padding: 15,
    marginBottom: 10,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  assistantBubble: {
    backgroundColor: '#E5E5EA',
    alignSelf: 'flex-start',
  },
  userText: {
    color: 'white',
  },
  assistantText: {
    color: 'black',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white'
  },
  input: {
    flex: 1,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
  },
  loadingIndicator: {
    marginVertical: 10,
  }
}); 