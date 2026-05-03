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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      athlete_link_requests: {
        Row: {
          id: string
          message: string | null
          requested_at: string | null
          responded_at: string | null
          status: string
          student_id: string
          trainer_id: string
        }
        Insert: {
          id?: string
          message?: string | null
          requested_at?: string | null
          responded_at?: string | null
          status?: string
          student_id: string
          trainer_id: string
        }
        Update: {
          id?: string
          message?: string | null
          requested_at?: string | null
          responded_at?: string | null
          status?: string
          student_id?: string
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_link_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "athlete_link_requests_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      boxes: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      coach_approvals: {
        Row: {
          approved_by: string | null
          coach_id: string | null
          created_at: string | null
          id: string
          new_status: string | null
          previous_status: string | null
          reason: string | null
        }
        Insert: {
          approved_by?: string | null
          coach_id?: string | null
          created_at?: string | null
          id?: string
          new_status?: string | null
          previous_status?: string | null
          reason?: string | null
        }
        Update: {
          approved_by?: string | null
          coach_id?: string | null
          created_at?: string | null
          id?: string
          new_status?: string | null
          previous_status?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_approvals_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      community_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_likes: {
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
            foreignKeyName: "community_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_notifications: {
        Row: {
          actor_id: string
          created_at: string
          id: string
          post_id: string | null
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          id?: string
          post_id?: string | null
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          id?: string
          post_id?: string | null
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          hashtags: string[] | null
          id: string
          media_type: string | null
          media_url: string | null
          mentions: string[] | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          hashtags?: string[] | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          mentions?: string[] | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          hashtags?: string[] | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          mentions?: string[] | null
        }
        Relationships: []
      }
      community_reposts: {
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
            foreignKeyName: "community_reposts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_saves: {
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
            foreignKeyName: "community_saves_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_logs: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          is_completed: boolean | null
          load_used: number | null
          notes: string | null
          reps_done: number | null
          set_number: number
          workout_exercise_id: string | null
          workout_log_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          is_completed?: boolean | null
          load_used?: number | null
          notes?: string | null
          reps_done?: number | null
          set_number?: number
          workout_exercise_id?: string | null
          workout_log_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          is_completed?: boolean | null
          load_used?: number | null
          notes?: string | null
          reps_done?: number | null
          set_number?: number
          workout_exercise_id?: string | null
          workout_log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_logs_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercise_adaptations: {
        Row: {
          id: string
          workout_log_id: string
          workout_exercise_id: string
          substitute_exercise_id: string | null
          student_note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          workout_log_id: string
          workout_exercise_id: string
          substitute_exercise_id?: string | null
          student_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          workout_log_id?: string
          workout_exercise_id?: string
          substitute_exercise_id?: string | null
          student_note?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
          param1_type: string | null
          param2_type: string | null
          param3_type: string | null
          video_url: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          name: string
          param1_type?: string | null
          param2_type?: string | null
          param3_type?: string | null
          video_url?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
          param1_type?: string | null
          param2_type?: string | null
          param3_type?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          student_id: string
        }
        Insert: {
          group_id: string
          id?: string
          student_id: string
        }
        Update: {
          group_id?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          box_id: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          trainer_id: string
        }
        Insert: {
          box_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          trainer_id: string
        }
        Update: {
          box_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_box_id_fkey"
            columns: ["box_id"]
            isOneToOne: false
            referencedRelation: "boxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      metcon_scores: {
        Row: {
          box_id: string | null
          created_at: string
          id: string
          metcon_id: string
          score_value: string
          student_id: string
        }
        Insert: {
          box_id?: string | null
          created_at?: string
          id?: string
          metcon_id: string
          score_value: string
          student_id: string
        }
        Update: {
          box_id?: string | null
          created_at?: string
          id?: string
          metcon_id?: string
          score_value?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "metcon_scores_box_id_fkey"
            columns: ["box_id"]
            isOneToOne: false
            referencedRelation: "boxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metcon_scores_metcon_id_fkey"
            columns: ["metcon_id"]
            isOneToOne: false
            referencedRelation: "workout_metcons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metcon_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          user_id: string
          workout_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          user_id: string
          workout_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          user_id?: string
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          box_id: string | null
          created_at: string
          email: string
          gender: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          box_id?: string | null
          created_at?: string
          email?: string
          gender?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          box_id?: string | null
          created_at?: string
          email?: string
          gender?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_box_id_fkey"
            columns: ["box_id"]
            isOneToOne: false
            referencedRelation: "boxes"
            referencedColumns: ["id"]
          },
        ]
      }
      ranking_history: {
        Row: {
          avatar_url: string | null
          created_at: string
          group_name: string
          id: string
          name: string
          position: number
          student_id: string
          total_points: number
          week_end: string
          week_start: string
          workout_details: Json
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          group_name?: string
          id?: string
          name?: string
          position?: number
          student_id: string
          total_points?: number
          week_end: string
          week_start: string
          workout_details?: Json
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          group_name?: string
          id?: string
          name?: string
          position?: number
          student_id?: string
          total_points?: number
          week_end?: string
          week_start?: string
          workout_details?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ranking_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_max_loads: {
        Row: {
          created_at: string | null
          exercise_id: string
          id: string
          max_load: number
          notes: string | null
          student_id: string
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          exercise_id: string
          id?: string
          max_load: number
          notes?: string | null
          student_id: string
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          exercise_id?: string
          id?: string
          max_load?: number
          notes?: string | null
          student_id?: string
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_max_loads_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_max_loads_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          active: boolean
          box_id: string | null
          created_at: string
          id: string
          trainer_id: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          box_id?: string | null
          created_at?: string
          id?: string
          trainer_id?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          box_id?: string | null
          created_at?: string
          id?: string
          trainer_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_box_id_fkey"
            columns: ["box_id"]
            isOneToOne: false
            referencedRelation: "boxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      training_period_weeks: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          phase: string
          student_id: string
          updated_at: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          phase: string
          student_id: string
          updated_at?: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          phase?: string
          student_id?: string
          updated_at?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_period_weeks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      group_training_period_weeks: {
        Row: {
          created_at: string
          group_id: string
          id: string
          notes: string | null
          phase: string
          updated_at: string
          week_start: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          notes?: string | null
          phase: string
          updated_at?: string
          week_start: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          notes?: string | null
          phase?: string
          updated_at?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_training_period_weeks_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_access_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          expiration_date: string | null
          franchise_name: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          status: string | null
          used_at: string | null
          used_by: string | null
          used_count: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          expiration_date?: string | null
          franchise_name?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          status?: string | null
          used_at?: string | null
          used_by?: string | null
          used_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          expiration_date?: string | null
          franchise_name?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          status?: string | null
          used_at?: string | null
          used_by?: string | null
          used_count?: number | null
        }
        Relationships: []
      }
      trainer_periodization_settings: {
        Row: {
          period_phase_labels: Json
          trainer_id: string
          updated_at: string
        }
        Insert: {
          period_phase_labels?: Json
          trainer_id: string
          updated_at?: string
        }
        Update: {
          period_phase_labels?: Json
          trainer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainer_periodization_settings_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: true
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      trainers: {
        Row: {
          coach_status: string | null
          created_at: string
          franchise_unit: string | null
          id: string
          is_official: boolean | null
          trainer_code: string | null
          user_id: string
        }
        Insert: {
          coach_status?: string | null
          created_at?: string
          franchise_unit?: string | null
          id?: string
          is_official?: boolean | null
          trainer_code?: string | null
          user_id: string
        }
        Update: {
          coach_status?: string | null
          created_at?: string
          franchise_unit?: string | null
          id?: string
          is_official?: boolean | null
          trainer_code?: string | null
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
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      workout_exercises: {
        Row: {
          block_label: string | null
          exercise_id: string
          id: string
          load_scheme: string[] | null
          load_type: string | null
          notes: string | null
          reps: string
          reps_scheme: string[] | null
          sets: number
          sort_order: number
          suggested_load: string | null
          superset_group_id: string | null
          video_url: string | null
          workout_id: string
        }
        Insert: {
          block_label?: string | null
          exercise_id: string
          id?: string
          load_scheme?: string[] | null
          load_type?: string | null
          notes?: string | null
          reps?: string
          reps_scheme?: string[] | null
          sets?: number
          sort_order?: number
          suggested_load?: string | null
          superset_group_id?: string | null
          video_url?: string | null
          workout_id: string
        }
        Update: {
          block_label?: string | null
          exercise_id?: string
          id?: string
          load_scheme?: string[] | null
          load_type?: string | null
          notes?: string | null
          reps?: string
          reps_scheme?: string[] | null
          sets?: number
          sort_order?: number
          suggested_load?: string | null
          superset_group_id?: string | null
          video_url?: string | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_logs: {
        Row: {
          box_id: string | null
          completed_at: string
          id: string
          student_id: string
          total_time_seconds: number | null
          workout_id: string
        }
        Insert: {
          box_id?: string | null
          completed_at?: string
          id?: string
          student_id: string
          total_time_seconds?: number | null
          workout_id: string
        }
        Update: {
          box_id?: string | null
          completed_at?: string
          id?: string
          student_id?: string
          total_time_seconds?: number | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_box_id_fkey"
            columns: ["box_id"]
            isOneToOne: false
            referencedRelation: "boxes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_metcons: {
        Row: {
          created_at: string
          description: string
          id: string
          is_ranking_reference: boolean
          metcon_type: string
          sort_order: number
          title: string | null
          workout_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          is_ranking_reference?: boolean
          metcon_type?: string
          sort_order?: number
          title?: string | null
          workout_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_ranking_reference?: boolean
          metcon_type?: string
          sort_order?: number
          title?: string | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_metcons_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      workouts: {
        Row: {
          category: string
          created_at: string
          date: string
          description: string | null
          group_id: string | null
          id: string
          is_group: boolean
          student_id: string | null
          title: string
          trainer_id: string
          week_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          group_id?: string | null
          id?: string
          is_group?: boolean
          student_id?: string | null
          title: string
          trainer_id: string
          week_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          group_id?: string | null
          id?: string
          is_group?: boolean
          student_id?: string | null
          title?: string
          trainer_id?: string
          week_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workouts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workouts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workouts_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "trainers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_trainer_code: { Args: never; Returns: string }
      get_default_box_id: { Args: never; Returns: string }
      get_post_counts: {
        Args: { post_ids: string[] }
        Returns: {
          comments_count: number
          likes_count: number
          post_id: string
          reposts_count: number
        }[]
      }
      get_student_id: { Args: { _user_id: string }; Returns: string }
      get_trainer_id: { Args: { _user_id: string }; Returns: string }
      get_user_box_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      student_group_ids: { Args: { _student_id: string }; Returns: string[] }
      student_is_group_member: {
        Args: { _group_id: string; _student_id: string }
        Returns: boolean
      }
      trainer_owns_group: {
        Args: { _group_id: string; _trainer_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "trainer" | "cliente" | "admin_master"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "trainer", "cliente", "admin_master"],
    },
  },
} as const
