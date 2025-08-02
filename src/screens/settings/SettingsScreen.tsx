import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
  Animated,
  Platform,
  TextInput,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  LayoutAnimation,
  UIManager,
  Dimensions,
  RefreshControl,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { RootStackParamList } from "../../navigation";
import { useAppContext } from "../../context/AppContext";
import {
  MIN_FONT_SCALE,
  MAX_FONT_SCALE,
  DEFAULT_FONT_SCALE,
} from "../../context/AppContext";
import StyledText from "../../components/StyledText";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Get device dimensions
const { width, height } = Dimensions.get("window");
const isSmallDevice = width < 375;
const isTablet = width >= 768;

// Enhanced responsive scaling
const scale = (size: number) => {
  if (isTablet) return size * 1.2;
  if (isSmallDevice) return size * 0.85;
  return size;
};

// Define the navigation prop type
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Settings">;

// Enhanced theme colors
const ThemeColors = {
  primary: "#00E5FF",
  secondary: "#9C6CDA",
  success: "#4ECDC4",
  warning: "#FF9500",
  danger: "#FF4757",
  background: "#000000",
  surface: "#121212",
  card: "#1E1E1E",
  elevated: "#2A2A2A",
  text: "#FFFFFF",
  textSecondary: "#B0B0B0",
  textTertiary: "#808080",
  border: "rgba(255, 255, 255, 0.1)",
  borderFocus: "rgba(0, 229, 255, 0.5)",
  overlay: "rgba(0, 0, 0, 0.8)",
};

// Enhanced gradient configurations
const GradientConfigs = {
  primary: ["#00E5FF", "#9C6CDA"] as [string, string],
  secondary: ["#9C6CDA", "#7B4397"] as [string, string],
  success: ["#4ECDC4", "#44A08D"] as [string, string],
  warning: ["#FF9500", "#FFB74D"] as [string, string],
  danger: ["#FF4757", "#FF6B81"] as [string, string],
  surface: ["rgba(26, 26, 26, 0.95)", "rgba(42, 42, 42, 0.95)"] as [
    string,
    string
  ],
  card: ["rgba(30, 30, 30, 0.95)", "rgba(42, 42, 42, 0.95)"] as [
    string,
    string
  ],
};

// Enhanced interfaces
interface SettingItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: "categories" | "skipReasons" | "priorities";
  priority?: number;
  level?: number;
}

interface ColorOption {
  id: string;
  name: string;
  value: string;
  category: string;
}

// Available color options for customization
const ColorOptions: ColorOption[] = [
  { id: "1", name: "Electric Blue", value: "#00E5FF", category: "blue" },
  { id: "2", name: "Purple", value: "#9C6CDA", category: "purple" },
  { id: "3", name: "Mint Green", value: "#4ECDC4", category: "green" },
  { id: "4", name: "Orange", value: "#FF9500", category: "orange" },
  { id: "5", name: "Red", value: "#FF4757", category: "red" },
  { id: "6", name: "Pink", value: "#FF6B9D", category: "pink" },
  { id: "7", name: "Yellow", value: "#FFD93D", category: "yellow" },
  { id: "8", name: "Indigo", value: "#6C5CE7", category: "indigo" },
  { id: "9", name: "Teal", value: "#00CEC9", category: "teal" },
  { id: "10", name: "Coral", value: "#FD79A8", category: "coral" },
  { id: "11", name: "Lime", value: "#00B894", category: "lime" },
  { id: "12", name: "Violet", value: "#A29BFE", category: "violet" },
];

const SettingsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { fontSizeScale, setFontSizeScale, logout } = useAppContext();

  // Enhanced state management
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sliderValue, setSliderValue] = useState(fontSizeScale);
  const [textSizePreviewExpanded, setTextSizePreviewExpanded] = useState(false);

  // Settings data
  const [categories, setCategories] = useState<SettingItem[]>([]);
  const [skipReasons, setSkipReasons] = useState<SettingItem[]>([]);
  const [priorities, setPriorities] = useState<SettingItem[]>([]);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editingItem, setEditingItem] = useState<SettingItem | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [selectedColor, setSelectedColor] = useState(ColorOptions[0].value);
  const [currentCategory, setCurrentCategory] = useState<
    "categories" | "skipReasons" | "priorities"
  >("categories");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [pendingAction, setPendingAction] = useState<"clear" | "delete" | null>(
    null
  );

  // Enhanced animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const modalScaleAnim = useRef(new Animated.Value(0.3)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;
  const headerScaleAnim = useRef(new Animated.Value(0.95)).current;
  const sectionAnimRefs = useRef(
    Array(6)
      .fill(0)
      .map(() => new Animated.Value(0))
  ).current;

  // Enhanced initialization animations
  const initializeAnimations = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(headerScaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.stagger(
        100,
        sectionAnimRefs.map((anim) =>
          Animated.spring(anim, {
            toValue: 1,
            tension: 80,
            friction: 8,
            useNativeDriver: true,
          })
        )
      ),
    ]).start();
  }, [fadeAnim, slideAnim, headerScaleAnim, sectionAnimRefs]);

  // Load settings from API
  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      // TODO: Replace with actual API calls
      // const [categoriesRes, skipReasonsRes, prioritiesRes] = await Promise.all([
      //   settingsService.getCategories(),
      //   settingsService.getSkipReasons(),
      //   settingsService.getPriorities(),
      // ]);

      // For now, start with empty arrays until API is implemented
      setCategories([]);
      setSkipReasons([]);
      setPriorities([]);
    } catch (error) {
      console.error("Failed to load settings:", error);
      Alert.alert("Error", "Failed to load settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Enhanced refresh functionality
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadSettings();
    setIsRefreshing(false);
  }, [loadSettings]);

  // Focus effect for screen refresh
  useFocusEffect(
    useCallback(() => {
      loadSettings();
      initializeAnimations();
    }, [loadSettings, initializeAnimations])
  );

  // Update local state when context changes
  useEffect(() => {
    setSliderValue(fontSizeScale);
  }, [fontSizeScale]);

  // Enhanced helper functions
  const getFontSizeLabel = useCallback((scale: number): string => {
    if (scale <= 0.4) return "Extra Small";
    if (scale <= 0.5) return "Very Small";
    if (scale <= 0.6) return "Small";
    if (scale <= 0.7) return "Small-Medium";
    if (scale <= 0.8) return "Medium-Small";
    if (scale <= 0.9) return "Medium";
    if (scale === 1.0) return "Default";
    if (scale <= 1.1) return "Medium-Large";
    if (scale <= 1.2) return "Large";
    if (scale <= 1.4) return "Very Large";
    if (scale <= 1.6) return "Extra Large";
    return "Jumbo";
  }, []);

  const getFontSizePercentage = useCallback((scale: number): string => {
    return `${Math.round(scale * 100)}%`;
  }, []);

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
        icon: getIconForCategory(currentCategory),
        color: selectedColor,
        category: currentCategory,
        priority:
          currentCategory === "priorities" ? getNextPriority() : undefined,
        level: currentCategory === "priorities" ? getNextLevel() : undefined,
      };

      // TODO: Replace with actual API call
      // await settingsService.createItem(currentCategory, newItem);

      // Update local state
      switch (currentCategory) {
        case "categories":
          setCategories((prev) => [...prev, newItem]);
          break;
        case "skipReasons":
          setSkipReasons((prev) => [...prev, newItem]);
          break;
        case "priorities":
          setPriorities((prev) => [...prev, newItem]);
          break;
      }

      setNewItemName("");
      setSelectedColor(ColorOptions[0].value);
      hideModal();
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } catch (error) {
      console.error("Failed to add item:", error);
      Alert.alert("Error", "Failed to add item. Please try again.");
    }
  }, [newItemName, selectedColor, currentCategory]);

  const handleEditItem = useCallback(async () => {
    if (!editingItem || !newItemName.trim()) {
      Alert.alert("Error", "Please enter a name");
      return;
    }

    try {
      const updatedItem: SettingItem = {
        ...editingItem,
        name: newItemName.trim(),
        color: selectedColor,
      };

      // TODO: Replace with actual API call
      // await settingsService.updateItem(currentCategory, updatedItem);

      // Update local state
      const updateArray = (items: SettingItem[]) =>
        items.map((item) => (item.id === editingItem.id ? updatedItem : item));

      switch (currentCategory) {
        case "categories":
          setCategories(updateArray);
          break;
        case "skipReasons":
          setSkipReasons(updateArray);
          break;
        case "priorities":
          setPriorities(updateArray);
          break;
      }

      setEditingItem(null);
      setNewItemName("");
      setSelectedColor(ColorOptions[0].value);
      hideModal();
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } catch (error) {
      console.error("Failed to edit item:", error);
      Alert.alert("Error", "Failed to edit item. Please try again.");
    }
  }, [editingItem, newItemName, selectedColor, currentCategory]);

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
              // TODO: Replace with actual API call
              // await settingsService.deleteItem(item.category, item.id);

              // Update local state
              const filterArray = (items: SettingItem[]) =>
                items.filter((i) => i.id !== item.id);

              switch (item.category) {
                case "categories":
                  setCategories(filterArray);
                  break;
                case "skipReasons":
                  setSkipReasons(filterArray);
                  break;
                case "priorities":
                  setPriorities(filterArray);
                  break;
              }

              LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut
              );
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
  const getIconForCategory = useCallback(
    (category: "categories" | "skipReasons" | "priorities"): string => {
      switch (category) {
        case "categories":
          return "list-outline";
        case "skipReasons":
          return "time-outline";
        case "priorities":
          return "flag-outline";
        default:
          return "settings-outline";
      }
    },
    []
  );

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
      } else {
        setEditingItem(null);
        setNewItemName("");
        setSelectedColor(ColorOptions[0].value);
      }
      setShowAddModal(true);

      Animated.parallel([
        Animated.spring(modalScaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    },
    []
  );

  const hideModal = useCallback(() => {
    Animated.parallel([
      Animated.timing(modalScaleAnim, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowAddModal(false);
      setShowColorPicker(false);
      setEditingItem(null);
      setNewItemName("");
      setSelectedColor(ColorOptions[0].value);
    });
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
        // TODO: Replace with actual API call
        // await settingsService.clearAllData();
        setCategories([]);
        setSkipReasons([]);
        setPriorities([]);
        setFontSizeScale(DEFAULT_FONT_SCALE);
        Alert.alert("Success", "All data has been cleared.");
      } else if (pendingAction === "delete") {
        // TODO: Replace with actual API call
        // await authService.deleteAccount();
        logout();
        navigation.navigate("Login");
        Alert.alert("Account Deleted", "Your account has been deleted.");
      }

      setPassword("");
      setPasswordError("");
      setPendingAction(null);
      setShowPasswordModal(false);
    } catch (error) {
      console.error("Failed to perform action:", error);
      Alert.alert("Error", "Failed to perform action. Please try again.");
    }
  }, [password, pendingAction, logout, navigation, setFontSizeScale]);

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
      <Animated.View
        key={item.id}
        style={[
          styles.settingItem,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 50],
                  outputRange: [0, 30],
                }),
              },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={GradientConfigs.card}
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
      </Animated.View>
    ),
    [fadeAnim, slideAnim, showModal, handleDeleteItem]
  );

  const renderColorPicker = useCallback(
    () => (
      <View style={styles.colorPickerContainer}>
        <Text style={styles.colorPickerTitle}>Choose a Color</Text>
        <View style={styles.colorGrid}>
          {ColorOptions.map((color, index) => (
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

      {/* Enhanced Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: headerScaleAnim }],
          },
        ]}
      >
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
      </Animated.View>

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
        {/* Text Size Section */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ scale: sectionAnimRefs[0] }],
            },
          ]}
        >
          <LinearGradient
            colors={GradientConfigs.surface}
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
                  <Icon name="text-outline" size={scale(20)} color="#fff" />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Text Size</Text>
                  <Text style={styles.sectionSubtitle}>
                    Adjust app text size
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.expandButton}
                onPress={() =>
                  setTextSizePreviewExpanded(!textSizePreviewExpanded)
                }
              >
                <Icon
                  name={textSizePreviewExpanded ? "chevron-up" : "chevron-down"}
                  size={scale(20)}
                  color={ThemeColors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.sliderContainer}>
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>A</Text>
                <Text style={styles.sliderValueText}>
                  {getFontSizeLabel(sliderValue)} (
                  {getFontSizePercentage(sliderValue)})
                </Text>
                <Text style={[styles.sliderLabel, styles.sliderLabelLarge]}>
                  A
                </Text>
              </View>

              <Slider
                style={styles.slider}
                value={sliderValue}
                minimumValue={MIN_FONT_SCALE}
                maximumValue={MAX_FONT_SCALE}
                step={0.1}
                minimumTrackTintColor={ThemeColors.primary}
                maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
                thumbTintColor={ThemeColors.primary}
                onValueChange={setSliderValue}
                onSlidingComplete={setFontSizeScale}
              />

              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => {
                  setSliderValue(DEFAULT_FONT_SCALE);
                  setFontSizeScale(DEFAULT_FONT_SCALE);
                }}
              >
                <LinearGradient
                  colors={["rgba(0, 229, 255, 0.2)", "rgba(0, 229, 255, 0.1)"]}
                  style={styles.resetButtonGradient}
                >
                  <Text style={styles.resetButtonText}>Reset to Default</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {textSizePreviewExpanded && (
              <View style={styles.textPreviewContainer}>
                <LinearGradient
                  colors={["rgba(0, 0, 0, 0.3)", "rgba(0, 0, 0, 0.5)"]}
                  style={styles.textPreviewGradient}
                >
                  <StyledText variant="title" style={styles.previewTitle}>
                    Sample Title Text
                  </StyledText>
                  <StyledText variant="subtitle" style={styles.previewSubtitle}>
                    Sample Subtitle Text
                  </StyledText>
                  <StyledText variant="body" style={styles.previewBody}>
                    This is how your text will appear throughout the app with
                    the current size setting.
                  </StyledText>
                  <StyledText variant="caption" style={styles.previewCaption}>
                    Sample caption text for additional information.
                  </StyledText>
                </LinearGradient>
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Categories Section */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ scale: sectionAnimRefs[1] }],
            },
          ]}
        >
          <LinearGradient
            colors={GradientConfigs.surface}
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
                  <Text style={styles.sectionTitle}>Activity Categories</Text>
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
                  colors={GradientConfigs.secondary}
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
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ scale: sectionAnimRefs[2] }],
            },
          ]}
        >
          <LinearGradient
            colors={GradientConfigs.surface}
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
                  <Text style={styles.sectionTitle}>Skip Reasons</Text>
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
                  colors={GradientConfigs.warning}
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
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ scale: sectionAnimRefs[3] }],
            },
          ]}
        >
          <LinearGradient
            colors={GradientConfigs.surface}
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
                  <Text style={styles.sectionTitle}>Priority Levels</Text>
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
                  colors={GradientConfigs.success}
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
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ scale: sectionAnimRefs[4] }],
            },
          ]}
        >
          <LinearGradient
            colors={GradientConfigs.surface}
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
                  colors={GradientConfigs.primary}
                  style={styles.logoutButtonGradient}
                >
                  <Icon name="log-out-outline" size={scale(20)} color="#fff" />
                  <Text style={styles.logoutButtonText}>Logout</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Danger Zone Section */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ scale: sectionAnimRefs[5] }],
            },
          ]}
        >
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
        </Animated.View>

        {/* App Info Section */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ scale: sectionAnimRefs[5] }],
            },
          ]}
        >
          <LinearGradient
            colors={GradientConfigs.surface}
            style={styles.sectionGradient}
          >
            <View style={styles.appInfo}>
              <Icon
                name="information-circle-outline"
                size={scale(24)}
                color={ThemeColors.primary}
              />
              <Text style={styles.appInfoText}>Activity Manager v1.0.0</Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="none"
        onRequestClose={hideModal}
      >
        <TouchableWithoutFeedback onPress={hideModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <Animated.View
                style={[
                  styles.modalContainer,
                  {
                    transform: [{ scale: modalScaleAnim }],
                    opacity: modalOpacityAnim,
                  },
                ]}
              >
                <LinearGradient
                  colors={GradientConfigs.card}
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
                        colors={GradientConfigs.primary}
                        style={styles.modalButtonGradient}
                      >
                        <Text style={styles.modalButtonText}>
                          {editingItem ? "Update" : "Add"}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Password Confirmation Modal */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowPasswordModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <Animated.View
                style={[
                  styles.modalContainer,
                  {
                    transform: [{ scale: modalScaleAnim }],
                    opacity: modalOpacityAnim,
                  },
                ]}
              >
                <LinearGradient
                  colors={GradientConfigs.card}
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
                        colors={GradientConfigs.danger}
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
              </Animated.View>
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

  // Enhanced Header
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

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingBottom: scale(30),
  },

  // Enhanced Sections
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
  expandButton: {
    padding: scale(8),
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

  // Slider Container
  sliderContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: scale(16),
    padding: scale(16),
    marginBottom: scale(16),
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scale(12),
  },
  sliderLabel: {
    color: ThemeColors.textSecondary,
    fontSize: scale(16),
    fontWeight: "600",
  },
  sliderLabelLarge: {
    fontSize: scale(24),
  },
  sliderValueText: {
    color: ThemeColors.primary,
    fontSize: scale(14),
    fontWeight: "700",
  },
  slider: {
    width: "100%",
    height: scale(40),
    marginBottom: scale(12),
  },
  resetButton: {
    borderRadius: scale(12),
    overflow: "hidden",
    alignSelf: "center",
  },
  resetButtonGradient: {
    paddingHorizontal: scale(20),
    paddingVertical: scale(10),
    borderWidth: 1,
    borderColor: "rgba(0, 229, 255, 0.3)",
  },
  resetButtonText: {
    color: ThemeColors.primary,
    fontSize: scale(14),
    fontWeight: "600",
  },

  // Text Preview
  textPreviewContainer: {
    borderRadius: scale(12),
    overflow: "hidden",
    marginTop: scale(12),
  },
  textPreviewGradient: {
    padding: scale(16),
  },
  previewTitle: {
    color: ThemeColors.text,
    marginBottom: scale(8),
  },
  previewSubtitle: {
    color: ThemeColors.textSecondary,
    marginBottom: scale(8),
  },
  previewBody: {
    color: ThemeColors.textSecondary,
    marginBottom: scale(8),
    lineHeight: scale(20),
  },
  previewCaption: {
    color: ThemeColors.textTertiary,
  },

  // Settings List
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

  // Empty State
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

  // Account Actions
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

  // App Info
  appInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: scale(12),
    gap: scale(8),
  },
  appInfoText: {
    color: ThemeColors.textSecondary,
    fontSize: scale(14),
    fontWeight: "500",
  },

  // Enhanced Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: ThemeColors.overlay,
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

  // Color Picker
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

  // Modal Actions
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
  disabledButton: {
    opacity: 0.5,
  },
});

export default SettingsScreen;
