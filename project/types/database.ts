export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      flower_batches: {
        Row: {
          id: string;
          user_id: string;
          flower_type: string;
          variety: string;
          quantity: number;
          unit_of_measure: string;
          purchase_date: string;
          expected_shelf_life: number;
          shelf_life_unit: string;
          supplier: string;
          initial_condition: 'Excellent' | 'Good' | 'Fair' | 'Poor';
          visual_notes: string | null;
          storage_environment: 'Refrigerated' | 'Room Temperature' | 'Other';
          water_type: string;
          humidity_level: string;
          floral_food_used: boolean;
          vase_cleanliness: 'Clean' | 'Rinsed' | 'Dirty';
          dynamic_spoilage_date: string;
          ai_prediction: number | null;
          ai_confidence: number | null;
          ai_reasoning: string | null;
          ai_recommendations: string[] | null;
          ai_last_updated: string | null;
          ai_detailed_prediction: {
            days: number;
            hours: number;
            minutes: number;
            totalHours: number;
          } | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          flower_type: string;
          variety: string;
          quantity: number;
          unit_of_measure?: string;
          purchase_date: string;
          expected_shelf_life: number;
          shelf_life_unit?: string;
          supplier: string;
          initial_condition?: 'Excellent' | 'Good' | 'Fair' | 'Poor';
          visual_notes?: string | null;
          storage_environment?: 'Refrigerated' | 'Room Temperature' | 'Other';
          water_type?: string;
          humidity_level?: string;
          floral_food_used?: boolean;
          vase_cleanliness?: 'Clean' | 'Rinsed' | 'Dirty';
          dynamic_spoilage_date: string;
          ai_prediction?: number | null;
          ai_confidence?: number | null;
          ai_reasoning?: string | null;
          ai_recommendations?: string[] | null;
          ai_last_updated?: string | null;
          ai_detailed_prediction?: {
            days: number;
            hours: number;
            minutes: number;
            totalHours: number;
          } | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          flower_type?: string;
          variety?: string;
          quantity?: number;
          unit_of_measure?: string;
          purchase_date?: string;
          expected_shelf_life?: number;
          shelf_life_unit?: string;
          supplier?: string;
          initial_condition?: 'Excellent' | 'Good' | 'Fair' | 'Poor';
          visual_notes?: string | null;
          storage_environment?: 'Refrigerated' | 'Room Temperature' | 'Other';
          water_type?: string;
          humidity_level?: string;
          floral_food_used?: boolean;
          vase_cleanliness?: 'Clean' | 'Rinsed' | 'Dirty';
          dynamic_spoilage_date?: string;
          ai_prediction?: number | null;
          ai_confidence?: number | null;
          ai_reasoning?: string | null;
          ai_recommendations?: string[] | null;
          ai_last_updated?: string | null;
          ai_detailed_prediction?: {
            days: number;
            hours: number;
            minutes: number;
            totalHours: number;
          } | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type FlowerBatch = Database['public']['Tables']['flower_batches']['Row'];
export type FlowerBatchInsert = Database['public']['Tables']['flower_batches']['Insert'];