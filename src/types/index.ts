export type Category = "Personal" | "Workout" | "Work";

export interface Activity {
  id: string;
  title: string;
  category: Category;
  startDate: string;
  endDate: string;
  duration: string;
  color: string;
  tags?: string[];
  priority: number;
}

export interface TimeLog {
  duration: string;
  date: string;
  interruptions?: {
    startTime: string;
    endTime: string;
    duration: string;
  }[];
}

export interface CompletionRate {
  category: string;
  percentage: number;
}

export interface StatsData {
  totalHours: string;
  billableHours: string;
  billablePercentage: string;
  completionRates: CompletionRate[];
}
