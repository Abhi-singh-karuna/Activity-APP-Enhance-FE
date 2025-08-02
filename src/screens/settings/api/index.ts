// Settings API services exports
export { default as settingsService } from "./settingsService";

// Export constants
export { ICON_OPTIONS } from "./settingsService";

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
  getUserInfo,
  clearAllSettings,
  deleteAccount,
} from "./settingsService";

export type {
  SettingItem,
  ActivityCategory,
  SkipReason,
  PriorityLevel,
  CreateSettingItemData,
  UpdateSettingItemData,
  UserInfo,
  ClearDataRequest,
  DeleteAccountRequest,
} from "./settingsService";
