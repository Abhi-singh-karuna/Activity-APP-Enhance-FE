import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { CURRENT_API_CONFIG } from "../../config/api";

// API Configuration
const API_CONFIG = {
  baseURL: CURRENT_API_CONFIG.baseURL,
  timeout: CURRENT_API_CONFIG.timeout,
  headers: {
    "Content-Type": "application/json",
  },
};

// Response interface for all API calls
export interface ApiResponse<T = any> {
  status: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  total_count?: number;
}

// Error types
export enum ErrorCode {
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  SERVER_ERROR = "SERVER_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
}

// Custom error class
export class ApiError extends Error {
  public code: ErrorCode;
  public status?: number;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.SERVER_ERROR,
    status?: number
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

// Create axios instance
const createApiClient = (): AxiosInstance => {
  const client = axios.create(API_CONFIG);

  // Request interceptor to add auth token
  client.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.warn("Failed to get auth token:", error);
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle common errors
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error) => {
      const { response } = error;

      if (response?.status === 401) {
        // Token expired, try to refresh
        try {
          const refreshToken = await AsyncStorage.getItem("refreshToken");
          if (refreshToken) {
            const refreshResponse = await client.post("/auth/refresh", {
              refreshToken,
            });

            if (refreshResponse.data.success) {
              const { accessToken, refreshToken: newRefreshToken } =
                refreshResponse.data.data;
              await AsyncStorage.setItem("accessToken", accessToken);
              await AsyncStorage.setItem("refreshToken", newRefreshToken);

              // Retry original request
              const originalRequest = error.config;
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return client(originalRequest);
            }
          }
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          await AsyncStorage.multiRemove([
            "accessToken",
            "refreshToken",
            "userData",
          ]);
          throw new ApiError("Session expired", ErrorCode.UNAUTHORIZED, 401);
        }
      }

      // Handle other errors
      if (response?.status === 403) {
        throw new ApiError("Access forbidden", ErrorCode.FORBIDDEN, 403);
      } else if (response?.status === 404) {
        throw new ApiError("Resource not found", ErrorCode.NOT_FOUND, 404);
      } else if (response?.status && response.status >= 500) {
        throw new ApiError(
          "Server error",
          ErrorCode.SERVER_ERROR,
          response.status
        );
      } else if (!response) {
        throw new ApiError("Network error", ErrorCode.NETWORK_ERROR);
      }

      throw error;
    }
  );

  return client;
};

// Create the API client instance
export const apiClient = createApiClient();

// Generic API request function
export const apiRequest = async <T>(config: any): Promise<ApiResponse<T>> => {
  try {
    const response = await apiClient(config);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle axios errors
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      const status = error.response?.status;

      if (status === 422) {
        throw new ApiError(message, ErrorCode.VALIDATION_ERROR, status);
      } else if (status === 401) {
        throw new ApiError("Unauthorized", ErrorCode.UNAUTHORIZED, status);
      } else if (status === 403) {
        throw new ApiError("Forbidden", ErrorCode.FORBIDDEN, status);
      } else if (status === 404) {
        throw new ApiError("Not found", ErrorCode.NOT_FOUND, status);
      } else if (status && status >= 500) {
        throw new ApiError("Server error", ErrorCode.SERVER_ERROR, status);
      } else {
        throw new ApiError(message, ErrorCode.NETWORK_ERROR, status);
      }
    }

    throw new ApiError("Unknown error occurred");
  }
};

// Auth token management
export const setAuthTokens = async (
  accessToken: string,
  refreshToken: string
) => {
  await AsyncStorage.multiSet([
    ["accessToken", accessToken],
    ["refreshToken", refreshToken],
  ]);
};

export const clearAuthTokens = async () => {
  await AsyncStorage.multiRemove(["accessToken", "refreshToken", "userData"]);
};

export const getAuthToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem("accessToken");
};

// Export types for reuse
export interface SkipDayDate {
  date: string; // ISO format (YYYY-MM-DD)
  note?: string; // Optional note specific to this date
}

export interface SkipDayEntry {
  id: string;
  reason: string;
  dates: SkipDayDate[]; // Array of dates with individual notes
  generalNote?: string; // Optional general note about this reason
}

// Default values for storage initialization
const DEFAULT_SETTINGS = {
  fontSizeScale: 1.0,
  defaultCategories: [
    "Personal",
    "Work",
    "Workout",
    "Education",
    "Entertainment",
  ],
  defaultSkipReasons: [
    "Sick",
    "Vacation",
    "Holiday",
    "Personal Day",
    "Emergency",
  ],
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

const DEFAULT_SKIP_DAY_ENTRIES = [
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
] as SkipDayEntry[];

// Function to get user settings
export const getUserSettings = async () => {
  try {
    const response = await apiRequest({
      method: "GET",
      url: "/settings",
    });
    return response;
  } catch (error) {
    console.error("Error fetching user settings:", error);
    // Fallback to default settings
    return {
      success: true,
      data: DEFAULT_SETTINGS,
    };
  }
};

// Function to get categories
export const getCategories = async () => {
  try {
    const response = await apiRequest({
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

// Function to update categories
export const updateCategories = async (categories: string[]) => {
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
      error: "Failed to update categories",
    };
  }
};

// Function to get skip reasons
export const getSkipReasons = async () => {
  try {
    const response = await apiRequest({
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

// Function to update skip reasons
export const updateSkipReasons = async (skipReasons: string[]) => {
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
      error: "Failed to update skip reasons",
    };
  }
};

// Function to get skip day entries
export const getSkipDayEntries = async () => {
  try {
    const response = await apiRequest({
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

// Function to add a skip day entry
export const addSkipDayEntry = async (entry: Omit<SkipDayEntry, "id">) => {
  try {
    const response = await apiRequest({
      method: "POST",
      url: "/settings/skip-day-entries",
      data: entry,
    });
    return response;
  } catch (error) {
    console.error("Error adding skip day entry:", error);
    return {
      success: false,
      error: "Failed to add skip day entry",
    };
  }
};

// Function to update a skip day entry
export const updateSkipDayEntry = async (skipDayEntry: SkipDayEntry) => {
  try {
    const response = await apiRequest({
      method: "PUT",
      url: `/settings/skip-day-entries/${skipDayEntry.id}`,
      data: skipDayEntry,
    });
    return response;
  } catch (error) {
    console.error("Error updating skip day entry:", error);
    return {
      success: false,
      error: "Failed to update skip day entry",
    };
  }
};

// Function to delete a skip day entry
export const deleteSkipDayEntry = async (id: string) => {
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
      error: "Failed to delete skip day entry",
    };
  }
};

// Function to update font size scale
export const updateFontSizeScale = async (fontSizeScale: number) => {
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
      error: "Failed to update font size scale",
    };
  }
};
