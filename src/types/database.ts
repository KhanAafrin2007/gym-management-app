export type UserRole = 'admin' | 'employee' | 'member' | 'pending';

export type PaymentMode = 'Cash' | 'Card' | 'UPI' | 'NetBanking';
export type PaymentStatus = 'Completed' | 'Pending' | 'Failed' | 'Refunded';
export type MembershipStatus = 'Active' | 'Expired' | 'Cancelled';
export type EquipmentStatus = 'Working' | 'Under Repair' | 'Retired';
export type ProgramType = 'Diet' | 'Workout';
export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type Gender = 'Male' | 'Female' | 'Other';

export interface Batch {
  batch_id: string;
  batch_name: string;
  capacity: number;
  batch_time: string;
}

export interface Trainer {
  trainer_id: string;
  trainer_name: string;
  trainer_phone: string;
  salary: number;
  experience: number;
  is_active: boolean;
}

export interface Member {
  member_id: string;
  f_name: string;
  l_name: string | null;
  gender: Gender | null;
  dob: string | null;
  join_date: string;
  address: string | null;
  phone_no: string;
  email: string | null;
  batch_id: string | null;
  trainer_id: string | null;
  is_active: boolean;
  // joined relations when queried with select(`*, batch:batch_id(*), trainer:trainer_id(*)`)
  batch?: Batch | null;
  trainer?: Trainer | null;
}

export interface MembershipPlan {
  plan_id: string;
  plan_name: string;
  plan_description: string | null;
  fee: number;
  duration: number; // in months
}

export interface Membership {
  membership_id: string;
  start_date: string;
  end_date: string;
  status: MembershipStatus;
  member_id: string;
  plan_id: string;
  // joined relations
  member?: Member | null;
  membership_plan?: MembershipPlan | null;
}

export interface Payment {
  payment_id: string;
  amount: number;
  payment_mode: PaymentMode;
  payment_date: string;
  payment_status: PaymentStatus;
  member_id: string;
  // joined relations
  member?: Member | null;
}

export interface Attendance {
  member_id: string;
  attendance_date: string;
  check_in_time: string | null;
  checkout_time: string | null;
  // joined relations
  member?: Member | null;
}

export interface Feedback {
  feedback_id: string;
  feedback_date: string;
  ratings: number; // 1 to 5
  comments: string | null;
  member_id: string;
  // joined relations
  member?: Member | null;
}

export interface Equipment {
  equipment_id: string;
  equipment_name: string;
  status: EquipmentStatus;
  quality: string | null;
  purchase_date: string | null;
}

export interface EquipmentMaintenance {
  equipment_id: string;
  maintenance_date: string;
  description: string | null;
  cost: number;
  status: string | null;
  // joined relations
  equipment?: Equipment | null;
}

export interface FitnessProgram {
  program_id: string;
  program_type: ProgramType;
  created_date: string;
  trainer_id: string | null;
  // joined relations
  trainer?: Trainer | null;
  diet_plan?: DietPlan | null;
  workout_plan?: WorkoutPlan | null;
}

export interface DietPlan {
  program_id: string;
  diet_name: string;
  meal_type: string;
  meal: string;
  calories: number;
}

export interface WorkoutPlan {
  program_id: string;
  workout_name: string;
  duration: number; // in minutes
  difficulty_level: DifficultyLevel;
}

export interface MemberProgram {
  member_id: string;
  program_id: string;
  assigned_date: string;
  // joined relations
  fitness_program?: FitnessProgram & {
    diet_plan?: DietPlan | null;
    workout_plan?: WorkoutPlan | null;
  };
}

export interface AppUser {
  auth_user_id: string;
  email: string | null;
  role: UserRole;
  member_id: string | null;
  trainer_id: string | null;
  created_at: string;
  // optional joined info
  member?: Member | null;
  trainer?: Trainer | null;
}

export interface AuditLog {
  id: number;
  table_name: string;
  action: string;
  row_data: any;
  changed_by: string | null;
  changed_at: string;
}

export interface MemberPaymentSummaryView {
  member_id: string;
  full_name: string;
  total_paid: number;
}

export interface ExpiringMembershipView {
  membership_id: string;
  member_id: string;
  f_name: string;
  l_name: string;
  plan_name: string;
  end_date: string;
  days_left: number;
}
