import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SkipDayEntry, SkipDayDate } from "../api/shared";

interface AppContextType {
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

const AppContext = createContext<AppContextType>(defaultContext);

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
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

        // For now, skip API calls during initialization to avoid errors
        // Categories and skip reasons will be loaded by individual screens as needed
      } catch (error) {
        console.error("Error loading app data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Update categories
  const setCategories = async (newCategories: string[]) => {
    setCategoriesState(newCategories);
  };

  // Update skip reasons
  const setSkipReasons = async (newSkipReasons: string[]) => {
    setSkipReasonsState(newSkipReasons);
  };

  // Get skip day entry by reason
  const getSkipDayEntryByReason = (
    reason: string
  ): SkipDayEntry | undefined => {
    return skipDayEntries.find((entry) => entry.reason === reason);
  };

  // Add or update skip day entry
  const addOrUpdateSkipDayEntry = async (entry: Omit<SkipDayEntry, "id">) => {
    // For now, just add to local state
    const newEntry: SkipDayEntry = {
      id: Date.now().toString(),
      ...entry,
    };
    setSkipDayEntries((prev) => [...prev, newEntry]);
    return newEntry;
  };

  // Update skip day entry
  const updateSkipDayEntry = async (entry: SkipDayEntry) => {
    setSkipDayEntries((prev) =>
      prev.map((item) => (item.id === entry.id ? entry : item))
    );
    return entry;
  };

  // Delete skip day entry
  const deleteSkipDayEntry = async (id: string) => {
    setSkipDayEntries((prev) => prev.filter((item) => item.id !== id));
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
      // For now, just set login state without API call
      setIsLoggedIn(true);
      await AsyncStorage.setItem("isLoggedIn", "true");
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Clear local state
      setIsLoggedIn(false);
      await AsyncStorage.setItem("isLoggedIn", "false");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if storage fails, clear local state
      setIsLoggedIn(false);
    }
  };

  const contextValue: AppContextType = {
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
