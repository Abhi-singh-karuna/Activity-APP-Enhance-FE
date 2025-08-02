// Settings API services exports
export { default as settingsService } from "./settingsService";

// Export constants and types
export { ICON_OPTIONS, DEFAULT_COLORS, DEFAULT_ICONS } from "./settingsService";

// Types from shared API client
export type { SkipDayEntry, SkipDayDate } from "../../../api/shared";

// Individual function exports for backward compatibility
export {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getSkipReasons,
  createSkipReason,
  updateSkipReason,
  deleteSkipReason,
  getPriorities,
  createPriority,
  updatePriority,
  deletePriority,
  clearAllSettings,
  deleteAccount,
} from "./settingsService";
