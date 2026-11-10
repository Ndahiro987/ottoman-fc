export type UserRole = "administrator" | "coach" | "player";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  role: UserRole;
  is_active: boolean;
  permissions: string[];
}

export interface Player {
  id: string;
  player_id: string;
  user_id?: string | null;
  full_name: string;
  date_of_birth?: string | null;
  gender?: string | null;
  nationality?: string | null;
  national_id?: string | null;
  passport_number?: string | null;
  phone?: string | null;
  alternative_phone?: string | null;
  email?: string | null;
  residential_address?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_number?: string | null;
  photograph_url?: string | null;
  primary_position?: string | null;
  secondary_position?: string | null;
  preferred_foot?: string | null;
  jersey_number?: number | null;
  previous_club?: string | null;
  football_experience?: string | null;
  player_category?: string | null;
  registration_date?: string | null;
  status: string;
  kyc_status: string;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  contract_id: string;
  player_id: string;
  player_name?: string | null;
  contract_type: string;
  commencement_date: string;
  expiry_date: string;
  agreed_remuneration?: number | null;
  currency: string;
  payment_frequency?: string | null;
  contract_conditions?: string | null;
  additional_clauses?: string | null;
  status: string;
  supporting_documents?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentRequest {
  id: string;
  request_number: string;
  player_id: string;
  player_name?: string | null;
  payment_category: string;
  amount: number;
  currency: string;
  payment_description?: string | null;
  requested_date: string;
  requested_by?: string | null;
  supporting_evidence?: string | null;
  approval_status: string;
  approved_by?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  payment_request_id: string;
  transaction_reference?: string | null;
  amount: number;
  currency: string;
  payment_method?: string | null;
  payment_date: string;
  confirmed_by?: string | null;
  receipt_url?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface Match {
  id: string;
  opponent: string;
  competition?: string | null;
  match_date: string;
  venue?: string | null;
  home_or_away?: string | null;
  home_score?: number | null;
  away_score?: number | null;
  status: string;
  coach_comments?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TrainingSession {
  id: string;
  title: string;
  session_type?: string | null;
  session_date: string;
  venue?: string | null;
  responsible_coach?: string | null;
  description?: string | null;
  squad_ids?: string[];
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message?: string | null;
  type?: string | null;
  is_read: boolean;
  created_at: string;
  link?: string | null;
}

export interface TacticalPlan {
  id: string;
  name: string;
  formation?: string | null;
  match_or_training?: string | null;
  coaching_notes?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string | null;
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  old_values?: any;
  new_values?: any;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}
