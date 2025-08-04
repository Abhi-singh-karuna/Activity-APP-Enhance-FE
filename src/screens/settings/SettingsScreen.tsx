import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Platform,
  TextInput,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Animated,
  LayoutAnimation,
  Image,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { RootStackParamList } from "../../navigation";
import { useAppContext } from "../../context/AppContext";
import { settingsService, UserInfo } from "./api";

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

// Custom Alert Types
interface CustomAlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: CustomAlertButton[];
  onClose: () => void;
  type?: "info" | "success" | "warning" | "error";
}

// Compact Custom Alert Component
const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons,
  onClose,
  type = "info",
}) => {
  const getAlertIcon = () => {
    switch (type) {
      case "success":
        return { name: "checkmark-circle", color: ThemeColors.success };
      case "warning":
        return { name: "warning", color: ThemeColors.warning };
      case "error":
        return { name: "close-circle", color: ThemeColors.danger };
      default:
        return { name: "information-circle", color: ThemeColors.primary };
    }
  };

  const getButtonStyle = (buttonStyle: string): [string, string] => {
    switch (buttonStyle) {
      case "destructive":
        return ["#FF4757", "#FF6B81"];
      case "cancel":
        return ["rgba(128, 128, 128, 0.4)", "rgba(128, 128, 128, 0.2)"];
      default:
        return ["#00E5FF", "#9C6CDA"];
    }
  };

  const icon = getAlertIcon();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={customAlertStyles.overlay}>
        <View style={customAlertStyles.container}>
          <LinearGradient
            colors={["rgba(30, 30, 30, 0.98)", "rgba(42, 42, 42, 0.98)"]}
            style={customAlertStyles.gradient}
          >
            <View style={customAlertStyles.header}>
              <Icon name={icon.name} size={scale(24)} color={icon.color} />
              <Text style={customAlertStyles.title}>{title}</Text>
            </View>

            <Text style={customAlertStyles.message}>{message}</Text>

            <View style={customAlertStyles.buttonsContainer}>
              {buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    customAlertStyles.button,
                    buttons.length === 1 && customAlertStyles.singleButton,
                  ]}
                  onPress={() => {
                    button.onPress?.();
                    onClose();
                  }}
                >
                  <LinearGradient
                    colors={getButtonStyle(button.style || "default")}
                    style={customAlertStyles.buttonGradient}
                  >
                    <Text
                      style={[
                        customAlertStyles.buttonText,
                        button.style === "cancel" && {
                          color: ThemeColors.textSecondary,
                        },
                      ]}
                    >
                      {button.text}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

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

// Custom Alert Hook
const useCustomAlert = () => {
  const [alertConfig, setAlertConfig] = useState<CustomAlertProps | null>(null);

  const showAlert = useCallback(
    (config: Omit<CustomAlertProps, "visible" | "onClose">) => {
      setAlertConfig({
        ...config,
        visible: true,
        onClose: () => setAlertConfig(null),
      });
    },
    []
  );

  const hideAlert = useCallback(() => {
    setAlertConfig(null);
  }, []);

  return { alertConfig, showAlert, hideAlert };
};

const SettingsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { logout } = useAppContext();
  const { alertConfig, showAlert, hideAlert } = useCustomAlert();

  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [categories, setCategories] = useState<SettingItem[]>([]);
  const [skipReasons, setSkipReasons] = useState<SettingItem[]>([]);
  const [priorities, setPriorities] = useState<SettingItem[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // Section visibility states
  const [categoriesVisible, setCategoriesVisible] = useState(true);
  const [skipReasonsVisible, setSkipReasonsVisible] = useState(true);
  const [prioritiesVisible, setPrioritiesVisible] = useState(true);

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
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  // Section toggle functions with improved animations
  const toggleCategoriesVisibility = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCategoriesVisible(!categoriesVisible);
  }, [categoriesVisible]);

  const toggleSkipReasonsVisibility = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSkipReasonsVisible(!skipReasonsVisible);
  }, [skipReasonsVisible]);

  const togglePrioritiesVisibility = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPrioritiesVisible(!prioritiesVisible);
  }, [prioritiesVisible]);

  // Load user info
  const loadUserInfo = useCallback(async () => {
    try {
      const response = await settingsService.getUserInfo();
      if (response.status && response.data) {
        setUserInfo(response.data);
      }
    } catch (error) {
      console.error("Failed to load user info:", error);
    }
  }, []);

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
        console.tron?.log("✅ Categories loaded:", categoriesRes.data.length);
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
      showAlert({
        title: "Error",
        message: "Failed to load settings. Please try again.",
        type: "error",
        buttons: [{ text: "OK" }],
      });
    } finally {
      setIsLoading(false);
      console.tron?.log("🏁 Settings loading completed");
    }
  }, [showAlert]);

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
    loadUserInfo();
  }, [loadSettings, loadUserInfo]);

  // Settings management functions
  const handleAddItem = useCallback(async () => {
    if (!newItemName.trim()) {
      showAlert({
        title: "Error",
        message: "Please enter a name",
        type: "error",
        buttons: [{ text: "OK" }],
      });
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

        showAlert({
          title: "Success",
          message: "Item added successfully!",
          type: "success",
          buttons: [{ text: "OK" }],
        });
      } else {
        throw new Error(response.error?.message || "Failed to create item");
      }
    } catch (error) {
      console.error("Failed to add item:", error);
      showAlert({
        title: "Error",
        message: "Failed to add item. Please try again.",
        type: "error",
        buttons: [{ text: "OK" }],
      });
    }
  }, [newItemName, selectedColor, selectedIcon, currentCategory, showAlert]);

  const handleEditItem = useCallback(async () => {
    if (!editingItem || !newItemName.trim()) {
      showAlert({
        title: "Error",
        message: "Please enter a name",
        type: "error",
        buttons: [{ text: "OK" }],
      });
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

        showAlert({
          title: "Success",
          message: "Item updated successfully!",
          type: "success",
          buttons: [{ text: "OK" }],
        });
      } else {
        throw new Error(response.error?.message || "Failed to update item");
      }
    } catch (error) {
      console.error("Failed to edit item:", error);
      showAlert({
        title: "Error",
        message: "Failed to edit item. Please try again.",
        type: "error",
        buttons: [{ text: "OK" }],
      });
    }
  }, [
    editingItem,
    newItemName,
    selectedColor,
    selectedIcon,
    currentCategory,
    showAlert,
  ]);

  const handleDeleteItem = useCallback(
    async (item: SettingItem) => {
      showAlert({
        title: "Delete Item",
        message: `Delete "${item.name}"? This cannot be undone.`,
        type: "warning",
        buttons: [
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
                  showAlert({
                    title: "Success",
                    message: "Item deleted successfully!",
                    type: "success",
                    buttons: [{ text: "OK" }],
                  });
                } else {
                  throw new Error(
                    response.error?.message || "Failed to delete item"
                  );
                }
              } catch (error) {
                console.error("Failed to delete item:", error);
                showAlert({
                  title: "Error",
                  message: "Failed to delete item. Please try again.",
                  type: "error",
                  buttons: [{ text: "OK" }],
                });
              }
            },
          },
        ],
      });
    },
    [showAlert]
  );

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

  // Account management with API password verification
  const handleClearAllData = useCallback(() => {
    showAlert({
      title: "Clear All Data",
      message:
        "This will permanently delete all your settings, categories, priorities, and skip reasons. This action cannot be undone.",
      type: "warning",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "destructive",
          onPress: () => {
            setPendingAction("clear");
            setShowPasswordModal(true);
          },
        },
      ],
    });
  }, [showAlert]);

  const handleDeleteAccount = useCallback(() => {
    showAlert({
      title: "Delete Account",
      message:
        "This will permanently delete your account and all associated data including settings, preferences, and user information. This action cannot be undone.",
      type: "error",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "destructive",
          onPress: () => {
            setPendingAction("delete");
            setShowPasswordModal(true);
          },
        },
      ],
    });
  }, [showAlert]);

  const handlePasswordConfirm = useCallback(async () => {
    if (!password.trim()) {
      setPasswordError("Please enter your password.");
      return;
    }

    try {
      setIsPasswordLoading(true);
      setPasswordError("");

      // Verify password with API
      const passwordVerificationResponse = await settingsService.verifyPassword(
        {
          password: password.trim(),
        }
      );

      if (!passwordVerificationResponse.status) {
        setPasswordError(
          passwordVerificationResponse.error?.message ||
            "Invalid password. Please try again."
        );
        return;
      }

      // Password verified, proceed with the action
      if (pendingAction === "clear") {
        // Clear all data using API
        const response = await settingsService.clearAllSettings();
        if (response.status) {
          // Clear local state
          setCategories([]);
          setSkipReasons([]);
          setPriorities([]);

          // Close modal and show success
          setPassword("");
          setPasswordError("");
          setPendingAction(null);
          setShowPasswordModal(false);

          showAlert({
            title: "Success",
            message: "All data has been cleared successfully.",
            type: "success",
            buttons: [{ text: "OK" }],
          });
        } else {
          throw new Error(response.error?.message || "Failed to clear data");
        }
      } else if (pendingAction === "delete") {
        // Delete account using API
        const response = await settingsService.deleteAccount();
        if (response.status) {
          // Close modal first
          setPassword("");
          setPasswordError("");
          setPendingAction(null);
          setShowPasswordModal(false);

          // Logout and navigate
          await logout();
          navigation.navigate("Login");

          showAlert({
            title: "Account Deleted",
            message: "Your account has been permanently deleted.",
            type: "info",
            buttons: [{ text: "OK" }],
          });
        } else {
          throw new Error(
            response.error?.message || "Failed to delete account"
          );
        }
      }
    } catch (error: any) {
      console.error("Failed to perform action:", error);
      setPasswordError(error.message || "An error occurred. Please try again.");
    } finally {
      setIsPasswordLoading(false);
    }
  }, [password, pendingAction, logout, navigation, showAlert]);

  const handleLogout = useCallback(() => {
    showAlert({
      title: "Logout",
      message: "Are you sure you want to logout?",
      type: "info",
      buttons: [
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
              showAlert({
                title: "Error",
                message: "Failed to logout. Please try again.",
                type: "error",
                buttons: [{ text: "OK" }],
              });
            }
          },
        },
      ],
    });
  }, [logout, navigation, showAlert]);

  // Render helper functions
  const renderSettingItem = useCallback(
    (item: SettingItem, index: number) => (
      <View key={item.id} style={styles.settingItemCard}>
        <LinearGradient
          colors={["rgba(28, 28, 30, 0.98)", "rgba(44, 44, 46, 0.95)"]}
          style={styles.settingItemGradient}
        >
          <View style={styles.settingItemContent}>
            <View style={styles.settingItemLeft}>
              <View
                style={[styles.settingIcon, { backgroundColor: item.color }]}
              >
                <Icon name={item.icon} size={scale(18)} color="#fff" />
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
                style={[styles.actionButton, styles.editButton]}
                onPress={() => showModal(item.category, item)}
                activeOpacity={0.7}
              >
                <Icon
                  name="pencil"
                  size={scale(14)}
                  color={ThemeColors.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteItem(item)}
                activeOpacity={0.7}
              >
                <Icon
                  name="trash"
                  size={scale(14)}
                  color={ThemeColors.danger}
                />
              </TouchableOpacity>
            </View>
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
          <View style={styles.sectionCard}>
            <LinearGradient
              colors={["rgba(28, 28, 30, 0.98)", "rgba(44, 44, 46, 0.95)"]}
              style={styles.sectionGradient}
            >
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={toggleCategoriesVisibility}
                activeOpacity={0.8}
              >
                <View style={styles.sectionHeaderLeft}>
                  <View
                    style={[
                      styles.sectionIcon,
                      { backgroundColor: ThemeColors.secondary },
                    ]}
                  >
                    <Icon name="list" size={scale(18)} color="#fff" />
                  </View>
                  <View style={styles.sectionHeaderText}>
                    <Text style={styles.sectionTitle}>
                      Categories ({categories.length})
                      {categoriesLoading && (
                        <Text style={styles.loadingIndicator}> ⟳</Text>
                      )}
                    </Text>
                    <Text style={styles.sectionSubtitle}>
                      Manage activity categories
                    </Text>
                  </View>
                </View>
                <View style={styles.sectionHeaderRight}>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      showModal("categories");
                    }}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={[ThemeColors.secondary, "#7B4397"]}
                      style={styles.addButtonGradient}
                    >
                      <Icon name="add" size={scale(16)} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                  <View style={styles.toggleIcon}>
                    <Icon
                      name={categoriesVisible ? "chevron-up" : "chevron-down"}
                      size={scale(18)}
                      color={ThemeColors.textSecondary}
                    />
                  </View>
                </View>
              </TouchableOpacity>

              {categoriesVisible && (
                <View style={styles.sectionContent}>
                  {categories.length > 0 ? (
                    <View style={styles.settingsList}>
                      {categories.map((item, index) =>
                        renderSettingItem(item, index)
                      )}
                    </View>
                  ) : (
                    <View style={styles.emptyState}>
                      <View style={styles.emptyStateIcon}>
                        <Icon
                          name="list-outline"
                          size={scale(32)}
                          color={ThemeColors.textTertiary}
                        />
                      </View>
                      <Text style={styles.emptyStateText}>
                        No categories yet
                      </Text>
                      <TouchableOpacity
                        style={styles.emptyStateButton}
                        onPress={() => showModal("categories")}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.emptyStateButtonText}>
                          Add First Category
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Skip Reasons Section */}
        <Animated.View
          style={[styles.section, { opacity: skipReasonsOpacity }]}
        >
          <View style={styles.sectionCard}>
            <LinearGradient
              colors={["rgba(28, 28, 30, 0.98)", "rgba(44, 44, 46, 0.95)"]}
              style={styles.sectionGradient}
            >
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={toggleSkipReasonsVisibility}
                activeOpacity={0.8}
              >
                <View style={styles.sectionHeaderLeft}>
                  <View
                    style={[
                      styles.sectionIcon,
                      { backgroundColor: ThemeColors.warning },
                    ]}
                  >
                    <Icon name="time" size={scale(18)} color="#fff" />
                  </View>
                  <View style={styles.sectionHeaderText}>
                    <Text style={styles.sectionTitle}>
                      Skip Reasons ({skipReasons.length})
                      {skipReasonsLoading && (
                        <Text style={styles.loadingIndicator}> ⟳</Text>
                      )}
                    </Text>
                    <Text style={styles.sectionSubtitle}>
                      Reasons for skipping activities
                    </Text>
                  </View>
                </View>
                <View style={styles.sectionHeaderRight}>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      showModal("skipReasons");
                    }}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={[ThemeColors.warning, "#FFB74D"]}
                      style={styles.addButtonGradient}
                    >
                      <Icon name="add" size={scale(16)} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                  <View style={styles.toggleIcon}>
                    <Icon
                      name={skipReasonsVisible ? "chevron-up" : "chevron-down"}
                      size={scale(18)}
                      color={ThemeColors.textSecondary}
                    />
                  </View>
                </View>
              </TouchableOpacity>

              {skipReasonsVisible && (
                <View style={styles.sectionContent}>
                  {skipReasons.length > 0 ? (
                    <View style={styles.settingsList}>
                      {skipReasons.map((item, index) =>
                        renderSettingItem(item, index)
                      )}
                    </View>
                  ) : (
                    <View style={styles.emptyState}>
                      <View style={styles.emptyStateIcon}>
                        <Icon
                          name="time-outline"
                          size={scale(32)}
                          color={ThemeColors.textTertiary}
                        />
                      </View>
                      <Text style={styles.emptyStateText}>
                        No skip reasons yet
                      </Text>
                      <TouchableOpacity
                        style={styles.emptyStateButton}
                        onPress={() => showModal("skipReasons")}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.emptyStateButtonText}>
                          Add First Reason
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Priority Levels Section */}
        <Animated.View style={[styles.section, { opacity: prioritiesOpacity }]}>
          <View style={styles.sectionCard}>
            <LinearGradient
              colors={["rgba(28, 28, 30, 0.98)", "rgba(44, 44, 46, 0.95)"]}
              style={styles.sectionGradient}
            >
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={togglePrioritiesVisibility}
                activeOpacity={0.8}
              >
                <View style={styles.sectionHeaderLeft}>
                  <View
                    style={[
                      styles.sectionIcon,
                      { backgroundColor: ThemeColors.success },
                    ]}
                  >
                    <Icon name="flag" size={scale(18)} color="#fff" />
                  </View>
                  <View style={styles.sectionHeaderText}>
                    <Text style={styles.sectionTitle}>
                      Priorities ({priorities.length})
                      {prioritiesLoading && (
                        <Text style={styles.loadingIndicator}> ⟳</Text>
                      )}
                    </Text>
                    <Text style={styles.sectionSubtitle}>
                      Task priority configuration
                    </Text>
                  </View>
                </View>
                <View style={styles.sectionHeaderRight}>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      showModal("priorities");
                    }}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={[ThemeColors.success, "#44A08D"]}
                      style={styles.addButtonGradient}
                    >
                      <Icon name="add" size={scale(16)} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                  <View style={styles.toggleIcon}>
                    <Icon
                      name={prioritiesVisible ? "chevron-up" : "chevron-down"}
                      size={scale(18)}
                      color={ThemeColors.textSecondary}
                    />
                  </View>
                </View>
              </TouchableOpacity>

              {prioritiesVisible && (
                <View style={styles.sectionContent}>
                  {priorities.length > 0 ? (
                    <View style={styles.settingsList}>
                      {priorities.map((item, index) =>
                        renderSettingItem(item, index)
                      )}
                    </View>
                  ) : (
                    <View style={styles.emptyState}>
                      <View style={styles.emptyStateIcon}>
                        <Icon
                          name="flag-outline"
                          size={scale(32)}
                          color={ThemeColors.textTertiary}
                        />
                      </View>
                      <Text style={styles.emptyStateText}>
                        No priority levels yet
                      </Text>
                      <TouchableOpacity
                        style={styles.emptyStateButton}
                        onPress={() => showModal("priorities")}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.emptyStateButtonText}>
                          Add First Priority
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Account Section - Improved Design */}
        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <LinearGradient
              colors={["rgba(28, 28, 30, 0.98)", "rgba(44, 44, 46, 0.95)"]}
              style={styles.sectionGradient}
            >
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <View
                    style={[
                      styles.sectionIcon,
                      { backgroundColor: ThemeColors.primary },
                    ]}
                  >
                    <Icon name="person" size={scale(18)} color="#fff" />
                  </View>
                  <View style={styles.sectionHeaderText}>
                    <Text style={styles.sectionTitle}>Account</Text>
                    <Text style={styles.sectionSubtitle}>
                      Manage your account settings
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.sectionContent}>
                <View style={styles.accountCard}>
                  <LinearGradient
                    colors={[
                      "rgba(0, 229, 255, 0.15)",
                      "rgba(156, 108, 218, 0.15)",
                    ]}
                    style={styles.accountCardGradient}
                  >
                    <View style={styles.accountInfo}>
                      <View style={styles.accountAvatar}>
                        {userInfo?.avatar ? (
                          <Image
                            source={{ uri: userInfo.avatar }}
                            style={styles.accountAvatarImage}
                          />
                        ) : (
                          <LinearGradient
                            colors={[
                              ThemeColors.primary,
                              ThemeColors.secondary,
                            ]}
                            style={styles.accountAvatarGradient}
                          >
                            <Icon name="person" size={scale(24)} color="#fff" />
                          </LinearGradient>
                        )}
                      </View>
                      <View style={styles.accountDetails}>
                        <Text style={styles.accountName}>
                          {userInfo?.name || "User Account"}
                        </Text>
                        <Text style={styles.accountEmail}>
                          {userInfo?.email || "user@example.com"}
                        </Text>
                        <Text style={styles.accountStatus}>
                          <Icon
                            name="shield-checkmark"
                            size={scale(12)}
                            color={ThemeColors.success}
                          />{" "}
                          {userInfo?.status || "Active"}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.improvedLogoutButton}
                      onPress={handleLogout}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={[ThemeColors.primary, ThemeColors.secondary]}
                        style={styles.improvedLogoutButtonGradient}
                      >
                        <Icon name="log-out" size={scale(18)} color="#fff" />
                        <Text style={styles.improvedLogoutButtonText}>
                          Logout
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Danger Zone Section */}
        <View style={styles.section}>
          <View style={[styles.sectionCard, styles.dangerCard]}>
            <LinearGradient
              colors={["rgba(255, 71, 87, 0.15)", "rgba(255, 71, 87, 0.08)"]}
              style={styles.sectionGradient}
            >
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <View
                    style={[
                      styles.sectionIcon,
                      { backgroundColor: ThemeColors.danger },
                    ]}
                  >
                    <Icon name="warning" size={scale(18)} color="#fff" />
                  </View>
                  <View style={styles.sectionHeaderText}>
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: ThemeColors.danger },
                      ]}
                    >
                      Danger Zone
                    </Text>
                    <Text style={styles.sectionSubtitle}>
                      Irreversible actions
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.sectionContent}>
                <View style={styles.dangerActions}>
                  <TouchableOpacity
                    style={styles.dangerButton}
                    onPress={handleClearAllData}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[
                        "rgba(255, 149, 0, 0.25)",
                        "rgba(255, 149, 0, 0.15)",
                      ]}
                      style={styles.dangerButtonGradient}
                    >
                      <Icon
                        name="trash"
                        size={scale(16)}
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
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[
                        "rgba(255, 71, 87, 0.25)",
                        "rgba(255, 71, 87, 0.15)",
                      ]}
                      style={styles.dangerButtonGradient}
                    >
                      <Icon
                        name="alert-circle"
                        size={scale(16)}
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
              </View>
            </LinearGradient>
          </View>
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

      {/* Enhanced Password Confirmation Modal */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!isPasswordLoading) {
            setShowPasswordModal(false);
            setPassword("");
            setPasswordError("");
            setPendingAction(null);
          }
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            if (!isPasswordLoading) {
              setShowPasswordModal(false);
              setPassword("");
              setPasswordError("");
              setPendingAction(null);
            }
          }}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalContainer}>
                <LinearGradient
                  colors={["rgba(30, 30, 30, 0.95)", "rgba(42, 42, 42, 0.95)"]}
                  style={styles.modalGradient}
                >
                  <Icon
                    name="lock-closed"
                    size={scale(48)}
                    color={ThemeColors.danger}
                  />
                  <Text style={styles.modalTitle}>Confirm Password</Text>
                  <Text style={styles.passwordDescription}>
                    {pendingAction === "clear"
                      ? "Enter your password to clear all data"
                      : "Enter your password to delete your account"}
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
                      editable={!isPasswordLoading}
                    />
                    {passwordError ? (
                      <Text style={styles.errorText}>{passwordError}</Text>
                    ) : null}
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => {
                        if (!isPasswordLoading) {
                          setShowPasswordModal(false);
                          setPassword("");
                          setPasswordError("");
                          setPendingAction(null);
                        }
                      }}
                      disabled={isPasswordLoading}
                    >
                      <LinearGradient
                        colors={[
                          "rgba(128, 128, 128, 0.3)",
                          "rgba(128, 128, 128, 0.1)",
                        ]}
                        style={[
                          styles.modalButtonGradient,
                          isPasswordLoading && styles.disabledButton,
                        ]}
                      >
                        <Text style={styles.modalButtonText}>Cancel</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={handlePasswordConfirm}
                      disabled={!password.trim() || isPasswordLoading}
                    >
                      <LinearGradient
                        colors={["#FF4757", "#FF6B81"]}
                        style={[
                          styles.modalButtonGradient,
                          (!password.trim() || isPasswordLoading) &&
                            styles.disabledButton,
                        ]}
                      >
                        {isPasswordLoading ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.modalButtonText}>
                            {pendingAction === "clear"
                              ? "Clear Data"
                              : "Delete Account"}
                          </Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Custom Alert */}
      {alertConfig && (
        <CustomAlert
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          buttons={alertConfig.buttons}
          onClose={alertConfig.onClose}
          type={alertConfig.type}
        />
      )}
    </View>
  );
};

