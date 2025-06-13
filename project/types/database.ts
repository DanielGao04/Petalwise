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
          initial_condition: string;
          visual_notes: string | null;
          storage_environment: string;
          water_type: string;
          humidity_level: string;
          floral_food_used: boolean;
          vase_cleanliness: string;
          dynamic_spoilage_date: string;
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
          initial_condition?: string;
          visual_notes?: string | null;
          storage_environment?: string;
          water_type?: string;
          humidity_level?: string;
          floral_food_used?: boolean;
          vase_cleanliness?: string;
          dynamic_spoilage_date: string;
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
          initial_condition?: string;
          visual_notes?: string | null;
          storage_environment?: string;
          water_type?: string;
          humidity_level?: string;
          floral_food_used?: boolean;
          vase_cleanliness?: string;
          dynamic_spoilage_date?: string;
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