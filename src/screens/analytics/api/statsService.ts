import { apiRequest, ApiResponse } from "../../../api/shared";

// Statistics interfaces
export interface CompletionRate {
  category: string;
  percentage: number;
}

export interface DailyStats {
  day: string;
  hours: number;
}

export interface TaskStats {
  completed: number;
  pending: number;
  overdue: number;
  total: number;
}

export interface DailyTaskCompletion {
  day: string;
  completed: number;
  total: number;
}

export interface StatsData {
  totalHours: string;
  billableHours: string;
  billablePercentage: string;
  completionRates: CompletionRate[];
  dailyStats: DailyStats[];
  taskStats: TaskStats;
  taskCompletionByDay: DailyTaskCompletion[];
  taskCompletionByCategory: CompletionRate[];
}

// Query parameters for getting statistics
export interface StatsQueryParams {
  period: "yesterday" | "last_week" | "last_month" | "this_year" | "custom";
  startDate?: string; // For custom period (YYYY-MM-DD)
  endDate?: string; // For custom period (YYYY-MM-DD)
}

/**
 * Get statistics data
 */
export const getStats = async (
  params: StatsQueryParams
): Promise<ApiResponse<StatsData>> => {
  try {
    const queryParams = new URLSearchParams();
    queryParams.append("period", params.period);

    if (params.startDate) queryParams.append("startDate", params.startDate);
    if (params.endDate) queryParams.append("endDate", params.endDate);

    const url = `/stats?${queryParams.toString()}`;

    const response = await apiRequest<StatsData>({
      method: "GET",
      url,
    });
    return response;
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return {
      success: false,
      error: {
        code: "STATS_FETCH_FAILED",
        message: "Failed to fetch statistics. Please try again.",
      },
    };
  }
};

export default {
  getStats,
};
