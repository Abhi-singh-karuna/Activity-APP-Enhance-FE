export type Category = "Personal" | "Work" | "Workout" | "Learning";

export interface Activity {
  id: string;
  title: string;
  category: Category;
  startDate: string;
  endDate: string;
  duration: string;
  color: string;
  priority: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: Category;
  dueDate: string;
  isCompleted: boolean;
  color: string;
  priority: number;
  createdAt: string;
}

export interface CompletionRate {
  day: string;
  rate: number;
}
