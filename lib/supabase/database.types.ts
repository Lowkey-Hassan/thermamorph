export type AuditStatus = 'draft' | 'uploading' | 'analyzing' | 'complete' | 'error'
export type Severity = 'low' | 'medium' | 'high' | 'critical'
export type Effort = 'quick' | 'medium' | 'major'
export type Zone = 'windows' | 'doors' | 'walls' | 'vents' | 'roof' | 'exterior' | 'other'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
        }
      }
      audits: {
        Row: {
          id: string
          user_id: string
          name: string
          building_type: string
          build_year: number
          floor_area: number
          location: string
          hvac_type: string
          hvac_install_year: number | null
          status: AuditStatus
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          building_type: string
          build_year: number
          floor_area: number
          location: string
          hvac_type: string
          hvac_install_year?: number | null
          status?: AuditStatus
          error_message?: string | null
        }
        Update: {
          name?: string
          building_type?: string
          build_year?: number
          floor_area?: number
          location?: string
          hvac_type?: string
          hvac_install_year?: number | null
          status?: AuditStatus
          error_message?: string | null
        }
      }
      audit_uploads: {
        Row: {
          id: string
          audit_id: string
          storage_path: string
          file_name: string
          file_size: number | null
          mime_type: string | null
          zone: Zone
          created_at: string
        }
        Insert: {
          id?: string
          audit_id: string
          storage_path: string
          file_name: string
          file_size?: number | null
          mime_type?: string | null
          zone?: Zone
        }
        Update: {
          zone?: Zone
        }
      }
      analysis_results: {
        Row: {
          id: string
          audit_id: string
          carbon_score: number
          annual_co2_kg: number
          annual_energy_kwh: number
          estimated_annual_cost: number
          potential_savings_pct: number
          contractor_brief: string | null
          model_used: string | null
          raw_response: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id?: string
          audit_id: string
          carbon_score: number
          annual_co2_kg: number
          annual_energy_kwh: number
          estimated_annual_cost: number
          potential_savings_pct: number
          contractor_brief?: string | null
          model_used?: string | null
          raw_response?: Record<string, unknown> | null
        }
        Update: Record<string, never>
      }
      problem_areas: {
        Row: {
          id: string
          audit_id: string
          title: string
          description: string
          severity: Severity
          estimated_loss_kwh: number | null
          fix_cost_min: number | null
          fix_cost_max: number | null
          location: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          audit_id: string
          title: string
          description: string
          severity: Severity
          estimated_loss_kwh?: number | null
          fix_cost_min?: number | null
          fix_cost_max?: number | null
          location?: string | null
          sort_order?: number
        }
        Update: Record<string, never>
      }
      roadmap_items: {
        Row: {
          id: string
          audit_id: string
          title: string
          description: string
          effort: Effort
          roi_months: number | null
          cost_min: number | null
          cost_max: number | null
          co2_saving_kg: number | null
          priority: number
          created_at: string
        }
        Insert: {
          id?: string
          audit_id: string
          title: string
          description: string
          effort: Effort
          roi_months?: number | null
          cost_min?: number | null
          cost_max?: number | null
          co2_saving_kg?: number | null
          priority?: number
        }
        Update: Record<string, never>
      }
      energy_breakdown: {
        Row: {
          id: string
          audit_id: string
          category: string
          kwh_per_year: number
          percentage: number
          created_at: string
        }
        Insert: {
          id?: string
          audit_id: string
          category: string
          kwh_per_year: number
          percentage: number
        }
        Update: Record<string, never>
      }
    }
  }
}
