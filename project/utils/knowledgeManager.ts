import OpenAI from 'openai';
import { supabase } from '@/lib/supabase';
import { FlowerKnowledge } from './ragService';

// Initialize OpenAI for embeddings
const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
});

export interface FlowerCareData {
  flower_type: string;
  variety?: string;
  care_requirements: string;
  optimal_temperature: string;
  optimal_humidity: string;
  water_requirements: string;
  ethylene_sensitivity: string;
  common_issues: string;
  vase_life_tips: string;
  source_url: string;
  source_name: string;
}

class KnowledgeManager {
  private embeddingModel = 'text-embedding-3-small';

  /**
   * Generate embedding for flower care data
   */
  private async generateEmbedding(data: FlowerCareData): Promise<number[]> {
    try {
      const text = `${data.flower_type} ${data.variety || ''} ${data.care_requirements} ${data.optimal_temperature} ${data.optimal_humidity} ${data.water_requirements} ${data.ethylene_sensitivity} ${data.common_issues} ${data.vase_life_tips}`;
      
      const response = await openai.embeddings.create({
        model: this.embeddingModel,
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  /**
   * Add new flower care knowledge to the database
   */
  async addFlowerKnowledge(data: FlowerCareData): Promise<void> {
    try {
      // Generate embedding for the data
      const embedding = await this.generateEmbedding(data);

      // Insert into database
      const { error } = await supabase
        .from('flower_knowledge')
        .insert({
          ...data,
          embedding,
        });

      if (error) {
        throw error;
      }

      console.log(`Added knowledge for ${data.flower_type}${data.variety ? ` (${data.variety})` : ''}`);
    } catch (error) {
      console.error('Error adding flower knowledge:', error);
      throw error;
    }
  }

  /**
   * Add multiple flower care entries at once
   */
  async addMultipleFlowerKnowledge(dataArray: FlowerCareData[]): Promise<void> {
    try {
      for (const data of dataArray) {
        await this.addFlowerKnowledge(data);
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      console.log(`Added ${dataArray.length} flower knowledge entries`);
    } catch (error) {
      console.error('Error adding multiple flower knowledge:', error);
      throw error;
    }
  }

  /**
   * Update existing flower knowledge
   */
  async updateFlowerKnowledge(id: string, data: Partial<FlowerCareData>): Promise<void> {
    try {
      let embedding: number[] | undefined;

      // If any text fields are updated, regenerate embedding
      if (data.care_requirements || data.optimal_temperature || data.optimal_humidity || 
          data.water_requirements || data.ethylene_sensitivity || data.common_issues || 
          data.vase_life_tips) {
        
        // Get current data to combine with updates
        const { data: currentData } = await supabase
          .from('flower_knowledge')
          .select('*')
          .eq('id', id)
          .single();

        if (currentData) {
          const updatedData = { ...currentData, ...data };
          embedding = await this.generateEmbedding(updatedData as FlowerCareData);
        }
      }

      // Update database
      const updateData: any = { ...data };
      if (embedding) {
        updateData.embedding = embedding;
      }

      const { error } = await supabase
        .from('flower_knowledge')
        .update(updateData)
        .eq('id', id);

      if (error) {
        throw error;
      }

      console.log(`Updated knowledge for ID: ${id}`);
    } catch (error) {
      console.error('Error updating flower knowledge:', error);
      throw error;
    }
  }

  /**
   * Delete flower knowledge entry
   */
  async deleteFlowerKnowledge(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('flower_knowledge')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      console.log(`Deleted knowledge entry: ${id}`);
    } catch (error) {
      console.error('Error deleting flower knowledge:', error);
      throw error;
    }
  }

  /**
   * Get all flower knowledge entries
   */
  async getAllFlowerKnowledge(): Promise<FlowerKnowledge[]> {
    try {
      const { data, error } = await supabase
        .from('flower_knowledge')
        .select('*')
        .order('flower_type', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting flower knowledge:', error);
      throw error;
    }
  }

  /**
   * Search flower knowledge by type
   */
  async searchFlowerKnowledge(flowerType: string): Promise<FlowerKnowledge[]> {
    try {
      const { data, error } = await supabase
        .from('flower_knowledge')
        .select('*')
        .ilike('flower_type', `%${flowerType}%`)
        .order('flower_type', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error searching flower knowledge:', error);
      throw error;
    }
  }

  /**
   * Regenerate embeddings for all entries (useful if embedding model changes)
   */
  async regenerateAllEmbeddings(): Promise<void> {
    try {
      const allKnowledge = await this.getAllFlowerKnowledge();
      
      for (const knowledge of allKnowledge) {
        const embedding = await this.generateEmbedding(knowledge);
        
        const { error } = await supabase
          .from('flower_knowledge')
          .update({ embedding })
          .eq('id', knowledge.id);

        if (error) {
          console.error(`Error updating embedding for ${knowledge.id}:`, error);
        } else {
          console.log(`Updated embedding for ${knowledge.flower_type}`);
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log('Completed regenerating all embeddings');
    } catch (error) {
      console.error('Error regenerating embeddings:', error);
      throw error;
    }
  }

  /**
   * Get knowledge base statistics
   */
  async getKnowledgeBaseStats(): Promise<{
    totalEntries: number;
    flowerTypes: string[];
    varieties: string[];
  }> {
    try {
      const allKnowledge = await this.getAllFlowerKnowledge();
      
      const flowerTypes = [...new Set(allKnowledge.map(k => k.flower_type))];
      const varieties = [...new Set(allKnowledge.map(k => k.variety).filter(Boolean))];

      return {
        totalEntries: allKnowledge.length,
        flowerTypes,
        varieties,
      };
    } catch (error) {
      console.error('Error getting knowledge base stats:', error);
      throw error;
    }
  }
}

export const knowledgeManager = new KnowledgeManager(); 