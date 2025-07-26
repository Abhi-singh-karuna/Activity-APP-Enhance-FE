import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
  Switch,
  Animated,
  Platform,
  TextInput,
  FlatList,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { RootStackParamList } from "../navigation";
import { useAppContext } from "../context/AppContext";
import {
  MIN_FONT_SCALE,
  MAX_FONT_SCALE,
  DEFAULT_FONT_SCALE,
} from "../context/AppContext";
import StyledText from "../components/StyledText";
import { SkipDayEntry, SkipDayDate } from "../api/apiClient";
import { format, parseISO } from "date-fns";
import DatePicker from "../components/DatePicker";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
// import * as Haptics from "expo-haptics";

// Define the navigation prop type explicitly
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Settings">;

// Interface for section state
interface SectionState {
  textSize: boolean;
  categories: boolean;
  skipReasons: boolean;
  skipDays: boolean;
  taskPriorities: boolean;
  about: boolean;
}

const SettingsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const {
    fontSizeScale,
    setFontSizeScale,
    logout,
    categories,
    setCategories,
    skipReasons,
    setSkipReasons,
    skipDayEntries,
    addOrUpdateSkipDayEntry,
    updateSkipDayEntry,
    deleteSkipDayEntry,
    getSkipDayEntryByReason,
    isLoading,
  } = useAppContext();

  // Track expanded/collapsed state of each section
  const [expandedSections, setExpandedSections] = useState<SectionState>({
    textSize: false, // Change this to false to start collapsed
    categories: true,
    skipReasons: true,
    skipDays: true,
    taskPriorities: true,
    about: true,
  });

  // Add a new state for the preview expansion
  const [textSizePreviewExpanded, setTextSizePreviewExpanded] =
    useState<boolean>(false);

  // Animation values for each section
  const textSizeHeight = useRef(new Animated.Value(1)).current;
  const categoriesHeight = useRef(new Animated.Value(1)).current;
  const skipReasonsHeight = useRef(new Animated.Value(1)).current;
  const skipDaysHeight = useRef(new Animated.Value(1)).current;
  const taskPrioritiesHeight = useRef(new Animated.Value(1)).current;
  const aboutHeight = useRef(new Animated.Value(1)).current;

  // Store each section's content height
  const [sectionHeights, setSectionHeights] = useState({
    textSize: 0,
    categories: 0,
    skipReasons: 0,
    skipDays: 0,
    taskPriorities: 0,
    about: 0,
  });

  // Local state for the slider
  const [sliderValue, setSliderValue] = useState(fontSizeScale);

  // Animation for the logout button
  const [logoutButtonScale] = useState(new Animated.Value(1));

  // Update local state for modals and editing, but use context for data
  const [newCategory, setNewCategory] = useState("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{
    index: number;
    value: string;
  } | null>(null);

  const [newSkipReason, setNewSkipReason] = useState("");
  const [showSkipReasonModal, setShowSkipReasonModal] = useState(false);
  const [editingSkipReason, setEditingSkipReason] = useState<{
    index: number;
    value: string;
  } | null>(null);

  // Animation for modal
  const modalAnimation = useRef(new Animated.Value(0)).current;

  // Add state for skip day entry management
  const [showSkipDayModal, setShowSkipDayModal] = useState(false);
  const [editingSkipDay, setEditingSkipDay] = useState<SkipDayEntry | null>(
    null
  );
  const [selectedDates, setSelectedDates] = useState<SkipDayDate[]>([]);
  const [selectedReason, setSelectedReason] = useState("");
  const [skipDayNote, setSkipDayNote] = useState("");

  // Add state variables for manual date entry
  const [currentDateInput, setCurrentDateInput] = useState<string>("");
  const [currentDateNote, setCurrentDateNote] = useState<string>("");

  // Add password confirmation state
  const [passwordConfirmModal, setPasswordConfirmModal] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [actionPending, setActionPending] = useState<"clear" | "delete" | null>(
    null
  );

  // Priority level definitions
  const [priorityLevels, setPriorityLevels] = useState([
    { level: 1, name: "Highest", color: "#FF3B30" },
    { level: 2, name: "High", color: "#FF9500" },
    { level: 3, name: "Medium", color: "#34C759" },
    { level: 4, name: "Low", color: "#007AFF" },
    { level: 5, name: "Lowest", color: "#5856D6" },
  ]);

  // Priority being edited in modal
  const [editingPriority, setEditingPriority] = useState<{
    index: number;
    level: number;
    name: string;
    color: string;
  } | null>(null);

  // Show priority edit modal state
  const [showPriorityModal, setShowPriorityModal] = useState(false);

  // Add state for date picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Define color options for priorities
  const priorityColorOptions = [
    "#FF3B30", // Red
    "#FF9500", // Orange
    "#FFCC00", // Yellow
    "#34C759", // Green
    "#5AC8FA", // Light Blue
    "#007AFF", // Blue
    "#5856D6", // Purple
    "#AF52DE", // Magenta
    "#FF2D55", // Pink
    "#8E8E93", // Gray
  ];

  // Add new state for a new priority
  const [newPriority, setNewPriority] = useState({
    level: 0,
    name: "",
    color: priorityColorOptions[0],
  });

  // Update local state for modals and editing, but use context for data
  useEffect(() => {
    setSliderValue(fontSizeScale);
  }, [fontSizeScale]);

  // Function to toggle section expansion
  const toggleSection = (section: keyof SectionState) => {
    // Toggle the expanded state
    const newExpandedState = !expandedSections[section];
    setExpandedSections({ ...expandedSections, [section]: newExpandedState });

    // Animate the height change
    const sectionAnimValue =
      section === "textSize"
        ? textSizeHeight
        : section === "categories"
        ? categoriesHeight
        : section === "skipReasons"
        ? skipReasonsHeight
        : section === "skipDays"
        ? skipDaysHeight
        : section === "taskPriorities"
        ? taskPrioritiesHeight
        : aboutHeight;

    Animated.timing(sectionAnimValue, {
      toValue: newExpandedState ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();

    // Add a small vibration feedback when toggling sections
    // Disable Haptics since the library is missing
    // if (Platform.OS === "ios") {
    //   Haptics?.selectionAsync?.();
    // }
  };

  // Get a descriptive label for the current font size
  const getFontSizeLabel = (scale: number): string => {
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
  };

  // Calculate percentage for display purposes
  const getFontSizePercentage = (scale: number): string => {
    return `${Math.round(scale * 100)}%`;
  };

  const handleSliderValueChange = (value: number) => {
    setSliderValue(value);
  };

  const handleSliderComplete = (value: number) => {
    setFontSizeScale(value);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        onPress: () => {
          // Animate the button when pressing logout
          Animated.sequence([
            Animated.timing(logoutButtonScale, {
              toValue: 0.95,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(logoutButtonScale, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
          ]).start(() => {
            logout();
            navigation.navigate("Login");
          });
        },
        style: "destructive",
      },
    ]);
  };

  // Function to add a new category
  const handleAddCategory = async () => {
    if (newCategory.trim() === "") return;

    if (categories.includes(newCategory.trim())) {
      Alert.alert(
        "Category already exists",
        "Please use a unique category name."
      );
      return;
    }

    try {
      await setCategories([...categories, newCategory.trim()]);
      setNewCategory("");
      setShowCategoryModal(false);
      Alert.alert("Success", "Category added successfully");
    } catch (error) {
      console.error("Error adding category:", error);
      Alert.alert("Error", "Failed to add category. Please try again.");
    }
  };

  // Function to edit a category
  const handleEditCategory = async () => {
    if (!editingCategory) return;
    if (editingCategory.value.trim() === "") return;

    if (
      categories.includes(editingCategory.value.trim()) &&
      categories[editingCategory.index] !== editingCategory.value.trim()
    ) {
      Alert.alert(
        "Category already exists",
        "Please use a unique category name."
      );
      return;
    }

    try {
      const updatedCategories = [...categories];
      updatedCategories[editingCategory.index] = editingCategory.value.trim();
      await setCategories(updatedCategories);
      setEditingCategory(null);
      setShowCategoryModal(false);
      Alert.alert("Success", "Category updated successfully");
    } catch (error) {
      console.error("Error updating category:", error);
      Alert.alert("Error", "Failed to update category. Please try again.");
    }
  };

  // Function to delete a category
  const handleDeleteCategory = (index: number) => {
    Alert.alert(
      "Delete Category",
      "Are you sure you want to delete this category? Activities with this category may be affected.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              const updatedCategories = [...categories];
              updatedCategories.splice(index, 1);
              await setCategories(updatedCategories);
              Alert.alert("Success", "Category deleted successfully");
            } catch (error) {
              console.error("Error deleting category:", error);
              Alert.alert(
                "Error",
                "Failed to delete category. Please try again."
              );
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  // Function to add a new skip reason
  const handleAddSkipReason = async () => {
    if (newSkipReason.trim() === "") return;

    if (skipReasons.includes(newSkipReason.trim())) {
      Alert.alert("Reason already exists", "Please use a unique reason.");
      return;
    }

    try {
      await setSkipReasons([...skipReasons, newSkipReason.trim()]);
      setNewSkipReason("");
      setShowSkipReasonModal(false);
      Alert.alert("Success", "Skip reason added successfully");
    } catch (error) {
      console.error("Error adding skip reason:", error);
      Alert.alert("Error", "Failed to add skip reason. Please try again.");
    }
  };

  // Function to edit a skip reason
  const handleEditSkipReason = async () => {
    if (!editingSkipReason) return;
    if (editingSkipReason.value.trim() === "") return;

    if (
      skipReasons.includes(editingSkipReason.value.trim()) &&
      skipReasons[editingSkipReason.index] !== editingSkipReason.value.trim()
    ) {
      Alert.alert("Reason already exists", "Please use a unique reason.");
      return;
    }

    try {
      const updatedSkipReasons = [...skipReasons];
      updatedSkipReasons[editingSkipReason.index] =
        editingSkipReason.value.trim();
      await setSkipReasons(updatedSkipReasons);
      setEditingSkipReason(null);
      setShowSkipReasonModal(false);
      Alert.alert("Success", "Skip reason updated successfully");
    } catch (error) {
      console.error("Error updating skip reason:", error);
      Alert.alert("Error", "Failed to update skip reason. Please try again.");
    }
  };

  // Function to delete a skip reason
  const handleDeleteSkipReason = (index: number) => {
    Alert.alert(
      "Delete Skip Reason",
      "Are you sure you want to delete this skip reason?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              // Create a copy of the array without the element at the specified index
              const updatedReasons = [
                ...skipReasons.slice(0, index),
                ...skipReasons.slice(index + 1),
              ];
              // Update the context
              await setSkipReasons(updatedReasons);
              Alert.alert("Success", "Skip reason deleted successfully");
            } catch (error) {
              console.error("Error deleting skip reason:", error);
              Alert.alert(
                "Error",
                "Failed to delete skip reason. Please try again."
              );
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  // Function to show modal with animation
  const showModalWithAnimation = (
    setModalVisible: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setModalVisible(true);
    Animated.spring(modalAnimation, {
      toValue: 1,
      friction: 8,
      tension: 65,
      useNativeDriver: true,
    }).start();
  };

  // Function to hide modal with animation
  const hideModalWithAnimation = (
    setModalVisible: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
    });
  };

  // Reset modal animation when modal visibility changes
  useEffect(() => {
    if (!showCategoryModal && !showSkipReasonModal && !showSkipDayModal) {
      modalAnimation.setValue(0);
    }
  }, [showCategoryModal, showSkipReasonModal, showSkipDayModal]);

  // Function to format date display
  const formatDate = (dateString: string): string => {
    try {
      // First check if it's a valid date
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Return as is if not a valid date
      }
      return format(parseISO(dateString), "MMM dd, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  // Add a validateDate helper function
  const validateDate = (dateString: string): boolean => {
    // Check format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      return false;
    }

    // Check if it's a valid date
    try {
      const date = new Date(dateString);
      return !isNaN(date.getTime());
    } catch (err) {
      return false;
    }
  };

  // Improve handling of possibly undefined skipDayEntries in getSkipDayEntryByReason
  const getSkipDayEntryByReasonSafely = (
    reason: string
  ): SkipDayEntry | undefined => {
    const entry = getSkipDayEntryByReason(reason);
    console.log(`Looking for entry with reason '${reason}':`, entry);
    return entry;
  };

  // Update the handleOpenSkipDayModal function
  const handleOpenSkipDayModal = (reason: string | null = null) => {
    // Initialize selectedDates to empty array first
    setSelectedDates([]);

    // Reset date input fields
    setCurrentDateInput("");
    setCurrentDateNote("");

    if (reason) {
      const entry = getSkipDayEntryByReasonSafely(reason);
      if (entry) {
        // Edit existing entry
        console.log("Opening modal to edit entry:", entry);
        setEditingSkipDay(entry);
        setSelectedReason(entry.reason);

        // Make sure dates is an array before setting it
        const dates = entry.dates || [];
        console.log(
          "Setting selected dates from entry:",
          JSON.stringify(dates)
        );
        setSelectedDates(dates);

        setSkipDayNote(entry.generalNote || "");
      } else {
        // Create a new entry for this reason
        console.log("Opening modal to create new entry for reason:", reason);
        setEditingSkipDay(null);
        setSelectedReason(reason);
        setSelectedDates([]); // Initialize with empty array
        setSkipDayNote("");
      }
    } else {
      // New entry with no pre-selected reason
      console.log("Opening modal for new entry with no pre-selected reason");
      setEditingSkipDay(null);
      setSelectedReason("");
      setSelectedDates([]); // Initialize with empty array
      setSkipDayNote("");
    }
    showModalWithAnimation(setShowSkipDayModal);
  };

  // Function to remove a date from the selected dates
  const handleRemoveDate = (index: number) => {
    // Create a copy of selected dates
    const updatedDates = [...selectedDates];

    // Store the date for confirmation message
    const removedDate = updatedDates[index];

    // Remove the date
    updatedDates.splice(index, 1);

    // Update state
    setSelectedDates(updatedDates);

    // Show confirmation
    Alert.alert(
      "Date Removed",
      `Date ${formatDate(removedDate.date)} removed successfully`
    );
  };

  // Update the handleAddSkipDay function for better handling with manual date entry
  const handleAddSkipDay = async () => {
    try {
      console.log("=== Adding Skip Day ===");
      console.log("Selected reason:", selectedReason);
      console.log("Selected dates count:", selectedDates.length);
      console.log("Selected dates:", JSON.stringify(selectedDates));

      // Validate reason
      if (!selectedReason) {
        Alert.alert("Error", "Please select a reason");
        return;
      }

      // Validate dates
      if (!selectedDates || selectedDates.length === 0) {
        Alert.alert("Error", "Please add at least one date");
        return;
      }

      // Check if there's any input in the date field
      if (currentDateInput && currentDateInput.trim() !== "") {
        Alert.alert(
          "Unsaved Date",
          "You have a date in the input field that hasn't been added. Do you want to add it before saving?",
          [
            {
              text: "Add Date & Save",
              onPress: async () => {
                handleAddDate();
                // Wait a moment for state to update
                setTimeout(() => saveSkipDay(), 100);
              },
            },
            {
              text: "Save Without It",
              onPress: () => saveSkipDay(),
            },
            {
              text: "Cancel",
              style: "cancel",
            },
          ]
        );
      } else {
        // No pending date input, proceed with save
        saveSkipDay();
      }
    } catch (error) {
      console.error("Error in handleAddSkipDay:", error);
      Alert.alert("Error", "Failed to save skip day entry.");
    }
  };

  // Helper function to save the skip day entry
  const saveSkipDay = async () => {
    try {
      // If editing an existing entry
      if (editingSkipDay) {
        console.log("Updating existing skip day entry:", editingSkipDay.id);
        const updatedEntry: SkipDayEntry = {
          ...editingSkipDay,
          reason: selectedReason,
          dates: [...selectedDates], // Create a new array to ensure reference is updated
          generalNote: skipDayNote.trim() || undefined,
        };
        console.log("Updated entry:", JSON.stringify(updatedEntry));
        await updateSkipDayEntry(updatedEntry);
        Alert.alert("Success", "Skip day entry updated successfully.");
      } else {
        // Add new entry or update existing one for this reason
        console.log("Creating new skip day entry for reason:", selectedReason);

        const newEntry = {
          reason: selectedReason,
          dates: [...selectedDates], // Create a new array to ensure reference is updated
          generalNote: skipDayNote.trim() || undefined,
        };

        console.log("New entry:", JSON.stringify(newEntry));
        const result = await addOrUpdateSkipDayEntry(newEntry);
        console.log("API response:", result);
        Alert.alert("Success", "Skip day entry saved successfully.");
      }

      // Reset form and close modal
      setSkipDayNote("");
      setSelectedReason("");
      setSelectedDates([]);
      setCurrentDateInput("");
      setCurrentDateNote("");
      setEditingSkipDay(null);
      setShowSkipDayModal(false);
    } catch (error) {
      console.error("Error saving skip day entry:", error);
      Alert.alert("Error", "Failed to save skip day entry.");
    }
  };

  // Add back the handleDeleteSkipDay function
  const handleDeleteSkipDay = (id: string) => {
    Alert.alert(
      "Delete Skip Day Entry",
      "Are you sure you want to delete this skip day entry?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await deleteSkipDayEntry(id);
              Alert.alert("Success", "Skip day entry deleted successfully.");
            } catch (error) {
              console.error("Error deleting skip day entry:", error);
              Alert.alert("Error", "Failed to delete skip day entry.");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  // Add handleAddDate function for manual date entry
  const handleAddDate = () => {
    // Trim input
    const dateInput = currentDateInput.trim();

    // Check if empty
    if (!dateInput) {
      Alert.alert("Empty Date", "Please enter a date");
      return;
    }

    // Validate date
    if (!validateDate(dateInput)) {
      Alert.alert(
        "Invalid Date",
        "Please enter a valid date in YYYY-MM-DD format"
      );
      return;
    }

    // Check for duplicate
    if (selectedDates.some((d) => d.date === dateInput)) {
      Alert.alert("Duplicate Date", "This date has already been added");
      return;
    }

    // Add new date
    console.log("Adding date:", dateInput);
    const newDate: SkipDayDate = {
      date: dateInput,
      note: currentDateNote.trim() || undefined,
    };

    const updatedDates = [...selectedDates, newDate];
    console.log("Updated dates:", JSON.stringify(updatedDates));
    setSelectedDates(updatedDates);

    // Clear inputs
    setCurrentDateInput("");
    setCurrentDateNote("");

    // Show confirmation
    Alert.alert("Success", `Date ${formatDate(dateInput)} added successfully`);
  };

  // Add new handler functions for clearing data and deleting account
  const handleClearAllData = () => {
    Alert.alert(
      "Clear All Data",
      "Are you sure you want to clear all your data? This will remove all your activities, settings, and preferences. This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Proceed",
          onPress: () => showPasswordConfirmation("clear"),
          style: "destructive",
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This will permanently remove all your data and account information. This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Proceed",
          onPress: () => showPasswordConfirmation("delete"),
          style: "destructive",
        },
      ]
    );
  };

  // Add function to show password confirmation modal
  const showPasswordConfirmation = (action: "clear" | "delete") => {
    setActionPending(action);
    setPassword("");
    setPasswordError("");
    showModalWithAnimation(setPasswordConfirmModal);
  };

  // Validate password and execute corresponding action
  const handlePasswordConfirm = async () => {
    // For demonstration, we're using a hardcoded password.
    // In a real app, you should verify against the user's actual password.
    const correctPassword = "password123"; // This would come from your auth system in a real app

    if (password !== correctPassword) {
      setPasswordError("Incorrect password. Please try again.");
      return;
    }

    // Password is correct, proceed with the action
    hideModalWithAnimation(setPasswordConfirmModal);
    setPassword("");

    if (actionPending === "clear") {
      doClearAllData();
    } else if (actionPending === "delete") {
      doDeleteAccount();
    }

    setActionPending(null);
  };

  // Add function to actually clear data after password confirmation
  const doClearAllData = async () => {
    try {
      // Clear AsyncStorage
      await AsyncStorage.clear();

      // Reset app state
      setSliderValue(DEFAULT_FONT_SCALE);
      setFontSizeScale(DEFAULT_FONT_SCALE);
      // Instead of using defaultContext, use empty arrays or default values
      setCategories([]);
      setSkipReasons([]);

      Alert.alert("Success", "All data has been cleared successfully.");
    } catch (error) {
      console.error("Error clearing data:", error);
      Alert.alert("Error", "Failed to clear data. Please try again.");
    }
  };

  // Add function to actually delete account after password confirmation
  const doDeleteAccount = async () => {
    try {
      // Here you would call an API to delete the account
      // For now, we'll simulate it with a delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Clear local data
      await AsyncStorage.clear();

      // Redirect to login
      logout();
      navigation.navigate("Login");

      // Show confirmation
      setTimeout(() => {
        Alert.alert(
          "Account Deleted",
          "Your account has been successfully deleted."
        );
      }, 500);
    } catch (error) {
      console.error("Error deleting account:", error);
      Alert.alert("Error", "Failed to delete account. Please try again.");
    }
  };

  // Loading state UI
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#36D1DC" />
        <StyledText style={styles.loadingText}>Loading settings...</StyledText>
      </View>
    );
  }

  // Add function to edit a priority
  const handleEditPriority = (index: number) => {
    const priority = priorityLevels[index];
    setEditingPriority({
      index,
      level: priority.level,
      name: priority.name,
      color: priority.color,
    });
    showModalWithAnimation(setShowPriorityModal);
  };

  // Add function to save priority changes
  const handleSavePriority = () => {
    if (!editingPriority) return;

    const updatedPriorities = [...priorityLevels];
    updatedPriorities[editingPriority.index] = {
      level: editingPriority.level,
      name: editingPriority.name,
      color: editingPriority.color,
    };
    setPriorityLevels(updatedPriorities);
    setEditingPriority(null);
    hideModalWithAnimation(setShowPriorityModal);
  };

  // Function to handle date selection from date picker
  const handleDatePickerChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (date) {
      setSelectedDate(date);
      // Format the date as YYYY-MM-DD
      const formattedDate = format(date, "yyyy-MM-dd");
      setCurrentDateInput(formattedDate);
    }
  };

  // Function to show the date picker
  const showDatePickerModal = () => {
    Animated.spring(modalAnimation, {
      toValue: 1,
      friction: 8,
      tension: 65,
      useNativeDriver: true,
    }).start();
    setShowDatePicker(true);
  };

  // Function to hide date picker
  const hideDatePicker = () => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowDatePicker(false);
    });
  };

  // Add function to handle adding a new priority
  const handleAddPriority = () => {
    if (!newPriority.name.trim()) {
      Alert.alert("Error", "Please enter a priority name");
      return;
    }

    const highestLevel = priorityLevels.reduce(
      (max, priority) => Math.max(max, priority.level),
      0
    );

    const updatedPriority = {
      ...newPriority,
      level: highestLevel + 1, // Automatically assign the next level
    };

    const updatedPriorities = [...priorityLevels, updatedPriority];
    setPriorityLevels(updatedPriorities);

    // Reset the new priority form
    setNewPriority({
      level: 0,
      name: "",
      color: priorityColorOptions[0],
    });

    hideModalWithAnimation(setShowPriorityModal);
    Alert.alert("Success", "Priority level added successfully");
  };

  // Add function to delete a priority
  const handleDeletePriority = (index: number) => {
    Alert.alert(
      "Delete Priority",
      "Are you sure you want to delete this priority level? Tasks with this priority may be affected.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: () => {
            const updatedPriorities = [...priorityLevels];
            updatedPriorities.splice(index, 1);
            setPriorityLevels(updatedPriorities);
            Alert.alert("Success", "Priority level deleted successfully");
          },
          style: "destructive",
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <StyledText variant="title" style={styles.headerTitle}>
          Settings
        </StyledText>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#36D1DC" />
          <StyledText variant="body" style={styles.loadingText}>
            Loading settings...
          </StyledText>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Text Size Section */}
          <View style={styles.section}>
            {/* Section Header with Expand/Collapse button */}
            <TouchableOpacity
              style={[
                styles.sectionHeader,
                expandedSections.textSize && styles.sectionHeaderActive,
              ]}
              onPress={() => toggleSection("textSize")}
              activeOpacity={0.7}
            >
              <View style={styles.sectionTitleContainer}>
                <View style={styles.sectionIconContainer}>
                  <Icon
                    name="text-outline"
                    size={20}
                    color="#fff"
                    style={styles.sectionIcon}
                  />
                </View>
                <StyledText variant="subtitle" style={styles.sectionTitle}>
                  Text Size
                </StyledText>
              </View>
              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: textSizeHeight.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "180deg"],
                      }),
                    },
                  ],
                }}
              >
                <Icon name="chevron-down" size={22} color="#999" />
              </Animated.View>
            </TouchableOpacity>

            {/* Animated section content */}
            <Animated.View
              style={{
                maxHeight: textSizeHeight.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, sectionHeights.textSize || 1000],
                }),
                opacity: textSizeHeight.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0.8, 1],
                }),
                overflow: "hidden",
              }}
            >
              <View
                style={styles.sectionContent}
                onLayout={(event) => {
                  const { height } = event.nativeEvent.layout;
                  setSectionHeights((prev) => ({ ...prev, textSize: height }));
                }}
              >
                <StyledText variant="caption" style={styles.sectionDescription}>
                  Adjust the text size throughout the app
                </StyledText>

                <View style={styles.sliderContainer}>
                  <View style={styles.sliderLabels}>
                    <StyledText variant="caption" style={styles.sliderLabel}>
                      A
                    </StyledText>
                    <StyledText
                      variant="caption"
                      style={styles.sliderValueText}
                    >
                      {getFontSizeLabel(sliderValue)} (
                      {getFontSizePercentage(sliderValue)})
                    </StyledText>
                    <StyledText
                      variant="caption"
                      style={[styles.sliderLabel, styles.sliderLabelLarge]}
                    >
                      A
                    </StyledText>
                  </View>

                  <Slider
                    style={styles.slider}
                    value={sliderValue}
                    minimumValue={MIN_FONT_SCALE}
                    maximumValue={MAX_FONT_SCALE}
                    step={0.1}
                    minimumTrackTintColor="#36D1DC"
                    maximumTrackTintColor="#2c2c2e"
                    thumbTintColor="#36D1DC"
                    onValueChange={handleSliderValueChange}
                    onSlidingComplete={handleSliderComplete}
                  />

                  <View style={styles.sliderActions}>
                    <TouchableOpacity
                      style={styles.resetButton}
                      onPress={() => {
                        setSliderValue(DEFAULT_FONT_SCALE);
                        setFontSizeScale(DEFAULT_FONT_SCALE);
                      }}
                    >
                      <StyledText style={styles.resetButtonText}>
                        Reset to Default
                      </StyledText>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Collapsible Preview Section */}
                <TouchableOpacity
                  style={styles.previewHeader}
                  onPress={() =>
                    setTextSizePreviewExpanded(!textSizePreviewExpanded)
                  }
                >
                  <StyledText
                    variant="caption"
                    style={styles.previewHeaderText}
                  >
                    Text Size Preview
                  </StyledText>
                  <Icon
                    name={
                      textSizePreviewExpanded ? "chevron-up" : "chevron-down"
                    }
                    size={20}
                    color="#999"
                  />
                </TouchableOpacity>

                {textSizePreviewExpanded && (
                  <View style={styles.textSizePreview}>
                    <View style={styles.currentScaleContainer}>
                      <StyledText
                        variant="body"
                        style={styles.currentScaleLabel}
                      >
                        Current Scale:
                      </StyledText>
                      <StyledText
                        variant="subtitle"
                        style={styles.currentScaleValue}
                      >
                        {getFontSizePercentage(sliderValue)} -{" "}
                        {getFontSizeLabel(sliderValue)}
                      </StyledText>
                    </View>

                    <StyledText variant="title" style={styles.previewTitle}>
                      Title Text
                    </StyledText>

                    <StyledText
                      variant="subtitle"
                      style={styles.previewSubtitle}
                    >
                      Subtitle Text
                    </StyledText>

                    <StyledText variant="body" style={styles.previewBody}>
                      This is how your text will appear throughout the app. The
                      font size affects all text elements, including buttons,
                      labels, and content.
                    </StyledText>

                    <StyledText variant="caption" style={styles.previewCaption}>
                      Caption text - typically used for hints and less important
                      information
                    </StyledText>
                  </View>
                )}
              </View>
            </Animated.View>
          </View>

          {/* Category Management Section */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.sectionHeader,
                expandedSections.categories && styles.sectionHeaderActive,
              ]}
              onPress={() => toggleSection("categories")}
              activeOpacity={0.7}
            >
              <View style={styles.sectionTitleContainer}>
                <View style={styles.sectionIconContainer}>
                  <Icon
                    name="list-outline"
                    size={20}
                    color="#fff"
                    style={styles.sectionIcon}
                  />
                </View>
                <StyledText variant="subtitle" style={styles.sectionTitle}>
                  Manage Categories
                </StyledText>
              </View>
              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: categoriesHeight.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "180deg"],
                      }),
                    },
                  ],
                }}
              >
                <Icon name="chevron-down" size={22} color="#999" />
              </Animated.View>
            </TouchableOpacity>

            <Animated.View
              style={{
                maxHeight: categoriesHeight.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, sectionHeights.categories || 1000],
                }),
                opacity: categoriesHeight.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0.8, 1],
                }),
                overflow: "hidden",
              }}
            >
              <View
                style={styles.sectionContent}
                onLayout={(event) => {
                  const { height } = event.nativeEvent.layout;
                  setSectionHeights((prev) => ({
                    ...prev,
                    categories: height,
                  }));
                }}
              >
                <StyledText variant="caption" style={styles.sectionDescription}>
                  Create, edit or delete activity categories
                </StyledText>

                <View style={styles.categoriesList}>
                  {categories.map((category, index) => (
                    <View key={index} style={styles.categoryItem}>
                      <View
                        style={[
                          styles.categoryBadge,
                          { backgroundColor: getCategoryColor(category) },
                        ]}
                      >
                        <Icon
                          name={getCategoryIcon(category)}
                          size={16}
                          color="#fff"
                        />
                        <StyledText
                          variant="body"
                          style={styles.categoryBadgeText}
                        >
                          {category}
                        </StyledText>
                      </View>
                      <View style={styles.categoryActions}>
                        <TouchableOpacity
                          style={styles.categoryEditButton}
                          onPress={() => {
                            setEditingCategory({ index, value: category });
                            showModalWithAnimation(setShowCategoryModal);
                          }}
                        >
                          <Icon
                            name="pencil-outline"
                            size={18}
                            color="#36D1DC"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.categoryDeleteButton}
                          onPress={() => handleDeleteCategory(index)}
                        >
                          <Icon
                            name="trash-outline"
                            size={18}
                            color="#FF4757"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => {
                    setNewCategory("");
                    setEditingCategory(null);
                    showModalWithAnimation(setShowCategoryModal);
                  }}
                >
                  <Icon name="add-circle-outline" size={18} color="#36D1DC" />
                  <StyledText style={styles.addButtonText}>
                    Add New Category
                  </StyledText>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>

          {/* Skip Day Reasons Section */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.sectionHeader,
                expandedSections.skipReasons && styles.sectionHeaderActive,
              ]}
              onPress={() => toggleSection("skipReasons")}
              activeOpacity={0.7}
            >
              <View style={styles.sectionTitleContainer}>
                <View style={styles.sectionIconContainer}>
                  <Icon
                    name="calendar-outline"
                    size={20}
                    color="#fff"
                    style={styles.sectionIcon}
                  />
                </View>
                <StyledText variant="subtitle" style={styles.sectionTitle}>
                  Skip Day Reasons
                </StyledText>
              </View>
              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: skipReasonsHeight.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "180deg"],
                      }),
                    },
                  ],
                }}
              >
                <Icon name="chevron-down" size={22} color="#999" />
              </Animated.View>
            </TouchableOpacity>

            <Animated.View
              style={{
                maxHeight: skipReasonsHeight.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, sectionHeights.skipReasons || 1000],
                }),
                opacity: skipReasonsHeight.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0.8, 1],
                }),
                overflow: "hidden",
              }}
            >
              <View
                style={styles.sectionContent}
                onLayout={(event) => {
                  const { height } = event.nativeEvent.layout;
                  setSectionHeights((prev) => ({
                    ...prev,
                    skipReasons: height,
                  }));
                }}
              >
                <StyledText variant="caption" style={styles.sectionDescription}>
                  Configure reasons for skipping scheduled activities
                </StyledText>

                <View style={styles.skipReasonsList}>
                  {skipReasons.map((reason, index) => (
                    <View key={index} style={styles.skipReasonItem}>
                      <View style={styles.skipReasonBadge}>
                        <Icon name="time-outline" size={16} color="#fff" />
                        <StyledText
                          variant="body"
                          style={styles.skipReasonText}
                        >
                          {reason}
                        </StyledText>
                      </View>
                      <View style={styles.skipReasonActions}>
                        <TouchableOpacity
                          style={styles.skipReasonEditButton}
                          onPress={() => {
                            setEditingSkipReason({ index, value: reason });
                            showModalWithAnimation(setShowSkipReasonModal);
                          }}
                        >
                          <Icon
                            name="pencil-outline"
                            size={18}
                            color="#36D1DC"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.skipReasonDeleteButton}
                          onPress={() => handleDeleteSkipReason(index)}
                        >
                          <Icon
                            name="trash-outline"
                            size={18}
                            color="#FF4757"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => {
                    setNewSkipReason("");
                    setEditingSkipReason(null);
                    showModalWithAnimation(setShowSkipReasonModal);
                  }}
                >
                  <Icon name="add-circle-outline" size={18} color="#36D1DC" />
                  <StyledText style={styles.addButtonText}>
                    Add New Skip Reason
                  </StyledText>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>

          {/* Skip Day Entries Section */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.sectionHeader,
                expandedSections.skipDays && styles.sectionHeaderActive,
              ]}
              onPress={() => toggleSection("skipDays")}
              activeOpacity={0.7}
            >
              <View style={styles.sectionTitleContainer}>
                <View style={styles.sectionIconContainer}>
                  <Icon
                    name="calendar-outline"
                    size={20}
                    color="#fff"
                    style={styles.sectionIcon}
                  />
                </View>
                <StyledText variant="subtitle" style={styles.sectionTitle}>
                  Skip Day Schedule
                </StyledText>
              </View>
              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: skipDaysHeight.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "180deg"],
                      }),
                    },
                  ],
                }}
              >
                <Icon name="chevron-down" size={22} color="#999" />
              </Animated.View>
            </TouchableOpacity>

            <Animated.View
              style={{
                maxHeight: skipDaysHeight.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, sectionHeights.skipDays || 1000],
                }),
                opacity: skipDaysHeight.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0.8, 1],
                }),
                overflow: "hidden",
              }}
            >
              <View
                style={styles.sectionContent}
                onLayout={(event) => {
                  const { height } = event.nativeEvent.layout;
                  setSectionHeights((prev) => ({ ...prev, skipDays: height }));
                }}
              >
                <StyledText variant="caption" style={styles.sectionDescription}>
                  Manage scheduled skipped days and their reasons
                </StyledText>

                <View style={styles.skipDaysList}>
                  {skipReasons.map((reason) => {
                    const entry = getSkipDayEntryByReasonSafely(reason);

                    return (
                      <View key={reason} style={styles.skipDayItem}>
                        <View style={styles.skipDayHeader}>
                          <View
                            style={[
                              styles.skipDayBadge,
                              { backgroundColor: getReasonColor(reason) },
                            ]}
                          >
                            <Icon name="time-outline" size={16} color="#fff" />
                            <StyledText
                              variant="body"
                              style={styles.skipDayReasonText}
                            >
                              {reason}
                            </StyledText>
                          </View>
                          <View style={styles.skipDayActions}>
                            <TouchableOpacity
                              style={styles.skipDayEditButton}
                              onPress={() => handleOpenSkipDayModal(reason)}
                            >
                              <Icon
                                name={entry ? "pencil-outline" : "add-outline"}
                                size={18}
                                color="#36D1DC"
                              />
                            </TouchableOpacity>
                            {entry && (
                              <TouchableOpacity
                                style={styles.skipDayDeleteButton}
                                onPress={() => handleDeleteSkipDay(entry.id)}
                              >
                                <Icon
                                  name="trash-outline"
                                  size={18}
                                  color="#FF4757"
                                />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>

                        {entry && (
                          <>
                            <View style={styles.skipDayDates}>
                              <StyledText
                                variant="caption"
                                style={styles.skipDayDatesLabel}
                              >
                                {entry.dates.length} Date
                                {entry.dates.length !== 1 ? "s" : ""} Scheduled:
                              </StyledText>
                              <View style={styles.dateChips}>
                                <FlatList
                                  data={entry.dates}
                                  renderItem={({ item }) => (
                                    <View style={styles.dateItem}>
                                      <StyledText style={styles.dateText}>
                                        {formatDate(item.date)}
                                      </StyledText>
                                      {item.note && (
                                        <StyledText style={styles.dateNoteText}>
                                          {item.note}
                                        </StyledText>
                                      )}
                                    </View>
                                  )}
                                  keyExtractor={(item) => item.date}
                                  scrollEnabled={false}
                                  nestedScrollEnabled={true}
                                />
                              </View>
                            </View>

                            {entry.generalNote && (
                              <View style={styles.skipDayNote}>
                                <StyledText
                                  variant="caption"
                                  style={styles.skipDayNoteLabel}
                                >
                                  Note:
                                </StyledText>
                                <StyledText
                                  variant="body"
                                  style={styles.skipDayNoteText}
                                >
                                  {entry.generalNote}
                                </StyledText>
                              </View>
                            )}
                          </>
                        )}

                        {!entry && (
                          <View style={styles.noScheduleContainer}>
                            <StyledText
                              variant="caption"
                              style={styles.noScheduleText}
                            >
                              No dates scheduled
                            </StyledText>
                            <TouchableOpacity
                              style={styles.scheduleButton}
                              onPress={() => handleOpenSkipDayModal(reason)}
                            >
                              <StyledText style={styles.scheduleButtonText}>
                                Schedule Dates
                              </StyledText>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Task Priorities Section */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.sectionHeader,
                expandedSections.taskPriorities && styles.sectionHeaderActive,
              ]}
              onPress={() => toggleSection("taskPriorities")}
              activeOpacity={0.7}
            >
              <View style={styles.sectionTitleContainer}>
                <View style={styles.sectionIconContainer}>
                  <Icon
                    name="flag"
                    size={20}
                    color="#fff"
                    style={styles.sectionIcon}
                  />
                </View>
                <StyledText variant="subtitle" style={styles.sectionTitle}>
                  Task Priorities
                </StyledText>
              </View>
              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: taskPrioritiesHeight.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "180deg"],
                      }),
                    },
                  ],
                }}
              >
                <Icon name="chevron-down" size={22} color="#999" />
              </Animated.View>
            </TouchableOpacity>

            <Animated.View
              style={{
                maxHeight: taskPrioritiesHeight.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, sectionHeights.taskPriorities || 1000],
                }),
                opacity: taskPrioritiesHeight.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0.8, 1],
                }),
                overflow: "hidden",
              }}
            >
              <View
                style={styles.sectionContent}
                onLayout={(event) => {
                  const { height } = event.nativeEvent.layout;
                  setSectionHeights((prev) => ({
                    ...prev,
                    taskPriorities: height,
                  }));
                }}
              >
                <StyledText variant="caption" style={styles.sectionDescription}>
                  Customize priority levels for your tasks
                </StyledText>

                <View style={styles.prioritiesList}>
                  {priorityLevels.map((priority, index) => (
                    <View key={index} style={styles.priorityItem}>
                      <View
                        style={[
                          styles.priorityBadge,
                          { backgroundColor: priority.color },
                        ]}
                      >
                        <Icon name="flag" size={16} color="#fff" />
                        <StyledText
                          variant="body"
                          style={styles.priorityBadgeText}
                        >
                          P{priority.level}: {priority.name}
                        </StyledText>
                      </View>
                      <View style={styles.priorityActions}>
                        <TouchableOpacity
                          style={styles.priorityEditButton}
                          onPress={() => handleEditPriority(index)}
                        >
                          <Icon
                            name="pencil-outline"
                            size={18}
                            color="#36D1DC"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.priorityDeleteButton}
                          onPress={() => handleDeletePriority(index)}
                        >
                          <Icon
                            name="trash-outline"
                            size={18}
                            color="#FF4757"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => {
                      setEditingPriority(null);
                      setNewPriority({
                        level:
                          priorityLevels.length > 0
                            ? Math.max(...priorityLevels.map((p) => p.level)) +
                              1
                            : 1,
                        name: "",
                        color: priorityColorOptions[0],
                      });
                      showModalWithAnimation(setShowPriorityModal);
                    }}
                  >
                    <Icon name="add-circle-outline" size={18} color="#36D1DC" />
                    <StyledText style={styles.addButtonText}>
                      Add New Priority Level
                    </StyledText>
                  </TouchableOpacity>
                </View>

                <StyledText variant="caption" style={styles.priorityInfoText}>
                  Customize the names and colors for task priority levels.
                  Priority levels are used to sort and highlight tasks.
                </StyledText>
              </View>
            </Animated.View>
          </View>

          {/* About Section */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.sectionHeader,
                expandedSections.about && styles.sectionHeaderActive,
              ]}
              onPress={() => toggleSection("about")}
              activeOpacity={0.7}
            >
              <View style={styles.sectionTitleContainer}>
                <View style={styles.sectionIconContainer}>
                  <Icon
                    name="information-circle-outline"
                    size={20}
                    color="#fff"
                    style={styles.sectionIcon}
                  />
                </View>
                <StyledText variant="subtitle" style={styles.sectionTitle}>
                  About
                </StyledText>
              </View>
              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: aboutHeight.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "180deg"],
                      }),
                    },
                  ],
                }}
              >
                <Icon name="chevron-down" size={22} color="#999" />
              </Animated.View>
            </TouchableOpacity>

            <Animated.View
              style={{
                maxHeight: aboutHeight.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, sectionHeights.about || 1000],
                }),
                opacity: aboutHeight.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0.8, 1],
                }),
                overflow: "hidden",
              }}
            >
              <View
                style={styles.sectionContent}
                onLayout={(event) => {
                  const { height } = event.nativeEvent.layout;
                  setSectionHeights((prev) => ({ ...prev, about: height }));
                }}
              >
                <View style={styles.infoItem}>
                  <Icon
                    name="information-circle-outline"
                    size={20}
                    color="#36D1DC"
                  />
                  <StyledText style={styles.infoText}>
                    TimeTracker Version 1.0.0
                  </StyledText>
                </View>

                <View style={styles.infoItem}>
                  <Icon name="code-slash-outline" size={20} color="#36D1DC" />
                  <StyledText style={styles.infoText}>
                    Copyright © 2023 TimeTracker App
                  </StyledText>
                </View>

                <View style={styles.logoutButtonContainer}>
                  <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={["#FF4757", "#FF6B81"]}
                      style={styles.logoutButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Icon name="log-out-outline" size={20} color="#fff" />
                      <StyledText style={styles.logoutButtonText}>
                        Logout
                      </StyledText>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                <View style={styles.dangerZoneContainer}>
                  <StyledText variant="subtitle" style={styles.dangerZoneTitle}>
                    Danger Zone
                  </StyledText>

                  <TouchableOpacity
                    style={styles.clearDataButton}
                    onPress={handleClearAllData}
                  >
                    <Icon name="trash-outline" size={20} color="#FF9500" />
                    <StyledText style={styles.dangerButtonText}>
                      Clear All Data
                    </StyledText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteAccountButton}
                    onPress={handleDeleteAccount}
                  >
                    <Icon
                      name="alert-circle-outline"
                      size={20}
                      color="#FF4757"
                    />
                    <StyledText style={styles.dangerButtonText}>
                      Delete Account
                    </StyledText>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      )}

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => hideModalWithAnimation(setShowCategoryModal)}
      >
        <TouchableWithoutFeedback
          onPress={() => hideModalWithAnimation(setShowCategoryModal)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <Animated.View
                style={[
                  styles.modalContainer,
                  {
                    transform: [
                      {
                        scale: modalAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.9, 1],
                        }),
                      },
                    ],
                    opacity: modalAnimation,
                  },
                ]}
              >
                <View style={styles.modalContent}>
                  <StyledText variant="subtitle" style={styles.modalTitle}>
                    {editingCategory ? "Edit Category" : "Add New Category"}
                  </StyledText>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter category name"
                    placeholderTextColor="#666"
                    value={
                      editingCategory ? editingCategory.value : newCategory
                    }
                    onChangeText={(text) =>
                      editingCategory
                        ? setEditingCategory({
                            ...editingCategory,
                            value: text,
                          })
                        : setNewCategory(text)
                    }
                    autoCapitalize="none"
                  />
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.modalCancelButton}
                      onPress={() =>
                        hideModalWithAnimation(setShowCategoryModal)
                      }
                    >
                      <StyledText style={styles.modalCancelButtonText}>
                        Cancel
                      </StyledText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.modalSaveButton,
                        Boolean(
                          (!editingCategory && newCategory.trim() === "") ||
                            (editingCategory &&
                              editingCategory.value.trim() === "")
                        )
                          ? styles.modalSaveButtonDisabled
                          : undefined,
                      ]}
                      onPress={
                        editingCategory ? handleEditCategory : handleAddCategory
                      }
                      disabled={Boolean(
                        (!editingCategory && newCategory.trim() === "") ||
                          (editingCategory &&
                            editingCategory.value.trim() === "")
                      )}
                    >
                      <StyledText style={styles.modalSaveButtonText}>
                        {editingCategory ? "Update" : "Add"}
                      </StyledText>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Skip Reason Modal */}
      <Modal
        visible={showSkipReasonModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => hideModalWithAnimation(setShowSkipReasonModal)}
      >
        <TouchableWithoutFeedback
          onPress={() => hideModalWithAnimation(setShowSkipReasonModal)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <Animated.View
                style={[
                  styles.modalContainer,
                  {
                    transform: [
                      {
                        scale: modalAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.9, 1],
                        }),
                      },
                    ],
                    opacity: modalAnimation,
                  },
                ]}
              >
                <View style={styles.modalContent}>
                  <StyledText variant="subtitle" style={styles.modalTitle}>
                    {editingSkipReason
                      ? "Edit Skip Reason"
                      : "Add New Skip Reason"}
                  </StyledText>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter skip reason"
                    placeholderTextColor="#666"
                    value={
                      editingSkipReason
                        ? editingSkipReason.value
                        : newSkipReason
                    }
                    onChangeText={(text) =>
                      editingSkipReason
                        ? setEditingSkipReason({
                            ...editingSkipReason,
                            value: text,
                          })
                        : setNewSkipReason(text)
                    }
                    autoCapitalize="none"
                  />
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.modalCancelButton}
                      onPress={() =>
                        hideModalWithAnimation(setShowSkipReasonModal)
                      }
                    >
                      <StyledText style={styles.modalCancelButtonText}>
                        Cancel
                      </StyledText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.modalSaveButton,
                        Boolean(
                          (!editingSkipReason && newSkipReason.trim() === "") ||
                            (editingSkipReason &&
                              editingSkipReason.value.trim() === "")
                        )
                          ? styles.modalSaveButtonDisabled
                          : undefined,
                      ]}
                      onPress={
                        editingSkipReason
                          ? handleEditSkipReason
                          : handleAddSkipReason
                      }
                      disabled={Boolean(
                        (!editingSkipReason && newSkipReason.trim() === "") ||
                          (editingSkipReason &&
                            editingSkipReason.value.trim() === "")
                      )}
                    >
                      <StyledText style={styles.modalSaveButtonText}>
                        {editingSkipReason ? "Update" : "Add"}
                      </StyledText>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Priority Modal */}
      <Modal
        visible={showPriorityModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => hideModalWithAnimation(setShowPriorityModal)}
      >
        <TouchableWithoutFeedback
          onPress={() => hideModalWithAnimation(setShowPriorityModal)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <Animated.View
                style={[
                  styles.modalContainer,
                  {
                    transform: [
                      {
                        scale: modalAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.9, 1],
                        }),
                      },
                    ],
                    opacity: modalAnimation,
                  },
                ]}
              >
                <View style={styles.modalContent}>
                  <StyledText variant="subtitle" style={styles.modalTitle}>
                    {editingPriority
                      ? "Edit Priority Level"
                      : "Add New Priority Level"}
                  </StyledText>

                  {/* Priority Name */}
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Enter priority name"
                    placeholderTextColor="#666"
                    value={
                      editingPriority ? editingPriority.name : newPriority.name
                    }
                    onChangeText={(text) =>
                      editingPriority
                        ? setEditingPriority({
                            ...editingPriority,
                            name: text,
                          })
                        : setNewPriority({
                            ...newPriority,
                            name: text,
                          })
                    }
                    autoCapitalize="none"
                  />

                  {/* Color Selection */}
                  <StyledText
                    variant="caption"
                    style={{ color: "#999", marginBottom: 8 }}
                  >
                    Select a color:
                  </StyledText>
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      marginBottom: 16,
                    }}
                  >
                    {priorityColorOptions.map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: color,
                          margin: 5,
                          borderWidth: 2,
                          borderColor:
                            (editingPriority
                              ? editingPriority.color
                              : newPriority.color) === color
                              ? "#fff"
                              : "transparent",
                        }}
                        onPress={() =>
                          editingPriority
                            ? setEditingPriority({
                                ...editingPriority,
                                color,
                              })
                            : setNewPriority({
                                ...newPriority,
                                color,
                              })
                        }
                      />
                    ))}
                  </View>

                  {/* Preview */}
                  <View
                    style={{
                      backgroundColor: editingPriority
                        ? editingPriority.color
                        : newPriority.color,
                      padding: 12,
                      borderRadius: 8,
                      marginBottom: 20,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Icon name="flag" size={20} color="#fff" />
                    <StyledText
                      style={{
                        color: "#fff",
                        marginLeft: 10,
                        fontWeight: "bold",
                      }}
                    >
                      {editingPriority
                        ? `P${editingPriority.level}: ${editingPriority.name}`
                        : `New: ${newPriority.name || "Priority Name"}`}
                    </StyledText>
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.modalCancelButton}
                      onPress={() =>
                        hideModalWithAnimation(setShowPriorityModal)
                      }
                    >
                      <StyledText style={styles.modalCancelButtonText}>
                        Cancel
                      </StyledText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.modalSaveButton,
                        Boolean(
                          (!editingPriority && !newPriority.name.trim()) ||
                            (editingPriority && !editingPriority.name.trim())
                        )
                          ? styles.modalSaveButtonDisabled
                          : undefined,
                      ]}
                      onPress={
                        editingPriority ? handleSavePriority : handleAddPriority
                      }
                      disabled={Boolean(
                        (!editingPriority && !newPriority.name.trim()) ||
                          (editingPriority && !editingPriority.name.trim())
                      )}
                    >
                      <StyledText style={styles.modalSaveButtonText}>
                        {editingPriority ? "Update" : "Add"}
                      </StyledText>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Skip Day Modal */}
      <Modal
        visible={showSkipDayModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => hideModalWithAnimation(setShowSkipDayModal)}
      >
        <TouchableWithoutFeedback
          onPress={() => hideModalWithAnimation(setShowSkipDayModal)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <Animated.View
                style={[
                  styles.modalContainer,
                  {
                    width: "90%",
                    maxHeight: "80%",
                    transform: [
                      {
                        scale: modalAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.9, 1],
                        }),
                      },
                    ],
                    opacity: modalAnimation,
                  },
                ]}
              >
                <ScrollView>
                  <View style={styles.modalContent}>
                    <StyledText variant="subtitle" style={styles.modalTitle}>
                      {editingSkipDay
                        ? "Edit Skip Day Entry"
                        : "Add Skip Day Entry"}
                    </StyledText>

                    {/* Reason Selection */}
                    <View style={{ marginBottom: 16 }}>
                      <StyledText
                        variant="caption"
                        style={{ color: "#999", marginBottom: 8 }}
                      >
                        Skip Reason:
                      </StyledText>
                      <View
                        style={{
                          backgroundColor: "#2C2C2E",
                          borderRadius: 8,
                          padding: 12,
                        }}
                      >
                        <StyledText style={{ color: "#fff" }}>
                          {selectedReason}
                        </StyledText>
                      </View>
                    </View>

                    {/* Date Input */}
                    <View style={{ marginBottom: 16 }}>
                      <StyledText
                        variant="caption"
                        style={{ color: "#999", marginBottom: 8 }}
                      >
                        Add Date (YYYY-MM-DD):
                      </StyledText>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <TextInput
                          style={[
                            styles.modalInput,
                            { flex: 1, marginBottom: 0 },
                          ]}
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor="#666"
                          value={currentDateInput}
                          onChangeText={setCurrentDateInput}
                          keyboardType="default"
                        />
                        <TouchableOpacity
                          style={{
                            padding: 10,
                            backgroundColor: "rgba(54, 209, 220, 0.1)",
                            borderRadius: 8,
                            marginLeft: 8,
                          }}
                          onPress={showDatePickerModal}
                        >
                          <Icon name="calendar" size={24} color="#36D1DC" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Date Note */}
                    <View style={{ marginBottom: 16 }}>
                      <StyledText
                        variant="caption"
                        style={{ color: "#999", marginBottom: 8 }}
                      >
                        Note for this date (optional):
                      </StyledText>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="Enter note for this date"
                        placeholderTextColor="#666"
                        value={currentDateNote}
                        onChangeText={setCurrentDateNote}
                        multiline={true}
                        numberOfLines={2}
                      />
                    </View>

                    {/* Add Date Button */}
                    <TouchableOpacity
                      style={{
                        backgroundColor: "rgba(54, 209, 220, 0.1)",
                        padding: 12,
                        borderRadius: 8,
                        alignItems: "center",
                        marginBottom: 16,
                        borderWidth: 1,
                        borderColor: "rgba(54, 209, 220, 0.3)",
                      }}
                      onPress={handleAddDate}
                    >
                      <StyledText style={{ color: "#36D1DC" }}>
                        + Add This Date
                      </StyledText>
                    </TouchableOpacity>

                    {/* Selected Dates List */}
                    {selectedDates.length > 0 && (
                      <View style={{ marginBottom: 16 }}>
                        <StyledText
                          variant="caption"
                          style={{ color: "#999", marginBottom: 8 }}
                        >
                          Selected Dates:
                        </StyledText>
                        {selectedDates.map((date, index) => (
                          <View
                            key={date.date}
                            style={{
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "center",
                              backgroundColor: "rgba(44, 44, 46, 0.5)",
                              padding: 12,
                              borderRadius: 8,
                              marginBottom: 8,
                            }}
                          >
                            <View>
                              <StyledText style={{ color: "#fff" }}>
                                {formatDate(date.date)}
                              </StyledText>
                              {date.note && (
                                <StyledText
                                  style={{
                                    color: "#999",
                                    fontSize: 12,
                                    marginTop: 4,
                                  }}
                                >
                                  {date.note}
                                </StyledText>
                              )}
                            </View>
                            <TouchableOpacity
                              style={{
                                padding: 8,
                                backgroundColor: "rgba(255, 71, 87, 0.1)",
                                borderRadius: 8,
                              }}
                              onPress={() => handleRemoveDate(index)}
                            >
                              <Icon
                                name="trash-outline"
                                size={18}
                                color="#FF4757"
                              />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* General Note */}
                    <View style={{ marginBottom: 20 }}>
                      <StyledText
                        variant="caption"
                        style={{ color: "#999", marginBottom: 8 }}
                      >
                        General Note (optional):
                      </StyledText>
                      <TextInput
                        style={[styles.modalInput, { height: 80 }]}
                        placeholder="Enter a general note"
                        placeholderTextColor="#666"
                        value={skipDayNote}
                        onChangeText={setSkipDayNote}
                        multiline={true}
                        numberOfLines={4}
                      />
                    </View>

                    <View style={styles.modalActions}>
                      <TouchableOpacity
                        style={styles.modalCancelButton}
                        onPress={() =>
                          hideModalWithAnimation(setShowSkipDayModal)
                        }
                      >
                        <StyledText style={styles.modalCancelButtonText}>
                          Cancel
                        </StyledText>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.modalSaveButton,
                          !selectedReason || selectedDates.length === 0
                            ? styles.modalSaveButtonDisabled
                            : undefined,
                        ]}
                        onPress={handleAddSkipDay}
                        disabled={!selectedReason || selectedDates.length === 0}
                      >
                        <StyledText style={styles.modalSaveButtonText}>
                          {editingSkipDay ? "Update" : "Save"}
                        </StyledText>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Date Picker */}
      {showDatePicker && (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="none"
          onRequestClose={() => hideDatePicker()}
        >
          <TouchableWithoutFeedback onPress={() => hideDatePicker()}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <Animated.View
                  style={[
                    styles.modalContainer,
                    {
                      transform: [
                        {
                          scale: modalAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.9, 1],
                          }),
                        },
                      ],
                      opacity: modalAnimation,
                    },
                  ]}
                >
                  <View style={styles.modalContent}>
                    <StyledText variant="subtitle" style={styles.modalTitle}>
                      Select Date
                    </StyledText>
                    <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={handleDatePickerChange}
                      textColor="#fff"
                      style={{
                        backgroundColor:
                          Platform.OS === "ios" ? "#2C2C2E" : "transparent",
                      }}
                    />
                    {Platform.OS === "ios" && (
                      <TouchableOpacity
                        style={{
                          backgroundColor: "#36D1DC",
                          padding: 12,
                          borderRadius: 8,
                          alignItems: "center",
                          marginTop: 12,
                        }}
                        onPress={() => hideDatePicker()}
                      >
                        <StyledText
                          style={{ color: "#fff", fontWeight: "600" }}
                        >
                          Confirm
                        </StyledText>
                      </TouchableOpacity>
                    )}
                  </View>
                </Animated.View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {/* Password Confirmation Modal */}
      <Modal
        visible={passwordConfirmModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => hideModalWithAnimation(setPasswordConfirmModal)}
      >
        <TouchableWithoutFeedback
          onPress={() => hideModalWithAnimation(setPasswordConfirmModal)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <Animated.View
                style={[
                  styles.modalContainer,
                  {
                    transform: [
                      {
                        scale: modalAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.9, 1],
                        }),
                      },
                    ],
                    opacity: modalAnimation,
                  },
                ]}
              >
                <View style={styles.modalContent}>
                  <StyledText variant="subtitle" style={styles.modalTitle}>
                    Confirm Password
                  </StyledText>
                  <StyledText
                    variant="caption"
                    style={styles.passwordDescription}
                  >
                    Please enter your password to confirm this action
                  </StyledText>
                  <TextInput
                    style={[
                      styles.modalInput,
                      passwordError ? styles.inputError : undefined,
                    ]}
                    placeholder="Enter your password"
                    placeholderTextColor="#666"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={true}
                  />
                  {passwordError ? (
                    <StyledText variant="caption" style={styles.errorText}>
                      {passwordError}
                    </StyledText>
                  ) : null}
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.modalCancelButton}
                      onPress={() =>
                        hideModalWithAnimation(setPasswordConfirmModal)
                      }
                    >
                      <StyledText style={styles.modalCancelButtonText}>
                        Cancel
                      </StyledText>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.modalSaveButton,
                        styles.modalDeleteButton,
                        !password.trim()
                          ? styles.modalSaveButtonDisabled
                          : undefined,
                      ]}
                      onPress={handlePasswordConfirm}
                      disabled={!password.trim()}
                    >
                      <StyledText style={styles.modalSaveButtonText}>
                        Confirm
                      </StyledText>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

