import AsyncStorage from "@react-native-async-storage/async-storage";
import { SkipDayEntry, SkipDayDate } from "../apiClient";
import { apiRequest, ApiResponse } from "../apiClient";

// Interface for user settings
export interface UserSettings {
  fontSizeScale: number;
  notificationsEnabled?: boolean;
  darkModeEnabled?: boolean;
  soundEnabled?: boolean;
  language?: string;
  timeFormat?: "12h" | "24h";
  dateFormat?: string;
}

// Default settings data
const DEFAULT_USER_SETTINGS: UserSettings = {
  fontSizeScale: 1.0,
  notificationsEnabled: true,
  darkModeEnabled: true,
  soundEnabled: true,
  language: "en",
  timeFormat: "24h",
  dateFormat: "YYYY/MM/DD",
};

const DEFAULT_CATEGORIES = [
  "Personal",
  "Work",
  "Workout",
  "Education",
  "Entertainment",
];

const DEFAULT_SKIP_REASONS = [
  "Sick",
  "Vacation",
  "Holiday",
  "Personal Day",
  "Emergency",
];

const DEFAULT_SKIP_DAY_ENTRIES: SkipDayEntry[] = [
  {
    id: "sick-entry",
    reason: "Sick",
    dates: [
      { date: "2023-06-15", note: "Morning doctor appointment" },
      { date: "2023-06-16", note: "Recovery day" },
    ],
    generalNote: "Taking time off due to illness",
  },
  {
    id: "vacation-entry",
    reason: "Vacation",
    dates: [
      { date: "2023-07-20", note: "First day of vacation" },
      { date: "2023-07-21", note: "Beach day" },
      { date: "2023-07-22", note: "Sightseeing" },
      { date: "2023-07-23", note: "Return travel" },
    ],
    generalNote: "Summer vacation",
  },
  {
    id: "holiday-entry",
    reason: "Holiday",
    dates: [{ date: "2023-12-25", note: "Christmas day" }],
    generalNote: "Winter holiday",
  },
];

/**
 * Get user settings from the API
 */
export const getUserSettings = async (): Promise<ApiResponse<UserSettings>> => {
  try {
    const response = await apiRequest<UserSettings>({
      method: "GET",
      url: "/settings",
    });
    return response;
  } catch (error) {
    console.error("Error fetching user settings:", error);
    // Fallback to default settings
    return {
      success: true,
      data: DEFAULT_USER_SETTINGS,
    };
  }
};

/**
 * Update user settings
 */
export const updateUserSettings = async (
  settings: Partial<UserSettings>
): Promise<ApiResponse> => {
  try {
    const response = await apiRequest({
      method: "PUT",
      url: "/settings",
      data: settings,
    });
    return response;
  } catch (error) {
    console.error("Error updating user settings:", error);
    return {
      success: false,
      error: {
        code: "SETTINGS_UPDATE_FAILED",
        message: "Failed to update settings. Please try again.",
      },
    };
  }
};

/**
 * Update font size scale setting
 */
export const updateFontSizeScale = async (
  fontSizeScale: number
): Promise<ApiResponse> => {
  try {
    const response = await apiRequest({
      method: "PUT",
      url: "/settings",
      data: { fontSizeScale },
    });
    return response;
  } catch (error) {
    console.error("Error updating font size scale:", error);
    return {
      success: false,
      error: {
        code: "FONT_SIZE_UPDATE_FAILED",
        message: "Failed to update font size scale. Please try again.",
      },
    };
  }
};

/**
 * Get categories from the API
 */
export const getCategories = async (): Promise<ApiResponse<string[]>> => {
  try {
    const response = await apiRequest<string[]>({
      method: "GET",
      url: "/settings/categories",
    });
    return response;
  } catch (error) {
    console.error("Error fetching categories:", error);
    // Fallback to default categories
    return {
      success: true,
      data: DEFAULT_CATEGORIES,
    };
  }
};

/**
 * Update categories
 */
export const updateCategories = async (
  categories: string[]
): Promise<ApiResponse> => {
  try {
    const response = await apiRequest({
      method: "PUT",
      url: "/settings/categories",
      data: { categories },
    });
    return response;
  } catch (error) {
    console.error("Error updating categories:", error);
    return {
      success: false,
      error: {
        code: "CATEGORIES_UPDATE_FAILED",
        message: "Failed to update categories. Please try again.",
      },
    };
  }
};

/**
 * Get skip reasons from the API
 */
