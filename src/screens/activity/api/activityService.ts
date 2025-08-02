import { Activity, Category } from "../../../types";
import { apiRequest, ApiResponse } from "../../../api/shared";

// Enhanced activity interface for the API
export interface ActivityResponse extends Activity {
  isRunning?: boolean;
  currentTimer?: string;
  elapsedSeconds?: number;
  isFuture?: boolean;
  remainingSeconds?: number;
  isCompleted?: boolean;
  isPaused?: boolean;
  totalTimeSpent?: number;
  lastStartTime?: number;
  completionPercentage?: number;
  streak?: number;
  lastCompletedDate?: string;
  sessions?: ActivitySession[];
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ActivitySession {
  id: string;
  activityId: string;
  date: string;
  duration: string;
  durationSeconds: number;
  notes?: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface ActivityStatistics {
  totalActivities: number;
  activeActivities: number;
  completedActivities: number;
  pausedActivities: number;
  totalTimeSpent: number;
  averageCompletionTime: number;
  completionRate: number;
  streak: number;
  categoriesBreakdown: {
    category: Category;
    count: number;
    totalTime: number;
  }[];
  weeklyProgress: {
    date: string;
    activitiesCompleted: number;
    timeSpent: number;
  }[];
  monthlyProgress: {
    month: string;
    activitiesCompleted: number;
    timeSpent: number;
  }[];
}

export interface TimerUpdateData {
  isRunning: boolean;
  isPaused?: boolean;
  remainingSeconds?: number;
  elapsedSeconds?: number;
}

export interface CreateActivityData {
  title: string;
  category: Category;
  startDate: string;
  endDate: string;
  duration: string;
  color?: string;
  priority?: number;
  tags?: string[];
  notes?: string;
}

export interface UpdateActivityData extends Partial<CreateActivityData> {
  isCompleted?: boolean;
  totalTimeSpent?: number;
  streak?: number;
}

export interface ActivityFilters {
  category?: Category;
  isCompleted?: boolean;
  isRunning?: boolean;
  startDate?: string;
  endDate?: string;
  tags?: string[];
  sortBy?: "recent" | "priority" | "duration" | "completion" | "alphabetical";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
}

// Activity API functions
export const getActivities = async (
  filters?: ActivityFilters
): Promise<ApiResponse<{ activities: ActivityResponse[] }>> => {
  try {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.category) params.append("category", filters.category);
      if (filters.isCompleted !== undefined)
        params.append("is_completed", filters.isCompleted.toString());
      if (filters.sortBy) params.append("sort_by", filters.sortBy);
      if (filters.limit) params.append("limit", filters.limit.toString());
      if (filters.offset) params.append("offset", filters.offset.toString());
    }

    const url = `/activities${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    const response = await apiRequest({
      method: "GET",
      url,
    });
    return response as ApiResponse<{ activities: ActivityResponse[] }>;
  } catch (error) {
    console.error("Error fetching activities:", error);
    return {
      success: false,
      error: {
        code: "FETCH_ACTIVITIES_FAILED",
        message: "Failed to fetch activities. Please try again.",
      },
    };
  }
};

export const getActivity = async (
  id: string
): Promise<ApiResponse<{ activity: ActivityResponse }>> => {
  try {
    const response = await apiRequest({
      method: "GET",
      url: `/activities/${id}`,
    });
    return response as ApiResponse<{ activity: ActivityResponse }>;
  } catch (error) {
    console.error("Error fetching activity:", error);
    return {
      success: false,
      error: {
        code: "FETCH_ACTIVITY_FAILED",
        message: "Failed to fetch activity. Please try again.",
      },
    };
  }
};

export const createActivity = async (
  data: CreateActivityData
): Promise<ApiResponse<{ activity: ActivityResponse }>> => {
  try {
    const response = await apiRequest({
      method: "POST",
      url: "/activities",
      data,
    });
    return response;
  } catch (error) {
    console.error("Error creating activity:", error);
    return {
      success: false,
      error: {
        code: "CREATE_ACTIVITY_FAILED",
        message: "Failed to create activity. Please try again.",
      },
    };
  }
};

export const updateActivity = async (
  id: string,
  data: UpdateActivityData
): Promise<ApiResponse<{ activity: ActivityResponse }>> => {
  try {
    const response = await apiRequest({
      method: "PUT",
      url: `/activities/${id}`,
      data,
    });
    return response;
  } catch (error) {
    console.error("Error updating activity:", error);
    return {
      success: false,
      error: {
        code: "UPDATE_ACTIVITY_FAILED",
        message: "Failed to update activity. Please try again.",
      },
    };
  }
};

export const deleteActivity = async (id: string): Promise<ApiResponse> => {
  try {
    const response = await apiRequest({
      method: "DELETE",
      url: `/activities/${id}`,
    });
    return response;
  } catch (error) {
    console.error("Error deleting activity:", error);
    return {
      success: false,
      error: {
        code: "DELETE_ACTIVITY_FAILED",
        message: "Failed to delete activity. Please try again.",
      },
    };
  }
};

// Timer Management
export const updateTimer = async (
  id: string,
  timerData: TimerUpdateData
): Promise<ApiResponse<{ activity: ActivityResponse }>> => {
  try {
    const response = await apiRequest({
      method: "POST",
      url: `/activities/${id}/timer`,
      data: timerData,
    });
    return response;
  } catch (error) {
    console.error("Error updating timer:", error);
    return {
      success: false,
      error: {
        code: "UPDATE_TIMER_FAILED",
        message: "Failed to update timer. Please try again.",
      },
    };
  }
};

export const completeActivity = async (
  id: string
): Promise<ApiResponse<{ activity: ActivityResponse }>> => {
  try {
    const response = await apiRequest({
      method: "POST",
      url: `/activities/${id}/complete`,
      data: {},
    });
    return response;
  } catch (error) {
    console.error("Error completing activity:", error);
    return {
      success: false,
      error: {
        code: "COMPLETE_ACTIVITY_FAILED",
        message: "Failed to complete activity. Please try again.",
      },
    };
  }
};

// Session Management
export const createSession = async (
  activityId: string,
  duration: string,
  notes?: string
): Promise<ApiResponse<{ session: ActivitySession }>> => {
  try {
    const response = await apiRequest({
      method: "POST",
      url: `/activities/${activityId}/sessions`,
      data: { duration, notes },
    });
    return response;
  } catch (error) {
    console.error("Error creating session:", error);
    return {
      success: false,
      error: {
        code: "CREATE_SESSION_FAILED",
        message: "Failed to create session. Please try again.",
      },
    };
  }
};

export const getActivitySessions = async (
  activityId: string
): Promise<ApiResponse<{ sessions: ActivitySession[] }>> => {
  try {
    const response = await apiRequest({
      method: "GET",
      url: `/activities/${activityId}/sessions`,
    });
    return response;
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return {
      success: false,
      error: {
        code: "FETCH_SESSIONS_FAILED",
        message: "Failed to fetch sessions. Please try again.",
      },
    };
  }
};

// Statistics
export const getStatistics = async (): Promise<
  ApiResponse<{ statistics: ActivityStatistics }>
> => {
  try {
    const response = await apiRequest({
      method: "GET",
      url: "/activities/statistics",
    });
    return response;
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return {
      success: false,
      error: {
        code: "FETCH_STATISTICS_FAILED",
        message: "Failed to fetch statistics. Please try again.",
      },
    };
  }
};

// Search
export const searchActivities = async (
  query: string
): Promise<ApiResponse<{ activities: ActivityResponse[] }>> => {
  try {
    const response = await apiRequest({
      method: "GET",
      url: `/activities/search?query=${encodeURIComponent(query)}`,
    });
    return response;
  } catch (error) {
    console.error("Error searching activities:", error);
    return {
      success: false,
      error: {
        code: "SEARCH_ACTIVITIES_FAILED",
        message: "Failed to search activities. Please try again.",
      },
    };
  }
};

// Bulk operations
export const bulkUpdateActivities = async (
  updates: { id: string; data: UpdateActivityData }[]
): Promise<ApiResponse<{ activities: ActivityResponse[] }>> => {
  try {
    const response = await apiRequest({
      method: "PUT",
      url: "/activities/bulk",
      data: { updates },
    });
    return response;
  } catch (error) {
    console.error("Error bulk updating activities:", error);
    return {
      success: false,
      error: {
        code: "BULK_UPDATE_FAILED",
        message: "Failed to update activities. Please try again.",
      },
    };
  }
};

export const deleteAllActivities = async (): Promise<ApiResponse> => {
  try {
    const response = await apiRequest({
      method: "DELETE",
      url: "/activities",
    });
    return response;
  } catch (error) {
    console.error("Error deleting all activities:", error);
    return {
      success: false,
      error: {
        code: "DELETE_ALL_ACTIVITIES_FAILED",
        message: "Failed to delete all activities. Please try again.",
      },
    };
  }
};

// Activity Service API
export const activityService = {
  // Activity CRUD
  getActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,

  // Timer management
  updateTimer,
  completeActivity,

  // Session management
  createSession,
  getActivitySessions,

  // Statistics and analytics
  getStatistics,

  // Search and filtering
  searchActivities,

  // Bulk operations
  bulkUpdateActivities,
  deleteAllActivities,
};

export default activityService;
