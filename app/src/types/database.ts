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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      assessment_sessions: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          id: number
          name: string
          start_date: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: number
          name: string
          start_date: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: number
          name?: string
          start_date?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      assessment_skill_results: {
        Row: {
          assessed_level: number
          assessment_id: number
          calculated_score: number | null
          comment: string | null
          created_at: string | null
          id: number
          skill_id: number
          skill_level_id: number | null
          updated_at: string | null
        }
        Insert: {
          assessed_level?: number
          assessment_id: number
          calculated_score?: number | null
          comment?: string | null
          created_at?: string | null
          id?: number
          skill_id: number
          skill_level_id?: number | null
          updated_at?: string | null
        }
        Update: {
          assessed_level?: number
          assessment_id?: number
          calculated_score?: number | null
          comment?: string | null
          created_at?: string | null
          id?: number
          skill_id?: number
          skill_level_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_skill_results_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "skill_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_skill_results_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_skill_results_skill_level_id_fkey"
            columns: ["skill_level_id"]
            isOneToOne: false
            referencedRelation: "skill_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      bonus_calculations: {
        Row: {
          base_amount: number | null
          base_hours: number | null
          bonus_type_id: number
          calculated_amount: number
          calculation_details: Json | null
          created_at: string | null
          employee_bonus_id: number
          employee_id: number
          id: number
          month: number
          status: string | null
          updated_at: string | null
          year: number
        }
        Insert: {
          base_amount?: number | null
          base_hours?: number | null
          bonus_type_id: number
          calculated_amount?: number
          calculation_details?: Json | null
          created_at?: string | null
          employee_bonus_id: number
          employee_id: number
          id?: number
          month: number
          status?: string | null
          updated_at?: string | null
          year: number
        }
        Update: {
          base_amount?: number | null
          base_hours?: number | null
          bonus_type_id?: number
          calculated_amount?: number
          calculation_details?: Json | null
          created_at?: string | null
          employee_bonus_id?: number
          employee_id?: number
          id?: number
          month?: number
          status?: string | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "bonus_calculations_bonus_type_id_fkey"
            columns: ["bonus_type_id"]
            isOneToOne: false
            referencedRelation: "bonus_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bonus_calculations_bonus_type_id_fkey"
            columns: ["bonus_type_id"]
            isOneToOne: false
            referencedRelation: "v_bonus_rules_full"
            referencedColumns: ["bonus_type_id"]
          },
          {
            foreignKeyName: "bonus_calculations_employee_bonus_id_fkey"
            columns: ["employee_bonus_id"]
            isOneToOne: false
            referencedRelation: "employee_bonuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bonus_calculations_employee_bonus_id_fkey"
            columns: ["employee_bonus_id"]
            isOneToOne: false
            referencedRelation: "v_active_employee_bonuses"
            referencedColumns: ["employee_bonus_id"]
          },
          {
            foreignKeyName: "bonus_calculations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      bonus_documentation: {
        Row: {
          bonus_type_code: string
          content: string
          created_at: string | null
          id: number
          section: string
        }
        Insert: {
          bonus_type_code: string
          content: string
          created_at?: string | null
          id?: number
          section: string
        }
        Update: {
          bonus_type_code?: string
          content?: string
          created_at?: string | null
          id?: number
          section?: string
        }
        Relationships: []
      }
      bonus_rules: {
        Row: {
          bonus_type_id: number
          config: Json | null
          created_at: string | null
          description: string | null
          exclude_own_hours: boolean | null
          formula_type: string
          id: number
          is_active: boolean | null
          max_bonus_amount: number | null
          max_hours: number | null
          min_bonus_amount: number | null
          min_hours: number | null
          name: string
          priority: number | null
          source_type: string
          updated_at: string | null
        }
        Insert: {
          bonus_type_id: number
          config?: Json | null
          created_at?: string | null
          description?: string | null
          exclude_own_hours?: boolean | null
          formula_type: string
          id?: number
          is_active?: boolean | null
          max_bonus_amount?: number | null
          max_hours?: number | null
          min_bonus_amount?: number | null
          min_hours?: number | null
          name: string
          priority?: number | null
          source_type: string
          updated_at?: string | null
        }
        Update: {
          bonus_type_id?: number
          config?: Json | null
          created_at?: string | null
          description?: string | null
          exclude_own_hours?: boolean | null
          formula_type?: string
          id?: number
          is_active?: boolean | null
          max_bonus_amount?: number | null
          max_hours?: number | null
          min_bonus_amount?: number | null
          min_hours?: number | null
          name?: string
          priority?: number | null
          source_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bonus_rules_bonus_type_id_fkey"
            columns: ["bonus_type_id"]
            isOneToOne: false
            referencedRelation: "bonus_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bonus_rules_bonus_type_id_fkey"
            columns: ["bonus_type_id"]
            isOneToOne: false
            referencedRelation: "v_bonus_rules_full"
            referencedColumns: ["bonus_type_id"]
          },
        ]
      }
      bonus_types: {
        Row: {
          calculation_type: string
          code: string
          created_at: string | null
          description: string
          id: number
          is_recurring: boolean
          updated_at: string | null
        }
        Insert: {
          calculation_type: string
          code: string
          created_at?: string | null
          description: string
          id?: number
          is_recurring?: boolean
          updated_at?: string | null
        }
        Update: {
          calculation_type?: string
          code?: string
          created_at?: string | null
          description?: string
          id?: number
          is_recurring?: boolean
          updated_at?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          company_name: string
          company_website: string
          created_at: string | null
          email: string
          first_name: string
          id: number
          industry: string
          last_name: string
          legal_address: string
          legal_city: string
          legal_country: string
          legal_state: string
          legal_zip: string
          status: string
          updated_at: string | null
        }
        Insert: {
          company_name: string
          company_website: string
          created_at?: string | null
          email: string
          first_name: string
          id?: number
          industry: string
          last_name: string
          legal_address: string
          legal_city: string
          legal_country: string
          legal_state: string
          legal_zip: string
          status: string
          updated_at?: string | null
        }
        Update: {
          company_name?: string
          company_website?: string
          created_at?: string | null
          email?: string
          first_name?: string
          id?: number
          industry?: string
          last_name?: string
          legal_address?: string
          legal_city?: string
          legal_country?: string
          legal_state?: string
          legal_zip?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          client_id: number
          created_at: string | null
          end_date: string | null
          id: number
          signer_first_name: string
          signer_last_name: string
          start_date: string
          updated_at: string | null
        }
        Insert: {
          client_id: number
          created_at?: string | null
          end_date?: string | null
          id?: number
          signer_first_name: string
          signer_last_name: string
          start_date: string
          updated_at?: string | null
        }
        Update: {
          client_id?: number
          created_at?: string | null
          end_date?: string | null
          id?: number
          signer_first_name?: string
          signer_last_name?: string
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_bonuses: {
        Row: {
          bonus_type_id: number
          bonus_value: number
          created_at: string | null
          employee_id: number
          end_date: string | null
          id: number
          is_active: boolean | null
          notes: string | null
          project_id: number | null
          start_date: string
          updated_at: string | null
        }
        Insert: {
          bonus_type_id: number
          bonus_value: number
          created_at?: string | null
          employee_id: number
          end_date?: string | null
          id?: number
          is_active?: boolean | null
          notes?: string | null
          project_id?: number | null
          start_date: string
          updated_at?: string | null
        }
        Update: {
          bonus_type_id?: number
          bonus_value?: number
          created_at?: string | null
          employee_id?: number
          end_date?: string | null
          id?: number
          is_active?: boolean | null
          notes?: string | null
          project_id?: number | null
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_bonuses_bonus_type_id_fkey"
            columns: ["bonus_type_id"]
            isOneToOne: false
            referencedRelation: "bonus_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_bonuses_bonus_type_id_fkey"
            columns: ["bonus_type_id"]
            isOneToOne: false
            referencedRelation: "v_bonus_rules_full"
            referencedColumns: ["bonus_type_id"]
          },
          {
            foreignKeyName: "employee_bonuses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_bonuses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_grades: {
        Row: {
          assessment_id: number | null
          created_at: string | null
          effective_date: string
          employee_id: number
          end_date: string | null
          grade_id: number
          id: number
          notes: string | null
          specialization_id: number
          updated_at: string | null
        }
        Insert: {
          assessment_id?: number | null
          created_at?: string | null
          effective_date?: string
          employee_id: number
          end_date?: string | null
          grade_id: number
          id?: number
          notes?: string | null
          specialization_id: number
          updated_at?: string | null
        }
        Update: {
          assessment_id?: number | null
          created_at?: string | null
          effective_date?: string
          employee_id?: number
          end_date?: string | null
          grade_id?: number
          id?: number
          notes?: string | null
          specialization_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_grades_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_grades_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_grades_specialization_id_fkey"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "specializations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_grades_specialization_id_fkey"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "v_employee_skills_stats"
            referencedColumns: ["specialization_id"]
          },
          {
            foreignKeyName: "fk_employee_grades_assessment"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "skill_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_position_history: {
        Row: {
          created_at: string | null
          employee_id: number
          end_date: string | null
          id: number
          is_lead: boolean | null
          notes: string | null
          position_id: number
          start_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id: number
          end_date?: string | null
          id?: number
          is_lead?: boolean | null
          notes?: string | null
          position_id: number
          start_date: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: number
          end_date?: string | null
          id?: number
          is_lead?: boolean | null
          notes?: string | null
          position_id?: number
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_position_history_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_position_history_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_salaries: {
        Row: {
          base_salary: number
          created_at: string | null
          employee_id: number
          end_date: string | null
          id: number
          start_date: string
          updated_at: string | null
        }
        Insert: {
          base_salary: number
          created_at?: string | null
          employee_id: number
          end_date?: string | null
          id?: number
          start_date: string
          updated_at?: string | null
        }
        Update: {
          base_salary?: number
          created_at?: string | null
          employee_id?: number
          end_date?: string | null
          id?: number
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_salaries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_skills: {
        Row: {
          created_at: string | null
          current_level: number
          employee_id: number
          id: number
          last_assessed_at: string | null
          notes: string | null
          skill_id: number
          target_level: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_level?: number
          employee_id: number
          id?: number
          last_assessed_at?: string | null
          notes?: string | null
          skill_id: number
          target_level?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_level?: number
          employee_id?: number
          id?: number
          last_assessed_at?: string | null
          notes?: string | null
          skill_id?: number
          target_level?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_skills_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_specializations: {
        Row: {
          created_at: string | null
          employee_id: number
          end_date: string | null
          id: number
          is_primary: boolean | null
          specialization_id: number
          start_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id: number
          end_date?: string | null
          id?: number
          is_primary?: boolean | null
          specialization_id: number
          start_date?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: number
          end_date?: string | null
          id?: number
          is_primary?: boolean | null
          specialization_id?: number
          start_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_specializations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_specializations_specialization_id_fkey"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "specializations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_specializations_specialization_id_fkey"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "v_employee_skills_stats"
            referencedColumns: ["specialization_id"]
          },
        ]
      }
      employee_training_enrollments: {
        Row: {
          certificate_url: string | null
          completion_date: string | null
          created_at: string | null
          employee_id: number
          enrollment_date: string
          final_score: number | null
          id: number
          mentor_id: number | null
          notes: string | null
          program_id: number
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          certificate_url?: string | null
          completion_date?: string | null
          created_at?: string | null
          employee_id: number
          enrollment_date?: string
          final_score?: number | null
          id?: number
          mentor_id?: number | null
          notes?: string | null
          program_id: number
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          certificate_url?: string | null
          completion_date?: string | null
          created_at?: string | null
          employee_id?: number
          enrollment_date?: string
          final_score?: number | null
          id?: number
          mentor_id?: number | null
          notes?: string | null
          program_id?: number
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_training_enrollments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_training_enrollments_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_training_enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          birthday: string
          created_at: string | null
          email: string
          employment_date: string
          first_name: string
          id: number
          is_lead: boolean | null
          last_name: string
          position: string | null
          position_id: number | null
          slack_user_id: string | null
          status: string
          team_id: number | null
          updated_at: string | null
        }
        Insert: {
          birthday: string
          created_at?: string | null
          email: string
          employment_date: string
          first_name: string
          id?: number
          is_lead?: boolean | null
          last_name: string
          position?: string | null
          position_id?: number | null
          slack_user_id?: string | null
          status: string
          team_id?: number | null
          updated_at?: string | null
        }
        Update: {
          birthday?: string
          created_at?: string | null
          email?: string
          employment_date?: string
          first_name?: string
          id?: number
          is_lead?: boolean | null
          last_name?: string
          position?: string | null
          position_id?: number | null
          slack_user_id?: string | null
          status?: string
          team_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_requirements: {
        Row: {
          additional_requirements: Json | null
          created_at: string | null
          grade_id: number
          id: number
          min_core_skills_score: number
          min_total_skills_score: number
          specialization_id: number
          updated_at: string | null
        }
        Insert: {
          additional_requirements?: Json | null
          created_at?: string | null
          grade_id: number
          id?: number
          min_core_skills_score?: number
          min_total_skills_score?: number
          specialization_id: number
          updated_at?: string | null
        }
        Update: {
          additional_requirements?: Json | null
          created_at?: string | null
          grade_id?: number
          id?: number
          min_core_skills_score?: number
          min_total_skills_score?: number
          specialization_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grade_requirements_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_requirements_specialization_id_fkey"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "specializations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_requirements_specialization_id_fkey"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "v_employee_skills_stats"
            referencedColumns: ["specialization_id"]
          },
        ]
      }
      grade_skill_requirements: {
        Row: {
          created_at: string | null
          grade_id: number
          id: number
          is_mandatory: boolean | null
          min_level: number
          skill_id: number
          specialization_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          grade_id: number
          id?: number
          is_mandatory?: boolean | null
          min_level?: number
          skill_id: number
          specialization_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          grade_id?: number
          id?: number
          is_mandatory?: boolean | null
          min_level?: number
          skill_id?: number
          specialization_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grade_skill_requirements_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_skill_requirements_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_skill_requirements_specialization_id_fkey"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "specializations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_skill_requirements_specialization_id_fkey"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "v_employee_skills_stats"
            referencedColumns: ["specialization_id"]
          },
        ]
      }
      grades: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: number
          is_active: boolean | null
          min_capacity: number | null
          min_experience_months: number | null
          monthly_hours_norm: number | null
          name: string
          sort_order: number
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          min_capacity?: number | null
          min_experience_months?: number | null
          monthly_hours_norm?: number | null
          name: string
          sort_order?: number
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          min_capacity?: number | null
          min_experience_months?: number | null
          monthly_hours_norm?: number | null
          name?: string
          sort_order?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          amount: number | null
          created_at: string | null
          description: string | null
          hours: number
          id: number
          invoice_id: number
          project_assignee_id: number
          rate: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          description?: string | null
          hours: number
          id?: number
          invoice_id: number
          project_assignee_id: number
          rate?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          description?: string | null
          hours?: number
          id?: number
          invoice_id?: number
          project_assignee_id?: number
          rate?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_project_assignee_id_fkey"
            columns: ["project_assignee_id"]
            isOneToOne: false
            referencedRelation: "project_assignees"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: number
          created_at: string | null
          due_date: string | null
          id: number
          invoice_date: string | null
          invoice_number: string | null
          status: string | null
          total_amount: number | null
          updated_at: string | null
        }
        Insert: {
          client_id: number
          created_at?: string | null
          due_date?: string | null
          id?: number
          invoice_date?: string | null
          invoice_number?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Update: {
          client_id?: number
          created_at?: string | null
          due_date?: string | null
          id?: number
          invoice_date?: string | null
          invoice_number?: string | null
          status?: string | null
          total_amount?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      leaves: {
        Row: {
          created_at: string | null
          employee_id: number
          end_date: string
          id: number
          leave_type: string
          reason: string | null
          start_date: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id: number
          end_date: string
          id?: number
          leave_type: string
          reason?: string | null
          start_date: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: number
          end_date?: string
          id?: number
          leave_type?: string
          reason?: string | null
          start_date?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leaves_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_report_entries: {
        Row: {
          created_at: string | null
          id: number
          monthly_report_id: number
          time_tracking_id: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          monthly_report_id: number
          time_tracking_id: number
        }
        Update: {
          created_at?: string | null
          id?: number
          monthly_report_id?: number
          time_tracking_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_report_entries_monthly_report_id_fkey"
            columns: ["monthly_report_id"]
            isOneToOne: false
            referencedRelation: "monthly_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_report_entries_time_tracking_id_fkey"
            columns: ["time_tracking_id"]
            isOneToOne: false
            referencedRelation: "time_tracking"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_reports: {
        Row: {
          billable_hours: number
          created_at: string | null
          employee_id: number
          employee_salary_id: number | null
          external_hours: number
          id: number
          internal_hours: number
          month: number
          status: string | null
          total_hours: number
          updated_at: string | null
          year: number
        }
        Insert: {
          billable_hours?: number
          created_at?: string | null
          employee_id: number
          employee_salary_id?: number | null
          external_hours?: number
          id?: number
          internal_hours?: number
          month: number
          status?: string | null
          total_hours?: number
          updated_at?: string | null
          year: number
        }
        Update: {
          billable_hours?: number
          created_at?: string | null
          employee_id?: number
          employee_salary_id?: number | null
          external_hours?: number
          id?: number
          internal_hours?: number
          month?: number
          status?: string | null
          total_hours?: number
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_reports_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_reports_employee_salary_id_fkey"
            columns: ["employee_salary_id"]
            isOneToOne: false
            referencedRelation: "employee_salaries"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          code: string
          created_at: string | null
          department: string | null
          description: string | null
          id: number
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          department?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          department?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      project_assignees: {
        Row: {
          created_at: string | null
          employee_id: number
          end_date: string | null
          hourly_rate: number | null
          id: number
          project_id: number
          role: string
          start_date: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id: number
          end_date?: string | null
          hourly_rate?: number | null
          id?: number
          project_id: number
          role: string
          start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: number
          end_date?: string | null
          hourly_rate?: number | null
          id?: number
          project_id?: number
          role?: string
          start_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_assignees_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_assignees_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          billing_type: string
          client_id: number | null
          created_at: string | null
          end_date: string | null
          fixed_price: number | null
          id: number
          name: string
          slack_channel_id: string | null
          start_date: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          billing_type: string
          client_id?: number | null
          created_at?: string | null
          end_date?: string | null
          fixed_price?: number | null
          id?: number
          name: string
          slack_channel_id?: string | null
          start_date?: string | null
          status: string
          updated_at?: string | null
        }
        Update: {
          billing_type?: string
          client_id?: number | null
          created_at?: string | null
          end_date?: string | null
          fixed_price?: number | null
          id?: number
          name?: string
          slack_channel_id?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_assessments: {
        Row: {
          assessment_date: string
          assessor_comment: string | null
          assessor_id: number | null
          core_skills_score: number | null
          created_at: string | null
          current_grade_id: number | null
          employee_id: number
          experience_requirement_met: boolean | null
          id: number
          next_assessment_date: string | null
          session_id: number | null
          specialization_id: number
          status: string | null
          target_grade_id: number | null
          total_skills_score: number | null
          updated_at: string | null
        }
        Insert: {
          assessment_date?: string
          assessor_comment?: string | null
          assessor_id?: number | null
          core_skills_score?: number | null
          created_at?: string | null
          current_grade_id?: number | null
          employee_id: number
          experience_requirement_met?: boolean | null
          id?: number
          next_assessment_date?: string | null
          session_id?: number | null
          specialization_id: number
          status?: string | null
          target_grade_id?: number | null
          total_skills_score?: number | null
          updated_at?: string | null
        }
        Update: {
          assessment_date?: string
          assessor_comment?: string | null
          assessor_id?: number | null
          core_skills_score?: number | null
          created_at?: string | null
          current_grade_id?: number | null
          employee_id?: number
          experience_requirement_met?: boolean | null
          id?: number
          next_assessment_date?: string | null
          session_id?: number | null
          specialization_id?: number
          status?: string | null
          target_grade_id?: number | null
          total_skills_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_assessments_assessor_id_fkey"
            columns: ["assessor_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_assessments_current_grade_id_fkey"
            columns: ["current_grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_assessments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_assessments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "assessment_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_assessments_specialization_id_fkey"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "specializations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_assessments_specialization_id_fkey"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "v_employee_skills_stats"
            referencedColumns: ["specialization_id"]
          },
          {
            foreignKeyName: "skill_assessments_target_grade_id_fkey"
            columns: ["target_grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_categories: {
        Row: {
          code: string
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: number
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: number
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: number
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      skill_levels: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          level: number
          name: string
          requirements: string | null
          score_value: number
          skill_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: number
          level: number
          name: string
          requirements?: string | null
          score_value?: number
          skill_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: number
          level?: number
          name?: string
          requirements?: string | null
          score_value?: number
          skill_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_levels_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_requests: {
        Row: {
          category_id: number | null
          created_at: string | null
          created_skill_id: number | null
          description: string | null
          id: number
          justification: string | null
          requested_by_id: number
          review_comment: string | null
          reviewed_at: string | null
          reviewed_by_id: number | null
          skill_name: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          category_id?: number | null
          created_at?: string | null
          created_skill_id?: number | null
          description?: string | null
          id?: number
          justification?: string | null
          requested_by_id: number
          review_comment?: string | null
          reviewed_at?: string | null
          reviewed_by_id?: number | null
          skill_name: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          category_id?: number | null
          created_at?: string | null
          created_skill_id?: number | null
          description?: string | null
          id?: number
          justification?: string | null
          requested_by_id?: number
          review_comment?: string | null
          reviewed_at?: string | null
          reviewed_by_id?: number | null
          skill_name?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "skill_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_requests_created_skill_id_fkey"
            columns: ["created_skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_requests_requested_by_id_fkey"
            columns: ["requested_by_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_requests_reviewed_by_id_fkey"
            columns: ["reviewed_by_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          category_id: number | null
          code: string
          coefficient_bubble: number | null
          coefficient_general: number | null
          created_at: string | null
          description: string | null
          id: number
          is_active: boolean | null
          is_core_bubble: boolean | null
          is_core_general: boolean | null
          logo_url: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          category_id?: number | null
          code: string
          coefficient_bubble?: number | null
          coefficient_general?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          is_core_bubble?: boolean | null
          is_core_general?: boolean | null
          logo_url?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          category_id?: number | null
          code?: string
          coefficient_bubble?: number | null
          coefficient_general?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          is_core_bubble?: boolean | null
          is_core_general?: boolean | null
          logo_url?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "skill_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      specialization_core_skills: {
        Row: {
          coefficient: number
          created_at: string | null
          id: number
          is_mandatory: boolean | null
          skill_id: number
          specialization_id: number
          updated_at: string | null
        }
        Insert: {
          coefficient?: number
          created_at?: string | null
          id?: number
          is_mandatory?: boolean | null
          skill_id: number
          specialization_id: number
          updated_at?: string | null
        }
        Update: {
          coefficient?: number
          created_at?: string | null
          id?: number
          is_mandatory?: boolean | null
          skill_id?: number
          specialization_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "specialization_core_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialization_core_skills_specialization_id_fkey"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "specializations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "specialization_core_skills_specialization_id_fkey"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "v_employee_skills_stats"
            referencedColumns: ["specialization_id"]
          },
        ]
      }
      specializations: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: number
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string | null
          description: string | null
          due_date: string | null
          employee_id: number
          id: number
          name: string
          priority: string | null
          project_id: number
          status: string | null
          task_category: string
          task_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          employee_id: number
          id?: number
          name: string
          priority?: string | null
          project_id: number
          status?: string | null
          task_category: string
          task_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          employee_id?: number
          id?: number
          name?: string
          priority?: string | null
          project_id?: number
          status?: string | null
          task_category?: string
          task_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_employees: {
        Row: {
          created_at: string | null
          employee_id: number
          end_date: string | null
          id: number
          start_date: string
          team_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id: number
          end_date?: string | null
          id?: number
          start_date: string
          team_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: number
          end_date?: string | null
          id?: number
          start_date?: string
          team_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_employees_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_employees_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          id: number
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      time_tracking: {
        Row: {
          created_at: string | null
          date: string
          description: string | null
          employee_id: number
          hours: number
          id: number
          is_billable: boolean | null
          leave_id: number | null
          project_id: number
          task_id: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          description?: string | null
          employee_id: number
          hours: number
          id?: number
          is_billable?: boolean | null
          leave_id?: number | null
          project_id: number
          task_id: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string | null
          employee_id?: number
          hours?: number
          id?: number
          is_billable?: boolean | null
          leave_id?: number | null
          project_id?: number
          task_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_tracking_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_tracking_leave_id_fkey"
            columns: ["leave_id"]
            isOneToOne: false
            referencedRelation: "leaves"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_tracking_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_tracking_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      training_program_skills: {
        Row: {
          created_at: string | null
          id: number
          program_id: number
          skill_id: number
          target_level: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          program_id: number
          skill_id: number
          target_level?: number
        }
        Update: {
          created_at?: string | null
          id?: number
          program_id?: number
          skill_id?: number
          target_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "training_program_skills_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_program_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      training_programs: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          duration_days: number | null
          id: number
          is_active: boolean | null
          is_mandatory_for_new: boolean | null
          is_mandatory_for_promotion: boolean | null
          max_grade_id: number | null
          min_grade_id: number | null
          name: string
          syllabus: Json | null
          target_specialization_id: number | null
          training_type_id: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          duration_days?: number | null
          id?: number
          is_active?: boolean | null
          is_mandatory_for_new?: boolean | null
          is_mandatory_for_promotion?: boolean | null
          max_grade_id?: number | null
          min_grade_id?: number | null
          name: string
          syllabus?: Json | null
          target_specialization_id?: number | null
          training_type_id?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          duration_days?: number | null
          id?: number
          is_active?: boolean | null
          is_mandatory_for_new?: boolean | null
          is_mandatory_for_promotion?: boolean | null
          max_grade_id?: number | null
          min_grade_id?: number | null
          name?: string
          syllabus?: Json | null
          target_specialization_id?: number | null
          training_type_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_programs_max_grade_id_fkey"
            columns: ["max_grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_programs_min_grade_id_fkey"
            columns: ["min_grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_programs_target_specialization_id_fkey"
            columns: ["target_specialization_id"]
            isOneToOne: false
            referencedRelation: "specializations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_programs_target_specialization_id_fkey"
            columns: ["target_specialization_id"]
            isOneToOne: false
            referencedRelation: "v_employee_skills_stats"
            referencedColumns: ["specialization_id"]
          },
          {
            foreignKeyName: "training_programs_training_type_id_fkey"
            columns: ["training_type_id"]
            isOneToOne: false
            referencedRelation: "training_types"
            referencedColumns: ["id"]
          },
        ]
      }
      training_types: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: number
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_active_employee_bonuses: {
        Row: {
          bonus_type_code: string | null
          bonus_type_description: string | null
          bonus_type_id: number | null
          bonus_value: number | null
          calculation_type: string | null
          email: string | null
          employee_bonus_id: number | null
          employee_id: number | null
          employee_name: string | null
          end_date: string | null
          is_active: boolean | null
          notes: string | null
          position: string | null
          project_id: number | null
          project_name: string | null
          start_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_bonuses_bonus_type_id_fkey"
            columns: ["bonus_type_id"]
            isOneToOne: false
            referencedRelation: "bonus_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_bonuses_bonus_type_id_fkey"
            columns: ["bonus_type_id"]
            isOneToOne: false
            referencedRelation: "v_bonus_rules_full"
            referencedColumns: ["bonus_type_id"]
          },
          {
            foreignKeyName: "employee_bonuses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_bonuses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      v_bonus_rules_full: {
        Row: {
          applicable_positions: string | null
          bonus_type_code: string | null
          bonus_type_description: string | null
          bonus_type_id: number | null
          calculation_type: string | null
          config: Json | null
          exclude_own_hours: boolean | null
          formula_description: string | null
          formula_type: string | null
          is_recurring: boolean | null
          max_bonus_amount: number | null
          max_hours: number | null
          min_bonus_amount: number | null
          min_hours: number | null
          priority: number | null
          rule_description: string | null
          rule_id: number | null
          rule_is_active: boolean | null
          rule_name: string | null
          scope: string | null
          source_type: string | null
        }
        Relationships: []
      }
      v_bonus_summary: {
        Row: {
          active_bonuses: number | null
          bonus_type: string | null
          description: string | null
          employees_with_bonus: number | null
          exclude_own_hours: boolean | null
          formula: string | null
          formula_type: string | null
          is_active: boolean | null
          source_type: string | null
        }
        Relationships: []
      }
      v_employee_current_grade: {
        Row: {
          effective_date: string | null
          email: string | null
          employee_id: number | null
          first_name: string | null
          grade_code: string | null
          grade_id: number | null
          grade_name: string | null
          last_name: string | null
          specialization_id: number | null
          specialization_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_grades_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_grades_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_grades_specialization_id_fkey"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "specializations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_grades_specialization_id_fkey"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "v_employee_skills_stats"
            referencedColumns: ["specialization_id"]
          },
        ]
      }
      v_employee_skills_stats: {
        Row: {
          core_skills_count: number | null
          core_skills_score: number | null
          employee_id: number | null
          employee_name: string | null
          specialization_id: number | null
          specialization_name: string | null
          total_skills: number | null
          total_skills_score: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_skills_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