export const getSkipReasons = async (): Promise<ApiResponse<string[]>> => {
  try {
    const response = await apiRequest<string[]>({
      method: "GET",
      url: "/settings/skip-reasons",
    });
    return response;
  } catch (error) {
    console.error("Error fetching skip reasons:", error);
    // Fallback to default skip reasons
    return {
      success: true,
      data: DEFAULT_SKIP_REASONS,
    };
  }
};

/**
 * Update skip reasons
 */
export const updateSkipReasons = async (
  skipReasons: string[]
): Promise<ApiResponse> => {
  try {
    const response = await apiRequest({
      method: "PUT",
      url: "/settings/skip-reasons",
      data: { skipReasons },
    });
    return response;
  } catch (error) {
    console.error("Error updating skip reasons:", error);
    return {
      success: false,
      error: {
        code: "SKIP_REASONS_UPDATE_FAILED",
        message: "Failed to update skip reasons. Please try again.",
      },
    };
  }
};

/**
 * Get skip day entries from the API
 */
export const getSkipDayEntries = async (): Promise<
  ApiResponse<SkipDayEntry[]>
> => {
  try {
    const response = await apiRequest<SkipDayEntry[]>({
      method: "GET",
      url: "/settings/skip-day-entries",
    });
    return response;
  } catch (error) {
    console.error("Error fetching skip day entries:", error);
    // Fallback to default skip day entries
    return {
      success: true,
      data: DEFAULT_SKIP_DAY_ENTRIES,
    };
  }
};

/**
 * Add a skip day entry
 */
export const addSkipDayEntry = async (
  entry: Omit<SkipDayEntry, "id">
): Promise<ApiResponse<SkipDayEntry>> => {
  try {
    const response = await apiRequest<SkipDayEntry>({
      method: "POST",
      url: "/settings/skip-day-entries",
      data: entry,
    });
    return response;
  } catch (error) {
    console.error("Error adding skip day entry:", error);
    return {
      success: false,
      error: {
        code: "SKIP_DAY_ADD_FAILED",
        message: "Failed to add skip day entry. Please try again.",
      },
    };
  }
};

/**
 * Update a skip day entry
 */
export const updateSkipDayEntry = async (
  skipDayEntry: SkipDayEntry
): Promise<ApiResponse<SkipDayEntry>> => {
  try {
    const response = await apiRequest<SkipDayEntry>({
      method: "PUT",
      url: `/settings/skip-day-entries/${skipDayEntry.id}`,
      data: skipDayEntry,
    });
    return response;
  } catch (error) {
    console.error("Error updating skip day entry:", error);
    return {
      success: false,
      error: {
        code: "SKIP_DAY_UPDATE_FAILED",
        message: "Failed to update skip day entry. Please try again.",
      },
    };
  }
};

/**
 * Delete a skip day entry
 */
export const deleteSkipDayEntry = async (id: string): Promise<ApiResponse> => {
  try {
    const response = await apiRequest({
      method: "DELETE",
      url: `/settings/skip-day-entries/${id}`,
    });
    return response;
  } catch (error) {
    console.error("Error deleting skip day entry:", error);
    return {
      success: false,
      error: {
        code: "SKIP_DAY_DELETE_FAILED",
        message: "Failed to delete skip day entry. Please try again.",
      },
    };
  }
};

/**
 * Clear all user data
 */
export const clearAllUserData = async (
  password: string
): Promise<ApiResponse> => {
  try {
    const response = await apiRequest({
      method: "POST",
      url: "/settings/clear-data",
      data: { password },
    });
    return response;
  } catch (error) {
    console.error("Error clearing user data:", error);
    return {
      success: false,
      error: {
        code: "CLEAR_DATA_FAILED",
        message: "Failed to clear user data. Please try again.",
      },
    };
  }
};

/**
 * Delete user account
 */
export const deleteUserAccount = async (
  password: string
): Promise<ApiResponse> => {
  try {
    const response = await apiRequest({
      method: "DELETE",
      url: "/settings/account",
      data: { password },
    });
    return response;
  } catch (error) {
    console.error("Error deleting user account:", error);
    return {
      success: false,
      error: {
        code: "DELETE_ACCOUNT_FAILED",
        message: "Failed to delete user account. Please try again.",
      },
    };
  }
};

export default {
  getUserSettings,
  updateUserSettings,
  updateFontSizeScale,
  getCategories,
  updateCategories,
  getSkipReasons,
  updateSkipReasons,
  getSkipDayEntries,
  addSkipDayEntry,
  updateSkipDayEntry,
  deleteSkipDayEntry,
  clearAllUserData,
  deleteUserAccount,
};
