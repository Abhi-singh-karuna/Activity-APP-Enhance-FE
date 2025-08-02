import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest, ApiResponse } from "../../../api/shared";

// Interface for app initialization data
export interface AppInitData {
  appVersion: string;
  serverVersion?: string;
  updates?: {
    available: boolean;
    required: boolean;
    url?: string;
  };
  maintenance?: {
    active: boolean;
    message?: string;
    estimatedEndTime?: string;
  };
  announcements?: Array<{
    id: string;
    title: string;
    message: string;
    startDate: string;
    endDate: string;
    priority: "low" | "medium" | "high";
    acknowledge?: boolean;
  }>;
}

// Interface for feedback
export interface FeedbackRequest {
  rating: number;
  message: string;
  contactEmail?: string;
  category: string;
}

// Interface for error logging
export interface ErrorLogRequest {
  message: string;
  stack?: string;
  context?: any;
}

// Interface for remote config
export interface RemoteConfig {
  maxActivitiesPerDay: number;
  maxTasksPerDay: number;
  defaultTimerDuration: number;
  enableNotifications: boolean;
  enableSound: boolean;
}

// Default app initialization data
const DEFAULT_APP_INIT_DATA: AppInitData = {
  appVersion: "1.0.0",
  serverVersion: "1.0.0",
  updates: {
    available: false,
    required: false,
    url: undefined,
  },
  maintenance: {
    active: false,
    message: undefined,
    estimatedEndTime: undefined,
  },
  announcements: [],
};

/**
 * Initialize the app and retrieve startup data
 */
export const initializeApp = async (): Promise<ApiResponse<AppInitData>> => {
  try {
    const response = await apiRequest<AppInitData>({
      method: "POST",
      url: "/app/initialize",
      data: {},
    });
    return response;
  } catch (error) {
    console.error("App initialization error:", error);
    // Fallback to default data
    return {
      status: true,
      data: DEFAULT_APP_INIT_DATA,
    };
  }
};

/**
 * Check for app updates
 */
export const checkForUpdates = async (): Promise<
  ApiResponse<{
    available: boolean;
    required: boolean;
    url?: string;
  }>
> => {
  try {
    const response = await apiRequest<{
      available: boolean;
      required: boolean;
      url?: string;
    }>({
      method: "GET",
      url: "/app/updates",
    });
    return response;
  } catch (error) {
    console.error("Update check error:", error);
    return {
      status: false,
      error: {
        code: "UPDATE_CHECK_FAILED",
        message: "Failed to check for updates. Please try again.",
      },
    };
  }
};

/**
 * Get app announcements
 */
export const getAnnouncements = async (): Promise<ApiResponse<Array<any>>> => {
  try {
    const response = await apiRequest<Array<any>>({
      method: "GET",
      url: "/app/announcements",
    });
    return response;
  } catch (error) {
    console.error("Get announcements error:", error);
    return {
      status: false,
      error: {
        code: "ANNOUNCEMENTS_FETCH_FAILED",
        message: "Failed to get announcements. Please try again.",
      },
    };
  }
};

/**
 * Acknowledge an announcement
 */
export const acknowledgeAnnouncement = async (
  announcementId: string
): Promise<ApiResponse> => {
  try {
    const response = await apiRequest({
      method: "POST",
      url: "/app/announcements/acknowledge",
      data: { announcementId },
    });
    return response;
  } catch (error) {
    console.error("Acknowledge announcement error:", error);
    return {
      status: false,
      error: {
        code: "ANNOUNCEMENT_ACKNOWLEDGE_FAILED",
        message: "Failed to acknowledge announcement. Please try again.",
      },
    };
  }
};

/**
 * Check if there's a maintenance window currently active
 */
export const checkMaintenance = async (): Promise<
  ApiResponse<{
    active: boolean;
    message?: string;
    estimatedEndTime?: string;
  }>
> => {
  try {
    const response = await apiRequest<{
      active: boolean;
      message?: string;
      estimatedEndTime?: string;
    }>({
      method: "GET",
      url: "/app/maintenance",
    });
    return response;
  } catch (error) {
    console.error("Maintenance check error:", error);
    return {
      status: false,
      error: {
        code: "MAINTENANCE_CHECK_FAILED",
        message: "Failed to check maintenance status. Please try again.",
      },
    };
  }
};

/**
 * Send app feedback
 */
export const sendFeedback = async (
  feedback: FeedbackRequest
): Promise<ApiResponse> => {
  try {
    const response = await apiRequest({
      method: "POST",
      url: "/app/feedback",
      data: feedback,
    });
    return response;
  } catch (error) {
    console.error("Send feedback error:", error);
    return {
      status: false,
      error: {
        code: "FEEDBACK_SEND_FAILED",
        message: "Failed to send feedback. Please try again.",
      },
    };
  }
};

/**
 * Log app error for analytics
 */
export const logError = async (
  error: ErrorLogRequest
): Promise<ApiResponse> => {
  try {
    const response = await apiRequest({
      method: "POST",
      url: "/app/errors",
      data: error,
    });
    return response;
  } catch (err) {
    // Just log but don't throw - this is a non-critical operation
    console.error("Error reporting failed:", err);
    return {
      status: false,
      error: {
        code: "ERROR_LOG_FAILED",
        message: "Failed to log error.",
      },
    };
  }
};

/**
 * Get app configuration (remote config values)
 */
export const getRemoteConfig = async (): Promise<ApiResponse<RemoteConfig>> => {
  try {
    const response = await apiRequest<RemoteConfig>({
      method: "GET",
      url: "/app/config",
    });
    return response;
  } catch (error) {
    console.error("Get remote config error:", error);
    return {
      status: false,
      error: {
        code: "REMOTE_CONFIG_FETCH_FAILED",
        message: "Failed to get remote configuration. Please try again.",
      },
    };
  }
};

export default {
  initializeApp,
  checkForUpdates,
  getAnnouncements,
  acknowledgeAnnouncement,
  checkMaintenance,
  sendFeedback,
  logError,
  getRemoteConfig,
};
