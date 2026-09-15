/**
 * Database types for Supabase.
 *
 * This mirrors the schema defined in `supabase/migrations`. After you provision
 * your project you can regenerate a fully-typed version with:
 *
 *   npx supabase gen types typescript --project-id <ref> > types/database.ts
 *
 * The hand-written version below keeps the app fully type-safe out of the box.
 */

export type Role = "admin" | "staff";
export type PriceType = "fixed" | "starting_from" | "custom";
export type InquiryStatus =
  | "new"
  | "contacted"
  | "confirmed"
  | "completed"
  | "cancelled";
export type ConversationStatus = "open" | "closed";
export type SenderType = "client" | "admin";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          role: Role;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          role?: Role;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          cover_image_url: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          cover_image_url?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      photos: {
        Row: {
          id: string;
          category_id: string | null;
          title: string | null;
          description: string | null;
          image_url: string;
          thumbnail_url: string | null;
          alt_text: string | null;
          storage_path: string;
          width: number | null;
          height: number | null;
          file_size: number | null;
          is_featured: boolean;
          is_published: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          title?: string | null;
          description?: string | null;
          image_url: string;
          thumbnail_url?: string | null;
          alt_text?: string | null;
          storage_path: string;
          width?: number | null;
          height?: number | null;
          file_size?: number | null;
          is_featured?: boolean;
          is_published?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["photos"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "photos_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      services: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          price: number | null;
          price_type: PriceType;
          is_active: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          price?: number | null;
          price_type?: PriceType;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["services"]["Insert"]>;
        Relationships: [];
      };
      testimonials: {
        Row: {
          id: string;
          client_name: string;
          client_role: string | null;
          testimonial: string;
          image_url: string | null;
          rating: number | null;
          is_featured: boolean;
          is_published: boolean;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_name: string;
          client_role?: string | null;
          testimonial: string;
          image_url?: string | null;
          rating?: number | null;
          is_featured?: boolean;
          is_published?: boolean;
          display_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["testimonials"]["Insert"]>;
        Relationships: [];
      };
      inquiries: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string | null;
          service_id: string | null;
          preferred_date: string | null;
          preferred_time: string | null;
          location: string | null;
          number_of_people: number | null;
          message: string | null;
          status: InquiryStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          service_id?: string | null;
          preferred_date?: string | null;
          preferred_time?: string | null;
          location?: string | null;
          number_of_people?: number | null;
          message?: string | null;
          status?: InquiryStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["inquiries"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "inquiries_service_id_fkey";
            columns: ["service_id"];
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      conversations: {
        Row: {
          id: string;
          visitor_id: string | null;
          visitor_name: string;
          visitor_email: string | null;
          visitor_phone: string | null;
          status: ConversationStatus;
          last_message_at: string | null;
          admin_unread: number;
          client_unread: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          visitor_id?: string | null;
          visitor_name: string;
          visitor_email?: string | null;
          visitor_phone?: string | null;
          status?: ConversationStatus;
          last_message_at?: string | null;
          admin_unread?: number;
          client_unread?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["conversations"]["Insert"]>;
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_type: SenderType;
          sender_id: string | null;
          message: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_type: SenderType;
          sender_id?: string | null;
          message: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      site_settings: {
        Row: {
          id: number;
          studio_name: string;
          tagline: string | null;
          logo_url: string | null;
          favicon_url: string | null;
          phone: string | null;
          whatsapp: string | null;
          whatsapp_default_message: string | null;
          email: string | null;
          address: string | null;
          map_embed_url: string | null;
          opening_hours: string | null;
          instagram_url: string | null;
          facebook_url: string | null;
          tiktok_url: string | null;
          youtube_url: string | null;
          x_url: string | null;
          hero_image_url: string | null;
          hero_title: string | null;
          hero_subtitle: string | null;
          hero_labels: string | null;
          about_image_url: string | null;
          about_text: string | null;
          seo_title: string | null;
          seo_description: string | null;
          og_image_url: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["site_settings"]["Row"]> & {
          id?: number;
        };
        Update: Partial<Database["public"]["Tables"]["site_settings"]["Row"]>;
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
      user_role: Role;
      price_type: PriceType;
      inquiry_status: InquiryStatus;
      conversation_status: ConversationStatus;
      sender_type: SenderType;
    };
    CompositeTypes: Record<string, never>;
  };
}

// Convenience row aliases used throughout the app.
type Tables = Database["public"]["Tables"];
export type Profile = Tables["profiles"]["Row"];
export type Category = Tables["categories"]["Row"];
export type Photo = Tables["photos"]["Row"];
export type Service = Tables["services"]["Row"];
export type Testimonial = Tables["testimonials"]["Row"];
export type Inquiry = Tables["inquiries"]["Row"];
export type Conversation = Tables["conversations"]["Row"];
export type Message = Tables["messages"]["Row"];
export type SiteSettings = Tables["site_settings"]["Row"];

// Joined shapes returned by some queries.
export type PhotoWithCategory = Photo & { category: Category | null };
export type CategoryWithCount = Category & { photo_count: number };
export type InquiryWithService = Inquiry & { service: Service | null };
