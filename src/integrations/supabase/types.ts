export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin: {
        Row: {
          created_at: string | null
          email: string
          id: string
          password_hash: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          password_hash: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          password_hash?: string
        }
        Relationships: []
      }
      almanac_character_images: {
        Row: {
          caption: string | null
          character_id: string
          created_at: string | null
          id: string
          image_url: string
          order_index: number | null
        }
        Insert: {
          caption?: string | null
          character_id: string
          created_at?: string | null
          id?: string
          image_url: string
          order_index?: number | null
        }
        Update: {
          caption?: string | null
          character_id?: string
          created_at?: string | null
          id?: string
          image_url?: string
          order_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "almanac_character_images_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "almanac_characters"
            referencedColumns: ["id"]
          },
        ]
      }
      almanac_characters: {
        Row: {
          abilities: string | null
          affiliation: string | null
          article: string
          created_at: string | null
          description: string
          era: string | null
          id: string
          image_url: string | null
          is_disabled: boolean | null
          name: string
          order_index: number | null
          origin_location_id: string | null
          promo_book_id: string | null
          promo_enabled: boolean | null
          promo_link: string | null
          promo_text: string | null
          relationships: string | null
          role: string | null
          slug: string
          species: string | null
          updated_at: string | null
        }
        Insert: {
          abilities?: string | null
          affiliation?: string | null
          article: string
          created_at?: string | null
          description: string
          era?: string | null
          id?: string
          image_url?: string | null
          is_disabled?: boolean | null
          name: string
          order_index?: number | null
          origin_location_id?: string | null
          promo_book_id?: string | null
          promo_enabled?: boolean | null
          promo_link?: string | null
          promo_text?: string | null
          relationships?: string | null
          role?: string | null
          slug: string
          species?: string | null
          updated_at?: string | null
        }
        Update: {
          abilities?: string | null
          affiliation?: string | null
          article?: string
          created_at?: string | null
          description?: string
          era?: string | null
          id?: string
          image_url?: string | null
          is_disabled?: boolean | null
          name?: string
          order_index?: number | null
          origin_location_id?: string | null
          promo_book_id?: string | null
          promo_enabled?: boolean | null
          promo_link?: string | null
          promo_text?: string | null
          relationships?: string | null
          role?: string | null
          slug?: string
          species?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "almanac_characters_origin_location_id_fkey"
            columns: ["origin_location_id"]
            isOneToOne: false
            referencedRelation: "world_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "almanac_characters_promo_book_id_fkey"
            columns: ["promo_book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      almanac_concepts: {
        Row: {
          article: string
          concept_type: string | null
          created_at: string | null
          description: string
          id: string
          image_url: string | null
          is_disabled: boolean | null
          name: string
          order_index: number | null
          promo_book_id: string | null
          promo_enabled: boolean | null
          promo_link: string | null
          promo_text: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          article: string
          concept_type?: string | null
          created_at?: string | null
          description: string
          id?: string
          image_url?: string | null
          is_disabled?: boolean | null
          name: string
          order_index?: number | null
          promo_book_id?: string | null
          promo_enabled?: boolean | null
          promo_link?: string | null
          promo_text?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          article?: string
          concept_type?: string | null
          created_at?: string | null
          description?: string
          id?: string
          image_url?: string | null
          is_disabled?: boolean | null
          name?: string
          order_index?: number | null
          promo_book_id?: string | null
          promo_enabled?: boolean | null
          promo_link?: string | null
          promo_text?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "almanac_concepts_promo_book_id_fkey"
            columns: ["promo_book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      almanac_entry_images: {
        Row: {
          caption: string | null
          category: string
          created_at: string | null
          entry_id: string
          id: string
          image_url: string
          order_index: number | null
        }
        Insert: {
          caption?: string | null
          category: string
          created_at?: string | null
          entry_id: string
          id?: string
          image_url: string
          order_index?: number | null
        }
        Update: {
          caption?: string | null
          category?: string
          created_at?: string | null
          entry_id?: string
          id?: string
          image_url?: string
          order_index?: number | null
        }
        Relationships: []
      }
      almanac_kingdoms: {
        Row: {
          article: string
          created_at: string | null
          description: string
          founded_date: string | null
          id: string
          image_url: string | null
          is_disabled: boolean | null
          name: string
          order_index: number | null
          promo_book_id: string | null
          promo_enabled: boolean | null
          promo_link: string | null
          promo_text: string | null
          slug: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          article: string
          created_at?: string | null
          description: string
          founded_date?: string | null
          id?: string
          image_url?: string | null
          is_disabled?: boolean | null
          name: string
          order_index?: number | null
          promo_book_id?: string | null
          promo_enabled?: boolean | null
          promo_link?: string | null
          promo_text?: string | null
          slug: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          article?: string
          created_at?: string | null
          description?: string
          founded_date?: string | null
          id?: string
          image_url?: string | null
          is_disabled?: boolean | null
          name?: string
          order_index?: number | null
          promo_book_id?: string | null
          promo_enabled?: boolean | null
          promo_link?: string | null
          promo_text?: string | null
          slug?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "almanac_kingdoms_promo_book_id_fkey"
            columns: ["promo_book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      almanac_locations: {
        Row: {
          article: string
          created_at: string | null
          description: string
          id: string
          image_url: string | null
          is_disabled: boolean | null
          kingdom: string | null
          location_type: string | null
          name: string
          order_index: number | null
          promo_book_id: string | null
          promo_enabled: boolean | null
          promo_link: string | null
          promo_text: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          article: string
          created_at?: string | null
          description: string
          id?: string
          image_url?: string | null
          is_disabled?: boolean | null
          kingdom?: string | null
          location_type?: string | null
          name: string
          order_index?: number | null
          promo_book_id?: string | null
          promo_enabled?: boolean | null
          promo_link?: string | null
          promo_text?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          article?: string
          created_at?: string | null
          description?: string
          id?: string
          image_url?: string | null
          is_disabled?: boolean | null
          kingdom?: string | null
          location_type?: string | null
          name?: string
          order_index?: number | null
          promo_book_id?: string | null
          promo_enabled?: boolean | null
          promo_link?: string | null
          promo_text?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "almanac_locations_promo_book_id_fkey"
            columns: ["promo_book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      almanac_magic: {
        Row: {
          article: string
          created_at: string | null
          description: string
          difficulty: string | null
          id: string
          image_url: string | null
          is_disabled: boolean | null
          magic_type: string | null
          name: string
          order_index: number | null
          promo_book_id: string | null
          promo_enabled: boolean | null
          promo_link: string | null
          promo_text: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          article: string
          created_at?: string | null
          description: string
          difficulty?: string | null
          id?: string
          image_url?: string | null
          is_disabled?: boolean | null
          magic_type?: string | null
          name: string
          order_index?: number | null
          promo_book_id?: string | null
          promo_enabled?: boolean | null
          promo_link?: string | null
          promo_text?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          article?: string
          created_at?: string | null
          description?: string
          difficulty?: string | null
          id?: string
          image_url?: string | null
          is_disabled?: boolean | null
          magic_type?: string | null
          name?: string
          order_index?: number | null
          promo_book_id?: string | null
          promo_enabled?: boolean | null
          promo_link?: string | null
          promo_text?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "almanac_magic_promo_book_id_fkey"
            columns: ["promo_book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      almanac_races: {
        Row: {
          article: string
          created_at: string | null
          description: string
          homeland: string | null
          id: string
          image_url: string | null
          is_disabled: boolean | null
          name: string
          order_index: number | null
          population: string | null
          promo_book_id: string | null
          promo_enabled: boolean | null
          promo_link: string | null
          promo_text: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          article: string
          created_at?: string | null
          description: string
          homeland?: string | null
          id?: string
          image_url?: string | null
          is_disabled?: boolean | null
          name: string
          order_index?: number | null
          population?: string | null
          promo_book_id?: string | null
          promo_enabled?: boolean | null
          promo_link?: string | null
          promo_text?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          article?: string
          created_at?: string | null
          description?: string
          homeland?: string | null
          id?: string
          image_url?: string | null
          is_disabled?: boolean | null
          name?: string
          order_index?: number | null
          population?: string | null
          promo_book_id?: string | null
          promo_enabled?: boolean | null
          promo_link?: string | null
          promo_text?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "almanac_races_promo_book_id_fkey"
            columns: ["promo_book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      almanac_relics: {
        Row: {
          article: string
          created_at: string | null
          description: string
          id: string
          image_url: string | null
          is_disabled: boolean | null
          name: string
          order_index: number | null
          power_level: string | null
          promo_book_id: string | null
          promo_enabled: boolean | null
          promo_link: string | null
          promo_text: string | null
          slug: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          article: string
          created_at?: string | null
          description: string
          id?: string
          image_url?: string | null
          is_disabled?: boolean | null
          name: string
          order_index?: number | null
          power_level?: string | null
          promo_book_id?: string | null
          promo_enabled?: boolean | null
          promo_link?: string | null
          promo_text?: string | null
          slug: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          article?: string
          created_at?: string | null
          description?: string
          id?: string
          image_url?: string | null
          is_disabled?: boolean | null
          name?: string
          order_index?: number | null
          power_level?: string | null
          promo_book_id?: string | null
          promo_enabled?: boolean | null
          promo_link?: string | null
          promo_text?: string | null
          slug?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "almanac_relics_promo_book_id_fkey"
            columns: ["promo_book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      almanac_titles: {
        Row: {
          article: string
          authority: string | null
          created_at: string | null
          description: string
          id: string
          image_url: string | null
          is_disabled: boolean | null
          name: string
          order_index: number | null
          promo_book_id: string | null
          promo_enabled: boolean | null
          promo_link: string | null
          promo_text: string | null
          rank: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          article: string
          authority?: string | null
          created_at?: string | null
          description: string
          id?: string
          image_url?: string | null
          is_disabled?: boolean | null
          name: string
          order_index?: number | null
          promo_book_id?: string | null
          promo_enabled?: boolean | null
          promo_link?: string | null
          promo_text?: string | null
          rank?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          article?: string
          authority?: string | null
          created_at?: string | null
          description?: string
          id?: string
          image_url?: string | null
          is_disabled?: boolean | null
          name?: string
          order_index?: number | null
          promo_book_id?: string | null
          promo_enabled?: boolean | null
          promo_link?: string | null
          promo_text?: string | null
          rank?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "almanac_titles_promo_book_id_fkey"
            columns: ["promo_book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      badge_types: {
        Row: {
          created_at: string
          criteria: string
          description: string
          icon: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          criteria: string
          description: string
          icon: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          criteria?: string
          description?: string
          icon?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      book_club_discussions: {
        Row: {
          author_id: string
          book_id: string | null
          chapter: string | null
          club_id: string
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          book_id?: string | null
          chapter?: string | null
          club_id: string
          content: string
          created_at?: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          book_id?: string | null
          chapter?: string | null
          club_id?: string
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_club_discussions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "book_clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      book_club_members: {
        Row: {
          club_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          club_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          club_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "book_clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      book_clubs: {
        Row: {
          cover_image_url: string | null
          created_at: string
          current_book_id: string | null
          description: string | null
          id: string
          is_private: boolean
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          current_book_id?: string | null
          description?: string | null
          id?: string
          is_private?: boolean
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          current_book_id?: string | null
          description?: string | null
          id?: string
          is_private?: boolean
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      book_external_links: {
        Row: {
          book_id: string
          created_at: string
          format_type: string
          id: string
          order_index: number | null
          store_name: string
          updated_at: string
          url: string
        }
        Insert: {
          book_id: string
          created_at?: string
          format_type: string
          id?: string
          order_index?: number | null
          store_name: string
          updated_at?: string
          url: string
        }
        Update: {
          book_id?: string
          created_at?: string
          format_type?: string
          id?: string
          order_index?: number | null
          store_name?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_external_links_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      book_highlights: {
        Row: {
          book_id: string
          color: string
          created_at: string
          end_offset: number
          id: string
          page_number: number
          start_offset: number
          text_content: string
          updated_at: string
          user_id: string
        }
        Insert: {
          book_id: string
          color?: string
          created_at?: string
          end_offset: number
          id?: string
          page_number: number
          start_offset: number
          text_content: string
          updated_at?: string
          user_id: string
        }
        Update: {
          book_id?: string
          color?: string
          created_at?: string
          end_offset?: number
          id?: string
          page_number?: number
          start_offset?: number
          text_content?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      book_notes: {
        Row: {
          book_id: string
          content: string
          created_at: string
          highlight_id: string | null
          id: string
          page_number: number
          updated_at: string
          user_id: string
        }
        Insert: {
          book_id: string
          content: string
          created_at?: string
          highlight_id?: string | null
          id?: string
          page_number: number
          updated_at?: string
          user_id: string
        }
        Update: {
          book_id?: string
          content?: string
          created_at?: string
          highlight_id?: string | null
          id?: string
          page_number?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_notes_highlight_id_fkey"
            columns: ["highlight_id"]
            isOneToOne: false
            referencedRelation: "book_highlights"
            referencedColumns: ["id"]
          },
        ]
      }
      book_versions: {
        Row: {
          available: boolean | null
          book_id: string
          created_at: string | null
          id: string
          price: number
          version_type: string
        }
        Insert: {
          available?: boolean | null
          book_id: string
          created_at?: string | null
          id?: string
          price: number
          version_type: string
        }
        Update: {
          available?: boolean | null
          book_id?: string
          created_at?: string | null
          id?: string
          price?: number
          version_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_versions_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          book_id: string
          created_at: string
          id: string
          label: string | null
          page_number: number
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string
          id?: string
          label?: string | null
          page_number: number
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string
          id?: string
          label?: string | null
          page_number?: number
          user_id?: string
        }
        Relationships: []
      }
      books: {
        Row: {
          author: string
          category: string
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          ebook_pdf_url: string | null
          id: string
          isbn: string | null
          language: string | null
          pages: number | null
          preview_pdf_url: string | null
          published_date: string | null
          rating: number | null
          sales: number | null
          status: string
          stock: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author: string
          category: string
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          ebook_pdf_url?: string | null
          id?: string
          isbn?: string | null
          language?: string | null
          pages?: number | null
          preview_pdf_url?: string | null
          published_date?: string | null
          rating?: number | null
          sales?: number | null
          status?: string
          stock?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author?: string
          category?: string
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          ebook_pdf_url?: string | null
          id?: string
          isbn?: string | null
          language?: string | null
          pages?: number | null
          preview_pdf_url?: string | null
          published_date?: string | null
          rating?: number | null
          sales?: number | null
          status?: string
          stock?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      character_event_links: {
        Row: {
          character_id: string
          created_at: string
          description: string | null
          event_id: string
          id: string
          role: string | null
          role_in_event: string | null
        }
        Insert: {
          character_id: string
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          role?: string | null
          role_in_event?: string | null
        }
        Update: {
          character_id?: string
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          role?: string | null
          role_in_event?: string | null
        }
        Relationships: []
      }
      character_relationships: {
        Row: {
          character_id: string | null
          created_at: string
          description: string | null
          id: string
          related_character_id: string | null
          relationship_type: string
          source_character_id: string | null
          target_character_id: string | null
        }
        Insert: {
          character_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          related_character_id?: string | null
          relationship_type: string
          source_character_id?: string | null
          target_character_id?: string | null
        }
        Update: {
          character_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          related_character_id?: string | null
          relationship_type?: string
          source_character_id?: string | null
          target_character_id?: string | null
        }
        Relationships: []
      }
      character_stats: {
        Row: {
          agility: number | null
          character_id: string
          charisma: number | null
          created_at: string
          endurance: number | null
          id: string
          intelligence: number | null
          magic: number | null
          strength: number | null
          updated_at: string
        }
        Insert: {
          agility?: number | null
          character_id: string
          charisma?: number | null
          created_at?: string
          endurance?: number | null
          id?: string
          intelligence?: number | null
          magic?: number | null
          strength?: number | null
          updated_at?: string
        }
        Update: {
          agility?: number | null
          character_id?: string
          charisma?: number | null
          created_at?: string
          endurance?: number | null
          id?: string
          intelligence?: number | null
          magic?: number | null
          strength?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_stats_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: true
            referencedRelation: "almanac_characters"
            referencedColumns: ["id"]
          },
        ]
      }
      chronology_event_relationships: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          relationship_type: string
          source_event_id: string
          target_event_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          relationship_type: string
          source_event_id: string
          target_event_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          relationship_type?: string
          source_event_id?: string
          target_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chronology_event_relationships_source_event_id_fkey"
            columns: ["source_event_id"]
            isOneToOne: false
            referencedRelation: "chronology_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chronology_event_relationships_target_event_id_fkey"
            columns: ["target_event_id"]
            isOneToOne: false
            referencedRelation: "chronology_events"
            referencedColumns: ["id"]
          },
        ]
      }
      chronology_events: {
        Row: {
          article: string
          created_at: string
          date: string
          description: string
          era: string
          id: string
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          article: string
          created_at?: string
          date: string
          description: string
          era: string
          id?: string
          order_index: number
          title: string
          updated_at?: string
        }
        Update: {
          article?: string
          created_at?: string
          date?: string
          description?: string
          era?: string
          id?: string
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          postal_code: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      discussion_replies: {
        Row: {
          author_id: string
          content: string
          created_at: string
          discussion_id: string
          id: string
          parent_reply_id: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          discussion_id: string
          id?: string
          parent_reply_id?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          discussion_id?: string
          id?: string
          parent_reply_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_replies_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "book_club_discussions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_replies_parent_reply_id_fkey"
            columns: ["parent_reply_id"]
            isOneToOne: false
            referencedRelation: "discussion_replies"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          post_id: string | null
          reply_id: string | null
          triggered_by_user_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          post_id?: string | null
          reply_id?: string | null
          triggered_by_user_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          post_id?: string | null
          reply_id?: string | null
          triggered_by_user_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_notifications_triggered_by_user_id_fkey"
            columns: ["triggered_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_poll_options: {
        Row: {
          created_at: string
          id: string
          option_text: string
          order_index: number
          poll_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_text: string
          order_index?: number
          poll_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_text?: string
          order_index?: number
          poll_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "forum_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_poll_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "forum_poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "forum_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_polls: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          post_id: string
          question: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          post_id: string
          question: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          post_id?: string
          question?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_polls_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_post_tags: {
        Row: {
          id: string
          post_id: string
          tag_id: string
        }
        Insert: {
          id?: string
          post_id: string
          tag_id: string
        }
        Update: {
          id?: string
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "post_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          author_id: string
          category: string
          content: string
          created_at: string
          id: string
          is_sticky: boolean
          likes_count: number
          parent_post_id: string | null
          replies_count: number
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          category: string
          content: string
          created_at?: string
          id?: string
          is_sticky?: boolean
          likes_count?: number
          parent_post_id?: string | null
          replies_count?: number
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_sticky?: boolean
          likes_count?: number
          parent_post_id?: string | null
          replies_count?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_author_id_profiles_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_parent_post_id_fkey"
            columns: ["parent_post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_replies: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          likes_count: number
          parent_reply_id: string | null
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          parent_reply_id?: string | null
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          parent_reply_id?: string | null
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_author_id_profiles_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_replies_parent_reply_id_fkey"
            columns: ["parent_reply_id"]
            isOneToOne: false
            referencedRelation: "forum_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_reply_likes: {
        Row: {
          created_at: string
          id: string
          reply_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reply_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reply_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_reply_likes_reply_id_fkey"
            columns: ["reply_id"]
            isOneToOne: false
            referencedRelation: "forum_replies"
            referencedColumns: ["id"]
          },
        ]
      }
      lore_characters: {
        Row: {
          affiliation: string | null
          age: string | null
          article: string | null
          created_at: string
          description: string | null
          era: string | null
          id: string
          image_url: string | null
          lore: string | null
          name: string
          nationality: string | null
          order_index: number | null
          physical_appearance: string | null
          quirks: string | null
          race: string | null
          role: string | null
          slug: string | null
          updated_at: string
        }
        Insert: {
          affiliation?: string | null
          age?: string | null
          article?: string | null
          created_at?: string
          description?: string | null
          era?: string | null
          id?: string
          image_url?: string | null
          lore?: string | null
          name: string
          nationality?: string | null
          order_index?: number | null
          physical_appearance?: string | null
          quirks?: string | null
          race?: string | null
          role?: string | null
          slug?: string | null
          updated_at?: string
        }
        Update: {
          affiliation?: string | null
          age?: string | null
          article?: string | null
          created_at?: string
          description?: string | null
          era?: string | null
          id?: string
          image_url?: string | null
          lore?: string | null
          name?: string
          nationality?: string | null
          order_index?: number | null
          physical_appearance?: string | null
          quirks?: string | null
          race?: string | null
          role?: string | null
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          book_id: string
          created_at: string | null
          id: string
          order_id: string
          price: number
          quantity: number
          version_type: string
        }
        Insert: {
          book_id: string
          created_at?: string | null
          id?: string
          order_id: string
          price: number
          quantity?: number
          version_type: string
        }
        Update: {
          book_id?: string
          created_at?: string | null
          id?: string
          order_id?: string
          price?: number
          quantity?: number
          version_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          customer_id: string
          id: string
          order_number: string
          status: string
          subtotal: number
          tax: number
          total: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id?: string
          order_number: string
          status?: string
          subtotal: number
          tax: number
          total: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: string
          order_number?: string
          status?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      post_tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          slug: string
          usage_count: number
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          slug: string
          usage_count?: number
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
          usage_count?: number
        }
        Relationships: []
      }
      private_conversations: {
        Row: {
          created_at: string
          id: string
          participant_one: string
          participant_two: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          participant_one: string
          participant_two: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          participant_one?: string
          participant_two?: string
          updated_at?: string
        }
        Relationships: []
      }
      private_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "private_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          last_active: string | null
          lore_contributions: number | null
          total_forum_posts: number
          total_forum_replies: number
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          last_active?: string | null
          lore_contributions?: number | null
          total_forum_posts?: number
          total_forum_replies?: number
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          last_active?: string | null
          lore_contributions?: number | null
          total_forum_posts?: number
          total_forum_replies?: number
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          book_author: string
          book_cover_url: string | null
          book_id: string
          book_title: string
          book_version: string
          id: string
          price: number
          purchased_at: string
          user_id: string
        }
        Insert: {
          book_author: string
          book_cover_url?: string | null
          book_id: string
          book_title: string
          book_version: string
          id?: string
          price: number
          purchased_at?: string
          user_id: string
        }
        Update: {
          book_author?: string
          book_cover_url?: string | null
          book_id?: string
          book_title?: string
          book_version?: string
          id?: string
          price?: number
          purchased_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reading_progress: {
        Row: {
          book_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          current_page: number
          id: string
          last_read_at: string
          progress_percentage: number
          time_spent_seconds: number
          total_pages: number
          updated_at: string
          user_id: string
        }
        Insert: {
          book_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_page?: number
          id?: string
          last_read_at?: string
          progress_percentage?: number
          time_spent_seconds?: number
          total_pages?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          book_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          current_page?: number
          id?: string
          last_read_at?: string
          progress_percentage?: number
          time_spent_seconds?: number
          total_pages?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reading_streaks: {
        Row: {
          created_at: string | null
          current_streak: number
          id: string
          last_read_date: string | null
          longest_streak: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number
          id?: string
          last_read_date?: string | null
          longest_streak?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number
          id?: string
          last_read_date?: string | null
          longest_streak?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          book_id: string
          comment: string
          created_at: string
          id: string
          rating: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          book_id: string
          comment: string
          created_at?: string
          id?: string
          rating: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          book_id?: string
          comment?: string
          created_at?: string
          id?: string
          rating?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rp_abilities: {
        Row: {
          ability_type: string
          created_at: string
          description: string
          icon: string | null
          id: string
          name: string
          rarity: string
          stat_bonus: Json | null
          unlock_requirements: Json | null
        }
        Insert: {
          ability_type?: string
          created_at?: string
          description: string
          icon?: string | null
          id?: string
          name: string
          rarity?: string
          stat_bonus?: Json | null
          unlock_requirements?: Json | null
        }
        Update: {
          ability_type?: string
          created_at?: string
          description?: string
          icon?: string | null
          id?: string
          name?: string
          rarity?: string
          stat_bonus?: Json | null
          unlock_requirements?: Json | null
        }
        Relationships: []
      }
      rp_action_definitions: {
        Row: {
          action_type: string
          campaign_id: string
          category: string | null
          cooldown_turns: number | null
          created_at: string
          description: string | null
          detection_difficulty: number | null
          failure_effect: Json | null
          id: string
          is_detectable: boolean | null
          is_enabled: boolean
          name: string
          required_item: string | null
          required_range: string
          required_stat: string | null
          required_stat_value: number | null
          success_effect: Json | null
        }
        Insert: {
          action_type: string
          campaign_id: string
          category?: string | null
          cooldown_turns?: number | null
          created_at?: string
          description?: string | null
          detection_difficulty?: number | null
          failure_effect?: Json | null
          id?: string
          is_detectable?: boolean | null
          is_enabled?: boolean
          name: string
          required_item?: string | null
          required_range?: string
          required_stat?: string | null
          required_stat_value?: number | null
          success_effect?: Json | null
        }
        Update: {
          action_type?: string
          campaign_id?: string
          category?: string | null
          cooldown_turns?: number | null
          created_at?: string
          description?: string | null
          detection_difficulty?: number | null
          failure_effect?: Json | null
          id?: string
          is_detectable?: boolean | null
          is_enabled?: boolean
          name?: string
          required_item?: string | null
          required_range?: string
          required_stat?: string | null
          required_stat_value?: number | null
          success_effect?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "rp_action_definitions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "rp_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_action_log: {
        Row: {
          action_category: string | null
          action_type: string
          actor_id: string
          executed_at: string
          id: string
          outcome: Json | null
          session_id: string
          stat_check_result: Json | null
          target_id: string | null
          was_detected: boolean | null
          witnesses: Json | null
        }
        Insert: {
          action_category?: string | null
          action_type: string
          actor_id: string
          executed_at?: string
          id?: string
          outcome?: Json | null
          session_id: string
          stat_check_result?: Json | null
          target_id?: string | null
          was_detected?: boolean | null
          witnesses?: Json | null
        }
        Update: {
          action_category?: string | null
          action_type?: string
          actor_id?: string
          executed_at?: string
          id?: string
          outcome?: Json | null
          session_id?: string
          stat_check_result?: Json | null
          target_id?: string | null
          was_detected?: boolean | null
          witnesses?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "rp_action_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "rp_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_action_log_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "rp_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_action_log_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "rp_characters"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_ai_narration_log: {
        Row: {
          character_id: string | null
          created_at: string
          id: string
          model_used: string | null
          narration_text: string
          node_id: string | null
          prompt_hash: string | null
          session_id: string | null
          tokens_used: number | null
        }
        Insert: {
          character_id?: string | null
          created_at?: string
          id?: string
          model_used?: string | null
          narration_text: string
          node_id?: string | null
          prompt_hash?: string | null
          session_id?: string | null
          tokens_used?: number | null
        }
        Update: {
          character_id?: string | null
          created_at?: string
          id?: string
          model_used?: string | null
          narration_text?: string
          node_id?: string | null
          prompt_hash?: string | null
          session_id?: string | null
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rp_ai_narration_log_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "rp_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_ai_narration_log_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "rp_story_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_ai_narration_log_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "rp_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_bluff_attempts: {
        Row: {
          actor_id: string
          attempt_type: string
          created_at: string
          difficulty: number
          id: string
          revealed_info: Json | null
          roll_value: number
          session_id: string
          stat_used: string
          success: boolean
          target_id: string
        }
        Insert: {
          actor_id: string
          attempt_type: string
          created_at?: string
          difficulty: number
          id?: string
          revealed_info?: Json | null
          roll_value: number
          session_id: string
          stat_used: string
          success: boolean
          target_id: string
        }
        Update: {
          actor_id?: string
          attempt_type?: string
          created_at?: string
          difficulty?: number
          id?: string
          revealed_info?: Json | null
          roll_value?: number
          session_id?: string
          stat_used?: string
          success?: boolean
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rp_bluff_attempts_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "rp_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_bluff_attempts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "rp_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_bluff_attempts_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "rp_characters"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_campaign_ai_config: {
        Row: {
          ai_enabled: boolean | null
          ai_narration_nodes: Json | null
          campaign_id: string
          created_at: string
          dm_instructions: string | null
          guardrails: Json | null
          id: string
          lore_context_ids: Json | null
          npc_voice_profiles: Json | null
          tone: string | null
          updated_at: string
        }
        Insert: {
          ai_enabled?: boolean | null
          ai_narration_nodes?: Json | null
          campaign_id: string
          created_at?: string
          dm_instructions?: string | null
          guardrails?: Json | null
          id?: string
          lore_context_ids?: Json | null
          npc_voice_profiles?: Json | null
          tone?: string | null
          updated_at?: string
        }
        Update: {
          ai_enabled?: boolean | null
          ai_narration_nodes?: Json | null
          campaign_id?: string
          created_at?: string
          dm_instructions?: string | null
          guardrails?: Json | null
          id?: string
          lore_context_ids?: Json | null
          npc_voice_profiles?: Json | null
          tone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rp_campaign_ai_config_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: true
            referencedRelation: "rp_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_campaign_endings_seen: {
        Row: {
          campaign_id: string
          ending_node_id: string
          id: string
          seen_at: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          ending_node_id: string
          id?: string
          seen_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          ending_node_id?: string
          id?: string
          seen_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rp_campaign_entry_points: {
        Row: {
          campaign_id: string
          created_at: string | null
          description: string | null
          entry_label: string
          faction_id: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          max_players: number | null
          order_index: number | null
          start_node_id: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          description?: string | null
          entry_label: string
          faction_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_players?: number | null
          order_index?: number | null
          start_node_id?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          description?: string | null
          entry_label?: string
          faction_id?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_players?: number | null
          order_index?: number | null
          start_node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rp_campaign_entry_points_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "rp_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_campaign_entry_points_faction_id_fkey"
            columns: ["faction_id"]
            isOneToOne: false
            referencedRelation: "rp_factions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_campaign_entry_points_start_node_id_fkey"
            columns: ["start_node_id"]
            isOneToOne: false
            referencedRelation: "rp_story_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_campaign_factions: {
        Row: {
          campaign_id: string
          color: string | null
          created_at: string | null
          description: string | null
          faction_id: string | null
          id: string
          image_url: string | null
          is_joinable: boolean | null
          name: string
          perks: Json | null
          updated_at: string | null
          values: Json | null
        }
        Insert: {
          campaign_id: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          faction_id?: string | null
          id?: string
          image_url?: string | null
          is_joinable?: boolean | null
          name: string
          perks?: Json | null
          updated_at?: string | null
          values?: Json | null
        }
        Update: {
          campaign_id?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          faction_id?: string | null
          id?: string
          image_url?: string | null
          is_joinable?: boolean | null
          name?: string
          perks?: Json | null
          updated_at?: string | null
          values?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "rp_campaign_factions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "rp_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_campaign_factions_faction_id_fkey"
            columns: ["faction_id"]
            isOneToOne: false
            referencedRelation: "rp_factions"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_campaign_npcs: {
        Row: {
          campaign_id: string
          created_at: string
          description: string | null
          expressions: Json | null
          id: string
          name: string
          portrait_url: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          description?: string | null
          expressions?: Json | null
          id?: string
          name: string
          portrait_url?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          description?: string | null
          expressions?: Json | null
          id?: string
          name?: string
          portrait_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rp_campaign_npcs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "rp_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_campaign_reviews: {
        Row: {
          campaign_id: string
          content: string | null
          created_at: string
          id: string
          rating: number
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          content?: string | null
          created_at?: string
          id?: string
          rating: number
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          content?: string | null
          created_at?: string
          id?: string
          rating?: number
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rp_campaign_reviews_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "rp_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_campaign_universe: {
        Row: {
          campaign_id: string
          created_at: string
          custom_stats: Json | null
          id: string
          mode: string
          rules_document: string | null
          updated_at: string
          world_description: string | null
          world_name: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          custom_stats?: Json | null
          id?: string
          mode?: string
          rules_document?: string | null
          updated_at?: string
          world_description?: string | null
          world_name?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          custom_stats?: Json | null
          id?: string
          mode?: string
          rules_document?: string | null
          updated_at?: string
          world_description?: string | null
          world_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rp_campaign_universe_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: true
            referencedRelation: "rp_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_campaigns: {
        Row: {
          author_id: string
          average_rating: number | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          difficulty: string
          estimated_duration: number | null
          genre: string
          id: string
          is_featured: boolean
          is_published: boolean
          permadeath: boolean
          play_count: number
          review_count: number | null
          start_node_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          average_rating?: number | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string
          estimated_duration?: number | null
          genre?: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          permadeath?: boolean
          play_count?: number
          review_count?: number | null
          start_node_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          average_rating?: number | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string
          estimated_duration?: number | null
          genre?: string
          id?: string
          is_featured?: boolean
          is_published?: boolean
          permadeath?: boolean
          play_count?: number
          review_count?: number | null
          start_node_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rp_campaigns_start_node_fkey"
            columns: ["start_node_id"]
            isOneToOne: false
            referencedRelation: "rp_story_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_cascade_log: {
        Row: {
          applied_at: string
          cascade_rule_id: string
          character_id: string
          context: Json
          id: string
          session_id: string
        }
        Insert: {
          applied_at?: string
          cascade_rule_id: string
          character_id: string
          context?: Json
          id?: string
          session_id: string
        }
        Update: {
          applied_at?: string
          cascade_rule_id?: string
          character_id?: string
          context?: Json
          id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rp_cascade_log_cascade_rule_id_fkey"
            columns: ["cascade_rule_id"]
            isOneToOne: false
            referencedRelation: "rp_cascade_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_cascade_log_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "rp_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_cascade_log_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "rp_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_cascade_rules: {
        Row: {
          campaign_id: string
          created_at: string
          effect_type: string
          effect_value: Json
          id: string
          is_active: boolean
          priority: number
          source_interaction_id: string
          source_outcome_type: string
          target_interaction_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          effect_type?: string
          effect_value?: Json
          id?: string
          is_active?: boolean
          priority?: number
          source_interaction_id: string
          source_outcome_type?: string
          target_interaction_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          effect_type?: string
          effect_value?: Json
          id?: string
          is_active?: boolean
          priority?: number
          source_interaction_id?: string
          source_outcome_type?: string
          target_interaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rp_cascade_rules_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "rp_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_character_abilities: {
        Row: {
          ability_id: string | null
          ability_name: string
          character_id: string
          description: string | null
          id: string
          source_node_id: string | null
          source_session_id: string | null
          unlocked_at: string
        }
        Insert: {
          ability_id?: string | null
          ability_name: string
          character_id: string
          description?: string | null
          id?: string
          source_node_id?: string | null
          source_session_id?: string | null
          unlocked_at?: string
        }
        Update: {
          ability_id?: string | null
          ability_name?: string
          character_id?: string
          description?: string | null
          id?: string
          source_node_id?: string | null
          source_session_id?: string | null
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rp_character_abilities_ability_id_fkey"
            columns: ["ability_id"]
            isOneToOne: false
            referencedRelation: "rp_abilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_character_abilities_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "rp_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_character_abilities_source_session_id_fkey"
            columns: ["source_session_id"]
            isOneToOne: false
            referencedRelation: "rp_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_character_faction_standing: {
        Row: {
          betrayed_at: string | null
          campaign_faction_id: string
          character_id: string
          created_at: string | null
          id: string
          is_member: boolean | null
          joined_at: string | null
          rank: string | null
          reputation_score: number | null
          session_id: string
          updated_at: string | null
        }
        Insert: {
          betrayed_at?: string | null
          campaign_faction_id: string
          character_id: string
          created_at?: string | null
          id?: string
          is_member?: boolean | null
          joined_at?: string | null
          rank?: string | null
          reputation_score?: number | null
          session_id: string
          updated_at?: string | null
        }
        Update: {
          betrayed_at?: string | null
          campaign_faction_id?: string
          character_id?: string
          created_at?: string | null
          id?: string
          is_member?: boolean | null
          joined_at?: string | null
          rank?: string | null
          reputation_score?: number | null
          session_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rp_character_faction_standing_campaign_faction_id_fkey"
            columns: ["campaign_faction_id"]
            isOneToOne: false
            referencedRelation: "rp_campaign_factions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_character_faction_standing_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "rp_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_character_faction_standing_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "rp_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_character_factions: {
        Row: {
          character_id: string
          faction_id: string
          id: string
          joined_at: string | null
          rank: string | null
          reputation: number
          updated_at: string
        }
        Insert: {
          character_id: string
          faction_id: string
          id?: string
          joined_at?: string | null
          rank?: string | null
          reputation?: number
          updated_at?: string
        }
        Update: {
          character_id?: string
          faction_id?: string
          id?: string
          joined_at?: string | null
          rank?: string | null
          reputation?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rp_character_factions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "rp_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_character_factions_faction_id_fkey"
            columns: ["faction_id"]
            isOneToOne: false
            referencedRelation: "rp_factions"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_character_inventory: {
        Row: {
          acquired_at: string
          character_id: string
          id: string
          item_id: string
          quantity: number
          source_node_id: string | null
          source_session_id: string | null
        }
        Insert: {
          acquired_at?: string
          character_id: string
          id?: string
          item_id: string
          quantity?: number
          source_node_id?: string | null
          source_session_id?: string | null
        }
        Update: {
          acquired_at?: string
          character_id?: string
          id?: string
          item_id?: string
          quantity?: number
          source_node_id?: string | null
          source_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rp_character_inventory_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "rp_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_character_inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "rp_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_character_inventory_source_session_id_fkey"
            columns: ["source_session_id"]
            isOneToOne: false
            referencedRelation: "rp_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_character_ip_scores: {
        Row: {
          character_a_id: string
          character_b_id: string
          created_at: string
          id: string
          last_interaction_at: string | null
          relationship_level: string
          score: number
          session_id: string
          updated_at: string
        }
        Insert: {
          character_a_id: string
          character_b_id: string
          created_at?: string
          id?: string
          last_interaction_at?: string | null
          relationship_level?: string
          score?: number
          session_id: string
          updated_at?: string
        }
        Update: {
          character_a_id?: string
          character_b_id?: string
          created_at?: string
          id?: string
          last_interaction_at?: string | null
          relationship_level?: string
          score?: number
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rp_character_ip_scores_character_a_id_fkey"
            columns: ["character_a_id"]
            isOneToOne: false
            referencedRelation: "rp_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_character_ip_scores_character_b_id_fkey"
            columns: ["character_b_id"]
            isOneToOne: false
            referencedRelation: "rp_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_character_ip_scores_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "rp_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_character_progress: {
        Row: {
          character_id: string
          current_node_id: string | null
          id: string
          nodes_visited: string[] | null
          session_id: string
          stat_checks_by_type: Json | null
          stats_snapshot: Json
          story_flags: Json
          updated_at: string
          xp_earned: number
        }
        Insert: {
          character_id: string
          current_node_id?: string | null
          id?: string
          nodes_visited?: string[] | null
          session_id: string
          stat_checks_by_type?: Json | null
          stats_snapshot?: Json
          story_flags?: Json
          updated_at?: string
          xp_earned?: number
        }
        Update: {
          character_id?: string
          current_node_id?: string | null
          id?: string
          nodes_visited?: string[] | null
          session_id?: string
          stat_checks_by_type?: Json | null
          stats_snapshot?: Json
          story_flags?: Json
          updated_at?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "rp_character_progress_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "rp_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_character_progress_current_node_id_fkey"
            columns: ["current_node_id"]
            isOneToOne: false
            referencedRelation: "rp_story_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_character_progress_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "rp_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_characters: {
        Row: {
          ability_slots: number
          backstory: string | null
          created_at: string
          current_session_id: string | null
          death_context: Json | null
          fallen_at: string | null
          id: string
          injury_penalties: Json | null
          inventory_slots: number
          is_active: boolean
          is_public: boolean | null
          legacy_bonuses: Json | null
          level: number
          name: string
          portrait_url: string | null
          race_id: string | null
          stats: Json
          title: string | null
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          ability_slots?: number
          backstory?: string | null
          created_at?: string
          current_session_id?: string | null
          death_context?: Json | null
          fallen_at?: string | null
          id?: string
          injury_penalties?: Json | null
          inventory_slots?: number
          is_active?: boolean
          is_public?: boolean | null
          legacy_bonuses?: Json | null
          level?: number
          name: string
          portrait_url?: string | null
          race_id?: string | null
          stats?: Json
          title?: string | null
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          ability_slots?: number
          backstory?: string | null
          created_at?: string
          current_session_id?: string | null
          death_context?: Json | null
          fallen_at?: string | null
          id?: string
          injury_penalties?: Json | null
          inventory_slots?: number
          is_active?: boolean
          is_public?: boolean | null
          legacy_bonuses?: Json | null
          level?: number
          name?: string
          portrait_url?: string | null
          race_id?: string | null
          stats?: Json
          title?: string | null
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "rp_characters_race_id_fkey"
            columns: ["race_id"]
            isOneToOne: false
            referencedRelation: "almanac_races"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_characters_session_fkey"
            columns: ["current_session_id"]
            isOneToOne: false
            referencedRelation: "rp_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_combat_encounters: {
        Row: {
          combat_type: string
          id: string
          node_id: string | null
          outcome: Json | null
          participants: Json
          resolved_at: string | null
          session_id: string
          started_at: string
          stats_hidden: boolean
          status: string
        }
        Insert: {
          combat_type?: string
          id?: string
          node_id?: string | null
          outcome?: Json | null
          participants?: Json
          resolved_at?: string | null
          session_id: string
          started_at?: string
          stats_hidden?: boolean
          status?: string
        }
        Update: {
          combat_type?: string
          id?: string
          node_id?: string | null
          outcome?: Json | null
          participants?: Json
          resolved_at?: string | null
          session_id?: string
          started_at?: string
          stats_hidden?: boolean
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "rp_combat_encounters_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "rp_story_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_combat_encounters_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "rp_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_community_lore: {
        Row: {
          approved_at: string
          approved_by: string | null
          article: string | null
          category: string
          created_at: string
          creator_id: string
          description: string
          id: string
          image_url: string | null
          is_featured: boolean | null
          name: string
          proposal_id: string | null
          updated_at: string
          view_count: number | null
        }
        Insert: {
          approved_at?: string
          approved_by?: string | null
          article?: string | null
          category: string
          created_at?: string
          creator_id: string
          description: string
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          name: string
          proposal_id?: string | null
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          approved_at?: string
          approved_by?: string | null
          article?: string | null
          category?: string
          created_at?: string
          creator_id?: string
          description?: string
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          name?: string
          proposal_id?: string | null
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rp_community_lore_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "rp_lore_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_convergence_nodes: {
        Row: {
          ally_node_id: string | null
          campaign_id: string
          convergence_type: string
          created_at: string | null
          description: string | null
          enemy_node_id: string | null
          id: string
          is_reconvergence: boolean
          name: string
          neutral_node_id: string | null
          node_id: string
          reconverge_order: number
          required_entry_points: Json | null
          split_from_convergence_id: string | null
        }
        Insert: {
          ally_node_id?: string | null
          campaign_id: string
          convergence_type?: string
          created_at?: string | null
          description?: string | null
          enemy_node_id?: string | null
          id?: string
          is_reconvergence?: boolean
          name: string
          neutral_node_id?: string | null
          node_id: string
          reconverge_order?: number
          required_entry_points?: Json | null
          split_from_convergence_id?: string | null
        }
        Update: {
          ally_node_id?: string | null
          campaign_id?: string
          convergence_type?: string
          created_at?: string | null
          description?: string | null
          enemy_node_id?: string | null
          id?: string
          is_reconvergence?: boolean
          name?: string
          neutral_node_id?: string | null
          node_id?: string
          reconverge_order?: number
          required_entry_points?: Json | null
          split_from_convergence_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rp_convergence_nodes_ally_node_id_fkey"
            columns: ["ally_node_id"]
            isOneToOne: false
            referencedRelation: "rp_story_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_convergence_nodes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "rp_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_convergence_nodes_enemy_node_id_fkey"
            columns: ["enemy_node_id"]
            isOneToOne: false
            referencedRelation: "rp_story_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_convergence_nodes_neutral_node_id_fkey"
            columns: ["neutral_node_id"]
            isOneToOne: false
            referencedRelation: "rp_story_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_convergence_nodes_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "rp_story_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_convergence_nodes_split_from_convergence_id_fkey"
            columns: ["split_from_convergence_id"]
            isOneToOne: false
            referencedRelation: "rp_convergence_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_convergence_rules: {
        Row: {
          condition_type: string
          conditions: Json
          convergence_id: string
          created_at: string | null
          id: string
          priority: number | null
          result: string
          result_narrative: string | null
          target_node_id: string | null
        }
        Insert: {
          condition_type?: string
          conditions?: Json
          convergence_id: string
          created_at?: string | null
          id?: string
          priority?: number | null
          result?: string
          result_narrative?: string | null
          target_node_id?: string | null
        }
        Update: {
          condition_type?: string
          conditions?: Json
          convergence_id?: string
          created_at?: string | null
          id?: string
          priority?: number | null
          result?: string
          result_narrative?: string | null
          target_node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rp_convergence_rules_convergence_id_fkey"
            columns: ["convergence_id"]
            isOneToOne: false
            referencedRelation: "rp_convergence_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_convergence_rules_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "rp_story_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_custom_beliefs: {
        Row: {
          campaign_id: string
          created_at: string
          deity_name: string | null
          description: string | null
          divine_powers: Json | null
          id: string
          name: string
          rituals: Json | null
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          deity_name?: string | null
          description?: string | null
          divine_powers?: Json | null
          id?: string
          name: string
          rituals?: Json | null
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          deity_name?: string | null
          description?: string | null
          divine_powers?: Json | null
          id?: string
          name?: string
          rituals?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rp_custom_beliefs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "rp_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_custom_items: {
        Row: {
          campaign_id: string
          created_at: string
          description: string | null
          effects: Json | null
          icon_url: string | null
          id: string
          item_type: string | null
          name: string
          rarity: string | null
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          description?: string | null
          effects?: Json | null
          icon_url?: string | null
          id?: string
          item_type?: string | null
          name: string
          rarity?: string | null
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          description?: string | null
          effects?: Json | null
          icon_url?: string | null
          id?: string
          item_type?: string | null
          name?: string
          rarity?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rp_custom_items_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "rp_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_custom_magic: {
        Row: {
          campaign_id: string
          casting_cost: Json | null
          created_at: string
          effects: Json | null
          id: string
          magic_type: string | null
          name: string
          rules: string | null
          updated_at: string
        }
        Insert: {
          campaign_id: string
          casting_cost?: Json | null
          created_at?: string
          effects?: Json | null
          id?: string
          magic_type?: string | null
          name: string
          rules?: string | null
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          casting_cost?: Json | null
          created_at?: string
          effects?: Json | null
          id?: string
          magic_type?: string | null
          name?: string
          rules?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rp_custom_magic_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "rp_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_custom_races: {
        Row: {
          campaign_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          lore: string | null
          name: string
          stat_bonuses: Json | null
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          lore?: string | null
          name: string
          stat_bonuses?: Json | null
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          lore?: string | null
          name?: string
          stat_bonuses?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rp_custom_races_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "rp_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_event_triggers: {
        Row: {
          campaign_id: string
          conditions: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          trigger_type: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          conditions?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          trigger_type: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          conditions?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rp_event_triggers_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "rp_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_faction_relations: {
        Row: {
          campaign_id: string
          created_at: string | null
          description: string | null
          faction_a_id: string
          faction_b_id: string
          id: string
          relation_type: string
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          description?: string | null
          faction_a_id: string
          faction_b_id: string
          id?: string
          relation_type?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          description?: string | null
          faction_a_id?: string
          faction_b_id?: string
          id?: string
          relation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "rp_faction_relations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "rp_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_faction_relations_faction_a_id_fkey"
            columns: ["faction_a_id"]
            isOneToOne: false
            referencedRelation: "rp_campaign_factions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_faction_relations_faction_b_id_fkey"
            columns: ["faction_b_id"]
            isOneToOne: false
            referencedRelation: "rp_campaign_factions"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_factions: {
        Row: {
          color: string | null
          created_at: string
          description: string
          id: string
          image_url: string | null
          name: string
          reputation_levels: Json | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          name: string
          reputation_levels?: Json | null
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          name?: string
          reputation_levels?: Json | null
        }
        Relationships: []
      }
      rp_free_text_responses: {
        Row: {
          character_id: string
          created_at: string
          id: string
          node_id: string
          response_text: string
          session_id: string
        }
        Insert: {
          character_id: string
          created_at?: string
          id?: string
          node_id: string
          response_text: string
          session_id: string
        }
        Update: {
          character_id?: string
          created_at?: string
          id?: string
          node_id?: string
          response_text?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rp_free_text_responses_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "rp_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_free_text_responses_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "rp_story_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_free_text_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "rp_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_hint_chains: {
        Row: {
          campaign_id: string
          chain_name: string
          chain_order: number | null
          completion_reward: Json | null
          created_at: string
          hint_ids: Json | null
          id: string
        }
        Insert: {
          campaign_id: string
          chain_name: string
          chain_order?: number | null
          completion_reward?: Json | null
          created_at?: string
          hint_ids?: Json | null
          id?: string
        }
        Update: {
          campaign_id?: string
          chain_name?: string
          chain_order?: number | null
          completion_reward?: Json | null
          created_at?: string
          hint_ids?: Json | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rp_hint_chains_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "rp_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_hint_responses: {
        Row: {
          character_id: string
          context: Json | null
          hint_id: string
          id: string
          responded_at: string
          response: string
          session_id: string
          triggered_event_id: string | null
        }
        Insert: {
          character_id: string
          context?: Json | null
          hint_id: string
          id?: string
          responded_at?: string
          response: string
          session_id: string
          triggered_event_id?: string | null
        }
        Update: {
          character_id?: string
          context?: Json | null
          hint_id?: string
          id?: string
          responded_at?: string
          response?: string
          session_id?: string
          triggered_event_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rp_hint_responses_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "rp_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_hint_responses_hint_id_fkey"
            columns: ["hint_id"]
            isOneToOne: false
            referencedRelation: "rp_hints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_hint_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "rp_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_hints: {
        Row: {
          campaign_id: string
          conditions: Json | null
          created_at: string
          follow_outcome: Json | null
          hint_text: string
          hint_type: string
          id: string
          ignore_outcome: Json | null
          is_active: boolean | null
          is_red_herring: boolean | null
          node_id: string | null
          opposite_outcome: Json | null
          priority: number | null
          source_flavor: string | null
          updated_at: string
        }
        Insert: {
          campaign_id: string
          conditions?: Json | null
          created_at?: string
          follow_outcome?: Json | null
          hint_text: string
          hint_type?: string
          id?: string
          ignore_outcome?: Json | null
          is_active?: boolean | null
          is_red_herring?: boolean | null
          node_id?: string | null
          opposite_outcome?: Json | null
          priority?: number | null
          source_flavor?: string | null
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          conditions?: Json | null
          created_at?: string
          follow_outcome?: Json | null
          hint_text?: string
          hint_type?: string
          id?: string
          ignore_outcome?: Json | null
          is_active?: boolean | null
          is_red_herring?: boolean | null
          node_id?: string | null
          opposite_outcome?: Json | null
          priority?: number | null
          source_flavor?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rp_hints_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "rp_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_hints_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "rp_story_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_interaction_log: {
        Row: {
          context: Json | null
          id: string
          interaction_id: string
          occurred_at: string | null
          outcome_id: string | null
          participants: Json
          session_id: string
        }
        Insert: {
          context?: Json | null
          id?: string
          interaction_id: string
          occurred_at?: string | null
          outcome_id?: string | null
          participants?: Json
          session_id: string
        }
        Update: {
          context?: Json | null
          id?: string
          interaction_id?: string
          occurred_at?: string | null
          outcome_id?: string | null
          participants?: Json
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rp_interaction_log_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "rp_interaction_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_interaction_log_outcome_id_fkey"
            columns: ["outcome_id"]
            isOneToOne: false
            referencedRelation: "rp_interaction_outcomes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_interaction_log_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "rp_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_interaction_outcomes: {
        Row: {
          condition: Json | null
          created_at: string | null
          flag_effects: Json | null
          id: string
          interaction_id: string
          narrative_text: string | null
          participant_role: string
          reputation_effects: Json | null
          result_type: string
          stat_effects: Json | null
          target_node_id: string | null
        }
        Insert: {
          condition?: Json | null
          created_at?: string | null
          flag_effects?: Json | null
          id?: string
          interaction_id: string
          narrative_text?: string | null
          participant_role?: string
          reputation_effects?: Json | null
          result_type?: string
          stat_effects?: Json | null
          target_node_id?: string | null
        }
        Update: {
          condition?: Json | null
          created_at?: string | null
          flag_effects?: Json | null
          id?: string
          interaction_id?: string
          narrative_text?: string | null
          participant_role?: string
          reputation_effects?: Json | null
          result_type?: string
          stat_effects?: Json | null
          target_node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rp_interaction_outcomes_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "rp_interaction_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_interaction_outcomes_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "rp_story_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_interaction_points: {
        Row: {
          campaign_id: string
          created_at: string | null
          description: string | null
          id: string
          interaction_type: string
          is_active: boolean | null
          name: string
          node_id: string | null
          participants: Json | null
          stat_requirements: Json | null
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          interaction_type?: string
          is_active?: boolean | null
          name: string
          node_id?: string | null
          participants?: Json | null
          stat_requirements?: Json | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          interaction_type?: string
          is_active?: boolean | null
          name?: string
          node_id?: string | null
          participants?: Json | null
          stat_requirements?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rp_interaction_points_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "rp_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_interaction_points_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "rp_story_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_interaction_zones: {
        Row: {
          campaign_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          node_id: string | null
          zone_type: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          node_id?: string | null
          zone_type?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          node_id?: string | null
          zone_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "rp_interaction_zones_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "rp_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_interaction_zones_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "rp_story_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_ip_change_history: {
        Row: {
          change_amount: number
          character_a_id: string
          character_b_id: string
          created_at: string
          id: string
          new_level: string
          new_score: number
          old_level: string
          reason: string
          session_id: string
          source_action_id: string | null
        }
        Insert: {
          change_amount: number
          character_a_id: string
          character_b_id: string
          created_at?: string
          id?: string
          new_level: string
          new_score: number
          old_level: string
          reason: string
          session_id: string
          source_action_id?: string | null
        }
        Update: {
          change_amount?: number
          character_a_id?: string
          character_b_id?: string
          created_at?: string
          id?: string
          new_level?: string
          new_score?: number
          old_level?: string
          reason?: string
          session_id?: string
          source_action_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rp_ip_change_history_character_a_id_fkey"
            columns: ["character_a_id"]
            isOneToOne: false
            referencedRelation: "rp_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_ip_change_history_character_b_id_fkey"
            columns: ["character_b_id"]
            isOneToOne: false
            referencedRelation: "rp_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_ip_change_history_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "rp_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_ip_change_history_source_action_id_fkey"
            columns: ["source_action_id"]
            isOneToOne: false
            referencedRelation: "rp_action_log"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_ip_threshold_events: {
        Row: {
          campaign_id: string
          created_at: string
          description: string | null
          event_payload: Json
          event_type: string
          id: string
          is_mandatory: boolean
          name: string
          target_node_id: string | null
          threshold_max: number
          threshold_min: number
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          description?: string | null
          event_payload?: Json
          event_type: string
          id?: string
          is_mandatory?: boolean
          name: string
          target_node_id?: string | null
          threshold_max: number
          threshold_min: number
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          description?: string | null
          event_payload?: Json
          event_type?: string
          id?: string
          is_mandatory?: boolean
          name?: string
          target_node_id?: string | null
          threshold_max?: number
          threshold_min?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rp_ip_threshold_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "rp_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_ip_threshold_events_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "rp_story_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_items: {
        Row: {
          campaign_id: string | null
          created_at: string
          description: string | null
          effect: Json | null
          icon_emoji: string | null
          icon_url: string | null
          id: string
          is_consumable: boolean | null
          is_quest_item: boolean | null
          item_type: string
          name: string
          rarity: string
          stat_bonus: Json | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          description?: string | null
          effect?: Json | null
          icon_emoji?: string | null
          icon_url?: string | null
          id?: string
          is_consumable?: boolean | null
          is_quest_item?: boolean | null
          item_type?: string
          name: string
          rarity?: string
          stat_bonus?: Json | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          description?: string | null
          effect?: Json | null
          icon_emoji?: string | null
          icon_url?: string | null
          id?: string
          is_consumable?: boolean | null
          is_quest_item?: boolean | null
          item_type?: string
          name?: string
          rarity?: string
          stat_bonus?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "rp_items_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "rp_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_key_point_paths: {
        Row: {
          conditions: Json | null
          created_at: string
          id: string
          path_type: string
          source_key_point_id: string
          target_key_point_id: string
          weight: number
        }
        Insert: {
          conditions?: Json | null
          created_at?: string
          id?: string
          path_type?: string
          source_key_point_id: string
          target_key_point_id: string
          weight?: number
        }
        Update: {
          conditions?: Json | null
          created_at?: string
          id?: string
          path_type?: string
          source_key_point_id?: string
          target_key_point_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "rp_key_point_paths_source_key_point_id_fkey"
            columns: ["source_key_point_id"]
            isOneToOne: false
            referencedRelation: "rp_key_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_key_point_paths_target_key_point_id_fkey"
            columns: ["target_key_point_id"]
            isOneToOne: false
            referencedRelation: "rp_key_points"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_key_points: {
        Row: {
          campaign_id: string
          conditions: Json | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_required: boolean
          node_id: string | null
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          conditions?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_required?: boolean
          node_id?: string | null
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          conditions?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_required?: boolean
          node_id?: string | null
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rp_key_points_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "rp_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_key_points_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "rp_story_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_level_benefits: {
        Row: {
          ability_slots_granted: number
          description: string | null
          id: string
          level: number
          stat_points_granted: number
          title: string | null
          xp_required: number
        }
        Insert: {
          ability_slots_granted?: number
          description?: string | null
          id?: string
          level: number
          stat_points_granted?: number
          title?: string | null
          xp_required: number
        }
        Update: {
          ability_slots_granted?: number
          description?: string | null
          id?: string
          level?: number
          stat_points_granted?: number
          title?: string | null
          xp_required?: number
        }
        Relationships: []
      }
      rp_lore_conversations: {
        Row: {
          created_at: string
          id: string
          last_active_at: string
          messages: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_active_at?: string
          messages?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_active_at?: string
          messages?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rp_lore_proposals: {
        Row: {
          category: string
          content: Json
          created_at: string
          id: string
          reviewed_at: string | null
          reviewer_id: string | null
          reviewer_notes: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          content?: Json
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content?: Json
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rp_loremasters: {
        Row: {
          appointed_at: string
          appointed_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          appointed_at?: string
          appointed_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          appointed_at?: string
          appointed_by?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      rp_node_choices: {
        Row: {
          choice_text: string
          created_at: string
          id: string
          item_requirement: string | null
          item_reward: string | null
          node_id: string
          order_index: number
          stat_effect: Json | null
          stat_requirement: Json | null
          target_node_id: string | null
        }
        Insert: {
          choice_text: string
          created_at?: string
          id?: string
          item_requirement?: string | null
          item_reward?: string | null
          node_id: string
          order_index?: number
          stat_effect?: Json | null
          stat_requirement?: Json | null
          target_node_id?: string | null
        }
        Update: {
          choice_text?: string
          created_at?: string
          id?: string
          item_requirement?: string | null
          item_reward?: string | null
          node_id?: string
          order_index?: number
          stat_effect?: Json | null
          stat_requirement?: Json | null
          target_node_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rp_node_choices_item_requirement_fkey"
            columns: ["item_requirement"]
            isOneToOne: false
            referencedRelation: "rp_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_node_choices_item_reward_fkey"
            columns: ["item_reward"]
            isOneToOne: false
            referencedRelation: "rp_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_node_choices_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "rp_story_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_node_choices_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "rp_story_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_node_media: {
        Row: {
          created_at: string
          id: string
          media_type: string
          node_id: string
          position: string | null
          should_loop: boolean | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          media_type: string
          node_id: string
          position?: string | null
          should_loop?: boolean | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          media_type?: string
          node_id?: string
          position?: string | null
          should_loop?: boolean | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "rp_node_media_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "rp_story_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_perception_events: {
        Row: {
          created_at: string
          detection_level: string
          id: string
          is_read: boolean
          message: string | null
          observer_id: string
          perception_roll: number | null
          session_id: string
          target_id: string
        }
        Insert: {
          created_at?: string
          detection_level?: string
          id?: string
          is_read?: boolean
          message?: string | null
          observer_id: string
          perception_roll?: number | null
          session_id: string
          target_id: string
        }
        Update: {
          created_at?: string
          detection_level?: string
          id?: string
          is_read?: boolean
          message?: string | null
          observer_id?: string
          perception_roll?: number | null
          session_id?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rp_perception_events_observer_id_fkey"
            columns: ["observer_id"]
            isOneToOne: false
            referencedRelation: "rp_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_perception_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "rp_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_perception_events_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "rp_characters"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_player_positions: {
        Row: {
          character_id: string
          created_at: string
          id: string
          position_x: number | null
          position_y: number | null
          relative_to_character_id: string | null
          scene_node_id: string | null
          session_id: string
          updated_at: string
          zone: string
        }
        Insert: {
          character_id: string
          created_at?: string
          id?: string
          position_x?: number | null
          position_y?: number | null
          relative_to_character_id?: string | null
          scene_node_id?: string | null
          session_id: string
          updated_at?: string
          zone?: string
        }
        Update: {
          character_id?: string
          created_at?: string
          id?: string
          position_x?: number | null
          position_y?: number | null
          relative_to_character_id?: string | null
          scene_node_id?: string | null
          session_id?: string
          updated_at?: string
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "rp_player_positions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "rp_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_player_positions_relative_to_character_id_fkey"
            columns: ["relative_to_character_id"]
            isOneToOne: false
            referencedRelation: "rp_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_player_positions_scene_node_id_fkey"
            columns: ["scene_node_id"]
            isOneToOne: false
            referencedRelation: "rp_story_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_player_positions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "rp_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_prepared_actions: {
        Row: {
          action_type: string
          character_id: string
          cooldown_until: string | null
          id: string
          is_revealed: boolean
          is_used: boolean
          item_id: string | null
          preparation: Json | null
          prepared_at: string
          session_id: string
          target_character_id: string | null
        }
        Insert: {
          action_type: string
          character_id: string
          cooldown_until?: string | null
          id?: string
          is_revealed?: boolean
          is_used?: boolean
          item_id?: string | null
          preparation?: Json | null
          prepared_at?: string
          session_id: string
          target_character_id?: string | null
        }
        Update: {
          action_type?: string
          character_id?: string
          cooldown_until?: string | null
          id?: string
          is_revealed?: boolean
          is_used?: boolean
          item_id?: string | null
          preparation?: Json | null
          prepared_at?: string
          session_id?: string
          target_character_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rp_prepared_actions_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "rp_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_prepared_actions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "rp_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_prepared_actions_target_character_id_fkey"
            columns: ["target_character_id"]
            isOneToOne: false
            referencedRelation: "rp_characters"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_pvp_settings: {
        Row: {
          campaign_id: string
          created_at: string
          friendly_fire: boolean
          id: string
          lethality_mode: string
          pvp_enabled: boolean
          pvp_zones_only: boolean
          require_consent: boolean
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          friendly_fire?: boolean
          id?: string
          lethality_mode?: string
          pvp_enabled?: boolean
          pvp_zones_only?: boolean
          require_consent?: boolean
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          friendly_fire?: boolean
          id?: string
          lethality_mode?: string
          pvp_enabled?: boolean
          pvp_zones_only?: boolean
          require_consent?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rp_pvp_settings_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: true
            referencedRelation: "rp_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_random_event_log: {
        Row: {
          character_id: string | null
          event_id: string
          fired_at: string | null
          id: string
          outcome: Json | null
          session_id: string
          was_positive: boolean | null
        }
        Insert: {
          character_id?: string | null
          event_id: string
          fired_at?: string | null
          id?: string
          outcome?: Json | null
          session_id: string
          was_positive?: boolean | null
        }
        Update: {
          character_id?: string | null
          event_id?: string
          fired_at?: string | null
          id?: string
          outcome?: Json | null
          session_id?: string
          was_positive?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "rp_random_event_log_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "rp_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_random_event_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "rp_random_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_random_event_log_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "rp_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_random_events: {
        Row: {
          campaign_id: string
          category: string
          conditions: Json | null
          cooldown_turns: number | null
          created_at: string | null
          description: string | null
          effects: Json | null
          id: string
          is_active: boolean | null
          is_recurring: boolean | null
          name: string
          probability: number
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          category?: string
          conditions?: Json | null
          cooldown_turns?: number | null
          created_at?: string | null
          description?: string | null
          effects?: Json | null
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          name: string
          probability?: number
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          category?: string
          conditions?: Json | null
          cooldown_turns?: number | null
          created_at?: string | null
          description?: string | null
          effects?: Json | null
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          name?: string
          probability?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rp_random_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "rp_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_session_invitations: {
        Row: {
          created_at: string | null
          id: string
          invited_by: string
          invited_user_id: string
          responded_at: string | null
          session_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_by: string
          invited_user_id: string
          responded_at?: string | null
          session_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_by?: string
          invited_user_id?: string
          responded_at?: string | null
          session_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rp_session_invitations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "rp_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_session_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          message_type: string | null
          metadata: Json | null
          session_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          session_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          message_type?: string | null
          metadata?: Json | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rp_session_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "rp_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_session_participants: {
        Row: {
          character_id: string
          entry_point_id: string | null
          id: string
          is_active: boolean
          joined_at: string
          session_id: string
        }
        Insert: {
          character_id: string
          entry_point_id?: string | null
          id?: string
          is_active?: boolean
          joined_at?: string
          session_id: string
        }
        Update: {
          character_id?: string
          entry_point_id?: string | null
          id?: string
          is_active?: boolean
          joined_at?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rp_session_participants_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "rp_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_session_participants_entry_point_id_fkey"
            columns: ["entry_point_id"]
            isOneToOne: false
            referencedRelation: "rp_campaign_entry_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_session_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "rp_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_session_trigger_log: {
        Row: {
          character_id: string | null
          context: Json | null
          fired_at: string
          id: string
          session_id: string
          trigger_id: string
        }
        Insert: {
          character_id?: string | null
          context?: Json | null
          fired_at?: string
          id?: string
          session_id: string
          trigger_id: string
        }
        Update: {
          character_id?: string | null
          context?: Json | null
          fired_at?: string
          id?: string
          session_id?: string
          trigger_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rp_session_trigger_log_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "rp_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_session_trigger_log_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "rp_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_session_trigger_log_trigger_id_fkey"
            columns: ["trigger_id"]
            isOneToOne: false
            referencedRelation: "rp_event_triggers"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_sessions: {
        Row: {
          campaign_id: string
          completed_at: string | null
          created_by: string
          current_node_id: string | null
          current_turn_player_id: string | null
          id: string
          last_played_at: string
          max_players: number | null
          mode: string
          session_code: string | null
          started_at: string
          status: string
          story_flags: Json
          turn_deadline: string | null
          turn_order: string[] | null
        }
        Insert: {
          campaign_id: string
          completed_at?: string | null
          created_by: string
          current_node_id?: string | null
          current_turn_player_id?: string | null
          id?: string
          last_played_at?: string
          max_players?: number | null
          mode?: string
          session_code?: string | null
          started_at?: string
          status?: string
          story_flags?: Json
          turn_deadline?: string | null
          turn_order?: string[] | null
        }
        Update: {
          campaign_id?: string
          completed_at?: string | null
          created_by?: string
          current_node_id?: string | null
          current_turn_player_id?: string | null
          id?: string
          last_played_at?: string
          max_players?: number | null
          mode?: string
          session_code?: string | null
          started_at?: string
          status?: string
          story_flags?: Json
          turn_deadline?: string | null
          turn_order?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "rp_sessions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "rp_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_sessions_current_node_id_fkey"
            columns: ["current_node_id"]
            isOneToOne: false
            referencedRelation: "rp_story_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_story_nodes: {
        Row: {
          allows_free_text: boolean
          audio_url: string | null
          campaign_id: string
          content: Json
          created_at: string
          free_text_prompt: string | null
          id: string
          image_url: string | null
          node_type: string
          position_x: number
          position_y: number
          title: string | null
          updated_at: string
          xp_reward: number
        }
        Insert: {
          allows_free_text?: boolean
          audio_url?: string | null
          campaign_id: string
          content?: Json
          created_at?: string
          free_text_prompt?: string | null
          id?: string
          image_url?: string | null
          node_type?: string
          position_x?: number
          position_y?: number
          title?: string | null
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          allows_free_text?: boolean
          audio_url?: string | null
          campaign_id?: string
          content?: Json
          created_at?: string
          free_text_prompt?: string | null
          id?: string
          image_url?: string | null
          node_type?: string
          position_x?: number
          position_y?: number
          title?: string | null
          updated_at?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "rp_story_nodes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "rp_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_trade_offers: {
        Row: {
          created_at: string
          from_character_id: string
          id: string
          message: string | null
          offered_items: Json
          requested_items: Json
          responded_at: string | null
          session_id: string
          status: string
          to_character_id: string
        }
        Insert: {
          created_at?: string
          from_character_id: string
          id?: string
          message?: string | null
          offered_items?: Json
          requested_items?: Json
          responded_at?: string | null
          session_id: string
          status?: string
          to_character_id: string
        }
        Update: {
          created_at?: string
          from_character_id?: string
          id?: string
          message?: string | null
          offered_items?: Json
          requested_items?: Json
          responded_at?: string | null
          session_id?: string
          status?: string
          to_character_id?: string
        }
        Relationships: []
      }
      rp_triggered_events: {
        Row: {
          campaign_id: string
          created_at: string
          event_type: string
          id: string
          name: string
          payload: Json
          trigger_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          event_type: string
          id?: string
          name: string
          payload?: Json
          trigger_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          event_type?: string
          id?: string
          name?: string
          payload?: Json
          trigger_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rp_triggered_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "rp_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rp_triggered_events_trigger_id_fkey"
            columns: ["trigger_id"]
            isOneToOne: false
            referencedRelation: "rp_event_triggers"
            referencedColumns: ["id"]
          },
        ]
      }
      social_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          reference_id: string | null
          reference_type: string | null
          triggered_by_user_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          reference_id?: string | null
          reference_type?: string | null
          triggered_by_user_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          reference_id?: string | null
          reference_type?: string | null
          triggered_by_user_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      submission_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          submission_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          submission_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          submission_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "submission_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_comments_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "user_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_likes: {
        Row: {
          created_at: string
          id: string
          submission_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          submission_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          submission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_likes_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "user_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_notifications: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          submission_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          submission_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          submission_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_notifications_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "user_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_tags: {
        Row: {
          created_at: string
          id: string
          submission_id: string
          tag_id: string
          tag_name: string
          tag_type: Database["public"]["Enums"]["tag_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          submission_id: string
          tag_id: string
          tag_name: string
          tag_type: Database["public"]["Enums"]["tag_type"]
        }
        Update: {
          created_at?: string
          id?: string
          submission_id?: string
          tag_id?: string
          tag_name?: string
          tag_type?: Database["public"]["Enums"]["tag_type"]
        }
        Relationships: [
          {
            foreignKeyName: "submission_tags_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "user_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_type: string
          earned_at: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          achievement_type: string
          earned_at?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          achievement_type?: string
          earned_at?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_activities: {
        Row: {
          activity_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          reference_id: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badge_types"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          infinite_scroll_enabled: boolean | null
          notifications_comments: boolean | null
          notifications_follows: boolean | null
          notifications_likes: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          infinite_scroll_enabled?: boolean | null
          notifications_comments?: boolean | null
          notifications_follows?: boolean | null
          notifications_likes?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          infinite_scroll_enabled?: boolean | null
          notifications_comments?: boolean | null
          notifications_follows?: boolean | null
          notifications_likes?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_reputation: {
        Row: {
          created_at: string
          id: string
          likes_received: number
          posts_count: number
          rank: string
          replies_count: number
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          likes_received?: number
          posts_count?: number
          rank?: string
          replies_count?: number
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          likes_received?: number
          posts_count?: number
          rank?: string
          replies_count?: number
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_submissions: {
        Row: {
          admin_notes: string | null
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          description: string | null
          featured_at: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          rating: number | null
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string
          description?: string | null
          featured_at?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          rating?: number | null
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          description?: string | null
          featured_at?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          rating?: number | null
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          password_hash: string
          updated_at: string
        }
        Insert: {
          created_at: string
          email: string
          full_name?: string | null
          id: string
          password_hash: string
          updated_at: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          password_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          book_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          book_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          book_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      world_locations: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          type: string
          updated_at: string
          x_position: number
          y_position: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          type?: string
          updated_at?: string
          x_position?: number
          y_position?: number
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string
          x_position?: number
          y_position?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_session_code: { Args: never; Returns: string }
      get_level_from_xp: { Args: { xp_amount: number }; Returns: number }
      get_submission_comments_count: {
        Args: { submission_uuid: string }
        Returns: number
      }
      get_submission_likes_count: {
        Args: { submission_uuid: string }
        Returns: number
      }
      get_xp_for_next_level: { Args: { current_xp: number }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_has_liked: {
        Args: { checking_user_id: string; submission_uuid: string }
        Returns: boolean
      }
      verify_password: {
        Args: { input_password: string; stored_hash: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      content_status: "pending" | "approved" | "rejected"
      content_type: "art" | "discussion" | "review"
      tag_type: "almanac" | "character" | "event" | "book"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      content_status: ["pending", "approved", "rejected"],
      content_type: ["art", "discussion", "review"],
      tag_type: ["almanac", "character", "event", "book"],
    },
  },
} as const
