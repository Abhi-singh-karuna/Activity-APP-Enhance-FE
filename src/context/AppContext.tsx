import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SkipDayEntry, SkipDayDate } from "../api/apiClient";
import {
  settingsService,
  authService,
  getUserSettings,
  getCategories,
  getSkipReasons,
  getSkipDayEntries,
  updateFontSizeScale,
  updateCategories,
  updateSkipReasons,
  addSkipDayEntry,
  updateSkipDayEntry,
  deleteSkipDayEntry,
} from "../api";

interface AppContextType {
  fontSizeScale: number;
  setFontSizeScale: (size: number) => void;
  fontSizeMultiplier: number;
  isLoggedIn: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  categories: string[];
  setCategories: (categories: string[]) => void;
  skipReasons: string[];
  setSkipReasons: (reasons: string[]) => void;
  skipDayEntries: SkipDayEntry[];
  addOrUpdateSkipDayEntry: (
    entry: Omit<SkipDayEntry, "id">
  ) => Promise<SkipDayEntry>;
  updateSkipDayEntry: (entry: SkipDayEntry) => Promise<SkipDayEntry>;
  deleteSkipDayEntry: (id: string) => Promise<void>;
  getSkipDaysForDate: (date: string) => SkipDayEntry[];
  getSkipDayEntryByReason: (reason: string) => SkipDayEntry | undefined;
  isLoading: boolean;
}

const defaultContext: AppContextType = {
  fontSizeScale: 1.0,
  setFontSizeScale: () => {},
  fontSizeMultiplier: 1.0,
  isLoggedIn: false,
  login: async () => {},
  logout: async () => {},
  categories: ["Personal", "Work", "Workout"],
  setCategories: () => {},
  skipReasons: ["Sick", "Vacation", "Holiday", "Personal Day"],
  setSkipReasons: () => {},
  skipDayEntries: [],
  addOrUpdateSkipDayEntry: async () => ({ id: "", reason: "", dates: [] }),
  updateSkipDayEntry: async () => ({ id: "", reason: "", dates: [] }),
  deleteSkipDayEntry: async () => {},
  getSkipDaysForDate: () => [],
  getSkipDayEntryByReason: () => undefined,
  isLoading: false,
};

// Font size scaling constants
export const MIN_FONT_SCALE = 0.4;
export const MAX_FONT_SCALE = 1.8;
export const DEFAULT_FONT_SCALE = 0.8;

