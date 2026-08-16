// Shared types matching supabase/schema.sql

export type ParqAnswers = {
  chestPain: boolean;
  dizziness: boolean;
  jointProblem: boolean;
  cardiacMedication: boolean;
  doctorRestriction: boolean;
  pregnancy: boolean;
  otherReason: boolean;
};

export type ReadinessScreening = {
  id: string;
  user_id: string;
  parq_answers: ParqAnswers;
  cleared: boolean;
  professional_clearance_ack: boolean;
  created_at: string;
};

export type Contraindication = {
  id: string;
  user_id: string;
  body_part: string;
  severity: "avoid_entirely" | "manage_around";
  note: string | null;
};

export type TrainingPreferences = {
  user_id: string;
  goal: "build_muscle" | "lose_fat" | "improve_strength" | "improve_endurance" | "general_fitness" | "mobility";
  equipment: string[];
  workout_location: "gym" | "home" | "outdoor";
  days_per_week: number;
  session_duration_minutes: number;
};
