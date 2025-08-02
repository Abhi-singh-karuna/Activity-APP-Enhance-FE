// Settings API services exports
export { default as settingsService } from "./settingsService";
export type { UserSettings } from "./settingsService";

// Types from shared API client
export type { SkipDayEntry, SkipDayDate } from "../../../api/shared";

// Individual function exports for backward compatibility
export {
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
} from "./settingsService";
