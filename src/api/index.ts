// API Client and Core
export {
  apiClient,
  apiRequest,
  ApiResponse,
  ApiError,
  ErrorCode,
} from "./apiClient";
export { setAuthTokens, clearAuthTokens, getAuthToken } from "./apiClient";

// Auth Service
export { default as authService } from "./services/authService";
export type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ForgotPasswordRequest,
  UserProfile,
} from "./services/authService";

// Activity Service
export { default as activityService } from "./services/activityService";
export type {
  Activity,
  CreateActivityRequest,
  UpdateActivityRequest,
  ActivityTimerResponse,
  ActivityCompletionResponse,
  ActivityQueryParams,
} from "./services/activityService";

// Task Service
export { default as taskService } from "./services/taskService";
export type {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskToggleResponse,
  TaskQueryParams,
} from "./services/taskService";

// Statistics Service
export { default as statsService } from "./services/statsService";
export type {
  StatsData,
  CompletionRate,
  DailyStats,
  TaskStats,
  DailyTaskCompletion,
  StatsQueryParams,
} from "./services/statsService";

// Settings Service
export { default as settingsService } from "./services/settingsService";
export type { UserSettings } from "./services/settingsService";

// App Service
export { default as appService } from "./services/appService";
export type {
  AppInitData,
  FeedbackRequest,
  ErrorLogRequest,
  RemoteConfig,
} from "./services/appService";

// Legacy exports for backward compatibility
export { getUserSettings, getCategories, updateCategories } from "./apiClient";
export { getSkipReasons, updateSkipReasons } from "./apiClient";
export {
  getSkipDayEntries,
  addSkipDayEntry,
  updateSkipDayEntry,
  deleteSkipDayEntry,
} from "./apiClient";
export { updateFontSizeScale } from "./apiClient";
