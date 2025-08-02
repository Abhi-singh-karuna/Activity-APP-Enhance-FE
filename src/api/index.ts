// Main API exports - organized by feature groups

// Shared API utilities
export * from "./shared";

// Auth API services
export * from "../screens/auth/api";

// Core API services
export * from "../screens/core/api";

// Activity API services
export * from "../screens/activity/api";

// Task API services
export * from "../screens/task/api";

// Analytics API services
export * from "../screens/analytics/api";

// Settings API services
export * from "../screens/settings/api";

// Legacy exports for backward compatibility
export {
  getUserSettings,
  getCategories,
  updateCategories,
} from "../screens/settings/api";
export { getSkipReasons, updateSkipReasons } from "../screens/settings/api";
export {
  getSkipDayEntries,
  addSkipDayEntry,
  updateSkipDayEntry,
  deleteSkipDayEntry,
} from "../screens/settings/api";

