import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
  Platform,
  TextInput,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Animated,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { RootStackParamList } from "../../navigation";
import { useAppContext } from "../../context/AppContext";
import { settingsService } from "./api";

// Icon options for the picker
const ICON_OPTIONS = [
  { name: "star-outline", label: "Star" },
  { name: "heart-outline", label: "Heart" },
  { name: "bookmark-outline", label: "Bookmark" },
  { name: "flag-outline", label: "Flag" },
  { name: "checkmark-circle-outline", label: "Check" },
  { name: "time-outline", label: "Time" },
  { name: "calendar-outline", label: "Calendar" },
  { name: "person-outline", label: "Person" },
  { name: "home-outline", label: "Home" },
  { name: "work-outline", label: "Work" },
  { name: "fitness-outline", label: "Fitness" },
  { name: "school-outline", label: "School" },
  { name: "car-outline", label: "Car" },
  { name: "airplane-outline", label: "Travel" },
  { name: "restaurant-outline", label: "Food" },
  { name: "game-controller-outline", label: "Gaming" },
  { name: "musical-notes-outline", label: "Music" },
  { name: "camera-outline", label: "Camera" },
  { name: "gift-outline", label: "Gift" },
  { name: "trophy-outline", label: "Trophy" },
];

// Get device dimensions
const { width } = Dimensions.get("window");
const isSmallDevice = width < 375;
const isTablet = width >= 768;

// Responsive scaling
const scale = (size: number) => {
  if (isTablet) return size * 1.2;
  if (isSmallDevice) return size * 0.85;
  return size;
};

// Define the navigation prop type
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Settings">;

// Theme colors
const ThemeColors = {
  primary: "#00E5FF",
  secondary: "#9C6CDA",
  success: "#4ECDC4",
  warning: "#FF9500",
  danger: "#FF4757",
  background: "#000000",
  surface: "#121212",
  card: "#1E1E1E",
  text: "#FFFFFF",
  textSecondary: "#B0B0B0",
  textTertiary: "#808080",
  border: "rgba(255, 255, 255, 0.1)",
};

// Color options
const ColorOptions = [
  { id: "1", name: "Electric Blue", value: "#00E5FF" },
  { id: "2", name: "Purple", value: "#9C6CDA" },
  { id: "3", name: "Mint Green", value: "#4ECDC4" },
  { id: "4", name: "Orange", value: "#FF9500" },
  { id: "5", name: "Red", value: "#FF4757" },
  { id: "6", name: "Pink", value: "#FF6B9D" },
  { id: "7", name: "Yellow", value: "#FFD93D" },
  { id: "8", name: "Indigo", value: "#6C5CE7" },
];

// Interfaces
interface SettingItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: "categories" | "skipReasons" | "priorities";
  priority?: number;
  level?: number;
}

const SettingsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { logout } = useAppContext();

  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [categories, setCategories] = useState<SettingItem[]>([]);
  const [skipReasons, setSkipReasons] = useState<SettingItem[]>([]);
  const [priorities, setPriorities] = useState<SettingItem[]>([]);

  // Section-specific loading states
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [skipReasonsLoading, setSkipReasonsLoading] = useState(false);
  const [prioritiesLoading, setPrioritiesLoading] = useState(false);

  // Animation refs for section refreshes
  const categoriesOpacity = useRef(new Animated.Value(1)).current;
  const skipReasonsOpacity = useRef(new Animated.Value(1)).current;
  const prioritiesOpacity = useRef(new Animated.Value(1)).current;

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editingItem, setEditingItem] = useState<SettingItem | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [selectedColor, setSelectedColor] = useState(ColorOptions[0].value);
  const [selectedIcon, setSelectedIcon] = useState(ICON_OPTIONS[0].name);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<
    "categories" | "skipReasons" | "priorities"
  >("categories");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [pendingAction, setPendingAction] = useState<"clear" | "delete" | null>(
    null
  );

  // Load settings data
  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);

      // Load all settings data from API
      const [categoriesRes, skipReasonsRes, prioritiesRes] = await Promise.all([
        settingsService.getCategories(),
        settingsService.getSkipReasons(),
        settingsService.getPriorities(),
      ]);

      // Update state with API responses
      if (categoriesRes.status && categoriesRes.data) {
        setCategories(categoriesRes.data);
      }

      if (skipReasonsRes.status && skipReasonsRes.data) {
        setSkipReasons(skipReasonsRes.data);
        console.tron?.log(
          "✅ Skip reasons loaded:",
          skipReasonsRes.data.length
        );
      }

      if (prioritiesRes.status && prioritiesRes.data) {
        setPriorities(prioritiesRes.data);
        console.tron?.log("✅ Priorities loaded:", prioritiesRes.data.length);
      }

      // Add a small delay to make the refresh more noticeable
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (error) {
      console.error("Failed to load settings:", error);
      console.tron?.log("❌ Error loading settings:", error);
      Alert.alert("Error", "Failed to load settings. Please try again.");
    } finally {
      setIsLoading(false);
      console.tron?.log("🏁 Settings loading completed");
    }
  }, []);

  // Section-specific refresh functions with animations
  const refreshCategories = useCallback(async () => {
    setCategoriesLoading(true);

    // Fade out animation
    Animated.timing(categoriesOpacity, {
      toValue: 0.3,
      duration: 200,
      useNativeDriver: true,
    }).start();

    try {
      const response = await settingsService.getCategories();
      if (response.status && response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error("Failed to refresh categories:", error);
    } finally {
      // Fade in animation
      Animated.timing(categoriesOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setCategoriesLoading(false);
    }
  }, [categoriesOpacity]);

  const refreshSkipReasons = useCallback(async () => {
    setSkipReasonsLoading(true);

    // Fade out animation
    Animated.timing(skipReasonsOpacity, {
      toValue: 0.3,
      duration: 200,
      useNativeDriver: true,
    }).start();

    try {
      const response = await settingsService.getSkipReasons();
      if (response.status && response.data) {
        setSkipReasons(response.data);
      }
    } catch (error) {
      console.error("Failed to refresh skip reasons:", error);
    } finally {
      // Fade in animation
      Animated.timing(skipReasonsOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setSkipReasonsLoading(false);
    }
  }, [skipReasonsOpacity]);

  const refreshPriorities = useCallback(async () => {
    setPrioritiesLoading(true);

    // Fade out animation
    Animated.timing(prioritiesOpacity, {
      toValue: 0.3,
      duration: 200,
      useNativeDriver: true,
    }).start();

    try {
      const response = await settingsService.getPriorities();
      if (response.status && response.data) {
        setPriorities(response.data);
      }
    } catch (error) {
      console.error("Failed to refresh priorities:", error);
    } finally {
      // Fade in animation
      Animated.timing(prioritiesOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setPrioritiesLoading(false);
    }
  }, [prioritiesOpacity]);

  // Enhanced refresh functionality
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadSettings();
    setIsRefreshing(false);
  }, [loadSettings]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Settings management functions
  const handleAddItem = useCallback(async () => {
    if (!newItemName.trim()) {
      Alert.alert("Error", "Please enter a name");
      return;
    }

    try {
      const newItem: SettingItem = {
        id: Date.now().toString(),
        name: newItemName.trim(),
        icon: selectedIcon,
        color: selectedColor,
        category: currentCategory,
        priority:
          currentCategory === "priorities" ? getNextPriority() : undefined,
        level: currentCategory === "priorities" ? getNextLevel() : undefined,
      };

      // Create item using API
      let response;
      const createData = {
        name: newItem.name,
        icon: newItem.icon,
        color: newItem.color,
        ...(currentCategory === "priorities" && {
          priority: newItem.priority,
          level: newItem.level,
        }),
      };

      switch (currentCategory) {
        case "categories":
          response = await settingsService.createCategory(createData);
          break;
        case "skipReasons":
          response = await settingsService.createSkipReason(createData);
          break;
        case "priorities":
          response = await settingsService.createPriority(createData);
          break;
      }

      if (response.status && response.data) {
        // Refresh only the specific section
        switch (currentCategory) {
          case "categories":
            await refreshCategories();
            break;
          case "skipReasons":
            await refreshSkipReasons();
            break;
          case "priorities":
            await refreshPriorities();
            break;
        }

        setNewItemName("");
        setSelectedColor(ColorOptions[0].value);
        setSelectedIcon(ICON_OPTIONS[0].name);
        setShowAddModal(false);

        Alert.alert("Success", "Item added successfully!");
      } else {
        throw new Error(response.error?.message || "Failed to create item");
      }
    } catch (error) {
      console.error("Failed to add item:", error);
      Alert.alert("Error", "Failed to add item. Please try again.");
    }
  }, [newItemName, selectedColor, selectedIcon, currentCategory]);

  const handleEditItem = useCallback(async () => {
    if (!editingItem || !newItemName.trim()) {
      Alert.alert("Error", "Please enter a name");
      return;
    }

    try {
      const updatedItem: SettingItem = {
        ...editingItem,
        name: newItemName.trim(),
        icon: selectedIcon,
        color: selectedColor,
      };

      // Update item using API
      let response;
      const updateData = {
        id: editingItem.id,
        name: updatedItem.name,
        icon: updatedItem.icon,
        color: updatedItem.color,
        ...(currentCategory === "priorities" && {
          priority: updatedItem.priority,
          level: updatedItem.level,
        }),
      };

      switch (currentCategory) {
        case "categories":
          response = await settingsService.updateCategory(updateData);
          break;
        case "skipReasons":
          response = await settingsService.updateSkipReason(updateData);
          break;
        case "priorities":
          response = await settingsService.updatePriority(updateData);
          break;
      }

      if (response.status && response.data) {
        // Refresh only the specific section
        switch (currentCategory) {
          case "categories":
            await refreshCategories();
            break;
          case "skipReasons":
            await refreshSkipReasons();
            break;
          case "priorities":
            await refreshPriorities();
            break;
        }

        setEditingItem(null);
        setNewItemName("");
        setSelectedColor(ColorOptions[0].value);
        setSelectedIcon(ICON_OPTIONS[0].name);
        setShowAddModal(false);

        Alert.alert("Success", "Item updated successfully!");
      } else {
        throw new Error(response.error?.message || "Failed to update item");
      }
    } catch (error) {
      console.error("Failed to edit item:", error);
      Alert.alert("Error", "Failed to edit item. Please try again.");
    }
  }, [editingItem, newItemName, selectedColor, selectedIcon, currentCategory]);

  const handleDeleteItem = useCallback(async (item: SettingItem) => {
    Alert.alert(
      "Delete Item",
      `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete item using API
              let response;
              switch (item.category) {
                case "categories":
                  response = await settingsService.deleteCategory(item.id);
                  break;
                case "skipReasons":
                  response = await settingsService.deleteSkipReason(item.id);
                  break;
                case "priorities":
                  response = await settingsService.deletePriority(item.id);
                  break;
              }

              if (response.status) {
                // Refresh only the specific section
                switch (item.category) {
                  case "categories":
                    await refreshCategories();
                    break;
                  case "skipReasons":
                    await refreshSkipReasons();
                    break;
                  case "priorities":
                    await refreshPriorities();
                    break;
                }
                Alert.alert("Success", "Item deleted successfully!");
              } else {
                throw new Error(
                  response.error?.message || "Failed to delete item"
                );
              }
            } catch (error) {
              console.error("Failed to delete item:", error);
              Alert.alert("Error", "Failed to delete item. Please try again.");
            }
          },
        },
      ]
    );
  }, []);

  // Helper functions
  const getNextPriority = useCallback((): number => {
    return priorities.length > 0
      ? Math.max(...priorities.map((p) => p.priority || 0)) + 1
      : 1;
  }, [priorities]);

  const getNextLevel = useCallback((): number => {
    return priorities.length > 0
      ? Math.max(...priorities.map((p) => p.level || 0)) + 1
      : 1;
  }, [priorities]);

  // Modal management
  const showModal = useCallback(
    (
      category: "categories" | "skipReasons" | "priorities",
      item?: SettingItem
    ) => {
      setCurrentCategory(category);
      if (item) {
        setEditingItem(item);
        setNewItemName(item.name);
        setSelectedColor(item.color);
        setSelectedIcon(item.icon);
      } else {
        setEditingItem(null);
        setNewItemName("");
        setSelectedColor(ColorOptions[0].value);
        setSelectedIcon(ICON_OPTIONS[0].name);
      }
      setShowAddModal(true);
    },
    []
  );

  const hideModal = useCallback(() => {
    setShowAddModal(false);
    setShowColorPicker(false);
    setShowIconPicker(false);
    setEditingItem(null);
    setNewItemName("");
    setSelectedColor(ColorOptions[0].value);
    setSelectedIcon(ICON_OPTIONS[0].name);
  }, []);

  // Account management
  const handleClearAllData = useCallback(() => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete all your settings, categories, and preferences. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "destructive",
          onPress: () => {
            setPendingAction("clear");
            setShowPasswordModal(true);
          },
        },
      ]
    );
  }, []);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all associated data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "destructive",
          onPress: () => {
            setPendingAction("delete");
            setShowPasswordModal(true);
          },
        },
      ]
    );
  }, []);

  const handlePasswordConfirm = useCallback(async () => {
    // Simple password validation (in real app, this would be more secure)
    const correctPassword = "password123";

    if (password !== correctPassword) {
      setPasswordError("Incorrect password. Please try again.");
      return;
    }

    try {
      if (pendingAction === "clear") {
        // Clear all data using API
        const response = await settingsService.clearAllSettings();
        if (response.status) {
          setCategories([]);
          setSkipReasons([]);
          setPriorities([]);
          Alert.alert("Success", "All data has been cleared.");
        } else {
          throw new Error(response.error?.message || "Failed to clear data");
        }
      } else if (pendingAction === "delete") {
        // Delete account using API
        const response = await settingsService.deleteAccount();
        if (response.status) {
          logout();
          navigation.navigate("Login");
          Alert.alert("Account Deleted", "Your account has been deleted.");
        } else {
          throw new Error(
            response.error?.message || "Failed to delete account"
          );
        }
      }

      setPassword("");
      setPasswordError("");
      setPendingAction(null);
      setShowPasswordModal(false);
    } catch (error) {
      console.error("Failed to perform action:", error);
      Alert.alert("Error", "Failed to perform action. Please try again.");
    }
  }, [password, pendingAction, logout, navigation]);

  const handleLogout = useCallback(() => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            navigation.navigate("Login");
          } catch (error) {
            console.error("Logout failed:", error);
            Alert.alert("Error", "Failed to logout. Please try again.");
          }
        },
      },
    ]);
  }, [logout, navigation]);

  // Render helper functions
  const renderSettingItem = useCallback(
    (item: SettingItem, index: number) => (
      <View key={item.id} style={styles.settingItem}>
        <LinearGradient
          colors={["rgba(30, 30, 30, 0.95)", "rgba(42, 42, 42, 0.95)"]}
          style={styles.settingItemGradient}
        >
          <View style={styles.settingItemLeft}>
            <View style={[styles.settingIcon, { backgroundColor: item.color }]}>
              <Icon name={item.icon} size={scale(20)} color="#fff" />
            </View>
            <View style={styles.settingItemInfo}>
              <Text style={styles.settingItemName}>{item.name}</Text>
              {item.category === "priorities" && (
                <Text style={styles.settingItemMeta}>
                  Level {item.level} • Priority {item.priority}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.settingItemActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => showModal(item.category, item)}
            >
              <LinearGradient
                colors={["rgba(0, 229, 255, 0.2)", "rgba(0, 229, 255, 0.1)"]}
                style={styles.actionButtonGradient}
              >
                <Icon
                  name="pencil-outline"
                  size={scale(18)}
                  color={ThemeColors.primary}
                />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDeleteItem(item)}
            >
              <LinearGradient
                colors={["rgba(255, 71, 87, 0.2)", "rgba(255, 71, 87, 0.1)"]}
                style={styles.actionButtonGradient}
              >
                <Icon
                  name="trash-outline"
                  size={scale(18)}
                  color={ThemeColors.danger}
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    ),
    [showModal, handleDeleteItem]
  );

  const renderColorPicker = useCallback(
    () => (
      <View style={styles.colorPickerContainer}>
        <Text style={styles.colorPickerTitle}>Choose a Color</Text>
        <View style={styles.colorGrid}>
          {ColorOptions.map((color) => (
            <TouchableOpacity
              key={color.id}
              style={[
                styles.colorOption,
                {
                  backgroundColor: color.value,
                  borderWidth: selectedColor === color.value ? 3 : 0,
                  borderColor: ThemeColors.primary,
                  transform: [
                    {
                      scale: selectedColor === color.value ? 1.1 : 1,
                    },
                  ],
                },
              ]}
              onPress={() => setSelectedColor(color.value)}
            >
              {selectedColor === color.value && (
                <Icon name="checkmark" size={scale(16)} color="#fff" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    ),
    [selectedColor]
  );

  const renderIconPicker = useCallback(
    () => (
      <View style={styles.iconPickerContainer}>
        <Text style={styles.iconPickerTitle}>Choose an Icon</Text>
        <View style={styles.iconGrid}>
          {ICON_OPTIONS.map(
            (icon: { name: string; label: string }, index: number) => (
              <TouchableOpacity
                key={icon.name}
                style={[
                  styles.iconOption,
                  {
                    borderWidth: selectedIcon === icon.name ? 3 : 0,
                    borderColor: ThemeColors.primary,
                    transform: [
                      {
                        scale: selectedIcon === icon.name ? 1.1 : 1,
                      },
                    ],
                  },
                ]}
                onPress={() => setSelectedIcon(icon.name)}
              >
                <Icon
                  name={icon.name}
                  size={scale(24)}
                  color={
                    selectedIcon === icon.name
                      ? ThemeColors.primary
                      : ThemeColors.text
                  }
                />
                {selectedIcon === icon.name && (
                  <View style={styles.iconCheckmark}>
                    <Icon name="checkmark" size={scale(12)} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            )
          )}
        </View>
      </View>
    ),
    [selectedIcon]
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ThemeColors.primary} />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={ThemeColors.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.05)"]}
            style={styles.backButtonGradient}
          >
            <Icon
              name="chevron-back"
              size={scale(24)}
              color={ThemeColors.text}
            />
          </LinearGradient>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Customize your experience</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={ThemeColors.primary}
            colors={[ThemeColors.primary]}
          />
        }
      >
        {/* Categories Section */}
        <Animated.View style={[styles.section, { opacity: categoriesOpacity }]}>
          <LinearGradient
            colors={["rgba(26, 26, 26, 0.95)", "rgba(42, 42, 42, 0.95)"]}
            style={styles.sectionGradient}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View
                  style={[
                    styles.sectionIcon,
                    { backgroundColor: ThemeColors.secondary },
                  ]}
                >
                  <Icon name="list-outline" size={scale(20)} color="#fff" />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>
                    Activity Categories
                    {categoriesLoading && (
                      <Text style={styles.loadingIndicator}> 🔄</Text>
                    )}
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    Manage activity categories
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => showModal("categories")}
              >
                <LinearGradient
                  colors={["#9C6CDA", "#7B4397"]}
                  style={styles.addButtonGradient}
                >
                  <Icon name="add" size={scale(20)} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.settingsList}>
              {categories.length > 0 ? (
                categories.map((item, index) => renderSettingItem(item, index))
              ) : (
                <View style={styles.emptyState}>
                  <Icon
                    name="list-outline"
                    size={scale(48)}
                    color={ThemeColors.textTertiary}
                  />
                  <Text style={styles.emptyStateText}>No categories yet</Text>
                  <TouchableOpacity
                    style={styles.emptyStateButton}
                    onPress={() => showModal("categories")}
                  >
                    <Text style={styles.emptyStateButtonText}>
                      Add Category
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Skip Reasons Section */}
        <Animated.View
          style={[styles.section, { opacity: skipReasonsOpacity }]}
        >
          <LinearGradient
            colors={["rgba(26, 26, 26, 0.95)", "rgba(42, 42, 42, 0.95)"]}
            style={styles.sectionGradient}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View
                  style={[
                    styles.sectionIcon,
                    { backgroundColor: ThemeColors.warning },
                  ]}
                >
                  <Icon name="time-outline" size={scale(20)} color="#fff" />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>
                    Skip Reasons
                    {skipReasonsLoading && (
                      <Text style={styles.loadingIndicator}> 🔄</Text>
                    )}
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    Reasons for skipping activities
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => showModal("skipReasons")}
              >
                <LinearGradient
                  colors={["#FF9500", "#FFB74D"]}
                  style={styles.addButtonGradient}
                >
                  <Icon name="add" size={scale(20)} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.settingsList}>
              {skipReasons.length > 0 ? (
                skipReasons.map((item, index) => renderSettingItem(item, index))
              ) : (
                <View style={styles.emptyState}>
                  <Icon
                    name="time-outline"
                    size={scale(48)}
                    color={ThemeColors.textTertiary}
                  />
                  <Text style={styles.emptyStateText}>No skip reasons yet</Text>
                  <TouchableOpacity
                    style={styles.emptyStateButton}
                    onPress={() => showModal("skipReasons")}
                  >
                    <Text style={styles.emptyStateButtonText}>Add Reason</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Priority Levels Section */}
        <Animated.View style={[styles.section, { opacity: prioritiesOpacity }]}>
          <LinearGradient
            colors={["rgba(26, 26, 26, 0.95)", "rgba(42, 42, 42, 0.95)"]}
            style={styles.sectionGradient}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View
                  style={[
                    styles.sectionIcon,
                    { backgroundColor: ThemeColors.success },
                  ]}
                >
                  <Icon name="flag-outline" size={scale(20)} color="#fff" />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>
                    Priority Levels
                    {prioritiesLoading && (
                      <Text style={styles.loadingIndicator}> 🔄</Text>
                    )}
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    Task priority configuration
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => showModal("priorities")}
              >
                <LinearGradient
                  colors={["#4ECDC4", "#44A08D"]}
                  style={styles.addButtonGradient}
                >
                  <Icon name="add" size={scale(20)} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.settingsList}>
              {priorities.length > 0 ? (
                priorities.map((item, index) => renderSettingItem(item, index))
              ) : (
                <View style={styles.emptyState}>
                  <Icon
                    name="flag-outline"
                    size={scale(48)}
                    color={ThemeColors.textTertiary}
                  />
                  <Text style={styles.emptyStateText}>
                    No priority levels yet
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyStateButton}
                    onPress={() => showModal("priorities")}
                  >
                    <Text style={styles.emptyStateButtonText}>
                      Add Priority
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Account Section */}
        <View style={styles.section}>
          <LinearGradient
            colors={["rgba(26, 26, 26, 0.95)", "rgba(42, 42, 42, 0.95)"]}
            style={styles.sectionGradient}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View
                  style={[
                    styles.sectionIcon,
                    { backgroundColor: ThemeColors.primary },
                  ]}
                >
                  <Icon name="person-outline" size={scale(20)} color="#fff" />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Account</Text>
                  <Text style={styles.sectionSubtitle}>Account management</Text>
                </View>
              </View>
            </View>

            <View style={styles.accountActions}>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
              >
                <LinearGradient
                  colors={["#00E5FF", "#9C6CDA"]}
                  style={styles.logoutButtonGradient}
                >
                  <Icon name="log-out-outline" size={scale(20)} color="#fff" />
                  <Text style={styles.logoutButtonText}>Logout</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Danger Zone Section */}
        <View style={styles.section}>
          <LinearGradient
            colors={["rgba(255, 71, 87, 0.1)", "rgba(255, 71, 87, 0.05)"]}
            style={[styles.sectionGradient, styles.dangerZone]}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View
                  style={[
                    styles.sectionIcon,
                    { backgroundColor: ThemeColors.danger },
                  ]}
                >
                  <Icon name="warning-outline" size={scale(20)} color="#fff" />
                </View>
                <View>
                  <Text
                    style={[styles.sectionTitle, { color: ThemeColors.danger }]}
                  >
                    Danger Zone
                  </Text>
                  <Text style={styles.sectionSubtitle}>
                    Irreversible actions
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.dangerActions}>
              <TouchableOpacity
                style={styles.dangerButton}
                onPress={handleClearAllData}
              >
                <LinearGradient
                  colors={["rgba(255, 149, 0, 0.3)", "rgba(255, 149, 0, 0.1)"]}
                  style={styles.dangerButtonGradient}
                >
                  <Icon
                    name="trash-outline"
                    size={scale(20)}
                    color={ThemeColors.warning}
                  />
                  <Text
                    style={[
                      styles.dangerButtonText,
                      { color: ThemeColors.warning },
                    ]}
                  >
                    Clear All Data
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dangerButton}
                onPress={handleDeleteAccount}
              >
                <LinearGradient
                  colors={["rgba(255, 71, 87, 0.3)", "rgba(255, 71, 87, 0.1)"]}
                  style={styles.dangerButtonGradient}
                >
                  <Icon
                    name="alert-circle-outline"
                    size={scale(20)}
                    color={ThemeColors.danger}
                  />
                  <Text
                    style={[
                      styles.dangerButtonText,
                      { color: ThemeColors.danger },
                    ]}
                  >
                    Delete Account
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="fade"
        onRequestClose={hideModal}
      >
        <TouchableWithoutFeedback onPress={hideModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalContainer}>
                <LinearGradient
                  colors={["rgba(30, 30, 30, 0.95)", "rgba(42, 42, 42, 0.95)"]}
                  style={styles.modalGradient}
                >
                  <Text style={styles.modalTitle}>
                    {editingItem ? "Edit" : "Add"}{" "}
                    {currentCategory === "categories"
                      ? "Category"
                      : currentCategory === "skipReasons"
                      ? "Skip Reason"
                      : "Priority Level"}
                  </Text>

                  <View style={styles.modalInputContainer}>
                    <Text style={styles.inputLabel}>Name</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder={`Enter ${
                        currentCategory === "categories"
                          ? "category"
                          : currentCategory === "skipReasons"
                          ? "reason"
                          : "priority"
                      } name`}
                      placeholderTextColor={ThemeColors.textTertiary}
                      value={newItemName}
                      onChangeText={setNewItemName}
                      autoCapitalize="words"
                    />
                  </View>

                  <View style={styles.modalInputContainer}>
                    <Text style={styles.inputLabel}>Color</Text>
                    <TouchableOpacity
                      style={styles.colorPickerButton}
                      onPress={() => setShowColorPicker(!showColorPicker)}
                    >
                      <View
                        style={[
                          styles.selectedColorPreview,
                          { backgroundColor: selectedColor },
                        ]}
                      />
                      <Text style={styles.colorPickerButtonText}>
                        Select Color
                      </Text>
                      <Icon
                        name="chevron-down"
                        size={scale(16)}
                        color={ThemeColors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  {showColorPicker && renderColorPicker()}

                  <View style={styles.modalInputContainer}>
                    <Text style={styles.inputLabel}>Icon</Text>
                    <TouchableOpacity
                      style={styles.iconPickerButton}
                      onPress={() => setShowIconPicker(!showIconPicker)}
                    >
                      <View style={styles.selectedIconPreview}>
                        <Icon
                          name={selectedIcon}
                          size={scale(20)}
                          color={ThemeColors.text}
                        />
                      </View>
                      <Text style={styles.iconPickerButtonText}>
                        Select Icon
                      </Text>
                      <Icon
                        name="chevron-down"
                        size={scale(16)}
                        color={ThemeColors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  {showIconPicker && renderIconPicker()}

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={hideModal}
                    >
                      <LinearGradient
                        colors={[
                          "rgba(128, 128, 128, 0.3)",
                          "rgba(128, 128, 128, 0.1)",
                        ]}
                        style={styles.modalButtonGradient}
                      >
                        <Text style={styles.modalButtonText}>Cancel</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={editingItem ? handleEditItem : handleAddItem}
                    >
                      <LinearGradient
                        colors={["#00E5FF", "#9C6CDA"]}
                        style={styles.modalButtonGradient}
                      >
                        <Text style={styles.modalButtonText}>
                          {editingItem ? "Update" : "Add"}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Password Confirmation Modal */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowPasswordModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalContainer}>
                <LinearGradient
                  colors={["rgba(30, 30, 30, 0.95)", "rgba(42, 42, 42, 0.95)"]}
                  style={styles.modalGradient}
                >
                  <Icon
                    name="lock-closed-outline"
                    size={scale(48)}
                    color={ThemeColors.danger}
                  />
                  <Text style={styles.modalTitle}>Confirm Password</Text>
                  <Text style={styles.passwordDescription}>
                    Please enter your password to confirm this action
                  </Text>

                  <View style={styles.modalInputContainer}>
                    <TextInput
                      style={[
                        styles.modalInput,
                        passwordError ? styles.inputError : null,
                      ]}
                      placeholder="Enter your password"
                      placeholderTextColor={ThemeColors.textTertiary}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        setPasswordError("");
                      }}
                      secureTextEntry={true}
                      autoFocus={true}
                    />
                    {passwordError ? (
                      <Text style={styles.errorText}>{passwordError}</Text>
                    ) : null}
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => {
                        setShowPasswordModal(false);
                        setPassword("");
                        setPasswordError("");
                      }}
                    >
                      <LinearGradient
                        colors={[
                          "rgba(128, 128, 128, 0.3)",
                          "rgba(128, 128, 128, 0.1)",
                        ]}
                        style={styles.modalButtonGradient}
                      >
                        <Text style={styles.modalButtonText}>Cancel</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={handlePasswordConfirm}
                      disabled={!password.trim()}
                    >
                      <LinearGradient
                        colors={["#FF4757", "#FF6B81"]}
                        style={[
                          styles.modalButtonGradient,
                          !password.trim() && styles.disabledButton,
                        ]}
                      >
                        <Text style={styles.modalButtonText}>Confirm</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ThemeColors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: ThemeColors.background,
  },
  loadingText: {
    color: ThemeColors.textSecondary,
    marginTop: scale(16),
    fontSize: scale(16),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: scale(20),
    paddingTop: Platform.OS === "ios" ? scale(55) : scale(35),
    paddingBottom: scale(20),
  },
  backButton: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    overflow: "hidden",
    marginRight: scale(15),
  },
  backButtonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    color: ThemeColors.text,
    fontSize: scale(28),
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: ThemeColors.textSecondary,
    fontSize: scale(14),
    marginTop: scale(2),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingBottom: scale(30),
  },
  section: {
    marginBottom: scale(20),
    borderRadius: scale(20),
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  sectionGradient: {
    padding: scale(20),
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(16),
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sectionIcon: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(12),
  },
  sectionTitle: {
    color: ThemeColors.text,
    fontSize: scale(18),
    fontWeight: "700",
    marginBottom: scale(2),
  },
  sectionSubtitle: {
    color: ThemeColors.textSecondary,
    fontSize: scale(12),
  },
  addButton: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    overflow: "hidden",
  },
  addButtonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  settingsList: {
    gap: scale(12),
  },
  settingItem: {
    borderRadius: scale(16),
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  settingItemGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: scale(16),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  settingItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(12),
  },
  settingItemInfo: {
    flex: 1,
  },
  settingItemName: {
    color: ThemeColors.text,
    fontSize: scale(16),
    fontWeight: "600",
    marginBottom: scale(2),
  },
  settingItemMeta: {
    color: ThemeColors.textSecondary,
    fontSize: scale(12),
  },
  settingItemActions: {
    flexDirection: "row",
    gap: scale(8),
  },
  actionButton: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    overflow: "hidden",
  },
  actionButtonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: scale(32),
  },
  emptyStateText: {
    color: ThemeColors.textTertiary,
    fontSize: scale(16),
    marginTop: scale(12),
    marginBottom: scale(16),
  },
  emptyStateButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: scale(20),
    paddingVertical: scale(10),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  emptyStateButtonText: {
    color: ThemeColors.primary,
    fontSize: scale(14),
    fontWeight: "600",
  },
  accountActions: {
    gap: scale(12),
  },
  logoutButton: {
    borderRadius: scale(12),
    overflow: "hidden",
  },
  logoutButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(16),
    gap: scale(8),
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: scale(16),
    fontWeight: "700",
  },

  // Danger Zone
  dangerZone: {
    borderWidth: 1,
    borderColor: "rgba(255, 71, 87, 0.3)",
  },
  dangerActions: {
    gap: scale(12),
  },
  dangerButton: {
    borderRadius: scale(12),
    overflow: "hidden",
  },
  dangerButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(16),
    gap: scale(8),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  dangerButtonText: {
    fontSize: scale(16),
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: scale(20),
  },
  modalContainer: {
    width: "100%",
    maxWidth: scale(400),
    borderRadius: scale(24),
    overflow: "hidden",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
  },
  modalGradient: {
    padding: scale(24),
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  modalTitle: {
    color: ThemeColors.text,
    fontSize: scale(20),
    fontWeight: "700",
    textAlign: "center",
    marginBottom: scale(20),
  },
  modalInputContainer: {
    marginBottom: scale(16),
  },
  inputLabel: {
    color: ThemeColors.textSecondary,
    fontSize: scale(14),
    fontWeight: "600",
    marginBottom: scale(8),
  },
  modalInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: scale(12),
    padding: scale(16),
    color: ThemeColors.text,
    fontSize: scale(16),
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  colorPickerContainer: {
    marginBottom: scale(16),
  },
  colorPickerTitle: {
    color: ThemeColors.textSecondary,
    fontSize: scale(14),
    fontWeight: "600",
    marginBottom: scale(12),
  },
  colorPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: scale(12),
    padding: scale(16),
    borderWidth: 1,
    borderColor: ThemeColors.border,
    gap: scale(12),
  },
  selectedColorPreview: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    borderWidth: 2,
    borderColor: "#fff",
  },
  colorPickerButtonText: {
    color: ThemeColors.text,
    fontSize: scale(16),
    flex: 1,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(12),
    justifyContent: "space-between",
  },
  colorOption: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  iconPickerContainer: {
    marginBottom: scale(16),
  },
  iconPickerTitle: {
    color: ThemeColors.textSecondary,
    fontSize: scale(14),
    fontWeight: "600",
    marginBottom: scale(12),
  },
  iconPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: scale(12),
    padding: scale(16),
    borderWidth: 1,
    borderColor: ThemeColors.border,
    gap: scale(12),
  },
  selectedIconPreview: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  iconPickerButtonText: {
    color: ThemeColors.text,
    fontSize: scale(16),
    flex: 1,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(12),
    justifyContent: "space-between",
  },
  iconOption: {
    width: scale(48),
    height: scale(48),
    borderRadius: scale(24),
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    position: "relative",
  },
  iconCheckmark: {
    position: "absolute",
    top: -2,
    right: -2,
    width: scale(16),
    height: scale(16),
    borderRadius: scale(8),
    backgroundColor: ThemeColors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: scale(12),
    marginTop: scale(20),
  },
  modalButton: {
    flex: 1,
    borderRadius: scale(12),
    overflow: "hidden",
  },
  modalButtonGradient: {
    paddingVertical: scale(16),
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: scale(16),
    fontWeight: "600",
  },
  inputError: {
    borderColor: ThemeColors.danger,
  },
  errorText: {
    color: ThemeColors.danger,
    fontSize: scale(12),
    marginTop: scale(4),
  },
  passwordDescription: {
    color: ThemeColors.textSecondary,
    fontSize: scale(14),
    textAlign: "center",
    marginBottom: scale(20),
  },
  disabledButton: {
    opacity: 0.5,
  },
  loadingIndicator: {
    color: ThemeColors.primary,
    fontSize: scale(14),
  },
});

export default SettingsScreen;