const AppContext = createContext<AppContextType>(defaultContext);

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [fontSizeScale, setFontSizeScaleState] =
    useState<number>(DEFAULT_FONT_SCALE);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [categories, setCategoriesState] = useState<string[]>(
    defaultContext.categories
  );
  const [skipReasons, setSkipReasonsState] = useState<string[]>(
    defaultContext.skipReasons
  );
  const [skipDayEntries, setSkipDayEntries] = useState<SkipDayEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load saved settings and data on app start
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // First check for locally stored values for login state
        try {
          const savedLoginState = await AsyncStorage.getItem("isLoggedIn");
          if (savedLoginState) {
            setIsLoggedIn(savedLoginState === "true");
          }
        } catch (error) {
          console.warn("Failed to load login state from storage:", error);
        }

        // Fetch user settings (includes font size) using our API service
        try {
          const settingsResponse = await getUserSettings();
          if (settingsResponse.success && settingsResponse.data) {
            const { fontSizeScale: apiFontSize } = settingsResponse.data;
            if (apiFontSize) {
              setFontSizeScaleState(apiFontSize);
            }
          }
        } catch (error) {
          console.warn("Failed to load user settings:", error);
        }

        // Fetch categories using our API service
        try {
          const categoriesResponse = await getCategories();
          if (categoriesResponse.success && categoriesResponse.data) {
            setCategoriesState(categoriesResponse.data);
          }
        } catch (error) {
          console.warn("Failed to load categories:", error);
        }

        // Fetch skip reasons using our API service
        try {
          const skipReasonsResponse = await getSkipReasons();
          if (skipReasonsResponse.success && skipReasonsResponse.data) {
            setSkipReasonsState(skipReasonsResponse.data);
          }
        } catch (error) {
          console.warn("Failed to load skip reasons:", error);
        }

        // Fetch skip day entries using our API service
        try {
          const skipDayEntriesResponse = await getSkipDayEntries();
          if (skipDayEntriesResponse.success && skipDayEntriesResponse.data) {
            setSkipDayEntries(skipDayEntriesResponse.data);
          }
        } catch (error) {
          console.warn("Failed to load skip day entries:", error);
        }
      } catch (error) {
        console.error("Error loading app data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Font size multiplier for dynamic scaling
  const fontSizeMultiplier = fontSizeScale;

  // Update font size scale
  const setFontSizeScale = async (scale: number) => {
    const clampedScale = Math.max(
      MIN_FONT_SCALE,
      Math.min(MAX_FONT_SCALE, scale)
    );
    setFontSizeScaleState(clampedScale);

    try {
      // Update font size in API
      const response = await updateFontSizeScale(clampedScale);
      if (!response.success) {
        console.warn("Failed to update font size scale:", response.error);
      }
    } catch (error) {
      console.error("Error updating font size scale:", error);
    }
  };

  // Update categories
  const setCategories = async (newCategories: string[]) => {
    setCategoriesState(newCategories);

    try {
      // Update categories in API
      const response = await updateCategories(newCategories);
      if (!response.success) {
        console.warn("Failed to update categories:", response.error);
      }
    } catch (error) {
      console.error("Error updating categories:", error);
    }
  };

  // Update skip reasons
  const setSkipReasons = async (newSkipReasons: string[]) => {
    setSkipReasonsState(newSkipReasons);

    try {
      // Update skip reasons in API
      const response = await updateSkipReasons(newSkipReasons);
      if (!response.success) {
        console.warn("Failed to update skip reasons:", response.error);
      }
    } catch (error) {
      console.error("Error updating skip reasons:", error);
    }
  };

  // Get skip day entry by reason
  const getSkipDayEntryByReason = (
    reason: string
  ): SkipDayEntry | undefined => {
    return skipDayEntries.find((entry) => entry.reason === reason);
  };

  // Add or update skip day entry
  const addOrUpdateSkipDayEntry = async (entry: Omit<SkipDayEntry, "id">) => {
    try {
      // Check if entry with same reason already exists
      const existingEntry = getSkipDayEntryByReason(entry.reason);

      if (existingEntry) {
        // Update existing entry
        const updatedEntry = { ...existingEntry, ...entry };
        const response = await updateSkipDayEntry(updatedEntry);

        if (response.success && response.data) {
          setSkipDayEntries((prev) =>
            prev.map((item) =>
              item.id === existingEntry.id ? response.data! : item
            )
          );
          return response.data;
        } else {
          throw new Error(
            response.error?.message || "Failed to update skip day entry"
          );
        }
      } else {
        // Add new entry
        const response = await addSkipDayEntry(entry);

        if (response.success && response.data) {
          setSkipDayEntries((prev) => [...prev, response.data!]);
          return response.data;
        } else {
          throw new Error(
            response.error?.message || "Failed to add skip day entry"
          );
        }
      }
    } catch (error) {
      console.error("Error adding/updating skip day entry:", error);
      throw error;
    }
  };

  // Update skip day entry
  const updateSkipDayEntry = async (entry: SkipDayEntry) => {
    try {
      const response = await updateSkipDayEntry(entry);

      if (response.success && response.data) {
        setSkipDayEntries((prev) =>
          prev.map((item) => (item.id === entry.id ? response.data! : item))
        );
        return response.data;
      } else {
        throw new Error(
          response.error?.message || "Failed to update skip day entry"
        );
      }
    } catch (error) {
      console.error("Error updating skip day entry:", error);
      throw error;
    }
  };

  // Delete skip day entry
  const deleteSkipDayEntry = async (id: string) => {
    try {
      const response = await deleteSkipDayEntry(id);

      if (response.success) {
        setSkipDayEntries((prev) => prev.filter((item) => item.id !== id));
      } else {
        throw new Error(
          response.error?.message || "Failed to delete skip day entry"
        );
      }
    } catch (error) {
      console.error("Error deleting skip day entry:", error);
      throw error;
    }
  };

  // Get skip days for a specific date
  const getSkipDaysForDate = (date: string): SkipDayEntry[] => {
    return skipDayEntries.filter((entry) =>
      entry.dates.some((dateEntry) => dateEntry.date === date)
    );
  };

  // Login function
  const login = async () => {
    try {
      // Check if user is authenticated
      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        setIsLoggedIn(true);
        await AsyncStorage.setItem("isLoggedIn", "true");
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call logout API
      await authService.logout();

      // Clear local state
      setIsLoggedIn(false);
      await AsyncStorage.setItem("isLoggedIn", "false");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if API call fails, clear local state
      setIsLoggedIn(false);
      await AsyncStorage.setItem("isLoggedIn", "false");
    }
  };

  const contextValue: AppContextType = {
    fontSizeScale,
    setFontSizeScale,
    fontSizeMultiplier,
    isLoggedIn,
    login,
    logout,
    categories,
    setCategories,
    skipReasons,
    setSkipReasons,
    skipDayEntries,
    addOrUpdateSkipDayEntry,
    updateSkipDayEntry,
    deleteSkipDayEntry,
    getSkipDaysForDate,
    getSkipDayEntryByReason,
    isLoading,
  };

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
};
