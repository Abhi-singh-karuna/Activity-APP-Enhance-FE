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

export interface UpdateSettingItemData extends Partial<CreateSettingItemData> {
  id: string;
}

// API Response interfaces based on the OpenAPI spec
export interface ApiItemResponse {
  id: string;
  name: string;
  icon: string;
  color: string;
  priority?: number;
  level?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ApiCategoriesResponse {
  categories: ApiItemResponse[];
}

export interface ApiSkipReasonsResponse {
  skip_reasons: ApiItemResponse[];
}

export interface ApiPrioritiesResponse {
  priorities: ApiItemResponse[];
}

export interface ApiItemDataResponse {
  item: ApiItemResponse;
}

// Default color options for settings
// export const DEFAULT_COLORS = [
//   "#00E5FF", // Electric Blue
//   "#9C6CDA", // Purple
//   "#4ECDC4", // Mint Green
//   "#FF9500", // Orange
//   "#FF4757", // Red
//   "#FF6B9D", // Pink
//   "#FFD93D", // Yellow
//   "#6C5CE7", // Indigo
//   "#00CEC9", // Teal
//   "#FD79A8", // Coral
//   "#00B894", // Lime
//   "#A29BFE", // Violet
// ];

// Curated icon list (20 icons) for better UX
export const ICON_OPTIONS = [
  { name: "list-outline", label: "List" },
  { name: "briefcase-outline", label: "Work" },
  { name: "fitness-outline", label: "Fitness" },
  { name: "book-outline", label: "Study" },
  { name: "game-controller-outline", label: "Gaming" },
  { name: "car-outline", label: "Travel" },
  { name: "home-outline", label: "Home" },
  { name: "restaurant-outline", label: "Food" },
  { name: "time-outline", label: "Time" },
  { name: "cloud-outline", label: "Weather" },
  { name: "medical-outline", label: "Health" },
  { name: "airplane-outline", label: "Vacation" },
  { name: "bed-outline", label: "Rest" },
  { name: "alert-circle-outline", label: "Important" },
  { name: "flag-outline", label: "Flag" },
  { name: "star-outline", label: "Star" },
  { name: "flash-outline", label: "Urgent" },
  { name: "trophy-outline", label: "Achievement" },
  { name: "target-outline", label: "Target" },
  { name: "heart-outline", label: "Personal" },
];

// Default icons for different categories
// export const DEFAULT_ICONS = {
//   categories: [
//     "list-outline",
//     "briefcase-outline",
//     "fitness-outline",
//     "book-outline",
//     "game-controller-outline",
//     "car-outline",
//     "home-outline",
//     "restaurant-outline",
//   ],
//   skipReasons: [
//     "time-outline",
//     "cloud-outline",
//     "medical-outline",
//     "airplane-outline",
//     "bed-outline",
//     "alert-circle-outline",
//   ],
//   priorities: [
//     "flag-outline",
//     "star-outline",
//     "flash-outline",
//     "trophy-outline",
//     "target-outline",
//   ],
// };

// Helper function to convert API item to SettingItem
const convertApiItemToSettingItem = (
  apiItem: ApiItemResponse,
  category: "categories" | "skipReasons" | "priorities"
): SettingItem => {
  return {
    id: apiItem.id,
    name: apiItem.name,
    icon: apiItem.icon,
    color: apiItem.color,
    category,
    priority: apiItem.priority,
    level: apiItem.level,
    createdAt: apiItem.created_at,
    updatedAt: apiItem.updated_at,
  };
};

// Categories API functions
export const getCategories = async (): Promise<
  ApiResponse<ActivityCategory[]>
> => {
  try {
    console.tron?.log("🌐 API Request: GET /settings/categories");
    const response = await apiRequest<ApiCategoriesResponse>({
      method: "GET",
      url: "/settings/categories",
    });

    if (response.status && response.data) {
      const categories = response.data.categories.map(
        (item) =>
          convertApiItemToSettingItem(item, "categories") as ActivityCategory
      );
      return {
        status: true,
        data: categories,
        message: response.message,
      };
    }

    return {
      status: false,
      error: {
        code: "FETCH_CATEGORIES_FAILED",
        message: "No data received from API",
      },
    };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return {
      status: false,
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
    console.tron?.log("🌐 API Request: POST /settings/categories", data);
    const response = await apiRequest<ApiItemDataResponse>({
      method: "POST",
      url: "/settings/categories",
      data,
    });

    if (response.status && response.data) {
      const category = convertApiItemToSettingItem(
        response.data.item,
        "categories"
      ) as ActivityCategory;
      return {
        status: true,
        data: category,
        message: response.message,
      };
    }

    return {
      status: false,
      error: {
        code: "CREATE_CATEGORY_FAILED",
        message: response.error?.message || "Failed to create category",
      },
    };
  } catch (error) {
    console.error("Error creating category:", error);
    return {
      status: false,
      error: {
        code: "CREATE_CATEGORY_FAILED",
        message: "Failed to create category. Please try again.",
      },
    };
  }
};

export const updateCategory = async (
  data: UpdateSettingItemData
): Promise<ApiResponse<ActivityCategory>> => {
  try {
    const response = await apiRequest<ApiItemDataResponse>({
      method: "PATCH",
      url: "/settings/categories",
      data,
    });

    if (response.status && response.data) {
      const category = convertApiItemToSettingItem(
        response.data.item,
        "categories"
      ) as ActivityCategory;
      return {
        status: true,
        data: category,
        message: response.message,
      };
    }

    return {
      status: false,
      error: {
        code: "UPDATE_CATEGORY_FAILED",
        message: response.error?.message || "Failed to update category",
      },
    };
  } catch (error) {
    console.error("Error updating category:", error);
    return {
      status: false,
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
      url: "/settings/categories",
      data: { id },
    });
    return response;
  } catch (error) {
    console.error("Error deleting category:", error);
    return {
      status: false,
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
    const response = await apiRequest<ApiSkipReasonsResponse>({
      method: "GET",
      url: "/settings/skip-reasons",
    });

    if (response.status && response.data) {
      const skipReasons = response.data.skip_reasons.map(
        (item) => convertApiItemToSettingItem(item, "skipReasons") as SkipReason
      );
      return {
        status: true,
        data: skipReasons,
        message: response.message,
      };
    }

    return {
      status: false,
      error: {
        code: "FETCH_SKIP_REASONS_FAILED",
        message: response.error?.message || "Failed to fetch skip reasons",
      },
    };
  } catch (error) {
    console.error("Error fetching skip reasons:", error);
    return {
      status: false,
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
    const response = await apiRequest<ApiItemDataResponse>({
      method: "POST",
      url: "/settings/skip-reasons",
      data,
    });

    if (response.status && response.data) {
      const skipReason = convertApiItemToSettingItem(
        response.data.item,
        "skipReasons"
      ) as SkipReason;
      return {
        status: true,
        data: skipReason,
        message: response.message,
      };
    }

    return response as ApiResponse<SkipReason>;
  } catch (error) {
    console.error("Error creating skip reason:", error);
    return {
      status: false,
      error: {
        code: "CREATE_SKIP_REASON_FAILED",
        message: "Failed to create skip reason. Please try again.",
      },
    };
  }
};

export const updateSkipReason = async (
  data: UpdateSettingItemData
): Promise<ApiResponse<SkipReason>> => {
  try {
    const response = await apiRequest<ApiItemDataResponse>({
      method: "PATCH",
      url: "/settings/skip-reasons",
      data,
    });

    if (response.status && response.data) {
      const skipReason = convertApiItemToSettingItem(
        response.data.item,
        "skipReasons"
      ) as SkipReason;
      return {
        status: true,
        data: skipReason,
        message: response.message,
      };
    }

    return response as ApiResponse<SkipReason>;
  } catch (error) {
    console.error("Error updating skip reason:", error);
    return {
      status: false,
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
      url: "/settings/skip-reasons",
      data: { id },
    });
    return response;
  } catch (error) {
    console.error("Error deleting skip reason:", error);
    return {
      status: false,
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
    const response = await apiRequest<ApiPrioritiesResponse>({
      method: "GET",
      url: "/settings/priorities",
    });

    if (response.status && response.data) {
      const priorities = response.data.priorities.map(
        (item) =>
          convertApiItemToSettingItem(item, "priorities") as PriorityLevel
      );
      return {
        status: true,
        data: priorities,
        message: response.message,
      };
    }

    return response as ApiResponse<PriorityLevel[]>;
  } catch (error) {
    console.error("Error fetching priorities:", error);
    return {
      status: false,
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
    const response = await apiRequest<ApiItemDataResponse>({
      method: "POST",
      url: "/settings/priorities",
      data,
    });

    if (response.status && response.data) {
      const priority = convertApiItemToSettingItem(
        response.data.item,
        "priorities"
      ) as PriorityLevel;
      return {
        status: true,
        data: priority,
        message: response.message,
      };
    }

    return response as ApiResponse<PriorityLevel>;
  } catch (error) {
    console.error("Error creating priority:", error);
    return {
      status: false,
      error: {
        code: "CREATE_PRIORITY_FAILED",
        message: "Failed to create priority. Please try again.",
      },
    };
  }
};

export const updatePriority = async (
  data: UpdateSettingItemData
): Promise<ApiResponse<PriorityLevel>> => {
  try {
    const response = await apiRequest<ApiItemDataResponse>({
      method: "PATCH",
      url: "/settings/priorities",
      data,
    });

    if (response.status && response.data) {
      const priority = convertApiItemToSettingItem(
        response.data.item,
        "priorities"
      ) as PriorityLevel;
      return {
        status: true,
        data: priority,
        message: response.message,
      };
    }

    return response as ApiResponse<PriorityLevel>;
  } catch (error) {
    console.error("Error updating priority:", error);
    return {
      status: false,
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
      url: "/settings/priorities",
      data: { id },
    });
    return response;
  } catch (error) {
    console.error("Error deleting priority:", error);
    return {
      status: false,
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
      url: "/settings/clear-all-data",
      data: {},
    });
    return response;
  } catch (error) {
    console.error("Error clearing settings:", error);
    return {
      status: false,
      error: {
        code: "CLEAR_SETTINGS_FAILED",
        message: "Failed to clear settings. Please try again.",
      },
    };
  }
};

// Delete account
export const deleteAccount = async (): Promise<ApiResponse> => {
  try {
    const response = await apiRequest({
      method: "DELETE",
      url: "/settings/delete-account",
    });
    return response;
  } catch (error) {
    console.error("Error deleting account:", error);
    return {
      status: false,
      error: {
        code: "DELETE_ACCOUNT_FAILED",
        message: "Failed to delete account. Please try again.",
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
  deleteAccount,
};

export default settingsService;
