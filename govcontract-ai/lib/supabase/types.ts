export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          website: string | null
          logo_url: string | null
          industry: string
          company_size: string | null
          founded_year: number | null
          annual_revenue: string | null
          headquarters_address: any | null
          business_type: string | null
          tax_id: string | null
          duns_number: string | null
          cage_code: string | null
          capabilities: string[] | null
          certifications: string[] | null
          target_jurisdictions: string[] | null
          profile_data: any | null
          settings: any | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['companies']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['companies']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          company_id: string | null
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'admin' | 'company_owner' | 'team_member'
          phone: string | null
          last_sign_in_at: string | null
          email_verified: boolean
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      opportunities: {
        Row: {
          id: string
          title: string
          description: string | null
          solicitation_number: string | null
          agency: string | null
          office: string | null
          jurisdiction: string | null
          opportunity_type: 'rfp' | 'rfq' | 'ib' | 'solicitation' | 'amendment' | 'award'
          status: 'open' | 'closed' | 'cancelled' | 'amended'
          naics_codes: number[] | null
          contract_value_min: number | null
          contract_value_max: number | null
          set_aside_type: string | null
          place_of_performance: string | null
          submission_deadline: string | null
          contact_info: any | null
          source_url: string | null
          documents: any | null
          requirements: any | null
          evaluation_criteria: any | null
          keywords: string[] | null
          cache_tier: 'tier1_realtime' | 'tier2_hourly' | 'tier3_daily' | 'tier4_weekly'
          last_cached_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['opportunities']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['opportunities']['Insert']>
      }
      applications: {
        Row: {
          id: string
          company_id: string
          opportunity_id: string
          created_by: string
          title: string
          status: 'draft' | 'submitted' | 'under_review' | 'awarded' | 'rejected'
          form_data: any | null
          uploaded_documents: any | null
          ai_generated_content: any | null
          quality_score: number | null
          last_quality_check: string | null
          compliance_status: any | null
          submission_date: string | null
          submission_confirmation: string | null
          tracking_number: string | null
          estimated_completion_time: number | null
          time_spent: number
          workflow_stage: string
          is_submitted: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['applications']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['applications']['Insert']>
      }
    }
  }
} 