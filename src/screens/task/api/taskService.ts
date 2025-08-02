import { apiRequest, ApiResponse } from "../../../api/shared";
import { Category } from "../../../types";

// Task interfaces
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

export interface CreateTaskRequest {
  title: string;
  description?: string;
  category: Category;
  dueDate: string;
  color: string;
  priority: number;
}

export interface UpdateTaskRequest extends CreateTaskRequest {}

export interface TaskToggleResponse {
  isCompleted: boolean;
  completedAt: string;
}

// Query parameters for getting tasks
export interface TaskQueryParams {
  date?: string;
  status?: "completed" | "pending" | "overdue";
  category?: string;
}

/**
 * Get all tasks with optional filtering
 */
export const getTasks = async (
  params?: TaskQueryParams
): Promise<ApiResponse<{ tasks: Task[] }>> => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.date) queryParams.append("date", params.date);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.category) queryParams.append("category", params.category);

    const url = `/tasks${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;

    const response = await apiRequest<{ tasks: Task[] }>({
      method: "GET",
      url,
    });
    return response;
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return {
      success: false,
      error: {
        code: "TASKS_FETCH_FAILED",
        message: "Failed to fetch tasks. Please try again.",
      },
    };
  }
};

/**
 * Create a new task
 */
export const createTask = async (
  taskData: CreateTaskRequest
): Promise<ApiResponse<Task>> => {
  try {
    const response = await apiRequest<Task>({
      method: "POST",
      url: "/tasks",
      data: taskData,
    });
    return response;
  } catch (error) {
    console.error("Error creating task:", error);
    return {
      success: false,
      error: {
        code: "TASK_CREATE_FAILED",
        message: "Failed to create task. Please try again.",
      },
    };
  }
};

/**
 * Update an existing task
 */
export const updateTask = async (
  id: string,
  taskData: UpdateTaskRequest
): Promise<ApiResponse<Task>> => {
  try {
    const response = await apiRequest<Task>({
      method: "PUT",
      url: `/tasks/${id}`,
      data: taskData,
    });
    return response;
  } catch (error) {
    console.error("Error updating task:", error);
    return {
      success: false,
      error: {
        code: "TASK_UPDATE_FAILED",
        message: "Failed to update task. Please try again.",
      },
    };
  }
};

/**
 * Delete a task
 */
export const deleteTask = async (id: string): Promise<ApiResponse> => {
  try {
    const response = await apiRequest({
      method: "DELETE",
      url: `/tasks/${id}`,
    });
    return response;
  } catch (error) {
    console.error("Error deleting task:", error);
    return {
      success: false,
      error: {
        code: "TASK_DELETE_FAILED",
        message: "Failed to delete task. Please try again.",
      },
    };
  }
};

/**
 * Toggle task completion status
 */
export const toggleTaskCompletion = async (
  id: string
): Promise<ApiResponse<TaskToggleResponse>> => {
  try {
    const response = await apiRequest<TaskToggleResponse>({
      method: "PUT",
      url: `/tasks/${id}/toggle`,
    });
    return response;
  } catch (error) {
    console.error("Error toggling task completion:", error);
    return {
      success: false,
      error: {
        code: "TASK_TOGGLE_FAILED",
        message: "Failed to toggle task completion. Please try again.",
      },
    };
  }
};

export default {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskCompletion,
};
