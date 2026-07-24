export interface User {
  id: number;
  name: string | null;
  email: string;
  phone?: string | null;
}

export interface Meal {
  name: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar?: number;
  fiber?: number;
}

export interface DayPlan {
  day: string | null;
  day_number: number | null;
  meals: Meal[];
}

export interface Targets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DietPlan {
  success: boolean;
  weekly_plan: DayPlan[];
  targets: Targets;
  tdee: number;
  totals: Targets;
}

export interface Exercise {
  Exercise_Name: string;
  Primary_Muscle: string;
  Equipment: string;
  Difficulty: string;
  Instructions: string;
  MET: number;
  Type?: string;
  Mechanics?: string;
  Level?: string;
  calories?: number;
  Video_URL?: string;
}

export interface WorkoutPlan {
  plan: Record<string, Exercise[]>;
  total_calories: number;
  duration_min: number;
  preference: string;
  chart_data: {
    pie: { labels: string[]; values: number[]; colors: string[] };
    bar: { labels: string[]; values: number[] };
    monthly: { labels: string[]; calories: number[]; kgChange: number };
    summary: string;
  };
}

export type WeekKey = "start" | "week1" | "week2" | "week3" | "week4" | "week5" | "week6";

export interface Plateau {
  detected: boolean;
  reason: string;
  net_change_kg: number | null;
  weeks_considered: number;
}

export interface ProgressData {
  success: boolean;
  weights: Record<WeekKey, number | null>;
  goal_mode: string;
  plateau: Plateau;
}

export const GOALS = ["Weight Loss", "Muscle Gain", "Maintain"];
export const ACTIVITIES = ["Sedentary", "Light", "Moderate", "Active", "Very Active"];