// Compact Custom Alert Styles
const customAlertStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: scale(20),
  },
  container: {
    width: "90%",
    maxWidth: scale(280),
    borderRadius: scale(16),
    overflow: "hidden",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  gradient: {
    padding: scale(20),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(12),
    gap: scale(8),
  },
  title: {
    color: ThemeColors.text,
    fontSize: scale(16),
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  message: {
    color: ThemeColors.textSecondary,
    fontSize: scale(14),
    textAlign: "center",
    lineHeight: scale(20),
    marginBottom: scale(20),
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: scale(10),
    width: "100%",
  },
  button: {
    flex: 1,
    borderRadius: scale(12),
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  singleButton: {
    minWidth: scale(100),
  },
  buttonGradient: {
    paddingVertical: scale(12),
    paddingHorizontal: scale(16),
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: scale(14),
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});

// Main improved styles with FIXED delete icon alignment
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
    paddingHorizontal: scale(18),
    paddingBottom: scale(30),
  },
  section: {
    marginBottom: scale(16),
  },
  sectionCard: {
    borderRadius: scale(16),
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  dangerCard: {
    borderColor: "rgba(255, 71, 87, 0.2)",
  },
  sectionGradient: {
    padding: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: scale(18),
    paddingVertical: scale(16),
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sectionHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(12),
  },
  sectionIcon: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(12),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    color: ThemeColors.text,
    fontSize: scale(16),
    fontWeight: "700",
    marginBottom: scale(2),
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    color: ThemeColors.textSecondary,
    fontSize: scale(12),
    fontWeight: "500",
  },
  addButton: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  addButtonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  toggleIcon: {
    padding: scale(4),
  },
  sectionContent: {
    paddingHorizontal: scale(18),
    paddingTop: scale(14),
    paddingBottom: scale(18),
  },
  settingsList: {
    gap: scale(10),
  },
  settingItemCard: {
    borderRadius: scale(12),
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  settingItemGradient: {
    padding: 0,
  },
  settingItemContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: scale(14),
    paddingVertical: scale(12),
  },
  settingItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    justifyContent: "center",
    alignItems: "center",
    marginRight: scale(12),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  settingItemInfo: {
    flex: 1,
  },
  settingItemName: {
    color: ThemeColors.text,
    fontSize: scale(14),
    fontWeight: "600",
    marginBottom: scale(2),
    letterSpacing: 0.2,
  },
  settingItemMeta: {
    color: ThemeColors.textSecondary,
    fontSize: scale(11),
    fontWeight: "500",
  },
  settingItemActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },
  // FIXED: Delete icon alignment issue
  actionButton: {
    width: scale(30),
    height: scale(30),
    borderRadius: scale(15),
    justifyContent: "center",
    alignItems: "center", // This ensures perfect centering
    borderWidth: 1,
  },
  editButton: {
    backgroundColor: "rgba(0, 229, 255, 0.1)",
    borderColor: "rgba(0, 229, 255, 0.2)",
  },
  deleteButton: {
    backgroundColor: "rgba(255, 71, 87, 0.1)",
    borderColor: "rgba(255, 71, 87, 0.2)",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: scale(24),
  },
  emptyStateIcon: {
    padding: scale(12),
    borderRadius: scale(24),
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    marginBottom: scale(12),
  },
  emptyStateText: {
    color: ThemeColors.textTertiary,
    fontSize: scale(14),
    fontWeight: "500",
    marginBottom: scale(16),
    textAlign: "center",
  },
  emptyStateButton: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: scale(20),
    paddingVertical: scale(10),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  emptyStateButtonText: {
    color: ThemeColors.primary,
    fontSize: scale(13),
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  // Improved Account Section
  accountCard: {
    borderRadius: scale(12),
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  accountCardGradient: {
    padding: scale(16),
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  accountInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: scale(16),
  },
  accountAvatar: {
    width: scale(50),
    height: scale(50),
    borderRadius: scale(25),
    overflow: "hidden",
    marginRight: scale(14),
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  accountAvatarGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  accountAvatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: scale(25),
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    color: ThemeColors.text,
    fontSize: scale(16),
    fontWeight: "700",
    marginBottom: scale(4),
    letterSpacing: 0.3,
  },
  accountEmail: {
    color: ThemeColors.textSecondary,
    fontSize: scale(13),
    marginBottom: scale(4),
  },
  accountStatus: {
    color: ThemeColors.success,
    fontSize: scale(12),
    fontWeight: "600",
  },
  improvedLogoutButton: {
    borderRadius: scale(10),
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  improvedLogoutButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(12),
    paddingHorizontal: scale(20),
    gap: scale(8),
  },
  improvedLogoutButtonText: {
    color: "#fff",
    fontSize: scale(15),
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  dangerActions: {
    gap: scale(12),
    paddingTop: scale(4),
  },
  dangerButton: {
    borderRadius: scale(12),
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  dangerButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(14),
    paddingHorizontal: scale(20),
    gap: scale(8),
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  dangerButtonText: {
    fontSize: scale(15),
    fontWeight: "600",
    letterSpacing: 0.2,
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
    flexDirection: "row",
    gap: scale(8),
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
    lineHeight: scale(20),
  },
  disabledButton: {
    opacity: 0.5,
  },
  loadingIndicator: {
    color: ThemeColors.primary,
    fontSize: scale(12),
  },
});

export default SettingsScreen;
