import AsyncStorage from "@react-native-async-storage/async-storage";
import { SkipDayEntry, SkipDayDate } from "../../../api/shared";
import { apiRequest, ApiResponse } from "../../../api/shared";

// Enhanced settings interfaces
export interface SettingItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: "categories" | "skipReasons" | "priorities";
  priority?: number;
  level?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ActivityCategory extends SettingItem {
  category: "categories";
  activityCount?: number;
  lastUsed?: string;
}

export interface SkipReason extends SettingItem {
  category: "skipReasons";
  usageCount?: number;
  lastUsed?: string;
}

export interface PriorityLevel extends SettingItem {
  category: "priorities";
  level: number;
  priority: number;
  taskCount?: number;
}

export interface CreateSettingItemData {
  name: string;
  icon: string;
  color: string;
  priority?: number;
  level?: number;
}

export interface UpdateSettingItemData extends Partial<CreateSettingItemData> {}

// Default color options for settings
export const DEFAULT_COLORS = [
  "#00E5FF", // Electric Blue
  "#9C6CDA", // Purple
  "#4ECDC4", // Mint Green
  "#FF9500", // Orange
  "#FF4757", // Red
  "#FF6B9D", // Pink
  "#FFD93D", // Yellow
  "#6C5CE7", // Indigo
  "#00CEC9", // Teal
  "#FD79A8", // Coral
  "#00B894", // Lime
  "#A29BFE", // Violet
];

// Default icons for different categories
export const DEFAULT_ICONS = {
  categories: [
    "list-outline",
    "briefcase-outline",
    "fitness-outline",
    "book-outline",
    "game-controller-outline",
    "car-outline",
    "home-outline",
    "restaurant-outline",
  ],
  skipReasons: [
    "time-outline",
    "cloud-outline",
    "medical-outline",
    "airplane-outline",
    "bed-outline",
    "alert-circle-outline",
  ],
  priorities: [
    "flag-outline",
    "star-outline",
    "flash-outline",
    "trophy-outline",
    "target-outline",
  ],
};

// Categories API functions
export const getCategories = async (): Promise<
  ApiResponse<ActivityCategory[]>
> => {
  try {
    const response = await apiRequest({
      method: "GET",
      url: "/settings/categories",
    });
    return response;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return {
      success: false,
      error: {
        code: "FETCH_CATEGORIES_FAILED",
        message: "Failed to fetch categories. Please try again.",
      },
    };
  }
};

export const createCategory = async (
  data: CreateSettingItemData
): Promise<ApiResponse<ActivityCategory>> => {
  try {
    const response = await apiRequest({
      method: "POST",
      url: "/settings/categories",
      data,
    });
    return response;
  } catch (error) {
    console.error("Error creating category:", error);
    return {
      success: false,
      error: {
        code: "CREATE_CATEGORY_FAILED",
        message: "Failed to create category. Please try again.",
      },
    };
  }
};

export const updateCategory = async (
  id: string,
  data: UpdateSettingItemData
): Promise<ApiResponse<ActivityCategory>> => {
  try {
    const response = await apiRequest({
      method: "PUT",
      url: `/settings/categories/${id}`,
      data,
    });
    return response;
  } catch (error) {
    console.error("Error updating category:", error);
    return {
      success: false,
      error: {
        code: "UPDATE_CATEGORY_FAILED",
        message: "Failed to update category. Please try again.",
      },
    };
  }
};

export const deleteCategory = async (id: string): Promise<ApiResponse> => {
  try {
    const response = await apiRequest({
      method: "DELETE",
      url: `/settings/categories/${id}`,
    });
    return response;
  } catch (error) {
    console.error("Error deleting category:", error);
    return {
      success: false,
      error: {
        code: "DELETE_CATEGORY_FAILED",
        message: "Failed to delete category. Please try again.",
      },
    };
  }
};

// Skip Reasons API functions
export const getSkipReasons = async (): Promise<ApiResponse<SkipReason[]>> => {
  try {
    const response = await apiRequest({
      method: "GET",
      url: "/settings/skip-reasons",
    });
    return response;
  } catch (error) {
    console.error("Error fetching skip reasons:", error);
    return {
      success: false,
      error: {
        code: "FETCH_SKIP_REASONS_FAILED",
        message: "Failed to fetch skip reasons. Please try again.",
      },
    };
  }
};

