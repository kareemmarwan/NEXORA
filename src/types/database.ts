export type UserRole = 'customer' | 'admin';
export type PriceType = 'one_time' | 'monthly';
export type OrderStatus =
  | 'pending_payment'
  | 'payment_review'
  | 'paid'
  | 'in_progress'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded';
export type PaymentMethodType = 'manual' | 'stripe';
export type PaymentStatus = 'unpaid' | 'under_review' | 'paid' | 'failed' | 'refunded';
export type ProofStatus = 'pending' | 'approved' | 'rejected';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface ServiceFaq {
  q_ar: string;
  a_ar: string;
  q_en: string;
  a_en: string;
}

export interface OrderItemAddonSnapshot {
  id: string;
  title_ar: string;
  title_en: string;
  price: number;
  extra_days: number;
}

export type BriefAnswers = Record<
  string,
  {
    answers: string[];
    notes?: string;
  }
>;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          business_name: string | null;
          role: UserRole;
          preferred_locale: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          business_name?: string | null;
          role?: UserRole;
          preferred_locale?: string | null;
          created_at?: string;
        };
        Update: {
          full_name?: string | null;
          phone?: string | null;
          business_name?: string | null;
          role?: UserRole;
          preferred_locale?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          slug: string;
          name_ar: string;
          name_en: string;
          description_ar: string | null;
          description_en: string | null;
          icon: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name_ar: string;
          name_en: string;
          description_ar?: string | null;
          description_en?: string | null;
          icon?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          slug?: string;
          name_ar?: string;
          name_en?: string;
          description_ar?: string | null;
          description_en?: string | null;
          icon?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          category_id: string | null;
          slug: string;
          title_ar: string;
          title_en: string;
          short_desc_ar: string | null;
          short_desc_en: string | null;
          description_ar: string | null;
          description_en: string | null;
          price: number;
          currency: string;
          price_type: PriceType;
          delivery_days: number;
          revisions: number;
          features_ar: Json | null;
          features_en: Json | null;
          requirements_ar: Json | null;
          requirements_en: Json | null;
          faqs: Json | null;
          cover_image_url: string | null;
          is_featured: boolean;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          slug: string;
          title_ar: string;
          title_en: string;
          short_desc_ar?: string | null;
          short_desc_en?: string | null;
          description_ar?: string | null;
          description_en?: string | null;
          price: number;
          currency?: string;
          price_type?: PriceType;
          delivery_days?: number;
          revisions?: number;
          features_ar?: Json | null;
          features_en?: Json | null;
          requirements_ar?: Json | null;
          requirements_en?: Json | null;
          faqs?: Json | null;
          cover_image_url?: string | null;
          is_featured?: boolean;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string | null;
          slug?: string;
          title_ar?: string;
          title_en?: string;
          short_desc_ar?: string | null;
          short_desc_en?: string | null;
          description_ar?: string | null;
          description_en?: string | null;
          price?: number;
          currency?: string;
          price_type?: PriceType;
          delivery_days?: number;
          revisions?: number;
          features_ar?: Json | null;
          features_en?: Json | null;
          requirements_ar?: Json | null;
          requirements_en?: Json | null;
          faqs?: Json | null;
          cover_image_url?: string | null;
          is_featured?: boolean;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'services_category_id_fkey';
            columns: ['category_id'];
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          }
        ];
      };
      service_addons: {
        Row: {
          id: string;
          service_id: string;
          title_ar: string;
          title_en: string;
          price: number;
          extra_days: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          service_id: string;
          title_ar: string;
          title_en: string;
          price?: number;
          extra_days?: number;
          is_active?: boolean;
        };
        Update: {
          service_id?: string;
          title_ar?: string;
          title_en?: string;
          price?: number;
          extra_days?: number;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'service_addons_service_id_fkey';
            columns: ['service_id'];
            referencedRelation: 'services';
            referencedColumns: ['id'];
          }
        ];
      };
      payment_methods: {
        Row: {
          id: string;
          type: PaymentMethodType;
          label_ar: string;
          label_en: string;
          details_ar: string | null;
          details_en: string | null;
          is_active: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          type?: PaymentMethodType;
          label_ar: string;
          label_en: string;
          details_ar?: string | null;
          details_en?: string | null;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: {
          type?: PaymentMethodType;
          label_ar?: string;
          label_en?: string;
          details_ar?: string | null;
          details_en?: string | null;
          is_active?: boolean;
          sort_order?: number;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          user_id: string;
          status: OrderStatus;
          payment_method_type: PaymentMethodType;
          payment_method_id: string | null;
          payment_status: PaymentStatus;
          subtotal: number;
          total: number;
          currency: string;
          customer_notes: string | null;
          brief: Json | null;
          stripe_session_id: string | null;
          stripe_payment_intent_id: string | null;
          paid_at: string | null;
          delivered_at: string | null;
          delivery_notes: string | null;
          internal_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number?: string;
          user_id: string;
          status?: OrderStatus;
          payment_method_type: PaymentMethodType;
          payment_method_id?: string | null;
          payment_status?: PaymentStatus;
          subtotal: number;
          total: number;
          currency?: string;
          customer_notes?: string | null;
          brief?: Json | null;
          stripe_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          paid_at?: string | null;
          delivered_at?: string | null;
          delivery_notes?: string | null;
          internal_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: OrderStatus;
          payment_method_type?: PaymentMethodType;
          payment_method_id?: string | null;
          payment_status?: PaymentStatus;
          subtotal?: number;
          total?: number;
          currency?: string;
          customer_notes?: string | null;
          brief?: Json | null;
          stripe_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          paid_at?: string | null;
          delivered_at?: string | null;
          delivery_notes?: string | null;
          internal_notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'orders_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_payment_method_id_fkey';
            columns: ['payment_method_id'];
            referencedRelation: 'payment_methods';
            referencedColumns: ['id'];
          }
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          service_id: string | null;
          title_snapshot_ar: string;
          title_snapshot_en: string;
          unit_price: number;
          delivery_days: number;
          quantity: number;
          addons: Json | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          service_id?: string | null;
          title_snapshot_ar: string;
          title_snapshot_en: string;
          unit_price: number;
          delivery_days: number;
          quantity?: number;
          addons?: Json | null;
        };
        Update: {
          service_id?: string | null;
          title_snapshot_ar?: string;
          title_snapshot_en?: string;
          unit_price?: number;
          delivery_days?: number;
          quantity?: number;
          addons?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey';
            columns: ['order_id'];
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_service_id_fkey';
            columns: ['service_id'];
            referencedRelation: 'services';
            referencedColumns: ['id'];
          }
        ];
      };
      payment_proofs: {
        Row: {
          id: string;
          order_id: string;
          user_id: string;
          file_path: string;
          note: string | null;
          status: ProofStatus;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          user_id: string;
          file_path: string;
          note?: string | null;
          status?: ProofStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          file_path?: string;
          note?: string | null;
          status?: ProofStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'payment_proofs_order_id_fkey';
            columns: ['order_id'];
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          }
        ];
      };
      order_events: {
        Row: {
          id: string;
          order_id: string;
          type: string;
          from_status: OrderStatus | null;
          to_status: OrderStatus | null;
          actor_id: string | null;
          message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          type: string;
          from_status?: OrderStatus | null;
          to_status?: OrderStatus | null;
          actor_id?: string | null;
          message?: string | null;
          created_at?: string;
        };
        Update: {
          type?: string;
          from_status?: OrderStatus | null;
          to_status?: OrderStatus | null;
          actor_id?: string | null;
          message?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'order_events_order_id_fkey';
            columns: ['order_id'];
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          }
        ];
      };
      site_settings: {
        Row: {
          key: string;
          value_ar: string;
          value_en: string;
          updated_at: string;
        };
        Insert: {
          key: string;
          value_ar?: string;
          value_en?: string;
          updated_at?: string;
        };
        Update: {
          value_ar?: string;
          value_en?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      blog_posts: {
        Row: {
          id: string;
          slug: string;
          title_ar: string;
          title_en: string;
          excerpt_ar: string | null;
          excerpt_en: string | null;
          content_ar: string | null;
          content_en: string | null;
          cover_image_url: string | null;
          tags: Json | null;
          author_name: string | null;
          reading_minutes: number;
          is_published: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title_ar: string;
          title_en: string;
          excerpt_ar?: string | null;
          excerpt_en?: string | null;
          content_ar?: string | null;
          content_en?: string | null;
          cover_image_url?: string | null;
          tags?: Json | null;
          author_name?: string | null;
          reading_minutes?: number;
          is_published?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          slug?: string;
          title_ar?: string;
          title_en?: string;
          excerpt_ar?: string | null;
          excerpt_en?: string | null;
          content_ar?: string | null;
          content_en?: string | null;
          cover_image_url?: string | null;
          tags?: Json | null;
          author_name?: string | null;
          reading_minutes?: number;
          is_published?: boolean;
          published_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      site_content: {
        Row: {
          key: string;
          content_ar: Json;
          content_en: Json;
          updated_at: string;
        };
        Insert: {
          key: string;
          content_ar?: Json;
          content_en?: Json;
          updated_at?: string;
        };
        Update: {
          content_ar?: Json;
          content_en?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      price_type: PriceType;
      order_status: OrderStatus;
      payment_method_type: PaymentMethodType;
      payment_status: PaymentStatus;
      proof_status: ProofStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type Profile = Tables<'profiles'>;
export type Category = Tables<'categories'>;
export type Service = Tables<'services'>;
export type ServiceAddon = Tables<'service_addons'>;
export type PaymentMethod = Tables<'payment_methods'>;
export type Order = Tables<'orders'>;
export type OrderItem = Tables<'order_items'>;
export type PaymentProof = Tables<'payment_proofs'>;
export type OrderEvent = Tables<'order_events'>;

export type SiteSetting = Tables<'site_settings'>;
export type SiteContent = Tables<'site_content'>;
export type BlogPost = Tables<'blog_posts'>;

export type ServiceWithAddons = Service & {
  service_addons: ServiceAddon[];
  categories: Pick<Category, 'id' | 'slug' | 'name_ar' | 'name_en'> | null;
};

export type OrderWithDetails = Order & {
  order_items: OrderItem[];
  order_events: OrderEvent[];
  payment_proofs: PaymentProof[];
  payment_methods: Pick<PaymentMethod, 'id' | 'label_ar' | 'label_en' | 'type' | 'details_ar' | 'details_en'> | null;
  profiles: Pick<Profile, 'id' | 'full_name' | 'phone' | 'business_name'> | null;
};
