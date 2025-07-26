import { apiRequest, ApiResponse } from "../apiClient";
import { Category } from "../../types";

// Activity interfaces
export interface Activity {
  id: string;
  title: string;
  category: Category;
  startDate: string;
  endDate: string;
  duration: string;
  color: string;
  elapsedSeconds: number;
  priority: number;
  isRunning?: boolean;
  isCompleted?: boolean;
}

export interface CreateActivityRequest {
  title: string;
  category: Category;
  startDate: string;
  endDate: string;
  duration: string;
  color: string;
  priority: number;
}

export interface UpdateActivityRequest extends CreateActivityRequest {}

export interface ActivityTimerResponse {
  startTime?: string;
  endTime?: string;
  elapsedSeconds?: number;
  isRunning: boolean;
}

export interface ActivityCompletionResponse {
  isCompleted: boolean;
  completedAt: string;
}

// Query parameters for getting activities
export interface ActivityQueryParams {
  date?: string;
  category?: string;
  status?: "running" | "completed" | "future";
}

/**
 * Get all activities with optional filtering
 */
export const getActivities = async (
  params?: ActivityQueryParams
): Promise<ApiResponse<{ activities: Activity[] }>> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.date) queryParams.append("date", params.date);
    if (params?.category) queryParams.append("category", params.category);
    if (params?.status) queryParams.append("status", params.status);

    const url = `/activities${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    const response = await apiRequest<{ activities: Activity[] }>({
      method: "GET",
      url,
    });
    return response;
  } catch (error) {
    console.error("Error fetching activities:", error);
    return {
      success: false,
      error: {
        code: "ACTIVITIES_FETCH_FAILED",
        message: "Failed to fetch activities. Please try again.",
      },
    };
  }
};

/**
 * Create a new activity
 */
export const createActivity = async (
  activityData: CreateActivityRequest
): Promise<ApiResponse<Activity>> => {
  try {
    const response = await apiRequest<Activity>({
      method: "POST",
      url: "/activities",
      data: activityData,
    });
    return response;
  } catch (error) {
    console.error("Error creating activity:", error);
    return {
      success: false,
      error: {
        code: "ACTIVITY_CREATE_FAILED",
        message: "Failed to create activity. Please try again.",
      },
    };
  }
};

/**
 * Update an existing activity
 */
export const updateActivity = async (
  id: string,
  activityData: UpdateActivityRequest
): Promise<ApiResponse<Activity>> => {
  try {
    const response = await apiRequest<Activity>({
      method: "PUT",
      url: `/activities/${id}`,
      data: activityData,
    });
    return response;
  } catch (error) {
    console.error("Error updating activity:", error);
    return {
      success: false,
      error: {
        code: "ACTIVITY_UPDATE_FAILED",
        message: "Failed to update activity. Please try again.",
      },
    };
  }
};

/**
 * Delete an activity
 */
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
        code: "ACTIVITY_DELETE_FAILED",
        message: "Failed to delete activity. Please try again.",
      },
    };
  }
};

/**
 * Start activity timer
 */
export const startActivityTimer = async (
  id: string
): Promise<ApiResponse<ActivityTimerResponse>> => {
  try {
    const response = await apiRequest<ActivityTimerResponse>({
      method: "POST",
      url: `/activities/${id}/start`,
    });
    return response;
  } catch (error) {
    console.error("Error starting activity timer:", error);
    return {
      success: false,
      error: {
        code: "TIMER_START_FAILED",
        message: "Failed to start activity timer. Please try again.",
      },
    };
  }
};

/**
 * Stop activity timer
 */
export const stopActivityTimer = async (
  id: string
): Promise<ApiResponse<ActivityTimerResponse>> => {
  try {
    const response = await apiRequest<ActivityTimerResponse>({
      method: "POST",
      url: `/activities/${id}/stop`,
    });
    return response;
  } catch (error) {
    console.error("Error stopping activity timer:", error);
    return {
      success: false,
      error: {
        code: "TIMER_STOP_FAILED",
        message: "Failed to stop activity timer. Please try again.",
      },
    };
  }
};

/**
 * Mark activity as completed
 */
export const completeActivity = async (
  id: string
): Promise<ApiResponse<ActivityCompletionResponse>> => {
  try {
    const response = await apiRequest<ActivityCompletionResponse>({
      method: "POST",
      url: `/activities/${id}/complete`,
    });
    return response;
  } catch (error) {
    console.error("Error completing activity:", error);
    return {
      success: false,
      error: {
        code: "ACTIVITY_COMPLETE_FAILED",
        message: "Failed to complete activity. Please try again.",
      },
    };
  }
};

export default {
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  startActivityTimer,
  stopActivityTimer,
  completeActivity,
};