export const createSkipReason = async (
  data: CreateSettingItemData
): Promise<ApiResponse<SkipReason>> => {
  try {
    const response = await apiRequest({
      method: "POST",
      url: "/settings/skip-reasons",
      data,
    });
    return response;
  } catch (error) {
    console.error("Error creating skip reason:", error);
    return {
      success: false,
      error: {
        code: "CREATE_SKIP_REASON_FAILED",
        message: "Failed to create skip reason. Please try again.",
      },
    };
  }
};

export const updateSkipReason = async (
  id: string,
  data: UpdateSettingItemData
): Promise<ApiResponse<SkipReason>> => {
  try {
    const response = await apiRequest({
      method: "PUT",
      url: `/settings/skip-reasons/${id}`,
      data,
    });
    return response;
  } catch (error) {
    console.error("Error updating skip reason:", error);
    return {
      success: false,
      error: {
        code: "UPDATE_SKIP_REASON_FAILED",
        message: "Failed to update skip reason. Please try again.",
      },
    };
  }
};

export const deleteSkipReason = async (id: string): Promise<ApiResponse> => {
  try {
    const response = await apiRequest({
      method: "DELETE",
      url: `/settings/skip-reasons/${id}`,
    });
    return response;
  } catch (error) {
    console.error("Error deleting skip reason:", error);
    return {
      success: false,
      error: {
        code: "DELETE_SKIP_REASON_FAILED",
        message: "Failed to delete skip reason. Please try again.",
      },
    };
  }
};

// Priorities API functions
export const getPriorities = async (): Promise<
  ApiResponse<PriorityLevel[]>
> => {
  try {
    const response = await apiRequest({
      method: "GET",
      url: "/settings/priorities",
    });
    return response;
  } catch (error) {
    console.error("Error fetching priorities:", error);
    return {
      success: false,
      error: {
        code: "FETCH_PRIORITIES_FAILED",
        message: "Failed to fetch priorities. Please try again.",
      },
    };
  }
};

export const createPriority = async (
  data: CreateSettingItemData
): Promise<ApiResponse<PriorityLevel>> => {
  try {
    const response = await apiRequest({
      method: "POST",
      url: "/settings/priorities",
      data,
    });
    return response;
  } catch (error) {
    console.error("Error creating priority:", error);
    return {
      success: false,
      error: {
        code: "CREATE_PRIORITY_FAILED",
        message: "Failed to create priority. Please try again.",
      },
    };
  }
};

export const updatePriority = async (
  id: string,
  data: UpdateSettingItemData
): Promise<ApiResponse<PriorityLevel>> => {
  try {
    const response = await apiRequest({
      method: "PUT",
      url: `/settings/priorities/${id}`,
      data,
    });
    return response;
  } catch (error) {
    console.error("Error updating priority:", error);
    return {
      success: false,
      error: {
        code: "UPDATE_PRIORITY_FAILED",
        message: "Failed to update priority. Please try again.",
      },
    };
  }
};

export const deletePriority = async (id: string): Promise<ApiResponse> => {
  try {
    const response = await apiRequest({
      method: "DELETE",
      url: `/settings/priorities/${id}`,
    });
    return response;
  } catch (error) {
    console.error("Error deleting priority:", error);
    return {
      success: false,
      error: {
        code: "DELETE_PRIORITY_FAILED",
        message: "Failed to delete priority. Please try again.",
      },
    };
  }
};

// Clear all settings
export const clearAllSettings = async (): Promise<ApiResponse> => {
  try {
    const response = await apiRequest({
      method: "POST",
      url: "/settings/clear",
      data: {},
    });
    return response;
  } catch (error) {
    console.error("Error clearing settings:", error);
    return {
      success: false,
      error: {
        code: "CLEAR_SETTINGS_FAILED",
        message: "Failed to clear settings. Please try again.",
      },
    };
  }
};

// Settings Service API
export const settingsService = {
  // Categories
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,

  // Skip Reasons
  getSkipReasons,
  createSkipReason,
  updateSkipReason,
  deleteSkipReason,

  // Priority Levels
  getPriorities,
  createPriority,
  updatePriority,
  deletePriority,

  // Bulk operations
  clearAllSettings,
};

export default settingsService;