// Function to get an icon name for a category
const getCategoryIcon = (category: string): string => {
  switch (category.toLowerCase()) {
    case "personal":
      return "person-outline";
    case "work":
      return "briefcase-outline";
    case "workout":
      return "fitness-outline";
    case "education":
      return "book-outline";
    case "entertainment":
      return "game-controller-outline";
    default:
      return "list-outline";
  }
};

// Function to get a color for a category
const getCategoryColor = (category: string): string => {
  switch (category.toLowerCase()) {
    case "personal":
      return "#5B86E5";
    case "work":
      return "#FF5722";
    case "workout":
      return "#753a88";
    case "education":
      return "#00BCD4";
    case "entertainment":
      return "#9C27B0";
    default:
      return "#607D8B";
  }
};

// Function to get a color for a skip reason
const getReasonColor = (reason: string): string => {
  switch (reason.toLowerCase()) {
    case "sick":
      return "#FF5722";
    case "vacation":
      return "#4CAF50";
    case "holiday":
      return "#2196F3";
    case "personal day":
      return "#9C27B0";
    case "emergency":
      return "#F44336";
    default:
      return "#607D8B";
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: "#1E1E1E",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 8,
  },
  backButton: {
    marginRight: 10,
    padding: 5,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  scrollContent: {
    paddingVertical: 8,
    paddingBottom: 40,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: "#1E1E1E",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  sectionHeaderActive: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(54, 209, 220, 0.3)",
    backgroundColor: "rgba(54, 209, 220, 0.05)",
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#36D1DC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#36D1DC",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionIcon: {
    color: "#fff",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  sectionContent: {
    padding: 16,
  },
  sectionDescription: {
    color: "#8E8E93",
    marginBottom: 16,
    lineHeight: 20,
  },
  sliderContainer: {
    backgroundColor: "rgba(44, 44, 46, 0.5)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sliderLabel: {
    color: "#999",
    fontSize: 16,
  },
  sliderLabelLarge: {
    fontSize: 24,
  },
  sliderValueText: {
    color: "#36D1DC",
    fontWeight: "600",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderActions: {
    alignItems: "center",
    marginTop: 15,
  },
  resetButton: {
    backgroundColor: "rgba(54, 209, 220, 0.15)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(54, 209, 220, 0.3)",
  },
  resetButtonText: {
    color: "#36D1DC",
    fontSize: 14,
    fontWeight: "500",
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(44, 44, 46, 0.5)",
    padding: 12,
    borderRadius: 8,
  },
  previewHeaderText: {
    color: "#9E9E9E",
  },
  textSizePreview: {
    marginTop: 12,
    backgroundColor: "#2C2C2E",
    borderRadius: 12,
    padding: 16,
  },
  currentScaleContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },
  currentScaleLabel: {
    color: "#999",
    marginRight: 8,
  },
  currentScaleValue: {
    color: "#36D1DC",
    fontWeight: "bold",
  },
  previewTitle: {
    color: "#fff",
    marginBottom: 10,
    fontWeight: "bold",
  },
  previewSubtitle: {
    color: "#ddd",
    marginBottom: 10,
  },
  previewBody: {
    color: "#bbb",
    marginBottom: 10,
    lineHeight: 20,
  },
  previewCaption: {
    color: "#999",
    fontSize: 12,
  },
  categoriesList: {
    marginBottom: 8,
  },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "rgba(44, 44, 46, 0.5)",
    borderRadius: 12,
    padding: 12,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  categoryBadgeText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "500",
  },
  categoryActions: {
    flexDirection: "row",
  },
  categoryEditButton: {
    padding: 8,
    marginRight: 5,
    borderRadius: 8,
    backgroundColor: "rgba(54, 209, 220, 0.1)",
  },
  categoryDeleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 71, 87, 0.1)",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(54, 209, 220, 0.05)",
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(54, 209, 220, 0.3)",
    borderStyle: "dashed",
  },
  addButtonText: {
    color: "#36D1DC",
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 8,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: "rgba(44, 44, 46, 0.5)",
    marginBottom: 10,
    borderRadius: 10,
  },
  infoText: {
    color: "#fff",
    marginLeft: 15,
  },
  logoutButtonContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  logoutButton: {
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#FF4757",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  logoutButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
  priorityInfoText: {
    color: "#8E8E93",
    margin: 10,
    fontSize: 12,
  },
  dangerZoneContainer: {
    padding: 16,
    backgroundColor: "rgba(255, 71, 87, 0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 71, 87, 0.2)",
  },
  dangerZoneTitle: {
    color: "#FF4757",
    marginBottom: 15,
    fontWeight: "600",
  },
  clearDataButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 149, 0, 0.2)",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  deleteAccountButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 71, 87, 0.2)",
    padding: 15,
    borderRadius: 8,
  },
  dangerButtonText: {
    color: "#fff",
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#ddd",
    marginTop: 20,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalContent: {
    padding: 20,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
    textAlign: "center",
  },
  modalInput: {
    backgroundColor: "#2C2C2E",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    fontSize: 16,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  modalCancelButton: {
    flex: 1,
    padding: 12,
    backgroundColor: "#2C2C2E",
    borderRadius: 8,
    marginRight: 8,
    alignItems: "center",
  },
  modalCancelButtonText: {
    color: "#999",
    fontWeight: "600",
  },
  modalSaveButton: {
    flex: 1,
    padding: 12,
    backgroundColor: "#36D1DC",
    borderRadius: 8,
    alignItems: "center",
  },
  modalSaveButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  modalSaveButtonDisabled: {
    backgroundColor: "rgba(54, 209, 220, 0.3)",
  },
  modalDeleteButton: {
    backgroundColor: "#FF4757",
  },
  inputError: {
    borderWidth: 1,
    borderColor: "#FF4757",
  },
  errorText: {
    color: "#FF4757",
    marginTop: -10,
    marginBottom: 16,
  },
  passwordDescription: {
    color: "#999",
    marginBottom: 20,
    textAlign: "center",
  },

  // Skip days styles
  skipDaysList: {
    marginBottom: 10,
  },
  skipDayItem: {
    backgroundColor: "rgba(44, 44, 46, 0.5)",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
  },
  skipDayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  skipDayBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5856D6",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  skipDayReasonText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "600",
  },
  skipDayActions: {
    flexDirection: "row",
  },
  skipDayEditButton: {
    padding: 8,
    marginRight: 5,
    borderRadius: 8,
    backgroundColor: "rgba(54, 209, 220, 0.1)",
  },
  skipDayDeleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 71, 87, 0.1)",
  },

  // Add missing style properties
  skipDayDates: {
    padding: 8,
    paddingTop: 0,
  },
  skipDayDatesLabel: {
    color: "#8E8E93",
    marginBottom: 8,
  },
  dateChips: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dateItem: {
    backgroundColor: "rgba(54, 209, 220, 0.1)",
    borderRadius: 8,
    padding: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  dateText: {
    color: "#fff",
    fontSize: 14,
  },
  dateNoteText: {
    color: "#8E8E93",
    fontSize: 12,
    marginTop: 2,
  },
  skipDayNote: {
    padding: 8,
    paddingTop: 0,
    marginBottom: 8,
  },
  skipDayNoteLabel: {
    color: "#8E8E93",
    marginBottom: 4,
  },
  skipDayNoteText: {
    color: "#fff",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    padding: 8,
    borderRadius: 8,
  },
  noScheduleContainer: {
    padding: 12,
    alignItems: "center",
  },
  noScheduleText: {
    color: "#8E8E93",
    marginBottom: 8,
  },
  scheduleButton: {
    backgroundColor: "rgba(54, 209, 220, 0.1)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(54, 209, 220, 0.3)",
  },
  scheduleButtonText: {
    color: "#36D1DC",
    fontWeight: "500",
  },

  // Priority styles
  prioritiesList: {
    marginBottom: 8,
  },
  priorityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "rgba(44, 44, 46, 0.5)",
    borderRadius: 12,
    padding: 12,
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  priorityBadgeText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "500",
  },
  priorityActions: {
    flexDirection: "row",
  },
  priorityEditButton: {
    padding: 8,
    marginRight: 5,
    borderRadius: 8,
    backgroundColor: "rgba(54, 209, 220, 0.1)",
  },
  priorityDeleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 71, 87, 0.1)",
  },

  // Skip reasons styles
  skipReasonsList: {
    marginBottom: 8,
  },
  skipReasonItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "rgba(44, 44, 46, 0.5)",
    borderRadius: 12,
    padding: 12,
  },
  skipReasonBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#5856D6",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  skipReasonText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "500",
  },
  skipReasonActions: {
    flexDirection: "row",
  },
  skipReasonEditButton: {
    padding: 8,
    marginRight: 5,
    borderRadius: 8,
    backgroundColor: "rgba(54, 209, 220, 0.1)",
  },
  skipReasonDeleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 71, 87, 0.1)",
  },

  // Empty state styles
  emptyState: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "rgba(44, 44, 46, 0.3)",
    borderRadius: 8,
    marginBottom: 10,
  },
  emptyStateText: {
    color: "#999",
    marginTop: 12,
  },
});

export default SettingsScreen;
